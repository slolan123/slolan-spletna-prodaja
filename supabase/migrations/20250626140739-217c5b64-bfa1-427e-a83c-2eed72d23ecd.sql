
-- Create a storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
);

-- Create RLS policies for the product-images bucket
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND vloga = 'admin'
  )
);

CREATE POLICY "Admins can update product images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND vloga = 'admin'
  )
);

CREATE POLICY "Admins can delete product images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND vloga = 'admin'
  )
);
