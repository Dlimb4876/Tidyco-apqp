/* ============================================================
   capacity-events.js — Delegated UI event router for Capacity portal
   Handles click, change and input events via data-cap-action attributes.
   Depends on: capacity.js, me-*.js, prod-capacity-*.js, pm-capacity.js
   ============================================================ */

import { appState } from '../../../core/js/state.js'
import { canEdit, esc, isEditingInlineCell, preserveInputCaretAfterRender, showModal } from '../../../utils/js/helpers.js'
import { navigate, render } from '../../../utils/js/navigation.js'
import { flushDeferred } from '../../../utils/js/render-scheduler.js'
import { CAP_DEFAULT_HOURS_PER_WEEK } from '../shared/js/cap-utils.js'
import { capToggleHoliday } from '../shared/js/cap-holidays.js'
import { capOpenHeatmapDetail, capCloseHeatmapDetail } from '../shared/js/cap-heatmap.js'
import { capTasksFilters, capTaskEditingId, capTasksSort, capGetSortIcon, _capRenderTaskRows, capBuildTaskProductLookup, capRenderTaskProductDatalist, capRenderTaskProductPickerCell } from '../shared/js/cap-tasks.js'
import { capTeamSortBy } from '../shared/js/cap-team.js'
import {
  capProductsTableState,
  capProductsSetDraftValue,
  capProductsClearDraft,
  capProductsSetSearch,
  capProductsSetFamilyFilter,
  capProductsSetSort,
  capProductsSortByColumn,
  capProductsToggleSortDir,
  capProductsClearFilters,
  capProductsStartHistoryEdit,
  capProductsCancelHistoryEdit,
  capProductsSaveHistoryEdit,
  capProductsToggleStatusFilter,
  capProductsToggleHistory,
  capProductsBulkSaveChanges,
  capProductsUpdateHistoryEditDraft,
  capOpenAllocationsModal
} from '../shared/js/cap-products.js'
import {
  capProductLoadTableState,
  capProductLoadSetSearch,
  capProductLoadSetFamilyFilter,
  capProductLoadSetSort,
  capProductLoadToggleSortDir,
  capProductLoadClearFilters,
  capProductLoadSortByColumn
} from '../shared/js/cap-product-taskload.js'
import { setCapacityTab } from './capacity.js'
import {
  meDataAddTeam,
  meDataUpdateTeam,
  meDataDeleteTeam,
  meDataAddTask,
  meDataUpdateTask,
  meDataDeleteTask,
  meDataUpdateProduct,
  meDataGetProducts,
  meDataGetTasks,
  meDataGetTeam,
  meDataGetHolidays,
  meDataAddHoliday,
  meDataUpdateHoliday,
  meDataDeleteHoliday,
  meDataDeleteProductSupportHistoryEntry,
  meDataState
} from '../me/js/me-data-persistence.js'
import {
  meSetTab,
  meRefreshCurrentTab,
  meOnSave,
  meDebouncedSave,
  meOnMonthChange,
  meOnPrevMonth,
  meOnNextMonth
} from '../me/js/me-capacity.js'
import {
  pmDataAddTeam,
  pmDataUpdateTeam,
  pmDataDeleteTeam,
  pmDataAddTask,
  pmDataUpdateTask,
  pmDataDeleteTask,
  pmDataUpdateProduct,
  pmDataGetProducts,
  pmDataGetTasks,
  pmDataGetTeam,
  pmDataGetHolidays,
  pmDataAddHoliday,
  pmDataUpdateHoliday,
  pmDataDeleteHoliday,
  pmDataDeleteProductSupportHistoryEntry,
  pmDataState
} from '../project-management/js/pm-data.js'
import {
  pmSetTab,
  pmRefreshCurrentTab,
  pmOnSave,
  pmDebouncedSave,
  pmOnMonthChange,
  pmOnPrevMonth,
  pmOnNextMonth
} from '../project-management/js/pm-capacity.js'
import {
  logDataAddTeam,
  logDataUpdateTeam,
  logDataDeleteTeam,
  logDataAddTask,
  logDataUpdateTask,
  logDataDeleteTask,
  logDataUpdateProduct,
  logDataGetProducts,
  logDataGetTasks,
  logDataGetTeam,
  logDataGetHolidays,
  logDataAddHoliday,
  logDataUpdateHoliday,
  logDataDeleteHoliday,
  logDataDeleteProductSupportHistoryEntry,
  logDataState
} from '../logistics/js/log-data.js'
import {
  logSetTab,
  logRefreshCurrentTab,
  logOnSave,
  logDebouncedSave,
  logOnMonthChange,
  logOnPrevMonth,
  logOnNextMonth
} from '../logistics/js/log-capacity.js'
import {
  unit6DataAddTeam,
  unit6DataUpdateTeam,
  unit6DataDeleteTeam,
  unit6DataAddTask,
  unit6DataUpdateTask,
  unit6DataDeleteTask,
  unit6DataUpdateProduct,
  unit6DataGetProducts,
  unit6DataGetTasks,
  unit6DataGetTeam,
  unit6DataGetHolidays,
  unit6DataAddHoliday,
  unit6DataUpdateHoliday,
  unit6DataDeleteHoliday,
  unit6DataDeleteProductSupportHistoryEntry,
  unit6DataState
} from '../unit6/js/unit6-data.js'
import {
  unit6SetTab,
  unit6RefreshCurrentTab,
  unit6OnSave,
  unit6DebouncedSave,
  unit6OnMonthChange,
  unit6OnPrevMonth,
  unit6OnNextMonth
} from '../unit6/js/unit6-capacity.js'
import { meSaveProductSupportAllocationSet, meLoadRelationalProductSupportAllocations } from '../me/js/me-data-relational.js'
import { pmSaveProductSupportAllocationSet, pmLoadRelationalProductSupportAllocations } from '../project-management/js/pm-data-relational.js'
import { logSaveProductSupportAllocationSet, logLoadRelationalProductSupportAllocations } from '../logistics/js/log-data-relational.js'
import { unit6SaveProductSupportAllocationSet, unit6LoadRelationalProductSupportAllocations } from '../unit6/js/unit6-data-relational.js'
import { setProdCapTab } from '../production/js/prod-capacity.js'
import {
  prodCapShiftMonth,
  prodCapResetMonthOffset,
  prodCapPendingRealTimeUpdate,
  setProdCapPendingRealTimeUpdate
} from '../production/js/prod-capacity-data.js'
import { prodCapSetWorkArea } from '../production/js/prod-capacity-workarea.js'
import {
  prodCapSettingsFillForward,
  prodCapSettingsClearAll,
  prodCapSettingsSetUtilization,
  prodCapSettingsUpdate,
  prodCapSettingsNavKey
} from '../production/js/prod-capacity-settings.js'
import { prodCapRefreshCurrentTab } from '../production/js/prod-capacity.js'
import { setProdCapDetailFilter } from '../production/js/prod-capacity-detail.js'

let _capEventsContainer = null

function capActionTarget(evt) {
  return evt && evt.target ? evt.target.closest('[data-cap-action]') : null
}

