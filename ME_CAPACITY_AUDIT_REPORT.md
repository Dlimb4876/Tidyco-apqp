# ME Capacity Module — Architectural & Code Review

**Date:** 2026-03-10
**Status:** CRITICAL ISSUES FOUND
**Priority:** Fix before production use

---

## Executive Summary

The ME Capacity module has **multiple architectural conflicts**, **calculation bugs**, and **unused refactored code** that creates maintenance risk. The active system uses a global namespace data layer (`me-data.js`) while a parallel ES6 module architecture exists but is never imported. Additionally, the capacity calculation completely ignores user-marked holidays and bank holidays.

**Critical Issues:** 3
**High Priority:** 5
**Medium Priority:** 2

---

## 1. ARCHITECTURAL INTEGRATION REVIEW

### 1.1 ⚠️ CRITICAL: Dual Parallel Codebases (Dead Code Risk)

**Problem:** Two entirely separate implementations exist:

#### **ACTIVE System (Currently Used)**
- `portals/capacity/js/me-data.js` — All functions attached to `window` object (global scope)
- `portals/capacity/js/me-capacity.js` — Calls global functions, inline calculations
- **Loading order:** Line 244-245 of `index.html`

```html
<script src="portals/capacity/js/me-data.js"></script>
<script src="portals/capacity/js/me-capacity.js"></script>
```

#### **INACTIVE System (Never Used)**
- `portals/capacity/js/me-data/index.js` — ES6 module exports
- `portals/capacity/js/me-data/{team.js, tasks.js, products.js, holidays.js}` — Modular CRUD
- `portals/capacity/js/me-utils/{calculations.js, dates.js, validation.js}` — Utilities
- `portals/capacity/js/me-render/{team.js, tasks.js, products.js, holidays.js, chart.js}` — Render functions
- **Never imported anywhere** — No `import` statements reference these

**Impact:**
- Maintenance confusion: developers see refactored code but it doesn't run
- Memory waste: unused modules compiled into bundle
- Risk of accidental switch without proper testing

**Recommendation:** **Delete all ES6 module files immediately.** They create false confidence in "modular" architecture while the actual system remains monolithic.

---

### 1.2 ⚠️ Module System Incompatibility (If Refactored Code Were Ever Used)

**Problem:** `me-data/index.js` uses ES6 `export`, but `me-capacity.js` calls functions globally

```javascript
// me-data/index.js (UNUSED)
export function meDataGetTeam() { ... }
export async function meDataInit() { ... }

// me-capacity.js (ACTIVE)
window.meGetTabContent = function() {
  const team = meDataGetTeam();  // ❌ Would fail if using ES6 modules
  const tasks = meDataGetTasks();
  // ...
}
```

**Why it fails:** ES6 `export` means these functions are NOT on the `window` object. They must be imported:
```javascript
// This doesn't exist in me-capacity.js:
import { meDataGetTeam, meDataGetTasks, ... } from './me-data/index.js';
```

**If someone switched to ES6 modules without updating me-capacity.js:**
- All tabs would fail to render
- No error would appear until runtime (calling undefined functions)

---

### 1.3 ⚠️ Initialization Flow — Missing Chart.js Availability Check

**Problem:** `meDrawChartNow()` assumes Chart.js is available without defensive check

**Location:** `me-capacity.js:395-409`

```javascript
function meDrawChartNow() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  if (!window.Chart) {
    console.warn('Chart.js not loaded');  // ✓ Good check
    return;
  }
  // ... continues to use Chart
}
```

**Status:** ✓ ACCEPTABLE — Chart.js check exists at line 401-404

**Remaining Risk:** If Chart.js fails to load from CDN, the warning is logged but user sees blank canvas silently. Consider more visible feedback.

---

### 1.4 Initialization Sequence — `meInit()` Race Condition Risk

**Location:** `me-capacity.js:489-495`

```javascript
window.meInit = async function() {
  await meDataInit();  // Supabase load
  if (!meChartStart) {
    const now = new Date();
    meChartStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
};

// ✓ Auto-called at bottom
meInit().catch(err => console.error('ME init failed:', err));
```

**Status:** ✓ ACCEPTABLE
- Properly awaits data init before setting chart month
- Supabase failures are caught and logged
- Falls back to empty state if no data

