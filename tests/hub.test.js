/**
 * hub.test.js — Tests for portals/hub/js/hub.js
 */

import { jest } from '@jest/globals'

// Import shared state and setters
import { appState, setCurrentUserRole, setCurrentUserPermissions } from '../core/js/state.js'
import { setCurrentUser } from '../core/js/supa.js'
import { settingsState } from '../portals/settings/js/settings.js'
import { setActionCentreLoad, setActionCentreGetMyName } from '../portals/action-centre/js/action-centre.js'

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.showGuide = jest.fn()

// Mock functions to use with setters
const mockActionCentreLoad = jest.fn()
const mockActionCentreGetMyName = jest.fn().mockReturnValue('')

// Apply mocks via setters
setActionCentreLoad(mockActionCentreLoad)
setActionCentreGetMyName(mockActionCentreGetMyName)

// Initial mock for productsState
global.productsState = {
  loaded: false,
  products: []
}

// Import hub.js module
const { 
  renderHub, 
  renderHubActionWidget, 
  hubInit, 
  hubTogglePageFavourite, 
  hubToggleProductFavourite, 
  hubGetFavouriteProducts, 
  hubIsProductFavourite, 
  hubOpenFavouritePage, 
  hubRemovePageFavourite, 
  hubRemoveProductFavourite 
} = await import('../portals/hub/js/hub.js')

// Helper to get favourites from localStorage regardless of the user key
function getStoredFavourites() {
  const key = Object.keys(localStorage).find(k => k.startsWith('tidyco_favourites_v1_'))
  if (!key) return null
  return JSON.parse(localStorage.getItem(key))
}

describe('renderHub()', () => {
  beforeEach(() => {
    localStorage.clear()
    setCurrentUser(null)
    setCurrentUserRole('admin')
    setCurrentUserPermissions({})
    
    // Reset appState
    appState.actionCentreLoading = false
    appState.actionCentreData = null
    appState.currentSection = 'hub'
    
    mockActionCentreGetMyName.mockReset()
    mockActionCentreLoad.mockReset()
    
    settingsState.settingsPermissionsData = []
  })

  it('returns a non-empty HTML string', () => {
    const html = renderHub()
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('contains the portal title', () => {
    const html = renderHub()
    expect(html).toContain('Tidyco Operations Portal')
  })

  it('contains a CAPACITY card', () => {
    const html = renderHub()
    expect(html).toContain('CAPACITY')
  })

  it('contains a PRODUCT DEVELOPMENT card', () => {
    const html = renderHub()
    expect(html).toContain('PRODUCT DEVELOPMENT')
  })

  it('hides cards the user cannot view', () => {
    setCurrentUserRole('viewer')
    setCurrentUserPermissions({ portal_capacity_view: false })

    const html = renderHub()

    expect(html).not.toContain('CAPACITY')
    expect(html).toContain('PRODUCT DEVELOPMENT')
  })

  it('contains a PRODUCTION card', () => {
    const html = renderHub()
    expect(html).toContain('PRODUCTION')
  })

  it('contains an OPERATIONS DASHBOARD card', () => {
    const html = renderHub()
    expect(html).toContain('OPERATIONS DASHBOARD')
  })

  it('includes hub-grid layout class', () => {
    const html = renderHub()
    expect(html).toContain('hub-grid')
  })

  it('includes hub-card class for each portal card', () => {
    const html = renderHub()
    const matches = (html.match(/hub-card/g) || []).length
    expect(matches).toBeGreaterThanOrEqual(4)
  })

  it('shows empty favourites message when no favourites are saved', () => {
    const html = renderHub()
    expect(html).toContain('No favourites yet. Star pages or NPI products for quick access.')
  })

  it('shows favourited page in favourites panel for current user', () => {
    setCurrentUser({ email: 'fav.user@example.com' })
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity'],
      products: []
    }))
    const html = renderHub()
    expect(html).toContain('📊 Capacity')
  })

  it('hides inaccessible favourites from the favourites panel', () => {
    setCurrentUser({ email: 'fav.user@example.com' })
    setCurrentUserRole('viewer')
    setCurrentUserPermissions({ 
      portal_capacity_view: false,
      portal_product_development_view: true 
    })
    
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity', 'product-development'],
      products: []
    }))

    const html = renderHub()

    expect(html).not.toContain('📊 Capacity')
    expect(html).toContain('🚀 Product Development')
  })
})