function capNum(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

function capDefaultHoursPerWeek() {
  if (typeof CAP_DEFAULT_HOURS_PER_WEEK === 'number') return CAP_DEFAULT_HOURS_PER_WEEK
  return 37.5
}

function capContextType(el) {
  const ctx = el && typeof el.closest === 'function'
    ? el.closest('[data-cap-context]')
    : null
  if (ctx) {
    return (ctx.getAttribute('data-cap-context') || 'me').toLowerCase()
  }
  return 'me'
}

function capIsPM(contextType) {
  return contextType === 'pm'
}

function capGetDataApi(contextType) {
  if (contextType === 'pm') {
    return {
      addTeam: pmDataAddTeam,
      updateTeam: pmDataUpdateTeam,
      deleteTeam: pmDataDeleteTeam,
      addTask: pmDataAddTask,
      updateTask: pmDataUpdateTask,
      deleteTask: pmDataDeleteTask,
      updateProduct: pmDataUpdateProduct,
      getProducts: pmDataGetProducts
    }
  }
  if (contextType === 'log') {
    return {
      addTeam: logDataAddTeam,
      updateTeam: logDataUpdateTeam,
      deleteTeam: logDataDeleteTeam,
      addTask: logDataAddTask,
      updateTask: logDataUpdateTask,
      deleteTask: logDataDeleteTask,
      updateProduct: logDataUpdateProduct,
      getProducts: logDataGetProducts
    }
  }
  if (contextType === 'unit6') {
    return {
      addTeam: unit6DataAddTeam,
      updateTeam: unit6DataUpdateTeam,
      deleteTeam: unit6DataDeleteTeam,
      addTask: unit6DataAddTask,
      updateTask: unit6DataUpdateTask,
      deleteTask: unit6DataDeleteTask,
      updateProduct: unit6DataUpdateProduct,
      getProducts: unit6DataGetProducts
    }
  }
  return {
    addTeam: meDataAddTeam,
    updateTeam: meDataUpdateTeam,
    deleteTeam: meDataDeleteTeam,
    addTask: meDataAddTask,
    updateTask: meDataUpdateTask,
    deleteTask: meDataDeleteTask,
    updateProduct: meDataUpdateProduct,
    getProducts: meDataGetProducts
  }
}

function capRunSave(contextType) {
  if (contextType === 'pm') return pmOnSave()
  if (contextType === 'log') return logOnSave()
  if (contextType === 'unit6') return unit6OnSave()
  return meOnSave()
}

// Returns allocation deps for the allocation modal — { team, allocations, saveSet, refreshTab, department }
function capGetAllocDeps(contextType) {
  // reloadAllocations: re-fetches from DB and writes back to state so modal + heatmap see fresh data
  if (contextType === 'pm') return { team: pmDataGetTeam(), allocations: pmDataState.productSupportAllocations || [], saveSet: pmSaveProductSupportAllocationSet, reloadAllocations: async () => { pmDataState.productSupportAllocations = await pmLoadRelationalProductSupportAllocations() || [] }, refreshTab: () => capRefreshCurrentTab('pm'), department: 'PM' }
  if (contextType === 'log') return { team: logDataGetTeam(), allocations: logDataState.productSupportAllocations || [], saveSet: logSaveProductSupportAllocationSet, reloadAllocations: async () => { logDataState.productSupportAllocations = await logLoadRelationalProductSupportAllocations() || [] }, refreshTab: () => capRefreshCurrentTab('log'), department: 'LOG' }
  if (contextType === 'unit6') return { team: unit6DataGetTeam(), allocations: unit6DataState.productSupportAllocations || [], saveSet: unit6SaveProductSupportAllocationSet, reloadAllocations: async () => { unit6DataState.productSupportAllocations = await unit6LoadRelationalProductSupportAllocations() || [] }, refreshTab: () => capRefreshCurrentTab('unit6'), department: 'UNIT6' }
  return { team: meDataGetTeam(), allocations: meDataState.productSupportAllocations || [], saveSet: meSaveProductSupportAllocationSet, reloadAllocations: async () => { meDataState.productSupportAllocations = await meLoadRelationalProductSupportAllocations() || [] }, refreshTab: () => capRefreshCurrentTab('me'), department: 'ME' }
}

function capRunDebouncedSave(contextType) {
  if (contextType === 'pm') return pmDebouncedSave()
  if (contextType === 'log') return logDebouncedSave()
  if (contextType === 'unit6') return unit6DebouncedSave()
  return meDebouncedSave()
}

function capSetTab(contextType, tabName) {
  if (contextType === 'pm') return pmSetTab(tabName)
  if (contextType === 'log') return logSetTab(tabName)
  if (contextType === 'unit6') return unit6SetTab(tabName)
  return meSetTab(tabName)
}

function capRefreshCurrentTab(contextType) {
  if (contextType === 'pm') return pmRefreshCurrentTab()
  if (contextType === 'log') return logRefreshCurrentTab()
  if (contextType === 'unit6') return unit6RefreshCurrentTab()
  return meRefreshCurrentTab()
}

function capRunMonthChange(contextType, newMonth) {
  if (contextType === 'pm') return pmOnMonthChange(newMonth)
  if (contextType === 'log') return logOnMonthChange(newMonth)
  if (contextType === 'unit6') return unit6OnMonthChange(newMonth)
  return meOnMonthChange(newMonth)
}

function capRunPrevMonth(contextType) {
  if (contextType === 'pm') return pmOnPrevMonth()
  if (contextType === 'log') return logOnPrevMonth()
  if (contextType === 'unit6') return unit6OnPrevMonth()
  return meOnPrevMonth()
}

function capRunNextMonth(contextType) {
  if (contextType === 'pm') return pmOnNextMonth()
  if (contextType === 'log') return logOnNextMonth()
  if (contextType === 'unit6') return unit6OnNextMonth()
  return meOnNextMonth()
}

function capGetTaskSortState(contextType) {
  const department = capProductDraftDepartment(contextType)
  if (capTasksSort[department]) {
    return capTasksSort[department]
  }

  return contextType === 'pm' ? capTasksSort.PM : capTasksSort.ME
}

function capTaskFilters(contextType) {
  const department = capProductDraftDepartment(contextType)
  if (capTasksFilters[department]) {
    return capTasksFilters[department]
  }

  return contextType === 'pm' ? capTasksFilters.PM : capTasksFilters.ME
}

function capGetProductHelper(name) {
  const productHelpers = {
    UpdateHistoryEditDraft: capProductsUpdateHistoryEditDraft,
    SetDraftValue: capProductsSetDraftValue,
    ClearDraft: capProductsClearDraft,
    SetSearch: capProductsSetSearch,
    SetFamilyFilter: capProductsSetFamilyFilter,
    SetSort: capProductsSetSort,
    SortByColumn: capProductsSortByColumn,
    ToggleSortDir: capProductsToggleSortDir,
    ClearFilters: capProductsClearFilters,
    StartHistoryEdit: capProductsStartHistoryEdit,
    CancelHistoryEdit: capProductsCancelHistoryEdit,
    SaveHistoryEdit: capProductsSaveHistoryEdit,
    ToggleStatusFilter: capProductsToggleStatusFilter,
    ToggleHistory: capProductsToggleHistory,
    BulkSaveChanges: capProductsBulkSaveChanges
  }
  return productHelpers[name] || null
}

function capGetProductLoadHelper(name) {
  const productLoadHelpers = {
    SetSearch: capProductLoadSetSearch,
    SetFamilyFilter: capProductLoadSetFamilyFilter,
    SetSort: capProductLoadSetSort,
    ToggleSortDir: capProductLoadToggleSortDir,
    ClearFilters: capProductLoadClearFilters,
    SortByColumn: capProductLoadSortByColumn
  }
  return productLoadHelpers[name] || null
}

function capGetHeatmapHelper(name) {
  const heatmapHelpers = {
    OpenHeatmapDetail: capOpenHeatmapDetail,
    CloseHeatmapDetail: capCloseHeatmapDetail
  }
  return heatmapHelpers[name] || null
}

function capGetHolidayApi(contextType) {
  if (contextType === 'pm') {
    return {
      holidays: pmDataGetHolidays(),
      add: pmDataAddHoliday,
      update: pmDataUpdateHoliday,
      remove: pmDataDeleteHoliday
    }
  }

  if (contextType === 'log') {
    return {
      holidays: logDataGetHolidays(),
      add: logDataAddHoliday,
      update: logDataUpdateHoliday,
      remove: logDataDeleteHoliday
    }
  }

  if (contextType === 'unit6') {
    return {
      holidays: unit6DataGetHolidays(),
      add: unit6DataAddHoliday,
      update: unit6DataUpdateHoliday,
      remove: unit6DataDeleteHoliday
    }
  }

  return {
    holidays: meDataGetHolidays(),
    add: meDataAddHoliday,
    update: meDataUpdateHoliday,
    remove: meDataDeleteHoliday
  }
}

function capToggleTaskSort(column, contextType) {
  const sortState = capGetTaskSortState(contextType)
  if (!sortState) return
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.column = column
    sortState.direction = 'asc'
  }
}

