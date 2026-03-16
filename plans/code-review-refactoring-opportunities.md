# Code Review & Refactoring Opportunities

## Executive Summary

This document presents a comprehensive code review of the Tidyco APQP codebase, identifying redundant code, refactoring opportunities, and recommendations for code consolidation. The codebase is well-structured overall with 119 JavaScript files, 210 passing tests, and follows a clear separation of concerns.

**Overall Assessment**: The code is functional and well-organized, but contains several areas where refactoring would improve maintainability, reduce duplication, and simplify the codebase.

---

## 1. Critical Issues

### 1.1 Duplicate `esc()` Function ⚠️ **HIGH PRIORITY**

**Issue**: The XSS-prevention escaping function `esc()` is implemented three times with different implementations:

1. `utils/js/helpers.js:5` (canonical, string replacement) ✅ **CORRECT**
2. `portals/capacity/js/me-capacity.js:287` (DOM-based escaping)
3. `portals/capacity/js/me-product-taskload.js:61` (DOM-based escaping)

**Impact**:
- Inconsistent security behavior across the application
- The helpers.js version is more comprehensive (handles quotes properly)
- Two duplicate implementations create maintenance burden

**Recommendation**:
```javascript
// Remove local esc() functions from:
// - portals/capacity/js/me-capacity.js:287-292
// - portals/capacity/js/me-product-taskload.js:61-66
// These files already have access to the global esc() from helpers.js
```

**Priority**: HIGH - Security-related functionality should be centralized

---

### 1.2 Load Order Checker Bug ⚠️ **MEDIUM PRIORITY**

**Issue**: The load-order-checker script (`scripts/load-order-checker.js`) incorrectly flags duplicate `products.js` files.

**Root Cause**: Line 52 defines `'products.js'` without path differentiation, causing the checker to treat these as duplicates:
- `portals/capacity/js/me-products.js`
- `portals/production/js/products.js`
- `portals/product-development/product-management/js/products.js`

**Recommendation**:
```javascript
// In scripts/load-order-checker.js, update the DEPENDENCIES object to use unique keys:
const DEPENDENCIES = {
  // ...
  'me-products.js': ['me-data.js'],
  'production/products.js': ['db.js', 'families-data.js'],
  'product-management/products.js': ['db.js', 'families-data.js'],
  // ...
};
```

Alternatively, improve the duplicate detection logic to compare full paths rather than just filenames.

---

## 2. Code Duplication Patterns

### 2.1 Random ID Generation Pattern

**Occurrences**: Used 13+ times across 7 files

**Pattern**:
```javascript
const id = 'f_' + Math.random().toString(36).substr(2, 5);
```

**Files**:
- `core/js/db.js` (lines 391, 395, 398, 418, 419)
- `portals/product-development/npi/js/dashboard.js` (3 times)
- `portals/operations/js/operations-forecast-data.js`
- Others

**Recommendation**: Create a centralized ID generation utility in `utils/js/helpers.js`:

```javascript
// Add to utils/js/helpers.js
function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9);
}

// Usage examples:
const failureModeId = generateId('f_');
const effectId = generateId('e_');
const causeId = generateId('c_');
const riskId = generateId('r_');
const actionId = generateId('a_');
```

**Impact**: Reduces duplication, makes ID generation consistent, easier to modify if UUID is needed later

---

### 2.2 Duplicate Data Transformation Logic

**Pattern**: Similar `buildProjectRow()` logic appears in multiple places:
- `core/js/db.js:30-59` (canonical version)
- Inline row building in `db.js:119`, `db.js:149`, `db.js:157`

**Recommendation**: The current approach is already centralized via `buildProjectRow()`. No action needed, but ensure all row building uses this function.

---

### 2.3 Modal State Management Pattern

**Pattern**: Modal state is managed consistently through:
- `closeModal()` in `utils/js/helpers.js:18-35`
- `showModal()` in `utils/js/helpers.js:37-46`

However, modal state reset logic is embedded in `closeModal()` with hardcoded modal IDs.

**Recommendation**: Refactor to use a registry pattern:

