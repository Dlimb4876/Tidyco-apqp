const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

global.meChartStart = '2026-03';
global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

global.meGetMonthLabel = jest.fn(() => 'Mar 2026');
global.meGetWeekRange = jest.fn(() => [
  { start: '2026-03-02', end: '2026-03-08' },
  { start: '2026-03-09', end: '2026-03-15' }
]);

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-heatmap.js'),
  'utf8'
);
eval(script);

describe('ME heatmap rendering and detail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <div id="meHeatmapGrid"></div>
      <div id="meDetailModal" style="display:none"></div>
      <div id="meDetailTitle"></div>
      <div id="meDetailSubtitle"></div>
      <div id="meDetailBody"></div>
    `;

    global.meDataGetTeam = jest.fn(() => [
      { id: 'p1', name: 'Alex', startDate: '2026-01-01' },
      { id: 'p2', name: 'NoStart' }
    ]);

    global.meDataGetTasks = jest.fn(() => [
      {
        id: 't1',
        assigneeId: 'p1',
        name: 'Design review',
        category: 'npi',
        totalHours: 20,
        startDate: '2026-03-01',
        endDate: '2026-03-10'
      }
    ]);

    global.meDataGetHolidays = jest.fn(() => [
      { personId: 'p1', date: '2026-03-04', type: 'half' }
    ]);

    global.meCalcWeekUtilisation = jest.fn((personId, weekStart) => {
      if (personId !== 'p1') return { capacity: 0, demand: 0, utilisation: 0 };
      if (weekStart === '2026-03-02') return { capacity: 10, demand: 6, utilisation: 60 };
      return { capacity: 8, demand: 10, utilisation: 125 };
    });
  });

  test('draws heatmap cells with utilisation classes', () => {
    meDrawHeatmapNow();

    const cells = document.querySelectorAll('.me-heatmap-cell');
    expect(cells.length).toBe(2);

    expect(cells[0].className).toContain('me-heatmap-util-low');
    expect(cells[1].className).toContain('me-heatmap-util-high');
    expect(document.getElementById('meHeatmapGrid').innerHTML).toContain('Alex');
    expect(document.getElementById('meHeatmapGrid').innerHTML).not.toContain('NoStart');
  });

  test('uses no-capacity style when weekly capacity is zero', () => {
    global.meCalcWeekUtilisation = jest.fn(() => ({ capacity: 0, demand: 0, utilisation: 0 }));

    meDrawHeatmapNow();

    const cells = document.querySelectorAll('.me-heatmap-cell');
    expect(cells.length).toBe(2);
    expect(cells[0].className).toContain('me-heatmap-no-capacity');
  });

  test('opens detail modal with utilisation and task details', () => {
    meOpenHeatmapDetail('p1', '2026-03-02', '2026-03-08');

    expect(document.getElementById('meDetailModal').style.display).toBe('flex');
    expect(document.getElementById('meDetailTitle').textContent).toContain('Alex');
    expect(document.getElementById('meDetailSubtitle').textContent).toContain('utilised');
    expect(document.getElementById('meDetailBody').innerHTML).toContain('Design review');
    expect(document.getElementById('meDetailBody').innerHTML).toContain('Time Off');
  });

  test('closes detail modal and clears open state', () => {
    document.getElementById('meDetailModal').style.display = 'flex';

    meCloseHeatmapDetail();

    expect(document.getElementById('meDetailModal').style.display).toBe('none');
  });
});
