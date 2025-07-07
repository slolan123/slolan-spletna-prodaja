import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyPaymentRequest {
  sessionId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionId }: VerifyPaymentRequest = await req.json()
    
    console.log('🔍 Payment verification for session:', sessionId)

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      console.error('❌ Invalid session ID:', sessionId)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid session ID'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Check environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables')
      throw new Error('Supabase configuration missing')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // First, try to find payment session
    const { data: paymentSession, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('❌ Error fetching payment session:', sessionError)
      throw new Error('Error fetching payment session')
    }

    // If payment session exists, use it
    if (paymentSession) {
      console.log('✅ Found payment session:', paymentSession.id)
      
      const isCompleted = paymentSession.status === 'completed' || 
                         paymentSession.status === 'authorized'
      
      return new Response(
        JSON.stringify({
          success: isCompleted,
          transactionId: paymentSession.transaction_id,
          status: paymentSession.status,
          amount: paymentSession.amount,
          currency: paymentSession.currency
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Fallback: check order directly
    const { data: order, error: orderError } = await supabase
      .from('narocila')
      .select('id, status, opombe')
      .eq('id', sessionId)
      .single()

    if (orderError && orderError.code !== 'PGRST116') {
      console.error('❌ Error fetching order:', orderError)
      throw new Error('Error fetching order')
    }

    if (!order) {
      console.error('❌ Order not found:', sessionId)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      )
    }

    // Parse order notes for payment info
    let paymentInfo = null
    try {
      if (order.opombe) {
        paymentInfo = typeof order.opombe === 'string' 
          ? JSON.parse(order.opombe) 
          : order.opombe
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse order notes:', parseError)
    }

    // Determine payment status from order status
    const isCompleted = order.status === 'potrjeno' || 
                       order.status === 'poslano' || 
                       order.status === 'dostavljeno'

    const transactionId = paymentInfo?.payment_transaction_id || 
                         paymentInfo?.nexi_transaction_id || 
                         `order_${order.id}`

    console.log('✅ Payment verification completed:', {
      sessionId,
      orderStatus: order.status,
      isCompleted,
      transactionId
    })

    return new Response(
      JSON.stringify({
        success: isCompleted,
        transactionId,
        status: order.status,
        paymentInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Payment verification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Payment verification failed',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 