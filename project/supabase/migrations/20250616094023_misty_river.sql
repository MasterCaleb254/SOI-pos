/*
  # Create complete database schema for POS system

  1. New Tables
    - `profiles` - User profiles with roles (admin, manager, cashier)
    - `products` - Product inventory with stock management
    - `transactions` - Sales transactions with payment methods
    - `transaction_items` - Individual items within transactions
    - `audit_logs` - System audit trail for all changes
    - `restock_alerts` - Low stock notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Ensure users can only access appropriate data based on their role

  3. Features
    - Automatic timestamps with triggers
    - Stock level monitoring
    - Comprehensive audit logging
    - Multi-payment method support (cash, M-Pesa, card)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level integer NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
  category text NOT NULL,
  expiry_date date,
  supplier text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid NOT NULL REFERENCES profiles(id),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card')),
  mpesa_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create restock_alerts table
CREATE TABLE IF NOT EXISTS restock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  current_stock integer NOT NULL,
  min_stock_level integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'restocked')),
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for products table
CREATE POLICY "All authenticated users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Managers and admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create policies for transactions table
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    cashier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Cashiers can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cashier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

CREATE POLICY "Managers and admins can update transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create policies for transaction_items table
CREATE POLICY "Users can read transaction items for accessible transactions"
  ON transaction_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id AND (
        t.cashier_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Cashiers can create transaction items"
  ON transaction_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = transaction_id 
        AND t.cashier_id = auth.uid()
        AND p.role IN ('admin', 'manager', 'cashier')
    )
  );

-- Create policies for audit_logs table
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for restock_alerts table
CREATE POLICY "All authenticated users can read restock alerts"
  ON restock_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage restock alerts"
  ON restock_alerts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create restock alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock has fallen below minimum level
  IF NEW.stock_quantity <= NEW.min_stock_level AND 
     (OLD.stock_quantity IS NULL OR OLD.stock_quantity > NEW.min_stock_level) THEN
    
    INSERT INTO restock_alerts (product_id, current_stock, min_stock_level)
    VALUES (NEW.id, NEW.stock_quantity, NEW.min_stock_level);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stock level monitoring
CREATE TRIGGER monitor_stock_levels
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_levels();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_restock_alerts_product ON restock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_alerts_status ON restock_alerts(status);