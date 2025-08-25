-- Create storage bucket for scraped product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scraped-images', 'scraped-images', true)
ON CONFLICT (id) DO NOTHING;