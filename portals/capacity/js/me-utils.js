/* ============================================================
   me-utils.js — Shared Utility Functions
   ============================================================ */

// ── HTML Escape ────────────────────────────────────────────
window.escapeHtml = function(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// ── Utilisation Color Mapping ────────────────────────────
window.getUtilisationColor = function(percent) {
  // Returns CSS color variable name based on utilisation %
  // Green: <80%, Amber: 80–100%, Red: >100%
  if (percent < 80) return 'var(--green)';
  if (percent < 100) return 'var(--amber)';
  return 'var(--red)';
};

// ── Number Formatting ────────────────────────────────────
window.formatPercent = function(num, decimals = 0) {
  if (isNaN(num)) return '0%';
  return num.toFixed(decimals) + '%';
};

window.formatHours = function(num, decimals = 1) {
  if (isNaN(num)) return '0h';
  return num.toFixed(decimals) + 'h';
};

// ── Date Formatting ────────────────────────────────────────
window.formatDate = function(date, format = 'YYYY-MM-DD') {
  if (!date || !(date instanceof Date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
  if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
  if (format === 'DD/MM') return `${d}/${m}`;
  return `${y}-${m}-${d}`;
};

window.getMonthLabel = function(monthKey) {
  // Format 'YYYY-MM' as ['MMM', 'YYYY'] for display
  if (!monthKey || typeof monthKey !== 'string') return ['', ''];
  const [year, month] = monthKey.split('-');
  if (!year || !month) return ['', ''];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(month, 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) return ['', ''];
  return [monthNames[monthIndex], year];
};

// ── Month Navigation Utilities ────────────────────────────
window.parseMonth = function(monthKey) {
  // Extract {year, month} from 'YYYY-MM'
  if (!monthKey || typeof monthKey !== 'string') return { year: null, month: null };
  const [year, month] = monthKey.split('-');
  return { year: parseInt(year, 10), month: parseInt(month, 10) };
};

window.addMonths = function(monthKey, count) {
  // Return new monthKey after adding count months
  const { year, month } = parseMonth(monthKey);
  if (year === null || month === null) return monthKey;

  let newMonth = month + count;
  let newYear = year;

  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

window.subtractMonths = function(monthKey, count) {
  // Return new monthKey after subtracting count months
  return addMonths(monthKey, -count);
};

window.getCurrentMonth = function() {
  // Return 'YYYY-MM' string for today
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// ── Month Range Generation ────────────────────────────────
window.getMonthRange = function(startMonthKey, count) {
  // Generate array of monthKeys starting from startMonthKey
  const result = [];
  let current = startMonthKey;
  for (let i = 0; i < count; i++) {
    result.push(current);
    current = addMonths(current, 1);
  }
  return result;
};

// ── Work Days Calculation ────────────────────────────────
window.countWorkDaysInMonth = function(year, month) {
  // Count weekdays (Mon–Fri) in a given month
  let count = 0;
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
  }

  return count;
};

window.countWorkDaysBetween = function(startDate, endDate) {
  // Count weekdays (Mon–Fri) between two dates (inclusive)
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

// ── Bank Holidays (UK) ────────────────────────────────────
window.getBankHolidaysForYear = function(year) {
  // Return UK bank holidays for a given year
  // With caching to avoid recalculation
  
  if (!window.meBankHolidaysCache) {
    window.meBankHolidaysCache = {};
  }

  if (window.meBankHolidaysCache[year]) {
    return window.meBankHolidaysCache[year];
  }

  // Easter algorithm (Computus)
  const computusEaster = (y) => {
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
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
    return new Date(y, month - 1, day);
  };

  const easterDate = computusEaster(year);
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);

  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);

  // Calculate movable bank holidays correctly
  // Early May: First Monday in May
  const earlyMay = new Date(year, 4, 1); // May 1st
  const earlyMayDay = earlyMay.getDay();
  const daysUntilMonday = earlyMayDay === 1 ? 0 : (8 - earlyMayDay) % 7;
  earlyMay.setDate(earlyMay.getDate() + daysUntilMonday);

  // Spring: Last Monday in May
  const springBank = new Date(year, 4, 31); // May 31st
  const springDay = springBank.getDay();
  const daysBackToMonday = springDay === 1 ? 0 : springDay - 1;
  springBank.setDate(springBank.getDate() - daysBackToMonday);

  // Summer: Last Monday in August
  const summerBank = new Date(year, 7, 31); // August 31st
  const summerDay = summerBank.getDay();
  const daysBackToMonday = summerDay === 1 ? 0 : summerDay - 1;
  summerBank.setDate(summerBank.getDate() - daysBackToMonday);

  // Handle weekend Christmas/Boxing Day substitution
  let christmasDay = new Date(year, 11, 25);
  let boxingDay = new Date(year, 11, 26);
  
  // If Christmas is Saturday, substitute Monday
  if (christmasDay.getDay() === 6) {
    christmasDay = new Date(year, 11, 27);
    boxingDay = new Date(year, 11, 28);
  }
  // If Christmas is Sunday, substitute Monday/Tuesday
  if (christmasDay.getDay() === 0) {
    christmasDay = new Date(year, 11, 26);
    boxingDay = new Date(year, 11, 27);
  }
  // If Boxing Day is Saturday, substitute Monday
  if (boxingDay.getDay() === 6 && christmasDay.getDay() !== 0) {
    boxingDay = new Date(year, 11, 28);
  }
  // If Boxing Day is Sunday, substitute Tuesday
  if (boxingDay.getDay() === 0) {
    boxingDay = new Date(year, 11, 28);
  }

  const holidays = [
    { date: `${year}-01-01`, name: 'New Year\'s Day' },
    { date: `${year}-${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`, name: 'Good Friday' },
    { date: `${year}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`, name: 'Easter Monday' },
    { date: `${year}-${String(earlyMay.getMonth() + 1).padStart(2, '0')}-${String(earlyMay.getDate()).padStart(2, '0')}`, name: 'Early May Bank Holiday' },
    { date: `${year}-${String(springBank.getMonth() + 1).padStart(2, '0')}-${String(springBank.getDate()).padStart(2, '0')}`, name: 'Spring Bank Holiday' },
    { date: `${year}-${String(summerBank.getMonth() + 1).padStart(2, '0')}-${String(summerBank.getDate()).padStart(2, '0')}`, name: 'Summer Bank Holiday' },
    { date: `${year}-${String(christmasDay.getMonth() + 1).padStart(2, '0')}-${String(christmasDay.getDate()).padStart(2, '0')}`, name: 'Christmas Day' },
    { date: `${year}-${String(boxingDay.getMonth() + 1).padStart(2, '0')}-${String(boxingDay.getDate()).padStart(2, '0')}`, name: 'Boxing Day' }
  ];

  window.meBankHolidaysCache[year] = holidays;
  return holidays;
};
