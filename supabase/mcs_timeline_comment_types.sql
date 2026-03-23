-- ============================================================================
-- MCS Timeline: add 'comment' and 'progress_update' event types
-- Run this migration in the Supabase SQL editor to allow users to post
-- comments and progress updates to the engineering change activity log.
-- ============================================================================

-- Drop the old constraint and replace it with an expanded one.
ALTER TABLE mcs_timeline
  DROP CONSTRAINT IF EXISTS mcs_timeline_event_type_check;

ALTER TABLE mcs_timeline
  ADD CONSTRAINT mcs_timeline_event_type_check
  CHECK (event_type IN (
    'raised', 'submitted_review', 'eng_reviewed', 'qa_reviewed',
    'mfg_signed', 'authorized', 'implemented', 'rejected',
    'edited', 'impact_updated', 'linked_product', 'approved_impact',
    'comment', 'progress_update'
  ));
