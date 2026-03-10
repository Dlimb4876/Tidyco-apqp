# ME Capacity Testing Guide — Quick Verification

Run these tests to verify all 8 fixes are working correctly.

---

## Test 1: Holiday Deductions (Fix #1)

**Setup:** Create a team member with marked holiday

1. Open ME Load Capacity portal
2. Go to **Holiday Planner** tab
3. Mark **5 consecutive business days** as 'F' (full day)
4. Go back to **Capacity Chart** tab
5. Check the month where holidays are marked

**Expected Result:**
- Capacity should show approximately **112.5h** (37.5h × 3 weeks)
- **NOT** 150h (full month)
- Difference: ~37.5h reduced for the missing week

**Actual Formula:** (37.5 h/week) × (4 weeks remaining - 5 days off) = 112.5h

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 2: Bank Holiday Deduction (Fix #1)

**Scenario:** Verify bank holidays auto-deduct without manual marking

1. Navigate to **April 2026** in Capacity Chart
2. Check capacity calculation (Good Friday is April 10)

**Expected Result:**
- April shows **1 day fewer** than 20 working days
- Should show ~19 working days
- Capacity ~10h lower than typical 4-week month

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 3: No Double-Deduction (Fix #5)

**Scenario:** Mark bank holiday as personal holiday

1. Go to **Holiday Planner** tab
2. Navigate to **April 2026**
3. Find Good Friday (April 10 — bank holiday, blue cell)
4. Mark the same day as 'F' (full day)
5. Go to **Capacity Chart**

**Expected Result:**
- Capacity deduction = **7.5h** only
- NOT 15h (7.5h bank + 7.5h personal)
- Deduplication works correctly

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 4: Half-Day Holidays (Fix #1)

**Scenario:** Verify half-day deductions

1. Go to **Holiday Planner** tab
2. Mark a day as 'H' (half-day)
3. Go to **Capacity Chart**

**Expected Result:**
- Capacity deduction = **3.75h** (7.5 / 2)
- Month shows correctly reduced capacity

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 5: Product Support Partial Month (Fix #8)

**Scenario:** Product support starting mid-month

1. Go to **Products** tab
2. Add a product with:
   - **Support From:** March 15, 2026
   - **Support Until:** March 31, 2026
   - **Hours/Week:** 40h/week

3. Navigate to **Capacity Chart** → **March 2026**
4. Check "Total Demand" number

**Expected Calculation:**
- Days: 15–31 = 17 days
- Working days: ~12 (approx)
- Weeks: 12/5 = 2.4 weeks
- Support load: 40 × 2.4 ≈ **96h** (NOT 160h)

**Expected Result:**
- Support hours show ~96–100h range
- NOT ~140–160h (full month)

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 6: Data Persistence After Page Close (Fix #4)

**Scenario:** Verify unsaved changes persist

1. Open ME Load Capacity
2. Go to **Team** tab
3. Edit a team member's name (change to "Test Engineer")
4. **Immediately close the tab** (within 500ms of edit)
5. Reopen the Capacity portal

**Expected Result:**
- Team member name = "Test Engineer" (changes persisted)
- Data was saved despite not waiting for debounce timer

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 7: Supabase Data Loading (Fix #3)

**Scenario:** Verify data loads from Supabase without errors

1. Open browser console (F12)
2. Navigate to ME Load Capacity
3. Check console for errors

**Expected Result:**
- No error messages in console
- No "Cannot read property" errors
- Data loads silently (no alert)
- Tabs render correctly

**Console Check:**
```
✗ Should NOT see: "Cannot read property 'team' of undefined"
✗ Should NOT see: "Supabase load error"
✓ Should see: (no errors, silent load)
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test 8: Module Files Deleted (Fix #2 & #7)

**Verify** unused code is removed:

```bash
# Run this in project root:
ls -la portals/capacity/js/
```

**Expected Output:**
```
capacity.js       ← ✓ Exists (hub navigation)
me-capacity.js    ← ✓ Exists (main orchestrator)
me-data.js        ← ✓ Exists (data layer)
```

**NOT present:**
```
❌ me-data/          (directory deleted)
❌ me-utils/         (directory deleted)
❌ me-render/        (directory deleted)
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Integration Test: Full Workflow

**Scenario:** Complete workflow with all fixes

1. **Team Tab:** Add 2 engineers
   - Engineer A: 37.5 h/week
   - Engineer B: 30 h/week (part-time)

2. **Tasks Tab:** Add project task
   - Start: March 1
   - End: March 31
   - Hours: 160h

3. **Products Tab:** Add support product
   - Support from: March 15
   - Support until: April 30
   - Hours/week: 20h

4. **Holiday Planner:** Mark Engineer A's week off
   - March 18–22 all marked as 'F'

5. **Capacity Chart:** Verify calculations
   - Capacity: (37.5 × 0.8) + (30 × 0.8) - (7.5 × 5) = 16h available
   - Task demand: ~150h
   - Product support: ~90h (partial March + full April)
   - Utilisation: ~1600% (severely overloaded ⚠️)

6. **Save & Reload:** Close and reopen tab
   - All data persists ✓

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Regression Tests: Ensure Nothing Broke

Run these to verify existing functionality still works:

- [ ] **Chart renders** without JavaScript errors
- [ ] **Team tab** can add/edit/delete engineers
- [ ] **Tasks tab** can add/edit/delete tasks
- [ ] **Products tab** can add/edit/delete products
- [ ] **Holiday planner** displays 90-day window correctly
- [ ] **Month navigation** (prev/next buttons) work
- [ ] **Sync badge** shows "saved" status
- [ ] **Save to Cloud** button triggers save
- [ ] **All tabs load** without 404 errors
- [ ] **No console errors** when switching tabs

---

## Summary Table

| Test | Fix # | Expected | Pass? |
|------|-------|----------|-------|
| Holiday deduction (full day) | #1 | -37.5h capacity | ☐ |
| Bank holiday auto-deduction | #1 | -7.5h capacity | ☐ |
| No double-deduction | #5 | -7.5h (not -15h) | ☐ |
| Half-day deduction | #1 | -3.75h capacity | ☐ |
| Product support partial month | #8 | ~96h (not 160h) | ☐ |
| Data persists on close | #4 | Changes saved | ☐ |
| Supabase loads without error | #3 | No console errors | ☐ |
| Unused files deleted | #2, #7 | 3 files only | ☐ |
| Full integration workflow | All | All KPIs correct | ☐ |
| Regression: all features work | — | No breakage | ☐ |

---

## Debugging Tips

### If holidays aren't deducting:
1. Check Holiday Planner shows correct dates
2. Verify dates are in `YYYY-MM-DD` format
3. Check console for: "holiday.date.substring is not a function"
4. Ensure `meGetBankHolidaysForYear()` returns valid object

### If data doesn't persist:
1. Check browser console (F12) for Supabase errors
2. Verify `currentUser` is defined (check auth)
3. Check Network tab for failed API calls to `me_capacity` table
4. Clear browser cache and reload

### If capacity doesn't match expectations:
1. Count working days (excluding weekends)
2. Verify `meCountWorkDaysInMonth()` returns correct count
3. Check holiday deduction math: `hoursPerDay × days`
4. Verify utilisation formula: `demand / adjustedCapacity × 100`

### If chart doesn't render:
1. Open console (F12)
2. Check for "Chart.js not loaded" warning
3. Verify `window.Chart` exists
4. Look for Canvas-related errors

---

## Performance Notes

The fixes should have **no negative performance impact:**
- Holiday deduction loop: O(holidays count) — typically <100 entries
- Bank holiday deduction: O(bank holidays) — ~12 entries/year
- No additional API calls
- Debounce timer still 900ms (no change)

---

## When to Deploy

✅ All 8 tests pass → Ready to deploy

⚠️ 1-2 tests fail → Investigate specific fixes

❌ >2 tests fail → Revert and review implementation

---

**Test Completion Date:** ___________

**Tester Name:** ___________

**Overall Status:** ☐ PASS / ☐ FAIL

