// ═══════════════════════════════════
// me-hub-app.js — Application logic for ME Department Hub
// ═══════════════════════════════════

let hubActiveTab = 'tasks';
let hubTaskSearch = '';

// ─────────────────────────────────────────────────────────────
// INIT — called by auth.js after sign-in
// ─────────────────────────────────────────────────────────────
async function hubAppInit() {
  const content = document.getElementById('hubContent');
  content.innerHTML = '<div class="hub-loading">Loading tasks…</div>';

  await hubDataInit();
  hubRenderTasks();
}

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────
function hubSetTab(tab) {
  const tabs = document.querySelectorAll('.hub-tab');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  hubActiveTab = tab;

  if (tab === 'tasks') {
    hubRenderTasks();
  }
}

// ─────────────────────────────────────────────────────────────
// TASKS VIEW
// ─────────────────────────────────────────────────────────────
function hubRenderTasks() {
  const content = document.getElementById('hubContent');

  const search = hubTaskSearch.toLowerCase();
  const filtered = hubTasks.filter(t => {
    if (t.isDisabled) return false;
    if (!search) return true;
    return (
      t.name.toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      hubGetTeamName(t.assigneeId).toLowerCase().includes(search)
    );
  });

  const totalHours = filtered.reduce((sum, t) => sum + (t.totalHours || 0), 0);

  content.innerHTML = `
    <div class="hub-tasks-header">
      <div>
        <div class="hub-tasks-title">ME Capacity Tasks</div>
        <div class="hub-tasks-meta">${filtered.length} task${filtered.length !== 1 ? 's' : ''} · ${totalHours.toLocaleString()}h total budget</div>
      </div>
      <input
        id="hubTaskSearch"
        class="hub-tasks-search"
        type="search"
        placeholder="Search tasks…"
        value="${hubEsc(hubTaskSearch)}"
        oninput="hubOnSearchInput(this.value)"
      >
    </div>
    <div class="hub-table-wrap">
      ${filtered.length === 0 ? hubRenderEmptyTasks(search) : hubRenderTaskTable(filtered)}
    </div>
  `;
}

function hubRenderEmptyTasks(search) {
  return `
    <div class="hub-empty">
      <p>${search ? 'No tasks match your search.' : 'No tasks found.'}</p>
      <p>${search ? 'Try a different keyword.' : 'Tasks from the ME Capacity plan will appear here.'}</p>
    </div>
  `;
}

function hubRenderTaskTable(tasks) {
  const rows = tasks.map(t => {
    const assignee = hubEsc(hubGetTeamName(t.assigneeId));
    const startFmt = t.startDate ? t.startDate.slice(0, 7) : '—';
    const endFmt   = t.endDate   ? t.endDate.slice(0, 7)   : '—';
    const statusBadge = hubStatusBadge(t.status);
    const catBadge    = t.category
      ? `<span class="hub-cat">${hubEsc(t.category)}</span>`
      : '<span class="hub-cat" style="opacity:.4">—</span>';

    return `
      <tr>
        <td>${hubEsc(t.name)}</td>
        <td>${catBadge}</td>
        <td>${assignee}</td>
        <td class="col-date">${startFmt}</td>
        <td class="col-date">${endFmt}</td>
        <td class="col-hours">${t.totalHours.toLocaleString()}h</td>
        <td>${statusBadge}</td>
        <td class="col-evm">Phase 2+</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="hub-table">
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Category</th>
          <th>Assignee</th>
          <th>Start</th>
          <th>End</th>
          <th style="text-align:right">BAC (hrs)</th>
          <th>Status</th>
          <th title="Earned Value fields — available from Phase 2">EVM / EAC</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function hubStatusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'IN_PROGRESS')
    return `<span class="hub-badge hub-badge-active">${hubEsc(status)}</span>`;
  if (s === 'COMPLETE' || s === 'COMPLETED' || s === 'DONE')
    return `<span class="hub-badge hub-badge-complete">${hubEsc(status)}</span>`;
  if (s === 'ON_HOLD' || s === 'HOLD' || s === 'PAUSED')
    return `<span class="hub-badge hub-badge-hold">${hubEsc(status)}</span>`;
  return `<span class="hub-badge hub-badge-scheduled">${hubEsc(status)}</span>`;
}

// ─────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────
function hubOnSearchInput(value) {
  hubTaskSearch = value;
  hubRenderTasks();
  // Keep focus in the search box after re-render
  const el = document.getElementById('hubTaskSearch');
  if (el) { el.focus(); el.setSelectionRange(value.length, value.length); }
}
