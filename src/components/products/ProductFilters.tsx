import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface Category {
  id: string;
  naziv: string;
  naziv_en?: string;
  naziv_de?: string;
  naziv_it?: string;
  naziv_ru?: string;
}

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  categories: Category[];
  colors: string[];
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const ProductFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedColor,
  onColorChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  categories,
  colors,
  onClearFilters,
  activeFiltersCount,
}: ProductFiltersProps) => {
  const { t, i18n } = useTranslation();

  const getLocalizedCategoryName = (category: Category) => {
    const langKey = `naziv_${i18n.language}` as keyof Category;
    return (category[langKey] as string) || category.naziv;
  };

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'novo', label: 'Novo' },
    { value: 'znizano', label: 'Znižano' },
    { value: 'prodano', label: 'Prodano' },
  ];

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('common.filter')}</h3>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFiltersCount} filtrov</Badge>
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Počisti
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`${t('common.search')} po nazivu, opisu ali kodi...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('nav.categories')}</label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Izberi kategorijo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {getLocalizedCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Izberi status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('products.color')}</label>
          <Select value={selectedColor} onValueChange={onColorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Izberi barvo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {colors.map(color => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('products.price')}</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t('products.from')}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            min="0"
            step="0.01"
          />
          <Input
            type="number"
            placeholder={t('products.to')}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};