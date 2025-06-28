/*
  # Demo Users Seed Data

  1. Demo Users
    - Creates demo user profiles for testing
    - Includes admin, manager, and cashier roles
    - Provides sample products and data

  2. Sample Products
    - Creates initial inventory for testing
    - Includes various categories and stock levels

  3. Security
    - All users have proper role assignments
    - Passwords are simple for demo purposes
*/

-- Insert demo user profiles
-- Note: These will be linked to auth.users when users sign up
INSERT INTO profiles (id, email, full_name, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@soi.com', 'System Administrator', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'manager@soi.com', 'Store Manager', 'manager', true),
  ('00000000-0000-0000-0000-000000000003', 'cashier@soi.com', 'Main Cashier', 'cashier', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, barcode, price, stock_quantity, min_stock_level, category, supplier, expiry_date) VALUES
  ('Milk - 1L', '1234567890', 80.00, 5, 20, 'Dairy', 'Fresh Dairy Ltd', '2024-02-15'),
  ('Bread - White', '2345678901', 50.00, 8, 25, 'Bakery', 'Golden Bakery', '2024-02-10'),
  ('Rice - 2kg', '3456789012', 180.00, 45, 30, 'Grains', 'Quality Grains Co', '2025-12-31'),
  ('Cooking Oil - 500ml', '4567890123', 120.00, 0, 15, 'Cooking', 'Pure Oil Industries', '2024-08-30'),
  ('Sugar - 1kg', '5678901234', 90.00, 35, 20, 'Pantry', 'Sweet Supply Co', '2025-06-15'),
  ('Eggs - 12pcs', '6789012345', 280.00, 50, 30, 'Dairy', 'Farm Fresh Eggs', '2024-02-20'),
  ('Tomatoes - 1kg', '7890123456', 150.00, 25, 40, 'Vegetables', 'Green Valley Farm', '2024-02-05'),
  ('Onions - 1kg', '8901234567', 120.00, 30, 35, 'Vegetables', 'Green Valley Farm', '2024-02-12'),
  ('Soap - Bar', '9012345678', 45.00, 60, 50, 'Personal Care', 'Clean Co', '2025-01-01'),
  ('Toothpaste - 100ml', '0123456789', 85.00, 40, 25, 'Personal Care', 'Dental Care Ltd', '2025-03-15')
ON CONFLICT (barcode) DO NOTHING;