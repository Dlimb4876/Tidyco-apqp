/* ============================================================
   log-capacity.js — Logistics Capacity Orchestrator
   ============================================================ */

import { canEdit, isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { appState } from '../../../../core/js/state.js'
import { navigate, writeNavigationHistory } from '../../../../utils/js/navigation.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { getBankHolidaysForYear as capGetBankHolidaysForYear } from '../../shared/js/cap-utils.js'
import { capRenderTeamTab } from '../../shared/js/cap-team.js'
import { capRenderTasksTab, capTasksFilters, capTasksSort } from '../../shared/js/cap-tasks.js'
import { capRenderProductsTab, capProductsTableState } from '../../shared/js/cap-products.js'
import {
  capRenderProductTaskLoadTab,
  capProductLoadTableState
} from '../../shared/js/cap-product-taskload.js'
import { capRenderHolidaysTab } from '../../shared/js/cap-holidays.js'
import { capRenderChartTab, capDrawChartNow } from '../../shared/js/cap-chart.js'
import { capDrawHeatmapNow } from '../../shared/js/cap-heatmap.js'
import {
  logDataInit,
  logDataSave,
  logDataAutoSyncLogProducts,
  logDataGetTeam,
  logDataGetTasks,
  logDataGetProducts,
  logDataGetHolidays,
  logDataSubscribe,
  logDataUnsubscribe,
  setLogDataRealtimeHooks,
  logDataState,
  logDataGetProductSupportRateForDate
} from './log-data.js'

export let logTab = 'chart'
let logHolidayMonth = null
let logChartStart = null
let logSaveTimer = null

function logGetCurrentMonthKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function logGetData() {
  return {
    team: logDataGetTeam(),
    tasks: logDataGetTasks(),
    products: logDataGetProducts(),
    holidays: logDataGetHolidays()
  }
}

function logDrawChartViews() {
  const { team, tasks, products, holidays } = logGetData()
  capDrawChartNow(team, tasks, products, holidays, logChartStart, 'LOG')
  capDrawHeatmapNow(team, tasks, products, holidays, logChartStart, {
    allocationsArray: logDataState.productSupportAllocations,
    supportRateResolver: logDataGetProductSupportRateForDate
  })
}

function logGetTabContent() {
  const { team, tasks, products, holidays } = logGetData()

  if (!logHolidayMonth) logHolidayMonth = logGetCurrentMonthKey()
  if (!logChartStart) logChartStart = logGetCurrentMonthKey()

  const taskFilters = capTasksFilters.LOG
  const taskSort = capTasksSort.LOG
  const productsTableState = capProductsTableState.LOG
  const productLoadTableState = capProductLoadTableState.LOG
  const bankHolidays = capGetBankHolidaysForYear(
    Number((logHolidayMonth || '').split('-')[0]) || new Date().getFullYear()
  )

  switch (logTab) {
    case 'team':
      return capRenderTeamTab(team, holidays, logChartStart, 'LOG', canEdit())
    case 'tasks':
      return capRenderTasksTab(tasks, team, products, 'LOG', taskFilters, taskSort, canEdit())
    case 'products':
      return capRenderProductsTab(products, tasks, 'LOG', productsTableState, logDataState.productSupportAllocations)
    case 'product-taskload':
      return capRenderProductTaskLoadTab(tasks, products, 'LOG', productLoadTableState)
    case 'holidays':
      return capRenderHolidaysTab(holidays, team, logHolidayMonth, 'LOG', bankHolidays, canEdit())
    case 'chart':
    default:
      return capRenderChartTab(logChartStart, team, tasks, products, holidays, 'LOG')
  }
}

function logRerenderChartTabForMonthChange() {
  const body = document.getElementById('logBody')
  if (!body) return
  body.innerHTML = logGetTabContent()
  setTimeout(() => logDrawChartViews(), 100)
}

export function renderLogCapacity() {
  const synced = logDataAutoSyncLogProducts()
  if (synced) {
    setTimeout(() => {
      logDebouncedSave()
    }, 1000)
  }

  const html = `
    <div class="log-shell me-shell" data-cap-context="log">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-log-back">← Back</button>
          <div>
            <div class="me-topbar-title">Logistics Load Capacity</div>
            <div class="me-topbar-sub">Logistics · Man-hours planning</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('capacity-logistics')" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${logTab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-log-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${logTab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-log-set-tab">👷 Team</button>
        <button class="me-nav-btn ${logTab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-log-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${logTab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-log-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${logTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-log-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${logTab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-log-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="logBody">
        ${logGetTabContent()}
      </div>
    </div>`

  setTimeout(() => {
    if (logTab === 'chart') logDrawChartViews()
  }, 100)

  return html
}

export function logSetTab(tab) {
  const prevLogTab = logTab
  logTab = tab

  const logParts = ['s=capacity', 'ct=logistics']
  if (tab !== 'chart') logParts.push('lgt=' + encodeURIComponent(tab))
  writeNavigationHistory('#' + logParts.join('&'), { push: prevLogTab !== tab })

  document.querySelectorAll('.log-shell .me-nav-btn').forEach(btn => btn.classList.remove('active'))
  const activeBtn = document.querySelector(`.log-shell .me-nav-btn[data-tab="${tab}"]`)
  if (activeBtn) activeBtn.classList.add('active')

  const body = document.getElementById('logBody')
  if (body) {
    body.innerHTML = logGetTabContent()
    setTimeout(() => {
      if (tab === 'chart') logDrawChartViews()
    }, 100)
  }
}

export function logRefreshCurrentTab() {
  if (logTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput')
    if (monthInput && logChartStart) monthInput.value = logChartStart
    logDrawChartViews()
    return
  }

  const body = document.getElementById('logBody')
  if (body) {
    body.innerHTML = logGetTabContent()
    setTimeout(() => {
      if (logTab === 'chart') logDrawChartViews()
    }, 100)
  }
}

export function logOnMonthChange(newMonth) {
  if (logTab === 'chart') {
    logChartStart = newMonth
    logRerenderChartTabForMonthChange()
    return
  }

  logHolidayMonth = newMonth
  logRefreshCurrentTab()
}

function logShiftMonth(direction) {
  const isChart = logTab === 'chart'
  const current = isChart
    ? (logChartStart || logGetCurrentMonthKey())
    : (logHolidayMonth || logGetCurrentMonthKey())

  const [year, month] = current.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + direction)
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

  if (isChart) {
    logChartStart = newMonth
    logRerenderChartTabForMonthChange()
    return
  }

  logHolidayMonth = newMonth
  logRefreshCurrentTab()
}

export function logOnNextMonth() {
  logShiftMonth(1)
}

export function logOnPrevMonth() {
  logShiftMonth(-1)
}

export async function logOnSave(showAlert = false) {
  await logDataSave(showAlert)
}

export function logDebouncedSave() {
  clearTimeout(logSaveTimer)
  logSaveTimer = setTimeout(async () => {
    await logOnSave(false)
    if (logTab === 'chart') return

    requestRender('log', {
      trigger: 'save',
      renderNow: () => logRefreshCurrentTab(),
      isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell()
    })
  }, 900)
}

export function logRefresh() {
  const mc = document.getElementById('mainContent')
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'logistics') return
  mc.innerHTML = `<div class="section-inner">${renderLogCapacity()}</div>`
}

export function logBackToCapacity() {
  navigate('capacity')
}

export const logCapacityDataSubscribe = logDataSubscribe
export const logCapacityDataUnsubscribe = logDataUnsubscribe

setLogDataRealtimeHooks({
  getTab: () => logTab,
  refreshCurrentTab: () => logRefreshCurrentTab()
})

export { logDataInit }
