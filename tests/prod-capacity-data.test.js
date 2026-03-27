const fs = require('fs');
const path = require('path');

const meUtilsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/shared/js/cap-utils.js'), 'utf8');
const prodCapDataScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/production/js/prod-capacity-data.js'), 'utf8');

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

// ─────────────────────────────────────────────────────────────
// Supabase query shape tests
// ─────────────────────────────────────────────────────────────

describe('Production capacity Supabase queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.createRealtimeSubscription = jest.fn();
    global.removeRealtimeSubscription = jest.fn();
  });

  test('prodCapDataInit queries production_capacity ordered by year then month', async () => {
    const orderMonthMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const orderYearMock = jest.fn(() => ({ order: orderMonthMock }));
    const selectMock = jest.fn(() => ({ order: orderYearMock }));
    global.supa = { from: jest.fn(() => ({ select: selectMock })) };

    await prodCapDataInit();

    expect(global.supa.from).toHaveBeenCalledWith('production_capacity');
    expect(orderYearMock).toHaveBeenCalledWith('year', { ascending: true });
    expect(orderMonthMock).toHaveBeenCalledWith('month', { ascending: true });
  });

  test('prodCapLoadUtilization queries global_settings by setting_key', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    global.supa = { from: jest.fn(() => ({ select: selectMock })) };

    await prodCapLoadUtilization();

    expect(global.supa.from).toHaveBeenCalledWith('global_settings');
    expect(selectMock).toHaveBeenCalledWith('setting_value');
    expect(eqMock).toHaveBeenCalledWith('setting_key', 'prod_cap_utilization');
  });

  test('prodCapDataSetStaff inserts correct column names for a new record', async () => {
    // Seed empty records via init first so the insert path is taken
    const initOrderMock = jest.fn().mockResolvedValue({ data: [], error: null });
    global.supa = { from: jest.fn(() => ({ select: jest.fn(() => ({ order: jest.fn(() => ({ order: initOrderMock })) })) })) };
    await prodCapDataInit();

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null });
    const selectAfterInsert = jest.fn(() => ({ maybeSingle: maybeSingleMock }));
    const insertMock = jest.fn(() => ({ select: selectAfterInsert }));
    global.supa = { from: jest.fn(() => ({ insert: insertMock })) };

    await prodCapDataSetStaff('Unit 2', 2026, 3, 4);

    expect(global.supa.from).toHaveBeenCalledWith('production_capacity');
    expect(insertMock).toHaveBeenCalledWith(
      [expect.objectContaining({
        user_id: 'test-user',
        work_area: 'Unit 2',
        year: 2026,
        month: 3,
        staff_count: 4
      })]
    );
  });
});
