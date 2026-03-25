# Per-Person Product Support Allocation for ME Heatmap

## Problem

Currently, ME product support demand (e.g. 7h/batch for Product X) is added to the team's **total** support column in the bar chart, but has no effect on individual heatmap cells. A person's heatmap cell only reflects their `me_tasks` hours — so someone spending 20h/week kitting Product Y shows as 0% utilization. This makes the heatmap not truly reflective of individual workload.

Multiple people can support the same product, so support hours need to be **split proportionally** between people (e.g. 7h/batch split 50/50 = 3.5h each). Support is a sub-role on top of tasks, so it needs to be added to individual capacity on top of task hours.

**Scope:** ME portal only (PM uses task-category-based support, which is out of scope for this plan).

---

## 1. Database

### New Table: `me_product_allocations`

```sql
CREATE TABLE me_product_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES me_teams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES me_products(id) ON DELETE CASCADE,
  fte_percent NUMERIC NOT NULL DEFAULT 0 CHECK (fte_percent >= 0),
  start_date DATE DEFAULT '2000-01-01',
  end_date DATE DEFAULT '2099-12-31',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  UNIQUE(department, person_id, product_id)
);
```

- `department` reserved for future PM support (not used in this phase)
- `fte_percent` is the person's split of that product's total support hours (e.g. 50 = 50%)
- `start_date`/`end_date` allow time-bounded allocations (e.g. person covers a product only during a project window)
- RLS: same pattern as `me_teams` — no client-side `user_id` filter, relies on Supabase RLS for department isolation

### RLS Policies

```sql
ALTER TABLE me_product_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their department's allocations"
  ON me_product_allocations FOR ALL
  USING (auth.jwt() ->> 'dept' = department)
  WITH CHECK (auth.jwt() ->> 'dept' = department);
```

---

## 2. Data Layer

### `me-data.js` — State and CRUD

Add `allocations` array to `meDataState`:

```javascript
window.meDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: [],
  allocations: []   // NEW
};
```

CRUD functions following the existing `meDataAddTeam`/`Update`/`Delete` pattern:

| Function | Purpose |
|---|---|
| `meDataGetAllocations()` | Returns `meDataState.allocations` |
| `meDataAddAllocation(personId, productId, ftePercent, startDate, endDate)` | Creates new row, adds to state |
| `meDataUpdateAllocation(idx, field, value)` | Inline edit (feeds into existing debounce/save flow) |
| `meDataDeleteAllocation(idx)` | Removes row from state |

Wire into `meDataSave` (add call to save all dirty allocations).

### `me-data-relational.js` — Supabase Persistence

| Function | Purpose |
|---|---|
| `meLoadRelationalAllocations(userId)` | Loads all allocations for department, maps snake_case to camelCase |
| `meSaveRelationalAllocation(userId, allocation)` | Upsert, handles id/uuid generation |
| `meDeleteRelationalAllocation(id)` | Delete by row id |

### `me-data.js` — Realtime

Add `'me_product_allocations'` to `createMultiTableRealtimeSubscription` in `meDataSubscribe`, with INSERT/UPDATE/DELETE handlers mirroring team/task tables.

---

## 3. Calculations (`me-calculations.js`)

### New Function

```javascript
window.meCalcPersonWeekSupportAllocation = function(personId, weekStart, weekEnd, allocationsArray, productsArray) {
  // 1. Filter allocations where assigneeId === personId AND effective (start/end date)
  // 2. For each allocated product:
  //    - Look up product's support hours for this week (from product history + batch overlap)
  //    - Multiply by (fte_percent / 100)
  // 3. Sum all products -> weekly support hours for this person
};
```

### Integration Points

**1. Heatmap — `meCalcWeekUtilisation`:**
Add `allocationsArray` parameter. After summing task demand, add `supportAllocationHours`. Return `{ capacity, demand, allocationDemand, utilisationPct }`.

**2. Bar chart — `meCalculateMonthData`:**
After the existing batch-support loop, inject per-person allocation demand so the Support bar reflects individual split.

---

## 4. UI — Dedicated Allocations Tab

### New File: `me-product-allocations.js`

Layout: table grid with **products as rows** and **team members as columns**. Each cell is an editable percentage input.

| | Alice (ME) | Bob (ME) | Carol (ME) |
|---|---|---|---|
| Product X | 50% | 25% | 25% |
| Product Y | 100% | — | — |
| Product Z | 20% | 80% | — |

**Features:**
- Inline editing (click cell -> type -> debounce save)
- Only products with active support hours (effective history + batch overlap in current month) shown
- Only active team members shown (start/end date in range)
- Row totals per product (not capped — useful validation)
- KPI strip: Total products, total team members, total allocations, total FTE% allocated

Render function signature:
```javascript
window.meRenderProductAllocationsTab = function(productsArray, teamArray)
```

### `me-capacity.js` Changes

1. Add nav button in `renderMeCapacity()`:
   ```html
   <button class="me-nav-btn ${meTab === 'product-allocations' ? 'active' : ''}"
           data-tab="product-allocations" data-cap-action="cap-me-set-tab">
     Support Allocations
   </button>
   ```

2. Add case in `meGetTabContent()` switch:
   ```javascript
   case 'product-allocations':
     return meRenderProductAllocationsTab(meDataGetProducts(), meDataGetTeam());
   ```

---

## 5. Heatmap Drill-Down Modal (`me-heatmap.js`)

Update the drill-down modal to show a **"Support" row** alongside NPI/Improvement/Tendering/Other. Hours come from the new `allocationDemand` field. Show `—` or `0h` if the person has no allocations.

---

## 6. Script Load Order

Add `<script src="me-product-allocations.js">` in `index.html` after `me-products.js`. Run `npm run check:load-order` to verify.

---

## 7. Files Summary

| File | Change |
|---|---|
| `supabase/me_product_allocations.sql` | New table + RLS policies |
| `portals/capacity/js/me-product-allocations.js` | **New file** — allocations tab UI |
| `portals/capacity/js/me-data.js` | `allocations` in `meDataState`, CRUD, save wiring, realtime |
| `portals/capacity/js/me-data-relational.js` | Load/save/delete for new table |
| `portals/capacity/js/me-calculations.js` | `meCalcPersonWeekSupportAllocation`, integrate into existing functions |
| `portals/capacity/js/me-heatmap.js` | Drill-down modal: add Support row |
| `portals/capacity/js/me-capacity.js` | Tab button + switch case |
| `index.html` | `<script>` tag for new file |
| `CHANGELOG.md` | Entry |

---

## 8. Verification

1. `npm test` — all tests pass
2. `npm run check:all` — all checks pass
3. Manual test:
   - Create/edit a product with support hours (effective history)
   - Open "Support Allocations" tab, assign a person (e.g. 50%)
   - Open the heatmap — their cell should show >0% demand even with 0 tasks assigned
   - Drill down — should show a "Support" row with the prorated hours
