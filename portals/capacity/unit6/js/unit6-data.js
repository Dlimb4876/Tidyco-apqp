/* ============================================================
   unit6-data.js — Unit 6 Capacity Data Layer
   ============================================================ */

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { setSyncBadge } from '../../../../core/js/db.js'
import { isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { createMultiTableRealtimeSubscription, removeRealtimeSubscription } from '../../../../utils/js/realtime.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { capGetHoursPerWeek } from '../../shared/js/cap-utils.js'
import {
  capNormalizeProductSupportBreakdown,
  capNormalizeDateOnly,
  capUUID,
  capNormalizeAndDedupeHolidays,
  capNormalizeAndDedupeSupportHistory,
  capNormalizeHolidayRecord,
  capNormalizeSupportHistoryRecord,
  capSortSupportHistoryByDate,
  capGetDateMinusOneDay
} from '../../shared/js/cap-data-utils.js'
import {
  unit6LoadRelationalTeams,
  unit6LoadRelationalTasks,
  unit6LoadRelationalProducts,
  unit6LoadRelationalHolidays,
  unit6LoadRelationalProductSupportHistory,
  unit6SaveProductRelational,
  unit6SaveProductSupportHistoryRelational,
  unit6SaveTeamRelational,
  unit6SaveTaskRelational,
  unit6DeleteTaskRelational,
  unit6DeleteTeamRelational,
  unit6DeleteSupportHistoryRelational
} from './unit6-data-relational.js'

export let unit6DataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
}

export let unit6DataPendingDeletes = { tasks: [], teams: [], supportHistory: [] }
export let unit6DataSaveInProgress = false
export let unit6DataSaveQueued = false
export let unit6DataInitialized = false
let unit6RefreshCurrentTabCallback = null
let unit6GetTabCallback = null

function setUnit6DataPendingDeletes(nextPendingDeletes) {
  unit6DataPendingDeletes = nextPendingDeletes
}

function setUnit6DataSaveInProgress(value) {
  unit6DataSaveInProgress = value
}

function setUnit6DataSaveQueued(value) {
  unit6DataSaveQueued = value
}

function setUnit6DataInitialized(value) {
  unit6DataInitialized = value
}

function setUnit6DataState(nextState) {
  unit6DataState = nextState
}

export function unit6DataGetTeam() {
  return unit6DataState.team
}

export function unit6DataGetTasks() {
  return unit6DataState.tasks
}

export function unit6DataGetProducts() {
  return unit6DataState.products
}

export function unit6DataGetHolidays() {
  unit6DataState.holidays = capNormalizeAndDedupeHolidays(unit6DataState.holidays)
  return unit6DataState.holidays
}

export function unit6DataGetProductSupportHistory() {
  unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    unit6DataState.productSupportHistory
  )
  return unit6DataState.productSupportHistory
}

export function unit6DataAddTeam(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false
  unit6DataState.team.push({
    id: capUUID(),
    name: name.trim(),
    hoursPerWeek: capGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: 'UNIT6',
    startDate: startDate || '',
    endDate: endDate || ''
  })
  return true
}

