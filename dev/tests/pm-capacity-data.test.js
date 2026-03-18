/**
 * pm-capacity-data.test.js — Tests for portals/capacity/project-management/js/pm-capacity-data.js
 *
 * Covers: pmCapacityData.getTasks(), getTeam(), getProducts()
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock me-data.js functions (dependencies)
// ─────────────────────────────────────────────────────────────

const ME_TASKS = [
  { id: 't1', name: 'Gate Review', department: 'ME' },
  { id: 't2', name: 'Milestone Review', department: 'PM' },
  { id: 't3', name: 'Budget Planning', department: 'PM' },
];

const ME_TEAM = [
  { id: 'm1', name: 'Alice', department: 'ME' },
  { id: 'm2', name: 'Bob',   department: 'PM' },
];

const ME_PRODUCTS = [
  { id: 'p1', name: 'Widget A', department: 'ME' },
  { id: 'p2', name: 'Widget B', department: 'PM' },
];

global.meDataGetTasks    = jest.fn(() => ME_TASKS);
global.meDataGetTeam     = jest.fn(() => ME_TEAM);
global.meDataGetProducts = jest.fn(() => ME_PRODUCTS);

global.meFilterByDepartment = jest.fn((list, dept) => {
  if (!Array.isArray(list)) return [];
  const target = (dept || 'ME').toString().trim().toUpperCase();
  return list.filter(item => {
    const d = ((item && item.department) || 'ME').toString().trim().toUpperCase();
    return d === target;
  });
});

// Load module
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/project-management/js/pm-capacity-data.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  global.meDataGetTasks.mockReturnValue(ME_TASKS);
  global.meDataGetTeam.mockReturnValue(ME_TEAM);
  global.meDataGetProducts.mockReturnValue(ME_PRODUCTS);
});

describe('pmCapacityData.getTasks()', () => {
  it('returns only PM-tagged tasks', () => {
    const result = window.pmCapacityData.getTasks();
    expect(result.every(t => t.department === 'PM')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when meDataGetTasks is not a function', () => {
    global.meDataGetTasks = undefined;
    const result = window.pmCapacityData.getTasks();
    expect(result).toEqual([]);
    global.meDataGetTasks = jest.fn(() => ME_TASKS);
  });

  it('returns all tasks when meFilterByDepartment is not available', () => {
    const origFilter = global.meFilterByDepartment;
    global.meFilterByDepartment = undefined;
    const result = window.pmCapacityData.getTasks();
    // Falls back to all tasks
    expect(result).toHaveLength(ME_TASKS.length);
    global.meFilterByDepartment = origFilter;
  });
});

describe('pmCapacityData.getTeam()', () => {
  it('returns PM team members when PM members exist', () => {
    const result = window.pmCapacityData.getTeam();
    expect(result.every(m => m.department === 'PM')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
  });

  it('falls back to full team when no PM members exist', () => {
    global.meDataGetTeam.mockReturnValue([
      { id: 'm1', name: 'Alice', department: 'ME' },
    ]);
    const result = window.pmCapacityData.getTeam();
    // No PM members → return all ME members
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('returns empty array when meDataGetTeam is not a function', () => {
    global.meDataGetTeam = undefined;
    const result = window.pmCapacityData.getTeam();
    expect(result).toEqual([]);
    global.meDataGetTeam = jest.fn(() => ME_TEAM);
  });
});

describe('pmCapacityData.getProducts()', () => {
  it('returns PM products when PM products exist', () => {
    const result = window.pmCapacityData.getProducts();
    expect(result.every(p => p.department === 'PM')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget B');
  });

  it('falls back to all products when no PM products exist', () => {
    global.meDataGetProducts.mockReturnValue([
      { id: 'p1', name: 'Widget A', department: 'ME' },
    ]);
    const result = window.pmCapacityData.getProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget A');
  });

  it('returns empty array when meDataGetProducts is not a function', () => {
    global.meDataGetProducts = undefined;
    const result = window.pmCapacityData.getProducts();
    expect(result).toEqual([]);
    global.meDataGetProducts = jest.fn(() => ME_PRODUCTS);
  });
});