describe('renderHubActionWidget()', () => {
  beforeEach(() => {
    appState.actionCentreLoading = false
    appState.actionCentreData = null
    setCurrentUser(null)
    settingsState.settingsPermissionsData = []
    mockActionCentreGetMyName.mockReset()
    mockActionCentreGetMyName.mockReturnValue('')
  })

  it('renders the hub-widget container', () => {
    const html = renderHubActionWidget()
    expect(html).toContain('hub-widget')
  })

  it('includes "Logged in as" label', () => {
    const html = renderHubActionWidget()
    expect(html).toContain('Logged in as')
  })

  it('shows user name when actionCentreGetMyName returns a value', () => {
    mockActionCentreGetMyName.mockReturnValue('Daniel Limb')
    const html = renderHubActionWidget()
    expect(html).toContain('Daniel Limb')
  })

  it('falls back to emailToDisplayName when actionCentreGetMyName is not available', () => {
    mockActionCentreGetMyName.mockReturnValue('')
    setCurrentUser({ email: 'john.smith@example.com' })
    const html = renderHubActionWidget()
    expect(html).toContain('John Smith')
  })

  it('shows loading text when actionCentreLoading is true', () => {
    appState.actionCentreLoading = true
    const html = renderHubActionWidget()
    expect(html).toContain('Loading actions')
  })

  it('shows open and overdue counts when actionCentreData is loaded', () => {
    appState.actionCentreData = {
      actions: [
        { status: 'Open', due_date: '2020-01-01' }, // overdue
        { status: 'Closed', due_date: null },
      ],
      pfmea: [
        { action_taken: false, action_due: '2020-01-01' }, // overdue
      ],
      risks: [
        { status: 'Open' },
      ],
      error: null,
    }
    const html = renderHubActionWidget()
    expect(html).toContain('hub-widget-stats')
    expect(html).toContain('hub-widget-overdue') // overdue count highlighted
  })

  it('shows pending approval count when mcsApprovals has items', () => {
    appState.actionCentreData = {
      actions: [],
      pfmea: [],
      risks: [],
      mcsApprovals: [
        { change: { id: 'c1', title: 'Test Change', status: 'review' }, stepKey: 'approval1', stepLabel: 'Approval 1' },
        { change: { id: 'c2', title: 'Another Change', status: 'final_review' }, stepKey: 'approval2', stepLabel: 'Approval 2' },
      ],
      error: null,
    }
    const html = renderHubActionWidget()
    expect(html).toContain('hub-widget-pending')
    expect(html).toContain('2')
    expect(html).toContain('pending approval')
  })
})

describe('hubInit()', () => {
  it('calls actionCentreLoad when data is not loaded and not loading', () => {
    appState.actionCentreLoading = false
    appState.actionCentreData = null
    mockActionCentreLoad.mockReset()
    hubInit()
    expect(mockActionCentreLoad).toHaveBeenCalledTimes(1)
  })

  it('does not call actionCentreLoad when already loading', () => {
    appState.actionCentreLoading = true
    appState.actionCentreData = null
    mockActionCentreLoad.mockReset()
    hubInit()
    expect(mockActionCentreLoad).not.toHaveBeenCalled()
  })
})