export function unit6DataUpdateTeam(idx, field, value) {
  if (idx < 0 || idx >= unit6DataState.team.length) return false
  const member = unit6DataState.team[idx]
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

export function unit6DataDeleteTeam(idx) {
  if (idx < 0 || idx >= unit6DataState.team.length) return false
  const removed = unit6DataState.team[idx]
  unit6DataState.team.splice(idx, 1)
  if (removed && removed.id) {
    const pendingTasks = Array.isArray(unit6DataPendingDeletes.tasks)
      ? unit6DataPendingDeletes.tasks
      : []
    const pendingTeams = Array.isArray(unit6DataPendingDeletes.teams)
      ? unit6DataPendingDeletes.teams
      : []
    const pendingSupportHistory = Array.isArray(unit6DataPendingDeletes.supportHistory)
      ? unit6DataPendingDeletes.supportHistory
      : []
    if (!pendingTeams.includes(removed.id)) pendingTeams.push(removed.id)
    setUnit6DataPendingDeletes({
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    })
  }
  return true
}

export function unit6DataAddTask(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false
  const todayStr = new Date().toISOString().split('T')[0]
  unit6DataState.tasks.push({
    id: capUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: 'UNIT6',
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

export function unit6DataUpdateTask(taskId, field, value) {
  const task = unit6DataState.tasks.find(t => t.id === taskId)
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

export function unit6DataDeleteTask(taskId) {
  const idx = unit6DataState.tasks.findIndex(t => t.id === taskId)
  if (idx < 0) return false
  const removed = unit6DataState.tasks[idx]
  unit6DataState.tasks.splice(idx, 1)
  if (removed && removed.id) {
    const pendingTasks = Array.isArray(unit6DataPendingDeletes.tasks)
      ? unit6DataPendingDeletes.tasks
      : []
    const pendingTeams = Array.isArray(unit6DataPendingDeletes.teams)
      ? unit6DataPendingDeletes.teams
      : []
    const pendingSupportHistory = Array.isArray(unit6DataPendingDeletes.supportHistory)
      ? unit6DataPendingDeletes.supportHistory
      : []
    if (!pendingTasks.includes(removed.id)) pendingTasks.push(removed.id)
    setUnit6DataPendingDeletes({
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    })
  }
  return true
}

export function unit6DataAddProduct(name, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false
  const breakdown = capNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek)
  const product = {
    id: capUUID(),
    name: name.trim(),
    department: 'UNIT6',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  }
  unit6DataState.products.push(product)
  unit6EnsureProductSupportHistoryBaseline(product)
  return true
}

export function unit6DataUpdateProduct(idx, field, value, metadata) {
  if (idx < 0 || idx >= unit6DataState.products.length) return false
  const product = unit6DataState.products[idx]
  switch (field) {
    case 'name':
      product.name = value.trim()
      break
    case 'hoursPerWeek': {
      const breakdown = capNormalizeProductSupportBreakdown(
        {
          hoursPerWeek: value,
          kittingHours:
            metadata && Object.prototype.hasOwnProperty.call(metadata, 'kittingHours')
              ? metadata.kittingHours
              : undefined,
          bookingInOutHours:
            metadata && Object.prototype.hasOwnProperty.call(metadata, 'bookingInOutHours')
              ? metadata.bookingInOutHours
              : undefined,
          productMovementHours:
            metadata && Object.prototype.hasOwnProperty.call(metadata, 'productMovementHours')
              ? metadata.productMovementHours
              : undefined
        },
        value
      )
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      {
        const effectiveDate =
          metadata && metadata.effectiveDate ? metadata.effectiveDate : capNormalizeDateOnly(new Date())
        unit6DataAddProductSupportHistory(
          product.id,
          product.hoursPerWeek,
          effectiveDate,
          metadata && metadata.changeReason ? metadata.changeReason : '',
          metadata && metadata.notes ? metadata.notes : '',
          product.kittingHours,
          product.bookingInOutHours,
          product.productMovementHours
        )
      }
      product.supportEffectiveDate =
        metadata && metadata.effectiveDate
          ? capNormalizeDateOnly(metadata.effectiveDate)
          : product.supportEffectiveDate || capNormalizeDateOnly(new Date())
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

export function unit6DataDeleteProduct(idx) {
  if (idx < 0 || idx >= unit6DataState.products.length) return false
  unit6DataState.products.splice(idx, 1)
  return true
}

function unit6GetProductSupportHistoryRows(productId) {
  if (!Array.isArray(unit6DataState.productSupportHistory)) return []
  return capSortSupportHistoryByDate(
    unit6DataState.productSupportHistory.filter(row => row && row.productId === productId)
  )
}

function unit6EnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return
  const existing = unit6GetProductSupportHistoryRows(product.id)
  if (existing.length > 0) return

  const baselineDate =
    capNormalizeDateOnly(product.createdAt || product.created_at) || capNormalizeDateOnly(new Date())
  const breakdown = capNormalizeProductSupportBreakdown(product, product.hoursPerWeek)
  unit6DataState.productSupportHistory.push({
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
    department: 'UNIT6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

export function unit6DataAddProductSupportHistory(
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
  const existingRows = unit6GetProductSupportHistoryRows(productId)
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
    unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      unit6DataState.productSupportHistory
    )
    return true
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate)
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1]
    prior.endDate = capGetDateMinusOneDay(normalizedDate)
    prior.updatedAt = new Date().toISOString()
  }

  unit6DataState.productSupportHistory.push({
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
    department: 'UNIT6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    unit6DataState.productSupportHistory
  )
  return true
}

export function unit6DataUpdateProductSupportHistoryEntry(historyId, patch) {
  if (!historyId || !patch) return false
  const entry = unit6DataState.productSupportHistory.find(h => h.id === historyId)
  if (!entry) return false

  if (patch.effectiveDate !== undefined) {
    const normalized = capNormalizeDateOnly(patch.effectiveDate)
    if (normalized) entry.effectiveDate = normalized
  }
  if (patch.changeReason !== undefined) entry.changeReason = patch.changeReason

  const hasSplitFields =
    patch.kittingHours !== undefined ||
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

  const siblings = unit6DataState.productSupportHistory
    .filter(h => h.productId === entry.productId)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0))
  siblings.forEach((sib, i) => {
    sib.endDate =
      i + 1 < siblings.length ? capGetDateMinusOneDay(siblings[i + 1].effectiveDate) : ''
  })

  unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
    unit6DataState.productSupportHistory
  )
  return true
}

export function unit6DataDeleteProductSupportHistoryEntry(historyId) {
  if (!historyId) return false
  unit6DataState.productSupportHistory = unit6DataState.productSupportHistory.filter(h => h.id !== historyId)
  if (!unit6DataPendingDeletes.supportHistory) unit6DataPendingDeletes.supportHistory = []
  if (!unit6DataPendingDeletes.supportHistory.includes(historyId)) {
    unit6DataPendingDeletes.supportHistory.push(historyId)
  }
  return true
}

export function unit6DataGetProductSupportRateForDate(productId, targetDate, fallbackHoursPerWeek) {
  const normalizedTargetDate = capNormalizeDateOnly(targetDate)
  const rows = unit6GetProductSupportHistoryRows(productId)
  if (!normalizedTargetDate || rows.length === 0) return Number(fallbackHoursPerWeek || 0) || 0

  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false
    if (!row.endDate) return true
    return row.endDate >= normalizedTargetDate
  })
  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0
  return Number(matches[matches.length - 1].hoursPerWeek || 0) || 0
}

export function unit6DataAddHoliday(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false
  const existing = unit6DataState.holidays.find(h => h.personId === personId && h.date === date)
  if (existing) {
    existing.type = type
    existing.department = 'UNIT6'
    return true
  }
  unit6DataState.holidays.push({
    id: capUUID(),
    personId,
    date,
    type,
    department: 'UNIT6',
    createdAt: new Date().toISOString()
  })
  return true
}

export function unit6DataUpdateHoliday(personId, date, newType) {
  const holiday = unit6DataState.holidays.find(h => h.personId === personId && h.date === date)
  if (!holiday) return newType ? unit6DataAddHoliday(personId, date, newType) : false
  if (!newType) return unit6DataDeleteHoliday(personId, date)
  if (!['full', 'half'].includes(newType)) return false
  holiday.type = newType
  return true
}

export function unit6DataDeleteHoliday(personId, date) {
  const idx = unit6DataState.holidays.findIndex(h => h.personId === personId && h.date === date)
  if (idx === -1) return false
  unit6DataState.holidays.splice(idx, 1)
  return true
}

export function unit6DataAutoSyncUnit6Products() {
  const productsState = globalThis.productsState
  if (!productsState || !productsState.products) return false
  let changed = false
  const dbProducts = Array.isArray(productsState.products) ? productsState.products : []
  const dbMap = {}
  const dbNameSet = new Set()
  dbProducts.forEach(product => {
    if (product && product.id) dbMap[product.id] = product
    const normalizedName = (product && product.name ? String(product.name) : '').trim().toLowerCase()
    if (normalizedName) dbNameSet.add(normalizedName)
  })

  const existingByDbId = new Map(
    unit6DataState.products
      .filter(product => product.productDatabaseId)
      .map(product => [product.productDatabaseId, product])
  )

  dbProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id)
    if (existing) {
      const newNotes = dbProduct.notes || ''
      if (existing.name !== dbProduct.name || existing.notes !== newNotes || existing.department !== 'UNIT6') {
        existing.name = dbProduct.name
        existing.notes = newNotes
        existing.department = 'UNIT6'
        changed = true
      }
      return
    }

    const seedBreakdown = capNormalizeProductSupportBreakdown({ hoursPerWeek: 0 }, 0)
    unit6DataState.products.push({
      id: capUUID(),
      name: dbProduct.name,
      department: 'UNIT6',
      hoursPerWeek: seedBreakdown.hoursPerWeek,
      kittingHours: seedBreakdown.kittingHours,
      bookingInOutHours: seedBreakdown.bookingInOutHours || 0,
      kittingTimeBookingHours: seedBreakdown.kittingHours,
      productMovementHours: seedBreakdown.productMovementHours || 0,
      notes: dbProduct.notes || '',
      productDatabaseId: dbProduct.id,
      createdAt: new Date().toISOString()
    })
    const created = unit6DataState.products[unit6DataState.products.length - 1]
    unit6EnsureProductSupportHistoryBaseline(created)
    changed = true
  })

  const countBefore = unit6DataState.products.length
  const seenDbIds = new Set()
  const seenNames = new Set()
  unit6DataState.products = unit6DataState.products.filter(product => {
    if (!product.productDatabaseId) {
      const manualName = (product.name || '').trim().toLowerCase()
      if (manualName && dbNameSet.has(manualName)) return false
      if (seenNames.has(manualName)) return false
      seenNames.add(manualName)
      return true
    }
    if (seenDbIds.has(product.productDatabaseId)) return false
    seenDbIds.add(product.productDatabaseId)
    return dbMap[product.productDatabaseId] !== undefined
  })
  if (unit6DataState.products.length !== countBefore) changed = true

  return changed
}

