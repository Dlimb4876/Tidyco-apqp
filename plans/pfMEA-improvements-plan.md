# PFMEA Improvements Plan — AIAG-VDA Compliance & UX Enhancement

**Created:** 2026-03-22  
**Priority:** P0-P1 (Critical & High)  
**Status:** Pending approval  

---

## Overview

This plan implements 5 critical improvements to the PFMEA system to achieve AIAG-VDA compliance and significantly improve user experience:

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| **P0** | Function field | Low | High (compliance) | Pending |
| **P0** | Special characteristics | Low | High (compliance) | Pending |
| **P0** | Validation warnings | Medium | High (risk reduction) | Pending |
| **P1** | Collapsible columns | Medium | High (UX) | Pending |
| **P1** | Advanced filtering | Medium | High (UX) | Pending |

**Total Estimated Effort:** ~6-8 hours development + testing  
**Risk:** Low (all changes are additive, no breaking changes)

---

## Feature 1: Function Field (P0)

### Objective
Add "Function" field to PFMEA to comply with AIAG-VDA 7-step approach (Step 3: Function Analysis).

### Changes Required

#### 1.1 Data Structure (`portals/product-development/npi/js/npi-data.js`)
```javascript
// Update addMode() in npi.data.pfmea — add function field to mode object (line ~680):
const mode = { id: crypto.randomUUID(), _type: 'mode', pfdId, function: '', mode: '', ctqIds: [], effects: [ef] }
```

#### 1.2 Database Schema (Supabase)
```sql
-- Add column to npi_pfmea_modes table
ALTER TABLE npi_pfmea_modes 
ADD COLUMN function TEXT DEFAULT '';
```

#### 1.3 UI Changes (`portals/product-development/npi/js/pfmea.js`)

**Add column to PFMEA table** (after Step, before Failure Mode):
```javascript
// In renderPFMEA() table header (~line 250):
<th class="pf-col function-col">Function</th>

// In row rendering (~line 270):
<td class="pf-cell function-cell" rowspan="${effectSpan}">
  <textarea 
    class="cell-edit pf-function" 
    data-mid="${mode.id}"
    placeholder="Intended function..."
  >${esc(mode.function || '')}</textarea>
</td>
```

**Column width:** 200px (defined in `pfmea.css`)

#### 1.4 Save Logic (`portals/product-development/npi/js/npi-data-relational.js`)

**Add `function` to the existing `npiRelSavePFMEAMode` upsert payload** (do NOT create a new save function — follow the existing pattern):
```javascript
// In npiRelSavePFMEAMode upsert payload, add:
function: mode.function || '',
```

**Wire up inline edit event** in `pfmea.js` using `npi.data.pfmea.updMode`:
```javascript
// In event delegation (input handler):
if (e.target.classList.contains('pf-function')) {
  const mi = +e.target.dataset.mi;
  npi.data.pfmea.updMode(mi, 'function', e.target.value);
}
```

#### 1.5 Family Template Support (`docs/guides/family-templates-guide.md`)

Update template structure to include function field:
```javascript
{
  function: "Dispense adhesive bead along seam edge",
  mode: "Adhesive bead misaligned",
  effects: [...]
}
```

### Acceptance Criteria
- [ ] Function column appears between Step and Failure Mode
- [ ] Inline editing works with auto-save
- [ ] Function field persists to database
- [ ] Function field included in family templates
- [ ] Mobile-responsive (stacks on small screens)
- [ ] Existing PFMEA items show empty function field (no errors)

### Files to Modify
1. `portals/product-development/npi/js/npi-data.js` — Add `function: ''` to `addMode()` default
2. `portals/product-development/npi/js/npi-data-relational.js` — Add `function` field to `npiRelSavePFMEAMode` upsert payload
3. `portals/product-development/npi/js/pfmea.js` — Render function column and wire input event
4. `portals/product-development/npi/css/pfmea.css` — Style function column
5. Supabase schema — Add column to table

