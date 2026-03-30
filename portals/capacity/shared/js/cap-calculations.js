/* ============================================================
   cap-calculations.js — Capacity Calculation Layer
   ============================================================ */

import {
  capGetHoursPerWeek,
  getBankHolidaysForYear
} from './cap-utils.js'

let capProductionBatchesResolver = () => []

export function setCapProductionBatchesResolver(resolver) {
  capProductionBatchesResolver = typeof resolver === 'function' ? resolver : () => []
}

function getProductionBatches() {
  const rows = capProductionBatchesResolver()
  return Array.isArray(rows) ? rows : []
}

export function getEffectiveSubtasks(task) {
  if (task.assigneeId) {
    return [{
      assigneeId: task.assigneeId,
      hours: task.totalHours || 0,
      name: task.name
    }]
  }
  return []
}

export function capParseDateOnlyLocal(value) {
  if (!value) return null
  const dateOnly = String(value).substring(0, 10)
  const parts = dateOnly.split('-').map(Number)
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function formatDateForHolidays(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWeekday(date) {
  const d = date.getDay()
  return d !== 0 && d !== 6
}

export function capGetHolidayDaysInRange(memberId, rangeStart, rangeEnd, holidaysArray, bankHolSet) {
  if (!memberId || !rangeStart || !rangeEnd || !Array.isArray(holidaysArray)) return 0

  const rangeStartDate = new Date(rangeStart)
  rangeStartDate.setHours(0, 0, 0, 0)
  const rangeEndDate = new Date(rangeEnd)
  rangeEndDate.setHours(0, 0, 0, 0)

  let holidayDays = 0
  holidaysArray.forEach(holiday => {
    if (!holiday) return
    const holidayPersonId = holiday.personId || holiday.person_id
    if (holidayPersonId !== memberId) return

    const holidayDate = capParseDateOnlyLocal(holiday.date)
    if (!holidayDate) return
    holidayDate.setHours(0, 0, 0, 0)

    if (holidayDate < rangeStartDate || holidayDate > rangeEndDate) return
    if (!isWeekday(holidayDate)) return

    const holidayDateStr = formatDateForHolidays(holidayDate)
    if (bankHolSet && bankHolSet.has(holidayDateStr)) return

    const holidayType = String(holiday.type || 'full').toLowerCase()
    holidayDays += holidayType === 'half' ? 0.5 : 1
  })

  return holidayDays
}

export function capGetProductBatchCountInRange(product, rangeStart, rangeEnd, batchesArray) {
  if (!product || !rangeStart || !rangeEnd) return 0
  const productDbId = product.productDatabaseId || product.product_database_id || null
  if (!productDbId) return 0

  const batches = Array.isArray(batchesArray) ? batchesArray : getProductionBatches()
  let count = 0
  batches.forEach(batch => {
    if (!batch || batch.product_id !== productDbId) return
    if (!batch.start_date || !batch.due_date) return

    const batchStart = new Date(batch.start_date)
    const batchEnd = new Date(batch.due_date)
    if (Number.isNaN(batchStart.getTime()) || Number.isNaN(batchEnd.getTime())) return
    if (batchStart <= rangeEnd && batchEnd >= rangeStart) count += 1
  })

  return count
}

export function capGetProductBatchesInRange(product, rangeStart, rangeEnd, batchesArray) {
  if (!product || !rangeStart || !rangeEnd) return []
  const productDbId = product.productDatabaseId || product.product_database_id || null
  if (!productDbId) return []

  const batches = Array.isArray(batchesArray) ? batchesArray : getProductionBatches()
  return batches.filter(batch => {
    if (!batch || batch.product_id !== productDbId) return false
    if (!batch.start_date || !batch.due_date) return false

    const batchStart = new Date(batch.start_date)
    const batchEnd = new Date(batch.due_date)
    if (Number.isNaN(batchStart.getTime()) || Number.isNaN(batchEnd.getTime())) return false
    return batchStart <= rangeEnd && batchEnd >= rangeStart
  })
}

export function capGetProductSupportHoursForBatch(product, batch, monthStart, fallbackHoursPerWeek, supportRateResolver) {
  if (!product || !batch) return Number(fallbackHoursPerWeek || 0) || 0
  const batchStart = capParseDateOnlyLocal(batch.start_date) || new Date(monthStart)
  const lookupDate = batchStart > monthStart ? batchStart : new Date(monthStart)
  const lookupDateStr = lookupDate.toISOString().split('T')[0]

  if (typeof supportRateResolver === 'function') {
    return supportRateResolver(
      product.id,
      lookupDateStr,
      fallbackHoursPerWeek,
      product.department
    )
  }

  return Number(fallbackHoursPerWeek || 0) || 0
}

export function countWorkDaysInMonth(year, month) {
  const date = new Date(year, month - 1, 1)
  let workDays = 0
  while (date.getMonth() === month - 1) {
    if (isWeekday(date)) workDays++
    date.setDate(date.getDate() + 1)
  }
  return workDays
}

export function countWorkDaysBetween(startDate, endDate) {
  let workDays = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    if (isWeekday(current)) workDays++
    current.setDate(current.getDate() + 1)
  }
  return workDays
}

export function countNetworkDaysBetween(startDate, endDate, bankHolSet) {
  let workDays = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    if (isWeekday(current)) {
      const dateStr = formatDateForHolidays(current)
      if (!bankHolSet || !bankHolSet.has(dateStr)) workDays++
    }
    current.setDate(current.getDate() + 1)
  }
  return workDays
}

