// ═══════════════════════════════════
// operations-dashboard-main.js — entrypoint and exports
// ═══════════════════════════════════

import { appState } from '../../../core/js/state.js'
import { flushDeferred } from '../../../utils/js/render-scheduler.js'
import { esc } from '../../../utils/js/helpers.js'
import { showGuide } from '../../../utils/js/guide.js'
import {
  operationsDashboardState,
  setOpsRefreshCurrentTab
} from './operations-dashboard-state.js'
import {
  opsBuildMetrics,
  opsSetReportingDate
} from './operations-dashboard-metrics.js'
import {
  opsRealtimeInit,
  opsRealtimeCleanup,
  opsRefreshCurrentTab
} from './operations-dashboard-realtime.js'
import {
  opsRenderOverview,
  opsRenderFlowView,
  opsRenderRiskView,
  opsRenderPeopleView,
  opsRenderActionsView
} from './operations-dashboard-render-core.js'
import {
  opsRenderForecastView,
  opsRenderForecastChart
} from './operations-dashboard-forecast-view.js'
import {
  opsForecastSubmit,
  opsForecastDelete,
  opsForecastSetStatus,
  opsForecastStartEdit,
  opsForecastCancelEdit,
  opsForecastStartInlineEdit,
  opsForecastCancelInline,
  opsForecastSaveInline,
  opsForecastInlineKeydown,
  opsForecastSetSort,
  opsForecastSetFilterStatus,
  opsForecastSetFilterText,
  opsForecastToggleArchived
} from './operations-dashboard-forecast-actions.js'
import { opsGenerateInfographic } from './operations-infographic.js'

export function setOperationsTab(tab) {
  const prevTab = appState.operationsTab
  appState.operationsTab = tab || 'overview'

  const parts = []
  if (appState.progId) parts.push('p=' + encodeURIComponent(appState.progId))
  parts.push('s=operations')
  if (appState.operationsTab !== 'overview') {
    parts.push('od=' + encodeURIComponent(appState.operationsTab))
  }

  const hash = '#' + parts.join('&')
  if (typeof globalThis.writeNavigationHistory === 'function') {
    globalThis.writeNavigationHistory(hash, { push: prevTab !== appState.operationsTab })
  } else {
    history.replaceState(null, '', hash)
  }
  if (typeof globalThis.render === 'function') globalThis.render()
  if (typeof globalThis.updateBackButton === 'function') globalThis.updateBackButton()
}

function applyOpsQuickNav(el) {
  const dest = el.dataset.dest
  if (!dest) return

  const scope = el.dataset.tabScope
  const tabKey = el.dataset.tabKey
  if (typeof globalThis.navigate === 'function') globalThis.navigate(dest)

  if (!tabKey || !scope) return
  if (scope === 'capacity' && typeof globalThis.setCapacityTab === 'function') {
    globalThis.setCapacityTab(tabKey)
  }
  if (scope === 'production' && typeof globalThis.setProductionTab === 'function') {
    globalThis.setProductionTab(tabKey)
  }
  if (scope === 'product-development' && typeof globalThis.setProductDevelopmentTab === 'function') {
    globalThis.setProductDevelopmentTab(tabKey)
  }
}

function setupOpsPulseFeed() {
  const container = document.getElementById('ops-dashboard')
  if (!container || operationsDashboardState.opsPulseFeedContainer === container) return
  operationsDashboardState.opsPulseFeedContainer = container

  container.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]')
    if (!el || !container.contains(el)) return

    const action = el.dataset.action
    if (action === 'ops-set-tab') return setOperationsTab(el.dataset.tab || 'overview')
    if (action === 'ops-reset-reporting-date') return opsResetReportingDate()
    if (action === 'ops-nav-hub') return globalThis.navigate?.('hub')
    if (action === 'ops-generate-infographic') return opsGenerateInfographic()
    if (action === 'ops-show-guide') return showGuide('operations')
    if (action === 'pulse-navigate' || action === 'metric-navigate' || action === 'ops-quick-nav') {
      return applyOpsQuickNav(el)
    }
    if (action === 'ops-forecast-toggle-archived') return opsForecastToggleArchived()
    if (action === 'ops-forecast-save-inline') return opsForecastSaveInline(el.dataset.id || '')
    if (action === 'ops-forecast-cancel-inline') return opsForecastCancelInline()
    if (action === 'ops-forecast-start-inline') return opsForecastStartInlineEdit(el.dataset.id || '')
    if (action === 'ops-forecast-archive') return opsForecastSetStatus(el.dataset.id || '', 'archived')
    if (action === 'ops-forecast-delete') return opsForecastDelete(el.dataset.id || '')
    if (action === 'ops-forecast-cancel-edit') return opsForecastCancelEdit()
    if (action === 'ops-forecast-sort') return opsForecastSetSort(el.dataset.col || '')
    if (action === 'ops-forecast-shift-month') {
      const direction = el.dataset.direction === 'prev' ? 'prev' : 'next'
      if (typeof globalThis.prodCapShiftMonth === 'function') {
        globalThis.prodCapShiftMonth(direction)
      }
      return
    }
    if (action === 'ops-forecast-reset-month') {
      if (typeof globalThis.prodCapResetMonthOffset === 'function') {
        globalThis.prodCapResetMonthOffset()
      }
      return
    }
  })

  container.addEventListener('change', (event) => {
    const el = event.target.closest('[data-action]')
    if (!el || !container.contains(el)) return

    if (el.dataset.action === 'ops-set-reporting-date') return opsSetReportingDateAndRefresh(el.value)
    if (el.dataset.action === 'ops-forecast-filter-status') return opsForecastSetFilterStatus(el.value)
  })

  container.addEventListener('input', (event) => {
    const el = event.target.closest('[data-action]')
    if (!el || !container.contains(el)) return

    if (el.dataset.action === 'ops-forecast-filter-text') return opsForecastSetFilterText(el.value)
  })

  container.addEventListener('keydown', (event) => {
    const el = event.target.closest('[data-action]')
    if (!el || !container.contains(el)) return
    if (el.dataset.action === 'ops-forecast-inline-keydown') {
      opsForecastInlineKeydown(event, el.dataset.id || '')
    }
  })

  container.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-action]')
    if (!form || !container.contains(form)) return
    if (form.dataset.action === 'ops-forecast-submit') {
      opsForecastSubmit(event)
    }
  })

  container.addEventListener('focusout', function(evt) {
    const nextFocus = evt.relatedTarget
    if (nextFocus && nextFocus.closest('table')) return
    flushDeferred('ops')
  })
}

