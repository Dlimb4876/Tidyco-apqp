/* ============================================================
   me-data-entities.js — ME Capacity Entity CRUD
   Team, task, product, holiday, and department autosync helpers
   ============================================================ */

import { meDataState, meDataPendingDeletes, meUUID } from './me-data.js'
import {
  meNormalizeDepartmentTag,
  meNormalizeProductSupportBreakdown,
  meNormalizeDateOnly,
  meNormalizeAndDedupeHolidays
} from './me-data-normalize.js'
import { capGetHoursPerWeek } from '../../shared/js/cap-utils.js'
import {
  meApplyLatestSupportHistoryToProduct,
  meEnsureProductSupportHistoryBaseline,
  meDataAddProductSupportHistory
} from './me-data-support-history.js'
import { meDeleteTeamRelational } from './me-data-relational.js'

export function meDataAddTeam(name, hoursPerWeek, utilisation, startDate, endDate, department) {
  if (!name || name.trim().length === 0) return false
  const member = {
    id: meUUID(),
    name: name.trim(),
    hoursPerWeek: capGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: meNormalizeDepartmentTag(department, 'ME'),
    startDate: startDate || '',
    endDate: endDate || ''
  }
  meDataState.team.push(member)
  return true
}

export function meDataUpdateTeam(idx, field, value) {
  if (idx < 0 || idx >= meDataState.team.length) return false
  const member = meDataState.team[idx]
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
    case 'department':
      member.department = meNormalizeDepartmentTag(value, 'ME')
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

export function meDataDeleteTeam(idx) {
  if (idx < 0 || idx >= meDataState.team.length) return false
  const removed = meDataState.team[idx]
  meDataState.team.splice(idx, 1)
  if (removed && removed.id) {
    meDeleteTeamRelational(removed.id).catch(err => {
      console.warn('[ME] Immediate team delete failed, queued for retry on save:', err.message)
    })
    if (!meDataPendingDeletes.teams.includes(removed.id)) meDataPendingDeletes.teams.push(removed.id)
  }
  return true
}

export function meDataGetTeam() {
  return meDataState.team
}

export function meDataAddTask(name, category, assigneeId, startDate, endDate, totalHours, productId, department) {
  if (!name || name.trim().length === 0) return false
  const todayStr = new Date().toISOString().split('T')[0]
  const task = {
    id: meUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: meNormalizeDepartmentTag(department, 'ME'),
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate || todayStr,
    endDate: endDate || todayStr,
    totalHours: parseFloat(totalHours) || 0,
    status: 'SCHEDULED',
    isDisabled: false,
    createdAt: new Date().toISOString()
  }
  meDataState.tasks.push(task)
  return true
}

export function meDataUpdateTask(taskId, field, value) {
  const task = meDataState.tasks.find(t => t.id === taskId)
  if (!task) return false
  switch (field) {
    case 'name':
      task.name = value.trim()
      break
    case 'category':
      task.category = value || 'NPI'
      break
    case 'department':
      task.department = meNormalizeDepartmentTag(value, 'ME')
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

export function meDataDeleteTask(taskId) {
  const idx = meDataState.tasks.findIndex(t => t.id === taskId)
  if (idx < 0) return false
  const removedTask = meDataState.tasks[idx]
  meDataState.tasks.splice(idx, 1)
  if (removedTask && removedTask.id && !meDataPendingDeletes.tasks.includes(removedTask.id)) {
    meDataPendingDeletes.tasks.push(removedTask.id)
  }
  return true
}

export function meDataGetTasks() {
  return meDataState.tasks
}

export function meDataAddProduct(name, hoursPerWeek, notes, productDatabaseId, department) {
  if (!name || name.trim().length === 0) return false
  const breakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek)
  const product = {
    id: meUUID(),
    name: name.trim(),
    department: meNormalizeDepartmentTag(department, 'ME'),
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  }
  meDataState.products.push(product)
  meEnsureProductSupportHistoryBaseline(product)
  return true
}

export function meDataUpdateProduct(idx, field, value, metadata) {
  if (idx < 0 || idx >= meDataState.products.length) return false
  const product = meDataState.products[idx]
  switch (field) {
    case 'name':
      product.name = value.trim()
      break
    case 'hoursPerWeek': {
      const breakdown = meNormalizeProductSupportBreakdown({
        hoursPerWeek: value,
        kittingHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'kittingHours') ? metadata.kittingHours : undefined,
        kittingTimeBookingHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'kittingTimeBookingHours') ? metadata.kittingTimeBookingHours : undefined,
        bookingInOutHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'bookingInOutHours') ? metadata.bookingInOutHours : undefined,
        productMovementHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'productMovementHours') ? metadata.productMovementHours : undefined
      }, value)
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours

      const effectiveDate = metadata && metadata.effectiveDate ? metadata.effectiveDate : meNormalizeDateOnly(new Date())
      meDataAddProductSupportHistory(
        product.id,
        product.hoursPerWeek,
        effectiveDate,
        metadata && metadata.changeReason ? metadata.changeReason : '',
        metadata && metadata.notes ? metadata.notes : '',
        product.department,
        product.kittingHours,
        product.bookingInOutHours,
        product.productMovementHours
      )
      product.supportEffectiveDate = meNormalizeDateOnly(effectiveDate) || product.supportEffectiveDate || ''
      break
    }
    case 'kittingTimeBookingHours':
    case 'kittingHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: value,
        bookingInOutHours: product.bookingInOutHours,
        productMovementHours: product.productMovementHours
      }, product.hoursPerWeek)
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'bookingInOutHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: product.kittingHours,
        bookingInOutHours: value,
        productMovementHours: product.productMovementHours
      }, product.hoursPerWeek)
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'productMovementHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: product.kittingHours,
        bookingInOutHours: product.bookingInOutHours,
        productMovementHours: value
      }, product.hoursPerWeek)
      product.hoursPerWeek = breakdown.hoursPerWeek
      product.kittingHours = breakdown.kittingHours
      product.bookingInOutHours = breakdown.bookingInOutHours
      product.kittingTimeBookingHours = breakdown.kittingHours
      product.productMovementHours = breakdown.productMovementHours
      break
    }
    case 'supportEffectiveDate':
      product.supportEffectiveDate = meNormalizeDateOnly(value) || product.supportEffectiveDate || ''
      break
    case 'notes':
      product.notes = value ? value.trim() : ''
      break
    case 'department':
      product.department = meNormalizeDepartmentTag(value, 'ME')
      break
    default:
      return false
  }
  return true
}

