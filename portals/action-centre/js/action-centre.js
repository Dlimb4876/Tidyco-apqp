// ═══════════════════════════════════
// action-centre.js — My Actions view
// Depends on: state.js, auth.js, helpers.js, navigation.js, settings.js
// ═══════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// Returns the display name for the current logged-in user.
function actionCentreGetMyName() {
  if (!currentUser) return '';
  if (typeof settingsPermissionsData !== 'undefined' && Array.isArray(settingsPermissionsData)) {
    const profile = settingsPermissionsData.find(u => u.id === currentUser.id);
    if (profile && profile.full_name) return profile.full_name;
  }
  return emailToDisplayName(currentUser.email);
}

// ─────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────

async function actionCentreLoad() {
  if (actionCentreLoading) return;
  actionCentreLoading = true;
  if (currentSection === 'action-centre') render();

  try {
    // Ensure user profiles are loaded so the current user's name is known
    if (typeof settingsEnsurePermissionsData === 'function') {
      await settingsEnsurePermissionsData();
    }

    const myName = actionCentreGetMyName();
    if (!myName || !currentUser) {
      actionCentreData = { myName: '', actions: [], pfmea: [], risks: [], error: null };
      return;
    }

    // Fetch all action types assigned to the current user in parallel
    const [actRes, pfmeaRes, riskRes] = await Promise.all([
      supa.from('npi_actions')
        .select('id, description, owner, due_date, status, priority, source, notes, project_id')
        .ilike('owner', myName),
      supa.from('npi_pfmea_causes')
        .select('id, action_desc, action_taken, action_owner, action_due, project_id')
        .ilike('action_owner', myName)
        .neq('action_desc', ''),
      supa.from('npi_risks')
        .select('id, description, owner, category, likelihood, impact, status, project_id')
        .ilike('owner', myName)
    ]);

    // Gather unique project IDs to resolve names in one query
    const projectIds = new Set([
      ...(actRes.data || []).map(r => r.project_id),
      ...(pfmeaRes.data || []).map(r => r.project_id),
      ...(riskRes.data || []).map(r => r.project_id),
    ].filter(Boolean));

    let projectMap = {};
    if (projectIds.size > 0) {
      const { data: projects } = await supa
        .from('projects')
        .select('id, name')
        .in('id', [...projectIds]);
      if (projects) {
        projects.forEach(p => { projectMap[p.id] = p.name; });
      }
    }

    const getProjectName = id => projectMap[id] || 'Unknown Project';

    actionCentreData = {
      myName,
      error: null,
      actions: (actRes.data || []).map(r => ({
        ...r,
        projectName: getProjectName(r.project_id)
      })),
      pfmea: (pfmeaRes.data || []).map(r => ({
        ...r,
        projectName: getProjectName(r.project_id)
      })),
      risks: (riskRes.data || []).map(r => ({
        ...r,
        projectName: getProjectName(r.project_id)
      }))
    };
  } catch (err) {
    console.error('[ActionCentre] Load failed:', err);
    actionCentreData = { myName: '', actions: [], pfmea: [], risks: [], error: err.message };
  } finally {
    actionCentreLoading = false;
    if (currentSection === 'action-centre' || currentSection === 'hub') render();
  }
}

// ─────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────

// Navigate to the project that owns a given DB project ID, then to `section`.
// Optionally scroll to a specific item by ID.
//
// NPI sub-tables (npi_actions, npi_pfmea_causes, npi_risks) store the database
// primary key UUID (projects.id, held as db.projects[i].dbId) as their project_id.
// progId must be the application-level UUID (projects.prog_id, held as
// db.projects[i].id), so we resolve the value through db.projects before navigating.
function actionCentreGoTo(projectDbId, section, itemId) {
  if (!projectDbId) return;

  // Resolve: look up by dbId first (DB PK UUID stored by npi sub-tables),
  // then fall back to id match (in case they are identical in this deployment).
  const project = db.projects.find(p => p.dbId === projectDbId || p.id === projectDbId);
  if (!project) {
    showToast('Project not found — please refresh the page', 'warning');
    return;
  }
  progId = project.id;

  // Set the item to scroll to based on section type
  if (section === 'actions') selectedActionId = itemId;
  else if (section === 'apqp') selectedPfmeaCauseId = itemId;
  else if (section === 'risks') selectedRiskId = itemId;

  navigate(section);
}

