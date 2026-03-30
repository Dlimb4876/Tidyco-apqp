import { jest } from '@jest/globals'

// Mock Supabase
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user', email: 'test@test.com' }
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

const { save } = await import('../core/js/db.js')

describe('Core DB layer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: [], error: null }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      })),
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'test-user' } } }
        })
      }
    }
    global.progId = 'prog-1'
    global.currentUser = { id: 'test-user', email: 'test@test.com' }
  })

  it('should export save function', () => {
    expect(typeof save).toBe('function')
  })
})