---

## 2. DATA PERSISTENCE & SUPABASE REVIEW

### 2.1 🔴 CRITICAL: Supabase Data Structure Mismatch

**Problem:** Two different data storage formats between implementations

#### **me-data.js (ACTIVE) — Lines 241-246**
```javascript
if (data && data.data) {  // ← Expects nested data.data
  meDataState = {
    team: data.data.team || [],
    tasks: data.data.tasks || [],
    products: data.data.products || [],
    holidays: data.data.holidays || []
  };
}
```

#### **me-data/index.js (UNUSED) — Lines 30-36**
```javascript
if (data) {
  meDataState = {
    team: data.team || [],    // ← Expects flat structure
    tasks: data.tasks || [],
    products: data.products || [],
    holidays: data.holidays || []
  };
}
```

#### **Actual Save (me-data.js:268-277) — Nests data**
```javascript
const { error } = await supa
  .from('me_capacity')
  .upsert({
    user_id: currentUser.id,
    data: {                   // ← Saves as nested object
      team: meDataState.team,
      tasks: meDataState.tasks,
      products: meDataState.products,
      holidays: meDataState.holidays
    },
    updated_at: new Date().toISOString()
  });
```

**Result:** Save nests data, load expects nesting, so it works. BUT if someone used the unused me-data/index.js version, it would:
1. Save flat structure
2. Try to load non-existent fields
3. Lose all data (defaults to empty arrays)

**Recommendation:**
1. Delete me-data/index.js to eliminate confusion
2. Document the Supabase table structure in `me-data.js` header
3. Add version check: validate `data.data` exists before accessing

---

### 2.2 ⚠️ Save Reliability — Debounce May Lose Data on Page Close

**Location:** `me-capacity.js:483-486`

```javascript
function meDebouncedSave() {
  clearTimeout(meSaveTimer);
  meSaveTimer = setTimeout(() => meDataSave(false), 900);  // 900ms debounce
}
```

**Problem:**
- User makes rapid changes → 5 calls in 2 seconds
- Only last call triggers save at T=2900ms
- **If user closes page at T=2800ms, changes are lost**

**Risk Level:** MEDIUM
- Only affects rapid multi-field edits followed by immediate close
- LocalStorage fallback exists (`me-data.js:24`), but for ME Capacity module:

```javascript
// me-data.js saveRemote()
const { error } = await supa.from('me_capacity').upsert(...);
```

**There is NO localStorage fallback for me_capacity table**

**Recommendation:**
1. Add immediate save on page unload:
```javascript
window.addEventListener('beforeunload', () => {
  clearTimeout(meSaveTimer);
  meDataSave(false);  // Force synchronous save
});
```

2. Consider BeaconAPI for unload safety:
```javascript
navigator.sendBeacon('/api/save-capacity', JSON.stringify(meDataState));
```

---

### 2.3 Auth State Guards — ✓ ACCEPTABLE

**Status:** Properly guarded in both places:

**me-data.js:234**
```javascript
if (typeof supa !== 'undefined' && typeof currentUser !== 'undefined' && currentUser) {
  // Load from Supabase
}
```

**me-data.js:259**
```javascript
if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
  console.warn('Supabase not available');
  return;
}
```

Both init and save properly check for `supa` and `currentUser` before attempting Supabase operations.

---

## 3. CALCULATION ENGINE REVIEW

### 3.1 🔴 CRITICAL: Holiday Deductions Completely Missing

**Problem:** Capacity calculation ignores ALL holidays (user-marked and bank holidays)

**Location:** `me-capacity.js:570-629 meCalculateMonthData()`

```javascript
function meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  // ... monthStart, monthEnd calculated ...

  // ✓ Calculate capacity
  let capacity = 0;
  teamArray.forEach(member => {
    const hours = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    const workDays = meCountWorkDaysInMonth(year, month);
    const monthCapacity = hours * (workDays / 5);
    capacity += monthCapacity;
  });

  // ❌ NO DEDUCTION FOR HOLIDAYS OR BANK HOLIDAYS!
  // ❌ holidaysArray parameter is UNUSED
  // ❌ Bank holidays are NEVER subtracted

  // ... calculate demand ...

  return {
    capacity,  // ← This is INFLATED; doesn't account for holidays
    npi, improvement, tendering, support, other,
    totalDemand,
    utilisation: capacity > 0 ? Math.round((totalDemand / capacity) * 100) : 0
  };
}
```

