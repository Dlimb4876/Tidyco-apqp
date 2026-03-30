// js/features/hub.js

import { appState, db, findProjectByProductId } from '../../../core/js/state.js'
import { currentUser } from '../../../core/js/supa.js'
import { esc, canViewPageKey, emailToDisplayName } from '../../../utils/js/helpers.js'
import { navigate, render } from '../../../utils/js/navigation.js'
import { showGuide } from '../../../utils/js/guide.js'
import { actionCentreLoad, actionCentreGetMyName } from '../../action-centre/js/action-centre.js'

const HUB_FAVOURITES_STORAGE_PREFIX = 'tidyco_favourites_v1_'
const HUB_MAX_PAGE_FAVOURITES = 4
const HUB_MAX_PRODUCT_FAVOURITES = 4

const HUB_FAVOURITE_PAGES = {
  capacity: { label: 'Capacity', icon: '📊' },
  'capacity::production': { label: 'Capacity - Production', icon: '🚂' },
  'capacity::me': { label: 'Capacity - ME', icon: '🧑‍🔧' },
  'capacity::projects': { label: 'Capacity - Projects', icon: '📅' },
  'product-development': { label: 'Product Development', icon: '🚀' },
  'product-development::npi': { label: 'NPI Projects', icon: '📋' },
  'product-development::product-management': { label: 'Product Management', icon: '📦' },
  'product-development::product-family-db': { label: 'Product Families', icon: '🏢' },
  'product-development::parts-database': { label: 'Parts Database', icon: '🔩' },
  production: { label: 'Production', icon: '🏭' },
  'production::scheduling': { label: 'Production - Schedule', icon: '📅' },
  'production::by-product': { label: 'Production - Plan by Product', icon: '📋' },
  'production::by-unit': { label: 'Production - Plan by Work Area', icon: '🏭' },
  operations: { label: 'Operations', icon: '🛰️' },
  mcs: { label: 'Manufacturing Change', icon: '🔧' },
  'action-centre': { label: 'My Actions', icon: '✅' },
  feedback: { label: 'Feedback & Bugs', icon: '💬' }
}

let hubDelegationContainer = null

function hubGetCurrentUserEmailForFavourites() {
  const email = currentUser?.email
    ? String(currentUser.email).trim().toLowerCase()
    : 'anonymous'
  return email || 'anonymous'
}

function hubGetFavouritesStorageKey() {
  return HUB_FAVOURITES_STORAGE_PREFIX + hubGetCurrentUserEmailForFavourites()
}

function hubDefaultFavourites() {
  return {
    version: 1,
    pages: [],
    products: [],
    updatedAt: new Date().toISOString()
  }
}

function hubNormaliseFavourites(raw) {
  const clean = hubDefaultFavourites()
  if (!raw || typeof raw !== 'object') return clean

  if (Array.isArray(raw.pages)) {
    const pageSet = new Set()
    raw.pages.forEach((id) => {
      const key = String(id || '').trim()
      if (!key || !HUB_FAVOURITE_PAGES[key]) return
      pageSet.add(key)
    })
    clean.pages = Array.from(pageSet).slice(0, HUB_MAX_PAGE_FAVOURITES)
  }

  if (Array.isArray(raw.products)) {
    const productSet = new Set()
    raw.products.forEach((id) => {
      const key = String(id || '').trim()
      if (!key) return
      productSet.add(key)
    })
    clean.products = Array.from(productSet).slice(0, HUB_MAX_PRODUCT_FAVOURITES)
  }

  clean.updatedAt = raw.updatedAt || clean.updatedAt
  return clean
}

function hubLoadFavourites() {
  try {
    const raw = localStorage.getItem(hubGetFavouritesStorageKey())
    if (!raw) return hubDefaultFavourites()
    return hubNormaliseFavourites(JSON.parse(raw))
  } catch (_) {
    return hubDefaultFavourites()
  }
}

