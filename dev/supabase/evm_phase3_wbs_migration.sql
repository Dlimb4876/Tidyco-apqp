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
  assignee_id       UUID          REFERENCES me_teams(id) ON DELETE SET NULL,
  
  -- Scheduling
  start_date        DATE,
  end_date          DATE,
  
  -- EVM Core Fields
  planned_hours     NUMERIC(8,2)  NOT NULL DEFAULT 0 CHECK (planned_hours >= 0),
  percent_complete  INTEGER       NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  
  -- Status
  status            TEXT          NOT NULL DEFAULT 'NOT_STARTED' 
                                    CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'ON_HOLD')),
  
  -- Ordering within parent task
  sort_order        INTEGER       NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS me_hub_subtasks_parent_id_idx ON me_hub_subtasks (parent_task_id);
CREATE INDEX IF NOT EXISTS me_hub_subtasks_assignee_idx  ON me_hub_subtasks (assignee_id);
CREATE INDEX IF NOT EXISTS me_hub_subtasks_status_idx    ON me_hub_subtasks (status);

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger to auto-update updated_at
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
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

-- ─────────────────────────────────────────────────────────────
-- 4. View for EVM Summary (rolled up by parent task)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW me_hub_evm_summary AS
SELECT 
  t.id AS task_id,
  t.name AS task_name,
  t.total_hours AS task_bac,
  t.percent_complete AS task_percent_complete,
  
  -- Subtask aggregates
  COUNT(s.id) AS subtask_count,
  COALESCE(SUM(s.planned_hours), 0) AS subtasks_planned_hours,
  
  -- Weighted average of subtask completion
  CASE 
    WHEN COUNT(s.id) = 0 THEN t.percent_complete
    ELSE ROUND(
      SUM(s.planned_hours * s.percent_complete) / NULLIF(SUM(s.planned_hours), 0)
    )
  END AS weighted_percent_complete,
  
  -- Actuals from time_logs (by task_id for now - could be by subtask later)
  COALESCE(
    (SELECT SUM(hours_logged) FROM time_logs WHERE task_id = t.id),
    0
  ) AS actual_hours

FROM me_tasks t
LEFT JOIN me_hub_subtasks s ON s.parent_task_id = t.id
GROUP BY t.id, t.name, t.total_hours, t.percent_complete;

COMMENT ON VIEW me_hub_evm_summary IS 
  'Rolls up subtask data with EVM calculations for parent tasks. Used by Management View.';
