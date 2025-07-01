
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ColorVariant {
  id: string;
  color_name: string;
  color_value?: string;
  images: string[];
  stock: number;
  available: boolean;
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

  const availableVariants = variants.filter(v => v.available && v.stock > 0);

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
                <div className="flex items-center gap-2">
                  {variant.color_value && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: variant.color_value }}
                    />
                  )}
                  <span className="capitalize">{variant.color_name}</span>
                  <Badge variant="outline" className="ml-2">
                    {variant.stock} kos
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
            className="flex items-center gap-2 px-3 py-2"
            disabled={!variant.available || variant.stock === 0}
          >
            {variant.color_value && (
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: variant.color_value }}
              />
            )}
            <span className="capitalize">{variant.color_name}</span>
            <Badge variant="secondary" className="ml-1">
              {variant.stock}
            </Badge>
          </Button>
        ))}
      </div>
      {selectedVariant && (
        <p className="text-sm text-gray-600">
          Izbrana: <span className="font-medium capitalize">{selectedVariant.color_name}</span>
          {selectedVariant.stock > 0 && (
            <span className="ml-2 text-green-600">Na zalogi: {selectedVariant.stock} kos</span>
          )}
        </p>
      )}
    </div>
  );
};
