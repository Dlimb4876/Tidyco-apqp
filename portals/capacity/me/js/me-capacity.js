/* ============================================================
   me-capacity.js — ME Load Capacity Orchestrator
   ============================================================ */

import { canEdit, isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { currentUser } from '../../../../core/js/supa.js'
import { meDataState, meDataInitialized } from './me-data.js'
import {
  meDataGetTeam,
  meDataGetTasks,
  meDataGetProducts,
  meDataGetHolidays,
  meDataAutoSyncProductionProducts,
  meDataUpdateProduct
} from './me-data-entities.js'
import { meDataInit, meDataSave } from './me-data-persistence.js'
import { setMeRealtimeHooks } from './me-data-realtime.js'
import { meSaveTeamRelational } from './me-data-relational.js'
import {
  meDataGetProductSupportHistory,
  meDataDeleteProductSupportHistoryEntry,
  meDataUpdateProductSupportHistoryEntry,
  meDataAddProductSupportHistory,
  meDataGetProductSupportRateForDate
} from './me-data-support-history.js'
import { getBankHolidaysForYear } from '../../shared/js/cap-utils.js'
import { setCapProductionBatchesResolver } from '../../shared/js/cap-calculations.js'
import { capRenderTeamTab } from '../../shared/js/cap-team.js'
import { capRenderTasksTab, capTasksFilters, capTasksSort } from '../../shared/js/cap-tasks.js'
import { capRenderProductsTab, capProductsTableState, setCapProductsDependencies } from '../../shared/js/cap-products.js'
import { capRenderProductTaskLoadTab, capProductLoadTableState, setCapProductLoadDependencies } from '../../shared/js/cap-product-taskload.js'
import { productsDataGetAll } from '../../../product-development/product-management/js/products-data.js'
import { prodState, prodDataInit } from '../../../production/js/data.js'
import { capRenderHolidaysTab } from '../../shared/js/cap-holidays.js'
import { capRenderChartTab, capDrawChartNow } from '../../shared/js/cap-chart.js'
import { capDrawHeatmapNow } from '../../shared/js/cap-heatmap.js'

export let meTab = 'chart'
let meChartStart = null
let meHolidayMonth = null
let meSaveTimer = null
let meProductDepsWired = false

function meWireProductDependencies() {
  if (meProductDepsWired) return
  meProductDepsWired = true

  function meRefreshByDept() {
    meRefreshCurrentTab()
  }

  setCapProductsDependencies({
    refreshByDepartment: meRefreshByDept,
    getAllProducts: productsDataGetAll,
    apiByDepartment: {
      ME: {
        getProducts: meDataGetProducts,
        updateProduct: meDataUpdateProduct,
        getHistory: meDataGetProductSupportHistory,
        deleteSupportHistoryEntry: meDataDeleteProductSupportHistoryEntry,
        updateSupportHistoryEntry: meDataUpdateProductSupportHistoryEntry,
        addSupportHistoryEntry: meDataAddProductSupportHistory
      }
    }
  })

  setCapProductLoadDependencies({
    refreshByDepartment: meRefreshByDept,
    getAllProducts: productsDataGetAll
  })
}

function meCanEditCapacity() {
  return typeof canEdit === 'function' ? canEdit() : true
}

function meGetCapacityData() {
  return {
    team: meDataGetTeam(),
    tasks: meDataGetTasks(),
    products: meDataGetProducts(),
    holidays: meDataGetHolidays()
  }
}

function meGetCalcOptions() {
  return { supportRateResolver: meDataGetProductSupportRateForDate }
}

function meDrawChartViews() {
  const { team, tasks, products, holidays } = meGetCapacityData()
  const opts = meGetCalcOptions()
  capDrawChartNow(team, tasks, products, holidays, meChartStart, 'ME', opts)
  capDrawHeatmapNow(team, tasks, products, holidays, meChartStart, 'ME')
}

export function renderMeCapacity() {
  meWireProductDependencies()

  const synced = meDataAutoSyncProductionProducts()
  if (synced && meDataInitialized) {
    setTimeout(() => {
      meDebouncedSave()
    }, 1000)
  }

  if (!meChartStart) {
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01'
  }

  const html = `
    <div class="me-shell" data-cap-context="me">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-back">← Back</button>
          <div>
            <div class="me-topbar-title">ME Load Capacity</div>
            <div class="me-topbar-sub">Manufacturing Engineering · Man-hours planning</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-guide" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${meTab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-me-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${meTab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-me-set-tab">👷 Team</button>
        <button class="me-nav-btn ${meTab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-me-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${meTab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-me-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${meTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-me-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${meTab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-me-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="meBody">
        ${meGetTabContent()}
      </div>
    </div>
  `

  setTimeout(() => {
    if (meTab === 'chart') meDrawChartViews()
  }, 100)

  return html
}

export function meSetTab(tab) {
  if (tab === 'dashboard' || tab === 'heatmap') tab = 'chart'
  meTab = tab

  const parts = ['s=capacity', 'ct=me']
  if (tab !== 'chart') parts.push('met=' + encodeURIComponent(tab))
  history.replaceState(null, '', '#' + parts.join('&'))

  document.querySelectorAll('.me-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab)
  })

  const body = document.getElementById('meBody')
  if (body) {
    body.innerHTML = meGetTabContent()
    setTimeout(() => {
      if (tab === 'chart') meDrawChartViews()
    }, 100)
  }
}

