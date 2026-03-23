/**
 * me-data-core.test.js — Tests for portals/capacity/js/me-data.js
 *                        and portals/capacity/js/me-data-relational.js
 *                        and portals/capacity/js/me-holidays.js
 *
 * Covers pure utility functions:
 *   meNormalizeDepartmentTag (via meFilterByDepartment)
 *   meFilterByDepartment, meGetDepartmentFromContext
 *   meFormatDate, meGetMonthLabel
 *   meNormalizeIsoDate, meNormalizeDateRange (from me-data-relational.js)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.meUUID = () => 'mock-uuid-' + Math.random().toString(36).slice(2);
global.capacityTab = 'team';  // not 'projects', so default department is ME

// Mock getBankHolidaysForYear and getMonthLabel (from bank-holidays and helpers)
global.getBankHolidaysForYear = jest.fn(() => [
  { date: '2025-01-01', title: "New Year's Day" },
  { date: '2025-12-25', title: 'Christmas Day' },
]);
global.getMonthLabel = jest.fn((monthKey) => {
  const [year, month] = monthKey.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return [months[parseInt(month) - 1], year];
});

// Load me-data.js (contains meFilterByDepartment, meGetDepartmentFromContext)
const meDataSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-data.js'),
  'utf8'
);
eval(meDataSrc); // eslint-disable-line no-eval

// Load me-data-relational.js (contains meNormalizeIsoDate, meNormalizeDateRange)
const meDataRelSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-data-relational.js'),
  'utf8'
);
eval(meDataRelSrc); // eslint-disable-line no-eval

// Load me-holidays.js (contains meFormatDate, meGetMonthLabel)
const meHolSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-holidays.js'),
  'utf8'
);
eval(meHolSrc); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests — meFilterByDepartment (me-data.js)
// ─────────────────────────────────────────────────────────────

describe('meFilterByDepartment()', () => {
  const items = [
    { name: 'Alice', department: 'ME' },
    { name: 'Bob',   department: 'PM' },
    { name: 'Carol', department: 'me' }, // lowercase — should normalise
    { name: 'Dave',  department: null },  // missing — defaults to ME
  ];

  it('filters to ME department', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Alice');
    expect(result.map(r => r.name)).not.toContain('Bob');
  });

  it('filters to PM department', () => {
    const result = window.meFilterByDepartment(items, 'PM');
    expect(result.map(r => r.name)).toContain('Bob');
    expect(result.map(r => r.name)).not.toContain('Alice');
  });

  it('treats lowercase department values as normalised', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Carol');
  });

  it('treats null department as ME (default fallback)', () => {
    const result = window.meFilterByDepartment(items, 'ME');
    expect(result.map(r => r.name)).toContain('Dave');
  });

  it('returns empty array for non-array input', () => {
    expect(window.meFilterByDepartment(null, 'ME')).toEqual([]);
    expect(window.meFilterByDepartment(undefined, 'ME')).toEqual([]);
  });

  it('returns empty array when list is empty', () => {
    expect(window.meFilterByDepartment([], 'ME')).toEqual([]);
  });
});

describe('meGetDepartmentFromContext()', () => {
  it('returns explicit department when provided', () => {
    expect(window.meGetDepartmentFromContext('PM')).toBe('PM');
    expect(window.meGetDepartmentFromContext('ME')).toBe('ME');
  });

  it('normalises lowercase input', () => {
    expect(window.meGetDepartmentFromContext('pm')).toBe('PM');
    expect(window.meGetDepartmentFromContext('me')).toBe('ME');
  });

  it('returns ME by default when no argument and no context', () => {
    window.meCurrentDepartmentContext = '';
    global.capacityTab = 'team';
    expect(window.meGetDepartmentFromContext()).toBe('ME');
  });

  it('returns PM when capacityTab is "projects"', () => {
    window.meCurrentDepartmentContext = '';
    global.capacityTab = 'projects';
    expect(window.meGetDepartmentFromContext()).toBe('PM');
    global.capacityTab = 'team'; // restore
  });

  it('returns context department when meCurrentDepartmentContext is set', () => {
    window.meCurrentDepartmentContext = 'PM';
    expect(window.meGetDepartmentFromContext()).toBe('PM');
    window.meCurrentDepartmentContext = '';
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — meNormalizeIsoDate, meNormalizeDateRange (me-data-relational.js)
// ─────────────────────────────────────────────────────────────

describe('meNormalizeIsoDate()', () => {
  it('returns a valid ISO date string for a date string input', () => {
    const result = meNormalizeIsoDate('2025-06-15', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-06-15');
  });

  it('returns fallback when dateValue is null', () => {
    const result = meNormalizeIsoDate(null, '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-01-01');
  });

  it('returns fallback for invalid date string', () => {
    const result = meNormalizeIsoDate('not-a-date', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-01-01');
  });

  it('returns fallback for empty string', () => {
    const result = meNormalizeIsoDate('', '2025-03-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-03-01');
  });

  it('normalises ISO datetime to date-only', () => {
    const result = meNormalizeIsoDate('2025-06-15T10:30:00Z', '2025-01-01'); // eslint-disable-line no-undef
    expect(result).toBe('2025-06-15');
  });
});

describe('meNormalizeDateRange()', () => {
  const fallback = '2025-01-01';

  it('returns valid start and end dates unchanged', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange('2025-03-01', '2025-06-01', fallback); // eslint-disable-line no-undef
    expect(safeStart).toBe('2025-03-01');
    expect(safeEnd).toBe('2025-06-01');
  });

  it('clamps end to start when end is before start', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange('2025-06-01', '2025-03-01', fallback); // eslint-disable-line no-undef
    expect(safeEnd).toBe(safeStart);
  });

  it('uses fallback for null dates', () => {
    const { safeStart, safeEnd } = meNormalizeDateRange(null, null, fallback); // eslint-disable-line no-undef
    expect(safeStart).toBe(fallback);
    expect(safeEnd).toBe(fallback);
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — meFormatDate, meGetMonthLabel (me-holidays.js)
// ─────────────────────────────────────────────────────────────

describe('meFormatDate()', () => {
  it('formats a Date object as YYYY-MM-DD', () => {
    const d = new Date(2025, 5, 15); // June 15, 2025
    expect(window.meFormatDate(d)).toBe('2025-06-15');
  });

  it('pads month and day with leading zeros', () => {
    const d = new Date(2025, 0, 5); // Jan 5, 2025
    expect(window.meFormatDate(d)).toBe('2025-01-05');
  });

  it('returns empty string for null input', () => {
    expect(window.meFormatDate(null)).toBe('');
  });

  it('returns empty string for non-Date input', () => {
    expect(window.meFormatDate('2025-01-01')).toBe('');
    expect(window.meFormatDate(undefined)).toBe('');
  });
});

describe('meGetMonthLabel()', () => {
  it('returns formatted month label from getMonthLabel', () => {
    const label = window.meGetMonthLabel('2025-06');
    expect(label).toBe('Jun 2025');
  });

  it('returns monthKey when getMonthLabel returns non-array', () => {
    global.getMonthLabel = jest.fn(() => 'June 2025'); // not an array
    const label = window.meGetMonthLabel('2025-06');
    expect(label).toBe('2025-06');
    // restore
    global.getMonthLabel = jest.fn((monthKey) => {
      const [year, month] = monthKey.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return [months[parseInt(month) - 1], year];
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — getTodayDateString (me-data-relational.js)
// ─────────────────────────────────────────────────────────────

describe('getTodayDateString()', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const result = getTodayDateString(); // eslint-disable-line no-undef
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getTodayDateString()).toBe(today); // eslint-disable-line no-undef
  });
});

describe('meSaveProductRelational()', () => {
  afterEach(() => {
    delete global.supa;
  });

  it('reuses existing row id by product_database_id and persists only supported product departments', async () => {
    const lookupLimit = jest.fn().mockResolvedValue({ data: [{ id: 'existing-prod-id' }], error: null });
    const lookupEq = jest.fn(() => ({ limit: lookupLimit }));
    const lookupSelect = jest.fn(() => ({ eq: lookupEq }));

    const upsertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'existing-prod-id' }], error: null });
    const upsert = jest.fn(() => ({ select: upsertSelect }));

    global.supa = {
      from: jest.fn(() => ({
        select: lookupSelect,
        upsert
      }))
    };

    const product = {
      id: '',
      name: 'Widget',
      productDatabaseId: 'db-prod-1',
      hoursPerWeek: 8,
      department: 'LOG',
      notes: 'sync product'
    };

    const saved = await window.meSaveProductRelational('user-1', product);

    expect(saved).toBe(true);
    expect(global.supa.from).toHaveBeenCalledWith('me_products');
    expect(lookupEq).toHaveBeenCalledWith('product_database_id', 'db-prod-1');
    expect(upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'existing-prod-id',
          user_id: 'user-1',
          product_database_id: 'db-prod-1',
          department: 'ME'
        })
      ],
      { onConflict: 'id' }
    );
    expect(product.id).toBe('existing-prod-id');
  });
});

describe('meDataInit()', () => {
  afterEach(() => {
    delete global.currentUser;
    delete global.supa;
    delete global.render;
    delete global.setSyncBadge;
    delete global.meSaveTeamRelational;
    delete global.meSaveTaskRelational;
    delete global.meSaveProductRelational;
    delete global.meDeleteTaskRelational;
    global.meLoadRelationalTeams = undefined;
    global.meLoadRelationalTasks = undefined;
    global.meLoadRelationalProducts = undefined;
    global.meLoadRelationalHolidays = undefined;
    window.meDataReset();
  });

  it('loads relational holidays without querying legacy me_capacity', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.currentUser = { id: 'user-1' };
    global.render = undefined;
    global.meLoadRelationalTeams = jest.fn().mockResolvedValue([
      { id: 'person-1', name: 'Alex', startDate: '2025-01-01', department: 'ME' }
    ]);
    global.meLoadRelationalTasks = jest.fn().mockResolvedValue([]);
    global.meLoadRelationalProducts = jest.fn().mockResolvedValue([]);
    global.meLoadRelationalHolidays = jest.fn().mockResolvedValue([
      { person_id: 'person-1', date: '2026-01-05', type: 'full', department: 'ME' }
    ]);

    const from = jest.fn(() => {
      throw new Error('meDataInit should not query legacy me_capacity');
    });
    global.supa = { from };

    await window.meDataInit();

    expect(from).not.toHaveBeenCalledWith('me_capacity');
    expect(window.meDataState.team).toHaveLength(1);
    expect(window.meDataState.holidays).toEqual([
      expect.objectContaining({
        personId: 'person-1',
        date: '2026-01-05',
        type: 'full',
        department: 'ME'
      })
    ]);

    warnSpy.mockRestore();
  });

  it('deletes only the current user holiday rows before inserting replacements', async () => {
    global.currentUser = { id: 'user-1' };
    global.setSyncBadge = jest.fn();
    global.meSaveTeamRelational = jest.fn().mockResolvedValue(true);
    global.meSaveTaskRelational = jest.fn();
    global.meSaveProductRelational = jest.fn();

    window.meDataReset();
    window.meDataAddHoliday('person-1', '2026-01-05', 'full', 'ME');

    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn((table) => {
      if (table === 'me_holidays') {
        return { delete: del, insert };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    global.supa = { from };

    await window.meDataSave(false);

    expect(from).toHaveBeenCalledWith('me_holidays');
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        person_id: 'person-1',
        date: '2026-01-05',
        type: 'full',
        department: 'ME'
      })
    ]);
  });

  it('persists deleted tasks to relational storage so refresh does not restore them', async () => {
    global.currentUser = { id: 'user-1' };
    global.setSyncBadge = jest.fn();
    global.meSaveTeamRelational = jest.fn().mockResolvedValue(true);
    global.meSaveProductRelational = jest.fn().mockResolvedValue(true);
    global.meSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: 'persisted-task' });
    global.meDeleteTaskRelational = jest.fn().mockResolvedValue(true);

    window.meDataReset();
    window.meDataAddTask('Task One', 'NPI', '', '2026-01-01', '2026-01-02', 4, '', 'ME');
    window.meDataAddTask('Task Two', 'NPI', '', '2026-01-03', '2026-01-04', 8, '', 'ME');
    window.meDataState.tasks[0].id = 'task-delete-me';
    window.meDataState.tasks[1].id = 'task-keep-me';

    // Simulate user deleting the first task in the Tasks tab.
    window.meDataDeleteTask(0);

    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const from = jest.fn((table) => {
      if (table === 'me_holidays') {
        return { delete: del, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    global.supa = { from };

    await window.meDataSave(false);

    expect(global.meDeleteTaskRelational).toHaveBeenCalledWith('task-delete-me');
    expect(global.meSaveTaskRelational).toHaveBeenCalledTimes(1);
    expect(global.meSaveTaskRelational).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ id: 'task-keep-me', name: 'Task Two' })
    );
    expect(window.meDataPendingDeletes.tasks).toEqual([]);
  });
});

describe('meDataAutoSyncDepartmentProducts()', () => {
  afterEach(() => {
    delete global.productsState;
    window.meDataReset();
  });

  it('drops legacy manual rows when a linked product with the same name exists', () => {
    global.productsState = {
      products: [
        { id: 'db-prod-1', name: 'Widget', notes: '' }
      ]
    };

    window.meDataState.products = [
      {
        id: 'linked-row',
        name: 'Widget',
        department: 'ME',
        hoursPerWeek: 5,
        notes: '',
        productDatabaseId: 'db-prod-1',
        createdAt: '2026-03-01T00:00:00.000Z'
      },
      {
        id: 'legacy-manual',
        name: 'Widget',
        department: 'ME',
        hoursPerWeek: 5,
        notes: '',
        productDatabaseId: '',
        createdAt: '2026-03-01T00:00:00.000Z'
      },
      {
        id: 'manual-custom',
        name: 'Custom Fixture',
        department: 'ME',
        hoursPerWeek: 4,
        notes: '',
        productDatabaseId: '',
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];

    const synced = window.meDataAutoSyncProductionProducts();

    expect(synced).toBe(true);
    const meProducts = window.meDataState.products.filter(p => p.department === 'ME');
    expect(meProducts.map(p => p.name)).toEqual(expect.arrayContaining(['Widget', 'Custom Fixture']));
    expect(meProducts.filter(p => p.name === 'Widget')).toHaveLength(1);
  });

  it('restores latest logistics support breakdown from support history', () => {
    global.productsState = {
      products: [
        { id: 'db-prod-1', name: 'Widget', notes: '' }
      ]
    };

    window.meDataState.products = [
      {
        id: 'persisted-product',
        name: 'Widget',
        department: 'ME',
        hoursPerWeek: 5,
        notes: '',
        productDatabaseId: 'db-prod-1',
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];
    window.meDataState.productSupportHistory = [
      {
        id: 'log-hist-1',
        productId: 'persisted-product',
        department: 'LOG',
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        productMovementHours: 0.75,
        effectiveDate: '2026-03-05',
        endDate: '',
        changeReason: 'Split logistics work',
        notes: ''
      }
    ];

    const synced = window.meDataAutoSyncLogProducts();

    expect(synced).toBe(true);
    const logProduct = window.meDataState.products.find(p => p.department === 'LOG');
    expect(logProduct).toBeTruthy();
    expect(logProduct.id).toBe('persisted-product');
    expect(logProduct.hoursPerWeek).toBeCloseTo(2.25, 6);
    expect(logProduct.kittingHours).toBeCloseTo(1.25, 6);
    expect(logProduct.bookingInOutHours).toBeCloseTo(0.25, 6);
    expect(logProduct.kittingTimeBookingHours).toBeCloseTo(1.25, 6);
    expect(logProduct.productMovementHours).toBeCloseTo(0.75, 6);
    expect(logProduct.supportEffectiveDate).toBe('2026-03-05');
  });
});
