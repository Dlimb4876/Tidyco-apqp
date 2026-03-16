# Families State Simplification

**Status:** ✅ Complete
**Date:** 2026-03-16

## Problem
The `getFamilies()` function in `core/js/state.js` had a confusing three-level fallback chain:

```javascript
1. familiesState.families        (modern, from Supabase)
2. db.families                   (legacy, never used)
3. FAMILIES constant             (hardcoded defaults)
```

**Issues:**
- The middle fallback to `db.families` was dead code—never written to anywhere in the codebase
- It was unclear which source was authoritative
- This confusion could lead to bugs where code reads from or writes to the wrong source

## Root Cause
During a migration from in-memory state to persistent Supabase storage, the fallback to `db.families` was left in place as a safety net. However, the migration was never completed, and `db.families` was never actually used.

## Solution
Simplified `getFamilies()` to a **two-level fallback chain**:

```javascript
1. familiesState.families        (primary: from Supabase)
2. FAMILIES constant             (fallback: at app startup)
```

**Why this works:**
- `familiesState` is defined in `portals/product-development/js/families-data.js` and populated by `familiesDataInit()` after authentication
- It will be empty at app startup, so the hardcoded `FAMILIES` constant serves as a safe default
- No code depends on `db.families` anymore (verified with `grep -rn "db\.families\s*="`)

## Changes Made

### File: `core/js/state.js` (lines 165-173)

**Before:**
```javascript
// Returns user-defined families if any exist, otherwise falls back to defaults
function getFamilies() {
  // Check new familiesState first, then old db.families, then defaults
  if (typeof familiesState !== 'undefined' && familiesState.families && familiesState.families.length > 0) {
    return familiesState.families;
  }
  return (db.families && db.families.length > 0) ? db.families : FAMILIES;
}
```

**After:**
```javascript
// Returns user-defined families from Supabase (familiesState) if populated,
// otherwise returns hardcoded defaults. familiesState is populated by
// familiesDataInit() in families-data.js after authentication.
function getFamilies() {
  if (typeof familiesState !== 'undefined' && familiesState.families && familiesState.families.length > 0) {
    return familiesState.families;
  }
  return FAMILIES; // Fallback to hardcoded defaults at startup
}
```

## Verification
✅ All tests pass (200 tests, 21 test suites)
✅ No syntax errors
✅ No ESLint violations
✅ Load order verified (families-data.js loads after state.js)

## Impact
- **Code clarity:** Single source of truth is now explicit
- **Bug prevention:** No confusion about which data source is authoritative
- **Zero breaking changes:** Behavior is identical to before (the dead code path was never taken)
- **Future migrations:** Easier to understand state flow if future changes are needed

## Follow-Up
None required. This is a pure code cleanup that removes confusing dead code.
