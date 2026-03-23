-- ============================================================================
-- hybrid_permissions_role_team_grants.sql
-- Start of hybrid permissions implementation:
-- - Single baseline role per user (profiles.role)
-- - Team-based additive grants (team_permissions via team_members)
-- - Optional normalized role catalog for future role builder UI
-- ============================================================================

-- Optional role catalog for granular role editor (future-facing).
CREATE TABLE IF NOT EXISTS roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_system    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth" ON roles;
CREATE POLICY "auth" ON roles
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS role_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id    uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  allowed    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth" ON role_permissions;
CREATE POLICY "auth" ON role_permissions
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Single-team assignment policy for now (can be relaxed later).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_members_user_unique'
  ) THEN
    ALTER TABLE team_members
      ADD CONSTRAINT team_members_user_unique UNIQUE (user_id);
  END IF;
END
$$;

-- Seed baseline roles idempotently.
INSERT INTO roles (name, display_name, is_system)
VALUES
  ('admin', 'Admin', true),
  ('editor', 'Editor', true),
  ('viewer', 'Viewer', true)
ON CONFLICT (name) DO NOTHING;

-- Seed baseline permissions for editor/viewer/admin.
WITH role_ids AS (
  SELECT id, name
  FROM roles
  WHERE name IN ('admin', 'editor', 'viewer')
),
perm_seed AS (
  SELECT 'portal_hub_view' AS permission, 'viewer' AS role_name UNION ALL
  SELECT 'portal_projects_view', 'viewer' UNION ALL
  SELECT 'portal_capacity_view', 'viewer' UNION ALL
  SELECT 'portal_operations_view', 'viewer' UNION ALL
  SELECT 'portal_production_view', 'viewer' UNION ALL
  SELECT 'portal_product_development_view', 'viewer' UNION ALL
  SELECT 'portal_action_centre_view', 'viewer' UNION ALL
  SELECT 'portal_feedback_view', 'viewer' UNION ALL
  SELECT 'portal_mcs_view', 'viewer' UNION ALL
  SELECT 'feature_view_all_project_data', 'viewer' UNION ALL
  SELECT 'data_scope_global', 'viewer' UNION ALL

  SELECT 'portal_hub_view', 'editor' UNION ALL
  SELECT 'portal_projects_view', 'editor' UNION ALL
  SELECT 'portal_capacity_view', 'editor' UNION ALL
  SELECT 'portal_operations_view', 'editor' UNION ALL
  SELECT 'portal_production_view', 'editor' UNION ALL
  SELECT 'portal_product_development_view', 'editor' UNION ALL
  SELECT 'portal_action_centre_view', 'editor' UNION ALL
  SELECT 'portal_feedback_view', 'editor' UNION ALL
  SELECT 'portal_mcs_view', 'editor' UNION ALL
  SELECT 'portal_settings_view', 'editor' UNION ALL
  SELECT 'feature_view_all_project_data', 'editor' UNION ALL
  SELECT 'feature_edit_projects_tasks_schedules', 'editor' UNION ALL
  SELECT 'feature_add_delete_records', 'editor' UNION ALL
  SELECT 'feature_manage_families', 'editor' UNION ALL
  SELECT 'feature_manage_work_areas', 'editor' UNION ALL
  SELECT 'feature_manage_capacity', 'editor' UNION ALL
  SELECT 'feature_access_settings', 'editor' UNION ALL
  SELECT 'feature_mcs_approve', 'editor' UNION ALL
  SELECT 'field_settings_permissions_edit', 'editor' UNION ALL
  SELECT 'data_scope_global', 'editor' UNION ALL

  SELECT 'portal_hub_view', 'admin' UNION ALL
  SELECT 'portal_projects_view', 'admin' UNION ALL
  SELECT 'portal_capacity_view', 'admin' UNION ALL
  SELECT 'portal_operations_view', 'admin' UNION ALL
  SELECT 'portal_production_view', 'admin' UNION ALL
  SELECT 'portal_product_development_view', 'admin' UNION ALL
  SELECT 'portal_action_centre_view', 'admin' UNION ALL
  SELECT 'portal_feedback_view', 'admin' UNION ALL
  SELECT 'portal_mcs_view', 'admin' UNION ALL
  SELECT 'portal_settings_view', 'admin' UNION ALL
  SELECT 'feature_view_all_project_data', 'admin' UNION ALL
  SELECT 'feature_edit_projects_tasks_schedules', 'admin' UNION ALL
  SELECT 'feature_add_delete_records', 'admin' UNION ALL
  SELECT 'feature_manage_families', 'admin' UNION ALL
  SELECT 'feature_manage_work_areas', 'admin' UNION ALL
  SELECT 'feature_manage_capacity', 'admin' UNION ALL
  SELECT 'feature_manage_user_roles', 'admin' UNION ALL
  SELECT 'feature_access_settings', 'admin' UNION ALL
  SELECT 'feature_mcs_approve', 'admin' UNION ALL
  SELECT 'field_settings_permissions_edit', 'admin' UNION ALL
  SELECT 'data_scope_global', 'admin'
)
INSERT INTO role_permissions (role_id, permission, allowed)
SELECT r.id, p.permission, true
FROM role_ids r
JOIN perm_seed p ON p.role_name = r.name
ON CONFLICT (role_id, permission) DO UPDATE SET allowed = EXCLUDED.allowed;
