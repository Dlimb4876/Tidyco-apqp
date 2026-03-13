# Event Handling Standardisation Plan

## The Problem (In Plain English)

Right now, the project has two different ways of making buttons do things when you click them.

**The old way** puts JavaScript code directly inside the HTML button tag, like gluing the instruction manual to the product:

```html
<!-- Old way — the instruction is baked into the button -->
<button onclick="familiesDeleteRow('abc123', 'My Family')">Delete</button>
```

**The new way** (already used in the Production portal) keeps the HTML and the code completely separate. The button just carries a label (`data-action`) that says *what* it is, and a separate piece of JavaScript listens for all clicks and decides what to do:

```html
<!-- New way — the button just says what it is -->
<button data-action="delete-family" data-id="abc123">Delete</button>
```

```javascript
// The JavaScript listener handles everything in one place
container.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;

  if (el.dataset.action === 'delete-family') {
    familiesDeleteRow(el.dataset.id, el.dataset.label);
  }
});
```

---

## Why It Matters

| Problem with old way | Benefit of new way |
|---|---|
| Code mixed with presentation — hard to read | Clean separation — HTML is just structure |
| Each button creates its own event listener — heavy on memory | One listener handles everything on the page |
| Impossible to write automated tests against buttons | Tests can find buttons by `data-action` and click them |
| Security risk: inline code can accidentally run untrusted content | No executable code in HTML strings |
| Must re-attach events after every re-render | Delegation works automatically after re-renders |

---

## Security Issue to Fix First

One file has an **active security risk** that should be fixed before any routine migration work:

### `portals/operations/js/operations-dashboard.js` — Line 571

```javascript
// DANGEROUS — row.action is inserted directly into an onclick attribute
<button class="ops-feed-row" onclick="${row.action}">
```

If `row.action` ever contains data that came from a user (via Supabase or any external source), a malicious value could execute arbitrary JavaScript. This is a classic **Cross-Site Scripting (XSS)** vulnerability. Even if `row.action` is currently only built from internal app logic, the pattern is dangerous and must be eliminated.

**Fix:** Replace with `data-action` and handle the action in an event listener.

---

## Full Scope: Files That Need Migrating

A search of all `.js` files in `portals/` found `onclick=` in **24 files** across 7 portals. The Production portal is already fully migrated and serves as the gold standard.

| # | File | Approx. `onclick` count | Complexity |
|---|---|---|---|
| 1 | `portals/operations/js/operations-dashboard.js` | ~25 | High (+ XSS risk) |
| 2 | `portals/product-development/npi/js/apqp.js` | ~30 | Very High |
| 3 | `portals/product-development/js/product-development.js` | ~18 | High |
| 4 | `portals/product-development/npi/js/pfmea.js` | ~15 | High |
| 5 | `portals/product-development/product-management/js/products.js` | ~12 | Medium |
| 6 | `portals/capacity/project-management/js/pm-capacity.js` | ~9 | Medium |
| 7 | `portals/product-development/npi/js/trackers.js` | ~8 | Low–Medium |
| 8 | `portals/capacity/js/me-capacity.js` | ~8 | Medium |
| 9 | `portals/productmgmt/js/productmgmt.js` | ~9 | Low–Medium |
| 10 | `portals/product-development/npi/js/timing.js` | ~9 | Medium |
| 11 | `portals/capacity/js/me-estimation-page.js` | ~6 | Low–Medium |
| 12 | `portals/bugs/js/bugs.js` | ~7 | Low–Medium |
| 13 | `portals/product-development/npi/js/gates.js` | ~5 | Low |
| 14 | `portals/capacity/js/prod-capacity-settings.js` | ~5 | Low |
| 15 | `portals/hub/js/hub.js` | ~4 | Low |
| 16 | `portals/capacity/js/capacity.js` | ~4 | Low |
| 17 | `portals/capacity/js/prod-capacity-workarea.js` | ~4 | Low |
| 18 | `portals/capacity/js/prod-capacity.js` | ~3 | Low |
| 19 | `portals/capacity/js/me-chart.js` | ~3 | Low |
| 20 | `portals/capacity/js/me-heatmap.js` | ~3 | Low |
| 21 | `portals/capacity/js/me-holidays.js` | ~3 | Low |
| 22 | `portals/capacity/js/prod-capacity-dashboard.js` | ~3 | Low |
| 23 | `portals/capacity/js/me-tasks.js` | ~2 | Low |
| 24 | `portals/capacity/js/me-components.js` | ~2 | Low |

**Total: ~190+ inline onclick attributes across 24 files.**

---

## Migration Approach

### Rule 1: One Container, One Listener

Each portal section should have one wrapping element (a `<div id="...">` or equivalent) and one `addEventListener('click', ...)` attached to it. This listener handles all button clicks inside that section.