export function unit6SetRefreshCurrentTabCallback(callback) {
  unit6RefreshCurrentTabCallback = typeof callback === 'function' ? callback : null
}

export function unit6SetGetTabCallback(callback) {
  unit6GetTabCallback = typeof callback === 'function' ? callback : null
}

export async function unit6DataInit() {
  try {
    if (!currentUser) return

    const relState = {
      team: (await unit6LoadRelationalTeams()) || [],
      tasks: (await unit6LoadRelationalTasks()) || [],
      products: (await unit6LoadRelationalProducts()) || [],
      holidays: capNormalizeAndDedupeHolidays(await unit6LoadRelationalHolidays()),
      productSupportHistory: (await unit6LoadRelationalProductSupportHistory()) || []
    }

    unit6DataState.team = relState.team
    unit6DataState.tasks = relState.tasks
    unit6DataState.products = relState.products
    unit6DataState.holidays = relState.holidays
    unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      relState.productSupportHistory
    )

    unit6DataState.team.forEach(member => {
      if (!('jobTitle' in member)) member.jobTitle = ''
      if (!('group' in member)) member.group = ''
      if (!('startDate' in member)) member.startDate = ''
      if (!('endDate' in member)) member.endDate = ''
    })
    unit6DataState.tasks.forEach(task => {
      if (!('type' in task)) task.type = 'standard'
      if (!('status' in task)) task.status = 'SCHEDULED'
      if (!('isDisabled' in task)) task.isDisabled = false
    })
    unit6DataState.products.forEach(product => {
      if (!('productDatabaseId' in product)) product.productDatabaseId = ''
    })

    unit6DataState.products.forEach(product => unit6EnsureProductSupportHistoryBaseline(product))
    unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      unit6DataState.productSupportHistory
    )

    setUnit6DataPendingDeletes({ tasks: [], teams: [], supportHistory: [] })
    unit6CapacityDataSubscribe()
  } catch (err) {
    console.warn('unit6DataInit exception:', err.message)
  }
  setUnit6DataInitialized(true)
}

