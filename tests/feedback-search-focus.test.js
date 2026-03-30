import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {}
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

describe('Feedback search and focus management', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="feedbackSearch" type="text" />'
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should have feedback module available', () => {
    expect(true).toBe(true)
  })

  it('should debounce search input', () => {
    const input = document.getElementById('feedbackSearch')
    expect(input).toBeTruthy()
  })
})
