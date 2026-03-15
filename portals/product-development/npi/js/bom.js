// ═══════════════════════════════════
// bom.js — Bill of Materials and Kit builder
// Depends on: state.js, helpers.js, navigation.js, npi.js, apqp.js (refreshBomPickModal)
// All functions under npi.bom.*
// ═══════════════════════════════════

npi.bom.renderBOM = function() {
  const p    = prog()
  const tabs = [
    ...Object.entries(BOM_TYPES).map(([id, meta]) => ({ id, label: `${meta.icon} ${meta.label}`, count: (p.bom[id] || []).length })),
    { id: 'kits', label: '📦 Kits', count: p.bom.kits.length },
  ]
  const tabHTML = `<div class="bom-subnav">${
    tabs.map(t => `<button class="bom-tab${bomSubTab === t.id ? ' active' : ''}" data-action="bom-set-tab" data-tab="${t.id}">${t.label} <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:inherit;opacity:.7">(${t.count})</span></button>`).join('')
  }</div>`

  const content = bomSubTab === 'kits' ? npi.bom.renderKits(p) : npi.bom.renderBomTable(bomSubTab, p)
  return `<div class="sec-head"><div><div class="sec-eyebrow">Bill of Materials</div><div class="sec-title">📦 BoM &amp; Kits</div><div class="sec-desc">Master item registers and kit builder. Link items to PFD steps via ＋ Resource.</div></div><div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" data-action="npi-go-home">← Dashboard</button></div></div>${tabHTML}${content}`
}

npi.bom.setBomTab = function(t) { bomSubTab = t; render() }