```javascript
// Add to utils/js/helpers.js
const modalStateResetters = {
  'modalCtqPick': () => {
    ctqPickTarget = null;
    ctqPickSelected = [];
  },
  'modalBomPick': () => {
    bomPickTarget = null;
    bomPickSelected = [];
    bomPickFilter = 'all';
  },
  'modalKitPick': () => {
    kitPickTarget = null;
    kitPickSelected = [];
    kitPickFilter = 'all';
  }
};

function registerModalStateReset(modalId, resetFn) {
  modalStateResetters[modalId] = resetFn;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';

  // Call registered reset function if exists
  if (modalStateResetters[id]) {
    modalStateResetters[id]();
  }
}
```

**Impact**: Makes modal state management more extensible and removes hardcoded dependencies

---

## 3. Naming Inconsistencies

### 3.1 Project vs Program Naming

**Issue**: The codebase mixes `prog` (short for "program") and `project` terminology:
- Database table: `projects`
- Database column: `prog_id`
- JavaScript variable: `progId`
- Function: `prog()`
- Function: `migrateprog()`
- UI displays: "Project"

**Recommendation**: Standardize on "project" terminology throughout. This is a significant refactor but would improve clarity:

```javascript
// Current:
let progId = null;
function prog() { ... }
function migrateprog(p) { ... }

// Recommended:
let projectId = null;
function getProject() { ... }
function migrateProject(p) { ... }
```

**Priority**: MEDIUM - This is widespread but doesn't affect functionality

---

### 3.2 Inconsistent Date Field Naming

**Issue**: Date fields use multiple naming patterns:
- `start_date` (database column)
- `date` (JavaScript property)
- `gantt_start` (database column)
- `ganttStart` (JavaScript property)

**Recommendation**: Document and enforce the conversion pattern: `snake_case` in database, `camelCase` in JavaScript.

---

## 4. Large File Analysis

### 4.1 Files Over 1000 Lines

1. **`portals/product-development/npi/js/npi-data-relational.js`** (1137 lines)
   - Purpose: Relational data operations for NPI
   - Recommendation: Consider splitting into domain-specific files (e.g., `npi-data-pfmea.js`, `npi-data-bom.js`, etc.)

2. **`portals/product-development/npi/js/dashboard.js`** (1135 lines)
   - Purpose: NPI dashboard rendering and logic
   - Recommendation: Extract sub-assembly logic, project creation, and rendering into separate modules

### 4.2 Files Over 600 Lines

3. **`portals/capacity/js/me-data.js`** (856 lines)
4. **`portals/product-development/npi/js/pfmea.js`** (684 lines)
5. **`portals/production/js/scheduling.js`** (683 lines)
6. **`portals/product-development/npi/js/npi-data.js`** (653 lines)

**Recommendation**: These files are manageable but monitor for further growth. Consider extracting cohesive sub-modules if they grow beyond 1000 lines.

---

## 5. State Management

### 5.1 Global State Variables

**Current Approach**: All global state is centralized in `core/js/state.js` ✅

**Positive Findings**:
- Clear single source of truth
- All state variables have default values
- Properly uses `let` for mutable state

**No Action Needed**: This follows the documented architecture correctly.

---

### 5.2 Picker State Variables

**Pattern**: Multiple picker states follow consistent naming:
```javascript
let ctqPickTarget = null, ctqPickSelected = [];
let bomPickTarget = null, bomPickSelected = [], bomPickFilter = 'all';
let kitPickTarget = null, kitPickSelected = [], kitPickFilter = 'all';
let docPickTarget = null, docPickSelected = [];
let abcPickTarget = null, abcPickSelected = [], abcPickSearch = '', abcPickClassFilter = 'all';
```

**Recommendation**: Consider creating a picker state factory:

```javascript
// Add to core/js/state.js
function createPickerState() {
  return {
    target: null,
    selected: [],
    filter: 'all',
    search: ''
  };
}

// Usage:
const ctqPicker = createPickerState();
const bomPicker = createPickerState();
const kitPicker = createPickerState();
```

**Priority**: LOW - Current approach is explicit and working well

---

## 6. CSS Analysis

### 6.1 Large CSS Files

1. **`portals/production/css/production.css`** (1487 lines)
2. **`portals/product-development/npi/css/dashboard.css`** (1430 lines)
3. **`portals/product-development/product-management/css/products.css`** (782 lines)

**Recommendation**: These large CSS files could benefit from splitting into feature-specific files:

```
production/css/
  production-shell.css       (layout and containers)
  production-gantt.css       (Gantt chart styles)
  production-tables.css      (table styles)
  production-responsive.css  (mobile breakpoints)
```

**Priority**: LOW - Current CSS organization is acceptable

