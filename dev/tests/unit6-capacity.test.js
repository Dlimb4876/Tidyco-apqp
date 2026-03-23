/**
 * unit6-capacity.test.js — Tests for portals/capacity/unit6/js/unit6-capacity.js
 *
 * Covers: UNIT6 capacity render, department filtering, tab switching, debounced save behavior.
 */

const fs = require('fs');
const path = require('path');

const TEAM_FIXTURE = [
  { id: 'm1', name: 'Unit6 A', department: 'UNIT6' },
  { id: 'm2', name: 'Me A', department: 'ME' },
];

const TASKS_FIXTURE = [
  { id: 't1', task: 'Unit6 Task', department: 'UNIT6' },
  { id: 't2', task: 'Me Task', department: 'ME' },
];

const PRODUCTS_FIXTURE = [
  { id: 'p1', product: 'Unit6 Product', department: 'UNIT6' },
  { id: 'p2', product: 'Me Product', department: 'ME' },
];

const HOLIDAYS_FIXTURE = [
  { id: 'h1', date: '2026-01-01', department: 'UNIT6' },
  { id: 'h2', date: '2026-01-02', department: 'ME' },
];

global.render = jest.fn();
global.currentSection = 'capacity';
global.capacityTab = 'unit6';
global.writeNavigationHistory = jest.fn();
global.meDataSave = jest.fn(() => Promise.resolve());
global.isEditingInlineCell = jest.fn(() => false);

global.meDataGetTeam = jest.fn(() => TEAM_FIXTURE);
global.meDataGetTasks = jest.fn(() => TASKS_FIXTURE);
global.meDataGetProducts = jest.fn(() => PRODUCTS_FIXTURE);
global.meDataGetHolidays = jest.fn(() => HOLIDAYS_FIXTURE);

global.meFilterByDepartment = jest.fn((list, dept) => {
  if (!Array.isArray(list)) return [];
  return list.filter(item => (item.department || '').toUpperCase() === dept);
});

global.meRenderTeamTab = jest.fn(() => '<div>UNIT6 Team Tab</div>');
global.meRenderTasksTab = jest.fn(() => '<div>UNIT6 Tasks Tab</div>');
global.meRenderProductsTab = jest.fn(() => '<div>UNIT6 Products Tab</div>');
global.meRenderProductTaskLoadTab = jest.fn(() => '<div>UNIT6 Product Load Tab</div>');
global.meRenderHolidaysTab = jest.fn(() => '<div>UNIT6 Holidays Tab</div>');
global.meRenderChartTab = jest.fn(() => '<div>UNIT6 Chart Tab</div>');
global.meDrawChartNow = jest.fn();
global.meDrawHeatmapNow = jest.fn();

const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/unit6/js/unit6-capacity.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = '';
  global.currentSection = 'capacity';
  global.capacityTab = 'unit6';

  global.meDataGetTeam.mockReturnValue(TEAM_FIXTURE);
  global.meDataGetTasks.mockReturnValue(TASKS_FIXTURE);
  global.meDataGetProducts.mockReturnValue(PRODUCTS_FIXTURE);
  global.meDataGetHolidays.mockReturnValue(HOLIDAYS_FIXTURE);

  global.meFilterByDepartment = jest.fn((list, dept) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => (item.department || '').toUpperCase() === dept);
  });

  window.unit6SetTab('chart');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('unit6RenderCapacity()', () => {
  it('returns Unit 6 shell HTML and sets UNIT6 context', () => {
    const html = window.unit6RenderCapacity();

    expect(typeof html).toBe('string');
    expect(html).toContain('Unit 6 Load Capacity');
    expect(html).toContain('data-cap-action="cap-unit6-set-tab"');
    expect(window.meCurrentDepartmentContext).toBe('UNIT6');
  });

  it('draws chart and heatmap when chart tab is active', () => {
    window.unit6RenderCapacity();
    jest.advanceTimersByTime(110);

    expect(global.meDrawChartNow).toHaveBeenCalled();
    expect(global.meDrawHeatmapNow).toHaveBeenCalled();
  });
});

describe('unit6SetTab()', () => {
  it('switches to team tab and renders UNIT6-filtered data', () => {
    document.body.innerHTML = `
      <div class="unit6-shell">
        <button class="me-nav-btn" data-tab="team"></button>
      </div>
      <div id="unit6Body"></div>
    `;

    window.unit6SetTab('team');

    expect(global.writeNavigationHistory).toHaveBeenCalledWith('#s=capacity&ct=unit6&u6t=team', { push: true });
    expect(global.meRenderTeamTab).toHaveBeenCalledWith([
      { id: 'm1', name: 'Unit6 A', department: 'UNIT6' },
    ]);

    const body = document.getElementById('unit6Body');
    expect(body.innerHTML).toContain('UNIT6 Team Tab');
    expect(window.meCurrentDepartmentContext).toBe('UNIT6');
  });

  it('falls back safely when meFilterByDepartment is unavailable', () => {
    global.meFilterByDepartment = undefined;

    document.body.innerHTML = '<div id="unit6Body"></div>';
    window.unit6SetTab('team');

    expect(global.meRenderTeamTab).toHaveBeenCalledWith(TEAM_FIXTURE);
  });
});

describe('unit6DebouncedSave()', () => {
  it('saves and avoids rerender when chart tab is active', async () => {
    const refreshSpy = jest.spyOn(window, 'unit6RefreshCurrentTab');
    window.unit6PendingRerender = false;
    window.unit6SetTab('chart');

    window.unit6DebouncedSave();
    jest.advanceTimersByTime(900);
    await Promise.resolve();

    expect(global.meDataSave).toHaveBeenCalledWith(false);
    expect(window.unit6PendingRerender).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
