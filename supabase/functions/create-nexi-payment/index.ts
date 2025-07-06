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
      console.error('❌ Invalid order data:', order)
      throw new Error('Invalid order data')
    }

    // Check all required environment variables
    const NEXI_API_KEY = Deno.env.get('NEXI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔐 Environment check:', {
      hasNexiKey: !!NEXI_API_KEY,
      nexiKeyLength: NEXI_API_KEY?.length,
      nexiKeyFirst10: NEXI_API_KEY?.substring(0, 10),
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY
    })
    
    if (!NEXI_API_KEY) {
      console.error('❌ Missing NEXI_API_KEY environment variable')
      throw new Error('Nexi API key not configured')
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables')
      throw new Error('Supabase configuration missing')
    }

    console.log('✅ All environment variables present')

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

    console.log('📥 Nexi API response status:', nexiResponse.status)
    
    // Get response text first to handle errors properly
    const responseText = await nexiResponse.text()
    console.log('📥 Nexi API raw response:', responseText)

    let nexiData
    try {
      nexiData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Nexi response as JSON:', parseError)
      console.error('📝 Raw response text:', responseText)
      throw new Error(`Invalid Nexi API response: ${responseText.substring(0, 100)}`)
    }
    
    console.log('📥 Nexi API parsed response:', nexiData)

    if (!nexiResponse.ok) {
      console.error('❌ Nexi API HTTP error:', {
        status: nexiResponse.status,
        statusText: nexiResponse.statusText,
        data: nexiData
      })
      throw new Error(nexiData.message || nexiData.error || `Nexi API error: ${nexiResponse.status}`)
    }

    if (!nexiData.redirectUrl) {
      console.error('❌ No redirectUrl in Nexi response:', nexiData)
      throw new Error('Missing redirectUrl in Nexi response')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    
    // Determine appropriate status code
    let statusCode = 500
    let errorMessage = 'Payment session creation failed'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Use 400 for validation errors, 500 for server errors
      if (error.message.includes('Invalid order') || 
          error.message.includes('Missing') ||
          error.message.includes('not configured')) {
        statusCode = 400
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})