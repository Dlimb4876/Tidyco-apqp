/* ============================================================
   pm-data.js — PM Capacity Data Layer
   ============================================================ */

import { isEditingInlineCell } from '../../../../utils/js/helpers.js'
import {
  createMultiTableRealtimeSubscription,
  removeRealtimeSubscription
} from '../../../../utils/js/realtime.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import {
  capNormalizeProductSupportBreakdown,
  capNormalizeDateOnly,
  capUUID,
  capGetDateMinusOneDay,
  capNormalizeHolidayRecord,
  capNormalizeAndDedupeHolidays,
  capNormalizeSupportHistoryRecord,
  capNormalizeAndDedupeSupportHistory,
  capSortSupportHistoryByDate
} from '../../shared/js/cap-data-utils.js'
import { capGetHoursPerWeek } from '../../shared/js/cap-utils.js'
import {
  pmLoadRelationalTeams,
  pmLoadRelationalTasks,
  pmLoadRelationalProducts,
  pmLoadRelationalHolidays,
  pmLoadRelationalProductSupportHistory,
  pmSaveProductRelational,
  pmSaveProductSupportHistoryRelational,
  pmSaveTeamRelational,
  pmSaveTaskRelational,
  pmDeleteTaskRelational,
  pmDeleteTeamRelational,
  pmDeleteSupportHistoryRelational
} from './pm-data-relational.js'
import { supabase, currentUser } from '../../../../core/js/supa.js'
import { setSyncBadge } from '../../../../core/js/db.js'

export const pmDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
}

export const pmDataPendingDeletes = {
  tasks: [],
  teams: [],
  supportHistory: []
}

export let pmDataSaveInProgress = false
export let pmDataSaveQueued = false
export let pmDataInitialized = false

let pmRealtimeHooks = {
  getTab: () => 'chart',
  refreshCurrentTab: () => {}
}

export function setPmDataRealtimeHooks(hooks = {}) {
  if (typeof hooks.getTab === 'function') pmRealtimeHooks.getTab = hooks.getTab
  if (typeof hooks.refreshCurrentTab === 'function') {
    pmRealtimeHooks.refreshCurrentTab = hooks.refreshCurrentTab
  }
}

export function pmDataGetTeam() {
  return pmDataState.team
}

export function pmDataGetTasks() {
  return pmDataState.tasks
}

export function pmDataGetProducts() {
  return pmDataState.products
}

export function pmDataGetHolidays() {
  pmDataState.holidays = capNormalizeAndDedupeHolidays(pmDataState.holidays)
  return pmDataState.holidays
}

export function pmDataGetProductSupportHistory() {
  pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    pmDataState.productSupportHistory
  )
  return pmDataState.productSupportHistory
}

export function pmDataAddTeam(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false
  pmDataState.team.push({
    id: capUUID(),
    name: name.trim(),
    hoursPerWeek: capGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: 'PM',
    startDate: startDate || '',
    endDate: endDate || ''
  })
  return true
}

export function pmDataUpdateTeam(idx, field, value) {
  if (idx < 0 || idx >= pmDataState.team.length) return false
  const member = pmDataState.team[idx]
  switch (field) {
    case 'name':
      member.name = value.trim()
      break
    case 'hoursPerWeek':
      member.hoursPerWeek = capGetHoursPerWeek(value)
      break
    case 'utilisation':
      member.utilisation = parseFloat(value) || 80
      break
    case 'jobTitle':
      member.jobTitle = value ? value.trim() : ''
      break
    case 'group':
      member.group = value ? value.trim() : ''
      break
    case 'startDate':
      member.startDate = value || ''
      break
    case 'endDate':
      member.endDate = value || ''
      break
    default:
      return false
  }
  return true
}

export function pmDataDeleteTeam(idx) {
  if (idx < 0 || idx >= pmDataState.team.length) return false
  const removed = pmDataState.team[idx]
  pmDataState.team.splice(idx, 1)
  if (removed && removed.id && !pmDataPendingDeletes.teams.includes(removed.id)) {
    pmDataPendingDeletes.teams.push(removed.id)
  }
  return true
}