function hubSaveFavourites(next) {
  const clean = hubNormaliseFavourites({
    ...next,
    updatedAt: new Date().toISOString()
  })
  try {
    localStorage.setItem(hubGetFavouritesStorageKey(), JSON.stringify(clean))
  } catch (_) {}
  return clean
}

function getProductsStateList() {
  const state = globalThis.productsState
  return state && Array.isArray(state.products) ? state.products : []
}

function hubGetFavouriteProducts() {
  const products = getProductsStateList()
  const byId = new Map(products.map((p) => [String(p.id), p]))
  const favourites = hubLoadFavourites()
  const items = []
  const staleIds = []
  const productsLoaded = !!(globalThis.productsState && globalThis.productsState.loaded)

  favourites.products.forEach((id) => {
    const product = byId.get(String(id))
    if (!product) {
      if (productsLoaded) staleIds.push(id)
      return
    }
    items.push(product)
  })

  if (staleIds.length > 0) {
    const staleSet = new Set(staleIds.map((x) => String(x)))
    const kept = favourites.products.filter((id) => !staleSet.has(String(id)))
    hubSaveFavourites({ ...favourites, products: kept })
  }

  return items
}

export function hubIsPageFavourite(section) {
  return hubLoadFavourites().pages.includes(section)
}

export function hubIsProductFavourite(productId) {
  return hubLoadFavourites().products.includes(String(productId || ''))
}

export function hubTogglePageFavourite(section, evt) {
  if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation()
  if (!HUB_FAVOURITE_PAGES[section]) return

  const favourites = hubLoadFavourites()
  const set = new Set(favourites.pages)
  if (set.has(section)) set.delete(section)
  else set.add(section)

  const pages = Array.from(set).slice(0, HUB_MAX_PAGE_FAVOURITES)
  hubSaveFavourites({ ...favourites, pages })
  render()
}

export function hubToggleProductFavourite(productId, evt) {
  if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation()
  const key = String(productId || '').trim()
  if (!key) return

  const favourites = hubLoadFavourites()
  const set = new Set(favourites.products)
  if (set.has(key)) set.delete(key)
  else set.add(key)

  const products = Array.from(set).slice(0, HUB_MAX_PRODUCT_FAVOURITES)
  hubSaveFavourites({ ...favourites, products })
  render()
}

function hubOpenFavouriteProduct(productId) {
  const key = String(productId || '').trim()
  if (!key) return

  const project = findProjectByProductId(key)
    || (Array.isArray(db?.projects) ? db.projects.find((p) => String(p.product_id || '') === key) : null)

  if (project) {
    appState.progId = project.id
    navigate('project')
    return
  }

  appState.productDevelopmentTab = 'npi'
  navigate('product-development')
}

export function hubOpenFavouritePage(pageKey) {
  if (!HUB_FAVOURITE_PAGES[pageKey]) return
  if (!canViewPageKey(pageKey)) return

  if (pageKey.startsWith('capacity::')) {
    appState.capacityTab = pageKey.split('::')[1] || 'root'
    navigate('capacity')
    return
  }

  if (pageKey.startsWith('product-development::')) {
    appState.productDevelopmentTab = pageKey.split('::')[1] || 'root'
    navigate('product-development')
    return
  }

  if (pageKey.startsWith('production::')) {
    appState.productionTab = pageKey.split('::')[1] || 'root'
    navigate('production')
    return
  }

  navigate(pageKey)
}

function hubRemovePageFavourite(section) {
  const favourites = hubLoadFavourites()
  const pages = favourites.pages.filter((p) => p !== section)
  hubSaveFavourites({ ...favourites, pages })
  render()
}

function hubRemoveProductFavourite(productId) {
  const key = String(productId || '').trim()
  if (!key) return
  const favourites = hubLoadFavourites()
  const products = favourites.products.filter((p) => p !== key)
  hubSaveFavourites({ ...favourites, products })
  render()
}

