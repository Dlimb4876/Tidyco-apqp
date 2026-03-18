/**
 * me-data-core.test.js — Tests for portals/capacity/js/me-data.js
 *                        and portals/capacity/js/me-data-relational.js
 *                        and portals/capacity/js/me-holidays.js
 *
 * Covers pure utility functions:
 *   meNormalizeDepartmentTag (via meFilterByDepartment)
 *   meFilterByDepartment, meGetDepartmentFromContext
 *   meFormatDate, meGetMonthLabel
 *   meNormalizeIsoDate, meNormalizeDateRange (from me-data-relational.js)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.meUUID = () => 'mock-uuid-' + Math.random().toString(36).slice(2);
global.capacityTab = 'team';  // not 'projects', so default department is ME

// Mock getBankHolidaysForYear and getMonthLabel (from bank-holidays and helpers)
global.getBankHolidaysForYear = jest.fn(() => [
  { date: '2025-01-01', title: "New Year's Day" },
  { date: '2025-12-25', title: 'Christmas Day' },
]);
global.getMonthLabel = jest.fn((monthKey) => {
  const [year, month] = monthKey.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return [months[parseInt(month) - 1], year];
});

// Load me-data.js (contains meFilterByDepartment, meGetDepartmentFromContext)
const meDataSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-data.js'),
  'utf8'
);
eval(meDataSrc); // eslint-disable-line no-eval

// Load me-data-relational.js (contains meNormalizeIsoDate, meNormalizeDateRange)
const meDataRelSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-data-relational.js'),
  'utf8'
);
eval(meDataRelSrc); // eslint-disable-line no-eval

// Load me-holidays.js (contains meFormatDate, meGetMonthLabel)
const meHolSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-holidays.js'),
  'utf8'
);
eval(meHolSrc); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests — meFilterByDepartment (me-data.js)
// ─────────────────────────────────────────────────────────────

describe('meFilterByDepartment()', () => {
  const items = [
    { name: 'Alice', department: 'ME' },
    { name: 'Bob',   department: 'PM' },
    { name: 'Carol', department: 'me' }, // lowercase — should normalise
    { name: 'Dave',  department: null },  // missing — defaults to ME
  ];

  it('filters to ME department', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Alice');
    expect(result.map(r => r.name)).not.toContain('Bob');
  });

  it('filters to PM department', () => {
    const result = window.meFilterByDepartment(items, 'PM');
    expect(result.map(r => r.name)).toContain('Bob');
    expect(result.map(r => r.name)).not.toContain('Alice');
  });

  it('treats lowercase department values as normalised', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Carol');
  });

  it('treats null department as ME (default fallback)', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Dave');
  });

  it('returns empty array for non-array input', () => {
    expect(window.meFilterByDepartment(null, 'ME')).toEqual([]);
    expect(window.meFilterByDepartment(undefined, 'ME')).toEqual([]);
  });

  it('returns empty array when list is empty', () => {
    expect(window.meFilterByDepartment([], 'ME')).toEqual([]);
  });
});

describe('meGetDepartmentFromContext()', () => {
  it('returns explicit department when provided', () => {
    expect(window.meGetDepartmentFromContext('PM')).toBe('PM');
    expect(window.meGetDepartmentFromContext('ME')).toBe('ME');
  });

  it('normalises lowercase input', () => {
    expect(window.meGetDepartmentFromContext('pm')).toBe('PM');
    expect(window.meGetDepartmentFromContext('me')).toBe('ME');
  });

  it('returns ME by default when no argument and no context', () => {
    window.meCurrentDepartmentContext = '';
    global.capacityTab = 'team';
    expect(window.meGetDepartmentFromContext()).toBe('ME');
  });

  it('returns PM when capacityTab is "projects"', () => {
    window.meCurrentDepartmentContext = '';
    global.capacityTab = 'projects';
    expect(window.meGetDepartmentFromContext()).toBe('PM');
    global.capacityTab = 'team'; // restore
  });

  it('returns context department when meCurrentDepartmentContext is set', () => {
    window.meCurrentDepartmentContext = 'PM';
    expect(window.meGetDepartmentFromContext()).toBe('PM');
    window.meCurrentDepartmentContext = '';
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — meNormalizeIsoDate, meNormalizeDateRange (me-data-relational.js)
// ─────────────────────────────────────────────────────────────

describe('meNormalizeIsoDate()', () => {
  it('returns a valid ISO date string for a date string input', () => {
    const result = meNormalizeIsoDate('2025-06-15', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-06-15');
  });

  it('returns fallback when dateValue is null', () => {
    const result = meNormalizeIsoDate(null, '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-01-01');
  });

  it('returns fallback for invalid date string', () => {
    const result = meNormalizeIsoDate('not-a-date', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-01-01');
  });

  it('returns fallback for empty string', () => {
    const result = meNormalizeIsoDate('', '2025-03-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-03-01');
  });

  it('normalises ISO datetime to date-only', () => {
    const result = meNormalizeIsoDate('2025-06-15T10:30:00Z', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-06-15');
  });
});

describe('meNormalizeDateRange()', () => {
  const fallback = '2025-01-01';

  it('returns valid start and end dates unchanged', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange('2025-03-01', '2025-06-01', fallback); // eslint-disable-line no-undef
    expect(safeStart).toBe('2025-03-01');
    expect(safeEnd).toBe('2025-06-01');
  });

  it('clamps end to start when end is before start', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange('2025-06-01', '2025-03-01', fallback); // eslint-disable-line no-undef
    expect(safeEnd).toBe(safeStart);
  });

  it('uses fallback for null dates', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange(null, null, fallback); // eslint-disable-line no-undef
    expect(safeStart).toBe(fallback);
    expect(safeEnd).toBe(fallback);
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — meFormatDate, meGetMonthLabel (me-holidays.js)
// ─────────────────────────────────────────────────────────────

describe('meFormatDate()', () => {
  it('formats a Date object as YYYY-MM-DD', () => {
    const d = new Date(2025, 5, 15); // June 15, 2025
    expect(window.meFormatDate(d)).toBe('2025-06-15');
  });

  it('pads month and day with leading zeros', () => {
    const d = new Date(2025, 0, 5); // Jan 5, 2025
    expect(window.meFormatDate(d)).toBe('2025-01-05');
  });

  it('returns empty string for null input', () => {
    expect(window.meFormatDate(null)).toBe('');
  });

  it('returns empty string for non-Date input', () => {
    expect(window.meFormatDate('2025-01-01')).toBe('');
    expect(window.meFormatDate(undefined)).toBe('');
  });
});

describe('meGetMonthLabel()', () => {
  it('returns formatted month label from getMonthLabel', () => {
    const label = window.meGetMonthLabel('2025-06');
    expect(label).toBe('Jun 2025');
  });

  it('returns monthKey when getMonthLabel returns non-array', () => {
    global.getMonthLabel = jest.fn(() => 'June 2025'); // not an array
    const label = window.meGetMonthLabel('2025-06');
    expect(label).toBe('2025-06');
    // restore
    global.getMonthLabel = jest.fn((monthKey) => {
      const [year, month] = monthKey.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return [months[parseInt(month) - 1], year];
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — getTodayDateString (me-data-relational.js)
// ─────────────────────────────────────────────────────────────

describe('getTodayDateString()', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const result = getTodayDateString(); // eslint-disable-line no-undef
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getTodayDateString()).toBe(today); // eslint-disable-line no-undef
  });
});