export function pmDataAddTask(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false
  const todayStr = new Date().toISOString().split('T')[0]
  pmDataState.tasks.push({
    id: capUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: 'PM',
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate || todayStr,
    endDate: endDate || todayStr,
    totalHours: parseFloat(totalHours) || 0,
    status: 'SCHEDULED',
    isDisabled: false,
    createdAt: new Date().toISOString()
  })
  return true
}

export function pmDataUpdateTask(taskId, field, value) {
  const task = pmDataState.tasks.find(t => t.id === taskId)
  if (!task) return false

  switch (field) {
    case 'name':
      task.name = value.trim()
      break
    case 'category':
      task.category = value || 'NPI'
      break
    case 'assigneeId':
      task.assigneeId = value || ''
      break
    case 'productId':
      task.productId = value || ''
      break
    case 'startDate':
      task.startDate = value
      break
    case 'endDate':
      task.endDate = value
      break
    case 'totalHours':
      task.totalHours = parseFloat(value) || 0
      break
    case 'status':
      task.status = value || 'SCHEDULED'
      break
    case 'isDisabled':
      task.isDisabled = value === true || value === 'true'
      break
    default:
      return false
  }
  return true
}

export function pmDataDeleteTask(taskId) {
  const idx = pmDataState.tasks.findIndex(t => t.id === taskId)
  if (idx < 0) return false
  const removed = pmDataState.tasks[idx]
  pmDataState.tasks.splice(idx, 1)
  if (removed && removed.id && !pmDataPendingDeletes.tasks.includes(removed.id)) {
    pmDataPendingDeletes.tasks.push(removed.id)
  }
  return true
}

function pmGetProductSupportHistoryRows(productId) {
  if (!Array.isArray(pmDataState.productSupportHistory)) return []
  return capSortSupportHistoryByDate(
    pmDataState.productSupportHistory.filter(row => row && row.productId === productId)
  )
}

function pmEnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return
  const existing = pmGetProductSupportHistoryRows(product.id)
  if (existing.length > 0) return

  const baselineDate = capNormalizeDateOnly(product.createdAt || product.created_at) ||
    capNormalizeDateOnly(new Date())
  const breakdown = capNormalizeProductSupportBreakdown(product, product.hoursPerWeek)

  pmDataState.productSupportHistory.push({
    id: capUUID(),
    productId: product.id,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate: baselineDate,
    endDate: '',
    changeReason: 'Baseline from product support value',
    notes: '',
    department: 'PM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

export function pmDataAddProduct(name, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false
  const breakdown = capNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek)
  const product = {
    id: capUUID(),
    name: name.trim(),
    department: 'PM',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  }

  pmDataState.products.push(product)
  pmEnsureProductSupportHistoryBaseline(product)
  return true
}

export function pmDataUpdateProduct(idx, field, value, metadata) {
  if (idx < 0 || idx >= pmDataState.products.length) return false
  const product = pmDataState.products[idx]

  switch (field) {
    case 'name':
      product.name = value.trim()
      break
    case 'hoursPerWeek': {
      const breakdown = capNormalizeProductSupportBreakdown({
        hoursPerWeek: value,
        kittingHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'kittingHours')
          ? metadata.kittingHours
          : undefined,
        bookingInOutHours: metadata &&
          Object.prototype.hasOwnProperty.call(metadata, 'bookingInOutHours')
          ? metadata.bookingInOutHours
          : undefined,
        productMovementHours: metadata &&
          Object.prototype.hasOwnProperty.call(metadata, 'productMovementHours')
          ? metadata.productMovementHours
          : undefined
      }, value)

      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours

      const effectiveDate = metadata && metadata.effectiveDate
        ? metadata.effectiveDate
        : capNormalizeDateOnly(new Date())

      pmDataAddProductSupportHistory(
        product.id,
        product.hoursPerWeek,
        effectiveDate,
        metadata && metadata.changeReason ? metadata.changeReason : '',
        metadata && metadata.notes ? metadata.notes : '',
        product.kittingHours,
        product.bookingInOutHours,
        product.productMovementHours
      )

      product.supportEffectiveDate = metadata && metadata.effectiveDate
        ? capNormalizeDateOnly(metadata.effectiveDate)
        : (product.supportEffectiveDate || capNormalizeDateOnly(new Date()))
      break
    }
    case 'kittingTimeBookingHours':
    case 'kittingHours': {
      const breakdown = capNormalizeProductSupportBreakdown(
        {
          kittingHours: value,
          bookingInOutHours: product.bookingInOutHours,
          productMovementHours: product.productMovementHours
        },
        product.hoursPerWeek
      )
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'bookingInOutHours': {
      const breakdown = capNormalizeProductSupportBreakdown(
        {
          kittingHours: product.kittingHours,
          bookingInOutHours: value,
          productMovementHours: product.productMovementHours
        },
        product.hoursPerWeek
      )
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'productMovementHours': {
      const breakdown = capNormalizeProductSupportBreakdown(
        {
          kittingHours: product.kittingHours,
          bookingInOutHours: product.bookingInOutHours,
          productMovementHours: value
        },
        product.hoursPerWeek
      )
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'supportEffectiveDate':
      product.supportEffectiveDate = capNormalizeDateOnly(value) || product.supportEffectiveDate || ''
      break
    case 'notes':
      product.notes = value ? value.trim() : ''
      break
    default:
      return false
  }

  return true
}

export function pmDataDeleteProduct(idx) {
  if (idx < 0 || idx >= pmDataState.products.length) return false
  pmDataState.products.splice(idx, 1)
  return true
}

export function pmDataAddProductSupportHistory(
  productId,
  hoursPerWeek,
  effectiveDate,
  changeReason,
  notes,
  kittingHours,
  bookingInOutHours,
  productMovementHours
) {
  if (!productId) return false
  const normalizedDate = capNormalizeDateOnly(effectiveDate) || capNormalizeDateOnly(new Date())
  const existingRows = pmGetProductSupportHistoryRows(productId)
  const sameDateRow = existingRows.find(row => row.effectiveDate === normalizedDate)
  const breakdown = capNormalizeProductSupportBreakdown(
    { hoursPerWeek, kittingHours, bookingInOutHours, productMovementHours },
    hoursPerWeek
  )

  if (sameDateRow) {
    sameDateRow.hoursPerWeek = breakdown.hoursPerWeek
    sameDateRow.kittingHours = breakdown.kittingHours
    sameDateRow.bookingInOutHours = breakdown.bookingInOutHours
    sameDateRow.kittingTimeBookingHours = breakdown.kittingHours
    sameDateRow.productMovementHours = breakdown.productMovementHours
    sameDateRow.changeReason = changeReason || sameDateRow.changeReason || ''
    sameDateRow.notes = notes || sameDateRow.notes || ''
    sameDateRow.updatedAt = new Date().toISOString()
    pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      pmDataState.productSupportHistory
    )
    return true
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate)
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1]
    prior.endDate = capGetDateMinusOneDay(normalizedDate)
    prior.updatedAt = new Date().toISOString()
  }

  pmDataState.productSupportHistory.push({
    id: capUUID(),
    productId,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate: normalizedDate,
    endDate: '',
    changeReason: changeReason || '',
    notes: notes || '',
    department: 'PM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    pmDataState.productSupportHistory
  )
  return true
}

export function pmDataDeleteProductSupportHistoryEntry(historyId) {
  if (!historyId) return false
  pmDataState.productSupportHistory = pmDataState.productSupportHistory.filter(h => h.id !== historyId)
  if (!pmDataPendingDeletes.supportHistory.includes(historyId)) {
    pmDataPendingDeletes.supportHistory.push(historyId)
  }
  return true
}

export function pmDataUpdateProductSupportHistoryEntry(historyId, patch) {
  if (!historyId || !patch) return false
  const entry = pmDataState.productSupportHistory.find(h => h.id === historyId)
  if (!entry) return false

  if (patch.effectiveDate !== undefined) {
    const normalized = capNormalizeDateOnly(patch.effectiveDate)
    if (normalized) entry.effectiveDate = normalized
  }
  if (patch.changeReason !== undefined) entry.changeReason = patch.changeReason

  const hasSplitFields = patch.kittingHours !== undefined ||
    patch.bookingInOutHours !== undefined ||
    patch.productMovementHours !== undefined

  if (hasSplitFields) {
    const kitting = Number(
      patch.kittingHours !== undefined ? patch.kittingHours : entry.kittingHours
    ) || 0
    const booking = Number(
      patch.bookingInOutHours !== undefined ? patch.bookingInOutHours : entry.bookingInOutHours
    ) || 0
    const movement = Number(
      patch.productMovementHours !== undefined
        ? patch.productMovementHours
        : entry.productMovementHours
    ) || 0

    entry.kittingHours = kitting
    entry.kittingTimeBookingHours = kitting
    entry.bookingInOutHours = booking
    entry.productMovementHours = movement
    entry.hoursPerWeek = kitting + booking + movement
  } else if (patch.hoursPerWeek !== undefined) {
    entry.hoursPerWeek = Number(patch.hoursPerWeek) || 0
  }

  entry.updatedAt = new Date().toISOString()

  const siblings = pmDataState.productSupportHistory
    .filter(h => h.productId === entry.productId)
    .sort((a, b) => {
      if (a.effectiveDate < b.effectiveDate) return -1
      if (a.effectiveDate > b.effectiveDate) return 1
      return 0
    })

  siblings.forEach((sib, i) => {
    sib.endDate = i + 1 < siblings.length ? capGetDateMinusOneDay(siblings[i + 1].effectiveDate) : ''
  })

  pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    pmDataState.productSupportHistory
  )
  return true
}

