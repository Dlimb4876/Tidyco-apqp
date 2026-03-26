// ═══════════════════════════════════
// me-hub-data.js — Data layer for ME Department Hub
// Phase 3: Added Work Breakdown Structure (WBS) support with subtasks
// ═══════════════════════════════════

let hubTasks    = [];
let hubTeam     = [];
let hubTimeLogs = [];
let hubSubtasks = [];

// ─────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────
async function hubLoadTasks() {
  const { data, error } = await hubSupa
    .from('me_tasks')
    .select('id, name, category, type, assignee_id, start_date, end_date, total_hours, percent_complete, status, is_disabled')
    .order('start_date', { ascending: true });

  if (error) {
    console.warn('hubLoadTasks error:', error.message);
    return [];
  }

  return (data || []).map(t => ({
    id:              t.id,
    name:            t.name || '(Untitled)',
    category:        t.category || '',
    type:            t.type || 'standard',
    assigneeId:      t.assignee_id || '',
    startDate:       t.start_date || '',
    endDate:         t.end_date   || '',
    totalHours:      t.total_hours || 0,
    percentComplete: t.percent_complete || 0,
    status:          t.status || 'SCHEDULED',
    isDisabled:      t.is_disabled === true
  }));
}

async function hubLoadTeam() {
  const { data, error } = await hubSupa
    .from('me_teams')
    .select('id, name, job_title');

  if (error) {
    console.warn('hubLoadTeam error:', error.message);
    return [];
  }

  return (data || []).map(t => ({
    id:       t.id,
    name:     t.name || '(Unknown)',
    jobTitle: t.job_title || ''
  }));
}

async function hubLoadTimeLogs() {
  const { data, error } = await hubSupa
    .from('time_logs')
    .select('id, user_id, task_id, hours_logged, log_date, notes, created_at')
    .order('log_date', { ascending: false });

  if (error) {
    // Table might not exist yet (migration not run)
    if (error.message && error.message.includes('does not exist')) {
      console.warn('time_logs table not found. Run Phase 2 migration.');
      return [];
    }
    console.warn('hubLoadTimeLogs error:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    id:          row.id,
    userId:      row.user_id,
    taskId:      row.task_id,
    hoursLogged: Number(row.hours_logged) || 0,
    logDate:     row.log_date,
    notes:       row.notes || '',
    createdAt:   row.created_at
  }));
}

async function hubLoadSubtasks() {
  const { data, error } = await hubSupa
    .from('me_hub_subtasks')
    .select('id, parent_task_id, name, description, assignee_id, start_date, end_date, planned_hours, percent_complete, status, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error) {
    // Table might not exist yet (migration not run)
    if (error.message && error.message.includes('does not exist')) {
      console.warn('me_hub_subtasks table not found. Run Phase 3 migration.');
      return [];
    }
    console.warn('hubLoadSubtasks error:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    id:              row.id,
    parentTaskId:    row.parent_task_id,
    name:            row.name || '(Untitled)',
    description:     row.description || '',
    assigneeId:      row.assignee_id,
    startDate:       row.start_date || '',
    endDate:         row.end_date || '',
    plannedHours:    Number(row.planned_hours) || 0,
    percentComplete: row.percent_complete || 0,
    status:          row.status || 'NOT_STARTED',
    sortOrder:       row.sort_order || 0,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at
  }));
}

// ─────────────────────────────────────────────────────────────
// INIT — called once after auth
// ─────────────────────────────────────────────────────────────
async function hubDataInit() {
  // Load independently so one failure doesn't break everything
  hubTasks = await hubLoadTasks();
  hubTeam = await hubLoadTeam();
  hubTimeLogs = await hubLoadTimeLogs();
  hubSubtasks = await hubLoadSubtasks();
}

// ─────────────────────────────────────────────────────────────
// SUBTASK CRUD — Work Breakdown Structure operations
// ─────────────────────────────────────────────────────────────
async function hubCreateSubtask(subtask) {
  const { data, error } = await hubSupa
    .from('me_hub_subtasks')
    .insert({
      parent_task_id: subtask.parentTaskId,
      name: subtask.name,
      description: subtask.description || '',
      assignee_id: subtask.assigneeId || null,
      start_date: subtask.startDate || null,
      end_date: subtask.endDate || null,
      planned_hours: subtask.plannedHours || 0,
      percent_complete: subtask.percentComplete || 0,
      status: subtask.status || 'NOT_STARTED',
      sort_order: subtask.sortOrder || 0
    })
    .select()
    .single();

  if (error) {
    console.error('hubCreateSubtask error:', error.message);
    throw error;
  }

  // Refresh local cache
  hubSubtasks = await hubLoadSubtasks();
  return data;
}

