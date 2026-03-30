/**
 * MCS (Manufacturing Change) - Main Portal
 * Handles list rendering, filtering, sorting, and user interactions
 */

import { appState } from '../../../core/js/state.js'
import { currentUser, supabase as supa } from '../../../core/js/supa.js'
import { esc } from '../../../utils/js/helpers.js'
import { showGuide } from '../../../utils/js/guide.js'
import { mcsShowCreateModal } from './mcs-modal-create.js'
import { mcsShowViewModal } from './mcs-modal-view.js'
import { mcsDataSubscribe as mcsRealtimeSubscribe, mcsDataUnsubscribe as mcsRealtimeUnsubscribe } from './mcs-realtime.js'
import { mcsApproversLoad } from './mcs-approvers-data.js'
import { mcsParseExtendedJustification, mcsFormatTimelineEvents } from './mcs-modal-shared.js'

function mcsEnsureFilterDefaults() {
  appState.mcsCurrentFilter = {
    status: 'all',
    priority: 'all',
    type: 'all',
    source: 'all',
    product: 'all',
    myChanges: false,
    overdueOnly: false,
    highPriority: false,
    dateRange: 'all',
    ...(appState.mcsCurrentFilter || {})
  }
}

function mcsAttachMainListeners(container) {
  const root = container.querySelector('.mcs-layout')
  if (!root) return

  root.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]')
    if (!trigger) return
    const action = trigger.dataset.action
    const value = trigger.dataset.value || ''
    const filterType = trigger.dataset.filter || ''
    const section = trigger.dataset.section || ''
    const id = trigger.dataset.id || ''

    if (action === 'mcs-open-guide') return showGuide('mcs')
    if (action === 'mcs-open-create') return mcsOpenNewChange()
    if (action === 'mcs-toggle-section') return mcsToggleSection(section)
    if (action === 'mcs-filter') return mcsSetFilter(filterType, value, trigger)
    if (action === 'mcs-toggle-quick') return mcsToggleQuickFilter(filterType, trigger.dataset.checked === 'true')
    if (action === 'mcs-date-range') return mcsSetDateRange(value)
    if (action === 'mcs-clear-filters') return mcsClearFilters()
    if (action === 'mcs-kpi-open') return mcsSetFilter('status', 'open', document.querySelector('[data-filter="status"][data-value="open"]'))
    if (action === 'mcs-kpi-approval1') return mcsKpiFilterApproval1()
    if (action === 'mcs-kpi-approval2') return mcsKpiFilterApproval2()
    if (action === 'mcs-kpi-overdue') return mcsToggleQuickFilter('overdueOnly', true)
    if (action === 'mcs-view-change') return mcsViewChange(id)
  })

  root.addEventListener('input', (e) => {
    if (e.target.id === 'mcs-search-input') mcsRenderList()
  })

  root.addEventListener('change', (e) => {
    if (e.target.id === 'mcs-sort-select') mcsRenderList()
    if (e.target.id === 'mcs-product-filter') mcsSetFilter('product', e.target.value, null)
    if (e.target.id === 'mcs-date-range') mcsSetDateRange(e.target.value)
    if (e.target.id === 'mcs-qf-mychanges') mcsToggleQuickFilter('myChanges', e.target.checked === true)
    if (e.target.id === 'mcs-qf-overdue') mcsToggleQuickFilter('overdueOnly', e.target.checked === true)
    if (e.target.id === 'mcs-qf-highpri') mcsToggleQuickFilter('highPriority', e.target.checked === true)
  })
}

