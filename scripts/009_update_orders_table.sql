-- Add columns to orders table for address and coupon information
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS discount decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON public.orders (coupon_code);