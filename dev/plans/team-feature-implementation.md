# Team Management Feature Implementation Plan

> **Status: ✅ COMPLETE — Implemented 2026-03-19**

## Overview
Add team-based organization to the Settings page, allowing admins to group users and configure permissions at the team level.

## Database Schema

### 1. `teams` Table
Stores team definitions.

```sql
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_type TEXT NOT NULL CHECK (team_type IN ('ME', 'PM', 'OPS', 'Admin', 'ReadOnly')),
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE POLICY "teams_auth" ON teams
FOR ALL
USING (auth.role() = 'authenticated');

CREATE INDEX idx_teams_team_type ON teams(team_type);
```

### 2. `team_permissions` Table
Stores what each team can do. Fixed rows, editable values.

```sql
CREATE TABLE IF NOT EXISTS team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, permission)
);

CREATE POLICY "team_permissions_auth" ON team_permissions
FOR ALL
USING (auth.role() = 'authenticated');

CREATE INDEX idx_team_permissions_team_id ON team_permissions(team_id);
```

### 3. Update `profiles` Table
Add team assignment (optional, can remain NULL for individual role-based access).

```sql
ALTER TABLE profiles
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_team_id ON profiles(team_id);
```

## Permission Structure

Each team has these permissions (rows in `team_permissions`):
- `view_all_project_data` - boolean
- `edit_projects_tasks_schedules` - boolean
- `add_delete_records` - boolean
- `manage_families` - boolean
- `manage_work_areas` - boolean
- `manage_capacity` - boolean
- `manage_user_roles` - boolean (admin only)
- `access_settings` - boolean (admin only)

### Default Team Definitions

When teams are first created, populate with default permissions:

**ME Team**: Manufacturing Engineering focused
- view_all_project_data: true
- edit_projects_tasks_schedules: true
- add_delete_records: true
- manage_families: false
- manage_work_areas: true
- manage_capacity: true
- manage_user_roles: false
- access_settings: false

**PM Team**: Project Management focused
- view_all_project_data: true
- edit_projects_tasks_schedules: true
- add_delete_records: true
- manage_families: false
- manage_work_areas: false
- manage_capacity: true
- manage_user_roles: false
- access_settings: false

**OPS Team**: Operations/Quality focused
- view_all_project_data: true
- edit_projects_tasks_schedules: false
- add_delete_records: false
- manage_families: false
- manage_work_areas: false
- manage_capacity: false
- manage_user_roles: false
- access_settings: false

**Admin Team**: Full access
- view_all_project_data: true
- edit_projects_tasks_schedules: true
- add_delete_records: true
- manage_families: true
- manage_work_areas: true
- manage_capacity: true
- manage_user_roles: true
- access_settings: true

**ReadOnly Team**: View-only access
- view_all_project_data: true
- edit_projects_tasks_schedules: false
- add_delete_records: false
- manage_families: false
- manage_work_areas: false
- manage_capacity: false
- manage_user_roles: false
- access_settings: false

## Frontend Implementation

### State Variables (in `state.js`)

```javascript
let teamsState = {
  teams: [],
  teamPermissions: {},  // { teamId: [permissions] }
  loading: false,
  error: null
};

let settingsTeamsEditingId = null;
let settingsTeamsPermissionsEditingId = null;
```

### Settings Sidebar Update
Add new tab in sidebar:
```
🏢 Teams  (new)
```

### Teams Tab Layout

**Two sections:**

1. **Teams List**
   - Table: Team Name | Team Type | Users | Edit/Delete buttons
   - Add Team button
   - Shows count of users in each team

2. **Team Permissions Editor**
   - When editing a team, show permission matrix
   - Rows: 8 permissions (same as Role Definitions)
   - Columns: Checkbox for Allowed/Not Allowed
   - Save button to persist changes

### Functions to Implement

#### Data Loading
- `settingsEnsureTeamsData()` - Load teams and permissions
- `teamsDataLoadAll()` - Fetch all teams
- `teamsDataLoadPermissions(teamId)` - Load permissions for team

#### Teams CRUD
- `settingsTeamsAdd()` - Create new team
- `settingsTeamsStartEdit(teamId)` - Enter edit mode
- `settingsTeamsDelete(teamId)` - Delete team
- `settingsTeamsCancelEdit()` - Cancel editing

