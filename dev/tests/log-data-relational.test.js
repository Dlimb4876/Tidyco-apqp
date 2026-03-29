import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper to transpile ESM to eval-compatible code with global exports
function transpileESMForEval(source) {
  return source
    .replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\n?/g, '')
    .replace(/export\s+async\s+function\s+(\w+)/g, 'global.$1 = async function $1')
    .replace(/export\s+function\s+(\w+)/g, 'global.$1 = function $1')
    .replace(/export\s+const\s+(\w+)/g, 'global.$1')
    .replace(/export\s+let\s+(\w+)/g, 'global.$1')
    .replace(/export\s+var\s+(\w+)/g, 'global.$1')
    .replace(/export\s+class\s+(\w+)/g, 'global.$1 = class $1')
    .replace(/export\s*\{/g, '// exports: {')
    .replace(/\}\s*from\s*['"][^'"]+['"];?/g, '}')
}

describe('log-data-relational', () => {
  beforeAll(() => {
    // Mock imports that the script depends on
    global.capNormalizeDateRange = jest.fn((startDate, endDate, todayStr) => ({
      safeStart: startDate || todayStr,
      safeEnd: endDate || todayStr
    }))
    global.capUUID = jest.fn(() => 'generated-id')
    global.meNormalizeDateRange = global.capNormalizeDateRange
    global.meUUID = global.capUUID
    global.currentUser = { id: 'user-1' }
    global.supabase = { from: jest.fn() }

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/logistics/js/log-data-relational.js'),
      'utf8'
    )
    const transpiled = transpileESMForEval(script)
    eval(transpiled) // eslint-disable-line no-eval
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('saves Logistics tasks to log_tasks', async () => {
    const upsertSelect = jest.fn().mockResolvedValue({ data: [{ id: 'task-1' }], error: null })
    const upsert = jest.fn(() => ({ select: upsertSelect }))
    global.supa = {
      from: jest.fn(() => ({ upsert }))
    }

    const result = await global.logSaveTaskRelational('user-1', {
      id: 'task-1',
      name: 'Move stock',
      category: 'Support',
      assigneeId: 'member-1',
      productId: '',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      totalHours: 4,
      status: 'SCHEDULED',
      isDisabled: false
    })

    expect(result.success).toBe(true)
    expect(global.supa.from).toHaveBeenCalledWith('log_tasks')
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'Move stock' })],
      { onConflict: 'id' }
    )
    const [payload] = upsert.mock.calls[0][0]
    expect(payload).not.toHaveProperty('department')
  })

  it('deletes holidays only from log_holidays', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const deleteFn = jest.fn(() => ({ eq }))
    global.supa = {
      from: jest.fn(() => ({ delete: deleteFn }))
    }

    const ok = await global.logDeleteHolidayRelational('holiday-1')

    expect(ok).toBe(true)
    expect(global.supa.from).toHaveBeenCalledWith('log_holidays')
    expect(eq).toHaveBeenCalledWith('id', 'holiday-1')
  })

  it('persists product support history to log_product_support_history', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const deleteFn = jest.fn(() => ({ eq }))
    const insert = jest.fn().mockResolvedValue({ error: null })
    global.supa = {
      from: jest.fn((table) => {
        if (table === 'log_product_support_history') return { delete: deleteFn, insert }
        return {}
      })
    }

    const ok = await global.logSaveProductSupportHistoryRelational('user-1', [{
      id: 'hist-1',
      productId: 'prod-1',
      hoursPerWeek: 3,
      effectiveDate: '2026-01-01',
      kittingHours: 1,
      bookingInOutHours: 1,
      productMovementHours: 1
    }])

    expect(ok).toBe(true)
    expect(global.supa.from).toHaveBeenCalledWith('log_product_support_history')
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ product_id: 'prod-1' })
    ])
    const [rows] = insert.mock.calls[0]
    expect(rows[0]).not.toHaveProperty('department')
  })
})
