// ═══════════════════════════════════
// npi-data.js — Data facade for NPI mutations and derived helpers
// Depends on: state.js, npi.js, npi-data-relational.js
// ═══════════════════════════════════

npi.data = npi.data || {}

npi.data.prog = function() { return prog() }

npi.data.sortedPfd = function(pfd) { return [...(pfd || [])].sort((a, b) => a.stepNum - b.stepNum) }
npi.data.nextMainStepNum = function(pfd) {
  const tens = (pfd || []).filter(s => s.stepNum % 10 === 0).map(s => s.stepNum)
  return tens.length ? Math.max(...tens) + 10 : 10
}
npi.data.stepNumConflict = function(pfd, num) { return (pfd || []).some(s => s.stepNum === num) }
npi.data.ganttNewRow = function(section) {
  return {
    id: crypto.randomUUID(),
    task: '', section: section || 's1', role: 'ME',
    planned: Array(GANTT_WEEKS).fill(0),
    actual: Array(GANTT_WEEKS).fill(0),
    notes: '', collapsed: false
  }
}

npi.data.ctq = {
  add() {
    const item = { id: crypto.randomUUID(), req: '', spec: '', testMethod: '', source: 'Customer Spec', oos_action: 'TBD', customerAgreed: false }
    prog().ctq.push(item)
    npiRelSaveCTQ(item)
    return item
  },
  upd(i, f, v) {
    const p = prog()
    if (!p.ctq[i]) return
    p.ctq[i][f] = v
    npiRelSaveCTQ(p.ctq[i])
  },
  del(i) {
    const p = prog()
    if (!p.ctq[i]) return
    const cid = p.ctq[i].id
    p.pfd.forEach(s => { s.ctqIds = (s.ctqIds || []).filter(x => x !== cid); npiRelSavePFDStep(s) })
    p.pfmea.forEach(r => { r.ctqIds = (r.ctqIds || []).filter(x => x !== cid); npiRelSavePFMEAMode(r) })
    npiRelDeleteCTQ(cid)
    p.ctq.splice(i, 1)
  }
}

npi.data.pfd = {
  addMainStep() {
    const p = prog()
    const step = { id: crypto.randomUUID(), stepNum: npi.data.nextMainStepNum(p.pfd), type: 'step', op: '', detail: '', ctqIds: [], bomRefs: [] }
    p.pfd.push(step)
    npiRelSavePFDStep(step)
    return step
  },
  insertStep(num, type) {
    const p = prog()
    if (!num || num < 1) return { ok: false, error: 'Enter valid number' }
    if (npi.data.stepNumConflict(p.pfd, num)) return { ok: false, error: `Step ${num} exists` }
    const step = { id: crypto.randomUUID(), stepNum: num, type: type || 'step', op: '', detail: '', ctqIds: [], bomRefs: [] }
    p.pfd.push(step)
    npiRelSavePFDStep(step)
    return { ok: true, step }
  },
  del(sid) {
    const p = prog()
    const i = p.pfd.findIndex(s => s.id === sid)
    if (i < 0) return
    p.pfmea.forEach(r => { if (r.pfdId === sid) { r.pfdId = ''; npiRelSavePFMEAMode(r) } })
    p.pfd.splice(i, 1)
    npiRelDeletePFDStep(sid)
  },
  upd(sid, f, v) {
    const s = prog().pfd.find(x => x.id === sid)
    if (!s) return
    s[f] = v
    npiRelSavePFDStep(s)
  },
  toggleGroup(collapsedGroups, key) {
    if (collapsedGroups.has(key)) collapsedGroups.delete(key)
    else collapsedGroups.add(key)
  },
  delBomRef(sid, bt, iid) {
    const s = prog().pfd.find(x => x.id === sid)
    if (!s) return
    s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === bt && r.itemId === iid))
    npiRelSavePFDStep(s)
  },
  saveCtqPick(stepIndex, selectedIds) {
    const step = prog().pfd[stepIndex]
    if (!step) return
    step.ctqIds = [...selectedIds]
    npiRelSavePFDStep(step)
  },
  saveBomPick(stepId, selectedKeys) {
    const s = prog().pfd.find(x => x.id === stepId)
    if (!s) return
    s.bomRefs = selectedKeys.map(k => {
      const [bt, id] = k.split('|')
      return { bomType: bt, itemId: id }
    })
    npiRelSavePFDStep(s)
  }
}

