import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  currentUserRole: 'editor',
  currentUserPermissions: []
}))

jest.unstable_mockModule('../core/js/db.js', () => ({
  save: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn()
}))

const { esc, canViewPageKey, canEdit } = await import('../utils/js/helpers.js')

describe('Helper utilities', () => {
  it('should export esc function', () => {
    expect(typeof esc).toBe('function')
  })

  it('should export canViewPageKey function', () => {
    expect(typeof canViewPageKey).toBe('function')
  })

  it('should export canEdit function', () => {
    expect(typeof canEdit).toBe('function')
  })

  it('esc should escape HTML special chars', () => {
    const result = esc('<script>alert("xss")</script>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })
})
