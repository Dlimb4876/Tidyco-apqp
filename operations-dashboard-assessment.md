# Operations Dashboard Code Assessment Report

**Date:** March 30, 2026  
**Scope:** Full codebase review of `portals/operations/`  
**Objective:** Identify dead code, security risks, AI-generated patterns, and quality issues

---

## Executive Summary

The Operations Dashboard codebase is **well-maintained overall** with good security practices and comprehensive test coverage (875 lines across 3 test files).  
No currently reviewed path shows a **confirmed exploitable vulnerability**, but there are important **security hardening opportunities** and several medium/low maintainability concerns.

**Overall Grade: B+** - Solid architecture with practical hardening and maintainability work recommended.

---

## Severity Legend

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| 🔴 CRITICAL | Confirmed exploitable vulnerability in user path | Fix immediately |
| 🟠 HIGH | High-impact bug/risk likely to affect users soon | Fix this week |
| 🟡 MEDIUM | Maintainability or code quality issue | Fix this sprint |
| 🟢 LOW | Cleanup or minor improvement | Address when convenient |

---

## 🔴 CRITICAL Issues

No confirmed critical issues were validated in the reviewed runtime paths.

---

## 🟠 HIGH Issues

No high-impact user-path failures were validated in this pass.

---

## 🟡 MEDIUM Issues

### 1. `innerHTML` Assignment in Tab Refresh Path (Security Hardening)
**Location:** `portals/operations/js/operations-dashboard-realtime.js:78`

```javascript
// Line 78
tabBody.innerHTML = body;
```

**Risk Assessment:**
- In current code, rendered values are escaped via `esc()`, so this is **not a confirmed exploit by itself**
- It is still a **defense-in-depth gap**: one future missed escape in render functions can create an XSS path
- Real risk is forward-looking regressions, not a proven active breach in this snapshot

**Recommendation:**
```javascript
// Option 1: Add defense-in-depth sanitization
import DOMPurify from 'dompurify';
tabBody.innerHTML = DOMPurify.sanitize(body);

// Option 2: Use insertAdjacentHTML with caution
// Option 3: Refactor to use DOM construction methods
```

**Testing Impact:** Medium - regression test all tab views and escaping-sensitive fields

---

### 2. `document.write()` in Popup Generation (Legacy API Hardening)
**Location:** `portals/operations/js/operations-infographic.js:343`

```javascript
// Line 343
win.document.write(html);
```

**Risk Assessment:**
- Current popup HTML path appears to use escaped/interpolated values, so this is **not a confirmed exploit in isolation**
- `document.write()` is still a legacy pattern that increases fragility and future security risk if escaping regresses
- Popup blocking remains a UX reliability concern

**Recommendation:**
```javascript
// Use DOM construction instead
const doc = win.document;
doc.open();
doc.write(html); // Transitional step
doc.close();
// Preferred end-state: build DOM nodes directly and avoid string HTML APIs.
```

**Testing Impact:** Low - test popup rendering and blocked-popup fallback behavior

### 3. Duplicate Threshold Logic Pattern
**Locations:** Multiple files (6+ instances)

**Affected Files:**
- `operations-dashboard-metrics.js:82-85`
- `operations-infographic.js:18-22`
- `operations-dashboard-render-core.js:29-31`
- `operations-dashboard-render-core.js:63`

**Examples:**
```javascript
// File A: metrics.js
function opsStatusTone(value) {
  if (value >= 85) return 'good';
  if (value >= 65) return 'watch';
  return 'critical';
}

// File B: infographic.js
function opsInfographicTone(utilisation, ready) {
  if (!ready) return 'watch';
  if (utilisation > 90) return 'critical';
  if (utilisation > 80) return 'watch';
  return 'good';
}

// File C: render-core.js (inline)
const meTone = !metrics.me.ready ? 'watch' : metrics.me.utilisation > 90 ? 'critical' : 
               metrics.me.utilisation > 80 ? 'watch' : 'good';
```

**Risk Assessment:**
- **Maintenance burden:** Changing thresholds requires updates in multiple places
- **Inconsistency:** Different thresholds (85% vs 80% vs 90%) create confusing UX
- **Error-prone:** Easy to miss one instance when updating