npi.data.cp = {
  syncFromPFMEA() {
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
          npiRelSaveCP(item)
          n++
        })
      })
    })
    return n
  },
  add() {
    const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }
    prog().cp.push(item)
    npiRelSaveCP(item)
    return item
  },
  upd(i, f, v) {
    const p = prog()
    if (!p.cp[i]) return
    p.cp[i][f] = v
    npiRelSaveCP(p.cp[i])
  },
  del(i) {
    const p = prog()
    if (!p.cp[i]) return
    const id = p.cp[i].id
    p.cp.splice(i, 1)
    npiRelDeleteCP(id)
  }
}

npi.data.bom = {
  addRow(type) {
    const p = prog()
    if (!p.bom[type]) return null
    const base = { id: crypto.randomUUID(), desc: '', notes: '', isStd: false, isAaw: false, isRepair: false }
    let item = base
    if (type === 'parts') item = { ...base, pn: '', supplierPN: '', qty: 1, unit: 'ea' }
    else if (type === 'tools') item = { ...base, toolId: '', spec: '' }
    else if (type === 'equip') item = { ...base, equipId: '', location: '' }
    else if (type === 'mat' || type === 'cons') item = { ...base, pn: '', unit: '', qtyPerUnit: 0 }
    p.bom[type].push(item)
    npiRelSaveBOMItem(type, item)
    return item
  },
  updRow(type, i, f, v) {
    const p = prog()
    if (!p.bom[type] || !p.bom[type][i]) return
    p.bom[type][i][f] = v
    npiRelSaveBOMItem(type, p.bom[type][i])
  },
  delRow(type, i) {
    const p = prog()
    if (!p.bom[type] || !p.bom[type][i]) return
    const item = p.bom[type][i]
    p.pfd.forEach(s => {
      const before = (s.bomRefs || []).length
      s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === type && r.itemId === item.id))
      if (s.bomRefs.length !== before) npiRelSavePFDStep(s)
    })
    p.bom.kits.forEach(k => { k.items = (k.items || []).filter(r => !(r.bomType === type && r.itemId === item.id)) })
    p.bom[type].splice(i, 1)
    npiRelDeleteBOMItem(item.id)
  },
  addKit() {
    const kit = { id: crypto.randomUUID(), name: '', items: [] }
    prog().bom.kits.push(kit)
    npiRelSaveBOMKit(kit)
    return kit
  },
  updKit(ki, f, v) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    p.bom.kits[ki][f] = v
    npiRelSaveBOMKit(p.bom.kits[ki])
  },
  delKit(ki) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    const id = p.bom.kits[ki].id
    p.bom.kits.splice(ki, 1)
    npiRelDeleteBOMKit(id)
  },
  updKitItem(ki, ri, f, v) {
    const p = prog()
    if (!p.bom.kits[ki] || !p.bom.kits[ki].items[ri]) return
    p.bom.kits[ki].items[ri][f] = v
    npiRelSaveKitItems(p.bom.kits[ki])
  },
  delKitItem(ki, ri) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    p.bom.kits[ki].items.splice(ri, 1)
    npiRelSaveKitItems(p.bom.kits[ki])
  },
  saveKitPick(kitIndex, selectedKeys) {
    const p = prog()
    const kit = p.bom.kits[kitIndex]
    if (!kit) return
    const existing = {}
    kit.items.forEach(r => { existing[r.bomType + '|' + r.itemId] = r.qty })
    kit.items = selectedKeys.map(key => {
      const [bt, id] = key.split('|')
      return { bomType: bt, itemId: id, qty: existing[key] || 1 }
    })
    npiRelSaveKitItems(kit)
  }
}

