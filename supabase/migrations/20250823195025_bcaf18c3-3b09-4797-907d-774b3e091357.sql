-- Create shipment status history table for tracking status changes with timestamps
CREATE TABLE public.shipment_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin access to shipment status history" 
ON public.shipment_status_history 
FOR ALL 
USING (true);

-- Create trigger to auto-add status history when shipment status changes
CREATE OR REPLACE FUNCTION public.track_shipment_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.shipment_status_history (shipment_id, status, updated_by, notes)
    VALUES (NEW.id, NEW.status, 'admin', 'Status updated via admin panel');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status history tracking
CREATE TRIGGER track_shipment_status_updates
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.track_shipment_status_changes();

-- Make payment_slips bucket public so slips can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'payment_slips';