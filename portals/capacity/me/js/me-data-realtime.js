/* ============================================================
   me-data-realtime.js — ME Capacity Realtime Wiring
   ============================================================ */

import { isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { currentUser } from '../../../../core/js/supa.js'
import { createMultiTableRealtimeSubscription, removeRealtimeSubscription } from '../../../../utils/js/realtime.js'
import { requestRender, flushDeferred } from '../../../../utils/js/render-scheduler.js'
import {
  meDataState,
  meDataSaveInProgress
} from './me-data.js'
import {
  meNormalizeDepartmentTag,
  meNormalizeProductSupportBreakdown,
  meNormalizeSupportHistoryRecord,
  meNormalizeAndDedupeSupportHistory,
  meNormalizeHolidayRecord
} from './me-data-normalize.js'
import { capGetHoursPerWeek } from '../../shared/js/cap-utils.js'
import { meApplyLatestSupportHistoryToProduct } from './me-data-support-history.js'

let meRealtimeHooks = {
  getTab: () => 'chart',
  refreshCurrentTab: () => {}
}

export function setMeRealtimeHooks(hooks = {}) {
  if (typeof hooks.getTab === 'function') meRealtimeHooks.getTab = hooks.getTab
  if (typeof hooks.refreshCurrentTab === 'function') meRealtimeHooks.refreshCurrentTab = hooks.refreshCurrentTab
}

function meNormalizeTaskRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'NPI',
    type: row.type || 'standard',
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    assigneeId: row.assignee_id || '',
    productId: row.product_id || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    totalHours: parseFloat(row.total_hours) || 0,
    status: row.status || 'SCHEDULED',
    isDisabled: row.is_disabled === true,
    createdAt: row.created_at || new Date().toISOString()
  }
}

function meNormalizeTeamRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    hoursPerWeek: capGetHoursPerWeek(row.hours_per_week),
    utilisation: parseFloat(row.utilisation) || 80,
    jobTitle: row.job_title || '',
    group: row.team_group || '',
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    createdAt: row.created_at || new Date().toISOString()
  }
}

function meNormalizeProductRow(row) {
  const breakdown = meNormalizeProductSupportBreakdown(row, row.hours_per_week)
  return {
    id: row.id,
    name: row.name || '(Unknown Product)',
    productDatabaseId: row.product_database_id || '',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingTimeBookingHours,
    productMovementHours: breakdown.productMovementHours,
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || ''
  }
}

function meIsCapacityFilterInputFocused() {
  const active = document.activeElement
  if (!active || active === document.body) return false
  if (typeof active.matches !== 'function') return false
  return active.matches('[data-cap-action="cap-task-search"], [data-cap-action="cap-task-filter-category"], [data-cap-action="cap-task-filter-assignee"], [data-cap-action="cap-task-filter-product"], [data-cap-action="cap-task-filter-month"], [data-cap-action="cap-products-search"], [data-cap-action="cap-product-load-search"]')
}

function meApplyRealtimeStateChange() {
  requestRender('me', {
    trigger: 'realtime',
    renderNow: () => {
      const tab = meRealtimeHooks.getTab()
      if (tab !== 'chart') meRealtimeHooks.refreshCurrentTab()
    },
    isEditing: isEditingInlineCell(),
    isFiltering: meIsCapacityFilterInputFocused(),
    debounceMs: 150
  })
}

