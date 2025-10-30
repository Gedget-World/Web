-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add coupon_code to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create index for faster coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active coupons (for validation)
CREATE POLICY "Anyone can read active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Insert some sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_until)
VALUES 
  ('WELCOME10', '10% off your first order', 'percentage', 10, 0, 50, 1000, NOW() + INTERVAL '30 days'),
  ('SAVE20', '20% off orders over $100', 'percentage', 20, 100, 100, 500, NOW() + INTERVAL '60 days'),
  ('FLAT15', '$15 off any order', 'fixed', 15, 50, NULL, 1000, NOW() + INTERVAL '45 days'),
  ('FREESHIP', 'Free shipping on orders over $50', 'fixed', 10, 50, 10, NULL, NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;