---

### 6.2 CSS Variable Usage

**Positive Finding**: The codebase uses CSS variables extensively for theming:
```css
var(--text)
var(--muted)
var(--line)
var(--bg-alt)
var(--green)
var(--red)
```

**No Action Needed**: This is good practice ✅

---

## 7. Function and Code Quality

### 7.1 Render Functions

**Finding**: 76 render functions across the portal files

**Assessment**: This is appropriate for a component-based architecture. Each portal/feature has its own render logic.

**No Action Needed** ✅

---

### 7.2 Event Listeners

**Finding**: 53 `addEventListener` calls across portal files

**Pattern Observed**: Most portals use delegated event handling (good practice):
- `portals/capacity/js/capacity-events.js` - centralized delegation
- `portals/product-development/npi/js/npi-events.js` - centralized delegation

**Recommendation**: Ensure all portals follow the delegated event pattern to reduce memory overhead.

---

### 7.3 DOM Access Patterns

**Mixed Usage**: Both `querySelector` and `getElementById` are used throughout

**Recommendation**: Document preferred approach in CLAUDE.md:
- Use `getElementById()` for single element access (faster)
- Use `querySelector()` for complex selectors
- Avoid repeated DOM queries - cache element references when possible

---

## 8. Window Global Pollution

**Issue**: Several functions are explicitly exposed on `window`:

```javascript
// In core/js/db.js:637-640
window.broadcastPresence = broadcastPresence;
window.stopPresenceBroadcast = stopPresenceBroadcast;
window.getPresenceForProg = getPresenceForProg;
window._getPresenceInitials = _getPresenceInitials;
```

**Assessment**:
- This is intentional for cross-file access (no build pipeline/modules)
- Acceptable for vanilla JS SPA architecture
- Follows documented architecture pattern

**Recommendation**: Document all window-exposed functions in a central registry comment in `core/js/state.js`:

```javascript
// ── Window-Exposed Functions ──────────────────────────────────
// Listed here for reference (actual definitions are in respective files)
//
// From db.js:
//   - window.broadcastPresence(pid)
//   - window.stopPresenceBroadcast()
//   - window.getPresenceForProg(pid)
//   - window._getPresenceInitials(email)
```

**Priority**: LOW - Documentation improvement only

---

## 9. Dead Code Analysis

### 9.1 TODO/FIXME Comments

**Finding**: Zero TODO, FIXME, HACK, or XXX comments found in the codebase ✅

**Assessment**: Excellent code hygiene

---

### 9.2 Unused Variables

**Manual Review Needed**: Automated dead code detection requires static analysis tools. Recommend adding ESLint rules:

```javascript
// In eslint.config.js, add:
rules: {
  'no-unused-vars': ['warn', {
    'argsIgnorePattern': '^_',
    'varsIgnorePattern': '^_'
  }]
}
```

**Priority**: MEDIUM - Run ESLint on all files (currently only NPI files are linted)

---

## 10. Testing Coverage

### 10.1 Current State

**Positive Findings**:
- 210 tests passing across 23 suites ✅
- Test coverage exists for core functionality (`db.test.js`, etc.)
- Tests run fast (~2.8s)

**Gap Analysis**:
```bash
Files with tests: tests/db.test.js, tests/*.test.js
Files without tests: Most portal-specific files
```

**Recommendation**: Add tests for:
1. Helper functions (`utils/js/helpers.js`)
2. Navigation logic (`utils/js/navigation.js`)
3. Portal-specific business logic (PFMEA calculations, BOM operations)

**Priority**: MEDIUM

---

## 11. Refactoring Priority Matrix

| Priority | Issue | Impact | Effort | Files Affected |
|----------|-------|--------|--------|----------------|
| HIGH | Remove duplicate `esc()` functions | Security consistency | Low | 2 files |
| MEDIUM | Fix load-order-checker bug | Developer experience | Low | 1 file |
| MEDIUM | Centralize ID generation | Code maintainability | Low | 7+ files |
| MEDIUM | Expand ESLint to all files | Code quality | Medium | All JS files |
| LOW | Refactor modal state management | Code extensibility | Medium | 1 file |
| LOW | Split large files (>1000 lines) | Maintainability | High | 2 files |
| LOW | Standardize prog→project naming | Code clarity | Very High | All files |
| LOW | Split large CSS files | Maintainability | Medium | 3 files |

---

