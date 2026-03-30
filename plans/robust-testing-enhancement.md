# Robust Testing Enhancement Plan — 2026-03-30

This plan addresses critical gaps in the Tidyco APQP testing suite, moving beyond "Happy Path" verification to handle real-world failures, concurrency, and real-time data synchronization.

**Instructions for AI Agents:**
- Each phase is modular and has no codependency. You may work on any phase independently.
- **MANDATORY:** Update the checkboxes in this document as you complete tasks.
- Maintain the "ESM-First" pattern: use `jest.unstable_mockModule()` with dynamic `await import()` in every test file (see `tests/db.test.js` for the canonical example).

---

## Phase 1: Robust Error Handling (Negative Testing) 🔴
**Goal:** Ensure the UI fails gracefully when Supabase or the network encounters issues.

**Key reference:** Toast notifications use `showToast(message, type, duration)` from `utils/js/helpers.js`. Types: `'info'`, `'error'`, `'warning'`. Sync badge updates `#syncBadge` and `#bottombarSync` with states `'syncing'` / `'saved'` / `'error'`.

- [ ] **1.1: Database Connection Failures**
  - Create `tests/error-handling-db.test.js`.
  - Mock `supa.from().select()` to return `{ data: null, error: { message: 'Network Timeout', code: 'PGRST301' } }`.
  - Verify that a "Connection Error" toast is displayed (via `showToast` with type `'error'`).
  - Verify that the loading spinner is cleared.

- [ ] **1.2: Authentication & RLS Violations (401/403)**
  - Create `tests/error-handling-auth.test.js`.
  - Mock `supa.from().insert()` to return `{ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } }`.
  - Verify the UI does **not** update local state on a failed write (the codebase is mostly pessimistic — write first, update UI after). Focus on the NPI relational layer (`npi-data-relational.js`) which has an explicit "Revert optimistic local update" path.
  - Verify a "Permission Denied" message is shown to the user via `showToast`.

- [ ] **1.3: Save Failure & Retry Behaviour**
  - Add tests to `tests/db.test.js` (or a new file) to verify behaviour when `saveRemote()` fails.
  - Verify badge transitions: `#syncBadge` shows `'syncing'` → then `'error'` with the error name on failure.
  - Verify the **single automatic retry**: `saveRemote` retries once after **1500ms** when the first attempt fails (controlled by the `attempt` parameter).
  - Verify that if the retry also fails, badge stays in `'error'` state and no further retries occur.

---

## Phase 2: Real-Time Sync & Payload Handling 🔵
**Goal:** Verify that the UI correctly reacts to incoming data changes from other users.

**Key reference:** `createRealtimeSubscription(tableName, channelName, callbacks, options)` in `utils/js/realtime.js`. The `callbacks` object accepts `{ onInsert, onUpdate, onDelete }` handlers. Subscriptions are tracked in a global `realtimeSubscriptions` registry. Already mocked as `jest.fn()` in `jest.setup.js`.

- [ ] **2.1: Subscription Event Handling (INSERT/UPDATE)**
  - Create `tests/realtime-payload.test.js`.
  - **Approach:** Invoke the `onUpdate` / `onInsert` callbacks directly (from the `callbacks` object passed to `createRealtimeSubscription`) rather than simulating a Supabase broadcast event — this is simpler and more reliable in jsdom.
  - Pass a realistic payload: `{ eventType: 'UPDATE', new: { id: '...', status: 'closed' } }`.
  - Verify the specific DOM element (e.g., a status badge) updates without a full page refresh.

- [ ] **2.2: Remote Deletion Handling**
  - Invoke the `onDelete` callback with a `DELETE` payload for a currently viewed item (e.g., an NPI action).
  - Verify the row is removed from the table or the user is navigated away if the parent object is gone.

- [ ] **2.3: Idempotent Subscription Cleanup**
  - Verify that navigating away correctly calls `unsubscribe()` and clears the entry from the `realtimeSubscriptions` registry.
  - Verify that multiple rapid navigations don't cause duplicate subscriptions or "subscription leak" console errors.

---

## Phase 3: Concurrency, Debounce & Race Conditions 🟢
**Goal:** Prevent data loss during rapid edits or navigation.

