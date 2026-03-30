// ═══════════════════════════════════
// npi.js — NPI namespace root and wiring
// ═══════════════════════════════════

import { appState, db, prog } from '../../../../core/js/state.js'
import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { migrateprog } from '../../../../core/js/db.js'
import { navigate, goHome, render, setApqpTab } from '../../../../utils/js/navigation.js'
import { showToast, isEditingInlineCell } from '../../../../utils/js/helpers.js'
import {
  createRealtimeSubscription,
  removeRealtimeSubscription,
  removeRealtimeSubscriptionsMatching
} from '../../../../utils/js/realtime.js'
import { requestRender } from '../../../../utils/js/render-scheduler.js'
import { injectNPIModals } from './modals.js'
import { npiRelLoad } from './npi-data-relational.js'
import { initNpiEvents, teardownNpiEvents, setupNpiEvents } from './npi-events.js'
import {
  initNpiOrchestrator,
  cleanupNpiOrchestrator,
  renderNpi,
  renderNpiSection
} from './npi-orchestrator.js'
import { ensureProductProjects } from './dashboard.js'
import { setProductDevelopmentTab } from '../../js/product-development.js'

const NPI_PROJECTS_CHANNEL = 'npi_projects_channel'
const NPI_TABLES_CHANNEL_PREFIX = 'npi_tables_'
const NPI_SIGNOFF_SETTING_KEYS = {
  me_manager: 'gate_signoff_me_manager',
  operations_director: 'gate_signoff_operations_director',
  sales_director: 'gate_signoff_sales_director'
}
const NPI_SIGNOFF_ROLES = Object.keys(NPI_SIGNOFF_SETTING_KEYS)

let npiRealtimeActive = false
let npiReloadTimer = null
let npiGateSignoffConfig = null
let npiDataInitInProgress = null

const npi = globalThis.npi || {}
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

npi.watch = function(key, cb) {
  if (!npi._subs[key]) npi._subs[key] = []
  npi._subs[key].push(cb)
}

npi.notify = function(key) {
  const cbs = npi._subs[key] || []
  cbs.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.error('[NPI] notify error:', e)
    }
  })
}

npi.nav.navigate = function(section) {
  const p = prog()
  const isSubAssembly = !!(p && p.parentId)

  if (isSubAssembly) {
    const parent = (db.projects || []).find(x => x && x.id === p.parentId)
    if (parent) {
      const blockedSections = new Set(['actions', 'risks', 'timing', 'documents'])
      if (section && section.startsWith('gate_')) {
        appState.progId = parent.id
        navigate(section)
        return
      }
      if (blockedSections.has(section)) {
        appState.progId = parent.id
        navigate(section === 'timing' || section === 'documents' ? 'project' : section)
        return
      }
    }
  }

  navigate(section)
}

npi.nav.goHome = function() {
  goHome()
}

npi.nav.render = function() {
  render()
}

npi.nav.setApqpTab = function(tab) {
  setApqpTab(tab)
}

npi.nav.setProductDevelopmentTab = function(tab) {
  setProductDevelopmentTab(tab)
}

npi.nav.openProjectById = async function(id) {
  if (!id) return

  let targetId = id
  const current = Array.isArray(db.projects) ? db.projects.find(p => p && p.id === id) : null

  if (current && current.product_id && Array.isArray(db.projects)) {
    const siblings = db.projects.filter(p => p && p.product_id === current.product_id && p.id)
    if (siblings.length > 1) {
      const siblingIds = [...new Set(siblings.map(p => p.id))]
      const scoreByProjectId = {}
      const scoredTables = [
        'npi_ctq',
        'npi_pfd_steps',
        'npi_bom_items',
        'npi_actions',
        'npi_risks',
        'npi_gates',
        'npi_documents'
      ]

      try {
        await Promise.all(scoredTables.map(async table => {
          const { data, error } = await supa.from(table).select('project_id').in('project_id', siblingIds)
          if (error || !Array.isArray(data)) return
          data.forEach(row => {
            if (!row || !row.project_id) return
            scoreByProjectId[row.project_id] = (scoreByProjectId[row.project_id] || 0) + 1
          })
        }))

        const bestId = siblingIds.reduce((best, candidate) => {
          const bestScore = scoreByProjectId[best] || 0
          const candidateScore = scoreByProjectId[candidate] || 0
          return candidateScore > bestScore ? candidate : best
        }, targetId)

        if ((scoreByProjectId[bestId] || 0) > (scoreByProjectId[targetId] || 0)) {
          targetId = bestId
          showToast('Opened the project copy that contains existing APQP/BoM data', 'info', 3500)
        }
      } catch (err) {
        console.warn('[NPI] duplicate project resolution failed:', err && err.message ? err.message : err)
      }
    }
  }

  appState.progId = targetId
  navigate('project')
}

