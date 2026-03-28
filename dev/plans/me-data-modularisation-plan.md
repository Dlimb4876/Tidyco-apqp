# Plan: ME Data Module Modularisation

## Summary

Split `portals/capacity/me/js/me-data.js` into smaller ME-only files without changing the live ME API, save flow, or page behaviour during the split.

The end state is a thin `me-data.js` facade that keeps the current `window.meData*` entry points, while focused files own:
- normalization helpers
- product support history logic
- entity CRUD
- init/save orchestration
- realtime subscriptions

This plan is intentionally structural first. Known behaviour bugs should be fixed in separate targeted changes, not folded into the extraction work unless an extraction would otherwise break runtime.

## Goals

- Reduce the size and responsibility overlap in `portals/capacity/me/js/me-data.js`
- Keep `window.meDataState` as the single mutable owner for ME data
- Preserve the existing public API so callers and tests do not need a flag day rewrite
- Make future bug fixes in save/realtime/product-support logic easier to isolate and test

## Non-Goals

- No route changes
- No data-model redesign
- No change to Supabase table names or RLS model
- No immediate PM/LOG/UNIT6 convergence work
- No behavioural clean-up bundled into the split unless required for parity with current runtime

## Guardrails

- Preserve current script order rules from `index.html`
- Keep all public `window.meData*` functions available throughout the migration
- Keep global mutable state in `window.meDataState`
- Keep the save debounce contract in `portals/capacity/me/js/me-capacity.js`
- Do not delete `portals/capacity/me/js/me-data.js` during this plan; convert it into a thin compatibility facade last
- Because this repo still has Jest suites that `readFileSync` and `eval` live files directly, treat file moves and deletions as a separate risk item, not a casual cleanup step

## Proposed File Split

Target folder remains `portals/capacity/me/js/`.

### Keep

- `me-data.js` — thin bootstrap and compatibility facade
- `me-data-relational.js` — relational DB operations

### Add

- `me-data-normalize.js` — date/department/holiday/support-history normalization helpers
- `me-data-support-history.js` — effective-dated support history helpers and product sync-back helpers
- `me-data-entities.js` — team/task/product/holiday CRUD and simple getters
- `me-data-persistence.js` — `meDataInit`, `meDataSave`, diagnostics/reset/structure helpers
- `me-data-realtime.js` — `meDataSubscribe`, `meDataUnsubscribe`, row mapping helpers

## Public API Contract To Preserve

These names stay callable from `window` for the whole plan:

- `meDataAddTeam`, `meDataUpdateTeam`, `meDataDeleteTeam`, `meDataGetTeam`
- `meDataAddTask`, `meDataUpdateTask`, `meDataDeleteTask`, `meDataGetTasks`
- `meDataAddProduct`, `meDataUpdateProduct`, `meDataDeleteProduct`, `meDataGetProducts`
- `meDataAddHoliday`, `meDataUpdateHoliday`, `meDataDeleteHoliday`, `meDataGetHolidays`
- `meDataAddProductSupportHistory`, `meDataUpdateProductSupportHistoryEntry`, `meDataDeleteProductSupportHistoryEntry`, `meDataGetProductSupportHistory`
- `meDataInit`, `meDataSave`, `meDataSubscribe`, `meDataUnsubscribe`, `meDataGetState`
- `meDataAutoSyncProductionProducts`, `meDataAutoSyncPMProducts`, `meDataAutoSyncLogProducts`, `meDataAutoSyncUnit6Products`

## Phase 1 — Freeze Current Behaviour

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** None
> **Can be paused after:** Yes
> **Risk level:** Low

Before splitting code, add characterization coverage around the current live contract.

### Work

- Extend `tests/me-data-core.test.js` with coverage for:
  - split product support field updates
  - realtime update callbacks for team, product, and support history
  - init/save public API availability through `window`
- Add one focused suite for the realtime callback shape if that keeps `me-data-core.test.js` readable
- Record any currently-known defects as intentional current-state expectations or explicit TODO notes in the plan, not as silent behavioural drift during refactor

### Exit criteria

- A focused Jest run proves the public ME data API shape is locked before extraction
- There is clear coverage for the save path and subscription update path
- Coverage now includes public API presence on `window`, current split support-field behaviour, and current realtime callback behaviour for ME team, product, and support-history updates

## Phase 2 — Extract Pure Helpers First

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 1
> **Can be paused after:** Yes
> **Risk level:** Low

Move the pure helper functions out of `me-data.js` into `me-data-normalize.js`.

### Candidate functions

- `meNormalizeDepartmentTag`
- `meNormalizeMeTableDepartment`
- `meNormalizeHolidayRecord`
- `meNormalizeAndDedupeHolidays`
- `meNormalizeDateOnly`
- `meNormalizeProductSupportBreakdown`
- `meGetDateMinusOneDay`
- `meNormalizeSupportHistoryRecord`
- `meSortSupportHistoryByDate`
- `meSupportHistoryTimestamp`
- `mePickPreferredSupportHistoryRecord`
- `meNormalizeAndDedupeSupportHistory`

### Rules

- Do not change function names yet
- Keep `window.cap*` fallback usage intact
- Load the new helper file before `me-data.js` in `index.html`

### Exit criteria

- `me-data.js` no longer owns pure normalization logic
- No runtime behaviour change in focused ME data tests
- Extracted helpers now live in `portals/capacity/me/js/me-data-normalize.js`, with `index.html` and the eval-based ME data test harness loading that file before `me-data.js`

## Phase 3 — Extract Product Support History Logic

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 2
> **Can be paused after:** Yes
> **Risk level:** Medium

