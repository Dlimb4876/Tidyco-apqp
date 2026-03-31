# Plan: Per-Product Support Demand Allocation

## Context

Product support demand is currently calculated as a department-level aggregate and shown only in the monthly chart — it is not assigned to individual people and does not appear in the heatmap. Users need to split each product's weekly support hours across specific team members by percentage, time-vary those allocations, and have the resulting demand appear in each person's heatmap cells.

> **Note — new capability**: The heatmap currently ignores product support entirely (it only shows task demand). Product support rates currently feed the *chart* via a `supportRateResolver` closure registered in each department's `getCalcOptions()`. This plan adds product-support demand to the heatmap for the first time.

---

## Design Summary

### Data Model

Four new Supabase tables (one per department):

`{dept}_product_support_allocations` (dept = me / pm / log / unit6)
- `id` UUID PK
- `user_id` UUID (auth)
- `product_id` UUID — FK → `{dept}_products.id`
- `person_id` UUID — FK → `{dept}_teams.id`
- `percentage` DECIMAL — 0–100
- `effective_date` DATE
- `end_date` DATE (null = open-ended)
- `notes` TEXT

An allocation **record set** = all rows sharing the same `product_id + effective_date`. Percentages across a set must sum to 100 before saving. When a new set is saved, the previous open-ended rows for that product have their `end_date` set to `effective_date - 1 day`.

RLS policy: `auth.role() = 'authenticated'` (auth-only, consistent with all other tables).

### UI

- Products tab gains an **Allocations** button per product row.
- Clicking opens a dynamically-created modal (built in JS via `insertAdjacentHTML`, same pattern as `capOpenHeatmapDetail()` in `cap-heatmap.js`) with:
  1. **Current split panel** — table of active allocations (Person | % | Since) + proportional colour bar.
  2. **History list** — past allocation sets, collapsed.
  3. **Add new allocation set** form — date picker, per-person rows (dropdown + % input), live running total (red until 100%, green at 100%), Save enabled only at 100%.
- Uses `showModal()` / `closeModal()` from `helpers.js` for open/close lifecycle.

### Calculation Engine

- New `capGetProductSupportAllocationsForDate(productId, date, allocationsArray)` in `cap-data-utils.js` — mirrors `meDataGetProductSupportRateForDate`; returns `[{ personId, percentage }]` for the active set on a given date, or `[]`.
- `capCalcWeekUtilisation()` in `cap-calculations.js` extended — add `products` + `allocations` params after existing params; for each product, resolves its support rate for the week midpoint, resolves allocations for that date, and adds `hoursPerWeek × (percentage / 100)` to the matching person's demand.
- `capDrawHeatmapNow()` in `cap-heatmap.js` — current signature is `(teamArray, tasksArray, _productsArray, holidaysArray, monthKey)` and ME already passes a 6th department arg. Add `allocations` as 7th param (or refactor trailing args into an options object to avoid a growing positional list). Wire the existing unused `_productsArray` and thread both `products` + `allocations` down to `capCalcWeekUtilisation`.
- Product support demand appears as **sum total only** in the weekly demand figure — no per-product line in the detail modal.

### Data Layer (per department, ME shown — PM/LOG/UNIT6 mirror)

- `meDataState.productSupportAllocations = []` in `me-data.js`
- `meLoadRelationalProductSupportAllocations()` in `me-data-relational.js`
- `meSaveProductSupportAllocationSet(productId, effectiveDate, rows)` — **set-based upsert** (not the bulk delete-then-insert used by support history): insert new rows for the set, then close previous open-ended rows for that product by setting `end_date = effectiveDate - 1 day`.
- `meDeleteProductSupportAllocation(id)`
- Realtime subscription on `me_product_support_allocations` — on change, re-render Products tab + `requestRender` heatmap.

---

## Critical Files

