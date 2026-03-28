/**
 * log-capacity.test.js — Tests for portals/capacity/logistics/js/log-capacity.js
 *
 * Covers: LOG capacity render, isolated data loading, tab switching, debounced save behavior.
 */

const fs = require('fs');
const path = require('path');

const TEAM_FIXTURE = [{ id: 'm1', name: 'Log A', department: 'LOG' }];

const TASKS_FIXTURE = [{ id: 't1', task: 'Log Task', department: 'LOG' }];

const PRODUCTS_FIXTURE = [{ id: 'p1', product: 'Log Product', department: 'LOG' }];

const HOLIDAYS_FIXTURE = [{ id: 'h1', date: '2026-01-01', department: 'LOG' }];

global.render = jest.fn();
global.currentSection = 'capacity';
global.capacityTab = 'logistics';
global.writeNavigationHistory = jest.fn();
global.logDataSave = jest.fn(() => Promise.resolve());
global.isEditingInlineCell = jest.fn(() => false);
global.logDataInitialized = true;
global.canEdit = jest.fn(() => true);

global.logDataGetTeam = jest.fn(() => TEAM_FIXTURE);
global.logDataGetTasks = jest.fn(() => TASKS_FIXTURE);
global.logDataGetProducts = jest.fn(() => PRODUCTS_FIXTURE);
global.logDataGetHolidays = jest.fn(() => HOLIDAYS_FIXTURE);
global.logDataAutoSyncLogProducts = jest.fn(() => false);

global.capRenderTeamTab = jest.fn(() => '<div>LOG Team Tab</div>');
global.capRenderTasksTab = jest.fn(() => '<div>LOG Tasks Tab</div>');
global.capRenderProductsTab = jest.fn(() => '<div>LOG Products Tab</div>');
global.capRenderProductTaskLoadTab = jest.fn(() => '<div>LOG Product Load Tab</div>');
global.capRenderHolidaysTab = jest.fn(() => '<div>LOG Holidays Tab</div>');
global.capRenderChartTab = jest.fn(() => '<div>LOG Chart Tab</div>');
global.capDrawChartNow = jest.fn();
global.capDrawHeatmapNow = jest.fn();

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

  global.logDataGetTeam.mockReturnValue(TEAM_FIXTURE);
  global.logDataGetTasks.mockReturnValue(TASKS_FIXTURE);
  global.logDataGetProducts.mockReturnValue(PRODUCTS_FIXTURE);
  global.logDataGetHolidays.mockReturnValue(HOLIDAYS_FIXTURE);
  global.logDataAutoSyncLogProducts.mockReturnValue(false);

  window.logSetTab('chart');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('logRenderCapacity()', () => {
  it('returns logistics shell HTML without writing legacy context', () => {
    const html = window.logRenderCapacity();

    expect(typeof html).toBe('string');
    expect(html).toContain('Logistics Load Capacity');
    expect(html).toContain('data-cap-action="cap-log-set-tab"');
  });

  it('draws chart and heatmap when chart tab is active', () => {
    window.logRenderCapacity();
    jest.advanceTimersByTime(110);

    expect(global.capDrawChartNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'LOG'
    );
    expect(global.capDrawHeatmapNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'LOG'
    );
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
    expect(global.capRenderTeamTab).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'LOG',
      true
    );

    const body = document.getElementById('logBody');
    expect(body.innerHTML).toContain('LOG Team Tab');
  });

  it('falls back safely when log data getters are unavailable', () => {
    global.logDataGetTeam = undefined;

    document.body.innerHTML = '<div id="logBody"></div>';
    window.logSetTab('team');

    expect(global.capRenderTeamTab).toHaveBeenCalledWith(
      [],
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'LOG',
      true
    );
    global.logDataGetTeam = jest.fn(() => TEAM_FIXTURE);
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

    expect(global.logDataSave).toHaveBeenCalledWith(false);
    expect(window.logPendingRerender).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
