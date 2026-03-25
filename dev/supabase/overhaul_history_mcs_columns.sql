-- ============================================================================
-- overhaul_history — Add MCS integration columns
-- ============================================================================
--
-- WHY THIS SCRIPT EXISTS
-- ----------------------
-- When an engineering change (MCO) passes final approval (Approval 2), the
-- system automatically creates an overhaul_history entry so the time impact
-- appears immediately in Overhaul Trends for that product in Product Management.
--
-- These columns link each overhaul_history row back to the MCO that triggered
-- it and store the time-impact delta alongside the new absolute overhaul hours.
--
-- HOW TO RUN
-- ----------
-- Paste the entire script into the Supabase SQL Editor and click Run.
-- All ADD COLUMN statements use IF NOT EXISTS — safe to run more than once.
-- ============================================================================


-- ── Add MCS-specific columns to overhaul_history ──────────────────────────

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS time_impact_days INTEGER;

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS schedule_impact_reason TEXT;

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS mcs_reference_id TEXT REFERENCES mcs_changes(id);

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS effective_from_date DATE;

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS estimated_recovery_date DATE;

ALTER TABLE overhaul_history
  ADD COLUMN IF NOT EXISTS is_mcs_triggered BOOLEAN DEFAULT FALSE;


-- ── Add affected_product_id column to mcs_changes (if missing) ────────────
--
-- The MCS create/edit form now stores the product UUID in affected_product_id
-- so the overhaul_history entry can be properly linked to the correct product.

ALTER TABLE mcs_changes
  ADD COLUMN IF NOT EXISTS affected_product_id UUID;


-- ── Index for fast MCS-triggered lookup ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_overhaul_mcs ON overhaul_history(mcs_reference_id);
CREATE INDEX IF NOT EXISTS idx_overhaul_mcs_triggered ON overhaul_history(is_mcs_triggered)
  WHERE is_mcs_triggered = TRUE;


-- ── Health check ──────────────────────────────────────────────────────────
--
-- After running, you should see all 6 new columns listed.

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'overhaul_history'
  AND column_name IN (
    'time_impact_days', 'schedule_impact_reason', 'mcs_reference_id',
    'effective_from_date', 'estimated_recovery_date', 'is_mcs_triggered'
  )
ORDER BY column_name;