---

## Feature 2: Special Characteristics (P0)

### Objective
Add classification for safety/critical/major characteristics to support regulatory compliance and customer requirements.

### Changes Required

#### 2.1 Data Structure (`portals/product-development/npi/js/npi-data.js`)
```javascript
// Update addMode() and addEffect() in npi.data.pfmea — add specialChar to effect object (lines ~679, ~702):
const ef = { id: crypto.randomUUID(), effect: '', sev: 1, specialChar: null, causes: [ca] }
```

#### 2.2 Constants (`portals/product-development/npi/js/npi-constants.js`)
```javascript
// Add special characteristic definitions:
window.SPECIAL_CHARS = {
  SAFETY: { id: 'safety', label: 'Safety', symbol: '∇', color: '#dc2626' },
  CRITICAL: { id: 'critical', label: 'Critical', symbol: '△', color: '#f59e0b' },
  MAJOR: { id: 'major', label: 'Major', symbol: '◇', color: '#2563eb' }
};
```

#### 2.3 Database Schema (Supabase)
```sql
-- Add column to npi_pfmea_effects table
ALTER TABLE npi_pfmea_effects 
ADD COLUMN special_char VARCHAR(20) DEFAULT NULL;
```

#### 2.4 UI Changes (`portals/product-development/npi/js/pfmea.js`)

**Add dropdown selector next to SEV score:**
```javascript
// In effect cell rendering (~line 280):
<td class="pf-cell effect-cell">
  <div class="effect-row">
    <textarea class="cell-edit pf-effect" data-eid="${effect.id}">
      ${esc(effect.effect)}
    </textarea>
    <div class="effect-controls">
      <input type="number" class="score-input pf-sev" 
        value="${effect.sev}" min="1" max="10" data-eid="${effect.id}">
      
      <!-- NEW: Special Char Dropdown -->
      <select class="special-char-select" data-eid="${effect.id}">
        <option value="">—</option>
        <option value="safety" ${effect.specialChar === 'safety' ? 'selected' : ''}>∇</option>
        <option value="critical" ${effect.specialChar === 'critical' ? 'selected' : ''}>△</option>
        <option value="major" ${effect.specialChar === 'major' ? 'selected' : ''}>◇</option>
      </select>
    </div>
  </div>
</td>
```

**Display badge in table:**
```javascript
// Show symbol badge next to severity:
<span class="special-char-badge special-char-${effect.specialChar}">
  ${SPECIAL_CHARS[effect.specialChar.toUpperCase()]?.symbol || ''}
</span>
```

#### 2.5 Save Logic (`portals/product-development/npi/js/npi-data-relational.js`)

**Add `special_char` to the existing `npiRelSavePFMEAEffect` upsert payload** (do NOT create a new save function):
```javascript
// In npiRelSavePFMEAEffect upsert payload, add:
special_char: effect.specialChar || null,
```

**Wire up the dropdown** in `pfmea.js` using `npi.data.pfmea.updEffect`:
```javascript
// In event delegation (change handler):
if (e.target.classList.contains('special-char-select')) {
  const mi = +e.target.dataset.mi;
  const ei = +e.target.dataset.ei;
  npi.data.pfmea.updEffect(mi, ei, 'specialChar', e.target.value || null);
}
```

#### 2.6 CSS Styling (`portals/product-development/npi/css/pfmea.css`)
```css
.special-char-select {
  width: 32px;
  height: 28px;
  font-size: 14px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-soft);
  cursor: pointer;
}

.special-char-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  margin-left: 4px;
}

.special-char-safety { 
  background: #fee2e2; 
  color: #dc2626; 
  border: 1px solid #dc2626;
}

.special-char-critical { 
  background: #fef3c7; 
  color: #f59e0b; 
  border: 1px solid #f59e0b;
}

.special-char-major { 
  background: #dbeafe; 
  color: #2563eb; 
  border: 1px solid #2563eb;
}
```

