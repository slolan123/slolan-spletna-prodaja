
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Star, TrendingUp, Shield, ArrowRight, Sparkles, Package, Clock, Award } from 'lucide-react';
import { HeroAnimation } from '@/components/animations/HeroAnimation';

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

interface Category {
  id: string;
  naziv: string;
  naziv_en?: string;
  naziv_de?: string;
  naziv_it?: string;
  naziv_ru?: string;
  opis?: string;
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('kategorije')
        .select('*')
        .order('naziv')
        .limit(4); // Show only 4 categories on homepage

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getLocalizedCategoryName = (category: Category) => {
    const langKey = `naziv_${i18n.language}` as keyof Category;
    return (category[langKey] as string) || category.naziv;
  };

  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: string } = {
      'Elektronika': '📱',
      'Electronics': '📱',
      'Oblačila': '👔',
      'Clothing': '👔',
      'Nakit': '💍',
      'Jewelry': '💍',
      'Vozila': '🚗',
      'Vehicles': '🚗',
      'Oprema za dom': '🏠',
      'Home & Garden': '🏠',
      'Umetnost': '🎨',
      'Art & Collectibles': '🎨'
    };
    return icons[categoryName] || '📦';
  };

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      // Load new products (recently added)
      const { data: newData } = await supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true)
        .eq('status', 'novo')
        .order('created_at', { ascending: false })
        .limit(6);

      // Load sale products (with discount)
      const { data: saleData } = await supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true)
        .eq('status', 'znizano')
        .gt('popust', 0)
        .order('popust', { ascending: false })
        .limit(6);

      // Load featured products (mix of available products)
      const { data: featuredData } = await supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true)
        .gt('zaloga', 0)
        .order('created_at', { ascending: false })
        .limit(8);

      setNewProducts(newData || []);
      setSaleProducts(saleData || []);
      setFeaturedProducts(featuredData || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const ProductSection = ({ 
    title, 
    subtitle, 
    products, 
    viewAllLink, 
    loading 
  }: { 
    title: string; 
    subtitle: string; 
    products: Product[]; 
    viewAllLink: string;
    loading: boolean;
  }) => (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-black mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">{subtitle}</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {products.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Button asChild variant="outline" size="lg" className="border-black text-black hover:bg-black hover:text-white">
                <Link to={viewAllLink}>
                  Prikaži vse
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Trenutno ni izdelkov v tej kategoriji.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="bg-white relative min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <HeroAnimation />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Profesionalna trgovina
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
              Slolan
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Odkrijte kakovostne izdelke po konkurenčnih cenah. 
              Nakupujte pametno, varčujte več.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button size="lg" asChild className="bg-black text-white hover:bg-gray-800 group">
              <Link to="/products">
                <ShoppingBag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Začni nakupovati
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-black text-black hover:bg-black hover:text-white">
              <Link to="/categories">Kategorije</Link>
            </Button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center"
          >
            <div>
              <div className="text-2xl font-bold text-black">1000+</div>
              <div className="text-sm text-gray-600">Izdelkov</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">24/7</div>
              <div className="text-sm text-gray-600">Podpora</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">99%</div>
              <div className="text-sm text-gray-600">Zadovoljstvo</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-black mb-4">Priljubljene kategorije</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Raziskujte naš izbor kategorij in najdite točno to, kar iščete
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/products?category=${category.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        {getCategoryIcon(category.naziv)}
                      </div>
                      <h3 className="font-semibold text-black group-hover:text-gray-700 transition-colors">
                        {getLocalizedCategoryName(category)}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Products Section */}
      <ProductSection 
        title="Novi izdelki"
        subtitle="Odkrijte naše najnovejše izdelke, ki so ravno prispeli v trgovino"
        products={newProducts}
        viewAllLink="/products?status=novo"
        loading={loading}
      />

      {/* Sale Products Section */}
      <ProductSection 
        title="Akcijske ponudbe"
        subtitle="Izjemni popusti na izbrane izdelke - omejena količina!"
        products={saleProducts}
        viewAllLink="/products?status=znizano"
        loading={loading}
      />

      {/* Featured Products Section */}
      <ProductSection 
        title="Priporočeni izdelki"
        subtitle="Naš izbor kakovostnih izdelkov, ki jih priporočamo"
        products={featuredProducts}
        viewAllLink="/products"
        loading={loading}
      />

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12 text-black"
          >
            Zakaj izbrati Slolan?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Shield, 
                title: "Preverjeni izdelki", 
                desc: "Vsi naši izdelki so skrbno pregledani in preverjeni pred objavo",
                delay: 0 
              },
              { 
                icon: TrendingUp, 
                title: "Konkurenčne cene", 
                desc: "Odkrijte izjemne ponudbe z velikimi popusti na kakovostne izdelke",
                delay: 0.1 
              },
              { 
                icon: Package, 
                title: "Hitre dostave", 
                desc: "Hitra in zanesljiva dostava po vsej Sloveniji",
                delay: 0.2 
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group border border-gray-100">
                  <CardHeader>
                    <item.icon className="h-12 w-12 text-black mb-4 group-hover:scale-110 transition-transform" />
                    <CardTitle className="text-black">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">Pridružite se nam</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Registrirajte se in odkrijte naše ekskluzivne ponudbe ter popuste
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-white text-black hover:bg-gray-100">
                  <Link to="/auth?mode=register">Registracija</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="border-white text-white hover:bg-white hover:text-black">
                  <Link to="/auth">Prijava</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
