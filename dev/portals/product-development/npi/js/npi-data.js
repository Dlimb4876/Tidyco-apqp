// ═══════════════════════════════════
// npi-data.js — Data facade for NPI mutations and derived helpers
// Depends on: state.js, npi.js, npi-data-relational.js
// ═══════════════════════════════════

npi.data = npi.data || {}

npi.data.calcCauseRpn = function(sev, occ, det) {
  if (typeof calcRPN === 'function') return calcRPN({ sev, occ, det })
  return (sev || 1) * (occ || 1) * (det || 1)
}

npi.data.prog = function() { return prog() }

npi.data.pfdType = {
  isHeader(type) {
    return type === 'header' || type === 'group'
  },
  isExecutable(type) {
    return !npi.data.pfdType.isHeader(type)
  },
  isDecision(type) {
    return type === 'Decision'
  },
  isInspection(type) {
    return type === 'Inspection'
  },
  isTwoPath(type) {
    return type === 'Decision' || type === 'Inspection'
  },
  normalize(type) {
    const known = ['Process', 'Decision', 'Inspection', 'Rework', 'Transport']
    return known.includes(type) ? type : npi.data.pfdType.Process
  },
  Process: 'Process',
  Decision: 'Decision',
  Inspection: 'Inspection',
  Rework: 'Rework',
  Transport: 'Transport'
}

npi.data.normalizePfdLink = function(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

npi.data.firstExecutableStep = function(pfd) {
  return [...(pfd || [])]
    .filter(s => npi.data.pfdType.isExecutable(s.type))
    .sort((a, b) => a.stepNum - b.stepNum)[0] || null
}

npi.data.sortedPfd = function(pfd) {
  const rows = [...(pfd || [])]
  const executable = rows
    .filter(s => npi.data.pfdType.isExecutable(s.type))
    .sort((a, b) => a.stepNum - b.stepNum)

  const headersByBeforeAnchor = new Map()
  const headersByAnchor = new Map()
  const orphans = []

  rows.forEach((step, sourceIndex) => {
    if (!npi.data.pfdType.isHeader(step.type)) return
    const bucket = step.beforeStepId
      ? (headersByBeforeAnchor.get(step.beforeStepId) || [])
      : step.afterStepId
        ? (headersByAnchor.get(step.afterStepId) || [])
        : orphans
    bucket.push({ step, sourceIndex })
    if (step.beforeStepId && !headersByBeforeAnchor.has(step.beforeStepId)) headersByBeforeAnchor.set(step.beforeStepId, bucket)
    if (step.afterStepId && !headersByAnchor.has(step.afterStepId)) headersByAnchor.set(step.afterStepId, bucket)
  })

  const sorted = []
  executable.forEach(step => {
    const leading = headersByBeforeAnchor.get(step.id) || []
    leading
      .sort((a, b) => a.sourceIndex - b.sourceIndex)
      .forEach(entry => sorted.push(entry.step))

    sorted.push(step)
    const attached = headersByAnchor.get(step.id) || []
    attached
      .sort((a, b) => a.sourceIndex - b.sourceIndex)
      .forEach(entry => sorted.push(entry.step))
  })

  if (orphans.length > 0) {
    orphans
      .sort((a, b) => a.sourceIndex - b.sourceIndex)
      .forEach(entry => sorted.push(entry.step))
  }

  return sorted
}
npi.data.nextMainStepNum = function(pfd) {
  const tens = (pfd || [])
    .filter(s => npi.data.pfdType.isExecutable(s.type))
    .filter(s => Number.isFinite(s.stepNum) && s.stepNum % 10 === 0)
    .map(s => s.stepNum)
  return tens.length ? Math.max(...tens) + 10 : 10
}
npi.data.stepNumConflict = function(pfd, num, opts) {
  const includeHeaders = !!(opts && opts.includeHeaders)
  return (pfd || []).some(s => {
    if (!includeHeaders && !npi.data.pfdType.isExecutable(s.type)) return false
    return s.stepNum === num
  })
}
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
    Promise.resolve().then(() => npiRelSaveCTQ(item)).catch(err => console.error('[NPI] save CTQ failed:', err))
    npi.notify('render')
    return item
  },
  upd(i, f, v) {
    const p = prog()
    if (!p.ctq[i]) return
    p.ctq[i][f] = v
    Promise.resolve().then(() => npiRelSaveCTQ(p.ctq[i])).catch(err => console.error('[NPI] save CTQ failed:', err))
    if (f === 'customerAgreed') npi.notify('render')
  },
  del(i) {
    const p = prog()
    if (!p.ctq[i]) return
    const cid = p.ctq[i].id
    p.pfd.forEach(s => { s.ctqIds = (s.ctqIds || []).filter(x => x !== cid); Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err)) })
    p.pfmea.forEach(r => { r.ctqIds = (r.ctqIds || []).filter(x => x !== cid); Promise.resolve().then(() => npiRelSavePFMEAMode(r)).catch(err => console.error('[NPI] save PFMEA mode failed:', err)) })
    Promise.resolve().then(() => npiRelDeleteCTQ(cid)).catch(err => console.error('[NPI] delete CTQ failed:', err))
    p.ctq.splice(i, 1)
    npi.notify('render')
  }
}

