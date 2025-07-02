
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🎣 Nexi Webhook called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight for webhook');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔑 Webhook environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials for webhook');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          received: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook body
    let body;
    try {
      const bodyText = await req.text();
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      console.error('❌ Error parsing webhook body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON body',
          received: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('📨 Nexi Webhook Received:', body);
    
    // Process webhook - SAFEGUARD: Only update orders, never delete products
    if (body.status === 'success' && body.sessionId) {
      console.log('✅ Processing successful payment webhook');
      
      // Find order by session ID and update status
      const { data: orders, error: selectError } = await supabaseClient
        .from('narocila')
        .select('*')
        .like('opombe', `%${body.sessionId}%`);
      
      if (selectError) {
        console.error('❌ Error finding order:', selectError);
      } else if (orders && orders.length > 0) {
        const order = orders[0];
        console.log('📦 Found order to update:', order.id);
        
        // Parse existing opombe safely
        let existingNotes = {};
        try {
          existingNotes = order.opombe ? JSON.parse(order.opombe) : {};
        } catch (parseError) {
          console.error('⚠️ Error parsing existing opombe:', parseError);
          existingNotes = {};
        }
        
        // SAFEGUARD: Only update order status, never touch product data
        const { error: updateError } = await supabaseClient
          .from('narocila')
          .update({ 
            status: 'potrjeno',
            opombe: JSON.stringify({
              ...existingNotes,
              payment_confirmed: true,
              transaction_id: body.transactionId || `txn_${Date.now()}`,
              webhook_received_at: new Date().toISOString()
            })
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error('❌ Error updating order:', updateError);
        } else {
          console.log(`✅ Order ${order.id} marked as paid`);
        }
      } else {
        console.log('⚠️ No order found for session ID:', body.sessionId);
      }
    } else {
      console.log('ℹ️ Webhook received but not processing (status not success or missing sessionId)');
    }

    return new Response(
      JSON.stringify({ 
        received: true,
        processed: body.status === 'success' && body.sessionId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Webhook processing error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        received: false,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
