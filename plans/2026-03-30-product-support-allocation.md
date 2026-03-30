# Plan: Per-Product Support Demand Allocation

## Context

Product support demand is currently calculated as a department-level aggregate and shown only in the monthly chart — it is not assigned to individual people and does not appear in the heatmap. Users need to split each product's weekly support hours across specific team members by percentage, time-vary those allocations, and have the resulting demand appear in each person's heatmap cells.

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
- Clicking opens a modal with:
  1. **Current split panel** — table of active allocations (Person | % | Since) + proportional colour bar
  2. **History list** — past allocation sets, collapsed
  3. **Add new allocation set** form — date picker, per-person rows (dropdown + % input), live running total (red until 100%, green at 100%), Save enabled only at 100%
- Modal follows the existing support-history modal pattern (same shell, same effective-date UX).

### Calculation Engine
- New `capGetProductSupportAllocationsForDate(productId, date, allocationsArray)` in `cap-data-utils.js` — mirrors `meDataGetProductSupportRateForDate`; returns `[{ personId, percentage }]` for the active set on a given date, or `[]`.
- `capCalcWeekUtilisation(personId, weekStart, weekEnd, tasks, holidays, team, products, allocations)` extended — for each product, resolves its support rate for the week midpoint, resolves allocations for that date, and adds `hoursPerWeek × (percentage/100)` (prorated over week) to the matching person's demand.
- `capDrawHeatmapNow(team, tasks, products, holidays, monthKey, allocations)` — `_productsArray` wired up (was accepted but unused); new `allocations` param threaded down to `capCalcWeekUtilisation`.
- Product support demand appears as **sum total only** in the weekly demand figure — no per-product line in the detail modal.

### Data Layer (per department, ME shown — PM/LOG/UNIT6 mirror)
- `meDataState.productSupportAllocations = []` in `me-data.js`
- `meLoadRelationalProductSupportAllocations()` in `me-data-relational.js`
- `meSaveProductSupportAllocationSet(productId, effectiveDate, rows)` — upserts new rows + closes previous open-ended record
- `meDeleteProductSupportAllocation(id)`
- Realtime subscription on `me_product_support_allocations` — on change, re-render Products tab + `requestRender` heatmap

---

## Critical Files

| File | Change |
|---|---|
| `portals/capacity/shared/js/cap-data-utils.js` | Add `capGetProductSupportAllocationsForDate()` |
| `portals/capacity/shared/js/cap-calculations.js` | Extend `capCalcWeekUtilisation()` signature + logic |
| `portals/capacity/shared/js/cap-heatmap.js` | Wire `products` + add `allocations` param; thread to `capCalcWeekUtilisation` |
| `portals/capacity/shared/js/cap-products.js` | Add Allocations button + modal render logic |
| `portals/capacity/me/js/me-data.js` | Add `productSupportAllocations: []` to state |
| `portals/capacity/me/js/me-data-relational.js` | Add load/save/delete functions |
| `portals/capacity/me/js/me-data-realtime.js` | Subscribe to new table |
| `portals/capacity/me/js/me-capacity.js` | Pass `productSupportAllocations` to `capDrawHeatmapNow` |
| `portals/capacity/project-management/js/pm-data.js` | Mirror ME changes (monolithic — state + realtime in same file) |
| `portals/capacity/project-management/js/pm-data-relational.js` | Add load/save/delete functions |
| `portals/capacity/project-management/js/pm-capacity.js` | Pass allocations to `capDrawHeatmapNow` |
| `portals/capacity/logistics/js/log-data.js` | Mirror ME changes (monolithic — state + realtime in same file) |
| `portals/capacity/logistics/js/log-data-relational.js` | Add load/save/delete functions |
| `portals/capacity/logistics/js/log-capacity.js` | Pass allocations to `capDrawHeatmapNow` |
| `portals/capacity/unit6/js/unit6-data.js` | Mirror ME changes |
| `portals/capacity/unit6/js/unit6-data-relational.js` | Mirror ME changes |
| `portals/capacity/unit6/js/unit6-capacity.js` | Mirror ME changes |
| `index.html` | Add allocation modal HTML + load new scripts if any |
| `utils/js/guide.js` | Update `GUIDE_CONTENT` for `capacity-me`, `capacity-pm`, and equivalent LOG/UNIT6 keys |
| `CHANGELOG.md` | Add entry |

