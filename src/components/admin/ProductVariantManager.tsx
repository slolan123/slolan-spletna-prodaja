
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';

interface ColorVariant {
  id?: string;
  color_name: string;
  color_value?: string;
  images: string[];
  stock: number;
  available: boolean;
}

interface ProductVariantManagerProps {
  productId: string;
  onVariantsChange?: (variants: ColorVariant[]) => void;
}

export const ProductVariantManager = ({ productId, onVariantsChange }: ProductVariantManagerProps) => {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ColorVariant | null>(null);
  const [newVariant, setNewVariant] = useState<ColorVariant>({
    color_name: '',
    color_value: '',
    images: [],
    stock: 0,
    available: true
  });

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('color_name');

      if (error) throw error;
      setVariants(data || []);
      onVariantsChange?.(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju barvnih različic.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveVariant = async (variant: ColorVariant) => {
    try {
      const variantData = {
        product_id: productId,
        color_name: variant.color_name.trim(),
        color_value: variant.color_value?.trim() || null,
        images: variant.images,
        stock: variant.stock,
        available: variant.available
      };

      if (variant.id) {
        const { error } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', variant.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert([variantData]);
        
        if (error) throw error;
      }

      await loadVariants();
      setEditingVariant(null);
      setNewVariant({
        color_name: '',
        color_value: '',
        images: [],
        stock: 0,
        available: true
      });

      toast({
        title: "Uspešno",
        description: `Barvna različica je bila ${variant.id ? 'posodobljena' : 'dodana'}.`,
      });
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri shranjevanju barvne različice.",
        variant: "destructive",
      });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to barvno različico?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
      await loadVariants();

      toast({
        title: "Uspešno",
        description: "Barvna različica je bila izbrisana.",
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri brisanju barvne različice.",
        variant: "destructive",
      });
    }
  };

  const VariantForm = ({ variant, onSave, onCancel }: {
    variant: ColorVariant;
    onSave: (variant: ColorVariant) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(variant);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {variant.id ? 'Uredi barvno različico' : 'Dodaj barvno različico'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Ime barve *</label>
              <Input
                value={formData.color_name}
                onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                placeholder="npr. Črna, Bela, Rdeča"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Barva (opcijsko)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.color_value || '#000000'}
                  onChange={(e) => setFormData({ ...formData, color_value: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <div className="text-sm text-gray-600">
                  Izberi barvo za vizualni prikaz
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Zaloga</label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Slike za to barvo</label>
            <MultiImageUpload
              value={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              maxImages={10}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => onSave(formData)}
              disabled={!formData.color_name.trim()}
              className="bg-black text-white hover:bg-gray-800"
            >
              {variant.id ? 'Posodobi' : 'Dodaj'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Prekliči
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!productId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Barvne različice</h3>
        <Button 
          onClick={() => setEditingVariant(newVariant)} 
          size="sm"
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj barvo
        </Button>
      </div>

      {editingVariant && (
        <VariantForm
          variant={editingVariant}
          onSave={(variant) => saveVariant(variant)}
          onCancel={() => setEditingVariant(null)}
        />
      )}

      <div className="grid gap-4">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {variant.color_value && (
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: variant.color_value }}
                    />
                  )}
                  <div>
                    <h4 className="font-medium capitalize">{variant.color_name}</h4>
                    <p className="text-sm text-gray-600">
                      Zaloga: {variant.stock} | Slike: {variant.images.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={variant.available ? 'default' : 'secondary'}>
                    {variant.available ? 'Aktivna' : 'Neaktivna'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingVariant(variant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteVariant(variant.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && !editingVariant && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">
              Ni dodanih barvnih različic. Dodajte prvo barvno različico za ta izdelek.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
