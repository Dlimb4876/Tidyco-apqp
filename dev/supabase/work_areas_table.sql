-- ═══════════════════════════════════════════════════════════════
-- work_areas_table.sql — Work Areas Table
-- Stores named work areas (e.g. Unit 2, Unit 3, Unit 6) used
-- across Production scheduling and Operations forecasting.
-- Run this once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;

-- RLS: authentication-only (all authenticated users see all rows)
CREATE POLICY "auth" ON work_areas
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for name ordering
CREATE INDEX IF NOT EXISTS work_areas_name_idx ON work_areas (name);

-- Seed default work areas (safe to re-run — uses INSERT ... WHERE NOT EXISTS)
INSERT INTO work_areas (name, description)
SELECT 'Unit 2', 'Production Unit 2'
WHERE NOT EXISTS (SELECT 1 FROM work_areas WHERE name = 'Unit 2');

INSERT INTO work_areas (name, description)
SELECT 'Unit 3', 'Production Unit 3'
WHERE NOT EXISTS (SELECT 1 FROM work_areas WHERE name = 'Unit 3');

INSERT INTO work_areas (name, description)
SELECT 'Unit 6', 'Production Unit 6'
WHERE NOT EXISTS (SELECT 1 FROM work_areas WHERE name = 'Unit 6');