npi.data.pfd = {
  ensureLeadingHeader(notify = false) {
    const p = prog()
    const firstExecutable = npi.data.firstExecutableStep(p.pfd)
    if (!firstExecutable) return null

    const existing = p.pfd.find(step =>
      npi.data.pfdType.isHeader(step.type) && step.beforeStepId === firstExecutable.id
    )
    if (existing) return existing

    const step = {
      id: crypto.randomUUID(),
      stepNum: null,
      beforeStepId: firstExecutable.id,
      type: 'header',
      isDefault: true,
      op: '',
      detail: '',
      ctqIds: [],
      bomRefs: [],
      docRefs: [],
      pfd_type: null,
      nextStepId: null,
      nextStepId_yes: null,
      nextStepId_no: null
    }
    p.pfd.push(step)
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    if (notify) npi.notify('render')
    return step
  },
  addMainStep() {
    const p = prog()
    const hadExecutable = p.pfd.some(s => npi.data.pfdType.isExecutable(s.type))
    const step = { id: crypto.randomUUID(), stepNum: npi.data.nextMainStepNum(p.pfd), type: 'step', op: '', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: npi.data.pfdType.Process, nextStepId: null, nextStepId_yes: null, nextStepId_no: null }
    p.pfd.push(step)
    if (!hadExecutable) npi.data.pfd.ensureLeadingHeader()
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
    return step
  },
  addSectionHeaderAfter(afterStepId) {
    const p = prog()
    const anchor = p.pfd.find(s => s.id === afterStepId && npi.data.pfdType.isExecutable(s.type))
    if (!anchor) return { ok: false, error: 'Choose a process step first' }

    const step = {
      id: crypto.randomUUID(),
      stepNum: null,
      afterStepId: anchor.id,
      type: 'header',
      op: '',
      detail: '',
      ctqIds: [],
      bomRefs: [],
      docRefs: [],
      pfd_type: null,
      nextStepId: null,
      nextStepId_yes: null,
      nextStepId_no: null
    }
    p.pfd.push(step)
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
    return { ok: true, step }
  },
  insertStep(num, type) {
    const p = prog()
    const nextType = type || 'step'
    const isHeader = npi.data.pfdType.isHeader(nextType)

    let nextNum = Number(num)
    if (!Number.isFinite(nextNum) || nextNum < 1) {
      if (!isHeader) return { ok: false, error: 'Enter valid number' }
      nextNum = npi.data.nextMainStepNum(p.pfd)
    }

    if (npi.data.stepNumConflict(p.pfd, nextNum, { includeHeaders: false })) {
      return { ok: false, error: `Step ${nextNum} exists` }
    }

    const step = {
      id: crypto.randomUUID(),
      stepNum: nextNum,
      type: isHeader ? 'header' : 'step',
      op: '',
      detail: '',
      ctqIds: [],
      bomRefs: [],
      docRefs: [],
      pfd_type: npi.data.pfdType.Process,
      nextStepId: null,
      nextStepId_yes: null,
      nextStepId_no: null
    }
    p.pfd.push(step)
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
    return { ok: true, step: step }
  },
  del(sid) {
    const p = prog()
    const i = p.pfd.findIndex(s => s.id === sid)
    if (i < 0) return
    const step = p.pfd[i]
    collapsedGroups.delete(sid)
    if (npi.data.pfdType.isExecutable(step.type)) {
      const remainingExecutable = p.pfd
        .filter(s => s.id !== sid && npi.data.pfdType.isExecutable(s.type))
        .sort((a, b) => a.stepNum - b.stepNum)

      p.pfd
        .filter(s => npi.data.pfdType.isHeader(s.type) && s.beforeStepId === sid)
        .forEach(header => {
          if (remainingExecutable.length > 0) {
            header.beforeStepId = remainingExecutable[0].id
            Promise.resolve().then(() => npiRelSavePFDStep(header)).catch(err => console.error('[NPI] save PFD step failed:', err))
          } else {
            collapsedGroups.delete(header.id)
            p.pfd = p.pfd.filter(item => item.id !== header.id)
            Promise.resolve().then(() => npiRelDeletePFDStep(header.id)).catch(err => console.error('[NPI] delete PFD step failed:', err))
          }
        })
    }
    p.pfmea.forEach(r => { if (r.pfdId === sid) { r.pfdId = ''; Promise.resolve().then(() => npiRelSavePFMEAMode(r)).catch(err => console.error('[NPI] save PFMEA mode failed:', err)) } })
    p.pfd = p.pfd.filter(item => item.id !== sid)
    Promise.resolve().then(() => npiRelDeletePFDStep(sid)).catch(err => console.error('[NPI] delete PFD step failed:', err))
    npi.notify('render')
  },
  upd(sid, f, v) {
    const s = prog().pfd.find(x => x.id === sid)
    if (!s) return

    if (f === 'pfd_type') {
      s.pfd_type = npi.data.pfdType.normalize(v)
      if (npi.data.pfdType.isTwoPath(s.pfd_type)) s.nextStepId = null
      else {
        s.nextStepId_yes = null
        s.nextStepId_no = null
      }
    } else if (f === 'nextStepId' || f === 'nextStepId_yes' || f === 'nextStepId_no') {
      s[f] = npi.data.normalizePfdLink(v)
    } else {
      s[f] = v
    }

    Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
  },
  toggleGroup(collapsedGroups, key) {
    if (collapsedGroups.has(key)) collapsedGroups.delete(key)
    else collapsedGroups.add(key)
    npi.notify('render')
  },
  delBomRef(sid, bt, iid) {
    const s = prog().pfd.find(x => x.id === sid)
    if (!s) return
    s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === bt && r.itemId === iid))
    Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
  },
  saveCtqPick(stepIndex, selectedIds) {
    const step = prog().pfd[stepIndex]
    if (!step) return
    step.ctqIds = [...selectedIds]
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
  },
  saveBomPick(stepId, selectedKeys) {
    const s = prog().pfd.find(x => x.id === stepId)
    if (!s) return
    s.bomRefs = selectedKeys.map(k => {
      const [bt, id] = k.split('|')
      return { bomType: bt, itemId: id }
    })
    Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
  },
  saveDocPick(stepIndex, selectedIds) {
    const step = prog().pfd[stepIndex]
    if (!step) return
    step.docRefs = [...selectedIds]
    Promise.resolve().then(() => npiRelSavePFDStep(step)).catch(err => console.error('[NPI] save PFD step failed:', err))
    npi.notify('render')
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
          Promise.resolve().then(() => npiRelSaveCP(item)).catch(err => console.error('[NPI] save CP failed:', err))
          n++
        })
      })
    })
    npi.notify('render')
    return n
  },
  add() {
    const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }
    prog().cp.push(item)
    Promise.resolve().then(() => npiRelSaveCP(item)).catch(err => console.error('[NPI] save CP failed:', err))
    npi.notify('render')
    return item
  },
  upd(i, f, v) {
    const p = prog()
    if (!p.cp[i]) return
    p.cp[i][f] = v
    Promise.resolve().then(() => npiRelSaveCP(p.cp[i])).catch(err => console.error('[NPI] save CP failed:', err))
  },
  del(i) {
    const p = prog()
    if (!p.cp[i]) return
    const id = p.cp[i].id
    p.cp.splice(i, 1)
    Promise.resolve().then(() => npiRelDeleteCP(id)).catch(err => console.error('[NPI] delete CP failed:', err))
    npi.notify('render')
  }
}

