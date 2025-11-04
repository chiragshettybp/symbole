-- Add visible column to products table for hide/show functionality
ALTER TABLE public.products
ADD COLUMN visible boolean NOT NULL DEFAULT true;

-- Create an index for better query performance
CREATE INDEX idx_products_visible ON public.products(visible);