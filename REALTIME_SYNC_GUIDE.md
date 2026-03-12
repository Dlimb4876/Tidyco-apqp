# Real-Time Sync System — Implementation Guide

## Overview

The generic real-time sync system (`utils/js/realtime.js`) provides instant data updates across all users without requiring page refresh. When one user edits data, all other connected users see the change immediately.

**Already Implemented:**
- ✅ Bug Reports (`bug_reports` table)
- ✅ Capacity Utilization Factor (`global_settings` table)

**Ready to Implement:**
- ME Capacity (teams, tasks, products, holidays)
- Production (batches, work areas)
- APQP data (PFMEA, gates, actions, risks)

---

## How to Use

### 1. Basic Real-Time Subscription

In your data layer (e.g., `me-data.js`), set up a subscription like this:

```javascript
function meDataSubscribe() {
  // Subscribe to changes on me_teams table
  createRealtimeSubscription('me_teams', 'me_teams_channel', {
    // Handle new records
    onInsert: (newRecord) => {
      meState.teams.push(newRecord);
      render();
    },
    // Handle updates
    onUpdate: (updated) => {
      const idx = meState.teams.findIndex(t => t.id === updated.id);
      if (idx >= 0) meState.teams[idx] = updated;
      render();
    },
    // Handle deletions
    onDelete: (deleted) => {
      meState.teams = meState.teams.filter(t => t.id !== deleted.id);
      render();
    }
  });
}

function meDataUnsubscribe() {
  removeRealtimeSubscription('me_teams_channel');
}
```

### 2. With Filters (Optional)

If you only want to sync your own records:

```javascript
createRealtimeSubscription('me_teams', 'me_teams_user_channel', {
  onInsert: (newRecord) => { /* ... */ },
  onUpdate: (updated) => { /* ... */ }
}, {
  filter: `user_id=eq.${currentUser.id}`,  // Only your records
  events: ['INSERT', 'UPDATE']  // Skip DELETE events
});
```

### 3. For Global Settings

```javascript
createRealtimeSubscription('global_settings', 'feature_setting_channel', {
  onUpdate: (updated) => {
    if (updated.setting_key === 'my_setting_key') {
      myGlobalState.setting = updated.setting_value;
      render();
    }
  }
}, {
  filter: 'setting_key=eq.my_setting_key',
  events: ['UPDATE']
});
```

---

## Example: Add Real-Time Sync to ME Capacity Teams

### Step 1: Update `me-data.js`

Add these functions to your data initialization:

```javascript
// At the top with other init functions
async function meDataInit() {
  if (!currentUser) return;

  // ... existing data load code ...

  meDataSubscribe();  // ADD THIS LINE
}

// At the bottom, add these functions
function meDataSubscribe() {
  // Teams subscription
  createRealtimeSubscription('me_teams', 'me_teams_channel', {
    onInsert: (newTeam) => {
      meState.teams.push(newTeam);
      render();
    },
    onUpdate: (updated) => {
      const idx = meState.teams.findIndex(t => t.id === updated.id);
      if (idx >= 0) meState.teams[idx] = updated;
      render();
    },
    onDelete: (deleted) => {
      meState.teams = meState.teams.filter(t => t.id !== deleted.id);
      render();
    }
  });

  // Tasks subscription
  createRealtimeSubscription('me_tasks', 'me_tasks_channel', {
    onInsert: (newTask) => {
      meState.tasks.push(newTask);
      render();
    },
    onUpdate: (updated) => {
      const idx = meState.tasks.findIndex(t => t.id === updated.id);
      if (idx >= 0) meState.tasks[idx] = updated;
      render();
    },
    onDelete: (deleted) => {
      meState.tasks = meState.tasks.filter(t => t.id !== deleted.id);
      render();
    }
  });

  // Products subscription
  createRealtimeSubscription('me_products', 'me_products_channel', {
    onInsert: (newProduct) => {
      meState.products.push(newProduct);
      render();
    },
    onUpdate: (updated) => {
      const idx = meState.products.findIndex(p => p.id === updated.id);
      if (idx >= 0) meState.products[idx] = updated;
      render();
    },
    onDelete: (deleted) => {
      meState.products = meState.products.filter(p => p.id !== deleted.id);
      render();
    }
  });

  // Holidays subscription
  createRealtimeSubscription('me_holidays', 'me_holidays_channel', {
    onInsert: (newHoliday) => {
      meState.holidays.push(newHoliday);
      render();
    },
    onUpdate: (updated) => {
      const idx = meState.holidays.findIndex(h => h.id === updated.id);
      if (idx >= 0) meState.holidays[idx] = updated;
      render();
    },
    onDelete: (deleted) => {
      meState.holidays = meState.holidays.filter(h => h.id !== deleted.id);
      render();
    }
  });
}

function meDataUnsubscribe() {
  removeRealtimeSubscription('me_teams_channel');
  removeRealtimeSubscription('me_tasks_channel');
  removeRealtimeSubscription('me_products_channel');
  removeRealtimeSubscription('me_holidays_channel');
}
```

