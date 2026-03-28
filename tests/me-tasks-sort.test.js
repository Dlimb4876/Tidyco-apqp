/**
 * me-tasks-sort.test.js — Tests for portals/capacity/shared/js/cap-tasks.js
 *
 * Covers: capTasksSortBy, capGetSortIcon, capRenderTasksTab
 *         (filtering, KPI calculations, sort icon logic)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// localStorage mock (jsdom provides it)

// Load module
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/shared/js/cap-tasks.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────

const SAMPLE_TASKS = [
  { id: 't1', name: 'Gate Review',       category: 'NPI',         assigneeId: 'm1', productId: 'p1', startDate: '2025-01-10', endDate: '2025-01-20', status: 'SCHEDULED', totalHours: 8,  isDisabled: false },
  { id: 't2', name: 'Jig Design',        category: 'Improvement', assigneeId: 'm2', productId: 'p1', startDate: '2025-02-01', endDate: '2025-02-15', status: 'STARTED',    totalHours: 16, isDisabled: true },
  { id: 't3', name: 'Supplier Audit',    category: 'NPI',         assigneeId: 'm1', productId: 'p2', startDate: '2025-03-01', endDate: '2025-03-05', status: 'COMPLETED',  totalHours: 4,  isDisabled: false },
  { id: 't4', name: 'Quote Estimation',  category: 'Tendering',   assigneeId: null, productId: null, startDate: '2025-04-01', endDate: '2025-04-10', status: 'SCHEDULED',  totalHours: 12, isDisabled: false },
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
  window.capTasksFilters.ME = { search: '', department: 'all', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: false };
  window.capTasksFilters.PM = { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: false };
  window.capTasksSort.ME = { column: '', direction: 'asc' };
  window.capTasksSort.PM = { column: '', direction: 'asc' };
  jest.clearAllMocks();
});

describe('capGetSortIcon()', () => {
  it('returns ↕ when column is not active sort', () => {
    window.capTasksSort.ME = { column: '', direction: 'asc' };
    expect(window.capGetSortIcon('name', 'ME')).toBe('↕');
  });

  it('returns ↑ when column is active sort in asc direction', () => {
    window.capTasksSort.ME = { column: 'name', direction: 'asc' };
    expect(window.capGetSortIcon('name', 'ME')).toBe('↑');
  });

  it('returns ↓ when column is active sort in desc direction', () => {
    window.capTasksSort.ME = { column: 'name', direction: 'desc' };
    expect(window.capGetSortIcon('name', 'ME')).toBe('↓');
  });

  it('uses PM sort state when PM department is requested', () => {
    window.capTasksSort.PM = { column: 'hours', direction: 'desc' };
    expect(window.capGetSortIcon('hours', 'PM')).toBe('↓');
  });
});

describe('capTasksSortBy()', () => {
  it('sets column and direction asc on first call', () => {
    window.capTasksSortBy('name', 'ME');
    expect(window.capTasksSort.ME.column).toBe('name');
    expect(window.capTasksSort.ME.direction).toBe('asc');
  });

  it('toggles direction to desc on second call for same column', () => {
    window.capTasksSortBy('name', 'ME');
    window.capTasksSortBy('name', 'ME');
    expect(window.capTasksSort.ME.direction).toBe('desc');
  });

  it('resets to asc when switching to a different column', () => {
    window.capTasksSort.ME = { column: 'name', direction: 'desc' };
    window.capTasksSortBy('category', 'ME');
    expect(window.capTasksSort.ME.column).toBe('category');
    expect(window.capTasksSort.ME.direction).toBe('asc');
  });
});

describe('capRenderTasksTab() — filtering', () => {
  it('returns all tasks with no filters', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Gate Review');
    expect(html).toContain('Jig Design');
    expect(html).toContain('Supplier Audit');
    expect(html).toContain('Quote Estimation');
  });

  it('filters by search term', () => {
    window.capTasksFilters.ME.search = 'Gate';
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Gate Review');
    expect(html).not.toContain('Jig Design');
  });

  it('filters by category', () => {
    window.capTasksFilters.ME.category = 'Tendering';
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Quote Estimation');
    expect(html).not.toContain('Gate Review');
  });

  it('filters by assignee', () => {
    window.capTasksFilters.ME.assignee = 'm2';
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Jig Design');
    expect(html).not.toContain('Gate Review');
  });

  it('hides completed tasks when hideCompleted is true', () => {
    window.capTasksFilters.ME.hideCompleted = true;
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).not.toContain('Supplier Audit');
    expect(html).toContain('Gate Review');
  });

  it('shows all tasks when hideCompleted is false', () => {
    window.capTasksFilters.ME.hideCompleted = false;
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Supplier Audit');
  });
});

describe('capRenderTasksTab() — KPI calculations', () => {
  it('shows correct total hours', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    // Total hours: 8 + 16 + 4 + 12 = 40
    expect(html).toContain('40.0');
  });

  it('shows correct task count', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    // 4 tasks
    expect(html).toContain('4 tasks');
  });

  it('shows unassigned count', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    // 1 unassigned (t4 has no assigneeId)
    expect(html).toContain('1');
    expect(html).toContain('Unassigned');
  });

  it('shows average hours per task', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    // avg = 40 / 4 = 10.0
    expect(html).toContain('10.0');
  });
});

describe('capRenderTasksTab() — HTML structure', () => {
  it('includes TASKS header', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('TASKS');
  });

  it('includes new-task top row with add action', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('cap-task-add');
    expect(html).toContain('data-cap-new-task');
  });

  it('includes search filter input', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('cap-task-search');
  });

  it('returns empty-state message when no tasks match filters', () => {
    window.capTasksFilters.ME.search = 'nonexistent_task_xyz';
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('No tasks match the current filters');
  });

  it('shows disabled marker and checked disable checkbox for disabled tasks', () => {
    const html = window.capRenderTasksTab(SAMPLE_TASKS, SAMPLE_TEAM, SAMPLE_PRODUCTS, 'ME', window.capTasksFilters.ME, window.capTasksSort.ME, true);
    expect(html).toContain('Disabled from calculations');
    expect(html).toContain('data-cap-action="cap-task-toggle-disabled" checked');
    expect(html).toContain('>Disable</th>');
  });
});
