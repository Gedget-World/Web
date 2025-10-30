-- Insert sample collections
INSERT INTO collections (name, slug, description, image_url) VALUES
  ('Summer Collection', 'summer-collection', 'Fresh and vibrant styles for the sunny season', '/placeholder.svg?height=400&width=600'),
  ('Winter Essentials', 'winter-essentials', 'Cozy and warm clothing for cold days', '/placeholder.svg?height=400&width=600'),
  ('Casual Wear', 'casual-wear', 'Comfortable everyday clothing', '/placeholder.svg?height=400&width=600'),
  ('Formal Attire', 'formal-attire', 'Elegant pieces for special occasions', '/placeholder.svg?height=400&width=600');

-- Insert sample products
INSERT INTO products (name, slug, description, price, image_url, collection_id, is_featured, stock) VALUES
  ('Classic White T-Shirt', 'classic-white-tshirt', 'A timeless wardrobe essential made from premium cotton', 29.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'casual-wear'), true, 50),
  ('Denim Jacket', 'denim-jacket', 'Vintage-inspired denim jacket with a modern fit', 89.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'casual-wear'), true, 30),
  ('Summer Floral Dress', 'summer-floral-dress', 'Light and breezy dress perfect for warm weather', 79.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'summer-collection'), true, 25),
  ('Wool Coat', 'wool-coat', 'Luxurious wool coat to keep you warm in style', 199.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'winter-essentials'), true, 15),
  ('Slim Fit Chinos', 'slim-fit-chinos', 'Versatile chinos that pair with anything', 59.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'casual-wear'), false, 40),
  ('Striped Button-Up Shirt', 'striped-button-up', 'Classic striped shirt for a polished look', 49.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'formal-attire'), false, 35),
  ('Knit Sweater', 'knit-sweater', 'Cozy knit sweater in multiple colors', 69.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'winter-essentials'), true, 45),
  ('Black Blazer', 'black-blazer', 'Tailored blazer for professional occasions', 149.99, '/placeholder.svg?height=500&width=400', (SELECT id FROM collections WHERE slug = 'formal-attire'), true, 20);
