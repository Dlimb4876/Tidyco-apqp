# Test Failure Report — 2026-03-30

**Total: 329 failing tests across 43 test suites (560 passing / 889 total)**
**P1-B complete: `tests/action-centre.test.js` now 33/33 passing.**

---

## Priority 1 — Critical (Missing Exports) 🔴
*Easy to fix, highest impact. Source files define functions but forget to export them.*

### [P1-A] `hub.js` — 3 functions not exported
- **File:** `portals/hub/js/hub.js`
- **Test:** `tests/hub.test.js` (~20 failing tests)
- **Cause:** `hubGetFavouriteProducts`, `hubRemovePageFavourite`, `hubRemoveProductFavourite` are plain `function` without `export`. Named import gets `undefined`.
- **Fix:** Add `export` to each of those 3 functions.
- **Todos:**
  - [x] Add `export` to `hubGetFavouriteProducts`
  - [x] Add `export` to `hubRemovePageFavourite`
  - [x] Add `export` to `hubRemoveProductFavourite`
 - **Progress (2026-03-30):** Exports added in `portals/hub/js/hub.js`. `tests/hub.test.js` still fails, but remaining failures are assertion drift expecting legacy inline handler strings (`hubRemovePageFavourite` / `hubRemoveProductFavourite`) in rendered HTML rather than current delegated `data-hub-action` markup.

---

### [P1-B] `action-centre.js` — 3 functions not exported ✅ DONE
- **File:** `portals/action-centre/js/action-centre.js`
- **Test:** `tests/action-centre.test.js` (was ~29 failing, now **33/33 passing**)
- **Cause:** `actionCentreGoTo`, `actionCentreGoToMcs`, `actionCentreUpdateActionStatus` had no `export` keyword. Tests were also written for a flat-global architecture while source uses ESM with `appState` from `core/js/state.js`.
- **Fix:**
  - Added `export` to 3 functions in `action-centre.js`
  - Rewrote test setup to import shared module state (`appState`, `stateDb`, `setCurrentUser`, `settingsState`, `realSupabase`) so tests use the same objects as the module
  - Replaced all `global.*` state mutations with `appState.*` mutations
  - Updated navigate/toast assertions: `appState.currentSection` instead of mocked `navigate()`, DOM checks instead of mocked `showToast()`
  - Updated render assertions: `data-hub-action` attributes instead of inline handler function names
  - Updated emptyState assertions: `toContain('...')` instead of mock call checks
  - Populated project fixture with full shape (`pfmea`, `risks`, `actions`, `ctq`, `pfd`, `cp`, `gates`, `documents: []`) so real NPI render doesn't throw
- **Todos:**
  - [x] Add `export` to `actionCentreGoTo`
  - [x] Add `export` to `actionCentreGoToMcs`
  - [x] Add `export` to `actionCentreUpdateActionStatus`
  - [x] Rewrite test setup to use shared module state
  - [x] Fix all navigate / toast / emptyState / data-hub-action assertions

---

### [P1-C] `npi-data-relational.js` — `npiRelHydratePfdRows` not exported
- **File:** `portals/product-development/npi/js/npi-data-relational.js`
- **Test:** `tests/npi-data-relational.test.js` (~8 failing tests)
- **Cause:** `npiRelHydratePfdRows` is a plain `function` (no export). `npiRelSaveDoc` may be missing entirely.
- **Fix:** Add `export` to `npiRelHydratePfdRows`. Investigate whether `npiRelSaveDoc` needs creating.
- **Todos:**
  - [x] Add `export` to `npiRelHydratePfdRows`
  - [x] Check if `npiRelSaveDoc` needs to be created or if test name is wrong
- **Progress (2026-03-30):** `npiRelHydratePfdRows` is now exported from `portals/product-development/npi/js/npi-data-relational.js`. `npiRelSaveDoc` already exists and is exported (`export const npiRelSaveDoc = async function(item) { ... }`), so no new function creation was needed.

---

### [P1-D] Tests use `eval()` on `state.js` — breaks on `export` keyword
- **Files:** `tests/programme-family-sync.test.js`, `tests/db.test.js`, `tests/db-gaps.test.js`
- **Tests:** ~10 failing tests
- **Cause:** Tests do `eval(stateScript.replace(/^const /gm, 'var '))` but `state.js` has `export` declarations the replacement doesn't strip → `SyntaxError: Unexpected token 'export'`.
- **Fix:** Switch to `toEvalFriendlyModuleSource` from `tests/helpers/esm-eval.js`:
  ```js
  import { toEvalFriendlyModuleSource } from './helpers/esm-eval.js'
  const src = fs.readFileSync('...state.js', 'utf8')
  eval(toEvalFriendlyModuleSource(src))
  ```
