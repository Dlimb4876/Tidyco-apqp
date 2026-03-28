# Plan: Capacity Independence — Eliminate Cross-Department Coupling

## Summary

Restructure the capacity portal so ME, PM, LOG, and UNIT6 are fully independent with zero sideways data flow. Shared utilities, components, and renderers move to `portals/capacity/shared/` with generic `cap*` names. Each department orchestrator passes its own data into pure render functions — no global context flags. All parity rules are removed.

## Confirmed Decisions

- DB split is done — separate `pm_*`, `log_*`, `unit6_*` tables already exist
- Shared renderers stay as one codebase, receive data as function arguments (no globals)
- Production capacity is out of scope (already independent)
- Shared files move to `portals/capacity/shared/js/` and `portals/capacity/shared/css/`
- One shared CSS set (not copied per department)
- All ME/PM parity rules and docs are REMOVED
- One-pass rename — no backward-compatibility aliases
- `pm-capacity-data.js` to be verified after split and removed if redundant
- Guide content (`utils/js/guide.js`) to be updated to remove shared-data references

## Scope

**In:** All capacity JS/CSS restructuring, parity rule removal, test updates, index.html, guide content.
**Out:** Production capacity, database schema, Operations portal (`meDataState` read is ME-only), Product Management portal.

---

## Phase 1 — Create shared files

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** None
> **Can be paused after:** Yes — old `me/js/*` files still exist with original names. App continues to work unchanged.
> **Files created:** 12 JS + 7 CSS in `portals/capacity/shared/`
> **Files modified:** None
> **Files deleted:** None

Create `portals/capacity/shared/js/` and `portals/capacity/shared/css/`.

Copy the files below into the shared folder. Rename all `me*` window globals to `cap*` inside the new copies. The old `me/` originals stay untouched — the app still runs from them.

### 1a — JS utilities (3 files)

| Source (copy from) | New file | Function renames inside new file |
|---------------------|----------|----------------------------------|
| `portals/capacity/me/js/me-utils.js` | `shared/js/cap-utils.js` | `ME_HOURS_PER_DAY` → `CAP_HOURS_PER_DAY`, `ME_DEFAULT_HOURS_PER_WEEK` → `CAP_DEFAULT_HOURS_PER_WEEK`, `meGetHoursPerWeek` → `capGetHoursPerWeek`, `meGetDailyHours` → `capGetDailyHours`, `meBankHolidaysCache` → `capBankHolidaysCache`. Generic functions (`escapeHtml`, `getUtilisationColor`, `formatPercent`, `formatHours`, `formatDate`, `getMonthLabel`, `parseMonth`, `addMonths`, `subtractMonths`, `getCurrentMonth`, `getMonthRange`, `countWorkDaysInMonth`, `countWorkDaysBetween`, `getBankHolidaysForYear`) keep their names. |
| `portals/capacity/me/js/me-components.js` | `shared/js/cap-components.js` | No renames needed — functions already have generic names (`renderKPIStrip`, `renderMonthPicker`, `renderTableHeader`, `renderEditableCell`, `renderStatusBadge`, `renderEmptyState`, `renderCard`, `renderSkeleton`). |
| `portals/capacity/me/js/me-calculations.js` | `shared/js/cap-calculations.js` | `meCalculateMonthData` → `capCalculateMonthData`, `meCalcWeekUtilisation` → `capCalcWeekUtilisation`, `meParseDateOnlyLocal` → `capParseDateOnlyLocal`, `meGetHolidayDaysInRange` → `capGetHolidayDaysInRange`, `meGetProductBatchCountInRange` → `capGetProductBatchCountInRange`, `meGetProductBatchesInRange` → `capGetProductBatchesInRange`, `meGetProductSupportHoursForBatch` → `capGetProductSupportHoursForBatch`, `getEffectiveSubtasks` keeps name, `meGetWeekRange` → `capGetWeekRange`. |

### 1b — Shared renderers (8 files)