export function meDataDeleteProduct(idx) {
  if (idx < 0 || idx >= meDataState.products.length) return false
  const removed = meDataState.products[idx]
  meDataState.products.splice(idx, 1)
  if (removed && removed.id && !meDataPendingDeletes.products.includes(removed.id)) {
    meDataPendingDeletes.products.push(removed.id)
  }
  return true
}

export function meDataGetProducts() {
  return meDataState.products
}

export function meDataAutoSyncDepartmentProducts(department) {
  const sharedProductsState = globalThis.productsState
  if (!sharedProductsState || !sharedProductsState.products) return false

  let changed = false
  const targetDepartment = meNormalizeDepartmentTag(department, 'ME')
  const dbProducts = Array.isArray(sharedProductsState.products) ? sharedProductsState.products : []

  const dbMap = {}
  const dbNameSet = new Set()
  dbProducts.forEach(p => {
    if (p && p.id) dbMap[p.id] = p
    const normalizedName = (p && p.name ? String(p.name) : '').trim().toLowerCase()
    if (normalizedName) dbNameSet.add(normalizedName)
  })

  const existingByDbId = new Map(
    meDataState.products
      .filter(meP => meNormalizeDepartmentTag(meP.department, targetDepartment) === targetDepartment && meP.productDatabaseId)
      .map(meP => [meP.productDatabaseId, meP])
  )
  const sourceByDbId = new Map(
    meDataState.products
      .filter(meP => meP && meP.productDatabaseId)
      .map(meP => [meP.productDatabaseId, meP])
  )

  dbProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id)
    const sourceProduct = sourceByDbId.get(dbProduct.id) || null

    if (existing) {
      const newNotes = dbProduct.notes || ''
      const newId = sourceProduct && sourceProduct.id ? sourceProduct.id : existing.id
      if (
        existing.name !== dbProduct.name ||
        existing.notes !== newNotes ||
        existing.department !== targetDepartment ||
        existing.id !== newId
      ) {
        existing.name = dbProduct.name
        existing.notes = newNotes
        existing.department = targetDepartment
        if (sourceProduct && sourceProduct.id) existing.id = sourceProduct.id
        changed = true
      }
      meApplyLatestSupportHistoryToProduct(existing, targetDepartment)
    } else {
      const seedBreakdown = meNormalizeProductSupportBreakdown(sourceProduct || { hoursPerWeek: 0 }, sourceProduct && sourceProduct.hoursPerWeek)
      meDataAddProduct(dbProduct.name, seedBreakdown.hoursPerWeek, dbProduct.notes || '', dbProduct.id, targetDepartment)
      const createdProduct = meDataState.products[meDataState.products.length - 1]
      if (createdProduct) {
        createdProduct.notes = dbProduct.notes || ''
        createdProduct.department = targetDepartment
        if (sourceProduct && sourceProduct.id) createdProduct.id = sourceProduct.id
        meApplyLatestSupportHistoryToProduct(createdProduct, targetDepartment)
      }
      changed = true
    }
  })

  const countBefore = meDataState.products.filter(
    meP => meNormalizeDepartmentTag(meP.department, targetDepartment) === targetDepartment
  ).length

  const seenDbIds = new Set()
  const seenNames = new Set()
  meDataState.products = meDataState.products.filter(meP => {
    if (meNormalizeDepartmentTag(meP.department, targetDepartment) !== targetDepartment) return true

    if (!meP.productDatabaseId) {
      const manualName = (meP.name || '').trim().toLowerCase()
      if (manualName && dbNameSet.has(manualName)) return false
      if (seenNames.has(manualName)) return false
      seenNames.add(manualName)
      return true
    }

    if (seenDbIds.has(meP.productDatabaseId)) return false
    seenDbIds.add(meP.productDatabaseId)
    return dbMap[meP.productDatabaseId] !== undefined
  })

  const countAfter = meDataState.products.filter(
    meP => meNormalizeDepartmentTag(meP.department, targetDepartment) === targetDepartment
  ).length
  if (countAfter !== countBefore) changed = true

  return changed
}

