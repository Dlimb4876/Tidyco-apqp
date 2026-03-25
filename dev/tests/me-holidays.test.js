const fs = require('fs');
const path = require('path');

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
global.canEdit = jest.fn(() => true);

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-holidays.js'),
  'utf8'
);
eval(script); // eslint-disable-line no-eval

describe('meToggleHoliday()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div class="me-card-body"></div>';
    global.capacityTab = 'me';

    global.meDataGetHolidays = jest.fn(() => []);
    global.meDataAddHoliday = jest.fn();
    global.meDataUpdateHoliday = jest.fn();
    global.meDataDeleteHoliday = jest.fn();
    global.meDebouncedSave = jest.fn();
    global.meSetTab = jest.fn();

    global.pmDataGetHolidays = jest.fn(() => []);
    global.pmDataAddHoliday = jest.fn();
    global.pmDataUpdateHoliday = jest.fn();
    global.pmDataDeleteHoliday = jest.fn();
    global.pmDebouncedSave = jest.fn();
    global.pmSetTab = jest.fn();

    global.logDataGetHolidays = jest.fn(() => []);
    global.logDataAddHoliday = jest.fn();
    global.logDataUpdateHoliday = jest.fn();
    global.logDataDeleteHoliday = jest.fn();
    global.logDebouncedSave = jest.fn();
    global.logSetTab = jest.fn();

    global.unit6DataGetHolidays = jest.fn(() => []);
    global.unit6DataAddHoliday = jest.fn();
    global.unit6DataUpdateHoliday = jest.fn();
    global.unit6DataDeleteHoliday = jest.fn();
    global.unit6DebouncedSave = jest.fn();
    global.unit6SetTab = jest.fn();
  });

  test('uses PM holiday state and save flow in Projects capacity', () => {
    global.capacityTab = 'projects';

    window.meToggleHoliday('pm-1', '2026-03-18');

    expect(global.pmDataAddHoliday).toHaveBeenCalledWith('pm-1', '2026-03-18', 'full');
    expect(global.pmDebouncedSave).toHaveBeenCalled();
    expect(global.pmSetTab).toHaveBeenCalledWith('holidays');
    expect(global.meDataAddHoliday).not.toHaveBeenCalled();
  });

  test('uses Logistics holiday state and save flow in Logistics capacity', () => {
    global.capacityTab = 'logistics';

    window.meToggleHoliday('log-1', '2026-03-19');

    expect(global.logDataAddHoliday).toHaveBeenCalledWith('log-1', '2026-03-19', 'full');
    expect(global.logDebouncedSave).toHaveBeenCalled();
    expect(global.logSetTab).toHaveBeenCalledWith('holidays');
    expect(global.meDataAddHoliday).not.toHaveBeenCalled();
  });

  test('uses Unit 6 holiday state and save flow in Unit 6 capacity', () => {
    global.capacityTab = 'unit6';

    window.meToggleHoliday('u6-1', '2026-03-20');

    expect(global.unit6DataAddHoliday).toHaveBeenCalledWith('u6-1', '2026-03-20', 'full');
    expect(global.unit6DebouncedSave).toHaveBeenCalled();
    expect(global.unit6SetTab).toHaveBeenCalledWith('holidays');
    expect(global.meDataAddHoliday).not.toHaveBeenCalled();
  });
});