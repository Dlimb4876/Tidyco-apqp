# Plan: Role-Based Permissions System (v2 — Job Function Roles)

**Date:** 2026-03-18
**Replaces:** The earlier 3-tier plan (admin/editor/viewer)
**Context:** The app currently gives every logged-in user full access to everything.
A `profiles` table with a `role` column already exists. The Settings → Permissions
tab already renders a user list but does nothing yet.

---

## Plain-Language Summary

Instead of just "admin / editor / viewer", this system works like **job function
badges**. Each person gets a badge (their role). Each badge has a list of what
rooms they're allowed to enter and whether they can move the furniture once inside.

An **ME Manager** badge lets you edit ME Capacity but only *view* PM Capacity.
An **Operations** badge lets you edit the Operations dashboard but can't touch
BOMs or project details at all.

Admins can create new badge types, delete old ones, and tune exactly which rooms
each badge unlocks — all from the Settings page.

---

## The Two Building Blocks

### 1. Roles
A named job function. Examples: `ME Manager`, `Project Manager`, `Operations`,
`Production`, `Viewer`. Admins can create and delete custom roles. Two system
roles (`Admin`, `Viewer`) are locked and cannot be deleted.

### 2. Permissions
For each role, every *section* of the app is assigned one of three levels:

| Level | What it means |
|-------|--------------|
| **Edit** | Full access — can add, change, and delete |
| **View** | Read-only — can see everything but all edit/add/delete controls are hidden |
| **None** | Section is completely hidden — they don't even know it exists |

---

## Sections That Can Be Permission-Gated

| Section key | What it covers |
|-------------|---------------|
| `projects` | Project list, creating new projects |
| `project_info` | Project dashboard header, editing project details |
| `apqp` | APQP tab — CTQ, PFD, PFMEA, Control Plan |
| `bom` | Bill of Materials |
| `timing` | Timing Plan |
| `actions` | Actions tracker |
| `risks` | Risk tracker |
| `capacity_me` | ME Capacity tab |
| `capacity_pm` | PM / Projects Capacity tab |
| `capacity_production` | Production Capacity tab |
| `product_development` | Product Development — families and templates |
| `production` | Production portal |
| `operations` | Operations dashboard and forecast |
| `feedback` | Feedback portal |
| `settings_data` | Settings — work areas and families (never visible to non-admins) |

*Admin always gets Edit on every section regardless of the matrix.*

---

## Suggested Default Role Matrix

| Section | ME Mgr | Proj Mgr | Operations | Production | Viewer |
|---------|--------|----------|------------|------------|--------|
| projects | Edit | Edit | View | View | View |
| project_info | Edit | Edit | None | None | View |
| apqp | Edit | View | None | None | View |
| bom | Edit | View | None | None | View |
| timing | Edit | Edit | None | None | View |
| actions | Edit | Edit | View | View | View |
| risks | Edit | Edit | View | View | View |
| capacity_me | Edit | View | None | View | View |
| capacity_pm | View | Edit | None | View | View |
| capacity_production | View | View | None | Edit | View |
| product_development | Edit | Edit | None | None | View |
| production | View | View | None | Edit | View |
| operations | View | View | Edit | View | View |
| feedback | Edit | Edit | Edit | Edit | View |
| settings_data | None | None | None | None | None |

*Admins can change any cell in this matrix from the Settings page.*

---

## Database Changes (Supabase)

### New table: `roles`
```sql
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,        -- e.g. 'me_manager'
  display_name text NOT NULL,              -- e.g. 'ME Manager'
  is_system   boolean DEFAULT false,       -- true = cannot be deleted
  created_at  timestamptz DEFAULT now()
);

CREATE POLICY "auth" ON roles FOR ALL USING (auth.role() = 'authenticated');
```

### New table: `role_permissions`
```sql
CREATE TABLE role_permissions (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  section text NOT NULL,                   -- matches a section key above
  level   text NOT NULL CHECK (level IN ('none', 'view', 'edit'))
);

CREATE POLICY "auth" ON role_permissions
  FOR ALL USING (auth.role() = 'authenticated');
```

### Existing table: `profiles`
No schema change needed. The existing `role` text column will store the role
`name` slug (e.g. `'me_manager'`). When no profile row exists for a user, we
default to `'viewer'` at login time (safe default — they can see but not break
anything).

---

## Frontend Architecture

### New global state variables (`core/js/state.js`)
```javascript
let currentUserRole        = null;   // role slug, e.g. 'me_manager'
let currentUserPermissions = {};     // { capacity_me: 'edit', bom: 'view', ... }
```

### Role loading at login (`core/js/auth.js`)
After `currentUser = data.user`:
1. `SELECT role FROM profiles WHERE id = user.id`
2. `SELECT section, level FROM role_permissions JOIN roles ON ... WHERE roles.name = role`
3. Build `currentUserPermissions` object and store it
4. If Admin role → skip the matrix, treat every section as `'edit'`
5. On logout → reset both variables to `null` / `{}`

