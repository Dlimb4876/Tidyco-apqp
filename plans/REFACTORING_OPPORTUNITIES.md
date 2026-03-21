# Codebase Refactoring Opportunities

**Objective:** Identify files and patterns that should be refactored for efficiency, maintainability, and token usage reduction.

**Analysis Date:** 2026-03-21  
**Total Issues Found:** 47  
**Estimated Token Savings:** ~6,100 tokens (3-5% of codebase)

---

## Executive Summary

| Priority | Category | Issues | Token Savings | Effort |
|----------|----------|--------|---------------|--------|
| 🔴 | Duplicate Code | 4 patterns | ~1,800 | Low |
| 🔴 | Long Functions | 5 functions | ~1,400 | Medium |
| 🟡 | Inline Styles | 100+ occurrences | ~1,900 | Low |
| 🟡 | Repeated Strings | 3 patterns | ~330 | Low |
| 🟡 | Magic Numbers | 3 patterns | ~300 | Low |
| 🟢 | Inefficient Loops | 2 patterns | ~150 | Medium |
| 🟢 | Verbose Conditionals | 2 patterns | ~130 | Low |
| 🟢 | DOM Operations | 2 patterns | ~100 | Low |

---

## 🔴 HIGH PRIORITY (Quick Wins)

### 1. Remove Duplicate `esc()` Functions

**Files:**
- `portals/capacity/js/me-product-taskload.js:61-65`
- `portals/capacity/js/me-capacity.js:295-299`
- `portals/capacity/js/me-utils.js:21-30` (as `escapeHtml`)

**Issue:** Three separate implementations when `utils/js/helpers.js:17` already exports `esc()`.

**Action:** Delete all three, use global `esc()` from helpers.

**Savings:** ~450 tokens

---

### 2. Replace RPN Calculations with Helper

**Files:**
- `portals/product-development/npi/js/pfmea.js` (15+ occurrences)
- `portals/product-development/npi/js/npi-data.js`
- `portals/product-development/npi/js/npi-cp.js`

**Current:**
```javascript
(ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
```

**Better:**
```javascript
calcRPN({sev: ef.sev, occ: ca.occ, det: ca.det})
```

**Savings:** ~800 tokens

---

### 3. Extract Loading State Helper

**Files:** `portals/settings/js/settings.js` (7 occurrences)

**Current:**
```javascript
'<div style="padding:40px;text-align:center;color:var(--muted)">Loading…</div>'
```

**Better:**
```javascript
// In helpers.js
function loadingState(msg = 'Loading…') {
  return `<div class="loading-state">${esc(msg)}</div>`;
}

// In CSS
.loading-state { padding: 40px; text-align: center; color: var(--muted); }
```

**Savings:** ~350 tokens

---

## 🔴 HIGH PRIORITY (Structural)

### 4. Break Down Monolithic Functions

#### 4.1 `npi.pfmea.renderPFMEA()` - 442 lines
**File:** `portals/product-development/npi/js/pfmea.js:246-688`

**Extract:**
- `renderPFMEAHeader()` - table header
- `renderPFMEARow(mode, effect, cause, rowIndex)` - single row
- `renderPFMEAHistoryCell(cause)` - history badge
- `renderPFMEAActionCells(cause, action)` - action columns
- `calculateRowspans(modes)` - rowspan logic

**Savings:** ~300 tokens + better maintainability

---

#### 4.2 `renderSettings()` Family - 200-400 lines each
**File:** `portals/settings/js/settings.js`

**Functions to split:**
- `renderSettingsFamiliesTab()` - 250 lines
- `renderSettingsTeamsTab()` - 220 lines
- `renderSettingsPermissionsTab()` - 280 lines

**Extract:**
- Table row builders
- Form field generators
- Use component approach from `me-components.js`

**Savings:** ~600 tokens

---

#### 4.3 Capacity Tab Renders - 250+ lines each
**Files:**
- `portals/capacity/js/me-tasks.js:53-325` (272 lines)
- `portals/capacity/js/me-product-taskload.js:67-313` (246 lines)

**Extract:**
- `filterTasks(tasks, filters)` - pure filtering
- `sortTasks(tasks, sortConfig)` - pure sorting
- `renderTasksTable(tasks)` - rendering only
- `buildTaskFiltersUI(filters)` - filter controls

**Savings:** ~400 tokens total

---

## 🟡 MEDIUM PRIORITY

### 5. Replace Inline Styles with CSS Classes

**Top Offenders:**
| File | Inline Styles |
|------|---------------|
| `pfmea.js` | 45+ |
| `bom.js` | 30+ |
| `settings.js` | 25+ |
| `gates.js` | 20+ |
| `products.js` | 15+ |

**Common Patterns to Extract:**