function capProductDraftDepartment(contextType) {
  if (contextType === 'pm') return 'PM'
  if (contextType === 'log') return 'LOG'
  if (contextType === 'unit6') return 'UNIT6'
  return 'ME'
}

function capGetTaskEditScope(contextType) {
  const scope = document.querySelector('[data-cap-context="' + contextType + '"]')
  return scope || document
}

function capResolveTaskEditRow(taskId, contextType) {
  if (!taskId) return null
  const scope = capGetTaskEditScope(contextType)
  const rowSelector = 'tr[data-task-id="' + taskId + '"]'
  const row = scope && typeof scope.querySelector === 'function'
    ? scope.querySelector(rowSelector)
    : null
  if (row) return row
  return document.querySelector(rowSelector)
}

function capSetProductDraft(row, contextType, patch) {
  const setDraftValue = capGetProductHelper('SetDraftValue')
  if (!row || typeof setDraftValue !== 'function') return null
  const idx = capNum(row.getAttribute('data-product-idx'), -1)
  if (idx < 0) return null
  const productDbId = row.getAttribute('data-product-db-id') || ''

  if (productDbId) {
    return setDraftValue(
      capProductDraftDepartment(contextType),
      row.getAttribute('data-product-id') || '',
      idx,
      patch || {},
      productDbId
    )
  }

  return setDraftValue(
    capProductDraftDepartment(contextType),
    row.getAttribute('data-product-id') || '',
    idx,
    patch || {}
  )
}

function capHandleProductDraftChange(el, contextType) {
  const row = el.closest('[data-product-idx]')
  if (!row) return

  const field = el.getAttribute('data-field')
  if (!field) return

  if (field === 'kittingHours' || field === 'bookingInOutHours' || field === 'productMovementHours') {
    const kittingEl = row.querySelector('input[data-field="kittingHours"]')
    const bookingInOutEl = row.querySelector('input[data-field="bookingInOutHours"]')
    const movementEl = row.querySelector('input[data-field="productMovementHours"]')
    const hoursEl = row.querySelector('input[data-field="hoursPerWeek"]')
    const kittingRaw = kittingEl ? kittingEl.value : ''
    const bookingInOutRaw = bookingInOutEl ? bookingInOutEl.value : ''
    const movementRaw = movementEl ? movementEl.value : ''
    const kittingValue = Number(kittingRaw)
    const bookingInOutValue = Number(bookingInOutRaw)
    const movementValue = Number(movementRaw)
    const total = Math.max(0, Number.isFinite(kittingValue) ? kittingValue : 0) +
      Math.max(0, Number.isFinite(bookingInOutValue) ? bookingInOutValue : 0) +
      Math.max(0, Number.isFinite(movementValue) ? movementValue : 0)

    if (hoursEl) hoursEl.value = String(total)

    capSetProductDraft(row, contextType, {
      kittingHours: kittingRaw,
      bookingInOutHours: bookingInOutRaw,
      productMovementHours: movementRaw,
      hoursPerWeek: String(total)
    })
    return
  }

  capSetProductDraft(row, contextType, {
    [field]: el.value
  })
}

