import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
  barva?: string;
  kategorija_id?: string;
  opis?: string;
  opis_en?: string;
  opis_de?: string;
  opis_it?: string;
  opis_ru?: string;
}

interface Category {
  id: string;
  naziv: string;
  naziv_en?: string;
  naziv_de?: string;
  naziv_it?: string;
  naziv_ru?: string;
}

const PRODUCTS_PER_PAGE = 12;

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Load categories and colors on mount
  useEffect(() => {
    loadCategoriesAndColors();
  }, []);

  // Load products when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadProducts(true);
  }, [searchTerm, selectedCategory, selectedStatus, selectedColor, minPrice, maxPrice]);

  const loadCategoriesAndColors = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('kategorije')
        .select('*');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load unique colors
      const { data: colorsData, error: colorsError } = await supabase
        .from('predmeti')
        .select('barva')
        .not('barva', 'is', null);

      if (colorsError) throw colorsError;
      
      const uniqueColors = [...new Set(
        colorsData?.map(item => item.barva).filter(Boolean) || []
      )].sort();
      setColors(uniqueColors);
    } catch (error) {
      console.error('Error loading categories and colors:', error);
    }
  };

  const loadProducts = async (reset = false) => {
    try {
      setLoading(true);
      
      const currentPage = reset ? 0 : page;
      const from = currentPage * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      let query = supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true)
        .range(from, to)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`naziv.ilike.%${searchTerm}%,opis.ilike.%${searchTerm}%,koda.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('kategorija_id', selectedCategory);
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus as 'novo' | 'znizano' | 'prodano');
      }

      if (selectedColor) {
        query = query.eq('barva', selectedColor);
      }

      if (minPrice) {
        query = query.gte('cena', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('cena', parseFloat(maxPrice));
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data ? data.length === PRODUCTS_PER_PAGE : false);
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadProducts(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedColor('');
    setMinPrice('');
    setMaxPrice('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory) count++;
    if (selectedStatus) count++;
    if (selectedColor) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-4"
        >
          {t('products.title')}
        </motion.h1>
        <p className="text-muted-foreground">
          Odkrijte naš izbor kakovostnih zaseženih predmetov po odličnih cenah.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ProductFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              categories={categories}
              colors={colors}
              onClearFilters={clearFilters}
              activeFiltersCount={getActiveFiltersCount()}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {products.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Ni najdenih izdelkov z izbranimi filtri.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Počisti filtre
                  </Button>
                </div>
              )}

              {hasMore && products.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMore} 
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? t('common.loading') : t('products.showMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}