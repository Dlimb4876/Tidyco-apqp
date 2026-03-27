const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

global.meGetMonthLabel = jest.fn(() => 'Mar 2026');
global.getMonthLabel = jest.fn(() => 'Mar 2026');
global.capGetWeekRange = jest.fn(() => [
  { start: '2026-03-02', end: '2026-03-08' },
  { start: '2026-03-09', end: '2026-03-15' }
]);
global.capCalcWeekUtilisation = jest.fn((personId, weekStart) => {
  if (personId !== 'p1') return { capacity: 0, demand: 0, utilisation: 0 };
  if (weekStart === '2026-03-02') return { capacity: 10, demand: 6, utilisation: 60 };
  return { capacity: 8, demand: 10, utilisation: 125 };
});

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/shared/js/cap-heatmap.js'),
  'utf8'
);
eval(script);

describe('Shared heatmap rendering and detail wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <div id="capHeatmapGrid"></div>
      <div id="meDetailModal" style="display:none"></div>
      <div id="meDetailTitle"></div>
      <div id="meDetailSubtitle"></div>
      <div id="meDetailBody"></div>
    `;
  });

  test('renders heatmap panel shell with month and department', () => {
    const html = capRenderHeatmapTab('2026-03', [], [], [], [], 'ME');

    expect(html).toContain('TEAM UTILISATION HEAT MAP');
    expect(html).toContain('capHeatmapGrid');
    expect(html).toContain('Mar 2026');
  });

  test('draws heatmap cells with utilisation classes', () => {
    capDrawHeatmapNow(
      [
        { id: 'p1', name: 'Alex', startDate: '2026-01-01' },
        { id: 'p2', name: 'NoStart' }
      ],
      [],
      [],
      [],
      '2026-03',
      'ME'
    );

    const cells = document.querySelectorAll('.me-heatmap-cell');
    expect(cells.length).toBe(2);

    expect(cells[0].className).toContain('me-heatmap-util-low');
    expect(cells[1].className).toContain('me-heatmap-util-high');
    expect(document.getElementById('capHeatmapGrid').innerHTML).toContain('Alex');
    expect(document.getElementById('capHeatmapGrid').innerHTML).not.toContain('NoStart');
  });

  test('uses no-capacity style when weekly capacity is zero', () => {
    global.capCalcWeekUtilisation = jest.fn(() => ({ capacity: 0, demand: 0, utilisation: 0 }));

    capDrawHeatmapNow([{ id: 'p1', name: 'Alex', startDate: '2026-01-01' }], [], [], [], '2026-03', 'ME');

    const cells = document.querySelectorAll('.me-heatmap-cell');
    expect(cells.length).toBe(2);
    expect(cells[0].className).toContain('me-heatmap-no-capacity');
  });

  test('delegates detail open/close to legacy detail handlers when present', () => {
    global.meOpenHeatmapDetail = jest.fn();
    global.meCloseHeatmapDetail = jest.fn();

    capOpenHeatmapDetail('p1', '2026-03-02', '2026-03-08');
    capCloseHeatmapDetail();

    expect(global.meOpenHeatmapDetail).toHaveBeenCalledWith('p1', '2026-03-02', '2026-03-08');
    expect(global.meCloseHeatmapDetail).toHaveBeenCalled();
  });
});
