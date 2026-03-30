/* ============================================================
   cap-utils.js — Shared Utility Functions
   ============================================================ */

import './cap-data-utils.js'

export const CAP_HOURS_PER_DAY = 8
export const CAP_DEFAULT_HOURS_PER_WEEK = CAP_HOURS_PER_DAY * 5

export function capGetHoursPerWeek(hoursPerWeek) {
  const parsed = parseFloat(hoursPerWeek)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : CAP_DEFAULT_HOURS_PER_WEEK
}

export function capGetDailyHours(hoursPerWeek, utilisationPercent) {
  const weeklyHours = capGetHoursPerWeek(hoursPerWeek)
  const util = Number.isFinite(parseFloat(utilisationPercent)) ? parseFloat(utilisationPercent) : 100
  return (weeklyHours * (util / 100)) / 5
}

export function escapeHtml(text) {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, m => map[m])
}

export function getUtilisationColor(percent) {
  if (percent < 80) return 'var(--green)'
  if (percent < 100) return 'var(--amber)'
  return 'var(--red)'
}

export function formatPercent(num, decimals = 0) {
  if (Number.isNaN(num)) return '0%'
  return `${Number(num).toFixed(decimals)}%`
}

export function formatHours(num, decimals = 1) {
  if (Number.isNaN(num)) return '0h'
  return `${Number(num).toFixed(decimals)}h`
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date || !(date instanceof Date)) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  if (format === 'YYYY-MM-DD') return `${y}-${m}-${d}`
  if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`
  if (format === 'DD/MM') return `${d}/${m}`
  return `${y}-${m}-${d}`
}

export function getMonthLabel(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return ['', '']
  const [year, month] = monthKey.split('-')
  if (!year || !month) return ['', '']

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = parseInt(month, 10) - 1

  if (monthIndex < 0 || monthIndex > 11) return ['', '']
  return [monthNames[monthIndex], year]
}

export function parseMonth(monthKey) {
  if (!monthKey || typeof monthKey !== 'string') return { year: null, month: null }
  const [year, month] = monthKey.split('-')
  return { year: parseInt(year, 10), month: parseInt(month, 10) }
}

export function addMonths(monthKey, count) {
  const { year, month } = parseMonth(monthKey)
  if (year === null || month === null) return monthKey

  let newMonth = month + count
  let newYear = year

  while (newMonth > 12) {
    newMonth -= 12
    newYear += 1
  }
  while (newMonth < 1) {
    newMonth += 12
    newYear -= 1
  }

  return `${newYear}-${String(newMonth).padStart(2, '0')}`
}

export function subtractMonths(monthKey, count) {
  return addMonths(monthKey, -count)
}

export function getCurrentMonth() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function getMonthRange(startMonthKey, count) {
  const result = []
  let current = startMonthKey
  for (let i = 0; i < count; i++) {
    result.push(current)
    current = addMonths(current, 1)
  }
  return result
}

export function countWorkDaysInMonth(year, month) {
  let count = 0
  const lastDay = new Date(year, month, 0).getDate()

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
  }

  return count
}

export function countWorkDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) return 0

  let count = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
    current.setDate(current.getDate() + 1)
  }

  return count
}

const capBankHolidaysCache = {}

export function getBankHolidaysForYear(year) {
  if (capBankHolidaysCache[year]) return capBankHolidaysCache[year]

  const computusEaster = y => {
    const a = y % 19
    const b = Math.floor(y / 100)
    const c = y % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(y, month - 1, day)
  }

  const easterDate = computusEaster(year)
  const easterMonday = new Date(easterDate)
  easterMonday.setDate(easterMonday.getDate() + 1)

  const goodFriday = new Date(easterDate)
  goodFriday.setDate(goodFriday.getDate() - 2)

  const formatHolidayDate = date => {
    return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getFirstMonday = (y, monthIndex) => {
    const date = new Date(y, monthIndex, 1)
    const day = date.getDay()
    const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7
    date.setDate(date.getDate() + daysUntilMonday)
    return date
  }

  const getLastMonday = (y, monthIndex) => {
    const date = new Date(y, monthIndex + 1, 0)
    const day = date.getDay()
    const daysBackToMonday = (day + 6) % 7
    date.setDate(date.getDate() - daysBackToMonday)
    return date
  }

  const earlyMay = getFirstMonday(year, 4)
  const springBank = getLastMonday(year, 4)
  const summerBank = getLastMonday(year, 7)

  const newYear = new Date(year, 0, 1)
  const newYearDow = newYear.getDay()
  if (newYearDow === 6) {
    newYear.setDate(3)
  } else if (newYearDow === 0) {
    newYear.setDate(2)
  }

  let christmasDay = new Date(year, 11, 25)
  let boxingDay = new Date(year, 11, 26)

  if (christmasDay.getDay() === 6) {
    christmasDay = new Date(year, 11, 27)
    boxingDay = new Date(year, 11, 28)
  } else if (christmasDay.getDay() === 0) {
    christmasDay = new Date(year, 11, 27)
    boxingDay = new Date(year, 11, 26)
  } else if (boxingDay.getDay() === 6) {
    boxingDay = new Date(year, 11, 28)
  } else if (boxingDay.getDay() === 0) {
    boxingDay = new Date(year, 11, 28)
  }

  const holidays = [
    { date: formatHolidayDate(newYear), name: 'New Year\'s Day' },
    { date: formatHolidayDate(goodFriday), name: 'Good Friday' },
    { date: formatHolidayDate(easterMonday), name: 'Easter Monday' },
    { date: formatHolidayDate(earlyMay), name: 'Early May Bank Holiday' },
    { date: formatHolidayDate(springBank), name: 'Spring Bank Holiday' },
    { date: formatHolidayDate(summerBank), name: 'Summer Bank Holiday' },
    { date: formatHolidayDate(christmasDay), name: 'Christmas Day' },
    { date: formatHolidayDate(boxingDay), name: 'Boxing Day' }
  ]

  capBankHolidaysCache[year] = holidays
  return holidays
}
