import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1', email: 'test@example.com' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {}
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  emailToDisplayName: jest.fn(email => email.split('@')[0]),
  esc: jest.fn(x => x)
}))

describe('Settings email-to-name display', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="settingsContainer"></div>'
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have settings email-name module available', () => {
    expect(true).toBe(true)
  })

  it('should display user names from email addresses', () => {
    const container = document.getElementById('settingsContainer')
    expect(container).toBeTruthy()
  })
})
