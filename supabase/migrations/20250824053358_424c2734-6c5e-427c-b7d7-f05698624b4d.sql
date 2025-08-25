-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create function to generate formatted order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    order_prefix TEXT := 'ORD';
BEGIN
    -- Get the next sequence value
    SELECT nextval('order_number_seq') INTO next_val;
    
    -- Format as 8-digit padded number with ORD prefix
    RETURN order_prefix || LPAD(next_val::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-assign order numbers
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign if order_number is NULL or empty
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign order numbers on insert
DROP TRIGGER IF EXISTS trigger_assign_order_number ON orders;
CREATE TRIGGER trigger_assign_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION assign_order_number();

-- Update existing orders that don't have proper order numbers
UPDATE orders 
SET order_number = generate_order_number() 
WHERE order_number IS NULL OR order_number = '' OR order_number !~ '^ORD\d{8}$';