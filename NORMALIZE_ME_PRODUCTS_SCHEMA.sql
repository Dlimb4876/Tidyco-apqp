-- ============================================================
-- Normalize me_products table to use foreign key to products
-- ============================================================
-- This change ensures product names are stored in ONE place
-- (the main products table) to maintain data integrity

-- Step 1: Drop the denormalized me_products table
DROP TABLE IF EXISTS me_products CASCADE;

-- Step 2: Create normalized me_products table
CREATE TABLE me_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- RLS field
  product_id UUID NOT NULL,  -- Foreign key to main products table (single source of truth)
  support_from DATE NOT NULL,
  support_until DATE NOT NULL,
  hours_per_week DECIMAL(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Foreign key constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

  -- Data validation
  CONSTRAINT valid_dates CHECK (support_from <= support_until),

  -- Unique constraint: user can't support same product twice
  UNIQUE(user_id, product_id)
);

-- Step 3: Create indexes for efficient queries
CREATE INDEX me_products_user_id_idx ON me_products(user_id);
CREATE INDEX me_products_product_id_idx ON me_products(product_id);
CREATE INDEX me_products_date_range_idx ON me_products(user_id, support_from, support_until);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE me_products ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policy - Users can only access their own product support records
CREATE POLICY me_products_rls_user_scoped ON me_products
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Benefits of this normalized design:
-- ============================================================
-- ✓ Product names stored in ONE place (products table)
-- ✓ When product name changes, it updates everywhere automatically
-- ✓ No data duplication or inconsistency
-- ✓ Smaller storage footprint (UUID vs TEXT for product reference)
-- ✓ Referential integrity enforced at DB level (CASCADE delete)
-- ✓ Can easily join to products table to get name, code, family, etc.
-- ✓ UNIQUE constraint prevents duplicate product assignments per user

-- ============================================================
-- Example queries after normalization:
-- ============================================================

-- Get products a user is supporting WITH product details:
-- SELECT mp.*, p.name, p.code, p.family, p.customer
-- FROM me_products mp
-- JOIN products p ON mp.product_id = p.id
-- WHERE mp.user_id = 'user-id'
-- ORDER BY p.name;

-- Get products by date range:
-- SELECT mp.*, p.name
-- FROM me_products mp
-- JOIN products p ON mp.product_id = p.id
-- WHERE mp.user_id = 'user-id'
-- AND mp.support_from <= CURRENT_DATE
-- AND mp.support_until >= CURRENT_DATE;

-- Get product support capacity by product:
-- SELECT p.name, SUM(mp.hours_per_week) as total_hours
-- FROM me_products mp
-- JOIN products p ON mp.product_id = p.id
-- WHERE mp.user_id = 'user-id'
-- GROUP BY p.name
-- ORDER BY total_hours DESC;