// Refresh only the tasks results (KPIs + table) without re-rendering the entire tab.
// This preserves focus on filter controls during search operations.
function capTaskRefresh(contextType) {
  const dept = capProductDraftDepartment(contextType)
  const scope = document.querySelector('[data-cap-context="' + contextType + '"]')
  if (!scope) {
    capSetTab(contextType, 'tasks')
    return
  }

  const kpiStrip = scope.querySelector('.me-kpi-strip')
  const tableWrap = scope.querySelector('.me-tbl-wrap')
  const cardHeadSpan = scope.querySelector('.me-card-head span:last-child')

  if (!kpiStrip || !tableWrap) {
    capSetTab(contextType, 'tasks')
    return
  }

  // Get data for the current context
  const tasks = contextType === 'pm'
    ? pmDataGetTasks()
    : contextType === 'log'
      ? logDataGetTasks()
      : contextType === 'unit6'
        ? unit6DataGetTasks()
        : meDataGetTasks()

  const team = contextType === 'pm'
    ? pmDataGetTeam()
    : contextType === 'log'
      ? logDataGetTeam()
      : contextType === 'unit6'
        ? unit6DataGetTeam()
        : meDataGetTeam()

  const products = (function() {
    const api = capGetDataApi(contextType)
    return typeof api.getProducts === 'function' ? api.getProducts() : []
  })()

  const filters = capTaskFilters(contextType) || {}
  const sortState = capGetTaskSortState(contextType) || { column: '', direction: 'asc' }
  const canEditFlag = typeof canEdit === 'function' ? canEdit() : true
  const productLookup = capBuildTaskProductLookup(products)

  // Apply filters
  let filteredTasks = tasks.filter(function(t) {
    const search = (filters.search || '').toLowerCase()
    const cat = filters.category || 'all'
    const assignee = filters.assignee || 'all'
    const product = filters.product || 'all'
    const hideCompleted = filters.hideCompleted || false
    const month = filters.month || 'all'

    if (search && !t.name.toLowerCase().includes(search)) return false
    if (cat !== 'all' && t.category !== cat) return false
    if (assignee !== 'all' && t.assigneeId !== assignee) return false
    if (product !== 'all' && t.productId !== product) return false
    if (month !== 'all') {
      const monthStart = month + '-01'
      const monthEnd = month + '-31'
      if (!t.startDate || !t.endDate) return false
      if (t.startDate > monthEnd) return false
      if (t.endDate < monthStart) return false
    }
    if (hideCompleted && t.status === 'COMPLETED') return false
    return true
  })

  // Apply sorting
  if (sortState.column) {
    const col = sortState.column
    const dir = sortState.direction === 'asc' ? 1 : -1
    const assigneeMap = new Map(team.map(function(m) { return [m.id, m.name] }))
    const productMap = new Map(products.map(function(p) { return [p.id, p.name] }))

    filteredTasks.sort(function(a, b) {
      let valA, valB
      switch (col) {
        case 'name': valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); break
        case 'category': valA = (a.category || '').toLowerCase(); valB = (b.category || '').toLowerCase(); break
        case 'assignee': valA = assigneeMap.get(a.assigneeId) || ''; valB = assigneeMap.get(b.assigneeId) || ''; break
        case 'product': valA = productMap.get(a.productId) || ''; valB = productMap.get(b.productId) || ''; break
        case 'startDate': valA = a.startDate || ''; valB = b.startDate || ''; break
        case 'endDate': valA = a.endDate || ''; valB = b.endDate || ''; break
        case 'hours': valA = a.totalHours || 0; valB = b.totalHours || 0; break
        case 'status': valA = (a.status || 'SCHEDULED').toLowerCase(); valB = (b.status || 'SCHEDULED').toLowerCase(); break
        default: valA = 0; valB = 0
      }
      if (valA < valB) return -1 * dir
      if (valA > valB) return 1 * dir
      return 0
    })
  }

  // Calculate KPI values
  let totalHoursValue = 0
  filteredTasks.forEach(function(t) { totalHoursValue += t.totalHours || 0 })
  const totalHours = totalHoursValue.toFixed(1)
  const taskCount = filteredTasks.length
  const unassignedCount = filteredTasks.filter(function(t) { return !t.assigneeId }).length
  const avgHours = taskCount > 0 ? (totalHoursValue / taskCount).toFixed(1) : '0'

  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other']
  const hoursByCategory = {}
  ME_CATS.forEach(function(cat) {
    hoursByCategory[cat] = filteredTasks.filter(function(t) { return t.category === cat })
      .reduce(function(sum, t) { return sum + (t.totalHours || 0) }, 0).toFixed(1)
  })
  const topCategory = ME_CATS.reduce(function(top, cat) {
    return parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  })

  // Update KPI strip
  kpiStrip.innerHTML =
    '<div class="me-kpi" style="border-left: 4px solid var(--green);">' +
      '<div class="me-kpi-value">' + totalHours + '</div>' +
      '<div class="me-kpi-label">Total Hours</div>' +
      '<div class="me-kpi-month">' + filteredTasks.length + ' tasks</div>' +
    '</div>' +
    '<div class="me-kpi" style="border-left: 4px solid var(--blue);">' +
      '<div class="me-kpi-value">' + taskCount + '</div>' +
      '<div class="me-kpi-label">Tasks</div>' +
      '<div class="me-kpi-month">filtered</div>' +
    '</div>' +
    '<div class="me-kpi" style="border-left: 4px solid var(--amber);">' +
      '<div class="me-kpi-value">' + avgHours + '</div>' +
      '<div class="me-kpi-label">Average Hours</div>' +
      '<div class="me-kpi-month">per task</div>' +
    '</div>' +
    '<div class="me-kpi" style="border-left: 4px solid var(--navy);">' +
      '<div class="me-kpi-value">' + hoursByCategory[topCategory] + '</div>' +
      '<div class="me-kpi-label">Top Category</div>' +
      '<div class="me-kpi-month">' + topCategory + '</div>' +
    '</div>' +
    '<div class="me-kpi" style="border-left: 4px solid var(--red);">' +
      '<div class="me-kpi-value">' + unassignedCount + '</div>' +
      '<div class="me-kpi-label">Unassigned</div>' +
      '<div class="me-kpi-month">filtered tasks</div>' +
    '</div>'

  // Update card header hours
  if (cardHeadSpan) cardHeadSpan.textContent = totalHours + ' total hours'

  // Build table rows — reuse the shared inline-editing renderer so rows stay
  // editable after save instead of reverting to the old read-only format.
  const rows = _capRenderTaskRows(filteredTasks, team, products, canEditFlag, dept)

  // Get sort icons
  const getSortIcon = typeof capGetSortIcon === 'function' ? capGetSortIcon : function() { return '↕' }

  // Build new-task top row
  var newTaskRow = ''
  if (canEditFlag) {
    var ME_CATS_NEW = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other']
    var newCatOpts = ME_CATS_NEW.map(function(c) { return '<option value="' + c + '">' + c + '</option>' }).join('')
    var newMemOpts = '<option value="">Unassigned</option>' + team.map(function(m) { return '<option value="' + m.id + '">' + esc(m.name) + '</option>' }).join('')
    var newStatusOpts = ['SCHEDULED', 'STARTED', 'COMPLETED'].map(function(s) { return '<option value="' + s + '">' + s[0] + s.slice(1).toLowerCase() + '</option>' }).join('')
    newTaskRow =
      '<tr class="me-task-row" data-cap-new-task="1" style="background-color:var(--row-highlight-blue,#eff6ff);outline:2px solid var(--chart-blue-lt,#93c5fd);outline-offset:-2px;">' +
        '<td><input name="task_name" data-task-field="name" placeholder="Task name" style="width:100%;"></td>' +
        '<td><select name="task_category" data-task-field="category">' + newCatOpts + '</select></td>' +
        '<td><select name="task_assigneeId" data-task-field="assigneeId">' + newMemOpts + '</select></td>' +
        '<td>' + capRenderTaskProductPickerCell({}, dept, 'draft', productLookup) + '</td>' +
        '<td><input type="date" name="task_startDate" data-task-field="startDate"></td>' +
        '<td><input type="date" name="task_endDate" data-task-field="endDate"></td>' +
        '<td><select name="task_status" data-task-field="status">' + newStatusOpts + '</select></td>' +
        '<td></td>' +
        '<td><input type="number" name="task_totalHours" data-task-field="totalHours" placeholder="0" step="0.5" style="width:70px;"></td>' +
        '<td style="text-align:center;"><button class="btn-del" title="Add task" data-cap-action="cap-task-add">✓</button></td>' +
      '</tr>'
  }

  // Update table
  tableWrap.innerHTML =
    '<table class="me-tbl">' +
      '<thead><tr>' +
        '<th style="width:150px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="name" title="Sort by name">' + getSortIcon('name', dept) + ' Task Name</th>' +
        '<th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="category" title="Sort by category">' + getSortIcon('category', dept) + ' Category</th>' +
        '<th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="assignee" title="Sort by assignee">' + getSortIcon('assignee', dept) + ' Assignee</th>' +
        '<th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="product" title="Sort by product">' + getSortIcon('product', dept) + ' Product</th>' +
        '<th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="startDate" title="Sort by start date">' + getSortIcon('startDate', dept) + ' Start Date</th>' +
        '<th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="endDate" title="Sort by end date">' + getSortIcon('endDate', dept) + ' End Date</th>' +
        '<th style="width:120px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="status" title="Sort by status">' + getSortIcon('status', dept) + ' Status</th>' +
        '<th style="width:90px">Disable</th>' +
        '<th style="width:80px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="hours" title="Sort by hours">' + getSortIcon('hours', dept) + ' Hours</th>' +
        '<th style="width:60px"></th>' +
      '</tr></thead>' +
      '<tbody>' +
        newTaskRow +
        (rows || '<tr><td colspan="10"><div style="text-align:center;padding:40px;color:var(--muted);">No tasks match the current filters</div></td></tr>') +
      '</tbody>' +
    '</table>' +
    capRenderTaskProductDatalist(productLookup.sortedProducts, dept)
}

const CAP_TASK_SEARCH_RENDER_DEBOUNCE_MS = 90
const _capTaskSearchRefreshTimers = {
  me: null,
  pm: null,
  log: null,
  unit6: null
}

function capTaskSearchTimerKey(contextType) {
  return contextType === 'pm' || contextType === 'log' || contextType === 'unit6'
    ? contextType
    : 'me'
}

function capCancelTaskSearchRefresh(contextType) {
  const key = capTaskSearchTimerKey(contextType)
  const existing = _capTaskSearchRefreshTimers[key]
  if (existing) {
    clearTimeout(existing)
    _capTaskSearchRefreshTimers[key] = null
  }
}

function capScheduleTaskSearchRefresh(contextType) {
  const key = capTaskSearchTimerKey(contextType)
  capCancelTaskSearchRefresh(key)

  _capTaskSearchRefreshTimers[key] = setTimeout(function() {
    _capTaskSearchRefreshTimers[key] = null

    const scope = document.querySelector('[data-cap-context="' + key + '"]')
    const searchInput = scope && typeof scope.querySelector === 'function'
      ? scope.querySelector('[data-cap-action="cap-task-search"]')
      : null
    if (!searchInput) return

    capPreserveSearchContinuity(searchInput, '[data-cap-action="cap-task-search"]', function() {
      capTaskRefresh(key)
    })
  }, CAP_TASK_SEARCH_RENDER_DEBOUNCE_MS)
}

function capPreserveSearchContinuity(inputEl, replacementSelector, rerenderFn) {
  const contextRoot = inputEl && typeof inputEl.closest === 'function'
    ? inputEl.closest('[data-cap-context]')
    : null
  const contextType = contextRoot ? contextRoot.getAttribute('data-cap-context') : ''

  if (typeof preserveInputCaretAfterRender === 'function') {
    preserveInputCaretAfterRender(inputEl, rerenderFn, {
      replacementSelector,
      scopeResolver: function() {
        return contextType
          ? document.querySelector('[data-cap-context="' + contextType + '"]')
          : document
      }
    })
    return
  }

  const caretStart = inputEl && typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : null
  const caretEnd = inputEl && typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : caretStart
  rerenderFn()
  setTimeout(function() {
    const scope = contextType
      ? document.querySelector('[data-cap-context="' + contextType + '"]')
      : document
    const replacement = scope && typeof scope.querySelector === 'function'
      ? scope.querySelector(replacementSelector)
      : null
    if (!replacement) return

    replacement.focus()
    if (caretStart !== null && typeof replacement.setSelectionRange === 'function') {
      const len = (replacement.value || '').length
      const start = Math.min(caretStart, len)
      const end = Math.min(caretEnd === null ? start : caretEnd, len)
      replacement.setSelectionRange(start, end)
    }
  }, 0)
}