npi.data.bom = {
  addRow(type) {
    const p = prog()
    if (!p.bom[type]) return null
    const base = { id: crypto.randomUUID(), desc: '', notes: '', isStd: false, isAaw: false, isRepair: false }
    let item = base
    if (type === 'parts') item = { ...base, pn: '', supplierPN: '', qty: 1, unit: 'ea', abcClass: null }
    else if (type === 'tools') item = { ...base, toolId: '', spec: '' }
    else if (type === 'equip') item = { ...base, equipId: '', location: '' }
    else if (type === 'mat' || type === 'cons') item = { ...base, pn: '', unit: '', qtyPerUnit: 0 }
    p.bom[type].push(item)
    Promise.resolve().then(() => npiRelSaveBOMItem(type, item)).catch(err => console.error('[NPI] save BOM item failed:', err))
    npi.notify('render')
    return item
  },
  updRow(type, i, f, v) {
    const p = prog()
    if (!p.bom[type] || !p.bom[type][i]) return
    p.bom[type][i][f] = v
    Promise.resolve().then(() => npiRelSaveBOMItem(type, p.bom[type][i])).catch(err => console.error('[NPI] save BOM item failed:', err))
  },
  delRow(type, i) {
    const p = prog()
    if (!p.bom[type] || !p.bom[type][i]) return
    const item = p.bom[type][i]
    p.pfd.forEach(s => {
      const before = (s.bomRefs || []).length
      s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === type && r.itemId === item.id))
      if (s.bomRefs.length !== before) Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
    })
    p.bom.kits.forEach(k => { k.items = (k.items || []).filter(r => !(r.bomType === type && r.itemId === item.id)) })
    p.bom[type].splice(i, 1)
    Promise.resolve().then(() => npiRelDeleteBOMItem(item.id)).catch(err => console.error('[NPI] delete BOM item failed:', err))
    npi.notify('render')
  },
  addKit() {
    const kit = { id: crypto.randomUUID(), name: '', items: [] }
    prog().bom.kits.push(kit)
    Promise.resolve().then(() => npiRelSaveBOMKit(kit)).catch(err => console.error('[NPI] save BOM kit failed:', err))
    npi.notify('render')
    return kit
  },
  updKit(ki, f, v) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    p.bom.kits[ki][f] = v
    Promise.resolve().then(() => npiRelSaveBOMKit(p.bom.kits[ki])).catch(err => console.error('[NPI] save BOM kit failed:', err))
  },
  delKit(ki) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    const id = p.bom.kits[ki].id
    p.bom.kits.splice(ki, 1)
    Promise.resolve().then(() => npiRelDeleteBOMKit(id)).catch(err => console.error('[NPI] delete BOM kit failed:', err))
    npi.notify('render')
  },
  updKitItem(ki, ri, f, v) {
    const p = prog()
    if (!p.bom.kits[ki] || !p.bom.kits[ki].items[ri]) return
    p.bom.kits[ki].items[ri][f] = v
    Promise.resolve().then(() => npiRelSaveKitItems(p.bom.kits[ki])).catch(err => console.error('[NPI] save kit items failed:', err))
  },
  delKitItem(ki, ri) {
    const p = prog()
    if (!p.bom.kits[ki]) return
    p.bom.kits[ki].items.splice(ri, 1)
    Promise.resolve().then(() => npiRelSaveKitItems(p.bom.kits[ki])).catch(err => console.error('[NPI] save kit items failed:', err))
    npi.notify('render')
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
    Promise.resolve().then(() => npiRelSaveKitItems(kit)).catch(err => console.error('[NPI] save kit items failed:', err))
    npi.notify('render')
  }
}

