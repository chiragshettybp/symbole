-- Fix security issues by updating functions with proper search_path

-- Update generate_order_number function with security settings
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    next_val BIGINT;
    order_prefix TEXT := 'ORD';
BEGIN
    -- Get the next sequence value
    SELECT nextval('order_number_seq') INTO next_val;
    
    -- Format as 8-digit padded number with ORD prefix
    RETURN order_prefix || LPAD(next_val::TEXT, 8, '0');
END;
$$;

-- Update assign_order_number function with security settings
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only assign if order_number is NULL or empty
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;