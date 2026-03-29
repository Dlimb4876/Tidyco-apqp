/**
 * unit6-capacity.test.js — Tests for portals/capacity/unit6/js/unit6-capacity.js
 *
 * Covers: UNIT6 capacity render, isolated data loading, tab switching, debounced save behavior.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEAM_FIXTURE = [{ id: 'm1', name: 'Unit6 A', department: 'UNIT6' }];

const TASKS_FIXTURE = [{ id: 't1', task: 'Unit6 Task', department: 'UNIT6' }];

const PRODUCTS_FIXTURE = [{ id: 'p1', product: 'Unit6 Product', department: 'UNIT6' }];

const HOLIDAYS_FIXTURE = [{ id: 'h1', date: '2026-01-01', department: 'UNIT6' }];

global.render = jest.fn();
global.currentSection = 'capacity';
global.capacityTab = 'unit6';
global.writeNavigationHistory = jest.fn();
global.unit6DataSave = jest.fn(() => Promise.resolve());
global.isEditingInlineCell = jest.fn(() => false);
global.unit6DataInitialized = true;
global.canEdit = jest.fn(() => true);

global.unit6DataGetTeam = jest.fn(() => TEAM_FIXTURE);
global.unit6DataGetTasks = jest.fn(() => TASKS_FIXTURE);
global.unit6DataGetProducts = jest.fn(() => PRODUCTS_FIXTURE);
global.unit6DataGetHolidays = jest.fn(() => HOLIDAYS_FIXTURE);
global.unit6DataAutoSyncUnit6Products = jest.fn(() => false);

global.capRenderTeamTab = jest.fn(() => '<div>UNIT6 Team Tab</div>');
global.capRenderTasksTab = jest.fn(() => '<div>UNIT6 Tasks Tab</div>');
global.capRenderProductsTab = jest.fn(() => '<div>UNIT6 Products Tab</div>');
global.capRenderProductTaskLoadTab = jest.fn(() => '<div>UNIT6 Product Load Tab</div>');
global.capRenderHolidaysTab = jest.fn(() => '<div>UNIT6 Holidays Tab</div>');
global.capRenderChartTab = jest.fn(() => '<div>UNIT6 Chart Tab</div>');
global.capDrawChartNow = jest.fn();
global.capDrawHeatmapNow = jest.fn();

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

  global.unit6DataGetTeam.mockReturnValue(TEAM_FIXTURE);
  global.unit6DataGetTasks.mockReturnValue(TASKS_FIXTURE);
  global.unit6DataGetProducts.mockReturnValue(PRODUCTS_FIXTURE);
  global.unit6DataGetHolidays.mockReturnValue(HOLIDAYS_FIXTURE);
  global.unit6DataAutoSyncUnit6Products.mockReturnValue(false);

  window.unit6SetTab('chart');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('unit6RenderCapacity()', () => {
  it('returns Unit 6 shell HTML without writing legacy context', () => {
    const html = window.unit6RenderCapacity();

    expect(typeof html).toBe('string');
    expect(html).toContain('Unit 6 Load Capacity');
    expect(html).toContain('data-cap-action="cap-unit6-set-tab"');
  });

  it('draws chart and heatmap when chart tab is active', () => {
    window.unit6RenderCapacity();
    jest.advanceTimersByTime(110);

    expect(global.capDrawChartNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'UNIT6'
    );
    expect(global.capDrawHeatmapNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'UNIT6'
    );
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
    expect(global.capRenderTeamTab).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'UNIT6',
      true
    );

    const body = document.getElementById('unit6Body');
    expect(body.innerHTML).toContain('UNIT6 Team Tab');
  });

  it('falls back safely when Unit 6 data getters are unavailable', () => {
    global.unit6DataGetTeam = undefined;

    document.body.innerHTML = '<div id="unit6Body"></div>';
    window.unit6SetTab('team');

    expect(global.capRenderTeamTab).toHaveBeenCalledWith(
      [],
      HOLIDAYS_FIXTURE,
      expect.any(String),
      'UNIT6',
      true
    );
    global.unit6DataGetTeam = jest.fn(() => TEAM_FIXTURE);
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

    expect(global.unit6DataSave).toHaveBeenCalledWith(false);
    expect(window.unit6PendingRerender).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