describe('hub favourites storage', () => {
  beforeEach(() => {
    localStorage.clear()
    setCurrentUser({ email: 'star.user@example.com' })
    setCurrentUserRole('admin')
    setCurrentUserPermissions({})
    
    appState.currentSection = 'hub'
    appState.capacityTab = 'root'
    appState.productDevelopmentTab = 'root'
    appState.productionTab = 'root'
    
    // Reset productsState to a clean state for each test
    global.productsState = {
      loaded: true,
      products: [
        { id: 'prod_1', name: 'Product 1' },
        { id: 'prod_123', name: 'Product 123' },
        { id: 'prod_456', name: 'Product 456' },
        { id: 'existing_product', name: 'Existing Product' }
      ]
    }
  })

  it('toggles page favourites in localStorage', () => {
    hubTogglePageFavourite('capacity')
    let raw = getStoredFavourites()
    expect(raw.pages).toContain('capacity')

    hubTogglePageFavourite('capacity')
    raw = getStoredFavourites()
    expect(raw.pages).not.toContain('capacity')
  })

  it('toggles product favourites in localStorage', () => {
    hubToggleProductFavourite('prod_1')
    let raw = getStoredFavourites()
    expect(raw.products).toContain('prod_1')

    hubToggleProductFavourite('prod_1')
    raw = getStoredFavourites()
    expect(raw.products).not.toContain('prod_1')
  })

  it('caps stored page favourites to four items', () => {
    hubTogglePageFavourite('capacity')
    hubTogglePageFavourite('product-development')
    hubTogglePageFavourite('production')
    hubTogglePageFavourite('operations')
    hubTogglePageFavourite('mcs')

    const raw = getStoredFavourites()
    expect(raw.pages).toHaveLength(4)
    expect(raw.pages).not.toContain('mcs')
  })

  it('returns false for unknown product favourite', () => {
    expect(hubIsProductFavourite('missing')).toBe(false)
  })

  it('does not clear product favourites when products data is not loaded', () => {
    // Override productsState for this specific test
    global.productsState = { loaded: false, products: [] }

    hubToggleProductFavourite('prod_123')
    hubToggleProductFavourite('prod_456')

    const result = hubGetFavouriteProducts()

    const raw = getStoredFavourites()
    expect(raw.products).toContain('prod_123')
    expect(raw.products).toContain('prod_456')
    expect(result).toHaveLength(0)
  })

  it('clears stale product favourites only when products data is loaded', () => {
    // deleted_product is NOT in our beforeEach products list
    hubToggleProductFavourite('deleted_product')

    const result = hubGetFavouriteProducts()

    const raw = getStoredFavourites()
    expect(raw.products).not.toContain('deleted_product')
    expect(result).toHaveLength(0)
  })

  it('opens sub-hub favourites by navigating section then setting tab', () => {
    hubOpenFavouritePage('capacity::me')
    expect(appState.currentSection).toBe('capacity')
    expect(appState.capacityTab).toBe('me')
  })

  it('does not open a favourite page that is no longer viewable', () => {
    setCurrentUserRole('viewer')
    setCurrentUserPermissions({ portal_capacity_view: false })
    appState.currentSection = 'hub'
    appState.capacityTab = 'root'

    hubOpenFavouritePage('capacity::me')

    expect(appState.currentSection).toBe('hub')
    expect(appState.capacityTab).toBe('root')
  })

  it('removes page favourite with hubRemovePageFavourite', () => {
    hubTogglePageFavourite('capacity')
    let raw = getStoredFavourites()
    expect(raw.pages).toContain('capacity')

    hubRemovePageFavourite('capacity')
    raw = getStoredFavourites()
    expect(raw.pages).not.toContain('capacity')
  })

  it('removes product favourite with hubRemoveProductFavourite', () => {
    hubToggleProductFavourite('prod_123')
    let raw = getStoredFavourites()
    expect(raw.products).toContain('prod_123')

    hubRemoveProductFavourite('prod_123')
    raw = getStoredFavourites()
    expect(raw.products).not.toContain('prod_123')
  })

  it('includes delete buttons in favourites panel for pages', () => {
    setCurrentUser({ email: 'fav.user@example.com' })
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity'],
      products: []
    }))
    const html = renderHub()
    expect(html).toContain('data-hub-action="remove-page"')
    expect(html).toContain('hub-fav-delete')
  })

  it('includes delete buttons in favourites panel for products', () => {
    setCurrentUser({ email: 'fav.user@example.com' })
    global.productsState = { loaded: true, products: [{ id: 'prod_123', name: 'Test Product', status: 'Active' }] }
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: [],
      products: ['prod_123']
    }))
    const html = renderHub()
    expect(html).toContain('data-hub-action="remove-product"')
    expect(html).toContain('hub-fav-delete')
  })
})