export async function renderMcs() {
  const container = document.getElementById('mainContent')
  if (!container) return
  mcsEnsureFilterDefaults()

  container.innerHTML = `
    <div class="mcs-layout">
      <div class="mcs-portal">
        <div class="mcs-toolbar">
          <div class="mcs-toolbar-title">Change Register <span class="mcs-toolbar-count" id="mcs-list-count"></span></div>
          <div class="mcs-toolbar-controls">
            <span class="mcs-sort-label">SORT:</span>
            <select class="mcs-sort-select" id="mcs-sort-select">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button class="btn btn-ghost btn-sm" data-action="mcs-open-guide" title="User Guide">❓ Guide</button>
            <button class="btn btn-primary btn-sm" data-action="mcs-open-create">+ Raise a Change</button>
          </div>
        </div>
        <div class="mcs-kpi-bar" id="mcs-kpi-bar">
          <div class="mcs-kpi-card kpi-open" data-action="mcs-kpi-open" title="Filter: Open">
            <div class="mcs-kpi-value" id="mcs-kpi-open">0</div>
            <div class="mcs-kpi-label">Open</div>
          </div>
          <div class="mcs-kpi-card kpi-review" data-action="mcs-kpi-approval1" title="Filter: Awaiting Engineering Review">
            <div class="mcs-kpi-value" id="mcs-kpi-approval1">0</div>
            <div class="mcs-kpi-label">Approval 1</div>
          </div>
          <div class="mcs-kpi-card kpi-final-review" data-action="mcs-kpi-approval2" title="Filter: Awaiting Final Review">
            <div class="mcs-kpi-value" id="mcs-kpi-approval2">0</div>
            <div class="mcs-kpi-label">Approval 2</div>
          </div>
          <div class="mcs-kpi-card kpi-overdue" data-action="mcs-kpi-overdue" title="Filter: Overdue">
            <div class="mcs-kpi-value" id="mcs-kpi-overdue">0</div>
            <div class="mcs-kpi-label">Overdue</div>
          </div>
          <div class="mcs-kpi-card kpi-week" title="Created this week">
            <div class="mcs-kpi-value" id="mcs-kpi-week">0</div>
            <div class="mcs-kpi-label">This Week</div>
          </div>
        </div>
        <div class="mcs-list" id="mcs-list-container"></div>
      </div>

      <aside class="mcs-sidebar">
        <div class="mcs-search-wrap">
          <input class="mcs-search-input" placeholder="Search changes..." id="mcs-search-input" />
        </div>

        <div class="mcs-filter-section" id="mcs-section-status">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="status">
            <span>Status</span><span class="mcs-toggle-icon" id="mcs-icon-status">▼</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-status">
            <button class="mcs-filter-btn active" data-action="mcs-filter" data-filter="status" data-value="all">All Changes <span class="mcs-filter-count" id="mcs-fc-all">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="open">Open <span class="mcs-filter-count" id="mcs-fc-open">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="review">Awaiting Approval 1 <span class="mcs-filter-count" id="mcs-fc-review">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="implementing">Implementing <span class="mcs-filter-count" id="mcs-fc-implementing">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="final_review">Awaiting Approval 2 <span class="mcs-filter-count" id="mcs-fc-final_review">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="implemented">Implemented <span class="mcs-filter-count" id="mcs-fc-implemented">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="status" data-value="closed">Closed <span class="mcs-filter-count" id="mcs-fc-closed">0</span></button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-priority">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="priority"><span>Priority</span><span class="mcs-toggle-icon" id="mcs-icon-priority">▶</span></button>
          <div class="mcs-section-body" id="mcs-body-priority" style="display:none">
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="priority" data-value="critical">Critical <span class="mcs-filter-count" id="mcs-fc-critical">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="priority" data-value="high">High <span class="mcs-filter-count" id="mcs-fc-high">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="priority" data-value="medium">Medium <span class="mcs-filter-count" id="mcs-fc-medium">0</span></button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="priority" data-value="low">Low <span class="mcs-filter-count" id="mcs-fc-low">0</span></button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-type">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="type"><span>Change Type</span><span class="mcs-toggle-icon" id="mcs-icon-type">▶</span></button>
          <div class="mcs-section-body" id="mcs-body-type" style="display:none">
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Engineering">Engineering</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Process">Process</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Material">Material</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Tooling">Tooling</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Quality">Quality</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="type" data-value="Safety">Safety</button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-source">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="source"><span>Source</span><span class="mcs-toggle-icon" id="mcs-icon-source">▶</span></button>
          <div class="mcs-section-body" id="mcs-body-source" style="display:none">
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="source" data-value="Manual">Manual</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="source" data-value="PFMEA">PFMEA</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="source" data-value="Risk">Risk</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="source" data-value="Customer">Customer</button>
            <button class="mcs-filter-btn" data-action="mcs-filter" data-filter="source" data-value="Quality">Quality</button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-product">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="product"><span>Product</span><span class="mcs-toggle-icon" id="mcs-icon-product">▶</span></button>
          <div class="mcs-section-body" id="mcs-body-product" style="display:none">
            <select class="mcs-date-range-select" id="mcs-product-filter"><option value="all">All Products</option></select>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-quick">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="quick"><span>Quick Filters</span><span class="mcs-toggle-icon" id="mcs-icon-quick">▼</span></button>
          <div class="mcs-section-body" id="mcs-body-quick">
            <label class="mcs-quick-filter-label"><input type="checkbox" id="mcs-qf-mychanges" />My Changes</label>
            <label class="mcs-quick-filter-label"><input type="checkbox" id="mcs-qf-overdue" />Overdue Only</label>
            <label class="mcs-quick-filter-label"><input type="checkbox" id="mcs-qf-highpri" />High Priority</label>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-date">
          <button class="mcs-section-toggle" data-action="mcs-toggle-section" data-section="date"><span>Date Range</span><span class="mcs-toggle-icon" id="mcs-icon-date">▶</span></button>
          <div class="mcs-section-body" id="mcs-body-date" style="display:none">
            <select class="mcs-date-range-select" id="mcs-date-range">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        <div style="padding: 8px 0;">
          <button class="mcs-clear-filters" data-action="mcs-clear-filters">✕ Clear All Filters</button>
        </div>
      </aside>
    </div>
  `

  mcsAttachMainListeners(container)

  await Promise.all([
    mcsLoadChanges(),
    (async () => {
        if (!appState.mcsApproverConfigLoading) {
          appState.mcsApproverConfigLoading = true
          appState.mcsApproverConfig = await mcsApproversLoad()
          appState.mcsApproverConfigLoading = false
        }
      })()
  ])

  mcsRenderList()
  mcsRealtimeSubscribe()

  if (appState.mcsAutoViewId) {
    const autoId = appState.mcsAutoViewId
    appState.mcsAutoViewId = null
    mcsViewChange(autoId)
  }
}