### Acceptance Criteria
- [ ] Special characteristic dropdown appears next to SEV score
- [ ] Symbols (∇△◇) display correctly when selected
- [ ] Color-coded badges visible in table
- [ ] Selection persists to database
- [ ] Can clear selection (choose "—")
- [ ] Mobile-responsive (dropdown stacks if needed)

### Files to Modify
1. `portals/product-development/npi/js/npi-data.js` — Add `specialChar: null` to effect objects in `addMode()` and `addEffect()`
2. `portals/product-development/npi/js/npi-data-relational.js` — Add `special_char` field to `npiRelSavePFMEAEffect` upsert payload
3. `portals/product-development/npi/js/npi-constants.js` — Add `SPECIAL_CHARS` constants
4. `portals/product-development/npi/js/pfmea.js` — Render dropdown, badges, and wire change event
5. `portals/product-development/npi/css/pfmea.css` — Style badges and dropdown
6. Supabase schema — Add column to table

---

## Feature 3: Validation Warnings (P0)

### Objective
Add real-time validation warnings to prevent risky oversights and guide users toward best practices.

### Changes Required

#### 3.1 Validation Rules (`portals/product-development/npi/js/pfmea.js`)

**Add validation function:**
```javascript
function pfValidateCause(cause, effect, mode) {
  const warnings = [];
  
  // Rule 1: High severity (9-10) without implemented actions
  if (effect.sev >= 9 && !cause.action.desc) {
    warnings.push({
      type: 'high-severity-no-action',
      message: 'High severity without mitigation',
      severity: 'critical'
    });
  }
  
  // Rule 2: Critical RPN (≥200) without action plan
  const rpn = effect.sev * cause.occ * cause.det;
  if (rpn >= 200 && !cause.action.desc) {
    warnings.push({
      type: 'critical-rpn-no-plan',
      message: 'Critical RPN without action plan',
      severity: 'critical'
    });
  }
  
  // Rule 3: High occurrence (≥8) without prevention controls
  if (cause.occ >= 8 && !cause.prevent?.trim()) {
    warnings.push({
      type: 'high-occ-no-prevention',
      message: 'High occurrence without prevention controls',
      severity: 'warning'
    });
  }
  
  // Rule 4: Action overdue
  if (cause.action.due && new Date(cause.action.due) < new Date()) {
    warnings.push({
      type: 'overdue-action',
      message: 'Overdue action',
      severity: 'warning'
    });
  }
  
  return warnings;
}
```

#### 3.2 UI Display

**Add warning badge next to RPN:**
```javascript
// In cause cell rendering:
const warnings = pfValidateCause(cause, effect, mode);
const warningBadges = warnings.map(w => `
  <span class="warning-badge warning-${w.severity}" 
        title="${w.message}" 
        data-warnings='${JSON.stringify(warnings)}'>
    ⚠️
  </span>
`).join('');

// Render after RPN badge:
<td class="pf-cell rpn-cell">
  ${rpnBadge(rpn)}
  ${warningBadges}
</td>
```

#### 3.3 Warning Modal

**Add modal to `index.html`** (follow project modal pattern — all modals live in index.html):
```html
<div id="modalPfmeaWarnings" class="modal hidden">
  <div class="modal-content">
    <h3>Validation Warnings</h3>
    <ul id="pfmeaWarningList" class="warning-list"></ul>
    <button class="btn-primary" onclick="closeModal('modalPfmeaWarnings')">Dismiss</button>
  </div>
</div>
```

**Open modal and populate list** in `pfmea.js`:
```javascript
// In pfmeaInit() event delegation:
table.addEventListener('click', (e) => {
  if (e.target.classList.contains('warning-badge')) {
    const warnings = JSON.parse(e.target.dataset.warnings);
    const list = document.getElementById('pfmeaWarningList');
    list.innerHTML = warnings.map(w => `
      <li class="warning-item warning-item-${w.severity}">
        ${esc(w.message)}
      </li>
    `).join('');
    showModal('modalPfmeaWarnings');
  }
});
```

