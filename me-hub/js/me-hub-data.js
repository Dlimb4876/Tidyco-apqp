// ═══════════════════════════════════
// me-hub-data.js — Data layer for ME Department Hub
// Read-only: fetches me_tasks and me_teams from Supabase.
// Does NOT write capacity roll-ups back to the main portal (Phase 1).
// ═══════════════════════════════════

let hubTasks    = [];
let hubTeam     = [];
let hubTimeLogs = [];

// ─────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────
async function hubLoadTasks() {
  const { data, error } = await hubSupa
    .from('me_tasks')
    .select('id, name, category, type, assignee_id, start_date, end_date, total_hours, status, is_disabled')
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

// ─────────────────────────────────────────────────────────────
// INIT — called once after auth
// ─────────────────────────────────────────────────────────────
async function hubDataInit() {
  [hubTasks, hubTeam, hubTimeLogs] = await Promise.all([
    hubLoadTasks(),
    hubLoadTeam(),
    hubLoadTimeLogs()
  ]);
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
