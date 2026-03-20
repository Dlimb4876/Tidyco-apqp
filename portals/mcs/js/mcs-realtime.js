/**
 * MCS Real-time Subscriptions
 * Handles live updates to MCS changes
 */

let mcsChangesSubscription = null;
let mcsTimelineSubscription = null;

/**
 * Setup MCS real-time subscriptions
 */
function mcsSetupRealtimeSubscriptions() {
  if (!supabase) {
    console.warn('Supabase not initialized for MCS realtime');
    return;
  }

  // Subscribe to mcs_changes table for INSERT/UPDATE/DELETE events
  mcsChangesSubscription = supabase
    .channel('mcs_changes_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mcs_changes'
      },
      (payload) => {
        handleMcsChangesUpdate(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('MCS changes subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('MCS changes subscription error');
      }
    });

  // Subscribe to mcs_timeline for new activity log entries
  mcsTimelineSubscription = supabase
    .channel('mcs_timeline_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mcs_timeline'
      },
      (payload) => {
        handleMcsTimelineUpdate(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('MCS timeline subscription active');
      }
    });
}

/**
 * Handle mcs_changes updates
 */
function handleMcsChangesUpdate(payload) {
  if (!payload) return;

  const { eventType, new: newRecord, old: oldRecord } = payload;

  if (eventType === 'INSERT') {
    // New change added
    mcsList.unshift(newRecord);
    mcsRenderList();
    mcsToast('New change added: ' + newRecord.id);
  } else if (eventType === 'UPDATE') {
    // Change updated
    const idx = mcsList.findIndex(c => c.id === newRecord.id);
    if (idx !== -1) {
      mcsList[idx] = newRecord;

      // If we're viewing this change, update modal
      if (mcsViewingId === newRecord.id) {
        mcsShowViewModal(newRecord);
      }

      mcsRenderList();
    }
  } else if (eventType === 'DELETE') {
    // Change deleted
    mcsList = mcsList.filter(c => c.id !== oldRecord.id);
    mcsRenderList();
    mcsToast('Change deleted: ' + oldRecord.id);
  }
}

/**
 * Handle mcs_timeline updates
 */
function handleMcsTimelineUpdate(payload) {
  if (!payload || !payload.new) return;

  const timelineEntry = payload.new;

  // If we're viewing the change this timeline entry belongs to, refresh
  if (mcsViewingId === timelineEntry.change_id) {
    const change = mcsList.find(c => c.id === mcsViewingId);
    if (change) {
      change.timeline = change.timeline || [];
      change.timeline.push(timelineEntry);
      mcsShowViewModal(change);
    }
  }
}

/**
 * Cleanup MCS subscriptions
 */
function mcsCleanupRealtimeSubscriptions() {
  if (mcsChangesSubscription) {
    supabase.removeChannel(mcsChangesSubscription);
    mcsChangesSubscription = null;
  }
  if (mcsTimelineSubscription) {
    supabase.removeChannel(mcsTimelineSubscription);
    mcsTimelineSubscription = null;
  }
}

/**
 * Polling fallback for when subscriptions fail
 * Polls for updates every 10 seconds
 */
let mcsPollInterval = null;

function mcsStartPolling() {
  if (mcsPollInterval) clearInterval(mcsPollInterval);

  mcsPollInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase
        .from('mcs_changes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('MCS polling error:', error);
        return;
      }

      // Check for new/updated records
      if (data) {
        mcsList = data;
        mcsRenderList();
      }
    } catch (err) {
      console.error('MCS poll error:', err);
    }
  }, 10000);
}

function mcsStopPolling() {
  if (mcsPollInterval) {
    clearInterval(mcsPollInterval);
    mcsPollInterval = null;
  }
}
