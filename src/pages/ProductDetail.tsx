
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Share2, Package, Truck, ChevronLeft, ChevronRight, Star, Eye, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

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

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        query = query.eq('id', id);
      } else {
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

  const getSavings = () => {
    if (!product || !product.popust || product.popust <= 0) return 0;
    return product.cena - getFinalPrice();
  };

  const getStatusBadge = () => {
    if (!product) return null;
    
    if (!product.na_voljo || product.zaloga === 0) {
      return (
        <Badge variant="destructive" className="text-sm font-semibold px-3 py-1">
          {t('products.outOfStock')}
        </Badge>
      );
    }
    
    switch (product.status) {
      case 'novo':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-1">
            Novo
          </Badge>
        );
      case 'znizano':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1">
            -{product.popust}%
          </Badge>
        );
      case 'prodano':
        return (
          <Badge variant="destructive" className="text-sm font-semibold px-3 py-1">
            {t('products.soldProducts')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: t('cart.addedToCart'),
        description: `${getLocalizedName()} je bil dodan v košarico.`,
      });
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product.id);
      const inWishlist = isInWishlist(product.id);
      toast({
        title: inWishlist ? "Dodano med priljubljene" : "Odstranjeno iz priljubljenih",
        description: `${getLocalizedName()} ${inWishlist ? 'dodan med' : 'odstranjen iz'} priljubljene.`,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Izdelek ni najden</h1>
          <Button onClick={() => navigate('/products')} size="lg">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Nazaj na izdelke
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazaj
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product Images */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <motion.div 
              className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-2xl group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowFullImage(true)}
            >
              <img
                src={images[selectedImage]}
                alt={getLocalizedName()}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onLoad={() => setImageLoading(false)}
              />
              
              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-5 w-5" />
              </div>
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur hover:bg-white text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full w-12 h-12 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      previousImage();
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur hover:bg-white text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full w-12 h-12 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white text-sm px-3 py-1 rounded-full font-medium">
                    {selectedImage + 1} / {images.length}
                  </div>
                </>
              )}
            </motion.div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === index 
                        ? 'border-primary ring-4 ring-primary/20 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={image}
                      alt={`${getLocalizedName()} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  {getStatusBadge()}
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    {getLocalizedName()}
                  </h1>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full w-12 h-12 p-0 hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              
              <p className="text-gray-600 font-medium">
                Koda: <span className="text-gray-900">{product.koda}</span>
              </p>
            </div>

            {/* Price Section */}
            <motion.div 
              className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                {product.popust && product.popust > 0 ? (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl text-gray-500 line-through font-medium">
                        €{product.cena.toFixed(2)}
                      </span>
                      <Badge className="bg-red-500 text-white font-bold px-3 py-1">
                        -{product.popust}%
                      </Badge>
                    </div>
                    <div className="text-4xl lg:text-5xl font-bold text-primary">
                      €{getFinalPrice().toFixed(2)}
                    </div>
                    <p className="text-green-600 font-semibold">
                      Prihranite €{getSavings().toFixed(2)}
                    </p>
                  </>
                ) : (
                  <div className="text-4xl lg:text-5xl font-bold text-primary">
                    €{product.cena.toFixed(2)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center space-y-2">
                  <Package className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-sm font-medium text-gray-900">
                    Zaloga: {product.zaloga}
                  </div>
                  <div className="text-xs text-gray-600">kosov na zalogi</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center space-y-2">
                  <Truck className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-sm font-medium text-gray-900">Dostava</div>
                  <div className="text-xs text-gray-600">Brezplačno nad €50</div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center space-y-2">
                  <Shield className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-sm font-medium text-gray-900">Garancija</div>
                  <div className="text-xs text-gray-600">2 leti</div>
                </CardContent>
              </Card>
            </div>

            {/* Color */}
            {product.barva && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Barva</h3>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: product.barva.toLowerCase() }}
                  />
                  <span className="text-gray-700 font-medium capitalize">{product.barva}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-6 w-6 mr-3" />
                  {isOutOfStock ? 'Ni na zalogi' : t('products.addToCart')}
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-12 rounded-xl border-2 transition-all duration-300 ${
                    inWishlist 
                      ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`h-5 w-5 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                  {inWishlist ? 'Odstranje iz priljubljenih' : t('products.addToWishlist')}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Product Description & Reviews */}
        <motion.div 
          className="mt-16 space-y-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Description */}
          {getLocalizedDescription() && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Opis izdelka</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                    {getLocalizedDescription()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <ProductReviews productId={product.id} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullImage(false)}
          >
            <motion.img
              src={images[selectedImage]}
              alt={getLocalizedName()}
              className="max-w-full max-h-full object-contain rounded-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
              onClick={() => setShowFullImage(false)}
            >
              ✕
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