// Update a single NPI action's status directly in Supabase.
async function actionCentreUpdateActionStatus(id, newStatus) {
  if (!id) return;
  try {
    const { error } = await supa.from('npi_actions').update({ status: newStatus }).eq('id', id);
    if (error) { showToast('Could not update status: ' + error.message, 'error'); return; }
    // Reflect change locally so we don't need a full reload
    if (actionCentreData && actionCentreData.actions) {
      const item = actionCentreData.actions.find(a => a.id === id);
      if (item) item.status = newStatus;
    }
    render();
  } catch (err) {
    showToast('Could not update status: ' + err.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────

function renderActionCentre() {
  if (actionCentreLoading) {
    return `
      <div class="sec-head">
        <div><div class="sec-eyebrow">My Work</div><div class="sec-title">Action Centre</div></div>
      </div>
      <div style="padding:60px;text-align:center;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        Loading your actions…
      </div>`;
  }

  if (!actionCentreData) {
    return `
      <div class="sec-head">
        <div><div class="sec-eyebrow">My Work</div><div class="sec-title">Action Centre</div></div>
      </div>
      ${emptyState('✅', 'Nothing here yet', 'Loading…')}`;
  }

  const { myName, actions, pfmea, risks, error } = actionCentreData;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const isOpen = item => item.status !== 'Closed';
  const isOverdue = (item, dueProp) => {
    if (!item[dueProp]) return false;
    const d = new Date(item[dueProp]); d.setHours(0, 0, 0, 0);
    return d < today && isOpen(item);
  };

  // Build unified items list
  const allItems = [
    ...actions.map(a => ({
      id: a.id,
      _type: 'action',
      projectName: a.projectName,
      project_id: a.project_id,
      description: a.description,
      due: a.due_date,
      status: a.status,
      priority: a.priority,
      source: a.source,
      _overdue: isOverdue(a, 'due_date')
    })),
    ...pfmea.map(p => ({
      id: p.id,
      _type: 'pfmea',
      projectName: p.projectName,
      project_id: p.project_id,
      description: p.action_desc,
      due: p.action_due,
      status: p.action_taken ? 'In Progress' : 'Open',
      priority: '—',
      source: 'PFMEA',
      _overdue: p.action_due
        ? (() => { const d = new Date(p.action_due); d.setHours(0,0,0,0); return d < today; })()
        : false
    })),
    ...risks.map(r => ({
      id: r.id,
      _type: 'risk',
      projectName: r.projectName,
      project_id: r.project_id,
      description: r.description,
      due: null,
      status: r.status,
      priority: '—',
      source: 'Risk',
      _overdue: false
    }))
  ];

  // Status filter
  const statusFiltered = actionCentreStatusFilter === 'open'
    ? allItems.filter(i => i.status !== 'Closed')
    : actionCentreStatusFilter === 'closed'
    ? allItems.filter(i => i.status === 'Closed')
    : allItems;

  // Type tab filter
  const tabFiltered = actionCentreTab === 'all'
    ? statusFiltered
    : statusFiltered.filter(i => i._type === actionCentreTab);

  // KPI counts (always over all items, not filtered)
  const totalOpen = allItems.filter(i => i.status !== 'Closed').length;
  const totalOverdue = allItems.filter(i => i._overdue).length;
  const totalClosed = allItems.filter(i => i.status === 'Closed').length;

  // Build table rows
  const rows = tabFiltered.map(item => {
    const typeChip = item._type === 'pfmea'
      ? '<span class="ac-type-chip ac-chip-pfmea">PFMEA</span>'
      : item._type === 'risk'
      ? '<span class="ac-type-chip ac-chip-risk">Risk</span>'
      : '<span class="ac-type-chip ac-chip-action">Action</span>';

    const dueCell = item.due
      ? `<span style="${item._overdue ? 'color:var(--red);font-weight:600' : ''}">${esc(item.due)}</span>`
      : '<span style="color:var(--muted)">—</span>';

    let statusClass = 'ac-status-open';
    if (item.status === 'Closed') statusClass = 'ac-status-closed';
    else if (item.status === 'In Progress') statusClass = 'ac-status-progress';
    else if (item.status === 'Blocked') statusClass = 'ac-status-blocked';

    // Only NPI actions support inline status change from here
    const statusCell = item._type === 'action'
      ? `<select class="cell-edit" style="width:100%" onchange="actionCentreUpdateActionStatus('${esc(item.id)}',this.value)">
          ${['Open','In Progress','Closed','Blocked'].map(s => `<option${item.status===s?' selected':''}>${s}</option>`).join('')}
        </select>`
      : `<span class="${statusClass}">${esc(item.status)}</span>`;

    const goSection = item._type === 'pfmea' ? 'apqp' : item._type === 'risk' ? 'risks' : 'actions';
    const goBtn = `<button class="btn btn-ghost btn-sm" onclick="actionCentreGoTo('${esc(item.project_id)}','${goSection}','${esc(item.id)}')">→ Open</button>`;

    return `<tr class="${item._overdue ? 'row-overdue' : ''}">
      <td class="ac-col-project"><a class="ac-project-link" onclick="actionCentreGoTo('${esc(item.project_id)}','${goSection}','${esc(item.id)}')">${esc(item.projectName)}</a></td>
      <td class="ac-col-type">${typeChip}</td>
      <td class="ac-col-desc">${esc(item.description)}</td>
      <td class="ac-col-due">${dueCell}</td>
      <td class="ac-col-status">${statusCell}</td>
      <td class="ac-col-action">${goBtn}</td>
    </tr>`;
  }).join('');

  const tableOrEmpty = tabFiltered.length === 0
    ? emptyState('✅', 'All clear!',
        actionCentreStatusFilter === 'open' ? 'No open items assigned to you' : 'Nothing to show with this filter')
    : `<div class="ac-table-wrap">
        <table class="tbl ac-table">
          <thead>
            <tr>
              <th class="ac-col-project">Project</th>
              <th class="ac-col-type">Type</th>
              <th class="ac-col-desc">Description</th>
              <th class="ac-col-due">Due</th>
              <th class="ac-col-status">Status</th>
              <th class="ac-col-action"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

  return `
    <div class="sec-head">
      <div>
        <div class="sec-eyebrow">My Work</div>
        <div class="sec-title">Action Centre</div>
        <div class="sec-desc">All actions assigned to <strong>${esc(myName)}</strong> across every project.</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="actionCentreData=null;actionCentreLoading=false;actionCentreLoad()">↺ Refresh</button>
      </div>
    </div>

    ${error ? `<div style="margin-bottom:12px;padding:10px 14px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.25);border-radius:6px;font-size:0.82rem;color:var(--red)">Failed to load: ${esc(error)}</div>` : ''}

    <div class="ac-kpis">
      <div class="kpi-card ac-kpi" style="--kpi-color:var(--amber)">
        <div class="kpi-num" style="font-size:22px">${totalOpen}</div>
        <div class="kpi-label">Open</div>
      </div>
      <div class="kpi-card ac-kpi" style="--kpi-color:var(--red)">
        <div class="kpi-num" style="font-size:22px;color:var(--red)">${totalOverdue}</div>
        <div class="kpi-label">Overdue</div>
      </div>
      <div class="kpi-card ac-kpi" style="--kpi-color:var(--green)">
        <div class="kpi-num" style="font-size:22px;color:var(--green)">${totalClosed}</div>
        <div class="kpi-label">Done</div>
      </div>
    </div>

    <div class="ac-filter-row">
      <div class="ac-filter-group">
        ${['open','all','closed'].map(f => `
          <button class="btn btn-sm ${actionCentreStatusFilter === f ? 'btn-primary' : 'btn-ghost'}"
            onclick="actionCentreStatusFilter='${f}';render()">
            ${f === 'open' ? '🔵 Open' : f === 'closed' ? '✅ Closed' : '📋 All'}
          </button>`).join('')}
      </div>
      <div class="ac-filter-group">
        ${[['all','All types'],['action','Actions'],['pfmea','PFMEA'],['risk','Risks']].map(([t,l]) => `
          <button class="btn btn-sm ${actionCentreTab === t ? 'btn-primary' : 'btn-ghost'}"
            onclick="actionCentreTab='${t}';render()">
            ${esc(l)}
          </button>`).join('')}
      </div>
    </div>

    <div class="card" style="overflow-x:auto">
      <div class="card-head">
        <span class="card-title">Assigned to me</span>
        <span class="card-meta">${tabFiltered.length} item${tabFiltered.length !== 1 ? 's' : ''}</span>
      </div>
      ${tableOrEmpty}
    </div>`;
}