export async function mcsLoadChanges() {
  appState.mcsLoading = true
  try {
    if (!supa) {
      console.error('Supabase not initialized')
      appState.mcsList = []
      return
    }

    const { data, error } = await supa.from('mcs_changes').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading MCS changes:', error)
      appState.mcsList = []
      return
    }

    const { data: impactsData } = await supa.from('mcs_impacts').select('change_id, impact_type')
    const impactsByChange = {}
    ;(impactsData || []).forEach(imp => {
      if (!impactsByChange[imp.change_id]) impactsByChange[imp.change_id] = []
      impactsByChange[imp.change_id].push(imp.impact_type)
    })

    appState.mcsList = (data || []).map(change => {
      const parsed = mcsParseExtendedJustification(change.justification || '')
      return {
        ...change,
        impacts: impactsByChange[change.id] || [],
        impact_progress: change.impact_progress && typeof change.impact_progress === 'object'
          ? change.impact_progress
          : (parsed.impactProgress || {})
      }
    })
  } catch (err) {
    console.error('MCS load error:', err)
    appState.mcsList = []
  } finally {
    appState.mcsLoading = false
  }
}

export function mcsSetFilter(filterType, value, el) {
  appState.mcsCurrentFilter = { ...appState.mcsCurrentFilter, [filterType]: value }
  if (el) {
    const buttons = el.parentElement.querySelectorAll('.mcs-filter-btn')
    buttons.forEach(b => b.classList.remove('active'))
    el.classList.add('active')
  }
  mcsRenderList()
}

