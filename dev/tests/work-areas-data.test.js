import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn(),
  removeRealtimeSubscription: jest.fn()
}))

describe('Work areas data CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have work areas data module', async () => {
    const mod = await import('../portals/capacity/production/js/work-areas-data.js')
    expect(mod).toBeDefined()
  })
})
