
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
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <h1 className="text-3xl font-bold mb-4">{t('cart.title')}</h1>
          <p className="text-muted-foreground text-lg mb-8">
            {t('cart.empty')}
          </p>
          <Button asChild>
            <Link to="/products">
              Nadaljuj z nakupovanjem
            </Link>
          </Button>
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
        {t('cart.title')}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.slika_url || '/placeholder.svg'}
                      alt={item.naziv}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.naziv}</h3>
                      <p className="text-sm text-muted-foreground">
                        Koda: {item.koda}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {item.popust > 0 ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              €{item.cena.toFixed(2)}
                            </span>
                            <span className="font-bold text-primary">
                              €{getFinalPrice(item.cena, item.popust).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">
                            €{item.cena.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        €{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
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
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Povzetek naročila</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.naziv} x{item.quantity}</span>
                    <span>€{(getFinalPrice(item.cena, item.popust) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>{t('cart.total')}</span>
                <span>€{getTotalPrice().toFixed(2)}</span>
              </div>
              
              <Button className="w-full" size="lg" asChild>
                <Link to="/checkout">
                  {t('cart.checkout')}
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">
                  Nadaljuj z nakupovanjem
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
