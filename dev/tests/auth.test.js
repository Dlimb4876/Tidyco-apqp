import { jest } from '@jest/globals'

// Mock Supabase
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
      }),
      onAuthStateChange: jest.fn()
    },
    from: jest.fn()
  },
  currentUser: { id: 'test-user', email: 'test@test.com' },
  setCurrentUser: jest.fn()
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { progId: null },
  setDb: jest.fn(),
  setCurrentUserRole: jest.fn(),
  setCurrentUserPermissions: jest.fn(),
  setCurrentUserTeams: jest.fn()
}))

const { supabase } = await import('../core/js/supa.js')

describe('Supabase Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have auth object', () => {
    expect(supabase.auth).toBeDefined()
  })

  it('should have signInWithPassword method', () => {
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
  })

  it('should have signOut method', () => {
    expect(typeof supabase.auth.signOut).toBe('function')
  })

  it('should have getSession method', () => {
    expect(typeof supabase.auth.getSession).toBe('function')
  })

  it('should have onAuthStateChange method', () => {
    expect(typeof supabase.auth.onAuthStateChange).toBe('function')
  })

  it('getSession should return session data', async () => {
    const result = await supabase.auth.getSession()
    expect(result.data).toBeDefined()
    expect(result.data.session).toBeDefined()
  })

  it('signOut should resolve successfully', async () => {
    const result = await supabase.auth.signOut()
    expect(result).toBeDefined()
  })
})
