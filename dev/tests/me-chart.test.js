import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set up DOM
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Global stubs used by cap-chart.js
global.capChartInst = null;
global.Chart = jest.fn(() => ({ destroy: jest.fn() }));
global.escapeHtml = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

global.getUtilisationColor = jest.fn((util) => (util >= 100 ? 'var(--red)' : 'var(--green)'));
global.getMonthLabel = jest.fn(() => 'Mar 2026');
global.getMonthRange = jest.fn(() => ['2026-03']);
global.capRenderHeatmapTab = jest.fn(() => '<div id="capHeatmapGrid"></div>');
global.capCalculateMonthData = jest.fn(() => ({
  capacity: 160,
  totalDemand: 100,
  utilisation: 63
}));

// Load module and expose to window
const capChartModule = await import('../portals/capacity/shared/js/cap-chart.js');
Object.assign(window, capChartModule);

describe('Shared chart tab rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.capCalculateMonthData.mockReturnValue({
      capacity: 160,
      totalDemand: 100,
      utilisation: 63
    });
  });

  test('renders KPI strip and demand breakdown values', () => {
    const result = capRenderChartTab('2026-03', [], [], [], [], 'ME');

    expect(result).toContain('Available Capacity');
    expect(result).toContain('160.0');
    expect(result).toContain('Total Demand');
    expect(result).toContain('100.0');
    expect(result).toContain('63%');
    expect(result).toContain('Headroom');
    expect(result).toContain('meChartMonthInput');
    expect(result).toContain('capHeatmapGrid');
  });

  test('shows dash percentage when total demand is zero', () => {
    global.capCalculateMonthData.mockReturnValue({
      capacity: 80,
      totalDemand: 0,
      utilisation: 0
    });

    const result = capRenderChartTab('2026-03', [], [], [], [], 'ME');

    expect(result).toContain('0%');
    expect(result).toContain('80.0');
  });

  test('uses selected chart month for KPI calculations', () => {
    capRenderChartTab('2026-08', [], [], [], [], 'ME');

    expect(global.capCalculateMonthData).toHaveBeenCalledWith('2026-08', [], [], [], [], undefined);
    expect(global.getMonthLabel).toHaveBeenCalledWith('2026-08');
  });

  test('renders department label in chart header', () => {
    const result = capRenderChartTab('2026-03', [], [], [], [], 'LOG');

    expect(result).toContain('LOG Department');
  });

  test('shows chart refresh indicator text in chart header', () => {
    expect(window.capGetChartRefreshText()).toBe('Updates when this chart page is opened');
  });

  test('draws a chart with stacked demand bars and capacity line', () => {
    document.body.innerHTML = capRenderChartTab('2026-03', [], [], [], [], 'ME');
    const canvas = document.getElementById('capChart');
    canvas.getContext = jest.fn(() => ({}));
    global.getMonthRange.mockReturnValue(['2026-03', '2026-04']);
    global.capCalculateMonthData
      .mockReturnValueOnce({ capacity: 160, totalDemand: 100, npi: 30, improvement: 25, tendering: 15, support: 20, other: 10, utilisation: 63 })
      .mockReturnValueOnce({ capacity: 150, totalDemand: 90, npi: 25, improvement: 20, tendering: 15, support: 20, other: 10, utilisation: 60 });

    capDrawChartNow([], [], [], [], '2026-03', 'ME');

    expect(global.Chart).toHaveBeenCalledTimes(1);
    expect(global.Chart.mock.calls[0][1].data.labels).toEqual(['Mar 2026', 'Mar 2026']);
    // Stacked demand bars (bars come first, then line)
    expect(global.Chart.mock.calls[0][1].data.datasets[0].label).toBe('NPI');
    expect(global.Chart.mock.calls[0][1].data.datasets[0].data).toEqual([30, 25]);
    expect(global.Chart.mock.calls[0][1].data.datasets[0].backgroundColor).toBe('#2563eb');
    expect(global.Chart.mock.calls[0][1].data.datasets[1].label).toBe('Improvement');
    expect(global.Chart.mock.calls[0][1].data.datasets[1].data).toEqual([25, 20]);
    expect(global.Chart.mock.calls[0][1].data.datasets[1].backgroundColor).toBe('#16a34a');
    expect(global.Chart.mock.calls[0][1].data.datasets[2].label).toBe('Tendering');
    expect(global.Chart.mock.calls[0][1].data.datasets[2].data).toEqual([15, 15]);
    expect(global.Chart.mock.calls[0][1].data.datasets[2].backgroundColor).toBe('#ea580c');
    expect(global.Chart.mock.calls[0][1].data.datasets[3].label).toBe('Support');
    expect(global.Chart.mock.calls[0][1].data.datasets[3].data).toEqual([20, 20]);
    expect(global.Chart.mock.calls[0][1].data.datasets[3].backgroundColor).toBe('#0891b2');
    expect(global.Chart.mock.calls[0][1].data.datasets[4].label).toBe('Other');
    expect(global.Chart.mock.calls[0][1].data.datasets[4].data).toEqual([10, 10]);
    expect(global.Chart.mock.calls[0][1].data.datasets[4].backgroundColor).toBe('#7c3aed');
    // Capacity line (comes last)
    expect(global.Chart.mock.calls[0][1].data.datasets[5].label).toBe('Team Capacity');
    expect(global.Chart.mock.calls[0][1].data.datasets[5].data).toEqual([160, 150]);
    expect(global.Chart.mock.calls[0][1].data.datasets[5].borderColor).toBe('#dc2626');
    expect(global.Chart.mock.calls[0][1].data.datasets[5].type).toBe('line');
    // Check stacking
    expect(global.Chart.mock.calls[0][1].data.datasets[0].stack).toBe('demand');
    expect(global.Chart.mock.calls[0][1].data.datasets[1].stack).toBe('demand');
    expect(global.Chart.mock.calls[0][1].options.scales.x.stacked).toBe(true);
    expect(global.Chart.mock.calls[0][1].options.scales.y.stacked).toBe(true);
    // Legend visible at bottom
    expect(global.Chart.mock.calls[0][1].options.plugins.legend.display).toBe(true);
    expect(global.Chart.mock.calls[0][1].options.plugins.legend.position).toBe('bottom');
  });
});
