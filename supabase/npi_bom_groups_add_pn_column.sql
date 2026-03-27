-- ════════════════════════════════════════════════════════════════════
-- Fix: Add missing 'pn' column to npi_bom_groups table
-- Date: 2026-03-27
-- Reason: Code expects pn column for AAW/Repair BoM groups but it was missing
-- ════════════════════════════════════════════════════════════════════

-- Add the missing pn column to npi_bom_groups
ALTER TABLE npi_bom_groups
  ADD COLUMN IF NOT EXISTS pn TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN npi_bom_groups.pn IS 'Part number associated with this BoM group';
