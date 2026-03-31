## Production Capacity Batch Hour Distribution Bug (Fixed)

### Issue
The Batch Workload Breakdown tab (detail view) in Production Capacity was calculating batch hours using **calendar days** instead of **working days** (Mon-Fri, excluding UK bank holidays).

### Root Cause
`prodCapGetBatchMonthsWithLoad()` in `prod-capacity-detail.js` used:
```javascript
const totalDays = (batchEnd - batchStart) / 86400000 + 1; // Calendar days
```

While the main demand matrix in `prod-capacity-data.js:417-455` correctly used:
```javascript
const totalDays = prodCapCountWorkingDaysBetween(batchStart, batchEnd, bankHolSet);
```

### Fix Applied (2026-03-31)
1. Exported `prodCapCountWorkingDaysBetween()` and `prodCapGetBankHolidaySetForRange()` from `prod-capacity-data.js`
2. Updated `prodCapGetBatchMonthsWithLoad()` in `prod-capacity-detail.js` to use working days
3. All tests pass (290 tests, 0 failures)

### Impact
- Detail view now shows accurate hour distribution matching the main dashboard
- Hours properly divided by working days, not calendar days
- Example: 2-hour batch spanning May 1-3, 2026 now correctly splits across working days only
