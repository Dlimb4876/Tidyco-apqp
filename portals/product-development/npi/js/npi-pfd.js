// ═══════════════════════════════════
// npi-pfd.js — PFD tab rendering and modal handlers
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.pfd = npi.pfd || {}

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

  return `<div class="step-row" id="pfd-row-${s.id}"><div class="step-main-row"><div class="step-num-cell"><div class="step-num-badge">${s.stepNum}</div><div style="display:flex;flex-direction:column;gap:2px"><button class="mini-btn" data-action="pfd-open-insert" data-after="${oi}">＋</button><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button></div></div><div class="step-body"><div class="step-fields"><div class="step-field f-op"><input class="cell-edit" value="${esc(s.op)}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Operation" style="font-weight:600"></div><div class="step-field f-detail"><textarea class="cell-edit" rows="2" data-action="pfd-upd" data-id="${s.id}" data-field="detail" placeholder="Method / notes…">${esc(s.detail)}</textarea></div><div class="step-field f-ctq"><div class="ctq-pick">${ctqBadges}${p.ctq.length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-ctq-pick" data-idx="${oi}">＋ CTQ</span>` : ''}</div></div><div class="step-field f-pfmea">${pfCnt > 0 ? `<span class="tag tag-amber">${pfCnt} FMEA</span>` : '<span style="font-size:11px;color:var(--muted)">—</span>'}</div></div></div></div><div class="step-resources">${pills}<button class="res-add-btn" data-action="pfd-open-bom-pick" data-id="${s.id}">＋ Resource</button></div></div>`
}

npi.pfd.render = function() {
  const p = prog()
  const sorted = npi.data.sortedPfd(p.pfd)
  const ribbon = sorted.filter(s => s.type !== 'group').map((s, i, arr) =>
    `<div class="flow-node${s.type === 'sub' ? ' is-sub' : ''}" data-action="pfd-scroll" data-id="${s.id}"><div class="flow-node-num">${s.stepNum}</div><div class="flow-node-name">${esc(s.op) || '—'}</div></div>${i < arr.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
  ).join('')

  let body = '', i = 0
  while (i < sorted.length) {
    const s = sorted[i]
    const oi = p.pfd.indexOf(s)
    if (s.type === 'group') {
      const ch = []; let j = i + 1
      while (j < sorted.length && sorted[j].type === 'sub' && Math.floor(sorted[j].stepNum / 10) === Math.floor(s.stepNum / 10)) {
        ch.push({ s: sorted[j], oi: p.pfd.indexOf(sorted[j]) }); j++
      }
      const col = collapsedGroups.has(s.id)
      body += `<div class="step-row" id="pfd-row-${s.id}"><div class="sub-group-header" data-action="pfd-toggle-group" data-key="${s.id}"><span style="font-size:10px;color:var(--purple);display:inline-block;${col ? '' : 'transform:rotate(90deg)'}">▶</span><span class="tag tag-sub">${s.stepNum}</span><span style="font-size:13px;font-weight:600;color:var(--purple)">${esc(s.op) || 'Sub-assembly Group'}</span><span style="font-size:11px;color:#9b74cc;margin-left:auto">${ch.length} step${ch.length !== 1 ? 's' : ''}</span><button class="del-btn" style="margin-left:8px" data-action="pfd-del" data-id="${s.id}">×</button></div><div class="sub-group-body${col ? ' collapsed' : ''}"> ${ch.map(c => stepRowHTML(c.s, c.oi, p)).join('')}</div></div>`
      i = j
    } else { body += stepRowHTML(s, oi, p); i++ }
    body += `<div class="insert-row"><button class="insert-btn" data-action="pfd-open-insert" data-after="${oi}">＋ after ${s.stepNum}</button></div>`
  }

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Steps numbered in 10s. Insert between steps. Numbers are permanent references in PFMEA and Control Plan.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-pfd')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" data-action="pfd-open-insert" data-after="" data-type="group">＋ Sub-assembly</button><button class="btn btn-primary btn-sm" data-action="pfd-add-main">＋ Add Step</button></div></div>
  ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
  <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${p.pfd.filter(s => s.type !== 'group').length} executable steps</span></div>
  ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div>${body}</div>`}
  <button class="add-row" data-action="pfd-add-main">＋ Add Process Step</button></div>
  ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" data-action="npi-set-apqp" data-tab="pfmea" style="color:var(--blue)">PFMEA →</a></div>` : ''}`
}

npi.pfd.addMainStep = function() { npi.data.pfd.addMainStep() }

npi.pfd.openInsert = function(afterOi, ft) {
  insertOriginIdx = afterOi
  const p = prog()
  const sorted = npi.data.sortedPfd(p.pfd)
  if (ft) document.getElementById('insertType').value = ft
  const ni = document.getElementById('insertNum')
  const hi = document.getElementById('insertNumHint')

  if (afterOi != null) {
    const as = p.pfd[afterOi]
    const asi = sorted.findIndex(s => s.id === as.id)
    const ns = asi < sorted.length - 1 ? sorted[asi + 1] : null
    const base = as.stepNum
    const ceil = ns ? ns.stepNum : base + 10
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
  const num = parseInt(document.getElementById('insertNum').value, 10)
  const type = document.getElementById('insertType').value
  const result = npi.data.pfd.insertStep(num, type)
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
