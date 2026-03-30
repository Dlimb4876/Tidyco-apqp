/* ============================================================
   me-data-normalize.js — ME Capacity Normalization Helpers
   Shared pure helpers extracted from me-data.js
   ============================================================ */

import {
  capNormalizeDepartmentTag,
  capNormalizeHolidayRecord,
  capNormalizeAndDedupeHolidays,
  capNormalizeDateOnly,
  capNormalizeProductSupportBreakdown,
  capGetDateMinusOneDay,
  capNormalizeSupportHistoryRecord,
  capSortSupportHistoryByDate,
  capNormalizeAndDedupeSupportHistory
} from '../../shared/js/cap-data-utils.js'
import { capUUID } from '../../shared/js/cap-data-utils.js'

export function meNormalizeDepartmentTag(value, fallback = 'ME') {
  return capNormalizeDepartmentTag(value, fallback)
}

export function meNormalizeMeTableDepartment(_value) {
  return 'ME'
}

export function meUUID() {
  return capUUID()
}

export function meNormalizeHolidayRecord(holiday) {
  return capNormalizeHolidayRecord(holiday)
}

export function meNormalizeAndDedupeHolidays(holidays) {
  return capNormalizeAndDedupeHolidays(holidays)
}

export function meNormalizeDateOnly(value) {
  return capNormalizeDateOnly(value)
}

export function meNormalizeProductSupportBreakdown(source, fallbackHoursPerWeek) {
  return capNormalizeProductSupportBreakdown(source, fallbackHoursPerWeek)
}

export function meGetDateMinusOneDay(dateValue) {
  return capGetDateMinusOneDay(dateValue)
}

export function meNormalizeSupportHistoryRecord(record, fallbackDepartment = 'ME') {
  return capNormalizeSupportHistoryRecord(record, fallbackDepartment)
}

export function meSortSupportHistoryByDate(historyRows) {
  return capSortSupportHistoryByDate(historyRows)
}

export function meNormalizeAndDedupeSupportHistory(rows) {
  return capNormalizeAndDedupeSupportHistory(rows)
}
