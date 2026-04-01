// ═══════════════════════════════════════════════════════════════
// work-areas-data.js — Work Areas Data Layer
// Manages work areas (Unit 2, Unit 3, Unit 6, etc.) with Supabase persistence
// ═══════════════════════════════════════════════════════════════

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { appState } from '../../../../core/js/state.js'
import { esc, showToast } from '../../../../utils/js/helpers.js'
import { render } from '../../../../utils/js/navigation.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../../utils/js/realtime.js'

export const workAreasState = {
  workAreas: [],
  loading: false,
  error: null
}

// ── Initialize work areas from Supabase ──────────────────────────
export async function workAreasDataInit() {
  workAreasState.loading = true;
  workAreasState.error = null;

  try {
    const { data, error } = await supa.from('work_areas')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;

    workAreasState.workAreas = data || [];
    workAreasState.loading = false;
    workAreasDataSubscribe();
    return workAreasState.workAreas;
  } catch (err) {
    console.error('❌ Error loading work areas:', err);
    workAreasState.error = err.message;
    workAreasState.loading = false;
    return [];
  }
}

// ── Add a new work area ──────────────────────────────────────────
export async function workAreasDataAddWorkArea(name, description) {
  if (!name) return null;

  const workArea = {
    user_id: currentUser.id,
    name: name.trim(),
    description: description ? description.trim() : null
  };

  try {
    const { data, error } = await supa.from('work_areas')
      .insert([workArea])
      .select();

    if (error) throw error;

    if (data && data[0]) {
      workAreasState.workAreas.push(data[0]);
      workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
      return data[0];
    }
  } catch (err) {
    console.error('Error adding work area:', err);
    showToast('Failed to add work area: ' + err.message, 'error');
  }
  return null;
}

// ── Update a work area ───────────────────────────────────────────
export async function workAreasDataUpdateWorkArea(workAreaId, updates) {
  const workArea = workAreasState.workAreas.find(w => w.id === workAreaId);
  if (!workArea) return false;

  try {
    const { error } = await supa.from('work_areas')
      .update(updates)
      .eq('id', workAreaId);

    if (error) throw error;

    Object.assign(workArea, updates);
    workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
    return true;
  } catch (err) {
    console.error('Error updating work area:', err);
    showToast('Failed to update work area: ' + err.message, 'error');
  }
  return false;
}

// ── Soft-delete (archive) a work area ────────────────────────────
export async function workAreasDataDeleteWorkArea(workAreaId) {
  const idx = workAreasState.workAreas.findIndex(w => w.id === workAreaId);
  if (idx === -1) return false;

  try {
    const { error } = await supa.from('work_areas')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser?.id || null,
        delete_reason: 'Archived from Settings'
      })
      .eq('id', workAreaId)
      .is('deleted_at', null);

    if (error) throw error;

    workAreasState.workAreas.splice(idx, 1);
    return true;
  } catch (err) {
    console.error('Error deleting work area:', err);
    showToast('Failed to delete work area: ' + err.message, 'error');
  }
  return false;
}

// ── Get work area by ID ──────────────────────────────────────────
export function workAreasDataGetWorkArea(workAreaId) {
  return workAreasState.workAreas.find(w => w.id === workAreaId);
}

// ── Get work area name by ID ─────────────────────────────────────
export function workAreasDataGetWorkAreaName(workAreaId) {
  const workArea = workAreasState.workAreas.find(w => w.id === workAreaId);
  return workArea ? workArea.name : 'Unknown';
}

// ── Get all work areas ───────────────────────────────────────────
export function workAreasDataGetAll() {
  return [...workAreasState.workAreas];
}

// ── Build <option> elements for all work area dropdowns ──────────
// Usage: `<option value="">—</option>${getWorkAreaOptions(currentValue)}`
export function getWorkAreaOptions(selected) {
  return workAreasState.workAreas
    .map(w => `<option value="${esc(w.name)}" ${selected === w.name ? 'selected' : ''}>${esc(w.name)}</option>`)
    .join('');
}

// ── Real-time subscription ───────────────────────────────────────
function workAreasDataSubscribe() {
  function patchSettingsWorkAreasRow(record) {
    const tbody = document.getElementById('wa-tbody')
    if (!tbody) return
    if (appState.currentSection !== 'settings') return
    const activeId = document.activeElement?.id || ''
    if (activeId === 'waEdit-name' || activeId === 'waEdit-desc') return
    if (typeof render === 'function') render()
  }

  createRealtimeSubscription('work_areas', 'work_areas_channel', {
    onInsert: (record) => {
      workAreasState.workAreas.push(record);
      workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
      patchSettingsWorkAreasRow(record)
    },
    onUpdate: (record) => {
      const idx = workAreasState.workAreas.findIndex(w => w.id === record.id);
      if (idx >= 0) workAreasState.workAreas[idx] = record;
      workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
      patchSettingsWorkAreasRow(record)
    },
    onDelete: (record) => {
      workAreasState.workAreas = workAreasState.workAreas.filter(w => w.id !== record.id);
      patchSettingsWorkAreasRow(record)
    }
  });
}

export function workAreasDataUnsubscribe() {
  removeRealtimeSubscription('work_areas_channel');
}
