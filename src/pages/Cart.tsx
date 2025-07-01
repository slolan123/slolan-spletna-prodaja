
import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

export default function Cart() {
  const { t } = useTranslation();
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();

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
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1 5h11M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm10 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{t('cart.title')}</h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              {t('cart.empty')}
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/products">
                {t('cart.continueShopping')}
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
          {t('cart.title')}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <img
                          src={item.slika_url || '/placeholder.svg'}
                          alt={item.naziv}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-xl text-gray-900">{item.naziv}</h3>
                        <p className="text-sm text-gray-600">
                          Koda: <span className="font-medium">{item.koda}</span>
                        </p>
                        
                        <div className="flex items-center gap-3">
                          {item.popust > 0 ? (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                €{item.cena.toFixed(2)}
                              </span>
                              <span className="font-bold text-xl text-primary">
                                €{getFinalPrice(item.cena, item.popust).toFixed(2)}
                              </span>
                              <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full font-semibold">
                                -{item.popust}%
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-xl text-gray-900">
                              €{item.cena.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="rounded-full w-10 h-10 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-12 text-center font-bold text-lg">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-full w-10 h-10 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="font-bold text-xl text-gray-900">
                          €{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-10 h-10 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-4 shadow-xl border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Povzetek naročila
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.naziv} x{item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        €{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Dostava</span>
                    <span className="text-green-600 font-semibold">Brezplačno</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-2xl text-gray-900">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">€{getTotalPrice().toFixed(2)}</span>
                </div>
                
                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" size="lg" asChild>
                  <Link to="/checkout">
                    {t('cart.checkout')}
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full h-12 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 font-semibold" asChild>
                  <Link to="/products">
                    {t('cart.continueShopping')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
