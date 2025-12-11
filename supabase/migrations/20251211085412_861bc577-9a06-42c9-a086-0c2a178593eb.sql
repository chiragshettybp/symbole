-- Create analytics_events table to track all visitor interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'click', 'scroll', 'bounce', 'session_start', 'session_end'
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  device_type TEXT DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  scroll_depth INTEGER DEFAULT 0, -- percentage 0-100
  session_duration INTEGER DEFAULT 0, -- in seconds
  click_target TEXT, -- element clicked (e.g., 'product_thumbnail', 'add_to_cart')
  product_id UUID,
  is_bounce BOOLEAN DEFAULT false,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_page_url ON public.analytics_events(page_url);
CREATE INDEX idx_analytics_events_device_type ON public.analytics_events(device_type);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert events (for tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics"
ON public.analytics_events
FOR SELECT
USING (public.current_user_is_admin());

-- Allow public read for anonymous tracking verification
CREATE POLICY "Public can read own session analytics"
ON public.analytics_events
FOR SELECT
USING (true);

-- Enable realtime for analytics_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER TABLE public.analytics_events REPLICA IDENTITY FULL;

-- Create daily_analytics_summary table for aggregated metrics
CREATE TABLE public.daily_analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  avg_session_duration NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  avg_scroll_depth NUMERIC DEFAULT 0,
  product_click_rate NUMERIC DEFAULT 0,
  desktop_visits INTEGER DEFAULT 0,
  mobile_visits INTEGER DEFAULT 0,
  tablet_visits INTEGER DEFAULT 0,
  top_pages JSONB DEFAULT '[]'::jsonb,
  top_browsers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for daily summary
ALTER TABLE public.daily_analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage daily analytics"
ON public.daily_analytics_summary
FOR ALL
USING (public.current_user_is_admin());

-- Allow public read for aggregated data
CREATE POLICY "Public can read daily analytics"
ON public.daily_analytics_summary
FOR SELECT
USING (true);

-- Enable realtime for daily summary
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_analytics_summary;
ALTER TABLE public.daily_analytics_summary REPLICA IDENTITY FULL;