import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      // Prepare order items
      const artikli = items.map(item => ({
        id: item.id,
        naziv: item.naziv,
        koda: item.koda,
        cena: item.cena,
        popust: item.popust,
        quantity: item.quantity,
        final_price: item.cena * (1 - item.popust / 100),
      }));

      // Create order
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

      // Clear cart
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
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <h1 className="text-3xl font-bold mb-4">{t('checkout.title')}</h1>
          <p className="text-muted-foreground">
            Košarica je prazna. Dodajte izdelke pred oddajo naročila.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        {t('checkout.title')}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Podatki za dostavo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="naslov_dostave">
                    {t('checkout.deliveryAddress')} *
                  </Label>
                  <Input
                    id="naslov_dostave"
                    name="naslov_dostave"
                    value={formData.naslov_dostave}
                    onChange={handleInputChange}
                    placeholder="Vnesite naslov za dostavo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefon_kontakt">
                    {t('checkout.phoneNumber')} *
                  </Label>
                  <Input
                    id="telefon_kontakt"
                    name="telefon_kontakt"
                    type="tel"
                    value={formData.telefon_kontakt}
                    onChange={handleInputChange}
                    placeholder="Vnesite telefonsko številko"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opombe">
                    {t('checkout.notes')}
                  </Label>
                  <Textarea
                    id="opombe"
                    name="opombe"
                    value={formData.opombe}
                    onChange={handleInputChange}
                    placeholder="Dodatne opombe za dostavo (neobvezno)"
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
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
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Povzetek naročila</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.slika_url || '/placeholder.svg'}
                      alt={item.naziv}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.naziv}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x €{getFinalPrice(item.cena, item.popust).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        €{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Skupaj</span>
                  <span>€{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dostava</span>
                  <span className="text-muted-foreground">Brezplačno</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>{t('checkout.orderTotal')}</span>
                <span>€{getTotalPrice().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}