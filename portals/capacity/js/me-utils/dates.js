// ME Capacity Planning - Date/Time Utilities

/**
 * Compute Easter Sunday using Meeus/Jones/Butcher algorithm
 * @param {number} year
 * @returns {Date} Easter Sunday in given year
 */
export function computeEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Get month start and end dates
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @returns {{start: Date, end: Date}} Start and end of month
 */
export function getMonthStartEnd(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

/**
 * Format month key for display
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @returns {string} Human-readable month (e.g., 'Mar 2025')
 */
export function getMonthLabel(monthKey) {
  const date = new Date(monthKey + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Increment month by 1
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @returns {string} Next month
 */
export function getNextMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month, 1);
  date.setMonth(date.getMonth() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Decrement month by 1
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @returns {string} Previous month
 */
export function getPrevMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Get array of month keys starting from startMonth
 * @param {string} startMonth ISO month string
 * @param {number} count Number of months
 * @returns {string[]} Array of month keys
 */
export function getMonthRange(startMonth, count) {
  const months = [];
  let current = startMonth;
  for (let i = 0; i < count; i++) {
    months.push(current);
    current = getNextMonthKey(current);
  }
  return months;
}

/**
 * Count working days (Mon-Fri) in a month
 * @param {number} year
 * @param {number} month 1-12
 * @returns {number} Working days count
 */
export function getWorkingDaysInMonth(year, month) {
  const { start, end } = getMonthStartEnd(`${year}-${String(month).padStart(2, '0')}`);
  let workDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workDays++; // Exclude Sunday and Saturday
  }
  return workDays;
}

/**
 * Get day of week name
 * @param {string} dateStr YYYY-MM-DD format
 * @returns {string} Day name (Monday, Tuesday, etc.)
 */
export function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Check if date is weekend
 * @param {string} dateStr YYYY-MM-DD format
 * @returns {boolean}
 */
export function isWeekend(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get last day of month
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @returns {Date}
 */
export function getEOMonthDate(monthKey) {
  const { end } = getMonthStartEnd(monthKey);
  return end;
}

/**
 * Add 90 days to a date
 * @param {Date} fromDate
 * @returns {Date}
 */
export function add90Days(fromDate) {
  const result = new Date(fromDate);
  result.setDate(result.getDate() + 90);
  return result;
}

/**
 * Get UK bank holidays for a given year
 * @param {number} year
 * @returns {Object} Map of YYYY-MM-DD to holiday name
 */
export function getUKBankHolidays(year) {
  const holidays = {};

  // Fixed holidays
  holidays[`${year}-01-01`] = 'New Year';
  holidays[`${year}-12-25`] = 'Christmas Day';
  holidays[`${year}-12-26`] = 'Boxing Day';

  // Easter-based holidays
  const easter = computeEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  holidays[formatDate(goodFriday)] = 'Good Friday';
  holidays[formatDate(easterMonday)] = 'Easter Monday';

  // First Monday in May (Early May Bank Holiday)
  const mayFirst = new Date(year, 4, 1);
  const daysUntilMonday = (1 - mayFirst.getDay() + 7) % 7;
  const firstMondayMay = new Date(year, 4, 1 + daysUntilMonday);
  holidays[formatDate(firstMondayMay)] = 'Early May Bank Holiday';

  // Last Monday in May (Spring Bank Holiday)
  const lastMayDate = new Date(year, 5, 0);
  const daysSinceMonday = lastMayDate.getDay();
  const lastMondayMay = new Date(year, 4, lastMayDate.getDate() - daysSinceMonday + 1);
  if (lastMondayMay.getMonth() !== 4) lastMondayMay.setDate(lastMondayMay.getDate() - 7);
  holidays[formatDate(lastMondayMay)] = 'Spring Bank Holiday';

  // Last Monday in August (Summer Bank Holiday)
  const lastAugDate = new Date(year, 8, 31);
  const daysSinceAugMonday = lastAugDate.getDay();
  const lastMondayAug = new Date(year, 7, lastAugDate.getDate() - daysSinceAugMonday + 1);
  if (lastMondayAug.getMonth() !== 7) lastMondayAug.setDate(lastMondayAug.getDate() - 7);
  holidays[formatDate(lastMondayAug)] = 'Summer Bank Holiday';

  return holidays;
}

/**
 * Check if date is a bank holiday
 * @param {string} dateStr YYYY-MM-DD format
 * @param {number} year
 * @returns {boolean}
 */
export function isBankHoliday(dateStr, year) {
  const holidays = getUKBankHolidays(year);
  return !!holidays[dateStr];
}

/**
 * Format Date object to YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