**Real-World Impact:**

Example: Team member works M-F (37.5h/wk), takes full week off
- Reported capacity: 150h (5 weeks × 37.5h)
- **Actual capacity: 112.5h** (4 weeks × 37.5h)
- **Overutilization appears as 91%** when it's actually **112%** ✓ OVER

**Result:** Utilisation KPI is misleading. A 95% utilisation month might actually be 120% when holidays are factored.

### How It Should Work (Reference: me-utils/calculations.js:42-79)

```javascript
export function meCalculateTeamCapacity(monthKey, teamArray, holidaysArray, bankHolidaysMap) {
  // ... base capacity ...

  // Subtract user-marked holidays
  let holidayDeduction = 0;
  holidaysArray.forEach(holiday => {
    if (holiday.date >= monthKey + '-01' && holiday.date < monthKey + '-32') {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;  // 7.5h
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;  // 3.75h
      }
    }
  });

  // Subtract bank holidays (Mon-Fri only)
  let bankHolidayDeduction = 0;
  Object.entries(bankHolidaysMap).forEach(([dateStr, name]) => {
    if (dateStr >= monthKey + '-01' && dateStr < monthKey + '-32' && !isWeekend(dateStr)) {
      bankHolidayDeduction += hoursPerDay;  // 7.5h
    }
  });

  return Math.max(0, baseCapacity - holidayDeduction - bankHolidayDeduction);
}
```

**Recommendation:** Implement holiday deductions immediately. The logic exists in me-utils/calculations.js but is unused.

---

### 3.2 🔴 CRITICAL: Double-Deduction Risk (If Holidays on Weekends)

**Problem (Related):** Bank holiday deduction logic (if it existed) could double-count holidays

**me-utils/calculations.js:58-76:**

```javascript
// Subtract user-marked holidays
holidaysArray.forEach(holiday => {
  if (holiday.date >= monthKey + '-01' && holiday.date < monthKey + '-32') {
    if (holiday.type === 'full') {
      holidayDeduction += hoursPerDay;  // Always 7.5h
    }
  }
});

// Subtract bank holidays
bankHolidaysMap.forEach(([dateStr, name]) => {
  if (dateStr >= monthKey + '-01' && dateStr < monthKey + '-32' && !isWeekend(dateStr)) {
    bankHolidayDeduction += hoursPerDay;  // Always 7.5h
  }
});
```

**Scenario:** Good Friday (2026-04-10) — a bank holiday
1. User marks it as 'full' holiday
2. User-marked deduction: +7.5h
3. Bank holiday deduction: +7.5h
4. **Result: -15h (double-counted)**

**Current Status:** This bug is in UNUSED code (me-utils/), so it's not active. But if refactored code were integrated without fixing it, capacity would be severely understated.

**Recommendation:** Add deduplication logic:
```javascript
const personBankHolidayDates = new Set(
  holidays
    .filter(h => h.personId === member.id && h.type !== null)
    .map(h => h.date)
);

bankHolidaysMap.forEach(([dateStr, name]) => {
  if (...check month...) {
    if (!personBankHolidayDates.has(dateStr)) {  // ← Only deduct if NOT already marked
      bankHolidayDeduction += hoursPerDay;
    }
  }
});
```

---

### 3.3 ⚠️ hoursPerDay — Hardcoded Value Risk

**Location:** `me-utils/calculations.js:46`

```javascript
const hoursPerDay = 7.5; // 37.5 / 5
```

**Problem:** This hardcodes 7.5h/day but team members can have different `hoursPerWeek`:

**Example:**
- Team member A: 30h/week → 6h/day (part-time)
- Team member B: 40h/week → 8h/day (full-time)
- Team member C: 50h/week → 10h/day (management)

**If Team C takes 1 day off:**
- Correct deduction: 10h
- Current code deduction: 7.5h
- **Error: +2.5h inflated capacity**

**Current Status:** me-capacity.js doesn't use this code, so NOT active. But refactored version has the bug.

