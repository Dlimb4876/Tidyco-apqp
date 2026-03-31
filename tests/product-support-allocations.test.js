import { jest } from '@jest/globals'

/* Mock the Supabase module so me-data-relational.js picks up global.supa */
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: global.currentUser
}))
jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  safeWarn: jest.fn()
}))

/* ── Shared utilities under test ── */
const {
  capNormalizeAllocationRecord,
  capGetProductSupportAllocationsForDate,
  capNormalizeDateOnly
} = await import('../portals/capacity/shared/js/cap-data-utils.js')

/* ── Calculation engine under test ── */
const {
  capCalcWeekUtilisation,
  capGetProductBatchesInRange,
  capGetProductSupportHoursForBatch
} = await import('../portals/capacity/shared/js/cap-calculations.js')

/* ────────────────────────────────────────────────────────────
   4.1 — capNormalizeAllocationRecord
   ──────────────────────────────────────────────────────────── */
describe('capNormalizeAllocationRecord', () => {
  it('normalises a camelCase record', () => {
    const rec = {
      id: 'a1',
      productId: 'prod1',
      personId: 'p1',
      percentage: 60,
      effectiveDate: '2026-03-01',
      endDate: '',
      notes: 'primary'
    }
    const result = capNormalizeAllocationRecord(rec)
    expect(result.productId).toBe('prod1')
    expect(result.personId).toBe('p1')
    expect(result.percentage).toBe(60)
    expect(result.effectiveDate).toBe('2026-03-01')
    expect(result.endDate).toBe('')
    expect(result.notes).toBe('primary')
  })

  it('normalises a snake_case DB row', () => {
    const row = {
      id: 'a2',
      product_id: 'prod2',
      person_id: 'p2',
      percentage: 40,
      effective_date: '2026-04-01',
      end_date: '2026-05-31',
      notes: ''
    }
    const result = capNormalizeAllocationRecord(row)
    expect(result.productId).toBe('prod2')
    expect(result.personId).toBe('p2')
    expect(result.effectiveDate).toBe('2026-04-01')
    expect(result.endDate).toBe('2026-05-31')
  })

  it('clamps percentage to 0–100 range', () => {
    const over = capNormalizeAllocationRecord({
      id: 'x', productId: 'p', personId: 'q', effectiveDate: '2026-01-01', percentage: 150
    })
    expect(over.percentage).toBe(100)

    const under = capNormalizeAllocationRecord({
      id: 'y', productId: 'p', personId: 'q', effectiveDate: '2026-01-01', percentage: -10
    })
    expect(under.percentage).toBe(0)
  })

  it('returns null for missing required fields', () => {
    expect(capNormalizeAllocationRecord(null)).toBeNull()
    expect(capNormalizeAllocationRecord({})).toBeNull()
    expect(capNormalizeAllocationRecord({ productId: 'p' })).toBeNull()
    expect(capNormalizeAllocationRecord({ personId: 'q' })).toBeNull()
    expect(capNormalizeAllocationRecord({ productId: 'p', personId: 'q' })).toBeNull()
  })

  it('generates an id when none provided', () => {
    const result = capNormalizeAllocationRecord({
      productId: 'p', personId: 'q', effectiveDate: '2026-01-01', percentage: 50
    })
    expect(result.id).toBeTruthy()
    expect(typeof result.id).toBe('string')
  })
})

/* ────────────────────────────────────────────────────────────
   4.1 — capGetProductSupportAllocationsForDate
   ──────────────────────────────────────────────────────────── */
