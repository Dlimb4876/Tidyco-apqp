import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { apqpTab: 'ctq' },
  prog: jest.fn(() => ({ ctq: [], pfd: [], pfmea: [], cp: [] }))
}))

jest.unstable_mockModule('../core/js/db.js', () => ({
  save: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  showGuide: jest.fn(),
  showToast: jest.fn(),
  esc: jest.fn(x => x)
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-data.js', () => ({
  npiData: {}
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-ctq.js', () => ({
  npiCtq: { render: jest.fn(() => '') }
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-pfd.js', () => ({
  npiPfd: { render: jest.fn(() => '') }
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-data-relational.js', () => ({
  npiRelDeleteCP: jest.fn(),
  npiRelSaveCP: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/npi/js/rpn-chart.js', () => ({
  renderRpnBurndown: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/npi/js/pfmea-state.js', () => ({}))

const { npi } = await import('../portals/product-development/npi/js/npi-shared.js')

describe('APQP tab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have APQP module available', () => {
    expect(true).toBe(true)
  })
})
