const fs = require('fs');
const path = require('path');

const meUtilsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/me-utils.js'), 'utf8');
const prodCapDataScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/prod-capacity-data.js'), 'utf8');

eval(meUtilsScript);

// Minimal globals required by prod-capacity-data.js during test execution.
global.currentUser = { id: 'test-user' };
global.prodCapUtilizationFactor = 1;
global.prodState = { products: [], batches: [] };
global.workAreasState = { workAreas: [] };

eval(prodCapDataScript);

describe('Production capacity calculations', () => {
  beforeEach(() => {
    prodCapUtilizationFactor = 1;
    prodState.products = [];
    prodState.batches = [];
  });

  test('excludes UK bank holidays from monthly working day count', () => {
    // Jan 2026 has 22 weekdays, minus New Year bank holiday => 21 working days.
    expect(prodCapWorkingDays(2026, 1)).toBe(21);
  });

  test('uses a 40-hour week baseline for available capacity', () => {
    const originalGetStaff = prodCapDataGetStaff;
    prodCapDataGetStaff = () => 1;

    // 21 working days in Jan 2026 => 40 * (21/5) = 168 hours.
    expect(prodCapAvailableHours('Unit 2', 2026, 1)).toBeCloseTo(168, 6);

    prodCapDataGetStaff = originalGetStaff;
  });

  test('prorates demand by working days across months', () => {
    prodState.products = [
      { id: 'p1', current_overhaul_hours: 10, work_location: 'Unit 2' }
    ];
    prodState.batches = [
      {
        id: 'b1',
        product_id: 'p1',
        quantity: 10,
        start_date: '2025-12-29',
        due_date: '2026-01-06',
        work_location: 'Unit 2'
      }
    ];

    const matrix = prodCapCalcDemandMatrix(['2025-12', '2026-01']);

    // Working days split is 3 in Dec and 3 in Jan (New Year excluded) => 50/50 of 100h.
    expect(matrix['2025-12']['Unit 2']).toBeCloseTo(50, 6);
    expect(matrix['2026-01']['Unit 2']).toBeCloseTo(50, 6);
  });
});
