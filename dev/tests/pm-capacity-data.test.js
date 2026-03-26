/**
 * pm-capacity-data.test.js — Tests for portals/capacity/project-management/js/pm-capacity-data.js
 *
 * Covers: pmCapacityData.getTasks(), getTeam(), getProducts()
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock isolated PM data functions (dependencies)
// ─────────────────────────────────────────────────────────────

const PM_TASKS = [
  { id: 't2', name: 'Milestone Review', department: 'PM' },
  { id: 't3', name: 'Budget Planning', department: 'PM' },
];

const PM_TEAM = [
  { id: 'm2', name: 'Bob',   department: 'PM' },
];

const PM_PRODUCTS = [
  { id: 'p2', name: 'Widget B', department: 'PM' },
];

global.pmDataGetTasks = jest.fn(() => PM_TASKS);
global.pmDataGetTeam = jest.fn(() => PM_TEAM);
global.pmDataGetProducts = jest.fn(() => PM_PRODUCTS);

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
  global.pmDataGetTasks.mockReturnValue(PM_TASKS);
  global.pmDataGetTeam.mockReturnValue(PM_TEAM);
  global.pmDataGetProducts.mockReturnValue(PM_PRODUCTS);
});

describe('pmCapacityData.getTasks()', () => {
  it('returns only PM-tagged tasks', () => {
    const result = window.pmCapacityData.getTasks();
    expect(result.every(t => t.department === 'PM')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when pmDataGetTasks is not a function', () => {
    global.pmDataGetTasks = undefined;
    const result = window.pmCapacityData.getTasks();
    expect(result).toEqual([]);
    global.pmDataGetTasks = jest.fn(() => PM_TASKS);
  });
});

describe('pmCapacityData.getTeam()', () => {
  it('returns PM team members when PM members exist', () => {
    const result = window.pmCapacityData.getTeam();
    expect(result.every(m => m.department === 'PM')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
  });

  it('returns the isolated PM team as-is', () => {
    global.pmDataGetTeam.mockReturnValue([
      { id: 'm4', name: 'Sam', department: 'PM' },
    ]);
    const result = window.pmCapacityData.getTeam();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sam');
  });

  it('returns empty array when pmDataGetTeam is not a function', () => {
    global.pmDataGetTeam = undefined;
    const result = window.pmCapacityData.getTeam();
    expect(result).toEqual([]);
    global.pmDataGetTeam = jest.fn(() => PM_TEAM);
  });
});

describe('pmCapacityData.getProducts()', () => {
  it('returns PM products when PM products exist', () => {
    const result = window.pmCapacityData.getProducts();
    expect(result.every(p => p.department === 'PM')).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget B');
  });

  it('returns the isolated PM products as-is', () => {
    global.pmDataGetProducts.mockReturnValue([
      { id: 'p9', name: 'Widget C', department: 'PM' },
    ]);
    const result = window.pmCapacityData.getProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget C');
  });

  it('returns empty array when pmDataGetProducts is not a function', () => {
    global.pmDataGetProducts = undefined;
    const result = window.pmCapacityData.getProducts();
    expect(result).toEqual([]);
    global.pmDataGetProducts = jest.fn(() => PM_PRODUCTS);
  });
});