export function capCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray, options) {
  const calcOptions = options || {}
  const supportRateResolver = calcOptions.supportRateResolver
  const productionBatches = calcOptions.productionBatches
  const [year, month] = monthKey.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const relevantYears = new Set([year])
  ;(tasksArray || []).forEach(task => {
    if (task.startDate) relevantYears.add(new Date(task.startDate).getFullYear())
    if (task.endDate) relevantYears.add(new Date(task.endDate).getFullYear())
  })

  const bankHolSet = new Set()
  relevantYears.forEach(y => getBankHolidaysForYear(y).forEach(h => bankHolSet.add(h.date)))

  let capacity = 0
  let capacityMax = 0
  ;(teamArray || []).forEach(member => {
    if (!member.startDate) return

    const weeklyHours = capGetHoursPerWeek(member.hoursPerWeek)
    const utilisation = member.utilisation || 80

    let activeStart = monthStart
    let activeEnd = monthEnd

    const startDate = new Date(member.startDate)
    if (startDate > monthStart) activeStart = startDate

    if (member.endDate) {
      const endDate = new Date(member.endDate)
      if (endDate < monthEnd) activeEnd = endDate
    }

    if (activeStart <= activeEnd) {
      const netDays = countNetworkDaysBetween(activeStart, activeEnd, bankHolSet)
      const grossHours = weeklyHours * (netDays / 5)
      const holidayDays = capGetHolidayDaysInRange(member.id, activeStart, activeEnd, holidaysArray, bankHolSet)
      const holidayHours = holidayDays * (weeklyHours / 5)
      const adjustedGross = Math.max(0, grossHours - holidayHours)
      capacity += adjustedGross * (utilisation / 100)
      capacityMax += adjustedGross
    }
  })

  let npi = 0
  let improvement = 0
  let tendering = 0
  let support = 0
  let other = 0

  ;(tasksArray || []).forEach(task => {
    if (task && task.isDisabled === true) return
    if (!task.startDate || !task.endDate) return

    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()))
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()))

    if (overlapStart <= overlapEnd) {
      const taskNetDays = countNetworkDaysBetween(taskStart, taskEnd, bankHolSet)
      if (taskNetDays === 0) return

      const overlapNetDays = countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet)
      const category = (task.category || 'other').toLowerCase()
      const effectiveSubtasks = getEffectiveSubtasks(task)
      if (effectiveSubtasks.length === 0) return

      effectiveSubtasks.forEach(subtask => {
        const subtaskHours = (subtask.hours || 0) * (overlapNetDays / taskNetDays)
        if (category === 'npi') npi += subtaskHours
        else if (category === 'improvement') improvement += subtaskHours
        else if (category === 'tendering') tendering += subtaskHours
        else if (category === 'support') support += subtaskHours
        else other += subtaskHours
      })
    }
  })

  ;(productsArray || []).forEach(product => {
    const rawKitting = Number(product && (product.kittingHours ?? product.kitting_hours ?? product.kittingTimeBookingHours ?? product.kitting_time_booking_hours))
    const rawBookingInOut = Number(product && (product.bookingInOutHours ?? product.booking_in_out_hours))
    const rawMovement = Number(product && (product.productMovementHours ?? product.product_movement_hours))
    const fallbackSupportPerBatch = (Number.isFinite(rawKitting) || Number.isFinite(rawBookingInOut) || Number.isFinite(rawMovement))
      ? Math.max(0, Number.isFinite(rawKitting) ? rawKitting : 0) + Math.max(0, Number.isFinite(rawBookingInOut) ? rawBookingInOut : 0) + Math.max(0, Number.isFinite(rawMovement) ? rawMovement : 0)
      : (Number(product.hoursPerWeek) || 0)
    const overlappingBatches = capGetProductBatchesInRange(product, monthStart, monthEnd, productionBatches)
    overlappingBatches.forEach(batch => {
      const supportPerBatch = capGetProductSupportHoursForBatch(
        product,
        batch,
        monthStart,
        fallbackSupportPerBatch,
        supportRateResolver
      )
      support += supportPerBatch
    })
  })

  const totalDemand = npi + improvement + tendering + support + other
  return {
    capacity,
    capacityMax,
    npi,
    improvement,
    tendering,
    support,
    other,
    totalDemand,
    utilisation: capacity > 0 ? Math.round((totalDemand / capacity) * 100) : 0
  }
}