export function pmDataGetProductSupportRateForDate(productId, targetDate, fallbackHoursPerWeek) {
  const normalizedTargetDate = capNormalizeDateOnly(targetDate)
  const rows = pmGetProductSupportHistoryRows(productId)
  if (!normalizedTargetDate || rows.length === 0) return Number(fallbackHoursPerWeek || 0) || 0

  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false
    if (!row.endDate) return true
    return row.endDate >= normalizedTargetDate
  })

  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0
  return Number(matches[matches.length - 1].hoursPerWeek || 0) || 0
}

export function pmDataAddHoliday(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false
  const existing = pmDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (existing) {
    existing.type = type
    existing.department = 'PM'
    return true
  }

  pmDataState.holidays.push({
    id: capUUID(),
    personId,
    date,
    type,
    department: 'PM',
    createdAt: new Date().toISOString()
  })
  return true
}

export function pmDataUpdateHoliday(personId, date, newType) {
  const holiday = pmDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (!holiday) return newType ? pmDataAddHoliday(personId, date, newType) : false
  if (!newType) return pmDataDeleteHoliday(personId, date)
  if (!['full', 'half'].includes(newType)) return false
  holiday.type = newType
  return true
}

export function pmDataDeleteHoliday(personId, date) {
  const idx = pmDataState.holidays.findIndex(h => h.personId === personId && h.date === date)
  if (idx === -1) return false
  pmDataState.holidays.splice(idx, 1)
  return true
}

export function pmDataAutoSyncPMProducts() {
  const externalProducts = globalThis.productsState && Array.isArray(globalThis.productsState.products)
    ? globalThis.productsState.products
    : []
  if (externalProducts.length === 0) return false

  let changed = false
  const dbMap = {}
  const dbNameSet = new Set()
  externalProducts.forEach(p => {
    if (p && p.id) dbMap[p.id] = p
    const n = (p && p.name ? String(p.name) : '').trim().toLowerCase()
    if (n) dbNameSet.add(n)
  })

  const existingByDbId = new Map(
    pmDataState.products.filter(p => p.productDatabaseId).map(p => [p.productDatabaseId, p])
  )

  externalProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id)
    if (existing) {
      const newNotes = dbProduct.notes || ''
      if (existing.name !== dbProduct.name || existing.notes !== newNotes || existing.department !== 'PM') {
        existing.name = dbProduct.name
        existing.notes = newNotes
        existing.department = 'PM'
        changed = true
      }
      return
    }

    const seed = capNormalizeProductSupportBreakdown({ hoursPerWeek: 0 }, 0)
    pmDataState.products.push({
      id: capUUID(),
      name: dbProduct.name,
      department: 'PM',
      hoursPerWeek: seed.hoursPerWeek,
      kittingHours: seed.kittingHours,
      bookingInOutHours: seed.bookingInOutHours || 0,
      kittingTimeBookingHours: seed.kittingHours,
      productMovementHours: seed.productMovementHours || 0,
      notes: dbProduct.notes || '',
      productDatabaseId: dbProduct.id,
      createdAt: new Date().toISOString()
    })

    const created = pmDataState.products[pmDataState.products.length - 1]
    pmEnsureProductSupportHistoryBaseline(created)
    changed = true
  })

  const beforeCount = pmDataState.products.length
  const seenDbIds = new Set()
  const seenNames = new Set()
  pmDataState.products = pmDataState.products.filter(p => {
    if (!p.productDatabaseId) {
      const manualName = (p.name || '').trim().toLowerCase()
      if (manualName && dbNameSet.has(manualName)) return false
      if (seenNames.has(manualName)) return false
      seenNames.add(manualName)
      return true
    }
    if (seenDbIds.has(p.productDatabaseId)) return false
    seenDbIds.add(p.productDatabaseId)
    return dbMap[p.productDatabaseId] !== undefined
  })
  if (pmDataState.products.length !== beforeCount) changed = true

  return changed
}

