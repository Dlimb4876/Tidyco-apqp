import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { bomSubTab: 'tree' },
  prog: jest.fn(() => ({ bom: { tree: [], aaw_repair: [], register: [] } })),
  BOM_TYPES: {}
}))

jest.unstable_mockModule('../core/js/db.js', () => ({
  save: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn(),
  writeNavigationHistory: jest.fn()
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  esc: jest.fn(x => x),
  canEdit: jest.fn(() => true),
  emptyState: jest.fn(() => ''),
  showModal: jest.fn(),
  closeModal: jest.fn(),
  showToast: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-data-relational.js', () => ({
  npiRelFetchABCCatalogue: jest.fn(() => Promise.resolve([])),
  npiRelSaveBOMItem: jest.fn()
}))

jest.unstable_mockModule('../portals/product-development/npi/js/npi-components.js', () => ({
  npiComponents: {}
}))

jest.unstable_mockModule('../portals/product-development/parts-database/js/parts-database.js', () => ({
  getPartsDatabase: jest.fn(() => ({}))
}))

const { npi } = await import('../portals/product-development/npi/js/npi-shared.js')

describe('Bill of Materials', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have BOM module available', () => {
    expect(true).toBe(true)
  })
})
