
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
  console.log('🎯 Creating mock Nexi session for order:', order.id);
  
  const sessionId = `mock_session_${Date.now()}`;
  const redirectUrl = `/payment-success?session=${sessionId}&order=${order.id}`;
  
  // Log the "API call" with environment variables
  console.log('📡 Mock Nexi API Call:', {
    alias: Deno.env.get('NEXI_ALIAS') || 'MISSING_ALIAS',
    env: Deno.env.get('NEXI_ENV') || 'MISSING_ENV',
    order: order,
    successUrl: Deno.env.get('NEXI_SUCCESS_URL') || 'MISSING_SUCCESS_URL',
    cancelUrl: Deno.env.get('NEXI_CANCEL_URL') || 'MISSING_CANCEL_URL',
    callbackUrl: Deno.env.get('NEXI_CALLBACK_URL') || 'MISSING_CALLBACK_URL',
    generatedRedirectUrl: redirectUrl
  });
  
  return {
    redirectUrl,
    sessionId
  };
};

serve(async (req) => {
  console.log('🚀 Edge Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Starting payment session creation...');
    
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('🔑 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Authorization header missing');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get or create active order for user - SAFEGUARD: Only select orders, never delete products
    console.log('🔍 Fetching active order for user:', user.id);
    
    const { data: order, error: orderError } = await supabaseClient
      .from('narocila')
      .select('*')
      .eq('uporabnik_id', user.id)
      .eq('status', 'oddano')
      .order('datum', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error('❌ Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📦 Order found:', !!order, order?.id);

    if (!order) {
      console.error('❌ No active order found');
      return new Response(
        JSON.stringify({ error: 'No active order found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse artikli safely
    let artikliArray = [];
    try {
      console.log('📋 Parsing artikli, type:', typeof order.artikli);
      
      if (typeof order.artikli === 'string') {
        artikliArray = JSON.parse(order.artikli);
      } else if (Array.isArray(order.artikli)) {
        artikliArray = order.artikli;
      } else {
        artikliArray = [];
      }
      
      console.log('✅ Artikli parsed, count:', artikliArray.length);
    } catch (parseError) {
      console.error('❌ Error parsing artikli:', parseError);
      artikliArray = [];
    }

    if (!artikliArray || artikliArray.length === 0) {
      console.error('❌ Order has no items');
      return new Response(
        JSON.stringify({ error: 'Order has no items' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate order data
    if (!order.skupna_cena || order.skupna_cena <= 0) {
      console.error('❌ Invalid order total:', order.skupna_cena);
      return new Response(
        JSON.stringify({ error: 'Invalid order total' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('💰 Order total validated:', order.skupna_cena);

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

    console.log('📄 Payment order prepared:', {
      id: paymentOrder.id,
      total: paymentOrder.total,
      itemCount: paymentOrder.items.length
    });

    // Create mock Nexi payment session - always returns valid redirectUrl
    const paymentSession = await createMockNexiSession(paymentOrder);

    console.log('🎯 Payment session created:', paymentSession);

    // Validate the payment session response
    if (!paymentSession || !paymentSession.redirectUrl) {
      console.error('❌ Payment session creation failed - no redirect URL');
      return new Response(
        JSON.stringify({ error: 'Payment session creation failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store session info in order for later verification - SAFEGUARD: Only update orders
    console.log('💾 Storing session info in order...');
    
    const { error: updateError } = await supabaseClient
      .from('narocila')
      .update({ 
        opombe: JSON.stringify({ 
          payment_session_id: paymentSession.sessionId,
          payment_provider: 'nexi_mock',
          session_created_at: new Date().toISOString()
        })
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('⚠️ Error updating order (non-critical):', updateError);
      // Continue anyway, as payment session was created successfully
    } else {
      console.log('✅ Order updated with session info');
    }

    console.log('🎉 Payment session created successfully, returning response');

    // Always return a valid response with redirectUrl
    const response = {
      redirectUrl: paymentSession.redirectUrl,
      sessionId: paymentSession.sessionId
    };
    
    console.log('📤 Final response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in payment session creation:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    // Always return a valid JSON response, even on unexpected errors
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
