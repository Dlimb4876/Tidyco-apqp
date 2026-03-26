# Plan: Surgical Realtime DOM Updates

**Problem**: Every realtime event (INSERT/UPDATE/DELETE) triggers a full `innerHTML` replacement of the portal container. This causes every connected user's page to visibly flash and reload when any other user makes a change.

**Goal**: Replace full re-renders in realtime callbacks with surgical DOM patches — only the changed card, row, or element is touched, leaving everything else on screen undisturbed.

**Consistent pattern used in every phase**:
```
onInsert → patchInsert(record)   → create element, inject into list/table
onUpdate → patchUpdate(record)   → find element by data-id, replace its content
onDelete → patchDelete(record)   → find element by data-id, remove it
```

Each portal will expose `renderRecordHTML(record)` — a function that returns the HTML for a single item — and three patch functions that use it. The full render function continues to work as-is for initial page load; only the realtime callbacks change.

---

## Phase 1 — Shared Helper Utility

**Goal**: Create one shared utility so all portals patch the DOM the same way, reducing duplicated logic and making future fixes a one-place change.

**File to create**: `utils/js/realtime-patch.js`

### Functions to implement

```javascript
/**
 * Patch helpers for surgical realtime DOM updates.
 * Each portal provides a renderItemHTML(record) function
 * and a selector for the list/table body container.
 */

/**
 * Patch an INSERT: prepend or append a new element.
 * @param {string} containerSelector  - CSS selector for the list/tbody
 * @param {string} itemHTML           - Rendered HTML for the new record
 * @param {object} options
 *   @param {boolean} options.prepend - true = prepend (newest-first lists), false = append
 *   @param {Function} options.sortFn - optional re-sort after insert (for alpha-sorted lists)
 */
function realtimePatchInsert(containerSelector, itemHTML, options = {}) { ... }

/**
 * Patch an UPDATE: find element by data-id, swap its outerHTML.
 * @param {string} containerSelector  - CSS selector for the list/tbody
 * @param {string|number} recordId    - The record's id value
 * @param {string} itemHTML           - Rendered HTML for the updated record
 */
function realtimePatchUpdate(containerSelector, recordId, itemHTML) { ... }

/**
 * Patch a DELETE: find element by data-id and remove it.
 * Optionally show empty state if list becomes empty.
 * @param {string} containerSelector  - CSS selector for the list/tbody
 * @param {string|number} recordId    - The record's id value
 * @param {Function} options.onEmpty  - called if list becomes empty after removal
 */
function realtimePatchDelete(containerSelector, recordId, options = {}) { ... }
```

**Convention**: every rendered item must carry `data-id="{{record.id}}"` on its outermost element. This is the selector anchor for update/delete patches.

**Script load order**: add to `index.html` immediately after `realtime.js` and before portals.

---

## Phase 2 — Simple List Portals (Low complexity, high visibility win)

These portals render a flat list or table from a single table. Easiest to patch.

### 2a. Work Areas (`portals/capacity/js/work-areas-data.js`)
- **UI**: alphabetically sorted list of work area names
- **Change**: replace `render()` calls in subscription with `patchInsert` (then re-sort) / `patchUpdate` / `patchDelete`
- **renderItemHTML**: single list item card/row for one work area

### 2b. Families (`portals/product-development/js/families-data.js`)
- **UI**: product families settings table
- **Change**: replace `familiesDataLoad() + renderSettingsFamiliesTab()` with patch functions
- **renderItemHTML**: single table row for one family

### 2c. Family PFMEA Templates (`portals/product-development/js/family-templates-data.js`)
- **UI**: template items table grouped by family
- **Change**: replace `render()` calls with patch functions
- **renderItemHTML**: single template row; on INSERT also check if group header exists

### 2d. ABC Catalogue (`portals/product-development/npi/js/bom-cclass.js`)
- **UI**: ABC catalogue table (tab-gated, already skips if not on tab)
- **Change**: replace `render()` with patch functions inside the existing tab guard
- **renderItemHTML**: single catalogue row with datasheet link and action buttons

---

## Phase 3 — Card List Portals (Medium complexity)

These portals render a list of cards. The card HTML needs to be extracted into a single-record render function.

### 3a. MCS (`portals/mcs/js/mcs-main.js`)
- **UI**: change register — list of MCS cards sorted by date
- **Current**: `mcsRenderList()` rebuilds entire card list container
- **Change**: extract `mcsRenderCardHTML(record)` from the existing map; use `patchInsert` (prepend) / `patchUpdate` / `patchDelete`
- **Note**: the open modal refresh in UPDATE (`mcsShowViewModal`) stays as-is — that is already surgical

### 3b. Feedback (`portals/feedback/js/feedback-data.js`)
- **UI**: feedback item list
- **Change**: replace `_publishChange()` → full render chain with direct patch calls
- **renderItemHTML**: single feedback card

