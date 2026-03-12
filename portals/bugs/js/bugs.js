// ═══════════════════════════════════
// bugs.js — Bug Reports portal renderer
// Depends on: bugs-data.js, helpers.js, navigation.js
// ═══════════════════════════════════

function renderBugReports() {
  const reports = bugState.reports;
  const openCount = reports.filter(r => r.status === 'open').length;
  const tab = bugTab || 'add';

  return `
    <div class="bugs-header">
      <div>
        <div class="bugs-title">🪳 Bug Reports</div>
        <div class="bugs-sub">${reports.length} report${reports.length !== 1 ? 's' : ''} · ${openCount} open</div>
      </div>
    </div>

    <div class="bugs-tabs">
      <button class="bugs-tab ${tab === 'add' ? 'bugs-tab-active' : ''}" onclick="bugSwitchTab('add')">
        + Add Bug
      </button>
      <button class="bugs-tab ${tab === 'view' ? 'bugs-tab-active' : ''}" onclick="bugSwitchTab('view')">
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
          <button class="btn btn-primary" onclick="bugSubmitInline()">Submit Report</button>
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
  const date = r.date_raised ? new Date(r.date_raised).toLocaleDateString('en-GB') : '—';
  const isOpen = r.status === 'open';
  const isEditing = bugEditingId === r.id;

  const statusCell = isEditing
    ? `<select id="bugStatusSelect_${i}" class="bug-inline-select" onchange="bugUpdateInlineStatus('${esc(r.id)}', ${i})">
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
        <button class="btn btn-xs btn-primary" onclick="bugSaveInlineResponse('${esc(r.id)}', ${i})">Save</button>
        <button class="btn btn-xs btn-ghost" onclick="bugCancelInlineEdit()">Cancel</button>
      </div>`
    : (isOpen
      ? `<button class="btn btn-sm btn-ghost" onclick="bugStartInlineEdit('${esc(r.id)}')">Edit</button>`
      : `<button class="btn btn-sm btn-ghost bugs-reopen-btn" onclick="bugDataReopen('${esc(r.id)}')">Re-open</button>`);

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

// ── Tab switching ─────────────────────────────────────────────

window.bugSwitchTab = function(tab) {
  bugTab = tab;
  render();
};

// ── Inline form submission ────────────────────────────────────

window.bugSubmitInline = async function() {
  const page = document.getElementById('bugInlinePage').value.trim();
  const desc = document.getElementById('bugInlineDesc').value.trim();
  const feedback = document.getElementById('bugInlineFeedback');

  if (!desc) {
    feedback.textContent = 'Please describe the bug.';
    feedback.className = 'bugs-form-feedback bugs-form-feedback-error';
    feedback.style.display = 'block';
    return;
  }

  const ok = await bugDataAdd(page, desc);
  if (ok) {
    // Clear form
    document.getElementById('bugInlinePage').value = '';
    document.getElementById('bugInlineDesc').value = '';
    feedback.textContent = '✓ Bug report submitted successfully!';
    feedback.className = 'bugs-form-feedback bugs-form-feedback-success';
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 3000);
  } else {
    feedback.textContent = 'Failed to submit bug report. Please try again.';
    feedback.className = 'bugs-form-feedback bugs-form-feedback-error';
    feedback.style.display = 'block';
  }
};

// ── Inline editing ────────────────────────────────────────────

window.bugStartInlineEdit = function(id) {
  bugEditingId = id;
  render();
};

window.bugCancelInlineEdit = function() {
  bugEditingId = null;
  render();
};

window.bugUpdateInlineStatus = function(id, idx) {
  const select = document.getElementById(`bugStatusSelect_${idx}`);
  if (!select) return;
  const newStatus = select.value;
  const report = bugState.reports.find(r => r.id === id);
  if (report) report.status = newStatus;
};

window.bugSaveInlineResponse = async function(id, idx) {
  const textarea = document.getElementById(`bugResponseText_${idx}`);
  if (!textarea) return;
  const response = textarea.value.trim();
  if (!response) {
    alert('Please enter a response.');
    return;
  }
  const ok = await bugDataRespond(id, response);
  if (ok) {
    bugEditingId = null;
  }
};

// ── Modal helpers (deprecated but kept for compatibility) ────

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
  const ok = await bugDataAdd(page, desc);
  if (ok) closeModal('modalNewBug');
};

window.bugOpenRespondModal = function(id, idx) {
  _bugRespondId = id;
  const r = bugState.reports[idx];
  document.getElementById('bugRespondDesc').textContent = r ? r.description : '';
  document.getElementById('bugRespondText').value = '';
  showModal('modalRespondBug');
};

window.bugSubmitRespond = async function() {
  const response = document.getElementById('bugRespondText').value.trim();
  if (!response) { alert('Please enter a response before closing.'); return; }
  const ok = await bugDataRespond(_bugRespondId, response);
  if (ok) { _bugRespondId = null; closeModal('modalRespondBug'); }
};
