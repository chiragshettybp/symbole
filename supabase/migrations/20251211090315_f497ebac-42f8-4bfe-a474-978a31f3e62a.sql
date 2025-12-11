-- Create wishlist table for tracking wishlist analytics
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_to_cart BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_wishlist_session ON public.wishlist(session_id);
CREATE INDEX idx_wishlist_product ON public.wishlist(product_id);
CREATE INDEX idx_wishlist_created ON public.wishlist(created_at DESC);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage wishlist"
ON public.wishlist FOR ALL USING (true) WITH CHECK (true);

-- Create recently_viewed table
CREATE TABLE public.recently_viewed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 1,
  total_time_spent INTEGER DEFAULT 0, -- seconds
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_recently_viewed_session ON public.recently_viewed(session_id);
CREATE INDEX idx_recently_viewed_product ON public.recently_viewed(product_id);
CREATE INDEX idx_recently_viewed_last ON public.recently_viewed(last_viewed_at DESC);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage recently viewed"
ON public.recently_viewed FOR ALL USING (true) WITH CHECK (true);

-- Create product_fit_feedback table
CREATE TABLE public.product_fit_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  session_id TEXT,
  fit_rating TEXT NOT NULL, -- 'small', 'true_to_size', 'large'
  size_purchased TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_fit_feedback_product ON public.product_fit_feedback(product_id);
CREATE INDEX idx_fit_feedback_rating ON public.product_fit_feedback(fit_rating);

ALTER TABLE public.product_fit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage fit feedback"
ON public.product_fit_feedback FOR ALL USING (true) WITH CHECK (true);

-- Create checkout_funnel table for tracking funnel steps
CREATE TABLE public.checkout_funnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  step TEXT NOT NULL, -- 'homepage', 'product', 'cart', 'shipping', 'payment', 'review', 'complete'
  completed BOOLEAN DEFAULT false,
  dropped_off BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0, -- seconds on step
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_funnel_session ON public.checkout_funnel(session_id);
CREATE INDEX idx_checkout_funnel_step ON public.checkout_funnel(step);
CREATE INDEX idx_checkout_funnel_created ON public.checkout_funnel(created_at DESC);

ALTER TABLE public.checkout_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage checkout funnel"
ON public.checkout_funnel FOR ALL USING (true) WITH CHECK (true);

-- Create cart_abandonment_reasons table
CREATE TABLE public.cart_abandonment_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  cart_id UUID,
  reason TEXT NOT NULL, -- 'high_shipping', 'account_required', 'payment_options', 'price_concerns', 'confusing_ui', 'slow_experience'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_abandonment_reason ON public.cart_abandonment_reasons(reason);
CREATE INDEX idx_abandonment_created ON public.cart_abandonment_reasons(created_at DESC);

ALTER TABLE public.cart_abandonment_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage abandonment reasons"
ON public.cart_abandonment_reasons FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recently_viewed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_fit_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkout_funnel;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_abandonment_reasons;

ALTER TABLE public.wishlist REPLICA IDENTITY FULL;
ALTER TABLE public.recently_viewed REPLICA IDENTITY FULL;
ALTER TABLE public.product_fit_feedback REPLICA IDENTITY FULL;
ALTER TABLE public.checkout_funnel REPLICA IDENTITY FULL;
ALTER TABLE public.cart_abandonment_reasons REPLICA IDENTITY FULL;