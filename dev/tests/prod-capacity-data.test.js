import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity.js', () => ({
  renderProdCapacity: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

const { appState } = await import('../core/js/state.js')

describe('Production capacity data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    global.currentUser = { id: 'test-user' }
    global.prodCapUtilizationFactor = 1
    global.prodState = { products: [], batches: [] }
    global.workAreasState = { workAreas: [] }
  })

  it('should have prod-capacity-data module', async () => {
    const mod = await import('../portals/capacity/production/js/prod-capacity-data.js')
    expect(mod).toBeDefined()
  })

  it('should keep month key generation stable with invalid offset value', async () => {
    const mod = await import('../portals/capacity/production/js/prod-capacity-data.js')
    appState.prodCapMonthOffset = Number.NaN
    const keys = mod.prodCapGet24MonthKeys()
    expect(Array.isArray(keys)).toBe(true)
    expect(keys).toHaveLength(24)
    expect(keys.every(k => /^\d{4}-\d{2}$/.test(k))).toBe(true)
  })
})
