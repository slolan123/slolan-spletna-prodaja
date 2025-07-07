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
    // Get webhook secret for signature validation
    const NEXI_WEBHOOK_SECRET = Deno.env.get('NEXI_WEBHOOK_SECRET')
    
    // If webhook secret is configured, validate signature
    if (NEXI_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-nexus-signature') || req.headers.get('x-webhook-signature')
      
      if (!signature) {
        console.warn('⚠️ No webhook signature provided')
        // Continue processing but log warning
      } else {
        // TODO: Implement proper signature validation
        // For now, just log that we received a signature
        console.log('🔐 Webhook signature received:', signature.substring(0, 10) + '...')
      }
    }

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

      // 🔥 NEW: Update inventory when payment is completed
      if (status === 'COMPLETED' || status === 'AUTHORIZED') {
        console.log('📦 Updating inventory for completed payment...')
        
        try {
          // Get order details with items
          const { data: order, error: orderError } = await supabase
            .from('narocila')
            .select('artikli, selected_variants')
            .eq('id', shopTransactionId)
            .single()

          if (orderError) {
            console.error('❌ Error fetching order for inventory update:', orderError)
          } else if (order) {
            // Parse artikli safely
            let artikliArray = []
            try {
              artikliArray = typeof order.artikli === 'string' 
                ? JSON.parse(order.artikli) 
                : Array.isArray(order.artikli) 
                ? order.artikli 
                : []
            } catch (parseError) {
              console.error('❌ Error parsing artikli for inventory update:', parseError)
              artikliArray = []
            }

            // Parse selected variants
            let selectedVariants = []
            try {
              selectedVariants = typeof order.selected_variants === 'string'
                ? JSON.parse(order.selected_variants)
                : Array.isArray(order.selected_variants)
                ? order.selected_variants
                : []
            } catch (parseError) {
              console.error('❌ Error parsing selected_variants for inventory update:', parseError)
              selectedVariants = []
            }

            console.log('📊 Inventory update data:', {
              artikliCount: artikliArray.length,
              variantsCount: selectedVariants.length,
              artikli: artikliArray.map(item => ({ id: item.id, quantity: item.quantity })),
              variants: selectedVariants.map(v => ({ product_id: v.product_id, variant_id: v.variant_id, quantity: v.quantity }))
            })

            // Update product stock for each item
            for (const item of artikliArray) {
              if (item.id && item.quantity) {
                console.log(`🔄 Updating stock for product ${item.id}: -${item.quantity}`)
                
                // Get current product stock first
                const { data: product, error: fetchError } = await supabase
                  .from('predmeti')
                  .select('zaloga')
                  .eq('id', item.id)
                  .single()

                if (fetchError) {
                  console.error(`❌ Error fetching product ${item.id} stock:`, fetchError)
                  continue
                }

                // Update main product stock
                const { error: productError } = await supabase
                  .from('predmeti')
                  .update({ 
                    zaloga: Math.max(0, (product?.zaloga || 0) - item.quantity),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', item.id)

                if (productError) {
                  console.error(`❌ Error updating product ${item.id} stock:`, productError)
                } else {
                  console.log(`✅ Product ${item.id} stock updated successfully`)
                }
              }
            }

            // Update variant stock for selected variants
            for (const variant of selectedVariants) {
              if (variant.product_id && variant.variant_id && variant.quantity) {
                console.log(`🔄 Updating variant stock for ${variant.variant_id}: -${variant.quantity}`)
                
                // Get current variant stock first
                const { data: variantData, error: fetchError } = await supabase
                  .from('product_variants')
                  .select('stock')
                  .eq('id', variant.variant_id)
                  .single()

                if (fetchError) {
                  console.error(`❌ Error fetching variant ${variant.variant_id} stock:`, fetchError)
                  continue
                }

                const { error: variantError } = await supabase
                  .from('product_variants')
                  .update({ 
                    stock: Math.max(0, (variantData?.stock || 0) - variant.quantity),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', variant.variant_id)

                if (variantError) {
                  console.error(`❌ Error updating variant ${variant.variant_id} stock:`, variantError)
                } else {
                  console.log(`✅ Variant ${variant.variant_id} stock updated successfully`)
                }
              }
            }

            console.log('✅ Inventory update completed successfully')
          }
        } catch (inventoryError) {
          console.error('💥 Error during inventory update:', inventoryError)
          // Don't fail the webhook for inventory errors, just log them
        }
      }
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