function renderHubFavouritesPanel() {
  const favourites = hubLoadFavourites()
  const pageItems = favourites.pages
    .map((section) => {
      const meta = HUB_FAVOURITE_PAGES[section]
      if (!meta) return ''
      if (!canViewPageKey(section)) return ''
      return `<div class="hub-fav-item">
        <button class="hub-fav-page" data-hub-action="open-page" data-page="${esc(section)}" title="Open ${esc(meta.label)}">${meta.icon} ${esc(meta.label)}</button>
        <button class="hub-fav-delete" data-hub-action="remove-page" data-page="${esc(section)}" title="Remove from favourites">×</button>
      </div>`
    })
    .filter(Boolean)
    .join('')

  const productItems = hubGetFavouriteProducts()
  const productHtml = productItems
    .map((product) => {
      const name = product.name || 'Unnamed Product'
      const status = product.status || 'Tender'
      const hasProject = !!findProjectByProductId(product.id)
      return `<div class="hub-fav-item">
        <button class="hub-fav-product" data-hub-action="open-product" data-product-id="${esc(product.id)}" title="Open ${esc(name)} in NPI">
          <span class="hub-fav-product-name">${esc(name)}</span>
          <span class="hub-fav-product-meta">${esc(status)}${hasProject ? ' · NPI' : ''}</span>
        </button>
        <button class="hub-fav-delete" data-hub-action="remove-product" data-product-id="${esc(product.id)}" title="Remove from favourites">×</button>
      </div>`
    })
    .join('')

  if (!pageItems && !productHtml) {
    return `<div class="hub-favs-panel">
      <div class="hub-favs-head">⭐ My Favourites</div>
      <div class="hub-favs-empty">No favourites yet. Star pages or NPI products for quick access.</div>
    </div>`
  }

  return `<div class="hub-favs-panel">
    <div class="hub-favs-head">⭐ My Favourites</div>
    ${pageItems ? `<div class="hub-favs-lane"><div class="hub-favs-lane-title">Pages</div><div class="hub-favs-pages">${pageItems}</div></div>` : ''}
    ${productHtml ? `<div class="hub-favs-lane"><div class="hub-favs-lane-title">NPI Products</div><div class="hub-favs-products">${productHtml}</div></div>` : ''}
  </div>`
}

function renderHubCard(section, icon, title, meta) {
  if (!canViewPageKey(section)) return ''
  const isFav = hubIsPageFavourite(section)
  return `<div class="proj-card hub-card" data-hub-action="go-section" data-section="${esc(section)}">
    <button
      class="hub-fav-toggle${isFav ? ' is-active' : ''}"
      type="button"
      title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
      data-hub-action="toggle-page"
      data-section="${esc(section)}">
      ${isFav ? '★' : '☆'}
    </button>
    <div class="hub-card-content">
      <div class="hub-icon">${icon}</div>
      <div class="proj-card-name">${title}</div>
      <div class="proj-card-meta">${meta}</div>
    </div>
  </div>`
}

export function hubInit() {
  setupHubDelegation()
  if (!appState.actionCentreLoading && !appState.actionCentreData) {
    actionCentreLoad()
  }
}

