// ═══════════════════════════════════
// apqp.js — APQP tab dispatcher
// Depends on: npi.js, npi-ctq.js, npi-pfd.js, pfmea.js, npi-cp.js
// ═══════════════════════════════════

npi.apqp = npi.apqp || {}

npi.apqp.renderAPQP = function() {
  const p = prog()
  const highRPN = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
  const tabs = [
    { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: p.ctq.length },
    { id: APQP_TABS.PFD, label: 'Process Flow', badge: p.pfd.filter(s => npi.data.pfdType.isExecutable(s.type)).length },
    { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: p.pfmea.length, warn: highRPN > 0 },
    { id: APQP_TABS.CP, label: 'Control Plan', badge: p.cp.length }
  ]

  const tabNav = `<div class="apqp-tabs-shell">${
    tabs.map(t => `<button class="apqp-tab-btn ${apqpTab === t.id ? 'active' : ''}" onclick="npi.nav.setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? `<span class="apqp-tab-badge">(${t.badge})</span>` : ''}${t.warn ? `<span class="apqp-tab-warning">⚠</span>` : ''}</button>`).join('')
  }</div>`

  const inner = apqpTab === APQP_TABS.CTQ ? npi.ctq.render()
    : apqpTab === APQP_TABS.PFD ? npi.pfd.render()
    : apqpTab === APQP_TABS.PFMEA ? npi.pfmea.renderPFMEA()
    : npi.cp.render()

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
npi.apqp.delBomRef = function(sid, bt, iid) { return typeof npi.pfd?.delBomRef === 'function' ? npi.pfd.delBomRef(sid, bt, iid) : undefined }
npi.apqp.openCtqPick = function(oi) { return typeof npi.pfd?.openCtqPick === 'function' ? npi.pfd.openCtqPick(oi) : undefined }
npi.apqp.tCP = function(cid, checked) { return typeof npi.pfd?.toggleCtqPick === 'function' ? npi.pfd.toggleCtqPick(cid, checked) : undefined }
npi.apqp.saveCtqPick = function() { return typeof npi.pfd?.saveCtqPick === 'function' ? npi.pfd.saveCtqPick() : undefined }
npi.apqp.openBomPick = function(sid) { return typeof npi.pfd?.openBomPick === 'function' ? npi.pfd.openBomPick(sid) : undefined }
npi.apqp.refreshBomPickModal = function(p, filterId, listId, activeFilter) { return typeof npi.pfd?.refreshBomPickModal === 'function' ? npi.pfd.refreshBomPickModal(p, filterId, listId, activeFilter) : undefined }
npi.apqp.setBomFilter = function(f, fid, lid) { return typeof npi.pfd?.setBomFilter === 'function' ? npi.pfd.setBomFilter(f, fid, lid) : undefined }
npi.apqp.toggleBomPick = function(key, el) { return typeof npi.pfd?.toggleBomPick === 'function' ? npi.pfd.toggleBomPick(key, el) : undefined }
npi.apqp.saveBomPick = function() { return typeof npi.pfd?.saveBomPick === 'function' ? npi.pfd.saveBomPick() : undefined }
npi.apqp.openDocPick = function(oi) { return typeof npi.pfd?.openDocPick === 'function' ? npi.pfd.openDocPick(oi) : undefined }
npi.apqp.saveDocPick = function() { return typeof npi.pfd?.saveDocPick === 'function' ? npi.pfd.saveDocPick() : undefined }

npi.apqp.renderCP = function() { return typeof npi.cp?.render === 'function' ? npi.cp.render() : '' }
npi.apqp.syncFromPFMEA = function() {
  if (typeof npi.cp?.syncFromPFMEA === 'function') return npi.cp.syncFromPFMEA()
  if (typeof npi.data?.cp?.syncFromPFMEA === 'function') {
    const added = npi.data.cp.syncFromPFMEA()
    if (added === 0) showToast('All PFMEA causes already in control plan.', 'info')
    render()
    return
  }

  // Legacy fallback for isolated tests where split/data modules are not loaded.
  const p = prog()
  const ex = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))
  let n = 0
  p.pfmea.forEach(mode => {
    const step = p.pfd.find(s => s.id === mode.pfdId)
    const cids = step ? (step.ctqIds || []) : []
    const fc = cids.length > 0 ? p.ctq.find(c => c.id === cids[0]) : null
    ;(mode.effects || []).forEach(ef => {
      ;(ef.causes || []).forEach(ca => {
        if (ex.has(ca.id)) return
        const item = {
          id: crypto.randomUUID(),
          pfmeaId: mode.id, pfmeaEffectId: ef.id, pfmeaCauseId: ca.id, pfdId: mode.pfdId,
          char: mode.mode + (ef.effect ? ' → ' + ef.effect : '') + (ca.cause ? ' (' + ca.cause + ')' : ''),
          type: 'Process', spec: fc ? fc.spec : '', method: ca.detect || ca.prevent || '',
          freq: '100%', resp: '', reaction: fc ? fc.oos_action || '' : '', ctqIds: [...cids]
        }
        p.cp.push(item)
        if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
        else if (typeof save === 'function') save()
        n++
      })
    })
  })
  if (n === 0) return showToast('All PFMEA causes already in control plan.', 'info')
  render()
}
npi.apqp.addCP = function() {
  if (typeof npi.cp?.add === 'function') return npi.cp.add()
  if (typeof npi.data?.cp?.add === 'function') { npi.data.cp.add(); render(); return }
  const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }
  prog().cp.push(item)
  if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
  else if (typeof save === 'function') save()
  render()
}
npi.apqp.updCP = function(i, f, v) {
  if (typeof npi.cp?.upd === 'function') return npi.cp.upd(i, f, v)
  if (typeof npi.data?.cp?.upd === 'function') return npi.data.cp.upd(i, f, v)
  if (!prog().cp[i]) return
  prog().cp[i][f] = v
  if (typeof npiRelSaveCP === 'function') npiRelSaveCP(prog().cp[i])
  else if (typeof save === 'function') save()
}
npi.apqp.delCP = function(i) {
  if (typeof npi.cp?.del === 'function') return npi.cp.del(i)
  if (typeof npi.data?.cp?.del === 'function') { npi.data.cp.del(i); render(); return }
  if (!prog().cp[i]) return
  const id = prog().cp[i].id
  prog().cp.splice(i, 1)
  if (typeof npiRelDeleteCP === 'function') npiRelDeleteCP(id)
  else if (typeof save === 'function') save()
  render()
}