**Recommendation:**
```javascript
// Create a shared constants file: utils/js/status-thresholds.js
export const STATUS_THRESHOLDS = {
  GOOD: { min: 85 },
  WATCH: { min: 65, max: 84 },
  CRITICAL: { max: 64 }
};

export const UTILIZATION_THRESHOLDS = {
  CRITICAL: 90,
  WATCH: 80,
  GOOD: 0
};

// Single source of truth function
export function getStatusTone(value, type = 'default') {
  const thresholds = type === 'utilization' ? UTILIZATION_THRESHOLDS : STATUS_THRESHOLDS;
  // ... logic
}
```

---

### 4. Heavy Global State Dependencies
**Locations:** 15+ instances across all files

**Examples:**
```javascript
// operations-dashboard-metrics.js:105
const products = globalThis.productsState?.products;

// operations-dashboard-realtime.js:93
const batches = globalThis.prodState?.batches;

// operations-dashboard-metrics.js:77
const meData = globalThis.meDataState;
```

**Risk Assessment:**
- **Testing difficulty:** Functions with hidden global dependencies are harder to test
- **Coupling:** Creates tight coupling between unrelated modules
- **No visibility:** Dependencies aren't visible in function signatures
- **Side effects:** Functions can have unpredictable behavior based on global state

**Recommendation:**
```javascript
// Instead of:
function opsBuildMetrics() {
  const products = globalThis.productsState?.products;
  // ...
}

// Use dependency injection:
function opsBuildMetrics(dependencies = {}) {
  const products = dependencies.products || globalThis.productsState?.products || [];
  // ...
}

// Or use a state management pattern with explicit selectors
```

---

### 5. Console Warnings in Production Code
**Locations:** 6 instances

**Files Affected:**
- `operations-dashboard-realtime.js:43, 231`
- `operations-forecast-data.js:170, 178`
- `operations-dashboard-forecast-view.js:329`
- `operations-infographic.js:343`

**Examples:**
```javascript
console.warn('Operations refresh failed for', key, err);
console.warn('Could not destroy operations forecast chart:', err);
console.warn('Could not read local forecast fallback:', err);
```

**Risk Assessment:**
- **Information leakage:** Error details exposed in console
- **Performance:** Console I/O can impact performance in production
- **Clutter:** Makes debugging harder with noise

**Recommendation:**
```javascript
// Create a logging utility that respects environment
const isDev = process.env.NODE_ENV === 'development' || 
              window.location.hostname === 'localhost';

export function logWarning(message, ...args) {
  if (isDev) {
    console.warn(message, ...args);
  }
  // Always send to error tracking service in production
  // errorTracker.warn(message, args);
}
```

---

### 6. Tab Switch Logic Using If-Else Chains
**Locations:** 
- `operations-dashboard-main.js:177-182`
- `operations-dashboard-realtime.js:69-74`

**Example:**
```javascript
if (tab === 'flow') body = opsRenderFlowView(metrics);
else if (tab === 'risk') body = opsRenderRiskView(metrics);
else if (tab === 'people') body = opsRenderPeopleView(metrics);
else if (tab === 'actions') body = opsRenderActionsView(metrics);
else if (tab === 'forecast') body = opsRenderForecastView(metrics);
else body = opsRenderOverview(metrics);
```

**Risk Assessment:**
- **Extensibility:** Adding new tabs requires modifying multiple functions
- **Maintainability:** Logic scattered across files
- **Error-prone:** Easy to miss a case

**Recommendation:**
```javascript
// Single source of truth for tab routing
const TAB_RENDERERS = {
  flow: opsRenderFlowView,
  risk: opsRenderRiskView,
  people: opsRenderPeopleView,
  actions: opsRenderActionsView,
  forecast: opsRenderForecastView,
  overview: opsRenderOverview
};

function getTabRenderer(tab) {
  return TAB_RENDERERS[tab] || TAB_RENDERERS.overview;
}

// Usage:
const body = getTabRenderer(tab)(metrics);
```

---

## 🟢 LOW Issues (AI Slop & Code Quality)

### 7. Test-Anchored Utility (`opsInfographicBar`)
**Location:** `operations-infographic.js:8-16`

```javascript
// ── Kept for test compatibility ──────────────────────────────────────────────
function opsInfographicBar(pct, tone) {
  const capped = Math.min(100, Math.max(0, pct));
  const color = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#b67700' : '#1f8f65';
  return `<div style="...">...</div>`;
}
```

**Analysis:**
- Comment claims it's "kept for test compatibility"
- It **is referenced by tests** (`operations-infographic.test.js`) but not by current user-facing runtime flow
- This makes it **test-anchored code**, not clearly product-essential behavior

