# Plan: Full Capacity Department Split

## Context

All four capacity streams (ME, PM, Logistics, Unit 6) currently share five Supabase tables (`me_teams`, `me_tasks`, `me_products`, `me_holidays`, `me_product_support_history`). Rows are distinguished only by a `department` column. Two save routines use a **delete-all-by-user-then-reinsert** pattern with no department filter:

- **Holidays** (`meDataSave` line 1031): `DELETE FROM me_holidays WHERE user_id = ?` then re-inserts from memory. If one department's holidays were not loaded into `meDataState`, they are permanently lost.
- **Product support history** (`meSaveProductSupportHistoryRelational` line 305): same delete-all-then-reinsert pattern on `me_product_support_history`.

This is why holidays have been deleted four times.

This plan creates separate, isolated tables for each department and wires each to its own JavaScript data layer. After this change, touching PM data is physically impossible to affect ME data.

---

## End State

| Department | Tables |
|---|---|
| ME | `me_teams`, `me_tasks`, `me_products`, `me_holidays`, `me_product_support_history` (existing — cleaned to ME-only) |
| PM | `pm_teams`, `pm_tasks`, `pm_products`, `pm_holidays`, `pm_product_support_history` (new) |
| Logistics | `log_teams`, `log_tasks`, `log_products`, `log_holidays`, `log_product_support_history` (new) |
| Unit 6 | `unit6_teams`, `unit6_tasks`, `unit6_products`, `unit6_holidays`, `unit6_product_support_history` (new) |

No visual changes. Same UI, same tabs, same features.

---

## Execution Order

> **Phase 2 is the point of no return.** All JS work happens before or after Phase 2 is reached. The database migration runs first without any code changes, so the app is unaffected until Phase 4.

---

## Phase 1 — Database: Create new tables and copy existing data

**File to create:** `supabase/capacity_dept_split.sql`

**What it does:**
1. Creates new `pm_*`, `log_*`, `unit6_*` tables — schema derived from the `me_*` counterparts, each with a `CHECK (department IN ('PM'))` / `('LOG')` / `('UNIT6')` constraint so wrong data can never slip in.
   - **All `*_product_support_history` tables** include the full breakdown columns (`kitting_hours`, `booking_in_out_hours`, `kitting_time_booking_hours`, `product_movement_hours`). ME's table already has these columns (added by `logistics_product_support_history_split.sql`) — they stay zero for ME. The same split-field UI and `meNormalizeProductSupportBreakdown()` logic applies unchanged.
2. RLS policy on each new table: `FOR ALL USING (auth.role() = 'authenticated')`.
3. Copies existing rows via `INSERT ... SELECT ... WHERE department = 'PM'` (and `'LOG'`, `'UNIT6'`) with `ON CONFLICT DO NOTHING`.

**Known gap — products for LOG and UNIT6:**
`meNormalizePersistedProductDepartment()` (me-data-relational.js line 28–31) currently hardcodes `return normalized === 'PM' ? 'PM' : 'ME'`, so **all LOG and UNIT6 products are stored as `'ME'` in `me_products`**. The data copy `WHERE department='LOG'` will return 0 product rows. This is expected and harmless:
- LOG/UNIT6 products are auto-synced from the central product database on every render via `meDataAutoSyncLogProducts()` / `meDataAutoSyncUnit6Products()`.
- After the split, each department's `*DataInit` will auto-sync products into its own table on first load.
- `pm_products` will copy correctly (PM products are stored with `department='PM'`).
- `log_products` and `unit6_products` will start empty and auto-populate.

