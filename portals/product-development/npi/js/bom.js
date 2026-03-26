// ═══════════════════════════════════
// bom.js — Bill of Materials and Kit builder
// Depends on: state.js, helpers.js, navigation.js, npi.js, apqp.js (refreshBomPickModal)
// All functions under npi.bom.*
// ═══════════════════════════════════

npi.bom.renderBOM = function() {
  const p    = prog()

  // Fetch ABC catalogue data if not already loaded (needed for Parts Register)
  if (!abcCatalogueData || abcCatalogueData.length === 0) {
    npiRelFetchABCCatalogue().then(data => {
      abcCatalogueData = data || []
      if (bomSubTab === 'register') render()
    })
  }

  // Calculate rolled-up parts register count
  const registerParts = npi.bom._aggregatePartsRegister(p)
  
  const bomTypesFiltered = Object.entries(BOM_TYPES)
    .filter(([id]) => id !== 'parts' && id !== 'mat')
    .map(([id, meta]) => ({ id, label: `${meta.icon} ${meta.label}`, count: (p.bom[id] || []).length }))
  
  const tabs = [
    { id: 'register', label: '📋 Parts Register', count: registerParts.length },
    { id: 'tree', label: '🌲 Core BoM', count: (p.bom.tree || []).length },
    { id: 'aaw_repair', label: '🔧 AAW & Repair', count: (p.bom.aaw_repair || []).length },
    ...bomTypesFiltered
  ]
  const tabHTML = `<div class="bom-subnav">${
    tabs.map(t => `<button class="bom-tab${bomSubTab === t.id ? ' active' : ''}" data-action="bom-set-tab" data-tab="${t.id}">${t.label} <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:inherit;opacity:.7">(${t.count})</span></button>`).join('')
  }</div>`

  let content
  if (bomSubTab === 'tree') content = npi.bom.renderBomTree(p)
  else if (bomSubTab === 'aaw_repair') content = npi.bom.renderBomAawRepair(p)
  else if (bomSubTab === 'register') content = npi.bom.renderBomPartsRegister(p)
  else content = npi.bom.renderBomTable(bomSubTab, p)
  return `<div class="sec-head"><div><div class="sec-eyebrow">Bill of Materials</div><div class="sec-title">📦 BoM &amp; Kits</div><div class="sec-desc">Master item registers and kit builder. Link items to PFD steps via ＋ Resource.</div></div><div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-bom" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" data-action="npi-go-home">← Dashboard</button></div></div>${tabHTML}${content}`
}

npi.bom.setBomTab = function(t) {
  const prevTab = bomSubTab
  bomSubTab = t
  // Update URL hash to persist BOM tab state
  const parts = ['p=' + encodeURIComponent(progId), 's=project']
  if (typeof apqpTab !== 'undefined' && apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(apqpTab))
  if (t !== 'tree') parts.push('bt=' + encodeURIComponent(t))
  writeNavigationHistory('#' + parts.join('&'), { push: prevTab !== t })
  render()
}
npi.bom.setPartsRegisterView = function(view) { bomPartsRegisterView = view; render() }

// ══════════════════════════════════════
// PARTS REGISTER AGGREGATION
// ══════════════════════════════════════

npi.bom._collectPartsFromTree = function(nodes, parentQty) {
  const parts = []
  const qty = parentQty || 1
  
  nodes.forEach(node => {
    if (node.nodeType === 'part') {
      parts.push({
        pn: node.pn || '',
        desc: node.desc || '',
        unit: node.unit || 'ea',
        qty: (node.qty || 1) * qty,
        abcCatalogueId: node.abcCatalogueId || null,
        source: 'structure'
      })
    } else if (node.nodeType === 'subassembly' && node.children) {
      parts.push(...npi.bom._collectPartsFromTree(node.children, (node.qty || 1) * qty))
    }
  })
  
  return parts
}

npi.bom._collectPartsFromAawGroups = function(groups) {
  const parts = []
  
  groups.forEach(group => {
    const nodes = group.nodes || []
    const treeRoots = npi.bom._buildBomTree(nodes)
    const groupParts = npi.bom._collectPartsFromTree(treeRoots, 1)
    groupParts.forEach(part => {
      part.source = group.tag === 'aaw' ? 'aaw' : (group.tag === 'repair' ? 'repair' : 'aaw_repair')
    })
    parts.push(...groupParts)
  })
  
  return parts
}

npi.bom._aggregatePartsRegister = function(p) {
  const structureNodes = p.bom.tree || []
  const aawGroups = p.bom.aaw_repair || []
  
  // Collect parts from all sources
  const structureTreeRoots = npi.bom._buildBomTree(structureNodes)
  const structureParts = npi.bom._collectPartsFromTree(structureTreeRoots, 1)
  const aawParts = npi.bom._collectPartsFromAawGroups(aawGroups)
  
  // Combine all parts
  let allParts = [...structureParts, ...aawParts]
  
  // Filter by view mode
  if (bomPartsRegisterView === 'structure') {
    allParts = structureParts
  } else if (bomPartsRegisterView === 'aaw') {
    allParts = aawParts
  }
  
  // Aggregate by part number
  const aggregated = {}
  allParts.forEach(part => {
    const key = part.pn || part.desc || 'unknown'
    if (!aggregated[key]) {
      aggregated[key] = {
        pn: part.pn,
        desc: part.desc,
        unit: part.unit,
        qty: 0,
        abcCatalogueId: null,
        sources: new Set()
      }
    }
    aggregated[key].qty += part.qty
    aggregated[key].sources.add(part.source)
    if (part.abcCatalogueId && !aggregated[key].abcCatalogueId) {
      aggregated[key].abcCatalogueId = part.abcCatalogueId
    }
  })
  
  return Object.values(aggregated)
}

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
      <td class="w75 ctr"><input type="number" class="cell-edit mono" name="bom_parts_${actualIdx}_qty" min="0" value="${r.qty || ''}" data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="qty" data-number="1"></td>
      <td class="w50 ctr"><span style="font-size:12px">${esc(r.unit) || 'ea'}</span></td>
      <td class="w44 ctr">${sageBadge}</td>
      <td class="w60 ctr">${classBadge}</td>
      <td class="w44 ctr"><input type="checkbox" name="bom_parts_${actualIdx}_isStd" ${r.isStd    ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isStd"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" name="bom_parts_${actualIdx}_isAaw" ${r.isAaw    ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isAaw"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" name="bom_parts_${actualIdx}_isRepair" ${r.isRepair ? 'checked' : ''} data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="isRepair" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td class="bom-col-notes"><input class="cell-edit" name="bom_parts_${actualIdx}_notes" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="parts" data-idx="${actualIdx}" data-field="notes" placeholder="Notes / scheme ref"></td>
      <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="bom-del-row" data-type="parts" data-idx="${actualIdx}">×</button>` : ''}</td>
    </tr>`}).join('')
  } else if (type === 'tools') {
    thead = npi.components.tableHeader([{ label: 'Tool ID' }, { label: 'Description' }, { label: 'Spec / PN' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" name="bom_tools_${i}_toolId" value="${esc(r.toolId)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="toolId" placeholder="TL-001"></td>
      <td class="bom-col-desc"><input class="cell-edit" name="bom_tools_${i}_desc" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit mono" name="bom_tools_${i}_spec" value="${esc(r.spec)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="spec" placeholder="Spec / PN"></td>
      <td class="bom-col-notes"><input class="cell-edit" name="bom_tools_${i}_notes" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="tools" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="bom-del-row" data-type="tools" data-idx="${i}">×</button>` : ''}</td>
    </tr>`).join('')
  } else if (type === 'equip') {
    thead = npi.components.tableHeader([{ label: 'Equip ID' }, { label: 'Description' }, { label: 'Location' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" name="bom_equip_${i}_equipId" value="${esc(r.equipId)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="equipId" placeholder="EQ-001"></td>
      <td class="bom-col-desc"><input class="cell-edit" name="bom_equip_${i}_desc" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w140"><input class="cell-edit" name="bom_equip_${i}_location" value="${esc(r.location)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="location" placeholder="Bay / location"></td>
      <td class="bom-col-notes"><input class="cell-edit" name="bom_equip_${i}_notes" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="equip" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="bom-del-row" data-type="equip" data-idx="${i}">×</button>` : ''}</td>
    </tr>`).join('')
  } else {
    thead = npi.components.tableHeader([{ label: 'Part / Cat. No.' }, { label: 'Description' }, { label: 'Unit' }, { label: 'Qty/Unit' }, { label: 'Std' }, { label: 'AAW' }, { label: 'Repair' }, { label: 'Notes' }, { label: '' }])
    tbody = items.map((r, i) => `<tr>
      <td class="w100"><input class="cell-edit mono" name="bom_${type}_${i}_pn" value="${esc(r.pn)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="pn" placeholder="PN"></td>
      <td class="bom-col-desc"><input class="cell-edit" name="bom_${type}_${i}_desc" value="${esc(r.desc)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="desc" placeholder="Description"></td>
      <td class="w60"><input class="cell-edit" name="bom_${type}_${i}_unit" value="${esc(r.unit)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="unit" placeholder="kg/L/m"></td>
      <td class="w100 ctr"><input type="number" class="cell-edit mono" name="bom_${type}_${i}_qtyPerUnit" min="0" step="0.01" value="${r.qtyPerUnit || ''}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="qtyPerUnit" data-number="1"></td>
      <td class="w44 ctr"><input type="checkbox" name="bom_${type}_${i}_isStd" ${r.isStd    ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isStd"    style="accent-color:var(--green);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" name="bom_${type}_${i}_isAaw" ${r.isAaw    ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isAaw"    style="accent-color:var(--amber);width:15px;height:15px;cursor:pointer"></td>
      <td class="w44 ctr"><input type="checkbox" name="bom_${type}_${i}_isRepair" ${r.isRepair ? 'checked' : ''} data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="isRepair" style="accent-color:var(--rose);width:15px;height:15px;cursor:pointer"></td>
      <td class="bom-col-notes"><input class="cell-edit" name="bom_${type}_${i}_notes" value="${esc(r.notes)}" data-action="bom-upd-row" data-type="${type}" data-idx="${i}" data-field="notes" placeholder="Notes"></td>
      <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="bom-del-row" data-type="${type}" data-idx="${i}">×</button>` : ''}</td>
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
  <div class="card-head"><span class="card-title">${t.icon} ${t.label} Register</span><span class="card-meta">${items.length} items</span>${canEdit() ? (
    type === 'parts'
      ? `<button class="btn btn-primary btn-sm" data-action="bom-open-abc-pick" style="margin-left:auto">＋ Add from Parts Database</button>`
      : `<button class="btn btn-primary btn-sm" data-action="bom-add-row" data-type="${type}" style="margin-left:auto">＋ Add ${t.label.replace(/s$/, '')}</button>`
  ) : ''}</div>
  ${content}
  ${canEdit() && type !== 'parts' ? `<button class="add-row" data-action="bom-add-row" data-type="${type}">＋ Add ${t.label.replace(/s$/, '')}</button>` : ''}</div></div>`
}

