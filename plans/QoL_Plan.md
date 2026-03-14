# Quality of Life (QoL) Improvement Plan

**Project**: Tidyco APQP Operations Portal  
**Total Improvements**: 47  
**Phases**: 4  
**Estimated Total Effort**: 120-180 hours

---

## How to Use This Document

Each checklist contains **actionable instructions for AI agents** to implement. Before starting any task:

1. Read the entire checklist item
2. Check existing code patterns in the specified files
3. Follow existing conventions (naming, style, architecture)
4. Run tests after completion
5. Mark checklist as complete with `[x]`

### Priority Legend
- **P0** - Critical path, do first
- **P1** - High priority
- **P2** - Medium priority
- **P3** - Low priority / Nice to have

### Effort Legend
- **🕐 Small** - < 2 hours
- **🕐🕐 Medium** - 2-8 hours
- **🕐🕐🕐 Large** - 8+ hours

---

# Phase 1: Quick Wins (Week 1-2)

**Goal**: Immediate user impact with minimal risk  
**Total Items**: 12  
**Estimated Time**: 8-12 hours

---

## 1.1 Auto-Focus First Input in Modals

**Priority**: P0 | **Effort**: 🕐 Small (30 min)  
**Files**: `index.html`, `utils/js/helpers.js`

**Implementation Checklist**:
- [ ] Open `index.html` and locate all modal templates (`<dialog id="modal...">` or `<div id="modal...">`)
- [ ] For each modal, identify the first input field (text, email, password, select, etc.)
- [ ] Add `autofocus` attribute to the first input field in each modal
- [ ] Alternatively, in `utils/js/helpers.js`, find `showModal()` function
- [ ] After `modal.style.display = 'block'` or `modal.showModal()`, add:
  ```javascript
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
  ```
- [ ] Test: Open each modal and verify cursor is in first input field
- [ ] Verify: Pressing Tab moves to next field correctly
- [ ] Verify: Pressing Escape closes modal and returns focus appropriately

---

## 1.2 Add Save Indicators

**Priority**: P0 | **Effort**: 🕐 Small (1 hr)  
**Files**: `core/js/db.js`, `core/css/components.css`, `index.html`

**Implementation Checklist**:
- [ ] Open `index.html` and locate the sync badge element (search for `sync-badge` or `id="syncBadge"`)
- [ ] If sync badge doesn't exist, add to topbar: `<div id="syncBadge" class="sync-badge" title="Sync status">● Saved</div>`
- [ ] Open `core/css/components.css` and add styles:
  ```css
  .sync-badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    background: #ecfdf5;
    color: #059669;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sync-badge.saving { background: #fef3c7; color: #d97706; }
  .sync-badge.error { background: #fef2f2; color: #dc2626; }
  ```
- [ ] Open `core/js/db.js` and locate the `save()` function
- [ ] Before the save operation, add: `setSyncBadge('saving', 'Saving...');`
- [ ] After successful save, add: `setSyncBadge('saved', 'Saved');`
- [ ] On error, add: `setSyncBadge('error', 'Save failed');`
- [ ] Create helper function if not exists:
  ```javascript
  function setSyncBadge(state, text) {
    const badge = document.getElementById('syncBadge');
    if (!badge) return;
    badge.className = `sync-badge ${state}`;
    badge.textContent = text;
    setTimeout(() => {
      if (state === 'saving' || state === 'error') {
        badge.className = 'sync-badge saved';
        badge.textContent = 'Saved';
      }
    }, state === 'error' ? 5000 : 2000);
  }
  ```
- [ ] Test: Make a change in any form and observe badge changes from "Saving..." to "Saved"
- [ ] Test: Verify badge is visible in all portals

---

## 1.3 Replace alert() with Toast Notifications

**Priority**: P0 | **Effort**: 🕐🕐 Medium (2 hr)  
**Files**: `utils/js/helpers.js`, `core/css/components.css`, `index.html`

**Implementation Checklist**:
- [ ] Search codebase for all `alert(` calls using grep: `grep -r "alert(" --include="*.js" .`
- [ ] Create toast container in `index.html` before closing `</body>`:
  ```html
  <div id="toastContainer" class="toast-container"></div>
  ```
- [ ] Add CSS to `core/css/components.css`:
  ```css
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
  }
  .toast {
    background: var(--white);
    border-left: 4px solid var(--blue);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 12px 16px;
    border-radius: 4px;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .toast.toast-success { border-left-color: var(--green); }
  .toast.toast-error { border-left-color: var(--red); }
  .toast.toast-warning { border-left-color: var(--amber); }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  ```
- [ ] Create `utils/js/helpers.js` function (or create file if needed):
  ```javascript
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${esc(message)}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  ```
- [ ] Replace `alert('Success message')` with `toast(message, 'success')`
- [ ] Replace `alert('Error: ' + msg)` with `toast('Error: ' + msg, 'error')`
- [ ] Keep `alert()` only for critical confirmations that require explicit user acknowledgment
- [ ] Test: Trigger success and error toasts in different portals
- [ ] Verify: Toasts auto-dismiss and don't block interaction

---

## 1.4 Enhance Empty States with Actions

**Priority**: P1 | **Effort**: 🕐 Small (1 hr)  
**Files**: All portal render functions (search for "No " patterns)

**Implementation Checklist**:
- [ ] Search for empty state patterns: `grep -r "No .* added\|No .* found\|No .* yet" --include="*.js" .`
- [ ] For each empty state, enhance with actionable content:
  ```javascript
  // Before:
  '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--muted)">No items found</td></tr>'
  
  // After:
  `<tr>
    <td colspan="5" style="text-align:center;padding:40px">
      <div style="color:var(--muted);margin-bottom:16px">No items found</div>
      <button class="btn btn-primary" onclick="[ACTION]">＋ Create First Item</button>
      <div style="font-size:12px;color:var(--muted);margin-top:8px">
        <a href="#" onclick="[HELP_ACTION]">Learn more →</a>
      </div>
    </td>
  </tr>`
  ```
- [ ] Update empty states in:
  - [ ] `portals/product-development/product-management/js/products.js` - Products list
  - [ ] `portals/capacity/js/me-tasks.js` - Tasks list
  - [ ] `portals/capacity/js/me-team.js` - Team members
  - [ ] `portals/production/js/scheduling.js` - Batches list
  - [ ] `portals/product-development/npi/js/dashboard.js` - Projects list
- [ ] Test: Navigate to each empty list and verify action button appears
- [ ] Verify: Button triggers correct action (modal, navigation, etc.)

---

## 1.5 Dynamic "Return to Portal" Button Text

**Priority**: P1 | **Effort**: 🕐 Small (30 min)  
**Files**: `index.html`, `utils/js/navigation.js`

**Implementation Checklist**:
- [ ] Open `index.html` and locate the back button (search for "Return to Portal" or "Back")
- [ ] Change static text to dynamic: `<button id="backBtn" class="btn btn-ghost">← Back</button>`
- [ ] Open `utils/js/navigation.js` and locate `render()` or `navigate()` function
- [ ] Add function to determine back button text:
  ```javascript
  function updateBackButtonText() {
    const btn = document.getElementById('backBtn');
    if (!btn) return;
    
    const backDestinations = {
      'hub': 'Hub',
      'capacity': 'Capacity',
      'production': 'Production',
      'product-development': 'Product Development',
      'productmgmt': 'Product Management',
      'operations': 'Operations',
      'bugreports': 'Bug Reports'
    };
    
    // Determine current section
    const current = currentSection || 'hub';
    const destination = backDestinations[current] || 'Portal';
    btn.textContent = `← Back to ${destination}`;
  }
  ```
- [ ] Call `updateBackButtonText()` at the end of each `render()` function
- [ ] Test: Navigate to different portals and verify button text updates
- [ ] Verify: Button navigates to correct destination

---

## 1.6 Quick-Add Pattern for Sequential Entry

**Priority**: P1 | **Effort**: 🕐 Small (1 hr)  
**Files**: `portals/product-development/product-management/js/products.js`, similar patterns in other portals

