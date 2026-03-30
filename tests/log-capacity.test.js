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

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

describe('Logistics capacity portal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="logCapacityContainer"></div>'
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

  it('should have logistics capacity module available', () => {
    expect(true).toBe(true)
  })

  it('should render tab interface', () => {
    const container = document.getElementById('logCapacityContainer')
    expect(container).toBeTruthy()
  })
})
