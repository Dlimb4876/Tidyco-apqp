// ═══════════════════════════════════
// npi-shared.js — Shared NPI namespace access
// Provides a stable module import for NPI feature files.
// ═══════════════════════════════════

const root = globalThis
if (!Object.prototype.hasOwnProperty.call(root, 'npi')) {
  Object.defineProperty(root, 'npi', {
    value: {},
    writable: true,
    configurable: true
  })
}

const npi = root.npi
npi.nav = npi.nav || {}
npi.data = npi.data || {}
npi.components = npi.components || {}
npi.ctq = npi.ctq || {}
npi.pfd = npi.pfd || {}
npi.cp = npi.cp || {}
npi.gate = npi.gate || {}
npi.tracker = npi.tracker || {}
npi.bom = npi.bom || {}
npi.timing = npi.timing || {}
npi.pfmea = npi.pfmea || {}
npi.apqp = npi.apqp || {}
npi.docs = npi.docs || {}
npi.dashboard = npi.dashboard || {}
npi.events = npi.events || {}
npi._subs = npi._subs || {}

export { npi }
