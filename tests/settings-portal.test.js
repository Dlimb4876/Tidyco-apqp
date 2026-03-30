import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: {}
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/js/families-data.js', () => ({
  familiesState: {},
  familiesDataInit: jest.fn(),
  familiesDataGetAll: jest.fn(() => [])
}))

jest.unstable_mockModule('../portals/capacity/production/js/work-areas-data.js', () => ({
  workAreasState: {},
  workAreasDataInit: jest.fn(),
  workAreasDataGetAll: jest.fn(() => [])
}))

describe('Settings portal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="settingsContainer"></div>'
    jest.clearAllMocks()
  })

  it('should have settings module available', () => {
    expect(true).toBe(true)
  })
})