export async function pmDataInit() {
  try {
    if (!currentUser || typeof supabase === 'undefined') return

    const relState = {
      team: await pmLoadRelationalTeams(),
      tasks: await pmLoadRelationalTasks(),
      products: await pmLoadRelationalProducts(),
      holidays: capNormalizeAndDedupeHolidays(await pmLoadRelationalHolidays()),
      productSupportHistory: await pmLoadRelationalProductSupportHistory()
    }

    pmDataState.team = relState.team || []
    pmDataState.tasks = relState.tasks || []
    pmDataState.products = relState.products || []
    pmDataState.holidays = relState.holidays || []
    pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      relState.productSupportHistory || []
    )

    pmDataState.team.forEach(member => {
      if (!('jobTitle' in member)) member.jobTitle = ''
      if (!('group' in member)) member.group = ''
      if (!('startDate' in member)) member.startDate = ''
      if (!('endDate' in member)) member.endDate = ''
    })

    pmDataState.tasks.forEach(task => {
      if (!('type' in task)) task.type = 'standard'
      if (!('status' in task)) task.status = 'SCHEDULED'
      if (!('isDisabled' in task)) task.isDisabled = false
    })

    pmDataState.products.forEach(product => {
      if (!('productDatabaseId' in product)) product.productDatabaseId = ''
    })

    pmDataState.products.forEach(product => pmEnsureProductSupportHistoryBaseline(product))
    pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      pmDataState.productSupportHistory
    )

    pmDataPendingDeletes.tasks.length = 0
    pmDataPendingDeletes.teams.length = 0
    pmDataPendingDeletes.supportHistory.length = 0

    pmDataSubscribe()
  } catch (err) {
    console.warn('pmDataInit exception:', err.message)
  }

  pmDataInitialized = true
}

