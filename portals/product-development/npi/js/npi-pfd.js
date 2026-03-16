// ═══════════════════════════════════
// npi-pfd.js — PFD tab rendering and modal handlers
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.pfd = npi.pfd || {}

function isHeaderStep(step) {
  return npi.data.pfdType.isHeader(step.type)
}

function isExecutableStep(step) {
  return npi.data.pfdType.isExecutable(step.type)
}

function getSectionStepCount(sorted, headerIndex) {
  let count = 0
  for (let i = headerIndex + 1; i < sorted.length; i++) {
    if (isHeaderStep(sorted[i])) break
    if (isExecutableStep(sorted[i])) count++
  }
  return count
}

function stepRowHTML(s, oi, p) {
  const ctqBadges = (s.ctqIds || []).map(cid => {
    const ci = p.ctq.findIndex(c => c.id === cid)
    return ci >= 0 ? `<span class="ctq-pick-item" data-action="pfd-open-ctq-pick" data-idx="${oi}">C${ci + 1}</span>` : ''
  }).join('')
  const pfCnt = p.pfmea.filter(r => r.pfdId === s.id).length
  const pills = (s.bomRefs || []).map(ref => {
    const bt = p.bom[ref.bomType]; if (!bt) return ''
    const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
    const t = BOM_TYPES[ref.bomType]
    const name = item.desc || (item.pn || item.toolId || item.equipId || '?')
    return `<span class="res-pill ${t.pc}" data-action="pfd-del-bom-ref" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${ref.itemId}" title="Click to remove">${t.icon} ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${item.isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}</span>`
  }).join('')
  const docBadges = (s.docRefs || []).map(docId => {
    const doc = (p.docs || []).find(d => d.id === docId)
    return doc ? `<span class="ctq-pick-item" data-action="pfd-del-doc-ref" data-step-id="${s.id}" data-doc-id="${docId}" title="Click to remove">${esc(doc.docNumber || 'Doc')} ${esc(doc.title || '')}</span>` : ''
  }).join('')

  return `<div class="step-row" id="pfd-row-${s.id}"><div class="step-main-row"><div class="step-num-cell"><div class="step-num-badge">${s.stepNum}</div><div style="display:flex;flex-direction:column;gap:2px"><button class="mini-btn" data-action="pfd-open-insert" data-after="${oi}">＋</button><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button></div></div><div class="step-body"><div class="step-fields"><div class="step-field f-op"><input class="cell-edit" value="${esc(s.op)}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Operation" style="font-weight:600"></div><div class="step-field f-detail"><textarea class="cell-edit" rows="2" data-action="pfd-upd" data-id="${s.id}" data-field="detail" placeholder="Method / notes…">${esc(s.detail)}</textarea></div><div class="step-field f-ctq"><div class="ctq-pick">${ctqBadges}${p.ctq.length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-ctq-pick" data-idx="${oi}">＋ CTQ</span>` : ''}</div></div><div class="step-field f-doc"><div class="ctq-pick">${docBadges}${(p.docs||[]).length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-doc-pick" data-idx="${oi}">＋ Doc</span>` : ''}</div></div><div class="step-field f-pfmea">${pfCnt > 0 ? `<span class="tag tag-amber">${pfCnt} FMEA</span>` : '<span style="font-size:11px;color:var(--muted)">—</span>'}</div></div></div></div><div class="step-resources">${pills}<button class="res-add-btn" data-action="pfd-open-bom-pick" data-id="${s.id}">＋ Resource</button></div></div>`
}

function headerRowHTML(s, oi, meta) {
  const title = esc(s.op || 'Section Header')
  const collapsed = !!(meta && meta.collapsed)
  const stepCount = meta && Number.isFinite(meta.stepCount) ? meta.stepCount : 0
  const summary = stepCount === 1 ? '1 step' : `${stepCount} steps`
  const actions = s.isDefault
    ? ''
    : `<div class="pfd-header-actions"><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button></div>`
  return `<div class="step-row pfd-header-row" id="pfd-row-${s.id}"><div class="pfd-header-main"><button class="pfd-header-toggle" data-action="pfd-toggle-group" data-key="${s.id}" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Expand section' : 'Collapse section'}"><span class="pfd-header-toggle-icon">${collapsed ? '▸' : '▾'}</span></button><div class="pfd-header-title"><span class="pfd-header-chip">SECTION</span><input class="cell-edit pfd-header-input" value="${title}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Section title (e.g. STRIP DOWN UNIT)"></div><div class="pfd-header-meta">${collapsed ? `Hidden: ${summary}` : summary}</div>${actions}</div></div>`
}

function getInsertBounds(p, afterOi) {
  if (afterOi == null) return null
  const anchor = p.pfd[afterOi]
  if (!anchor) return null

  const base = Number(anchor.stepNum) || 0
  const nextExecutable = npi.data.sortedPfd(p.pfd)
    .filter(isExecutableStep)
    .find(s => Number(s.stepNum) > base)

  return {
    base,
    ceil: nextExecutable ? Number(nextExecutable.stepNum) : base + 10
  }
}

