
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
  
  // Log the "API call" with environment variables for debugging
  console.log('📡 Mock Nexi API Call:', {
    alias: Deno.env.get('NEXI_ALIAS') || 'test_alias',
    env: Deno.env.get('NEXI_ENV') || 'test',
    order: {
      id: order.id,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length
    },
    generatedRedirectUrl: redirectUrl
  });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    redirectUrl,
    sessionId
  };
};

serve(async (req) => {
  console.log('🚀 Edge Function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('🔑 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Supabase credentials'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header check:', {
      present: !!authHeader,
      length: authHeader?.length || 0
    });
    
    if (!authHeader) {
      console.error('❌ Authorization header missing');
      return new Response(
        JSON.stringify({ 
          error: 'Authorization required',
          details: 'Missing authorization header'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: userError?.message || 'Invalid token'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', {
      userId: user.id,
      email: user.email
    });

    // Parse request body (optional for this endpoint)
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.log('ℹ️ No JSON body or empty body, continuing...');
    }

    console.log('📨 Request body:', requestBody);

    // Get active order for user - SAFEGUARD: Only select orders, never delete products
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
        JSON.stringify({ 
          error: 'Failed to fetch order',
          details: orderError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📦 Order query result:', {
      found: !!order,
      orderId: order?.id,
      status: order?.status,
      total: order?.skupna_cena
    });

    if (!order) {
      console.error('❌ No active order found');
      return new Response(
        JSON.stringify({ 
          error: 'No active order found',
          details: 'Please create an order first'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse artikli safely
    let artikliArray = [];
    try {
      if (typeof order.artikli === 'string') {
        artikliArray = JSON.parse(order.artikli);
      } else if (Array.isArray(order.artikli)) {
        artikliArray = order.artikli;
      } else {
        artikliArray = [];
      }
      console.log('✅ Artikli parsed:', {
        type: typeof order.artikli,
        count: artikliArray.length,
        sample: artikliArray[0] || null
      });
    } catch (parseError) {
      console.error('❌ Error parsing artikli:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid order data',
          details: 'Order items could not be parsed'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!artikliArray || artikliArray.length === 0) {
      console.error('❌ Order has no items');
      return new Response(
        JSON.stringify({ 
          error: 'Order has no items',
          details: 'Cannot process payment for empty order'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate order total
    if (!order.skupna_cena || order.skupna_cena <= 0) {
      console.error('❌ Invalid order total:', order.skupna_cena);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid order total',
          details: `Order total is ${order.skupna_cena}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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

    console.log('📄 Payment order prepared:', paymentOrder);

    // Create mock Nexi payment session
    const paymentSession = await createMockNexiSession(paymentOrder);

    console.log('🎯 Payment session created:', paymentSession);

    // Validate payment session response
    if (!paymentSession || !paymentSession.redirectUrl) {
      console.error('❌ Payment session creation failed - no redirect URL');
      return new Response(
        JSON.stringify({ 
          error: 'Payment session creation failed',
          details: 'No redirect URL generated'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store session info in order - SAFEGUARD: Only update orders
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

    const response = {
      redirectUrl: paymentSession.redirectUrl,
      sessionId: paymentSession.sessionId,
      success: true
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
    console.error('💥 Unexpected error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
