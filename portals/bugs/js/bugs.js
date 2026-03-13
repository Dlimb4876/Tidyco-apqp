// ═══════════════════════════════════
// bugs.js — Bug Reports portal renderer
// Depends on: bugs-data.js, helpers.js, navigation.js
// ═══════════════════════════════════

// ── Event Listener ───────────────────────────────────────────
// Listen for changes in the bug data and re-render the UI.
document.addEventListener('bugDataChanged', () => render());

// ── Global App Object for Inline Event Handlers ──────────────
// Grouping functions on a single object avoids polluting the global namespace.
window.bugApp = {
  switchTab(tab) {
    bugDataManager.setTab(tab);
  },

  async submitInline() {
    const pageInput = document.getElementById('bugInlinePage');
    const descInput = document.getElementById('bugInlineDesc');
    const feedback = document.getElementById('bugInlineFeedback');
    const page = pageInput.value.trim();
    const desc = descInput.value.trim();

    if (!desc) {
      this._showFeedback('Please describe the bug.', 'error', feedback);
      return;
    }

    try {
      await bugDataManager.addReport(page, desc);
      pageInput.value = '';
      descInput.value = '';
      this._showFeedback('✓ Bug report submitted successfully!', 'success', feedback);
      setTimeout(() => feedback.style.display = 'none', 3000);
    } catch (error) {
      this._showFeedback(error.message, 'error', feedback);
    }
  },

  startEditing(id) {
    bugDataManager.setEditingId(id);
  },

  cancelEditing() {
    bugDataManager.setEditingId(null);
  },

  async saveResponse(id, idx) {
    const textarea = document.getElementById(`bugResponseText_${idx}`);
    const statusSelect = document.getElementById(`bugStatusSelect_${idx}`);
    if (!textarea || !statusSelect) return;

    const response = textarea.value.trim();
    const status = statusSelect.value;

    if (!response) {
      // Using alert for now as there's no dedicated feedback element in the table row.
      // A better solution would be a small, non-modal feedback message near the save button.
      alert('Please enter a response.');
      return;
    }

    try {
      await bugDataManager.respond(id, response, status);
      bugDataManager.setEditingId(null); // This will trigger a re-render
    } catch (error) {
      alert(error.message); // Same as above, alert is a fallback.
    }
  },

  async reopen(id) {
    try {
      await bugDataManager.reopen(id);
    } catch (error) {
      alert(error.message);
    }
  },

  // Helper for showing feedback messages
  _showFeedback(message, type, element) {
    element.textContent = message;
    element.className = `bugs-form-feedback bugs-form-feedback-${type}`;
    element.style.display = 'block';
  }
};


// ── UI Rendering ─────────────────────────────────────────────

function renderBugReports() {
  const { reports, tab } = bugDataManager.state;
  const openCount = reports.filter(r => r.status === 'open').length;

  return `
    <div class="bugs-header">
      <div>
        <div class="bugs-title">🪳 Bug Reports</div>
        <div class="bugs-sub">${reports.length} report${reports.length !== 1 ? 's' : ''} · ${openCount} open</div>
      </div>
    </div>

    <div class="bugs-tabs">
      <button class="bugs-tab ${tab === 'add' ? 'bugs-tab-active' : ''}" onclick="bugApp.switchTab('add')">
        + Add Bug
      </button>
      <button class="bugs-tab ${tab === 'view' ? 'bugs-tab-active' : ''}" onclick="bugApp.switchTab('view')">
        View &amp; Update
      </button>
    </div>

    ${tab === 'add' ? bugRenderAddTab() : bugRenderViewTab(reports)}
  `;
}

function bugRenderAddTab() {
  const today = new Date().toLocaleDateString('en-GB');
  const email = currentUser ? currentUser.email : '';

  return `
    <div class="bugs-form-container">
      <div class="bugs-form-box">
        <div class="bugs-form-title">Report a New Bug</div>
        <div class="bugs-form-sub">Help us improve by describing any issues you encounter</div>

        <div class="field">
          <label>Raised By</label>
          <input type="text" id="bugInlineRaisedBy" value="${esc(email)}" readonly class="bug-readonly-field">
        </div>

        <div class="field">
          <label>Date</label>
          <input type="text" id="bugInlineDate" value="${today}" readonly class="bug-readonly-field">
        </div>

        <div class="field">
          <label>Page / Area</label>
          <input type="text" id="bugInlinePage" placeholder="e.g. PFMEA, Production Scheduling, Capacity Planning…">
        </div>

        <div class="field">
          <label>Bug Report *</label>
          <textarea id="bugInlineDesc" placeholder="Describe what happened and what you expected to happen…" rows="6" style="resize:vertical"></textarea>
        </div>

        <div class="bugs-form-actions">
          <button class="btn btn-primary" onclick="bugApp.submitInline()">Submit Report</button>
          <div class="bugs-form-feedback" id="bugInlineFeedback" style="display:none"></div>
        </div>
      </div>
    </div>
  `;
}

