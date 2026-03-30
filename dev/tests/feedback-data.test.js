import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn(),
  removeRealtimeSubscription: jest.fn()
}))

const { feedbackDataManager } = await import('../portals/feedback/js/feedback-data.js')

describe('Feedback data manager', () => {
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
        }))
      }))
    }
    global.currentUser = { id: 'user-1' }
  })

  it('should have feedbackDataManager object', () => {
    expect(feedbackDataManager).toBeDefined()
  })

  it('feedbackDataManager should have state property', () => {
    expect(feedbackDataManager.state).toBeDefined()
  })

  it('feedbackDataManager.state should have feedback array', () => {
    expect(Array.isArray(feedbackDataManager.state.feedback)).toBe(true)
  })

  it('feedbackDataManager.state should have filter object', () => {
    expect(feedbackDataManager.state.filter).toBeDefined()
  })
})