- **Todos:**
  - [x] Update `programme-family-sync.test.js` to use `toEvalFriendlyModuleSource`
  - [x] Update `db.test.js` to use `toEvalFriendlyModuleSource`
  - [x] Update `db-gaps.test.js` to use `toEvalFriendlyModuleSource`
- **Progress (2026-03-30):** Migrated `programme-family-sync.test.js` eval flow to `toEvalFriendlyModuleSource` (for both `state.js` and ESM `products-data.js`) and aligned it with `appState`/`db.families`; suite now passes. `db.test.js` and `db-gaps.test.js` already use direct ESM imports for `state.js` (no eval path for state exports), so no source edits were required there under this P1-D scope.

---

## Priority 2 — High (Test Setup Bugs) 🟠
*Tests load modules correctly but don't wire exports to globals correctly.*

### [P2-A] `realtime.test.js` — `supabase` alias mismatch (~14 failing tests)
- **Cause:** `realtime.js` imports `{ supabase }` from supa.js. The eval bridge creates `const supabase = globalThis.supabase`. But the test sets `global.supa`, not `global.supabase` → `supabase` is `undefined` inside eval.
- **Fix:** Add `global.supabase = global.supa` to the test setup before the eval call.
- **Todos:**
  - [ ] Add `global.supabase = global.supa` in `realtime.test.js` setup

---

### [P2-B] `production-data.test.js` — exports not global (~15 failing tests)
- **Cause:** Test loads `data.js` via `await import(data:text/javascript,...)` but discards the module. Calls `formatDisplayDate`, `prodState`, `prodDataReloadProducts` as globals — they don't exist.
- **Fix:**
  ```js
  const mod = await import(`data:text/javascript,${encodeURIComponent(src)}`)
  Object.assign(globalThis, mod)
  ```
- **Todos:**
  - [ ] Update `production-data.test.js` to assign module exports to `globalThis` after loading

---

### [P2-C] `feedback-data.test.js` + `feedback-search-focus.test.js` — `feedbackDataManager` not on window (~33 failing tests)
- **Cause:** Test imports module without capturing result, then accesses `window.feedbackDataManager`. ESM export is module-scoped, not on `window`.
- **Fix:**
  ```js
  const mod = await import('../portals/feedback/js/feedback-data.js')
  globalThis.feedbackDataManager = mod.feedbackDataManager
  ```
- **Todos:**
  - [ ] Capture import and set `globalThis.feedbackDataManager` in `feedback-data.test.js`
  - [ ] Same fix for `feedback-search-focus.test.js`

---

## Priority 3 — Medium (Module Load Architecture Issues) 🟡
*Tests load modules via data:URI which blocks relative ESM imports from resolving.*

### [P3-A] `operations-infographic.test.js` — relative import fails (~6 failing tests)
- **Cause:** `operations-infographic.js` imports `./operations-dashboard-metrics.js`. From a `data:` URI there is no base URL, so relative imports fail.
- **Fix:** Move `global.opsBuildMetrics = jest.fn(...)` to `beforeAll`, before the module is imported.
- **Todos:**
  - [ ] Move `global.opsBuildMetrics` mock to `beforeAll` before the module is loaded

---

### [P3-B] PM / Log / Unit6 relational tests — `cap-data-utils.js` import fails (~25 failing tests)
- **Files:** `pm-data-relational.test.js`, `log-data-relational.test.js`, `unit6-data-relational.test.js`
- **Cause:** Relational modules import `{ capUUID, capNormalizeDateRange }` from `../../shared/js/cap-data-utils.js`. Fails via data:URI.
- **Fix:** Add globals before loading each module:
  ```js
  global.capUUID = jest.fn(() => crypto.randomUUID())
  global.capNormalizeDateRange = jest.fn((d) => d)
  ```
- **Todos:**
  - [ ] Add `capUUID` + `capNormalizeDateRange` globals in `pm-data-relational.test.js`
  - [ ] Same fix for `log-data-relational.test.js`
  - [ ] Same fix for `unit6-data-relational.test.js`

---

### [P3-C] `product-management.test.js` — `products-data.js` import fails (~3 failing tests)
- **Cause:** `products.js` imports from `./products-data.js`. Via data:URI the import fails.
- **Fix:** Add globals for `productsDataGetAll`, `productsDataAddProduct`, `productsDataUpdateProduct`, `productsDataDeleteProduct`, `productsDataGetRelatedDataCounts` before loading `products.js`.
- **Todos:**
  - [ ] Mock products-data functions as `jest.fn()` globals before loading products.js

---

### [P3-D] `capacity-events.test.js` — `window.capacityEvents` API mismatch (~30 failing tests)
- **Cause:** Tests call `window.capacityEvents._onClick(...)` etc. Source exports `setupCapacityEvents()` / `teardownCapacityEvents()` — no `window.capacityEvents` object exists.
- **Fix — choose one:**
  - Option A: Restore `window.capacityEvents = { _onClick, _onChange, _onInput }` binding in source (if accidentally removed in ESM refactor).
  - Option B: Rewrite tests to dispatch DOM events on the container element.