function mcsGetFiltered() {
  const q = document.getElementById('mcs-search-input')?.value.toLowerCase() || ''
  let filtered = appState.mcsList.filter(change => {
    if (q) {
      const searchText = (
        change.title + ' ' + change.id + ' ' + (change.part_drawing_no || '') + ' ' +
        (change.initiated_by || '') + ' ' + change.change_type + ' ' + (change.description || '')
      ).toLowerCase()
      if (!searchText.includes(q)) return false
    }

    if (appState.mcsCurrentFilter.status !== 'all') {
      const matchClosed = appState.mcsCurrentFilter.status === 'closed' &&
        (change.status === 'closed' || change.status === 'rejected' || change.status === 'approved')
      if (!matchClosed && change.status !== appState.mcsCurrentFilter.status) return false
    }

    if (appState.mcsCurrentFilter.priority !== 'all' && change.priority !== appState.mcsCurrentFilter.priority) return false
    if (appState.mcsCurrentFilter.type !== 'all' && change.change_type !== appState.mcsCurrentFilter.type) return false
    if (appState.mcsCurrentFilter.source !== 'all' && change.change_source !== appState.mcsCurrentFilter.source) return false
    if (appState.mcsCurrentFilter.product !== 'all' && change.part_drawing_no !== appState.mcsCurrentFilter.product) return false

    if (appState.mcsCurrentFilter.myChanges) {
      const email = currentUser ? currentUser.email : null
      if (!email || change.initiated_by !== email) return false
    }
    if (appState.mcsCurrentFilter.overdueOnly && !mcsIsOverdue(change)) return false
    if (appState.mcsCurrentFilter.highPriority && change.priority !== 'critical' && change.priority !== 'high') return false

    if (appState.mcsCurrentFilter.dateRange !== 'all' && change.created_at) {
      const created = new Date(change.created_at)
      const now = new Date()
      if (appState.mcsCurrentFilter.dateRange === 'today') {
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
        if (created < todayStart) return false
      } else if (appState.mcsCurrentFilter.dateRange === 'week') {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
        if (created < weekStart) return false
      } else if (appState.mcsCurrentFilter.dateRange === 'month') {
        const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30)
        if (created < monthStart) return false
      } else if (appState.mcsCurrentFilter.dateRange === 'quarter') {
        const quarterStart = new Date(now); quarterStart.setDate(now.getDate() - 90)
        if (created < quarterStart) return false
      }
    }
    return true
  })

  const sortKey = document.getElementById('mcs-sort-select')?.value || 'date-desc'
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const statusOrder = { open: 0, review: 1, implementing: 2, final_review: 3, implemented: 4, closed: 5, approved: 4, rejected: 5 }
  if (sortKey === 'date-desc') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  else if (sortKey === 'date-asc') filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  else if (sortKey === 'priority') filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  else if (sortKey === 'status') filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  return filtered
}

export function mcsUpdateCounts() {
  const counts = { all: appState.mcsList.length, open: 0, review: 0, implementing: 0, final_review: 0, implemented: 0, closed: 0, critical: 0, high: 0, medium: 0, low: 0 }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)
  let overdueCount = 0
  let thisWeekCount = 0

  appState.mcsList.forEach(change => {
    if (counts[change.status] !== undefined) counts[change.status]++
    if (change.status === 'rejected' || change.status === 'approved') counts.closed++
    if (counts[change.priority] !== undefined) counts[change.priority]++
    if (mcsIsOverdue(change)) overdueCount++
    if (change.created_at) {
      const created = new Date(change.created_at)
      if (created >= weekAgo) thisWeekCount++
    }
  })

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
  setEl('mcs-fc-all', counts.all); setEl('mcs-fc-open', counts.open); setEl('mcs-fc-review', counts.review)
  setEl('mcs-fc-implementing', counts.implementing); setEl('mcs-fc-final_review', counts.final_review)
  setEl('mcs-fc-implemented', counts.implemented); setEl('mcs-fc-closed', counts.closed)
  setEl('mcs-fc-critical', counts.critical); setEl('mcs-fc-high', counts.high); setEl('mcs-fc-medium', counts.medium); setEl('mcs-fc-low', counts.low)
  setEl('mcs-kpi-open', counts.open); setEl('mcs-kpi-approval1', counts.review); setEl('mcs-kpi-approval2', counts.final_review)
  setEl('mcs-kpi-overdue', overdueCount); setEl('mcs-kpi-week', thisWeekCount)

  const productSelect = document.getElementById('mcs-product-filter')
  if (productSelect) {
    const currentProduct = appState.mcsCurrentFilter.product
    const products = [...new Set(appState.mcsList.filter(c => c.part_drawing_no).map(c => c.part_drawing_no))].sort()
    productSelect.innerHTML = '<option value="all">All Products</option>' +
      products.map(p => `<option value="${esc(p)}"${currentProduct === p ? ' selected' : ''}>${esc(p)}</option>`).join('')
  }
}

