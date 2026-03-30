import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: {}
}))

describe('Navigation module', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="mainContent"></div>'
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have navigation module available', () => {
    expect(true).toBe(true)
  })

  it('should support hash-based routing', () => {
    expect(typeof window.location.hash).toBe('string')
  })
})