describe('capGetProductSupportAllocationsForDate', () => {
  const allocations = [
    { productId: 'prod1', personId: 'p1', percentage: 60, effectiveDate: '2026-01-01', endDate: '2026-03-31' },
    { productId: 'prod1', personId: 'p2', percentage: 40, effectiveDate: '2026-01-01', endDate: '2026-03-31' },
    { productId: 'prod1', personId: 'p1', percentage: 50, effectiveDate: '2026-04-01', endDate: '' },
    { productId: 'prod1', personId: 'p3', percentage: 50, effectiveDate: '2026-04-01', endDate: '' },
    { productId: 'prod2', personId: 'p1', percentage: 100, effectiveDate: '2026-02-01', endDate: '' }
  ]

  it('returns the active allocation set for a mid-range date', () => {
    const result = capGetProductSupportAllocationsForDate('prod1', '2026-02-15', allocations)
    expect(result).toEqual([
      { personId: 'p1', percentage: 60 },
      { personId: 'p2', percentage: 40 }
    ])
  })

  it('returns the latest set when multiple sets could match', () => {
    // 2026-04-15 matches both the Jan set (endDate 2026-03-31 excludes it) and the Apr set
    const result = capGetProductSupportAllocationsForDate('prod1', '2026-04-15', allocations)
    expect(result).toEqual([
      { personId: 'p1', percentage: 50 },
      { personId: 'p3', percentage: 50 }
    ])
  })

  it('returns [] when no allocations match the product', () => {
    const result = capGetProductSupportAllocationsForDate('unknown', '2026-02-15', allocations)
    expect(result).toEqual([])
  })

  it('returns [] when date is before all allocation effective dates', () => {
    const result = capGetProductSupportAllocationsForDate('prod1', '2025-12-31', allocations)
    expect(result).toEqual([])
  })

  it('returns [] for null/empty inputs', () => {
    expect(capGetProductSupportAllocationsForDate(null, '2026-01-01', allocations)).toEqual([])
    expect(capGetProductSupportAllocationsForDate('prod1', null, allocations)).toEqual([])
    expect(capGetProductSupportAllocationsForDate('prod1', '2026-01-01', null)).toEqual([])
    expect(capGetProductSupportAllocationsForDate('prod1', '2026-01-01', [])).toEqual([])
  })

  it('respects endDate boundaries exactly', () => {
    // On the endDate itself — should still be active
    const onEnd = capGetProductSupportAllocationsForDate('prod1', '2026-03-31', allocations)
    expect(onEnd.length).toBe(2)
    expect(onEnd[0].personId).toBe('p1')

    // Day after endDate — old set gone, new set not yet active
    const afterEnd = capGetProductSupportAllocationsForDate('prod1', '2026-04-01', allocations)
    expect(afterEnd.length).toBe(2)
    expect(afterEnd[0].percentage).toBe(50) // April set
  })

  it('returns the single-person allocation for prod2', () => {
    const result = capGetProductSupportAllocationsForDate('prod2', '2026-06-01', allocations)
    expect(result).toEqual([{ personId: 'p1', percentage: 100 }])
  })
})

/* ────────────────────────────────────────────────────────────
   4.2 — capCalcWeekUtilisation with allocation options
   ──────────────────────────────────────────────────────────── */
