import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        <Badge variant="destructive" className="text-xs font-medium">
          Ni na zalogi
        </Badge>
      );
    }
    
    switch (product.status) {
      case 'novo':
        return (
          <Badge className="bg-black text-white text-xs font-medium">
            Novo
          </Badge>
        );
      case 'znizano':
        return (
          <Badge className="bg-red-500 text-white text-xs font-medium">
            -{product.popust}%
          </Badge>
        );
      case 'prodano':
        return (
          <Badge variant="destructive" className="text-xs font-medium">
            Prodano
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

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
  };

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Link to={productLink} aria-label={`Poglej podrobnosti za ${getLocalizedName()}`}>
            <img
              src={displayImage}
              alt={getLocalizedName()}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur rounded-full p-2">
                <Eye className="h-5 w-5 text-gray-800" />
              </div>
            </div>
          </Link>
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            {getStatusBadge()}
          </div>
          
          {/* Multiple Images Indicator */}
          {hasMultipleImages && (
            <div className="absolute top-2 right-12 bg-black/70 text-white text-xs px-2 py-1 rounded-full" aria-label={`${product.slike_urls!.length} slik`}>
              +{product.slike_urls!.length - 1}
            </div>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
            aria-label={inWishlist ? `Odstrani ${getLocalizedName()} iz priljubljenih` : `Dodaj ${getLocalizedName()} med priljubljene`}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
        </div>

        <CardContent className="flex-1 p-3 sm:p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight text-sm sm:text-base">
              <Link to={productLink} className="hover:text-primary transition-colors">
                {getLocalizedName()}
              </Link>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">Koda: {product.koda}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {product.popust && product.popust > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg font-bold text-primary">
                    €{getFinalPrice().toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                      €{product.cena.toFixed(2)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -{product.popust}%
                    </Badge>
                  </div>
                </div>
              ) : (
                <span className="text-base sm:text-lg font-bold text-primary">
                  €{product.cena.toFixed(2)}
                </span>
              )}
              <p className="text-xs text-gray-500">DDV vključen</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
            <span className={product.zaloga > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.zaloga > 0 ? `${t('products.inStock')} (${product.zaloga})` : t('products.outOfStock')}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-3 sm:p-4 pt-0">
          <div className="w-full space-y-2">
            <Button 
              onClick={handleAddToCart}
              disabled={!product.na_voljo || product.zaloga === 0}
              className="w-full h-10 text-sm"
              aria-label={`Dodaj ${getLocalizedName()} v košarico`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('products.addToCart')}</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(productLink)}
              className="w-full h-10 text-sm"
              aria-label={`Poglej podrobnosti za ${getLocalizedName()}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('products.details')}</span>
              <span className="sm:hidden">Več</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