function bugRenderViewTab(reports) {
  return `
    ${reports.length === 0 ? `
      <div class="bugs-empty">
        <div class="bugs-empty-icon">📋</div>
        <div class="bugs-empty-text">No bug reports yet</div>
        <div class="bugs-empty-sub">Switch to the "Add Bug" tab to submit one</div>
      </div>
    ` : `
      <div class="bugs-table-wrap">
        <table class="bugs-table">
          <thead>
            <tr>
              <th class="bugs-col-num">#</th>
              <th class="bugs-col-by">Raised By</th>
              <th class="bugs-col-date">Date</th>
              <th class="bugs-col-page">Page</th>
              <th class="bugs-col-desc">Bug Report</th>
              <th class="bugs-col-status">Status</th>
              <th class="bugs-col-response">Response</th>
              <th class="bugs-col-action"></th>
            </tr>
          </thead>
          <tbody>
            ${reports.map((r, i) => bugRowHTML(r, i)).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function bugRowHTML(r, i) {
  const { editingId } = bugDataManager.state;
  const date = r.date_raised ? new Date(r.date_raised).toLocaleDateString('en-GB') : '—';
  const isOpen = r.status === 'open';
  const isEditing = editingId === r.id;

  const statusCell = isEditing
    ? `<select id="bugStatusSelect_${i}" class="bug-inline-select">
        <option value="open" ${r.status === 'open' ? 'selected' : ''}>OPEN</option>
        <option value="closed" ${r.status === 'closed' ? 'selected' : ''}>FIXED</option>
      </select>`
    : (isOpen
      ? `<span class="bug-badge bug-badge-open">OPEN</span>`
      : `<span class="bug-badge bug-badge-closed">FIXED</span>`);

  let responseCell;
  if (isEditing) {
    responseCell = `<textarea id="bugResponseText_${i}" class="bug-inline-textarea" placeholder="Enter response...">${esc(r.response || '')}</textarea>`;
  } else {
    responseCell = r.response
      ? `<div class="bug-response-text">${esc(r.response)}</div><div class="bug-response-meta">— ${esc(r.responded_by || '')}${r.responded_at ? ', ' + new Date(r.responded_at).toLocaleDateString('en-GB') : ''}</div>`
      : `<span class="bugs-muted">—</span>`;
  }

  const actionBtn = isEditing
    ? `<div class="bug-inline-actions">
        <button class="btn btn-xs btn-primary" onclick="bugApp.saveResponse('${esc(r.id)}', ${i})">Save</button>
        <button class="btn btn-xs btn-ghost" onclick="bugApp.cancelEditing()">Cancel</button>
      </div>`
    : (isOpen
      ? `<button class="btn btn-sm btn-ghost" onclick="bugApp.startEditing('${esc(r.id)}')">Edit</button>`
      : `<button class="btn btn-sm btn-ghost bugs-reopen-btn" onclick="bugApp.reopen('${esc(r.id)}')">Re-open</button>`);

  return `
    <tr class="${isOpen ? '' : 'bug-row-closed'}">
      <td class="bugs-col-num bugs-muted">${i + 1}</td>
      <td class="bugs-col-by">${esc(r.raised_by)}</td>
      <td class="bugs-col-date bugs-muted">${date}</td>
      <td class="bugs-col-page">${r.page ? esc(r.page) : '<span class="bugs-muted">—</span>'}</td>
      <td class="bugs-col-desc">${esc(r.description)}</td>
      <td class="bugs-col-status">${statusCell}</td>
      <td class="bugs-col-response">${responseCell}</td>
      <td class="bugs-col-action">${actionBtn}</td>
    </tr>
  `;
}


// ── Deprecated Modal helpers ─────────────────────────────────
// These are no longer part of the primary UI but are kept for now.
// They should be updated to use the new data manager if they are to be kept.

let _bugRespondId = null;

window.bugOpenNewModal = function() {
  const today = new Date().toLocaleDateString('en-GB');
  const email = currentUser ? currentUser.email : '';
  document.getElementById('bugNewRaisedBy').value = email;
  document.getElementById('bugNewDate').value = today;
  document.getElementById('bugNewPage').value = '';
  document.getElementById('bugNewDesc').value = '';
  showModal('modalNewBug');
};

window.bugSubmitNew = async function() {
  const page = document.getElementById('bugNewPage').value.trim();
  const desc = document.getElementById('bugNewDesc').value.trim();
  if (!desc) { alert('Please describe the bug.'); return; }

  try {
    await bugDataManager.addReport(page, desc);
    closeModal('modalNewBug');
  } catch(error) {
    alert(error.message);
  }
};

window.bugOpenRespondModal = function(id, idx) {
  _bugRespondId = id;
  const r = bugDataManager.state.reports[idx];
  document.getElementById('bugRespondDesc').textContent = r ? r.description : '';
  document.getElementById('bugRespondText').value = '';
  showModal('modalRespondBug');
};

window.bugSubmitRespond = async function() {
  const response = document.getElementById('bugRespondText').value.trim();
  if (!response) { alert('Please enter a response before closing.'); return; }

  try {
    await bugDataManager.respond(_bugRespondId, response, 'closed');
    _bugRespondId = null;
    closeModal('modalRespondBug');
  } catch(error) {
    alert(error.message)
  }
};