npi.data.tracker = {
  addAction() {
    const item = { id: crypto.randomUUID(), desc: '', owner: '', due: '', status: 'Open', priority: 'Medium', source: 'General', notes: '' }
    prog().actions.push(item)
    npiRelSaveAction(item)
    return item
  },
  updAction(i, f, v) {
    const p = prog()
    if (!p.actions[i]) return
    p.actions[i][f] = v
    npiRelSaveAction(p.actions[i])
  },
  delAction(i) {
    const p = prog()
    if (!p.actions[i]) return
    const id = p.actions[i].id
    p.actions.splice(i, 1)
    npiRelDeleteAction(id)
  },
  addRisk() {
    const item = { id: crypto.randomUUID(), desc: '', cat: 'Technical', owner: '', lik: 3, imp: 3, mit: '', status: 'Open' }
    prog().risks.push(item)
    npiRelSaveRisk(item)
    return item
  },
  updRisk(i, f, v, saveNow = true) {
    const p = prog()
    if (!p.risks[i]) return
    p.risks[i][f] = v
    if (saveNow) npiRelSaveRisk(p.risks[i])
  },
  delRisk(i) {
    const p = prog()
    if (!p.risks[i]) return
    const id = p.risks[i].id
    p.risks.splice(i, 1)
    npiRelDeleteRisk(id)
  }
}

npi.data.gate = {
  toggleCheck(gi, ii, v) {
    prog().gates[gi].checks[ii] = v
    npiRelSaveGate(gi)
  },
  updSig(gi, si, f, v) {
    prog().gates[gi].sigs[si][f] = v
    npiRelSaveGateSig(gi, si)
  },
  signOff(gi, si) {
    const sig = prog().gates[gi].sigs[si]
    sig.signed = true
    if (!sig.date) sig.date = new Date().toISOString().slice(0, 10)
    npiRelSaveGateSig(gi, si)
  },
  unsign(gi, si) {
    prog().gates[gi].sigs[si].signed = false
    npiRelSaveGateSig(gi, si)
  }
}

npi.data.timing = {
  togglePlan(id, wi) {
    const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return
    if (!row.planned || row.planned.length < GANTT_WEEKS) row.planned = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.planned || [])[i] || 0)
    row.planned[wi] = row.planned[wi] ? 0 : 1
    npiRelSaveGanttRow(row)
  },
  toggleAct(id, wi) {
    const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return
    if (!row.actual || row.actual.length < GANTT_WEEKS) row.actual = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.actual || [])[i] || 0)
    row.actual[wi] = row.actual[wi] ? 0 : 1
    npiRelSaveGanttRow(row)
  },
  addRow(section) {
    const p = prog(); if (!p.gantt) p.gantt = []
    const row = npi.data.ganttNewRow(section)
    p.gantt.push(row)
    npiRelSaveGanttRow(row)
    return row
  },
  updTask(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.task = val; npiRelSaveGanttRow(r) } },
  updSec(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.section = val; npiRelSaveGanttRow(r) } },
  updRole(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.role = val; npiRelSaveGanttRow(r) } },
  updNotes(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.notes = val; npiRelSaveGanttRow(r) } },
  delRow(id) { const p = prog(); p.gantt = p.gantt.filter(r => r.id !== id); npiRelDeleteGanttRow(id) },
  setStart(val) { const p = prog(); p.ganttStart = val; save() },
  clear() {
    const p = prog()
    const ids = p.gantt.map(r => r.id)
    p.gantt = []
    ids.forEach(id => npiRelDeleteGanttRow(id))
  }
}