Move all effective-dated support-history behaviour into `me-data-support-history.js`.

### Candidate functions

- `meGetProductSupportHistoryRows`
- `meEnsureProductSupportHistoryBaseline`
- `meEnsureAllProductSupportHistoryBaselines`
- `meApplyLatestSupportHistoryToProduct`
- `meDataAddProductSupportHistory`
- `meDataUpdateProductSupportHistoryEntry`
- `meDataDeleteProductSupportHistoryEntry`
- `meDataGetProductSupportHistory`
- `meDataGetProductSupportRateForDate`
- `meDataGetProductLatestSupportEffectiveDate`

### Why this phase early

This is the most entangled part of the file and the most likely area for future fixes. Isolating it early reduces the chance that persistence and CRUD extractions accidentally duplicate support-history side effects.

### Exit criteria

- Product support history is owned by one file
- Product CRUD calls into support-history helpers instead of embedding that logic inline
- Extracted support-history ownership now lives in `portals/capacity/me/js/me-data-support-history.js`, with `index.html` and the eval-based ME data test harness loading that file after `me-data.js`

## Phase 4 — Extract Entity CRUD

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 3
> **Can be paused after:** Yes
> **Risk level:** Medium

Move direct ME entity CRUD into `me-data-entities.js`.

### Grouping

- Team CRUD + getters
- Task CRUD + getters
- Product CRUD + getters
- Holiday CRUD + getters
- Department product autosync helpers

### Notes

- Keep direct mutations against `meDataState`
- Keep pending-delete queue logic in the same place as delete operations unless Phase 5 needs shared persistence helpers
- Avoid renaming public functions in this phase

### Exit criteria

- Entity add/update/delete/get operations are no longer mixed with init/save/realtime logic
- Extracted entity CRUD and department product autosync now live in `portals/capacity/me/js/me-data-entities.js`, with `index.html` and the eval-based ME data test harness loading that file after `me-data-support-history.js`

## Phase 5 — Extract Persistence Orchestration

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 4
> **Can be paused after:** Yes
> **Risk level:** Medium to High

Move orchestration code into `me-data-persistence.js`.

### Candidate functions

- `meInitTeamDates`
- `meDataInit`
- `meDataSave`
- `meDataGetState`
- `meDataReset`
- `meEnsureStructure`
- `meDiagnostics`

### Rules

- Keep `me-data-relational.js` as the DB adapter layer
- Do not change the save order without a separate bug-fix task
- Keep save-queue semantics and sync badge behaviour intact

### Exit criteria

- `meDataInit` and `meDataSave` live outside the facade file
- Focused init/save tests still pass unchanged
- Persistence/orchestration ownership now lives in `portals/capacity/me/js/me-data-persistence.js`, with `index.html` and the eval-based ME data test harness loading that file after `me-data-entities.js`
- Post-extraction review fixes now keep existing-row ME realtime updates in sync for teams, products, support-history rows, and holidays, and support-history edits immediately refresh the matching live product state

## Phase 6 — Extract Realtime Wiring

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phase 5
> **Can be paused after:** Yes
> **Risk level:** Medium to High

Move realtime subscription code into `me-data-realtime.js`.

### Candidate functions

- `meNormalizeTaskRow`
- `meDataSubscribe`
- `meDataUnsubscribe`

### Rules

- Keep the same channel name unless a separate migration is planned
- Preserve inline-edit guards and pending-rerender flags
- Preserve `removeRealtimeSubscription('me_all_channel')` compatibility

### Exit criteria

- Subscription code is isolated from save/init code
- Realtime-focused tests pass against the same public API
- Realtime ownership now lives in `portals/capacity/me/js/me-data-realtime.js`, with `index.html` and the eval-based ME data test harness loading that file after `me-data-persistence.js`

## Phase 7 — Convert me-data.js To Facade

Status: COMPLETE on 2026-03-27.

> **Prerequisite:** Phases 1 to 6
> **Can be paused after:** Yes
> **Risk level:** Medium

Shrink `portals/capacity/me/js/me-data.js` to:

- `window.meDataState` initialization
- `window.meDataPendingDeletes` initialization
- save-state flags
- thin compatibility exports if needed
- file-level comments describing ownership of the extracted modules

### Exit criteria

- The original file is a small compatibility layer rather than the logic owner
- Call sites and tests still use the same public names
- `portals/capacity/me/js/me-data.js` now owns only the ME bootstrap factories/state flags plus file-level module ownership notes, and `me-data-persistence.js` reuses those facade factories so reset/init cannot drift from the live facade shape

## Validation Strategy

- Focused: `npm test -- tests/me-data-core.test.js`
- Add any new ME-data-specific suites to the focused command as they appear
- Spot-check browser boot to confirm `index.html` script order still resolves all globals
- Avoid relying on full `npm run check:all` as the main gate while unrelated repo-wide syntax issues are present

## Risks

- Direct-file Jest `eval` loading means file moves can break tests even when runtime is fine
- Global-scope ordering matters because this is a vanilla JS SPA with no module system
- Save and realtime code have side effects across shared mutable state, so extraction order matters more than raw line count

## Recommended First Execution Slice

Start with Phase 1 plus Phase 2 only:

1. Add the missing characterization tests.
2. Extract pure helpers into `me-data-normalize.js`.
3. Update `index.html` load order for the new helper file.
4. Stop and revalidate before touching support history, persistence, or realtime.

That gets the file smaller quickly while keeping the lowest-risk part of the split separate from the high-risk save/subscription behaviour.