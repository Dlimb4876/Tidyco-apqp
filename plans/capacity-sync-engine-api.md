# Unified Capacity Sync Engine — API Design

> Design for `core/js/capacity-sync.js` — single reusable module for ME/PM/LOG/UNIT6 portals.

## Goals

1. **Eliminate 3,500+ lines of duplicated code** (PM/LOG/UNIT6 monoliths)
2. **Fix known fragilities**: dedup, realtime guards, delete reliability, transaction semantics
3. **Maintain backwards compatibility** with existing portal code (ME/PM/LOG/UNIT6 can re-export)
4. **Enable future scaling** (virtual tables, offline support, undo)

---

## Factory: `createCapacitySync()`

```javascript
import { createCapacitySync } from '../../../../core/js/capacity-sync.js'

const sync = createCapacitySync({
  // Required
  namespace: 'me' | 'pm' | 'log' | 'unit6',
  tables: ['teams', 'tasks', 'products', 'holidays', 'productSupportHistory'],

  // Optional: table-specific normalizers
  normalizers: {
    teams: (row) => ({ ... }),
    tasks: (row) => ({ ... }),
    // etc.
  },

  // Optional: table-specific validation
  validators: {
    teams: (row) => row.name && row.hoursPerWeek > 0,
    // etc.
  },

  // Optional: custom dedup keying (default: by id)
  dedupKey: {
    holidays: (row) => `${row.personId}_${row.date}`,
    productSupportHistory: (row) => `${row.productId}_${row.effectiveDate}`
  },

  // Optional: custom persistence layer (default: Supabase relational)
  onSave: async (namespace, table, rows, pendingDeletes) => {
    // Custom save logic, or use built-in relational module
  },

  // Optional: hooks for render scheduling
  onStateChange: (table, trigger) => {
    requestRender(namespace, {
      trigger,
      renderNow: () => refreshCurrentTab(),
      isEditing: isEditingInlineCell(),
      isFiltering: isCapacityFilterFocused(),
    })
  }
})
```

---

## Returned Object: `sync`

```javascript
{
  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  state: {
    teams: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: [],
    // ... one array per table
  },

  pendingDeletes: {
    teams: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: [],
  },

  saveInProgress: false,   // true while save() is running
  saveQueued: false,       // true if save() called while saveInProgress
  initialized: false,      // false until init() completes

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  async init(): Promise<void> {
    // 1. Load all tables from Supabase
    // 2. Normalize rows
    // 3. Deduplicate all tables
    // 4. Apply cross-table validations (e.g., ensure products exist for tasks)
    // 5. Set initialized = true
    // 6. Return (does not subscribe to realtime)
  },

  async save(): Promise<{
    success: boolean,
    errors: { table: string, message: string }[],
    retry: () => Promise<SaveResult>  // Retry failed tables only
  }> {
    // 1. Block if saveInProgress; queue if saveQueued
    // 2. Deduplicate all tables (in-place)
    // 3. Validate all tables
    // 4. For each table:
    //    - Call onSave(namespace, table, rows, pendingDeletes)
    //    - Collect errors but continue other tables
    // 5. Clear pendingDeletes for successfully saved tables
    // 6. Re-queue failed tables (stays in pendingDeletes)
    // 7. Return success flag + error list + retry function
    // 8. If queued call pending, auto-call save() again after finally
  },

  subscribe(): void {
    // 1. Start realtime subscription to *_teams, *_tasks, etc.
    // 2. For onInsert/onUpdate events:
    //    a. Check if saveInProgress; if true, queue for merge
    //    b. Normalize row
    //    c. Deduplicate this row against existing state
    //    d. Call onStateChange('teams', 'realtime')
    // 3. For onDelete events:
    //    a. Remove from state (filter)
    //    b. Call onStateChange('teams', 'realtime')
    // 4. Side effect: cleans up automatically on navigate() or unsubscribe()
  },

  unsubscribe(): void {
    // Stop realtime subscription
  },

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  add(table: string, row: object): string | null {
    // 1. Validate row against validators[table]
    // 2. Assign id if not present (capUUID)
    // 3. Normalize
    // 4. Check for duplicates (by dedupKey) — skip if exists
    // 5. Push to state[table]
    // 6. Call onStateChange(table, 'add')
    // 7. Return id
  },

  update(table: string, id: string, patch: object): boolean {
    // 1. Find row by id in state[table]
    // 2. If not found, return false
    // 3. Merge patch onto row
    // 4. Validate merged row
    // 5. Normalize
    // 6. Check for duplicate *other* rows (skip if new row matches existing)
    // 7. Keep in-place
    // 8. Call onStateChange(table, 'update')
    // 9. Return true
  },

  delete(table: string, id: string): boolean {
    // 1. Find row by id in state[table]
    // 2. If not found, return false
    // 3. Remove from state[table] (filter)
    // 4. Queue id in pendingDeletes[table]
    // 5. Call onStateChange(table, 'delete')
    // 6. Return true
  },

  get(table: string, id: string): object | null {
    // Return single row by id, or null
  },

  getAll(table: string): object[] {
    // Return all rows for table (already deduplicated)
  },

  // ═══════════════════════════════════════════════════════════════
  // DEDUPLICATION & CLEANUP
  // ═══════════════════════════════════════════════════════════════

  deduplicate(table: string): object[] {
    // 1. Apply dedupKey logic for this table
    // 2. Keep first occurrence, discard later
    // 3. Mutate state[table] in-place
    // 4. Return deduplicated array
  },

  reset(): void {
    // Clear all state, pendingDeletes, reset flags
    // Useful for logout or data refresh
  }
}
```

