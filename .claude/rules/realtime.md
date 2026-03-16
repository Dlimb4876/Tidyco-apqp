# Real-time Subscriptions

## Subscription Management
Real-time subscriptions live in `utils/js/realtime.js`. All subscriptions require cleanup to prevent memory leaks and orphaned listeners.

## Creating Subscriptions
Use the `createRealtimeSubscription()` helper:

```javascript
const ref = createRealtimeSubscription('table_name', 'event_type', (payload) => {
  // Handle update
  console.log('Change received:', payload);
});
```

## Cleanup Pattern
**Always store the subscription reference** and remove it before navigating:

```javascript
let mySubscription = null;

function setupPage() {
  mySubscription = createRealtimeSubscription('table_name', 'INSERT', handleInsert);
}

function cleanupPage() {
  if (mySubscription) {
    removeRealtimeSubscription(mySubscription);
    mySubscription = null;
  }
}
```

## Using navigate()
The `navigate()` function automatically handles subscription cleanup:

```javascript
navigate('capacity', { ct: 'me' });
// This calls removeRealtimeSubscription() for you
```

**Best practice**: Use `navigate()` for page transitions. Only manually call `removeRealtimeSubscription()` if you're not routing to a new page.

## Event Types
Supabase real-time supports:
- `INSERT` — new row added
- `UPDATE` — existing row modified
- `DELETE` — row removed
- `*` — all events

## Performance Considerations
- Unsubscribe from tables you're no longer viewing
- Don't create multiple subscriptions to the same table
- Limit the number of active subscriptions (typically ≤5 per page)

## Error Handling
Handle subscription errors gracefully:

```javascript
const ref = createRealtimeSubscription('table_name', 'INSERT',
  (payload) => { /* success handler */ },
  (error) => { /* error handler */ }
);
```

If subscription fails, fall back to manual polling or retry logic.