#### Permissions Management
- `settingsTeamPermissionsStart(teamId)` - Open permission editor
- `settingsTeamPermissionsToggle(teamId, permission)` - Toggle a permission
- `settingsTeamPermissionsSave(teamId)` - Save all changes for team

#### Database Operations (in db.js)
- `teamsDataAdd(team)` - Insert team
- `teamsDataUpdate(teamId, updates)` - Update team
- `teamsDataDelete(teamId)` - Delete team
- `teamPermissionsDataGet(teamId)` - Fetch permissions for team
- `teamPermissionsDataUpdate(teamId, permissions)` - Save all permissions

### HTML Structure

```html
<div class="settings-section-header">
  <h2>Teams</h2>
  <p>Organize users by department and manage group permissions.</p>
</div>

<!-- Teams List Table -->
<div class="settings-teams-list">
  <button class="btn btn-primary" data-action="settings-teams-add">+ Add Team</button>
  <table class="prod-tbl">
    <thead>
      <tr>
        <th>Team Name</th>
        <th>Type</th>
        <th>Users</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <!-- rows here -->
    </tbody>
  </table>
</div>

<!-- Team Permissions Editor (shown when editing) -->
<div class="settings-team-permissions-editor" id="teamPermissionsEditor" style="display:none">
  <h3>Edit Permissions: <span id="teamPermissionsTitle"></span></h3>
  <table class="permission-matrix">
    <thead>
      <tr>
        <th>Permission</th>
        <th>Allowed</th>
      </tr>
    </thead>
    <tbody>
      <!-- permission rows -->
    </tbody>
  </table>
  <div style="margin-top:16px">
    <button class="btn btn-primary" data-action="settings-team-permissions-save">Save</button>
    <button class="btn btn-ghost" data-action="settings-team-permissions-cancel">Cancel</button>
  </div>
</div>
```

### CSS Classes
- `.settings-teams-list` - Teams table container
- `.settings-team-permissions-editor` - Permission matrix editor
- `.permission-matrix` - Permission checkbox table
- `.permission-row` - Individual permission row
- `.permission-checkbox` - Checkbox styling

### Event Delegation
All team actions use data-action attributes:
- `settings-teams-add` - Add new team
- `settings-teams-edit-{id}` - Edit team (shows permissions editor)
- `settings-teams-delete-{id}` - Delete team
- `settings-team-permissions-toggle-{permission}` - Toggle checkbox
- `settings-team-permissions-save` - Save changes
- `settings-team-permissions-cancel` - Cancel editing

## Mobile Responsiveness

### Mobile (<768px)
- Teams table: horizontal scroll if needed
- Permission matrix: stack vertically or use 2-column layout
- Buttons: full width for touch targets

### Desktop (≥768px)
- Teams table: normal layout
- Permission matrix: side-by-side columns
- Buttons: inline

## Testing

### New Tests in `tests/settings-portal.test.js`

```javascript
describe('Teams Management', () => {
  it('should display teams list', () => { });
  it('should add a new team', () => { });
  it('should edit team permissions', () => { });
  it('should delete a team', () => { });
  it('should toggle team permissions', () => { });
  it('should prevent deletion of team with users', () => { });
  it('should show team member count', () => { });
  it('should populate default team types', () => { });
});
```

## Integration Points

1. **Permissions Tab** - May need to show team assignment option for users
2. **Authentication** - When accessing the app, check user's team permissions (in auth.js)
3. **Navigation** - Teams could filter/scope certain portals by team
4. **Real-time** - Subscribe to team changes

## Rollout Plan

1. Create database tables (manual SQL in Supabase console)
2. Add state variables to `state.js`
3. Add database functions to `db.js`
4. Create Teams tab UI in `settings.js`
5. Implement team CRUD operations
6. Implement permission management UI
7. Add tests
8. Mobile responsiveness testing
9. Update CHANGELOG

## Success Criteria

- ✅ Teams can be created, edited, deleted
- ✅ Team types default to: ME, PM, OPS, Admin, ReadOnly
- ✅ Each team has customizable permissions (8 items)
- ✅ Users can be assigned to teams
- ✅ Permission matrix displays correctly
- ✅ Mobile-first CSS works on all breakpoints
- ✅ All tests pass
- ✅ No XSS vulnerabilities (use `esc()` for all user input)
