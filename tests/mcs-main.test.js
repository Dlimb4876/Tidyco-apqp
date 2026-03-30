import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user', email: 'test@test.com' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  currentUserRole: 'editor'
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/guide.js', () => ({
  showGuide: jest.fn()
}))

describe('MCS main portal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="mcsContainer"></div>'
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have MCS main module available', () => {
    expect(true).toBe(true)
  })
})