```javascript
// Current
style="width:100%;background:${act.desc ? 'var(--field-highlight)' : ''};"

// Better
class="cell-edit ${act.desc ? 'highlighted' : ''}"
```

**Add to `components.css`:**
```css
.field-highlight { background: var(--field-highlight); }
.text-muted { color: var(--muted); }
.text-center { text-align: center; }
.p-40 { padding: 40px; }
.w-100 { width: 100%; }
```

**Savings:** ~1,500 tokens

---

### 6. Add CSS Utility Classes for Table Widths

**Files:**
- `portals/product-development/npi/js/bom.js:73-112`
- `portals/product-development/npi/js/pfmea.js:253-268`

**Current:**
```html
<td style="width:44px" class="ctr">
```

**Better:**
```html
<td class="w44 ctr">
```

**Add to `components.css`:**
```css
.w28 { width: 28px; }
.w44 { width: 44px; }
.w50 { width: 50px; }
.w60 { width: 60px; }
.w75 { width: 75px; }
.w100 { width: 100px; }
.w110 { width: 150px; }
.w120 { width: 120px; }
.w140 { width: 140px; }
```

**Savings:** ~400 tokens

---

### 7. Move Magic Strings to Constants

**Add to `npi-constants.js`:**

```javascript
// Month names (currently in me-utils.js:76)
window.MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Department identifiers
window.DEPARTMENT = { ME: 'ME', PM: 'PM' };

// Status strings
window.STATUS = {
  COMPLETE: 'Complete',
  IN_PROGRESS: 'In Progress',
  PLANNED: 'Planned'
};
```

**Savings:** ~330 tokens

---

## 🟢 LOWER PRIORITY (Optimizations)

### 8. Optimize Nested Loops

**File:** `portals/product-development/npi/js/pfmea.js:230`

**Current:**
```javascript
const highRPN = p.pfmea.reduce((n, m) =>
  n + (m.effects || []).reduce((en, ef) =>
    en + (ef.causes || []).filter(ca =>
      (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) >= RPN_HIGH
    ).length, 0), 0)
```

**Better:**
```javascript
function countHighRPNCauses(pfmea) {
  let count = 0;
  for (const mode of pfmea) {
    for (const ef of (mode.effects || [])) {
      for (const ca of (ef.causes || [])) {
        if (calcRPN({sev: ef.sev, occ: ca.occ, det: ca.det}) >= RPN_HIGH) {
          count++;
        }
      }
    }
  }
  return count;
}
```

**Savings:** ~50 tokens + performance gain

---

### 9. Cache DOM Queries

**Pattern to fix:**
```javascript
// Current - called multiple times
const container = document.getElementById('settingsFamiliesTab');
// ... 50 lines later ...
const container = document.getElementById('settingsFamiliesTab');
```

**Better:**
```javascript
// Cache at function start
const container = document.getElementById('settingsFamiliesTab');
// Reuse variable
```

**Or use cache:**
```javascript
const CONTAINER_CACHE = {};
function getContainer(id) {
  if (!CONTAINER_CACHE[id]) {
    CONTAINER_CACHE[id] = document.getElementById(id);
  }
  return CONTAINER_CACHE[id];
}
```

**Savings:** ~100 tokens + performance gain

---

### 10. Simplify Verbose Conditionals

**File:** `portals/capacity/js/me-tasks.js:70-85`

**Current:**
```javascript
let filteredTasks = pageTasks.filter(t => {
  if (search && !t.name.toLowerCase().includes(search)) return false;
  if (cat !== 'all' && t.category !== cat) return false;
  if (assignee !== 'all' && t.assigneeId !== assignee) return false;
  if (product !== 'all' && t.productId !== product) return false;
  if (hideCompleted && t.status === 'COMPLETED') return false;
  return true;
});
```

**Better:**
```javascript
function taskMatchesFilters(task, filters) {
  const predicates = [
    () => !filters.search || task.name.toLowerCase().includes(filters.search.toLowerCase()),
    () => filters.category === 'all' || task.category === filters.category,
    () => filters.assignee === 'all' || task.assigneeId === filters.assignee,
    () => filters.product === 'all' || task.productId === filters.product,
    () => !filters.hideCompleted || task.status !== 'COMPLETED'
  ];
  return predicates.every(fn => fn());
}
```

**Savings:** ~50 tokens + better testability

---

## Files Requiring Immediate Attention

| File | Issues | Priority | Estimated Effort |
|------|--------|----------|------------------|
| `pfmea.js` | 442-line function, 45 inline styles, RPN calcs | 🔴 | 2-3 hours |
| `settings.js` | 200-400 line functions, 25 inline styles | 🔴 | 2-3 hours |
| `me-tasks.js` | 272-line function, filter logic | 🟡 | 1-2 hours |
| `me-product-taskload.js` | 246-line function, duplicate esc() | 🟡 | 1-2 hours |
| `bom.js` | 30 inline styles, table widths | 🟡 | 1 hour |
| `me-capacity.js` | Duplicate esc() | 🟢 | 15 minutes |
| `me-utils.js` | `escapeHtml()` is still used by capacity callers; migrate or alias safely | 🟢 | 15-30 minutes |

