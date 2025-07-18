import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ColorVariant {
  id: string;
  color_name: string;
  color_value?: string;
  images: string[];
  stock: number;
  available: boolean;
  is_base?: boolean;
}

interface ColorVariantSelectorProps {
  variants: ColorVariant[];
  selectedVariant?: ColorVariant;
  onVariantSelect: (variant: ColorVariant) => void;
  displayMode?: 'dropdown' | 'buttons';
}

export const ColorVariantSelector = ({ 
  variants, 
  selectedVariant, 
  onVariantSelect,
  displayMode = 'buttons'
}: ColorVariantSelectorProps) => {
  if (!variants || variants.length === 0) return null;

  const availableVariants = variants.filter(v => v.available);

  if (displayMode === 'dropdown') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Barva</label>
        <Select 
          value={selectedVariant?.id || ''} 
          onValueChange={(value) => {
            const variant = variants.find(v => v.id === value);
            if (variant) onVariantSelect(variant);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Izberite barvo" />
          </SelectTrigger>
          <SelectContent>
            {availableVariants.map((variant) => (
              <SelectItem key={variant.id} value={variant.id}>
                <div className="flex items-center gap-3">
                  {variant.color_value && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: variant.color_value }}
                    />
                  )}
                  <span className="capitalize font-medium flex items-center gap-1">
                    {variant.color_name}
                    {(variant as any).is_base && (
                      <Star className="h-3 w-3 text-yellow-500" />
                    )}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {variant.stock}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">Barva</label>
      <div className="flex flex-wrap gap-2">
        {availableVariants.map((variant) => (
          <Button
            key={variant.id}
            variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onVariantSelect(variant)}
            className={`flex items-center gap-2 px-3 py-2 h-auto ${
              selectedVariant?.id === variant.id 
                ? 'bg-black text-white border-black' 
                : 'border-gray-300 hover:border-black hover:bg-gray-50'
            }`}
            disabled={!variant.available || variant.stock === 0}
          >
            {variant.color_value && (
              <div 
                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: variant.color_value }}
              />
            )}
            <span className="capitalize font-medium flex items-center gap-1">
              {variant.color_name}
              {(variant as any).is_base && (
                <Star className="h-3 w-3 text-yellow-500" />
              )}
            </span>
            <Badge 
              variant="secondary" 
              className="ml-1 text-xs bg-gray-100 text-gray-700"
            >
              {variant.stock}
            </Badge>
          </Button>
        ))}
      </div>
      {selectedVariant && (
        <p className="text-sm text-gray-600">
          Izbrana: <span className="font-medium capitalize">{selectedVariant.color_name}</span>
          {(selectedVariant as any).is_base && (
            <Star className="h-3 w-3 text-yellow-500 inline ml-1" />
          )}
          {selectedVariant.stock > 0 && (
            <span className="ml-2 text-green-600">Na zalogi: {selectedVariant.stock} kos</span>
          )}
        </p>
      )}
    </div>
  );
};
