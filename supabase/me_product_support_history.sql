-- ============================================================================
-- Effective-dated Product Support History (ME / PM Capacity)
-- ============================================================================
--
-- WHY THIS SCRIPT EXISTS
-- ----------------------
-- Product support hours-per-batch were stored as a single mutable value on
-- me_products.hours_per_week. When teams improve over time, this overwrites
-- historical assumptions and makes old capacity months inaccurate.
--
-- This script introduces me_product_support_history and backfills one baseline
-- row per existing product using product created_at and current hours_per_week.
--
-- HOW TO RUN
-- ----------
-- Paste into Supabase SQL Editor and run.
-- Safe guards are included for repeated execution.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.me_product_support_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.me_products(id) ON DELETE CASCADE,
  department TEXT NOT NULL DEFAULT 'ME',
  hours_per_week NUMERIC NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL,
  end_date DATE,
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT me_product_support_history_date_order_chk
    CHECK (end_date IS NULL OR end_date >= effective_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS me_product_support_history_unique_window
  ON public.me_product_support_history (product_id, effective_date, department);

CREATE INDEX IF NOT EXISTS me_product_support_history_product_idx
  ON public.me_product_support_history (product_id, effective_date DESC);

ALTER TABLE public.me_product_support_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'me_product_support_history'
      AND policyname = 'auth'
  ) THEN
    CREATE POLICY "auth" ON public.me_product_support_history
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Backfill baseline support-history entries from current me_products values.
INSERT INTO public.me_product_support_history (
  user_id,
  product_id,
  department,
  hours_per_week,
  effective_date,
  change_reason,
  notes,
  created_at,
  updated_at
)
SELECT
  mp.user_id,
  mp.id,
  COALESCE(NULLIF(TRIM(mp.department), ''), 'ME'),
  COALESCE(mp.hours_per_week, 0),
  COALESCE(mp.created_at::date, CURRENT_DATE),
  'Baseline',
  'Backfilled from me_products.hours_per_week',
  NOW(),
  NOW()
FROM public.me_products mp
WHERE NOT EXISTS (
  SELECT 1
  FROM public.me_product_support_history h
  WHERE h.product_id = mp.id
);

-- Health check
SELECT
  product_id,
  department,
  hours_per_week,
  effective_date,
  end_date,
  change_reason
FROM public.me_product_support_history
ORDER BY product_id, effective_date;
