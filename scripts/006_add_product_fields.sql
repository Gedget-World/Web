-- Add fields for deals, bestsellers, and new arrivals functionality
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage) WHERE discount_percentage > 0;
CREATE INDEX IF NOT EXISTS idx_products_sales ON products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Update some sample products with discounts (for testing)
UPDATE products 
SET discount_percentage = 20 
WHERE id IN (SELECT id FROM products ORDER BY random() LIMIT 5);

UPDATE products 
SET discount_percentage = 30 
WHERE id IN (SELECT id FROM products WHERE discount_percentage = 0 ORDER BY random() LIMIT 3);

-- Update some products as new arrivals (products from last 30 days)
UPDATE products 
SET is_new_arrival = true 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Update some products with sales counts (for testing)
UPDATE products 
SET sales_count = floor(random() * 100 + 10)::integer 
WHERE id IN (SELECT id FROM products ORDER BY random() LIMIT 10);