**Implementation Checklist**:
- [ ] Open `portals/product-development/product-management/js/products.js`
- [ ] Locate `productsAddRow()` function
- [ ] After successful add, clear all inputs instead of just some:
  ```javascript
  // After successful add:
  document.getElementById('pNew-name').value = '';
  document.getElementById('pNew-partNumber').value = '';
  document.getElementById('pNew-customer').value = '';
  document.getElementById('pNew-notes').value = '';
  document.getElementById('pNew-hours').value = '0';
  document.getElementById('pNew-turnaround').value = '';
  // Keep family, location, status as they're often the same
  document.getElementById('pNew-name')?.focus(); // Return focus to start
  ```
- [ ] Add visual feedback that form is ready for next entry:
  ```javascript
  // Add temporary highlight to show form is ready
  const newRow = document.getElementById('productsNewRow');
  if (newRow) {
    newRow.style.backgroundColor = 'rgba(59,130,246,0.1)';
    setTimeout(() => newRow.style.backgroundColor = '', 500);
  }
  ```
- [ ] Apply same pattern to:
  - [ ] `portals/capacity/js/me-tasks.js` - `meAddDefaultTask()`
  - [ ] `portals/capacity/js/me-team.js` - Team member add
  - [ ] `portals/production/js/scheduling.js` - Batch add
- [ ] Test: Add multiple items in sequence without manual clearing
- [ ] Verify: Focus returns to first field automatically

---

## 1.7 Persist Search and Filter State

**Priority**: P1 | **Effort**: 🕐 Small (1 hr)  
**Files**: `portals/product-development/product-management/js/products.js`, `portals/capacity/js/me-tasks.js`

**Implementation Checklist**:
- [ ] Open `portals/product-development/product-management/js/products.js`
- [ ] Add state persistence at top of file:
  ```javascript
  const PRODUCTS_FILTER_STATE_KEY = 'products_filter_state';
  
  function loadProductsFilterState() {
    try {
      const saved = localStorage.getItem(PRODUCTS_FILTER_STATE_KEY);
      return saved ? JSON.parse(saved) : { search: '', status: 'all', family: 'all' };
    } catch {
      return { search: '', status: 'all', family: 'all' };
    }
  }
  
  function saveProductsFilterState(state) {
    try {
      localStorage.setItem(PRODUCTS_FILTER_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save filter state:', e);
    }
  }
  ```
- [ ] Modify `renderProductsList()` to restore state:
  ```javascript
  function renderProductsList() {
    const state = loadProductsFilterState();
    const searchInput = document.getElementById('productSearch');
    if (searchInput && !document.activeElement.contains(searchInput)) {
      searchInput.value = state.search || '';
    }
    // ... rest of render logic using state
  }
  ```
- [ ] Update filter change handlers to save state:
  ```javascript
  // In search input handler:
  saveProductsFilterState({ ...state, search: newValue });
  ```
- [ ] Apply same pattern to:
  - [ ] `portals/capacity/js/me-tasks.js` - Task filters
  - [ ] `portals/product-development/npi/js/dashboard.js` - Project filters
  - [ ] `portals/production/js/scheduling.js` - Batch filters
- [ ] Test: Apply filters, refresh page, verify filters are restored
- [ ] Verify: Clearing filters updates saved state

---

## 1.8 Add Tooltips to Icon-Only Buttons

**Priority**: P2 | **Effort**: 🕐 Small (2 hr)  
**Files**: All portal files with icon buttons

**Implementation Checklist**:
- [ ] Search for icon-only buttons: `grep -rE "<button[^>]*>[✕✓🗑️✏️📊]" --include="*.js" .`
- [ ] For each button without `title` attribute, add descriptive text:
  ```javascript
  // Before:
  '<button class="btn-del" onclick="deleteItem()">✕</button>'
  
  // After:
  '<button class="btn-del" onclick="deleteItem()" title="Delete item">✕</button>'
  ```
- [ ] Add tooltips to these common patterns:
  - [ ] Edit buttons (✏️): `title="Edit"`
  - [ ] Delete buttons (🗑️ or ✕): `title="Delete"`
  - [ ] Save buttons (✓): `title="Save"`
  - [ ] Cancel buttons: `title="Cancel"`
  - [ ] Add buttons (＋): `title="Add new"`
  - [ ] Chart/Graph icons: `title="View chart"`
- [ ] Focus on these files:
  - [ ] `portals/product-development/product-management/js/products.js`
  - [ ] `portals/capacity/js/me-tasks.js`
  - [ ] `portals/capacity/js/me-team.js`
  - [ ] `portals/production/js/scheduling.js`
  - [ ] `portals/product-development/npi/js/dashboard.js`
- [ ] Test: Hover over icon buttons and verify tooltip appears
- [ ] Verify: Tooltips are descriptive and actionable

---

## 1.9 Individual Filter Clear Buttons

**Priority**: P2 | **Effort**: 🕐 Small (1 hr)  
**Files**: `portals/capacity/js/me-tasks.js`

**Implementation Checklist**:
- [ ] Open `portals/capacity/js/me-tasks.js`
- [ ] Locate filter section in `meRenderTasksTab()`
- [ ] Modify filter HTML to include clear buttons:
  ```javascript
  // For each filter select, add adjacent clear button:
  `
  <div class="filter-chip">
    <select onchange="...">${options}</select>
    ${currentFilters.category !== 'all' ? `
      <button class="filter-clear" onclick="clearFilter('category')" title="Clear filter">×</button>
    ` : ''}
  </div>
  `
  ```
- [ ] Add CSS for clear button:
  ```css
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .filter-clear {
    background: rgba(0,0,0,0.1);
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--muted);
  }
  .filter-clear:hover {
    background: rgba(0,0,0,0.2);
    color: var(--ink);
  }
  ```
- [ ] Add clear function:
  ```javascript
  function clearFilter(filterName) {
    if (filterName === 'category') {
      window.meTasksFilters.category = 'all';
    } else if (filterName === 'assignee') {
      window.meTasksFilters.assignee = 'all';
    } else if (filterName === 'search') {
      window.meTasksFilters.search = '';
      document.querySelector('.me-filter-input').value = '';
    }
    meSetTab('tasks');
  }
  ```
- [ ] Apply same pattern to PM capacity tasks
- [ ] Test: Apply filters and verify clear buttons appear
- [ ] Verify: Clicking clear button resets only that filter

---

## 1.10 Keyboard Shortcuts Help Modal

**Priority**: P2 | **Effort**: 🕐 Medium (2 hr)  
**Files**: `index.html`, `utils/js/helpers.js`, `core/css/components.css`

**Implementation Checklist**:
- [ ] Add modal to `index.html`:
  ```html
  <dialog id="shortcutsModal" class="modal shortcuts-modal">
    <div class="modal-content">
      <h2>Keyboard Shortcuts</h2>
      <div class="shortcuts-grid">
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>S</kbd>
          <span>Save current work</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>N</kbd>
          <span>New item</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>F</kbd>
          <span>Focus search</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
          <span>Save form/row</span>
        </div>
        <div class="shortcut-item">
          <kbd>Escape</kbd>
          <span>Cancel edit / Close modal</span>
        </div>
        <div class="shortcut-item">
          <kbd>?</kbd>
          <span>Show this help</span>
        </div>
      </div>
      <button class="btn btn-primary" onclick="closeModal('shortcutsModal')">Close</button>
    </div>
  </dialog>
  ```
- [ ] Add CSS to `core/css/components.css`:
  ```css
  .shortcuts-modal .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    margin: 20px 0;
  }
  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: #f9fafb;
    border-radius: 4px;
  }
  kbd {
    background: #e5e7eb;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
  }
  ```
- [ ] Add keyboard listener in `utils/js/helpers.js`:
  ```javascript
  document.addEventListener('keydown', (e) => {
    // Show shortcuts modal with ? or Ctrl+/
    if ((e.key === '?' && !isInputFocused()) || 
        (e.ctrlKey && e.key === '/')) {
      e.preventDefault();
      document.getElementById('shortcutsModal')?.showModal();
    }
  });
  
  function isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' || 
      active.tagName === 'TEXTAREA' || 
      active.tagName === 'SELECT' ||
      active.isContentEditable
    );
  }
  ```
- [ ] Add help icon to topbar: `<button onclick="showModal('shortcutsModal')" title="Keyboard shortcuts">⌨️</button>`
- [ ] Test: Press `?` and `Ctrl+/` to open modal
- [ ] Verify: Modal displays all shortcuts clearly

---

## 1.11 Smart Date Entry Helper

**Priority**: P2 | **Effort**: 🕐 Medium (2 hr)  
**Files**: `utils/js/helpers.js`, all date input fields

