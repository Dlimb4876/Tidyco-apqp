// ═══════════════════════════════════
// bugs-data.js — Bug Reports data layer
// Depends on: state.js, auth.js
// ═══════════════════════════════════

let bugState = { reports: [] };
let bugTab = 'add';
let bugEditingId = null;

async function bugDataInit() {
  if (!currentUser) return;
  try {
    const { data, error } = await supa
      .from('bug_reports')
      .select('*')
      .order('date_raised', { ascending: false });
    if (error) throw error;
    bugState.reports = data || [];
    bugDataSubscribe();
  } catch (err) {
    console.error('Bug reports load error:', err);
    bugState.reports = [];
  }
}

function bugDataSubscribe() {
  if (!currentUser) return;

  createRealtimeSubscription('bug_reports', 'bug_reports_channel', {
    onInsert: (newReport) => {
      if (!bugState.reports.some(r => r.id === newReport.id)) {
        bugState.reports.unshift(newReport);
        render();
      }
    },
    onUpdate: (updated) => {
      const idx = bugState.reports.findIndex(r => r.id === updated.id);
      if (idx >= 0) {
        bugState.reports[idx] = updated;
        render();
      }
    },
    onDelete: (deleted) => {
      bugState.reports = bugState.reports.filter(r => r.id !== deleted.id);
      render();
    }
  });
}

function bugDataUnsubscribe() {
  removeRealtimeSubscription('bug_reports_channel');
}

window.bugDataAdd = async function(page, description) {
  if (!currentUser) return false;
  const raised_by = currentUser.email;
  const report = {
    user_id: currentUser.id,
    raised_by,
    date_raised: new Date().toISOString(),
    page: page ? page.trim() : '',
    description: description.trim(),
    status: 'open'
  };
  try {
    const { data, error } = await supa.from('bug_reports').insert([report]).select();
    if (error) throw error;
    bugState.reports.unshift(data[0]);
    render();
    return true;
  } catch (err) {
    console.error('Bug report add error:', err);
    alert('Failed to submit bug report: ' + err.message);
    return false;
  }
};

window.bugDataRespond = async function(id, response) {
  if (!currentUser) return false;
  const updates = {
    response: response.trim(),
    responded_by: currentUser.email,
    responded_at: new Date().toISOString(),
    status: 'closed'
  };
  try {
    const { error } = await supa.from('bug_reports').update(updates).eq('id', id);
    if (error) throw error;
    const report = bugState.reports.find(r => r.id === id);
    if (report) Object.assign(report, updates);
    render();
    return true;
  } catch (err) {
    console.error('Bug report respond error:', err);
    alert('Failed to update bug report: ' + err.message);
    return false;
  }
};

window.bugDataReopen = async function(id) {
  if (!currentUser) return false;
  const updates = { status: 'open', response: null, responded_by: null, responded_at: null };
  try {
    const { error } = await supa.from('bug_reports').update(updates).eq('id', id);
    if (error) throw error;
    const report = bugState.reports.find(r => r.id === id);
    if (report) Object.assign(report, updates);
    render();
    return true;
  } catch (err) {
    console.error('Bug report reopen error:', err);
    return false;
  }
};
