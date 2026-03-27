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
  path.resolve(__dirname, '../portals/capacity/shared/js/cap-holidays.js'),
  'utf8'
);
eval(script); // eslint-disable-line no-eval

describe('capToggleHoliday()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.addHoliday = jest.fn();
    global.updateHoliday = jest.fn();
    global.deleteHoliday = jest.fn();
  });

  test('adds a full-day holiday when no holiday exists', () => {
    window.capToggleHoliday('pm-1', '2026-03-18', [], addHoliday, updateHoliday, deleteHoliday);

    expect(global.addHoliday).toHaveBeenCalledWith('pm-1', '2026-03-18', 'full');
    expect(global.updateHoliday).not.toHaveBeenCalled();
    expect(global.deleteHoliday).not.toHaveBeenCalled();
  });

  test('changes a full-day holiday to half-day on second toggle', () => {
    window.capToggleHoliday(
      'log-1',
      '2026-03-19',
      [{ personId: 'log-1', date: '2026-03-19', type: 'full' }],
      addHoliday,
      updateHoliday,
      deleteHoliday
    );

    expect(global.updateHoliday).toHaveBeenCalledWith('log-1', '2026-03-19', 'half');
  });

  test('removes a half-day holiday on third toggle', () => {
    window.capToggleHoliday(
      'u6-1',
      '2026-03-20',
      [{ personId: 'u6-1', date: '2026-03-20', type: 'half' }],
      addHoliday,
      updateHoliday,
      deleteHoliday
    );

    expect(global.deleteHoliday).toHaveBeenCalledWith('u6-1', '2026-03-20');
  });
});