// Production Planning Portal Hub
// Entry point for production planning module

import { appState } from '../../../core/js/state.js'
import { render, writeNavigationHistory, updateBackButton, navigate } from '../../../utils/js/navigation.js'
import { canViewPortalTab } from '../../../utils/js/helpers.js'
import { showGuide } from '../../../utils/js/guide.js'
import { hubIsPageFavourite, hubTogglePageFavourite } from '../../hub/js/hub.js'
import { flushDeferred } from '../../../utils/js/render-scheduler.js'
import {
  setProdDataRefreshTabBodyHandler,
  productionDataSubscribe,
  productionDataUnsubscribe
} from './data.js'
import { renderScheduling, setProdSchedulingScrollOffset } from './scheduling.js'
import { renderPlanByProduct, renderPlanByUnit } from './planning.js'

let productionPortalDelegationContainer = null

export function setProductionTab(tab) {
  if (tab !== 'root' && !canViewPortalTab('production', tab)) {
    return
  }

  const prevTab = appState.productionTab
  appState.productionTab = tab
  const parts = ['s=production']
  if (tab !== 'root') parts.push('pt=' + encodeURIComponent(tab))
  const hash = '#' + parts.join('&')
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory(hash, { push: prevTab !== tab })
  } else {
    history.replaceState(null, '', hash)
  }
  render()
  updateBackButton()
}

function prodNavBar() {
  const tabs = [
    { key: 'scheduling', icon: '📅', label: 'Schedule' },
    { key: 'by-product', icon: '📋', label: 'Plan by Product' },
    { key: 'by-unit', icon: '🏭', label: 'Plan by Work Area' }
  ].filter((tab) => canViewPortalTab('production', tab.key))

  const buttons = tabs
    .map((tab) => `<button class="prod-nav-item ${appState.productionTab === tab.key ? 'active' : ''}" data-action="prod-nav-tab" data-tab="${tab.key}">${tab.icon} ${tab.label}</button>`)
    .join('')

  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-action="prod-nav-root">← Back</button>
      ${buttons}
    </div>
  `
}

function renderProductionHubCard(tabKey, favouriteKey, icon, title, meta) {
  if (!canViewPortalTab('production', tabKey)) return ''

  const isFav = hubIsPageFavourite(favouriteKey)
  return `
    <div class="proj-card hub-card" data-action="prod-hub-tab" data-tab="${tabKey}">
      <button
        class="hub-fav-toggle${isFav ? ' is-active' : ''}"
        type="button"
        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        data-action="prod-fav-toggle"
        data-section="${favouriteKey}">
        ${isFav ? '★' : '☆'}
      </button>
      <div class="hub-card-content">
        <div class="hub-icon">${icon}</div>
        <div class="proj-card-name">${title}</div>
        <div class="proj-card-meta">${meta}</div>
      </div>
    </div>
  `
}

// Targeted tab-body refresh used by realtime callbacks — avoids full page render.
export function prodRefreshTabBody() {
  const body = document.getElementById('prodTabBody')
  if (!body) return

  // Preserve scroll position for scheduling table
  let scrollTop = 0
  const tableWrap = body.querySelector('.scheduling-table-wrap')
  if (tableWrap) {
    scrollTop = tableWrap.scrollTop
  }

  let content = ''
  if (appState.productionTab === 'scheduling') content = renderScheduling()
  else if (appState.productionTab === 'by-product') content = renderPlanByProduct()
  else if (appState.productionTab === 'by-unit') content = renderPlanByUnit()

  if (content) {
    body.innerHTML = content
    setTimeout(setupProductionPortalDelegation, 0)

    // Restore scroll position after render
    if (scrollTop > 0 && appState.productionTab === 'scheduling') {
      setTimeout(() => {
        const newTableWrap = document.querySelector('#prodTabBody .scheduling-table-wrap')
        if (newTableWrap) {
          newTableWrap.scrollTop = scrollTop
          setProdSchedulingScrollOffset(scrollTop)
        }
      }, 0)
    }
  }
}

export function renderProduction() {
  const nav = prodNavBar()
  // Products are now managed in Product Management — redirect if accessed
  if (appState.productionTab === 'products') {
    setProductionTab('scheduling')
    setTimeout(setupProductionPortalDelegation, 0)
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderScheduling()}</div></div>`
  }
  if (appState.productionTab === 'scheduling') {
    setTimeout(setupProductionPortalDelegation, 0)
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderScheduling()}</div></div>`
  }
  if (appState.productionTab === 'by-product') {
    setTimeout(setupProductionPortalDelegation, 0)
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderPlanByProduct()}</div></div>`
  }
  if (appState.productionTab === 'by-unit') {
    setTimeout(setupProductionPortalDelegation, 0)
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderPlanByUnit()}</div></div>`
  }

  // Root hub view
  setTimeout(setupProductionPortalDelegation, 0)
  const cards = [
    renderProductionHubCard('scheduling', 'production::scheduling', '📅', 'Schedule', 'Add Production Batches'),
    renderProductionHubCard('by-product', 'production::by-product', '📋', 'Plan by Product', 'View by Product'),
    renderProductionHubCard('by-unit', 'production::by-unit', '🏭', 'Plan by Work Area', 'Units 2, 3 & 6')
  ].filter(Boolean).join('')
  return `
    <div class="proj-home" id="production-portal-container">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Production Planning</div>
          <div class="proj-home-sub">Production schedules and batch planning</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="production" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="prod-nav-hub">← Back to Portal</button>
        </div>
      </div>

      <div class="proj-cards hub-grid">
        ${cards || '<div class="hub-favs-empty">No production pages are available for your current permissions.</div>'}
      </div>
    </div>
  `
}

export function setupProductionPortalDelegation() {
  const container = document.getElementById('production-portal-container')
  if (!container || productionPortalDelegationContainer === container) return

  productionPortalDelegationContainer = container

  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]')
    if (!actionEl || !container.contains(actionEl)) return

    const action = actionEl.dataset.action
    if (action === 'prod-nav-tab' || action === 'prod-hub-tab') {
      const tab = actionEl.dataset.tab
      if (tab) setProductionTab(tab)
      return
    }

    if (action === 'prod-nav-root') {
      setProductionTab('root')
      return
    }

    if (action === 'prod-nav-hub') {
      navigate('hub')
      return
    }

    if (action === 'prod-fav-toggle') {
      event.preventDefault()
      event.stopPropagation()
      const section = actionEl.dataset.section
      if (section) {
        hubTogglePageFavourite(section)
      }
      return
    }

    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey
      if (key) showGuide(key)
    }
  })

  // Flush any deferred re-renders when user leaves an inline table cell
  container.addEventListener('focusout', function(evt) {
    const nextFocus = evt.relatedTarget
    if (nextFocus && nextFocus.closest('table')) return
    flushDeferred('prod')
  })
}

// ── Tab-level refresh (DOM body swap only — avoids full render() feedback loop) ──
export function prodRefreshCurrentTab() {
  const body = document.getElementById('prodTabBody')
  if (!body) {
    render()
    return
  }
  let content = ''
  if (appState.productionTab === 'scheduling') content = renderScheduling()
  else if (appState.productionTab === 'by-product') content = renderPlanByProduct()
  else if (appState.productionTab === 'by-unit') content = renderPlanByUnit()
  else return
  body.innerHTML = content
}

setProdDataRefreshTabBodyHandler(prodRefreshTabBody)

export { productionDataSubscribe, productionDataUnsubscribe }
