-- Add additional fields to orders table for shipping and tracking
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create order_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for order_status_history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy for order_status_history
CREATE POLICY "Users can view their own order status history" ON order_status_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()
  ));

-- Insert initial status for existing orders
INSERT INTO order_status_history (order_id, status, note)
SELECT id, status, 'Order placed' FROM orders
WHERE NOT EXISTS (
  SELECT 1 FROM order_status_history WHERE order_status_history.order_id = orders.id
);
