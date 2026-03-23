/**
 * log-capacity.test.js — Tests for portals/capacity/logistics/js/log-capacity.js
 *
 * Covers: LOG capacity render, department filtering, tab switching, debounced save behavior.
 */

const fs = require('fs');
const path = require('path');

const TEAM_FIXTURE = [
  { id: 'm1', name: 'Log A', department: 'LOG' },
  { id: 'm2', name: 'Me A', department: 'ME' },
];

const TASKS_FIXTURE = [
  { id: 't1', task: 'Log Task', department: 'LOG' },
  { id: 't2', task: 'Me Task', department: 'ME' },
];

const PRODUCTS_FIXTURE = [
  { id: 'p1', product: 'Log Product', department: 'LOG' },
  { id: 'p2', product: 'Me Product', department: 'ME' },
];

const HOLIDAYS_FIXTURE = [
  { id: 'h1', date: '2026-01-01', department: 'LOG' },
  { id: 'h2', date: '2026-01-02', department: 'ME' },
];

global.render = jest.fn();
global.currentSection = 'capacity';
global.capacityTab = 'logistics';
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

global.meRenderTeamTab = jest.fn(() => '<div>LOG Team Tab</div>');
global.meRenderTasksTab = jest.fn(() => '<div>LOG Tasks Tab</div>');
global.meRenderProductsTab = jest.fn(() => '<div>LOG Products Tab</div>');
global.meRenderProductTaskLoadTab = jest.fn(() => '<div>LOG Product Load Tab</div>');
global.meRenderHolidaysTab = jest.fn(() => '<div>LOG Holidays Tab</div>');
global.meRenderChartTab = jest.fn(() => '<div>LOG Chart Tab</div>');
global.meDrawChartNow = jest.fn();
global.meDrawHeatmapNow = jest.fn();

const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/logistics/js/log-capacity.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = '';
  global.currentSection = 'capacity';
  global.capacityTab = 'logistics';

  global.meDataGetTeam.mockReturnValue(TEAM_FIXTURE);
  global.meDataGetTasks.mockReturnValue(TASKS_FIXTURE);
  global.meDataGetProducts.mockReturnValue(PRODUCTS_FIXTURE);
  global.meDataGetHolidays.mockReturnValue(HOLIDAYS_FIXTURE);

  global.meFilterByDepartment = jest.fn((list, dept) => {
    if (!Array.isArray(list)) return [];
    return list.filter(item => (item.department || '').toUpperCase() === dept);
  });

  window.logSetTab('chart');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('logRenderCapacity()', () => {
  it('returns logistics shell HTML and sets LOG context', () => {
    const html = window.logRenderCapacity();

    expect(typeof html).toBe('string');
    expect(html).toContain('Logistics Load Capacity');
    expect(html).toContain('data-cap-action="cap-log-set-tab"');
    expect(window.meCurrentDepartmentContext).toBe('LOG');
  });

  it('draws chart and heatmap when chart tab is active', () => {
    window.logRenderCapacity();
    jest.advanceTimersByTime(110);

    expect(global.meDrawChartNow).toHaveBeenCalled();
    expect(global.meDrawHeatmapNow).toHaveBeenCalled();
  });
});

describe('logSetTab()', () => {
  it('switches to team tab and renders LOG-filtered data', () => {
    document.body.innerHTML = `
      <div class="log-shell">
        <button class="me-nav-btn" data-tab="team"></button>
      </div>
      <div id="logBody"></div>
    `;

    window.logSetTab('team');

    expect(global.writeNavigationHistory).toHaveBeenCalledWith('#s=capacity&ct=logistics&lgt=team', { push: true });
    expect(global.meRenderTeamTab).toHaveBeenCalledWith([
      { id: 'm1', name: 'Log A', department: 'LOG' },
    ]);

    const body = document.getElementById('logBody');
    expect(body.innerHTML).toContain('LOG Team Tab');
    expect(window.meCurrentDepartmentContext).toBe('LOG');
  });

  it('falls back safely when meFilterByDepartment is unavailable', () => {
    global.meFilterByDepartment = undefined;

    document.body.innerHTML = '<div id="logBody"></div>';
    window.logSetTab('team');

    expect(global.meRenderTeamTab).toHaveBeenCalledWith(TEAM_FIXTURE);
  });
});

describe('logDebouncedSave()', () => {
  it('saves and avoids rerender when chart tab is active', async () => {
    const refreshSpy = jest.spyOn(window, 'logRefreshCurrentTab');
    window.logPendingRerender = false;
    window.logSetTab('chart');

    window.logDebouncedSave();
    jest.advanceTimersByTime(900);
    await Promise.resolve();

    expect(global.meDataSave).toHaveBeenCalledWith(false);
    expect(window.logPendingRerender).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
