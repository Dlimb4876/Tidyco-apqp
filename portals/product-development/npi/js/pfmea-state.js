/* ============================================================
   pfmea-state.js — PFMEA worksheet state and view/filter helpers
   Depends on: npi.js (npi namespace), navigation.js (render)
   ============================================================ */

npi.pfmea = npi.pfmea || {}

const PFMEA_RPN_FILTERS = ['all', 'high', 'r1_49', 'r50_99', 'r100_199', 'r200_plus']
const PFMEA_VIEWS = ['worksheet', 'history']
const PFMEA_COLUMN_VIEWS = ['compact', 'standard', 'full']

const PFMEA_COLUMN_VISIBILITY = {
  compact:  { name: 'compact',  function: true,  prevent: false, detect: false, action: false, owner: false, due: false, newOcc: false, newDet: false, forecast: false, implement: false },
  standard: { name: 'standard', function: true,  prevent: true,  detect: true,  action: false, owner: false, due: false, newOcc: false, newDet: false, forecast: false, implement: false },
  full:     { name: 'full',     function: true,  prevent: true,  detect: true,  action: true,  owner: true,  due: true,  newOcc: true,  newDet: true,  forecast: true,  implement: true  }
}

npi.pfmea.getRpnFilter = function() {
  const cur = (globalThis.pfmeaRpnFilter || 'all').toString()
  return PFMEA_RPN_FILTERS.includes(cur) ? cur : 'all'
}

npi.pfmea.setRpnFilter = function(nextFilter) {
  const prevFilter = globalThis.pfmeaRpnFilter || 'all'
  const safe = (nextFilter || 'all').toString()
  globalThis.pfmeaRpnFilter = PFMEA_RPN_FILTERS.includes(safe) ? safe : 'all'
  // Update URL to persist PFMEA RPN filter
  const parts = ['p=' + encodeURIComponent(progId), 's=project', 't=pfmea']
  if (globalThis.pfmeaRpnFilter !== 'all') parts.push('pfr=' + encodeURIComponent(globalThis.pfmeaRpnFilter))
  if (globalThis.pfmeaView !== 'worksheet') parts.push('pfv=' + encodeURIComponent(globalThis.pfmeaView))
  if (globalThis.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(globalThis.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: prevFilter !== safe })
  render()
}

npi.pfmea.getView = function() {
  const cur = (globalThis.pfmeaView || 'worksheet').toString()
  return PFMEA_VIEWS.includes(cur) ? cur : 'worksheet'
}

npi.pfmea.setView = function(nextView) {
  const prevView = globalThis.pfmeaView || 'worksheet'
  const safe = (nextView || 'worksheet').toString()
  globalThis.pfmeaView = PFMEA_VIEWS.includes(safe) ? safe : 'worksheet'
  // Update URL to persist PFMEA view
  const parts = ['p=' + encodeURIComponent(progId), 's=project', 't=pfmea']
  if (globalThis.pfmeaRpnFilter !== 'all') parts.push('pfr=' + encodeURIComponent(globalThis.pfmeaRpnFilter))
  if (globalThis.pfmeaView !== 'worksheet') parts.push('pfv=' + encodeURIComponent(globalThis.pfmeaView))
  if (globalThis.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(globalThis.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: prevView !== safe })
  render()
}

npi.pfmea.getColumnView = function() {
  const cur = (globalThis.pfmeaColumnView || 'standard').toString()
  return PFMEA_COLUMN_VISIBILITY[PFMEA_COLUMN_VIEWS.includes(cur) ? cur : 'standard']
}

npi.pfmea.setColumnView = function(viewName) {
  globalThis.pfmeaColumnView = PFMEA_COLUMN_VIEWS.includes(viewName) ? viewName : 'standard'
  render()
}

// Total visible column count (used for colspan calculations)
npi.pfmea.pfColCount = function(vis) {
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
npi.pfmea.pfColMinWidth = function(vis) {
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

npi.pfmea.pfGetExtraFilters = function() {
  return {
    owner: globalThis.pfmeaOwnerFilter || null,
    overdueOnly: globalThis.pfmeaOverdueFilter || false,
    specialChar: globalThis.pfmeaScFilter || null,
    searchText: globalThis.pfmeaSearchFilter || ''
  }
}

npi.pfmea.pfSetExtraFilter = function(key, value) {
  if (key === 'owner') globalThis.pfmeaOwnerFilter = value || null
  if (key === 'overdueOnly') globalThis.pfmeaOverdueFilter = !!value
  if (key === 'specialChar') globalThis.pfmeaScFilter = value || null
  if (key === 'searchText') globalThis.pfmeaSearchFilter = value || ''
  render()
}

npi.pfmea.pfClearExtraFilters = function() {
  globalThis.pfmeaOwnerFilter = null
  globalThis.pfmeaOverdueFilter = false
  globalThis.pfmeaScFilter = null
  globalThis.pfmeaSearchFilter = ''
  render()
}

npi.pfmea.pfModeMatchesExtraFilters = function(mode, xf) {
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

npi.pfmea.pfGetUniqueOwners = function(project) {
  const owners = new Set()
  ;(project.pfmea || []).forEach(mode => (mode.effects || []).forEach(ef => (ef.causes || []).forEach(ca => {
    if (ca.action && ca.action.owner) owners.add(ca.action.owner)
  })))
  return [...owners].sort()
}