> **Note:** Do NOT use `document.createElement` + `modal.showModal()` — `showModal()` only works on `<dialog>` elements and will throw a TypeError on a plain div. Always use `showModal('id')` / `closeModal('id')` from helpers.

#### 3.4 CSS Styling (`portals/product-development/npi/css/pfmea.css`)
```css
.warning-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  margin-left: 4px;
  animation: pulse 2s infinite;
}

.warning-critical {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #dc2626;
}

.warning-warning {
  background: #fef3c7;
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.warning-modal .warning-list {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}

.warning-item {
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 4px;
  border-left: 4px solid;
}

.warning-item-critical {
  background: #fee2e2;
  border-color: #dc2626;
}

.warning-item-warning {
  background: #fef3c7;
  border-color: #f59e0b;
}
```

#### 3.5 Summary Badge in Toolbar

**Show total warning count:**
```javascript
// In toolbar rendering:
const totalWarnings = pfmea.reduce((sum, mode) => {
  return sum + mode.effects.reduce((eSum, effect) => {
    return eSum + effect.causes.reduce((cSum, cause) => {
      return cSum + pfValidateCause(cause, effect, mode).length;
    }, 0);
  }, 0);
}, 0);

// Add to toolbar:
${totalWarnings > 0 ? `
  <div class="warning-summary-badge">
    ⚠️ ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}
  </div>
` : ''}
```

### Acceptance Criteria
- [ ] Warning badges appear next to RPN for violating causes
- [ ] Critical warnings (red) vs warnings (amber) styled differently
- [ ] Clicking warning shows modal with all issues
- [ ] Validation runs on every render (live updates)
- [ ] Toolbar shows total warning count
- [ ] No false positives (rules are accurate)

### Files to Modify
1. `portals/product-development/npi/js/pfmea.js` — Add validation logic and UI
2. `portals/product-development/npi/css/pfmea.css` — Style warning badges and modals

---

## Feature 4: Collapsible Columns (P1)

### Objective
Reduce horizontal scrolling by allowing users to toggle column visibility with preset view modes.

### Changes Required

#### 4.1 View State (`portals/product-development/npi/js/pfmea.js`)
```javascript
// Declare at module scope in pfmea.js (NOT in state.js — this is session-only UI state, not global app state):
let pfmeaViewMode = 'standard';  // 'compact' | 'standard' | 'full'
```

#### 4.2 Column Visibility Map (`portals/product-development/npi/js/pfmea.js`)

**Define column visibility by view mode:**
```javascript
const COLUMN_VISIBILITY = {
  compact: {
    function: false,
    prevent: false,
    detect: false,
    action: false,
    owner: false,
    due: false,
    newOcc: false,
    newDet: false,
    forecast: false,
    implement: false
  },
  standard: {
    function: true,
    prevent: true,
    detect: true,
    action: true,
    owner: false,
    due: false,
    newOcc: false,
    newDet: false,
    forecast: false,
    implement: true
  },
  full: {
    function: true,
    prevent: true,
    detect: true,
    action: true,
    owner: true,
    due: true,
    newOcc: true,
    newDet: true,
    forecast: true,
    implement: true
  }
};
```

#### 4.3 View Toggle Buttons (Toolbar)

**Add to PFMEA toolbar (~line 220):**
```javascript
<div class="pf-view-toggles">
  <button class="view-btn ${pfmeaViewMode === 'compact' ? 'active' : ''}" 
          data-view="compact" title="11 columns">
    Compact
  </button>
  <button class="view-btn ${pfmeaViewMode === 'standard' ? 'active' : ''}" 
          data-view="standard" title="15 columns">
    Standard
  </button>
  <button class="view-btn ${pfmeaViewMode === 'full' ? 'active' : ''}" 
          data-view="full" title="18 columns">
    Full
  </button>
</div>
```

