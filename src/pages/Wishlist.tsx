import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/contexts/WishlistContext';

export default function Wishlist() {
  const { t } = useTranslation();
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          {t('nav.wishlist')}
        </motion.h1>
        
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vaš wishlist je prazen</h2>
          <p className="text-muted-foreground mb-6">
            Dodajte izdelke v wishlist in jih ponovno obiščite kadarkoli.
          </p>
          <Button asChild>
            <a href="/products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Razišči izdelke
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          {t('nav.wishlist')} ({wishlistItems.length})
        </motion.h1>
        
        <Button 
          variant="outline" 
          onClick={() => localStorage.removeItem('wishlist')}
          disabled={wishlistItems.length === 0}
        >
          Počisti wishlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((productId) => (
          <div key={productId} className="text-center p-4 border rounded">
            <p>Product ID: {productId}</p>
            <p className="text-sm text-muted-foreground">Product details loading...</p>
          </div>
        ))}
      </div>
    </div>
  );
}