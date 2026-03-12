// ═══════════════════════════════════════════════════════════════
// realtime.js — Generic real-time sync system for all tables
// Provides reusable subscriptions for instant data updates across users
// Depends on: state.js (supa), navigation.js (render)
// ═══════════════════════════════════════════════════════════════

// Global registry of active subscriptions (for cleanup)
let realtimeSubscriptions = {};

/**
 * Subscribe to real-time changes on a table
 * @param {string} tableName - Database table name
 * @param {string} channelName - Unique channel identifier (e.g., 'me_teams_channel')
 * @param {object} callbacks - Object with INSERT, UPDATE, DELETE handlers
 *   - callbacks.onInsert(payload.new) - fired on INSERT
 *   - callbacks.onUpdate(payload.new) - fired on UPDATE
 *   - callbacks.onDelete(payload.old) - fired on DELETE
 * @param {object} options - Optional configuration
 *   - options.filter - SQL filter string (e.g., 'user_id=eq.123')
 *   - options.events - Event types to listen for (default: ['INSERT', 'UPDATE', 'DELETE'])
 * @returns {object} subscription - Handle for unsubscribing
 */
function createRealtimeSubscription(tableName, channelName, callbacks = {}, options = {}) {
  if (!tableName || !channelName) {
    console.warn('⚠️ createRealtimeSubscription requires tableName and channelName');
    return null;
  }

  // Check if subscription already exists
  if (realtimeSubscriptions[channelName]) {
    console.debug(`ℹ️ Subscription "${channelName}" already active`);
    return realtimeSubscriptions[channelName];
  }

  try {
    const { events = ['INSERT', 'UPDATE', 'DELETE'], filter } = options;

    const subscription = supa
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName,
        ...(filter && { filter })
      }, (payload) => {
        try {
          if (events.includes('INSERT') && payload.eventType === 'INSERT' && callbacks.onInsert) {
            callbacks.onInsert(payload.new);
          }
          if (events.includes('UPDATE') && payload.eventType === 'UPDATE' && callbacks.onUpdate) {
            callbacks.onUpdate(payload.new);
          }
          if (events.includes('DELETE') && payload.eventType === 'DELETE' && callbacks.onDelete) {
            callbacks.onDelete(payload.old);
          }
        } catch (err) {
          console.error(`❌ Error in ${channelName} callback:`, err);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✓ Real-time sync active: ${channelName}`);
        }
      });

    // Store subscription reference for cleanup
    realtimeSubscriptions[channelName] = subscription;
    return subscription;
  } catch (err) {
    console.debug(`⚠️ Could not set up real-time subscription for "${channelName}":`, err);
    return null;
  }
}

/**
 * Unsubscribe from real-time changes
 * @param {string} channelName - The channel name to unsubscribe from
 */
function removeRealtimeSubscription(channelName) {
  if (!channelName || !realtimeSubscriptions[channelName]) return;

  try {
    supa.removeChannel(realtimeSubscriptions[channelName]);
    delete realtimeSubscriptions[channelName];
    console.log(`✓ Real-time sync stopped: ${channelName}`);
  } catch (err) {
    console.debug(`Could not unsubscribe from "${channelName}":`, err);
  }
}

/**
 * Unsubscribe from multiple channels matching a pattern
 * Useful when leaving a portal (e.g., stop all 'me_*' channels)
 * @param {string|RegExp} pattern - Channel name pattern to match
 */
function removeRealtimeSubscriptionsMatching(pattern) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  Object.keys(realtimeSubscriptions).forEach(channelName => {
    if (regex.test(channelName)) {
      removeRealtimeSubscription(channelName);
    }
  });
}

/**
 * Get all active subscriptions (for debugging)
 */
function getActiveRealtimeSubscriptions() {
  return Object.keys(realtimeSubscriptions);
}
