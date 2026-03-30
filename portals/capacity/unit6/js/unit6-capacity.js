/* ============================================================
   unit6-capacity.js — Unit 6 Capacity Orchestrator
   ============================================================ */

import { canEdit, isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { getBankHolidaysForYear, getCurrentMonth, addMonths } from '../../shared/js/cap-utils.js'
import { capDrawChartNow } from '../../shared/js/cap-chart.js'
import { capDrawHeatmapNow } from '../../shared/js/cap-heatmap.js'
import { capRenderTeamTab } from '../../shared/js/cap-team.js'
import { capRenderTasksTab, capTasksFilters, capTasksSort } from '../../shared/js/cap-tasks.js'
import {
  capRenderProductsTab,
  capProductsTableState
} from '../../shared/js/cap-products.js'
import {
  capRenderProductTaskLoadTab,
  capProductLoadTableState
} from '../../shared/js/cap-product-taskload.js'
import { capRenderHolidaysTab } from '../../shared/js/cap-holidays.js'
import { capRenderChartTab } from '../../shared/js/cap-chart.js'
import {
  unit6DataGetTeam,
  unit6DataGetTasks,
  unit6DataGetProducts,
  unit6DataGetHolidays,
  unit6DataAutoSyncUnit6Products,
  unit6DataInitialized,
  unit6DataSave,
  unit6CapacityDataSubscribe as subscribeUnit6Data,
  unit6CapacityDataUnsubscribe as unsubscribeUnit6Data,
  unit6SetRefreshCurrentTabCallback,
  unit6SetGetTabCallback
} from './unit6-data.js'

let unit6Tab = 'chart'
let unit6HolidayMonth = null
let unit6ChartStart = null
let unit6SaveTimer = null

function unit6GetCurrentMonthKey() {
  return getCurrentMonth()
}

function unit6GetData() {
  return {
    team: unit6DataGetTeam(),
    tasks: unit6DataGetTasks(),
    products: unit6DataGetProducts(),
    holidays: unit6DataGetHolidays()
  }
}

function unit6DrawChartViews() {
  const { team, tasks, products, holidays } = unit6GetData()
  capDrawChartNow(team, tasks, products, holidays, unit6ChartStart, 'UNIT6')
  capDrawHeatmapNow(team, tasks, products, holidays, unit6ChartStart, 'UNIT6')
}

function unit6GetTabContent() {
  const { team, tasks, products, holidays } = unit6GetData()

  if (!unit6HolidayMonth) unit6HolidayMonth = unit6GetCurrentMonthKey()
  if (!unit6ChartStart) unit6ChartStart = unit6GetCurrentMonthKey()

  const taskFilters = capTasksFilters.UNIT6
  const taskSort = capTasksSort.UNIT6
  const productsTable = capProductsTableState.UNIT6
  const productLoadTable = capProductLoadTableState.UNIT6
  const bankHolidays = getBankHolidaysForYear(
    Number((unit6HolidayMonth || '').split('-')[0]) || new Date().getFullYear()
  )

  switch (unit6Tab) {
    case 'team':
      return capRenderTeamTab(team, holidays, unit6ChartStart, 'UNIT6', canEdit())
    case 'tasks':
      return capRenderTasksTab(tasks, team, products, 'UNIT6', taskFilters, taskSort, canEdit())
    case 'products':
      return capRenderProductsTab(products, tasks, 'UNIT6', productsTable)
    case 'product-taskload':
      return capRenderProductTaskLoadTab(tasks, products, 'UNIT6', productLoadTable)
    case 'holidays':
      return capRenderHolidaysTab(
        holidays,
        team,
        unit6HolidayMonth,
        'UNIT6',
        bankHolidays,
        canEdit()
      )
    case 'chart':
    default:
      return capRenderChartTab(unit6ChartStart, team, tasks, products, holidays, 'UNIT6')
  }
}

function unit6RerenderChartTabForMonthChange() {
  const body = document.getElementById('unit6Body')
  if (!body) return
  body.innerHTML = unit6GetTabContent()
  setTimeout(() => {
    unit6DrawChartViews()
  }, 100)
}

export function renderUnit6Capacity() {
  const synced = unit6DataAutoSyncUnit6Products()
  if (synced && unit6DataInitialized) {
    setTimeout(() => {
      unit6DebouncedSave()
    }, 1000)
  }

  const html = `
    <div class="unit6-shell me-shell" data-cap-context="unit6">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-unit6-back">← Back</button>
          <div>
            <div class="me-topbar-title">Unit 6 Load Capacity</div>
            <div class="me-topbar-sub">Unit 6 · Man-hours planning</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-unit6-guide" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${unit6Tab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-unit6-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${unit6Tab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-unit6-set-tab">👷 Team</button>
        <button class="me-nav-btn ${unit6Tab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-unit6-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${unit6Tab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-unit6-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${unit6Tab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-unit6-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${unit6Tab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-unit6-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="unit6Body">
        ${unit6GetTabContent()}
      </div>
    </div>`

  setTimeout(() => {
    if (unit6Tab === 'chart') unit6DrawChartViews()
  }, 100)

  return html
}

export function unit6SetTab(tab) {
  unit6Tab = tab

  document.querySelectorAll('.unit6-shell .me-nav-btn').forEach(btn => {
    btn.classList.remove('active')
  })
  const activeBtn = document.querySelector(`.unit6-shell .me-nav-btn[data-tab="${tab}"]`)
  if (activeBtn) activeBtn.classList.add('active')

  const body = document.getElementById('unit6Body')
  if (body) {
    body.innerHTML = unit6GetTabContent()
    setTimeout(() => {
      if (tab === 'chart') unit6DrawChartViews()
    }, 100)
  }
}

export function unit6RefreshCurrentTab() {
  if (unit6Tab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput')
    if (monthInput && unit6ChartStart) monthInput.value = unit6ChartStart
    unit6DrawChartViews()
    return
  }

  const body = document.getElementById('unit6Body')
  if (body) {
    body.innerHTML = unit6GetTabContent()
    setTimeout(() => {
      if (unit6Tab === 'chart') unit6DrawChartViews()
    }, 100)
  }
}

export function unit6OnMonthChange(newMonth) {
  if (unit6Tab === 'chart') {
    unit6ChartStart = newMonth
    unit6RerenderChartTabForMonthChange()
    return
  }
  unit6HolidayMonth = newMonth
  unit6RefreshCurrentTab()
}

export function unit6OnNextMonth() {
  const isChart = unit6Tab === 'chart'
  const current = isChart
    ? unit6ChartStart || unit6GetCurrentMonthKey()
    : unit6HolidayMonth || unit6GetCurrentMonthKey()
  const newMonth = addMonths(current, 1)
  if (isChart) {
    unit6ChartStart = newMonth
    unit6RerenderChartTabForMonthChange()
    return
  }
  unit6HolidayMonth = newMonth
  unit6RefreshCurrentTab()
}

export function unit6OnPrevMonth() {
  const isChart = unit6Tab === 'chart'
  const current = isChart
    ? unit6ChartStart || unit6GetCurrentMonthKey()
    : unit6HolidayMonth || unit6GetCurrentMonthKey()
  const newMonth = addMonths(current, -1)
  if (isChart) {
    unit6ChartStart = newMonth
    unit6RerenderChartTabForMonthChange()
    return
  }
  unit6HolidayMonth = newMonth
  unit6RefreshCurrentTab()
}

export async function unit6OnSave(showAlert = false) {
  await unit6DataSave(showAlert)
}

export function unit6DebouncedSave() {
  clearTimeout(unit6SaveTimer)
  unit6SaveTimer = setTimeout(async () => {
    await unit6OnSave(false)
    if (unit6Tab === 'chart') return
    requestRender('unit6', {
      trigger: 'save',
      renderNow: unit6RefreshCurrentTab,
      isEditing: isEditingInlineCell()
    })
  }, 900)
}

export function unit6Refresh() {
  const mc = document.getElementById('mainContent')
  if (!mc) return
  if (globalThis.currentSection !== 'capacity' || globalThis.capacityTab !== 'unit6') return
  mc.innerHTML = `<div class="section-inner">${renderUnit6Capacity()}</div>`
}

export function unit6GetTab() {
  return unit6Tab
}

export function unit6CapacityDataSubscribe() {
  subscribeUnit6Data()
}

export function unit6CapacityDataUnsubscribe() {
  unsubscribeUnit6Data()
}

unit6SetRefreshCurrentTabCallback(unit6RefreshCurrentTab)
unit6SetGetTabCallback(unit6GetTab)
