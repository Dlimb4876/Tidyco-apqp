/**
 * capacity-hub.test.js — Tests for portals/capacity/js/capacity.js (hub view)
 *
 * Covers: renderCapacity hub view, button interactivity, and CSS styling
 */

const fs = require('fs')
const path = require('path')

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.navigate = jest.fn()
global.esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
global.showGuide = jest.fn()

// Mock capacity-related globals
global.capacityTab = 'root'
global.capacityPortalDelegationContainer = null
global.render = jest.fn()
global.renderMeCapacity = jest.fn(() => '<div>ME Capacity</div>')
global.renderProdCapacity = jest.fn(() => '<div>Prod Capacity</div>')
global.pmRenderCapacity = jest.fn(() => '<div>PM Capacity</div>')

// Load capacity.js
const capacitySrc = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/capacity.js'),
  'utf8'
)
eval(capacitySrc) // eslint-disable-line no-eval

describe('renderCapacity() hub view', () => {
  beforeEach(() => {
    global.capacityTab = 'root'
    global.capacityPortalDelegationContainer = null
    jest.clearAllMocks()
  })

  it('returns a non-empty HTML string when capacityTab is root', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('contains the Capacity Management title when in hub view', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('Capacity Management')
  })

  it('contains hub-grid class for layout', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('hub-grid')
  })

  it('contains three capacity stream cards', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    const matches = (html.match(/class="proj-card hub-card"/g) || []).length
    expect(matches).toBe(3)
  })

  it('includes Production card with cap-hub-tab action', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('data-action="cap-hub-tab"')
    expect(html).toContain('data-tab="production"')
    expect(html).toContain('Production')
  })

  it('includes Manufacturing Engineering card with cap-hub-tab action', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('data-tab="me"')
    expect(html).toContain('Manufacturing Engineering')
  })

  it('includes Project Management card with cap-hub-tab action', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('data-tab="projects"')
    expect(html).toContain('Project Management')
  })

  it('includes hub-card-content div within each card', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    const matches = (html.match(/hub-card-content/g) || []).length
    expect(matches).toBeGreaterThanOrEqual(3)
  })

  it('includes hub-icon emojis for visual appeal', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('🚂') // Production
    expect(html).toContain('🧑‍🔧') // ME
    expect(html).toContain('📅') // PM
  })

  it('renders ME Capacity when capacityTab is me', () => {
    global.capacityTab = 'me'
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('ME Capacity')
    expect(html).not.toContain('hub-grid')
  })

  it('renders Production Capacity when capacityTab is production', () => {
    global.capacityTab = 'production'
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('Prod Capacity')
    expect(html).not.toContain('hub-grid')
  })

  it('renders PM Capacity when capacityTab is projects', () => {
    global.capacityTab = 'projects'
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('PM Capacity')
    expect(html).not.toContain('hub-grid')
  })
})

describe('setupCapacityPortalDelegation()', () => {
  let container

  beforeEach(() => {
    document.body.innerHTML = ''
    global.capacityTab = 'root'
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
    setupCapacityPortalDelegation() // eslint-disable-line no-undef
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('handles cap-hub-tab click to update capacity tab', () => {
    global.render = jest.fn()
    setupCapacityPortalDelegation() // eslint-disable-line no-undef

    const card = document.createElement('div')
    card.setAttribute('data-action', 'cap-hub-tab')
    card.setAttribute('data-tab', 'production')
    container.appendChild(card)

    card.click()

    // Verify that capacityTab was changed and render was called
    expect(global.capacityTab).toBe('production')
    expect(global.render).toHaveBeenCalled()
  })

  it('handles cap-nav-root click to go back to root view', () => {
    global.render = jest.fn()
    global.capacityTab = 'me'
    setupCapacityPortalDelegation() // eslint-disable-line no-undef

    const button = document.createElement('button')
    button.setAttribute('data-action', 'cap-nav-root')
    container.appendChild(button)

    button.click()

    // Verify that capacityTab was set to root and render was called
    expect(global.capacityTab).toBe('root')
    expect(global.render).toHaveBeenCalled()
  })

  it('handles cap-nav-hub click to navigate to hub', () => {
    global.navigate = jest.fn()
    setupCapacityPortalDelegation() // eslint-disable-line no-undef

    const button = document.createElement('button')
    button.setAttribute('data-action', 'cap-nav-hub')
    container.appendChild(button)

    button.click()

    expect(global.navigate).toHaveBeenCalledWith('hub')
  })

  it('handles show-guide click with guide key', () => {
    global.showGuide = jest.fn()
    setupCapacityPortalDelegation() // eslint-disable-line no-undef

    const button = document.createElement('button')
    button.setAttribute('data-action', 'show-guide')
    button.setAttribute('data-guide-key', 'capacity')
    container.appendChild(button)

    button.click()

    expect(global.showGuide).toHaveBeenCalledWith('capacity')
  })

  it('ignores clicks on unrelated elements', () => {
    global.setCapacityTab = jest.fn()
    setupCapacityPortalDelegation() // eslint-disable-line no-undef

    const div = document.createElement('div')
    div.textContent = 'Regular content'
    container.appendChild(div)

    div.click()

    expect(global.setCapacityTab).not.toHaveBeenCalled()
  })
})

describe('capacity hub CSS styling', () => {
  it('hub-card should have cursor: pointer for interactivity', async () => {
    const cssPath = path.resolve(__dirname, '../portals/hub/css/hub.css')
    const css = fs.readFileSync(cssPath, 'utf8')

    // Check that .hub-card includes cursor: pointer
    expect(css).toMatch(/\.hub-card\s*\{[^}]*cursor:\s*pointer/)
  })

  it('hub-card should have hover effects for visual feedback', async () => {
    const cssPath = path.resolve(__dirname, '../portals/hub/css/hub.css')
    const css = fs.readFileSync(cssPath, 'utf8')

    // Check that .hub-card:hover has transform
    expect(css).toMatch(/\.hub-card:hover\s*\{[^}]*transform/)
  })
})

describe('capacity navigation buttons', () => {
  it('guide button should have show-guide action', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('data-action="show-guide"')
    expect(html).toContain('data-guide-key="capacity"')
  })

  it('back to portal button should have cap-nav-hub action', () => {
    const html = renderCapacity() // eslint-disable-line no-undef
    expect(html).toContain('data-action="cap-nav-hub"')
    expect(html).toContain('← Back to Portal')
  })
})