npi.bom.renderBomPartsRegister = function(p) {
  const parts = npi.bom._aggregatePartsRegister(p)
  
  const viewToggleHtml = `<div class="bom-register-view-toggle" style="display:flex;gap:8px;margin-bottom:14px">
    <span style="color:var(--muted);font-size:13px;margin-right:8px">View:</span>
    <button class="btn btn-sm${bomPartsRegisterView === 'total' ? ' btn-primary' : ' btn-ghost'}" data-action="bom-register-set-view" data-view="total">Total</button>
    <button class="btn btn-sm${bomPartsRegisterView === 'structure' ? ' btn-primary' : ' btn-ghost'}" data-action="bom-register-set-view" data-view="structure">Core BoM Only</button>
    <button class="btn btn-sm${bomPartsRegisterView === 'aaw' ? ' btn-primary' : ' btn-ghost'}" data-action="bom-register-set-view" data-view="aaw">AAW/Repair Only</button>
  </div>`
  
  const statsHtml = `<div style="display:flex;gap:8px;margin-bottom:14px">
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${parts.length} unique parts</span>
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${parts.reduce((sum, p) => sum + p.qty, 0)} total quantity</span>
  </div>`
  
  const cardContent = parts.length === 0
    ? emptyState('📋', 'No parts in register', bomPartsRegisterView === 'total' ? 'Add parts to the Core BoM or AAW & Repair tabs to see them rolled up here.' : `No parts found in ${bomPartsRegisterView === 'structure' ? 'Core BoM' : 'AAW/Repair'} view.`)
    : `<div style="overflow-x:auto"><table class="tbl bom-tbl" style="min-width:700px">${npi.components.tableHeader([
        { label: 'Tidyco PN' },
        { label: 'Description' },
        { label: 'Qty' },
        { label: 'Unit' },
        { label: 'Part Class' },
        { label: 'Source' }
      ])}<tbody>${parts.map(part => {
        const sources = Array.from(part.sources || [])
        const sourceBadges = sources.map(s => {
          if (s === 'structure') return '<span class="flag" style="background:var(--blue-50);border:1px solid var(--blue-200);color:var(--blue-700);font-size:11px;padding:2px 6px">Core BoM</span>'
          if (s === 'aaw') return '<span class="flag" style="background:var(--amber-50);border:1px solid var(--amber-200);color:var(--amber-700);font-size:11px;padding:2px 6px">AAW</span>'
          if (s === 'repair') return '<span class="flag" style="background:var(--rose-50);border:1px solid var(--rose-200);color:var(--rose-700);font-size:11px;padding:2px 6px">Repair</span>'
          return '<span class="flag" style="background:var(--muted);font-size:11px;padding:2px 6px">AAW/Repair</span>'
        }).join(' ')

        let classBadge = '<span style="color:var(--muted)">—</span>'
        if (part.abcCatalogueId) {
          const cat = abcCatalogueData.find(c => c.id === part.abcCatalogueId)
          const abcClass = cat ? cat.abc_class : null
          if (abcClass) {
            classBadge = `<span class="abc-badge abc-${abcClass}">${abcClass}</span>`
          }
        }

        return `<tr>
          <td class="w110"><code style="font-size:11px">${esc(part.pn) || '—'}</code></td>
          <td class="bom-col-desc">${esc(part.desc) || '<span style="color:var(--muted)">—</span>'}</td>
          <td class="w75 ctr"><span class="mono" style="font-weight:600">${part.qty}</span></td>
          <td class="w50 ctr"><span style="font-size:12px">${esc(part.unit) || 'ea'}</span></td>
          <td class="w60 ctr">${classBadge}</td>
          <td class="w200">${sourceBadges}</td>
        </tr>`
      }).join('')}</tbody></table></div>`
  
  return `<div class="bom-register-wrap"><div class="card">
    <div class="card-head"><span class="card-title">📋 Parts Register</span><span class="card-meta">${parts.length} unique parts</span></div>
    ${viewToggleHtml}
    ${statsHtml}
    ${cardContent}
  </div></div>`
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
// BOM TREE (Structure tab)
// ══════════════════════════════════════

// MAX_TREE_DEPTH: nodes at this storage depth cannot add children (0-indexed under root)
// 4 visual levels = root (product) + 3 storage levels (depth 0, 1, 2)
const MAX_TREE_DEPTH = 2

npi.bom._buildBomTree = function(nodes) {
  const byId = {}
  nodes.forEach(n => { byId[n.id] = { ...n, children: [] } })
  const roots = []
  nodes.forEach(n => {
    const node = byId[n.id]
    if (n.parentId && byId[n.parentId]) {
      byId[n.parentId].children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortNodes = arr => { arr.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)); arr.forEach(n => sortNodes(n.children)) }
  sortNodes(roots)
  return roots
}

npi.bom._renderTreeChildren = function(nodes, depth) {
  return nodes.map(n => npi.bom._renderTreeNode(n, depth)).join('')
}

npi.bom._renderTreeNode = function(node, depth) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded  = bomTreeExpanded.has(node.id)
  const canAddKids  = depth < MAX_TREE_DEPTH

  const toggleHtml = node.nodeType === 'subassembly'
    ? `<button class="bom-tree-toggle" data-action="bom-tree-toggle" data-id="${node.id}" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">${isExpanded ? '▾' : '▶'}</button>`
    : `<span class="bom-tree-toggle bom-tree-toggle--leaf"></span>`

  const icon = node.nodeType === 'subassembly' ? '📦' : '🔩'

  // ABC class badge for parts
  let abcClassHtml = ''
  if (node.nodeType === 'part' && node.abcCatalogueId) {
    const cat = abcCatalogueData.find(c => c.id === node.abcCatalogueId)
    const abcClass = cat ? cat.abc_class : null
    if (abcClass) {
      abcClassHtml = `<span class="abc-badge abc-${abcClass}" style="margin-right:8px">${abcClass}</span>`
    }
  }

  const qtyHtml = `<input type="number" class="bom-tree-qty" min="0" step="0.01"
    value="${node.qty != null ? node.qty : 1}"
    data-action="bom-tree-upd-qty" data-id="${node.id}"
    title="Quantity">`

  const descHtml = canEdit() && node.nodeType === 'subassembly'
    ? `<input class="bom-tree-desc-input" value="${esc(node.desc || '')}"
        data-action="bom-tree-upd-desc" data-id="${node.id}"
        placeholder="Description">`
    : `<span class="bom-tree-desc">${esc(node.desc) || '<span style="color:var(--muted)">No description</span>'}</span>`

  const addHtml = canEdit() && node.nodeType === 'subassembly' && canAddKids ? `
    <button class="btn btn-ghost btn-xs bom-tree-add-btn" data-action="bom-tree-add-part" data-parent="${node.id}">＋ Part</button>
    <button class="btn btn-ghost btn-xs bom-tree-add-btn" data-action="bom-tree-add-subasm" data-parent="${node.id}">＋ Sub-Asm</button>` : ''

  const delHtml = canEdit()
    ? `<button class="del-btn bom-tree-del" data-action="bom-tree-del-node" data-id="${node.id}" title="Remove">×</button>`
    : ''

  const childrenHtml = node.nodeType === 'subassembly'
    ? `<div class="bom-tree-children${isExpanded ? '' : ' bom-tree-children--collapsed'}" data-parent="${node.id}">
        ${hasChildren ? npi.bom._renderTreeChildren(node.children, depth + 1) : `<div class="bom-tree-empty-slot">${canEdit() ? 'Empty — add parts or sub-assemblies' : 'Empty'}</div>`}
       </div>`
    : ''

  return `<div class="bom-tree-item" style="--depth:${depth}">
    <div class="bom-tree-row">
      ${toggleHtml}
      <span class="bom-tree-icon">${icon}</span>
      <span class="bom-tree-pn">${esc(node.pn) || '<span class="bom-tree-no-pn">—</span>'}</span>
      ${abcClassHtml}
      ${descHtml}
      ${qtyHtml}
      <span class="bom-tree-unit">${esc(node.unit || 'ea')}</span>
      <div class="bom-tree-row-actions">${addHtml}${delHtml}</div>
    </div>
    ${childrenHtml}
  </div>`
}

npi.bom.renderBomTree = function(p) {
  // Fetch ABC catalogue data if not already loaded (needed for part class badges)
  if (!abcCatalogueData || abcCatalogueData.length === 0) {
    npiRelFetchABCCatalogue().then(data => {
      abcCatalogueData = data || []
      if (bomSubTab === 'tree') render()
    })
  }

  const linkedProduct = (typeof productsState !== 'undefined' && productsState)
    ? (productsState.products || []).find(pr => pr.id === p.product_id)
    : null

  if (!linkedProduct) {
    return emptyState('🌲', 'No product linked', 'Link this project to a product from the dashboard before building the BoM structure.')
  }

  const rootPN   = esc(linkedProduct.part_number || '—')
  const rootName = esc(linkedProduct.name || '')
  const treeNodes = p.bom.tree || []
  const treeRoots = npi.bom._buildBomTree(treeNodes)
  
  // Auto-expand all subassembly nodes on load
  treeNodes.forEach(n => {
    if (n.nodeType === 'subassembly') {
      bomTreeExpanded.add(n.id)
    }
  })
  const totalParts = treeNodes.filter(n => n.nodeType === 'part').length
  const totalSubAsm = treeNodes.filter(n => n.nodeType === 'subassembly').length

  const statsHtml = `<div style="display:flex;gap:8px;margin-bottom:14px">
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${totalSubAsm} sub-assemblies</span>
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${totalParts} parts</span>
  </div>`

  const rootChildrenHtml = treeRoots.length
    ? npi.bom._renderTreeChildren(treeRoots, 0)
    : `<div class="bom-tree-empty-slot">${canEdit() ? 'Empty — add parts or sub-assemblies to get started' : 'No items yet'}</div>`

  const rootAddHtml = canEdit() ? `
    <button class="btn btn-primary btn-sm" data-action="bom-tree-add-part" data-parent="">＋ Add Part</button>
    <button class="btn btn-secondary btn-sm" data-action="bom-tree-add-subasm" data-parent="">＋ Add Sub-Assembly</button>` : ''

  return `<div class="bom-register-wrap"><div class="card bom-tree-card">
    <div class="card-head"><span class="card-title">🌲 Core BoM</span><span class="card-meta">${totalSubAsm + totalParts} items</span></div>
    ${statsHtml}
    <div class="bom-tree-root-row">
      <span class="bom-tree-toggle bom-tree-toggle--root">▾</span>
      <span class="bom-tree-icon">🔷</span>
      <span class="bom-tree-pn bom-tree-root-pn">${rootPN}</span>
      <span class="bom-tree-desc bom-tree-root-name">${rootName}</span>
      <span class="bom-tree-root-label">Top-level product</span>
      <div class="bom-tree-row-actions">${rootAddHtml}</div>
    </div>
    <div class="bom-tree-children bom-tree-root-children">
      ${rootChildrenHtml}
    </div>
  </div></div>`
}

npi.bom.toggleTreeNode = function(id) {
  const childEl  = document.querySelector(`.bom-tree-children[data-parent="${id}"]`)
  const toggleEl = document.querySelector(`.bom-tree-toggle[data-id="${id}"]`)
  if (!childEl) return
  const collapsed = childEl.classList.toggle('bom-tree-children--collapsed')
  if (toggleEl) toggleEl.textContent = collapsed ? '▶' : '▾'
  if (collapsed) bomTreeExpanded.delete(id); else bomTreeExpanded.add(id)
}

npi.bom.openTreeAddPart = async function(parentId) {
  const p = prog()
  if (!p) return
  bomAawActiveGroupId = null
  bomAawGroupParentId = null
  bomTreeAddParentId  = parentId || null
  abcPickTarget       = { progId: p.id, type: 'tree', parentId: bomTreeAddParentId }
  abcPickResults      = []
  abcPickSelected     = []
  abcPickLoading      = true
  abcPickSearch       = ''
  abcPickClassFilter  = 'all'
  // Reset search UI if visible
  const searchEl = document.getElementById('abcPickSearchInput')
  if (searchEl) searchEl.value = ''
  showModal('modalABCPick')
  npi.bom._refreshAbcPickBtn()
  abcPickResults = await npiRelFetchABCCatalogue()
  abcPickLoading = false
  const listEl = document.getElementById('abcPickList')
  if (listEl) listEl.innerHTML = npi.bom.renderABCPickList()
}

npi.bom.openTreeAddSubAsm = function(parentId) {
  bomAawActiveGroupId = null
  bomAawGroupParentId = null
  bomTreeAddParentId  = parentId || null
  const pnEl   = document.getElementById('bomTreeSubAsmPn')
  const descEl = document.getElementById('bomTreeSubAsmDesc')
  if (pnEl)   pnEl.value   = ''
  if (descEl) descEl.value = ''
  showModal('modalBomTreeSubAsm')
}

npi.bom.saveTreeSubAsm = function() {
  const pn   = (document.getElementById('bomTreeSubAsmPn')  || {}).value?.trim()
  const desc = (document.getElementById('bomTreeSubAsmDesc') || {}).value?.trim()
  if (!pn) { showToast('Part number is required', 'warning'); return }
  if (bomAawActiveGroupId !== null) {
    npi.data.bom.addAawTreeNode(bomAawActiveGroupId, bomAawGroupParentId, 'subassembly', { pn, desc: desc || '' })
  } else {
    npi.data.bom.addTreeNode(bomTreeAddParentId, 'subassembly', { pn, desc: desc || '' })
  }
  closeModal('modalBomTreeSubAsm')
  render()
}

npi.bom.delTreeNode = function(id) {
  const p = prog()
  if (!p) return
  const node = (p.bom.tree || []).find(n => n.id === id)
  if (!node) return
  const childCount = (p.bom.tree || []).filter(n => n.parentId === id).length
  const msg = childCount > 0
    ? `Remove this sub-assembly and all ${childCount} item(s) inside it?`
    : `Remove this item from the structure?`
  if (!confirm(msg)) return
  npi.data.bom.delTreeNode(id)
}

npi.bom.updTreeNodeQty = function(id, v) {
  npi.data.bom.updTreeNode(id, 'qty', parseFloat(v) || 0)
}

npi.bom.updTreeNodeDesc = function(id, v) {
  npi.data.bom.updTreeNode(id, 'desc', v)
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

  // IDs of parts already in this project's flat BOM (not applicable in tree context)
  const p = prog()
  const isTreeContext = abcPickTarget && abcPickTarget.type === 'tree'
  const alreadyAdded = isTreeContext
    ? new Set()
    : new Set((p && p.bom && p.bom.parts || []).map(x => x.abcCatalogueId).filter(Boolean))

  return filtered.map(r => {
    const idx = abcPickResults.indexOf(r)
    const selected = abcPickSelected.includes(r.id)
    const added = alreadyAdded.has(r.id)
    const sageBadge = r.in_sage ? '<span style="color:var(--green);margin-left:4px">· Sage</span>' : ''
    const addedBadge = added ? '<span style="color:var(--muted);font-size:11px;margin-left:4px">· Already in BOM</span>' : ''
    return `
    <div class="bom-pick-item${selected ? ' selected' : ''}${added ? ' bom-pick-item--added' : ''}"
         onclick="npi.bom.toggleABCPick(${idx})" style="cursor:pointer">
      <input type="checkbox" name="bom_abc_pick_${idx}" ${selected || added ? 'checked' : ''} ${added ? 'disabled' : ''} style="pointer-events:none;margin-right:8px">
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


// ── AAW / Repair BoMs ──────────────────────────────────────────────────────

npi.bom.renderBomAawRepair = function(p) {
  // Fetch ABC catalogue data if not already loaded (needed for part class badges)
  if (!abcCatalogueData || abcCatalogueData.length === 0) {
    npiRelFetchABCCatalogue().then(data => {
      abcCatalogueData = data || []
      if (bomSubTab === 'aaw_repair') render()
    })
  }

  const groups = p.bom.aaw_repair || []

  const addGroupBtn = canEdit()
    ? `<button class="btn btn-primary btn-sm" data-action="bom-aaw-add-group" style="margin-bottom:16px">＋ Add BoM</button>`
    : ''

  if (groups.length === 0) {
    return `<div class="bom-register-wrap"><div class="card">
      <div class="card-head"><span class="card-title">🔧 AAW & Repair BoMs</span></div>
      ${addGroupBtn}
      ${emptyState('🔧', 'No AAW or Repair BoMs yet', 'Click ＋ Add BoM to create a new group for an AAW or repair bill of materials.')}
    </div></div>`
  }

  const TAG_LABELS = { aaw: 'AAW', repair: 'Repair' }
  const TAG_COLORS = { aaw: '#2563eb', repair: '#d97706' }

  // Auto-expand all subassembly nodes in AAW/Repair groups on load
  groups.forEach(group => {
    const nodes = group.nodes || []
    nodes.forEach(n => {
      if (n.nodeType === 'subassembly') {
        bomAawTreeExpanded.add(n.id)
      }
    })
  })

  const groupsHtml = groups.map(group => {
    const treeNodes = group.nodes || []
    const treeRoots = npi.bom._buildBomTree(treeNodes)
    const totalParts  = treeNodes.filter(n => n.nodeType === 'part').length
    const totalSubAsm = treeNodes.filter(n => n.nodeType === 'subassembly').length

    const tagSelectorHtml = canEdit()
      ? `<button type="button" class="bom-aaw-tag-pill${group.tag === 'aaw' ? ' active' : ''}" data-action="bom-aaw-upd-tag" data-id="${group.id}" data-tag="aaw" onclick="npi.data.bom.updAawGroupTag('${group.id}', 'aaw')">AAW</button>
         <button type="button" class="bom-aaw-tag-pill${group.tag === 'repair' ? ' active' : ''}" data-action="bom-aaw-upd-tag" data-id="${group.id}" data-tag="repair" onclick="npi.data.bom.updAawGroupTag('${group.id}', 'repair')">Repair</button>`
      : (group.tag ? `<span class="bom-aaw-tag-pill active" data-tag="${group.tag}">${TAG_LABELS[group.tag]}</span>` : '')

    const statsPillsHtml = `<div style="display:flex;gap:6px;align-items:center;margin-left:12px;flex-shrink:0;flex-wrap:wrap">
      ${tagSelectorHtml}
      <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid);font-size:11px;padding:3px 10px">${totalSubAsm} sub-assemblies</span>
      <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid);font-size:11px;padding:3px 10px">${totalParts} parts</span>
    </div>`

    const childrenHtml = treeRoots.length
      ? npi.bom._renderAawTreeChildren(treeRoots, group.id, 0)
      : `<div class="bom-tree-empty-slot">${canEdit() ? 'Empty — add parts or sub-assemblies' : 'No items yet'}</div>`

    const rootAddHtml = canEdit() ? `
      <button class="btn btn-primary btn-sm" data-action="bom-aaw-tree-add-part" data-group="${group.id}" data-parent="">＋ Add Part</button>
      <button class="btn btn-secondary btn-sm" data-action="bom-aaw-tree-add-subasm" data-group="${group.id}" data-parent="">＋ Add Sub-Assembly</button>` : ''

    const delBtnHtml = canEdit()
      ? `<button class="del-btn" data-action="bom-aaw-del-group" data-id="${group.id}" title="Delete this BoM" style="margin-left:8px">×</button>`
      : ''

    const pnInputHtml = canEdit()
      ? `<input class="cell-edit bom-aaw-pn-input" value="${esc(group.pn || '')}"
          data-action="bom-aaw-upd-pn" data-id="${group.id}"
          placeholder="Part Number" style="font-weight:500;font-size:13px;width:140px;flex-shrink:0;background:transparent;border:1px solid var(--line);border-radius:4px;padding:4px 8px;margin-left:12px">`
      : (group.pn ? `<span class="bom-aaw-pn-display" style="font-weight:500;font-size:13px;color:var(--mid);margin-left:12px">PN: ${esc(group.pn)}</span>` : '')

    return `<div class="card bom-tree-card" style="margin-bottom:16px">
      <div class="card-head" style="padding:12px 14px">
        <span class="bom-tree-icon" style="margin-right:8px">🔧</span>
        <input class="cell-edit bom-aaw-title-input" value="${esc(group.title)}"
          data-action="bom-aaw-upd-title" data-id="${group.id}"
          placeholder="BoM name (e.g. AAW Gearbox)" style="font-weight:600;font-size:15px;flex:1;min-width:0;background:transparent;border:none;padding:0">
        ${pnInputHtml}
        ${statsPillsHtml}
        ${delBtnHtml}
        <div class="bom-tree-row-actions" style="flex-shrink:0;margin-left:8px">${rootAddHtml}</div>
      </div>
      <div class="bom-tree-children bom-tree-root-children">
        ${childrenHtml}
      </div>
    </div>`
  }).join('')

  return `<div class="bom-register-wrap">
    <div style="margin-bottom:16px">${addGroupBtn}</div>
    ${groupsHtml}
  </div>`
}

npi.bom._renderAawTreeChildren = function(nodes, groupId, depth) {
  return nodes.map(n => npi.bom._renderAawTreeNode(n, groupId, depth)).join('')
}

npi.bom._renderAawTreeNode = function(node, groupId, depth) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded  = bomAawTreeExpanded.has(node.id)
  const canAddKids  = depth < MAX_TREE_DEPTH

  const toggleHtml = node.nodeType === 'subassembly'
    ? `<button class="bom-tree-toggle" data-action="bom-aaw-tree-toggle" data-id="${node.id}" aria-label="${isExpanded ? 'Collapse' : 'Expand'}">${isExpanded ? '▾' : '▶'}</button>`
    : `<span class="bom-tree-toggle bom-tree-toggle--leaf"></span>`

  const icon = node.nodeType === 'subassembly' ? '📦' : '🔩'

  // ABC class badge for parts
  let abcClassHtml = ''
  if (node.nodeType === 'part' && node.abcCatalogueId) {
    const cat = abcCatalogueData.find(c => c.id === node.abcCatalogueId)
    const abcClass = cat ? cat.abc_class : null
    if (abcClass) {
      abcClassHtml = `<span class="abc-badge abc-${abcClass}" style="margin-right:8px">${abcClass}</span>`
    }
  }

  const qtyHtml = `<input type="number" class="bom-tree-qty" min="0" step="0.01"
    value="${node.qty != null ? node.qty : 1}"
    data-action="bom-aaw-tree-upd-qty" data-id="${node.id}" data-group="${groupId}"
    title="Quantity">`

  const descHtml = canEdit() && node.nodeType === 'subassembly'
    ? `<input class="bom-tree-desc-input" value="${esc(node.desc || '')}"
        data-action="bom-aaw-tree-upd-desc" data-id="${node.id}" data-group="${groupId}"
        placeholder="Description">`
    : `<span class="bom-tree-desc">${esc(node.desc) || '<span style="color:var(--muted)">No description</span>'}</span>`

  const addHtml = canEdit() && node.nodeType === 'subassembly' && canAddKids ? `
    <button class="btn btn-ghost btn-xs bom-tree-add-btn" data-action="bom-aaw-tree-add-part" data-group="${groupId}" data-parent="${node.id}">＋ Part</button>
    <button class="btn btn-ghost btn-xs bom-tree-add-btn" data-action="bom-aaw-tree-add-subasm" data-group="${groupId}" data-parent="${node.id}">＋ Sub-Asm</button>` : ''

  const delHtml = canEdit()
    ? `<button class="del-btn bom-tree-del" data-action="bom-aaw-tree-del-node" data-id="${node.id}" data-group="${groupId}" title="Remove">×</button>`
    : ''

  const childrenHtml = node.nodeType === 'subassembly'
    ? `<div class="bom-tree-children${isExpanded ? '' : ' bom-tree-children--collapsed'}" data-parent="${node.id}">
        ${hasChildren ? npi.bom._renderAawTreeChildren(node.children, groupId, depth + 1) : `<div class="bom-tree-empty-slot">${canEdit() ? 'Empty — add parts or sub-assemblies' : 'Empty'}</div>`}
       </div>`
    : ''

  return `<div class="bom-tree-item" style="--depth:${depth}">
    <div class="bom-tree-row">
      ${toggleHtml}
      <span class="bom-tree-icon">${icon}</span>
      <span class="bom-tree-pn">${esc(node.pn) || '<span class="bom-tree-no-pn">—</span>'}</span>
      ${abcClassHtml}
      ${descHtml}
      ${qtyHtml}
      <span class="bom-tree-unit">${esc(node.unit || 'ea')}</span>
      <div class="bom-tree-row-actions">${addHtml}${delHtml}</div>
    </div>
    ${childrenHtml}
  </div>`
}

npi.bom.addAawGroup = function() {
  npi.data.bom.addAawGroup()
}

npi.bom.delAawGroup = function(id) {
  if (!confirm('Delete this BoM and all its parts? This cannot be undone.')) return
  npi.data.bom.delAawGroup(id)
}

npi.bom.toggleAawTreeNode = function(id) {
  if (bomAawTreeExpanded.has(id)) bomAawTreeExpanded.delete(id)
  else bomAawTreeExpanded.add(id)
  render()
}

npi.bom.openAawAddPart = async function(groupId, parentId) {
  const p = prog()
  if (!p) return
  bomAawActiveGroupId = groupId
  bomAawGroupParentId = parentId || null
  abcPickTarget       = { progId: p.id, type: 'aaw_tree', groupId, parentId: parentId || null }
  abcPickResults      = []
  abcPickSelected     = []
  abcPickLoading      = true
  abcPickSearch       = ''
  abcPickClassFilter  = 'all'
  const searchEl = document.getElementById('abcPickSearchInput')
  if (searchEl) searchEl.value = ''
  showModal('modalABCPick')
  npi.bom._refreshAbcPickBtn()
  abcPickResults = await npiRelFetchABCCatalogue()
  abcPickLoading = false
  const listEl = document.getElementById('abcPickList')
  if (listEl) listEl.innerHTML = npi.bom.renderABCPickList()
}

npi.bom.openAawAddSubAsm = function(groupId, parentId) {
  bomAawActiveGroupId = groupId
  bomAawGroupParentId = parentId || null
  const pnEl   = document.getElementById('bomTreeSubAsmPn')
  const descEl = document.getElementById('bomTreeSubAsmDesc')
  if (pnEl)   pnEl.value   = ''
  if (descEl) descEl.value = ''
  showModal('modalBomTreeSubAsm')
}

npi.bom.updAawTreeNodeQty = function(id, groupId, v) {
  npi.data.bom.updAawTreeNode(groupId, id, 'qty', parseFloat(v) || 0)
}

npi.bom.updAawTreeNodeDesc = function(id, groupId, v) {
  npi.data.bom.updAawTreeNode(groupId, id, 'desc', v)
}

npi.bom.delAawTreeNode = function(id, groupId) {
  npi.data.bom.delAawTreeNode(groupId, id)
}

npi.bom.confirmABCPick = function() {
  const p = prog()
  if (!p || !abcPickSelected.length) return

  // AAW/Repair tree context
  if (abcPickTarget && abcPickTarget.type === 'aaw_tree') {
    abcPickSelected.forEach(catId => {
      const src = abcPickResults.find(r => r.id === catId)
      if (!src) return
      npi.data.bom.addAawTreeNode(abcPickTarget.groupId, abcPickTarget.parentId, 'part', {
        pn: src.pn || '',
        desc: src.item_desc || '',
        unit: src.unit || 'ea',
        qty: 1,
        abcCatalogueId: src.id
      })
    })
    abcPickSelected = []
    npi.notify('render')
    closeModal('modalABCPick')
    return
  }

  // Main structure tree context
  if (abcPickTarget && abcPickTarget.type === 'tree') {
    abcPickSelected.forEach(catId => {
      const src = abcPickResults.find(r => r.id === catId)
      if (!src) return
      npi.data.bom.addTreeNode(abcPickTarget.parentId, 'part', {
        pn: src.pn || '',
        desc: src.item_desc || '',
        unit: src.unit || 'ea',
        qty: 1,
        abcCatalogueId: src.id
      })
    })
    abcPickSelected = []
    npi.notify('render')
    closeModal('modalABCPick')
    return
  }

  // Parts tab context — original behaviour
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