#### 4.4 Conditional Rendering

**Wrap columns in visibility checks:**
```javascript
// In table header:
${COLUMN_VISIBILITY[pfmeaViewMode].function ? '<th class="pf-col function-col">Function</th>' : ''}
<th class="pf-col mode-col">Failure Mode</th>
<th class="pf-col effect-col">Effect</th>
<th class="pf-col sev-col">SEV</th>
<th class="pf-col cause-col">Cause</th>
<th class="pf-col occ-col">OCC</th>
${COLUMN_VISIBILITY[pfmeaViewMode].prevent ? '<th class="pf-col prevent-col">Prevent</th>' : ''}
${COLUMN_VISIBILITY[pfmeaViewMode].detect ? '<th class="pf-col detect-col">Detect</th>' : ''}
// ... etc
```

**Apply same logic to data cells:**
```javascript
// In cell rendering:
${COLUMN_VISIBILITY[pfmeaViewMode].function ? `
  <td class="pf-cell function-cell">...</td>
` : ''}
```

#### 4.5 Event Handler

**Handle view toggle clicks:**

> **Important:** The view toggle buttons are in the **toolbar**, not inside the table. Attach the listener to the toolbar container (or a shared wrapper), NOT to `table`. Attaching to `table` means the buttons are never inside the listener's target and clicks are silently ignored.

```javascript
// In pfmeaInit(), attach to the toolbar container, not the table:
const toolbar = document.getElementById('pfmeaToolbar'); // use whatever ID the toolbar has
toolbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-btn');
  if (!btn) return;
  const view = btn.dataset.view;
  pfmeaViewMode = view;
  renderPFMEA();
});
```

#### 4.6 CSS Styling (`portals/product-development/npi/css/pfmea.css`)
```css
.pf-view-toggles {
  display: flex;
  gap: 4px;
  margin-right: 16px;
}

.view-btn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: var(--bg-hover);
}

.view-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Hide columns dynamically */
.pfmea-table.compact .function-col,
.pfmea-table.compact .prevent-col,
.pfmea-table.compact .detect-col,
/* ... etc */
{
  display: none;
}
```

### Acceptance Criteria
- [ ] Three view toggle buttons in toolbar (Compact | Standard | Full)
- [ ] Active view highlighted
- [ ] Columns show/hide immediately on toggle
- [ ] View mode persists during session (optional: save to localStorage)
- [ ] Table re-renders correctly in each mode
- [ ] No layout breaks or overlapping content

### Files to Modify
1. `portals/product-development/npi/js/pfmea.js` — Add `pfmeaViewMode` at module scope, toggle logic, and conditional rendering
2. `portals/product-development/npi/css/pfmea.css` — Style toggle buttons

---

## Feature 5: Advanced Filtering (P1)

### Objective
Add powerful filtering options to help users quickly find specific PFMEA items.

### Changes Required

#### 5.1 Filter State (`portals/product-development/npi/js/pfmea.js`)
```javascript
// Declare at module scope in pfmea.js (NOT in state.js — this is session-only UI state, not global app state):
let pfmeaFilters = {
  rpnRange: 'all',        // 'all' | '1-49' | '50-99' | '100-199' | '200+'
  owner: null,            // null or user email
  overdueOnly: false,
  specialChar: null,      // null | 'safety' | 'critical' | 'major'
  pfdId: null,            // null or specific PFD step ID
  searchText: ''          // text search query
};
```

#### 5.2 Filter UI (`portals/product-development/npi/js/pfmea.js`)