export function meCapacityDataSubscribe() {
  if (!currentUser) return

  createMultiTableRealtimeSubscription([
    {
      table: 'me_teams',
      onInsert: newTeam => {
        if (meDataSaveInProgress) return
        const normalizedTeam = meNormalizeTeamRow(newTeam)
        if (!meDataState.team.some(t => t.id === normalizedTeam.id)) {
          meDataState.team.push(normalizedTeam)
          meApplyRealtimeStateChange()
        }
      },
      onUpdate: updatedTeam => {
        if (meDataSaveInProgress) return
        const normalizedTeam = meNormalizeTeamRow(updatedTeam)
        const idx = meDataState.team.findIndex(t => t.id === normalizedTeam.id)
        if (idx < 0) meDataState.team.push(normalizedTeam)
        else meDataState.team[idx] = { ...meDataState.team[idx], ...normalizedTeam }
        meApplyRealtimeStateChange()
      },
      onDelete: deleted => {
        if (meDataSaveInProgress) return
        meDataState.team = meDataState.team.filter(t => t.id !== deleted.id)
        meApplyRealtimeStateChange()
      }
    },
    {
      table: 'me_tasks',
      onInsert: newTask => {
        if (meDataSaveInProgress) return
        const normalizedTask = meNormalizeTaskRow(newTask)
        if (!meDataState.tasks.some(t => t.id === normalizedTask.id)) {
          meDataState.tasks.push(normalizedTask)
          meApplyRealtimeStateChange()
        }
      },
      onUpdate: updatedTask => {
        if (meDataSaveInProgress) return
        const normalizedTask = meNormalizeTaskRow(updatedTask)
        const idx = meDataState.tasks.findIndex(t => t.id === normalizedTask.id)
        if (idx < 0) meDataState.tasks.push(normalizedTask)
        else meDataState.tasks[idx] = { ...meDataState.tasks[idx], ...normalizedTask }
        meApplyRealtimeStateChange()
      },
      onDelete: deleted => {
        if (meDataSaveInProgress) return
        meDataState.tasks = meDataState.tasks.filter(t => t.id !== deleted.id)
        meApplyRealtimeStateChange()
      }
    },
    {
      table: 'me_products',
      onInsert: newProduct => {
        if (meDataSaveInProgress) return
        const normalizedProduct = meNormalizeProductRow(newProduct)
        if (!meDataState.products.some(p => p.id === normalizedProduct.id)) {
          meDataState.products.push(normalizedProduct)
          meApplyRealtimeStateChange()
        }
      },
      onUpdate: updatedProduct => {
        if (meDataSaveInProgress) return
        const normalizedProduct = meNormalizeProductRow(updatedProduct)
        const idx = meDataState.products.findIndex(p => p.id === normalizedProduct.id)
        if (idx < 0) meDataState.products.push(normalizedProduct)
        else meDataState.products[idx] = { ...meDataState.products[idx], ...normalizedProduct }
        meApplyRealtimeStateChange()
      },
      onDelete: deleted => {
        if (meDataSaveInProgress) return
        meDataState.products = meDataState.products.filter(p => p.id !== deleted.id)
        meApplyRealtimeStateChange()
      }
    },
    {
      table: 'me_product_support_history',
      onInsert: newEntry => {
        if (meDataSaveInProgress) return
        const normalized = meNormalizeSupportHistoryRecord(newEntry)
        if (!normalized) return
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id)
        if (existingIdx >= 0) meDataState.productSupportHistory[existingIdx] = normalized
        else meDataState.productSupportHistory.push(normalized)
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory)
        meDataState.products.forEach(product => {
          if (product.id !== normalized.productId) return
          if (meNormalizeDepartmentTag(product.department, normalized.department) !== normalized.department) return
          meApplyLatestSupportHistoryToProduct(product, normalized.department)
        })
        meApplyRealtimeStateChange()
      },
      onUpdate: updatedEntry => {
        const normalized = meNormalizeSupportHistoryRecord(updatedEntry)
        if (!normalized) return
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id)
        if (existingIdx >= 0) meDataState.productSupportHistory[existingIdx] = normalized
        else meDataState.productSupportHistory.push(normalized)
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory)
        meDataState.products.forEach(product => {
          if (product.id !== normalized.productId) return
          if (meNormalizeDepartmentTag(product.department, normalized.department) !== normalized.department) return
          meApplyLatestSupportHistoryToProduct(product, normalized.department)
        })
        meApplyRealtimeStateChange()
      },
      onDelete: deleted => {
        if (meDataSaveInProgress) return
        meDataState.productSupportHistory = meDataState.productSupportHistory.filter(h => h.id !== deleted.id)
        meApplyRealtimeStateChange()
      }
    },
    {
      table: 'me_holidays',
      onInsert: newHoliday => {
        if (meDataSaveInProgress) return
        const normalized = meNormalizeHolidayRecord(newHoliday)
        if (!normalized) return
        const existingIdx = meDataState.holidays.findIndex(h => h.id === normalized.id || (h.personId === normalized.personId && h.date === normalized.date))
        if (existingIdx >= 0) meDataState.holidays[existingIdx] = normalized
        else meDataState.holidays.push(normalized)
        meApplyRealtimeStateChange()
      },
      onUpdate: updatedHoliday => {
        const normalized = meNormalizeHolidayRecord(updatedHoliday)
        if (!normalized) return
        const existingIdx = meDataState.holidays.findIndex(h => h.id === normalized.id || (h.personId === normalized.personId && h.date === normalized.date))
        if (existingIdx >= 0) meDataState.holidays[existingIdx] = normalized
        else meDataState.holidays.push(normalized)
        meApplyRealtimeStateChange()
      },
      onDelete: deleted => {
        if (meDataSaveInProgress) return
        const normalized = meNormalizeHolidayRecord(deleted)
        meDataState.holidays = meDataState.holidays.filter(h => {
          if (h.id === deleted.id) return false
          if (normalized && h.personId === normalized.personId && h.date === normalized.date) return false
          return true
        })
        meApplyRealtimeStateChange()
      }
    }
  ], 'me_all_channel')
}

export function meCapacityDataUnsubscribe() {
  removeRealtimeSubscription('me_all_channel')
}

export function meFlushDeferredRender() {
  flushDeferred('me')
}

export const meDataSubscribe = meCapacityDataSubscribe
export const meDataUnsubscribe = meCapacityDataUnsubscribe