export async function pmDataSave() {
  if (pmDataSaveInProgress) {
    pmDataSaveQueued = true
    return
  }
  pmDataSaveInProgress = true

  try {
    if (!currentUser || typeof supabase === 'undefined') {
      console.warn('PM save: Supabase not available')
      return
    }
    if (typeof setSyncBadge === 'function') setSyncBadge('syncing', 'Saving...')
    let ok = true

    for (let i = 0; i < pmDataState.products.length; i += 1) {
      if (!await pmSaveProductRelational(currentUser.id, pmDataState.products[i])) ok = false
    }

    const validProductIds = new Set(pmDataState.products.map(p => p.id).filter(Boolean))
    pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      pmDataState.productSupportHistory
    )
    const validHistory = pmDataState.productSupportHistory.filter(
      row => row && row.productId && validProductIds.has(row.productId)
    )
    if (validHistory.length > 0) {
      if (!await pmSaveProductSupportHistoryRelational(currentUser.id, validHistory)) ok = false
    }

    for (let i = 0; i < pmDataState.team.length; i += 1) {
      if (!await pmSaveTeamRelational(currentUser.id, pmDataState.team[i])) ok = false
    }

    for (let i = 0; i < pmDataState.tasks.length; i += 1) {
      const task = pmDataState.tasks[i]
      if (validProductIds.size > 0 && task.productId && !validProductIds.has(task.productId)) task.productId = ''
      const result = await pmSaveTaskRelational(currentUser.id, task)
      if (!result.success) ok = false
      else if (!task.id && result.taskId) task.id = result.taskId
    }

    if (pmDataPendingDeletes.tasks.length > 0) {
      const failedDeletes = []
      for (const taskId of pmDataPendingDeletes.tasks.slice()) {
        if (!await pmDeleteTaskRelational(taskId)) {
          failedDeletes.push(taskId)
          ok = false
        }
      }
      pmDataPendingDeletes.tasks.length = 0
      pmDataPendingDeletes.tasks.push(...failedDeletes)
    }

    if (pmDataPendingDeletes.teams.length > 0) {
      const failedTeamDeletes = []
      for (const teamId of pmDataPendingDeletes.teams.slice()) {
        if (!await pmDeleteTeamRelational(teamId)) {
          failedTeamDeletes.push(teamId)
          ok = false
        }
      }
      pmDataPendingDeletes.teams.length = 0
      pmDataPendingDeletes.teams.push(...failedTeamDeletes)
    }

    if (pmDataPendingDeletes.supportHistory.length > 0) {
      const failedSupportHistoryDeletes = []
      for (const historyId of pmDataPendingDeletes.supportHistory.slice()) {
        if (!await pmDeleteSupportHistoryRelational(historyId)) {
          failedSupportHistoryDeletes.push(historyId)
          ok = false
        }
      }
      pmDataPendingDeletes.supportHistory.length = 0
      pmDataPendingDeletes.supportHistory.push(...failedSupportHistoryDeletes)
    }

    const seenHolidayKeys = new Set()
    pmDataState.holidays = capNormalizeAndDedupeHolidays(pmDataState.holidays)
    const holidayData = pmDataState.holidays
      .filter(h => {
        if (h.userId && h.userId !== currentUser.id) return false
        const key = `${h.personId}_${h.date}`
        if (seenHolidayKeys.has(key)) return false
        seenHolidayKeys.add(key)
        return true
      })
      .map(h => ({
        id: h.id,
        user_id: currentUser.id,
        person_id: h.personId,
        date: h.date,
        type: h.type,
        department: 'PM'
      }))

    const { error: deleteHolidayError } = await supabase
      .from('pm_holidays')
      .delete()
      .eq('user_id', currentUser.id)
    if (deleteHolidayError) {
      console.warn('PM holiday delete error:', deleteHolidayError.message)
      ok = false
    } else if (holidayData.length > 0) {
      const { error: insertHolidayError } = await supabase.from('pm_holidays').insert(holidayData)
      if (insertHolidayError) {
        console.warn('PM holiday insert error:', insertHolidayError.message)
        ok = false
      }
    }

    if (typeof setSyncBadge === 'function') setSyncBadge(ok ? 'saved' : 'error', ok ? 'Saved' : 'Save failed')
    if (!ok) throw new Error('PM relational save had issues')
  } catch (err) {
    console.error('PM save exception:', err.message || err)
    if (typeof setSyncBadge === 'function') setSyncBadge('error', 'Save failed')
  } finally {
    pmDataSaveInProgress = false
    if (pmDataSaveQueued) {
      pmDataSaveQueued = false
      await pmDataSave(false)
    }
  }
}

export function pmDataReset() {
  pmDataState.team = []
  pmDataState.tasks = []
  pmDataState.products = []
  pmDataState.holidays = []
  pmDataState.productSupportHistory = []
  pmDataPendingDeletes.tasks.length = 0
  pmDataPendingDeletes.teams.length = 0
  pmDataPendingDeletes.supportHistory.length = 0
}

function pmIsCapacityFilterInputFocused() {
  const active = document.activeElement
  if (!active || active === document.body) return false
  if (typeof active.matches !== 'function') return false

  return active.matches(
    '[data-cap-action="cap-task-search"], [data-cap-action="cap-task-filter-category"], ' +
      '[data-cap-action="cap-task-filter-assignee"], [data-cap-action="cap-task-filter-product"], ' +
      '[data-cap-action="cap-task-filter-month"], [data-cap-action="cap-products-search"], ' +
      '[data-cap-action="cap-product-load-search"]'
  )
}

function pmApplyRealtimeRender() {
  requestRender('pm', {
    trigger: 'realtime',
    renderNow: () => {
      if (pmRealtimeHooks.getTab() !== 'chart') pmRealtimeHooks.refreshCurrentTab()
    },
    isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell(),
    isFiltering: pmIsCapacityFilterInputFocused(),
    debounceMs: 150
  })
}

