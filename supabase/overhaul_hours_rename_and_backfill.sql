-- ============================================================================
-- Overhaul Hours: rename _days columns to _hours + backfill baselines
-- ============================================================================
--
-- WHY THIS SCRIPT EXISTS
-- ----------------------
-- 1. RENAME: estimated_time_impact_days (mcs_changes) and time_impact_days
--    (overhaul_history) were incorrectly named — they store values in HOURS
--    not days. This script renames them for consistency.
--
-- 2. BACKFILL: When a product was first created, no baseline overhaul_history
--    entry was recorded. This means the Overhaul Trends chart had no starting
--    point and the accumulation chain was broken. This script inserts a
--    "Baseline — product entry" record for every product that has
--    current_overhaul_hours > 0 but no existing history.
--
-- HOW TO RUN
-- ----------
-- Paste into the Supabase SQL Editor and click Run.
-- All renames use IF EXISTS guards — safe to run more than once.
-- The backfill INSERT is guarded by NOT EXISTS so it won't duplicate.
-- ============================================================================


-- ── 1. Rename columns ─────────────────────────────────────────────────────

-- mcs_changes: estimated_time_impact_days → estimated_time_impact_hours
ALTER TABLE mcs_changes
  RENAME COLUMN estimated_time_impact_days TO estimated_time_impact_hours;

-- overhaul_history: time_impact_days → time_impact_hours
ALTER TABLE overhaul_history
  RENAME COLUMN time_impact_days TO time_impact_hours;


-- ── 2. Backfill baseline overhaul_history for existing products ───────────
--
-- Creates one "Baseline" row per product that has overhaul hours set but
-- no existing history entries. Uses the product's created_at date as the
-- effective_date so the chart origin is as accurate as possible.

INSERT INTO overhaul_history (
  product_id,
  overhaul_hours,
  time_impact_hours,
  effective_date,
  change_reason,
  notes,
  created_by_name,
  is_mcs_triggered,
  user_id,
  created_at
)
SELECT
  p.id,
  p.current_overhaul_hours,
  p.current_overhaul_hours,        -- full value is the baseline delta
  COALESCE(p.created_at::date, CURRENT_DATE),
  'Baseline',
  'Initial overhaul time recorded at product creation.',
  'System (backfill)',
  false,
  p.user_id,
  NOW()
FROM products p
WHERE p.current_overhaul_hours > 0
  AND NOT EXISTS (
    SELECT 1 FROM overhaul_history oh WHERE oh.product_id = p.id
  );


-- ── 3. Health check ───────────────────────────────────────────────────────

-- Confirm renames succeeded
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('mcs_changes', 'overhaul_history')
  AND column_name IN (
    'estimated_time_impact_hours', 'time_impact_hours'
  )
ORDER BY table_name, column_name;

-- Show which products got backfilled
SELECT p.name, oh.overhaul_hours, oh.effective_date, oh.change_reason
FROM overhaul_history oh
JOIN products p ON p.id = oh.product_id
WHERE oh.change_reason = 'Baseline'
ORDER BY p.name;