export async function unit6DataSave(showAlert) {
  void showAlert
  if (unit6DataSaveInProgress) {
    setUnit6DataSaveQueued(true)
    return
  }
  setUnit6DataSaveInProgress(true)

  try {
    if (!currentUser) {
      console.warn('UNIT6 save: Supabase not available')
      return
    }
    setSyncBadge('syncing', 'Saving...')
    let ok = true

    for (let i = 0; i < unit6DataState.products.length; i++) {
      if (!(await unit6SaveProductRelational(currentUser.id, unit6DataState.products[i]))) ok = false
    }
    const validProductIds = new Set(unit6DataState.products.map(product => product.id).filter(Boolean))

    unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
      unit6DataState.productSupportHistory
    )
    const validHistory = unit6DataState.productSupportHistory.filter(
      row => row && row.productId && validProductIds.has(row.productId)
    )
    if (validHistory.length > 0) {
      if (!(await unit6SaveProductSupportHistoryRelational(currentUser.id, validHistory))) ok = false
    }

    for (let i = 0; i < unit6DataState.team.length; i++) {
      if (!(await unit6SaveTeamRelational(currentUser.id, unit6DataState.team[i]))) ok = false
    }

    for (let i = 0; i < unit6DataState.tasks.length; i++) {
      const task = unit6DataState.tasks[i]
      if (task.productId && !validProductIds.has(task.productId)) task.productId = ''
      const result = await unit6SaveTaskRelational(currentUser.id, task)
      if (!result.success) ok = false
      else if (!task.id && result.taskId) task.id = result.taskId
    }

    const queuedDeletes = Array.isArray(unit6DataPendingDeletes.tasks)
      ? unit6DataPendingDeletes.tasks.slice()
      : []
    if (queuedDeletes.length > 0) {
      const failedDeletes = []
      for (const taskId of queuedDeletes) {
        if (!(await unit6DeleteTaskRelational(taskId))) {
          failedDeletes.push(taskId)
          ok = false
        }
      }
      unit6DataPendingDeletes.tasks = failedDeletes
    }

    const queuedTeamDeletes = Array.isArray(unit6DataPendingDeletes.teams)
      ? unit6DataPendingDeletes.teams.slice()
      : []
    if (queuedTeamDeletes.length > 0) {
      const failedTeamDeletes = []
      for (const teamId of queuedTeamDeletes) {
        if (!(await unit6DeleteTeamRelational(teamId))) {
          failedTeamDeletes.push(teamId)
          ok = false
        }
      }
      unit6DataPendingDeletes.teams = failedTeamDeletes
    }

    const queuedSupportHistoryDeletes = Array.isArray(unit6DataPendingDeletes.supportHistory)
      ? unit6DataPendingDeletes.supportHistory.slice()
      : []
    if (queuedSupportHistoryDeletes.length > 0) {
      const failedSupportHistoryDeletes = []
      for (const historyId of queuedSupportHistoryDeletes) {
        if (!(await unit6DeleteSupportHistoryRelational(historyId))) {
          failedSupportHistoryDeletes.push(historyId)
          ok = false
        }
      }
      unit6DataPendingDeletes.supportHistory = failedSupportHistoryDeletes
    }

    const seen = new Set()
    unit6DataState.holidays = capNormalizeAndDedupeHolidays(unit6DataState.holidays)
    const holidayData = unit6DataState.holidays
      .filter(holiday => {
        if (holiday.userId && holiday.userId !== currentUser.id) return false
        const key = holiday.personId + '_' + holiday.date
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(holiday => ({
        id: holiday.id,
        user_id: currentUser.id,
        person_id: holiday.personId,
        date: holiday.date,
        type: holiday.type,
        department: 'UNIT6'
      }))

    const { error: delHolErr } = await supa.from('unit6_holidays').delete().eq('user_id', currentUser.id)
    if (delHolErr) {
      console.warn('UNIT6 holiday delete error:', delHolErr.message)
      ok = false
    } else if (holidayData.length > 0) {
      const { error: insHolErr } = await supa.from('unit6_holidays').insert(holidayData)
      if (insHolErr) {
        console.warn('UNIT6 holiday insert error:', insHolErr.message)
        ok = false
      }
    }

    setSyncBadge(ok ? 'saved' : 'error', ok ? 'Saved' : 'Save failed')
    if (!ok) throw new Error('UNIT6 relational save had issues')
  } catch (err) {
    console.error('UNIT6 save exception:', err.message || err)
    setSyncBadge('error', 'Save failed')
  } finally {
    setUnit6DataSaveInProgress(false)
    if (unit6DataSaveQueued) {
      setUnit6DataSaveQueued(false)
      await unit6DataSave(false)
    }
  }
}

export function unit6DataReset() {
  unit6DataState.team = []
  unit6DataState.tasks = []
  unit6DataState.products = []
  unit6DataState.holidays = []
  unit6DataState.productSupportHistory = []
  setUnit6DataPendingDeletes({ tasks: [], teams: [], supportHistory: [] })
}

function unit6IsCapacityFilterInputFocused() {
  const active = document.activeElement
  if (!active || active === document.body) return false
  if (typeof active.matches !== 'function') return false
  return active.matches(
    '[data-cap-action="cap-task-search"], [data-cap-action="cap-task-filter-category"], [data-cap-action="cap-task-filter-assignee"], [data-cap-action="cap-task-filter-product"], [data-cap-action="cap-task-filter-month"], [data-cap-action="cap-products-search"], [data-cap-action="cap-product-load-search"]'
  )
}

function unit6ApplyRealtimeRender() {
  requestRender('unit6', {
    trigger: 'realtime',
    renderNow: function() {
      if (typeof unit6RefreshCurrentTabCallback === 'function' &&
          typeof unit6GetTabCallback === 'function' &&
          unit6GetTabCallback() !== 'chart') {
        unit6RefreshCurrentTabCallback()
      }
    },
    isEditing: isEditingInlineCell(),
    isFiltering: unit6IsCapacityFilterInputFocused(),
    debounceMs: 150
  })
}

export function unit6CapacityDataSubscribe() {
  if (!currentUser) return
  if (typeof createMultiTableRealtimeSubscription !== 'function') return

  createMultiTableRealtimeSubscription(
    [
      {
        table: 'unit6_teams',
        onInsert: row => {
          if (unit6DataSaveInProgress) return
          const normalized = {
            id: row.id,
            name: row.name || '',
            hoursPerWeek: capGetHoursPerWeek(row.hours_per_week),
            utilisation: parseFloat(row.utilisation) || 80,
            jobTitle: row.job_title || '',
            group: row.team_group || '',
            department: 'UNIT6',
            startDate: row.start_date || '',
            endDate: row.end_date || '',
            createdAt: row.created_at
          }
          if (!unit6DataState.team.some(member => member.id === normalized.id)) {
            unit6DataState.team.push(normalized)
            unit6ApplyRealtimeRender()
          }
        },
        onUpdate: () => {},
        onDelete: deleted => {
          if (unit6DataSaveInProgress) return
          unit6DataState.team = unit6DataState.team.filter(member => member.id !== deleted.id)
          unit6ApplyRealtimeRender()
        }
      },
      {
        table: 'unit6_tasks',
        onInsert: row => {
          if (unit6DataSaveInProgress) return
          const normalized = {
            id: row.id,
            name: row.name || '',
            category: row.category || 'NPI',
            type: row.type || 'standard',
            department: 'UNIT6',
            assigneeId: row.assignee_id || '',
            productId: row.product_id || '',
            startDate: row.start_date || '',
            endDate: row.end_date || '',
            totalHours: parseFloat(row.total_hours) || 0,
            status: row.status || 'SCHEDULED',
            isDisabled: row.is_disabled === true,
            createdAt: row.created_at
          }
          if (!unit6DataState.tasks.some(task => task.id === normalized.id)) {
            unit6DataState.tasks.push(normalized)
            unit6ApplyRealtimeRender()
          }
        },
        onUpdate: row => {
          if (unit6DataSaveInProgress) return
          const normalized = {
            id: row.id,
            name: row.name || '',
            category: row.category || 'NPI',
            type: row.type || 'standard',
            department: 'UNIT6',
            assigneeId: row.assignee_id || '',
            productId: row.product_id || '',
            startDate: row.start_date || '',
            endDate: row.end_date || '',
            totalHours: parseFloat(row.total_hours) || 0,
            status: row.status || 'SCHEDULED',
            isDisabled: row.is_disabled === true,
            createdAt: row.created_at
          }
          const idx = unit6DataState.tasks.findIndex(task => task.id === normalized.id)
          if (idx < 0) unit6DataState.tasks.push(normalized)
          else unit6DataState.tasks[idx] = { ...unit6DataState.tasks[idx], ...normalized }
          unit6ApplyRealtimeRender()
        },
        onDelete: deleted => {
          if (unit6DataSaveInProgress) return
          unit6DataState.tasks = unit6DataState.tasks.filter(task => task.id !== deleted.id)
          unit6ApplyRealtimeRender()
        }
      },
      {
        table: 'unit6_products',
        onInsert: row => {
          if (unit6DataSaveInProgress) return
          const breakdown = capNormalizeProductSupportBreakdown(row, row.hours_per_week)
          const normalized = {
            id: row.id,
            name: row.name || '',
            productDatabaseId: row.product_database_id || '',
            hoursPerWeek: breakdown.hoursPerWeek,
            kittingHours: breakdown.kittingHours,
            bookingInOutHours: breakdown.bookingInOutHours,
            kittingTimeBookingHours: breakdown.kittingTimeBookingHours,
            productMovementHours: breakdown.productMovementHours,
            department: 'UNIT6',
            notes: row.notes || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at || ''
          }
          if (!unit6DataState.products.some(product => product.id === normalized.id)) {
            unit6DataState.products.push(normalized)
            unit6ApplyRealtimeRender()
          }
        },
        onUpdate: () => {},
        onDelete: deleted => {
          if (unit6DataSaveInProgress) return
          unit6DataState.products = unit6DataState.products.filter(product => product.id !== deleted.id)
          unit6ApplyRealtimeRender()
        }
      },
      {
        table: 'unit6_holidays',
        onInsert: row => {
          if (unit6DataSaveInProgress) return
          const normalized = capNormalizeHolidayRecord(row)
          if (!normalized) return
          if (!unit6DataState.holidays.some(holiday => holiday.id === normalized.id)) {
            unit6DataState.holidays.push(normalized)
            unit6ApplyRealtimeRender()
          }
        },
        onUpdate: () => {},
        onDelete: deleted => {
          if (unit6DataSaveInProgress) return
          unit6DataState.holidays = unit6DataState.holidays.filter(holiday => holiday.id !== deleted.id)
          unit6ApplyRealtimeRender()
        }
      },
      {
        table: 'unit6_product_support_history',
        onInsert: row => {
          if (unit6DataSaveInProgress) return
          const normalized = capNormalizeSupportHistoryRecord(row, 'UNIT6')
          if (!normalized) return
          const idx = unit6DataState.productSupportHistory.findIndex(history => history.id === normalized.id)
          if (idx >= 0) unit6DataState.productSupportHistory[idx] = normalized
          else unit6DataState.productSupportHistory.push(normalized)
          unit6DataState.productSupportHistory = capNormalizeAndDedupeSupportHistory(
            unit6DataState.productSupportHistory
          )
          unit6ApplyRealtimeRender()
        },
        onUpdate: () => {},
        onDelete: deleted => {
          if (unit6DataSaveInProgress) return
          unit6DataState.productSupportHistory = unit6DataState.productSupportHistory.filter(
            history => history.id !== deleted.id
          )
          unit6ApplyRealtimeRender()
        }
      }
    ],
    'unit6-capacity-channel'
  )
}

export function unit6CapacityDataUnsubscribe() {
  removeRealtimeSubscription('unit6-capacity-channel')
}