export function mcsRenderCardHTML(change) {
  const impactCount = (change.impacts || []).length
  const impactStr = impactCount > 0 ? `${impactCount} impact${impactCount !== 1 ? 's' : ''}` : 'No impacts'
  const overdue = mcsIsOverdue(change)
  const targetStr = change.target_implementation ? `<span class="${overdue ? 'mcs-overdue-date' : ''}">🎯 ${change.target_implementation}${overdue ? ' ⚠' : ''}</span>` : ''
  const partStr = change.part_drawing_no ? `<span>📦 ${esc(change.part_drawing_no)}</span>` : ''
  const timeStr = change.estimated_time_impact_hours ? `<div class="mcs-card-time-impact">⏱ ${change.estimated_time_impact_hours > 0 ? '+' : ''}${change.estimated_time_impact_hours}h</div>` : ''

  return `
  <div class="mcs-card status-${change.status}" data-id="${esc(change.id)}" data-action="mcs-view-change">
    <div class="mcs-card-header">
      <div class="mcs-card-ref">${esc(change.id)}</div>
      <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
    </div>
    <div class="mcs-card-title">${esc(change.title)}</div>
    <div class="mcs-card-meta">
      <div class="mcs-card-meta-left">
        <span class="mcs-tag">Change Type: ${esc(change.change_type || 'Not set')}</span>
        <span class="mcs-priority-badge mcs-priority-${change.priority}">${change.priority}</span>
      </div>
      <div class="mcs-card-meta-right">
        <div class="mcs-card-impacts">${impactStr}</div>
        ${timeStr}
      </div>
    </div>
    <div class="mcs-card-sep"></div>
    <div class="mcs-card-submeta">
      <span>👤 ${esc(change.initiated_by || 'Unknown')}</span>
      ${partStr}
      <span>📅 ${change.created_at ? change.created_at.split('T')[0] : '—'}</span>
      ${targetStr}
    </div>
  </div>`
}

export function mcsRenderList() {
  mcsUpdateCounts()
  const filtered = mcsGetFiltered()
  const container = document.getElementById('mcs-list-container')
  const countEl = document.getElementById('mcs-list-count')
  if (!container || !countEl) return
  countEl.textContent = `(${filtered.length})`

  if (!filtered.length) {
    const isFiltered = appState.mcsCurrentFilter.status !== 'all' || appState.mcsCurrentFilter.priority !== 'all' ||
      appState.mcsCurrentFilter.type !== 'all' || appState.mcsCurrentFilter.source !== 'all' ||
      appState.mcsCurrentFilter.product !== 'all' || appState.mcsCurrentFilter.myChanges || appState.mcsCurrentFilter.overdueOnly ||
      appState.mcsCurrentFilter.highPriority || appState.mcsCurrentFilter.dateRange !== 'all' ||
      (document.getElementById('mcs-search-input')?.value?.trim() || '') !== ''

    container.innerHTML = isFiltered
      ? `<div class="mcs-empty-state"><div class="mcs-empty-icon">🔍</div><div class="mcs-empty-text">No changes match your filters</div><div class="mcs-empty-sub">Try adjusting the filters or search term</div></div>`
      : `<div class="mcs-empty-state"><div class="mcs-empty-icon">📋</div><div class="mcs-empty-text">No change requests yet</div><div class="mcs-empty-sub">Click <strong>+ Raise a Change</strong> in the toolbar to log your first engineering change request.</div></div>`
    return
  }

  container.innerHTML = filtered.map(change => mcsRenderCardHTML(change)).join('')
}

