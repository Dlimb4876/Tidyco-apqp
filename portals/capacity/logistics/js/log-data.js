/* ============================================================
   log-data.js — Logistics Capacity Data Layer
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
  logLoadRelationalTeams,
  logLoadRelationalTasks,
  logLoadRelationalProducts,
  logLoadRelationalHolidays,
  logLoadRelationalProductSupportHistory,
  logSaveProductRelational,
  logSaveProductSupportHistoryRelational,
  logSaveTeamRelational,
  logSaveTaskRelational,
  logDeleteTaskRelational,
  logDeleteTeamRelational,
  logDeleteSupportHistoryRelational
} from './log-data-relational.js'
import { supabase, currentUser } from '../../../../core/js/supa.js'

export const logDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
}

export const logDataPendingDeletes = {
  tasks: [],
  teams: [],
  supportHistory: []
}

export let logDataSaveInProgress = false
export let logDataSaveQueued = false
export let logDataInitialized = false

let logRealtimeHooks = {
  getTab: () => 'chart',
  refreshCurrentTab: () => {}
}

export function setLogDataRealtimeHooks(hooks = {}) {
  if (typeof hooks.getTab === 'function') logRealtimeHooks.getTab = hooks.getTab
  if (typeof hooks.refreshCurrentTab === 'function') {
    logRealtimeHooks.refreshCurrentTab = hooks.refreshCurrentTab
  }
}

export function logDataGetTeam() {
  return logDataState.team
}

export function logDataGetTasks() {
  return logDataState.tasks
}

export function logDataGetProducts() {
  return logDataState.products
}

export function logDataGetHolidays() {
  logDataState.holidays = capNormalizeAndDedupeHolidays(logDataState.holidays)
  return logDataState.holidays
}

export function logDataGetProductSupportHistory() {
  logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    logDataState.productSupportHistory
  )
  return logDataState.productSupportHistory
}

export function logDataAddTeam(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false
  logDataState.team.push({
    id: capUUID(),
    name: name.trim(),
    hoursPerWeek: capGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: 'LOG',
    startDate: startDate || '',
    endDate: endDate || ''
  })
  return true
}

export function logDataUpdateTeam(idx, field, value) {
  if (idx < 0 || idx >= logDataState.team.length) return false
  const member = logDataState.team[idx]
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

export function logDataDeleteTeam(idx) {
  if (idx < 0 || idx >= logDataState.team.length) return false
  const removed = logDataState.team[idx]
  logDataState.team.splice(idx, 1)
  if (removed && removed.id && !logDataPendingDeletes.teams.includes(removed.id)) {
    logDataPendingDeletes.teams.push(removed.id)
  }
  return true
}

export function logDataAddTask(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false
  const todayStr = new Date().toISOString().split('T')[0]
  logDataState.tasks.push({
    id: capUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: 'LOG',
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

export function logDataUpdateTask(taskId, field, value) {
  const task = logDataState.tasks.find(t => t.id === taskId)
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

export function logDataDeleteTask(taskId) {
  const idx = logDataState.tasks.findIndex(t => t.id === taskId)
  if (idx < 0) return false
  const removed = logDataState.tasks[idx]
  logDataState.tasks.splice(idx, 1)
  if (removed && removed.id && !logDataPendingDeletes.tasks.includes(removed.id)) {
    logDataPendingDeletes.tasks.push(removed.id)
  }
  return true
}

function logGetProductSupportHistoryRows(productId) {
  if (!Array.isArray(logDataState.productSupportHistory)) return []
  return capSortSupportHistoryByDate(
    logDataState.productSupportHistory.filter(row => row && row.productId === productId)
  )
}

function logEnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return
  const existing = logGetProductSupportHistoryRows(product.id)
  if (existing.length > 0) return

  const baselineDate = capNormalizeDateOnly(product.createdAt || product.created_at) ||
    capNormalizeDateOnly(new Date())
  const breakdown = capNormalizeProductSupportBreakdown(product, product.hoursPerWeek)

  logDataState.productSupportHistory.push({
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
    department: 'LOG',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

export function logDataAddProduct(name, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false
  const breakdown = capNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek)
  const product = {
    id: capUUID(),
    name: name.trim(),
    department: 'LOG',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  }

  logDataState.products.push(product)
  logEnsureProductSupportHistoryBaseline(product)
  return true
}

export function logDataUpdateProduct(idx, field, value, metadata) {
  if (idx < 0 || idx >= logDataState.products.length) return false
  const product = logDataState.products[idx]

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

      logDataAddProductSupportHistory(
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

export function logDataDeleteProduct(idx) {
  if (idx < 0 || idx >= logDataState.products.length) return false
  logDataState.products.splice(idx, 1)
  return true
}

export function logDataAddProductSupportHistory(
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
  const existingRows = logGetProductSupportHistoryRows(productId)
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
    logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      logDataState.productSupportHistory
    )
    return true
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate)
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1]
    prior.endDate = capGetDateMinusOneDay(normalizedDate)
    prior.updatedAt = new Date().toISOString()
  }

  logDataState.productSupportHistory.push({
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
    department: 'LOG',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    logDataState.productSupportHistory
  )
  return true
}

export function logDataDeleteProductSupportHistoryEntry(historyId) {
  if (!historyId) return false
  logDataState.productSupportHistory = logDataState.productSupportHistory.filter(h => h.id !== historyId)
  if (!logDataPendingDeletes.supportHistory.includes(historyId)) {
    logDataPendingDeletes.supportHistory.push(historyId)
  }
  return true
}

export function logDataUpdateProductSupportHistoryEntry(historyId, patch) {
  if (!historyId || !patch) return false
  const entry = logDataState.productSupportHistory.find(h => h.id === historyId)
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

  const siblings = logDataState.productSupportHistory
    .filter(h => h.productId === entry.productId)
    .sort((a, b) => {
      if (a.effectiveDate < b.effectiveDate) return -1
      if (a.effectiveDate > b.effectiveDate) return 1
      return 0
    })

  siblings.forEach((sib, i) => {
    sib.endDate = i + 1 < siblings.length ? capGetDateMinusOneDay(siblings[i + 1].effectiveDate) : ''
  })

  logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    logDataState.productSupportHistory
  )
  return true
}

export function logDataGetProductSupportRateForDate(productId, targetDate, fallbackHoursPerWeek) {
  const normalizedTargetDate = capNormalizeDateOnly(targetDate)
  const rows = logGetProductSupportHistoryRows(productId)
  if (!normalizedTargetDate || rows.length === 0) return Number(fallbackHoursPerWeek || 0) || 0

  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false
    if (!row.endDate) return true
    return row.endDate >= normalizedTargetDate
  })

  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0
  return Number(matches[matches.length - 1].hoursPerWeek || 0) || 0
}

export function logDataAddHoliday(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false
  const existing = logDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (existing) {
    existing.type = type
    existing.department = 'LOG'
    return true
  }

  logDataState.holidays.push({
    id: capUUID(),
    personId,
    date,
    type,
    department: 'LOG',
    createdAt: new Date().toISOString()
  })
  return true
}

export function logDataUpdateHoliday(personId, date, newType) {
  const holiday = logDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (!holiday) return newType ? logDataAddHoliday(personId, date, newType) : false
  if (!newType) return logDataDeleteHoliday(personId, date)
  if (!['full', 'half'].includes(newType)) return false
  holiday.type = newType
  return true
}

export function logDataDeleteHoliday(personId, date) {
  const idx = logDataState.holidays.findIndex(h => h.personId === personId && h.date === date)
  if (idx === -1) return false
  logDataState.holidays.splice(idx, 1)
  return true
}

export function logDataAutoSyncLogProducts() {
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
    logDataState.products.filter(p => p.productDatabaseId).map(p => [p.productDatabaseId, p])
  )

  externalProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id)
    if (existing) {
      const newNotes = dbProduct.notes || ''
      if (existing.name !== dbProduct.name || existing.notes !== newNotes || existing.department !== 'LOG') {
        existing.name = dbProduct.name
        existing.notes = newNotes
        existing.department = 'LOG'
        changed = true
      }
      return
    }

    const seed = capNormalizeProductSupportBreakdown({ hoursPerWeek: 0 }, 0)
    logDataState.products.push({
      id: capUUID(),
      name: dbProduct.name,
      department: 'LOG',
      hoursPerWeek: seed.hoursPerWeek,
      kittingHours: seed.kittingHours,
      bookingInOutHours: seed.bookingInOutHours || 0,
      kittingTimeBookingHours: seed.kittingHours,
      productMovementHours: seed.productMovementHours || 0,
      notes: dbProduct.notes || '',
      productDatabaseId: dbProduct.id,
      createdAt: new Date().toISOString()
    })

    const created = logDataState.products[logDataState.products.length - 1]
    logEnsureProductSupportHistoryBaseline(created)
    changed = true
  })

  const beforeCount = logDataState.products.length
  const seenDbIds = new Set()
  const seenNames = new Set()
  logDataState.products = logDataState.products.filter(p => {
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
  if (logDataState.products.length !== beforeCount) changed = true

  return changed
}

export async function logDataInit() {
  try {
    if (!currentUser || typeof supabase === 'undefined') return

    const relState = {
      team: await logLoadRelationalTeams(),
      tasks: await logLoadRelationalTasks(),
      products: await logLoadRelationalProducts(),
      holidays: capNormalizeAndDedupeHolidays(await logLoadRelationalHolidays()),
      productSupportHistory: await logLoadRelationalProductSupportHistory()
    }

    logDataState.team = relState.team || []
    logDataState.tasks = relState.tasks || []
    logDataState.products = relState.products || []
    logDataState.holidays = relState.holidays || []
    logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      relState.productSupportHistory || []
    )

    logDataState.team.forEach(member => {
      if (!('jobTitle' in member)) member.jobTitle = ''
      if (!('group' in member)) member.group = ''
      if (!('startDate' in member)) member.startDate = ''
      if (!('endDate' in member)) member.endDate = ''
    })

    logDataState.tasks.forEach(task => {
      if (!('type' in task)) task.type = 'standard'
      if (!('status' in task)) task.status = 'SCHEDULED'
      if (!('isDisabled' in task)) task.isDisabled = false
    })

    logDataState.products.forEach(product => {
      if (!('productDatabaseId' in product)) product.productDatabaseId = ''
    })

    logDataState.products.forEach(product => logEnsureProductSupportHistoryBaseline(product))
    logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      logDataState.productSupportHistory
    )

    logDataPendingDeletes.tasks.length = 0
    logDataPendingDeletes.teams.length = 0
    logDataPendingDeletes.supportHistory.length = 0

    logDataSubscribe()
  } catch (err) {
    console.warn('logDataInit exception:', err.message)
  }

  logDataInitialized = true
}

export async function logDataSave() {
  if (logDataSaveInProgress) {
    logDataSaveQueued = true
    return
  }
  logDataSaveInProgress = true

  try {
    if (!currentUser || typeof supabase === 'undefined') {
      console.warn('LOG save: Supabase not available')
      return
    }
    if (typeof setSyncBadge === 'function') setSyncBadge('syncing', 'Saving...')
    let ok = true

    for (let i = 0; i < logDataState.products.length; i += 1) {
      if (!await logSaveProductRelational(currentUser.id, logDataState.products[i])) ok = false
    }

    const validProductIds = new Set(logDataState.products.map(p => p.id).filter(Boolean))
    logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      logDataState.productSupportHistory
    )
    const validHistory = logDataState.productSupportHistory.filter(
      row => row && row.productId && validProductIds.has(row.productId)
    )
    if (validHistory.length > 0) {
      if (!await logSaveProductSupportHistoryRelational(currentUser.id, validHistory)) ok = false
    }

    for (let i = 0; i < logDataState.team.length; i += 1) {
      if (!await logSaveTeamRelational(currentUser.id, logDataState.team[i])) ok = false
    }

    for (let i = 0; i < logDataState.tasks.length; i += 1) {
      const task = logDataState.tasks[i]
      if (validProductIds.size > 0 && task.productId && !validProductIds.has(task.productId)) task.productId = ''
      const result = await logSaveTaskRelational(currentUser.id, task)
      if (!result.success) ok = false
      else if (!task.id && result.taskId) task.id = result.taskId
    }

    if (logDataPendingDeletes.tasks.length > 0) {
      const failedDeletes = []
      for (const taskId of logDataPendingDeletes.tasks.slice()) {
        if (!await logDeleteTaskRelational(taskId)) {
          failedDeletes.push(taskId)
          ok = false
        }
      }
      logDataPendingDeletes.tasks.length = 0
      logDataPendingDeletes.tasks.push(...failedDeletes)
    }

    if (logDataPendingDeletes.teams.length > 0) {
      const failedTeamDeletes = []
      for (const teamId of logDataPendingDeletes.teams.slice()) {
        if (!await logDeleteTeamRelational(teamId)) {
          failedTeamDeletes.push(teamId)
          ok = false
        }
      }
      logDataPendingDeletes.teams.length = 0
      logDataPendingDeletes.teams.push(...failedTeamDeletes)
    }

    if (logDataPendingDeletes.supportHistory.length > 0) {
      const failedSupportHistoryDeletes = []
      for (const historyId of logDataPendingDeletes.supportHistory.slice()) {
        if (!await logDeleteSupportHistoryRelational(historyId)) {
          failedSupportHistoryDeletes.push(historyId)
          ok = false
        }
      }
      logDataPendingDeletes.supportHistory.length = 0
      logDataPendingDeletes.supportHistory.push(...failedSupportHistoryDeletes)
    }

    const seenHolidayKeys = new Set()
    logDataState.holidays = capNormalizeAndDedupeHolidays(logDataState.holidays)
    const holidayData = logDataState.holidays
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
        department: 'LOG'
      }))

    const { error: deleteHolidayError } = await supabase
      .from('log_holidays')
      .delete()
      .eq('user_id', currentUser.id)
    if (deleteHolidayError) {
      console.warn('LOG holiday delete error:', deleteHolidayError.message)
      ok = false
    } else if (holidayData.length > 0) {
      const { error: insertHolidayError } = await supabase.from('log_holidays').insert(holidayData)
      if (insertHolidayError) {
        console.warn('LOG holiday insert error:', insertHolidayError.message)
        ok = false
      }
    }

    if (typeof setSyncBadge === 'function') setSyncBadge(ok ? 'saved' : 'error', ok ? 'Saved' : 'Save failed')
    if (!ok) throw new Error('LOG relational save had issues')
  } catch (err) {
    console.error('LOG save exception:', err.message || err)
    if (typeof setSyncBadge === 'function') setSyncBadge('error', 'Save failed')
  } finally {
    logDataSaveInProgress = false
    if (logDataSaveQueued) {
      logDataSaveQueued = false
      await logDataSave(false)
    }
  }
}

export function logDataReset() {
  logDataState.team = []
  logDataState.tasks = []
  logDataState.products = []
  logDataState.holidays = []
  logDataState.productSupportHistory = []
  logDataPendingDeletes.tasks.length = 0
  logDataPendingDeletes.teams.length = 0
  logDataPendingDeletes.supportHistory.length = 0
}

function logIsCapacityFilterInputFocused() {
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

function logApplyRealtimeRender() {
  requestRender('log', {
    trigger: 'realtime',
    renderNow: () => {
      if (logRealtimeHooks.getTab() !== 'chart') logRealtimeHooks.refreshCurrentTab()
    },
    isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell(),
    isFiltering: logIsCapacityFilterInputFocused(),
    debounceMs: 150
  })
}

export function logDataSubscribe() {
  if (!currentUser) return
  createMultiTableRealtimeSubscription([
    {
      table: 'log_teams',
      onInsert: row => {
        if (logDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          hoursPerWeek: capGetHoursPerWeek(row.hours_per_week),
          utilisation: parseFloat(row.utilisation) || 80,
          jobTitle: row.job_title || '',
          group: row.team_group || '',
          department: 'LOG',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          createdAt: row.created_at
        }
        if (!logDataState.team.some(t => t.id === item.id)) {
          logDataState.team.push(item)
          logApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (logDataSaveInProgress) return
        logDataState.team = logDataState.team.filter(t => t.id !== row.id)
        logApplyRealtimeRender()
      }
    },
    {
      table: 'log_tasks',
      onInsert: row => {
        if (logDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'LOG',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        }
        if (!logDataState.tasks.some(t => t.id === item.id)) {
          logDataState.tasks.push(item)
          logApplyRealtimeRender()
        }
      },
      onUpdate: row => {
        if (logDataSaveInProgress) return
        const item = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'LOG',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        }
        const idx = logDataState.tasks.findIndex(t => t.id === item.id)
        if (idx < 0) logDataState.tasks.push(item)
        else logDataState.tasks[idx] = { ...logDataState.tasks[idx], ...item }
        logApplyRealtimeRender()
      },
      onDelete: row => {
        if (logDataSaveInProgress) return
        logDataState.tasks = logDataState.tasks.filter(t => t.id !== row.id)
        logApplyRealtimeRender()
      }
    },
    {
      table: 'log_products',
      onInsert: row => {
        if (logDataSaveInProgress) return
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
          department: 'LOG',
          notes: row.notes || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at || ''
        }
        if (!logDataState.products.some(p => p.id === item.id)) {
          logDataState.products.push(item)
          logApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (logDataSaveInProgress) return
        logDataState.products = logDataState.products.filter(p => p.id !== row.id)
        logApplyRealtimeRender()
      }
    },
    {
      table: 'log_holidays',
      onInsert: row => {
        if (logDataSaveInProgress) return
        const item = capNormalizeHolidayRecord(row)
        if (!item) return
        if (!logDataState.holidays.some(h => h.id === item.id)) {
          logDataState.holidays.push(item)
          logApplyRealtimeRender()
        }
      },
      onUpdate: () => {},
      onDelete: row => {
        if (logDataSaveInProgress) return
        logDataState.holidays = logDataState.holidays.filter(h => h.id !== row.id)
        logApplyRealtimeRender()
      }
    },
    {
      table: 'log_product_support_history',
      onInsert: row => {
        if (logDataSaveInProgress) return
        const item = capNormalizeSupportHistoryRecord(row)
        if (!item) return
        const idx = logDataState.productSupportHistory.findIndex(h => h.id === item.id)
        if (idx >= 0) logDataState.productSupportHistory[idx] = item
        else logDataState.productSupportHistory.push(item)
        logDataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
          logDataState.productSupportHistory
        )
        logApplyRealtimeRender()
      },
      onUpdate: () => {},
      onDelete: row => {
        if (logDataSaveInProgress) return
        logDataState.productSupportHistory = logDataState.productSupportHistory.filter(h => h.id !== row.id)
        logApplyRealtimeRender()
      }
    }
  ], 'log-capacity-channel')
}

export function logDataUnsubscribe() {
  removeRealtimeSubscription('log-capacity-channel')
}

export function flushLogDataNow() {
  if (logDataSaveInProgress || logDataSaveQueued) {
    logDataSave(false)
  }
}