**Verification queries** — confirm row counts match for tables that have department-tagged data:
```sql
-- These should match:
SELECT COUNT(*) FROM me_teams WHERE department='PM';
SELECT COUNT(*) FROM pm_teams;

SELECT COUNT(*) FROM me_tasks WHERE department='PM';
SELECT COUNT(*) FROM pm_tasks;

SELECT COUNT(*) FROM me_holidays WHERE department='PM';
SELECT COUNT(*) FROM pm_holidays;

SELECT COUNT(*) FROM me_product_support_history WHERE department='PM';
SELECT COUNT(*) FROM pm_product_support_history;

-- Products: PM should match, LOG/UNIT6 will be 0 (expected):
SELECT COUNT(*) FROM me_products WHERE department='PM';
SELECT COUNT(*) FROM pm_products;

SELECT COUNT(*) FROM me_products WHERE department='LOG';   -- expected: 0
SELECT COUNT(*) FROM me_products WHERE department='UNIT6'; -- expected: 0
```

Repeat for LOG and UNIT6 on teams, tasks, holidays, and product_support_history.

**No data is deleted in this phase. The app runs unchanged.**

---

## Phase 2 — Database: Clean ME tables (point of no return)

**Prerequisite:** Phase 1 verification queries must show matching row counts for all departments (except LOG/UNIT6 products, which are expected to be 0).

1. Create backup snapshots: `CREATE TABLE _backup_me_holidays_pre_split AS SELECT * FROM me_holidays;` (repeated for all 5 tables).
2. Delete non-ME rows: `DELETE FROM me_holidays WHERE department != 'ME';` (repeated for all 5 tables).
3. Add CHECK constraints to lock ME tables to ME-only forever: `ADD CONSTRAINT CHECK (department IN ('ME'))`.

**Rollback:** Restore from `_backup_*` tables, revert JS in git.

---

## Phase 3 — JavaScript: New data modules (6 new files)

Each department gets its own relational loader and state manager, modelled on `me-data-relational.js` and `me-data.js`.

**New files:**

| File | What it does |
|---|---|
| `portals/capacity/project-management/js/pm-data-relational.js` | Loads/saves from `pm_*` tables. Functions: `pmLoadRelationalTeams`, `pmLoadRelationalTasks`, `pmLoadRelationalHolidays`, `pmSaveTaskRelational`, `pmDeleteHolidayRelational`, etc. The holiday delete is scoped to `pm_holidays` only — cross-dept wipe is now physically impossible. |
| `portals/capacity/project-management/js/pm-data.js` | State manager for PM. `window.pmDataState = { team, tasks, products, holidays, productSupportHistory }`. Functions: `pmDataInit`, `pmDataSave`, `pmDataSubscribe`, and all CRUD getters/setters prefixed `pmData*`. |
| `portals/capacity/logistics/js/log-data-relational.js` | Loads/saves from `log_*` tables including `log_product_support_history`. Includes `logLoadRelationalProductSupportHistory` and `logSaveProductSupportHistoryRelational` — identical to the ME versions but targeting LOG tables and persisting all four breakdown columns (`kitting_hours`, `booking_in_out_hours`, `kitting_time_booking_hours`, `product_movement_hours`). |
| `portals/capacity/logistics/js/log-data.js` | State manager for Logistics. `window.logDataState = { team, tasks, products, holidays, productSupportHistory }`. Includes `logDataAutoSyncLogProducts` and `logDataAddProductSupportHistory`. |
| `portals/capacity/unit6/js/unit6-data-relational.js` | Same as log-data-relational, targeting `unit6_*` tables including `unit6_product_support_history` with the same full breakdown column set. |
| `portals/capacity/unit6/js/unit6-data.js` | State manager for Unit 6. `window.unit6DataState` — same shape as `logDataState`. |

Shared utility functions (`meNormalizeDepartmentTag`, `meFilterByDepartment`, `meNormalizeProductSupportBreakdown`, etc.) remain in `me-data.js` — they are utility functions, not ME-specific. New data modules call these directly (dependency: me-data.js must load first).

**Each new `*-data.js` must replicate these patterns from `me-data.js`:**
- Save-in-progress guard (`pmDataSaveInProgress` / `pmDataSaveQueued`)
- Pending-deletes queue (`pmDataPendingDeletes`)
- Products-first save order (FK dependencies: products → support history → tasks)
- Holiday save: delete-all-for-user then re-insert (safe now because each table is single-department)
- `setSyncBadge` calls for save status
- `flush*DataNow()` function registered on `beforeunload` for unsaved data

