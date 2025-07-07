import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getPaymentProvider } from '@/services/paymentService';
import { Download } from 'lucide-react';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  useEffect(() => {
    if (user) {
      processPaymentSuccess();
    }
  }, [user]);

  const downloadInvoice = async () => {
    if (!currentOrderId || !session) return;

    try {
      const response = await supabase.functions.invoke('generate-invoice', {
        body: null,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Open the invoice in a new tab for printing/saving as PDF
      const invoiceUrl = `https://vkftjzirlmhsyvtodxzxa.supabase.co/functions/v1/generate-invoice?orderId=${currentOrderId}`;
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.location.href = invoiceUrl;
      }

      toast({
        title: 'Račun generiran',
        description: 'Račun se odpira v novem oknu. Lahko ga natisnete ali shranite kot PDF.',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Napaka',
        description: 'Prišlo je do napake pri generiranju računa.',
        variant: 'destructive',
      });
    }
  };

  const processPaymentSuccess = async () => {
    console.log('processPaymentSuccess zagnan');
    try {
      const sessionId = searchParams.get('session_id');
      const orderId = searchParams.get('order_id');
      
      console.log('🎉 Processing payment success:', { sessionId, orderId });

      if (!sessionId) {
        console.warn('⚠️ No session ID found in URL parameters');
        toast({
          title: 'Opozorilo',
          description: 'Manjka ID seje, vendar je plačilo uspešno.',
        });
        setProcessing(false);
        return;
      }

      // Verify payment using real Nexi provider
      const paymentProvider = getPaymentProvider();
      const verificationResult = await paymentProvider.verifyPayment(sessionId);

      console.log('🔍 Payment verification result:', verificationResult);

      if (!verificationResult.success) {
        console.error('❌ Payment verification failed:', verificationResult.error);
        toast({
          title: 'Napaka',
          description: 'Prišlo je do napake pri preverjanju plačila.',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      // Find and update the order
      let orderQuery = supabase
        .from('narocila')
        .select('*')
        .eq('uporabnik_id', user?.id);

      // If we have orderId, use it, otherwise search by session in opombe
      if (orderId) {
        orderQuery = orderQuery.eq('id', orderId);
      } else {
        orderQuery = orderQuery.like('opombe', `%${sessionId}%`);
      }

      const { data: orders, error } = await orderQuery
        .order('datum', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0) {
        const order = orders[0];
        
        // Parse existing opombe safely
        let existingNotes = {};
        try {
          existingNotes = order.opombe ? JSON.parse(order.opombe) : {};
        } catch (parseError) {
          console.error('Error parsing opombe:', parseError);
          existingNotes = {};
        }
        
        // Update order status to confirmed
        const { error: updateError } = await supabase
          .from('narocila')
          .update({ 
            status: 'potrjeno',
            opombe: JSON.stringify({
              ...existingNotes,
              payment_confirmed: true,
              payment_date: new Date().toISOString(),
              transaction_id: verificationResult.transactionId || `txn_${sessionId}_${Date.now()}`
            })
          })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // 🔥 NEW: Update inventory as backup (in case webhook fails)
        console.log('📦 Updating inventory as backup...');
        try {
          // Parse artikli safely
          let artikliArray = [];
          try {
            artikliArray = typeof order.artikli === 'string' 
              ? JSON.parse(order.artikli) 
              : Array.isArray(order.artikli) 
              ? order.artikli 
              : [];
          } catch (parseError) {
            console.error('❌ Error parsing artikli for inventory update:', parseError);
            artikliArray = [];
          }

          // Parse selected variants
          let selectedVariants = [];
          try {
            selectedVariants = typeof order.selected_variants === 'string'
              ? JSON.parse(order.selected_variants)
              : Array.isArray(order.selected_variants)
              ? order.selected_variants
              : [];
          } catch (parseError) {
            console.error('❌ Error parsing selected_variants for inventory update:', parseError);
            selectedVariants = [];
          }

          console.log('📊 Backup inventory update data:', {
            artikliCount: artikliArray.length,
            variantsCount: selectedVariants.length
          });

          // Update product stock for each item
          for (const item of artikliArray) {
            if (item.id && item.quantity) {
              console.log(`🔄 Backup updating stock for product ${item.id}: -${item.quantity}`);
              
              // Get current product stock first
              const { data: product, error: fetchError } = await supabase
                .from('predmeti')
                .select('zaloga')
                .eq('id', item.id)
                .single();

              if (fetchError) {
                console.error(`❌ Error fetching product ${item.id} stock:`, fetchError);
                continue;
              }

              // Update main product stock
              const { error: productError } = await supabase
                .from('predmeti')
                .update({ 
                  zaloga: Math.max(0, (product?.zaloga || 0) - item.quantity),
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.id);

              if (productError) {
                console.error(`❌ Error updating product ${item.id} stock:`, productError);
              } else {
                console.log(`✅ Product ${item.id} stock updated successfully`);
              }
            }
          }

          // Update variant stock for selected variants
          for (const variant of selectedVariants) {
            if (variant.product_id && variant.variant_id && variant.quantity) {
              console.log(`🔄 Backup updating variant stock for ${variant.variant_id}: -${variant.quantity}`);
              
              // Get current variant stock first
              const { data: variantData, error: fetchError } = await supabase
                .from('product_variants')
                .select('stock')
                .eq('id', variant.variant_id)
                .single();

              if (fetchError) {
                console.error(`❌ Error fetching variant ${variant.variant_id} stock:`, fetchError);
                continue;
              }

              const { error: variantError } = await supabase
                .from('product_variants')
                .update({ 
                  stock: Math.max(0, (variantData?.stock || 0) - variant.quantity),
                  updated_at: new Date().toISOString()
                })
                .eq('id', variant.variant_id);

              if (variantError) {
                console.error(`❌ Error updating variant ${variant.variant_id} stock:`, variantError);
              } else {
                console.log(`✅ Variant ${variant.variant_id} stock updated successfully`);
              }
            }
          }

          console.log('✅ Backup inventory update completed successfully');
        } catch (inventoryError) {
          console.error('💥 Error during backup inventory update:', inventoryError);
          // Don't fail the payment success for inventory errors, just log them
        }

        setOrderNumber(order.id.slice(-8));
        setCurrentOrderId(order.id);
        
        toast({
          title: 'Plačilo uspešno!',
          description: `Vaše naročilo ${order.id.slice(-8)} je bilo uspešno plačano.`,
        });
      } else {
        console.warn('No matching order found for session:', sessionId);
        toast({
          title: 'Opozorilo',
          description: 'Naročilo ni bilo najdeno, vendar je plačilo uspešno.',
        });
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast({
        title: 'Napaka',
        description: 'Prišlo je do napake pri obdelavi plačila.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prijavite se za dostop</h1>
        <p className="text-muted-foreground">Za dostop do te strani se morate prijaviti.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardContent className="p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-gray-900 mb-4"
              >
                Plačilo uspešno!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 mb-8"
              >
                Hvala za vaš nakup. Vaše naročilo je bilo uspešno plačano
                in bo kmalu obdelano.
              </motion.p>

              {orderNumber && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-50 rounded-2xl p-6 mb-8"
                >
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Številka naročila
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    #{orderNumber}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center text-gray-600 mb-6">
                  <Package className="h-5 w-5 mr-2" />
                  <span>Pošljemo vam potrdilo naročila po e-pošti</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {currentOrderId && (
                    <Button
                      onClick={downloadInvoice}
                      size="lg"
                      className="rounded-xl bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Prenesi račun (PDF)
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => navigate('/orders')}
                    size="lg"
                    className="rounded-xl"
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Moja naročila
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                  >
                    <Home className="mr-2 h-5 w-5" />
                    Domov
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
