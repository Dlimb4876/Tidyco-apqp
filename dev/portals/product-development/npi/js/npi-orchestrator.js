// ═══════════════════════════════════
// npi-orchestrator.js — NPI section orchestrator
// Depends on: NPI feature modules + state helpers
// ═══════════════════════════════════

import { prog } from '../../../../core/js/state.js'
import { renderDashboard } from './dashboard.js'
import { renderGatePage } from './gates.js'
import { renderApqp } from './apqp.js'
import { renderActions, renderRisks } from './trackers.js'
import { renderBom } from './bom.js'
import { renderTimingPlan } from './timing.js'
import { renderDocuments } from './documents.js'

export function initNpiOrchestrator({ watchRender, renderApp, npiDataSubscribe }) {
  watchRender('render', function() {
    renderApp()
  })
  Promise.resolve()
    .then(() => npiDataSubscribe())
    .catch(err => console.error('[NPI] init error:', err))
}

export function cleanupNpiOrchestrator({ npiDataUnsubscribe, teardownEvents }) {
  npiDataUnsubscribe()
  teardownEvents()
}

export function renderNpi(section) {
  const inner = renderNpiSection(section)
  return `<div id="npi-content">${inner}</div>`
}

export function renderNpiSection(section) {
  const p = prog()
  const isSubAssembly = !!(p && p.parentId)

  if (section === 'project') return renderDashboard()

  if (section && section.startsWith('gate_')) {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Gates are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Sub-assemblies do not have standalone gates. Use the root project for gate reviews and sign-off.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('${section}')">Open Root Gate View</button></div></div>`
    }

    const gateNum = Number(section.split('_')[1])
    return Number.isFinite(gateNum) ? renderGatePage(gateNum) : ''
  }

  if (section === 'apqp') return renderApqp()

  if (section === 'actions') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Actions are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Open root actions to create or update items for this sub-assembly.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('actions')">Open Root Actions</button></div></div>`
    }
    return renderActions()
  }

  if (section === 'risks') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Risks are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Open root risks to create or update items for this sub-assembly.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('risks')">Open Root Risks</button></div></div>`
    }
    return renderRisks()
  }

  if (section === 'bom') return renderBom()

  if (section === 'timing') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Timing is managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Sub-assembly timing is reviewed from the root project view.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('project')">Open Root Project</button></div></div>`
    }
    return renderTimingPlan()
  }

  if (section === 'documents') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Documents are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Use the root project for shared project-management documents.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('project')">Open Root Project</button></div></div>`
    }
    return renderDocuments()
  }

  return ''
}