**Each new `*-data.js` must include realtime subscriptions:**
- `pmDataSubscribe()` subscribes to `pm_teams`, `pm_tasks`, `pm_products`, `pm_holidays`, `pm_product_support_history`
- Same for LOG and UNIT6 with their respective tables
- Follows same pattern as `meDataSubscribe()` in me-data.js (skip own-save echoes, normalize incoming records)

---

## Phase 4 — JavaScript: Wire new modules into orchestrators

**Files to update:**

### `portals/capacity/project-management/js/pm-capacity.js`
- `pmGetData()` — replace `meDataGetTeam()` / `meDataGetTasks()` / filtered calls with direct `pmDataGetTeam()`, `pmDataGetTasks()`, `pmDataGetProducts()`, `pmDataGetHolidays()`.
- `pmOnSave()` / `pmDebouncedSave()` — call `pmDataSave(...)` instead of `meDataSave(...)`.
- `pmRenderCapacity()` — call `pmDataAutoSyncPMProducts()` instead of `meDataAutoSyncPMProducts()`.
- `pmRenderCapacity()` — call `pmDataInit()` instead of relying on `meDataInit()` having loaded PM data.

### `portals/capacity/project-management/js/pm-capacity-data.js`
- Update `window.pmCapacityData.getTasks()` / `getTeam()` / `getProducts()` to delegate to `pmDataGetTeam()` etc. instead of filtering from `meDataState`. Verify no other files call `pmCapacityData` methods before changing the API.

### `portals/capacity/logistics/js/log-capacity.js`
- `logGetData()` — replace `meDataGet*` + filter calls with `logDataGetTeam()`, `logDataGetTasks()`, `logDataGetProducts()`, `logDataGetHolidays()`.
- Product support history: the render call that currently reads from shared `meDataState.productSupportHistory` filtered to 'LOG' must now read from `logDataState.productSupportHistory`. The `meNormalizeProductSupportBreakdown()` utility and the split-field render columns in `me-products.js` are unchanged — they already behave correctly based on department context.
- `logOnSave()` / `logDebouncedSave()` — call `logDataSave(...)`.
- Remove `logFilterByDepartment()` — no longer needed; data is already pure.
- `logRenderCapacity()` — call `logDataInit()` instead of relying on `meDataInit()`.

### `portals/capacity/unit6/js/unit6-capacity.js`
- Same changes as Logistics above, using `unit6Data*` functions.

### Chart and heatmap functions: `portals/capacity/js/me-chart.js` and `portals/capacity/js/me-heatmap.js`

**Problem:** `meDrawChartNow()` (me-chart.js line 324) and `meDrawHeatmapNow()` (me-heatmap.js line 52) currently read data via `meDataGetTeam()`, `meDataGetTasks()`, etc., which return from `meDataState`. After the split, `meDataState` only contains ME data, so PM/LOG/UNIT6 charts will render empty.

**Fix:** Update both functions to check `window.meCurrentDepartmentContext` and read from the correct state:
```javascript
// At top of meDrawChartNow / meDrawHeatmapNow:
const dept = window.meCurrentDepartmentContext || 'ME';
let team, tasks, products, holidays;
if (dept === 'PM' && window.pmDataGetTeam) {
  team = pmDataGetTeam(); tasks = pmDataGetTasks();
  products = pmDataGetProducts(); holidays = pmDataGetHolidays();
} else if (dept === 'LOG' && window.logDataGetTeam) {
  team = logDataGetTeam(); tasks = logDataGetTasks();
  products = logDataGetProducts(); holidays = logDataGetHolidays();
} else if (dept === 'UNIT6' && window.unit6DataGetTeam) {
  team = unit6DataGetTeam(); tasks = unit6DataGetTasks();
  products = unit6DataGetProducts(); holidays = unit6DataGetHolidays();
} else {
  team = meFilterByDepartment(meDataGetTeam(), dept, 'ME');
  // ... existing pattern for ME
}
```