npi.data.tracker = {
  addAction() {
    const item = { id: crypto.randomUUID(), desc: '', owner: '', due: '', status: 'Open', priority: 'Medium', source: 'General', notes: '', subAsm: '' }
    prog().actions.push(item)
    Promise.resolve().then(() => npiRelSaveAction(item)).catch(err => console.error('[NPI] save action failed:', err))
    npi.notify('render')
    return item
  },
  updAction(i, f, v) {
    const p = prog()
    if (!p.actions[i]) return
    p.actions[i][f] = v
    Promise.resolve().then(() => npiRelSaveAction(p.actions[i])).catch(err => console.error('[NPI] save action failed:', err))
    if (f === 'status' || f === 'due') npi.notify('render')
  },
  delAction(i) {
    const p = prog()
    if (!p.actions[i]) return
    const id = p.actions[i].id
    p.actions.splice(i, 1)
    Promise.resolve().then(() => npiRelDeleteAction(id)).catch(err => console.error('[NPI] delete action failed:', err))
    npi.notify('render')
  },
  addRisk() {
    const item = { id: crypto.randomUUID(), desc: '', cat: 'Technical', owner: '', lik: 3, imp: 3, mit: '', status: 'Open', subAsm: '' }
    prog().risks.push(item)
    Promise.resolve().then(() => npiRelSaveRisk(item)).catch(err => console.error('[NPI] save risk failed:', err))
    npi.notify('render')
    return item
  },
  updRisk(i, f, v, saveNow = true) {
    const p = prog()
    if (!p.risks[i]) return
    p.risks[i][f] = v
    if (saveNow) Promise.resolve().then(() => npiRelSaveRisk(p.risks[i])).catch(err => console.error('[NPI] save risk failed:', err))
    if (f === 'status') npi.notify('render')
  },
  delRisk(i) {
    const p = prog()
    if (!p.risks[i]) return
    const id = p.risks[i].id
    p.risks.splice(i, 1)
    Promise.resolve().then(() => npiRelDeleteRisk(id)).catch(err => console.error('[NPI] delete risk failed:', err))
    npi.notify('render')
  }
}