**Key reference:** Debounce lives in `core/js/db.js`. `save()` clears and resets an 800ms `saveTimer` before calling `saveRemote()`. The `dirtyProjects` Set tracks which projects need writing. `pendingSaves` is a counter shown in the badge as `"● saving (N remaining)…"`.

- [ ] **3.1: Debounce Timing Accuracy**
  - Create `tests/concurrency-debounce.test.js`.
  - Use `jest.useFakeTimers()`.
  - Call `save()` from `core/js/db.js` multiple times in < 800ms (this is the function with the debounce timer — note: `actionCentreUpdateActionStatus` in `action-centre.js` fires immediately with no debounce).
  - Verify `supa.from().update()` is called exactly ONCE after `jest.advanceTimersByTime(850)`.

- [ ] **3.2: Multi-Project Save Badge Counter**
  - Mark multiple projects dirty via `save('proj-1')`, `save('proj-2')`.
  - Advance timers past 800ms to trigger `saveRemote`.
  - Verify the `pendingSaves` counter decrements correctly and badge text shows `"● saving (N remaining)…"` then `'saved'` when all complete.

- [ ] **3.3: Queue-During-Flush (dirtyProjects Re-queue)**
  - Trigger `save()` and advance past 800ms so `saveRemote` begins.
  - While `saveRemote` is in-flight (mock a slow Supabase response), call `save()` again with new edits.
  - Verify the new edits are captured in a fresh `dirtyProjects` cycle and not lost — because `dirtyProjects` is cleared before the async write, edits during save should queue for the next cycle.

- [ ] **3.4: "Navigate-While-Saving" Race Condition**
  - Trigger a debounced save (call `save()`, don't advance timers yet).
  - Immediately call `navigate('other-section')`.
  - **Discovery test:** Determine whether `navigate()` clears the pending `saveTimer`. If it doesn't, verify that the delayed `saveRemote` doesn't crash on stale DOM (no "Cannot read property of null" errors).
  - Document findings — this may surface a bug to fix rather than just confirm existing behaviour.

- [ ] **3.5: Last-Write-Wins Verification**
  - Mock two rapid updates to the same field with different values.
  - Verify the final state in `appState` matches the *last* intent, not the first one to return from the server.

---

## Phase 4: Data Integrity & Validation ⚪
**Goal:** Ensure malformed data from the DB doesn't crash the frontend.

- [ ] **4.1: Null-Safety on Relational Joins**
  - Create `tests/data-integrity.test.js`.
  - Mock a relational query where a foreign key is null (e.g., an action with no project).
  - Verify the renderer handles the missing parent gracefully (e.g., shows "Unknown Project") instead of throwing a TypeError.

- [ ] **4.2: Date Normalization Edge Cases**
  - **Test both functions:** `capNormalizeIsoDate(dateValue, fallbackDate)` and `capNormalizeDateRange(startDate, endDate, fallbackDate)` from `portals/capacity/shared/js/cap-data-utils.js`.
  - `capNormalizeIsoDate` is where the core edge-case logic lives (NaN handling, empty string, fallback). `capNormalizeDateRange` wraps it and adds start/end swap logic.
  - Test with: invalid date strings, empty strings `''`, `null`, `undefined`, leap year dates (e.g., `'2024-02-29'`), and inverted ranges where end < start.
  - Verify the app defaults to the fallback date rather than returning `NaN` or throwing.

---

## Summary of Success Criteria
1. **Zero Silent Failures:** Every simulated Supabase error must result in a user-facing notification (via `showToast`).
2. **State Consistency:** Failed writes must not update local `appState`. Where optimistic updates exist (NPI relational layer), they must revert on error.
3. **No Memory Leaks:** Subscriptions must be confirmed as removed from the `realtimeSubscriptions` registry in `tests/realtime-payload.test.js`.
4. **Save Integrity:** The 800ms debounce, 1500ms retry, `pendingSaves` counter, and queue-during-flush behaviour must all be verified.
5. **Defensive Data:** Null foreign keys and invalid dates must not crash renderers or produce `NaN` in the UI.
