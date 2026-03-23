-- ═══════════════════════════════════════════════════════════════
-- teams_table.sql — Teams and Team Permissions Tables
-- Stores teams (ME, PM, OPS, Admin, ReadOnly) and their
-- per-permission configuration.
-- Run this once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  team_type   text NOT NULL CHECK (team_type IN ('ME', 'PM', 'OPS', 'Admin', 'ReadOnly')),
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth" ON teams
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Team members (users belong to a team)
CREATE TABLE IF NOT EXISTS team_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth" ON team_members
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Team permissions
CREATE TABLE IF NOT EXISTS team_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  permission text NOT NULL,
  allowed    boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, permission)
);

ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth" ON team_permissions
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS teams_name_idx ON teams (name);
CREATE INDEX IF NOT EXISTS team_members_team_idx ON team_members (team_id);
CREATE INDEX IF NOT EXISTS team_permissions_team_idx ON team_permissions (team_id);