## 12. Specific Refactoring Recommendations

### 12.1 Create Utility Functions File

Add to `utils/js/helpers.js`:

```javascript
// ── ID Generation ──────────────────────────────────────────────
function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9);
}

// ── DOM Utilities ──────────────────────────────────────────────
function getElement(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`Element not found: ${id}`);
  return el;
}

function setElementContent(id, html) {
  const el = getElement(id);
  if (el) el.innerHTML = html;
}

// ── Date Utilities ─────────────────────────────────────────────
// (formatDateISO and parseSmartDate already exist ✅)

// ── Array Utilities ────────────────────────────────────────────
function uniqueBy(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const val = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}
```

---

### 12.2 Remove Duplicate Code (Immediate Action)

**Files to modify**:

1. **`portals/capacity/js/me-capacity.js`**
   - Remove lines 287-292 (local `esc()` function)
   - Already has access to global `esc()` from `helpers.js`

2. **`portals/capacity/js/me-product-taskload.js`**
   - Remove lines 61-66 (local `esc()` function)
   - Already has access to global `esc()` from `helpers.js`

3. **`scripts/load-order-checker.js`**
   - Fix duplicate detection to use full paths or update DEPENDENCIES object with unique keys

---

## 13. Code Strengths (No Action Needed)

The following aspects of the codebase are well-implemented:

✅ **Single source of truth for state** (`core/js/state.js`)
✅ **Clear script load order** (documented in `index.html`)
✅ **Consistent CSS variable usage** for theming
✅ **Centralized authentication** (`core/js/auth.js`)
✅ **Proper XSS prevention** via `esc()` function (once duplicates are removed)
✅ **Real-time sync** with Supabase
✅ **Debounced saves** (800ms) to reduce database writes
✅ **Delegated event handling** in capacity and NPI portals
✅ **Comprehensive test suite** (210 tests passing)
✅ **No TODO/FIXME technical debt markers**
✅ **Mobile-first CSS** with proper breakpoints
✅ **Consistent coding style** (Prettier formatted)

---

## 14. Implementation Plan

### Phase 1: Critical Fixes (Week 1)
1. Remove duplicate `esc()` functions (2 files)
2. Fix load-order-checker script (1 file)
3. Run full quality checks

### Phase 2: Code Consolidation (Week 2)
1. Create centralized `generateId()` utility
2. Refactor all ID generation to use new utility
3. Add ESLint to all JavaScript files
4. Fix any ESLint warnings

### Phase 3: Documentation (Week 3)
1. Document window-exposed functions
2. Update CLAUDE.md with DOM access patterns
3. Document picker state pattern
4. Create coding standards document

### Phase 4: Long-term Improvements (Backlog)
1. Split files >1000 lines into smaller modules
2. Add portal-specific tests
3. Refactor modal state management
4. Consider prog→project terminology standardization (breaking change)

---

## 15. Conclusion

The Tidyco APQP codebase is well-structured with clear separation of concerns and good architectural patterns. The main areas for improvement are:

1. **Removing duplicate code** (esc functions, ID generation)
2. **Expanding linting** to all files
3. **Fixing load-order checker** bug
4. **Documenting conventions** for new developers

The identified issues are relatively minor and the codebase demonstrates good practices overall. The refactoring recommendations focus on reducing duplication and improving maintainability without requiring major architectural changes.

**Total Files Reviewed**: 119 JavaScript files, 10+ CSS files
**Tests Passing**: 210/210 ✅
**Critical Issues**: 2
**Medium Priority**: 3
**Low Priority**: 5

---

## Appendix A: File Size Distribution

### JavaScript Files
- Over 1000 lines: 2 files
- 600-1000 lines: 4 files
- 400-600 lines: 10+ files
- Under 400 lines: Majority

### CSS Files
- Over 1000 lines: 2 files
- 500-1000 lines: 3 files
- Under 500 lines: Majority

---

## Appendix B: Architectural Patterns

The codebase follows consistent patterns:

1. **Namespace-based organization** (npi.*, capacity.*, etc.)
2. **Delegated event handling** via `data-action` attributes
3. **State-driven rendering** (immutable state → re-render)
4. **Debounced persistence** (local edits → debounced save)
5. **Real-time sync** (Supabase subscriptions)
6. **Modal-based workflows** (picker modals for selection)
7. **Mobile-first responsive** design

All patterns are consistently applied across portals.
