const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Global stubs used by me-chart.js
global.meChartInst = null;
global.meChartStart = '2026-03';
global.Chart = function() {};
global.escapeHtml = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

global.meGetHoursPerWeek = jest.fn((hoursPerWeek) => {
  const parsed = Number(hoursPerWeek);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
});

global.getBankHolidaysForYear = jest.fn(() => []);
global.countNetworkDaysBetween = jest.fn(() => 5);
global.getUtilisationColor = jest.fn((util) => (util >= 100 ? 'var(--red)' : 'var(--green)'));
global.getMonthLabel = jest.fn(() => 'Mar 2026');
global.getMonthRange = jest.fn(() => ['2026-03']);
global.meRenderHeatmapPanel = jest.fn(() => '<div id="heatmap-marker">Heatmap</div>');

global.meCalculateMonthData = jest.fn(() => ({
  capacity: 160,
  capacityMax: 200,
  npi: 50,
  improvement: 20,
  tendering: 10,
  support: 20,
  other: 0,
  totalDemand: 100,
  utilisation: 63
}));

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-chart.js'),
  'utf8'
);
eval(script);

describe('ME chart tab rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T10:00:00Z'));

    global.meCalculateMonthData.mockReturnValue({
      capacity: 160,
      capacityMax: 200,
      npi: 50,
      improvement: 20,
      tendering: 10,
      support: 20,
      other: 0,
      totalDemand: 100,
      utilisation: 63
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders KPI strip and demand breakdown values', () => {
    const team = [
      { id: 'p1', name: 'Alex', startDate: '2026-01-01', hoursPerWeek: 40, utilisation: 80 }
    ];

    const result = meRenderChartTab('2026-03', team, [], [], []);

    expect(result).toContain('Available Capacity');
    expect(result).toContain('160.0');
    expect(result).toContain('Total Demand');
    expect(result).toContain('100.0 h');
    expect(result).toContain('NPI');
    expect(result).toContain('50.0 h');
    expect(result).toContain('50%');
    expect(result).toContain('heatmap-marker');
  });

  test('shows dash percentage when total demand is zero', () => {
    global.meCalculateMonthData.mockReturnValue({
      capacity: 80,
      capacityMax: 80,
      npi: 0,
      improvement: 0,
      tendering: 0,
      support: 0,
      other: 0,
      totalDemand: 0,
      utilisation: 0
    });

    const result = meRenderChartTab('2026-03', [], [], [], []);

    expect(result).toContain('—');
    expect(result).toContain('100%');
  });

  test('renders no-engineer hint when no team members have start dates', () => {
    const team = [
      { id: 'p1', name: 'Alex', hoursPerWeek: 40, utilisation: 80 },
      { id: 'p2', name: 'Sam', hoursPerWeek: 40, utilisation: 80 }
    ];

    const result = meRenderChartTab('2026-03', team, [], [], []);

    expect(result).toContain('No engineers with a start date set');
  });

  test('reduces available hours when holiday days are present for a member', () => {
    const team = [
      { id: 'p1', name: 'Alex', startDate: '2026-01-01', hoursPerWeek: 40, utilisation: 80 }
    ];

    const holidays = [
      { personId: 'p1', date: '2026-03-03', type: 'full' },
      { personId: 'p1', date: '2026-03-04', type: 'full' },
      { personId: 'p1', date: '2026-03-05', type: 'full' }
    ];

    const result = meRenderChartTab('2026-03', team, [], [], holidays);

    expect(result).toContain('3 d');
    expect(result).toContain('16.0 h');
    expect(result).toContain('12.8 h');
  });
});
