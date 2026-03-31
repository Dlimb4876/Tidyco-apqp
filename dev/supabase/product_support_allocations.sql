-- Product support allocations — splits each product's support hours across team members by percentage.
-- One table per department, matching the existing capacity table pattern.

-- ME
CREATE TABLE me_product_support_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES me_products(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES me_teams(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  effective_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE me_product_support_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_me_product_support_allocations"
  ON me_product_support_allocations FOR ALL
  USING (auth.role() = 'authenticated');

-- PM
CREATE TABLE pm_product_support_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES pm_products(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES pm_teams(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  effective_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pm_product_support_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_pm_product_support_allocations"
  ON pm_product_support_allocations FOR ALL
  USING (auth.role() = 'authenticated');

-- Logistics
CREATE TABLE log_product_support_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES log_products(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES log_teams(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  effective_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE log_product_support_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_log_product_support_allocations"
  ON log_product_support_allocations FOR ALL
  USING (auth.role() = 'authenticated');

-- Unit 6
CREATE TABLE unit6_product_support_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES unit6_products(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES unit6_teams(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  effective_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE unit6_product_support_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_unit6_product_support_allocations"
  ON unit6_product_support_allocations FOR ALL
  USING (auth.role() = 'authenticated');