npi.data.gate = {
  rolePermissionKey(role) {
    const roleLabel = String(role || '').trim().toLowerCase()
    const ROLE_PERMISSION_MAP = {
      'me manager': 'feature_npi_signoff_me_manager',
      'operations director': 'feature_npi_signoff_operations_director',
      'sales director': 'feature_npi_signoff_sales_director'
    }
    return ROLE_PERMISSION_MAP[roleLabel] || ''
  },
  canCurrentUserSignRole(role) {
    const roleLabel = String(role || '').trim().toLowerCase()
    const ROLE_KEY_MAP = {
      'me manager':          'me_manager',
      'operations director': 'operations_director',
      'sales director':      'sales_director',
    }
    const roleKey = ROLE_KEY_MAP[roleLabel]

    // Check individual assignment config first (if loaded and has entries for this role)
    if (roleKey && typeof npiGateSignoffConfig !== 'undefined' && npiGateSignoffConfig !== null) {
      const assigned = npiGateSignoffConfig[roleKey] || []
      if (assigned.length > 0) {
        if (!currentUser) return false
        const myId = currentUser.id
        const myEmail = (currentUser.email || '').toLowerCase()
        return assigned.some(u =>
          (myId && u.user_id && u.user_id === myId) ||
          (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
        )
      }
    }

    // Fall back to team permission check
    const permissionKey = npi.data.gate.rolePermissionKey(role)
    if (!permissionKey) return true
    if (typeof hasPermission === 'function') return hasPermission(permissionKey)
    return (typeof currentUserRole !== 'undefined') && (currentUserRole === 'admin' || currentUserRole === 'editor')
  },
  canCurrentUserEditSig(gi, si) {
    const p = prog()
    const gate = p && p.gates ? p.gates[gi] : null
    const sig = gate && gate.sigs ? gate.sigs[si] : null
    if (!sig) return false
    return npi.data.gate.canCurrentUserSignRole(sig.role)
  },
  unauthorizedMessage(role) {
    const roleLabel = String(role || 'this role').trim()
    return `You are not authorised to sign off as ${roleLabel}.`
  },
  toggleCheck(gi, ii, v) {
    prog().gates[gi].checks[ii] = v
    Promise.resolve().then(() => npiRelSaveGate(gi)).catch(err => console.error('[NPI] save gate failed:', err))
    npi.notify('render')
  },
  updSig(gi, si, f, v) {
    const p = prog()
    const sig = p && p.gates && p.gates[gi] && p.gates[gi].sigs ? p.gates[gi].sigs[si] : null
    if (!sig) return false
    if (!npi.data.gate.canCurrentUserEditSig(gi, si)) {
      if (typeof showToast === 'function') showToast(npi.data.gate.unauthorizedMessage(sig.role), 'error')
      return false
    }
    sig[f] = v
    Promise.resolve().then(() => npiRelSaveGateSig(gi, si)).catch(err => console.error('[NPI] save gate sig failed:', err))
    return true
  },
  signOff(gi, si) {
    const p = prog()
    const sig = p && p.gates && p.gates[gi] && p.gates[gi].sigs ? p.gates[gi].sigs[si] : null
    if (!sig) return false
    if (!npi.data.gate.canCurrentUserEditSig(gi, si)) {
      if (typeof showToast === 'function') showToast(npi.data.gate.unauthorizedMessage(sig.role), 'error')
      return false
    }
    sig.signed = true
    if (!sig.date) sig.date = new Date().toISOString().slice(0, 10)
    Promise.resolve().then(() => npiRelSaveGateSig(gi, si)).catch(err => console.error('[NPI] save gate sig failed:', err))
    npi.notify('render')
    return true
  },
  unsign(gi, si) {
    const p = prog()
    const sig = p && p.gates && p.gates[gi] && p.gates[gi].sigs ? p.gates[gi].sigs[si] : null
    if (!sig) return false
    if (!npi.data.gate.canCurrentUserEditSig(gi, si)) {
      if (typeof showToast === 'function') showToast(npi.data.gate.unauthorizedMessage(sig.role), 'error')
      return false
    }
    sig.signed = false
    Promise.resolve().then(() => npiRelSaveGateSig(gi, si)).catch(err => console.error('[NPI] save gate sig failed:', err))
    npi.notify('render')
    return true
  }
}

npi.data.timing = {
  togglePlan(id, wi) {
    const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return
    if (!row.planned || row.planned.length < GANTT_WEEKS) row.planned = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.planned || [])[i] || 0)
    row.planned[wi] = row.planned[wi] ? 0 : 1
    Promise.resolve().then(() => npiRelSaveGanttRow(row)).catch(err => console.error('[NPI] save gantt row failed:', err))
    npi.notify('render')
  },
  toggleAct(id, wi) {
    const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return
    if (!row.actual || row.actual.length < GANTT_WEEKS) row.actual = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.actual || [])[i] || 0)
    row.actual[wi] = row.actual[wi] ? 0 : 1
    Promise.resolve().then(() => npiRelSaveGanttRow(row)).catch(err => console.error('[NPI] save gantt row failed:', err))
    npi.notify('render')
  },
  addRow(section) {
    const p = prog(); if (!p.gantt) p.gantt = []
    const row = npi.data.ganttNewRow(section)
    p.gantt.push(row)
    Promise.resolve().then(() => npiRelSaveGanttRow(row)).catch(err => console.error('[NPI] save gantt row failed:', err))
    npi.notify('render')
    return row
  },
  updTask(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.task = val; Promise.resolve().then(() => npiRelSaveGanttRow(r)).catch(err => console.error('[NPI] save gantt row failed:', err)) } },
  updSec(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.section = val; Promise.resolve().then(() => npiRelSaveGanttRow(r)).catch(err => console.error('[NPI] save gantt row failed:', err)); npi.notify('render') } },
  updRole(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.role = val; Promise.resolve().then(() => npiRelSaveGanttRow(r)).catch(err => console.error('[NPI] save gantt row failed:', err)); npi.notify('render') } },
  updNotes(id, val) { const r = prog().gantt.find(x => x.id === id); if (r) { r.notes = val; Promise.resolve().then(() => npiRelSaveGanttRow(r)).catch(err => console.error('[NPI] save gantt row failed:', err)) } },
  delRow(id) { const p = prog(); p.gantt = p.gantt.filter(r => r.id !== id); Promise.resolve().then(() => npiRelDeleteGanttRow(id)).catch(err => console.error('[NPI] delete gantt row failed:', err)); npi.notify('render') },
  setStart(val) { const p = prog(); p.ganttStart = val; save(); npi.notify('render') },
  moveRow(id, dir) {
    const p = prog()
    const row = p.gantt.find(r => r.id === id); if (!row) return
    const secRows    = p.gantt.filter(r => r.section === row.section)
    const secIndices = secRows.map(r => p.gantt.indexOf(r))
    const pos        = secRows.findIndex(r => r.id === id)
    const target     = pos + dir
    if (target < 0 || target >= secRows.length) return
    const idxA = secIndices[pos]; const idxB = secIndices[target]
    ;[p.gantt[idxA], p.gantt[idxB]] = [p.gantt[idxB], p.gantt[idxA]]
    save(); npi.notify('render')
  },
  addMilestone(week, label) {
    const p = prog()
    if (!p.ganttMilestones) p.ganttMilestones = []
    p.ganttMilestones = p.ganttMilestones.filter(m => m.week !== week)
    p.ganttMilestones.push({ id: crypto.randomUUID(), week, label })
    save(); npi.notify('render')
  },
  delMilestone(id) {
    const p = prog()
    if (!p.ganttMilestones) return
    p.ganttMilestones = p.ganttMilestones.filter(m => m.id !== id)
    save(); npi.notify('render')
  },
  clear() {
    const p = prog()
    const ids = p.gantt.map(r => r.id)
    p.gantt = []
    ids.forEach(id => Promise.resolve().then(() => npiRelDeleteGanttRow(id)).catch(err => console.error('[NPI] delete gantt row failed:', err)))
    npi.notify('render')
  }
}

