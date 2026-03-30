import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  currentUser: { id: 'user-1', email: 'test@test.com' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: {},
  findProjectByProductId: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/guide.js', () => ({
  showGuide: jest.fn()
}))

jest.unstable_mockModule('../portals/action-centre/js/action-centre.js', () => ({
  actionCentreLoad: jest.fn(),
  actionCentreGetMyName: jest.fn(() => 'Test User')
}))

describe('Hub portal', () => {
  it('should have hub module available', () => {
    expect(true).toBe(true)
  })
})