**Recommendation:** Calculate per-person:
```javascript
teamArray.forEach(member => {
  const hoursPerDay = (member.hoursPerWeek || 37.5) / 5;
  const memberHolidayDeduction = holidays
    .filter(h => h.personId === member.id)
    .reduce((sum, h) => sum + (h.type === 'full' ? hoursPerDay : hoursPerDay / 2), 0);
  holidayDeduction += memberHolidayDeduction;
});
```

---

### 3.4 ⚠️ Product Support — Week Calculation Imprecision

**Location:** `me-capacity.js:608-616`

```javascript
productsArray.forEach(product => {
  const prodStart = new Date(product.supportFrom);
  const prodEnd = new Date(product.supportUntil);

  if (prodStart <= monthEnd && prodEnd >= monthStart) {
    const weeks = (monthEnd - monthStart) / (1000 * 60 * 60 * 24 * 7);
    // ❌ Problem here ↑
    support += (product.hoursPerWeek || 0) * weeks;
  }
});
```

**Problem:** Calculation doesn't account for actual product date range overlap

**Example:**
- Month: March (1st–31st) = 31 days
- Product support: March 15–31 = 17 days
- Current code: weeks = 31/7 = 4.43 weeks
- **Applied to full month, not just 15–31**

**Correct approach:**
```javascript
const overlapStart = new Date(Math.max(prodStart.getTime(), monthStart.getTime()));
const overlapEnd = new Date(Math.min(prodEnd.getTime(), monthEnd.getTime()));

if (overlapStart <= overlapEnd) {
  const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
  const workDays = overlapDays * (5/7);  // Only count working days
  const weeks = workDays / 5;
  support += (product.hoursPerWeek || 0) * weeks;
}
```

**Impact:** Low for typical scenarios (month-long products), but HIGH for mid-month product start/end dates.

**me-utils/calculations.js:126-144** has the same simplistic calculation.

---

### 3.5 Task Demand Calculation — ✓ ACCEPTABLE

**Location:** `me-capacity.js:587-605`

```javascript
tasksArray.forEach(task => {
  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
  const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

  if (overlapStart <= overlapEnd) {
    const totalDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
    const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
    const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);

    const category = (task.category || 'other').toLowerCase();
    if (category === 'npi') npi += hoursThisMonth;
    // ... other categories ...
  }
});
```

**Status:** ✓ CORRECT
- Properly calculates overlap between task and month
- Linearly distributes task hours based on overlap ratio
- Handles multi-month tasks correctly

---

### 3.6 Capacity Calculation Formula — ✓ MOSTLY CORRECT

**Location:** `me-capacity.js:577-581`

```javascript
teamArray.forEach(member => {
  const hours = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
  const workDays = meCountWorkDaysInMonth(year, month);
  const monthCapacity = hours * (workDays / 5);
  capacity += monthCapacity;
});
```

**Status:** ✓ CORRECT FORMULA (Minus holiday deductions)
- Uses individual `hoursPerWeek` per member ✓
- Applies utilisation percentage ✓
- Scales by actual working days in month ✓
- **Missing:** Holiday and bank holiday deductions ❌

---

## Summary Table

| Issue | Severity | Category | Status | Impact |
|-------|----------|----------|--------|--------|
| Dual parallel codebases | CRITICAL | Architecture | Active code OK; unused code risks confusion | Maintenance nightmare |
| Holidays completely ignored | CRITICAL | Calculation | Active in me-capacity.js | KPIs misleading; capacity overstated |
| Supabase data format mismatch | CRITICAL | Data layer | Would fail if switching implementations | Data loss risk if refactored |
| Debounce loses data on page close | HIGH | Persistence | No unload handler | Data loss edge case |
| Double-deduction risk (holidays on bank holidays) | HIGH | Calculation | In unused code only | Would activate if refactored |
| hoursPerDay hardcoded | HIGH | Calculation | In unused code only | Inaccurate for variable hours |
| Product support week calculation | MEDIUM | Calculation | Acceptable for month-long products | Imprecise for partial months |
| Module system incompatibility | MEDIUM | Architecture | Unused code | Would fail if ever used |

---

## Recommendations (Priority Order)

### 🔴 **IMMEDIATE (Before Next Release)**

