-- Reset Product Support baseline for ME, PM, LOG, UNIT6
-- Option 3: clear support history + reset active support to 0
-- Effective date baseline: 2026-01-01

BEGIN;

WITH target_products AS (
  SELECT
    mp.id AS product_id,
    mp.user_id,
    COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') AS department
  FROM public.me_products mp
  WHERE COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') IN ('ME', 'PM', 'LOG', 'UNIT6')
)
UPDATE public.me_products mp
SET
  hours_per_week = 0,
  updated_at = NOW()
FROM target_products tp
WHERE mp.id = tp.product_id;

DELETE FROM public.me_product_support_history h
WHERE COALESCE(NULLIF(TRIM(h.department), ''), 'ME') IN ('ME', 'PM', 'LOG', 'UNIT6');

WITH target_products AS (
  SELECT
    mp.id AS product_id,
    mp.user_id,
    COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') AS department
  FROM public.me_products mp
  WHERE COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') IN ('ME', 'PM', 'LOG', 'UNIT6')
)
INSERT INTO public.me_product_support_history (
  id,
  user_id,
  product_id,
  department,
  hours_per_week,
  effective_date,
  end_date,
  change_reason,
  notes,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  tp.user_id,
  tp.product_id,
  tp.department,
  0,
  DATE '2026-01-01',
  NULL,
  'Baseline reset',
  'Reset all support values to 0 via bulk reset',
  NOW(),
  NOW()
FROM target_products tp;

COMMIT;

-- Validation snapshot
SELECT
  COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') AS department,
  COUNT(*) AS products,
  SUM(COALESCE(mp.hours_per_week, 0)) AS total_hours_per_week
FROM public.me_products mp
WHERE COALESCE(NULLIF(TRIM(mp.department), ''), 'ME') IN ('ME', 'PM', 'LOG', 'UNIT6')
GROUP BY 1
ORDER BY 1;

SELECT
  COALESCE(NULLIF(TRIM(h.department), ''), 'ME') AS department,
  COUNT(*) AS history_rows,
  MIN(h.effective_date) AS earliest_effective,
  MAX(h.effective_date) AS latest_effective
FROM public.me_product_support_history h
WHERE COALESCE(NULLIF(TRIM(h.department), ''), 'ME') IN ('ME', 'PM', 'LOG', 'UNIT6')
GROUP BY 1
ORDER BY 1;
