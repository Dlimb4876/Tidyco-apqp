// ═══════════════════════════════════════════════════════════════
// realtime.js — Generic real-time sync system for all tables
// Provides reusable subscriptions for instant data updates across users
// Depends on: state.js (supa), navigation.js (render)
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../../core/js/supa.js';

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
export function createRealtimeSubscription(tableName, channelName, callbacks = {}, options = {}) {
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

    const subscription = supabase
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
        }
      });

    // Store subscription reference for cleanup
    realtimeSubscriptions[channelName] = subscription;
    updateRealtimeIndicator(); // Update bottombar
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
export function removeRealtimeSubscription(channelName) {
  if (!channelName || !realtimeSubscriptions[channelName]) return;

  try {
    supabase.removeChannel(realtimeSubscriptions[channelName]);
    delete realtimeSubscriptions[channelName];
    updateRealtimeIndicator(); // Update bottombar
  } catch (err) {
    console.debug(`Could not unsubscribe from "${channelName}":`, err);
  }
}

/**
 * Unsubscribe from multiple channels matching a pattern
 * Useful when leaving a portal (e.g., stop all 'me_*' channels)
 * @param {string|RegExp} pattern - Channel name pattern to match
 */
export function removeRealtimeSubscriptionsMatching(pattern) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  Object.keys(realtimeSubscriptions).forEach(channelName => {
    if (regex.test(channelName)) {
      removeRealtimeSubscription(channelName);
    }
  });
  updateRealtimeIndicator(); // Update bottombar once after all removals
}

/**
 * Get all active subscriptions (for debugging)
 */
export function getActiveRealtimeSubscriptions() {
  return Object.keys(realtimeSubscriptions);
}

/**
 * Update the bottombar realtime subscription counter
 */
export function updateRealtimeIndicator() {
  const el = document.getElementById('bottombarRealtime');
  if (!el) return;
  const count = Object.keys(realtimeSubscriptions).length;
  el.textContent = `⟳ ${count} subscription${count !== 1 ? 's' : ''}`;
}

// ── 3-B: Multi-table channel helper ──────────────────────────
/**
 * Subscribe to real-time changes on multiple tables using a single
 * Supabase channel.  This reduces the number of WebSocket channels
 * (and therefore Supabase concurrent-connection count) when several
 * tables all trigger the same refresh logic.
 *
 * @param {Array<{table: string, onInsert?: Function, onUpdate?: Function, onDelete?: Function}>} tableConfigs
 *   Array of per-table callback objects.  Each entry MUST have a `table`
 *   field.  Callbacks receive the same payload shapes as createRealtimeSubscription.
 * @param {string} channelName - Unique identifier for the consolidated channel.
 * @returns {object|null} Supabase channel subscription handle.
 */
export function createMultiTableRealtimeSubscription(tableConfigs, channelName) {
  if (!Array.isArray(tableConfigs) || tableConfigs.length === 0 ||
      !channelName || typeof channelName !== 'string') {
    console.warn('⚠️ createMultiTableRealtimeSubscription: invalid arguments');
    return null;
  }

  if (realtimeSubscriptions[channelName]) {
    console.debug(`ℹ️ Multi-table subscription "${channelName}" already active`);
    return realtimeSubscriptions[channelName];
  }

  try {
    let channel = supabase.channel(channelName);

    tableConfigs.forEach(({ table, onInsert, onUpdate, onDelete }) => {
      if (!table) return;
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
            if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
            if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
          } catch (err) {
            console.error(`❌ Error in ${channelName}/${table} callback:`, err);
          }
        }
      );
    });

    const subscription = channel.subscribe();
    realtimeSubscriptions[channelName] = subscription;
    return subscription;
  } catch (err) {
    console.debug(`⚠️ Could not set up multi-table subscription "${channelName}":`, err);
    return null;
  }
}