**Recommendation:** Make an explicit choice:
1. Keep it as a documented public helper contract, or  
2. Remove helper + dependent tests together.

---

### 8. Unused Exports
**Locations:** Multiple files

**Affected:**
- `operations-dashboard-state.js:21-27` - `opsForecastDomKey`, `opsForecastInlineFieldId`
- `operations-dashboard-render-core.js` - Many internal helpers exported unnecessarily
- `operations-infographic.js:347-357` - All functions exported (many internal)

**Recommendation:** 
- Only export functions that are actually used externally
- Use `/* internal */` comments for private functions
- Consider using module pattern for truly private functions

---

### 9. Decorative Comment Lines (AI Pattern)
**Location:** All files

**Examples:**
```javascript
// ═══════════════════════════════════
// operations-dashboard-main.js — entrypoint and exports
// ═══════════════════════════════════

// ── Kept for test compatibility ──────────────────────────────────────────────

// ── Visual helpers ────────────────────────────────────────────────────────────

// ── Main generator ────────────────────────────────────────────────────────────
```

**Analysis:**
- These decorative ASCII lines are characteristic of AI-generated code
- They add visual noise without functional value
- "AI Slop" indicator

**Recommendation:** Replace with simple, concise comments:
```javascript
// Entry point and exports
// Test compatibility exports
// Visual helper functions
// Main infographic generator
```

---

### 10. Magic Numbers
**Locations:** 20+ instances

**Examples:**
```javascript
// operations-dashboard-metrics.js:207
const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

// operations-dashboard-metrics.js:177, 190
if (score >= 12) highRisks += 1;
if (rpn >= 100) highRpn += 1;

// operations-dashboard-render-core.js:29
const meTone = !metrics.me.ready ? 'watch' : 
               metrics.me.utilisation > 90 ? 'critical' : 
               metrics.me.utilisation > 80 ? 'watch' : 'good';
```

**Recommendation:**
```javascript
// utils/js/constants.js
export const CONSTANTS = {
  DAYS: {
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000
  },
  RISK: {
    HIGH_SCORE_THRESHOLD: 12,
    HIGH_RPN_THRESHOLD: 100
  },
  UTILIZATION: {
    CRITICAL: 90,
    WARNING: 80
  }
};
```

---

### 11. Function Length
**Locations:** 
- `operations-dashboard-metrics.js` - `opsCalcForecastProduction` (~80 lines)
- `operations-dashboard-metrics.js` - `opsBuildMetrics` (~50 lines)
- `operations-dashboard-render-core.js` - `opsRenderOverview` (~40 lines)

**Recommendation:** Break into smaller, single-responsibility functions following the Single Responsibility Principle.

---

### 12. Inconsistent Error Handling Patterns
**Locations:** Multiple files

**Example inconsistencies:**
```javascript
// Some places throw:
if (error) throw error;

// Some places return null:
if (error) return null;

// Some places set state and continue:
if (error) {
  this.state.lastError = error.message;
  this._loadFallbackRows();
}
```

**Recommendation:** Standardize error handling strategy across the codebase.

---

## Positive Findings

### ✅ Security Best Practices
1. **Comprehensive escaping** - All user data rendered via `esc()` helper
2. **No direct SQL** - Uses Supabase client with RLS policies
3. **Permission checks** - `canEdit()` and `hasPermission()` used consistently
4. **No eval/Function** - No dangerous dynamic code execution

### ✅ Architecture
1. **Clean separation** - State, metrics, rendering, and actions properly isolated
2. **ESM modules** - Correct use of ES6 imports/exports
3. **Naming conventions** - Descriptive camelCase throughout
4. **Mobile-first CSS** - Proper breakpoints at 767px/768px

### ✅ Testing
1. **Comprehensive coverage** - 875 lines of tests
2. **Good scenarios** - Happy and error paths covered
3. **Proper mocking** - Supabase and global dependencies mocked correctly

### ✅ Error Handling
1. **Try-catch blocks** - Async errors properly caught
2. **Graceful fallbacks** - Local mode when remote fails
3. **User feedback** - Toast notifications for validation errors

---

## File-by-File Breakdown

