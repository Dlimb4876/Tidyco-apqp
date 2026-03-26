# Plan: Capacity Isolated Streams - Bug Fixes & Feature Parity

**Date:** 2026-03-24
**Status:** Implemented (2026-03-24)
**Priority:** High (Addresses data corruption and UI thrashing)

## Overview
The recent architectural split successfully isolated PM, Logistics, and Unit 6 into their own relational tables (`pm_*`, `log_*`, `unit6_*`). However, recent ME enhancements (Product Support History editing/deletion and Real-Time Focus Guards) were not fully propagated to these isolated streams. This plan details the steps required to close these gaps and resolve the resulting bugs.

---

## Phase 1: Fix Event Routing & Real-Time DOM Thrashing (Quick Wins)

### 1. Fix History Edit Routing for PM (`me-products.js`)
* **Bug:** Editing a historical support rate in the PM tab saves the data to the ME database.
* **Action:** In `meProductsSaveHistoryEdit`, add the missing branch to check if `department === 'PM'` and route the update to `window.pmDataUpdateProductSupportHistoryEntry`.

### 2. Fix History Deletion Routing (`capacity-events.js`)
* **Bug:** Clicking "Delete" on a support history row in PM, LOG, or UNIT6 hardcodes a call to ME's delete function.
* **Action:** Update the `cap-products-delete-history` case in `capacity-events.js` to evaluate `contextType` and route the deletion to the appropriate isolated data layer (`pmDataDelete...`, `logDataDelete...`, etc.).

### 3. Implement Real-Time Focus Guards (`*-data.js`)
* **Bug:** If a user is typing in a cell (e.g., changing hours) and a real-time sync or background save completes, the DOM instantly re-renders, stealing focus and wiping out their typing.
* **Action:** Inject the `isEditingInlineCell()` check into the `onInsert`, `onUpdate`, and `onDelete` callbacks of `createMultiTableRealtimeSubscription`.
* **Files to Update:**
  * [ ] `pm-data.js`
  * [ ] `log-data.js`
  * [ ] `unit6-data.js`
* **Code Pattern:**
  ```javascript
  if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) { 
    window.[stream]PendingRealTimeUpdate = true; return; 
  }
  if (typeof [stream]CapSmartRender === 'function') [stream]CapSmartRender();
  ```

---

## Phase 2: Missing Support History CRUD Implementation

To support the routing fixes in Phase 1, the isolated data layers need the actual functions to handle deleting and editing history.

### 1. Implement Support History Deletion (`*-data.js` & `*-data-relational.js`)
* **Action:** Add `*DataDeleteProductSupportHistoryEntry(historyId)` to the isolated data layers.
* **Action:** Add the `supportHistory` array to `*DataPendingDeletes` objects.
* **Action:** Add `*DeleteSupportHistoryRelational(historyId)` to the relational DB files.
* **Action:** Update `*DataSave()` to loop through `pendingDeletes.supportHistory` and execute the relational deletes before clearing the queue.
* **Files to Update:**
  * [ ] `pm-data.js` & `pm-data-relational.js`
  * [ ] `log-data.js` & `log-data-relational.js`
  * [ ] `unit6-data.js` & `unit6-data-relational.js`

### 2. Implement Missing PM Update Function (`pm-data.js`)
* **Bug:** `pm-data.js` completely lacks the `pmDataUpdateProductSupportHistoryEntry` function (which LOG and UNIT6 already have).
* **Action:** Port `meDataUpdateProductSupportHistoryEntry` logic over to `pm-data.js`, ensuring it references `pmDataState` and `pmNormalizeAndDedupeSupportHistory`.

---

## Phase 3: Resolve Minor Quirks & Refactoring

### 1. Fix Auto-Sync Bypassing Debounce (`*-capacity.js`)
* **Quirk:** The auto-sync triggers `setTimeout(() => *DataSave(false), 1000)` directly. If the user edits a task within that 1 second, it creates a race condition with the debounce queue.
* **Action:** Change the auto-sync completion logic to invoke `*DebouncedSave()` instead of calling the save function directly.
* **Files to Update:**
  * [ ] `pm-capacity.js` (`pmDataAutoSyncPMProducts`)
  * [ ] `log-capacity.js` (`logDataAutoSyncLogProducts`)
  * [ ] `unit6-capacity.js` (`unit6DataAutoSyncUnit6Products`)
  * [ ] `me-capacity.js` (`meDataAutoSyncProductionProducts`)

### 2. Clean Up Redundant Event Bindings (`capacity.js` & `capacity-events.js`)
* **Quirk:** Top-level capacity tab navigation (`cap-nav-tab`, `cap-hub-tab`) is currently bound twice—once in `setupCapacityPortalDelegation()` (`capacity.js`) and once in `window.capacityEvents._onClick` (`capacity-events.js`).
* **Action:** Consolidate event handling. Since `capacity-events.js` is the global router for the app's inner content, remove the duplicate handler from `capacity.js` to prevent double-firing.

---

## Testing Strategy

1. **Real-Time Guard Test:** Open PM tasks in two browser windows. Edit a task name in Window A without blurring. Change a totally different task in Window B. Verify Window A does not lose focus.
2. **History Edit Routing Test:** In PM Product Support, edit an existing history entry. Check the Supabase `pm_product_support_history` table to ensure the change persisted, and verify `me_product_support_history` was untouched.
3. **History Delete Routing Test:** Delete a history entry in Logistics. Reload the page. Verify the entry remains deleted and doesn't resurrect.

## Implementation Notes (2026-03-24)
- Implemented PM edit routing in `meProductsSaveHistoryEdit` to call `pmDataUpdateProductSupportHistoryEntry`.
- Replaced hardcoded ME history delete path in `capacity-events.js` with stream-aware dispatch (`pm`, `log`, `unit6`, `me`).
- Added missing isolated support-history CRUD delete flow in PM/LOG/Unit 6 data layers and relational helpers.
- Added `supportHistory` pending-delete queues in PM/LOG/Unit 6 and wired save-time relational delete processing.
- Added realtime focus guards to PM/LOG/Unit 6 subscription callbacks to defer rerenders while inline editing.
- Switched autosync completion persistence to `*DebouncedSave()` for ME/PM/LOG/Unit 6.
- Removed duplicate `cap-nav-tab` / `cap-hub-tab` click handling from `capacity.js`; retained centralized routing in `capacity-events.js`.
- Added routing regressions in `tests/capacity-events.test.js` and updated `tests/capacity-hub.test.js` to match deduplicated event ownership.
- Validation: `npm test` passed (63 suites, 807 tests). `npm run check:all` passed.