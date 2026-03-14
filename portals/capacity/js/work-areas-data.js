// ═══════════════════════════════════════════════════════════════
// work-areas-data.js — Work Areas Data Layer
// Manages work areas (Unit 2, Unit 3, Unit 6, etc.) with Supabase persistence
// Depends on: auth.js (supa, currentUser)
// ═══════════════════════════════════════════════════════════════

let workAreasState = {
  workAreas: [],
  loading: false,
  error: null
};

// ── Initialize work areas from Supabase ──────────────────────────
async function workAreasDataInit() {
  workAreasState.loading = true;
  workAreasState.error = null;

  try {
    const { data, error } = await supa.from('work_areas')
      .select('*')
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
window.workAreasDataAddWorkArea = async function(name, description) {
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
};

// ── Update a work area ───────────────────────────────────────────
window.workAreasDataUpdateWorkArea = async function(workAreaId, updates) {
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
};

// ── Delete a work area ───────────────────────────────────────────
window.workAreasDataDeleteWorkArea = async function(workAreaId) {
  const idx = workAreasState.workAreas.findIndex(w => w.id === workAreaId);
  if (idx === -1) return false;

  try {
    const { error } = await supa.from('work_areas')
      .delete()
      .eq('id', workAreaId);

    if (error) throw error;

    workAreasState.workAreas.splice(idx, 1);
    return true;
  } catch (err) {
    console.error('Error deleting work area:', err);
    showToast('Failed to delete work area: ' + err.message, 'error');
  }
  return false;
};

// ── Get work area by ID ──────────────────────────────────────────
window.workAreasDataGetWorkArea = function(workAreaId) {
  return workAreasState.workAreas.find(w => w.id === workAreaId);
};

// ── Get work area name by ID ─────────────────────────────────────
window.workAreasDataGetWorkAreaName = function(workAreaId) {
  const workArea = workAreasState.workAreas.find(w => w.id === workAreaId);
  return workArea ? workArea.name : 'Unknown';
};

// ── Get all work areas ───────────────────────────────────────────
window.workAreasDataGetAll = function() {
  return [...workAreasState.workAreas];
};

// ── Real-time subscription ───────────────────────────────────────
function workAreasDataSubscribe() {
  createRealtimeSubscription('work_areas', 'work_areas_channel', {
    onInsert: (record) => {
      workAreasState.workAreas.push(record);
      workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
      render();
    },
    onUpdate: (record) => {
      const idx = workAreasState.workAreas.findIndex(w => w.id === record.id);
      if (idx >= 0) workAreasState.workAreas[idx] = record;
      workAreasState.workAreas.sort((a, b) => a.name.localeCompare(b.name));
      render();
    },
    onDelete: (record) => {
      workAreasState.workAreas = workAreasState.workAreas.filter(w => w.id !== record.id);
      render();
    }
  });
}

window.workAreasDataUnsubscribe = function() {
  removeRealtimeSubscription('work_areas_channel');
};
