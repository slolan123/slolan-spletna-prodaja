
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export const MultiImageUpload = ({ 
  value = [], 
  onChange, 
  maxImages = 10, 
  className 
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
    
    console.log('Uploading file:', fileName);
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleFileSelect = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Napačen tip datoteke",
          description: `${file.name} ni slika.`,
          variant: "destructive",
        });
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Datoteka je prevelika",
          description: `${file.name} presega 5MB.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    if (value.length + validFiles.length > maxImages) {
      toast({
        title: "Preveč slik",
        description: `Lahko dodate največ ${maxImages} slik.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      console.log('Starting upload of', validFiles.length, 'files');
      const uploadPromises = validFiles.map(file => uploadImage(file));
      const newUrls = await Promise.all(uploadPromises);
      
      console.log('All uploads completed:', newUrls);
      onChange([...value, ...newUrls]);
      
      toast({
        title: "Slike naložene",
        description: `${newUrls.length} slik uspešno naloženih.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Napaka",
        description: `Napaka pri nalaganju slik: ${error.message || 'Neznana napaka'}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = value[index];
    console.log('Removing image:', imageUrl);
    
    // Try to delete from storage if it's a Supabase URL
    if (imageUrl.includes('supabase') || imageUrl.includes('product-images')) {
      try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        console.log('Attempting to delete file:', fileName);
        
        const { error } = await supabase.storage
          .from('product-images')
          .remove([fileName]);
          
        if (error) {
          console.error('Error deleting from storage:', error);
          // Continue anyway, as the file might already be deleted
        } else {
          console.log('File deleted from storage successfully');
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Continue anyway
      }
    }

    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
    
    toast({
      title: "Slika odstranjena",
      description: "Slika je bila uspešno odstranjena.",
    });
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newUrls = [...value];
    const [movedItem] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, movedItem);
    onChange(newUrls);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Image Grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((imageUrl, index) => (
              <Card key={`${imageUrl}-${index}`} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={imageUrl}
                      alt={`Slika ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.error('Image load error:', imageUrl);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => reorderImages(index, index - 1)}
                          >
                            ←
                          </Button>
                        )}
                        {index < value.length - 1 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => reorderImages(index, index + 1)}
                          >
                            →
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                        Glavna
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {value.length < maxImages && (
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  {uploading ? (
                    <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {uploading ? 'Nalagam slike...' : 'Povlecite slike sem ali kliknite za izbiro'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, WebP, GIF do 5MB ({value.length}/{maxImages})
                  </p>
                </div>
                {!uploading && (
                  <Button type="button" variant="outline" disabled={uploading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj slike
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />
      </div>
    </div>
  );
};
