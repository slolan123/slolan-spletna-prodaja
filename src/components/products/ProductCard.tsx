import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
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

  const getStatusBadge = () => {
    if (!product.na_voljo || product.zaloga === 0) {
      return <Badge variant="destructive">{t('products.outOfStock')}</Badge>;
    }
    
    switch (product.status) {
      case 'novo':
        return <Badge variant="default">Novo</Badge>;
      case 'znizano':
        return <Badge variant="secondary">-{product.popust}%</Badge>;
      case 'prodano':
        return <Badge variant="destructive">{t('products.soldProducts')}</Badge>;
      default:
        return null;
    }
  };

  const productLink = product.seo_slug 
    ? `/product/${product.seo_slug}` 
    : `/product/${product.id}`;

  const isOutOfStock = !product.na_voljo || product.zaloga === 0;
  const inWishlist = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="relative">
          <Link to={productLink}>
            <div className="aspect-square overflow-hidden rounded-t-lg">
              <img
                src={product.slika_url || '/placeholder.svg'}
                alt={getLocalizedName()}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="absolute top-2 left-2">
            {getStatusBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 h-8 w-8 p-0 ${
              inWishlist ? 'text-red-500' : 'text-muted-foreground'
            }`}
            onClick={() => toggleWishlist(product.id)}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <CardContent className="flex-1 p-4">
          <Link to={productLink} className="block">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
              {getLocalizedName()}
            </h3>
          </Link>
          
          <div className="flex items-center gap-2 mb-2">
            {product.popust && product.popust > 0 ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  €{product.cena.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-primary">
                  €{getFinalPrice().toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary">
                €{product.cena.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {t('products.productCode')}: {product.koda}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t('products.addToCart')}
          </Button>
          <Link to={productLink} className="flex-1">
            <Button variant="outline" className="w-full">
              {t('products.details')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};