export const meCalculateMonthData = capCalculateMonthData

export function capCalcWeekUtilisation(personId, weekStart, weekEnd, tasksArray, holidaysArray, teamArray) {
  const useTeam = Array.isArray(teamArray) ? teamArray : []
  const person = useTeam.find(p => p.id === personId)
  if (!person || !person.startDate) return { capacity: 0, demand: 0, utilisation: 0 }

  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekEnd)

  const relevantYears = new Set([weekStartDate.getFullYear(), weekEndDate.getFullYear()])
  ;(tasksArray || []).forEach(task => {
    if (task.startDate) relevantYears.add(new Date(task.startDate).getFullYear())
    if (task.endDate) relevantYears.add(new Date(task.endDate).getFullYear())
  })
  const bankHolSet = new Set()
  relevantYears.forEach(y => getBankHolidaysForYear(y).forEach(h => bankHolSet.add(h.date)))

  const baseHours = capGetHoursPerWeek(person.hoursPerWeek)
  const utilisation = person.utilisation || 80

  let activeStart = weekStartDate
  let activeEnd = weekEndDate

  const personStart = capParseDateOnlyLocal(person.startDate)
  if (personStart && personStart > weekStartDate) activeStart = personStart

  if (person.endDate) {
    const personEnd = capParseDateOnlyLocal(person.endDate)
    if (personEnd && personEnd < weekEndDate) activeEnd = personEnd
  }

  if (activeStart > activeEnd) return { capacity: 0, demand: 0, utilisation: 0 }

  const netDays = countNetworkDaysBetween(activeStart, activeEnd, bankHolSet)
  const grossCapacity = baseHours * (netDays / 5)

  const holidayDays = capGetHolidayDaysInRange(personId, activeStart, activeEnd, holidaysArray, bankHolSet)
  const holidayHours = holidayDays * (baseHours / 5)
  const adjustedGross = Math.max(0, grossCapacity - holidayHours)
  const capacity = adjustedGross * (utilisation / 100)

  let demand = 0
  ;(tasksArray || []).forEach(task => {
    if (task && task.isDisabled === true) return
    if (!task.startDate || !task.endDate) return

    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    if (taskStart <= weekEndDate && taskEnd >= weekStartDate) {
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStartDate.getTime()))
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEndDate.getTime()))

      const taskNetDays = countNetworkDaysBetween(taskStart, taskEnd, bankHolSet)
      if (taskNetDays === 0) return

      const overlapNetDays = countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet)
      const effectiveSubtasks = getEffectiveSubtasks(task)

      effectiveSubtasks.forEach(subtask => {
        if (subtask.assigneeId === personId) {
          demand += (subtask.hours || 0) * (overlapNetDays / taskNetDays)
        }
      })
    }
  })

  const utilisationPct = capacity > 0 ? Math.round((demand / capacity) * 100) : 0
  return { capacity, demand, utilisation: utilisationPct }
}

export function capGetWeekRange(monthKey, weekCount) {
  const [year, month] = monthKey.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)

  let current = new Date(monthStart)
  const dayOfWeek = current.getDay()
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7
  if (daysUntilMonday > 0) {
    current.setDate(current.getDate() + daysUntilMonday)
  }

  const weeks = []
  for (let i = 0; i < weekCount; i++) {
    const start = formatDateForHolidays(new Date(current))
    const end = formatDateForHolidays(new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000))
    weeks.push({ start, end })
    current.setDate(current.getDate() + 7)
  }

  return weeks
}
