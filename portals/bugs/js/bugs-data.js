// ═══════════════════════════════════
// bugs-data.js — Bug Reports data layer
// Depends on: state.js, auth.js
// ═══════════════════════════════════

window.bugDataManager = {
  state: {
    reports: [],
    tab: 'add',
    editingId: null,
  },

  _publishChange() {
    document.dispatchEvent(new CustomEvent('bugDataChanged'));
  },

  async init() {
    if (!currentUser) return;
    try {
      const { data, error } = await supa
        .from('bug_reports')
        .select('*')
        .order('date_raised', { ascending: false });
      if (error) throw error;
      this.state.reports = data || [];
      this.subscribe();
      this._publishChange();
    } catch (err) {
      console.error('Bug reports load error:', err);
      this.state.reports = [];
      this._publishChange();
      throw new Error('Could not load bug reports.');
    }
  },

  subscribe() {
    if (!currentUser) return;
    createRealtimeSubscription('bug_reports', 'bug_reports_channel', {
      onInsert: (newReport) => {
        if (!this.state.reports.some(r => r.id === newReport.id)) {
          this.state.reports.unshift(newReport);
          this._publishChange();
        }
      },
      onUpdate: (updated) => {
        const idx = this.state.reports.findIndex(r => r.id === updated.id);
        if (idx >= 0) {
          this.state.reports[idx] = updated;
          this._publishChange();
        }
      },
      onDelete: (deleted) => {
        this.state.reports = this.state.reports.filter(r => r.id !== deleted.id);
        this._publishChange();
      }
    });
  },

  unsubscribe() {
    removeRealtimeSubscription('bug_reports_channel');
  },

  async addReport(page, description) {
    if (!currentUser) throw new Error('You must be logged in to add a report.');
    const report = {
      user_id: currentUser.id,
      raised_by: currentUser.email,
      date_raised: new Date().toISOString(),
      page: page ? page.trim() : '',
      description: description.trim(),
      status: 'open'
    };
    try {
      const { data, error } = await supa.from('bug_reports').insert([report]).select();
      if (error) throw error;
      // The realtime subscription will handle adding the report to the state.
      // this.state.reports.unshift(data[0]);
      // this._publishChange();
      return data[0];
    } catch (err) {
      console.error('Bug report add error:', err);
      throw new Error('Failed to submit bug report: ' + err.message);
    }
  },

  async updateReport(id, updates) {
    if (!currentUser) throw new Error('You must be logged in to update a report.');
    try {
      console.log('Updating bug_reports id:', id, 'with:', updates);
      const { data, error } = await supa.from('bug_reports').update(updates).eq('id', id).select();
      console.log('Update response:', { data, error });
      if (error) throw error;
      // The realtime subscription will handle updating the state.
      // const report = this.state.reports.find(r => r.id === id);
      // if (report) Object.assign(report, updates);
      // this._publishChange();
      return true;
    } catch (err) {
      console.error('Bug report update error:', err);
      throw new Error('Failed to update bug report: ' + err.message);
    }
  },

  async respond(id, response, status) {
    if (!currentUser) throw new Error('You must be logged in to respond.');
    const updates = {
      response: response.trim(),
      responded_by: currentUser.email,
      responded_at: new Date().toISOString(),
      status: status || 'closed'
    };
    console.log('Bug respond: updating', id, 'with', updates);
    return this.updateReport(id, updates);
  },

  async reopen(id) {
    const updates = { status: 'open', response: null, responded_by: null, responded_at: null };
    return this.updateReport(id, updates);
  },

  setTab(tab) {
    this.state.tab = tab;
    this._publishChange();
  },

  setEditingId(id) {
    this.state.editingId = id;
    this._publishChange();
  }
};

async function bugDataInit() {
  await bugDataManager.init();
}


// For compatibility with navigation.js
function bugDataUnsubscribe() {
  window.bugDataManager.unsubscribe();
}
