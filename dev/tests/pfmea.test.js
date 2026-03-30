import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  prog: jest.fn(() => ({ pfmea: [] }))
}))

jest.unstable_mockModule('../core/js/db.js', () => ({
  save: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  esc: jest.fn(x => x),
  emptyState: jest.fn(() => ''),
  showModal: jest.fn(),
  showToast: jest.fn(),
  canEdit: jest.fn(() => true),
  emailToDisplayName: jest.fn(x => x)
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-constants.js', () => ({
  RPN_HIGH: 100,
  RPN_CRITICAL: 200,
  PFMEA_SCORE_MIN: 1,
  PFMEA_SCORE_MAX: 10,
  SPECIAL_CHARS: ''
}))

jest.unstable_mockModule('../portals/product-development/npi/js/rpn-chart.js', () => ({
  renderRpnBurndown: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/npi/js/pfmea-state.js', () => ({}))

const { npi } = await import('../portals/product-development/npi/js/npi-shared.js')

describe('PFMEA module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have PFMEA module available', () => {
    expect(npi).toBeDefined()
    expect(npi.pfmea).toBeDefined()
  })
})