export function renderHubActionWidget() {
  const name = actionCentreGetMyName()
    || (currentUser ? emailToDisplayName(currentUser.email) : '')

  let summaryHTML = ''
  let pendingApprovalCount = 0

  if (appState.actionCentreLoading) {
    summaryHTML = '<span class="hub-widget-loading">Loading actions…</span>'
  } else if (appState.actionCentreData && !appState.actionCentreData.error) {
    const { actions = [], pfmea = [], risks = [], mcsApprovals = [] } = appState.actionCentreData
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalOpen =
      actions.filter(a => a.status !== 'Closed').length +
      pfmea.length +
      risks.filter(r => r.status !== 'Closed').length

    const totalOverdue =
      actions.filter(a => a.due_date && a.status !== 'Closed' && new Date(a.due_date) < today).length +
      pfmea.filter(p => p.action_due && new Date(p.action_due) < today).length

    pendingApprovalCount = mcsApprovals.length

    summaryHTML = `
      <div class="hub-widget-stats">
        <div class="hub-widget-stat">
          <span class="hub-widget-num">${totalOpen}</span>
          <span class="hub-widget-label">open</span>
        </div>
        <div class="hub-widget-stat">
          <span class="hub-widget-num${totalOverdue > 0 ? ' hub-widget-overdue' : ''}">${totalOverdue}</span>
          <span class="hub-widget-label">overdue</span>
        </div>
        ${pendingApprovalCount > 0 ? `
        <div class="hub-widget-stat">
          <span class="hub-widget-num hub-widget-pending">${pendingApprovalCount}</span>
          <span class="hub-widget-label">pending approval</span>
        </div>` : ''}
      </div>`
  }

  return `
    <div class="hub-widget">
      <div class="hub-widget-user">
        <span class="hub-widget-avatar">👤</span>
        <div class="hub-widget-user-text">
          <div class="hub-widget-greeting">Logged in as</div>
          <div class="hub-widget-name">${esc(name)}</div>
        </div>
      </div>
      ${summaryHTML ? `<div class="hub-widget-sep"></div><div class="hub-widget-summary">${summaryHTML}</div>` : ''}
      <div class="hub-widget-cta">
        <button class="btn btn-primary btn-sm" data-hub-action="go-actions">✅ My Actions →</button>
      </div>
    </div>`
}

export function renderHub() {
  const cards = [
    renderHubCard('capacity', '📊', 'CAPACITY', 'Load Capacity Planning'),
    renderHubCard('product-development', '🚀', 'PRODUCT DEVELOPMENT', 'NPI & Product Management'),
    renderHubCard('production', '🏭', 'PRODUCTION', 'Batch Scheduling & Planning'),
    renderHubCard('operations', '🛰️', 'OPERATIONS DASHBOARD', 'Unified overview of all operations, metrics, and risks'),
    renderHubCard('mcs', '🔧', 'MANUFACTURING CHANGE', 'Engineering Change Requests & Approvals')
  ].filter(Boolean).join('')

  return `
    <div class="proj-home hub-home" id="hub-portal-container">
      ${renderHubActionWidget()}
      ${renderHubFavouritesPanel()}

      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Tidyco Operations Portal</div>
          <div class="proj-home-sub">Quality Planning, Production & Operations Control</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-hub-action="show-guide" title="User Guide">❓ Guide</button>
      </div>

      <div class="proj-cards hub-grid">
        ${cards || '<div class="hub-favs-empty">No portal shortcuts are available for your current permissions.</div>'}
      </div>
    </div>`
}

function setupHubDelegation() {
  const container = document.getElementById('hub-portal-container')
  if (!container || hubDelegationContainer === container) return

  hubDelegationContainer = container
  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-hub-action]')
    if (!actionEl || !container.contains(actionEl)) return

    const action = actionEl.dataset.hubAction
    if (action === 'toggle-page') {
      event.preventDefault()
      event.stopPropagation()
      hubTogglePageFavourite(actionEl.dataset.section || '')
      return
    }
    if (action === 'go-section') {
      hubOpenFavouritePage(actionEl.dataset.section || '')
      return
    }
    if (action === 'open-page') {
      hubOpenFavouritePage(actionEl.dataset.page || '')
      return
    }
    if (action === 'remove-page') {
      event.preventDefault()
      event.stopPropagation()
      hubRemovePageFavourite(actionEl.dataset.page || '')
      return
    }
    if (action === 'open-product') {
      hubOpenFavouriteProduct(actionEl.dataset.productId || '')
      return
    }
    if (action === 'remove-product') {
      event.preventDefault()
      event.stopPropagation()
      hubRemoveProductFavourite(actionEl.dataset.productId || '')
      return
    }
    if (action === 'go-actions') {
      navigate('action-centre')
      return
    }
    if (action === 'show-guide') {
      showGuide('hub')
    }
  })
}
