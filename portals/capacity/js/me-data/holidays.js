// Holiday and Bank Holiday management

import { getUKBankHolidays, isBankHoliday, computeEasterDate } from '../me-utils/dates.js';

/**
 * Add a user-marked holiday
 * @param {Array} holidaysArray
 * @param {string} personId
 * @param {string} date YYYY-MM-DD
 * @param {string} type 'full' or 'half'
 */
export function meHolidayAdd(holidaysArray, personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) {
    console.warn('Invalid holiday parameters');
    return false;
  }

  // Check if holiday already exists
  const existing = holidaysArray.find(h => h.personId === personId && h.date === date);
  if (existing) {
    existing.type = type;
    return true;
  }

  const holiday = {
    id: meUUID(),
    personId: personId,
    date: date,
    type: type,
    createdAt: new Date().toISOString()
  };

  holidaysArray.push(holiday);
  return true;
}

/**
 * Update a holiday
 * @param {Array} holidaysArray
 * @param {string} personId
 * @param {string} date YYYY-MM-DD
 * @param {string} newType 'full', 'half', or null (to remove)
 */
export function meHolidayUpdate(holidaysArray, personId, date, newType) {
  const holiday = holidaysArray.find(h => h.personId === personId && h.date === date);

  if (!holiday) {
    if (newType) {
      return meHolidayAdd(holidaysArray, personId, date, newType);
    }
    return false;
  }

  if (!newType) {
    return meHolidayDelete(holidaysArray, personId, date);
  }

  if (!['full', 'half'].includes(newType)) {
    return false;
  }

  holiday.type = newType;
  return true;
}

/**
 * Delete a holiday
 * @param {Array} holidaysArray
 * @param {string} personId
 * @param {string} date YYYY-MM-DD
 */
export function meHolidayDelete(holidaysArray, personId, date) {
  const idx = holidaysArray.findIndex(h => h.personId === personId && h.date === date);
  if (idx === -1) return false;

  holidaysArray.splice(idx, 1);
  return true;
}

/**
 * Toggle holiday state: none → full → half → remove
 * @param {Array} holidaysArray
 * @param {string} personId
 * @param {string} date YYYY-MM-DD
 */
export function meHolidayToggle(holidaysArray, personId, date) {
  const holiday = holidaysArray.find(h => h.personId === personId && h.date === date);

  if (!holiday) {
    // Add as full day
    return meHolidayAdd(holidaysArray, personId, date, 'full');
  }

  if (holiday.type === 'full') {
    // Switch to half day
    holiday.type = 'half';
    return true;
  }

  // Remove
  return meHolidayDelete(holidaysArray, personId, date);
}

/**
 * Get holidays for a person
 * @param {Array} holidaysArray
 * @param {string} personId
 * @returns {Array}
 */
export function meHolidayGetByPerson(holidaysArray, personId) {
  return holidaysArray.filter(h => h.personId === personId);
}

/**
 * Get holidays for a specific date
 * @param {Array} holidaysArray
 * @param {string} date YYYY-MM-DD
 * @returns {Array}
 */
export function meHolidayGetByDate(holidaysArray, date) {
  return holidaysArray.filter(h => h.date === date);
}

/**
 * Get 90-day holiday window starting from today
 * @param {Array} holidaysArray
 * @param {number} days Number of days (default 90)
 * @returns {Array}
 */
export function meHolidayGet90DayWindow(holidaysArray, days = 90) {
  const today = new Date();
  const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const todayStr = formatDate(today);
  const endStr = formatDate(endDate);

  return holidaysArray.filter(h => h.date >= todayStr && h.date <= endStr);
}

/**
 * Check if a specific date is a bank holiday
 * @param {string} date YYYY-MM-DD
 * @returns {boolean}
 */
export function meIsUKBankHoliday(date) {
  const year = parseInt(date.split('-')[0]);
  return isBankHoliday(date, year);
}

/**
 * Get all bank holidays for a given year
 * @param {number} year
 * @returns {Object}
 */
export function meGetAllBankHolidays(year) {
  return getUKBankHolidays(year);
}

/**
 * Get Easter date for a year
 * @param {number} year
 * @returns {Date}
 */
export function meGetEasterDate(year) {
  return computeEasterDate(year);
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

/**
 * Generate UUID or fallback
 * @returns {string}
 */
function meUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
