/**
 * timing-core.test.js — Tests for portals/product-development/npi/js/timing.js
 *
 * Covers pure utility functions:
 *   npi.timing.ganttWeekDate, npi.timing.fmtWeekDate, npi.timing.buildMonthGroups
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// npi namespace must exist before the file is loaded
global.npi = {
  timing: {},
  data: {
    ganttNewRow: jest.fn(() => ({ id: 'row-1', planned: [], actual: [] })),
  },
  nav: {},
  bom: {},
  tracker: {},
  components: {},
};

global.GANTT_WEEKS = 52;
global.GANTT_SECTIONS = [
  { id: 'design', label: 'Design' },
  { id: 'build', label: 'Build' },
];
global.PLAN_COLOR = '#0066cc';
global.ACT_COLOR  = '#e53e3e';

global.prog  = jest.fn(() => ({ id: 'p1', gantt: [], ganttStart: '2025-01-06', ganttCollapsed: [], date: '2025-01-06' }));
global.save  = jest.fn();
global.render = jest.fn();

// Load timing.js
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/product-development/npi/js/timing.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('npi.timing.ganttWeekDate()', () => {
  it('returns null when startStr is falsy', () => {
    expect(npi.timing.ganttWeekDate(null, 0)).toBeNull();
    expect(npi.timing.ganttWeekDate('', 0)).toBeNull();
  });

  it('returns a Date for week index 0 (Monday of start week)', () => {
    // 2025-01-06 is a Monday
    const d = npi.timing.ganttWeekDate('2025-01-06', 0);
    expect(d).toBeInstanceOf(Date);
    expect(d.getDay()).toBe(1); // Monday
  });

  it('returns a Date 7 days later for week index 1', () => {
    const d0 = npi.timing.ganttWeekDate('2025-01-06', 0);
    const d1 = npi.timing.ganttWeekDate('2025-01-06', 1);
    const diffDays = (d1 - d0) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });

  it('snaps a Tuesday start date to Monday', () => {
    // 2025-01-07 is a Tuesday
    const d = npi.timing.ganttWeekDate('2025-01-07', 0);
    expect(d.getDay()).toBe(1); // Monday
  });

  it('snaps a Sunday start date to Monday', () => {
    // 2025-01-05 is a Sunday
    const d = npi.timing.ganttWeekDate('2025-01-05', 0);
    expect(d.getDay()).toBe(1);
  });

  it('advances by wi weeks from the snapped Monday', () => {
    const d3 = npi.timing.ganttWeekDate('2025-01-06', 3);
    // 2025-01-06 + 3 weeks = 2025-01-27
    expect(d3.toISOString().slice(0, 10)).toBe('2025-01-27');
  });
});

describe('npi.timing.fmtWeekDate()', () => {
  it('returns empty string for null input', () => {
    expect(npi.timing.fmtWeekDate(null)).toBe('');
  });

  it('returns a formatted date string for a Date', () => {
    const d = new Date(2025, 0, 6); // 6 Jan 2025
    const result = npi.timing.fmtWeekDate(d);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Jan');
  });

  it('uses en-GB locale (day first)', () => {
    const d = new Date(2025, 0, 6); // 6 Jan 2025
    const result = npi.timing.fmtWeekDate(d);
    expect(result).toMatch(/^\d{2} \w{3}$/); // "06 Jan"
  });
});

describe('npi.timing.buildMonthGroups()', () => {
  it('returns an array of month groups', () => {
    const groups = npi.timing.buildMonthGroups('2025-01-06', global.GANTT_WEEKS);
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
  });

  it('each group has label, mo, and weeks fields', () => {
    const groups = npi.timing.buildMonthGroups('2025-01-06', global.GANTT_WEEKS);
    groups.forEach(g => {
      expect(g).toHaveProperty('label');
      expect(g).toHaveProperty('mo');
      expect(g).toHaveProperty('weeks');
      expect(Array.isArray(g.weeks)).toBe(true);
    });
  });

  it('total weeks across all groups equals GANTT_WEEKS', () => {
    const groups = npi.timing.buildMonthGroups('2025-01-06', global.GANTT_WEEKS);
    const totalWeeks = groups.reduce((sum, g) => sum + g.weeks.length, 0);
    expect(totalWeeks).toBe(global.GANTT_WEEKS);
  });

  it('weeks within a group are consecutive integers', () => {
    const groups = npi.timing.buildMonthGroups('2025-01-06', global.GANTT_WEEKS);
    let expectedWeek = 0;
    groups.forEach(g => {
      g.weeks.forEach(w => {
        expect(w).toBe(expectedWeek++);
      });
    });
  });

  it('returns at least 12 groups for a 52-week period', () => {
    const groups = npi.timing.buildMonthGroups('2025-01-06', global.GANTT_WEEKS);
    expect(groups.length).toBeGreaterThanOrEqual(12);
  });

  it('returns a fallback label when startStr is missing', () => {
    const groups = npi.timing.buildMonthGroups(null, global.GANTT_WEEKS);
    // Should still return groups (with M1, M2 etc labels)
    expect(Array.isArray(groups)).toBe(true);
  });
});