- **Todos:**
  - [ ] Decide: restore window binding in source OR update tests to use current API
  - [ ] Implement the chosen fix

---

### [P3-E] MCS tests — state objects undefined (~15 failing tests)
- **Files:** `mcs-main.test.js`, `mcs-approval.test.js`, `mcs-approval-core.test.js`
- **Cause:** `mcsCurrentFilter`, `mcsList`, `mcsApproverConfig` are read from objects that are `undefined` in the test environment.
- **Fix:** Add proper MCS mock state to each test's global setup:
  ```js
  global.mcsState = { mcsList: [], mcsCurrentFilter: 'open', mcsSearch: '' }
  global.mcsApproverConfig = null
  global.mcsApproverConfigLoading = false
  ```
- **Todos:**
  - [ ] Add correct MCS state globals to `mcs-main.test.js`
  - [ ] Same for `mcs-approval.test.js`
  - [ ] Same for `mcs-approval-core.test.js`

---

## Priority 4 — Low (Isolated Targeted Fixes) ⚪

| # | Test File | Failing | Cause | Fix |
|---|---|---|---|---|
| 4-A | `npi-pfd-headers.test.js` | ~6 | pfdState undefined when setting `viewMode` | Initialize pfd state object in beforeEach |
| 4-B | `npi-gate-permissions.test.js` | ~5 | Role → permission key mapping broken | Check permission key constants match source |
| 4-C | `settings-portal.test.js` | ~5 | `renderSettingsPermissionsTab` not exported; null pages | Add export; add null guard |
| 4-D | `pm-capacity.test.js` | ~8 | `pmDataSubscribe` not defined (same as P2-B pattern) | Capture module exports to globalThis |
| 4-E | `log-capacity.test.js` | ~6 | `logDataSubscribe` not defined | Capture module exports |
| 4-F | `unit6-capacity.test.js` | ~6 | `unit6SetRefreshCurrentTabCallback` not defined | Capture module exports |
| 4-G | `prod-capacity-data.test.js` | ~5 | `prodCapRefreshCurrentTabHandler` init order | Fix init order or mock |
| 4-H | `production-planning-delegation.test.js` | ~4 | `setProdDataRefreshTabBodyHandler` not defined | Capture exports from data.js |
| 4-I | `production-products.test.js` | ~3 | `window.prodDataAddProduct` not a function | Attach to window after import |
| 4-J | `apqp.test.js` | ~3 | `syncFromPFMEA` not accessible | Export from apqp module |
| 4-K | `bom.test.js` | ~7 | `bom.pages` is null | Initialize bom state in test setup |
| 4-L | `pfmea.test.js` | ~1 | PFMEA history modal opens wrong position | Check modal centering logic |
| 4-M | `me-calculations.test.js` | ~5 | `countNetworkDaysBetween` not a function | Add export or fix module load |
| 4-N | `me-data-core.test.js` | ~3 | `meDataInit` issues | Check state init |
| 4-O | `me-data-relational-queries.test.js` | ~10 | Relational query mock shapes wrong | Fix mock shapes |
| 4-P | `operations-forecast-data.test.js` | ~5 | `opsForecastBuildWeightedMatrix` not defined | Add export |
| 4-Q | `permissions-helpers.test.js` | ~5 | Hybrid permission logic broken | Fix logic or update test expectations |
| 4-R | `npi-dashboard-search.test.js` | ~3 | Search/focus function not accessible | Export from module |
| 4-S | `npi-navigation-open-project.test.js` | ~4 | Navigation open project issues | Fix navigation mock |
| 4-T | `work-areas-data.test.js` | ~6 | workAreasData queries failing | Check mock shape matches source |
| 4-U | `families-data-core.test.js` | ~6 | familiesDataLoad/Init failing | Check module load and mock |
| 4-V | `capacity-hub.test.js` | ~7 | renderCapacity state undefined | Fix state mock shape |
| 4-W | `production.test.js` | ~3 | Production state issues | Fix state init |

---

## Summary

| Priority | Suites | Tests Fixed | Effort |
|---|---|---|---|
| 🔴 P1 — Critical | 4 groups | ~67 tests | Low — add `export` keywords + update 3 eval calls |
| 🟠 P2 — High | 3 groups | ~62 tests | Low — fix 4 test files |
| 🟡 P3 — Medium | 5 groups | ~79 tests | Medium — mock globals + 1 API decision |
| ⚪ P4 — Low | 23 files | ~121 tests | Medium-High — targeted per file |
| **Total** | **43 suites** | **~329 tests** | |

**Recommended order:** Fix P1 first (export keywords only, zero risk). Then P2 (simple test file changes). Then P3-D (capacity-events is the largest single group at ~30 tests). Then sweep P4 file by file.