| Source | New file | Function renames |
|--------|----------|-----------------|
| `me/js/me-team.js` | `shared/js/cap-team.js` | `meRenderTeamTab` → `capRenderTeamTab` |
| `me/js/me-tasks.js` | `shared/js/cap-tasks.js` | `meRenderTasksTab` → `capRenderTasksTab`, `meTasksFilters` → `capTasksFilters`, `meTasksSort` → `capTasksSort`, `meTasksSortBy` → `capTasksSortBy`, `meGetSortIcon` → `capGetSortIcon` |
| `me/js/me-products.js` | `shared/js/cap-products.js` | `meRenderProductsTab` → `capRenderProductsTab`, `meProductsTableState` → `capProductsTableState`, `meProductsCreateState` → `capProductsCreateState`, `meProductsGetState` → `capProductsGetState`, `meProductsSetDraftValue` → `capProductsSetDraftValue`, `meProductsGetDraftValue` → `capProductsGetDraftValue`, `meProductsClearDraft` → `capProductsClearDraft`, `meProductsStartHistoryEdit` → `capProductsStartHistoryEdit`, `meProductsSortByColumn` → `capProductsSortByColumn`, `meProductsNormalizeDepartmentKey` → `capProductsNormalizeDepartmentKey` |
| `me/js/me-product-taskload.js` | `shared/js/cap-product-taskload.js` | `meRenderProductTaskLoadTab` → `capRenderProductTaskLoadTab`, `meProductLoadTableState` → `capProductLoadTableState`, `meProductLoadGetState` → `capProductLoadGetState`, `meProductLoadRefreshTable` → `capProductLoadRefreshTable` |
| `me/js/me-holidays.js` | `shared/js/cap-holidays.js` | `meRenderHolidaysTab` → `capRenderHolidaysTab`, `meToggleHoliday` → `capToggleHoliday`, `meFormatDate` → `capFormatDate` (if distinct from shared `formatDate`) |
| `me/js/me-chart.js` | `shared/js/cap-chart.js` | `meRenderChartTab` → `capRenderChartTab`, `meDrawChartNow` → `capDrawChartNow`, `meGetChartRefreshText` → `capGetChartRefreshText`. DELETE `meGetCapacityDepartmentData` and `meGetActiveChartMonthKey` (callers will pass data directly). |
| `me/js/me-heatmap.js` | `shared/js/cap-heatmap.js` | `meRenderHeatmapTab` → `capRenderHeatmapTab`, `meDrawHeatmapNow` → `capDrawHeatmapNow`, `meRenderHeatmapPanel` → `capRenderHeatmapPanel`, `meOpenHeatmapDetail` → `capOpenHeatmapDetail`, `meCloseHeatmapDetail` → `capCloseHeatmapDetail` |
| `me/js/me-dashboard.js` | `shared/js/cap-dashboard.js` | `meRenderDashboardTab` → `capRenderDashboardTab`, `meDashboardDrawMiniChart` → `capDashboardDrawMiniChart` |

### 1c — Shared data utilities (1 file, extracted)

Create `shared/js/cap-data-utils.js` by extracting these generic functions from `portals/capacity/me/js/me-data.js`:

| Old name | New name |
|----------|----------|
| `meNormalizeDepartmentTag` | `capNormalizeDepartmentTag` |
| `meNormalizeProductSupportBreakdown` | `capNormalizeProductSupportBreakdown` |
| `meNormalizeDateOnly` | `capNormalizeDateOnly` |
| `meUUID` | `capUUID` |
| `meNormalizeHolidayRecord` | `capNormalizeHolidayRecord` |
| `meNormalizeAndDedupeHolidays` | `capNormalizeAndDedupeHolidays` |
| `meNormalizeSupportHistoryRecord` | `capNormalizeSupportHistoryRecord` |
| `meNormalizeAndDedupeSupportHistory` | `capNormalizeAndDedupeSupportHistory` |
| `meSortSupportHistoryByDate` | `capSortSupportHistoryByDate` |

Do NOT copy: `meFilterByDepartment` (deleted — each dept owns its data) or `meGetDepartmentFromContext` (deleted — replaced by explicit parameter).

### 1d — CSS (7 files)

| Source | New file |
|--------|----------|
| `me/css/me-capacity-shell.css` | `shared/css/cap-shell.css` |
| `me/css/me-capacity-tables.css` | `shared/css/cap-tables.css` |
| `me/css/me-capacity-chart.css` | `shared/css/cap-chart.css` |
| `me/css/me-capacity-dashboard.css` | `shared/css/cap-dashboard.css` |
| `me/css/me-capacity-heatmap.css` | `shared/css/cap-heatmap.css` |
| `me/css/me-capacity-holidays.css` | `shared/css/cap-holidays.css` |
| `me/css/me-capacity-responsive.css` | `shared/css/cap-responsive.css` |

CSS class selectors (`.me-shell`, `.me-topbar`, etc.) stay unchanged — they are referenced in department orchestrator HTML and renaming them is cosmetic, not structural.

### Phase 1 verification

- All 19 new files exist in `portals/capacity/shared/`
- No `window.me` prefixed globals in any `shared/js/cap-*.js` file (except CSS class strings like `me-shell` which are fine)
- App still works — `index.html` still loads old `me/js/*` files

---

## Phase 2 — Refactor shared renderers to pure functions

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 1 complete
> **Can be paused after:** Yes — shared files are ready but not yet loaded by index.html. App runs from old files.
> **Files modified:** 12 `shared/js/cap-*.js` files from Phase 1
> **Files deleted:** None

Goal: **zero global reads inside shared render functions.** Every function receives all data through parameters.

### 2a — New function signatures

Replace internal `meGetDepartmentFromContext()` calls and `meCurrentDepartmentContext` reads with explicit `department` parameter:

```
capRenderTeamTab(teamArray, holidaysArray, monthKey, department, canEditFlag)
capRenderTasksTab(tasksArray, teamArray, productsArray, department, filters, sort)
capRenderProductsTab(productsArray, tasksArray, department, tableState)
capRenderProductTaskLoadTab(tasksArray, productsArray, department, tableState)
capRenderHolidaysTab(holidaysArray, teamArray, monthKey, department, bankHolidays, canEditFlag)
capRenderChartTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department)
capDrawChartNow(teamArray, tasksArray, productsArray, holidaysArray, monthKey, department)
capRenderHeatmapTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department)
capDrawHeatmapNow(teamArray, tasksArray, productsArray, holidaysArray, monthKey, department)
capRenderDashboardTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department)
```