export function renderOperations() {
  opsRealtimeInit()

  const tab = appState.operationsTab || 'overview'
  const metrics = opsBuildMetrics()

  let body = ''
  if (tab === 'flow') body = opsRenderFlowView(metrics)
  else if (tab === 'risk') body = opsRenderRiskView(metrics)
  else if (tab === 'people') body = opsRenderPeopleView(metrics)
  else if (tab === 'actions') body = opsRenderActionsView(metrics)
  else if (tab === 'forecast') body = opsRenderForecastView(metrics)
  else body = opsRenderOverview(metrics)

  setTimeout(() => {
    setupOpsPulseFeed()
    if (tab === 'forecast' && appState.currentSection === 'operations' && (appState.operationsTab || 'overview') === 'forecast') {
      opsRenderForecastChart(metrics.forecast)
    }
  }, 0)

  return `
    <div class="proj-home ops-home" id="ops-dashboard">
      <div class="proj-home-header ops-headline">
        <div>
          <div class="proj-home-title">Operations Mission Control</div>
          <div class="proj-home-sub">Command surface with live operational signals as of ${esc(metrics.reportingDateLabel)}</div>
        </div>
        <div class="ops-headline-actions">
          <div class="ops-reporting-date">
            <label for="opsReportingDate">Reporting Date</label>
            <div class="ops-reporting-date-controls">
              <input id="opsReportingDate" type="date" value="${esc(metrics.reportingDateIso)}" data-action="ops-set-reporting-date" />
              <button class="btn btn-ghost btn-sm" data-action="ops-reset-reporting-date">Today</button>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="ops-nav-hub">← Back to Portal</button>
          <button class="btn btn-ghost btn-sm" data-action="ops-generate-infographic" title="Generate capacity infographic">📊 Infographic</button>
          <button class="btn btn-ghost btn-sm" data-action="ops-show-guide" title="User Guide">❓ Guide</button>
        </div>
      </div>

      <nav class="ops-tabs" aria-label="Operations dashboard views">
        <button class="ops-tab ${tab === 'overview' ? 'active' : ''}" data-action="ops-set-tab" data-tab="overview">Overview</button>
        <button class="ops-tab ${tab === 'flow' ? 'active' : ''}" data-action="ops-set-tab" data-tab="flow">Flow</button>
        <button class="ops-tab ${tab === 'risk' ? 'active' : ''}" data-action="ops-set-tab" data-tab="risk">Risk</button>
        <button class="ops-tab ${tab === 'people' ? 'active' : ''}" data-action="ops-set-tab" data-tab="people">People</button>
        <button class="ops-tab ${tab === 'actions' ? 'active' : ''}" data-action="ops-set-tab" data-tab="actions">Actions</button>
        <button class="ops-tab ${tab === 'forecast' ? 'active' : ''}" data-action="ops-set-tab" data-tab="forecast">Forecast</button>
      </nav>

      <div class="ops-tab-body">
        ${body}
      </div>
    </div>`
}

function opsSetReportingDateAndRefresh(rawIso) {
  opsSetReportingDate(rawIso)
  if (typeof globalThis.render === 'function') globalThis.render()
}

function opsResetReportingDate() {
  opsSetReportingDate('')
  if (typeof globalThis.render === 'function') globalThis.render()
}

setOpsRefreshCurrentTab(opsRefreshCurrentTab)

export function operationsDataSubscribe() {
  opsRealtimeInit()
}

export function operationsDataUnsubscribe() {
  opsRealtimeCleanup()
}

export {
  opsBuildMetrics,
  opsRealtimeInit,
  opsRealtimeCleanup,
  opsForecastSubmit,
  opsForecastDelete,
  opsForecastSetStatus,
  opsForecastStartEdit,
  opsForecastCancelEdit,
  opsForecastStartInlineEdit,
  opsForecastCancelInline,
  opsForecastSaveInline,
  opsForecastInlineKeydown,
  opsSetReportingDateAndRefresh,
  opsResetReportingDate
}
