import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-uuid-123' }
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

describe('ME data relational', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn((table) => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        })),
        upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    global.currentUser = { id: 'user-uuid-123' }
  })

  it('should have Supabase module', async () => {
    const mod = await import('../portals/capacity/me/js/me-data-relational.js')
    expect(mod).toBeDefined()
  })
})