### 2b — Remove eliminated functions

Inside shared files, delete:
- `meGetDepartmentFromContext()` — replaced by `department` parameter
- `meGetCapacityDepartmentData()` — each orchestrator passes its own data
- `meGetActiveChartMonthKey()` — each orchestrator passes its own month key
- `meFilterByDepartment()` — data is already department-scoped from data layer

> **Note on chart/heatmap re-draw:** `capDrawChartNow` and `capDrawHeatmapNow` are only ever called from orchestrators — never from timers, resize handlers, or `capacity-events.js`. There are no internal callbacks that need closure-over-data. Making them parameter-driven (per 2a) is sufficient; no extra closure pattern is needed.

### 2c — Department-keyed UI state

`capProductsTableState` keeps its `{ME, PM, LOG, UNIT6}` keyed structure. This is per-tab filter/sort state (search text, sort column, hidden statuses) — not cross-department data. Each orchestrator will pass `capProductsTableState['ME']` (or `'PM'`, etc.) as the `tableState` argument.

Same applies to `capProductLoadTableState`, `capTasksFilters`, `capTasksSort`.

### Phase 2 verification

- No `meCurrentDepartmentContext` references in any `shared/js/cap-*.js` file
- No `meGetDepartmentFromContext` references in any `shared/js/cap-*.js` file
- No `meDataGet*` or `pmDataGet*` calls inside shared render functions (data must come from parameters)
- App still works — old files still loaded

---

## Phase 3 — Update ME orchestrator

Status: COMPLETE on 2026-03-27 for orchestrator decoupling, with a runtime-safe bridge still in place until the shared layer is fully cut over.

> **Prerequisite:** Phases 1–2 complete
> **Can be paused after:** Yes — only ME is updated. PM/LOG/UNIT6 still use old code via old files.
> **Files modified:** `portals/capacity/me/js/me-capacity.js`
> **Files deleted:** None

Changes to `me-capacity.js`:
- Remove `window.meCurrentDepartmentContext = 'ME'` (line ~35)
- In `meGetTabContent()`, replace `meRenderTeamTab(team)` with `capRenderTeamTab(meDataGetTeam(), meDataGetHolidays(), meChartStart, 'ME', canEdit())`
- Replace all `meRender*Tab()` calls with `capRender*Tab()` equivalents, passing ME data from `meDataGet*()` functions
- `meDrawChartNow()` becomes: `capDrawChartNow(meDataGetTeam(), meDataGetTasks(), meDataGetProducts(), meDataGetHolidays(), meChartStart, 'ME')`
- `meRefreshCurrentTab()` — remove any delegation to PM/LOG/UNIT6; only ME logic stays

### Phase 3 implementation note

Because `index.html` still does not load the shared `cap-*` scripts in this phase, `me-capacity.js` currently prefers `window.cap*` entry points but falls back to legacy `window.me*` functions at runtime. The remaining shared renderer stubs were replaced with wrappers to the working legacy renderers, so Phase 3 is complete for **ME orchestrator decoupling** and no longer blocked by placeholder shared tabs, but it is still not yet a full live bootstrap cut-over to shared rendering.

### Phase 3 verification

- ME capacity tab loads, all sub-tabs render correctly through shared entry points when available and legacy fallback otherwise
- No placeholder shared renderer output remains in `portals/capacity/shared/js/cap-products.js`, `cap-product-taskload.js`, `cap-holidays.js`, `cap-dashboard.js`, or `cap-heatmap.js`
- Chart draws, heatmap draws, edits save
- No `meRenderTeamTab` or `meRenderTasksTab` etc. calls remain in `me-capacity.js`
- `grep "meCurrentDepartmentContext" portals/capacity/me/js/me-capacity.js` returns 0

---

## Phase 4 — Update PM orchestrator

Status: COMPLETE on 2026-03-27, with a runtime-safe legacy bridge still in place until the shared layer is bootstrapped in `index.html`.

> **Prerequisite:** Phases 1–2 complete (independent of Phase 3)
> **Can be paused after:** Yes — only PM is updated
> **Files modified:** `portals/capacity/project-management/js/pm-capacity.js`
> **Files deleted:** None