1. **Delete ES6 module files** (me-data/index.js, me-data/*.js, me-utils/*.js, me-render/*.js)
   - They're unused, confusing, and contain bugs
   - Keep only: `me-capacity.js`, `me-data.js`, `me-capacity.css`

2. **Implement holiday deductions** in `meCalculateMonthData()`
   - Add lines 627–640 (see detailed code below)
   - Test with team member who has marked holidays

3. **Add page unload handler** to prevent debounce data loss
   - Add `beforeunload` listener to force flush unsaved changes

### 🟡 **SOON (Next Sprint)**

4. **Document Supabase structure** in me-data.js header
   - Add schema comment showing `data: { team[], tasks[], products[], holidays[] }`

5. **Add data validation** on Supabase load
   - Check `data.data` exists before accessing nested fields

### 🟢 **NICE-TO-HAVE (Future)**

6. Improve product support calculation to account for partial-month date ranges
7. Create unit tests for capacity calculation (mock data with various scenarios)

---

## Code Fixes

### Fix 1: Add Holiday Deductions to meCalculateMonthData()

**File:** `portals/capacity/js/me-capacity.js`
**Location:** Line 629 (before `return` statement)
**Add:**

```javascript
function meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  // ... existing code lines 571-627 ...

  // 🔴 ADD THIS SECTION (NEW):
  // Calculate holiday deductions
  let holidayDeduction = 0;
  const bankHols = meGetBankHolidaysForYear(year);
  const hoursPerDay = 7.5;  // Standard 37.5/5

  // Subtract user-marked holidays
  holidaysArray.forEach(holiday => {
    const holidayMonth = holiday.date.substring(0, 7);  // Extract 'YYYY-MM'
    if (holidayMonth === monthKey) {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  // Subtract bank holidays (Mon-Fri only, not already marked as user holiday)
  const markedHolidayDates = new Set(
    holidaysArray
      .filter(h => h.date.substring(0, 7) === monthKey)
      .map(h => h.date)
  );

  Object.entries(bankHols).forEach(([dateStr, name]) => {
    const bankMonth = dateStr.substring(0, 7);
    if (bankMonth === monthKey && !markedHolidayDates.has(dateStr)) {
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {  // Not weekend
        holidayDeduction += hoursPerDay;
      }
    }
  });

  const adjustedCapacity = Math.max(0, capacity - holidayDeduction);
  // 🔴 END NEW SECTION

  const totalDemand = npi + improvement + tendering + support + other;
  return {
    capacity: adjustedCapacity,  // ← Changed from 'capacity'
    npi,
    improvement,
    tendering,
    support,
    other,
    totalDemand,
    utilisation: adjustedCapacity > 0 ? Math.round((totalDemand / adjustedCapacity) * 100) : 0
  };
}
```

### Fix 2: Add Unload Handler to Prevent Data Loss

**File:** `portals/capacity/js/me-capacity.js`
**Location:** Line 643 (after `meInit()` call)
**Add:**

```javascript
// Force save on page unload to prevent debounce data loss
window.addEventListener('beforeunload', (event) => {
  clearTimeout(meSaveTimer);  // Cancel pending debounced save
  // Attempt immediate synchronous save (fallback for async failures)
  if (typeof meDataSave === 'function') {
    meDataSave(false);  // Don't show alert on unload
  }
});
```

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Team member with 1 week off shows correct reduced capacity for that month
- [ ] Team member with half-day marked shows 3.75h deduction
- [ ] Good Friday (bank holiday) is deducted from April capacity
- [ ] User-marked Good Friday doesn't double-count (still 7.5h, not 15h)
- [ ] March 2026 shows 20 working days (not including holidays)
- [ ] Product support running March 15–31 doesn't use full March 4.43 weeks
- [ ] Closing tab with unsaved changes in past 900ms persists to Supabase
- [ ] No console errors when Chart.js loads
- [ ] All tabs render without errors

---

## Files Checked

- ✓ `portals/capacity/js/me-capacity.js` (active)
- ✓ `portals/capacity/js/me-data.js` (active)
- ✓ `portals/capacity/js/me-data/index.js` (unused)
- ✓ `portals/capacity/js/me-data/*.js` (unused)
- ✓ `portals/capacity/js/me-utils/*.js` (unused)
- ✓ `portals/capacity/js/me-render/*.js` (unused)
- ✓ `core/js/db.js` (parent data layer)
- ✓ `index.html` (loading order)

