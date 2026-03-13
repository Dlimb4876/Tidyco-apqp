// ═══════════════════════════════════
// npi-orchestrator.js — NPI section orchestrator
// Depends on: npi.js and all NPI feature modules
// ═══════════════════════════════════

npi.init = function() {
  if (typeof npiDataInit === 'function') npiDataInit()
}

npi.cleanup = function() {
  if (typeof npiDataUnsubscribe === 'function') npiDataUnsubscribe()
}

npi.render = function(section) {
  if (section === 'project') return npi.dashboard.renderDashboard()
  if (section && section.startsWith('gate_')) return npi.gate.renderGatePage(+section.split('_')[1])
  if (section === 'apqp') return npi.apqp.renderAPQP()
  if (section === 'actions') return npi.tracker.renderActions()
  if (section === 'risks') return npi.tracker.renderRisks()
  if (section === 'bom') return npi.bom.renderBOM()
  if (section === 'timing') return npi.timing.renderTimingPlan()
  return ''
}