### Two new helper functions (`utils/js/helpers.js`)
```javascript
// Can the current user see this section at all?
function canView(section) {
  if (currentUserRole === 'admin') return true;
  const level = currentUserPermissions[section] || 'none';
  return level === 'view' || level === 'edit';
}

// Can the current user make changes in this section?
function canEdit(section) {
  if (currentUserRole === 'admin') return true;
  return currentUserPermissions[section] === 'edit';
}

function isAdmin() { return currentUserRole === 'admin'; }
```

### Navigation guards (`utils/js/navigation.js`)
Before rendering any section, check `canView(section)`. If false, render a
"You don't have access to this section" message instead. This handles direct URL
navigation attempts.

---

## Settings → Permissions Tab (Admin UI)

Split into two sub-tabs:

### Sub-tab 1: Users
*Already renders a user list — make the role column a dropdown.*
- Each user row shows their current role as a `<select>` (only visible to admins)
- Options come from the `roles` table (live query)
- On change: `UPDATE profiles SET role = ? WHERE id = ?`
- "Role change takes effect on next login" notice

### Sub-tab 2: Roles & Permissions *(new)*
A matrix table:
- **Rows** = each role (fetched from `roles` table)
- **Columns** = each of the 15 sections
- **Each cell** = a small select: `None / View / Edit`
- Changes auto-save with 800 ms debounce (matching the app's existing pattern)
- **Add Role** button → modal asking for display name → creates row in `roles` + default `view` permissions for all sections
- **Delete Role** button (only for non-system roles) → removes role; any user assigned that role falls back to `viewer`
- Admin and Viewer rows are shown but all cells are locked (greyed out)

---

## Implementation Steps (in order)

### Step 1 — Database
- Create `roles` table with system roles seeded: `admin`, `me_manager`, `project_manager`, `operations`, `production`, `viewer`
- Create `role_permissions` table and seed with the default matrix above
- Verify existing `profiles.role` column is in place (it is)

### Step 2 — State (`core/js/state.js`)
- Add `currentUserRole = null`
- Add `currentUserPermissions = {}`

### Step 3 — Auth (`core/js/auth.js`)
- On login: fetch role from `profiles`, fetch permission matrix for that role
- On logout: reset both state variables

### Step 4 — Helpers (`utils/js/helpers.js`)
- Add `canView(section)`, `canEdit(section)`, `isAdmin()`

### Step 5 — Navigation guard (`utils/js/navigation.js`)
- Before each `case` in the render switchboard, add `canView()` check
- Redirect to hub or show "Access denied" card if blocked

### Step 6 — Settings → Permissions tab (`portals/settings/js/settings.js`)
- Users sub-tab: add role dropdown (admin only)
- Roles sub-tab: add full permission matrix UI with add/delete role support
- Wire up save logic for both

### Step 7 — Portal gating (all portals)
Apply `canEdit()` / `canView()` checks portal by portal:
- Capacity: `capacity_me`, `capacity_pm`, `capacity_production` are separate checks
- Product Development: `product_development`
- NPI project views: `project_info`, `apqp`, `bom`, `timing`, `actions`, `risks`
- Production: `production`
- Operations: `operations`
- Feedback: `feedback`
- Settings families/work-areas: `settings_data`

### Step 8 — Tests
- Unit tests for `canView()` and `canEdit()` with mocked `currentUserPermissions`
- Test that `admin` always returns `true` regardless of matrix
- Test default fallback when `currentUserPermissions` is empty

---

## Impact Summary

**For users:**
- People will only see the sections their role gives them access to
- Edit/add/delete buttons vanish on read-only sections
- Nothing breaks — they just see less
- Admins control all of this from Settings without needing a developer

**For the codebase:**
- ~20–25 edit locations to gate across 7 portals (systematic but repetitive work)
- The permission loading adds one extra Supabase query per login (negligible)
- Settings page gains meaningful functionality it was designed for

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Frontend-only enforcement — a savvy user can open browser console and bypass role checks | Low (internal team) | Medium | Acceptable for now. Phase 2 could add Supabase RLS policies per role to enforce at DB level |
| Missing a portal's edit gate during implementation | Medium | Low (viewer sees one extra button) | QA pass logging in as each role type after rollout |
| Admin accidentally deletes last admin account | Low | High | UI warning + Supabase dashboard fallback to fix directly |
| Role deleted while users still assigned to it | Medium | Medium | Users fall back to 'viewer' automatically + notification |
| Login feels slower due to extra DB queries | Low | Low | Both queries are tiny; negligible on Supabase |
| New developer/AI doesn't know to add `canEdit()` to new features | Medium | Medium | Add to the New Feature Checklist in CLAUDE.md |

---

## What We Are NOT Doing (to keep scope manageable)

- No per-project permissions (everyone with access to a section sees all projects)
- No time-limited permissions
- No audit log of permission changes (could be added later)
- No enforcement at the Supabase RLS level in this phase (frontend gates only)