```javascript
function setupMyPortalEvents() {
  const container = document.getElementById('my-portal-container');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;

    switch (el.dataset.action) {
      case 'add-row':          handleAddRow();               break;
      case 'delete-row':       handleDelete(el.dataset.id);  break;
      case 'save-edit':        handleSave(el.dataset.id);    break;
      case 'cancel-edit':      handleCancel();               break;
      case 'navigate-back':    navigate(el.dataset.dest);    break;
    }
  });
}

// Call this after rendering the HTML (use setTimeout to wait for DOM update)
setTimeout(setupMyPortalEvents, 0);
```

### Rule 2: Data Goes in `data-*` Attributes, Not in the Function Call

Instead of `onclick="deleteRow('abc123', 'My Item')"`, put the data in attributes:

```html
<button data-action="delete-row" data-id="abc123" data-label="My Item">Delete</button>
```

Then read it in the listener:
```javascript
case 'delete-row':
  if (confirm(`Delete "${el.dataset.label}"?`)) {
    deleteRow(el.dataset.id);
  }
  break;
```

### Rule 3: Guard Against Re-attachment

Track whether a listener has already been added to a container to avoid duplicating it on re-renders:

```javascript
let myPortalListenerContainer = null;

function setupMyPortalEvents() {
  const container = document.getElementById('my-portal-container');
  if (!container || myPortalListenerContainer === container) return;
  myPortalListenerContainer = container;
  // ...add listeners...
}
```

### Rule 4: `change` and `keydown` Events Get Their Own Listeners

Clicks, changes, and key presses are separate event types. Each gets its own `addEventListener`:

```javascript
container.addEventListener('change', (event) => {
  const el = event.target.closest('[data-action="update-field"]');
  if (!el) return;
  updateField(el.dataset.idx, el.dataset.field, el.value);
});
```

### Rule 5: `onchange=` in Inputs Also Gets Removed

The `onchange=` inline attribute has the same problems as `onclick=`. Anywhere you see `<input onchange="...">` or `<textarea onchange="...">`, migrate that to `data-action` + `addEventListener('change', ...)` at the same time as the onclick migration.

---

## Migration Order

Work through these in tiers. Complete Tier 1 before starting Tier 2, etc.

### Tier 0 — Security Fix (Do This Now, Before Anything Else)

| File | What to do |
|---|---|
| `portals/operations/js/operations-dashboard.js` | Remove `onclick="${row.action}"` on line 571. Replace `row.action` with a `data-action` + `data-dest` (or similar) attribute, and handle in the existing event delegation pattern for that portal. |

---

### Tier 1 — High Priority (Explicitly Identified + Most Impactful)

**Goal:** Migrate the two files called out in the original request, and add tests.

#### 1a. `portals/product-development/product-management/js/products.js`

This file has 12 `onclick=` instances across two tables: the **Families** table and the **Products** table.

Actions to wire up via delegation:
- `families-add-row`
- `families-save-edit` (needs `data-id`)
- `families-cancel-edit`
- `families-start-edit` (needs `data-id`)
- `families-delete-row` (needs `data-id`, `data-label`)
- `products-add-row`
- `products-save-edit` (needs `data-id`)
- `products-cancel-edit`
- `products-start-edit` (needs `data-id`)
- `products-delete-row` (needs `data-id`, `data-name`)
- `nav-back-product-development` (back button)
- `retry-families-load` (error state retry button)

**Container:** Wrap the rendered HTML in a `<div id="product-management-container">` and attach `setupProductManagementEvents()` after render.

**Test file to create:** `tests/product-management.test.js`
- Test that rendered HTML contains `data-action=` and does NOT contain `onclick=`
- Test that clicking `[data-action="families-delete-row"]` calls `familiesDeleteRow()`
- Test that clicking `[data-action="products-start-edit"]` calls `productsStartEdit()`

#### 1b. `portals/operations/js/operations-dashboard.js`

Already addressed in Tier 0 for the XSS issue. The remaining ~24 `onclick=` instances (tab switching, navigation, forecast CRUD) should be migrated to delegation across the operations dashboard container.

**Note:** This file is large (~1,200+ lines). Migrate tab-switching buttons, navigation buttons, and forecast table CRUD buttons as separate passes to reduce risk.

---

### Tier 2 — Medium Priority (Self-Contained Portals, Easier to Migrate)

Work through these one at a time. Each is a relatively self-contained file.

| Order | File | Key actions to wire up |
|---|---|---|
| 1 | `portals/productmgmt/js/productmgmt.js` | `pm-toggle-edit`, `pm-save-inline`, `pm-delete-family`, `pm-show-add-form`, `pm-save-new`, `pm-cancel-add` |
| 2 | `portals/bugs/js/bugs.js` | `bugs-switch-tab`, `bugs-submit`, `bugs-save-response`, `bugs-cancel-editing`, `bugs-start-editing`, `bugs-reopen` |
| 3 | `portals/hub/js/hub.js` | `nav-capacity`, `nav-product-development`, `nav-production`, `nav-operations` |
| 4 | `portals/capacity/js/capacity.js` | `nav-hub`, `capacity-tab-overhaul`, `capacity-tab-me`, `capacity-tab-projects` |
| 5 | `portals/product-development/js/product-development.js` | Tab navigation, family table CRUD, modal open/close, template management |

