
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

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    if (user) {
      processPaymentSuccess();
    }
  }, [user]);

  const processPaymentSuccess = async () => {
    try {
      // Mock payment verification
      const sessionId = searchParams.get('session_id') || 'mock_session';
      
      // Find and update the order - IMPORTANT: No product deletion here, only order updates
      const { data: orders, error } = await supabase
        .from('narocila')
        .select('*')
        .eq('uporabnik_id', user?.id)
        .like('opombe', `%${sessionId}%`)
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
        
        // Update order status to confirmed - SAFEGUARD: Only update orders, never delete products
        const { error: updateError } = await supabase
          .from('narocila')
          .update({ 
            status: 'potrjeno',
            opombe: JSON.stringify({
              ...existingNotes,
              payment_confirmed: true,
              payment_date: new Date().toISOString(),
              transaction_id: `txn_${sessionId}_${Date.now()}`
            })
          })
          .eq('id', order.id);

        if (updateError) throw updateError;

        setOrderNumber(order.id.slice(0, 8));
        
        toast({
          title: 'Plačilo uspešno!',
          description: `Vaše naročilo ${order.id.slice(0, 8)} je bilo uspešno plačano.`,
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
