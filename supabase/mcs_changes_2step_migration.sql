-- ============================================================================
-- MCS Changes — 2-Step Approval Migration
--
-- The original mcs_changes table was created for a 4-step approval workflow
-- (Engineering → QA → Manufacturing → Management) with statuses limited to
-- ('open', 'review', 'approved', 'implemented', 'rejected').
--
-- The process was reworked to a 2-step MCO workflow with statuses:
--   open → review → implementing → final_review → implemented / closed
--
-- The eng_review_by / qa_review_by / mfg_signoff_by / auth_implementation_by
-- columns were originally UUID FKs referencing auth.users(id).  The app now
-- stores the approver's email address (a plain text string) in these fields,
-- so the FK constraints and UUID types must be relaxed to TEXT.
--
-- Run this script once in the Supabase SQL Editor.
-- Each ALTER is idempotent-safe where possible.
-- ============================================================================

-- ── 1. Fix status CHECK constraint ────────────────────────────────────────
--
-- Old constraint only allows: 'open','review','approved','implemented','rejected'
-- New constraint adds:        'implementing','final_review','closed'
-- Legacy values 'approved' and 'rejected' are kept so old data still loads.

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
-- The column was UUID REFERENCES auth.users(id).  The app now stores the
-- approver email string, so we drop the FK and change the type.

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_eng_review_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN eng_review_by TYPE TEXT USING eng_review_by::TEXT;

-- ── 3. Relax qa_review_by to TEXT ─────────────────────────────────────────

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_qa_review_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN qa_review_by TYPE TEXT USING qa_review_by::TEXT;

-- ── 4. Relax mfg_signoff_by to TEXT ──────────────────────────────────────
--   (No longer used by the 2-step process but kept for legacy rows)

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_mfg_signoff_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN mfg_signoff_by TYPE TEXT USING mfg_signoff_by::TEXT;

-- ── 5. Relax auth_implementation_by to TEXT ───────────────────────────────

ALTER TABLE mcs_changes
  DROP CONSTRAINT IF EXISTS mcs_changes_auth_implementation_by_fkey;

ALTER TABLE mcs_changes
  ALTER COLUMN auth_implementation_by TYPE TEXT USING auth_implementation_by::TEXT;

-- ── 6. Verify ─────────────────────────────────────────────────────────────
-- Run this query after applying to confirm the constraint is correct:
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'mcs_changes'::regclass
--   AND contype = 'c';
