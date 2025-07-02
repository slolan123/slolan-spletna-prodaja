
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  skupna_cena: number;
  artikli: Array<{
    naziv: string;
    quantity: number;
    final_price: number;
    cena: number;
  }>;
  status: string;
}

export default function Placilo() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveOrder();
    }
  }, [user]);

  const loadActiveOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('narocila')
        .select('*')
        .eq('uporabnik_id', user?.id)
        .eq('status', 'oddano')
        .order('datum', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setOrder(data);
      } else {
        toast({
          title: 'Ni aktivnega naročila',
          description: 'Najprej dodajte izdelke v košarico.',
          variant: 'destructive',
        });
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri nalaganju naročila.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    setProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: { orderId: order.id }
      });

      if (error) throw error;

      if (data?.redirectUrl) {
        toast({
          title: 'Preusmerjanje na plačilo',
          description: 'Preusmerjamo vas na varno plačilno stran...',
        });
        
        // Simulate redirect delay
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Napaka pri plačilu',
        description: 'Prišlo je do napake pri inicializaciji plačila.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Prijavite se za nadaljevanje</h1>
        <p className="text-muted-foreground">Za dostop do plačila se morate prijaviti.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ni aktivnega naročila</h1>
          <p className="text-xl text-gray-600 mb-8">
            Najprej morate dodati izdelke v košarico in oddati naročilo.
          </p>
          <Button onClick={() => navigate('/products')} size="lg">
            Pojdite na izdelke
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">Plačilo</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Povzetek naročila
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {order.artikli.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.naziv}</h4>
                        <p className="text-sm text-gray-600">
                          Količina: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          €{((item.final_price || item.cena) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-2xl text-gray-900">
                  <span>Skupaj</span>
                  <span className="text-primary">€{order.skupna_cena.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Način plačila
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-gray-900">
                      Varno plačilo s kartico
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Vaši podatki so zaščiteni z najnovejšo SSL enkripcijo.
                    Sprejemamo Visa, MasterCard in druge kartice.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>• Varno plačilo preko Nexi XPay</p>
                    <p>• 3D Secure zaščita</p>
                    <p>• Takojšnja potrditev plačila</p>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Pripravljamo plačilo...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Plačaj €{order.skupna_cena.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  S klikom na "Plačaj" se strinjate z našimi pogoji poslovanja
                  in ste preusmerjeni na varno plačilno stran.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
