
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Link to={productLink}>
            <img
              src={displayImage}
              alt={getLocalizedName()}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
            <div className="absolute top-2 right-12 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              +{product.slike_urls!.length - 1}
            </div>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 h-8 w-8 p-0 rounded-full backdrop-blur transition-all duration-300 ${
              inWishlist 
                ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
                : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
            }`}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <CardContent className="flex-1 p-4 space-y-3">
          <Link to={productLink} className="block">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-black transition-colors duration-300 leading-tight">
              {getLocalizedName()}
            </h3>
          </Link>
          
          {/* Price Section */}
          <div className="space-y-1">
            {product.popust && product.popust > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 line-through">
                    €{product.cena.toFixed(2)}
                  </span>
                  <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                    -{product.popust}%
                  </Badge>
                </div>
                <div className="text-lg font-bold text-black">
                  €{getFinalPrice().toFixed(2)}
                </div>
                {getSavings() > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    Prihranek: €{getSavings().toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-lg font-bold text-black">
                €{product.cena.toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>#{product.koda}</span>
            <span className={`font-medium ${product.zaloga > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.zaloga > 0 ? `${product.zaloga} kos` : 'Ni zaloge'}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            className="flex-1 h-10 text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Ni na zalogi' : 'V košarico'}
          </Button>
          
          <Link to={productLink}>
            <Button 
              variant="outline" 
              className="h-10 px-4 text-sm border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
            >
              Več
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