## Existing Utilities to Reuse

- `capNormalizeSupportHistoryRecord` in `cap-data-utils.js` — as the structural template for the new allocation resolver
- `meDataGetProductSupportRateForDate()` in `me-data-support-history.js` as the template for the new allocation resolver
- `showModal()` / `closeModal()` from `helpers.js` for the allocation modal
- `esc()` from `helpers.js` for all user data in HTML strings
- `requestRender()` / `flushDeferred()` from `utils/js/render-scheduler.js`
- `createRealtimeSubscription()` from `utils/js/realtime.js`
- Existing `getEffectiveSubtasks()` array pattern in `cap-calculations.js` (already iterates subtasks — product support slots in alongside it)

---

## Implementation Steps

### Phase 1 — Database
1. Create `me_product_support_allocations` table with RLS in Supabase
2. Create `pm_product_support_allocations` table with RLS
3. Create `log_product_support_allocations` table with RLS
4. Create `unit6_product_support_allocations` table with RLS

### Phase 2 — Shared Engine
5. Add `capGetProductSupportAllocationsForDate()` to `cap-data-utils.js`
6. Extend `capCalcWeekUtilisation()` in `cap-calculations.js` — add `products` + `allocations` params; add product-support demand loop
7. Wire up `capDrawHeatmapNow()` in `cap-heatmap.js` — use `productsArray`, add `allocations` param, thread both to `capCalcWeekUtilisation`

### Phase 3 — ME Data Layer (reference implementation)
8. Add `productSupportAllocations: []` to `meDataState` in `me-data.js`
9. Add `meLoadRelationalProductSupportAllocations()`, `meSaveProductSupportAllocationSet()`, `meDeleteProductSupportAllocation()` to `me-data-relational.js`
10. Add realtime subscription on `me_product_support_allocations` in `me-data-realtime.js`
11. Pass `meDataState.productSupportAllocations` to `capDrawHeatmapNow` in `me-capacity.js`

### Phase 4 — PM / LOG / UNIT6 Data Layers
12. Mirror steps 8–11 for PM — state + realtime in `pm-data.js` (monolithic), CRUD in `pm-data-relational.js`, orchestrator in `pm-capacity.js`
13. Mirror steps 8–11 for Logistics — state + realtime in `log-data.js` (monolithic), CRUD in `log-data-relational.js`, orchestrator in `log-capacity.js`
14. Mirror steps 8–11 for Unit 6 — state + realtime in `unit6-data.js` (monolithic), CRUD in `unit6-data-relational.js`, orchestrator in `unit6-capacity.js`

### Phase 5 — UI
15. Add Allocations button to each product row in `cap-products.js`
16. Add allocation modal render logic to `cap-products.js` (current split panel, history, add-new form with live 100% validation)
17. Add modal HTML shell to `index.html`

### Phase 6 — Finishing
18. Update `GUIDE_CONTENT` in `utils/js/guide.js` for affected capacity tabs
19. Add `CHANGELOG.md` entry
20. Run `npm run check:all` and verify all tests pass

---

## Verification

1. **DB**: Confirm all four allocation tables exist in Supabase with correct columns and RLS.
2. **UI**: Open the Products tab for ME → click Allocations on a product → enter a split that does NOT sum to 100% → Save should be disabled. Enter one that sums to 100% → Save enabled → saves successfully → current split panel updates.
3. **Heatmap**: With allocations saved, open the Heatmap tab → person with an allocation should show increased demand in their cells for weeks where that product has active batches. Person with 0% allocation should see no change.
4. **Time-varying**: Add a second allocation set with a future effective date → heatmap cells before that date reflect old split, cells on/after reflect new split.
5. **All departments**: Repeat steps 2–4 for PM, Logistics, and Unit 6 tabs.
6. **Tests**: `npm run check:all` passes.
