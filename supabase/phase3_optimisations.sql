-- ════════════════════════════════════════════════════════════════════
-- Phase 3 — Server-Side Database Optimisations
-- Apply in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Run each block individually if you want to apply incrementally.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Hub list query — recency index ────────────────────────────
-- The hub loads programmes ordered by updated_at DESC.
-- This partial index makes that query a fast index-only scan.
CREATE INDEX IF NOT EXISTS idx_programmes_updated_at
  ON programmes (updated_at DESC);

-- ── 2. NPI relational query — programme_id indexes ───────────────
-- Every NPI data load filters all 15 tables by programme_id.
-- Without these indexes each load is a full sequential scan.
CREATE INDEX IF NOT EXISTS idx_npi_ctq_prog          ON npi_ctq          (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_pfd_steps_prog    ON npi_pfd_steps    (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_modes_prog  ON npi_pfmea_modes  (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_effects_prog ON npi_pfmea_effects (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_causes_prog  ON npi_pfmea_causes  (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_pfmea_history_prog ON npi_pfmea_history (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_control_plan_prog  ON npi_control_plan  (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_bom_items_prog     ON npi_bom_items     (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_bom_kits_prog      ON npi_bom_kits      (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_bom_kit_items_prog ON npi_bom_kit_items (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_gates_prog         ON npi_gates         (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_gate_sigs_prog     ON npi_gate_sigs     (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_actions_prog       ON npi_actions       (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_risks_prog         ON npi_risks         (programme_id);
CREATE INDEX IF NOT EXISTS idx_npi_gantt_rows_prog    ON npi_gantt_rows    (programme_id);

-- ── 3. Cascade deletes — NPI relational data ─────────────────────
-- Ensures that deleting a programme from the `programmes` table
-- automatically removes all associated NPI rows at the DB level.
-- This is a safety net in addition to the client-side cascade
-- already implemented in Phase 2 (npiRelDeleteAllForProgramme).
--
-- ⚠️  PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS.
--     Run the statements below one at a time.  If a constraint already
--     exists, Supabase will return "already exists" — that is safe to
--     ignore.  You can check existing constraints in the Supabase
--     dashboard: Table Editor → your table → Constraints tab, or by
--     running:
--       SELECT conname FROM pg_constraint WHERE conrelid = 'npi_ctq'::regclass;

ALTER TABLE npi_ctq
  ADD CONSTRAINT fk_npi_ctq_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_pfd_steps
  ADD CONSTRAINT fk_npi_pfd_steps_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_pfmea_modes
  ADD CONSTRAINT fk_npi_pfmea_modes_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_pfmea_effects
  ADD CONSTRAINT fk_npi_pfmea_effects_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_pfmea_causes
  ADD CONSTRAINT fk_npi_pfmea_causes_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_pfmea_history
  ADD CONSTRAINT fk_npi_pfmea_history_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_control_plan
  ADD CONSTRAINT fk_npi_control_plan_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_bom_items
  ADD CONSTRAINT fk_npi_bom_items_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_bom_kits
  ADD CONSTRAINT fk_npi_bom_kits_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_bom_kit_items
  ADD CONSTRAINT fk_npi_bom_kit_items_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_gates
  ADD CONSTRAINT fk_npi_gates_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_gate_sigs
  ADD CONSTRAINT fk_npi_gate_sigs_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_actions
  ADD CONSTRAINT fk_npi_actions_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_risks
  ADD CONSTRAINT fk_npi_risks_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

ALTER TABLE npi_gantt_rows
  ADD CONSTRAINT fk_npi_gantt_rows_prog
  FOREIGN KEY (programme_id) REFERENCES programmes(prog_id) ON DELETE CASCADE;

-- ── 4. Unique constraint — prevent duplicate ME products ─────────
-- Ensures each product_database_id appears at most once in me_products,
-- preventing accidental duplicate product capacity entries.
ALTER TABLE me_products
  ADD CONSTRAINT uq_me_product_database_id
  UNIQUE (product_database_id);