function onCapacityClick(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

  switch (action) {
  // ── Navigation ─────────────────────────────────────────────
  case 'cap-nav-hub': navigate('hub'); break
  case 'cap-nav-production-schedule':
    navigate('production')
    appState.productionTab = 'scheduling'
    render()
    break
  case 'cap-set-tab': setCapacityTab(el.getAttribute('data-tab')); break

  // ── ME tabs ────────────────────────────────────────────────
  case 'cap-me-set-tab': meSetTab(el.getAttribute('data-tab')); break
  case 'cap-me-back': setCapacityTab('root'); break
  case 'cap-me-prev-month': capRunPrevMonth(contextType); break
  case 'cap-me-next-month': capRunNextMonth(contextType); break
  case 'cap-me-today': {
    const today = new Date()
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    capRunMonthChange(contextType, monthKey)
    break
  }
  case 'cap-me-toggle-holiday': {
    const holidayApi = capGetHolidayApi(contextType)
    capToggleHoliday(
      el.getAttribute('data-member-id'),
      el.getAttribute('data-date'),
      holidayApi.holidays,
      holidayApi.add,
      holidayApi.update,
      holidayApi.remove
    )
    capRunDebouncedSave(contextType)
    capSetTab(contextType, 'holidays')
    break
  }
  case 'cap-me-heatmap-open': {
    const openHeatmapDetail = capGetHeatmapHelper('OpenHeatmapDetail')
    if (typeof openHeatmapDetail === 'function') {
      openHeatmapDetail(el.getAttribute('data-member-id'), el.getAttribute('data-start'), el.getAttribute('data-end'))
    }
    break
  }
  case 'cap-me-heatmap-close': {
    const closeHeatmapDetail = capGetHeatmapHelper('CloseHeatmapDetail')
    if (typeof closeHeatmapDetail === 'function') closeHeatmapDetail()
    break
  }

  // ── ME Team ────────────────────────────────────────────────
  case 'cap-team-del': {
    const row = el.closest('[data-member-idx]')
    const idx = capNum(row?.getAttribute('data-member-idx'), -1)
    if (idx < 0) break
    const api = capGetDataApi(contextType)
    if (confirm('Delete team member?')) {
      if (typeof api.deleteTeam === 'function') api.deleteTeam(idx)
      capRunSave(contextType)
      capSetTab(contextType, 'team')
    }
    break
  }
  case 'cap-team-add': {
    const department = capProductDraftDepartment(contextType)
    const label = isPM
      ? 'New PM Manager'
      : department === 'LOG'
        ? 'New Logistics Technician'
        : department === 'UNIT6'
          ? 'New Technician'
          : 'New Engineer'
    const api = capGetDataApi(contextType)
    if (typeof api.addTeam === 'function') {
      api.addTeam(label, capDefaultHoursPerWeek(), 80)
      capRunSave(contextType)
      capSetTab(contextType, 'team')
    }
    break
  }
  case 'cap-team-holidays': capSetTab(contextType, 'holidays'); break
  case 'cap-team-sort': {
    const key = el.getAttribute('data-sort-key')
    const dept = capProductDraftDepartment(contextType)
    capTeamSortBy(key, dept)
    capRefreshCurrentTab(contextType)
    break
  }

  // ── ME Tasks ──────────────────────────────────────────────
  case 'cap-task-del': {
    const taskId = el.getAttribute('data-task-id') || el.closest('[data-task-id]')?.getAttribute('data-task-id')
    if (!taskId) break
    const api = capGetDataApi(contextType)
    if (confirm('Delete task?')) {
      if (typeof api.deleteTask === 'function') api.deleteTask(taskId)
      capRunSave(contextType)
      capTaskRefresh(contextType)
    }
    break
  }
  case 'cap-task-add': {
    // Reads from the new-task top row inputs
    const newRow = el.closest('[data-cap-new-task]')
    if (!newRow) break
    const newName = (newRow.querySelector('[data-task-field="name"]')?.value || '').trim()
    if (!newName) { newRow.querySelector('[data-task-field="name"]')?.focus(); break }
    const api = capGetDataApi(contextType)
    if (typeof api.addTask === 'function') {
      api.addTask(
        newName,
        newRow.querySelector('[data-task-field="category"]')?.value || 'NPI',
        newRow.querySelector('[data-task-field="assigneeId"]')?.value || '',
        newRow.querySelector('[data-task-field="startDate"]')?.value || '',
        newRow.querySelector('[data-task-field="endDate"]')?.value || '',
        parseFloat(newRow.querySelector('[data-task-field="totalHours"]')?.value) || 0,
        newRow.querySelector('[data-task-field="productId"]')?.value || ''
      )
      capRunSave(contextType)
      capTaskRefresh(contextType)
    }
    break
  }
  case 'cap-task-start-edit': {
    const dept = capProductDraftDepartment(contextType)
    const taskId = el.getAttribute('data-task-id') || el.closest('[data-task-id]')?.getAttribute('data-task-id')
    if (!taskId) break
    capTaskEditingId[dept] = taskId
    capTaskRefresh(contextType)
    // Focus the name field in the now-rendered edit row
    setTimeout(function() {
      const taskRow = capResolveTaskEditRow(taskId, contextType)
      const nameInput = taskRow && typeof taskRow.querySelector === 'function'
        ? taskRow.querySelector('[data-task-field="name"]')
        : null
      if (nameInput) nameInput.focus()
    }, 0)
    break
  }
  case 'cap-task-save-edit': {
    const dept = capProductDraftDepartment(contextType)
    const activeTaskId = capTaskEditingId[dept] ? capTaskEditingId[dept] : ''
    const clickedTaskId = el.getAttribute('data-task-id') || el.closest('[data-task-id]')?.getAttribute('data-task-id')
    const taskId = activeTaskId || clickedTaskId
    if (!taskId) break
    const editRow = capResolveTaskEditRow(taskId, contextType)
    if (!editRow) break
    const savedName = (editRow.querySelector('[data-task-field="name"]')?.value || '').trim()
    if (!savedName) { editRow.querySelector('[data-task-field="name"]')?.focus(); break }
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') {
      api.updateTask(taskId, 'name', savedName)
      api.updateTask(taskId, 'category', editRow.querySelector('[data-task-field="category"]')?.value || 'NPI')
      api.updateTask(taskId, 'assigneeId', editRow.querySelector('[data-task-field="assigneeId"]')?.value || '')
      api.updateTask(taskId, 'productId', editRow.querySelector('[data-task-field="productId"]')?.value || '')
      api.updateTask(taskId, 'startDate', editRow.querySelector('[data-task-field="startDate"]')?.value || '')
      api.updateTask(taskId, 'endDate', editRow.querySelector('[data-task-field="endDate"]')?.value || '')
      api.updateTask(taskId, 'totalHours', editRow.querySelector('[data-task-field="totalHours"]')?.value || 0)
      api.updateTask(taskId, 'status', editRow.querySelector('[data-task-field="status"]')?.value || 'SCHEDULED')
      api.updateTask(taskId, 'isDisabled', editRow.querySelector('[data-task-field="isDisabled"]')?.checked || false)
    }
    capTaskEditingId[dept] = null
    capRunSave(contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-cancel-edit': {
    const dept = capProductDraftDepartment(contextType)
    capTaskEditingId[dept] = null
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-sort': {
    capCancelTaskSearchRefresh(contextType)
    const key = el.getAttribute('data-sort-key')
    capToggleTaskSort(key, contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-search': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.search = ''
    const inp = document.querySelector('.me-filter-input')
    if (inp) inp.value = ''
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-category': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.category = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-assignee': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.assignee = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-product': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.product = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-month': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.month = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-toggle-hide-completed': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    const storageKey = contextType === 'pm'
      ? 'pmTasksHideCompleted'
      : contextType === 'log'
        ? 'logTasksHideCompleted'
        : contextType === 'unit6'
          ? 'unit6TasksHideCompleted'
          : 'meTasksHideCompleted'
    if (f) {
      f.hideCompleted = !f.hideCompleted
      localStorage.setItem(storageKey, f.hideCompleted)
    }
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-all-filters': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    const storageKey = contextType === 'pm'
      ? 'pmTasksHideCompleted'
      : contextType === 'log'
        ? 'logTasksHideCompleted'
        : contextType === 'unit6'
          ? 'unit6TasksHideCompleted'
          : 'meTasksHideCompleted'
    const hideVal = f ? f.hideCompleted : false
    if (f) {
      Object.assign(f, { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: hideVal })
    }
    capTaskRefresh(contextType)
    break
  }

  // ── ME Products ───────────────────────────────────────────
  case 'cap-products-apply-hours': {
    const row = el.closest('[data-product-idx]')
    const idx = capNum(row?.getAttribute('data-product-idx'), -1)
    if (idx < 0) break

    const hoursEl = row?.querySelector('input[data-field="hoursPerWeek"]')
    const kittingEl = row?.querySelector('input[data-field="kittingHours"]')
    const bookingInOutEl = row?.querySelector('input[data-field="bookingInOutHours"]')
    const movementEl = row?.querySelector('input[data-field="productMovementHours"]')
    const effectiveDateEl = row?.querySelector('input[data-field="supportEffectiveDate"]')
    const reasonEl = row?.querySelector('input[data-field="supportChangeReason"]')
    const hasSplitFields = !!kittingEl || !!bookingInOutEl || !!movementEl
    const kittingValue = kittingEl ? Number(kittingEl.value) : 0
    const bookingInOutValue = bookingInOutEl ? Number(bookingInOutEl.value) : 0
    const movementValue = movementEl ? Number(movementEl.value) : 0
    const hoursValue = hasSplitFields
      ? ((Number.isFinite(kittingValue) ? kittingValue : NaN) + (Number.isFinite(bookingInOutValue) ? bookingInOutValue : NaN) + (Number.isFinite(movementValue) ? movementValue : NaN))
      : (hoursEl ? Number(hoursEl.value) : NaN)
    const effectiveDate = (effectiveDateEl?.value || '').trim()
    const changeReason = (reasonEl?.value || '').trim()

    if (hasSplitFields && (!Number.isFinite(kittingValue) || kittingValue < 0 || !Number.isFinite(bookingInOutValue) || bookingInOutValue < 0 || !Number.isFinite(movementValue) || movementValue < 0)) {
      alert('Enter valid non-negative values for Kitting, Booking In/Out, and Product Movement before applying.')
      if (kittingEl && (!Number.isFinite(kittingValue) || kittingValue < 0)) kittingEl.focus()
      else if (bookingInOutEl && (!Number.isFinite(bookingInOutValue) || bookingInOutValue < 0)) bookingInOutEl.focus()
      else if (movementEl) movementEl.focus()
      break
    }

    if (!Number.isFinite(hoursValue) || hoursValue < 0) {
      alert('Enter a valid Hours/Batch value before applying.')
      if (hoursEl) hoursEl.focus()
      break
    }

    if (!effectiveDate) {
      alert('Choose an Effective Date before applying the support change.')
      if (effectiveDateEl) effectiveDateEl.focus()
      break
    }

    if (changeReason.length < 3) {
      alert('Add a short reason so this change is intentional and traceable.')
      if (reasonEl) reasonEl.focus()
      break
    }

    const api = capGetDataApi(contextType)
    const products = typeof api.getProducts === 'function' ? api.getProducts() : []
    const product = products[idx]
    const currentEffectiveDate = (product && product.supportEffectiveDate) ? String(product.supportEffectiveDate) : ''

    if (currentEffectiveDate && effectiveDate < currentEffectiveDate) {
      const confirmBackdate = confirm('You are backdating this support change before the current effective date. Continue intentionally?')
      if (!confirmBackdate) break
    }

    if (typeof api.updateProduct === 'function') {
      api.updateProduct(idx, 'hoursPerWeek', String(hoursValue), {
        effectiveDate,
        changeReason,
        kittingHours: hasSplitFields ? kittingValue : undefined,
        bookingInOutHours: hasSplitFields ? bookingInOutValue : undefined,
        productMovementHours: hasSplitFields ? movementValue : undefined
      })
    }

    const clearDraft = capGetProductHelper('ClearDraft')
    if (typeof clearDraft === 'function') {
      const productDbId = row?.getAttribute('data-product-db-id') || ''
      if (productDbId) {
        clearDraft(
          capProductDraftDepartment(contextType),
          row?.getAttribute('data-product-id') || '',
          idx,
          productDbId
        )
      } else {
        clearDraft(
          capProductDraftDepartment(contextType),
          row?.getAttribute('data-product-id') || '',
          idx
        )
      }
    }

    capRefreshCurrentTab(contextType)
    capRunDebouncedSave(contextType)
    break
  }
  case 'cap-products-toggle-history': {
    const toggleHistory = capGetProductHelper('ToggleHistory')
    if (typeof toggleHistory === 'function') {
      toggleHistory(el.getAttribute('data-product-id'), el.getAttribute('data-dept'))
    }
    break
  }
  case 'cap-products-allocations': {
    // Open the allocation modal for this product
    const productId = el.getAttribute('data-product-id')
    if (!productId) break
    const api = capGetDataApi(contextType)
    const products = typeof api.getProducts === 'function' ? api.getProducts() : []
    const product = products.find(p => p && p.id === productId)
    const productName = product ? (product.name || 'Unnamed product') : 'Unnamed product'
    const productHours = product ? (product.hoursPerWeek || 0) : 0
    capOpenAllocationsModal(productId, productName, productHours, capGetAllocDeps(contextType))
    break
  }
  case 'cap-products-edit-history': {
    const historyId = el.getAttribute('data-history-id')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (!historyId) break
    const isLogContext = dept === 'LOG'
    const entrySnapshot = {
      effectiveDate: el.getAttribute('data-effective-date') || '',
      hoursPerWeek: parseFloat(el.getAttribute('data-hours') || '0'),
      changeReason: el.getAttribute('data-reason') || ''
    }
    if (isLogContext) {
      entrySnapshot.kittingHours = parseFloat(el.getAttribute('data-kitting') || '0')
      entrySnapshot.bookingInOutHours = parseFloat(el.getAttribute('data-booking') || '0')
      entrySnapshot.productMovementHours = parseFloat(el.getAttribute('data-movement') || '0')
    }
    const startHistoryEdit = capGetProductHelper('StartHistoryEdit')
    if (typeof startHistoryEdit === 'function') {
      startHistoryEdit(historyId, entrySnapshot, dept)
    }
    break
  }
  case 'cap-products-save-history-edit': {
    const historyId = el.getAttribute('data-history-id')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (!historyId) break
    const editRow = el.closest('tr[data-history-edit-row]')
    const saveHistoryEdit = capGetProductHelper('SaveHistoryEdit')
    if (typeof saveHistoryEdit === 'function') {
      saveHistoryEdit(historyId, dept, editRow)
    }
    break
  }
  case 'cap-products-cancel-history-edit': {
    const dept = el.getAttribute('data-dept') || 'ME'
    const cancelHistoryEdit = capGetProductHelper('CancelHistoryEdit')
    if (typeof cancelHistoryEdit === 'function') {
      cancelHistoryEdit(dept)
    }
    break
  }
  case 'cap-products-delete-history': {
    const historyId = el.getAttribute('data-history-id')
    const dept = (el.getAttribute('data-dept') || '').toUpperCase()
    const deleteContextType = dept === 'PM' ? 'pm' : dept === 'LOG' ? 'log' : dept === 'UNIT6' ? 'unit6' : contextType
    if (!historyId) break
    if (!confirm('Delete this support history entry? This cannot be undone.')) break
    const deleteFn = deleteContextType === 'pm'
      ? pmDataDeleteProductSupportHistoryEntry
      : deleteContextType === 'log'
        ? logDataDeleteProductSupportHistoryEntry
        : deleteContextType === 'unit6'
          ? unit6DataDeleteProductSupportHistoryEntry
          : meDataDeleteProductSupportHistoryEntry
    if (typeof deleteFn === 'function') {
      deleteFn(historyId)
    }
    capRefreshCurrentTab(deleteContextType)
    capRunDebouncedSave(deleteContextType)
    break
  }
  case 'cap-products-sort-column': {
    const key = el.getAttribute('data-sort-key')
    const dept = el.getAttribute('data-dept') || capProductDraftDepartment(contextType)
    const sortByColumn = capGetProductHelper('SortByColumn')
    if (typeof sortByColumn === 'function') {
      sortByColumn(key, dept)
    }
    break
  }
  case 'cap-products-sort-dir': {
    const toggleSortDir = capGetProductHelper('ToggleSortDir')
    if (typeof toggleSortDir === 'function') toggleSortDir(el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-clear-filters': {
    const clearFilters = capGetProductHelper('ClearFilters')
    if (typeof clearFilters === 'function') clearFilters(el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-bulk-save': {
    const department = el.getAttribute('data-dept') || 'ME'
    const bulkSaveChanges = capGetProductHelper('BulkSaveChanges')
    if (typeof bulkSaveChanges === 'function') {
      bulkSaveChanges(department)
    }
    break
  }

  // ── ME Product Taskload ───────────────────────────────────
  case 'cap-product-load-sort-column': {
    const key = el.getAttribute('data-sort-key')
    const dept = el.getAttribute('data-dept') || 'ME'
    const sortByColumn = capGetProductLoadHelper('SortByColumn')
    if (typeof sortByColumn === 'function') {
      sortByColumn(key, dept)
    }
    break
  }
  case 'cap-product-load-sort-dir': {
    const toggleSortDir = capGetProductLoadHelper('ToggleSortDir')
    if (typeof toggleSortDir === 'function') toggleSortDir(el.getAttribute('data-dept'))
    break
  }
  case 'cap-product-load-clear-filters': {
    const clearFilters = capGetProductLoadHelper('ClearFilters')
    if (typeof clearFilters === 'function') clearFilters(el.getAttribute('data-dept'))
    break
  }

  // ── PM Capacity ───────────────────────────────────────────
  case 'cap-pm-set-tab': if (typeof pmSetTab === 'function') pmSetTab(el.getAttribute('data-tab')); break
  case 'cap-pm-back': setCapacityTab('root'); break

  // ── Logistics Capacity ────────────────────────────────────
  case 'cap-log-set-tab': if (typeof logSetTab === 'function') logSetTab(el.getAttribute('data-tab')); break
  case 'cap-log-back': setCapacityTab('root'); break

  // ── Unit 6 Capacity ───────────────────────────────────────
  case 'cap-unit6-set-tab': if (typeof unit6SetTab === 'function') unit6SetTab(el.getAttribute('data-tab')); break
  case 'cap-unit6-back': setCapacityTab('root'); break

  // ── Production Capacity ───────────────────────────────────
  case 'cap-prod-set-tab': if (typeof setProdCapTab === 'function') setProdCapTab(el.getAttribute('data-tab')); break
  case 'cap-prod-back': setCapacityTab('root'); break
  case 'cap-prod-open-schedule':
    navigate('production')
    appState.productionTab = 'scheduling'
    render()
    break
  case 'cap-prod-prev-month': if (typeof prodCapShiftMonth === 'function') prodCapShiftMonth('prev'); break
  case 'cap-prod-next-month': if (typeof prodCapShiftMonth === 'function') prodCapShiftMonth('next'); break
  case 'cap-prod-reset-month': if (typeof prodCapResetMonthOffset === 'function') prodCapResetMonthOffset(); break
  case 'cap-prod-capacity-help': {
    if (typeof showModal === 'function') showModal('modalProdCapacityFormula')
    break
  }
  case 'cap-prod-set-workarea': {
    const wa = el.getAttribute('data-workarea')
    prodCapSetWorkArea(wa)
    render()
    break
  }
  case 'cap-prod-settings-fill-forward': if (typeof prodCapSettingsFillForward === 'function') prodCapSettingsFillForward(); break
  case 'cap-prod-settings-clear-all': if (typeof prodCapSettingsClearAll === 'function') prodCapSettingsClearAll(); break

  default: break
  }
}

function onCapacityChange(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

  switch (action) {
  // ── ME month change ────────────────────────────────────────
  case 'cap-me-month-change': capRunMonthChange(contextType, el.value); break

  // ── ME Team update ────────────────────────────────────────
  case 'cap-team-upd': {
    const row = el.closest('[data-member-idx]')
    const idx = capNum(row?.getAttribute('data-member-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    const api = capGetDataApi(contextType)
    if (typeof api.updateTeam === 'function') api.updateTeam(idx, field, el.value)
    capRunDebouncedSave(contextType)
    break
  }

  // ── ME Tasks — inline disable toggle (always available) ───
  case 'cap-task-toggle-disabled': {
    const row = el.closest('[data-task-id]')
    const taskId = row?.getAttribute('data-task-id')
    if (!taskId) break
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') api.updateTask(taskId, 'isDisabled', !!el.checked)
    capRunDebouncedSave(contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-upd': {
    const row = el.closest('[data-task-id]')
    const taskId = row?.getAttribute('data-task-id')
    const field = el.getAttribute('data-field')
    if (!taskId || !field) break
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') {
      // Inline edit restore: persist each cell change directly from the task row.
      let nextValue = el.value
      if (field === 'isDisabled') nextValue = !!el.checked
      if (field === 'totalHours') {
        const parsedHours = Number.parseFloat(el.value)
        nextValue = Number.isFinite(parsedHours) ? parsedHours : 0
      }
      if (field === 'name') {
        const trimmedName = (el.value || '').trim()
        if (!trimmedName) {
          // Keep task names non-empty and immediately restore persisted value in the row UI.
          capTaskRefresh(contextType)
          break
        }
        nextValue = trimmedName
        el.value = trimmedName
      }
      api.updateTask(taskId, field, nextValue)
    }
    capRunDebouncedSave(contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-category': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.category = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-assignee': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.assignee = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-product-input': {
    // Searchable product filter: resolve name to ID and update hidden input
    const picker = el.closest('.cap-task-product-picker')
    const hiddenInput = picker ? picker.querySelector('input[data-cap-action="cap-task-filter-product"]') : null
    if (!hiddenInput) break
    const label = (el.value || '').trim()
    const normalized = label.toLowerCase()
    const api = capGetDataApi(contextType)
    const products = typeof api.getProducts === 'function' ? api.getProducts() : []
    const lookup = capBuildTaskProductLookup(products)
    let nextId = 'all'
    // Empty input clears filter; otherwise resolve name to ID via lookup
    if (normalized) {
      nextId = lookup.byNameLower.get(normalized) || 'all'
    }
    if (hiddenInput.value === nextId) break
    hiddenInput.value = nextId
    // Trigger filter change event on hidden input
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
    break
  }
  case 'cap-task-filter-product': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.product = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-month': {
    capCancelTaskSearchRefresh(contextType)
    const f = capTaskFilters(contextType)
    if (f) f.month = el.value
    capTaskRefresh(contextType)
    break
  }

  // ── ME Products update ────────────────────────────────────
  case 'cap-products-draft': {
    capHandleProductDraftChange(el, contextType)
    break
  }
  case 'cap-products-history-edit-field': {
    const field = el.getAttribute('data-history-edit-field')
    const dept = el.getAttribute('data-dept') || 'ME'
    const updateHistoryEditDraft = capGetProductHelper('UpdateHistoryEditDraft')
    if (field && typeof updateHistoryEditDraft === 'function') {
      updateHistoryEditDraft(dept, field, el.value)
    }
    break
  }
  case 'cap-products-upd': {
    const row = el.closest('[data-product-idx]')
    const idx = capNum(row?.getAttribute('data-product-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    if (field === 'kittingHours' || field === 'bookingInOutHours' || field === 'productMovementHours') {
      const hoursEl = row?.querySelector('input[data-field="hoursPerWeek"]')
      const kittingEl = row?.querySelector('input[data-field="kittingHours"]')
      const bookingInOutEl = row?.querySelector('input[data-field="bookingInOutHours"]')
      const movementEl = row?.querySelector('input[data-field="productMovementHours"]')
      const kittingValue = kittingEl ? Number(kittingEl.value) : 0
      const bookingInOutValue = bookingInOutEl ? Number(bookingInOutEl.value) : 0
      const movementValue = movementEl ? Number(movementEl.value) : 0
      if (hoursEl) {
        const total = Math.max(0, Number.isFinite(kittingValue) ? kittingValue : 0) + Math.max(0, Number.isFinite(bookingInOutValue) ? bookingInOutValue : 0) + Math.max(0, Number.isFinite(movementValue) ? movementValue : 0)
        hoursEl.value = String(total)
      }
      break
    }
    if (field === 'hoursPerWeek' || field === 'supportEffectiveDate') {
      // Intent-based flow: dated support changes are only persisted via cap-products-apply-hours.
      break
    }

    const api = capGetDataApi(contextType)
    if (typeof api.updateProduct === 'function') api.updateProduct(idx, field, el.value)
    capRunDebouncedSave(contextType)
    break
  }
  case 'cap-products-family-filter': {
    const setFamilyFilter = capGetProductHelper('SetFamilyFilter')
    if (typeof setFamilyFilter === 'function') setFamilyFilter(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-sort': {
    const setSort = capGetProductHelper('SetSort')
    if (typeof setSort === 'function') setSort(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-status-toggle': {
    const toggleStatusFilter = capGetProductHelper('ToggleStatusFilter')
    if (typeof toggleStatusFilter === 'function') {
      toggleStatusFilter(
        el.getAttribute('data-status'),
        !!el.checked,
        el.getAttribute('data-dept')
      )
    }
    break
  }

  // ── ME Product Taskload ────────────────────────────────────
  case 'cap-product-load-family-filter': {
    const setFamilyFilter = capGetProductLoadHelper('SetFamilyFilter')
    if (typeof setFamilyFilter === 'function') setFamilyFilter(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-product-load-sort': {
    const setSort = capGetProductLoadHelper('SetSort')
    if (typeof setSort === 'function') setSort(el.value, el.getAttribute('data-dept'))
    break
  }

  // ── Production Capacity ────────────────────────────────────
  case 'cap-prod-detail-filter-status':
    setProdCapDetailFilter({ status: el.value })
    render()
    break
  case 'cap-prod-detail-filter-family':
    setProdCapDetailFilter({ family: el.value })
    render()
    break
  case 'cap-prod-detail-filter-workarea':
    setProdCapDetailFilter({ workArea: el.value })
    render()
    break
  case 'cap-prod-settings-capacity': {
    const wa = el.getAttribute('data-workarea')
    const year = capNum(el.getAttribute('data-year'), 0)
    const month = capNum(el.getAttribute('data-month'), 0)
    if (typeof prodCapSettingsUpdate === 'function') prodCapSettingsUpdate(wa, year, month, el.value)
    break
  }
  case 'cap-prod-settings-utilization': {
    if (typeof prodCapSettingsSetUtilization === 'function') prodCapSettingsSetUtilization(el.value)
    break
  }

  default: break
  }
}

function onCapacityInput(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

  switch (action) {
  case 'cap-task-product-input': {
    const row = el.closest('tr')
    const picker = el.closest('.cap-task-product-picker')
    const hiddenInput = picker ? picker.querySelector('input[name="task_productId"]') : null
    if (!hiddenInput || !row) break
    const label = (el.value || '').trim()
    const normalized = label.toLowerCase()
    const api = capGetDataApi(contextType)
    const products = typeof api.getProducts === 'function' ? api.getProducts() : []
    const lookup = capBuildTaskProductLookup(products)
    let nextId = ''
    // Empty input clears product; otherwise resolve name to ID via lookup.
    if (normalized) {
      nextId = lookup.byNameLower.get(normalized) || ''
    }
    if (hiddenInput.value === nextId) break
    hiddenInput.value = nextId
    if (hiddenInput.getAttribute('data-cap-action') === 'cap-task-upd') {
      // Why: keep existing inline autosave flow by routing selection changes through cap-task-upd.
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
    }
    break
  }
  case 'cap-task-search': {
    const filterStateVar = capTaskFilters(contextType)
    if (filterStateVar) filterStateVar.search = el.value
    capScheduleTaskSearchRefresh(contextType)
    break
  }
  case 'cap-products-search': {
    const dept = el.getAttribute('data-dept')
    capPreserveSearchContinuity(el, '[data-cap-action="cap-products-search"]', function() {
      const setSearch = capGetProductHelper('SetSearch')
      if (typeof setSearch === 'function') setSearch(el.value, dept)
    })
    break
  }
  case 'cap-products-draft': {
    capHandleProductDraftChange(el, contextType)
    break
  }
  case 'cap-products-history-edit-field': {
    const field = el.getAttribute('data-history-edit-field')
    const dept = el.getAttribute('data-dept') || 'ME'
    const updateHistoryEditDraft = capGetProductHelper('UpdateHistoryEditDraft')
    if (field && typeof updateHistoryEditDraft === 'function') {
      updateHistoryEditDraft(dept, field, el.value)
    }
    break
  }
  case 'cap-product-load-search': {
    const dept = el.getAttribute('data-dept')
    capPreserveSearchContinuity(el, '[data-cap-action="cap-product-load-search"]', function() {
      const setSearch = capGetProductLoadHelper('SetSearch')
      if (typeof setSearch === 'function') setSearch(el.value, dept)
    })
    break
  }
  default: break
  }
}

function onCapacityKeydown(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')

  switch (action) {
  case 'cap-prod-settings-capacity': {
    const wa = el.getAttribute('data-workarea')
    const key = el.getAttribute('data-key')
    if (typeof prodCapSettingsNavKey === 'function') prodCapSettingsNavKey(evt, wa, key)
    break
  }
  default: break
  }
}

function onCapacityFocusOut(evt) {
  const nextFocus = evt.relatedTarget
  const contextRoot = evt.target && typeof evt.target.closest === 'function'
    ? evt.target.closest('[data-cap-context]')
    : null
  // If moving to next cell in same table, no need to flush
  if (nextFocus && nextFocus.closest('table')) return

  // Scheduler-managed portals: flush deferred render (no-op if nothing pending)
  if (typeof flushDeferred === 'function') {
    flushDeferred('me')
    flushDeferred('pm')
    flushDeferred('log')
    flushDeferred('unit6')
  }

  // No old-style portals pending — skip the setTimeout
  if (!prodCapPendingRealTimeUpdate) return

  // Use setTimeout(0) to let browser settle focus (handles select dropdown quirk)
  setTimeout(function() {
    // Re-check if still editing (in case user moved to a new cell)
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) return

    // ── Production Capacity flush ──────────────────────────
    if (prodCapPendingRealTimeUpdate) {
      setProdCapPendingRealTimeUpdate(false)
      if (appState.capacityTab === 'production' && typeof prodCapRefreshCurrentTab === 'function') {
        prodCapRefreshCurrentTab()
      }
      return
    }
  }, 0)
}

export function setupCapacityEvents() {
  const container = document.getElementById('mainContent')
  if (!container) return
  if (_capEventsContainer === container) return
  if (_capEventsContainer) teardownCapacityEvents()

  container.addEventListener('click', onCapacityClick)
  container.addEventListener('change', onCapacityChange)
  container.addEventListener('input', onCapacityInput)
  container.addEventListener('keydown', onCapacityKeydown)
  container.addEventListener('focusout', onCapacityFocusOut)
  _capEventsContainer = container
}

export function teardownCapacityEvents() {
  if (!_capEventsContainer) return
  _capEventsContainer.removeEventListener('click', onCapacityClick)
  _capEventsContainer.removeEventListener('change', onCapacityChange)
  _capEventsContainer.removeEventListener('input', onCapacityInput)
  _capEventsContainer.removeEventListener('keydown', onCapacityKeydown)
  _capEventsContainer.removeEventListener('focusout', onCapacityFocusOut)
  _capEventsContainer = null
}
