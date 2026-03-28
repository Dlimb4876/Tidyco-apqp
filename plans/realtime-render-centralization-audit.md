# Realtime Render Centralization Audit

## Purpose
This document maps the current realtime render behavior across the app so it can be centralized safely in core.

It covers:
- where each realtime render path came from
- what each one does now
- what is different between them
- what should be centralized vs left local

---

## 1) Core realtime primitives already in place

These are the shared low-level building blocks today:

- `utils/js/realtime.js`
  - `createRealtimeSubscription(...)` (`utils/js/realtime.js:23`)
  - `createMultiTableRealtimeSubscription(...)` (`utils/js/realtime.js:136`)
  - `removeRealtimeSubscription(...)` (`utils/js/realtime.js:79`)
  - channel registry via `realtimeSubscriptions` (`utils/js/realtime.js:8`)

- Shared edit/focus helpers
  - `isEditingInlineCell()` (`utils/js/helpers.js:519`)
  - `preserveInputCaretAfterRender(...)` (`utils/js/helpers.js:326`)

Important: today, subscription lifecycle is centralized, but render orchestration is still portal-specific.

---

## 2) Realtime render systems that should be centralized

These have the same pattern family (defer while editing, pending flags, flush on blur, then render/refresh tab).

### A) Capacity domain (most advanced but duplicated)

#### A1. ME Capacity
- Realtime state/apply:
  - `meApplyRealtimeStateChange()` (`portals/capacity/me/js/me-data-realtime.js:69`)
  - sets `window.mePendingRealTimeUpdate` when editing/filter focused (`...:70-72`)
  - debounced render via 150ms timer (`...:67`, `...:76-79`)
- Save-triggered deferred rerender:
  - `window.mePendingRerender` and `meDebouncedSave()` (`portals/capacity/me/js/me-capacity.js:12-13`, `...:287-308`)
- Chart-special behavior:
  - `meCapSmartRender()` marks chart dirty instead of immediate redraw (`portals/capacity/me/js/me-capacity.js:57-63`)

#### A2. PM Capacity
- Realtime apply:
  - `pmApplyRealtimeRender()` (`portals/capacity/project-management/js/pm-data.js:660`)
  - defer while editing or filter-focused (`...:671-675`)
  - 150ms coalescing (`...:661-664`)
- Save deferred rerender:
  - `pmDebouncedSave()` and `window.pmPendingRerender` (`portals/capacity/project-management/js/pm-capacity.js:285-301`)
- Chart-special behavior:
  - `pmCapSmartRender()` (`.../pm-capacity.js:12-19`)

#### A3. Logistics Capacity
- Realtime apply:
  - `logApplyRealtimeRender()` (`portals/capacity/logistics/js/log-data.js:720`)
  - defer while editing or filter-focused (`...:731-735`)
  - 150ms coalescing (`...:721-724`)
- Save deferred rerender:
  - `logDebouncedSave()` and `window.logPendingRerender` (`portals/capacity/logistics/js/log-capacity.js:277-291`)
- Chart-special behavior:
  - `logCapSmartRender()` (`.../log-capacity.js:12-18`)

#### A4. Unit 6 Capacity
- Realtime apply:
  - `unit6ApplyRealtimeRender()` (`portals/capacity/unit6/js/unit6-data.js:720`)
  - defer while editing or filter-focused (`...:731-735`)
  - 150ms coalescing (`...:721-724`)
- Save deferred rerender:
  - `unit6DebouncedSave()` and `window.unit6PendingRerender` (`portals/capacity/unit6/js/unit6-capacity.js:277-291`)
- Chart-special behavior:
  - `unit6CapSmartRender()` (`.../unit6-capacity.js:12-18`)

#### A5. Capacity shared focusout flush hub
- Single flush router currently in:
  - `window.capacityEvents._onFocusOut` (`portals/capacity/js/capacity-events.js:1396`)
- Flushes:
  - ME pending realtime/save-rerender
  - PM pending realtime/save-rerender
  - LOG pending realtime/save-rerender
  - UNIT6 pending realtime/save-rerender
  - Production-capacity pending realtime (`...:1404-1469`)

This is the closest current shape to a reusable core scheduler.

#### A6. Capacity Production
- Realtime defer:
  - `window.prodCapPendingRealTimeUpdate` in `prod-capacity-data.js` (`portals/capacity/production/js/prod-capacity-data.js:77,100,110,118`)
- Uses tab-level refresh:
  - `prodCapRefreshCurrentTab()` (`portals/capacity/production/js/prod-capacity.js:81`)
- Also has realtime via global settings in same pattern:
  - `prodCapSubscribeUtilization()` (`.../prod-capacity-data.js:70-85`)

---

### B) NPI

- Realtime setup and per-event deferral:
  - `npiScheduleReload()` + project/table subscriptions (`portals/product-development/npi/js/npi.js:180-255`)
  - sets `window.npiPendingRealTimeUpdate` when editing (`...:185-187`, `...:219`, `...:227`, `...:240`)
