-- Make product_id nullable for global reviews
ALTER TABLE public.reviews 
ALTER COLUMN product_id DROP NOT NULL;

-- Drop the foreign key constraint to allow global reviews without product reference
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;