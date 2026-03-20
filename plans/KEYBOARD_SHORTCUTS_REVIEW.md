# Keyboard Shortcuts Review & Improvement Plan

**Date:** 2026-03-16
**Status: 📋 PENDING — Analysis complete, implementation not yet started**
**Scope:** Global and portal-specific keyboard shortcuts in Tidyco APQP

---

## Executive Summary

The application has a **basic foundation** for keyboard shortcuts with good accessibility patterns in specific portals, but lacks consistency, discoverability, and several advertised features. The shortcuts modal claims functionality that doesn't exist in the codebase.

---

## 1. Current Implementation Status

### ✅ What Works Well

#### 1.1 Global Shortcuts
| Shortcut | Status | Location | Notes |
|----------|--------|----------|-------|
| `?` | ✅ Working | `utils/js/helpers.js:94-99` | Opens shortcuts modal when not in input |
| `Ctrl+/` | ✅ Working | `utils/js/helpers.js:94-99` | Opens shortcuts modal |
| `Backspace` | ✅ Working | `utils/js/navigation.js:433-448` | Browser back navigation when not in editable field |

#### 1.2 Portal-Specific Shortcuts

**Production Portal - Products** (`portals/production/js/products.js`)
| Shortcut | Context | Status | Notes |
|----------|---------|--------|-------|
| `Tab` | New row fields | ✅ Working | Navigates between fields in new product row |
| `Shift+Tab` | New row fields | ✅ Working | Reverse navigation |
| `Ctrl+Enter` | New row | ✅ Working | Saves new product |
| `Tab` | Edit row cells | ✅ Working | Navigates between edit cells |

**Production Portal - Scheduling** (`portals/production/js/scheduling.js`)
| Shortcut | Context | Status | Notes |
|----------|---------|--------|-------|
| `Tab` | New batch fields | ✅ Working | Navigates between batch fields |
| `Ctrl+Enter` | New batch | ✅ Working | Saves new batch |
| `Tab` | Edit cells | ✅ Working | Cell-to-cell navigation |

**Capacity Portal** (`portals/capacity/js/prod-capacity-settings.js`)
| Shortcut | Context | Status | Notes |
|----------|---------|--------|-------|
| `Tab` | Capacity cells | ✅ Working | Horizontal navigation between months |
| `ArrowUp/Down` | Capacity cells | ✅ Working | Vertical navigation between work areas |
| `Enter` | Capacity cells | ✅ Working | Moves to next work area |

**Operations Dashboard** (`portals/operations/js/operations-dashboard-forecast-actions.js`)
| Shortcut | Context | Status | Notes |
|----------|---------|--------|-------|
| `Enter` | Inline edit | ✅ Working | Saves inline edit |
| `Escape` | Inline edit | ✅ Working | Cancels inline edit |

**Product Development** (`portals/product-development/js/product-development.js`)
| Shortcut | Context | Status | Notes |
|----------|---------|--------|-------|
| `Enter` | Family edit | ✅ Working | Saves family inline edit |
| `Escape` | Family edit | ✅ Working | Cancels edit |

---

### ❌ What Doesn't Work / Issues

#### 2.1 Advertised But Not Implemented

| Shortcut | Claimed In | Actual Status | Issue |
|----------|------------|---------------|-------|
| `Ctrl+S` | `index.html:110` | ❌ **NOT IMPLEMENTED** | No global save handler exists |
| `Ctrl+F` | `index.html:111` | ❌ **NOT IMPLEMENTED** | No search focus handler |
| `Enter` | `index.html:113` | ⚠️ **Inconsistent** | Only works in specific contexts, not global |
| `Escape` | `index.html:114` | ⚠️ **Partial** | Works in some modals/inline edits, not global |

#### 2.2 Implementation Issues

1. **Inline Event Handlers** (`portals/operations/js/operations-dashboard-forecast-view.js`)
   - Uses `onkeydown="opsForecastInlineKeydown(...)"` directly in HTML
   - Violates unobtrusive JavaScript principles
   - Makes testing and maintenance harder
   - **Should use:** `addEventListener` pattern like other portals

2. **No Centralized Management**
   - Shortcuts scattered across multiple files
   - No single source of truth
   - No way to discover what's active in current view
   - Difficult to add/modify shortcuts consistently

3. **No Visual Feedback**
   - No indication when shortcuts are available
   - No tooltip hints on interactive elements
   - Users must memorize or check modal

4. **Inconsistent Patterns**
   - Production portal uses `data-action` and `data-keydown` attributes (good)
   - Operations portal uses inline handlers (bad)
   - Capacity portal uses `data-cap-action` (different pattern)

5. **Missing Conflict Prevention**
   - No mechanism to prevent shortcuts from firing in wrong context
   - `isInputFocused()` helper exists but isn't used consistently
   - Could interfere with browser shortcuts or text editing

---

### 🎯 What Can Be Added

#### 3.1 High Priority

1. **Implement Advertised Shortcuts**
   ```javascript
   // Global Ctrl+S - save current work
   document.addEventListener('keydown', (e) => {
     if ((e.ctrlKey || e.metaKey) && e.key === 's') {
       e.preventDefault();
       // Dispatch custom save event or call context-aware save
       document.dispatchEvent(new CustomEvent('app:save'));
     }
   });

   // Global Ctrl+F - focus search
   document.addEventListener('keydown', (e) => {
     if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
       e.preventDefault();
       const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
       searchInput?.focus();
     }
   });
   ```

2. **Fix Inline Event Handlers**
   - Refactor `operations-dashboard-forecast-view.js` to use `addEventListener`
   - Follow pattern from `production/products.js`

