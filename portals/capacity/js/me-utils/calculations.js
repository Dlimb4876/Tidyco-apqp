// ME Capacity Planning - Calculations Engine

import { getMonthStartEnd, getWorkingDaysInMonth, isWeekend, getUKBankHolidays } from './dates.js';

/**
 * Calculate monthly capacity and demand breakdown
 * @param {string} monthKey ISO month string (e.g., '2025-03')
 * @param {Array} teamArray Team members array
 * @param {Array} tasksArray Tasks array
 * @param {Array} productsArray Products array
 * @param {Array} holidaysArray User-marked holidays array
 * @returns {Object} {capacity, totalDemand, npi, improvement, tendering, support, other}
 */
export function meGetMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const bankHols = getUKBankHolidays(parseInt(monthKey.split('-')[0]));

  const capacity = meCalculateTeamCapacity(monthKey, teamArray, holidaysArray, bankHols);
  const { npi, improvement, tendering, support, other } = meCalculateTaskDemand(monthKey, tasksArray);
  const productSupport = meCalculateProductDemand(monthKey, productsArray);

  return {
    capacity,
    npi,
    improvement,
    tendering,
    support: support + productSupport,
    other,
    totalDemand: npi + improvement + tendering + support + productSupport + other,
    utilisation: capacity > 0 ? Math.round((npi + improvement + tendering + support + productSupport + other) / capacity * 100) : 0
  };
}

/**
 * Calculate available team capacity for the month
 * Subtracts holidays and bank holidays
 * @param {string} monthKey
 * @param {Array} teamArray
 * @param {Array} holidaysArray User-marked holidays
 * @param {Object} bankHolidaysMap Bank holidays map
 * @returns {number} Total hours available
 */
export function meCalculateTeamCapacity(monthKey, teamArray, holidaysArray, bankHolidaysMap) {
  const [year, month] = monthKey.split('-').map(Number);
  const { start, end } = getMonthStartEnd(monthKey);
  const workDaysInMonth = getWorkingDaysInMonth(year, month);
  const hoursPerDay = 7.5; // 37.5 / 5

  // Base capacity: sum all team members' effective hours per month
  let baseCapacity = 0;
  teamArray.forEach(member => {
    const hoursPerWeek = member.hoursPerWeek || 37.5;
    const utilisation = (member.utilisation || 80) / 100;
    const effectiveHoursPerWeek = hoursPerWeek * utilisation;
    const weeks = workDaysInMonth / 5;
    baseCapacity += effectiveHoursPerWeek * weeks;
  });

  // Subtract user-marked holidays
  let holidayDeduction = 0;
  holidaysArray.forEach(holiday => {
    if (holiday.date >= monthKey + '-01' && holiday.date < monthKey + '-32') {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  // Subtract bank holidays (Mon-Fri only)
  let bankHolidayDeduction = 0;
  Object.entries(bankHolidaysMap).forEach(([dateStr, name]) => {
    if (dateStr >= monthKey + '-01' && dateStr < monthKey + '-32' && !isWeekend(dateStr)) {
      bankHolidayDeduction += hoursPerDay;
    }
  });

  return Math.max(0, baseCapacity - holidayDeduction - bankHolidayDeduction);
}

/**
 * Calculate demand from project tasks
 * Distributes task hours linearly across their date range
 * @param {string} monthKey
 * @param {Array} tasksArray
 * @returns {Object} {npi, improvement, tendering, support, other} hours
 */
export function meCalculateTaskDemand(monthKey, tasksArray) {
  const [year, month] = monthKey.split('-').map(Number);
  const { start, end } = getMonthStartEnd(monthKey);

  const result = { npi: 0, improvement: 0, tendering: 0, support: 0, other: 0 };

  tasksArray.forEach(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const totalDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;

    // Find overlap between task and month
    const overlapStart = new Date(Math.max(taskStart.getTime(), start.getTime()));
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), end.getTime()));

    if (overlapStart <= overlapEnd) {
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);

      const category = (task.category || 'other').toLowerCase();
      if (result.hasOwnProperty(category)) {
        result[category] += hoursThisMonth;
      } else {
        result.other += hoursThisMonth;
      }
    }
  });

  return result;
}

/**
 * Calculate ongoing product support load
 * Multiplies weekly hours by number of weeks in month
 * @param {string} monthKey
 * @param {Array} productsArray
 * @returns {number} Total support hours
 */
export function meCalculateProductDemand(monthKey, productsArray) {
  const [year, month] = monthKey.split('-').map(Number);
  const { start, end } = getMonthStartEnd(monthKey);

  let totalSupport = 0;

  productsArray.forEach(product => {
    const prodStart = new Date(product.supportFrom);
    const prodEnd = new Date(product.supportUntil);

    // Check if product is active in this month
    if (prodStart <= end && prodEnd >= start) {
      const weeks = (end - start) / (1000 * 60 * 60 * 24 * 7);
      totalSupport += (product.hoursPerWeek || 0) * weeks;
    }
  });

  return totalSupport;
}

/**
 * Calculate working weeks in a month
 * @param {string} monthKey
 * @returns {number} Working weeks (working days / 5)
 */
export function meWeeksOverlapInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const workDays = getWorkingDaysInMonth(year, month);
  return workDays / 5;
}
