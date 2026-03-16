-- Add sub_assembly_id to npi_actions and npi_risks
-- This stores which sub-assembly an action or risk is attributed to.
-- NULL means it belongs to the root project.

ALTER TABLE npi_actions
  ADD COLUMN IF NOT EXISTS sub_assembly_id TEXT DEFAULT NULL;

ALTER TABLE npi_risks
  ADD COLUMN IF NOT EXISTS sub_assembly_id TEXT DEFAULT NULL;