npi.data.pfmea = {
  addMode(pfdId) {
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    const ef = { id: crypto.randomUUID(), effect: '', sev: 1, causes: [ca] }
    const mode = { id: crypto.randomUUID(), _type: 'mode', pfdId, mode: '', ctqIds: [], effects: [ef] }
    prog().pfmea.push(mode)
    npiRelSavePFMEAMode(mode)
    npiRelSavePFMEAEffect(mode.id, ef)
    npiRelSavePFMEACause(ef.id, ca)
  },
  updMode(mi, f, v) { prog().pfmea[mi][f] = v; npiRelSavePFMEAMode(prog().pfmea[mi]) },
  delMode(mi) {
    const p = prog()
    const mode = p.pfmea[mi]
    const fid = mode.id
    p.cp.forEach(r => { if (r.pfmeaId === fid) r.pfmeaId = '' })
    p.pfmea.splice(mi, 1)
    npiRelDeletePFMEAMode(mode)
  },
  addEffect(mi) {
    const mode = prog().pfmea[mi]
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    const ef = { id: crypto.randomUUID(), effect: '', sev: 1, causes: [ca] }
    mode.effects.push(ef)
    npiRelSavePFMEAEffect(mode.id, ef)
    npiRelSavePFMEACause(ef.id, ca)
  },
  updEffect(mi, ei, f, v, saveNow = true) {
    if (f === 'sev') v = npi.pfmea.pfNormalizeScore(v, false)
    const mode = prog().pfmea[mi]
    mode.effects[ei][f] = v
    if (saveNow) npiRelSavePFMEAEffect(mode.id, mode.effects[ei])
  },
  delEffect(mi, ei) {
    const mode = prog().pfmea[mi]
    const ef = mode.effects[ei]
    mode.effects.splice(ei, 1)
    npiRelDeletePFMEAEffect(ef)
  },
  addCause(mi, ei) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    ef.causes.push(ca)
    npiRelSavePFMEACause(ef.id, ca)
  },
  updCause(mi, ei, ci, f, v, saveNow = true) {
    if (f === 'occ' || f === 'det') v = npi.pfmea.pfNormalizeScore(v, false)
    const ef = prog().pfmea[mi].effects[ei]
    ef.causes[ci][f] = v
    if (saveNow) npiRelSavePFMEACause(ef.id, ef.causes[ci])
  },
  updCauseAction(mi, ei, ci, f, v, saveNow = true) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = ef.causes[ci]
    if (!ca.action) ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
    if (f === 'newOcc' || f === 'newDet') v = npi.pfmea.pfNormalizeScore(v, true)
    ca.action[f] = v
    if (saveNow) npiRelSavePFMEACause(ef.id, ca)
  },
  implementAction(mi, ei, ci) {
    const p = prog()
    const mode = p.pfmea[mi]; const ef = mode.effects[ei]; const ca = ef.causes[ci]
    const act = ca.action || {}
    if (!act.desc && !act.newOcc && !act.newDet) return { ok: false, error: 'missing-action' }
    const oldRpn = (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
    const newOcc = act.newOcc ? +act.newOcc : ca.occ
    const newDet = act.newDet ? +act.newDet : ca.det
    const newRpn = (ef.sev || 1) * newOcc * newDet
    if (!ca.history) ca.history = []
    const histEntry = {
      rpn: oldRpn,
      newRpn,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      desc: act.taken || act.desc || 'Action implemented',
      oldOcc: ca.occ, oldDet: ca.det,
      newOcc, newDet
    }
    ca.history.push(histEntry)
    ca.occ = newOcc
    ca.det = newDet
    ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
    npiRelSavePFMEACause(ef.id, ca)
    npiRelSavePFMEAHistory(ca.id, histEntry)
    return { ok: true }
  },
  delCause(mi, ei, ci) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = ef.causes[ci]
    ef.causes.splice(ci, 1)
    npiRelDeletePFMEACause(ca)
  }
}
