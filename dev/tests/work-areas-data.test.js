/**
 * work-areas-data.test.js
 *
 * Verifies that CRUD operations in work-areas-data.js target the correct
 * table and use the expected column names in inserts, updates, and deletes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Globals required by the script at eval time
global.currentUser = { id: 'user-uuid-test' };
global.showToast = jest.fn();
global.render = jest.fn();
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
global.esc = (v) => String(v || '');
global.supa = { from: jest.fn() };

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/production/js/work-areas-data.js'),
  'utf8'
);
eval(script); // eslint-disable-line no-eval

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── workAreasDataInit ────────────────────────────────────────

describe('workAreasDataInit', () => {
  test('queries work_areas table ordered by name ascending', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });
    const selectMock = jest.fn(() => ({ order: orderMock }));
    global.supa = { from: jest.fn(() => ({ select: selectMock })) };

    await workAreasDataInit();

    expect(global.supa.from).toHaveBeenCalledWith('work_areas');
    expect(orderMock).toHaveBeenCalledWith('name', { ascending: true });
  });

  test('populates workAreasState on success', async () => {
    const rows = [{ id: 'wa-1', name: 'Unit 5', description: '' }];
    const orderMock = jest.fn().mockResolvedValue({ data: rows, error: null });
    global.supa = { from: jest.fn(() => ({ select: jest.fn(() => ({ order: orderMock })) })) };

    const result = await workAreasDataInit();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Unit 5');
  });
});

// ─── workAreasDataAddWorkArea ─────────────────────────────────

describe('workAreasDataAddWorkArea', () => {
  test('inserts to work_areas with user_id, name, and description', async () => {
    const selectAfterInsert = jest.fn().mockResolvedValue({
      data: [{ id: 'wa-new', name: 'Unit 5', description: 'Test area' }],
      error: null
    });
    const insertMock = jest.fn(() => ({ select: selectAfterInsert }));
    global.supa = { from: jest.fn(() => ({ insert: insertMock })) };

    await workAreasDataAddWorkArea('Unit 5', 'Test area');

    expect(global.supa.from).toHaveBeenCalledWith('work_areas');
    expect(insertMock).toHaveBeenCalledWith(
      [expect.objectContaining({
        user_id: 'user-uuid-test',
        name: 'Unit 5',
        description: 'Test area'
      })]
    );
  });

  test('trims whitespace from name and description before inserting', async () => {
    const selectAfterInsert = jest.fn().mockResolvedValue({ data: [{ id: 'wa-x', name: 'Unit 5' }], error: null });
    const insertMock = jest.fn(() => ({ select: selectAfterInsert }));
    global.supa = { from: jest.fn(() => ({ insert: insertMock })) };

    await workAreasDataAddWorkArea('  Unit 5  ', '  Desc  ');

    const [payload] = insertMock.mock.calls[0][0];
    expect(payload.name).toBe('Unit 5');
    expect(payload.description).toBe('Desc');
  });

  test('returns null and does not call supa when name is empty', async () => {
    global.supa = { from: jest.fn() };

    const result = await workAreasDataAddWorkArea('', 'Desc');

    expect(result).toBeNull();
    expect(global.supa.from).not.toHaveBeenCalled();
  });
});

// ─── workAreasDataUpdateWorkArea ──────────────────────────────

describe('workAreasDataUpdateWorkArea', () => {
  async function seedWorkArea (id, name) {
    const orderMock = jest.fn().mockResolvedValue({ data: [{ id, name }], error: null });
    global.supa = { from: jest.fn(() => ({ select: jest.fn(() => ({ order: orderMock })) })) };
    await workAreasDataInit();
  }

  test('updates work_areas filtered by id', async () => {
    await seedWorkArea('wa-1', 'Unit 5');

    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: eqMock }));
    global.supa = { from: jest.fn(() => ({ update: updateMock })) };

    await workAreasDataUpdateWorkArea('wa-1', { description: 'Updated' });

    expect(global.supa.from).toHaveBeenCalledWith('work_areas');
    expect(eqMock).toHaveBeenCalledWith('id', 'wa-1');
  });

  test('returns false without calling supa when work area is not found', async () => {
    await seedWorkArea('wa-1', 'Unit 5');

    global.supa = { from: jest.fn() };

    const result = await workAreasDataUpdateWorkArea('wa-999', { description: 'X' });

    expect(result).toBe(false);
    expect(global.supa.from).not.toHaveBeenCalled();
  });
});

// ─── workAreasDataDeleteWorkArea ──────────────────────────────

describe('workAreasDataDeleteWorkArea', () => {
  async function seedWorkArea (id, name) {
    const orderMock = jest.fn().mockResolvedValue({ data: [{ id, name }], error: null });
    global.supa = { from: jest.fn(() => ({ select: jest.fn(() => ({ order: orderMock })) })) };
    await workAreasDataInit();
  }

  test('deletes from work_areas filtered by id', async () => {
    await seedWorkArea('wa-2', 'Unit 6');

    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteMock = jest.fn(() => ({ eq: eqMock }));
    global.supa = { from: jest.fn(() => ({ delete: deleteMock })) };

    await workAreasDataDeleteWorkArea('wa-2');

    expect(global.supa.from).toHaveBeenCalledWith('work_areas');
    expect(eqMock).toHaveBeenCalledWith('id', 'wa-2');
  });

  test('returns false without calling supa when work area is not found', async () => {
    await seedWorkArea('wa-2', 'Unit 6');

    global.supa = { from: jest.fn() };

    const result = await workAreasDataDeleteWorkArea('wa-999');

    expect(result).toBe(false);
    expect(global.supa.from).not.toHaveBeenCalled();
  });
});
