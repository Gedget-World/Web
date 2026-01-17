-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own orders
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to read their own orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own orders (if needed)
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert order items for their orders
CREATE POLICY "Users can insert order items for their orders" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Policy for users to read order items for their orders
CREATE POLICY "Users can read order items for their orders" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own customer record
CREATE POLICY "Users can manage their own customer record" ON customers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on addresses table (if exists)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own addresses
CREATE POLICY "Users can manage their own addresses" ON addresses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = addresses.customer_id 
      AND customers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = addresses.customer_id 
      AND customers.user_id = auth.uid()
    )
  );