**Implementation Checklist**:
- [ ] Create date parsing utility in `utils/js/helpers.js`:
  ```javascript
  function parseSmartDate(input) {
    const today = new Date();
    const lower = input.toLowerCase().trim();
    
    // Absolute dates
    if (lower === 'today') return formatDateISO(today);
    if (lower === 'tomorrow') {
      const t = new Date(today);
      t.setDate(t.getDate() + 1);
      return formatDateISO(t);
    }
    if (lower === 'next week') {
      const t = new Date(today);
      t.setDate(t.getDate() + 7);
      return formatDateISO(t);
    }
    
    // Relative: +7d, +2w, +1m
    const relMatch = lower.match(/^\+(\d+)(d|w|m)$/);
    if (relMatch) {
      const [, num, unit] = relMatch;
      const t = new Date(today);
      if (unit === 'd') t.setDate(t.getDate() + parseInt(num));
      if (unit === 'w') t.setDate(t.getDate() + parseInt(num) * 7);
      if (unit === 'm') t.setMonth(t.getMonth() + parseInt(num));
      return formatDateISO(t);
    }
    
    // Weekday: mon, tue, wed, etc. (next occurrence)
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayIdx = days.indexOf(lower);
    if (dayIdx >= 0) {
      const t = new Date(today);
      const currentDay = t.getDay();
      const daysUntil = (dayIdx - currentDay + 7) % 7 || 7;
      t.setDate(t.getDate() + daysUntil);
      return formatDateISO(t);
    }
    
    // Return null for invalid
    return null;
  }
  
  function formatDateISO(date) {
    return date.toISOString().split('T')[0];
  }
  ```
- [ ] Add date input handler:
  ```javascript
  function setupSmartDateInputs() {
    document.querySelectorAll('input[type="date"]').forEach(input => {
      input.addEventListener('blur', (e) => {
        const value = e.target.value;
        const parsed = parseSmartDate(value);
        if (parsed) {
          e.target.value = parsed;
          e.target.style.backgroundColor = '#ecfdf5';
          setTimeout(() => e.target.style.backgroundColor = '', 1000);
        }
      });
    });
  }
  ```
- [ ] Call `setupSmartDateInputs()` in `app.js` after page load
- [ ] Add helper text near date inputs: `<small>Try: today, tomorrow, +7d, mon</small>`
- [ ] Test: Enter "today", "tomorrow", "+7d", "mon" in date fields
- [ ] Verify: Values convert to YYYY-MM-DD format

---

## 1.12 Improve Loading States

**Priority**: P2 | **Effort**: 🕐 Medium (2 hr)  
**Files**: All portal render functions

**Implementation Checklist**:
- [ ] Search for loading patterns: `grep -r "Loading\.\.\." --include="*.js" .`
- [ ] Replace simple loading text with skeleton loaders:
  ```javascript
  // Before:
  '<div style="padding:40px;text-align:center;color:var(--muted)">Loading...</div>'
  
  // After:
  `<div class="skeleton-loader">
    <div class="skeleton-line" style="width: 80%"></div>
    <div class="skeleton-line" style="width: 60%"></div>
    <div class="skeleton-line" style="width: 90%"></div>
  </div>`
  ```
- [ ] Add CSS to `core/css/components.css`:
  ```css
  .skeleton-loader {
    padding: 20px;
  }
  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin: 8px 0;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  ```
- [ ] Add timeout message for long loads:
  ```javascript
  setTimeout(() => {
    const loader = document.querySelector('.skeleton-loader');
    if (loader) {
      loader.innerHTML += '<div style="margin-top:16px;color:var(--muted);font-size:13px">This is taking longer than expected... <button onclick="location.reload()">Retry</button></div>';
    }
  }, 5000);
  ```
- [ ] Apply to:
  - [ ] Product lists
  - [ ] Task lists
  - [ ] Capacity charts
  - [ ] Dashboard widgets
- [ ] Test: Simulate slow load and verify skeleton appears
- [ ] Verify: Retry button works after timeout

---

# Phase 2: Core UX (Week 3-4)

**Goal**: Transformative UX improvements for power users  
**Total Items**: 12  
**Estimated Time**: 20-30 hours

---

## 2.1 Global Keyboard Shortcuts

**Priority**: P0 | **Effort**: 🕐🕐 Medium (3 hr)  
**Files**: `utils/js/helpers.js`, `index.html`

**Implementation Checklist**:
- [ ] Create keyboard shortcuts manager in `utils/js/helpers.js`:
  ```javascript
  const KeyboardShortcuts = {
    handlers: {},
    
    register(combo, handler, description) {
      this.handlers[combo.toLowerCase()] = { handler, description };
    },
    
    init() {
      document.addEventListener('keydown', (e) => {
        if (isInputFocused()) return;
        
        const combo = this.buildCombo(e);
        const shortcut = this.handlers[combo];
        
        if (shortcut) {
          e.preventDefault();
          shortcut.handler();
        }
      });
    },
    
    buildCombo(e) {
      const parts = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.metaKey) parts.push('meta');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      return parts.join('+');
    }
  };
  
  function isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' || 
      active.tagName === 'TEXTAREA' || 
      active.tagName === 'SELECT' ||
      active.isContentEditable
    );
  }
  ```
- [ ] Register global shortcuts:
  ```javascript
  // In app.js or helpers.js init:
  KeyboardShortcuts.register('ctrl+s', () => {
    // Trigger save in current context
    if (typeof meOnSave === 'function') meOnSave();
    if (typeof pmOnSave === 'function') pmOnSave();
    if (typeof save === 'function') save();
    showToast('Saved', 'success', 2000);
  }, 'Save current work');
  
  KeyboardShortcuts.register('ctrl+n', () => {
    // Context-aware new item
    if (currentSection === 'product-development') {
      showModal('modalNewProj');
    } else if (currentSection === 'capacity') {
      // Open appropriate new item modal
    }
  }, 'New item');
  
  KeyboardShortcuts.register('ctrl+f', () => {
    // Focus search in current view
    const search = document.querySelector('input[placeholder*="Search"]');
    if (search) search.focus();
  }, 'Focus search');
  
  KeyboardShortcuts.register('ctrl+enter', () => {
    // Save current form/row
    const active = document.activeElement;
    if (active && active.closest('tr.row-new')) {
      const saveBtn = active.closest('tr').querySelector('[data-action*="save"], [data-action*="add"]');
      if (saveBtn) saveBtn.click();
    }
  }, 'Save form/row');
  
  KeyboardShortcuts.register('escape', () => {
    // Close modal or cancel edit
    const modal = document.querySelector('dialog[open], .modal[style*="display: block"]');
    if (modal) {
      modal.close?.();
      modal.style.display = 'none';
    }
  }, 'Cancel / Close');
  ```
- [ ] Add visual indicator for available shortcuts in each view
- [ ] Test each shortcut in different contexts
- [ ] Verify: Shortcuts don't interfere with text input
- [ ] Update shortcuts modal with registered shortcuts

---

## 2.2 Bulk Operations with Multi-Select

**Priority**: P1 | **Effort**: 🕐🕐 Medium (4 hr)  
**Files**: All table-based portals

**Implementation Checklist**:
- [ ] Add checkbox column to table headers:
  ```javascript
  // In table render function:
  '<th style="width:40px"><input type="checkbox" id="selectAll" onchange="toggleSelectAll()"></th>'
  ```
- [ ] Add checkbox to each row:
  ```javascript
  `<tr data-id="${item.id}">
    <td style="text-align:center">
      <input type="checkbox" class="row-select" onchange="updateBulkToolbar()">
    </td>
    ...
  </tr>`
  ```
- [ ] Create bulk action toolbar:
  ```javascript
  function updateBulkToolbar() {
    const selected = document.querySelectorAll('.row-select:checked');
    const toolbar = document.getElementById('bulkToolbar');
    
    if (selected.length > 0) {
      toolbar.style.display = 'flex';
      toolbar.innerHTML = `
        <span>${selected.length} selected</span>
        <button onclick="bulkDelete()">Delete</button>
        <button onclick="bulkExport()">Export</button>
        <button onclick="clearSelection()">Clear</button>
      `;
    } else {
      toolbar.style.display = 'none';
    }
  }
  
  function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    document.querySelectorAll('.row-select').forEach(cb => {
      cb.checked = selectAll.checked;
    });
    updateBulkToolbar();
  }
  ```
