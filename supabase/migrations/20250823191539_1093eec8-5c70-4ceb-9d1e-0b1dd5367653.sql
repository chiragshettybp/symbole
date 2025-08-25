-- Fix RLS policies for products table to allow admin operations
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create comprehensive RLS policies for products table
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update products" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Admin can delete products" 
ON public.products 
FOR DELETE 
USING (true);