npi.nav.openParentSection = function(section) {
  const p = prog()
  if (!p || !p.parentId) return
  const parent = (db.projects || []).find(x => x && x.id === p.parentId)
  if (!parent) return
  appState.progId = parent.id
  navigate(section || 'project')
}

npi.nav.openPfmeaTab = function() {
  appState.apqpTab = 'pfmea'
  navigate('apqp')
}

npi.nav.alertEnterNameFirst = function() {
  showToast('Enter name first', 'warning')
}

npi.nav.stopEvent = function(evt) {
  if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation()
}

function parseSignoffSetting(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

async function loadNpiGateSignoffConfig() {
  const config = {}
  NPI_SIGNOFF_ROLES.forEach(role => {
    config[role] = []
  })

  try {
    const { data, error } = await supa
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', Object.values(NPI_SIGNOFF_SETTING_KEYS))

    if (!error) {
      const foundKeys = new Set()
      ;(data || []).forEach(row => {
        const role = NPI_SIGNOFF_ROLES.find(key => NPI_SIGNOFF_SETTING_KEYS[key] === row.setting_key)
        if (!role) return
        config[role] = parseSignoffSetting(row.setting_value)
        foundKeys.add(row.setting_key)
      })

      NPI_SIGNOFF_ROLES.forEach(role => {
        const settingKey = NPI_SIGNOFF_SETTING_KEYS[role]
        if (foundKeys.has(settingKey)) {
          localStorage.setItem(settingKey, JSON.stringify(config[role]))
          return
        }
        config[role] = parseSignoffSetting(localStorage.getItem(settingKey))
      })

      return config
    }
  } catch (_) {
    console.debug('[Gate Signoffs] global_settings unavailable, using localStorage')
  }

  NPI_SIGNOFF_ROLES.forEach(role => {
    const settingKey = NPI_SIGNOFF_SETTING_KEYS[role]
    config[role] = parseSignoffSetting(localStorage.getItem(settingKey))
  })
  return config
}

export function getNpiGateSignoffConfig() {
  return npiGateSignoffConfig
}

function markRealtimeUpdate() {
  // reserved for future live-update indicator hooks
}

function upsertRealtimeProject(row) {
  if (!row || !row.prog_id || !row.data) return false

  const incoming = migrateprog(row.data)
  incoming.dbId = row.id || incoming.dbId || null
  incoming.id = row.prog_id
  if (row.name && !incoming.name) incoming.name = row.name

  const idx = (db.projects || []).findIndex(p => p && p.id === row.prog_id)
  if (idx >= 0) db.projects[idx] = incoming
  else db.projects.push(incoming)
  return true
}

function shouldRenderForProject(progRowId) {
  if (appState.progId === progRowId) return true
  if (appState.currentSection === 'projects') return true
  return false
}

function scheduleNpiReload() {
  clearTimeout(npiReloadTimer)
  npiReloadTimer = setTimeout(() => {
    if (!appState.progId) return
    requestRender('npi', {
      trigger: 'realtime',
      renderNow: function() {
        npiRelLoad(appState.progId).then(() => {
          markRealtimeUpdate()
          render()
        })
      },
      isEditing: isEditingInlineCell(),
      debounceMs: 0
    })
  }, 600)
}

export async function npiDataSubscribe() {
  if (npiDataInitInProgress) return npiDataInitInProgress

  npiDataInitInProgress = (async () => {
    injectNPIModals()

    if (npiGateSignoffConfig === null) {
      npiGateSignoffConfig = await loadNpiGateSignoffConfig()
      globalThis.npiGateSignoffConfig = npiGateSignoffConfig
    }

    if (appState.npiLoadedProgId !== appState.progId && appState.progId) {
      appState.npiLoadedProgId = appState.progId
      await npiRelLoad(appState.progId)
      render()
    }

    if (npiRealtimeActive) return

    createRealtimeSubscription('projects', NPI_PROJECTS_CHANNEL, {
      onInsert: row => {
        if (!upsertRealtimeProject(row)) return
        markRealtimeUpdate()
        if (shouldRenderForProject(row.prog_id)) {
          requestRender('npi', { trigger: 'realtime', renderNow: render, isEditing: isEditingInlineCell(), debounceMs: 0 })
        }
      },
      onUpdate: row => {
        if (!upsertRealtimeProject(row)) return
        markRealtimeUpdate()
        if (shouldRenderForProject(row.prog_id)) {
          requestRender('npi', { trigger: 'realtime', renderNow: render, isEditing: isEditingInlineCell(), debounceMs: 0 })
        }
      },
      onDelete: row => {
        if (!row || !row.prog_id) return
        const wasCurrentProject = appState.progId === row.prog_id
        const idx = (db.projects || []).findIndex(p => p && p.id === row.prog_id)
        if (idx < 0) return
        db.projects.splice(idx, 1)
        markRealtimeUpdate()
        if (wasCurrentProject) appState.progId = db.projects[0]?.id || null
        if (appState.currentSection === 'projects' || wasCurrentProject) {
          requestRender('npi', { trigger: 'realtime', renderNow: render, isEditing: isEditingInlineCell(), debounceMs: 0 })
        }
      }
    })

    const npiTables = [
      'npi_ctq', 'npi_pfd_steps', 'npi_pfmea_modes', 'npi_pfmea_effects',
      'npi_pfmea_causes', 'npi_pfmea_history', 'npi_control_plan',
      'npi_bom_items', 'npi_bom_kits', 'npi_bom_kit_items',
      'npi_gates', 'npi_gate_sigs', 'npi_actions', 'npi_risks', 'npi_gantt_rows',
      'npi_documents'
    ]
    npiTables.forEach(table => {
      createRealtimeSubscription(table, NPI_TABLES_CHANNEL_PREFIX + table, {
        onInsert: scheduleNpiReload,
        onUpdate: scheduleNpiReload,
        onDelete: scheduleNpiReload
      })
    })

    npiRealtimeActive = true
  })()

  try {
    await npiDataInitInProgress
  } finally {
    npiDataInitInProgress = null
  }
}

export const npiDataInit = npiDataSubscribe

export function npiDataUnsubscribe() {
  if (!npiRealtimeActive) return
  removeRealtimeSubscription(NPI_PROJECTS_CHANNEL)
  removeRealtimeSubscriptionsMatching(NPI_TABLES_CHANNEL_PREFIX)
  npiRealtimeActive = false
  appState.npiLoadedProgId = null
  clearTimeout(npiReloadTimer)
}

function resetNpiSubscriptions() {
  npi._subs = {}
}

export function initNpi() {
  resetNpiSubscriptions()
  initNpiOrchestrator({
    watchRender: npi.watch,
    renderApp: render,
    npiDataSubscribe: npiDataInit
  })
}

export function cleanupNpi() {
  cleanupNpiOrchestrator({
    npiDataUnsubscribe,
    teardownEvents: teardownNpiEvents
  })
}

npi.init = initNpi
npi.cleanup = cleanupNpi
npi.render = renderNpi
npi._renderInner = renderNpiSection

initNpiEvents({
  setupNpiEvents,
  teardownNpiEvents,
  getNpi: function() {
    return npi
  }
})

npi.dashboard.ensureProductProjects = ensureProductProjects

export { renderNpi, renderNpiSection }
export function npiEnsureProductProjects() {
  ensureProductProjects()
}

globalThis.npi = npi
globalThis.npiGateSignoffConfig = npiGateSignoffConfig
