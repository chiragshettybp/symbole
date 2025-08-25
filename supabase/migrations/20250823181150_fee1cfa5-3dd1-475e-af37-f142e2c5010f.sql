-- Add timestamp columns to orders table for tracking checkout flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS checkout_initiated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS checkout_completed_at timestamp with time zone;

-- Add comments for clarity
COMMENT ON COLUMN public.orders.checkout_initiated_at IS 'Timestamp when checkout process was initiated';
COMMENT ON COLUMN public.orders.checkout_completed_at IS 'Timestamp when checkout/payment was completed by user';