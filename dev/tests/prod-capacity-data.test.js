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
})