---

## Implementation Checklist

### Phase 1: Safe-First Quick Wins (1-2 hours)
- [ ] Remove the local `esc()` helpers in `me-product-taskload.js` and `me-capacity.js` only after confirming `helpers.js` still loads before both files
- [ ] Do **not** delete `me-utils.js` `escapeHtml()` outright; either keep it as a compatibility alias to `esc()` or migrate every current caller in the same change
- [ ] Replace only flat cause-level RPN formulas with `calcRPN({ sev, occ, det })`; keep mode-level max-RPN logic and history fallback logic separate unless tests are added first
- [ ] Add a `loadingState()` helper only for the repeated Settings loading banners, then verify the rendered copy still matches current UX text
- [ ] Skip new table width helper classes in this phase; `w28`, `w44`, `w50`, `w60`, `w80`, `w100`, `w110`, `w120`, and `w140` already exist in `components.css`
- [ ] After each item, run `npm test` plus the touched focused suite before moving to the next quick win

### Phase 2: Safe Structural Refactors (4-6 hours)
- [ ] PFMEA first pass: extract **pure helpers only** (`countHighRPNCauses`, row-span calculators, small cell renderers) while keeping event wiring and `data-action` attributes unchanged
- [ ] PFMEA second pass: split `renderPFMEA()` into section builders (`renderPFMEAHeader`, `renderPFMEAStepBlock`, `renderPFMEARow`) and snapshot-test representative HTML output before/after
- [ ] Settings pass: factor repeated loading/error/table fragments into local render helpers without changing tab IDs, event delegation roots, or action names
- [ ] Capacity pass: split `me-tasks.js` and `me-product-taskload.js` into `filter`, `sort`, and `render` helpers but preserve shared ME/PM behavior and current filter state keys
- [ ] Inline-style migration pass: move only duplicated style strings to existing shared classes first; avoid one-off class creation unless reused in at least 3 places
- [ ] After each file-level refactor, run focused suites (`tests/pfmea.test.js`, `tests/settings-portal.test.js`, `tests/me-tasks-sort.test.js`, `tests/me-components.test.js`) before moving on
- [ ] After each module pass (PFMEA, Settings, Capacity), run `npm test` and `npm run check:all` before starting the next module

### Phase 3: Safe Optimizations (2-3 hours)
- [ ] Constants pass: move only repeated static labels/status values used in 3+ places to `npi-constants.js`; do not move dynamic UI copy or values used by only one module
- [ ] Loop pass: optimize only proven hot paths (PFMEA deep traversal and repeated filter/sort scans) and keep the output shape identical to current renderers
- [ ] DOM-query pass: cache repeated `getElementById` / selector lookups only within a single render cycle; avoid cross-render global caches unless invalidation is explicit
- [ ] Conditional pass: extract predicate helpers (`taskMatchesFilters`, status guards) only where the same branch logic appears multiple times and unit tests can assert equivalence
- [ ] For each optimization item, require a before/after behavior check on unchanged fixtures or snapshots to prove no output drift
- [ ] Run focused suites for touched areas first, then run `npm test` and `npm run check:all` after completing Phase 3

---

## Testing Strategy

After each refactor phase:
```bash
npm test                    # Run all 179 tests
npm run check:syntax        # Verify no syntax errors
npm run check:load-order    # Verify script dependencies
```

---

## Risk Mitigation

**Low Risk:**
- Replacing only the two redundant local `esc()` helpers that already duplicate `helpers.js`
- Extracting CSS classes from inline styles where matching shared utilities already exist
- Moving repeated strings or labels to constants when there is no behavioral branching

**Medium Risk:**
- Splitting large functions with event delegation, rowspans, or shared ME/PM behavior
- Replacing `escapeHtml()` without migrating current capacity callers in the same change
- Converting every RPN formula to one helper without separating flat calculations from mode/history logic
- Moving inline styles to classes without preserving current dark-theme variable usage

**Rollback:**
```bash
git stash                    # Save work in progress
git checkout <file>          # Revert specific file
git stash pop                # Restore other changes
```

---

## Expected Outcomes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total tokens | ~180k | ~174k | -3.3% |
| Avg function length | 45 lines | 28 lines | -38% |
| Inline styles | 150+ | 20 | -87% |
| Duplicate code | 4 patterns | 0 | -100% |
| Maintainability | Medium | High | Significant |

---

**Document Version:** 1.0  
**Created:** 2026-03-21  
**Status:** Ready for Implementation
