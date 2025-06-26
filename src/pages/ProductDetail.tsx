
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Share2, Package, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ProductReviews } from '@/components/products/ProductReviews';

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
  barva?: string;
  opis?: string;
  opis_en?: string;
  opis_de?: string;
  opis_it?: string;
  opis_ru?: string;
  kategorija_id?: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    console.log('Loading product with id:', id);
    try {
      setLoading(true);
      
      let query = supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true);

      // Check if id is a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        // It's a UUID
        query = query.eq('id', id);
      } else {
        // Treat as SEO slug
        query = query.eq('seo_slug', id);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        navigate('/404');
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = () => {
    if (!product) return '';
    const langKey = `naziv_${i18n.language}` as keyof Product;
    return (product[langKey] as string) || product.naziv;
  };

  const getLocalizedDescription = () => {
    if (!product) return '';
    const langKey = `opis_${i18n.language}` as keyof Product;
    return (product[langKey] as string) || product.opis || '';
  };

  const getFinalPrice = () => {
    if (!product) return 0;
    if (product.popust && product.popust > 0) {
      return product.cena * (1 - product.popust / 100);
    }
    return product.cena;
  };

  const getStatusBadge = () => {
    if (!product) return null;
    
    if (!product.na_voljo || product.zaloga === 0) {
      return <Badge variant="destructive">Ni na zalogi</Badge>;
    }
    
    switch (product.status) {
      case 'novo':
        return <Badge variant="default">Novo</Badge>;
      case 'znizano':
        return <Badge variant="secondary">-{product.popust}%</Badge>;
      case 'prodano':
        return <Badge variant="destructive">Prodano</Badge>;
      default:
        return null;
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: "Dodano v košarico",
        description: `${getLocalizedName()} je bil dodan v košarico.`,
      });
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product.id);
      const inWishlist = isInWishlist(product.id);
      toast({
        title: inWishlist ? "Dodano v wishlist" : "Odstranjeno iz wishlist",
        description: `${getLocalizedName()} ${inWishlist ? 'dodan v' : 'odstranjen iz'} wishlist.`,
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: getLocalizedName(),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Povezava kopirana",
        description: "Povezava do izdelka je bila kopirana v odložišče.",
      });
    }
  };

  // Get all product images
  const images = React.useMemo(() => {
    if (product?.slike_urls && product.slike_urls.length > 0) {
      return product.slike_urls;
    } else if (product?.slika_url) {
      return [product.slika_url];
    }
    return ['/placeholder.svg'];
  }, [product]);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const isOutOfStock = !product?.na_voljo || product?.zaloga === 0;
  const inWishlist = product ? isInWishlist(product.id) : false;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Izdelek ni najden</h1>
        <Button onClick={() => navigate('/products')}>Nazaj na izdelke</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Nazaj
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <motion.div 
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img
              src={images[selectedImage]}
              alt={getLocalizedName()}
              className="w-full h-full object-cover"
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={previousImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded">
                  {selectedImage + 1} / {images.length}
                </div>
              </>
            )}
          </motion.div>
          
          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${getLocalizedName()} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{getLocalizedName()}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              {getStatusBadge()}
              <span className="text-muted-foreground">Koda: {product.koda}</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {product.popust && product.popust > 0 ? (
                <>
                  <span className="text-2xl text-muted-foreground line-through">
                    €{product.cena.toFixed(2)}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    €{getFinalPrice().toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  €{product.cena.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Zaloga: {product.zaloga} kos{product.zaloga !== 1 ? 'ov' : ''}
                </span>
              </div>
              {product.barva && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: product.barva.toLowerCase() }}
                  />
                  <span className="text-sm">Barva: {product.barva}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Brezplačna dostava nad €50</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {getLocalizedDescription() && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Opis</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {getLocalizedDescription()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? 'Ni na zalogi' : 'Dodaj v košarico'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleWishlist}
              className={inWishlist ? 'text-red-500 border-red-500' : ''}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <div className="container mx-auto px-4 py-8">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
