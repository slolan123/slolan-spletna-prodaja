
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json()
    
    // Log the webhook payload for debugging
    console.log('Nexi Webhook Received:', JSON.stringify(body, null, 2));
    
    // In the future, this is where we'll:
    // 1. Verify the webhook signature
    // 2. Update order status based on payment result
    // 3. Send confirmation emails
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Mock webhook processing
    if (body.status === 'success' && body.sessionId) {
      // Find order by session ID and update status
      const { data: orders } = await supabaseClient
        .from('narocila')
        .select('*')
        .like('opombe', `%${body.sessionId}%`)
      
      if (orders && orders.length > 0) {
        const order = orders[0]
        await supabaseClient
          .from('narocila')
          .update({ 
            status: 'potrjeno',
            opombe: JSON.stringify({
              ...JSON.parse(order.opombe || '{}'),
              payment_confirmed: true,
              transaction_id: body.transactionId
            })
          })
          .eq('id', order.id)
        
        console.log(`Order ${order.id} marked as paid`)
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
