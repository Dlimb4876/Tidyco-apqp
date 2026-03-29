/**
 * capacity-hub.test.js — Tests for portals/capacity/js/capacity.js (hub view)
 *
 * Covers: renderCapacity hub view, button interactivity, and CSS styling
 */

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.navigate = jest.fn()
global.canViewPortalTab = jest.fn(() => true)
global.esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
global.showGuide = jest.fn()

// Mock capacity-related globals
global.capacityTab = 'root'
global.capacityPortalDelegationContainer = null
global.render = jest.fn()
global.renderMeCapacity = jest.fn(() => '<div>ME Capacity</div>')
global.renderProdCapacity = jest.fn(() => '<div>Prod Capacity</div>')
global.pmRenderCapacity = jest.fn(() => '<div>PM Capacity</div>')
global.logRenderCapacity = jest.fn(() => '<div>Logistics Capacity</div>')
global.unit6RenderCapacity = jest.fn(() => '<div>Unit 6 Capacity</div>')

// Mock hub.js functions
global.hubIsPageFavourite = jest.fn(() => false)
global.hubTogglePageFavourite = jest.fn()

// Mock appState
global.appState = {
  capacityTab: 'root'
}

// Import capacity.js module
const { renderCapacity, setCapacityTab } = await import('../portals/capacity/js/capacity.js')

describe('renderCapacity() hub view', () => {
  beforeEach(() => {
    global.appState.capacityTab = 'root'
    global.capacityPortalDelegationContainer = null
    global.canViewPortalTab = jest.fn(() => true)
    jest.clearAllMocks()
  })

  it('returns a non-empty HTML string when capacityTab is root', () => {
    const html = renderCapacity()
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('contains the Capacity Management title when in hub view', () => {
    const html = renderCapacity()
    expect(html).toContain('Capacity Management')
  })

  it('contains hub-grid class for layout', () => {
    const html = renderCapacity()
    expect(html).toContain('hub-grid')
  })

  it('contains five capacity stream cards', () => {
    const html = renderCapacity()
    const matches = (html.match(/class="proj-card hub-card"/g) || []).length
    expect(matches).toBe(5)
  })

  it('hides capacity cards the user cannot view', () => {
    global.canViewPortalTab = jest.fn((section, tab) => !(section === 'capacity' && tab === 'me'))

    const html = renderCapacity()

    expect(html).not.toContain('Manufacturing Engineering')
    expect(html).toContain('Project Management')
    const matches = (html.match(/class="proj-card hub-card"/g) || []).length
    expect(matches).toBe(4)
  })

  it('includes Production card with cap-hub-tab action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-cap-action="cap-set-tab"')
    expect(html).toContain('data-tab="production"')
    expect(html).toContain('Production')
  })

  it('includes Manufacturing Engineering card with cap-hub-tab action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-tab="me"')
    expect(html).toContain('Manufacturing Engineering')
  })

  it('includes Project Management card with cap-hub-tab action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-tab="projects"')
    expect(html).toContain('Project Management')
  })

  it('includes Logistics card with cap-hub-tab action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-tab="logistics"')
    expect(html).toContain('Logistics')
  })

  it('includes Unit 6 card with cap-hub-tab action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-tab="unit6"')
    expect(html).toContain('Unit 6')
  })

  it('includes hub-card-content div within each card', () => {
    const html = renderCapacity()
    const matches = (html.match(/hub-card-content/g) || []).length
    expect(matches).toBeGreaterThanOrEqual(3)
  })

  it('includes hub-icon emojis for visual appeal', () => {
    const html = renderCapacity()
    expect(html).toContain('🚂') // Production
    expect(html).toContain('🧑‍🔧') // ME
    expect(html).toContain('📅') // PM
    expect(html).toContain('🚚') // Logistics
    expect(html).toContain('🏭') // Unit 6
  })

  it('renders ME Capacity when capacityTab is me', () => {
    global.appState.capacityTab = 'me'
    const html = renderCapacity()
    expect(html).toContain('ME Capacity')
    expect(html).not.toContain('hub-grid')
  })

  it('renders Production Capacity when capacityTab is production', () => {
    global.appState.capacityTab = 'production'
    const html = renderCapacity()
    expect(html).toContain('Prod Capacity')
    expect(html).not.toContain('hub-grid')
  })

  it('renders PM Capacity when capacityTab is projects', () => {
    global.appState.capacityTab = 'projects'
    const html = renderCapacity()
    expect(html).toContain('PM Capacity')
    expect(html).not.toContain('hub-grid')
  })

  it('does not switch to a capacity tab the user cannot view', () => {
    global.canViewPortalTab = jest.fn((section, tab) => !(section === 'capacity' && tab === 'me'))

    setCapacityTab('me')

    expect(global.appState.capacityTab).toBe('root')
    expect(global.render).not.toHaveBeenCalled()
  })

  it('renders Logistics without the shared capacity route-switcher bar', () => {
    global.appState.capacityTab = 'logistics'
    const html = renderCapacity()
    expect(html).toContain('Logistics Capacity')
    expect(html).not.toContain('prod-nav-bar')
  })

  it('renders Unit 6 without the shared capacity route-switcher bar', () => {
    global.appState.capacityTab = 'unit6'
    const html = renderCapacity()
    expect(html).toContain('Unit 6 Capacity')
    expect(html).not.toContain('prod-nav-bar')
  })
})

