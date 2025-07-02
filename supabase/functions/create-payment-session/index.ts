
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentOrder {
  id: string;
  total: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

// Mock Nexi payment session creation - SAFEGUARD: No product deletion logic here
const createMockNexiSession = async (order: PaymentOrder) => {
  const sessionId = `mock_session_${Date.now()}`;
  // Always return a valid redirect URL for testing
  const redirectUrl = `/payment-success?session=${sessionId}&order=${order.id}`;
  
  // Log the "API call" with environment variables
  console.log('Mock Nexi API Call:', {
    alias: Deno.env.get('NEXI_ALIAS'),
    env: Deno.env.get('NEXI_ENV'),
    order: order,
    successUrl: Deno.env.get('NEXI_SUCCESS_URL'),
    cancelUrl: Deno.env.get('NEXI_CANCEL_URL'),
    callbackUrl: Deno.env.get('NEXI_CALLBACK_URL'),
    generatedRedirectUrl: redirectUrl
  });
  
  return {
    redirectUrl,
    sessionId
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get or create active order for user - SAFEGUARD: Only select orders, never delete products
    let { data: order, error: orderError } = await supabaseClient
      .from('narocila')
      .select('*')
      .eq('uporabnik_id', user.id)
      .eq('status', 'oddano')
      .order('datum', { ascending: false })
      .limit(1)
      .single()

    if (orderError && orderError.code !== 'PGRST116') {
      console.error('Order fetch error:', orderError);
      throw orderError
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'No active order found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse artikli safely
    let artikliArray = [];
    try {
      artikliArray = typeof order.artikli === 'string' 
        ? JSON.parse(order.artikli) 
        : Array.isArray(order.artikli) 
        ? order.artikli 
        : [];
    } catch (parseError) {
      console.error('Error parsing artikli:', parseError);
      artikliArray = [];
    }

    if (!artikliArray || artikliArray.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Order has no items' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare order data for payment
    const paymentOrder: PaymentOrder = {
      id: order.id,
      total: order.skupna_cena,
      currency: 'EUR',
      items: artikliArray.map((item: any) => ({
        name: item.naziv || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.final_price || item.cena || 0
      }))
    };

    // Create mock Nexi payment session - always returns valid redirectUrl
    const paymentSession = await createMockNexiSession(paymentOrder);

    // Store session info in order for later verification - SAFEGUARD: Only update orders
    const { error: updateError } = await supabaseClient
      .from('narocila')
      .update({ 
        opombe: JSON.stringify({ 
          payment_session_id: paymentSession.sessionId,
          payment_provider: 'nexi_mock',
          session_created_at: new Date().toISOString()
        })
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError);
      // Continue anyway, as payment session was created
    }

    console.log('Payment session created successfully:', paymentSession);

    return new Response(
      JSON.stringify(paymentSession),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Payment session creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Payment session creation failed' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