- Focusout flush:
  - `npi.events._onFocusOut` (`portals/product-development/npi/js/npi-events.js:322-333`)
- Also uses caret-preservation for search rerenders:
  - (`.../npi-events.js:246-247`)

NPI is functionally similar to Capacity but uses full `render()` more often.

---

### C) Production portal (non-capacity)

- Realtime deferral in data handlers:
  - `window.prodPendingRealTimeUpdate` set in `production/js/data.js` (`...:370,382,406,421,433,443`)
- Focusout flush:
  - in `production/js/production.js` (`...:193-204`)
- Tab-body refresh:
  - `prodRefreshCurrentTab()` (`.../production.js:208-216`)

Again, same shape: defer while editing -> flush after blur -> refresh tab body.

---

### D) Operations dashboard

- Realtime consolidation and scheduling:
  - `opsScheduleRefresh(...)` (`portals/operations/js/operations-dashboard-realtime.js:5-25`)
  - uses timer map (`opsRefreshTimers`) and sets `opsPendingRealTimeUpdate` when editing (`...:17-19`)
- Multi-table consolidated subscriptions:
  - three grouped channels (`...:121-183`)
- Focusout flush:
  - `operations-dashboard-main.js` (`...:69-80`)
- Tab-body refresh helper:
  - `opsRefreshCurrentTab()` (`operations-dashboard-realtime.js:28-48`)

Operations already has a mini scheduler that overlaps with what core centralization should become.

---

## 3) Realtime modules that likely stay local (not part of render scheduler centralization)

These use realtime but are patch-driven or section-gated without edit-defer complexity:

- `portals/product-development/js/families-data.js` (DOM patch insert/update/delete)
- `portals/product-development/js/family-templates-data.js` (patch + selective render)
- `portals/product-development/product-management/js/products-data.js` (section-aware render refresh)
- `portals/product-development/parts-database/js/parts-database.js` (refresh result list)
- `portals/feedback/js/feedback-data.js` (section-aware content refresh)
- `portals/capacity/production/js/work-areas-data.js` (settings table patch)

These can keep using core subscription APIs directly; they do not need the full deferred-render scheduler unless they later add inline-edit heavy tables.

---

## 4) What is different today (gap matrix)

1. **Debounce/coalescing**
- ME/PM/LOG/UNIT6 realtime: yes (150ms)
- NPI: reload debounce exists (600ms), but render path differs by event
- Production: mixed; some immediate row/section refresh
- Operations: scheduler timer map (default 120ms)

2. **Deferred conditions**
- ME/PM/LOG/UNIT6: editing + specific filter-focus guards
- NPI: editing guard only for deferred render
- Production: editing guard only
- Operations: editing guard only

3. **Pending flags**
- Capacity: `*PendingRealTimeUpdate` + `*PendingRerender` in some tabs
- NPI: `npiPendingRealTimeUpdate`
- Production: `prodPendingRealTimeUpdate` and `prodCapPendingRealTimeUpdate`
- Operations: `opsPendingRealTimeUpdate`

4. **Flush ownership**
- Capacity: centralized flush in one file (`capacity-events.js`)
- NPI: own flush in `npi-events.js`
- Production: own flush in `production.js`
- Operations: own flush in `operations-dashboard-main.js`

5. **Render target**
- Some call full `render()`
- Some patch tab body only (`*RefreshCurrentTab`)
- Some patch single rows (`realtimePatchUpdate/Insert/Delete`)

6. **Chart handling**
- Capacity streams have explicit `chartDirty` and smart-render callbacks
- Other portals do not consistently expose this concept

---

## 5) Centralization boundary (recommended)

Centralize in core:
- deferred render scheduler contract:
  - `requestRender(key, { renderNow, isEditing, isFilterFocused, debounceMs, onDefer })`
  - `flushDeferred(key)`
  - optional `flushAllInScope(scopeKey)`
- consistent pending-state handling (internal map instead of scattered globals)
- optional focusout helper binder for table-edit screens

Keep local:
- portal-specific tab refresh functions (`pmRefreshCurrentTab`, `prodRefreshCurrentTab`, etc.)
- chart dirty semantics (`markChartDirty`)
- row patch strategies for lightweight settings modules

---

## 6) Migration order (safe)

1. Add core scheduler utility (no behavior change yet).
2. Migrate Capacity first (ME/PM/LOG/UNIT6 + prod-cap), because patterns are already aligned.
3. Migrate NPI to same scheduler contract.
4. Migrate Production and Operations.
5. Leave patch-based modules on current simple realtime paths unless needed.

---

## 7) Net result expected

- One consistent user experience while editing (no flicker/cursor ejection).
- Less duplicate pending/debounce code.
- Safer future realtime features (single tested scheduler logic).
- Easier debugging: one place for deferred-render behavior.

