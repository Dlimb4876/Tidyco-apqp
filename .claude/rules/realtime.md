# Real-time Subscriptions

## Two-layer model

Every table-edit portal uses two layers:

1. **Subscription layer** (`utils/js/realtime.js`) — connects to Supabase and fires callbacks on row changes.
2. **Render scheduler** (`utils/js/render-scheduler.js`) — decides *when* it is safe to re-render after a change arrives.

Always use both together. Never set a `window.*Pending*` global or write your own debounce timer — that is what the scheduler replaces.

---

## Render scheduler

### API

```javascript
// Request a render. The scheduler defers it if the user is editing.
requestRender(key, {
  trigger,     // 'realtime' | 'save'
  renderNow,   // () => void — always pulls fresh data; called when safe
  isEditing,   // boolean — true when an inline cell is active
  isFiltering, // boolean — true when a filter/search input has focus (optional)
  debounceMs,  // coalescing window in ms — default 150, use 0 for immediate
});

// Flush any deferred render for this key immediately.
// Call from your portal's focusout handler.
flushDeferred(key);
```

### Rules

- `key` is a short stable string per portal: `'me'`, `'pm'`, `'log'`, `'unit6'`, `'npi'`, `'prod'`, `'ops'`.
- `renderNow` must always pull the latest data — it ignores the triggering event.
- Use `trigger: 'realtime'` for remote Supabase events; `trigger: 'save'` after a local save completes.
- The scheduler logs to the console when a render is deferred so you can see what is waiting and why.
- Charts redraw on page open only — do not pass a chart-draw function as `renderNow`.

### When a render is deferred

The scheduler logs:
```
[Scheduler] Render deferred (realtime) — you are editing this table [key: me]
[Scheduler] Render deferred (save) — your save is pending render [key: me]
```

When the user blurs out of the table, call `flushDeferred(key)` to trigger the pending render immediately.

---

## Adding realtime to a new portal

### 1. Subscribe to your tables

Use `createRealtimeSubscription` or `createMultiTableRealtimeSubscription`:

```javascript
window.myPortalDataSubscribe = function() {
  if (!currentUser) return;

  createRealtimeSubscription('my_table', 'my_channel', {
    onInsert: (row) => {
      // 1. Update local state
      myState.items.push(normalizeRow(row));
      // 2. Request a render — scheduler handles defer/flush
      requestRender('myportal', {
        trigger: 'realtime',
        renderNow: myRefreshCurrentTab,
        isEditing: isEditingInlineCell(),
        isFiltering: myIsFilterFocused(),
        debounceMs: 150,
      });
    },
    onUpdate: (row) => {
      const idx = myState.items.findIndex(i => i.id === row.id);
      if (idx >= 0) myState.items[idx] = normalizeRow(row);
      requestRender('myportal', {
        trigger: 'realtime',
        renderNow: myRefreshCurrentTab,
        isEditing: isEditingInlineCell(),
        isFiltering: myIsFilterFocused(),
        debounceMs: 150,
      });
    },
    onDelete: (row) => {
      myState.items = myState.items.filter(i => i.id !== row.id);
      requestRender('myportal', {
        trigger: 'realtime',
        renderNow: myRefreshCurrentTab,
        isEditing: isEditingInlineCell(),
        debounceMs: 150,
      });
    },
  });
};
```

### 2. Flush on focusout

In your portal's event delegation setup, add a focusout listener:

```javascript
container.addEventListener('focusout', function(evt) {
  const nextFocus = evt.relatedTarget;
  if (nextFocus && nextFocus.closest('table')) return; // moving between cells — skip
  if (typeof flushDeferred === 'function') flushDeferred('myportal');
});
```

### 3. Flush after a save

After your debounced save completes, request a render with `trigger: 'save'`:

```javascript
function myDebouncedSave() {
  clearTimeout(mySaveTimer);
  mySaveTimer = setTimeout(async () => {
    await myDataSave();
    requestRender('myportal', {
      trigger: 'save',
      renderNow: myRefreshCurrentTab,
      isEditing: isEditingInlineCell(),
    });
  }, 800);
}
```

### 4. Unsubscribe on teardown

```javascript
window.myPortalDataUnsubscribe = function() {
  removeRealtimeSubscription('my_channel');
};
```

Call `myPortalDataUnsubscribe()` from your portal's cleanup path, or use `navigate()` which handles it automatically.

---

## What NOT to do

| Do not | Use instead |
|--------|------------|
| `window.myPendingRealTimeUpdate = true` | `requestRender(..., { isEditing: true })` |
| `window.myPendingRerender = true` | `requestRender(..., { trigger: 'save', isEditing: true })` |
| Manual `clearTimeout` / `setTimeout` debounce | `requestRender` with `debounceMs` |
| `myCapSmartRender()` chart-dirty pattern | Pass a `renderNow` that skips chart tab; charts redraw on page open |
| `myShouldDeferRealtimeRender()` local helper | Pass `isEditing`/`isFiltering` directly to `requestRender` |

---

## Portals that stay on simple realtime paths (no scheduler)

These use patch-driven or section-gated updates without inline-edit complexity. They call `createRealtimeSubscription` directly and handle DOM patches themselves:

- `portals/product-development/js/families-data.js`
- `portals/product-development/js/family-templates-data.js`
- `portals/product-development/product-management/js/products-data.js`
- `portals/product-development/parts-database/js/parts-database.js`
- `portals/feedback/js/feedback-data.js`
- `portals/capacity/production/js/work-areas-data.js`
- `portals/capacity/production/js/prod-capacity-data.js` (uses tab-refresh, excluded from scheduler by design)

Only add the scheduler if your portal has inline-editable tables where realtime events could eject the user's cursor.

---

## Performance limits

- Keep active subscriptions to ≤5 per page.
- Use `createMultiTableRealtimeSubscription` to group related tables into one channel.
- Prefer `debounceMs: 150` for burst coalescing; use `debounceMs: 0` only when data is pre-loaded before `renderNow` is called.
