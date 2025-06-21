import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageUpload = ({ value, onChange, className }: ImageUploadProps) => {
  const [imageUrl, setImageUrl] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Napačen tip datoteke",
        description: "Prosimo, izberite sliko.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Datoteka je prevelika",
        description: "Maksimalna velikost slike je 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for demonstration - in real app would upload to storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        onChange(result);
        setUploading(false);
        toast({
          title: "Slika naložena",
          description: "Slika je bila uspešno naložena.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Napaka",
        description: "Napaka pri nalaganju slike.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      onChange(imageUrl);
      toast({
        title: "URL nastavljen",
        description: "URL slike je bil uspešno nastavljen.",
      });
    }
  };

  const removeImage = () => {
    setImageUrl('');
    onChange('');
  };

  return (
    <div className={className}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Naloži datoteko</TabsTrigger>
          <TabsTrigger value="url">URL naslov</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {imageUrl ? (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Naložena slika"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              className={`border-2 border-dashed transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Povlecite sliko sem ali kliknite za izbiro</p>
                    <p className="text-sm text-muted-foreground">
                      Podprte so PNG, JPG, GIF datoteke do 5MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {uploading ? 'Nalagam...' : 'Izberi datoteko'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Vnesite URL slike..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button onClick={handleUrlSubmit} disabled={!imageUrl}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Nastavi
            </Button>
          </div>
          {imageUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Slika iz URL"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={() => {
                      toast({
                        title: "Napaka",
                        description: "Slika na tem URL naslovu ni dostopna.",
                        variant: "destructive",
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};