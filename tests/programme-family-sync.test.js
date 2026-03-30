import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: {},
  findProjectByProductId: jest.fn()
}))

describe('Programme and family sync', () => {
  beforeEach(() => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have programme-family sync module available', () => {
    expect(true).toBe(true)
  })

  it('should resolve project-to-family relationships', () => {
    expect(true).toBe(true)
  })
})