export function getMeTab() {
  return meTab
}

export function setMeTab(tab) {
  if (!tab) return
  meTab = tab
}

export function meRefreshCurrentTab() {
  if (meTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput')
    if (monthInput && meChartStart) monthInput.value = meChartStart
    meDrawChartViews()
    return
  }

  const body = document.getElementById('meBody')
  if (body) body.innerHTML = meGetTabContent()
}

function meGetTabContent() {
  const { team, tasks, products, holidays } = meGetCapacityData()

  if (!meHolidayMonth) {
    const today = new Date()
    meHolidayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  }

  const taskFilters = capTasksFilters.ME
  const taskSort = capTasksSort.ME
  const productsTableState = capProductsTableState.ME
  const productLoadTableState = capProductLoadTableState.ME
  const bankHolidays = getBankHolidaysForYear(Number((meHolidayMonth || '').split('-')[0]) || new Date().getFullYear())

  switch (meTab) {
    case 'team':
      return capRenderTeamTab(team, holidays, meChartStart, 'ME', meCanEditCapacity())
    case 'tasks':
      return capRenderTasksTab(tasks, team, products, 'ME', taskFilters, taskSort, meCanEditCapacity())
    case 'products':
      return capRenderProductsTab(products, tasks, 'ME', productsTableState)
    case 'product-taskload':
      return capRenderProductTaskLoadTab(tasks, products, 'ME', productLoadTableState)
    case 'holidays':
      return capRenderHolidaysTab(holidays, team, meHolidayMonth, 'ME', bankHolidays, meCanEditCapacity())
    case 'chart':
    default:
      return capRenderChartTab(meChartStart, team, tasks, products, holidays, 'ME', meGetCalcOptions())
  }
}

function meRerenderChartTabForMonthChange() {
  const body = document.getElementById('meBody')
  if (!body) return
  body.innerHTML = meGetTabContent()
  setTimeout(() => meDrawChartViews(), 100)
}

export function meOnMonthChange(newMonth) {
  if (meTab === 'holidays') {
    meHolidayMonth = newMonth
  } else {
    meChartStart = newMonth
    localStorage.setItem('meChartStartMonth', newMonth)
    meRerenderChartTabForMonthChange()
    return
  }
  meRefreshCurrentTab()
}

export function meOnNextMonth() {
  const currentMonth = meTab === 'holidays' ? meHolidayMonth : meChartStart
  const [year, month] = currentMonth.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + 1)
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  meOnMonthChange(newMonth)
}

export function meOnPrevMonth() {
  const currentMonth = meTab === 'holidays' ? meHolidayMonth : meChartStart
  const [year, month] = currentMonth.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() - 1)
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  meOnMonthChange(newMonth)
}

export async function meOnSave(showAlert) {
  await meDataSave(showAlert)
}

export function meDebouncedSave() {
  clearTimeout(meSaveTimer)
  meSaveTimer = setTimeout(async () => {
    await meDataSave(false)
    if (meTab === 'chart') return
    requestRender('me', {
      trigger: 'save',
      renderNow: () => {
        const body = document.getElementById('meBody')
        if (body) body.innerHTML = meGetTabContent()
      },
      isEditing: isEditingInlineCell()
    })
  }, 500)
}

export async function meInit() {
  await meDataInit()
  if (!meChartStart) {
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01'
  }
  setCapProductionBatchesResolver(() => prodState?.batches || [])
  prodDataInit().catch(err => console.warn('ME: could not load production batches for support chart', err))
}

export const meDrawChartNow = meDrawChartViews

export function flushMEDataNow() {
  if (!currentUser) return
  const pendingTeams = Array.isArray(meDataState.team) ? meDataState.team : []
  pendingTeams.forEach(member => {
    meSaveTeamRelational(currentUser.id, member).catch(err => {
      console.warn('Failed to flush team member', member && member.id, err.message)
    })
  })
}

setMeRealtimeHooks({
  getTab: () => meTab,
  refreshCurrentTab: () => meRefreshCurrentTab()
})

document.addEventListener('click', event => {
  const target = event.target.closest('[data-cap-action="cap-me-guide"]')
  if (target) showGuide('capacity-me')
})

meInit().catch(err => console.error('ME init failed:', err))

window.addEventListener('beforeunload', () => {
  if (meSaveTimer) {
    clearTimeout(meSaveTimer)
    flushMEDataNow()
  }
})
