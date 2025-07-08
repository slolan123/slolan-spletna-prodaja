import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, AlertCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface ColorVariant {
  id?: string;
  color_name: string;
  color_value?: string;
  images: string[];
  stock: number;
  available: boolean;
  is_base?: boolean;
}

interface ProductVariantManagerProps {
  productId: string;
  productBaseColor?: string;
  productBaseImages?: string[];
  onVariantsChange?: (variants: ColorVariant[]) => void;
}

export const ProductVariantManager = ({ 
  productId, 
  productBaseColor = '', 
  productBaseImages = [],
  onVariantsChange 
}: ProductVariantManagerProps) => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ColorVariant | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState<ColorVariant>({
    color_name: '',
    color_value: '',
    images: [],
    stock: 0,
    available: true,
    is_base: false
  });

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  // Clear errors when user changes
  useEffect(() => {
    setErrors([]);
  }, [user]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading variants for product:', productId);
      console.log('🎨 Product base color:', productBaseColor);
      console.log('🖼️ Product base images:', productBaseImages);
      
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('color_name');

      if (error) {
        console.error('❌ Load variants error:', error);
        throw error;
      }
      
      console.log('✅ Loaded variants from DB:', data);
      
      // Preveri, ali obstaja osnovna barvna različica
      let hasBaseVariant = false;
      if (data) {
        data.forEach((variant, index) => {
          console.log(`📊 Variant ${index}:`, {
            id: variant.id,
            color_name: variant.color_name,
            images: variant.images,
            imagesLength: variant.images?.length || 0,
            is_base: (variant as any).is_base
          });
          
          if ((variant as any).is_base) {
            hasBaseVariant = true;
          }
        });
      }

      // Če ni osnovne barvne različice in imamo osnovno barvo, jo ustvarimo
      if (!hasBaseVariant && productBaseColor && productBaseColor.trim()) {
        console.log('🎨 Creating base color variant from product base color');
        const baseVariant: ColorVariant = {
          color_name: productBaseColor,
          color_value: '', // Osnovna barva nima hex vrednosti
          images: productBaseImages || [],
          stock: 0,
          available: true,
          is_base: true
        };
        
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('product_variants')
            .insert([{
              product_id: productId,
              color_name: baseVariant.color_name,
              color_value: baseVariant.color_value,
              images: baseVariant.images,
              stock: baseVariant.stock,
              available: baseVariant.available,
              is_base: baseVariant.is_base
            }])
            .select();
          
          if (insertError) {
            console.error('❌ Error creating base variant:', insertError);
          } else {
            console.log('✅ Base variant created:', insertData);
            // Ponovno naloži vse različice
            const { data: reloadData, error: reloadError } = await supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', productId)
              .order('color_name');
            
            if (!reloadError) {
              // Sortiraj različice - osnovna barva prva, nato po abecedi
              const sortedVariants = reloadData?.sort((a, b) => {
                const aIsBase = (a as any).is_base || false;
                const bIsBase = (b as any).is_base || false;
                if (aIsBase && !bIsBase) return -1;
                if (!aIsBase && bIsBase) return 1;
                return a.color_name.localeCompare(b.color_name);
              }) || [];
              
              setVariants(sortedVariants);
              onVariantsChange?.(sortedVariants);
            }
          }
        } catch (error) {
          console.error('❌ Error creating base variant:', error);
        }
      } else {
        // Sortiraj različice - osnovna barva prva, nato po abecedi
        const sortedVariants = data?.sort((a, b) => {
          const aIsBase = (a as any).is_base || false;
          const bIsBase = (b as any).is_base || false;
          if (aIsBase && !bIsBase) return -1;
          if (!aIsBase && bIsBase) return 1;
          return a.color_name.localeCompare(b.color_name);
        }) || [];
        
        setVariants(sortedVariants);
        onVariantsChange?.(sortedVariants);
      }
    } catch (error) {
      console.error('❌ Error loading variants:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznana napaka';
      setErrors(prev => [...prev, `Napaka pri nalaganju barvnih različic: ${errorMessage}`]);
      toast({
        title: "Napaka",
        description: `Napaka pri nalaganju barvnih različic: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveVariant = async (variant: ColorVariant) => {
    try {
      console.log('💾 Saving variant:', variant);
      console.log('🖼️ Images to save:', variant.images);
      console.log('📊 Images length:', variant.images?.length || 0);
      
      // Validate variant data
      if (!variant.color_name.trim()) {
        throw new Error('Ime barve je obvezno');
      }
      if (variant.color_name.length > 50) {
        throw new Error('Ime barve je lahko dolgo največ 50 znakov');
      }
      if (variant.stock < 0) {
        throw new Error('Zaloga ne more biti negativna');
      }

      // Preveri, če že obstaja barva z istim imenom (razen če gre za update istega ID)
      const { data: existing, error: checkError } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .eq('color_name', variant.color_name.trim());
      if (checkError) {
        throw new Error('Napaka pri preverjanju obstoječih barv: ' + (checkError.message || '')); 
      }
      if (existing && existing.length > 0 && (!variant.id || existing[0].id !== variant.id)) {
        throw new Error('Barva z istim imenom za ta izdelek že obstaja!');
      }

      const variantData = {
        product_id: productId,
        color_name: variant.color_name.trim(),
        color_value: variant.color_value?.trim() || null,
        images: variant.images || [],
        stock: variant.stock,
        available: variant.available,
        is_base: variant.is_base || false
      };

      if (variant.id) {
        const { data: updateData, error } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', variant.id)
          .select();
        if (error) {
          let msg = error.message || 'Napaka pri posodobitvi';
          if (error.details) msg += ' | ' + error.details;
          if (error.code) msg += ' (koda: ' + error.code + ')';
          throw new Error(msg);
        }
      } else {
        const { data: insertData, error } = await supabase
          .from('product_variants')
          .insert([variantData])
          .select();
        if (error) {
          let msg = error.message || 'Napaka pri dodajanju';
          if (error.details) msg += ' | ' + error.details;
          if (error.code) msg += ' (koda: ' + error.code + ')';
          throw new Error(msg);
        }
      }

      await loadVariants();
      setEditingVariant(null);
      setNewVariant({
        color_name: '',
        color_value: '',
        images: [],
        stock: 0,
        available: true,
        is_base: false
      });

      toast({
        title: "Uspešno",
        description: `Barvna različica je bila ${variant.id ? 'posodobljena' : 'dodana'}.`,
      });
    } catch (error: any) {
      console.error('❌ Error saving variant:', error);
      let errorMessage = error?.message || 'Neznana napaka';
      if (error?.details) errorMessage += ' | ' + error.details;
      if (error?.code) errorMessage += ' (koda: ' + error.code + ')';
      setErrors(prev => [...prev, `Napaka pri shranjevanju: ${errorMessage}`]);
      toast({
        title: "Napaka",
        description: `Napaka pri shranjevanju barvne različice: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to barvno različico?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting variant:', variantId);
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
      console.error('❌ Error deleting variant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznana napaka';
      setErrors(prev => [...prev, `Napaka pri brisanju: ${errorMessage}`]);
      toast({
        title: "Napaka",
        description: "Napaka pri brisanju barvne različice.",
        variant: "destructive",
      });
    }
  };

  const startEditing = useCallback((variant: ColorVariant) => {
    console.log('✏️ Starting edit for variant:', variant);
    setEditingVariant({ ...variant });
  }, []);

  const startAdding = useCallback(() => {
    console.log('➕ Starting to add new variant');
    setEditingVariant({ ...newVariant });
  }, [newVariant]);

  const cancelEditing = useCallback(() => {
    console.log('❌ Canceling edit');
    setEditingVariant(null);
  }, []);

  const handleFormDataChange = useCallback((field: keyof ColorVariant, value: any) => {
    if (!editingVariant) return;
    
    console.log('📝 Form data change:', field, value);
    setEditingVariant(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, [editingVariant]);

  const handleImagesChange = useCallback((images: string[]) => {
    console.log('🖼️ Images change:', images);
    handleFormDataChange('images', images);
  }, [handleFormDataChange]);

  const handleSave = useCallback(() => {
    if (!editingVariant) return;
    
    console.log('💾 Handle save called with:', editingVariant);
    console.log('🖼️ Images in editingVariant:', editingVariant.images);
    
    // Validate form data
    const errors: string[] = [];
    
    if (!editingVariant.color_name.trim()) {
      errors.push('Ime barve je obvezno');
    }
    
    if (editingVariant.stock < 0) {
      errors.push('Zaloga ne more biti negativna');
    }

    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      setErrors(errors);
      return;
    }

    setErrors([]);
    saveVariant(editingVariant);
  }, [editingVariant, saveVariant]);

  if (!productId) return null;

  return (
    <div className="space-y-4">
      {/* Global Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Barvne različice</h3>
          {productBaseColor && (
            <p className="text-sm text-gray-600 mt-1">
              Osnovna barva izdelka: <span className="font-medium capitalize">{productBaseColor}</span>
              <span className="text-xs text-gray-500 ml-2">(avtomatsko ustvarjena kot prva različica)</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {productBaseColor && !variants.some(v => (v as any).is_base) && (
            <Button 
              onClick={async () => {
                try {
                  if (!productId || typeof productId !== 'string' || productId.length !== 36) {
                    toast({
                      title: 'Napaka',
                      description: 'ID izdelka ni veljaven UUID!',
                      variant: 'destructive',
                    });
                    return;
                  }
                  // Preveri, če že obstaja barva z istim imenom
                  const { data: existing, error: checkError } = await supabase
                    .from('product_variants')
                    .select('id')
                    .eq('product_id', productId)
                    .eq('color_name', productBaseColor);
                  if (checkError) {
                    toast({
                      title: 'Napaka',
                      description: 'Napaka pri preverjanju obstoječih barv: ' + (checkError.message || ''),
                      variant: 'destructive',
                    });
                    return;
                  }
                  if (existing && existing.length > 0) {
                    toast({
                      title: 'Napaka',
                      description: 'Barva z istim imenom za ta izdelek že obstaja!',
                      variant: 'destructive',
                    });
                    return;
                  }
                  // Validacija slik
                  let images = productBaseImages || [];
                  if (!Array.isArray(images)) images = [];
                  images = images.filter((img) => typeof img === 'string');
                  // Sestavi podatke
                  const baseVariant = {
                    product_id: productId,
                    color_name: productBaseColor,
                    color_value: '',
                    images,
                    stock: 0,
                    available: true,
                    is_base: true
                  };
                  const { error } = await supabase
                    .from('product_variants')
                    .insert([baseVariant]);
                  if (error) {
                    let msg = error.message || 'Napaka pri ustvarjanju osnovne barve';
                    if (error.details) msg += ' | ' + error.details;
                    if (error.code) msg += ' (koda: ' + error.code + ')';
                    toast({
                      title: 'Napaka',
                      description: msg,
                      variant: 'destructive',
                    });
                    console.error('❌ Error creating base variant:', error);
                  } else {
                    await loadVariants();
                    toast({
                      title: 'Uspešno',
                      description: 'Osnovna barvna različica je bila ustvarjena.',
                    });
                  }
                } catch (error: any) {
                  let msg = error?.message || 'Neznana napaka';
                  if (error?.details) msg += ' | ' + error.details;
                  if (error?.code) msg += ' (koda: ' + error.code + ')';
                  toast({
                    title: 'Napaka',
                    description: msg,
                    variant: 'destructive',
                  });
                  console.error('❌ Error:', error);
                }
              }}
              size="sm"
              className="bg-yellow-500 text-white hover:bg-yellow-600"
              disabled={!user || !isAdmin}
            >
              <Star className="h-4 w-4 mr-2" />
              Ustvari osnovno barvo
            </Button>
          )}
          <Button 
            onClick={startAdding}
            size="sm"
            className="bg-black text-white hover:bg-gray-800"
            disabled={!user || !isAdmin}
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj barvo
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {editingVariant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingVariant.id ? 'Uredi barvno različico' : 'Dodaj barvno različico'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Ime barve *</label>
                <Input
                  value={editingVariant.color_name}
                  onChange={(e) => handleFormDataChange('color_name', e.target.value)}
                  placeholder="npr. Črna, Bela, Rdeča"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Barva (opcijsko)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={editingVariant.color_value || '#000000'}
                    onChange={(e) => handleFormDataChange('color_value', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <div className="text-sm text-gray-600">
                    Izberi barvo za vizualni prikaz
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Zaloga</label>
                <Input
                  type="number"
                  value={editingVariant.stock}
                  onChange={(e) => handleFormDataChange('stock', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is_base"
                  checked={(editingVariant as any).is_base || false}
                  onChange={(e) => handleFormDataChange('is_base', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_base" className="text-sm font-medium">
                  Označi kot osnovno barvo
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Slike za to barvo</label>
              <div className="text-xs text-gray-500 mb-2">
                Trenutno slik: {editingVariant.images?.length || 0}
              </div>
              <MultiImageUpload
                value={editingVariant.images || []}
                onChange={handleImagesChange}
                maxImages={10}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={!editingVariant.color_name.trim()}
                className="bg-black text-white hover:bg-gray-800"
              >
                {editingVariant.id ? 'Posodobi' : 'Dodaj'}
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Prekliči
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin border-2 border-primary border-t-transparent rounded-full h-8 w-8 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Nalaganje barvnih različic...</p>
        </div>
      )}

      <div className="grid gap-4">
        {/* Show product base color as first option */}
        {productBaseColor && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <h4 className="font-medium capitalize">
                      {productBaseColor} (osnovna barva izdelka)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Osnovna barva izdelka - avtomatsko ustvarjena kot prva različica
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-yellow-500 text-white">
                    Osnovna
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show existing variants */}
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(variant as any).is_base && (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                  {variant.color_value && (
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: variant.color_value }}
                    />
                  )}
                  <div>
                    <h4 className="font-medium capitalize">
                      {variant.color_name}
                      {(variant as any).is_base && <span className="text-xs text-gray-500 ml-2">(osnovna)</span>}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Zaloga: {variant.stock} | Slike: {variant.images?.length || 0}
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
                    onClick={() => startEditing(variant)}
                    disabled={!user || !isAdmin}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteVariant(variant.id!)}
                    disabled={!user || !isAdmin || (variant as any).is_base}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Prikaz slik */}
              {variant.images && variant.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Slike ({variant.images.length}):</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {variant.images.map((imageUrl, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={`${variant.color_name} ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            console.error('❌ Variant image load error:', imageUrl);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                          onLoad={() => {
                            console.log('✅ Variant image loaded successfully:', imageUrl);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!variant.images || variant.images.length === 0) && (
                <div className="mt-4 text-sm text-gray-500">
                  Ni naloženih slik
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && !editingVariant && !loading && (
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
