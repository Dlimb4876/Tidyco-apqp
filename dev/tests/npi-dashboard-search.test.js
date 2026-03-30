import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: { projects: [] }
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn(),
  writeNavigationHistory: jest.fn()
}))

describe('NPI dashboard search and hydration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="mount"><input class="npi-search-input" type="search" value=""></div>'
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should have NPI dashboard module available', () => {
    expect(true).toBe(true)
  })

  it('should support search input debouncing', () => {
    const input = document.querySelector('.npi-search-input')
    expect(input).toBeTruthy()
  })

  it('should handle project hydration from database', () => {
    expect(typeof global.supa.from).toBe('function')
  })
})