### 3c. Products / Hub (`portals/product-development/product-management/js/products-data.js` + `core/js/db.js`)
- **UI**: product cards (kanban board + list view); hub project cards
- **Note**: products already has `productsDataUpsertProduct()` for state; just wire the kanban/list patch instead of full refresh
- **Hub**: `subscribeProjectsGlobally()` calls `render()` — extract `renderProjectCardHTML(project)` and patch the hub list

---

## Phase 4 — Table Portals (Medium complexity)

Portals that render tabular data where each row maps to one DB record.

### 4a. Production (`portals/production/js/data.js`)
- **UI**: production batches table with scheduling columns
- **Current**: `render()` on INSERT/UPDATE/DELETE (inline edit guard already exists)
- **Change**: extract `renderBatchRowHTML(record)` from the table body builder; patch by `data-id`
- **Keep**: the inline edit guard (`isEditingInlineCell()` check) — just move it to the patch functions

### 4b. NPI Projects list (`portals/product-development/npi/js/npi.js` — projects channel only)
- **UI**: NPI project cards on the projects tab
- **Change**: patch the project card list; the 15-table `npiScheduleReload()` debounce (for CTQ, PFMEA, etc.) is deferred to Phase 6

---

## Phase 5 — Capacity Portals (Higher complexity — charts involved)

The four capacity departments (ME, LOG, PM, UNIT6) already use `*CapSmartRender()` which defers during inline edits. Audit whether `*CapSmartRender()` is itself surgical or still a full re-render.

**If still full re-render**: extract per-row patch functions for the team roster table and task table. Charts only need to redraw when the data they display actually changes (not on every event).

### 5a. ME Capacity (`portals/capacity/js/me-data.js`)
- **Tables**: `me_teams`, `me_tasks`, `me_products`, `me_product_support_history`, `me_holidays`
- **Approach**:
  - `me_teams` INSERT/DELETE → patch team roster list
  - `me_tasks` INSERT/UPDATE/DELETE → patch task row; only redraw chart if chart data changed
  - `me_products` / `me_product_support_history` / `me_holidays` → patch respective table sections
- **Keep**: own-save echo skip (`window.meDataSaveInProgress` guard)

### 5b. LOG Capacity (`portals/capacity/logistics/js/log-data.js`)
- Same approach as ME — identical structure, different prefix

### 5c. PM Capacity (`portals/capacity/project-management/js/pm-data.js`)
- Same approach as ME — identical structure, different prefix

### 5d. UNIT6 Capacity (`portals/capacity/unit6/js/unit6-data.js`)
- Same approach as ME — identical structure, different prefix

### 5e. Production Capacity (`portals/capacity/js/prod-capacity-data.js`)
- **UI**: capacity grid with monthly columns + utilization chart
- **Approach**: patch the grid cell that changed by `[data-work-area][data-month]`; redraw chart only if utilization data changed

---

## Phase 6 — Complex / Aggregated Views (Highest complexity)

### 6a. NPI Sub-tables (CTQ, PFMEA, PFD, BOM, etc.)
- **Current**: `npiScheduleReload()` debounced full reload for 15 tables across many tabs
- **Approach**: per-tab surgical patch; only the active tab's table is patched; inactive tabs stay stale until navigated to (acceptable — data loads fresh on tab switch anyway)
- **Tables**: `npi_ctq`, `npi_pfd_steps`, `npi_pfmea_modes`, `npi_pfmea_effects`, `npi_pfmea_causes`, `npi_pfmea_history`, `npi_control_plan`, `npi_bom_items`, `npi_bom_kits`, `npi_bom_kit_items`, `npi_gates`, `npi_gate_sigs`, `npi_actions`, `npi_risks`, `npi_gantt_rows`, `npi_documents`

### 6b. Operations Dashboard (`portals/operations/js/operations-dashboard-realtime.js`)
- **UI**: aggregated metric panels (ME summary, production batches, project status, forecast, bugs)
- **Approach**: each panel has its own `opsRefresh*()` function — wire those to patch just the panel's DOM node, not the whole dashboard shell
- **Charts**: redraw only the affected chart panel

---

## Implementation Order Summary

| Phase | Scope | Complexity | Expected Effort |
|-------|-------|------------|-----------------|
| 1 | Shared `realtime-patch.js` utility | Low | 1 session |
| 2 | Work Areas, Families, Templates, ABC | Low | 1 session |
| 3 | MCS, Feedback, Products/Hub | Medium | 1–2 sessions |
| 4 | Production batches, NPI projects list | Medium | 1 session |
| 5 | ME/LOG/PM/UNIT6/ProdCap capacity | High | 2–3 sessions |
| 6 | NPI sub-tables, Operations Dashboard | High | 2–3 sessions |

---

## Rules for Every Phase

1. The full initial `render()` function is **not removed** — it still runs on page load.
2. Realtime callbacks are the **only thing that changes** per portal.
3. Every rendered item must have `data-id="{{record.id}}"` on its root element.
4. All existing guards (inline edit check, own-save echo skip, tab/section guards) are **preserved**.
5. After each phase: run `npm run check:all` and test with two browser tabs open.
6. Update `CHANGELOG.md` after each phase.
