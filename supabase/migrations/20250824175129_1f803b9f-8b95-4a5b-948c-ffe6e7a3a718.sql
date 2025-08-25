-- Ensure storage buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),
  ('scraped-images', 'scraped-images', true)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public;

-- Create RLS policies for product-images bucket
CREATE POLICY "Public read access for product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images');

CREATE POLICY "Admin can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images');

-- Create RLS policies for scraped-images bucket
CREATE POLICY "Public read access for scraped images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'scraped-images');

CREATE POLICY "Admin can upload scraped images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'scraped-images');

CREATE POLICY "Admin can update scraped images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'scraped-images');

CREATE POLICY "Admin can delete scraped images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'scraped-images');