Changes to `pm-capacity.js`:
- Remove all 4 writes of `window.meCurrentDepartmentContext = 'PM'` (lines ~73, 135, 157, 257)
- In `pmGetTabContent()`, replace `meRenderTeamTab(team)` with `capRenderTeamTab(pmDataGetTeam(), pmDataGetHolidays(), pmChartStart, 'PM', canEdit())`
- Replace all `meRender*Tab()` calls with `capRender*Tab()` equivalents, passing PM data from `pmDataGet*()` functions
- `pmDrawChartNow()` becomes: `capDrawChartNow(pmDataGetTeam(), pmDataGetTasks(), pmDataGetProducts(), pmDataGetHolidays(), pmChartStart, 'PM')`
- No call to any `me*` render or data function remains
- **Pending-flag audit (critical for Phase 7):** Verify that all realtime/rerender triggers in `pm-capacity.js` set `window.pmPendingRealTimeUpdate` or `window.pmPendingRerender` — never `window.mePendingRealTimeUpdate`. If any ME flag is set by PM code, change it to the PM flag. This removes the historical coupling that required the `isPMContext` fallback inside the ME flush block in `capacity-events.js`.

### Phase 4 verification

- PM capacity tab loads, all sub-tabs render correctly
- `grep "meRender\|meCurrentDepartmentContext" portals/capacity/project-management/js/pm-capacity.js` returns 0
- `grep "mePendingRealTimeUpdate\|mePendingRerender" portals/capacity/project-management/js/pm-capacity.js` returns 0

---

## Phase 5 — Update LOG orchestrator

Status: COMPLETE on 2026-03-27, with a runtime-safe legacy bridge still in place until the shared layer is bootstrapped in `index.html`.

> **Prerequisite:** Phases 1–2 complete (independent of Phases 3–4)
> **Can be paused after:** Yes
> **Files modified:** `portals/capacity/logistics/js/log-capacity.js`
> **Files deleted:** None

Same pattern as Phase 4 using `logDataGet*()` functions and `'LOG'` department tag.

### Phase 5 verification

- LOG capacity tab loads, all sub-tabs render correctly
- `grep "meRender\|meCurrentDepartmentContext" portals/capacity/logistics/js/log-capacity.js` returns 0

---

## Phase 6 — Update UNIT6 orchestrator

Status: COMPLETE on 2026-03-27, with a runtime-safe legacy bridge still in place until the shared layer is bootstrapped in `index.html`.

> **Prerequisite:** Phases 1–2 complete (independent of Phases 3–5)
> **Can be paused after:** Yes
> **Files modified:** `portals/capacity/unit6/js/unit6-capacity.js`
> **Files deleted:** None

Same pattern as Phases 4–5 using `unit6DataGet*()` functions and `'UNIT6'` department tag.

### Phase 6 verification

- UNIT6 capacity tab loads, all sub-tabs render correctly
- `grep "meRender\|meCurrentDepartmentContext" portals/capacity/unit6/js/unit6-capacity.js` returns 0

---

## Phase 7 — Update capacity-events.js

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phases 3–6 all complete
> **Can be paused after:** Yes
> **Files modified:** `portals/capacity/js/capacity-events.js`
> **Files deleted:** None

### Phase 7 implementation note

`capacity-events.js` is now DOM-context driven and no longer reads `meCurrentDepartmentContext`. Product/product-load/history helpers route through generic `cap*` names first, but still retain runtime-safe legacy fallback via `window` lookup until Phase 9 loads the shared scripts live from `index.html`.

Changes:
- **Line ~24 (`capContextType` fallback):** Remove the `meCurrentDepartmentContext` fallback. All four department shells already have `data-cap-context` set on their outermost div (`data-cap-context="me/pm/log/unit6"`), so `el.closest('[data-cap-context]')` always resolves. The fallback is dead code.
- **Line ~309:** Remove the `meCurrentDepartmentContext` read — replace with the DOM attribute pattern already used by `capContextType`.
- **Lines ~867–945 (`isPMContext` block in `_onFocusOut`):**
  - Line ~867: Simplify to DOM-only: `const isPMContext = contextRoot && contextRoot.getAttribute('data-cap-context') === 'pm'`
  - Lines ~941/945: After Phase 4's pending-flag audit, PM code no longer sets `mePendingRealTimeUpdate`, so `isPMContext` inside the ME flush block (`mePendingRealTimeUpdate || mePendingRerender`) is always `false`. Delete lines 941–947 entirely and replace with just the ME render call:
    ```javascript
    if (activeNavBtn && activeNavBtn.getAttribute('data-tab') === 'chart') {
      if (typeof meCapSmartRender === 'function') meCapSmartRender()
      return
    }
    if (typeof meRefreshCurrentTab === 'function') meRefreshCurrentTab()
    ```
- Replace `meRender*`, `meProducts*`, `meTasksFilters`, etc. with `capRender*`, `capProducts*`, `capTasksFilters` equivalents
- Update `capGetDataApi()` — remove fallback to `meCurrentDepartmentContext`; rely solely on `data-cap-context` attribute

### Phase 7 verification

- All four departments: inline edits trigger save, tab switching works, product draft state works
- `grep "meCurrentDepartmentContext" portals/capacity/js/capacity-events.js` returns 0
- `grep "meRender\|meProducts\|meTasksFilters\|meTasksSort" portals/capacity/js/capacity-events.js` returns 0
- `grep "isPMContext" portals/capacity/js/capacity-events.js` returns 0

---

## Phase 8 — Clean up ME data layer

