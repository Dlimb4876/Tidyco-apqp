// Mock for @supabase/supabase-js
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: jest.fn(() => Promise.resolve({ data: null, error: null }))
  })),
  auth: {
    getSession: jest.fn(() => Promise.resolve({
      data: {
        session: {
          user: {
            id: 'test-user',
            email: 'test@test.com'
          }
        }
      },
      error: null
    })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    signInWithPassword: jest.fn(),
    signOut: jest.fn()
  },
  channel: jest.fn(() => ({
    on: jest.fn(function() { return this }),
    subscribe: jest.fn()
  })),
  removeChannel: jest.fn()
}))

export default { createClient }
