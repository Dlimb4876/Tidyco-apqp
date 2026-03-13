// ═══════════════════════════════════
// npi.js — NPI namespace root
// Loaded before all other NPI feature files (after npi-constants.js)
// All NPI portal functions live under window.npi.*
// ═══════════════════════════════════

window.npi = {
  nav: {}, // navigation wrappers for inline handlers
  gate: {}, // gates.js
  tracker: {}, // trackers.js
  bom: {}, // bom.js
  timing: {}, // timing.js
  pfmea: {}, // pfmea.js
  apqp: {}, // apqp.js
  dashboard: {} // dashboard.js
}

npi.nav.navigate = function(section) { navigate(section) }
npi.nav.goHome = function() { goHome() }
npi.nav.render = function() { render() }
npi.nav.setApqpTab = function(tab) { setApqpTab(tab) }
npi.nav.setProductDevelopmentTab = function(tab) { setProductDevelopmentTab(tab) }
npi.nav.openProjectById = function(id) { progId = id; navigate('project') }
npi.nav.openPfmeaTab = function() { apqpTab = 'pfmea'; navigate('apqp') }
npi.nav.alertEnterNameFirst = function() { alert('Enter name first') }
npi.nav.stopEvent = function(evt) { if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation() }