This replaces the current pattern of `meFilterByDepartment(meDataGetTeam(), dept, 'ME')` which will no longer work for non-ME departments.

---

## Phase 5 — JavaScript: Clean up ME data layer

**File: `portals/capacity/js/me-data.js`**
- Remove `window.meDataAutoSyncPMProducts`, `meDataAutoSyncLogProducts`, `meDataAutoSyncUnit6Products` — now owned by their respective data modules.
- Simplify `meGetDepartmentFromContext()` — ME functions are only ever called from ME context now; remove the `capacityTab === 'projects'` branch.
- `meDataAutoSyncDepartmentProducts` can be simplified to always pass `'ME'`.
- Simplify `meDataSave` holiday delete — it now only affects ME holidays (safe by definition), but the pattern doesn't need to change.

**File: `portals/capacity/js/me-data-relational.js`**
- `meNormalizePersistedProductDepartment()` can be simplified to always return `'ME'` (ME table is ME-only now).

---

## Phase 6 — index.html: Add new script tags

Add 6 new `<script>` tags **after `me-capacity.js` (line 617) and before `pm-capacity-data.js` (line 627)**. The new data modules depend on `me-data.js` (for shared utilities) but not on any ME UI scripts. Placing them after the full ME block keeps the logical grouping clean.

```html
<!-- PM data layer -->
<script src="portals/capacity/project-management/js/pm-data-relational.js"></script>
<script src="portals/capacity/project-management/js/pm-data.js"></script>
<!-- LOG data layer -->
<script src="portals/capacity/logistics/js/log-data-relational.js"></script>
<script src="portals/capacity/logistics/js/log-data.js"></script>
<!-- UNIT6 data layer -->
<script src="portals/capacity/unit6/js/unit6-data-relational.js"></script>
<script src="portals/capacity/unit6/js/unit6-data.js"></script>
```

These must load **before** their respective orchestrators (`pm-capacity-data.js`, `pm-capacity.js`, `log-capacity.js`, `unit6-capacity.js`).

---

## Phase 7 — Tests

**Tests to update:**
- `tests/capacity-hub.test.js` — no changes needed (hub is unaffected)
- `tests/pm-capacity-data.test.js` — replace `meData*` mocks with `pmData*` mocks; remove `meFilterByDepartment` assertion
- Any LOG/UNIT6 test files — same mock swap pattern

**New tests to create:**
- `tests/pm-data-relational.test.js` — verify `pmSave*` targets `pm_*` tables; verify holiday delete is scoped to `pm_holidays` only
- `tests/log-data-relational.test.js` — same for LOG
- `tests/unit6-data-relational.test.js` — same for UNIT6

**Validation command after all phases:** `npm run check:all`

---

## Critical Files

| File | Role |
|---|---|
| `portals/capacity/js/me-data-relational.js` | Template for all new `*-data-relational.js` files |
| `portals/capacity/js/me-data.js` | Template for all new `*-data.js` state managers |
| `portals/capacity/js/me-chart.js` | Chart rendering — must be updated to read from correct department state (Phase 4) |
| `portals/capacity/js/me-heatmap.js` | Heatmap rendering — same update as me-chart.js (Phase 4) |
| `portals/capacity/project-management/js/pm-capacity.js` | Primary orchestrator to update in Phase 4 |
| `portals/capacity/project-management/js/pm-capacity-data.js` | PM data adapter — update to use `pmData*` functions |
| `portals/capacity/logistics/js/log-capacity.js` | Logistics orchestrator to update |
| `portals/capacity/unit6/js/unit6-capacity.js` | Unit 6 orchestrator to update |
| `index.html` | Script load order update in Phase 6 |
| `supabase/capacity_dept_split.sql` | New migration file (Phase 1 + 2) |

---

## Changelog Entry (to add after completion)

```
## 2026-03-24 | Full capacity department split | Each department now has isolated tables — prevents cross-dept data loss
```