**Add filter bar below toolbar:**
```javascript
<div class="pf-filter-bar">
  <!-- Existing RPN Filter -->
  <select class="pf-filter rpn-filter" title="Filter by RPN">
    <option value="all">All RPN</option>
    <option value="1-49">1-49</option>
    <option value="50-99">50-99</option>
    <option value="100-199">100-199</option>
    <option value="200+">200+</option>
  </select>
  
  <!-- NEW: Owner Filter -->
  <select class="pf-filter owner-filter" title="Filter by owner">
    <option value="">All Owners</option>
    ${uniqueOwners.map(owner => `
      <option value="${owner}">${emailToDisplayName(owner)}</option>
    `).join('')}
  </select>
  
  <!-- NEW: Overdue Toggle -->
  <label class="pf-filter-checkbox">
    <input type="checkbox" class="overdue-filter" ${pfmeaFilters.overdueOnly ? 'checked' : ''}>
    Overdue Only
  </label>
  
  <!-- NEW: Special Char Filter -->
  <select class="pf-filter special-char-filter" title="Filter by special characteristic">
    <option value="">All Characteristics</option>
    <option value="safety">∇ Safety</option>
    <option value="critical">△ Critical</option>
    <option value="major">◇ Major</option>
  </select>
  
  <!-- NEW: Text Search -->
  <input 
    type="text" 
    class="pf-filter text-search" 
    placeholder="Search mode/effect/cause..."
    value="${pfmeaFilters.searchText}"
  >
  
  <!-- Clear Filters Button -->
  <button class="btn-clear-filters" title="Clear all filters">
    ✕ Clear
  </button>
</div>
```

#### 5.3 Filter Logic

**Add filtering function:**
```javascript
function pfApplyFilters(modes) {
  return modes.filter(mode => {
    // RPN filter
    if (pfmeaFilters.rpnRange !== 'all') {
      const maxRPN = Math.max(...mode.effects.flatMap(e => 
        e.causes.map(c => e.sev * c.occ * c.det)
      ), 0);
      
      const [min, max] = pfmeaFilters.rpnRange.split('-').map(v => 
        v === '+' ? Infinity : parseInt(v)
      );
      
      if (maxRPN < min || maxRPN > max) return false;
    }
    
    // Owner filter
    if (pfmeaFilters.owner) {
      const hasOwner = mode.effects.some(e => 
        e.causes.some(c => c.action.owner === pfmeaFilters.owner)
      );
      if (!hasOwner) return false;
    }
    
    // Overdue filter
    if (pfmeaFilters.overdueOnly) {
      const hasOverdue = mode.effects.some(e => 
        e.causes.some(c => 
          c.action.due && new Date(c.action.due) < new Date()
        )
      );
      if (!hasOverdue) return false;
    }
    
    // Special char filter
    if (pfmeaFilters.specialChar) {
      const hasSpecialChar = mode.effects.some(e => 
        e.specialChar === pfmeaFilters.specialChar
      );
      if (!hasSpecialChar) return false;
    }
    
    // Text search
    if (pfmeaFilters.searchText) {
      const query = pfmeaFilters.searchText.toLowerCase();
      const matchesText = 
        mode.function?.toLowerCase().includes(query) ||
        mode.mode.toLowerCase().includes(query) ||
        mode.effects.some(e => 
          e.effect.toLowerCase().includes(query) ||
          e.causes.some(c => c.cause.toLowerCase().includes(query))
        );
      
      if (!matchesText) return false;
    }
    
    // PFD step filter
    if (pfmeaFilters.pfdId && mode.pfdId !== pfmeaFilters.pfdId) {
      return false;
    }
    
    return true;
  });
}
```

#### 5.4 Event Handlers

**Handle filter changes:**

> **Important:** `btn-clear-filters` is a button — button clicks fire `'click'`, not `'change'`. Keep select/checkbox changes in the `'change'` listener and the clear button in a separate `'click'` listener. Mixing them means the clear button is silently ignored.