export function mcStatusLabel(status) {
  const labels = {
    open: 'Open',
    review: 'Awaiting Approval 1',
    implementing: 'Implementing',
    final_review: 'Awaiting Approval 2',
    implemented: 'Implemented',
    closed: 'Closed',
    approved: 'Approved',
    rejected: 'Closed'
  }
  return labels[status] || status
}

export async function mcsViewChange(id) {
  appState.mcsViewingId = id
  const change = appState.mcsList.find(c => c.id === id)
  if (!change) return
  const { data: timelineData } = await supa.from('mcs_timeline').select('*').eq('change_id', id).order('created_at', { ascending: true })
  change.timeline = mcsFormatTimelineEvents(timelineData || [])
  mcsShowViewModal(change)
}

export async function mcsOpenNewChange() {
  appState.mcsEditingId = null
  await mcsShowCreateModal()
}

function mcsIsOverdue(change) {
  if (!change.target_implementation) return false
  const closedStatuses = ['closed', 'implemented', 'rejected', 'approved']
  if (closedStatuses.includes(change.status)) return false
  const target = new Date(change.target_implementation)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return target < today
}

function mcsToggleSection(section) {
  const body = document.getElementById(`mcs-body-${section}`)
  const icon = document.getElementById(`mcs-icon-${section}`)
  if (!body) return
  const isOpen = body.style.display !== 'none'
  body.style.display = isOpen ? 'none' : ''
  if (icon) icon.textContent = isOpen ? '▶' : '▼'
}

function mcsToggleQuickFilter(key, value) {
  appState.mcsCurrentFilter = { ...appState.mcsCurrentFilter, [key]: value }
  const map = { myChanges: 'mcs-qf-mychanges', overdueOnly: 'mcs-qf-overdue', highPriority: 'mcs-qf-highpri' }
  if (map[key]) {
    const cb = document.getElementById(map[key])
    if (cb) cb.checked = value
  }
  mcsRenderList()
}

function mcsSetDateRange(value) {
  appState.mcsCurrentFilter = { ...appState.mcsCurrentFilter, dateRange: value }
  mcsRenderList()
}

function mcsKpiFilterApproval1() {
  const btn = document.querySelector('[data-action="mcs-filter"][data-filter="status"][data-value="review"]')
  mcsSetFilter('status', 'review', btn)
}

function mcsKpiFilterApproval2() {
  const btn = document.querySelector('[data-action="mcs-filter"][data-filter="status"][data-value="final_review"]')
  mcsSetFilter('status', 'final_review', btn)
}

function mcsKpiFilterAwaiting() {
  mcsKpiFilterApproval1()
}

function mcsClearFilters() {
  appState.mcsCurrentFilter = {
    status: 'all',
    priority: 'all',
    type: 'all',
    source: 'all',
    product: 'all',
    myChanges: false,
    overdueOnly: false,
    highPriority: false,
    dateRange: 'all'
  }

  const search = document.getElementById('mcs-search-input')
  if (search) search.value = ''
  const sort = document.getElementById('mcs-sort-select')
  if (sort) sort.value = 'date-desc'
  const dateRange = document.getElementById('mcs-date-range')
  if (dateRange) dateRange.value = 'all'
  const productFilter = document.getElementById('mcs-product-filter')
  if (productFilter) productFilter.value = 'all'
  ;['mcs-qf-mychanges', 'mcs-qf-overdue', 'mcs-qf-highpri'].forEach(id => {
    const cb = document.getElementById(id)
    if (cb) cb.checked = false
  })

  document.querySelectorAll('.mcs-filter-btn').forEach(b => b.classList.remove('active'))
  const allBtn = document.querySelector('[data-action="mcs-filter"][data-filter="status"][data-value="all"]')
  if (allBtn) allBtn.classList.add('active')
  mcsRenderList()
}

export function mcsToast(msg) {
  const el = document.createElement('div')
  el.className = 'mcs-toast show'
  el.textContent = '✓ ' + msg
  document.body.appendChild(el)
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 200)
  }, 3000)
}

export function mcsDataSubscribe() {
  mcsRealtimeSubscribe()
}

export function mcsDataUnsubscribe() {
  mcsRealtimeUnsubscribe()
}
