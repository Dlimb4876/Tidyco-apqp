# Permission Override Fix - Change Log

## Date: 2026-03-27

## Problem

The team permissions system could only **add** permissions to a user's role baseline. It was not possible to **deny** permissions that were granted by the user's role.

### Example of the Issue:
- A user with "viewer" role automatically gets `portal_operations_view: true`
- Even if their team explicitly sets `portal_operations_view: false`, they could still access Operations
- Team permissions were additive only - they couldn't override role baselines

## Solution

Modified `authLoadEffectivePermissions()` in `core/js/auth.js` to fetch **all** team permissions (both `allowed: true` and `allowed: false`) instead of only `allowed: true` entries.

## Changes Made

### File: `core/js/auth.js`

**Lines 33-47** - Changed from:

```javascript
if (assignedTeamIds.length > 0) {
  const { data: grants, error: grantsError } = await supa
    .from('team_permissions')
    .select('permission, allowed')
    .in('team_id', assignedTeamIds)
    .eq('allowed', true);  // ← Only fetched granted permissions

  if (!grantsError && Array.isArray(grants)) {
    grants.forEach((grant) => {
      const key = typeof normalizePermissionKey === 'function'
        ? normalizePermissionKey(grant.permission)
        : grant.permission;
      if (key) resolved[key] = true;  // ← Only added permissions, never removed
    });
  }
}
```

**Changed to:**

```javascript
if (assignedTeamIds.length > 0) {
  const { data: grants, error: grantsError } = await supa
    .from('team_permissions')
    .select('permission, allowed')
    .in('team_id', assignedTeamIds);  // ← Now fetches ALL permissions

  if (!grantsError && Array.isArray(grants)) {
    grants.forEach((grant) => {
      const key = typeof normalizePermissionKey === 'function'
        ? normalizePermissionKey(grant.permission)
        : grant.permission;
      if (key) {
        // Explicit denials (allowed: false) override role baseline
        // Explicit grants (allowed: true) also override
        resolved[key] = !!grant.allowed;  // ← Now applies both grants and denials
      }
    });
  }
}
```

## Key Changes:

1. **Removed** `.eq('allowed', true)` filter - now fetches all team permissions
2. **Changed** assignment logic to use `resolved[key] = !!grant.allowed`
   - If `allowed: true` → grants permission (same as before)
   - If `allowed: false` → denies permission (NEW - overrides role baseline)

## How It Works Now

1. User logs in → gets role baseline permissions (e.g., `portal_operations_view: true`)
2. Team permissions load → fetches ALL permissions for user's teams
3. Team permissions are applied on top of role baseline
4. **Explicit denials** (`allowed: false`) override role baseline grants
5. **Explicit grants** (`allowed: true`) work as before

## Permission Precedence

The final permission is determined by:

1. **Role baseline** (starting point)
2. **Team permissions** (override role baseline)
3. **Last team wins** (if multiple teams have conflicting settings)

## Example Scenarios

| User Role | Team Permission | Can Access Operations? |
|-----------|----------------|----------------------|
| viewer | (none) | ✅ Yes (inherits from role) |
| viewer | `portal_operations_view: true` | ✅ Yes (explicit grant) |
| viewer | `portal_operations_view: false` | ❌ **No** (denial overrides role) |
| editor | `portal_operations_view: false` | ❌ **No** (denial overrides role) |
| admin | `portal_operations_view: false` | ✅ Yes (admin bypass) |

## Testing

All permission-related tests pass:
- `tests/permissions-helpers.test.js` ✅
- `tests/settings-portal.test.js` ✅
- `tests/navigation.test.js` ✅
- `tests/operations-dashboard.test.js` ✅

## Impact

This change allows administrators to use the Settings → Teams permissions page to explicitly deny access to portals and features, even for users whose roles would normally grant that access. This provides more granular access control for restricted teams or special cases.

## Related Files

- `core/js/auth.js` - Modified
- `utils/js/helpers.js` - Contains permission helper functions (unchanged)
- `portals/settings/js/settings-teams.js` - Team permissions UI (unchanged)
- `portals/settings/js/teams-data.js` - Team permissions data layer (unchanged)
