
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Load categories and colors on mount
  useEffect(() => {
    loadCategoriesAndColors();
  }, []);

  // Set initial filters from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status');
    const colorParam = searchParams.get('color');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');

    if (categoryParam) setSelectedCategory(categoryParam);
    if (searchParam) setSearchTerm(searchParam);
    if (statusParam) setSelectedStatus(statusParam);
    if (colorParam) setSelectedColor(colorParam);
    if (minPriceParam) setMinPrice(minPriceParam);
    if (maxPriceParam) setMaxPrice(maxPriceParam);
  }, [searchParams]);

  // Load products when filters change - reset products and start fresh
  useEffect(() => {
    console.log('Filters changed, reloading products...');
    setProducts([]); // Clear existing products
    setPage(0);
    setHasMore(true);
    loadProducts(0, true); // Load from page 0 and reset
  }, [searchTerm, selectedCategory, selectedStatus, selectedColor, minPrice, maxPrice]);

  // Update URL params when filters change (but not on initial load)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status');
    const colorParam = searchParams.get('color');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');

    // Only update URL if filters have actually changed from URL params
    const hasURLParams = categoryParam || searchParam || statusParam || colorParam || minPriceParam || maxPriceParam;
    const hasCurrentFilters = searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedColor !== 'all' || minPrice || maxPrice;
    
    if (hasCurrentFilters && !hasURLParams) {
      updateURLParams();
    }
  }, [searchTerm, selectedCategory, selectedStatus, selectedColor, minPrice, maxPrice]);

  const loadCategoriesAndColors = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('kategorije')
        .select('*');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load unique colors from available products only
      const { data: colorsData, error: colorsError } = await supabase
        .from('predmeti')
        .select('barva')
        .eq('na_voljo', true)
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

  const loadProducts = async (currentPage: number = page, reset: boolean = false) => {
    try {
      setLoading(true);
      
      const from = currentPage * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      console.log(`Loading products from ${from} to ${to}, page: ${currentPage}`);

      let query = supabase
        .from('predmeti')
        .select('*')
        .eq('na_voljo', true) // Only show available products
        .range(from, to)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`naziv.ilike.%${searchTerm}%,opis.ilike.%${searchTerm}%,koda.ilike.%${searchTerm}%`);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('kategorija_id', selectedCategory);
      }

      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as 'novo' | 'znizano' | 'prodano');
      }

      if (selectedColor && selectedColor !== 'all') {
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

      console.log(`Loaded ${data?.length || 0} products`);

      if (reset) {
        setProducts(data || []);
      } else {
        setProducts(prev => {
          // Prevent duplicates by filtering out products that already exist
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = (data || []).filter(p => !existingIds.has(p.id));
          console.log(`Adding ${newProducts.length} new products, ${prev.length} existing`);
          return [...prev, ...newProducts];
        });
      }

      setHasMore(data ? data.length === PRODUCTS_PER_PAGE : false);
      
      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      console.log('Loading more products...');
      loadProducts(page, false);
    }
  };

  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedColor !== 'all') params.set('color', selectedColor);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    
    navigate(`/products?${params.toString()}`, { replace: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedColor('all');
    setMinPrice('');
    setMaxPrice('');
    navigate('/products', { replace: true });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory && selectedCategory !== 'all') count++;
    if (selectedStatus && selectedStatus !== 'all') count++;
    if (selectedColor && selectedColor !== 'all') count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
        >
          {searchTerm ? `Rezultati iskanja za "${searchTerm}"` : t('products.title')}
        </motion.h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {searchTerm || getActiveFiltersCount() > 0 
            ? `Najdenih ${products.length} izdelkov z izbranimi filtri`
            : 'Odkrijte naš izbor kakovostnih izdelkov po odličnih cenah.'
          }
        </p>
      </div>

      {/* Active Filters and Search Results */}
      {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedColor !== 'all' || minPrice || maxPrice) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg border"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">Aktivni filtri:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-sm">
                Iskanje: "{searchTerm}"
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="text-sm">
                Kategorija: {categories.find(c => c.id === selectedCategory)?.naziv || selectedCategory}
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="secondary" className="text-sm">
                Status: {selectedStatus === 'novo' ? 'Novo' : selectedStatus === 'znizano' ? 'Znizano' : 'Prodano'}
              </Badge>
            )}
            {selectedColor !== 'all' && (
              <Badge variant="secondary" className="text-sm">
                Barva: {selectedColor}
              </Badge>
            )}
            {(minPrice || maxPrice) && (
              <Badge variant="secondary" className="text-sm">
                Cena: {minPrice || '0'}€ - {maxPrice || '∞'}€
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Najdenih {products.length} izdelkov
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              Počisti vse filtre
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 order-1">
          <div className="lg:sticky lg:top-4">
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
        <div className="lg:col-span-3 order-2">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
                    {loading ? t('common.loading') : t('common.showMore')}
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