npi.pfd.render = function() {
  const p = prog()
  npi.data.pfd.ensureLeadingHeader()
  const sorted = npi.data.sortedPfd(p.pfd)
  const executable = sorted.filter(isExecutableStep)
  const ribbon = executable.map((s, i, arr) =>
    `<div class="flow-node" data-action="pfd-scroll" data-id="${s.id}"><div class="flow-node-num">${s.stepNum}</div><div class="flow-node-name">${esc(s.op) || '—'}</div></div>${i < arr.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
  ).join('')

  let body = ''
  let activeSectionId = null
  let hideSectionRows = false

  sorted.forEach((s, sortedIndex) => {
    const oi = p.pfd.indexOf(s)
    if (isHeaderStep(s)) {
      activeSectionId = s.id
      hideSectionRows = collapsedGroups.has(s.id)
      body += headerRowHTML(s, oi, {
        collapsed: hideSectionRows,
        stepCount: getSectionStepCount(sorted, sortedIndex)
      })
      return
    }

    if (!hideSectionRows) {
      body += stepRowHTML(s, oi, p)
      body += `<div class="insert-row"><button class="insert-btn" data-action="pfd-open-insert" data-after="${oi}">＋ step after</button><button class="insert-btn" data-action="pfd-add-header-after" data-after-id="${s.id}">＋ section after</button></div>`
    }
  })

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Steps numbered in 10s. Insert between steps. Numbers are permanent references in PFMEA and Control Plan.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-pfd')" title="User Guide">❓ Guide</button><button class="btn btn-primary btn-sm" data-action="pfd-add-main">＋ Add Step</button></div></div>
  ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
  <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${executable.length} executable steps</span></div>
  ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div>${body}</div>`}
  <button class="add-row" data-action="pfd-add-main">＋ Add Process Step</button></div>
  ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" data-action="npi-set-apqp" data-tab="pfmea" style="color:var(--blue)">PFMEA →</a></div>` : ''}`
}

npi.pfd.addMainStep = function() { npi.data.pfd.addMainStep() }

npi.pfd.addHeaderAfter = function(afterStepId) {
  const result = npi.data.pfd.addSectionHeaderAfter(afterStepId)
  if (!result.ok) showToast(result.error, 'error')
}

npi.pfd.openInsert = function(afterOi) {
  insertOriginIdx = afterOi
  const p = prog()
  const ni = document.getElementById('insertNum')
  const hi = document.getElementById('insertNumHint')

  if (afterOi != null) {
    const bounds = getInsertBounds(p, afterOi)
    const base = bounds ? bounds.base : 0
    const ceil = bounds ? bounds.ceil : 10
    ni.value = base + 1 <= ceil - 1 ? base + 1 : ''
    hi.textContent = `Available: ${base + 1}–${ceil - 1}`
  } else {
    const n = npi.data.nextMainStepNum(p.pfd)
    ni.value = n
    hi.textContent = `Next: ${n}`
  }
  showModal('modalInsert')
}

npi.pfd.confirmInsert = function() {
  const rawNum = document.getElementById('insertNum').value
  const num = rawNum === '' ? null : parseInt(rawNum, 10)
  const result = npi.data.pfd.insertStep(num, 'step')
  if (!result.ok) return showToast(result.error, 'error')
  closeModal('modalInsert')
}

