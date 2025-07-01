
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  naziv: string;
  naziv_en?: string;
  naziv_de?: string;
  naziv_it?: string;
  naziv_ru?: string;
  cena: number;
  popust?: number;
  slika_url?: string;
  slike_urls?: string[];
  status: 'novo' | 'znizano' | 'prodano';
  zaloga: number;
  na_voljo: boolean;
  koda: string;
  seo_slug?: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const getLocalizedName = () => {
    const langKey = `naziv_${i18n.language}` as keyof Product;
    return (product[langKey] as string) || product.naziv;
  };

  const getFinalPrice = () => {
    if (product.popust && product.popust > 0) {
      return product.cena * (1 - product.popust / 100);
    }
    return product.cena;
  };

  const getSavings = () => {
    if (!product.popust || product.popust <= 0) return 0;
    return product.cena - getFinalPrice();
  };

  const getStatusBadge = () => {
    if (!product.na_voljo || product.zaloga === 0) {
      return (
        <Badge variant="destructive" className="font-semibold">
          {t('products.outOfStock')}
        </Badge>
      );
    }
    
    switch (product.status) {
      case 'novo':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
            Novo
          </Badge>
        );
      case 'znizano':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">
            -{product.popust}%
          </Badge>
        );
      case 'prodano':
        return (
          <Badge variant="destructive" className="font-semibold">
            {t('products.soldProducts')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const productLink = product.seo_slug 
    ? `/product/${product.seo_slug}` 
    : `/product/${product.id}`;

  const isOutOfStock = !product.na_voljo || product.zaloga === 0;
  const inWishlist = isInWishlist(product.id);

  const displayImage = React.useMemo(() => {
    if (product.slike_urls && product.slike_urls.length > 0) {
      return product.slike_urls[0];
    }
    return product.slika_url || '/placeholder.svg';
  }, [product.slike_urls, product.slika_url]);

  const hasMultipleImages = product.slike_urls && product.slike_urls.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className="h-full group"
    >
      <Card className="h-full flex flex-col bg-white shadow-md hover:shadow-2xl transition-all duration-500 rounded-2xl border-0 overflow-hidden">
        <div className="relative overflow-hidden">
          <Link to={productLink}>
            <div className="aspect-square overflow-hidden bg-gray-50">
              <img
                src={displayImage}
                alt={getLocalizedName()}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Eye className="h-6 w-6 text-gray-900" />
                </div>
              </div>
            </div>
          </Link>
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>
          
          {/* Multiple Images Indicator */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-14 bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded-full font-medium">
              +{product.slike_urls!.length - 1}
            </div>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-3 right-3 h-10 w-10 p-0 rounded-full backdrop-blur transition-all duration-300 ${
              inWishlist 
                ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
                : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
            }`}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <CardContent className="flex-1 p-6 space-y-4">
          <Link to={productLink} className="block group">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug">
              {getLocalizedName()}
            </h3>
          </Link>
          
          {/* Price Section */}
          <div className="space-y-2">
            {product.popust && product.popust > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through font-medium">
                    €{product.cena.toFixed(2)}
                  </span>
                  <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-0.5">
                    -{product.popust}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  €{getFinalPrice().toFixed(2)}
                </div>
                <div className="text-sm text-green-600 font-semibold">
                  Prihranite €{getSavings().toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                €{product.cena.toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Koda: {product.koda}</span>
            <span className="font-medium">Zaloga: {product.zaloga}</span>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex gap-3">
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? 'Ni na zalogi' : t('products.addToCart')}
            </Button>
          </motion.div>
          
          <Link to={productLink}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                className="h-12 px-6 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 font-semibold"
              >
                {t('products.details')}
              </Button>
            </motion.div>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
