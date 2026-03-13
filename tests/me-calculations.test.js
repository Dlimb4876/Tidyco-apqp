const fs = require('fs');
const path = require('path');

const utilsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/me-utils.js'), 'utf8');
const calculationsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/me-calculations.js'), 'utf8');

eval(utilsScript);
eval(calculationsScript);

describe('ME monthly capacity calculations', () => {
  test('uses 40h/week default for an 8-hour workday', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', utilisation: 100 }];
    const result = meCalculateMonthData('2026-01', team, [], [], []);

    // Jan 2026 has 21 network days after excluding New Year bank holiday.
    expect(result.capacity).toBeCloseTo(168, 6);
  });

  test('deducts personal full-day holiday as 8 hours', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const holidays = [{ personId: 'p1', date: '2026-01-05', type: 'full' }];

    const result = meCalculateMonthData('2026-01', team, [], [], holidays);
    expect(result.capacity).toBeCloseTo(160, 6);
  });

  test('ignores weekend personal holidays in monthly deduction', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const holidays = [{ personId: 'p1', date: '2026-01-04', type: 'full' }]; // Sunday

    const result = meCalculateMonthData('2026-01', team, [], [], holidays);
    expect(result.capacity).toBeCloseTo(168, 6);
  });

  test('ignores holidays not linked to team members', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const holidays = [{ personId: 'unknown', date: '2026-01-05', type: 'full' }];

    const result = meCalculateMonthData('2026-01', team, [], [], holidays);
    expect(result.capacity).toBeCloseTo(168, 6);
  });
});