async function hubUpdateSubtask(subtaskId, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.plannedHours !== undefined) dbUpdates.planned_hours = updates.plannedHours;
  if (updates.percentComplete !== undefined) dbUpdates.percent_complete = updates.percentComplete;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await hubSupa
    .from('me_hub_subtasks')
    .update(dbUpdates)
    .eq('id', subtaskId)
    .select()
    .single();

  if (error) {
    console.error('hubUpdateSubtask error:', error.message);
    throw error;
  }

  // Refresh local cache
  hubSubtasks = await hubLoadSubtasks();
  return data;
}

async function hubDeleteSubtask(subtaskId) {
  const { error } = await hubSupa
    .from('me_hub_subtasks')
    .delete()
    .eq('id', subtaskId);

  if (error) {
    console.error('hubDeleteSubtask error:', error.message);
    throw error;
  }

  // Refresh local cache
  hubSubtasks = await hubLoadSubtasks();
}

// ─────────────────────────────────────────────────────────────
// TIME LOGGING — Log hours against tasks
// ─────────────────────────────────────────────────────────────
async function hubLogTime(taskId, hours, logDate, notes = '') {
  if (!hubCurrentUser) {
    throw new Error('User must be authenticated to log time');
  }

  const { data, error } = await hubSupa
    .from('time_logs')
    .insert({
      user_id: hubCurrentUser.id,
      task_id: taskId,
      hours_logged: hours,
      log_date: logDate || new Date().toISOString().split('T')[0],
      notes: notes
    })
    .select()
    .single();

  if (error) {
    console.error('hubLogTime error:', error.message);
    throw error;
  }

  // Refresh local cache
  hubTimeLogs = await hubLoadTimeLogs();
  return data;
}

// ─────────────────────────────────────────────────────────────
// EVM CALCULATIONS — Earned Value Management math
// ─────────────────────────────────────────────────────────────
function hubCalculateEVM(taskId) {
  const task = hubTasks.find(t => t.id === taskId);
  if (!task) return null;

  const taskSubtasks = hubSubtasks.filter(s => s.parentTaskId === taskId);
  const actuals = hubGetActuals(taskId);

  // BAC (Budget At Completion) - from parent task total hours
  const bac = task.totalHours || 0;

  // Calculate percent complete
  let percentComplete;
  if (taskSubtasks.length > 0) {
    // Weighted average by planned hours
    const totalPlanned = taskSubtasks.reduce((sum, s) => sum + (s.plannedHours || 0), 0);
    if (totalPlanned > 0) {
      const weightedSum = taskSubtasks.reduce((sum, s) => 
        sum + ((s.plannedHours || 0) * (s.percentComplete || 0)), 0);
      percentComplete = Math.round(weightedSum / totalPlanned);
    } else {
      percentComplete = task.percentComplete || 0;
    }
  } else {
    percentComplete = task.percentComplete || 0;
  }

  // EV (Earned Value)
  const ev = bac * (percentComplete / 100);

  // ETC (Estimate To Complete)
  const etc = bac - ev;

  // EAC (Estimate At Completion)
  const eac = actuals + etc;

  // Variance
  const variance = eac - bac;
  const variancePercent = bac > 0 ? ((variance / bac) * 100).toFixed(1) : 0;

  return {
    taskId,
    taskName: task.name,
    bac,
    actuals,
    percentComplete,
    ev: Math.round(ev * 100) / 100,
    etc: Math.round(etc * 100) / 100,
    eac: Math.round(eac * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    variancePercent,
    status: hubGetEVMStatus(variance, bac),
    subtaskCount: taskSubtasks.length
  };
}

function hubGetEVMStatus(variance, bac) {
  if (bac === 0) return 'neutral';
  const ratio = variance / bac;
  if (ratio > 0.1) return 'overrun';      // >10% over budget
  if (ratio < -0.1) return 'under';       // >10% under budget
  return 'on-track';                      // Within 10%
}

function hubGetAllEVM() {
  return hubTasks
    .filter(t => !t.isDisabled)
    .map(t => hubCalculateEVM(t.id))
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
// Returns total hours logged against a specific me_tasks id
function hubGetActuals(taskId) {
  return hubTimeLogs
    .filter(log => log.taskId === taskId)
    .reduce((sum, log) => sum + log.hoursLogged, 0);
}

function hubGetTeamName(assigneeId) {
  if (!assigneeId) return '—';
  const member = hubTeam.find(m => m.id === assigneeId);
  return member ? member.name : '—';
}

function hubEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
