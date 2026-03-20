-- ============================================================================
-- MCS Changes — 2-Step Approval Migration
-- ============================================================================
--
-- WHY THIS SCRIPT EXISTS
-- ----------------------
-- The original mcs_changes table (plans/mcs-database-migration.sql) was built
-- for a 4-step approval workflow.  The app now uses a 2-step MCO workflow with
-- different status values and stores approver names as email text (not UUIDs).
-- Without this migration the DB rejects any approve/reject action with a
-- constraint violation, causing the "could not approve" error.
--
-- WHAT IT DOES
-- ------------
-- 1. Expands the status CHECK to include the 2-step values
-- 2. Relaxes eng_review_by / qa_review_by (and legacy columns) from UUID FK to TEXT
-- 3. Ensures global_settings exists for MCS approver config (CREATE IF NOT EXISTS)
-- 4. Prints a quick health-check at the end so you can confirm it worked
--
-- HOW TO RUN
-- ----------
-- Paste the entire script into the Supabase SQL Editor and click Run.
-- It is safe to run more than once — all operations are idempotent.
-- ============================================================================


-- ── 1. Fix status CHECK constraint ────────────────────────────────────────
--
-- Old values: 'open','review','approved','implemented','rejected'
-- New values also needed: 'implementing','final_review','closed'
-- Legacy values 'approved' and 'rejected' are kept so old rows still load.

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_status_check;

ALTER TABLE mcs_changes
  ADD CONSTRAINT mcs_changes_status_check
  CHECK (status IN (
    'open',
    'review',
    'implementing',
    'final_review',
    'implemented',
    'closed',
    -- legacy values (kept for backwards compatibility with old rows)
    'approved',
    'rejected'
  ));


-- ── 2. Relax eng_review_by to TEXT ────────────────────────────────────────
--
-- The column was UUID REFERENCES auth.users(id).
-- The app now stores the approver's email string, so the FK and type must change.

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_eng_review_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN eng_review_by TYPE TEXT USING eng_review_by::TEXT;


-- ── 3. Relax qa_review_by to TEXT ─────────────────────────────────────────

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_qa_review_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN qa_review_by TYPE TEXT USING qa_review_by::TEXT;


-- ── 4. Relax legacy columns to TEXT ───────────────────────────────────────
--   (mfg_signoff_by and auth_implementation_by are not used by the 2-step
--    process but may exist in old rows — relax them so old data still loads.)

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_mfg_signoff_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN mfg_signoff_by TYPE TEXT USING mfg_signoff_by::TEXT;

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_auth_implementation_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN auth_implementation_by TYPE TEXT USING auth_implementation_by::TEXT;


-- ── 5. Ensure global_settings table exists ────────────────────────────────
--
-- MCS stores the assigned approvers in global_settings under the keys
-- 'mcs_approver_approval1' and 'mcs_approver_approval2'.  The table is also
-- used by Production Capacity — this CREATE is a no-op if it already exists.

CREATE TABLE IF NOT EXISTS global_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at  TIMESTAMP DEFAULT now()
);

-- Enable RLS if it isn't on yet (safe to call again if already enabled)
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'global_settings' AND policyname = 'auth'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "auth" ON global_settings
      FOR ALL USING (auth.role() = 'authenticated')
    $policy$;
  END IF;
END
$$;


-- ── 6. Health check ───────────────────────────────────────────────────────
--
-- Run this SELECT after applying; you should see all 8 status values listed
-- and the column types for eng_review_by / qa_review_by should be 'text'.

SELECT
  'status constraint values' AS check_name,
  string_agg(enumlabel::TEXT, ', ' ORDER BY enumsortorder) AS result
FROM (
  SELECT DISTINCT unnest(string_to_array(
    regexp_replace(
      pg_get_constraintdef(oid),
      $$.*IN \((.+)\).*$$, $$\1$$
    ),
    ', '
  )) AS enumlabel,
  row_number() OVER () AS enumsortorder
  FROM pg_constraint
  WHERE conrelid = 'mcs_changes'::regclass
    AND conname = 'mcs_changes_status_check'
) x

UNION ALL

SELECT
  'eng_review_by type' AS check_name,
  data_type AS result
FROM information_schema.columns
WHERE table_name = 'mcs_changes' AND column_name = 'eng_review_by'

UNION ALL

SELECT
  'qa_review_by type' AS check_name,
  data_type AS result
FROM information_schema.columns
WHERE table_name = 'mcs_changes' AND column_name = 'qa_review_by'

UNION ALL

SELECT
  'global_settings exists' AS check_name,
  CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END AS result
FROM information_schema.tables
WHERE table_name = 'global_settings';