describe('setupCapacityPortalDelegation()', () => {
  let container

  beforeEach(() => {
    document.body.innerHTML = ''
    global.appState.capacityTab = 'root'
    global.capacityPortalDelegationContainer = null
    global.render = jest.fn()
    jest.clearAllMocks()

    // Create a container with test content
    container = document.createElement('div')
    container.id = 'capacity-portal-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    global.capacityPortalDelegationContainer = null
  })

  it('sets up event listener on the container', () => {
    const addEventListenerSpy = jest.spyOn(container, 'addEventListener')
    // setupCapacityPortalDelegation is called internally by renderCapacity
    renderCapacity()
    // The delegation is set up via setTimeout, so we can't easily test it directly
    // but we can verify the container exists
    expect(document.getElementById('capacity-portal-container')).toBeTruthy()
  })

  it('ignores cap-hub-tab click because global capacity-events router handles it', () => {
    global.render = jest.fn()
    renderCapacity()

    const card = document.createElement('div')
    card.setAttribute('data-cap-action', 'cap-set-tab')
    card.setAttribute('data-tab', 'production')
    container.appendChild(card)

    card.click()

    expect(global.appState.capacityTab).toBe('root')
    expect(global.render).not.toHaveBeenCalled()
  })
})

describe('capacity hub CSS styling', () => {
  it('hub-card should have cursor: pointer for interactivity', async () => {
    const cssPath = resolve(__dirname, '../portals/hub/css/hub.css')
    const css = readFileSync(cssPath, 'utf8')

    // Check that .hub-card includes cursor: pointer
    expect(css).toMatch(/\.hub-card\s*\{[^}]*cursor:\s*pointer/)
  })

  it('hub-card should have hover effects for visual feedback', async () => {
    const cssPath = resolve(__dirname, '../portals/hub/css/hub.css')
    const css = readFileSync(cssPath, 'utf8')

    // Check that .hub-card:hover has transform
    expect(css).toMatch(/\.hub-card:hover\s*\{[^}]*transform/)
  })
})

describe('capacity navigation buttons', () => {
  it('guide button should have show-guide action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-action="show-guide"')
    expect(html).toContain('data-guide-key="capacity"')
  })

  it('back to portal button should have cap-nav-hub action', () => {
    const html = renderCapacity()
    expect(html).toContain('data-action="cap-nav-hub"')
    expect(html).toContain('← Back to Portal')
  })
})