| File | Change |
|---|---|
| `portals/capacity/shared/js/cap-data-utils.js` | Add `capGetProductSupportAllocationsForDate()` + normaliser |
| `portals/capacity/shared/js/cap-calculations.js` | Extend `capCalcWeekUtilisation()` signature + product-support demand loop |
| `portals/capacity/shared/js/cap-heatmap.js` | Wire `_productsArray`, add `allocations` param (7th or options), thread to calc |
| `portals/capacity/shared/js/cap-products.js` | Add Allocations button + dynamic modal (render, open, close, save, delete) |
| `portals/capacity/me/js/me-data.js` | Add `productSupportAllocations: []` to state |
| `portals/capacity/me/js/me-data-relational.js` | Add load / save-set / delete functions |
| `portals/capacity/me/js/me-data-realtime.js` | Subscribe to `me_product_support_allocations` table |
| `portals/capacity/me/js/me-capacity.js` | Pass `meDataState.productSupportAllocations` to `capDrawHeatmapNow` |
| `portals/capacity/project-management/js/pm-data.js` | Add state + realtime (monolithic file) |
| `portals/capacity/project-management/js/pm-data-relational.js` | Add load / save-set / delete functions |
| `portals/capacity/project-management/js/pm-capacity.js` | Pass allocations to `capDrawHeatmapNow` |
| `portals/capacity/logistics/js/log-data.js` | Add state + realtime (monolithic file) |
| `portals/capacity/logistics/js/log-data-relational.js` | Add load / save-set / delete functions |
| `portals/capacity/logistics/js/log-capacity.js` | Pass allocations to `capDrawHeatmapNow` |
| `portals/capacity/unit6/js/unit6-data.js` | Add state + realtime (monolithic file) |
| `portals/capacity/unit6/js/unit6-data-relational.js` | Add load / save-set / delete functions |
| `portals/capacity/unit6/js/unit6-capacity.js` | Pass allocations to `capDrawHeatmapNow` |
| `utils/js/guide.js` | Update `GUIDE_CONTENT` for all four capacity tabs |
| `CHANGELOG.md` | Add entry |

## Existing Utilities to Reuse

- `capNormalizeSupportHistoryRecord` in `cap-data-utils.js` — structural template for the new allocation normaliser
- `meDataGetProductSupportRateForDate()` in `me-data-support-history.js` — template for the new date-based allocation resolver
- `showModal()` / `closeModal()` from `helpers.js` — modal open/close lifecycle
- `esc()` from `helpers.js` — XSS-safe rendering of user data
- `requestRender()` / `flushDeferred()` from `utils/js/render-scheduler.js` — deferred re-render after realtime events
- `createMultiTableRealtimeSubscription()` from `utils/js/realtime.js` — multi-table single-channel pattern (ME uses this; PM/LOG/UNIT6 can mirror)
- `capOpenHeatmapDetail()` in `cap-heatmap.js` — reference pattern for dynamically-created modals

---

## Phases

### Phase 1 — Database

Create the four allocation tables in Supabase with RLS.

- [x] 1.1 Create `me_product_support_allocations` table with columns and auth-only RLS
- [x] 1.2 Create `pm_product_support_allocations` table with columns and auth-only RLS
- [x] 1.3 Create `log_product_support_allocations` table with columns and auth-only RLS
- [x] 1.4 Create `unit6_product_support_allocations` table with columns and auth-only RLS
- [x] 1.5 Save migration SQL to `supabase/` for version control

**Done when**: All four tables visible in Supabase dashboard with correct columns and RLS enabled.

---

### Phase 2 — Shared Calculation Engine

Add the shared allocation resolver and extend the heatmap calculation pipeline. This is the core logic that all four departments will share.

- [x] 2.1 Add `capNormalizeAllocationRecord()` to `cap-data-utils.js` (mirrors `capNormalizeSupportHistoryRecord`)
- [x] 2.2 Add `capGetProductSupportAllocationsForDate(productId, date, allocationsArray)` to `cap-data-utils.js`
- [x] 2.3 Extend `capCalcWeekUtilisation()` in `cap-calculations.js` — add `options` param; add product-support demand loop that resolves rate × allocation % per person
- [x] 2.4 Wire `capDrawHeatmapNow()` in `cap-heatmap.js` — activate `productsArray`, add `options` param, thread `calcOpts` to `capCalcWeekUtilisation`

**Done when**: Shared engine accepts allocation data and produces correct per-person demand figures (verified by unit tests in Phase 3).

---

### Phase 3 — ME Data Layer (reference implementation)

Build the full data pipeline for ME as the reference that other departments will mirror.

- [x] 3.1 Add `productSupportAllocations: []` to `meDataState` in `me-data.js`
- [x] 3.2 Add `meLoadRelationalProductSupportAllocations()` to `me-data-relational.js`
- [x] 3.3 Add `meSaveProductSupportAllocationSet(productId, effectiveDate, rows)` to `me-data-relational.js` — set-based upsert: insert new rows, close previous open-ended rows
- [x] 3.4 Add `meDeleteProductSupportAllocation(id)` to `me-data-relational.js`
- [x] 3.5 Add realtime subscription on `me_product_support_allocations` in `me-data-realtime.js` — on change, update state + `requestRender`
- [x] 3.6 Pass `meDataState.productSupportAllocations` to `capDrawHeatmapNow` in `me-capacity.js`

