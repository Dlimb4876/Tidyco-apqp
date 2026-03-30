import { jest } from '@jest/globals'

// Mock Supabase and navigation
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

const { saveRemote, buildProjectRow, isGateScopeColumnError, setSyncBadge } = await import('../core/js/db.js')

describe('DB Gap Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      })),
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'test-user' } } }
        })
      }
    }
    global.progId = 'prog-1'
    global.currentUser = { id: 'test-user' }
  })

  it('should export saveRemote function', () => {
    expect(typeof saveRemote).toBe('function')
  })

  it('should export buildProjectRow function', () => {
    expect(typeof buildProjectRow).toBe('function')
  })

  it('should export isGateScopeColumnError function', () => {
    expect(typeof isGateScopeColumnError).toBe('function')
  })

  it('should export setSyncBadge function', () => {
    expect(typeof setSyncBadge).toBe('function')
  })
})