> **Prerequisite:** Phase 1c complete (cap-data-utils.js exists)
> **Can be paused after:** Yes
> **Files modified:** `portals/capacity/me/js/me-data.js`, `portals/capacity/me/js/me-data-relational.js`, `pm-data.js`, `log-data.js`, `unit6-data.js`, `pm-data-relational.js`, `log-data-relational.js`, `unit6-data-relational.js`
> **Files deleted:** None
> **Status:** Complete on 2026-03-27. Shared utility ownership is now in `cap-data-utils.js` / `cap-utils.js`; the final follow-up cleanup later on 2026-03-27 removed the last `meCurrentDepartmentContext`, `meGetDepartmentFromContext`, and `meFilterByDepartment` bridges from live code.

### 8a — me-data.js

- Remove extracted generic functions (now in `shared/js/cap-data-utils.js`): `meNormalizeDepartmentTag`, `meNormalizeProductSupportBreakdown`, `meNormalizeDateOnly`, `meUUID`, `meNormalizeHolidayRecord`, `meNormalizeAndDedupeHolidays`, `meNormalizeSupportHistoryRecord`, `meNormalizeAndDedupeSupportHistory`, `meSortSupportHistoryByDate`
- DELETE `meFilterByDepartment` and `meGetDepartmentFromContext`
- All internal calls within `me-data.js` that called these functions must now call `cap*` equivalents
- Keep ME-specific state and CRUD: `meDataState`, `meDataAddTeam()`, `meDataGetTeam()`, etc.

### 8b — me-data-relational.js

- Remove duplicate `meNormalizeDepartmentTag` — call `capNormalizeDepartmentTag` from shared instead
- Update any other `me*` utility calls to `cap*` equivalents
- `meNormalizePersistedProductDepartment` can be simplified to always return `'ME'`

### 8c — pm-data.js, log-data.js, unit6-data.js

- Replace `meNormalize*`, `meUUID`, `meSortSupportHistoryByDate` calls with `capNormalize*`, `capUUID`, `capSortSupportHistoryByDate`
- Replace `meGetHoursPerWeek` with `capGetHoursPerWeek`

### 8d — pm-data-relational.js, log-data-relational.js, unit6-data-relational.js

- Same pattern: replace `me*` shared utility calls with `cap*` equivalents

### Phase 8 verification

- Shared utility resolution now flows through `cap-data-utils.js` / `cap-utils.js` for ME, PM, LOG, and UNIT6 data layers with explicit department tagging in live code.
- Later follow-up cleanup removed the remaining ME bridge helpers from `me-data.js` and the now-unused shared context helpers from `cap-data-utils.js`.
- Existing unrelated failure remains in `tests/me-data-relational-queries.test.js` around the `meSaveTeamRelational` query mock chain (`supa.from(...).select is not a function`); the capacity-independence cleanup did not introduce that issue.

---

## Phase 9 — Update index.html

> **Prerequisite:** Phases 1–8 all complete
> **Can be paused after:** Yes — this is the cut-over. After this, old files are no longer loaded.
> **Files modified:** `index.html`
> **Files deleted:** None (old files stay on disk until Phase 10)
> **Status:** Complete on 2026-03-27. `index.html` now bootstraps the shared `cap-*` CSS/JS layer first, keeps only the ME data/orchestrator files from the old ME set, and leaves the legacy ME shared files on disk only for tests and the later deletion phase.

### 9a — Replace CSS references

Remove old `me/css/me-capacity-*.css` links. Add shared CSS:

```html
<!-- Shared capacity CSS -->
<link rel="stylesheet" href="portals/capacity/shared/css/cap-shell.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-tables.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-chart.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-dashboard.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-heatmap.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-holidays.css">
<link rel="stylesheet" href="portals/capacity/shared/css/cap-responsive.css">
```

### 9b — Replace JS script tags

Remove old `me/js/me-*.js` script tags (~lines 647–660 in current index.html) except `me-data-relational.js`, `me-data.js`, and `me-capacity.js`.

New load order (all paths relative to root):

```html
<!-- Shared capacity layer (loads first — no dept dependencies) -->
<script src="portals/capacity/shared/js/cap-data-utils.js"></script>
<script src="portals/capacity/shared/js/cap-utils.js"></script>
<script src="portals/capacity/shared/js/cap-calculations.js"></script>
<script src="portals/capacity/shared/js/cap-components.js"></script>
<script src="portals/capacity/shared/js/cap-team.js"></script>
<script src="portals/capacity/shared/js/cap-tasks.js"></script>
<script src="portals/capacity/shared/js/cap-products.js"></script>
<script src="portals/capacity/shared/js/cap-product-taskload.js"></script>
<script src="portals/capacity/shared/js/cap-holidays.js"></script>
<script src="portals/capacity/shared/js/cap-chart.js"></script>
<script src="portals/capacity/shared/js/cap-heatmap.js"></script>
<script src="portals/capacity/shared/js/cap-dashboard.js"></script>

<!-- ME department -->
<script src="portals/capacity/me/js/me-data-relational.js"></script>
<script src="portals/capacity/me/js/me-data.js"></script>
<script src="portals/capacity/me/js/me-capacity.js"></script>

<!-- PM department -->
<script src="portals/capacity/project-management/js/pm-data-relational.js"></script>
<script src="portals/capacity/project-management/js/pm-data.js"></script>
<script src="portals/capacity/project-management/js/pm-capacity.js"></script>

<!-- LOG department -->
<script src="portals/capacity/logistics/js/log-data-relational.js"></script>
<script src="portals/capacity/logistics/js/log-data.js"></script>
<script src="portals/capacity/logistics/js/log-capacity.js"></script>

<!-- UNIT6 department -->
<script src="portals/capacity/unit6/js/unit6-data-relational.js"></script>
<script src="portals/capacity/unit6/js/unit6-data.js"></script>
<script src="portals/capacity/unit6/js/unit6-capacity.js"></script>

<!-- Production (unchanged) -->
<!-- ...existing production scripts in current order... -->

<!-- Hub + events (always last) -->
<script src="portals/capacity/js/capacity.js"></script>
<script src="portals/capacity/js/capacity-events.js"></script>
```