npi.bom.renderBomTable = function(type, p) {
  const items   = p.bom[type]
  const t       = BOM_TYPES[type]
  const aaw     = items.filter(x => x.isAaw).length
  const rep     = items.filter(x => x.isRepair).length
  const statsHTML = `<div style="display:flex;gap:8px;margin-bottom:14px">
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${items.length} total</span>
    ${type !== 'tools' && type !== 'equip' ? `<span class="flag-aaw bom-summary-pill">${aaw} AAW</span><span class="flag-repair bom-summary-pill">${rep} Repair</span>` : ''}
  </div>`

  // ABC filter and visible items (parts only)
  let abcFilterBar = '', filterNote = '', visibleItems = items
  if (type === 'parts') {
    visibleItems = bomAbcFilter !== 'all'
      ? items.filter(r => r.abcClass === bomAbcFilter)
      : items

    abcFilterBar = `<div class="bom-abc-filter-row">
      <span class="bom-abc-filter-label">ABC Class:</span>
      ${['all','A','B','C'].map(cls =>
        `<button class="bom-abc-chip${bomAbcFilter === cls ? ' active' : ''}"
          data-action="bom-abc-filter" data-cls="${cls}">${cls === 'all' ? 'All' : cls}</button>`
      ).join('')}
      <button class="btn btn-ghost btn-sm" style="margin-left:auto"
        data-action="bom-abc-info">What are A / B / C? ℹ</button>
    </div>`;

    filterNote = bomAbcFilter !== 'all'
      ? `<span class="bom-abc-active-filter">Showing ${visibleItems.length} ${bomAbcFilter}-Class parts</span>`
      : '';
  }

  let thead = '', tbody = ''
  if (type === 'parts') {
    thead = npi.components.tableHeader([{ label: 'Tidyco PN' }, { label: 'Supplier PN' }, { label: 'Description' }, { label: 'Qty' }, { label: 'Unit' }, { label: 'Sage' }, { label: 'Class' }, { label: 'Std' }, { label: 'AAW' }, { label: 'Repair' }, { label: 'Notes' }, { label: '' }])
    tbody = visibleItems.map((r, i) => {
      const actualIdx = items.indexOf(r);
      const sageBadge = r.abcCatalogueId
        ? (() => {
            const cat = abcCatalogueData.find(c => c.id === r.abcCatalogueId)
            return cat && cat.in_sage ? '<span style="color:var(--green);font-weight:bold">✓</span>' : '<span style="color:var(--muted)">—</span>'
          })()
        : '<span style="color:var(--muted)">—</span>'
      const classBadge = r.abcClass
        ? `<span class="abc-badge abc-${r.abcClass}">${r.abcClass}</span>`
        : '<span style="color:var(--muted)">—</span>'
      return `<tr>
      <td class="w110"><code style="font-size:11px">${esc(r.pn) || '—'}</code></td>
      <td class="w110"><code style="font-size:11px">${esc(r.supplierPN||'') || '—'}</code></td>
      <td class="bom-col-desc">${esc(r.desc) || '<span style="color:var(--muted)">—</span>'}</td>
      <td class="w75 ctr"><input type="number" class="cell-edit mono" min="0" value="${r.qty || ''}" data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="qty" data-number="1"></td>
      <td class="w50 ctr"><span style="font-size:12px">${esc(r.unit) || 'ea'}</span></td>
      <td class="w44 ctr">${sageBadge}</td>
      <td class="w60 ctr">${classBadge}</td>
      <td class="w44 ctr"><input type="checkbox" ${r.isStd    ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isStd"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isAaw    ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isAaw"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isRepair ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isRepair" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td class="bom-col-notes"><input class="cell-edit" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="notes" placeholder="Notes / scheme ref"></td>
      <td class="w28 ctr"><button class="del-btn" data-action="bom-del-row" data-type="parts" data-idx="${actualIdx}">×</button></td>
    </tr>`}).join('')
  } else if (type === 'tools') {
    thead = npi.components.tableHeader([{ label: 'Tool ID' }, { label: 'Description' }, { label: 'Spec / PN' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.toolId)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="toolId" placeholder="TL-001"></td>
      <td class="bom-col-desc"><input class="cell-edit" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit mono" value="${esc(r.spec)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="spec" placeholder="Spec / PN"></td>
      <td class="bom-col-notes"><input class="cell-edit" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" data-action="bom-del-row" data-type="tools" data-idx="${i}">×</button></td>
    </tr>`).join('')
  } else if (type === 'equip') {
    thead = npi.components.tableHeader([{ label: 'Equip ID' }, { label: 'Description' }, { label: 'Location' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.equipId)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="equipId" placeholder="EQ-001"></td>
      <td class="bom-col-desc"><input class="cell-edit" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit" value="${esc(r.location)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="location" placeholder="Bay / location"></td>
      <td class="bom-col-notes"><input class="cell-edit" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" data-action="bom-del-row" data-type="equip" data-idx="${i}">×</button></td>
    </tr>`).join('')
  } else {
    thead = npi.components.tableHeader([{ label: 'Part / Cat. No.' }, { label: 'Description' }, { label: 'Unit' }, { label: 'Qty/Unit' }, { label: 'Std' }, { label: 'AAW' }, { label: 'Repair' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" value="${esc(r.pn)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="pn" placeholder="PN"></td>
      <td class="bom-col-desc"><input class="cell-edit" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w60"><input class="cell-edit" value="${esc(r.unit)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="unit" placeholder="kg/L/m"></td>
      <td class="w100 ctr"><input type="number" class="cell-edit mono" min="0" step="0.01" value="${r.qtyPerUnit || ''}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="qtyPerUnit" data-number="1"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isStd    ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isStd"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isAaw    ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isAaw"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" ${r.isRepair ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isRepair" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td class="bom-col-notes"><input class="cell-edit" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr"><button class="del-btn" data-action="bom-del-row" data-type="${type}" data-idx="${i}">×</button></td>
    </tr>`).join('')
  }

  const tableMinWidth = type === 'parts' ? '1080px' : '800px'

  const content = type === 'parts'
    ? `${abcFilterBar}${filterNote}${statsHTML}${
        items.length === 0
          ? emptyState(t.icon, 'No ' + t.label.toLowerCase() + ' yet', 'Click "＋ Add from Parts Database" to search and add parts from the global catalogue.')
          : `<div style="overflow-x:auto"><table class="tbl bom-tbl" style="min-width:${tableMinWidth}">${thead}<tbody>${tbody}</tbody></table></div>`
      }`
    : `${statsHTML}${
        items.length === 0
          ? emptyState(t.icon, 'No ' + t.label.toLowerCase() + ' yet', 'Click ＋ Add to start. Link items to PFD steps using ＋ Resource.')
          : `<div style="overflow-x:auto"><table class="tbl bom-tbl" style="min-width:${tableMinWidth}">${thead}<tbody>${tbody}</tbody></table></div>`
      }`;

  return `<div class="bom-register-wrap"><div class="card">
  <div class="card-head"><span class="card-title">${t.icon} ${t.label} Register</span><span class="card-meta">${items.length} items</span>${
    type === 'parts'
      ? `<button class="btn btn-primary btn-sm" data-action="bom-open-abc-pick" style="margin-left:auto">＋ Add from Parts Database</button>`
      : `<button class="btn btn-primary btn-sm" data-action="bom-add-row" data-type="${type}" style="margin-left:auto">＋ Add ${t.label.replace(/s$/, '')}</button>`
  }</div>
  ${content}
  ${type !== 'parts' ? `<button class="add-row" data-action="bom-add-row" data-type="${type}">＋ Add ${t.label.replace(/s$/, '')}</button>` : ''}</div></div>`
}

npi.bom.addBomRow = function(type) {
  npi.data.bom.addRow(type)
  render()
  setTimeout(() => { const tbl = document.querySelector('.card table'); if (tbl) { const rows = tbl.querySelectorAll('tbody tr'); if (rows.length > 0) rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' }) } }, 50)
}
npi.bom.updBom = function(type, i, f, v) { npi.data.bom.updRow(type, i, f, v) }
npi.bom.delBom = function(type, i) {
  npi.data.bom.delRow(type, i)
  render()
}

// ══════════════════════════════════════
// KITS
// ══════════════════════════════════════
npi.bom.renderKits = function(p) {
  const kits     = p.bom.kits
  const allItems = []
  Object.entries(BOM_TYPES).forEach(([k, t]) => { p.bom[k].forEach(item => { allItems.push({ bomType: k, item, t }) }) })
  const totalItems = allItems.length

  const kitCards = kits.map((kit, ki) => {
    const totalBomRefs = kit.items.length
    const summary = Object.entries(BOM_TYPES).map(([k, t]) => { const n = kit.items.filter(r => r.bomType === k).length; return n > 0 ? `${t.icon} ${n} ${t.label.toLowerCase()}` : null }).filter(Boolean).join(' · ')
    const kitRows = kit.items.map((ref, ri) => {
      const bt   = p.bom[ref.bomType]; if (!bt) return ''
      const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
      const t    = BOM_TYPES[ref.bomType]
      const name = item.desc || (item.pn || item.toolId || item.equipId || '?')
      const pn   = item.pn || item.toolId || item.equipId || ''
      const flags = []
      if (item.isAaw)    flags.push('<span class="flag flag-aaw">AAW</span>')
      if (item.isRepair) flags.push('<span class="flag flag-repair">RPR</span>')
      const typeBg  = { parts: 'var(--blue-pale)', tools: 'var(--navy-pale)', equip: 'var(--amber-pale)', mat: 'var(--green-pale)', cons: 'var(--red-pale)' }[ref.bomType]
      const typeCol = { parts: 'var(--blue)',      tools: 'var(--navy)',      equip: 'var(--amber)',      mat: 'var(--green)',      cons: 'var(--red)'      }[ref.bomType]
      return `<div class="kit-item-row">
        <span class="kit-item-type" style="background:${typeBg};color:${typeCol}">${t.icon} ${t.label}</span>
        <span class="kit-item-name">${esc(name)}</span>
        ${pn ? `<span class="kit-item-pn">${esc(pn)}</span>` : ''}
        <div style="display:flex;gap:3px">${flags.join('')}</div>
        <input class="kit-qty-input" type="number" min="0" step="0.01" value="${ref.qty || 1}" data-action="bom-upd-kit-item" data-ki="${ki}" data-ri="${ri}" data-field="qty" title="Quantity">
        <span class="kit-unit">${item.unit || 'ea'}</span>
        <button class="del-btn" data-action="bom-del-kit-item" data-ki="${ki}" data-ri="${ri}">×</button>
      </div>`
    }).join('')
    return `<div class="kit-card">
      <div class="kit-header">
        <span style="font-size:20px">📦</span>
        <input class="kit-name-input" value="${esc(kit.name)}" data-action="bom-upd-kit" data-ki="${ki}" data-field="name" placeholder="Kit name (e.g. Overhaul Kit, Fastener Kit…)">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);margin-left:auto">${totalBomRefs} items</span>
        <button class="del-btn" data-action="bom-del-kit" data-ki="${ki}" style="margin-left:8px">×</button>
      </div>
      <div class="kit-body">
        ${kitRows || `<div class="kit-empty">No items yet — click Add Items to build this kit</div>`}
      </div>
      <div class="kit-summary">${summary || 'Empty kit'}</div>
      <button class="kit-add-btn" data-action="bom-open-kit-pick" data-ki="${ki}">＋ Add Items from BoM</button>
    </div>`
  }).join('')

  return `<div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:13px;color:var(--muted)">${kits.length} kit${kits.length !== 1 ? 's' : ''} · ${totalItems} total BoM items available</div>
    <button class="btn btn-primary btn-sm" data-action="bom-add-kit">＋ New Kit</button>
  </div>
  ${kits.length === 0
    ? `<button class="new-kit-btn" data-action="bom-add-kit">＋ Create your first kit<div style="font-size:12px;margin-top:4px;color:var(--muted)">e.g. Overhaul Kit, Fastener Kit, Bearing Kit, Repair Kit A…</div></button>`
    : `<div class="kit-list">${kitCards}</div>`}`
}

npi.bom.addKit = function() {
  npi.data.bom.addKit()
  render()
}
npi.bom.updKit = function(ki, f, v) { npi.data.bom.updKit(ki, f, v) }
npi.bom.delKit = function(ki) {
  npi.data.bom.delKit(ki)
  render()
}
npi.bom.updKitItem = function(ki, ri, f, v) {
  npi.data.bom.updKitItem(ki, ri, f, v)
}
npi.bom.delKitItem = function(ki, ri) {
  npi.data.bom.delKitItem(ki, ri)
  render()
}

npi.bom.openKitPick = function(ki) {
  kitPickTarget = ki
  const p   = prog()
  const kit = p.bom.kits[ki]
  kitPickSelected   = kit.items.map(r => r.bomType + '|' + r.itemId)
  kitPickFilter     = 'all'
  bomPickSelected   = [...kitPickSelected]
  bomPickFilter     = kitPickFilter
  npi.pfd.refreshBomPickModal(p, 'kitPickFilter', 'kitPickList', 'all')
  showModal('modalKitPick')
}
npi.bom.saveKitPick = function() {
  npi.data.bom.saveKitPick(kitPickTarget, bomPickSelected)
  closeModal('modalKitPick'); render()
}

// ══════════════════════════════════════
// ABC Class Filter and Picker
// ══════════════════════════════════════
npi.bom.setAbcFilter = function(cls) {
  bomAbcFilter = cls
  render()
}

npi.bom.showAbcInfo = function() {
  showModal('modalAbcInfo')
}

npi.bom.openABCPick = async function() {
  const p = prog()
  if (!p) return
  abcPickTarget = { progId: p.id, type: 'parts' }
  abcPickResults = []
  abcPickSelected = []
  abcPickLoading = true
  abcPickSearch = ''
  abcPickClassFilter = 'all'
  showModal('modalABCPick')
  npi.bom._refreshAbcPickBtn()
  // Fetch and populate
  abcPickResults = await npiRelFetchABCCatalogue()
  abcPickLoading = false
  // Re-render the modal list
  const listEl = document.getElementById('abcPickList')
  if (listEl) listEl.innerHTML = npi.bom.renderABCPickList()
}

npi.bom._refreshAbcPickBtn = function() {
  const btn = document.getElementById('abcPickAddBtn')
  if (!btn) return
  const n = abcPickSelected.length
  btn.textContent = n > 0 ? `Add ${n} Part${n !== 1 ? 's' : ''}` : 'Add Parts'
  btn.disabled = n === 0
}

npi.bom.renderABCPickList = function() {
  if (abcPickLoading) return '<div class="skeleton-loader"><div class="skeleton-line" style="width:80%"></div><div class="skeleton-line" style="width:60%"></div><div class="skeleton-line" style="width:90%"></div></div>'

  // Apply filters
  const searchTerm = (abcPickSearch || '').toLowerCase()
  let filtered = searchTerm
    ? abcPickResults.filter(r =>
        (r.item_desc || '').toLowerCase().includes(searchTerm) ||
        (r.pn || '').toLowerCase().includes(searchTerm)
      )
    : abcPickResults

  if (abcPickClassFilter !== 'all') {
    filtered = filtered.filter(r => r.abc_class === abcPickClassFilter)
  }

  if (!filtered.length) return '<div style="padding:20px;text-align:center;color:var(--muted)">No parts found.</div>'

  // IDs of parts already in this project's BOM
  const p = prog()
  const alreadyAdded = new Set((p && p.bom && p.bom.parts || []).map(x => x.abcCatalogueId).filter(Boolean))

  return filtered.map(r => {
    const idx = abcPickResults.indexOf(r)
    const selected = abcPickSelected.includes(r.id)
    const added = alreadyAdded.has(r.id)
    const sageBadge = r.in_sage ? '<span style="color:var(--green);margin-left:4px">· Sage</span>' : ''
    const addedBadge = added ? '<span style="color:var(--muted);font-size:11px;margin-left:4px">· Already in BOM</span>' : ''
    return `
    <div class="bom-pick-item${selected ? ' selected' : ''}${added ? ' bom-pick-item--added' : ''}"
         onclick="npi.bom.toggleABCPick(${idx})" style="cursor:pointer">
      <input type="checkbox" ${selected || added ? 'checked' : ''} ${added ? 'disabled' : ''} style="pointer-events:none;margin-right:8px">
      <div style="flex:1;min-width:0">
        <div class="bom-pick-name">${esc(r.item_desc)}${addedBadge}</div>
        <div class="bom-pick-meta">${r.pn ? 'PN: ' + esc(r.pn) + ' · ' : ''}${esc(r.unit || 'ea')}${r.notes ? ' · ' + esc(r.notes) : ''}${sageBadge}</div>
      </div>
      <span class="abc-badge abc-${r.abc_class}">${r.abc_class}</span>
    </div>`
  }).join('')
}

npi.bom.toggleABCPick = function(idx) {
  const r = abcPickResults[idx]
  if (!r) return
  // Don't allow toggling parts already in the BOM
  const p = prog()
  const alreadyAdded = new Set((p && p.bom && p.bom.parts || []).map(x => x.abcCatalogueId).filter(Boolean))
  if (alreadyAdded.has(r.id)) return

  if (abcPickSelected.includes(r.id)) {
    abcPickSelected = abcPickSelected.filter(id => id !== r.id)
  } else {
    abcPickSelected.push(r.id)
  }
  // Re-render the full list to reflect new selection state
  const listEl = document.getElementById('abcPickList')
  if (listEl) listEl.innerHTML = npi.bom.renderABCPickList()
  npi.bom._refreshAbcPickBtn()
}

npi.bom.confirmABCPick = function() {
  const p = prog()
  if (!p || !abcPickSelected.length) return
  abcPickSelected.forEach(catId => {
    const src = abcPickResults.find(r => r.id === catId)
    if (!src) return
    const item = {
      id: crypto.randomUUID(),
      desc: src.item_desc || '',
      notes: src.notes || '',
      pn: src.pn || '',
      supplierPN: src.supplier_pn || '',
      qty: 1,
      unit: src.unit || 'ea',
      isStd: false,
      isAaw: false,
      isRepair: false,
      abcClass: src.abc_class || 'C',
      abcCatalogueId: src.id
    }
    p.bom.parts.push(item)
    Promise.resolve().then(() => npiRelSaveBOMItem('parts', item)).catch(err => console.error('[NPI] save BOM item failed:', err))
  })
  abcPickSelected = []
  npi.notify('render')
  closeModal('modalABCPick')
}
