/* ============================================================
   cap-data-utils.js — Shared Data Utilities
   ============================================================ */

export function capNormalizeDepartmentTag(value, fallback = 'ME') {
  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase()
  if (normalized === 'PM') return 'PM'
  if (normalized === 'LOG') return 'LOG'
  if (normalized === 'UNIT6') return 'UNIT6'
  return 'ME'
}

export function capUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function capNormalizeDateOnly(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

export function capNormalizeIsoDate(dateValue, fallbackDate) {
  if (!dateValue) return fallbackDate
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return fallbackDate
  return parsed.toISOString().split('T')[0]
}

export function capNormalizeDateRange(startDate, endDate, fallbackDate) {
  const safeStart = capNormalizeIsoDate(startDate, fallbackDate)
  let safeEnd = capNormalizeIsoDate(endDate, fallbackDate)
  if (safeEnd < safeStart) safeEnd = safeStart
  return { safeStart, safeEnd }
}

export function capGetDateMinusOneDay(dateValue) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return ''
  parsed.setDate(parsed.getDate() - 1)
  return parsed.toISOString().split('T')[0]
}

export function capNormalizeProductSupportBreakdown(source, fallbackHoursPerWeek) {
  const rawTotal = Number(
    fallbackHoursPerWeek ??
      (source && (source.hoursPerWeek ?? source.hours_per_week)) ??
      0
  )
  const rawLegacyKittingBooking = Number(source && (source.kittingTimeBookingHours ?? source.kitting_time_booking_hours))
  const rawKitting = Number(source && (source.kittingHours ?? source.kitting_hours))
  const rawBookingInOut = Number(source && (source.bookingInOutHours ?? source.booking_in_out_hours))
  const rawMovement = Number(source && (source.productMovementHours ?? source.product_movement_hours))
  const hasSplitBreakdown = Number.isFinite(rawKitting) || Number.isFinite(rawBookingInOut)
  const hasBreakdown = hasSplitBreakdown || Number.isFinite(rawLegacyKittingBooking) || Number.isFinite(rawMovement)

  const kittingHours = hasSplitBreakdown
    ? Math.max(0, Number.isFinite(rawKitting) ? rawKitting : 0)
    : (hasBreakdown
      ? Math.max(0, Number.isFinite(rawLegacyKittingBooking) ? rawLegacyKittingBooking : 0)
      : Math.max(0, Number.isFinite(rawTotal) ? rawTotal : 0))

  const bookingInOutHours = hasSplitBreakdown
    ? Math.max(0, Number.isFinite(rawBookingInOut) ? rawBookingInOut : 0)
    : 0

  const productMovementHours = hasBreakdown
    ? Math.max(0, Number.isFinite(rawMovement) ? rawMovement : 0)
    : 0

  const hoursPerWeek = hasBreakdown
    ? kittingHours + bookingInOutHours + productMovementHours
    : Math.max(0, Number.isFinite(rawTotal) ? rawTotal : 0)

  return {
    hoursPerWeek,
    kittingHours,
    bookingInOutHours,
    kittingTimeBookingHours: kittingHours,
    productMovementHours
  }
}

export function capNormalizeHolidayRecord(holiday) {
  if (!holiday || typeof holiday !== 'object') return null

  const personId = holiday.personId || holiday.person_id
  const date = holiday.date || ''
  const type = holiday.type === 'half' ? 'half' : 'full'
  if (!personId || !date) return null

  return {
    id: holiday.id || capUUID(),
    userId: holiday.userId || holiday.user_id || null,
    personId,
    date,
    type,
    department: capNormalizeDepartmentTag(holiday.department, 'ME'),
    createdAt: holiday.createdAt || holiday.created_at || new Date().toISOString()
  }
}

export function capNormalizeAndDedupeHolidays(holidays) {
  if (!Array.isArray(holidays)) return []
  const byPersonDate = new Map()
  holidays.forEach(rawHoliday => {
    const normalized = capNormalizeHolidayRecord(rawHoliday)
    if (!normalized) return
    byPersonDate.set(`${normalized.personId}|${normalized.date}`, normalized)
  })
  return Array.from(byPersonDate.values())
}

export function capNormalizeSupportHistoryRecord(record, fallbackDepartment = 'ME') {
  if (!record || typeof record !== 'object') return null

  const productId = record.productId || record.product_id
  const effectiveDate = capNormalizeDateOnly(record.effectiveDate || record.effective_date)
  if (!productId || !effectiveDate) return null

  const breakdown = capNormalizeProductSupportBreakdown(record)

  return {
    id: record.id || capUUID(),
    productId,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate,
    endDate: capNormalizeDateOnly(record.endDate || record.end_date) || '',
    changeReason: record.changeReason || record.change_reason || '',
    notes: record.notes || '',
    department: capNormalizeDepartmentTag(record.department, fallbackDepartment),
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || ''
  }
}

function supportHistoryTimestamp(row) {
  if (!row || typeof row !== 'object') return 0
  const updated = Date.parse(row.updatedAt || row.updated_at || '')
  if (Number.isFinite(updated)) return updated
  const created = Date.parse(row.createdAt || row.created_at || '')
  if (Number.isFinite(created)) return created
  return 0
}

function pickPreferredRecord(existingRecord, nextRecord) {
  if (!existingRecord) return nextRecord
  if (!nextRecord) return existingRecord
  const existingTime = supportHistoryTimestamp(existingRecord)
  const nextTime = supportHistoryTimestamp(nextRecord)
  return nextTime >= existingTime ? nextRecord : existingRecord
}

export function capNormalizeAndDedupeSupportHistory(rows) {
  if (!Array.isArray(rows)) return []
  const deduped = new Map()
  rows.forEach(raw => {
    const normalized = capNormalizeSupportHistoryRecord(raw)
    if (!normalized) return
    const key = `${normalized.productId}|${normalized.effectiveDate}|${normalized.department}`
    const existing = deduped.get(key)
    deduped.set(key, pickPreferredRecord(existing, normalized))
  })
  return capSortSupportHistoryByDate(Array.from(deduped.values()))
}

export function capSortSupportHistoryByDate(historyRows) {
  return (historyRows || []).slice().sort((a, b) => {
    const aDate = capNormalizeDateOnly(a.effectiveDate || a.effective_date)
    const bDate = capNormalizeDateOnly(b.effectiveDate || b.effective_date)
    if (aDate === bDate) return 0
    return aDate < bDate ? -1 : 1
  })
}
