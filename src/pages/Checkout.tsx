import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
    customer_type: 'personal' as 'personal' | 'business',
    company_name: '',
    company_address: '',
    company_vat: '',
    company_email: '',
    payment_method: 'card' as 'card' | 'predracun',
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

    // Validate business customer fields
    if (formData.customer_type === 'business' && (!formData.company_name || !formData.company_address || !formData.company_vat || !formData.company_email)) {
      toast({
        title: t('errors.invalidData'),
        description: 'Izpolnite vsa podjetniška polja',
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
        final_price: item.cena * (1 - (item.popust || 0) / 100),
        selected_variant: item.selectedVariant ? {
          id: item.selectedVariant.id,
          color_name: item.selectedVariant.color_name,
          color_value: item.selectedVariant.color_value
        } : null
      }));

      // Prepare selected variants for the new column
      const selectedVariants = items
        .filter(item => item.selectedVariant)
        .map(item => ({
          product_id: item.id,
          variant_id: item.selectedVariant!.id,
          color_name: item.selectedVariant!.color_name,
          quantity: item.quantity
        }));

      // Prepare additional notes for proforma invoice orders
      let additionalNotes = formData.opombe || '';
      
      if (formData.customer_type === 'business' && formData.payment_method === 'predracun') {
        additionalNotes = `PLAČILO PO PREDRAČUNU - TRR: SI56 1910 0001 0297 574\n${additionalNotes}`;
      }

      const { data, error } = await supabase
        .from('narocila')
        .insert({
          uporabnik_id: user.id,
          artikli: artikli,
          skupna_cena: getTotalPrice(),
          status: 'oddano',
          naslov_dostave: formData.naslov_dostave,
          telefon_kontakt: formData.telefon_kontakt,
          opombe: additionalNotes || null,
          selected_variants: selectedVariants,
          customer_type: formData.customer_type,
          company_name: formData.customer_type === 'business' ? formData.company_name : null,
          company_address: formData.customer_type === 'business' ? formData.company_address : null,
          company_vat: formData.customer_type === 'business' ? formData.company_vat : null,
          company_email: formData.customer_type === 'business' ? formData.company_email : null,
          payment_method: formData.customer_type === 'business' ? formData.payment_method : 'card',
        })
        .select()
        .single();

      if (error) throw error;

      // 🔥 NEW: Update inventory immediately after order creation
      console.log('📦 Updating inventory after order creation...');
      try {
        // Update product stock for each item
        for (const item of artikli) {
          if (item.id && item.quantity) {
            console.log(`🔄 Updating stock for product ${item.id}: -${item.quantity}`);
            
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
            console.log(`🔄 Updating variant stock for ${variant.variant_id}: -${variant.quantity}`);
            
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

        console.log('✅ Inventory update completed successfully');
      } catch (inventoryError) {
        console.error('💥 Error during inventory update:', inventoryError);
        // Don't fail the order creation for inventory errors, just log them
      }

      clearCart();

      // Handle different payment methods
      if (formData.customer_type === 'business' && formData.payment_method === 'predracun') {
        // Show bank transfer details for proforma invoice
        toast({
          title: 'Naročilo uspešno oddano',
          description: `Podatki za nakazilo:\n\nPrejemnik: SIVAR D.O.O.\nTRR: SI56 1910 0001 0297 574\nZnesek: €${getTotalPrice().toFixed(2)}\nSklic: SI00 ${data.id.slice(-8)}\nNamen: Plačilo naročila #${data.id.slice(-8)}\nMatična: 3507939000\nDavčna: SI23998547`,
          variant: 'default',
          duration: 20000,
        });
        navigate('/orders');
        return;
      }

      toast({
        title: t('checkout.orderSuccess'),
        description: `Številka naročila: ${data.id.slice(-8)}`,
      });

      // Redirect to payment page instead of orders
      navigate('/placilo');
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

  const getItemDisplayImage = (item: any) => {
    // Use variant images if available
    if (item.selectedVariant && item.selectedVariant.images.length > 0) {
      return item.selectedVariant.images[0];
    }
    // Fallback to product images
    if (item.slike_urls && item.slike_urls.length > 0) {
      return item.slike_urls[0];
    }
    return item.slika_url || '/placeholder.svg';
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

                  {/* Business Customer Checkbox */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="business-customer"
                        checked={formData.customer_type === 'business'}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            customer_type: checked ? 'business' : 'personal',
                            // Clear business fields when unchecked
                            ...(checked ? {} : {
                              company_name: '',
                              company_address: '',
                              company_vat: '',
                              company_email: ''
                            })
                          }));
                        }}
                      />
                      <Label htmlFor="business-customer" className="text-lg font-semibold text-gray-900">
                        🏢 Kupujem kot podjetje
                      </Label>
                    </div>

                    {formData.customer_type === 'business' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 bg-blue-50 p-4 rounded-xl"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="text-sm font-semibold text-gray-900">
                            Ime podjetja *
                          </Label>
                          <Input
                            id="company_name"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            placeholder="Naziv podjetja"
                            required={formData.customer_type === 'business'}
                            className="h-11 rounded-lg border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_address" className="text-sm font-semibold text-gray-900">
                            Naslov podjetja *
                          </Label>
                          <Input
                            id="company_address"
                            name="company_address"
                            value={formData.company_address}
                            onChange={handleInputChange}
                            placeholder="Polni naslov podjetja"
                            required={formData.customer_type === 'business'}
                            className="h-11 rounded-lg border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_vat" className="text-sm font-semibold text-gray-900">
                            Davčna številka (DDV) *
                          </Label>
                          <Input
                            id="company_vat"
                            name="company_vat"
                            value={formData.company_vat}
                            onChange={handleInputChange}
                            placeholder="SI12345678"
                            required={formData.customer_type === 'business'}
                            className="h-11 rounded-lg border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_email" className="text-sm font-semibold text-gray-900">
                            E-pošta podjetja *
                          </Label>
                          <Input
                            id="company_email"
                            name="company_email"
                            type="email"
                            value={formData.company_email}
                            onChange={handleInputChange}
                            placeholder="info@podjetje.si"
                            required={formData.customer_type === 'business'}
                            className="h-11 rounded-lg border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-4">
                          <Label className="text-lg font-semibold text-gray-900">Način plačila *</Label>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="payment_method"
                                value="card"
                                checked={formData.payment_method === 'card'}
                                onChange={() => setFormData(prev => ({ ...prev, payment_method: 'card' }))}
                              />
                              Plačilo s kartico (Nexi)
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="payment_method"
                                value="predracun"
                                checked={formData.payment_method === 'predracun'}
                                onChange={() => setFormData(prev => ({ ...prev, payment_method: 'predracun' }))}
                              />
                              Plačilo po predračunu (TRR)
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
                    {loading ? t('common.loading') : 'Nadaljuj na plačilo'}
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
                    <div key={`${item.id}-${item.selectedVariant?.id || 'default'}`} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={getItemDisplayImage(item)}
                          alt={item.naziv}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.naziv}</h4>
                        {item.selectedVariant && (
                          <div className="flex items-center gap-2 mt-1">
                            {item.selectedVariant.color_value && (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.selectedVariant.color_value }}
                              />
                            )}
                            <span className="text-sm text-gray-600 capitalize">
                              {item.selectedVariant.color_name}
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">
                          {item.quantity}x €{getFinalPrice(item.cena, item.popust || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          €{(getFinalPrice(item.cena, item.popust || 0) * item.quantity).toFixed(2)}
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
                
                <p className="text-sm text-gray-600 text-center">DDV vključen</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