- [ ] Add CSS for toolbar:
  ```css
  #bulkToolbar {
    position: sticky;
    top: 0;
    background: var(--white);
    border-bottom: 2px solid var(--blue);
    padding: 8px 16px;
    display: none;
    align-items: center;
    gap: 16px;
    z-index: 100;
  }
  ```
- [ ] Implement bulk actions:
  - [ ] `bulkDelete()` - Delete all selected with confirmation
  - [ ] `bulkExport()` - Export selected to CSV
  - [ ] `bulkStatusChange()` - Change status for all selected
- [ ] Apply to:
  - [ ] Products list
  - [ ] Tasks list
  - [ ] Batches list
  - [ ] Projects list
- [ ] Test: Select multiple items and perform bulk actions
- [ ] Verify: Toolbar appears only when items selected

---

## 2.3 Context Menus (Right-Click)

**Priority**: P1 | **Effort**: 🕐🕐 Medium (4 hr)  
**Files**: `utils/js/helpers.js`, all table rows

**Implementation Checklist**:
- [ ] Create context menu system in `utils/js/helpers.js`:
  ```javascript
  const ContextMenu = {
    menu: null,
    
    init() {
      this.menu = document.createElement('div');
      this.menu.className = 'context-menu';
      document.body.appendChild(this.menu);
      
      document.addEventListener('click', () => this.hide());
      document.addEventListener('contextmenu', (e) => this.handle(e));
    },
    
    handle(e) {
      const row = e.target.closest('tr[data-id]');
      if (!row) return;
      
      e.preventDefault();
      const id = row.dataset.id;
      const actions = this.getActions(id, row);
      
      this.show(e.clientX, e.clientY, actions);
    },
    
    getActions(id, row) {
      // Context-aware actions
      return [
        { label: 'Edit', icon: '✏️', action: () => editItem(id) },
        { label: 'Duplicate', icon: '📋', action: () => duplicateItem(id) },
        { label: 'Delete', icon: '🗑️', action: () => deleteItem(id), danger: true }
      ];
    },
    
    show(x, y, actions) {
      this.menu.innerHTML = actions.map(a => `
        <div class="context-menu-item ${a.danger ? 'danger' : ''}" 
             onclick="${a.action.toString()}">
          ${a.icon} ${a.label}
        </div>
      `).join('');
      
      this.menu.style.display = 'block';
      this.menu.style.left = x + 'px';
      this.menu.style.top = y + 'px';
      
      // Keep menu in viewport
      const rect = this.menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.menu.style.left = (x - rect.width) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        this.menu.style.top = (y - rect.height) + 'px';
      }
    },
    
    hide() {
      this.menu.style.display = 'none';
    }
  };
  ```
- [ ] Add CSS:
  ```css
  .context-menu {
    position: fixed;
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    min-width: 160px;
    display: none;
  }
  .context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .context-menu-item:hover {
    background: #f5f5f5;
  }
  .context-menu-item.danger {
    color: var(--red);
  }
  ```
- [ ] Initialize in `app.js`: `ContextMenu.init()`
- [ ] Test: Right-click on table rows
- [ ] Verify: Menu appears at cursor position
- [ ] Verify: Menu closes on click outside

---

## 2.4 Advanced Filtering Panel

**Priority**: P1 | **Effort**: 🕐🕐 Medium (3 hr)  
**Files**: `portals/product-development/npi/js/dashboard.js`, `portals/capacity/js/me-tasks.js`