export function pmDataSubscribe() {
  if (!currentUser) return
  createMultiTableRealtimeSubscription([
    {
      table: 'pm_teams',
      onInsert: row => {
        if (pmDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          hoursPerWeek: capGetHoursPerWeek(row.hours_per_week),
          utilisation: parseFloat(row.utilisation) || 80,
          jobTitle: row.job_title || '',
          group: row.team_group || '',
          department: 'PM',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          createdAt: row.created_at
        }
        if (!pmDataState.team.some(t => t.id === item.id)) {
          pmDataState.team.push(item)
          pmApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (pmDataSaveInProgress) return
        pmDataState.team = pmDataState.team.filter(t => t.id !== row.id)
        pmApplyRealtimeRender()
      }
    },
    {
      table: 'pm_tasks',
      onInsert: row => {
        if (pmDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'PM',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        }
        if (!pmDataState.tasks.some(t => t.id === item.id)) {
          pmDataState.tasks.push(item)
          pmApplyRealtimeRender()
        }
      },
      onUpdate: row => {
        if (pmDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'PM',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        }
        const idx = pmDataState.tasks.findIndex(t => t.id === item.id)
        if (idx < 0) pmDataState.tasks.push(item)
        else pmDataState.tasks[idx] = { ...pmDataState.tasks[idx], ...item }
        pmApplyRealtimeRender()
      },
      onDelete: row => {
        if (pmDataSaveInProgress) return
        pmDataState.tasks = pmDataState.tasks.filter(t => t.id !== row.id)
        pmApplyRealtimeRender()
      }
    },
    {
      table: 'pm_products',
      onInsert: row => {
        if (pmDataSaveInProgress) return
        const breakdown = capNormalizeProductSupportBreakdown(row, row.hours_per_week)
        const item = {
          id: row.id,
          name: row.name || '',
          productDatabaseId: row.product_database_id || '',
          hoursPerWeek: breakdown.hoursPerWeek,
          kittingHours: breakdown.kittingHours,
          bookingInOutHours: breakdown.bookingInOutHours,
          kittingTimeBookingHours: breakdown.kittingTimeBookingHours,
          productMovementHours: breakdown.productMovementHours,
          department: 'PM',
          notes: row.notes || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at || ''
        }
        if (!pmDataState.products.some(p => p.id === item.id)) {
          pmDataState.products.push(item)
          pmApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (pmDataSaveInProgress) return
        pmDataState.products = pmDataState.products.filter(p => p.id !== row.id)
        pmApplyRealtimeRender()
      }
    },
    {
      table: 'pm_holidays',
      onInsert: row => {
        if (pmDataSaveInProgress) return
        const item = capNormalizeHolidayRecord(row)
        if (!item) return
        if (!pmDataState.holidays.some(h => h.id === item.id)) {
          pmDataState.holidays.push(item)
          pmApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (pmDataSaveInProgress) return
        pmDataState.holidays = pmDataState.holidays.filter(h => h.id !== row.id)
        pmApplyRealtimeRender()
      }
    },
    {
      table: 'pm_product_support_history',
      onInsert: row => {
        if (pmDataSaveInProgress) return
        const item = capNormalizeSupportHistoryRecord(row)
        if (!item) return
        const idx = pmDataState.productSupportHistory.findIndex(h => h.id === item.id)
        if (idx >= 0) pmDataState.productSupportHistory[idx] = item
        else pmDataState.productSupportHistory.push(item)
        pmDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
          pmDataState.productSupportHistory
        )
        pmApplyRealtimeRender()
      },
      onUpdate: () => {},
      onDelete: row => {
        if (pmDataSaveInProgress) return
        pmDataState.productSupportHistory = pmDataState.productSupportHistory.filter(h => h.id !== row.id)
        pmApplyRealtimeRender()
      }
    }
  ], 'pm-capacity-channel')
}

export function pmDataUnsubscribe() {
  removeRealtimeSubscription('pm-capacity-channel')
}

export function flushPmDataNow() {
  if (pmDataSaveInProgress || pmDataSaveQueued) {
    pmDataSave(false)
  }
}
