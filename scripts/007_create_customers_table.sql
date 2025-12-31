-- Create customers table to extend Supabase auth users
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  preferences JSONB DEFAULT '{}',
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addresses table for customer shipping/billing addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('shipping', 'billing')) DEFAULT 'shipping',
  is_default BOOLEAN DEFAULT false,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer and address references to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS billing_address_id UUID REFERENCES addresses(id),
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES addresses(id);

-- Create function to automatically create customer record when user signs up
CREATE OR REPLACE FUNCTION create_customer_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create customer record
DROP TRIGGER IF EXISTS create_customer_on_signup ON auth.users;
CREATE TRIGGER create_customer_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_customer_for_user();

-- Enable RLS on new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table - Allow public access
CREATE POLICY "Anyone can view customers"
ON customers FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert customers"
ON customers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update customers"
ON customers FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete customers"
ON customers FOR DELETE
USING (true);

-- Create RLS policies for addresses table - Allow public access
CREATE POLICY "Anyone can view addresses"
ON addresses FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert addresses"
ON addresses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update addresses"
ON addresses FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete addresses"
ON addresses FOR DELETE
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(customer_id, type, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Create function to ensure only one default address per type per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default, unset other defaults of same type
  IF NEW.is_default = true THEN
    UPDATE addresses 
    SET is_default = false 
    WHERE customer_id = NEW.customer_id 
    AND type = NEW.type 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default address management
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW 
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_address();