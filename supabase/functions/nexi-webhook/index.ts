
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const webhookData = await req.json()
    
    console.log('🔔 Nexi webhook received:', JSON.stringify(webhookData, null, 2))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract transaction details
    const shopTransactionId = webhookData.shopTransactionId
    const status = webhookData.status
    const transactionId = webhookData.transactionId

    if (shopTransactionId) {
      console.log(`🔄 Processing webhook for order: ${shopTransactionId}, status: ${status}`)

      // Update order status based on payment status
      let orderStatus = 'oddano' // default
      if (status === 'COMPLETED' || status === 'AUTHORIZED') {
        orderStatus = 'potrjeno'
      } else if (status === 'CANCELLED' || status === 'FAILED') {
        orderStatus = 'preklicano'
      }

      // Update order in database
      const { error } = await supabase
        .from('narocila')
        .update({
          status: orderStatus,
          opombe: JSON.stringify({
            payment_status: status,
            payment_transaction_id: transactionId,
            payment_webhook_received: new Date().toISOString(),
            payment_provider: 'nexi_xpay_cee'
          })
        })
        .eq('id', shopTransactionId)

      if (error) {
        console.error('❌ Error updating order:', error)
        throw error
      }

      console.log(`✅ Order ${shopTransactionId} updated with status: ${orderStatus}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