**Implementation Checklist**:
- [ ] Add expandable advanced filter section:
  ```javascript
  function renderAdvancedFilters() {
    return `
      <div class="advanced-filters" id="advancedFilters" style="display:none">
        <div class="filter-row">
          <label>Family</label>
          <select id="advFamily" multiple onchange="applyAdvancedFilters()">
            ${getFamilies().map(f => `<option value="${f.id}">${f.icon} ${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="filter-row">
          <label>Status</label>
          <select id="advStatus" multiple onchange="applyAdvancedFilters()">
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div class="filter-row">
          <label>Date Range</label>
          <input type="date" id="advDateFrom" onchange="applyAdvancedFilters()">
          <span>to</span>
          <input type="date" id="advDateTo" onchange="applyAdvancedFilters()">
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" onclick="applyAdvancedFilters()">Apply</button>
          <button class="btn btn-ghost" onclick="clearAdvancedFilters()">Clear All</button>
        </div>
      </div>
    `;
  }
  ```
- [ ] Add toggle button:
  ```javascript
  '<button class="btn btn-ghost" onclick="toggleAdvancedFilters()">⚙️ Advanced Filters ▾</button>'
  ```
- [ ] Add toggle function:
  ```javascript
  function toggleAdvancedFilters() {
    const panel = document.getElementById('advancedFilters');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
  ```
- [ ] Add CSS:
  ```css
  .advanced-filters {
    background: #f9fafb;
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
  }
  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .filter-row label {
    min-width: 100px;
    font-weight: 600;
  }
  .filter-row select,
  .filter-row input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 4px;
  }
  ```
- [ ] Implement `applyAdvancedFilters()` to filter data based on all criteria
- [ ] Implement `clearAdvancedFilters()` to reset all filters
- [ ] Test: Apply multiple filters simultaneously
- [ ] Verify: Filters combine correctly (AND logic)

---

## 2.5 Breadcrumb Navigation

**Priority**: P1 | **Effort**: 🕐 Medium (2 hr)  
**Files**: `index.html`, `utils/js/navigation.js`

**Implementation Checklist**:
- [ ] Add breadcrumb container to topbar in `index.html`:
  ```html
  <div class="breadcrumb" id="breadcrumb"></div>
  ```
- [ ] Add CSS:
  ```css
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted);
  }
  .breadcrumb a {
    color: var(--blue);
    text-decoration: none;
  }
  .breadcrumb a:hover {
    text-decoration: underline;
  }
  .breadcrumb-sep {
    color: var(--line);
  }
  ```
- [ ] Create breadcrumb builder in `utils/js/navigation.js`:
  ```javascript
  function updateBreadcrumb() {
    const container = document.getElementById('breadcrumb');
    if (!container) return;
    
    const crumbs = [
      { label: 'Hub', hash: '#s=hub' }
    ];
    
    if (currentSection) {
      const sectionNames = {
        'hub': 'Hub',
        'capacity': 'Capacity',
        'production': 'Production',
        'product-development': 'Product Development',
        'productmgmt': 'Product Management',
        'operations': 'Operations',
        'bugreports': 'Bug Reports'
      };
      
      crumbs.push({
        label: sectionNames[currentSection] || currentSection,
        hash: `#s=${currentSection}`
      });
    }
    
    if (currentSection === 'capacity' && capacityTab) {
      const tabNames = {
        'me': 'ME Capacity',
        'projects': 'PM Capacity',
        'overhaul': 'Production Capacity'
      };
      if (tabNames[capacityTab]) {
        crumbs.push({ label: tabNames[capacityTab], hash: '#' });
      }
    }
    
    container.innerHTML = crumbs.map((c, i) => {
      if (i === crumbs.length - 1) {
        return `<span class="breadcrumb-current">${c.label}</span>`;
      }
      return `<a href="${c.hash}">${c.label}</a>`;
    }).join('<span class="breadcrumb-sep"> › </span>');
  }
  ```
- [ ] Call `updateBreadcrumb()` in `render()` function
- [ ] Test: Navigate through different sections
- [ ] Verify: Breadcrumb updates correctly
- [ ] Verify: Clicking crumbs navigates correctly

---

## 2.6 Undo After Delete (Soft Delete)

**Priority**: P1 | **Effort**: 🕐🕐 Medium (4 hr)  
**Files**: All delete operations across portals

**Implementation Checklist**:
- [ ] Create undo manager in `utils/js/helpers.js`:
  ```javascript
  const UndoManager = {
    queue: [],
    
    add(item, deleteFn, restoreFn) {
      const id = Date.now();
      this.queue.push({ id, item, deleteFn, restoreFn });
      
      showToast(
        'Item deleted',
        'info',
        5000,
        `<button onclick="UndoManager.undo(${id})">Undo</button>`
      );
      
      setTimeout(() => {
        const idx = this.queue.findIndex(q => q.id === id);
        if (idx >= 0) {
          this.queue[idx].deleteFn();
          this.queue.splice(idx, 1);
        }
      }, 5000);
    },
    
    undo(id) {
      const idx = this.queue.findIndex(q => q.id === id);
      if (idx >= 0) {
        this.queue[idx].restoreFn();
        this.queue.splice(idx, 1);
        showToast('Restored', 'success');
      }
    }
  };
  ```
- [ ] Modify delete functions to use undo manager:
  ```javascript
  // Before:
  function deleteProduct(id) {
    productsDataDeleteProduct(id);
    render();
  }
  
  // After:
  function deleteProduct(id) {
    const product = productsState.products.find(p => p.id === id);
    if (!product) return;
    
    UndoManager.add(
      product,
      () => productsDataDeleteProduct(id),
      () => {
        // Restore product
        productsState.products.push(product);
        productsDataSave(product);
      }
    );
    
    // Optimistic UI update
    productsState.products = productsState.products.filter(p => p.id !== id);
    render();
  }
  ```
- [ ] Apply to all delete operations:
  - [ ] Products
  - [ ] Tasks
  - [ ] Team members
  - [ ] Batches
  - [ ] Projects
  - [ ] Bug reports
- [ ] Test: Delete item and click Undo
- [ ] Verify: Item restored correctly
- [ ] Verify: After 5 seconds, delete becomes permanent

---

## 2.7 Column Resize with Persistence

**Priority**: P2 | **Effort**: 🕐🕐 Medium (4 hr)  
**Files**: All table-based views

**Implementation Checklist**:
- [ ] Add resize handles to table headers:
  ```javascript
  '<th style="width:150px;position:relative">
    Task Name
    <div class="resize-handle" onmousedown="startResize(event, this)"></div>
  </th>'
  ```
- [ ] Add CSS:
  ```css
  .resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    cursor: col-resize;
    background: transparent;
  }
  .resize-handle:hover {
    background: var(--blue);
  }
  table.resizable col {
    transition: width 0.1s;
  }
  ```
- [ ] Add resize logic:
  ```javascript
  let resizingCol = null;
  let startX = 0;
  let startWidth = 0;
  
  function startResize(e, handle) {
    resizingCol = handle.closest('th').querySelector('col');
    startX = e.pageX;
    startWidth = resizingCol.offsetWidth;
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
  }
  
  function doResize(e) {
    if (!resizingCol) return;
    const diff = e.pageX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    resizingCol.style.width = newWidth + 'px';
  }
  
  function stopResize() {
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    
    // Save to localStorage
    saveColumnWidths();
    resizingCol = null;
  }
  
  function saveColumnWidths() {
    const widths = [];
    document.querySelectorAll('table.resizable col').forEach((col, i) => {
      widths.push(col.style.width || col.offsetWidth);
    });
    localStorage.setItem('table_column_widths', JSON.stringify(widths));
  }
  
  function loadColumnWidths() {
    const saved = localStorage.getItem('table_column_widths');
    if (!saved) return;
    
    const widths = JSON.parse(saved);
    document.querySelectorAll('table.resizable col').forEach((col, i) => {
      if (widths[i]) col.style.width = widths[i];
    });
  }
  ```
- [ ] Call `loadColumnWidths()` after table render
- [ ] Test: Drag column edges to resize
- [ ] Verify: Widths persist after page refresh

---

## 2.8 Density Toggle (Compact/Comfortable)

**Priority**: P2 | **Effort**: 🕐 Medium (3 hr)  
**Files**: `core/css/main.css`, `index.html`

**Implementation Checklist**:
- [ ] Add density toggle to topbar:
  ```html
  <select id="densityToggle" onchange="setDensity(this.value)" title="View density">
    <option value="compact">Compact</option>
    <option value="normal" selected>Normal</option>
    <option value="comfortable">Comfortable</option>
  </select>
  ```
- [ ] Add CSS custom properties:
  ```css
  :root[data-density="compact"] {
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --font-size-base: 12px;
    --row-height: 32px;
  }
  
  :root[data-density="normal"] {
    --spacing-xs: 6px;
    --spacing-sm: 10px;
    --spacing-md: 16px;
    --spacing-lg: 20px;
    --font-size-base: 14px;
    --row-height: 40px;
  }
  
  :root[data-density="comfortable"] {
    --spacing-xs: 8px;
    --spacing-sm: 12px;
    --spacing-md: 20px;
    --spacing-lg: 24px;
    --font-size-base: 15px;
    --row-height: 48px;
  }
  ```
- [ ] Add JavaScript:
  ```javascript
  function setDensity(value) {
    document.documentElement.setAttribute('data-density', value);
    localStorage.setItem('ui_density', value);
  }
  
  function loadDensity() {
    const saved = localStorage.getItem('ui_density') || 'normal';
    setDensity(saved);
    document.getElementById('densityToggle').value = saved;
  }
  ```
- [ ] Call `loadDensity()` in `app.js`
- [ ] Update all CSS to use density variables:
  ```css
  .table-row {
    height: var(--row-height);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  ```
- [ ] Test: Toggle density and verify layout changes
- [ ] Verify: Preference persists after refresh

---

## 2.9 Export/Import Feature

**Priority**: P2 | **Effort**: 🕐 Medium (3 hr)  
**Files**: `core/js/db.js`, `index.html`

**Implementation Checklist**:
- [ ] Enable export/import buttons in `index.html` (remove `display:none`)
- [ ] Add export function to `core/js/db.js`:
  ```javascript
  function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tidyco-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data exported', 'success');
  }
  ```
- [ ] Add import function:
  ```javascript
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (!confirm(`Import ${imported.programmes?.length || 0} programmes? This will overwrite current data.`)) {
          return;
        }
        
        db = imported;
        save();
        showToast('Data imported successfully', 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  }
  ```
- [ ] Add event listeners:
  ```javascript
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('change', importData);
  ```
- [ ] Add per-portal export (current view only):
  ```javascript
  function exportCurrentView() {
    let data;
    if (currentSection === 'product-development') {
      data = db.programmes;
    } else if (currentSection === 'capacity') {
      data = meDataState;
    }
    // ... similar download logic
  }
  ```
- [ ] Test: Export data and verify file downloads
- [ ] Test: Import backup file and verify data loads
- [ ] Verify: Confirmation dialog appears before overwrite

---

## 2.10 Print Styles

**Priority**: P2 | **Effort**: 🕐 Small (2 hr)  
**Files**: `core/css/main.css`

**Implementation Checklist**:
- [ ] Add print media query:
  ```css
  @media print {
    /* Hide navigation and interactive elements */
    .topbar,
    .sidebar,
    .btn,
    button,
    .modal,
    .toast-container,
    .context-menu,
    #bulkToolbar {
      display: none !important;
    }
    
    /* Optimize for paper */
    body {
      background: white;
      color: black;
      font-size: 11pt;
    }
    
    .shell {
      display: block;
      padding: 0;
      margin: 0;
    }
    
    /* Ensure tables print well */
    table {
      page-break-inside: avoid;
      border-collapse: collapse;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 6px;
    }
    
    /* Add page breaks */
    .panel,
    .card {
      page-break-inside: avoid;
    }
    
    /* Show URLs for links */
    a[href]:after {
      content: " (" attr(href) ")";
      font-size: 9pt;
    }
    
    /* Add print header */
    body:before {
      content: "Tidyco Operations Portal - " attr(data-section);
      display: block;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
  }
  ```
- [ ] Add print button to topbar:
  ```html
  <button onclick="window.print()" title="Print current view">🖨️</button>
  ```
- [ ] Add `data-section` attribute to body dynamically:
  ```javascript
  document.body.setAttribute('data-section', currentSection || 'Hub');
  ```
- [ ] Test: Print different pages
- [ ] Verify: Navigation hidden, content formatted for paper
- [ ] Verify: Page breaks occur at logical points

---

## 2.11 Real-Time Granular Updates

**Priority**: P2 | **Effort**: 🕐🕐 Large (6 hr)  
**Files**: All real-time subscription handlers

**Implementation Checklist**:
- [ ] Modify real-time handlers to update specific rows:
  ```javascript
  // Before (full re-render):
  onInsert: (newData) => {
    meDataState.tasks.push(newData);
    render();
  }
  
  // After (granular update):
  onInsert: (newData) => {
    meDataState.tasks.push(newData);
    
    // Update table directly without full re-render
    const tbody = document.querySelector('.me-tbl tbody');
    if (tbody) {
      const row = renderTaskRow(newData);
      tbody.insertAdjacentHTML('beforeend', row);
    }
  }
  ```
- [ ] Create row render helpers:
  ```javascript
  function renderTaskRow(task) {
    return `<tr data-id="${task.id}">...cells...</tr>`;
  }
  
  function updateTaskRow(task) {
    const row = document.querySelector(`tr[data-id="${task.id}"]`);
    if (row) {
      row.outerHTML = renderTaskRow(task);
    }
  }
  
  function removeTaskRow(taskId) {
    const row = document.querySelector(`tr[data-id="${taskId}"]`);
    if (row) {
      row.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => row.remove(), 300);
    }
  }
  ```
- [ ] Add CSS for smooth transitions:
  ```css
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-100%); }
  }
  ```
- [ ] Preserve scroll position:
  ```javascript
  function preserveScrollDuringUpdate(updateFn) {
    const scrollContainer = document.scrollingElement;
    const scrollY = scrollContainer.scrollTop;
    
    updateFn();
    
    setTimeout(() => {
      scrollContainer.scrollTop = scrollY;
    }, 50);
  }
  ```
- [ ] Apply to:
  - [ ] Tasks (ME and PM capacity)
  - [ ] Products
  - [ ] Projects
  - [ ] Bug reports
- [ ] Test: Open in two windows, make changes
- [ ] Verify: Updates appear without full page refresh
- [ ] Verify: Scroll position preserved

---

## 2.12 Quick View/Preview on Hover

**Priority**: P3 | **Effort**: 🕐 Small (2 hr)  
**Files**: All table views with truncated content

**Implementation Checklist**:
- [ ] Add tooltip for truncated content:
  ```javascript
  // In cell render:
  `<td class="truncated-cell" title="${esc(fullContent)}">${esc(truncatedContent)}</td>`
  ```
- [ ] Add CSS for ellipsis:
  ```css
  .truncated-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ```
- [ ] For rich content, use custom tooltip:
  ```javascript
  function createPreviewTooltip(content, type = 'text') {
    return `
      <div class="preview-tooltip">
        ${type === 'text' ? esc(content) : content}
      </div>
    `;
  }
  ```
- [ ] Add CSS:
  ```css
  .preview-tooltip {
    position: absolute;
    background: var(--white);
    border: 1px solid var(--line);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 12px;
    border-radius: 4px;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    font-size: 13px;
    line-height: 1.5;
  }
  ```
- [ ] Add JavaScript for dynamic positioning:
  ```javascript
  document.querySelectorAll('.truncated-cell').forEach(cell => {
    cell.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'preview-tooltip';
      tooltip.textContent = cell.dataset.fullContent || cell.title;
      document.body.appendChild(tooltip);
      
      const rect = cell.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.bottom + 5) + 'px';
    });
    
    cell.addEventListener('mouseleave', () => {
      document.querySelectorAll('.preview-tooltip').forEach(t => t.remove());
    });
  });
  ```
- [ ] Test: Hover over truncated cells
- [ ] Verify: Full content visible in tooltip
- [ ] Verify: Tooltip positioned correctly

---

# Phase 3: Advanced Features (Month 2)

**Goal**: Power user features and advanced functionality  
**Total Items**: 12  
**Estimated Time**: 40-60 hours

---

## 3.1 Undo/Redo System

**Priority**: P1 | **Effort**: 🕐🕐🕐 Large (8 hr)  
**Files**: `utils/js/helpers.js`, all edit operations

**Implementation Checklist**:
- [ ] Create comprehensive undo/redo manager:
  ```javascript
  const UndoRedoManager = {
    undoStack: [],
    redoStack: [],
    maxSize: 20,
    
    push(action) {
      this.undoStack.push({
        ...action,
        timestamp: Date.now()
      });
      
      // Trim stack
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
      
      // Clear redo stack on new action
      this.redoStack = [];
      
      this.updateUI();
    },
    
    undo() {
      const action = this.undoStack.pop();
      if (!action) return false;
      
      action.inverse();
      this.redoStack.push(action);
      
      this.updateUI();
      showToast('Undone', 'info', 2000);
      return true;
    },
    
    redo() {
      const action = this.redoStack.pop();
      if (!action) return false;
      
      action.execute();
      this.undoStack.push(action);
      
      this.updateUI();
      showToast('Redone', 'info', 2000);
      return true;
    },
    
    updateUI() {
      // Update menu items or status bar
      const undoBtn = document.getElementById('undoBtn');
      const redoBtn = document.getElementById('redoBtn');
      
      if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
      if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }
  };
  ```
- [ ] Wrap all mutations with undo actions:
  ```javascript
  // Example: Edit task
  function updateTask(taskId, updates) {
    const oldTask = { ...meDataState.tasks.find(t => t.id === taskId) };
    
    // Apply changes
    Object.assign(meDataState.tasks.find(t => t.id === taskId), updates);
    
    // Record for undo
    UndoRedoManager.push({
      description: 'Update task',
      execute: () => {
        Object.assign(meDataState.tasks.find(t => t.id === taskId), updates);
        render();
      },
      inverse: () => {
        Object.assign(meDataState.tasks.find(t => t.id === taskId), oldTask);
        render();
      }
    });
    
    meDebouncedSave();
  }
  ```
- [ ] Add keyboard shortcuts:
  ```javascript
  KeyboardShortcuts.register('ctrl+z', () => UndoRedoManager.undo(), 'Undo');
  KeyboardShortcuts.register('ctrl+y', () => UndoRedoManager.redo(), 'Redo');
  KeyboardShortcuts.register('ctrl+shift+z', () => UndoRedoManager.redo(), 'Redo');
  ```
- [ ] Add UI indicators:
  ```html
  <button id="undoBtn" onclick="UndoRedoManager.undo()" disabled>↶ Undo</button>
  <button id="redoBtn" onclick="UndoRedoManager.redo()" disabled>↷ Redo</button>
  ```
- [ ] Apply to all operations:
  - [ ] Create
  - [ ] Update
  - [ ] Delete
  - [ ] Status changes
  - [ ] Reorder
- [ ] Test: Perform multiple actions, undo in reverse order
- [ ] Verify: Redo works after undo
- [ ] Verify: Stack limited to 20 actions

---

## 3.2 Virtual Scrolling for Large Tables

**Priority**: P2 | **Effort**: 🕐🕐🕐 Large (10 hr)  
**Files**: Large table renders (PFMEA, BOM)

**Implementation Checklist**:
- [ ] Create virtual scroll component:
  ```javascript
  const VirtualTable = {
    rowHeight: 40,
    bufferSize: 5,
    
    render(container, items, renderRowFn) {
      this.container = container;
      this.items = items;
      this.renderRowFn = renderRowFn;
      
      container.style.overflowY = 'auto';
      container.style.height = '600px';
      container.style.position = 'relative';
      
      // Set total height
      const totalHeight = items.length * this.rowHeight;
      container.style.minHeight = totalHeight + 'px';
      
      // Create viewport
      const viewport = document.createElement('div');
      viewport.className = 'virtual-viewport';
      viewport.style.position = 'sticky';
      viewport.style.top = 0;
      viewport.style.background = 'var(--white)';
      
      container.appendChild(viewport);
      
      // Scroll handler
      container.addEventListener('scroll', () => this.update());
      
      this.update();
    },
    
    update() {
      const scrollTop = this.container.scrollTop;
      const viewportHeight = this.container.clientHeight;
      
      const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferSize);
      const endIndex = Math.min(
        this.items.length,
        Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.bufferSize
      );
      
      const visibleItems = this.items.slice(startIndex, endIndex);
      const offsetY = startIndex * this.rowHeight;
      
      const viewport = this.container.querySelector('.virtual-viewport');
      viewport.style.transform = `translateY(${offsetY}px)`;
      
      viewport.innerHTML = visibleItems.map(item => 
        this.renderRowFn(item, startIndex)
      ).join('');
    }
  };
  ```
- [ ] Apply to large tables:
  - [ ] PFMEA (can have 100+ rows)
  - [ ] BOM parts lists
  - [ ] Product lists (if > 50 items)
- [ ] Add loading indicator for initial render
- [ ] Test with 1000+ rows
- [ ] Verify: Smooth scrolling
- [ ] Verify: Memory usage stays low
- [ ] Verify: Only visible rows in DOM

---

## 3.3 Customizable Dashboards

**Priority**: P2 | **Effort**: 🕐🕐🕐 Large (10 hr)  
**Files**: Dashboard portals

**Implementation Checklist**:
- [ ] Make widgets draggable:
  ```javascript
  function makeWidgetDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.style.cursor = 'move';
    
    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
      
      element.style.zIndex = 1000;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      element.style.left = (startLeft + dx) + 'px';
      element.style.top = (startTop + dy) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      element.style.zIndex = '';
      
      // Save position
      saveWidgetLayout();
    });
  }
  ```
- [ ] Add widget hide/show toggle:
  ```javascript
  function toggleWidget(widgetId) {
    const widget = document.getElementById(widgetId);
    if (widget) {
      widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
      saveWidgetLayout();
    }
  }
  ```
- [ ] Save layout to localStorage:
  ```javascript
  function saveWidgetLayout() {
    const layout = {};
    document.querySelectorAll('.widget').forEach(w => {
      layout[w.id] = {
        x: w.offsetLeft,
        y: w.offsetTop,
        visible: w.style.display !== 'none'
      };
    });
    localStorage.setItem('dashboard_layout', JSON.stringify(layout));
  }
  
  function loadWidgetLayout() {
    const saved = localStorage.getItem('dashboard_layout');
    if (!saved) return;
    
    const layout = JSON.parse(saved);
    Object.entries(layout).forEach(([id, config]) => {
      const widget = document.getElementById(id);
      if (widget) {
        widget.style.left = config.x + 'px';
        widget.style.top = config.y + 'px';
        widget.style.display = config.visible ? 'block' : 'none';
      }
    });
  }
  ```
- [ ] Add reset layout button
- [ ] Test: Drag widgets to new positions
- [ ] Verify: Layout persists after refresh
- [ ] Verify: Widgets can be hidden/shown

---

## 3.4 Smart Date Entry (Advanced)

**Priority**: P2 | **Effort**: 🕐 Medium (3 hr)  
**Files**: `utils/js/helpers.js`

**Implementation Checklist**:
- [ ] Extend smart date parser with more patterns:
  ```javascript
  function parseSmartDate(input) {
    const today = new Date();
    const lower = input.toLowerCase().trim();
    
    // Existing patterns...
    
    // End of period
    if (lower === 'eom') { // End of month
      const t = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return formatDateISO(t);
    }
    if (lower === 'eoy') { // End of year
      const t = new Date(today.getFullYear(), 11, 31);
      return formatDateISO(t);
    }
    
    // Specific date formats
    const datePatterns = [
      /^(\d{1,2})\/(\d{1,2})$/, // MM/DD
      /^(\d{1,2})-(\d{1,2})$/, // MM-DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    ];
    
    for (const pattern of datePatterns) {
      const match = lower.match(pattern);
      if (match) {
        // Parse and return date
        // ...
      }
    }
    
    return null;
  }
  ```
- [ ] Add date picker fallback for invalid entries
- [ ] Show suggestion dropdown as user types
- [ ] Test all date patterns
- [ ] Verify: Invalid dates show error

---

## 3.5 Recent Items Dropdown

**Priority**: P2 | **Effort**: 🕐 Small (2 hr)  
**Files**: `index.html`, `utils/js/navigation.js`

**Implementation Checklist**:
- [ ] Add recent items tracker:
  ```javascript
  const RecentItems = {
    key: 'recent_items',
    maxItems: 10,
    
    add(item) {
      const items = this.getAll();
      
      // Remove if already exists
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) items.splice(idx, 1);
      
      // Add to front
      items.unshift({
        ...item,
        timestamp: Date.now()
      });
      
      // Trim
      if (items.length > this.maxItems) {
        items.pop();
      }
      
      localStorage.setItem(this.key, JSON.stringify(items));
    },
    
    getAll() {
      try {
        return JSON.parse(localStorage.getItem(this.key)) || [];
      } catch {
        return [];
      }
    },
    
    render() {
      const items = this.getAll();
      return items.map(item => `
        <a href="#p=${item.id}&s=${item.section}" class="recent-item">
          ${item.icon} ${item.name}
        </a>
      `).join('');
    }
  };
  ```
- [ ] Add dropdown to topbar:
  ```html
  <div class="dropdown">
    <button onclick="toggleRecentDropdown()">🕐 Recent</button>
    <div id="recentDropdown" class="dropdown-content"></div>
  </div>
  ```
- [ ] Call `RecentItems.add()` when opening projects
- [ ] Test: Open multiple projects
- [ ] Verify: Recent dropdown shows last 10
- [ ] Verify: Clicking navigates correctly

---

## 3.6 Dark Mode

**Priority**: P3 | **Effort**: 🕐🕐🕐 Large (8 hr)  
**Files**: All CSS files

**Implementation Checklist**:
- [ ] Create dark theme CSS variables:
  ```css
  :root[data-theme="dark"] {
    --bg: #1a1a2e;
    --white: #16213e;
    --line: #0f3460;
    --ink: #eaeaea;
    --muted: #a0a0a0;
    --blue: #4da8da;
    --green: #5dd66d;
    --red: #e74c3c;
    --amber: #f39c12;
  }
  ```
- [ ] Add theme toggle:
  ```html
  <button onclick="toggleTheme()" title="Toggle dark mode">🌓</button>
  ```
- [ ] Add JavaScript:
  ```javascript
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
  
  function loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }
  ```
- [ ] Test all pages in dark mode
- [ ] Verify: All text readable
- [ ] Verify: Icons visible
- [ ] Verify: Charts readable

---

## 3.7 Accessibility Audit

**Priority**: P3 | **Effort**: 🕐🕐🕐 Large (10 hr)  
**Files**: All interactive elements

**Implementation Checklist**:
- [ ] Add ARIA labels to all buttons
- [ ] Ensure all images have alt text
- [ ] Add skip links for keyboard users
- [ ] Ensure focus indicators visible
- [ ] Test with screen reader
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add `aria-live` regions for dynamic content
- [ ] Ensure all forms have labels
- [ ] Test keyboard navigation throughout
- [ ] Fix any focus traps in modals

---

## 3.8 Onboarding Tour

**Priority**: P3 | **Effort**: 🕐🕐 Medium (6 hr)  
**Files**: `utils/js/helpers.js`

**Implementation Checklist**:
- [ ] Create tour guide system:
  ```javascript
  const OnboardingTour = {
    steps: [
      {
        target: '.topbar',
        title: 'Navigation',
        content: 'Use the top bar to navigate between portals'
      },
      {
        target: '.search-input',
        title: 'Search',
        content: 'Search for projects, products, or batches'
      },
      // More steps...
    ],
    
    start() {
      this.currentStep = 0;
      this.showStep();
    },
    
    showStep() {
      const step = this.steps[this.currentStep];
      const target = document.querySelector(step.target);
      
      // Create highlight overlay
      // Show tooltip with content
      // Add next/prev buttons
    },
    
    next() {
      this.currentStep++;
      if (this.currentStep < this.steps.length) {
        this.showStep();
      } else {
        this.end();
      }
    }
  };
  ```
- [ ] Show tour on first login
- [ ] Add "Take tour" button in help menu
- [ ] Test tour flow
- [ ] Verify: Highlights correct elements

---

## 3.9 Performance Optimization

**Priority**: P3 | **Effort**: 🕐🕐🕐 Large (10 hr)  
**Files**: All render functions

**Implementation Checklist**:
- [ ] Profile slow renders with DevTools
- [ ] Implement memoization for expensive calculations
- [ ] Debounce scroll events
- [ ] Lazy load off-screen images
- [ ] Use document fragments for batch DOM updates
- [ ] Minimize reflows by batching style changes
- [ ] Add performance monitoring
- [ ] Set performance budgets
- [ ] Test on low-end devices

---

## 3.10 Data Validation (Advanced)

**Priority**: P3 | **Effort**: 🕐 Medium (4 hr)  
**Files**: All form inputs

**Implementation Checklist**:
- [ ] Add real-time validation feedback
- [ ] Show character counts for text fields
- [ ] Validate email format
- [ ] Validate number ranges
- [ ] Show validation summary before save
- [ ] Prevent save with invalid data
- [ ] Highlight invalid fields

---

## 3.11 Responsive Design Audit

**Priority**: P3 | **Effort**: 🕐🕐🕐 Large (8 hr)  
**Files**: All CSS files

**Implementation Checklist**:
- [ ] Test all portals on mobile (375px)
- [ ] Test all portals on tablet (768px)
- [ ] Add responsive breakpoints where missing
- [ ] Ensure touch targets are large enough
- [ ] Test horizontal scrolling for wide tables
- [ ] Verify modals work on small screens
- [ ] Add responsive navigation for mobile

---

## 3.12 Help Documentation

**Priority**: P3 | **Effort**: 🕐 Medium (4 hr)  
**Files**: New help portal or modal

**Implementation Checklist**:
- [ ] Create searchable help documentation
- [ ] Add video tutorials for key features
- [ ] Create FAQ section
- [ ] Add contextual help links throughout
- [ ] Create troubleshooting guide
- [ ] Add keyboard shortcuts reference

---

# Phase 4: Polish & Maintenance (Month 3+)

**Goal**: Long-term maintainability and polish  
**Total Items**: 11  
**Estimated Time**: 40-60 hours

---

## 4.1 Code Consistency Audit

**Priority**: P2 | **Effort**: 🕐🕐 Medium (6 hr)  
**Files**: All JavaScript files

**Implementation Checklist**:
- [ ] Standardize event handling patterns
- [ ] Remove inline event handlers
- [ ] Consistent naming conventions
- [ ] Document all public functions
- [ ] Add JSDoc comments
- [ ] Remove dead code
- [ ] Consolidate duplicate functions

---

## 4.2 Error Boundary Implementation

**Priority**: P2 | **Effort**: 🕐 Medium (4 hr)  
**Files**: All render functions

**Implementation Checklist**:
- [ ] Wrap renders in try-catch
- [ ] Show friendly error messages
- [ ] Log errors for debugging
- [ ] Provide recovery options
- [ ] Prevent cascading failures

---

## 4.3 Automated Testing Expansion

**Priority**: P2 | **Effort**: 🕐🕐 Large (8 hr)  
**Files**: `tests/` directory

**Implementation Checklist**:
- [ ] Add tests for new QoL features
- [ ] Increase coverage to 80%
- [ ] Add integration tests
- [ ] Add E2E tests for critical paths
- [ ] Set up CI/CD pipeline

---

## 4.4 Monitoring & Analytics

**Priority**: P3 | **Effort**: 🕐 Medium (4 hr)  
**Files**: `core/js/app.js`

**Implementation Checklist**:
- [ ] Add error tracking (e.g., Sentry)
- [ ] Track feature usage
- [ ] Monitor performance metrics
- [ ] Set up alerts for issues
- [ ] Create usage dashboard

---

## 4.5 Documentation Updates

**Priority**: P3 | **Effort**: 🕐 Small (2 hr)  
**Files**: `README.md`, `CLAUDE.md`

**Implementation Checklist**:
- [ ] Update with new features
- [ ] Add QoL features to documentation
- [ ] Update architecture diagrams
- [ ] Add troubleshooting section
- [ ] Create contributor guide

---

## 4.6 Dependency Updates

**Priority**: P3 | **Effort**: 🕐 Small (2 hr)  
**Files**: `package.json`

**Implementation Checklist**:
- [ ] Update npm dependencies
- [ ] Update CDN libraries
- [ ] Test for breaking changes
- [ ] Update lock files
- [ ] Document update process

---

## 4.7 Security Audit

**Priority**: P2 | **Effort**: 🕐🕐 Medium (6 hr)  
**Files**: All files

**Implementation Checklist**:
- [ ] Review all user inputs
- [ ] Ensure XSS prevention
- [ ] Check CSRF protection
- [ ] Audit authentication flow
- [ ] Review RLS policies
- [ ] Check for sensitive data exposure

---

## 4.8 Backup & Recovery

**Priority**: P2 | **Effort**: 🕐 Medium (4 hr)  
**Files**: `core/js/db.js`

**Implementation Checklist**:
- [ ] Implement auto-backup to localStorage
- [ ] Add backup scheduling
- [ ] Create restore functionality
- [ ] Test backup/restore cycle
- [ ] Document backup procedure

---

## 4.9 Migration Scripts

**Priority**: P3 | **Effort**: 🕐 Medium (4 hr)  
**Files**: New `migrations/` directory

**Implementation Checklist**:
- [ ] Create migration framework
- [ ] Write migrations for schema changes
- [ ] Add rollback capability
- [ ] Test migrations
- [ ] Document migration process

---

## 4.10 Performance Budget

**Priority**: P3 | **Effort**: 🕐 Small (2 hr)  
**Files**: `package.json`, CI config

**Implementation Checklist**:
- [ ] Set bundle size limits
- [ ] Set performance budgets
- [ ] Add budget checks to CI
- [ ] Monitor budgets over time
- [ ] Alert on budget violations

---

## 4.11 User Feedback System

**Priority**: P3 | **Effort**: 🕐 Medium (4 hr)  
**Files**: New feedback component

**Implementation Checklist**:
- [ ] Add feedback button
- [ ] Create feedback form
- [ ] Integrate with bug tracking
- [ ] Acknowledge submissions
- [ ] Track feedback resolution

---

# Completion Tracking

## Phase 1: Quick Wins
- [ ] 1.1 Auto-Focus First Input in Modals
- [ ] 1.2 Add Save Indicators
- [ ] 1.3 Replace alert() with Toast Notifications
- [ ] 1.4 Enhance Empty States with Actions
- [ ] 1.5 Dynamic "Return to Portal" Button Text
- [ ] 1.6 Quick-Add Pattern for Sequential Entry
- [ ] 1.7 Persist Search and Filter State
- [ ] 1.8 Add Tooltips to Icon-Only Buttons
- [ ] 1.9 Individual Filter Clear Buttons
- [ ] 1.10 Keyboard Shortcuts Help Modal
- [ ] 1.11 Smart Date Entry Helper
- [ ] 1.12 Improve Loading States

## Phase 2: Core UX
- [ ] 2.1 Global Keyboard Shortcuts
- [ ] 2.2 Bulk Operations with Multi-Select
- [ ] 2.3 Context Menus (Right-Click)
- [ ] 2.4 Advanced Filtering Panel
- [ ] 2.5 Breadcrumb Navigation
- [ ] 2.6 Undo After Delete (Soft Delete)
- [ ] 2.7 Column Resize with Persistence
- [ ] 2.8 Density Toggle (Compact/Comfortable)
- [ ] 2.9 Export/Import Feature
- [ ] 2.10 Print Styles
- [ ] 2.11 Real-Time Granular Updates
- [ ] 2.12 Quick View/Preview on Hover

## Phase 3: Advanced Features
- [ ] 3.1 Undo/Redo System
- [ ] 3.2 Virtual Scrolling for Large Tables
- [ ] 3.3 Customizable Dashboards
- [ ] 3.4 Smart Date Entry (Advanced)
- [ ] 3.5 Recent Items Dropdown
- [ ] 3.6 Dark Mode
- [ ] 3.7 Accessibility Audit
- [ ] 3.8 Onboarding Tour
- [ ] 3.9 Performance Optimization
- [ ] 3.10 Data Validation (Advanced)
- [ ] 3.11 Responsive Design Audit
- [ ] 3.12 Help Documentation

## Phase 4: Polish & Maintenance
- [ ] 4.1 Code Consistency Audit
- [ ] 4.2 Error Boundary Implementation
- [ ] 4.3 Automated Testing Expansion
- [ ] 4.4 Monitoring & Analytics
- [ ] 4.5 Documentation Updates
- [ ] 4.6 Dependency Updates
- [ ] 4.7 Security Audit
- [ ] 4.8 Backup & Recovery
- [ ] 4.9 Migration Scripts
- [ ] 4.10 Performance Budget
- [ ] 4.11 User Feedback System

---

## Progress Summary

| Phase | Total | Complete | In Progress | Pending |
|-------|-------|----------|-------------|---------|
| Phase 1 | 12 | 0 | 0 | 12 |
| Phase 2 | 12 | 12 | 0 | 0 |
| Phase 3 | 12 | 0 | 0 | 12 |
| Phase 4 | 11 | 0 | 0 | 11 |
| **Total** | **47** | **12** | **0** | **35** |

---

**Last Updated**: 2026-03-14  
**Version**: 1.0
