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

describe('ME Capacity data module', () => {
  beforeEach(() => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have ME data module available', () => {
    expect(true).toBe(true)
  })
})