---

## Usage Example: Migrate PM Portal

**Before (1,028 lines in one file):**
```javascript
// portals/capacity/project-management/js/pm-data.js
export const pmDataState = { ... }
export const pmDataPendingDeletes = { ... }
export async function pmDataInit() { ... }
export async function pmDataSave() { ... }
export function pmDataSubscribe() { ... }
export function pmDataAddTeam(name, hours, ...) { ... }
export function pmDataUpdateTeam(id, ...) { ... }
export function pmDataDeleteTeam(id) { ... }
// ... 1,000+ lines
```

**After (50-line wrapper):**
```javascript
// portals/capacity/project-management/js/pm-data.js
import { createCapacitySync } from '../../../../core/js/capacity-sync.js'
import {
  capNormalizeHolidayRecord,
  capNormalizeTaskRow,
  // ... normalizers
} from '../../shared/js/cap-data-utils.js'

const sync = createCapacitySync({
  namespace: 'pm',
  tables: ['teams', 'tasks', 'products', 'holidays', 'productSupportHistory'],
  normalizers: {
    teams: capNormalizeTeamRow,
    tasks: capNormalizeTaskRow,
    // ... etc.
  },
  dedupKey: {
    holidays: (h) => `${h.personId}_${h.date}`,
    productSupportHistory: (h) => `${h.productId}_${h.effectiveDate}`
  },
  onStateChange: (table, trigger) => {
    pmApplyRealtimeRender(table, trigger)
  }
})

// Re-export for backwards compatibility
export const pmDataState = sync.state
export const pmDataPendingDeletes = sync.pendingDeletes
export const pmDataInit = () => sync.init()
export const pmDataSave = () => sync.save()
export const pmDataSubscribe = () => sync.subscribe()
export function pmDataAddTeam(name, hours, util, start, end) {
  return sync.add('teams', { name, hoursPerWeek: hours, utilisation: util, startDate: start, endDate: end })
}
export function pmDataUpdateTeam(id, patch) {
  return sync.update('teams', id, patch)
}
export function pmDataDeleteTeam(id) {
  return sync.delete('teams', id)
}
// ... same for tasks, products, holidays
```

---

## Key Design Decisions

### 1. Deduplication is Persistent, Not Lazy

**Current bug (PM/LOG/UNIT6):**
```javascript
export function pmDataGetHolidays() {
  pmDataState.holidays = capNormalizeAndDedupeHolidays(pmDataState.holidays)
  return pmDataState.holidays
}
// Called at query time, but state can be mutated later → duplicates sneak in
```

**New approach:**
```javascript
sync.deduplicate('holidays')  // Explicit, called in save() before persist
// Every save() call dedupes all tables in-place
// State is *always* deduplicated
```

**Guarantee:** If you call `sync.getAll('holidays')`, you get deduplicated rows. No stale duplicates.

---

### 2. Realtime Doesn't Block During Save

**Current bug (all portals):**
```javascript
onInsert: row => {
  if (pmDataSaveInProgress) return  // ← Silently drop event
  // ...
}
```

**New approach:**
```javascript
subscribe() {
  onInsert: row => {
    if (sync.saveInProgress) {
      // Queue for merge, don't drop
      _queueRemoteChange(row)
    } else {
      // Apply immediately
      sync._applyRealtimeRow(row)
    }
  }
}
```

**Guarantee:** Realtime events are never lost. After save completes, merge any queued events.

---

### 3. Deletes Are Queued, Never Lost

**Current bug (all portals):**
```javascript
if (pmDataPendingDeletes.tasks.length > 0) {
  for (const taskId of pmDataPendingDeletes.tasks.slice()) {
    const ok = await pmDeleteTaskRelational(taskId)
    if (!ok) failedDeletes.push(taskId)
  }
  pmDataPendingDeletes.tasks.length = 0
  pmDataPendingDeletes.tasks.push(...failedDeletes)
}
```

**New approach:**
```javascript
const result = await sync.save()
// result.errors = [{ table: 'tasks', message: '...' }]
// result.retry = () => sync.save()  // Retry only failed tables

// Failed deletes stay in sync.pendingDeletes automatically
// Next save() picks them up and retries
```

**Guarantee:** No delete is ever silently dropped. Failures are explicit and retryable.

---

### 4. Holidays Are Upserted, Not Delete/Insert

**Current bug (all portals):**
```javascript
const { error: deleteHolidayError } = await supabase
  .from('pm_holidays')
  .delete()
  .eq('user_id', currentUser.id)
// If this succeeds but insert fails, holidays are gone
```