export function meDataAutoSyncProductionProducts() {
  return meDataAutoSyncDepartmentProducts('ME')
}

export function meDataAutoSyncPMProducts() {
  return meDataAutoSyncDepartmentProducts('PM')
}

export function meDataAutoSyncLogProducts() {
  return meDataAutoSyncDepartmentProducts('LOG')
}

export function meDataAutoSyncUnit6Products() {
  return meDataAutoSyncDepartmentProducts('UNIT6')
}

export function meDataAddHoliday(personId, date, type, department) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false
  const existing = meDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (existing) {
    existing.type = type
    existing.department = meNormalizeDepartmentTag(department, 'ME')
    return true
  }
  meDataState.holidays.push({
    id: meUUID(),
    personId,
    date,
    type,
    department: meNormalizeDepartmentTag(department, 'ME'),
    createdAt: new Date().toISOString()
  })
  return true
}

export function meDataUpdateHoliday(personId, date, newType) {
  const holiday = meDataState.holidays.find(h => h.personId === personId && h.date === date)
  if (!holiday) {
    if (newType) return meDataAddHoliday(personId, date, newType)
    return false
  }
  if (!newType) return meDataDeleteHoliday(personId, date)
  if (!['full', 'half'].includes(newType)) return false
  holiday.type = newType
  return true
}

export function meDataDeleteHoliday(personId, date) {
  const idx = meDataState.holidays.findIndex(h => h.personId === personId && h.date === date)
  if (idx === -1) return false
  meDataState.holidays.splice(idx, 1)
  return true
}

export function meDataGetHolidays() {
  meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays)
  return meDataState.holidays
}
