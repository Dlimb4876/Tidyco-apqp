// Mock for @supabase/supabase-js
// Helper to build a chainable query builder
function createQueryBuilder() {
  return {
    select: jest.fn(function() { return this }),
    eq: jest.fn(function() { return this }),
    order: jest.fn(function() { return this }),
    range: jest.fn(() => Promise.resolve({ data: [], error: null })),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    update: jest.fn(() => Promise.resolve({ data: [], error: null })),
    delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    upsert: jest.fn(() => Promise.resolve({ data: [], error: null }))
  };
}

export const createClient = jest.fn(() => ({
  from: jest.fn(() => createQueryBuilder()),
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
