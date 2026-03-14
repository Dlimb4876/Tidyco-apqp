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

  _publishChange(options = {}) {
    // Granular row-level update (2.11: Real-Time Granular Updates)
    // When we know exactly which row changed and the type of change,
    // update only that row instead of triggering a full render().
    const { id, strategy } = options; // strategy: 'update' | 'insert' | 'delete'
    if (id && strategy && typeof bugRowHTML === 'function' && !bugDataManager.state.editingId) {
      const tbody = document.querySelector('.bugs-table tbody');
      if (tbody) {
        if (strategy === 'delete') {
          const row = tbody.querySelector(`tr[data-id="${id}"]`);
          if (row) {
            row.classList.add('rt-removing');
            row.addEventListener('animationend', () => row.remove(), { once: true });
          }
          return;
        }
        if (strategy === 'update') {
          const row = tbody.querySelector(`tr[data-id="${id}"]`);
          if (row) {
            const idx = bugDataManager.state.reports.findIndex(r => r.id === id);
            if (idx >= 0) {
              const tempDiv = document.createElement('tbody');
              tempDiv.innerHTML = bugRowHTML(bugDataManager.state.reports[idx], idx);
              const newRow = tempDiv.firstElementChild;
              if (newRow) { row.replaceWith(newRow); return; }
            }
          }
        }
        if (strategy === 'insert') {
          const scrollTop = document.scrollingElement ? document.scrollingElement.scrollTop : 0;
          const idx = bugDataManager.state.reports.findIndex(r => r.id === id);
          if (idx >= 0) {
            const tempDiv = document.createElement('tbody');
            tempDiv.innerHTML = bugRowHTML(bugDataManager.state.reports[idx], idx);
            const newRow = tempDiv.firstElementChild;
            if (newRow) {
              newRow.classList.add('rt-new');
              tbody.insertBefore(newRow, tbody.firstChild);
              // Restore scroll
              requestAnimationFrame(() => {
                if (document.scrollingElement) document.scrollingElement.scrollTop = scrollTop;
              });
              return;
            }
          }
        }
      }
    }
    // Fall back to full re-render via custom event
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
          this._publishChange({ id: newReport.id, strategy: 'insert' });
        }
      },
      onUpdate: (updated) => {
        const idx = this.state.reports.findIndex(r => r.id === updated.id);
        if (idx >= 0) {
          this.state.reports[idx] = updated;
          this._publishChange({ id: updated.id, strategy: 'update' });
        }
      },
      onDelete: (deleted) => {
        this.state.reports = this.state.reports.filter(r => r.id !== deleted.id);
        this._publishChange({ id: deleted.id, strategy: 'delete' });
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