**Done when**: ME heatmap reflects allocated product-support demand per person. Saving an allocation set closes previous open-ended rows correctly.

---

### Phase 4 — Tests

Write Jest tests for the new shared logic and the ME data layer.

- [x] 4.1 Test `capGetProductSupportAllocationsForDate()` — active set lookup, date boundary edge cases, no-match returns `[]`
- [x] 4.2 Test `capCalcWeekUtilisation()` with allocations — correct per-person demand from product support, zero-allocation person unaffected
- [x] 4.3 Test 100%-sum validation logic (client-side guard)
- [x] 4.4 Test `meSaveProductSupportAllocationSet()` — new rows inserted, previous open-ended rows closed
- [x] 4.5 Run `npm test` — all existing + new tests pass

**Done when**: `npm test` passes with new test coverage for allocation resolver, calculation, validation, and save logic.

---

### Phase 5 — PM / LOG / UNIT6 Data Layers

Mirror the ME reference implementation for the remaining three departments.

- [x] 5.1 **PM**: Add `productSupportAllocations: []` to `pmDataState`, add realtime subscription — both in `pm-data.js` (monolithic)
- [x] 5.2 **PM**: Add load / save-set / delete to `pm-data-relational.js`
- [x] 5.3 **PM**: Pass allocations to `capDrawHeatmapNow` in `pm-capacity.js`
- [x] 5.4 **LOG**: Add `productSupportAllocations: []` to `logDataState`, add realtime subscription — both in `log-data.js` (monolithic)
- [x] 5.5 **LOG**: Add load / save-set / delete to `log-data-relational.js`
- [x] 5.6 **LOG**: Pass allocations to `capDrawHeatmapNow` in `log-capacity.js`
- [x] 5.7 **UNIT6**: Add `productSupportAllocations: []` to `unit6DataState`, add realtime subscription — both in `unit6-data.js` (monolithic)
- [x] 5.8 **UNIT6**: Add load / save-set / delete to `unit6-data-relational.js`
- [x] 5.9 **UNIT6**: Pass allocations to `capDrawHeatmapNow` in `unit6-capacity.js`

**Done when**: All four department heatmaps reflect allocated product-support demand.

---

### Phase 6 — UI

Build the allocation modal in the shared Products tab.

- [x] 6.1 Add **Allocations** button to each product row in `cap-products.js`
- [x] 6.2 Build dynamic allocation modal in `cap-products.js` (via `insertAdjacentHTML`, following `capOpenHeatmapDetail()` pattern):
  - Current split panel (Person | % | Since) + proportional colour bar
  - Collapsed history list of past allocation sets
  - Add-new-set form: date picker, per-person dropdown + % input, live running total
- [x] 6.3 Wire Save button — enabled only when total = 100%; calls department-specific `save` function
- [x] 6.4 Wire Delete button — removes individual allocation rows
- [x] 6.5 Wire modal close + cleanup (remove modal DOM node on close)

**Done when**: Clicking Allocations opens a modal, 100% validation works, saving persists correctly and refreshes the current-split panel.

---

### Phase 7 — Finishing

- [x] 7.1 Update `GUIDE_CONTENT` in `utils/js/guide.js` for `capacity-me`, `capacity-pm`, `capacity-log`, `capacity-unit6`
- [x] 7.2 Add `CHANGELOG.md` entry
- [x] 7.3 Run `npm test` — all tests pass
- [x] 7.4 Run `npm run check:all` — all checks pass

**Done when**: Full validation suite green.

---

## Verification Checklist

- [ ] **DB**: All four allocation tables exist in Supabase with correct columns and RLS.
- [ ] **UI**: Products tab → Allocations button → modal opens → enter split that does NOT sum to 100% → Save disabled. Enter split that sums to 100% → Save enabled → saves → current split panel updates.
- [ ] **Heatmap**: With allocations saved, heatmap shows increased demand for allocated person. Person with 0% allocation unchanged.
- [ ] **Time-varying**: Add second allocation set with future effective date → heatmap cells before that date reflect old split, cells on/after reflect new split.
- [ ] **All departments**: Repeat UI + Heatmap + Time-varying checks for PM, Logistics, and Unit 6.
- [ ] **Tests**: `npm test` passes.
- [ ] **Checks**: `npm run check:all` passes.
