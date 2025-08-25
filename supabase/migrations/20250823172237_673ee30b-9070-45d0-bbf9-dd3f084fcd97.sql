-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'sneakers',
  brand TEXT,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] NOT NULL DEFAULT '{}',
  stock_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_items table (for guest sessions)
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'black',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an e-commerce store)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Cart items are viewable by session" 
ON public.cart_items 
FOR ALL 
USING (true);

CREATE POLICY "Orders are viewable by everyone" 
ON public.orders 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample sneaker products
INSERT INTO public.products (name, slug, description, price, original_price, images, category, brand, sizes, colors, stock_count, featured) VALUES
('Air Max Revolution', 'air-max-revolution', 'Premium athletic sneakers with revolutionary air cushioning technology', 149.99, 179.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'Nike', ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['black', 'white', 'red'], 50, true),
('Ultra Boost Elite', 'ultra-boost-elite', 'High-performance running shoes with responsive boost technology', 189.99, 219.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'Adidas', ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['black', 'white', 'blue'], 35, true),
('Classic Court Pro', 'classic-court-pro', 'Timeless court-inspired sneakers for everyday wear', 89.99, 109.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'Converse', ARRAY['6', '7', '8', '9', '10', '11', '12', '13'], ARRAY['black', 'white', 'navy'], 75, false),
('Speed Runner X', 'speed-runner-x', 'Lightweight performance running shoes for serious athletes', 199.99, 229.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'New Balance', ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['black', 'gray', 'neon'], 40, true),
('Street Walker', 'street-walker', 'Casual urban sneakers perfect for daily adventures', 119.99, 149.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'Vans', ARRAY['6', '7', '8', '9', '10', '11', '12'], ARRAY['black', 'white', 'brown'], 60, false),
('High Top Legend', 'high-top-legend', 'Classic high-top sneakers with modern comfort features', 159.99, 189.99, ARRAY['/api/placeholder/400/400'], 'sneakers', 'Jordan', ARRAY['7', '8', '9', '10', '11', '12'], ARRAY['black', 'white', 'red'], 25, true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_featured ON public.products(featured);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_cart_items_session ON public.cart_items(session_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_email ON public.orders(customer_email);