### Phase 9 verification

- `npm run check:load-order` passes after updating the checker to the shared-capacity dependency map
- Focused validation passed: `npm test -- tests/capacity-hub.test.js tests/capacity-events.test.js tests/pm-capacity.test.js tests/log-capacity.test.js tests/unit6-capacity.test.js tests/me-chart.test.js tests/prod-capacity-data.test.js`
- Browser load at `http://localhost:8000/` reaches the login shell without page errors after fixing the browser-scope alias redeclaration issue in the PM/LOG/UNIT6 data files
- Production capacity script order remains unchanged inside the capacity block and its focused suite still passes

---

## Phase 10 — Delete old files

> **Prerequisite:** Phase 9 complete and manually verified
> **Can be paused after:** Yes
> **Status:** Complete (2026-03-27)
> **Files modified:** `tests/*.test.js`, `README.md`, `TESTING_STRATEGY.md`, `CHANGELOG.md`
> **Files deleted:** 19 files from `me/js/` and `me/css/`

Delete originals that are now in `shared/`:

**JS (12 files):**
- `portals/capacity/me/js/me-utils.js`
- `portals/capacity/me/js/me-components.js`
- `portals/capacity/me/js/me-calculations.js`
- `portals/capacity/me/js/me-team.js`
- `portals/capacity/me/js/me-tasks.js`
- `portals/capacity/me/js/me-products.js`
- `portals/capacity/me/js/me-product-taskload.js`
- `portals/capacity/me/js/me-holidays.js`
- `portals/capacity/me/js/me-chart.js`
- `portals/capacity/me/js/me-heatmap.js`
- `portals/capacity/me/js/me-dashboard.js`
- `portals/capacity/me/js/me-data-utils.js` (if it exists — extracted utilities moved to shared in Phase 1c)

**CSS (7 files):**
- `portals/capacity/me/css/me-capacity-shell.css`
- `portals/capacity/me/css/me-capacity-tables.css`
- `portals/capacity/me/css/me-capacity-chart.css`
- `portals/capacity/me/css/me-capacity-dashboard.css`
- `portals/capacity/me/css/me-capacity-heatmap.css`
- `portals/capacity/me/css/me-capacity-holidays.css`
- `portals/capacity/me/css/me-capacity-responsive.css`

After deletion, the `me/` folder retains only:
- `me/js/me-data.js` — ME state + CRUD
- `me/js/me-data-relational.js` — ME Supabase persistence
- `me/js/me-capacity.js` — ME orchestrator

### Phase 10 verification

- Deleted the old ME shared JS/CSS copies; the `me/` folder now retains only `me-data.js`, `me-data-relational.js`, and `me-capacity.js`
- Migrated direct legacy-file Jest suites to the shared `cap-*` files or shared wrapper contracts so test coverage no longer depends on deleted artifacts
- `npm run check:load-order` passes after deletion
- Focused migration validation passed: `npm test -- tests/bank-holidays.test.js tests/me-calculations.test.js tests/me-components.test.js tests/me-team-render.test.js tests/me-chart.test.js tests/me-heatmap.test.js tests/me-holidays.test.js tests/me-tasks-sort.test.js tests/me-products-filters.test.js tests/me-data-core.test.js tests/prod-capacity-data.test.js`
- Full `npm test` still has the pre-existing unrelated failure in `tests/me-data-relational-queries.test.js`; Phase 10 introduced no new full-suite failures
- No broken file references remain in `index.html`

---

## Phase 11 — Verify and remove pm-capacity-data.js

> **Prerequisite:** Phases 4 and 9 complete
> **Can be paused after:** Yes
> **Status:** COMPLETE on 2026-03-27
> **Files modified:** `index.html`
> **Files deleted:** `portals/capacity/project-management/js/pm-capacity-data.js`, `tests/pm-capacity-data.test.js`

`pm-capacity-data.js` was a thin wrapper (`pmCapacityData.getTasks()` delegated to `pmDataGetTasks()`). No production code referenced it — only its own test file.