npi.pfd.del = function(sid) { npi.data.pfd.del(sid) }
npi.pfd.upd = function(sid, f, v) { npi.data.pfd.upd(sid, f, v) }
npi.pfd.scrollTo = function(sid) { const el = document.getElementById('pfd-row-' + sid); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
npi.pfd.toggleGroup = function(key) { npi.data.pfd.toggleGroup(collapsedGroups, key) }
npi.pfd.delBomRef = function(sid, bt, iid) { npi.data.pfd.delBomRef(sid, bt, iid) }

npi.pfd.openCtqPick = function(oi) {
  const p = prog(); ctqPickTarget = oi; ctqPickSelected = [...(p.pfd[oi].ctqIds || [])]
  document.getElementById('ctqPickList').innerHTML = p.ctq.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No CTQs defined.</p>'
    : p.ctq.map((c, i) => `<label class="ctq-pick-label"><input type="checkbox" ${ctqPickSelected.includes(c.id) ? 'checked' : ''} data-action="pfd-toggle-ctq-pick" data-id="${c.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag tag-ctq">C${i + 1}</span><span style="font-size:12px;font-weight:600">${esc(c.req || 'Unnamed')}</span></div><div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;margin-top:1px">${esc(c.spec)}</div></div></label>`).join('')
  showModal('modalCtqPick')
}

npi.pfd.toggleCtqPick = function(cid, checked) {
  if (checked) {
    if (!ctqPickSelected.includes(cid)) ctqPickSelected.push(cid)
  } else {
    ctqPickSelected = ctqPickSelected.filter(x => x !== cid)
  }
}

npi.pfd.saveCtqPick = function() {
  npi.data.pfd.saveCtqPick(ctqPickTarget, ctqPickSelected)
  closeModal('modalCtqPick')
}

npi.pfd.openDocPick = function(oi) {
  const p = prog(); docPickTarget = oi; docPickSelected = [...(p.pfd[oi].docRefs || [])]
  const docs = p.docs || []
  document.getElementById('docPickList').innerHTML = docs.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No documents in register.</p>'
    : docs.map((d, i) => `<label class="ctq-pick-label"><input type="checkbox" ${docPickSelected.includes(d.id) ? 'checked' : ''} data-action="pfd-toggle-doc-pick" data-id="${d.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag" style="font-size:9px;background:var(--bg);border:1px solid var(--line);color:var(--muted)">${esc(d.docNumber || '—')}</span><span style="font-size:12px;font-weight:600">${esc(d.title || 'Untitled')}</span></div><div style="font-size:11px;color:var(--muted);margin-top:1px">${esc(d.type || '')}${d.issue ? ' · Issue ' + esc(String(d.issue)) : ''}</div></div></label>`).join('')
  showModal('modalDocPick')
}

npi.pfd.toggleDocPick = function(docId, checked) {
  if (checked) { if (!docPickSelected.includes(docId)) docPickSelected.push(docId) }
  else { docPickSelected = docPickSelected.filter(x => x !== docId) }
}

npi.pfd.saveDocPick = function() {
  npi.data.pfd.saveDocPick(docPickTarget, docPickSelected)
  closeModal('modalDocPick')
}

npi.pfd.delDocRef = function(sid, docId) {
  const s = prog().pfd.find(x => x.id === sid)
  if (!s) return
  s.docRefs = (s.docRefs || []).filter(x => x !== docId)
  Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
  npi.notify('render')
}

npi.pfd.openBomPick = function(sid) {
  const p = prog(); if (!p) return
  const s = p.pfd.find(x => x.id === sid); if (!s) return
  bomPickTarget = sid
  bomPickSelected = [...(s.bomRefs || []).map(r => r.bomType + '|' + r.itemId)]
  bomPickFilter = 'all'

  const titleEl = document.getElementById('bomPickTitle')
  if (titleEl) titleEl.textContent = `Resources — Step ${s.stepNum}: ${s.op || '(unnamed)'}`

  npi.pfd.refreshBomPickModal(p, 'bomPickFilter', 'bomPickList', bomPickFilter)
  showModal('modalBomPick')
}

npi.pfd.refreshBomPickModal = function(p, filterId, listId, activeFilter) {
  const filterEl = document.getElementById(filterId)
  const listEl = document.getElementById(listId)
  if (!filterEl || !listEl) return

  const types = Object.entries(BOM_TYPES)
  const total = types.reduce((n, [k]) => n + p.bom[k].length, 0)

  filterEl.innerHTML = `<button class="bom-filter-btn${activeFilter === 'all' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="all" data-filter-id="${filterId}" data-list-id="${listId}">All (${total})</button>` +
    types.map(([k, t]) => `<button class="bom-filter-btn${activeFilter === k ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="${k}" data-filter-id="${filterId}" data-list-id="${listId}">${t.icon} ${t.label} (${p.bom[k].length})</button>`).join('')

  const items = []
  types.forEach(([k, t]) => {
    if (activeFilter !== 'all' && activeFilter !== k) return
    p.bom[k].forEach(item => {
      const key = k + '|' + item.id
      const name = item.desc || (item.pn || item.toolId || item.equipId || '')
      const flags = []
      if (item.isAaw) flags.push('<span class="flag flag-aaw">AAW</span>')
      if (item.isRepair) flags.push('<span class="flag flag-repair">RPR</span>')
      const meta = [item.pn || item.toolId || item.equipId, item.spec].filter(Boolean).join(' · ')
      items.push(`<div class="bom-pick-item${bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" ${bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">${t.icon} ${esc(name || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">${t.label}</span></div>`)
    })
  })

  listEl.innerHTML = items.length ? items.join('') : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No items in BoM yet.</div>'
}

npi.pfd.setBomFilter = function(f, fid, lid) { bomPickFilter = f; npi.pfd.refreshBomPickModal(prog(), fid, lid, f) }

npi.pfd.toggleBomPick = function(key, el) {
  const chk = el.querySelector('input')
  if (bomPickSelected.includes(key)) {
    bomPickSelected = bomPickSelected.filter(x => x !== key)
    el.classList.remove('selected')
    if (chk) chk.checked = false
  } else {
    bomPickSelected.push(key)
    el.classList.add('selected')
    if (chk) chk.checked = true
  }
}

npi.pfd.saveBomPick = function() {
  npi.data.pfd.saveBomPick(bomPickTarget, bomPickSelected)
  closeModal('modalBomPick')
}
