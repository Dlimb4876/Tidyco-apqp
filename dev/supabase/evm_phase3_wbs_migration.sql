-- ═══════════════════════════════════════════════════════════════
-- EVM Phase 3: Work Breakdown Structure & Sub-Task Support
-- Created: 2026-03-26
--
-- 1. Create me_hub_subtasks table for WBS breakdown
-- 2. Add EVM tracking columns to me_hub_subtasks
-- 3. Add indexes for performance
-- 4. Set up RLS policies
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. me_hub_subtasks table (Work Breakdown Structure)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS me_hub_subtasks (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id    UUID          NOT NULL REFERENCES me_tasks(id) ON DELETE CASCADE,
  name              TEXT          NOT NULL,
  description       TEXT,
  
  -- Assignment
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_me_hub_subtasks_updated_at'
  ) THEN
    CREATE TRIGGER update_me_hub_subtasks_updated_at
      BEFORE UPDATE ON me_hub_subtasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS Policies (auth-only)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE me_hub_subtasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'me_hub_subtasks' AND policyname = 'auth'
  ) THEN
    CREATE POLICY "auth" ON me_hub_subtasks
      FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END
$$;
