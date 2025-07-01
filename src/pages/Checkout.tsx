
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Checkout() {
  const { t } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naslov_dostave: '',
    telefon_kontakt: '',
    opombe: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('errors.unauthorized'),
        description: 'Prijavite se za oddajo naročila',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.naslov_dostave || !formData.telefon_kontakt) {
      toast({
        title: t('errors.invalidData'),
        description: 'Izpolnite vsa obvezna polja',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const artikli = items.map(item => ({
        id: item.id,
        naziv: item.naziv,
        koda: item.koda,
        cena: item.cena,
        popust: item.popust,
        quantity: item.quantity,
        final_price: item.cena * (1 - item.popust / 100),
      }));

      const { data, error } = await supabase
        .from('narocila')
        .insert({
          uporabnik_id: user.id,
          artikli: artikli,
          skupna_cena: getTotalPrice(),
          status: 'oddano',
          naslov_dostave: formData.naslov_dostave,
          telefon_kontakt: formData.telefon_kontakt,
          opombe: formData.opombe || null,
        })
        .select()
        .single();

      if (error) throw error;

      clearCart();

      toast({
        title: t('checkout.orderSuccess'),
        description: `Številka naročila: ${data.id.slice(0, 8)}`,
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t('errors.general'),
        description: 'Prišlo je do napake pri oddaji naročila',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFinalPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-8"
          >
            <h1 className="text-4xl font-bold text-gray-900">{t('checkout.title')}</h1>
            <p className="text-xl text-gray-600">
              Košarica je prazna. Dodajte izdelke pred oddajo naročila.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/products">
                Pojdite na izdelke
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-12 text-gray-900"
        >
          {t('checkout.title')}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Podatki za dostavo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="naslov_dostave" className="text-lg font-semibold text-gray-900">
                      {t('checkout.deliveryAddress')} *
                    </Label>
                    <Input
                      id="naslov_dostave"
                      name="naslov_dostave"
                      value={formData.naslov_dostave}
                      onChange={handleInputChange}
                      placeholder="Vnesite polni naslov za dostavo"
                      required
                      className="h-12 rounded-xl border-2 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefon_kontakt" className="text-lg font-semibold text-gray-900">
                      {t('checkout.phoneNumber')} *
                    </Label>
                    <Input
                      id="telefon_kontakt"
                      name="telefon_kontakt"
                      type="tel"
                      value={formData.telefon_kontakt}
                      onChange={handleInputChange}
                      placeholder="Vaša telefonska številka"
                      required
                      className="h-12 rounded-xl border-2 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opombe" className="text-lg font-semibold text-gray-900">
                      {t('checkout.notes')}
                    </Label>
                    <Textarea
                      id="opombe"
                      name="opombe"
                      value={formData.opombe}
                      onChange={handleInputChange}
                      placeholder="Dodatne opombe za dostavo (neobvezno)"
                      rows={4}
                      className="rounded-xl border-2 focus:border-primary resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('checkout.placeOrder')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="sticky top-4 shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Povzetek naročila
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={item.slika_url || '/placeholder.svg'}
                          alt={item.naziv}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.naziv}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity}x €{getFinalPrice(item.cena, item.popust).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          €{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Skupaj</span>
                    <span className="font-semibold text-gray-900">€{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Dostava</span>
                    <span className="text-green-600 font-semibold">Brezplačno</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-2xl">
                  <span className="text-gray-900">{t('checkout.orderTotal')}</span>
                  <span className="text-primary">€{getTotalPrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