### Step 2: Update `navigation.js`

Add cleanup when leaving the capacity portal (already done for production, copy the pattern):

```javascript
// In the navigate() function, add:
if (currentSection === 'capacity' && sec !== 'capacity') {
  if (typeof meDataUnsubscribe === 'function') meDataUnsubscribe();
  if (typeof prodCapUnsubscribeUtilization === 'function') prodCapUnsubscribeUtilization();
}
```

---

## API Reference

### `createRealtimeSubscription(tableName, channelName, callbacks, options)`

**Parameters:**
- `tableName` (string) — Database table name (required)
- `channelName` (string) — Unique channel identifier (required)
- `callbacks` (object) — Event handlers:
  - `callbacks.onInsert(record)` — Fired when new record inserted
  - `callbacks.onUpdate(record)` — Fired when record updated
  - `callbacks.onDelete(record)` — Fired when record deleted
- `options` (object) — Optional:
  - `options.filter` — SQL filter string (e.g., `'user_id=eq.123'`)
  - `options.events` — Array of event types (default: `['INSERT', 'UPDATE', 'DELETE']`)

**Returns:** subscription object (or null on failure)

### `removeRealtimeSubscription(channelName)`

Unsubscribe from a specific channel.

```javascript
removeRealtimeSubscription('me_teams_channel');
```

### `removeRealtimeSubscriptionsMatching(pattern)`

Unsubscribe from all channels matching a pattern (useful for leaving a portal).

```javascript
removeRealtimeSubscriptionsMatching(/^me_/);  // Remove all ME Capacity subscriptions
removeRealtimeSubscriptionsMatching('production');  // Remove all production subscriptions
```

### `getActiveRealtimeSubscriptions()`

Get list of all active channel names (for debugging).

```javascript
console.log(getActiveRealtimeSubscriptions());
// Output: ['bug_reports_channel', 'me_teams_channel', 'prod_cap_util_channel']
```

---

## Best Practices

1. **Channel Naming** — Use descriptive, unique names:
   - ✅ `me_teams_channel`, `me_tasks_channel`, `bug_reports_channel`
   - ❌ `channel1`, `sub`, `sync`

2. **Cleanup on Navigate** — Always unsubscribe when leaving a portal to prevent memory leaks:
   ```javascript
   if (currentSection === 'myPortal' && sec !== 'myPortal') {
     removeRealtimeSubscriptionsMatching(/^myPortal_/);
   }
   ```

3. **Error Handling** — The system logs errors but doesn't throw. Check console for issues:
   - `✓ Real-time sync active: <channel>` — Success
   - `❌ Error in <channel> callback:` — Callback failed
   - `⚠️ Could not set up real-time subscription` — Subscription failed

4. **Avoid Duplicate Subscriptions** — The system prevents duplicate channels automatically

5. **Filter Efficiently** — Use SQL filters to reduce bandwidth:
   ```javascript
   // Good: Only your records
   { filter: `user_id=eq.${currentUser.id}` }

   // Inefficient: All records, then filter in callback
   // (without filter)
   ```

---

## Debugging

### Check Active Subscriptions
```javascript
console.log(getActiveRealtimeSubscriptions());
```

### Monitor Channel Status
Open browser DevTools → Console, watch for:
- `✓ Real-time sync active: <channel>` (success)
- `✓ Real-time sync stopped: <channel>` (cleanup)
- `⚠️ Could not set up...` (failure — check Supabase realtime is enabled)

### Common Issues

**"Could not set up real-time subscription"**
- Supabase realtime is disabled on your project
- Check Settings → Realtime in Supabase dashboard

**Subscription not firing**
- RLS policy might be blocking changes
- Channel name must be unique per table
- User might not have permission to read the table

**Memory leak on navigation**
- Forgot to call `unsubscribe()` when leaving portal
- Check navigation.js cleanup logic
