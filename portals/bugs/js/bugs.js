// ═══════════════════════════════════
// bugs.js — Bug Reports portal renderer
// Depends on: bugs-data.js, helpers.js, navigation.js
// ═══════════════════════════════════

function renderBugReports() {
  const reports = bugState.reports;
  const openCount = reports.filter(r => r.status === 'open').length;

  return `
    <div class="bugs-header">
      <div>
        <div class="bugs-title">🪳 Bug Reports</div>
        <div class="bugs-sub">${reports.length} report${reports.length !== 1 ? 's' : ''} · ${openCount} open</div>
      </div>
      <button class="btn btn-primary" onclick="bugOpenNewModal()">+ New Report</button>
    </div>

    ${reports.length === 0 ? `
      <div class="bugs-empty">
        <div class="bugs-empty-icon">🎉</div>
        <div class="bugs-empty-text">No bug reports yet</div>
        <div class="bugs-empty-sub">Use the button above to submit the first one</div>
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
  const statusBadge = isOpen
    ? `<span class="bug-badge bug-badge-open">OPEN</span>`
    : `<span class="bug-badge bug-badge-closed">CLOSED</span>`;

  const responseCell = r.response
    ? `<div class="bug-response-text">${esc(r.response)}</div><div class="bug-response-meta">— ${esc(r.responded_by || '')}${r.responded_at ? ', ' + new Date(r.responded_at).toLocaleDateString('en-GB') : ''}</div>`
    : `<span class="bugs-muted">—</span>`;

  const actionBtn = isOpen
    ? `<button class="btn btn-sm btn-ghost" onclick="bugOpenRespondModal('${esc(r.id)}', ${i})">Respond &amp; Close</button>`
    : `<button class="btn btn-sm btn-ghost bugs-reopen-btn" onclick="bugDataReopen('${esc(r.id)}')">Re-open</button>`;

  return `
    <tr class="${isOpen ? '' : 'bug-row-closed'}">
      <td class="bugs-col-num bugs-muted">${i + 1}</td>
      <td class="bugs-col-by">${esc(r.raised_by)}</td>
      <td class="bugs-col-date bugs-muted">${date}</td>
      <td class="bugs-col-page">${r.page ? esc(r.page) : '<span class="bugs-muted">—</span>'}</td>
      <td class="bugs-col-desc">${esc(r.description)}</td>
      <td class="bugs-col-status">${statusBadge}</td>
      <td class="bugs-col-response">${responseCell}</td>
      <td class="bugs-col-action">${actionBtn}</td>
    </tr>
  `;
}

// ── Modal helpers ─────────────────────────────────────────────

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
