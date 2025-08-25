-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment_slips', 'payment_slips', false);

-- Create RLS policies for payment slips bucket
CREATE POLICY "Admin can upload payment slips"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment_slips');

CREATE POLICY "Admin can view payment slips"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment_slips');

CREATE POLICY "Admin can update payment slips"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'payment_slips');

CREATE POLICY "Admin can delete payment slips"
ON storage.objects
FOR DELETE
USING (bucket_id = 'payment_slips');