/* ============================================================
   pfmea-state.js — PFMEA worksheet state and view/filter helpers
   Depends on: npi.js (npi namespace), navigation.js (render)
   ============================================================ */

import { npi } from './npi-shared.js'
import { appState } from '../../../../core/js/state.js'
import { writeNavigationHistory, render } from '../../../../utils/js/navigation.js'

export const pfmeaState = {}

const PFMEA_RPN_FILTERS = ['all', 'high', 'r1_49', 'r50_99', 'r100_199', 'r200_plus']
const PFMEA_VIEWS = ['worksheet', 'history']
const PFMEA_COLUMN_VIEWS = ['compact', 'standard', 'full']

const PFMEA_COLUMN_VISIBILITY = {
  compact:  { name: 'compact',  function: true,  prevent: false, detect: false, action: false, owner: false, due: false, newOcc: false, newDet: false, forecast: false, implement: false },
  standard: { name: 'standard', function: true,  prevent: true,  detect: true,  action: false, owner: false, due: false, newOcc: false, newDet: false, forecast: false, implement: false },
  full:     { name: 'full',     function: true,  prevent: true,  detect: true,  action: true,  owner: true,  due: true,  newOcc: true,  newDet: true,  forecast: true,  implement: true  }
}

pfmeaState.getRpnFilter = function() {
  const cur = (appState.pfmeaRpnFilter || 'all').toString()
  return PFMEA_RPN_FILTERS.includes(cur) ? cur : 'all'
}

pfmeaState.setRpnFilter = function(nextFilter) {
  const prevFilter = appState.pfmeaRpnFilter || 'all'
  const safe = (nextFilter || 'all').toString()
  appState.pfmeaRpnFilter = PFMEA_RPN_FILTERS.includes(safe) ? safe : 'all'
  // Update URL to persist PFMEA RPN filter
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=pfmea']
  if (appState.pfmeaRpnFilter !== 'all') parts.push('pfr=' + encodeURIComponent(appState.pfmeaRpnFilter))
  if (appState.pfmeaView !== 'worksheet') parts.push('pfv=' + encodeURIComponent(appState.pfmeaView))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: prevFilter !== safe })
  render()
}

pfmeaState.getView = function() {
  const cur = (appState.pfmeaView || 'worksheet').toString()
  return PFMEA_VIEWS.includes(cur) ? cur : 'worksheet'
}

pfmeaState.setView = function(nextView) {
  const prevView = appState.pfmeaView || 'worksheet'
  const safe = (nextView || 'worksheet').toString()
  appState.pfmeaView = PFMEA_VIEWS.includes(safe) ? safe : 'worksheet'
  // Update URL to persist PFMEA view
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=pfmea']
  if (appState.pfmeaRpnFilter !== 'all') parts.push('pfr=' + encodeURIComponent(appState.pfmeaRpnFilter))
  if (appState.pfmeaView !== 'worksheet') parts.push('pfv=' + encodeURIComponent(appState.pfmeaView))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: prevView !== safe })
  render()
}

pfmeaState.getColumnView = function() {
  const cur = (appState.pfmeaColumnView || 'standard').toString()
  return PFMEA_COLUMN_VISIBILITY[PFMEA_COLUMN_VIEWS.includes(cur) ? cur : 'standard']
}

pfmeaState.setColumnView = function(viewName) {
  appState.pfmeaColumnView = PFMEA_COLUMN_VIEWS.includes(viewName) ? viewName : 'standard'
  render()
}

// Total visible column count (used for colspan calculations)
pfmeaState.pfColCount = function(vis) {
  let cols = 6 // always: mode + effect + sev + cause + occ + del
  if (vis.function) cols++
  if (vis.prevent) cols++
  if (vis.detect) cols += 3 // detect + det + rpn
  if (vis.action) cols += 2 // desc + taken
  if (vis.owner) cols++
  if (vis.due) cols++
  if (vis.newOcc) cols++
  if (vis.newDet) cols++
  if (vis.forecast) cols++
  if (vis.implement) cols++
  return cols
}

// Approximate min-width in px for horizontal scroll container
pfmeaState.pfColMinWidth = function(vis) {
  let width = 672 // base: mode(180)+effect(180)+sev(60)+cause(180)+occ(44)+del(28)
  if (vis.function) width += 200
  if (vis.prevent) width += 180
  if (vis.detect) width += 180
  if (vis.action) width += 300 // desc(150)+taken(150)
  if (vis.owner) width += 80
  if (vis.due) width += 100
  if (vis.newOcc) width += 44
  if (vis.newDet) width += 44
  if (vis.forecast) width += 60
  if (vis.implement) width += 60
  return width
}

pfmeaState.pfGetExtraFilters = function() {
  return {
    owner: appState.pfmeaOwnerFilter || null,
    overdueOnly: appState.pfmeaOverdueFilter || false,
    specialChar: appState.pfmeaScFilter || null,
    searchText: appState.pfmeaSearchFilter || ''
  }
}

pfmeaState.pfSetExtraFilter = function(key, value) {
  if (key === 'owner') appState.pfmeaOwnerFilter = value || null
  if (key === 'overdueOnly') appState.pfmeaOverdueFilter = !!value
  if (key === 'specialChar') appState.pfmeaScFilter = value || null
  if (key === 'searchText') appState.pfmeaSearchFilter = value || ''
  render()
}

pfmeaState.pfClearExtraFilters = function() {
  appState.pfmeaOwnerFilter = null
  appState.pfmeaOverdueFilter = false
  appState.pfmeaScFilter = null
  appState.pfmeaSearchFilter = ''
  render()
}

pfmeaState.pfModeMatchesExtraFilters = function(mode, xf) {
  const effects = mode.effects || []

  if (xf.owner) {
    const hasOwner = effects.some(ef => (ef.causes || []).some(ca => ca.action && ca.action.owner === xf.owner))
    if (!hasOwner) return false
  }

  if (xf.overdueOnly) {
    const now = Date.now()
    const hasOverdue = effects.some(ef => (ef.causes || []).some(ca => {
      const due = ca.action && ca.action.due
      return due && new Date(due).getTime() < now
    }))
    if (!hasOverdue) return false
  }

  if (xf.specialChar) {
    const hasSpecialChar = effects.some(ef => ef.specialChar === xf.specialChar)
    if (!hasSpecialChar) return false
  }

  if (xf.searchText) {
    const q = xf.searchText.toLowerCase()
    const matchesText =
      (mode.function || '').toLowerCase().includes(q) ||
      (mode.mode || '').toLowerCase().includes(q) ||
      effects.some(ef =>
        (ef.effect || '').toLowerCase().includes(q) ||
        (ef.causes || []).some(ca => (ca.cause || '').toLowerCase().includes(q))
      )
    if (!matchesText) return false
  }

  return true
}

pfmeaState.pfGetUniqueOwners = function(project) {
  const owners = new Set()
  ;(project.pfmea || []).forEach(mode => (mode.effects || []).forEach(ef => (ef.causes || []).forEach(ca => {
    if (ca.action && ca.action.owner) owners.add(ca.action.owner)
  })))
  return [...owners].sort()
}

if (npi) {
  npi.pfmea = npi.pfmea || {}
  Object.assign(npi.pfmea, pfmeaState)
}
