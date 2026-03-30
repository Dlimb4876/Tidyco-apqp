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

describe('PM data relational', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        upsert: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }
  })

  it('should have PM data module', async () => {
    const mod = await import('../portals/capacity/project-management/js/pm-data-relational.js')
    expect(mod).toBeDefined()
  })
})
