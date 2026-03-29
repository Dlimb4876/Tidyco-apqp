// ═══════════════════════════════════
// action-centre.js — My Actions view
// Depends on: state.js, auth.js, helpers.js, navigation.js, settings.js
// ═══════════════════════════════════

import { appState, db } from '../../../core/js/state.js'
import { currentUser, supabase } from '../../../core/js/supa.js'
import { esc, emptyState, emailToDisplayName, showToast } from '../../../utils/js/helpers.js'
import { navigate, render } from '../../../utils/js/navigation.js'
import { showGuide } from '../../../utils/js/guide.js'
import { settingsGetCoreState } from '../../settings/js/settings.js'
import { settingsEnsurePermissionsData } from '../../settings/js/settings-teams.js'
import * as mcsApproversData from '../../mcs/js/mcs-approvers-data.js'

let actionCentreDelegationContainer = null

function actionCentreRenderIfVisible() {
  if (appState.currentSection === 'action-centre' || appState.currentSection === 'hub') {
    render()
  }
}

export function actionCentreGetMyName() {
  if (!currentUser) return ''
  const permissionsData = settingsGetCoreState().settingsPermissionsData
  if (Array.isArray(permissionsData)) {
    const profile = permissionsData.find(u => u.id === currentUser.id)
    if (profile && profile.full_name) return profile.full_name
  }
  return emailToDisplayName(currentUser.email)
}

export async function actionCentreLoad() {
  if (appState.actionCentreLoading) return
  appState.actionCentreLoading = true
  if (appState.currentSection === 'action-centre') render()

  try {
    await settingsEnsurePermissionsData()

    const myName = actionCentreGetMyName()
    if (!myName || !currentUser) {
      appState.actionCentreData = { myName: '', actions: [], pfmea: [], risks: [], mcsApprovals: [], error: null }
      return
    }

    if (appState.mcsApproverConfig === null && !appState.mcsApproverConfigLoading) {
      appState.mcsApproverConfigLoading = true
      appState.mcsApproverConfig = await mcsApproversData.mcsApproversLoad()
      appState.mcsApproverConfigLoading = false
    }

    const [actRes, pfmeaRes, riskRes] = await Promise.all([
      supabase.from('npi_actions')
        .select('id, description, owner, due_date, status, priority, source, notes, project_id')
        .ilike('owner', myName),
      supabase.from('npi_pfmea_causes')
        .select('id, action_desc, action_taken, action_owner, action_due, project_id')
        .ilike('action_owner', myName)
        .neq('action_desc', ''),
      supabase.from('npi_risks')
        .select('id, description, owner, category, likelihood, impact, status, project_id')
        .ilike('owner', myName)
    ])

    const projectIds = new Set([
      ...(actRes.data || []).map(r => r.project_id),
      ...(pfmeaRes.data || []).map(r => r.project_id),
      ...(riskRes.data || []).map(r => r.project_id)
    ].filter(Boolean))

    let projectMap = {}
    if (projectIds.size > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('prog_id, name')
        .in('prog_id', [...projectIds])
      if (projects) {
        projects.forEach(p => { projectMap[p.prog_id] = p.name })
      }
    }

    const getProjectName = id => projectMap[id] || 'Unknown Project'

    let mcsApprovals = []
    if (appState.mcsApproverConfig && !appState.mcsApproverConfig._tableNotFound && typeof mcsApproversData.mcsGetPendingApprovalsForMe === 'function') {
      try {
        mcsApprovals = await mcsApproversData.mcsGetPendingApprovalsForMe()
      } catch (_) {}
    }

    appState.actionCentreData = {
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
      })),
      mcsApprovals
    }
  } catch (err) {
    console.error('[ActionCentre] Load failed:', err)
    appState.actionCentreData = { myName: '', actions: [], pfmea: [], risks: [], mcsApprovals: [], error: err.message }
  } finally {
    appState.actionCentreLoading = false
    actionCentreRenderIfVisible()
  }
}