npi.data.pfmea = {
  addMode(pfdId) {
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    const ef = { id: crypto.randomUUID(), effect: '', sev: 1, specialChar: null, causes: [ca] }
    const mode = { id: crypto.randomUUID(), _type: 'mode', pfdId, function: '', mode: '', ctqIds: [], effects: [ef] }
    prog().pfmea.push(mode)
    Promise.resolve().then(async () => {
      await npiRelSavePFMEAMode(mode)
      await npiRelSavePFMEAEffect(mode.id, ef)
      await npiRelSavePFMEACause(ef.id, ca)
    }).catch(err => console.error('[NPI] save PFMEA mode failed:', err))
    npi.notify('render')
  },
  updMode(mi, f, v) { prog().pfmea[mi][f] = v; Promise.resolve().then(() => npiRelSavePFMEAMode(prog().pfmea[mi])).catch(err => console.error('[NPI] save PFMEA mode failed:', err)) },
  delMode(mi) {
    const p = prog()
    const mode = p.pfmea[mi]
    const fid = mode.id
    p.cp.forEach(r => { if (r.pfmeaId === fid) r.pfmeaId = '' })
    p.pfmea.splice(mi, 1)
    Promise.resolve().then(() => npiRelDeletePFMEAMode(mode)).catch(err => console.error('[NPI] delete PFMEA mode failed:', err))
    npi.notify('render')
  },
  addEffect(mi) {
    const mode = prog().pfmea[mi]
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    const ef = { id: crypto.randomUUID(), effect: '', sev: 1, specialChar: null, causes: [ca] }
    mode.effects.push(ef)
    Promise.resolve().then(async () => {
      await npiRelSavePFMEAEffect(mode.id, ef)
      await npiRelSavePFMEACause(ef.id, ca)
    }).catch(err => console.error('[NPI] save PFMEA effect failed:', err))
    npi.notify('render')
  },
  updEffect(mi, ei, f, v, saveNow = true) {
    if (f === 'sev') v = npi.pfmea.pfNormalizeScore(v, false)
    const mode = prog().pfmea[mi]
    mode.effects[ei][f] = v
    if (saveNow) Promise.resolve().then(() => npiRelSavePFMEAEffect(mode.id, mode.effects[ei])).catch(err => console.error('[NPI] save PFMEA effect failed:', err))
  },
  delEffect(mi, ei) {
    const mode = prog().pfmea[mi]
    const ef = mode.effects[ei]
    mode.effects.splice(ei, 1)
    Promise.resolve().then(() => npiRelDeletePFMEAEffect(ef)).catch(err => console.error('[NPI] delete PFMEA effect failed:', err))
    npi.notify('render')
  },
  addCause(mi, ei) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = { id: crypto.randomUUID(), cause: '', occ: 1, det: 1, prevent: '', detect: '', action: { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }, history: [] }
    ef.causes.push(ca)
    Promise.resolve().then(() => npiRelSavePFMEACause(ef.id, ca)).catch(err => console.error('[NPI] save PFMEA cause failed:', err))
    npi.notify('render')
  },
  updCause(mi, ei, ci, f, v, saveNow = true) {
    if (f === 'occ' || f === 'det') v = npi.pfmea.pfNormalizeScore(v, false)
    const ef = prog().pfmea[mi].effects[ei]
    ef.causes[ci][f] = v
    if (saveNow) Promise.resolve().then(() => npiRelSavePFMEACause(ef.id, ef.causes[ci])).catch(err => console.error('[NPI] save PFMEA cause failed:', err))
  },
  updCauseAction(mi, ei, ci, f, v, saveNow = true) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = ef.causes[ci]
    if (!ca.action) ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
    if (f === 'newOcc' || f === 'newDet') v = npi.pfmea.pfNormalizeScore(v, true)
    ca.action[f] = v
    if (saveNow) Promise.resolve().then(() => npiRelSavePFMEACause(ef.id, ca)).catch(err => console.error('[NPI] save PFMEA cause failed:', err))
  },
  implementAction(mi, ei, ci) {
    const p = prog()
    const mode = p.pfmea[mi]; const ef = mode.effects[ei]; const ca = ef.causes[ci]
    const act = ca.action || {}
    if (!act.desc && !act.newOcc && !act.newDet) return { ok: false, error: 'missing-action' }
    const oldRpn = npi.data.calcCauseRpn(ef.sev, ca.occ, ca.det)
    const newOcc = act.newOcc ? +act.newOcc : ca.occ
    const newDet = act.newDet ? +act.newDet : ca.det
    const newRpn = npi.data.calcCauseRpn(ef.sev, newOcc, newDet)
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
    Promise.resolve().then(() => { npiRelSavePFMEACause(ef.id, ca); npiRelSavePFMEAHistory(ca.id, histEntry) }).catch(err => console.error('[NPI] save PFMEA history failed:', err))
    npi.notify('render')
    return { ok: true }
  },
  delCause(mi, ei, ci) {
    const ef = prog().pfmea[mi].effects[ei]
    const ca = ef.causes[ci]
    ef.causes.splice(ci, 1)
    Promise.resolve().then(() => npiRelDeletePFMEACause(ca)).catch(err => console.error('[NPI] delete PFMEA cause failed:', err))
    npi.notify('render')
  }
}

npi.data.docs = {
  add() {
    const item = { id: crypto.randomUUID(), docNumber: '', title: '', type: 'Other', issue: '', owner: '', status: 'Draft', notes: '' }
    const p = prog()
    if (!p.docs) p.docs = []
    p.docs.push(item)
    Promise.resolve().then(() => npiRelSaveDoc(item)).catch(err => console.error('[NPI] save doc failed:', err))
    npi.notify('render')
    return item
  },
  upd(i, f, v) {
    const p = prog()
    if (!p.docs || !p.docs[i]) return
    p.docs[i][f] = v
    Promise.resolve().then(() => npiRelSaveDoc(p.docs[i])).catch(err => console.error('[NPI] save doc failed:', err))
  },
  del(i) {
    const p = prog()
    if (!p.docs || !p.docs[i]) return
    const id = p.docs[i].id
    p.docs.splice(i, 1)
    Promise.resolve().then(() => npiRelDeleteDoc(id)).catch(err => console.error('[NPI] delete doc failed:', err))
    npi.notify('render')
  }
}