describe('capCalcWeekUtilisation with product-support allocations', () => {
  const team = [
    { id: 'p1', name: 'Alice', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 },
    { id: 'p2', name: 'Bob', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }
  ]
  // A product with an active batch in the test week
  const products = [{
    id: 'prod1',
    name: 'Widget',
    productDatabaseId: 'db-prod1',
    hoursPerWeek: 10
  }]
  const batches = [{
    product_id: 'db-prod1',
    start_date: '2026-03-01',
    due_date: '2026-06-30'
  }]
  const allocations = [
    { productId: 'prod1', personId: 'p1', percentage: 60, effectiveDate: '2026-01-01', endDate: '' },
    { productId: 'prod1', personId: 'p2', percentage: 40, effectiveDate: '2026-01-01', endDate: '' }
  ]

  beforeEach(() => {
    global.prodState = { batches: [] }
    global.meDataGetProductSupportRateForDate = undefined
  })

  it('adds product-support demand to the allocated person', () => {
    const options = {
      productsArray: products,
      allocationsArray: allocations,
      productionBatches: batches
    }
    // Week of 2026-03-16 to 2026-03-22 (Mon-Sun)
    const resultP1 = capCalcWeekUtilisation('p1', '2026-03-16', '2026-03-22', [], [], team, options)
    // Product support is spread across full batch span.
    // 122-day batch, 7-day overlap => 10 * (7/122) total in week; p1 gets 60%.
    expect(resultP1.demand).toBeCloseTo(0.344, 2)

    const resultP2 = capCalcWeekUtilisation('p2', '2026-03-16', '2026-03-22', [], [], team, options)
    // p2 gets 40% of the same weekly overlap
    expect(resultP2.demand).toBeCloseTo(0.229, 2)
  })

  it('leaves demand at zero when person has no allocation', () => {
    const allocsP1Only = [
      { productId: 'prod1', personId: 'p1', percentage: 100, effectiveDate: '2026-01-01', endDate: '' }
    ]
    const options = {
      productsArray: products,
      allocationsArray: allocsP1Only,
      productionBatches: batches
    }
    const resultP2 = capCalcWeekUtilisation('p2', '2026-03-16', '2026-03-22', [], [], team, options)
    expect(resultP2.demand).toBe(0)
  })

  it('returns zero demand when no options are passed (backward compatible)', () => {
    const result = capCalcWeekUtilisation('p1', '2026-03-16', '2026-03-22', [], [], team)
    expect(result.demand).toBe(0)
  })

  it('returns zero demand when options is a string like "ME" (backward compatible)', () => {
    const result = capCalcWeekUtilisation('p1', '2026-03-16', '2026-03-22', [], [], team, 'ME')
    expect(result.demand).toBe(0)
  })

  it('returns zero demand when product has no overlapping batch', () => {
    const noBatches = [{
      product_id: 'db-prod1',
      start_date: '2025-01-01',
      due_date: '2025-06-30' // ended long ago
    }]
    const options = {
      productsArray: products,
      allocationsArray: allocations,
      productionBatches: noBatches
    }
    const result = capCalcWeekUtilisation('p1', '2026-03-16', '2026-03-22', [], [], team, options)
    expect(result.demand).toBe(0)
  })

  it('uses supportRateResolver when provided', () => {
    const resolver = jest.fn(() => 20) // 20 hrs/week instead of 10
    const options = {
      productsArray: products,
      allocationsArray: allocations,
      productionBatches: batches,
      supportRateResolver: resolver
    }
    const result = capCalcWeekUtilisation('p1', '2026-03-16', '2026-03-22', [], [], team, options)
    // 20 * (7/122) * 60%
    expect(result.demand).toBeCloseTo(0.689, 2)
    expect(resolver).toHaveBeenCalled()
  })

  it('spreads support evenly by batch day span for short batches', () => {
    const shortBatch = [{
      product_id: 'db-prod1',
      start_date: '2026-03-10',
      due_date: '2026-03-19'
    }]
    const options = {
      productsArray: products,
      allocationsArray: [
        { productId: 'prod1', personId: 'p1', percentage: 100, effectiveDate: '2026-01-01', endDate: '' }
      ],
      productionBatches: shortBatch
    }
    // 10-day span with 2h per batch => 0.2h/day. Week overlap is 4 days => 0.8h demand.
    const shortBatchProduct = [{ ...products[0], hoursPerWeek: 2 }]
    const result = capCalcWeekUtilisation(
      'p1',
      '2026-03-16',
      '2026-03-22',
      [],
      [],
      team,
      { ...options, productsArray: shortBatchProduct }
    )
    expect(result.demand).toBeCloseTo(0.8, 3)
  })
})

/* ────────────────────────────────────────────────────────────
   4.3 — Allocation percentage validation (client-side guard)
   ──────────────────────────────────────────────────────────── */
