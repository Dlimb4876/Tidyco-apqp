// ═══════════════════════════════════
// npi-orchestrator.js — NPI section orchestrator
// Depends on: npi.js and all NPI feature modules
// ═══════════════════════════════════

npi.init = function() {
  // Reset subscriptions each init to avoid stale handlers
  npi._subs = {}
  // Subscribe to render trigger from data layer
  npi.watch('render', function() { render() })
  // Async-safe init for data layer — errors are logged but won't crash navigation
  if (typeof npiDataInit === 'function') {
    Promise.resolve().then(() => npiDataInit()).catch(err => console.error('[NPI] init error:', err))
  }
}

npi.cleanup = function() {
  if (typeof npiDataUnsubscribe === 'function') npiDataUnsubscribe()
  if (typeof npi.events.teardown === 'function') npi.events.teardown()
}

npi.render = function(section) {
  const inner = npi._renderInner(section)
  return `<div id="npi-content">${inner}</div>`
}

npi._renderInner = function(section) {
  if (section === 'project') return npi.dashboard.renderDashboard()
  if (section && section.startsWith('gate_')) return npi.gate.renderGatePage(+section.split('_')[1])
  if (section === 'apqp') return npi.apqp.renderAPQP()
  if (section === 'actions') return npi.tracker.renderActions()
  if (section === 'risks') return npi.tracker.renderRisks()
  if (section === 'bom') return npi.bom.renderBOM()
  if (section === 'timing') return npi.timing.renderTimingPlan()
  return ''
}
