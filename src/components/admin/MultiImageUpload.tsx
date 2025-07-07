import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Clear errors when component mounts or user changes
  useEffect(() => {
    setErrors([]);
  }, [user]);

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
    
    console.log('🚀 Starting upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      fileName: fileName
    });
    
    try {
      // Check authentication first
      if (!user) {
        throw new Error('Uporabnik ni prijavljen');
      }

      if (!isAdmin) {
        throw new Error('Potrebujete admin pravice za nalaganje slik');
      }

      // Check if bucket exists and is accessible
      console.log('🔍 Checking bucket access...');
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });

      if (bucketError) {
        console.error('❌ Bucket access error:', bucketError);
        throw new Error(`Storage bucket ni dostopen: ${bucketError.message}`);
      }

      console.log('✅ Bucket is accessible, proceeding with upload...');

      // Upload file with progress tracking
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      console.log('🔗 Public URL generated:', urlData.publicUrl);
      
      // Verify URL accessibility
      try {
        console.log('🔍 Verifying URL accessibility...');
        const response = await fetch(urlData.publicUrl, { 
          method: 'HEAD',
          mode: 'no-cors' // Try without CORS first
        });
        console.log('✅ URL accessibility check passed');
      } catch (fetchError) {
        console.warn('⚠️ Could not verify URL accessibility:', fetchError);
        // Don't throw error here, as the URL might still be valid
      }
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznana napaka';
      setErrors(prev => [...prev, `${file.name}: ${errorMessage}`]);
      throw error;
    }
  };

  const handleFileSelect = async (files: FileList) => {
    console.log('📁 File selection started, files:', files.length);
    
    // Clear previous errors
    setErrors([]);
    setUploadProgress({});

    if (!user) {
      toast({
        title: "Napaka prijave",
        description: "Potrebujete se prijaviti za nalaganje slik.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Nezadostna pravica",
        description: "Potrebujete admin pravice za nalaganje slik.",
        variant: "destructive",
      });
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      console.log('🔍 Validating file:', file.name, file.type, file.size);
      
      if (!file.type.startsWith('image/')) {
        const errorMsg = `${file.name} ni slika (${file.type})`;
        console.warn('❌ Invalid file type:', errorMsg);
        setErrors(prev => [...prev, errorMsg]);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = `${file.name} presega 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        console.warn('❌ File too large:', errorMsg);
        setErrors(prev => [...prev, errorMsg]);
        return false;
      }

      console.log('✅ File validation passed:', file.name);
      return true;
    });

    if (validFiles.length === 0) {
      console.log('❌ No valid files to upload');
      return;
    }

    if (value.length + validFiles.length > maxImages) {
      const errorMsg = `Lahko dodate največ ${maxImages} slik (trenutno: ${value.length}, poskušate dodati: ${validFiles.length})`;
      console.warn('❌ Too many images:', errorMsg);
      setErrors(prev => [...prev, errorMsg]);
      return;
    }

    setUploading(true);
    console.log('🚀 Starting upload of', validFiles.length, 'files');

    try {
      console.log('📊 Current value before upload:', value);
      
      const uploadPromises = validFiles.map(async (file, index) => {
        const fileName = file.name;
        console.log(`📤 Uploading ${index + 1}/${validFiles.length}: ${fileName}`);
        
        try {
          const url = await uploadImage(file);
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
          console.log(`✅ Upload completed for ${fileName}:`, url);
          return url;
        } catch (error) {
          setUploadProgress(prev => ({ ...prev, [fileName]: -1 }));
          console.error(`❌ Upload failed for ${fileName}:`, error);
          throw error;
        }
      });

      const newUrls = await Promise.all(uploadPromises);
      
      console.log('🎉 All uploads completed:', newUrls);
      console.log('📊 New URLs to add:', newUrls);
      
      const updatedValue = [...value, ...newUrls];
      console.log('📊 Updated value after upload:', updatedValue);
      
      onChange(updatedValue);
      
      toast({
        title: "Slike naložene",
        description: `${newUrls.length} slik uspešno naloženih.`,
      });
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast({
        title: "Napaka",
        description: `Napaka pri nalaganju slik: ${error instanceof Error ? error.message : 'Neznana napaka'}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    console.log('📁 Drop event:', e.dataTransfer.files.length, 'files');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = value[index];
    console.log('🗑️ Removing image:', imageUrl);
    
    // Try to delete from storage if it's a Supabase URL
    if (imageUrl.includes('supabase') || imageUrl.includes('product-images')) {
      try {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        console.log('🗑️ Attempting to delete file from storage:', fileName);
        
        const { error } = await supabase.storage
          .from('product-images')
          .remove([fileName]);
          
        if (error) {
          console.error('❌ Error deleting from storage:', error);
          // Continue anyway, as the file might already be deleted
        } else {
          console.log('✅ File deleted from storage successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting image from storage:', error);
        // Continue anyway
      }
    }

    const newUrls = value.filter((_, i) => i !== index);
    console.log('📊 Updated URLs after removal:', newUrls);
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
    console.log('🔄 Reordered images:', { fromIndex, toIndex, newUrls });
    onChange(newUrls);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Error Display */}
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

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{fileName}</span>
                {progress === -1 ? (
                  <span className="text-red-500">❌ Napaka</span>
                ) : progress === 100 ? (
                  <span className="text-green-500">✅ Dokončano</span>
                ) : (
                  <span className="text-blue-500">📤 Nalaganje...</span>
                )}
              </div>
            ))}
          </div>
        )}

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
                        console.error('❌ Image load error:', imageUrl);
                        e.currentTarget.src = '/placeholder.svg';
                        e.currentTarget.onerror = null; // Prepreči neskončno zanko
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', imageUrl);
                      }}
                      onLoadStart={() => {
                        console.log('🔄 Image load started:', imageUrl);
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
            console.log('📁 File input change:', e.target.files?.length, 'files');
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />
      </div>
    </div>
  );
};
