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

// ── Realtime sync for shared NPI programmes ──────────────────
let npiRealtimeActive = false
const NPI_PROGRAMMES_CHANNEL = 'npi_programmes_channel'

function upsertRealtimeProgramme(row) {
  if (!row || !row.prog_id) return false
  if (!row.data) return false

  const incoming = migrateprog(row.data)
  incoming.id = row.prog_id
  if (row.name && !incoming.name) incoming.name = row.name

  const idx = db.programmes.findIndex(p => p.id === row.prog_id)
  if (idx >= 0) db.programmes[idx] = incoming
  else db.programmes.push(incoming)
  return true
}

function shouldRenderForProgramme(progRowId) {
  if (progId === progRowId) return true
  if (currentSection === 'projects') return true
  return false
}

function npiDataInit() {
  if (npiRealtimeActive) return
  if (typeof createRealtimeSubscription !== 'function') return

  const sub = createRealtimeSubscription('programmes', NPI_PROGRAMMES_CHANNEL, {
    onInsert: (row) => {
      if (!upsertRealtimeProgramme(row)) return
      if (shouldRenderForProgramme(row.prog_id)) render()
    },
    onUpdate: (row) => {
      if (!upsertRealtimeProgramme(row)) return
      if (shouldRenderForProgramme(row.prog_id)) render()
    },
    onDelete: (row) => {
      if (!row || !row.prog_id) return
      const wasCurrentProgramme = progId === row.prog_id
      const idx = db.programmes.findIndex(p => p.id === row.prog_id)
      if (idx < 0) return
      db.programmes.splice(idx, 1)
      if (wasCurrentProgramme) progId = db.programmes[0]?.id || null
      if (currentSection === 'projects' || wasCurrentProgramme) render()
    }
  })

  npiRealtimeActive = !!sub
}

function npiDataUnsubscribe() {
  if (!npiRealtimeActive) return
  if (typeof removeRealtimeSubscription === 'function') {
    removeRealtimeSubscription(NPI_PROGRAMMES_CHANNEL)
  }
  npiRealtimeActive = false
}
