// ═══════════════════════════════════
// bugs-data.js — Bug Reports data layer
// Depends on: state.js, auth.js
// ═══════════════════════════════════

let bugState = { reports: [] };
let bugTab = 'add';
let bugEditingId = null;
let bugSubscription = null;

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
  if (bugSubscription) return;

  bugSubscription = supa
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bug_reports'
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newReport = payload.new;
        if (!bugState.reports.some(r => r.id === newReport.id)) {
          bugState.reports.unshift(newReport);
          render();
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new;
        const idx = bugState.reports.findIndex(r => r.id === updated.id);
        if (idx >= 0) {
          bugState.reports[idx] = updated;
          render();
        }
      } else if (payload.eventType === 'DELETE') {
        bugState.reports = bugState.reports.filter(r => r.id !== payload.old.id);
        render();
      }
    })
    .subscribe();
}

function bugDataUnsubscribe() {
  if (bugSubscription) {
    bugSubscription.unsubscribe();
    bugSubscription = null;
  }
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