```javascript
// In pfmeaInit():
const filterBar = document.getElementById('pfmeaFilterBar'); // use whatever ID the filter bar has

// Select and checkbox filters — use 'change'
filterBar.addEventListener('change', (e) => {
  if (e.target.classList.contains('rpn-filter')) {
    pfmeaFilters.rpnRange = e.target.value;
    renderPFMEA();
  }
  if (e.target.classList.contains('owner-filter')) {
    pfmeaFilters.owner = e.target.value || null;
    renderPFMEA();
  }
  if (e.target.classList.contains('overdue-filter')) {
    pfmeaFilters.overdueOnly = e.target.checked;
    renderPFMEA();
  }
  if (e.target.classList.contains('special-char-filter')) {
    pfmeaFilters.specialChar = e.target.value || null;
    renderPFMEA();
  }
});

// Clear button — use 'click'
filterBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-clear-filters')) {
    pfmeaFilters = {
      rpnRange: 'all',
      owner: null,
      overdueOnly: false,
      specialChar: null,
      pfdId: null,
      searchText: ''
    };
    renderPFMEA();
  }
});

// Debounce text search — use 'input'
let searchDebounce;
filterBar.addEventListener('input', (e) => {
  if (e.target.classList.contains('text-search')) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      pfmeaFilters.searchText = e.target.value;
      renderPFMEA();
    }, 300);
  }
});
```

#### 5.5 Active Filter Chips

**Show active filters as removable chips:**
```javascript
<div class="active-filters">
  ${pfmeaFilters.rpnRange !== 'all' ? `
    <span class="filter-chip">
      RPN: ${pfmeaFilters.rpnRange}
      <button onclick="pfmeaFilters.rpnRange='all'; renderPFMEA()">×</button>
    </span>
  ` : ''}
  
  ${pfmeaFilters.owner ? `
    <span class="filter-chip">
      Owner: ${emailToDisplayName(pfmeaFilters.owner)}
      <button onclick="pfmeaFilters.owner=null; renderPFMEA()">×</button>
    </span>
  ` : ''}
  
  ${pfmeaFilters.overdueOnly ? `
    <span class="filter-chip">
      Overdue Only
      <button onclick="pfmeaFilters.overdueOnly=false; renderPFMEA()">×</button>
    </span>
  ` : ''}
  
  ${pfmeaFilters.specialChar ? `
    <span class="filter-chip">
      ${SPECIAL_CHARS[pfmeaFilters.specialChar.toUpperCase()].symbol} ${pfmeaFilters.specialChar}
      <button onclick="pfmeaFilters.specialChar=null; renderPFMEA()">×</button>
    </span>
  ` : ''}
</div>
```

#### 5.6 CSS Styling (`portals/product-development/npi/css/pfmea.css`)
```css
.pf-filter-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.pf-filter {
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  min-width: 120px;
}

.pf-filter-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
}

.text-search {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.btn-clear-filters {
  padding: 6px 12px;
  font-size: 13px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}

.active-filters {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-soft);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--primary);
  color: white;
  border-radius: 12px;
  font-size: 12px;
}

.filter-chip button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
}
```

### Acceptance Criteria
- [ ] Filter bar appears below toolbar
- [ ] All 5 filter types work correctly (RPN, owner, overdue, special char, text)
- [ ] Filters combine correctly (AND logic)
- [ ] Active filter chips show above table
- [ ] Clicking × on chip removes that filter
- [ ] Clear All button resets all filters
- [ ] Text search is debounced (no lag while typing)
- [ ] Filter state persists during session

### Files to Modify
1. `portals/product-development/npi/js/pfmea.js` — Add `pfmeaFilters` at module scope, filter UI and logic
2. `portals/product-development/npi/css/pfmea.css` — Style filter bar and chips

---

## Implementation Order

### Phase 1: P0 Features (Compliance) — ~3-4 hours
1. **Function Field** (~1 hour)
2. **Special Characteristics** (~1 hour)
3. **Validation Warnings** (~1.5 hours)

