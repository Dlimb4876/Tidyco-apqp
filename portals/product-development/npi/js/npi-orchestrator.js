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
  const p = typeof prog === 'function' ? prog() : null
  const isSubAssembly = !!(p && p.parentId)

  if (section === 'project') return npi.dashboard.renderDashboard()

  if (section && section.startsWith('gate_')) {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Gates are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Sub-assemblies do not have standalone gates. Use the root project for gate reviews and sign-off.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('${section}')">Open Root Gate View</button></div></div>`
    }

    const gateNum = Number(section.split('_')[1])
    return Number.isFinite(gateNum) ? npi.gate.renderGatePage(gateNum) : ''
  }

  if (section === 'apqp') return npi.apqp.renderAPQP()

  if (section === 'actions') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Actions are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Open root actions to create or update items for this sub-assembly.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('actions')">Open Root Actions</button></div></div>`
    }
    return npi.tracker.renderActions()
  }

  if (section === 'risks') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Risks are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Open root risks to create or update items for this sub-assembly.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('risks')">Open Root Risks</button></div></div>`
    }
    return npi.tracker.renderRisks()
  }

  if (section === 'bom') return npi.bom.renderBOM()

  if (section === 'timing') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Timing is managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Sub-assembly timing is reviewed from the root project view.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('project')">Open Root Project</button></div></div>`
    }
    return npi.timing.renderTimingPlan()
  }

  if (section === 'documents') {
    if (isSubAssembly) {
      return `<div class="card" style="margin:16px"><div class="card-head"><span class="card-title">Documents are managed in the root project</span></div><div style="padding:12px;font-size:13px;color:var(--muted)">Use the root project for shared project-management documents.</div><div style="padding:0 12px 12px"><button class="btn btn-primary btn-sm" onclick="npi.nav.openParentSection('project')">Open Root Project</button></div></div>`
    }
    return npi.docs.render()
  }

  return ''
}
