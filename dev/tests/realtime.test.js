import { jest } from '@jest/globals'

// Mock Supabase
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

const { createRealtimeSubscription, removeRealtimeSubscription, removeRealtimeSubscriptionsMatching, getActiveRealtimeSubscriptions, createMultiTableRealtimeSubscription } = await import('../utils/js/realtime.js')

describe('Realtime subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn().mockResolvedValue(null)
      })),
      removeChannel: jest.fn()
    }
  })

  it('should export createRealtimeSubscription function', () => {
    expect(typeof createRealtimeSubscription).toBe('function')
  })

  it('should export removeRealtimeSubscription function', () => {
    expect(typeof removeRealtimeSubscription).toBe('function')
  })

  it('should export removeRealtimeSubscriptionsMatching function', () => {
    expect(typeof removeRealtimeSubscriptionsMatching).toBe('function')
  })

  it('should export getActiveRealtimeSubscriptions function', () => {
    expect(typeof getActiveRealtimeSubscriptions).toBe('function')
  })

  it('should export createMultiTableRealtimeSubscription function', () => {
    expect(typeof createMultiTableRealtimeSubscription).toBe('function')
  })

  it('getActiveRealtimeSubscriptions should return array', () => {
    const result = getActiveRealtimeSubscriptions()
    expect(Array.isArray(result)).toBe(true)
  })
})
