const fs = require('fs');
const path = require('path');

describe('Operations Forecast Data', () => {
  beforeEach(() => {
    localStorage.clear();
    global.currentUser = null;
    global.supa = null;

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/operations/js/operations-forecast-data.js'),
      'utf8'
    );
    eval(script);
  });

  test('forecast matrix uses total hours for single month', () => {
    const monthKeys = ['2026-01'];
    const rows = [{
      id: 'o1',
      title: 'Tender A',
      status: 'identified',
      work_area: 'Unit 2',
      start_date: '2026-01-01',
      due_date: '2026-01-31',
      total_hours: 100,
      probability_pct: 50
    }];

    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows);

    expect(Math.round(matrix['2026-01']._total)).toBe(100);
    expect(Math.round(matrix['2026-01']['Unit 2'])).toBe(100);
  });

  test('forecast matrix splits total hours across month overlap', () => {
    const monthKeys = ['2026-01', '2026-02'];
    const rows = [{
      id: 'o2',
      title: 'Tender B',
      status: 'quoted',
      work_area: 'Unit 3',
      start_date: '2026-01-15',
      due_date: '2026-02-14',
      total_hours: 310,
      probability_pct: 100
    }];

    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows);

    expect(Math.round(matrix['2026-01']._total)).toBe(170);
    expect(Math.round(matrix['2026-02']._total)).toBe(140);
    expect(Math.round(matrix['2026-01']._total + matrix['2026-02']._total)).toBe(310);
  });

  test('inactive statuses are excluded from forecast matrix', () => {
    const monthKeys = ['2026-01'];
    const rows = [{
      id: 'o3',
      title: 'Tender C',
      status: 'archived',
      work_area: 'Unit 6',
      start_date: '2026-01-01',
      due_date: '2026-01-31',
      total_hours: 220,
      probability_pct: 100
    }];

    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows);

    expect(matrix['2026-01']._total).toBe(0);
  });

  test('forecast matrix includes low medium high band breakdown using total hours', () => {
    const monthKeys = ['2026-01'];
    const rows = [
      {
        id: 'o4',
        title: 'Low Band',
        status: 'identified',
        work_area: 'Unit 2',
        start_date: '2026-01-01',
        due_date: '2026-01-31',
        total_hours: 100,
        probability_pct: 30
      },
      {
        id: 'o5',
        title: 'Medium Band',
        status: 'quoted',
        work_area: 'Unit 3',
        start_date: '2026-01-01',
        due_date: '2026-01-31',
        total_hours: 100,
        probability_pct: 60
      },
      {
        id: 'o6',
        title: 'High Band',
        status: 'negotiation',
        work_area: 'Unit 6',
        start_date: '2026-01-01',
        due_date: '2026-01-31',
        total_hours: 100,
        probability_pct: 90
      }
    ];

    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows);

    expect(Math.round(matrix['2026-01']._bands.low)).toBe(100);
    expect(Math.round(matrix['2026-01']._bands.medium)).toBe(100);
    expect(Math.round(matrix['2026-01']._bands.high)).toBe(100);
    expect(Math.round(matrix['2026-01']._total)).toBe(300);
  });
});
