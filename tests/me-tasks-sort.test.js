/**
 * me-tasks-sort.test.js — Tests for portals/capacity/js/me-tasks.js
 *
 * Covers: meTasksSortBy, meGetSortIcon, meRenderTasksTab
 *         (filtering, KPI calculations, sort icon logic)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
global.meSetTab = jest.fn();
global.pmSetTab = jest.fn();
global.meOnSave = jest.fn();
global.meDebouncedSave = jest.fn();
global.pmDebouncedSave = jest.fn();
global.meDataAddTask = jest.fn();
global.meDataGetTasks = jest.fn();
global.meGetDepartmentFromContext = jest.fn(() => 'ME');

// localStorage mock (jsdom provides it)

// Load module
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-tasks.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────

const SAMPLE_TASKS = [
  { id: 't1', name: 'Gate Review',       category: 'NPI',         assigneeId: 'm1', productId: 'p1', startDate: '2025-01-10', endDate: '2025-01-20', status: 'SCHEDULED', totalHours: 8  },
  { id: 't2', name: 'Jig Design',        category: 'Improvement', assigneeId: 'm2', productId: 'p1', startDate: '2025-02-01', endDate: '2025-02-15', status: 'STARTED',    totalHours: 16 },
  { id: 't3', name: 'Supplier Audit',    category: 'NPI',         assigneeId: 'm1', productId: 'p2', startDate: '2025-03-01', endDate: '2025-03-05', status: 'COMPLETED',  totalHours: 4  },
  { id: 't4', name: 'Quote Estimation',  category: 'Tendering',   assigneeId: null, productId: null, startDate: '2025-04-01', endDate: '2025-04-10', status: 'SCHEDULED',  totalHours: 12 },
];

const SAMPLE_TEAM = [
  { id: 'm1', name: 'Alice' },
  { id: 'm2', name: 'Bob' },
];

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Widget A' },
  { id: 'p2', name: 'Widget B' },
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset filter and sort state before each test
  window.meTasksFilters = { search: '', department: 'all', category: 'all', assignee: 'all', product: 'all', hideCompleted: false };
  window.pmTasksFilters = { search: '', category: 'all', assignee: 'all', product: 'all', hideCompleted: false };
  window.meTasksSort = { column: '', direction: 'asc' };
  window.pmTasksSort = { column: '', direction: 'asc' };
  jest.clearAllMocks();
  global.meDataGetTasks.mockReturnValue(SAMPLE_TASKS);
});

describe('meGetSortIcon()', () => {
  it('returns ↕ when column is not active sort', () => {
    window.meTasksSort = { column: '', direction: 'asc' };
    expect(window.meGetSortIcon('name')).toBe('↕');
  });

  it('returns ↑ when column is active sort in asc direction', () => {
    window.meTasksSort = { column: 'name', direction: 'asc' };
    expect(window.meGetSortIcon('name')).toBe('↑');
  });

  it('returns ↓ when column is active sort in desc direction', () => {
    window.meTasksSort = { column: 'name', direction: 'desc' };
    expect(window.meGetSortIcon('name')).toBe('↓');
  });

  it('uses PM sort state when isPM is true', () => {
    window.pmTasksSort = { column: 'hours', direction: 'desc' };
    expect(window.meGetSortIcon('hours', true)).toBe('↓');
  });
});

describe('meTasksSortBy()', () => {
  it('sets column and direction asc on first call', () => {
    window.meTasksSortBy('name');
    expect(window.meTasksSort.column).toBe('name');
    expect(window.meTasksSort.direction).toBe('asc');
  });

  it('toggles direction to desc on second call for same column', () => {
    window.meTasksSortBy('name');
    window.meTasksSortBy('name');
    expect(window.meTasksSort.direction).toBe('desc');
  });

  it('resets to asc when switching to a different column', () => {
    window.meTasksSort = { column: 'name', direction: 'desc' };
    window.meTasksSortBy('category');
    expect(window.meTasksSort.column).toBe('category');
    expect(window.meTasksSort.direction).toBe('asc');
  });

  it('calls meSetTab("tasks") for ME context', () => {
    window.meTasksSortBy('name', false);
    expect(global.meSetTab).toHaveBeenCalledWith('tasks');
  });

  it('calls pmSetTab("tasks") for PM context', () => {
    window.meTasksSortBy('name', true);
    expect(global.pmSetTab).toHaveBeenCalledWith('tasks');
  });
});

describe('meRenderTasksTab() — filtering', () => {
  it('returns all tasks with no filters', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('Gate Review');
    expect(html).toContain('Jig Design');
    expect(html).toContain('Supplier Audit');
    expect(html).toContain('Quote Estimation');
  });

  it('filters by search term', () => {
    window.meTasksFilters.search = 'Gate';
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('Gate Review');
    expect(html).not.toContain('Jig Design');
  });

  it('filters by category', () => {
    window.meTasksFilters.category = 'Tendering';
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('Quote Estimation');
    expect(html).not.toContain('Gate Review');
  });

  it('filters by assignee', () => {
    window.meTasksFilters.assignee = 'm2';
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('Jig Design');
    expect(html).not.toContain('Gate Review');
  });

  it('hides completed tasks when hideCompleted is true', () => {
    window.meTasksFilters.hideCompleted = true;
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).not.toContain('Supplier Audit');
    expect(html).toContain('Gate Review');
  });

  it('shows all tasks when hideCompleted is false', () => {
    window.meTasksFilters.hideCompleted = false;
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('Supplier Audit');
  });
});

describe('meRenderTasksTab() — KPI calculations', () => {
  it('shows correct total hours', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    // Total hours: 8 + 16 + 4 + 12 = 40
    expect(html).toContain('40.0');
  });

  it('shows correct task count', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    // 4 tasks
    expect(html).toContain('4 tasks');
  });

  it('shows unassigned count', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    // 1 unassigned (t4 has no assigneeId)
    expect(html).toContain('1');
    expect(html).toContain('Unassigned');
  });

  it('shows average hours per task', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    // avg = 40 / 4 = 10.0
    expect(html).toContain('10.0');
  });
});

describe('meRenderTasksTab() — HTML structure', () => {
  it('includes TASKS header', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('TASKS');
  });

  it('includes Add Task button', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('cap-task-add');
  });

  it('includes search filter input', () => {
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('cap-task-search');
  });

  it('returns empty-state message when no tasks match filters', () => {
    window.meTasksFilters.search = 'nonexistent_task_xyz';
    const html = window.meRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS);
    expect(html).toContain('No tasks match the current filters');
  });
});