**New approach:**
```javascript
// Inside onSave (if using built-in relational):
const deduped = sync.deduplicate('holidays')
const { data, error } = await supabase.from('pm_holidays').upsert(
  deduped.map(h => ({
    id: h.id,
    user_id: currentUser.id,
    person_id: h.personId,
    date: h.date,
    type: h.type,
    department: 'PM'
  }))
)
// Atomic: all or nothing, no partial loss
```

**Guarantee:** Holiday saves are atomic. No partial data loss.

---

### 5. State Change Hook is Flexible

```javascript
onStateChange: (table, trigger) => {
  // trigger = 'add' | 'update' | 'delete' | 'realtime' | 'save'
  // You decide what to render

  // Option A: Delegate to render scheduler
  requestRender(namespace, {
    trigger: trigger === 'realtime' ? 'realtime' : 'save',
    renderNow: () => renderCurrentTab(),
    isEditing: isEditingInlineCell(),
    isFiltering: isCapacityFilterFocused()
  })

  // Option B: Custom rendering (for charts, etc.)
  if (table === 'holidays' || table === 'productSupportHistory') {
    redrawCharts()
  } else {
    rerender TableTab()
  }
}
```

---

## Error Handling

### Save Failures

```javascript
const result = await sync.save()

if (!result.success) {
  console.error('Save had errors:', result.errors)
  // result.errors = [
  //   { table: 'tasks', message: 'Auth required' },
  //   { table: 'holidays', message: 'Duplicate key...' }
  // ]

  // Retry only failed tables
  const retryResult = await result.retry()
}
```

### Validation Failures

```javascript
const ok = sync.add('teams', {
  name: '',  // ← Invalid
  hoursPerWeek: 40
})

if (!ok) {
  console.warn('Row failed validation')
  // Validator determined this row is invalid
}
```

---

## Migration Path

### Phase 1: Deploy Unified Engine

```
core/js/capacity-sync.js  ← New
```

### Phase 2: Wrap LOG (Simplest)

```
portals/capacity/logistics/js/log-data.js  ← Shrink from 1,028 to 50 lines
portals/capacity/logistics/js/log-data-relational.js  ← Delete (move into engine)
```

- Test realtime load on LOG
- Verify dedup works (no more duplicates)
- Verify deletes persist

### Phase 3: Wrap PM + UNIT6

```
portals/capacity/project-management/js/pm-data.js  ← Shrink
portals/capacity/unit6/js/unit6-data.js  ← Shrink
```

### Phase 4: Optional — Migrate ME

```
portals/capacity/me/js/me-data-persistence.js  ← Delete most logic
portals/capacity/me/js/me-data-relational.js  ← Delete (move into engine)
```

ME's separate module pattern is sophisticated but could benefit from unified dedup/realtime guards.

---

## Future Extensions (Roadmap)

### Virtual Scrolling

```javascript
const sync = createCapacitySync({
  // ...
  virtualScroll: {
    rowHeight: 40,
    visibleRows: 20
  }
})

// Engine only renders visible subset
// Scales to 10k+ rows
```

### Offline Support

```javascript
const sync = createCapacitySync({
  // ...
  offline: {
    persistTo: 'indexedDB'  // Auto-sync on reconnect
  }
})

await sync.save()  // Works offline, queues locally
```

### Undo/Redo

```javascript
sync.undo()  // Revert last change
sync.redo()  // Re-apply change
```

---

## Questions for Review

1. **Dedup key strategy**: Should the engine auto-detect (by config), or should normalizers be responsible?
2. **Hooks location**: Should `onStateChange` live inside sync, or in a separate render-scheduler wrapper?
3. **Backwards compat**: Should we keep `pmDataState` as a live proxy, or just accept that it's a reference that might feel stale?
4. **Realtime queue**: Should queued realtime rows be merged *after* save completes, or *during* the next save cycle?
5. **Transaction scope**: Should we consider making save() atomic across all tables (fail all if any fails), or is per-table failure OK?

---

## File Size Estimate

| File | Before | After | Δ |
|------|--------|-------|---|
| pm-data.js | 1,028 | 50 | -978 |
| log-data.js | 1,028 | 50 | -978 |
| unit6-data.js | 1,053 | 50 | -1,003 |
| pm-data-relational.js | ~500 | 0 | -500 |
| log-data-relational.js | ~500 | 0 | -500 |
| unit6-data-relational.js | ~500 | 0 | -500 |
| **capacity-sync.js** | 0 | **700** | **+700** |
| **Total** | **5,609** | **850** | **-4,759** |

---

## Success Criteria

- ✅ LOG, PM, UNIT6 pass same realtime load tests without data loss
- ✅ No duplicate rows appear in DB after migration
- ✅ Holiday saves are atomic (all or nothing)
- ✅ Realtime events queued during saves, never dropped
- ✅ Delete queue persists failures automatically
- ✅ 3x code reduction (4,700+ lines removed)
- ✅ Backwards-compatible exports (existing code doesn't break)
