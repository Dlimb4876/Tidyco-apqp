// ═══════════════════════════════════
// npi.js — NPI namespace root
// Loaded before all other NPI feature files (after npi-constants.js)
// All NPI portal functions live under window.npi.*
// ═══════════════════════════════════

window.npi = {
  nav: {},        // navigation wrappers
  data: {}, // npi-data.js facade
  components: {}, // npi-components.js UI helpers
  ctq: {}, // npi-ctq.js
  pfd: {}, // npi-pfd.js
  cp: {}, // npi-cp.js
  gate: {}, // gates.js
  tracker: {}, // trackers.js
  bom: {}, // bom.js
  timing: {}, // timing.js
  pfmea: {}, // pfmea.js
  apqp: {}, // apqp.js
  dashboard: {}, // dashboard.js
  events: {},     // npi-events.js
  init: null,
  cleanup: null,
  render: null
}

npi.nav.navigate = function(section) { navigate(section) }
npi.nav.goHome = function() { goHome() }
npi.nav.render = function() { render() }
npi.nav.setApqpTab = function(tab) { setApqpTab(tab) }
npi.nav.setProductDevelopmentTab = function(tab) { setProductDevelopmentTab(tab) }
npi.nav.openProjectById = function(id) { progId = id; navigate('project') }
npi.nav.openPfmeaTab = function() { apqpTab = 'pfmea'; navigate('apqp') }
npi.nav.alertEnterNameFirst = function() { showToast('Enter name first', 'warning') }
npi.nav.stopEvent = function(evt) { if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation() }

// ── Pub-sub: subscribe/publish render events ─────────────────
npi._subs = {}
npi.watch = function(key, cb) {
  if (!npi._subs[key]) npi._subs[key] = []
  npi._subs[key].push(cb)
}
npi.notify = function(key) {
  const cbs = npi._subs[key] || []
  cbs.forEach(cb => { try { cb() } catch (e) { console.error('[NPI] notify error:', e) } })
}

// ── Realtime sync for shared NPI programmes ──────────────────
let npiRealtimeActive = false
let npiLoadedProgId = null
const NPI_PROGRAMMES_CHANNEL = 'npi_programmes_channel'
const NPI_TABLES_CHANNEL_PREFIX = 'npi_tables_'
let npiLastRealtimeUpdateAt = 0
let npiReloadTimer = null

function formatRealtimeTime(dt) {
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function npiMarkRealtimeUpdate() {
  npiLastRealtimeUpdateAt = Date.now()
}

function npiRealtimeIndicatorHTML() {
  if (!npiLastRealtimeUpdateAt) return ''
  const dt = new Date(npiLastRealtimeUpdateAt)
  const ageMs = Date.now() - npiLastRealtimeUpdateAt
  const recentTag = ageMs < 10000 ? '<span style="font-size:10px;font-weight:700;color:var(--green);margin-left:6px">JUST NOW</span>' : ''
  return `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--bg);font-size:11px;color:var(--muted)"><span style="width:7px;height:7px;border-radius:50%;background:var(--green)"></span><span>Live updated ${formatRealtimeTime(dt)}</span>${recentTag}</div>`
}

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

// Schedule a throttled reload from relational tables (for remote changes)
function npiScheduleReload() {
  clearTimeout(npiReloadTimer)
  npiReloadTimer = setTimeout(() => {
    if (!progId || typeof npiRelLoad !== 'function') return
    npiRelLoad(progId).then(() => {
      npiMarkRealtimeUpdate()
      render()
    })
  }, 600)
}

function npiDataInit() {
  if (typeof createRealtimeSubscription !== 'function') return

  // Load relational data when switching to a new programme
  if (npiLoadedProgId !== progId && progId && typeof npiRelLoad === 'function') {
    npiLoadedProgId = progId
    npiRelLoad(progId).then(() => render())
  }

  // Subscriptions are one-time setup (guard against re-init)
  if (npiRealtimeActive) return

  // Subscribe to programmes table (metadata changes)
  createRealtimeSubscription('programmes', NPI_PROGRAMMES_CHANNEL, {
    onInsert: (row) => {
      if (!upsertRealtimeProgramme(row)) return
      npiMarkRealtimeUpdate()
      if (shouldRenderForProgramme(row.prog_id)) render()
    },
    onUpdate: (row) => {
      if (!upsertRealtimeProgramme(row)) return
      npiMarkRealtimeUpdate()
      if (shouldRenderForProgramme(row.prog_id)) render()
    },
    onDelete: (row) => {
      if (!row || !row.prog_id) return
      const wasCurrentProgramme = progId === row.prog_id
      const idx = db.programmes.findIndex(p => p.id === row.prog_id)
      if (idx < 0) return
      db.programmes.splice(idx, 1)
      npiMarkRealtimeUpdate()
      if (wasCurrentProgramme) progId = db.programmes[0]?.id || null
      if (currentSection === 'projects' || wasCurrentProgramme) render()
    }
  })

  // Subscribe to all NPI-specific tables — any remote change triggers a reload
  const npiTables = [
    'npi_ctq', 'npi_pfd_steps', 'npi_pfmea_modes', 'npi_pfmea_effects',
    'npi_pfmea_causes', 'npi_pfmea_history', 'npi_control_plan',
    'npi_bom_items', 'npi_bom_kits', 'npi_bom_kit_items',
    'npi_gates', 'npi_gate_sigs', 'npi_actions', 'npi_risks', 'npi_gantt_rows'
  ]
  npiTables.forEach(table => {
    createRealtimeSubscription(table, NPI_TABLES_CHANNEL_PREFIX + table, {
      onInsert: npiScheduleReload,
      onUpdate: npiScheduleReload,
      onDelete: npiScheduleReload
    })
  })

  npiRealtimeActive = true
}

function npiDataUnsubscribe() {
  if (!npiRealtimeActive) return
  if (typeof removeRealtimeSubscription === 'function') {
    removeRealtimeSubscription(NPI_PROGRAMMES_CHANNEL)
  }
  if (typeof removeRealtimeSubscriptionsMatching === 'function') {
    removeRealtimeSubscriptionsMatching(NPI_TABLES_CHANNEL_PREFIX)
  }
  npiRealtimeActive = false
  npiLoadedProgId = null
  clearTimeout(npiReloadTimer)
}
