/**
 * me-data-core.test.js — Tests for portals/capacity/me/js/me-data.js
 *                        and portals/capacity/me/js/me-data-normalize.js
 *                        and portals/capacity/me/js/me-data-support-history.js
 *                        and portals/capacity/me/js/me-data-entities.js
 *                        and portals/capacity/me/js/me-data-persistence.js
 *                        and portals/capacity/me/js/me-data-realtime.js
 *                        and portals/capacity/me/js/me-data-relational.js
 *                        and portals/capacity/shared/js/cap-utils.js
 *
 * Covers core ME data behavior and shared date helpers:
 *   department tagging on add/update helpers
 *   meFormatDate, meGetMonthLabel
 *   meNormalizeIsoDate, meNormalizeDateRange (from me-data-relational.js)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.meUUID = () => 'mock-uuid-' + Math.random().toString(36).slice(2);
// Mock getBankHolidaysForYear and getMonthLabel (from bank-holidays and helpers)
global.getBankHolidaysForYear = jest.fn(() => [
  { date: '2025-01-01', title: "New Year's Day" },
  { date: '2025-12-25', title: 'Christmas Day' },
]);
global.meGetHoursPerWeek = jest.fn((value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 37;
});
global.getMonthLabel = jest.fn((monthKey) => {
  const [year, month] = monthKey.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return [months[parseInt(month) - 1], year];
});

// Load me-data-normalize.js before me-data.js so the extracted helpers exist in the eval harness.
const meDataNormalizeSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-normalize.js'),
  'utf8'
);
eval(meDataNormalizeSrc); // eslint-disable-line no-eval

// Load me-data.js
const meDataSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data.js'),
  'utf8'
);
eval(meDataSrc); // eslint-disable-line no-eval

// Load me-data-support-history.js after me-data.js so the extracted support-history API
// can attach to the existing meDataState-backed ME data layer.
const meDataSupportHistorySrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-support-history.js'),
  'utf8'
);
eval(meDataSupportHistorySrc); // eslint-disable-line no-eval

// Load me-data-entities.js after the support-history file so product CRUD can use
// the extracted support-history helpers without changing the live ME API surface.
const meDataEntitiesSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-entities.js'),
  'utf8'
);
eval(meDataEntitiesSrc); // eslint-disable-line no-eval

// Load me-data-persistence.js after the support-history and entity files so
// init/save orchestration can keep calling the extracted helpers unchanged.
const meDataPersistenceSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-persistence.js'),
  'utf8'
);
eval(meDataPersistenceSrc); // eslint-disable-line no-eval

// Stub render scheduler (loaded via render-scheduler.js in the browser)
global.requestRender = jest.fn(({ renderNow, isEditing, isFiltering } = {}) => {
  if (!isEditing && !isFiltering && typeof renderNow === 'function') renderNow();
});
global.flushDeferred = jest.fn();

// Load me-data-realtime.js after persistence so the extracted subscription layer can
// call the full ME data API/state setup without changing the public window contract.
const meDataRealtimeSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-realtime.js'),
  'utf8'
);
eval(meDataRealtimeSrc); // eslint-disable-line no-eval

// Load me-data-relational.js (contains meNormalizeIsoDate, meNormalizeDateRange)
const meDataRelSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/me/js/me-data-relational.js'),
  'utf8'
);
eval(meDataRelSrc); // eslint-disable-line no-eval

// Load cap-utils.js (contains legacy meFormatDate, meGetMonthLabel aliases)
const meHolSrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/shared/js/cap-utils.js'),
  'utf8'
);
eval(meHolSrc); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests — explicit department tagging (me-data.js)
// ─────────────────────────────────────────────────────────────

describe('me-data explicit department tagging', () => {
  beforeEach(() => {
    window.meDataState.team = [];
    window.meDataState.tasks = [];
    window.meDataState.products = [];
    window.meDataState.holidays = [];
    window.meDataState.productSupportHistory = [];
  });

  it('defaults new team members to ME when no department is provided', () => {
    const created = window.meDataAddTeam('Alice', 37.5, 80, '', '');

    expect(created).toBe(true);
    expect(window.meDataState.team[0].department).toBe('ME');
  });

  it('normalises explicit department values for new tasks', () => {
    const created = window.meDataAddTask('Task A', 'NPI', '', '2025-01-01', '2025-01-02', 8, '', 'pm');

    expect(created).toBe(true);
    expect(window.meDataState.tasks[0].department).toBe('PM');
  });

  it('defaults new products to ME when no department is provided', () => {
    const created = window.meDataAddProduct('Widget', 4, 'note', 'db-1');

    expect(created).toBe(true);
    expect(window.meDataState.products[0].department).toBe('ME');
  });

  it('uses explicit department values when adding holidays', () => {
    const created = window.meDataAddHoliday('person-1', '2025-06-01', 'full', 'log');

    expect(created).toBe(true);
    expect(window.meDataState.holidays[0].department).toBe('LOG');
  });
});

describe('me-data public API contract', () => {
  it('exposes the current ME data API on window', () => {
    const apiNames = [
      'meDataAddTeam',
      'meDataUpdateTeam',
      'meDataDeleteTeam',
      'meDataGetTeam',
      'meDataAddTask',
      'meDataUpdateTask',
      'meDataDeleteTask',
      'meDataGetTasks',
      'meDataAddProduct',
      'meDataUpdateProduct',
      'meDataDeleteProduct',
      'meDataGetProducts',
      'meDataAddHoliday',
      'meDataUpdateHoliday',
      'meDataDeleteHoliday',
      'meDataGetHolidays',
      'meDataAddProductSupportHistory',
      'meDataUpdateProductSupportHistoryEntry',
      'meDataDeleteProductSupportHistoryEntry',
      'meDataGetProductSupportHistory',
      'meDataGetProductSupportRateForDate',
      'meDataGetProductLatestSupportEffectiveDate',
      'meDataInit',
      'meDataSave',
      'meDataSubscribe',
      'meDataUnsubscribe',
      'meDataGetState',
      'meDataReset',
      'meDiagnostics',
      'meDataAutoSyncProductionProducts',
      'meDataAutoSyncPMProducts',
      'meDataAutoSyncLogProducts',
      'meDataAutoSyncUnit6Products'
    ];

    apiNames.forEach((name) => {
      expect(typeof window[name]).toBe('function');
    });
  });
});

describe('meDataUpdateProduct() support history behaviour', () => {
  beforeEach(() => {
    window.meDataReset();
  });

  it('updates the matching live product after editing an existing support history row', () => {
    window.meDataAddProduct('Widget', 4, 'note', 'db-1', 'ME');
    const baselineEntry = window.meDataState.productSupportHistory[0];

    const updated = window.meDataUpdateProductSupportHistoryEntry(baselineEntry.id, {
      effectiveDate: '2026-03-05',
      changeReason: 'Rebalanced support split',
      kittingHours: 1.25,
      bookingInOutHours: 0.25,
      productMovementHours: 0.75
    });

    expect(updated).toBe(true);
    expect(window.meDataState.products[0]).toEqual(
      expect.objectContaining({
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        kittingTimeBookingHours: 1.25,
        productMovementHours: 0.75,
        supportEffectiveDate: '2026-03-05'
      })
    );
  });

  it('adds an effective-dated support history row when hoursPerWeek is updated with metadata', () => {
    window.meDataAddProduct('Widget', 4, 'note', 'db-1', 'ME');

    const updated = window.meDataUpdateProduct(0, 'hoursPerWeek', 2.25, {
      effectiveDate: '2026-03-05',
      changeReason: 'Rebalanced support split',
      notes: 'Updated for new workflow',
      kittingHours: 1.25,
      bookingInOutHours: 0.25,
      productMovementHours: 0.75
    });

    expect(updated).toBe(true);
    expect(window.meDataState.products[0]).toEqual(
      expect.objectContaining({
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        kittingTimeBookingHours: 1.25,
        productMovementHours: 0.75,
        supportEffectiveDate: '2026-03-05'
      })
    );
    expect(window.meDataState.productSupportHistory).toHaveLength(2);
    const effectiveDatedRow = window.meDataState.productSupportHistory.find(
      (row) => row.effectiveDate === '2026-03-05'
    );
    expect(effectiveDatedRow).toEqual(
      expect.objectContaining({
        effectiveDate: '2026-03-05',
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        kittingTimeBookingHours: 1.25,
        productMovementHours: 0.75,
        changeReason: 'Rebalanced support split',
        notes: 'Updated for new workflow'
      })
    );
  });

  it.each([
    ['kittingHours', 1.25, { hoursPerWeek: 1.25, kittingHours: 1.25, bookingInOutHours: 0, productMovementHours: 0 }],
    ['bookingInOutHours', 0.5, { hoursPerWeek: 4.5, kittingHours: 4, bookingInOutHours: 0.5, productMovementHours: 0 }],
    ['productMovementHours', 0.75, { hoursPerWeek: 4.75, kittingHours: 4, bookingInOutHours: 0, productMovementHours: 0.75 }]
  ])('currently updates %s on the live product without appending a new history row', (field, value, expectedProduct) => {
    window.meDataAddProduct('Widget', 4, 'note', 'db-1', 'ME');

    const baselineHistory = { ...window.meDataState.productSupportHistory[0] };
    const updated = window.meDataUpdateProduct(0, field, value);

    expect(updated).toBe(true);
    expect(window.meDataState.products[0]).toEqual(
      expect.objectContaining({
        ...expectedProduct,
        kittingTimeBookingHours: expectedProduct.kittingHours
      })
    );
    expect(window.meDataState.productSupportHistory).toHaveLength(1);
    expect(window.meDataState.productSupportHistory[0]).toEqual(
      expect.objectContaining({
        id: baselineHistory.id,
        hoursPerWeek: baselineHistory.hoursPerWeek,
        kittingHours: baselineHistory.kittingHours,
        bookingInOutHours: baselineHistory.bookingInOutHours,
        productMovementHours: baselineHistory.productMovementHours,
        effectiveDate: baselineHistory.effectiveDate
      })
    );
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

describe('meNormalizeAndDedupeSupportHistory()', () => {
  it('keeps the most recently updated record for duplicate product/date/department rows', () => {
    const rows = [
      {
        id: 'history-old',
        productId: 'prod-1',
        department: 'ME',
        effectiveDate: '2026-03-01',
        hoursPerWeek: 8,
        changeReason: 'Old value',
        updatedAt: '2026-03-20T08:00:00.000Z'
      },
      {
        id: 'history-new',
        productId: 'prod-1',
        department: 'ME',
        effectiveDate: '2026-03-01',
        hoursPerWeek: 12,
        changeReason: 'Edited value',
        updatedAt: '2026-03-25T09:00:00.000Z'
      }
    ];

    const deduped = meNormalizeAndDedupeSupportHistory(rows); // eslint-disable-line no-undef

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('history-new');
    expect(deduped[0].hoursPerWeek).toBe(12);
    expect(deduped[0].changeReason).toBe('Edited value');
  });
});

// ─────────────────────────────────────────────────────────────
// Tests — meFormatDate, meGetMonthLabel (shared legacy aliases)
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

  it('returns the underlying shared label when getMonthLabel returns a string', () => {
    global.getMonthLabel = jest.fn(() => 'June 2025'); // not an array
    const label = window.meGetMonthLabel('2025-06');
    expect(label).toBe('June 2025');
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
          product_database_id: 'db-prod-1'
        })
      ],
      { onConflict: 'id' }
    );
    const [productPayload] = upsert.mock.calls[0][0];
    expect(productPayload).not.toHaveProperty('department');
    expect(product.id).toBe('existing-prod-id');
  });
});

describe('task disable relational mapping', () => {
  afterEach(() => {
    delete global.supa;
  });

  it('maps is_disabled from relational me_tasks rows', async () => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{
            id: 'task-1',
            name: 'Review',
            category: 'NPI',
            type: 'standard',
            assignee_id: 'member-1',
            product_id: null,
            start_date: '2026-01-01',
            end_date: '2026-01-02',
            total_hours: 4,
            status: 'SCHEDULED',
            is_disabled: true,
            department: 'ME',
            created_at: '2026-01-01T00:00:00.000Z'
          }],
          error: null
        })
      }))
    };

    const tasks = await window.meLoadRelationalTasks('user-1');
    expect(tasks).toEqual([
      expect.objectContaining({ id: 'task-1', isDisabled: true })
    ]);
  });

  it('persists isDisabled into is_disabled payload on save', async () => {
    const upsertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'task-1' }], error: null });
    const upsert = jest.fn(() => ({ select: upsertSelect }));
    global.supa = {
      from: jest.fn(() => ({ upsert }))
    };

    const task = {
      id: 'task-1',
      name: 'Review',
      category: 'NPI',
      type: 'standard',
      assigneeId: 'member-1',
      productId: '',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      totalHours: 4,
      status: 'SCHEDULED',
      isDisabled: true,
      department: 'ME'
    };

    const result = await window.meSaveTaskRelational('user-1', task);
    expect(result.success).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'task-1', is_disabled: true })],
      { onConflict: 'id' }
    );
    const [taskPayload] = upsert.mock.calls[0][0];
    expect(taskPayload).not.toHaveProperty('department');
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
    delete global.meDeleteTeamRelational;
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
    window.meDataAddHoliday('person-1', '2026-01-05', 'full', 'LOG');

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

    // Simulate user deleting the first task in the Tasks tab (now by ID).
    window.meDataDeleteTask('task-delete-me');

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

  it('persists deleted team members to relational storage so refresh does not restore them', async () => {
    global.currentUser = { id: 'user-1' };
    global.setSyncBadge = jest.fn();
    global.meSaveTeamRelational = jest.fn().mockResolvedValue(true);
    global.meSaveProductRelational = jest.fn().mockResolvedValue(true);
    global.meSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: 'persisted-task' });
    global.meDeleteTeamRelational = jest.fn().mockResolvedValue(true);

    window.meDataReset();
    window.meDataState.team = [
      { id: 'team-delete-me', name: 'Alex', hoursPerWeek: 37, utilisation: 80, department: 'ME' },
      { id: 'team-keep-me', name: 'Sam', hoursPerWeek: 37, utilisation: 80, department: 'ME' }
    ];

    // Simulate user deleting the first person in the Team tab.
    window.meDataDeleteTeam(0);

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

    expect(global.meDeleteTeamRelational).toHaveBeenCalledWith('team-delete-me');
    expect(global.meSaveTeamRelational).toHaveBeenCalledTimes(1);
    expect(global.meSaveTeamRelational).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ id: 'team-keep-me', name: 'Sam' })
    );
    expect(window.meDataPendingDeletes.teams).toEqual([]);
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

describe('meData realtime subscription callbacks', () => {
  let tableConfigs;

  function getTableConfig(tableName) {
    return tableConfigs.find((config) => config.table === tableName);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    tableConfigs = [];
    window.meDataReset();
    global.currentUser = { id: 'user-1' };
    global.render = jest.fn();
    global.createMultiTableRealtimeSubscription = jest.fn((configs) => {
      tableConfigs = configs;
      return { id: 'sub-1' };
    });
    global.removeRealtimeSubscription = jest.fn();
    global.isEditingInlineCell = jest.fn(() => false);
    global.requestRender.mockClear();

    window.meDataSubscribe();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
    delete global.currentUser;
    delete global.render;
    delete global.createMultiTableRealtimeSubscription;
    delete global.removeRealtimeSubscription;
    delete global.isEditingInlineCell;
    window.meDataReset();
  });

  it('subscribes through the consolidated ME realtime channel and keeps unsubscribe compatibility', () => {
    expect(global.createMultiTableRealtimeSubscription).toHaveBeenCalledWith(
      expect.any(Array),
      'me_all_channel'
    );
    expect(tableConfigs).toHaveLength(5);

    window.meDataUnsubscribe();

    expect(global.removeRealtimeSubscription).toHaveBeenCalledWith('me_all_channel');
  });

  it('updates team rows for existing realtime events and repaints', () => {
    window.meDataState.team = [
      {
        id: 'team-1',
        name: 'Alex',
        hoursPerWeek: 37,
        utilisation: 80,
        jobTitle: '',
        group: '',
        department: 'ME',
        startDate: '',
        endDate: '',
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];

    getTableConfig('me_teams').onUpdate({
      id: 'team-1',
      name: 'Updated Alex',
      hours_per_week: 20,
      utilisation: 65,
      department: 'LOG',
      job_title: 'Planner',
      team_group: 'Ops',
      start_date: '2026-03-10',
      end_date: '2026-03-20'
    });

    expect(window.meDataState.team).toEqual([
      expect.objectContaining({
        id: 'team-1',
        name: 'Updated Alex',
        hoursPerWeek: 20,
        utilisation: 65,
        department: 'LOG',
        jobTitle: 'Planner',
        group: 'Ops',
        startDate: '2026-03-10',
        endDate: '2026-03-20'
      })
    ]);
    expect(global.requestRender).toHaveBeenCalledWith('me', expect.objectContaining({ trigger: 'realtime' }));
  });

  it('updates product rows for existing realtime events and repaints', () => {
    window.meDataState.products = [
      {
        id: 'prod-1',
        name: 'Widget',
        productDatabaseId: 'db-1',
        hoursPerWeek: 5,
        kittingHours: 5,
        bookingInOutHours: 0,
        kittingTimeBookingHours: 5,
        productMovementHours: 0,
        department: 'ME',
        notes: '',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: ''
      }
    ];

    getTableConfig('me_products').onUpdate({
      id: 'prod-1',
      name: 'Updated Widget',
      product_database_id: 'db-1',
      hours_per_week: 2.25,
      kitting_hours: 1.25,
      booking_in_out_hours: 0.25,
      product_movement_hours: 0.75,
      department: 'LOG',
      notes: 'new note'
    });

    expect(window.meDataState.products).toEqual([
      expect.objectContaining({
        id: 'prod-1',
        name: 'Updated Widget',
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        kittingTimeBookingHours: 1.25,
        productMovementHours: 0.75,
        department: 'LOG',
        notes: 'new note'
      })
    ]);
    expect(global.requestRender).toHaveBeenCalledWith('me', expect.objectContaining({ trigger: 'realtime' }));
  });

  it('updates support history state and matching product values on support history update events and repaints', () => {
    window.meDataState.products = [
      {
        id: 'prod-1',
        name: 'Widget',
        productDatabaseId: 'db-1',
        hoursPerWeek: 5,
        kittingHours: 5,
        bookingInOutHours: 0,
        kittingTimeBookingHours: 5,
        productMovementHours: 0,
        department: 'ME',
        notes: '',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: ''
      }
    ];
    window.meDataState.productSupportHistory = [
      {
        id: 'hist-1',
        productId: 'prod-1',
        hoursPerWeek: 5,
        kittingHours: 5,
        bookingInOutHours: 0,
        kittingTimeBookingHours: 5,
        productMovementHours: 0,
        effectiveDate: '2026-03-05',
        endDate: '',
        changeReason: 'Baseline',
        notes: '',
        department: 'ME',
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z'
      }
    ];

    getTableConfig('me_product_support_history').onUpdate({
      id: 'hist-1',
      product_id: 'prod-1',
      hours_per_week: 2.25,
      kitting_hours: 1.25,
      booking_in_out_hours: 0.25,
      kitting_time_booking_hours: 1.25,
      product_movement_hours: 0.75,
      effective_date: '2026-03-05',
      end_date: '',
      change_reason: 'Split logistics work',
      notes: '',
      department: 'ME',
      created_at: '2026-03-05T00:00:00.000Z',
      updated_at: '2026-03-06T00:00:00.000Z'
    });

    expect(window.meDataState.productSupportHistory).toEqual([
      expect.objectContaining({
        id: 'hist-1',
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        productMovementHours: 0.75,
        effectiveDate: '2026-03-05'
      })
    ]);
    expect(window.meDataState.products[0]).toEqual(
      expect.objectContaining({
        hoursPerWeek: 2.25,
        kittingHours: 1.25,
        bookingInOutHours: 0.25,
        kittingTimeBookingHours: 1.25,
        productMovementHours: 0.75,
        supportEffectiveDate: '2026-03-05'
      })
    );
    expect(global.requestRender).toHaveBeenCalledWith('me', expect.objectContaining({ trigger: 'realtime' }));
  });

  it('defers realtime repaint while tasks search input is focused', () => {
    const input = document.createElement('input');
    input.setAttribute('data-cap-action', 'cap-task-search');
    document.body.appendChild(input);
    input.focus();

    getTableConfig('me_tasks').onInsert({
      id: 'task-search-focus',
      name: 'Search focus guard',
      category: 'NPI',
      type: 'standard',
      department: 'ME',
      assignee_id: '',
      product_id: '',
      start_date: '',
      end_date: '',
      total_hours: 1,
      status: 'SCHEDULED',
      is_disabled: false,
      created_at: '2026-03-01T00:00:00.000Z'
    });

    expect(window.meDataState.tasks).toEqual([
      expect.objectContaining({ id: 'task-search-focus' })
    ]);
    expect(global.requestRender).toHaveBeenCalledWith('me', expect.objectContaining({
      trigger: 'realtime',
      isFiltering: true,
    }));

    input.remove();
  });

  it('updates existing holidays on realtime update events and repaints', () => {
    window.meDataState.holidays = [
      {
        id: 'hol-1',
        userId: 'user-1',
        personId: 'person-1',
        date: '2026-04-01',
        type: 'full',
        department: 'ME',
        createdAt: '2026-03-01T00:00:00.000Z'
      }
    ];

    getTableConfig('me_holidays').onUpdate({
      id: 'hol-1',
      user_id: 'user-1',
      person_id: 'person-1',
      date: '2026-04-01',
      type: 'half',
      department: 'LOG',
      created_at: '2026-03-01T00:00:00.000Z'
    });

    expect(window.meDataState.holidays).toEqual([
      expect.objectContaining({
        id: 'hol-1',
        type: 'half',
        department: 'LOG'
      })
    ]);
    expect(global.requestRender).toHaveBeenCalledWith('me', expect.objectContaining({ trigger: 'realtime' }));
  });
});

describe('meDataReset()', () => {
  it('restores the full pending delete structure used by persistence saves', () => {
    window.meDataPendingDeletes = {
      tasks: ['task-1'],
      teams: ['team-1'],
      supportHistory: ['hist-1'],
      products: ['prod-1']
    };

    window.meDataReset();

    expect(window.meDataPendingDeletes).toEqual({
      tasks: [],
      teams: [],
      supportHistory: [],
      products: []
    });
    expect(window.meDataState.timeLogs).toEqual([]);
  });
});