3. **Add Escape Key Global Handler**
   ```javascript
   // Close modals, cancel edits, clear selections
   document.addEventListener('keydown', (e) => {
     if (e.key === 'Escape' && !isInputFocused()) {
       // Close any open modal
       const openModal = document.querySelector('.modal-bg[style*="display: block"]');
       if (openModal) {
         closeModal(openModal.id);
         return;
       }
       // Blur active element if in input
       if (document.activeElement && document.activeElement !== document.body) {
         document.activeElement.blur();
       }
     }
   });
   ```

#### 3.2 Medium Priority

4. **Context-Aware Shortcut System**
   ```javascript
   // Centralized shortcut registry
   const ShortcutManager = {
     shortcuts: new Map(),
     
     register(context, key, handler, options = {}) {
       // Store with context (e.g., 'production', 'capacity', 'global')
     },
     
     unregister(context, key) {
       // Remove specific shortcut
     },
     
     enableContext(context) {
       // Activate shortcuts for current view
     }
   };
   ```

5. **Visual Hints / Tooltips**
   - Add `title` attributes with shortcut hints
   - Optional overlay showing available shortcuts
   - Highlight shortcut keys in UI (e.g., "Save [Ctrl+S]")

6. **Accessibility Improvements**
   - Add `aria-keyshortcuts` attributes to buttons
   - Ensure all shortcuts work with screen readers
   - Add skip links for major sections

#### 3.3 Nice to Have

7. **Customizable Shortcuts**
   - Let users remap shortcuts in settings
   - Store preferences in localStorage
   - Import/export shortcut configurations

8. **Advanced Navigation**
   - `Alt+1`, `Alt+2`, etc. - Jump to specific portals
   - `g then p` - Go to projects (Git-style)
   - `/` - Quick search/command palette

9. **Bulk Operations**
   - `Ctrl+A` - Select all in current list
   - `Ctrl+Shift+Up/Down` - Multi-select
   - Spacebar - Toggle selection in lists

---

## 2. Recommended Architecture

### Proposed File Structure
```
utils/js/
  shortcuts.js          # Central shortcut manager
  shortcuts-global.js   # Global shortcuts (Ctrl+S, Ctrl+F, etc.)
  shortcuts-context.js  # Context-aware shortcuts registry
```

### Implementation Pattern
```javascript
// utils/js/shortcuts.js
export const ShortcutManager = {
  activeContext: 'global',
  contexts: new Map(),
  
  register(context, key, handler, options = {}) {
    if (!this.contexts.has(context)) {
      this.contexts.set(context, []);
    }
    this.contexts.get(context).push({ key, handler, options });
  },
  
  setContext(context) {
    this.activeContext = context;
  },
  
  handleEvent(e) {
    // Check global shortcuts first
    // Then context-specific shortcuts
    // Respect isInputFocused() checks
  }
};

// Initialize global shortcuts
ShortcutManager.register('global', 'Ctrl+S', handleGlobalSave);
ShortcutManager.register('global', 'Ctrl+F', handleSearchFocus);
ShortcutManager.register('global', '?', showShortcutsModal);

// Portal-specific registration
// In each portal's init function:
ShortcutManager.setContext('production');
ShortcutManager.register('production', 'Ctrl+Enter', saveCurrentRow);
```

---

## 3. Action Plan

### Phase 1: Fix Broken Promises (1-2 days)
- [ ] Implement `Ctrl+S` global save
- [ ] Implement `Ctrl+F` search focus
- [ ] Add global `Escape` handler
- [ ] Update shortcuts modal with accurate info

### Phase 2: Refactor & Standardize (2-3 days)
- [ ] Remove inline `onkeydown` handlers from operations dashboard
- [ ] Create centralized `ShortcutManager`
- [ ] Migrate all portals to use consistent pattern
- [ ] Add comprehensive tests

### Phase 3: Enhance UX (2-3 days)
- [ ] Add visual hints/tooltips
- [ ] Implement `aria-keyshortcuts` attributes
- [ ] Add context indicator in UI
- [ ] Create shortcut discovery overlay

### Phase 4: Advanced Features (optional)
- [ ] Customizable shortcuts
- [ ] Command palette (`Ctrl+K` or `Cmd+K`)
- [ ] Advanced selection shortcuts
- [ ] Portal jump shortcuts

---

## 4. Testing Recommendations

Current test coverage is **good** for navigation shortcuts but needs expansion:

```javascript
// Add tests for:
- Global Ctrl+S triggers save in each portal
- Ctrl+F focuses search when available
- Escape closes modals and cancels edits
- Shortcuts don't fire in input fields (unless intended)
- Context-specific shortcuts only work in correct portal
- No conflicts with browser shortcuts
```

---

## 5. Summary Table

| Category | Count | Status |
|----------|-------|--------|
| Working as advertised | 10+ | ✅ Good |
| Advertised but broken | 4 | ❌ Needs fix |
| Inconsistent implementation | 3 | ⚠️ Refactor needed |
| Recommended additions | 15+ | 🎯 Roadmap |

---

## Conclusion

The keyboard shortcut system has **solid foundations** with good patterns in the production and capacity portals. However, there's a **credibility gap** between what's advertised in the shortcuts modal and what's actually implemented.

**Priority focus:**
1. Implement the missing advertised shortcuts (Ctrl+S, Ctrl+F)
2. Remove inline event handlers
3. Create centralized management system
4. Add visual discoverability

This will transform keyboard shortcuts from a "nice to have" into a **genuine productivity feature** that power users can rely on.
