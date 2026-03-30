/* ============================================================
   pm-capacity.js — Project Management Capacity Orchestrator
   ============================================================ */

import { canEdit, isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { appState } from '../../../../core/js/state.js'
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
  pmDataInit,
  pmDataSave,
  pmDataAutoSyncPMProducts,
  pmDataGetTeam,
  pmDataGetTasks,
  pmDataGetProducts,
  pmDataGetHolidays,
  pmDataSubscribe,
  pmDataUnsubscribe,
  setPmDataRealtimeHooks
} from './pm-data.js'

export let pmTab = 'chart'
let pmHolidayMonth = null
let pmChartStart = null
let pmSaveTimer = null

function pmGetCurrentMonthKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function pmGetData() {
  return {
    team: pmDataGetTeam(),
    tasks: pmDataGetTasks(),
    products: pmDataGetProducts(),
    holidays: pmDataGetHolidays()
  }
}

function pmDrawChartViews() {
  const { team, tasks, products, holidays } = pmGetData()
  capDrawChartNow(team, tasks, products, holidays, pmChartStart, 'PM')
  capDrawHeatmapNow(team, tasks, products, holidays, pmChartStart, 'PM')
}

function pmGetTabContent() {
  const { team, tasks, products, holidays } = pmGetData()

  if (!pmHolidayMonth) pmHolidayMonth = pmGetCurrentMonthKey()
  if (!pmChartStart) pmChartStart = pmGetCurrentMonthKey()

  const taskFilters = capTasksFilters.PM
  const taskSort = capTasksSort.PM
  const productsTableState = capProductsTableState.PM
  const productLoadTableState = capProductLoadTableState.PM
  const bankHolidays = capGetBankHolidaysForYear(
    Number((pmHolidayMonth || '').split('-')[0]) || new Date().getFullYear()
  )

  switch (pmTab) {
    case 'team':
      return capRenderTeamTab(team, holidays, pmChartStart, 'PM', canEdit())
    case 'tasks':
      return capRenderTasksTab(tasks, team, products, 'PM', taskFilters, taskSort, canEdit())
    case 'products':
      return capRenderProductsTab(products, tasks, 'PM', productsTableState)
    case 'product-taskload':
      return capRenderProductTaskLoadTab(tasks, products, 'PM', productLoadTableState)
    case 'holidays':
      return capRenderHolidaysTab(holidays, team, pmHolidayMonth, 'PM', bankHolidays, canEdit())
    case 'chart':
    default:
      return capRenderChartTab(pmChartStart, team, tasks, products, holidays, 'PM')
  }
}

function pmRerenderChartTabForMonthChange() {
  const body = document.getElementById('pmBody')
  if (!body) return
  body.innerHTML = pmGetTabContent()
  setTimeout(() => pmDrawChartViews(), 100)
}

export function renderPmCapacity() {
  const synced = pmDataAutoSyncPMProducts()
  if (synced) {
    setTimeout(() => {
      pmDebouncedSave()
    }, 1000)
  }

  const html = `
    <div class="pm-shell me-shell" data-cap-context="pm">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-pm-back">← Back</button>
          <div>
            <div class="me-topbar-title">Project Management Capacity</div>
            <div class="me-topbar-sub">PM stream · dedicated relational tables</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('capacity-pm')" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${pmTab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-pm-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${pmTab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-pm-set-tab">👷 Team</button>
        <button class="me-nav-btn ${pmTab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-pm-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${pmTab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-pm-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${pmTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-pm-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${pmTab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-pm-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="pmBody">
        ${pmGetTabContent()}
      </div>
    </div>`

  setTimeout(() => {
    if (pmTab === 'chart') pmDrawChartViews()
  }, 100)

  return html
}

export function pmSetTab(tab) {
  const prevPmTab = pmTab
  pmTab = tab

  const pmParts = ['s=capacity', 'ct=projects']
  if (tab !== 'chart') pmParts.push('pmt=' + encodeURIComponent(tab))
  pmWriteNavigationHistory('#' + pmParts.join('&'), prevPmTab !== tab)

  document.querySelectorAll('.pm-shell .me-nav-btn').forEach(btn => btn.classList.remove('active'))
  const activeBtn = document.querySelector(`.pm-shell .me-nav-btn[data-tab="${tab}"]`)
  if (activeBtn) activeBtn.classList.add('active')

  const body = document.getElementById('pmBody')
  if (body) {
    body.innerHTML = pmGetTabContent()
    setTimeout(() => {
      if (tab === 'chart') pmDrawChartViews()
    }, 100)
  }
}

export function setPmTabState(tab) {
  pmTab = tab || 'chart'
}

export function pmRefreshCurrentTab() {
  if (pmTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput')
    if (monthInput && pmChartStart) monthInput.value = pmChartStart
    pmDrawChartViews()
    return
  }

  const body = document.getElementById('pmBody')
  if (body) {
    body.innerHTML = pmGetTabContent()
    setTimeout(() => {
      if (pmTab === 'chart') pmDrawChartViews()
    }, 100)
  }
}

export function pmOnMonthChange(newMonth) {
  if (pmTab === 'chart') {
    pmChartStart = newMonth
    pmRerenderChartTabForMonthChange()
    return
  }

  pmHolidayMonth = newMonth
  pmRefreshCurrentTab()
}

function pmShiftMonth(direction) {
  const isChart = pmTab === 'chart'
  const current = isChart
    ? (pmChartStart || pmGetCurrentMonthKey())
    : (pmHolidayMonth || pmGetCurrentMonthKey())

  const [year, month] = current.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + direction)
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

  if (isChart) {
    pmChartStart = newMonth
    pmRerenderChartTabForMonthChange()
    return
  }

  pmHolidayMonth = newMonth
  pmRefreshCurrentTab()
}

export function pmOnNextMonth() {
  pmShiftMonth(1)
}

export function pmOnPrevMonth() {
  pmShiftMonth(-1)
}

export async function pmOnSave(showAlert = false) {
  await pmDataSave(showAlert)
}

export function pmDebouncedSave() {
  clearTimeout(pmSaveTimer)
  pmSaveTimer = setTimeout(async () => {
    await pmOnSave(false)
    if (pmTab === 'chart') return

    requestRender('pm', {
      trigger: 'save',
      renderNow: () => pmRefreshCurrentTab(),
      isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell()
    })
  }, 900)
}

export function pmRefresh() {
  const mc = document.getElementById('mainContent')
  if (!mc || appState.currentSection !== 'capacity' || appState.capacityTab !== 'projects') return
  mc.innerHTML = `<div class="section-inner">${renderPmCapacity()}</div>`
}

export const pmCapacityDataSubscribe = pmDataSubscribe
export const pmCapacityDataUnsubscribe = pmDataUnsubscribe

setPmDataRealtimeHooks({
  getTab: () => pmTab,
  refreshCurrentTab: () => pmRefreshCurrentTab()
})

export { pmDataInit }
function pmWriteNavigationHistory(hash, push) {
  if (push) {
    history.pushState(null, '', hash)
  } else {
    history.replaceState(null, '', hash)
  }
}