---

### Tier 3 — Lower Priority (Capacity Portal Sub-Modules)

These files are part of the ME Capacity and Production Capacity systems. They often call shared utility functions (`meOnPrevMonth()`, `prodCapShiftMonth()`, etc.). Migrate as a group to keep the portal consistent. Per the **Capacity Parity Rule**, any change to ME Capacity navigation must be mirrored in PM Capacity (`pm-capacity.js`).

| File | Notes |
|---|---|
| `portals/capacity/js/me-capacity.js` | Tab nav buttons; mirror in `pm-capacity.js` |
| `portals/capacity/project-management/js/pm-capacity.js` | Must stay in sync with `me-capacity.js` |
| `portals/capacity/js/me-chart.js` | Month navigation buttons |
| `portals/capacity/js/me-holidays.js` | Month navigation + cell click toggle |
| `portals/capacity/js/me-tasks.js` | Add/delete task buttons |
| `portals/capacity/js/me-estimation-page.js` | Add row, save, back, clear |
| `portals/capacity/js/me-heatmap.js` | Modal open/close |
| `portals/capacity/js/prod-capacity.js` | Tab nav |
| `portals/capacity/js/prod-capacity-dashboard.js` | Month nav |
| `portals/capacity/js/prod-capacity-settings.js` | Month nav + fill forward / clear |
| `portals/capacity/js/prod-capacity-workarea.js` | Work-area selector + month nav |
| `portals/capacity/js/me-components.js` | Prev/Next navigation buttons (shared component) |

---

### Tier 4 — Complex NPI Portal (Do Last)

The NPI sub-portal (`portals/product-development/npi/js/`) is the most complex area:
- Files are heavily interconnected
- Uses a custom `npi.*` namespace (e.g., `npi.apqp.delPFD()`, `npi.pfmea.pfAddCause()`)
- Some elements have multiple event types on the same element (`onclick` on `<div>` acting as a row)
- The `apqp.js` and `pfmea.js` files have very long, dense HTML template strings

**Recommended approach for NPI:**
1. Migrate simple, standalone files first: `gates.js`, `trackers.js`
2. Then tackle `timing.js` (Gantt table has many cell-level clicks — use `data-row-id` and `data-week` attributes)
3. Leave `apqp.js` and `pfmea.js` for last — these require careful planning since they have complex nested rendering

---

## Testing Requirements

For each file migrated, the following test expectations must pass:

```javascript
// 1. No onclick in rendered HTML
expect(html).not.toContain('onclick=');

// 2. No onchange in rendered HTML (if applicable)
expect(html).not.toContain('onchange=');

// 3. Actions are present as data-action attributes
expect(html).toContain('data-action="delete-row"');

// 4. Clicking the action button calls the right function
document.body.innerHTML = renderMyPortal();
setupMyPortalEvents();
const btn = document.querySelector('[data-action="delete-row"][data-id="abc"]');
btn.click();
expect(mockDeleteFn).toHaveBeenCalledWith('abc');
```

The existing `tests/production-products.test.js` and `tests/production.test.js` files are the best examples to follow.

---

## What NOT to Change

- **NPI `npi.*` namespace functions** — Do not rename or restructure these; just change *how they are called* (from inline onclick to data-action delegation). The functions themselves stay the same.
- **`scheduling.js`** — The scheduling module already uses a mixed approach (some delegation, some direct listeners on created rows). Leave it as-is unless specifically asked to standardise it.
- **Modal buttons in `index.html`** — Static modal buttons in `index.html` are a separate concern and out of scope for this plan.
- **`me-components.js` `onclick` parameter** — This function accepts an `onclick` string and injects it into HTML. This is a structural pattern issue; migrating requires changing the component's API. Handle as a standalone task with care.

---

## Checklist: Per-File Migration Steps

For each file in Tiers 1–4, follow this checklist:

- [ ] Read the file and list all `onclick=` (and `onchange=`) instances
- [ ] Identify the container element the event listener will attach to
- [ ] Rename each action to a descriptive `data-action` name (use kebab-case)
- [ ] Move any IDs or values from the function call into `data-*` attributes
- [ ] Add a `setupXxxEvents()` function with `addEventListener('click', ...)` (and `change`/`keydown` if needed)
- [ ] Call `setupXxxEvents()` after the render function (via `setTimeout(() => setupXxxEvents(), 0)`)
- [ ] Add a guard variable to prevent duplicate listener attachment
- [ ] Run `npm test` — fix any broken tests
- [ ] Add new test assertions for `data-action` presence and `onclick` absence
- [ ] If the file is in the ME Capacity area, check whether `pm-capacity.js` also needs a matching change (Capacity Parity Rule)
