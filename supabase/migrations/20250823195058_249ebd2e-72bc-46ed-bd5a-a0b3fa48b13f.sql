-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION public.track_shipment_status_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only insert if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.shipment_status_history (shipment_id, status, updated_by, notes)
    VALUES (NEW.id, NEW.status, 'admin', 'Status updated via admin panel');
  END IF;
  RETURN NEW;
END;
$$;