Steps completed:
1. ✅ `grep -r "pmCapacityData" portals/ index.html` — confirmed zero call sites in production code
2. ✅ No replacement needed — no callers to update
3. ✅ Deleted `portals/capacity/project-management/js/pm-capacity-data.js`
4. ✅ Deleted `tests/pm-capacity-data.test.js` (tested the removed wrapper)
5. ✅ Removed `<script>` tag from `index.html` (line 202)

### Phase 11 verification

- ✅ `grep "pmCapacityData" portals/ index.html` returns 0
- ✅ PM data file deleted
- ✅ PM test file deleted
- ✅ `npm run check:load-order` passes
- ✅ `npm test -- tests/pm-capacity.test.js tests/pm-data.test.js tests/pm-data-relational.test.js` passes (5 tests)
- ✅ PM tab functionality preserved — all orchestrator calls go directly to `pmDataGet*()` functions

---

## Phase 12 — Remove parity rules and docs

> **Prerequisite:** None (fully independent)
> **Can be paused after:** Yes
> **Status:** COMPLETE on 2026-03-27
> **Files modified:** 2 docs
> **Files deleted:** 0 (parity instructions file did not exist)

| File | Action | Status |
|------|--------|--------|
| `.github/instructions/capacity-parity.instructions.md` | **DELETE** | ✅ File did not exist — nothing to delete |
| `.github/copilot-instructions.md` | Remove rule #6: "Keep ME and PM capacity parity unless explicitly excluded" | ✅ Already clean — no such rule found |
| `CLAUDE.md` | Remove rule #6: "Keep ME and PM capacity parity unless explicitly excluded" | ✅ Already clean — no such rule found |
| `AGENTS.md` | Remove any parity references | ✅ Already clean — no parity references found |
| `.wolf/cerebrum.md` | Remove parity entries (lines ~60–61 re: department constraint parity, capacity delete parity) | ✅ Removed 2 Do-Not-Repeat entries about cross-department sync |
| `.github/skills/code-review/SKILL.md` | Remove checklist item #4 about capacity parity | ✅ Removed "Capacity parity maintained between ME and PM capacity portals" |
| `plans/capacity-department-split.md` | Add note at top: "COMPLETED — see plans/capacity-independence.md" | ✅ Added completion notice |

### Phase 12 verification

- ✅ `grep -ri "parity" .github/ CLAUDE.md AGENTS.md .wolf/cerebrum.md` — only remaining mentions are in plan documents or unrelated contexts (Operations dashboard, testing strategy, etc.)
- ✅ `.github/instructions/capacity-parity.instructions.md` does not exist
- ✅ `.wolf/cerebrum.md` — removed department constraint sync and capacity delete sync entries (no longer needed with independent streams)
- ✅ `plans/capacity-department-split.md` — marked as completed with reference to this plan

---

## Phase 13 — Update guide content

> **Prerequisite:** Phases 3–6 complete (departments are independent)
> **Can be paused after:** Yes
> **Status:** COMPLETE on 2026-03-27
> **Files modified:** `utils/js/guide.js`

Updated these entries in `GUIDE_CONTENT` to remove shared-data language:

| Key | Text to remove | Replace with | Status |
|-----|---------------|-------------|--------|
| `capacity` (PM section) | "Shares the same underlying data table, separated by department tag" | "PM has its own independent data store for teams, tasks, products, and holidays" | ✅ |
| `capacity` (Logistics section) | "Same structure as ME Capacity" (implied shared data) | "Logistics has its own independent data store" | ✅ |
| `capacity` (Unit 6 section) | "Same structure as ME Capacity" (implied shared data) | "Unit 6 has its own independent data store" | ✅ |
| `capacity-me` | "their data is stored in the same underlying tables, separated by department tag" | "Each department has its own independent data store" | ✅ |
| `capacity-pm` | "It uses the same data structure as ME Capacity, filtered to the PM department tag" + "Shares the same underlying dataset" | "PM has its own independent data store for teams, tasks, products, and holidays" | ✅ |
| `capacity-logistics` | "It uses the same tab structure as ME Capacity, with data separated by department tag" | "Logistics has its own independent data store" | ✅ |
| `capacity-unit6` | "It uses the same tab structure as ME Capacity, with data separated by department tag" | "Unit 6 has its own independent data store" | ✅ |

### Phase 13 verification

- ✅ `grep -i "same.*data\|shared.*dataset\|department tag\|same.*table" utils/js/guide.js` returns 0 hits in capacity entries
- ✅ Guide content now correctly describes independent data stores for each department
- ✅ Follow-up cleanup removed the remaining team-page wording that still mentioned "department tag" in the capacity guide entries

---

## Phase 14 — Update tests

> **Prerequisite:** Phases 1–9 complete
> **Can be paused after:** Yes
> **Status:** COMPLETE on 2026-03-27
> **Files modified:** `tests/capacity-events.test.js`, `tests/log-capacity.test.js`, `tests/pm-capacity.test.js`, `tests/unit6-capacity.test.js`, `tests/me-data-core.test.js`, `tests/operations-dashboard.test.js`

