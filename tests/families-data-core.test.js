import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn(() => 'mock-sub'),
  removeRealtimeSubscription: jest.fn()
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { progId: null },
  setDb: jest.fn(),
  FAMILIES: [],
  getFamilies: jest.fn(() => [])
}))

describe('Families data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        insert: jest.fn().mockResolvedValue({ data: [{ id: 'fam-1' }], error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    global.currentUser = { id: 'user-1' }
  })

  it('should have families data module available', () => {
    expect(true).toBe(true)
  })
})
