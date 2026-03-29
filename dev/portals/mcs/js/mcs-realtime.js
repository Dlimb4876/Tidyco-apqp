/**
 * MCS Real-time Subscriptions
 * Handles live updates to MCS changes
 */

import { appState } from '../../../core/js/state.js'
import { supabase } from '../../../core/js/supa.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../utils/js/realtime.js'
import { requestRender } from '../../../utils/js/render-scheduler.js'
import { realtimePatchDelete, realtimePatchInsert, realtimePatchUpdate } from '../../../utils/js/realtime-patch.js'
import { mcsParseExtendedJustification } from './mcs-modal-shared.js'
import { mcsRenderCardHTML, mcsRenderList, mcsUpdateCounts, mcsToast, mcStatusLabel } from './mcs-main.js'
import { mcsShowViewModal } from './mcs-modal-view.js'

let mcsChangesSubscription = null;
let mcsTimelineSubscription = null;

/**
 * Setup MCS real-time subscriptions
 */
export function mcsDataSubscribe() {
  if (!supabase) {
    console.warn('Supabase not initialized for MCS realtime');
    return;
  }

  mcsChangesSubscription = createRealtimeSubscription('mcs_changes', 'mcs_changes_channel', {
    onInsert: newRecord => handleMcsChangesUpdate({ eventType: 'INSERT', new: newRecord }),
    onUpdate: newRecord => handleMcsChangesUpdate({ eventType: 'UPDATE', new: newRecord }),
    onDelete: oldRecord => handleMcsChangesUpdate({ eventType: 'DELETE', old: oldRecord })
  });

  mcsTimelineSubscription = createRealtimeSubscription('mcs_timeline', 'mcs_timeline_channel', {
    onInsert: timelineEntry => handleMcsTimelineUpdate({ new: timelineEntry })
  }, { events: ['INSERT'] });
}

/**
 * Handle mcs_changes updates
 */
function handleMcsChangesUpdate(payload) {
  if (!payload) return;

  const { eventType, new: newRecord, old: oldRecord } = payload;

  if (eventType === 'INSERT') {
    // New change added — prepend for newest-first default sort.
    // If a non-default sort is active, fall back to full list re-render.
    appState.mcsList.unshift(newRecord);
    const sortKey = document.getElementById('mcs-sort-select')?.value || 'date-desc';
    if (sortKey === 'date-desc') {
      realtimePatchInsert('#mcs-list-container', mcsRenderCardHTML(newRecord), { prepend: true });
      mcsUpdateCounts();
    } else {
      mcsRenderList();
    }
    mcsToast('New change added: ' + newRecord.id);
  } else if (eventType === 'UPDATE') {
    // Change updated
    const idx = appState.mcsList.findIndex(c => c.id === newRecord.id);
    if (idx !== -1) {
      // Preserve client-side-only fields (impacts, timeline) that aren't in the DB row
      const existing = appState.mcsList[idx];
      const parsedJustification = mcsParseExtendedJustification(newRecord.justification || '');
      appState.mcsList[idx] = {
        ...newRecord,
        impacts: existing.impacts || [],
        impact_progress: newRecord.impact_progress && typeof newRecord.impact_progress === 'object'
          ? newRecord.impact_progress
          : (parsedJustification.impactProgress || existing.impact_progress || {}),
        timeline: existing.timeline || []
      };

      // Only refresh the open modal — don't auto-reopen a modal the user has closed.
      // mcsViewingId is cleared by mcsCloseModal, so a null here means no modal is open.
      if (appState.mcsViewingId === newRecord.id && document.getElementById('mcs-view-backdrop')) {
        mcsShowViewModal(appState.mcsList[idx]);
      }

      // Patch the card if it's currently visible in the list; otherwise run full re-render
      // in case filter/sort changes made it appear or disappear.
      const cardInDOM = document.querySelector(`#mcs-list-container [data-id="${CSS.escape(String(newRecord.id))}"]`);
      if (cardInDOM) {
        realtimePatchUpdate('#mcs-list-container', newRecord.id, mcsRenderCardHTML(appState.mcsList[idx]));
        mcsUpdateCounts();
      } else {
        mcsRenderList();
      }
    }
  } else if (eventType === 'DELETE') {
    // Change deleted
    appState.mcsList = appState.mcsList.filter(c => c.id !== oldRecord.id);
    realtimePatchDelete('#mcs-list-container', oldRecord.id);
    mcsUpdateCounts();
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
  if (appState.mcsViewingId === timelineEntry.change_id) {
    const change = appState.mcsList.find(c => c.id === appState.mcsViewingId);
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
export function mcsDataUnsubscribe() {
  if (mcsChangesSubscription) {
    removeRealtimeSubscription('mcs_changes_channel');
    mcsChangesSubscription = null;
  }
  if (mcsTimelineSubscription) {
    removeRealtimeSubscription('mcs_timeline_channel');
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
        appState.mcsList = data;
        requestRender('mcs', {
          trigger: 'realtime',
          renderNow: () => mcsRenderList()
        });
      }
    } catch (err) {
      console.error('MCS poll error:', err);
    }
  }, 10000);
}

export function mcsStopPolling() {
  if (mcsPollInterval) {
    clearInterval(mcsPollInterval);
    mcsPollInterval = null;
  }
}
