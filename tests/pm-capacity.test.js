/**
 * pm-capacity.test.js — Tests for portals/capacity/project-management/js/pm-capacity.js
 *
 * Covers: PM chart month changes re-render chart-tab HTML so side panels update with selected month.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toEvalFriendlyModuleSource } from './helpers/esm-eval.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEAM_FIXTURE = [{ id: 'm1', name: 'PM A', department: 'PM' }];
const TASKS_FIXTURE = [{ id: 't1', task: 'PM Task', department: 'PM' }];
const PRODUCTS_FIXTURE = [{ id: 'p1', product: 'PM Product', department: 'PM' }];
const HOLIDAYS_FIXTURE = [{ id: 'h1', date: '2026-01-01', department: 'PM' }];

global.render = jest.fn();
global.currentSection = 'capacity';
global.capacityTab = 'projects';
global.writeNavigationHistory = jest.fn();
global.pmDataSave = jest.fn(() => Promise.resolve());
global.isEditingInlineCell = jest.fn(() => false);
global.canEdit = jest.fn(() => true);

global.pmDataGetTeam = jest.fn(() => TEAM_FIXTURE);
global.pmDataGetTasks = jest.fn(() => TASKS_FIXTURE);
global.pmDataGetProducts = jest.fn(() => PRODUCTS_FIXTURE);
global.pmDataGetHolidays = jest.fn(() => HOLIDAYS_FIXTURE);
global.pmDataAutoSyncPMProducts = jest.fn(() => false);

global.capRenderTeamTab = jest.fn(() => '<div>PM Team Tab</div>');
global.capRenderTasksTab = jest.fn(() => '<div>PM Tasks Tab</div>');
global.capRenderProductsTab = jest.fn(() => '<div>PM Products Tab</div>');
global.capRenderProductTaskLoadTab = jest.fn(() => '<div>PM Product Load Tab</div>');
global.capRenderHolidaysTab = jest.fn(() => '<div>PM Holidays Tab</div>');
global.capRenderChartTab = jest.fn((monthKey) => `<div>PM Chart ${monthKey}</div>`);
global.capDrawChartNow = jest.fn();
global.capDrawHeatmapNow = jest.fn();

const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/project-management/js/pm-capacity.js'),
  'utf8'
);
eval(toEvalFriendlyModuleSource(src)); // eslint-disable-line no-eval

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  document.body.innerHTML = '';
  global.currentSection = 'capacity';
  global.capacityTab = 'projects';

  global.pmDataGetTeam.mockReturnValue(TEAM_FIXTURE);
  global.pmDataGetTasks.mockReturnValue(TASKS_FIXTURE);
  global.pmDataGetProducts.mockReturnValue(PRODUCTS_FIXTURE);
  global.pmDataGetHolidays.mockReturnValue(HOLIDAYS_FIXTURE);
  global.pmDataAutoSyncPMProducts.mockReturnValue(false);

  window.pmSetTab('chart');
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('PM chart month updates', () => {
  it('re-renders chart tab HTML on month change in chart tab', () => {
    document.body.innerHTML = '<div id="pmBody"></div>';

    window.pmOnMonthChange('2027-04');
    jest.advanceTimersByTime(110);

    const body = document.getElementById('pmBody');
    expect(body.innerHTML).toContain('PM Chart 2027-04');
    expect(global.capDrawChartNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      '2027-04',
      'PM'
    );
    expect(global.capDrawHeatmapNow).toHaveBeenCalledWith(
      TEAM_FIXTURE,
      TASKS_FIXTURE,
      PRODUCTS_FIXTURE,
      HOLIDAYS_FIXTURE,
      '2027-04',
      'PM'
    );
  });

  it('moves chart tab month forward and re-renders side panels', () => {
    document.body.innerHTML = '<div id="pmBody"></div>';

    window.pmOnMonthChange('2027-04');
    jest.advanceTimersByTime(110);

    window.pmOnNextMonth();
    jest.advanceTimersByTime(110);

    const body = document.getElementById('pmBody');
    expect(body.innerHTML).toContain('PM Chart 2027-05');
  });
});

