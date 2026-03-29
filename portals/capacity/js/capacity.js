// Capacity Management Portal Hub
// Entry point for capacity management module

import { appState } from '../../../core/js/state.js'
import { canViewPortalTab } from '../../../utils/js/helpers.js'
import { showGuide } from '../../../utils/js/guide.js'
import { navigate, render, writeNavigationHistory, updateBackButton } from '../../../utils/js/navigation.js'
import { hubIsPageFavourite, hubTogglePageFavourite } from '../../hub/js/hub.js'
import { renderMeCapacity } from '../me/js/me-capacity.js'
import { renderPmCapacity } from '../project-management/js/pm-capacity.js'
import { renderLogCapacity } from '../logistics/js/log-capacity.js'
import { renderUnit6Capacity } from '../unit6/js/unit6-capacity.js'
import { renderProdCapacity } from '../production/js/prod-capacity.js'
import { injectCapacityModals } from './modals.js'
import { setupCapacityEvents } from './capacity-events.js'

let capacityPortalDelegationContainer = null

function isCapacityPageFavourite(pageKey) {
  return hubIsPageFavourite(pageKey)
}

export function setCapacityTab(tab) {
  if (tab !== 'root' && !canViewPortalTab('capacity', tab)) return

  const prevTab = appState.capacityTab
  appState.capacityTab = tab

  const parts = ['s=capacity']
  if (tab !== 'root') parts.push('ct=' + encodeURIComponent(tab))
  writeNavigationHistory('#' + parts.join('&'), { push: prevTab !== tab })

  render()
  updateBackButton()
}

function capacityNavBar() {
  if (appState.capacityTab === 'logistics' || appState.capacityTab === 'unit6') return ''

  const tabs = [
    { key: 'production', icon: '🚂', label: 'Production' },
    { key: 'me', icon: '🧑‍🔧', label: 'ME' },
    { key: 'projects', icon: '📅', label: 'Projects' },
    { key: 'logistics', icon: '🚚', label: 'Logistics' },
    { key: 'unit6', icon: '🏭', label: 'Unit 6' }
  ].filter(tab => canViewPortalTab('capacity', tab.key))

  const buttons = tabs.map(tab => `
    <button
      class="prod-nav-item ${appState.capacityTab === tab.key ? 'active' : ''}"
      data-cap-action="cap-set-tab"
      data-tab="${tab.key}">
      ${tab.icon} ${tab.label}
    </button>
  `).join('')

  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-cap-action="cap-set-tab" data-tab="root">← Back</button>
      ${buttons}
    </div>
  `
}

function renderCapacityHubCard(tabKey, favouriteKey, icon, title, meta) {
  if (!canViewPortalTab('capacity', tabKey)) return ''

  const isFav = isCapacityPageFavourite(favouriteKey)
  return `
    <div class="proj-card hub-card" data-cap-action="cap-set-tab" data-tab="${tabKey}">
      <button
        class="hub-fav-toggle${isFav ? ' is-active' : ''}"
        type="button"
        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        data-action="cap-toggle-favourite"
        data-favourite-key="${favouriteKey}">
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

export function renderCapacity() {
  injectCapacityModals()
  setTimeout(setupCapacityEvents, 0)
  const nav = capacityNavBar()

  if (appState.capacityTab === 'production') {
    setTimeout(setupCapacityPortalDelegation, 0)
    return `<div id="capacity-portal-container">${nav}${renderProdCapacity()}</div>`
  }
  if (appState.capacityTab === 'me') {
    setTimeout(setupCapacityPortalDelegation, 0)
    return `<div id="capacity-portal-container">${nav}${renderMeCapacity()}</div>`
  }
  if (appState.capacityTab === 'projects') {
    setTimeout(setupCapacityPortalDelegation, 0)
    return `<div id="capacity-portal-container">${nav}${renderPmCapacity()}</div>`
  }
  if (appState.capacityTab === 'logistics') {
    setTimeout(setupCapacityPortalDelegation, 0)
    return `<div id="capacity-portal-container">${nav}${renderLogCapacity()}</div>`
  }
  if (appState.capacityTab === 'unit6') {
    setTimeout(setupCapacityPortalDelegation, 0)
    return `<div id="capacity-portal-container">${nav}${renderUnit6Capacity()}</div>`
  }

  setTimeout(setupCapacityPortalDelegation, 0)
  const cards = [
    renderCapacityHubCard('production', 'capacity::production', '🚂', 'Production', 'Production load capacity plan'),
    renderCapacityHubCard('me', 'capacity::me', '🧑‍🔧', 'Manufacturing Engineering', 'Manufacturing Engineering load capacity plan'),
    renderCapacityHubCard('projects', 'capacity::projects', '📅', 'Project Management', 'Project Management load capacity plan'),
    renderCapacityHubCard('logistics', 'capacity::logistics', '🚚', 'Logistics', 'Logistics load capacity plan'),
    renderCapacityHubCard('unit6', 'capacity::unit6', '🏭', 'Unit 6', 'Unit 6 load capacity plan')
  ].filter(Boolean).join('')

  return `
    <div class="proj-home" id="capacity-portal-container">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Capacity Management</div>
          <div class="proj-home-sub">Select a capacity stream to view loading</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="capacity" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="cap-nav-hub">← Back to Portal</button>
        </div>
      </div>
      <div class="proj-cards hub-grid">
        ${cards || '<div class="hub-favs-empty">No capacity streams are available for your current permissions.</div>'}
      </div>
    </div>
  `
}

export function renderCapacitySection() {
  return renderCapacity()
}

function setupCapacityPortalDelegation() {
  const container = document.getElementById('capacity-portal-container')
  if (!container || capacityPortalDelegationContainer === container) return

  capacityPortalDelegationContainer = container
  container.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]')
    if (!actionEl || !container.contains(actionEl)) return

    const action = actionEl.dataset.action
    if (action === 'cap-nav-root') {
      setCapacityTab('root')
      return
    }
    if (action === 'cap-nav-hub') {
      navigate('hub')
      return
    }
    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey
      if (key) showGuide(key)
      return
    }
    if (action === 'cap-toggle-favourite') {
      event.stopPropagation()
      const key = actionEl.dataset.favouriteKey
      if (key) {
        hubTogglePageFavourite(key)
      }
    }
  })
}