describe('Allocation percentage validation', () => {
  // The client should validate that allocation percentages for a single
  // product+date set sum to ≤ 100. This is tested as a pure logic function.
  function validateAllocationSet(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return { valid: true, total: 0 }
    const total = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0)
    return { valid: total <= 100, total }
  }

  it('accepts allocations summing to exactly 100', () => {
    const rows = [{ percentage: 60 }, { percentage: 40 }]
    expect(validateAllocationSet(rows)).toEqual({ valid: true, total: 100 })
  })

  it('accepts allocations summing to less than 100', () => {
    const rows = [{ percentage: 30 }, { percentage: 20 }]
    expect(validateAllocationSet(rows)).toEqual({ valid: true, total: 50 })
  })

  it('rejects allocations summing to more than 100', () => {
    const rows = [{ percentage: 60 }, { percentage: 50 }]
    expect(validateAllocationSet(rows)).toEqual({ valid: false, total: 110 })
  })

  it('treats empty array as valid', () => {
    expect(validateAllocationSet([])).toEqual({ valid: true, total: 0 })
  })
})

/* ────────────────────────────────────────────────────────────
   4.4 — meSaveProductSupportAllocationSet (DB mock)
   Uses jest.unstable_mockModule so the module picks up the
   global.supa chainable mock via core/js/supa.js.
   ──────────────────────────────────────────────────────────── */
describe('meSaveProductSupportAllocationSet', () => {
  let meSaveProductSupportAllocationSet
  let mockInsert

  beforeAll(async () => {
    // Track insert calls across tests
    mockInsert = jest.fn().mockResolvedValue({ error: null })

    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn().mockResolvedValue({ error: null })
          }))
        })),
        insert: mockInsert,
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      }))
    }
    global.currentUser = { id: 'test-user' }

    // Re-import the module to pick up mocks
    const mod = await import('../portals/capacity/me/js/me-data-relational.js')
    meSaveProductSupportAllocationSet = mod.meSaveProductSupportAllocationSet
  })

  beforeEach(() => {
    mockInsert.mockClear()
    global.supa.from.mockClear()
  })

  it('closes previous open-ended rows then inserts new set', async () => {
    const result = await meSaveProductSupportAllocationSet('prod1', '2026-04-01', [
      { personId: 'p1', percentage: 60 },
      { personId: 'p2', percentage: 40 }
    ])
    expect(result).toBe(true)
    expect(global.supa.from).toHaveBeenCalledWith('me_product_support_allocations')
    expect(mockInsert).toHaveBeenCalled()

    const insertPayload = mockInsert.mock.calls[0][0]
    expect(insertPayload.length).toBe(2)
    expect(insertPayload[0].product_id).toBe('prod1')
    expect(insertPayload[0].person_id).toBe('p1')
    expect(insertPayload[0].percentage).toBe(60)
    expect(insertPayload[0].effective_date).toBe('2026-04-01')
    expect(insertPayload[0].end_date).toBeNull()
    expect(insertPayload[1].person_id).toBe('p2')
    expect(insertPayload[1].percentage).toBe(40)
  })

  it('returns false when required params are missing', async () => {
    expect(await meSaveProductSupportAllocationSet(null, '2026-01-01', [])).toBe(false)
    expect(await meSaveProductSupportAllocationSet('prod1', null, [])).toBe(false)
  })

  it('filters out rows with 0% or missing personId', async () => {
    const result = await meSaveProductSupportAllocationSet('prod1', '2026-04-01', [
      { personId: 'p1', percentage: 60 },
      { personId: '', percentage: 40 },
      { personId: 'p3', percentage: 0 }
    ])
    expect(result).toBe(true)
    const insertPayload = mockInsert.mock.calls[0][0]
    expect(insertPayload.length).toBe(1)
    expect(insertPayload[0].person_id).toBe('p1')
  })

  it('returns true with no insert when all rows are filtered out', async () => {
    const result = await meSaveProductSupportAllocationSet('prod1', '2026-04-01', [
      { personId: '', percentage: 0 }
    ])
    expect(result).toBe(true)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
