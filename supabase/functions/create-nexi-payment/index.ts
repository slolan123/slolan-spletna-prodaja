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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order }: { order: PaymentOrder } = await req.json()
    
    console.log('🎯 Nexi payment session creation for order:', order.id)

    // Validate order data
    if (!order || !order.id || !order.total || order.total <= 0) {
      throw new Error('Invalid order data')
    }

    const NEXI_API_KEY = Deno.env.get('NEXI_API_KEY')
    if (!NEXI_API_KEY) {
      throw new Error('Nexi API key not configured')
    }

    // Prepare Nexi XPay CEE request
    const nexiPayload = {
      amount: Math.round(order.total * 100), // Convert to cents
      currency: "EUR",
      shopTransactionId: order.id,
      callbackUrl: "https://www.slolan.com/api/nexi-webhook",
      cancelUrl: "https://www.slolan.com/payment-cancel",
      returnUrl: "https://www.slolan.com/payment-success",
      language: "SI",
      addInfo1: "Order from Slolan.com",
      description: `Naročilo ${order.items.length} izdelkov`
    }

    console.log('📤 Sending request to Nexi API:', nexiPayload)

    // Call Nexi XPay CEE API
    const nexiResponse = await fetch('https://stg-ta.nexigroup.com/api/xpay/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': NEXI_API_KEY,
      },
      body: JSON.stringify(nexiPayload),
    })

    const nexiData = await nexiResponse.json()
    
    console.log('📥 Nexi API response:', nexiData)

    if (!nexiResponse.ok || !nexiData.redirectUrl) {
      console.error('❌ Nexi API error:', nexiData)
      throw new Error(nexiData.message || 'Nexi session creation failed')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store session info in order
    const updateResult = await supabase
      .from('narocila')
      .update({
        opombe: JSON.stringify({
          payment_session_id: nexiData.sessionId || nexiData.shopTransactionId,
          payment_provider: 'nexi_xpay_cee',
          nexi_checkout_url: nexiData.redirectUrl,
          session_created_at: new Date().toISOString(),
          nexi_transaction_id: nexiData.transactionId
        })
      })
      .eq('id', order.id)

    if (updateResult.error) {
      console.error('⚠️ Error updating order:', updateResult.error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: nexiData.redirectUrl,
        sessionId: nexiData.sessionId || nexiData.shopTransactionId,
        transactionId: nexiData.transactionId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Payment session creation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment session creation failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})