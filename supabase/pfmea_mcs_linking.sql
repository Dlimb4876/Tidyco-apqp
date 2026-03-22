-- ════════════════════════════════════════════════════════════════════
-- PFMEA ↔ MCS Change Linking
-- Add bidirectional traceability between PFMEA actions and MCS changes
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Add ECR reference to PFMEA actions ────────────────────────────
-- Stores the related ECR/MCS change ID for display in PFMEA action view
ALTER TABLE npi_pfmea_causes
  ADD COLUMN IF NOT EXISTS action_related_ecr_id TEXT;

-- ── 2. Add ECR traceability to PFMEA history ─────────────────────────
-- Links history entries back to the MCS change that prompted them
ALTER TABLE npi_pfmea_history
  ADD COLUMN IF NOT EXISTS related_ecr_id TEXT;

-- ── 3. Index for PFMEA history ECR lookups ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_history_ecr
  ON npi_pfmea_history(related_ecr_id);

-- ── 4. Index for PFMEA causes ECR lookups ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_causes_action_ecr
  ON npi_pfmea_causes(action_related_ecr_id);
