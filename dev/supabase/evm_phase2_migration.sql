-- ═══════════════════════════════════════════════════════════════
-- EVM Phase 2: Foundation & Data Layer
-- Created: 2026-03-26
--
-- 1. Add percent_complete to me_tasks and pm_tasks
-- 2. Create time_logs table (actuals tracking)
-- 3. Add capacity_task_id FK to npi_actions
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. percent_complete column
-- ─────────────────────────────────────────────────────────────

ALTER TABLE me_tasks
  ADD COLUMN IF NOT EXISTS percent_complete INTEGER NOT NULL DEFAULT 0
    CHECK (percent_complete >= 0 AND percent_complete <= 100);

ALTER TABLE pm_tasks
  ADD COLUMN IF NOT EXISTS percent_complete INTEGER NOT NULL DEFAULT 0
    CHECK (percent_complete >= 0 AND percent_complete <= 100);

-- ─────────────────────────────────────────────────────────────
-- 2. time_logs table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS time_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id       UUID        NOT NULL,   -- references me_tasks.id (loose FK — also supports npi_actions in future)
  hours_logged  NUMERIC(6,2) NOT NULL CHECK (hours_logged > 0),
  log_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns (see Phase 5 performance note)
CREATE INDEX IF NOT EXISTS time_logs_task_id_idx  ON time_logs (task_id);
CREATE INDEX IF NOT EXISTS time_logs_log_date_idx ON time_logs (log_date);
CREATE INDEX IF NOT EXISTS time_logs_user_id_idx  ON time_logs (user_id);

-- RLS: auth-only (all authenticated users can read all logs)
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'time_logs' AND policyname = 'auth'
  ) THEN
    CREATE POLICY "auth" ON time_logs
      FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. capacity_task_id on npi_actions
-- ─────────────────────────────────────────────────────────────

ALTER TABLE npi_actions
  ADD COLUMN IF NOT EXISTS capacity_task_id UUID REFERENCES me_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS npi_actions_capacity_task_id_idx ON npi_actions (capacity_task_id);
