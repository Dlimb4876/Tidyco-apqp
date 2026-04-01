// ═══════════════════════════════════
// apqp.js — APQP tab dispatcher
// Depends on: npi.js, npi-ctq.js, npi-pfd.js, pfmea.js, npi-cp.js
// ═══════════════════════════════════

import { appState, prog } from '../../../../core/js/state.js'
import { npiData } from './npi-data.js'
import { APQP_TABS, RPN_HIGH } from './npi-constants.js'
import { npiCtq } from './npi-ctq.js'
import { npiPfd } from './npi-pfd.js'
import { npi } from './npi-shared.js'
import './pfmea.js'
// Bug fix: npi-cp.js was never imported — CP tab side-effects (npi.cp.*) never fired
import './npi-cp.js'


npi.apqp.renderAPQP = function() {
  const p = prog()
  // Bug fix: Guard against undefined arrays and calcRPN if pfmea.js hasn't fully initialized
  const pfmea = p.pfmea || []
  const pfd = p.pfd || []
  const ctq = p.ctq || []
  const cp = p.cp || []
  const calcRPN = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0
  const highRPN = pfmea.filter(r => calcRPN(r) >= RPN_HIGH).length
  const tabs = [
    { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: ctq.length },
    { id: APQP_TABS.PFD, label: 'Process Flow', badge: pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },
    { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: pfmea.length, warn: highRPN > 0 },
    { id: APQP_TABS.CP, label: 'Control Plan', badge: cp.length }
  ]

  const tabNav = `<div class="apqp-tabs-shell">${
    tabs.map(t => `<button class="apqp-tab-btn ${appState.apqpTab === t.id ? 'active' : ''}" onclick="npi.nav.setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? `<span class="apqp-tab-badge">(${t.badge})</span>` : ''}${t.warn ? `<span class="apqp-tab-warning">⚠</span>` : ''}</button>`).join('')
  }</div>`

  const inner = appState.apqpTab === APQP_TABS.CTQ ? npiCtq.render()
    : appState.apqpTab === APQP_TABS.PFD ? npiPfd.render()
    : appState.apqpTab === APQP_TABS.PFMEA ? npi.pfmea.renderPFMEA()
    : (typeof npi.cp?.render === 'function' ? npi.cp.render() : '')

  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">APQP</div><div class="sec-desc">CTQ requirements, process flow, PFMEA and control plan in one place.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-apqp')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button></div></div>
  ${tabNav}
  <div style="background:var(--white);border:1px solid var(--line);border-top:none;border-radius:0 0 8px 8px;padding:24px 0 0"></div>
  <div class="apqp-tab-content" style="padding:24px 0">${inner}</div>`
}

// Backward compatibility aliases for existing inline handlers.
npi.apqp.renderCTQ = function() { return typeof npi.ctq?.render === 'function' ? npi.ctq.render() : '' }
npi.apqp.addCTQ = function() { return typeof npi.ctq?.add === 'function' ? npi.ctq.add() : undefined }
npi.apqp.updCTQ = function(i, f, v) { return typeof npi.ctq?.upd === 'function' ? npi.ctq.upd(i, f, v) : undefined }
npi.apqp.delCTQ = function(i) { return typeof npi.ctq?.del === 'function' ? npi.ctq.del(i) : undefined }

npi.apqp.renderPFD = function() { return typeof npi.pfd?.render === 'function' ? npi.pfd.render() : '' }
npi.apqp.addMainStep = function() { return typeof npi.pfd?.addMainStep === 'function' ? npi.pfd.addMainStep() : undefined }
npi.apqp.openInsert = function(afterOi, ft) { return typeof npi.pfd?.openInsert === 'function' ? npi.pfd.openInsert(afterOi, ft) : undefined }
npi.apqp.confirmInsert = function() { return typeof npi.pfd?.confirmInsert === 'function' ? npi.pfd.confirmInsert() : undefined }
npi.apqp.delPFD = function(sid) { return typeof npi.pfd?.del === 'function' ? npi.pfd.del(sid) : undefined }
npi.apqp.updPFD = function(sid, f, v) { return typeof npi.pfd?.upd === 'function' ? npi.pfd.upd(sid, f, v) : undefined }
npi.apqp.scrollToPfd = function(sid) { return typeof npi.pfd?.scrollTo === 'function' ? npi.pfd.scrollTo(sid) : undefined }
npi.apqp.toggleGroup = function(key) { return typeof npi.pfd?.toggleGroup === 'function' ? npi.pfd.toggleGroup(key) : undefined }
npi.apqp.openResourceEdit = function(sid, bt, iid) { return typeof npi.pfd?.openResourceEdit === 'function' ? npi.pfd.openResourceEdit(sid, bt, iid) : undefined }
npi.apqp.saveResourceEdit = function() { return typeof npi.pfd?.saveResourceEdit === 'function' ? npi.pfd.saveResourceEdit() : undefined }
npi.apqp.deleteResourceEdit = function() { return typeof npi.pfd?.deleteResourceEdit === 'function' ? npi.pfd.deleteResourceEdit() : undefined }
npi.apqp.openCtqPick = function(oi) { return typeof npi.pfd?.openCtqPick === 'function' ? npi.pfd.openCtqPick(oi) : undefined }
npi.apqp.tCP = function(cid, checked) { return typeof npi.pfd?.toggleCtqPick === 'function' ? npi.pfd.toggleCtqPick(cid, checked) : undefined }
npi.apqp.saveCtqPick = function() { return typeof npi.pfd?.saveCtqPick === 'function' ? npi.pfd.saveCtqPick() : undefined }
npi.apqp.openBomPick = function(sid) { return typeof npi.pfd?.openBomPick === 'function' ? npi.pfd.openBomPick(sid) : undefined }
npi.apqp.refreshBomPickModal = function(p, filterId, listId, activeFilter, searchTerm) { return typeof npi.pfd?.refreshBomPickModal === 'function' ? npi.pfd.refreshBomPickModal(p, filterId, listId, activeFilter, searchTerm) : undefined }
npi.apqp.setBomFilter = function(f, fid, lid) { return typeof npi.pfd?.setBomFilter === 'function' ? npi.pfd.setBomFilter(f, fid, lid) : undefined }
npi.apqp.searchBomPick = function(query) { return typeof npi.pfd?.searchBomPick === 'function' ? npi.pfd.searchBomPick(query) : undefined }
npi.apqp.toggleBomPick = function(key, el) { return typeof npi.pfd?.toggleBomPick === 'function' ? npi.pfd.toggleBomPick(key, el) : undefined }
npi.apqp.saveBomPick = function() { return typeof npi.pfd?.saveBomPick === 'function' ? npi.pfd.saveBomPick() : undefined }
npi.apqp.openDocPick = function(oi) { return typeof npi.pfd?.openDocPick === 'function' ? npi.pfd.openDocPick(oi) : undefined }
npi.apqp.saveDocPick = function() { return typeof npi.pfd?.saveDocPick === 'function' ? npi.pfd.saveDocPick() : undefined }

npi.apqp.renderCP = function() { return typeof npi.cp?.render === 'function' ? npi.cp.render() : '' }
// Backward-compat aliases delegate to npi.cp.* (imported via npi-cp.js side-effect)
npi.apqp.syncFromPFMEA = function() { return npi.cp.syncFromPFMEA() }
npi.apqp.addCP = function() { return npi.cp.add() }
npi.apqp.updCP = function(i, f, v) { return npi.cp.upd(i, f, v) }
npi.apqp.delCP = function(i) { return npi.cp.del(i) }

export const npiApqp = npi.apqp
export const renderApqp = npi.apqp.renderAPQP
