const fs = require('fs');
const path = require('path');

const utilsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/me-utils.js'), 'utf8');
const calculationsScript = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/me-calculations.js'), 'utf8');

eval(utilsScript);
eval(calculationsScript);

describe('ME monthly capacity calculations', () => {
  beforeEach(() => {
    global.prodState = { batches: [] };
    global.meDataGetProductSupportRateForDate = undefined;
  });

  test('returns implicit subtask when task has assigneeId', () => {
    const task = { assigneeId: 'p1', totalHours: 24, name: 'Task A' };
    expect(getEffectiveSubtasks(task)).toEqual([
      { assigneeId: 'p1', hours: 24, name: 'Task A' }
    ]);
  });

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

  test('deducts half-day holiday as 4 hours before utilisation', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const holidays = [{ personId: 'p1', date: '2026-01-05', type: 'half' }];

    const result = meCalculateMonthData('2026-01', team, [], [], holidays);
    expect(result.capacity).toBeCloseTo(164, 6);
  });

  test('deducts holiday using member daily hours and supports legacy person_id field', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 35, utilisation: 100 }];
    const holidays = [{ person_id: 'p1', date: '2026-01-05', type: 'full' }];

    const result = meCalculateMonthData('2026-01', team, [], [], holidays);
    // Jan 2026: 21 network days => 35 * (21/5) = 147 gross, minus one 7h day = 140
    expect(result.capacity).toBeCloseTo(140, 6);
  });

  test('clips monthly capacity to member start and end date', () => {
    const team = [{
      id: 'p1',
      name: 'Alex',
      startDate: '2026-01-15',
      endDate: '2026-01-21',
      hoursPerWeek: 40,
      utilisation: 100
    }];

    const result = meCalculateMonthData('2026-01', team, [], [], []);
    const expectedNetDays = countNetworkDaysBetween(new Date('2026-01-15'), new Date('2026-01-21'), new Set());
    const expectedCapacity = 40 * (expectedNetDays / 5);

    expect(result.capacity).toBeCloseTo(expectedCapacity, 6);
  });

  test('prorates task demand by network-day overlap across months', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const task = {
      id: 't1',
      assigneeId: 'p1',
      totalHours: 100,
      category: 'npi',
      startDate: '2026-01-20',
      endDate: '2026-02-10'
    };

    const result = meCalculateMonthData('2026-01', team, [task], [], []);
    const taskDays = countNetworkDaysBetween(new Date('2026-01-20'), new Date('2026-02-10'), new Set());
    const overlapDays = countNetworkDaysBetween(new Date('2026-01-20'), new Date('2026-01-31'), new Set());
    const expectedNpi = 100 * (overlapDays / taskDays);

    expect(result.npi).toBeCloseTo(expectedNpi, 6);
  });

  test('excludes disabled tasks from demand calculations', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const tasks = [
      {
        id: 't1',
        assigneeId: 'p1',
        totalHours: 20,
        category: 'npi',
        startDate: '2026-01-05',
        endDate: '2026-01-09',
        isDisabled: false
      },
      {
        id: 't2',
        assigneeId: 'p1',
        totalHours: 30,
        category: 'npi',
        startDate: '2026-01-05',
        endDate: '2026-01-09',
        isDisabled: true
      }
    ];

    const result = meCalculateMonthData('2026-01', team, tasks, [], []);
    expect(result.npi).toBeCloseTo(20, 6);
  });

  test('calculates product support from overlapping batch count in month', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'me-prod-1',
      productDatabaseId: 'db-prod-1',
      supportFrom: '2026-01-01',
      supportUntil: '2026-01-31',
      hoursPerWeek: 3
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2026-01-02', due_date: '2026-01-05' },
        { product_id: 'db-prod-1', start_date: '2026-01-20', due_date: '2026-01-22' },
        { product_id: 'db-prod-2', start_date: '2026-01-10', due_date: '2026-01-11' }
      ]
    };

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(6, 6);
  });

  test('counts cross-month batch when it overlaps target month', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'me-prod-1',
      productDatabaseId: 'db-prod-1',
      supportFrom: '2026-01-01',
      supportUntil: '2026-01-31',
      hoursPerWeek: 2
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2025-12-30', due_date: '2026-01-03' }
      ]
    };

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(2, 6);
  });

  test('returns zero product support when no production batches overlap', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'me-prod-1',
      productDatabaseId: 'db-prod-1',
      supportFrom: '2026-01-01',
      supportUntil: '2026-01-31',
      hoursPerWeek: 5
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2026-02-01', due_date: '2026-02-03' }
      ]
    };

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(0, 6);
  });

  test('uses effective-dated support rate for each overlapping batch', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'me-prod-1',
      productDatabaseId: 'db-prod-1',
      department: 'ME',
      hoursPerWeek: 3
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2026-01-05', due_date: '2026-01-06' },
        { product_id: 'db-prod-1', start_date: '2026-01-20', due_date: '2026-01-21' }
      ]
    };

    global.meDataGetProductSupportRateForDate = jest.fn((productId, targetDate) => {
      expect(productId).toBe('me-prod-1');
      return targetDate >= '2026-01-15' ? 1 : 2;
    });

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(3, 6);
  });

  test('falls back to product hours per batch when no history helper exists', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'me-prod-1',
      productDatabaseId: 'db-prod-1',
      department: 'ME',
      hoursPerWeek: 4
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2026-01-05', due_date: '2026-01-06' },
        { product_id: 'db-prod-1', start_date: '2026-01-20', due_date: '2026-01-21' }
      ]
    };

    global.meDataGetProductSupportRateForDate = undefined;

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(8, 6);
  });

  test('sums logistics kitting, booking in/out, and product movement values into support hours per batch', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }];
    const products = [{
      id: 'log-prod-1',
      productDatabaseId: 'db-prod-1',
      department: 'LOG',
      hoursPerWeek: 0,
      kittingHours: 1.5,
      bookingInOutHours: 0.25,
      productMovementHours: 0.5
    }];

    global.prodState = {
      batches: [
        { product_id: 'db-prod-1', start_date: '2026-01-05', due_date: '2026-01-06' },
        { product_id: 'db-prod-1', start_date: '2026-01-20', due_date: '2026-01-21' }
      ]
    };

    global.meDataGetProductSupportRateForDate = undefined;

    const result = meCalculateMonthData('2026-01', team, [], products, []);
    expect(result.support).toBeCloseTo(4.5, 6);
  });

  test('returns zero utilisation when person does not exist in team', () => {
    global.meDataGetTeam = jest.fn(() => []);
    const result = meCalcWeekUtilisation('missing', '2026-01-05', '2026-01-11', [], []);
    expect(result).toEqual({ capacity: 0, demand: 0, utilisation: 0 });
  });
});
