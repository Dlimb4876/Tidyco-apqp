import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('unit6-data-relational', () => {
  beforeAll(() => {
    global.meNormalizeDateRange = jest.fn((startDate, endDate, todayStr) => ({
      safeStart: startDate || todayStr,
      safeEnd: endDate || todayStr
    }));
    global.meUUID = jest.fn(() => 'generated-id');

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/unit6/js/unit6-data-relational.js'),
      'utf8'
    );
    eval(script); // eslint-disable-line no-eval
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves Unit 6 tasks to unit6_tasks', async () => {
    const upsertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'task-1' }], error: null });
    const upsert = jest.fn(() => ({ select: upsertSelect }));
    global.supa = {
      from: jest.fn(() => ({ upsert }))
    };

    const result = await window.unit6SaveTaskRelational('user-1', {
      id: 'task-1',
      name: 'Inspect batch',
      category: 'Support',
      assigneeId: 'member-1',
      productId: '',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      totalHours: 4,
      status: 'SCHEDULED',
      isDisabled: false
    });

    expect(result.success).toBe(true);
    expect(global.supa.from).toHaveBeenCalledWith('unit6_tasks');
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'Inspect batch' })],
      { onConflict: 'id' }
    );
    const [payload] = upsert.mock.calls[0][0];
    expect(payload).not.toHaveProperty('department');
  });

  it('deletes holidays only from unit6_holidays', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const deleteFn = jest.fn(() => ({ eq }));
    global.supa = {
      from: jest.fn(() => ({ delete: deleteFn }))
    };

    const ok = await window.unit6DeleteHolidayRelational('holiday-1');

    expect(ok).toBe(true);
    expect(global.supa.from).toHaveBeenCalledWith('unit6_holidays');
    expect(eq).toHaveBeenCalledWith('id', 'holiday-1');
  });

  it('persists product support history to unit6_product_support_history', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const deleteFn = jest.fn(() => ({ eq }));
    const insert = jest.fn().mockResolvedValue({ error: null });
    global.supa = {
      from: jest.fn((table) => {
        if (table === 'unit6_product_support_history') return { delete: deleteFn, insert };
        return {};
      })
    };

    const ok = await window.unit6SaveProductSupportHistoryRelational('user-1', [{
      id: 'hist-1',
      productId: 'prod-1',
      hoursPerWeek: 3,
      effectiveDate: '2026-01-01',
      kittingHours: 1,
      bookingInOutHours: 1,
      productMovementHours: 1
    }]);

    expect(ok).toBe(true);
    expect(global.supa.from).toHaveBeenCalledWith('unit6_product_support_history');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ product_id: 'prod-1' })
    ]);
    const [rows] = insert.mock.calls[0];
    expect(rows[0]).not.toHaveProperty('department');
  });
});