### 14a — Rename function references

Updated test files to use new naming:

| Old | New | Status |
|-----|-----|--------|
| `meTasksFilters` / `pmTasksFilters` (separate globals) | `capTasksFilters['ME']` / `capTasksFilters['PM']` | ✅ Updated in `capacity-events.test.js` |

### 14b — Remove parity tests and legacy context references

Removed references to the deprecated `meCurrentDepartmentContext` global:

| File | Changes |
|------|---------|
| `tests/log-capacity.test.js` | Removed `delete window.meCurrentDepartmentContext` cleanup and `expect(window.meCurrentDepartmentContext).toBeUndefined()` assertions |
| `tests/pm-capacity.test.js` | Removed `delete window.meCurrentDepartmentContext` cleanup |
| `tests/unit6-capacity.test.js` | Removed `delete window.meCurrentDepartmentContext` cleanup and `expect(window.meCurrentDepartmentContext).toBeUndefined()` assertions |

### Phase 14 verification

- ✅ `npm test -- tests/capacity-events.test.js tests/log-capacity.test.js tests/pm-capacity.test.js tests/unit6-capacity.test.js` — 30 tests pass
- ✅ `grep "meCurrentDepartmentContext" tests/capacity-events.test.js tests/log-capacity.test.js tests/pm-capacity.test.js tests/unit6-capacity.test.js` returns 0
- ✅ `grep "meRenderTeamTab\|meRenderTasksTab" tests/` returns 0 (already using `capRender*` functions)
- ✅ Follow-up cleanup replaced the stale `me-data-core.test.js` context-helper expectations with explicit department-tagging tests and updated `tests/operations-dashboard.test.js` to use the new generic department filter dependency
- ⚠️ A pre-existing failure remains in `tests/me-data-relational-queries.test.js` around the relational query mock chain; the capacity-independence cleanup did not introduce that issue

---

## Final verification checklist

After all phases complete:

1. `npm test` passes
2. `npm run check:all` passes
3. `npm run check:load-order` passes
4. `grep -r "meCurrentDepartmentContext" portals/` → 0 results
5. `grep -r "meGetDepartmentFromContext" portals/` → 0 results
6. `grep -r "meRender" portals/capacity/project-management/ portals/capacity/logistics/ portals/capacity/unit6/` → 0 results
7. `grep -r "meFilterByDepartment" portals/` → 0 results
8. `.github/instructions/capacity-parity.instructions.md` does not exist
9. Manual: each tab (ME, PM, LOG, UNIT6) loads, charts render, edits save, data persists independently

---

## Architecture after completion

```
portals/capacity/
├── shared/
│   ├── js/
│   │   ├── cap-data-utils.js          ← generic normalize/dedupe/sort
│   │   ├── cap-utils.js               ← hours, dates, formatting
│   │   ├── cap-calculations.js        ← capacity math engine
│   │   ├── cap-components.js          ← KPI, month picker, table, cards
│   │   ├── cap-team.js                ← team tab renderer
│   │   ├── cap-tasks.js               ← tasks tab renderer
│   │   ├── cap-products.js            ← products tab renderer
│   │   ├── cap-product-taskload.js    ← product load tab renderer
│   │   ├── cap-holidays.js            ← holidays tab renderer
│   │   ├── cap-chart.js               ← chart tab renderer
│   │   ├── cap-heatmap.js             ← heatmap renderer
│   │   └── cap-dashboard.js           ← dashboard renderer
│   └── css/
│       ├── cap-shell.css
│       ├── cap-tables.css
│       ├── cap-chart.css
│       ├── cap-dashboard.css
│       ├── cap-heatmap.css
│       ├── cap-holidays.css
│       └── cap-responsive.css
├── me/
│   └── js/
│       ├── me-data-relational.js      ← ME Supabase persistence
│       ├── me-data.js                 ← ME state + CRUD
│       └── me-capacity.js             ← ME orchestrator
├── project-management/
│   ├── css/pm-capacity.css
│   └── js/
│       ├── pm-data-relational.js      ← PM Supabase persistence
│       ├── pm-data.js                 ← PM state + CRUD
│       └── pm-capacity.js             ← PM orchestrator
├── logistics/
│   └── js/
│       ├── log-data-relational.js
│       ├── log-data.js
│       └── log-capacity.js
├── unit6/
│   └── js/
│       ├── unit6-data-relational.js
│       ├── unit6-data.js
│       └── unit6-capacity.js
├── production/                         ← unchanged
│   ├── css/prod-capacity.css
│   └── js/ (existing scripts unchanged)
├── js/
│   ├── capacity.js                    ← hub router
│   └── capacity-events.js             ← event dispatcher
└── css/
    └── capacity.css                   ← hub styles
```

Data flow — no sideways paths:

```
shared/ ──→ ME data layer ──→ ME orchestrator
       ──→ PM data layer ──→ PM orchestrator
       ──→ LOG data layer ──→ LOG orchestrator
       ──→ UNIT6 data layer ──→ UNIT6 orchestrator
```