| File | Lines | Issues | Grade |
|------|-------|--------|-------|
| `operations-dashboard-main.js` | 262 | 2 Medium | B+ |
| `operations-dashboard-realtime.js` | 243 | 3 Medium | B |
| `operations-dashboard-forecast-view.js` | 422 | 1 Medium, 2 Low | B |
| `operations-dashboard-metrics.js` | 515 | 3 Medium, 3 Low | B |
| `operations-dashboard-render-core.js` | 380 | 3 Medium, 2 Low | B |
| `operations-dashboard-state.js` | 31 | 1 Low | A |
| `operations-dashboard-forecast-actions.js` | 232 | 1 Low | A- |
| `operations-forecast-data.js` | 336 | 2 Medium | B |
| `operations-infographic.js` | 357 | 1 Medium, 3 Low | B |

---

## Recommendations Summary

### Immediate (This Week)
1. 🟡 Add defense-in-depth protection around tab `innerHTML` rendering path
2. 🟡 Replace legacy popup HTML write pattern with safer DOM rendering approach

### Short-term (This Sprint)
3. 🟡 Centralize threshold constants
4. 🟡 Remove or wrap console warnings
5. 🟡 Refactor tab switching to use lookup map
6. 🟡 Reduce global state dependencies

### Long-term (Next Quarter)
7. 🟢 Decide contract for test-anchored utility (`opsInfographicBar`)
8. 🟢 Clean up unused exports
9. 🟢 Standardize comment style
10. 🟢 Extract magic numbers to constants
11. 🟢 Refactor long functions
12. 🟢 Standardize error handling

---

## Appendix: Code Examples

### Recommended Refactor: Tab Switching

**Before:**
```javascript
// operations-dashboard-main.js:177-182
let body = '';
if (tab === 'flow') body = opsRenderFlowView(metrics);
else if (tab === 'risk') body = opsRenderRiskView(metrics);
else if (tab === 'people') body = opsRenderPeopleView(metrics);
else if (tab === 'actions') body = opsRenderActionsView(metrics);
else if (tab === 'forecast') body = opsRenderForecastView(metrics);
else body = opsRenderOverview(metrics);
```

**After:**
```javascript
// config/tabs.js
export const OPERATIONS_TABS = {
  overview: { renderer: opsRenderOverview, label: 'Overview' },
  flow: { renderer: opsRenderFlowView, label: 'Flow' },
  risk: { renderer: opsRenderRiskView, label: 'Risk' },
  people: { renderer: opsRenderPeopleView, label: 'People' },
  actions: { renderer: opsRenderActionsView, label: 'Actions' },
  forecast: { renderer: opsRenderForecastView, label: 'Forecast' }
};

// operations-dashboard-main.js
import { OPERATIONS_TABS } from './config/tabs.js';

function renderTab(tab, metrics) {
  const tabConfig = OPERATIONS_TABS[tab] || OPERATIONS_TABS.overview;
  return tabConfig.renderer(metrics);
}

// Usage
const body = renderTab(tab, metrics);
```

### Recommended Refactor: Threshold Constants

**Before:**
```javascript
// Multiple files with different thresholds
if (value >= 85) return 'good';
if (value >= 65) return 'watch';
// vs
if (utilisation > 90) return 'critical';
if (utilisation > 80) return 'watch';
```

**After:**
```javascript
// utils/js/constants.js
export const THRESHOLDS = {
  STATUS: {
    GOOD: { min: 85 },
    WARNING: { min: 65 },
    CRITICAL: { max: 64 }
  },
  UTILIZATION: {
    CRITICAL: 90,
    WARNING: 80,
    GOOD: 0
  }
};

// Helper function
export function getStatus(value, type = 'status') {
  const thresholds = THRESHOLDS[type.toUpperCase()];
  if (value >= thresholds.CRITICAL) return 'critical';
  if (value >= thresholds.WARNING) return 'watch';
  return 'good';
}
```

---

## Conclusion

The Operations Dashboard is a **solid, well-architected codebase** with good security practices and comprehensive testing.  
This review did **not validate a confirmed critical exploit** in current user paths, but it identified meaningful hardening work that reduces future regression risk.

Most findings are **maintainability and consistency improvements**. Priority should focus on runtime-facing hardening (HTML rendering paths and threshold consistency), then opportunistic cleanup.

**Next Steps:**
1. Implement hardening changes for HTML injection surfaces
2. Create tickets for threshold/tab-routing consistency refactors
3. Resolve test-anchored utility ownership (`opsInfographicBar`)
4. Handle style-level cleanup during normal maintenance

---

*Report generated by automated code analysis*