function actionCentreGoToMcs(changeId) {
  if (changeId) appState.mcsAutoViewId = changeId
  navigate('mcs')
}

function actionCentreGoTo(projectProgId, section, itemId) {
  if (!projectProgId) return

  const project = db.projects.find(p => p.id === projectProgId || p.dbId === projectProgId)
  if (!project) {
    showToast('Project not found — please refresh the page', 'warning')
    return
  }
  appState.progId = project.id

  if (section === 'actions') appState.selectedActionId = itemId
  else if (section === 'apqp') appState.selectedPfmeaCauseId = itemId
  else if (section === 'risks') appState.selectedRiskId = itemId

  navigate(section)
}

async function actionCentreUpdateActionStatus(id, newStatus) {
  if (!id) return
  try {
    const { error } = await supabase.from('npi_actions').update({ status: newStatus }).eq('id', id)
    if (error) {
      showToast('Could not update status: ' + error.message, 'error')
      return
    }
    if (appState.actionCentreData && appState.actionCentreData.actions) {
      const item = appState.actionCentreData.actions.find(a => a.id === id)
      if (item) item.status = newStatus
    }
    render()
  } catch (err) {
    showToast('Could not update status: ' + err.message, 'error')
  }
}

export function renderActionCentre() {
  if (appState.actionCentreLoading) {
    return `
      <div class="sec-head">
        <div><div class="sec-eyebrow">My Work</div><div class="sec-title">Action Centre</div></div>
      </div>
      <div style="padding:60px;text-align:center;color:var(--muted)">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        Loading your actions…
      </div>`
  }

  if (!appState.actionCentreData) {
    return `
      <div class="sec-head">
        <div><div class="sec-eyebrow">My Work</div><div class="sec-title">Action Centre</div></div>
      </div>
      ${emptyState('✅', 'Nothing here yet', 'Loading…')}`
  }

  const { myName, actions, pfmea, risks, mcsApprovals = [], error } = appState.actionCentreData
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isOpen = item => item.status !== 'Closed'
  const isOverdue = (item, dueProp) => {
    if (!item[dueProp]) return false
    const d = new Date(item[dueProp])
    d.setHours(0, 0, 0, 0)
    return d < today && isOpen(item)
  }

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
        ? (() => { const d = new Date(p.action_due); d.setHours(0, 0, 0, 0); return d < today })()
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
    })),
    ...mcsApprovals.map(({ change, stepLabel }) => ({
      id: change.id,
      _type: 'mcs-approval',
      _mcsChange: change,
      projectName: 'Mfg. Change System',
      project_id: null,
      description: change.title,
      due: change.target_implementation || null,
      status: 'Pending Approval',
      priority: change.priority || '—',
      source: `MCS — ${stepLabel}`,
      _overdue: change.target_implementation
        ? (() => { const d = new Date(change.target_implementation); d.setHours(0, 0, 0, 0); return d < today })()
        : false
    }))
  ]

  const statusFiltered = appState.actionCentreStatusFilter === 'open'
    ? allItems.filter(i => i.status !== 'Closed')
    : appState.actionCentreStatusFilter === 'closed'
      ? allItems.filter(i => i.status === 'Closed' && i._type !== 'mcs-approval')
      : allItems

  const tabFiltered = appState.actionCentreTab === 'all'
    ? statusFiltered
    : statusFiltered.filter(i => i._type === appState.actionCentreTab)

  const totalOpen = allItems.filter(i => i.status !== 'Closed').length
  const totalOverdue = allItems.filter(i => i._overdue).length
  const totalClosed = allItems.filter(i => i.status === 'Closed').length

  const rows = tabFiltered.map(item => {
    const typeChip = item._type === 'pfmea'
      ? '<span class="ac-type-chip ac-chip-pfmea">PFMEA</span>'
      : item._type === 'risk'
        ? '<span class="ac-type-chip ac-chip-risk">Risk</span>'
        : item._type === 'mcs-approval'
          ? '<span class="ac-type-chip ac-chip-mcs">MCS</span>'
          : '<span class="ac-type-chip ac-chip-action">Action</span>'

    const dueCell = item.due
      ? `<span style="${item._overdue ? 'color:var(--red);font-weight:600' : ''}">${esc(item.due)}</span>`
      : '<span style="color:var(--muted)">—</span>'

    let statusClass = 'ac-status-open'
    if (item.status === 'Closed') statusClass = 'ac-status-closed'
    else if (item.status === 'In Progress') statusClass = 'ac-status-progress'
    else if (item.status === 'Blocked') statusClass = 'ac-status-blocked'

    const statusCell = item._type === 'action'
      ? `<select class="cell-edit ac-status-select" style="width:100%" data-hub-action="set-action-status" data-id="${esc(item.id)}">
          ${['Open', 'In Progress', 'Closed', 'Blocked'].map(s => `<option${item.status === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>`
      : `<span class="${statusClass}">${esc(item.status)}</span>`

    const goSection = item._type === 'pfmea' ? 'apqp' : item._type === 'risk' ? 'risks' : 'actions'
    const goBtn = item._type === 'mcs-approval'
      ? `<button class="btn btn-ghost btn-sm" data-hub-action="go-mcs" data-id="${esc(item.id)}">→ Review</button>`
      : `<button class="btn btn-ghost btn-sm" data-hub-action="go-item" data-project-id="${esc(item.project_id)}" data-section="${goSection}" data-id="${esc(item.id)}">→ Open</button>`

    return `<tr class="${item._overdue ? 'row-overdue' : ''}">
      <td class="ac-col-project"><a class="ac-project-link" data-hub-action="go-item" data-project-id="${esc(item.project_id)}" data-section="${goSection}" data-id="${esc(item.id)}">${esc(item.projectName)}</a></td>
      <td class="ac-col-type">${typeChip}</td>
      <td class="ac-col-desc">${esc(item.description)}</td>
      <td class="ac-col-due">${dueCell}</td>
      <td class="ac-col-status">${statusCell}</td>
      <td class="ac-col-action">${goBtn}</td>
    </tr>`
  }).join('')

  const tableOrEmpty = tabFiltered.length === 0
    ? emptyState('✅', 'All clear!', appState.actionCentreStatusFilter === 'open' ? 'No open items assigned to you' : 'Nothing to show with this filter')
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
      </div>`

  const activeApprovalsPanel = mcsApprovals.length > 0 ? (() => {
    const approvalRows = mcsApprovals.map(({ change, stepLabel }) => {
      const priorityColor = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--accent)', low: 'var(--text3)' }[change.priority] || 'var(--text3)'
      const target = change.target_implementation || '—'
      const targetOverdue = change.target_implementation
        ? (() => { const d = new Date(change.target_implementation); d.setHours(0, 0, 0, 0); return d < today })()
        : false
      return `<tr>
        <td class="ac-col-ecrid"><span class="ac-ecr-badge">${esc(change.id)}</span></td>
        <td class="ac-col-desc" style="font-weight:500">${esc(change.title)}</td>
        <td><span class="mcs-tag" style="font-size:11px">${esc(change.change_type || '—')}</span></td>
        <td><span style="font-size:11px;font-weight:700;color:${priorityColor};text-transform:capitalize">${esc(change.priority || '—')}</span></td>
        <td><span class="ac-approvals-step-badge">${esc(stepLabel)}</span></td>
        <td style="font-family:var(--mono);font-size:12px;${targetOverdue ? 'color:var(--red);font-weight:600' : 'color:var(--text3)'}">${esc(target)}</td>
        <td style="text-align:right"><button class="btn btn-primary btn-sm" data-hub-action="go-mcs" data-id="${esc(change.id)}">Review ECR →</button></td>
      </tr>`
    }).join('')

    return `
      <div class="card ac-approvals-card">
        <div class="card-head">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="ac-approvals-icon">🔔</span>
            <div>
              <span class="card-title">Pending Approvals</span>
              <span class="card-meta">${mcsApprovals.length} ECR${mcsApprovals.length !== 1 ? 's' : ''} awaiting your sign-off</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" data-hub-action="go-mcs-list">View all ECRs →</button>
        </div>
        <div class="ac-table-wrap">
          <table class="tbl ac-table ac-approvals-table">
            <thead>
              <tr>
                <th class="ac-col-ecrid">ECR</th>
                <th class="ac-col-desc">Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Your Step</th>
                <th>Target</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${approvalRows}</tbody>
          </table>
        </div>
      </div>`
  })() : ''

  return `
    <div id="action-centre-container">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">My Work</div>
          <div class="sec-title">Action Centre</div>
          <div class="sec-desc">All actions assigned to <strong>${esc(myName)}</strong> across every project.</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" data-hub-action="show-guide" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost btn-sm" data-hub-action="refresh">↺ Refresh</button>
        </div>
      </div>

      ${error ? `<div style="margin-bottom:12px;padding:10px 14px;background:var(--status-red-bg);border:1px solid var(--chart-red-pale);border-radius:6px;font-size:0.82rem;color:var(--red)">Failed to load: ${esc(error)}</div>` : ''}

      ${activeApprovalsPanel}

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
          ${['open', 'all', 'closed'].map(f => `
            <button class="btn btn-sm ${appState.actionCentreStatusFilter === f ? 'btn-primary' : 'btn-ghost'}" data-hub-action="set-status-filter" data-filter="${f}">
              ${f === 'open' ? '🔵 Open' : f === 'closed' ? '✅ Closed' : '📋 All'}
            </button>`).join('')}
        </div>
        <div class="ac-filter-group">
          ${[['all', 'All types'], ['action', 'Actions'], ['pfmea', 'PFMEA'], ['risk', 'Risks'], ['mcs-approval', 'MCS Approvals']].map(([t, l]) => `
            <button class="btn btn-sm ${appState.actionCentreTab === t ? 'btn-primary' : 'btn-ghost'}" data-hub-action="set-tab-filter" data-filter="${t}">
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
      </div>
    </div>`
}

function setupActionCentreDelegation() {
  const container = document.getElementById('action-centre-container')
  if (!container || actionCentreDelegationContainer === container) return
  actionCentreDelegationContainer = container

  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-hub-action]')
    if (!actionEl || !container.contains(actionEl)) return
    const action = actionEl.dataset.hubAction

    if (action === 'show-guide') {
      showGuide('action-centre')
      return
    }
    if (action === 'refresh') {
      appState.actionCentreData = null
      appState.actionCentreLoading = false
      actionCentreLoad()
      return
    }
    if (action === 'set-status-filter') {
      appState.actionCentreStatusFilter = actionEl.dataset.filter || 'open'
      render()
      return
    }
    if (action === 'set-tab-filter') {
      appState.actionCentreTab = actionEl.dataset.filter || 'all'
      render()
      return
    }
    if (action === 'go-item') {
      actionCentreGoTo(actionEl.dataset.projectId || '', actionEl.dataset.section || 'actions', actionEl.dataset.id || '')
      return
    }
    if (action === 'go-mcs') {
      actionCentreGoToMcs(actionEl.dataset.id || '')
      return
    }
    if (action === 'go-mcs-list') {
      navigate('mcs')
    }
  })

  container.addEventListener('change', (event) => {
    const selectEl = event.target.closest('.ac-status-select')
    if (!selectEl || !container.contains(selectEl)) return
    actionCentreUpdateActionStatus(selectEl.dataset.id || '', selectEl.value)
  })
}

export function actionCentreDataSubscribe() {
  setupActionCentreDelegation()
}

export function actionCentreDataUnsubscribe() {
  actionCentreDelegationContainer = null
}