### Phase 2: P1 Features (UX) — ~3-4 hours
4. **Collapsible Columns** (~1.5 hours)
5. **Advanced Filtering** (~2 hours)

---

## Testing Plan

### Unit Tests (`tests/pfmea.test.js`)

**Function Field:**
- [ ] `pfAddMode creates mode with empty function field`
- [ ] `pfUpdateFunction saves to database`
- [ ] `Function field renders correctly in table`

**Special Characteristics:**
- [ ] `pfUpdateSpecialChar saves safety/critical/major`
- [ ] `Special char badge displays correct symbol and color`
- [ ] `Special char filter works correctly`

**Validation Warnings:**
- [ ] `pfValidateCause returns warning for SEV≥9 without action`
- [ ] `pfValidateCause returns warning for RPN≥200 without plan`
- [ ] `pfValidateCause returns warning for OCC≥8 without prevention`
- [ ] `pfValidateCause returns warning for overdue action`
- [ ] `Warning badge appears next to RPN`

**Collapsible Columns:**
- [ ] `View toggle switches between compact/standard/full`
- [ ] `Correct columns visible in each view mode`

**Advanced Filtering:**
- [ ] `RPN filter shows/hides modes correctly`
- [ ] `Owner filter shows/hides modes correctly`
- [ ] `Overdue filter shows/hides modes correctly`
- [ ] `Special char filter shows/hides modes correctly`
- [ ] `Text search matches mode/effect/cause text`
- [ ] `Filters combine with AND logic`
- [ ] `Clear filters resets all filters`

### Integration Tests

**Manual Testing Checklist:**
- [ ] Create new mode → function field is empty and editable
- [ ] Set special characteristic → badge appears
- [ ] Create high-severity effect without action → warning appears
- [ ] Toggle view modes → columns show/hide correctly
- [ ] Apply multiple filters → correct items shown
- [ ] Clear filters → all items visible again
- [ ] Save and reload → all changes persist

---

## Database Migration Script

```sql
-- Run in Supabase SQL Editor

-- 1. Add function column to npi_pfmea_modes
ALTER TABLE npi_pfmea_modes 
ADD COLUMN IF NOT EXISTS function TEXT DEFAULT '';

-- 2. Add special_char column to npi_pfmea_effects
ALTER TABLE npi_pfmea_effects 
ADD COLUMN IF NOT EXISTS special_char VARCHAR(20) DEFAULT NULL;

-- 3. Update RLS policies (if needed)
-- (Should inherit from existing policies)
```

---

## Rollback Plan

If issues arise:

1. **Function Field:** Safe to remove (just hides column, data preserved)
2. **Special Characteristics:** Safe to remove (just hides dropdown, data preserved)
3. **Validation Warnings:** Disable by commenting out `pfValidateCause()` calls
4. **Collapsible Columns:** Default to 'full' view mode
5. **Advanced Filtering:** Default to RPN-only filter (existing behavior)

All changes are **additive** — no existing functionality is removed or broken.

---

## Success Metrics

After implementation:

- ✅ **Compliance:** PFMEA aligns with AIAG-VDA 7-step approach
- ✅ **Risk Reduction:** High-risk items flagged with warnings
- ✅ **UX:** 40% reduction in horizontal scrolling (compact view)
- ✅ **Efficiency:** Users find specific items 50% faster (filtering)
- ✅ **Quality:** Fewer oversights of high-severity items

---

## Notes

- All features are **optional** — users can ignore new fields if not needed
- No breaking changes — existing PFMEA items work without modification
- Family templates should be updated to include function and special char examples
- User guide should be updated with new features
- Consider adding tooltips explaining each new field

---

**Next Steps:**
1. Review and approve this plan
2. Run database migration script
3. Implement Phase 1 (P0 features)
4. Test Phase 1
5. Implement Phase 2 (P1 features)
6. Test Phase 2
7. Update documentation
8. Deploy to production
