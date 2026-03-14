// ═══════════════════════════════════
// bom-cclass.js — ABC Parts Catalogue management
// Central source of truth for A-Class, B-Class, and C-Class parts
// Depends on: state.js, helpers.js, npi-data-relational.js
// All functions under npi.bom.*
// ═══════════════════════════════════

npi.bom.renderABCCatalogue = function() {
  // Load data on first render (asynchronously in background)
  if (!abcCatalogueLoaded && !abcCatalogueLoading) {
    abcCatalogueLoading = true
    Promise.resolve().then(() => npi.bom.loadABCCatalogue()).then(() => {
      abcCatalogueLoaded = true
      abcCatalogueLoading = false
      render() // Re-render when data is loaded
    }).catch(err => {
      console.error('[NPI] Failed to load ABC catalogue:', err)
      abcCatalogueLoading = false
      abcCatalogueLoaded = true // Mark as loaded to prevent retry spam
      render()
    })
  }

  // Apply filters
  const searchTerm = (abcCatalogueSearch || '').toLowerCase()
  let filtered = searchTerm
    ? abcCatalogueData.filter(r =>
        (r.item_desc || '').toLowerCase().includes(searchTerm) ||
        (r.pn || '').toLowerCase().includes(searchTerm)
      )
    : abcCatalogueData

  if (abcCatalogueClassFilter !== 'all') {
    filtered = filtered.filter(r => r.abc_class === abcCatalogueClassFilter)
  }

  const stats = `<div style="display:flex;gap:8px;margin-bottom:14px">
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${filtered.length} part${filtered.length !== 1 ? 's' : ''}</span>
  </div>`

  const classFilterBar = `<div class="bom-abc-filter-row" style="margin-bottom:12px">
    <span class="bom-abc-filter-label">Class:</span>
    ${['all','A','B','C'].map(cls =>
      `<button class="bom-abc-chip${abcCatalogueClassFilter === cls ? ' active' : ''}"
        onclick="abcCatalogueClassFilter='${cls}';render()">${cls === 'all' ? 'All' : cls}</button>`
    ).join('')}
  </div>`

  const searchBox = `<div style="margin-bottom:12px">
    <input type="text" class="cell-edit" id="abcCatalogueSearch" value="${esc(abcCatalogueSearch)}"
      oninput="npi.bom.setABCSearch(this.value);render()"
      placeholder="Search by description or PN…" style="width:100%;max-width:300px">
  </div>`

  const tableRows = filtered.length === 0
    ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted)">No parts in catalogue</td></tr>'
    : filtered.map((r, i) => {
      const inSageBadge = r.in_sage
        ? '<span style="color:var(--green);font-weight:bold">✓ Sage</span>'
        : '<span style="color:var(--muted)">—</span>'
      const classBadge = `<span class="abc-badge abc-${r.abc_class}">${r.abc_class}</span>`
      return `<tr>
        <td class="bom-col-desc"><strong>${esc(r.item_desc)}</strong></td>
        <td class="w100"><code>${esc(r.pn || '—')}</code></td>
        <td class="w100"><code>${esc(r.supplier_pn || '—')}</code></td>
        <td class="w60">${esc(r.unit || 'ea')}</td>
        <td class="w80 ctr">${inSageBadge}</td>
        <td class="w60 ctr">${classBadge}</td>
        <td class="w80 ctr" style="display:flex;gap:4px;justify-content:center">
          <button class="btn-icon" onclick="npi.bom.openABCEdit(${i})" title="Edit">✎</button>
          <button class="btn-icon del-btn" onclick="npi.bom.delABCEntry(${i})" title="Delete">×</button>
        </td>
      </tr>`
    }).join('')

  const table = `<div style="overflow-x:auto">
    <table class="tbl bom-tbl abc-catalogue-tbl" style="min-width:700px">
      <thead>${npi.components.tableHeader([{ label: 'Description' }, { label: 'PN' }, { label: 'Supplier PN' }, { label: 'Unit' }, { label: 'In Sage' }, { label: 'Class' }, { label: '' }])}</thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>`

  return `${stats}${classFilterBar}${searchBox}
    <div class="card">
      <div class="card-head">
        <span class="card-title">📦 Parts Catalogue</span>
        <span class="card-meta">A, B & C-Class central source</span>
        <button class="btn btn-ghost btn-sm" onclick="npi.bom.showAbcInfo()" style="margin-left:auto;margin-right:8px">What are A / B / C? ℹ</button>
        <button class="btn btn-primary btn-sm" onclick="npi.bom.openABCNew()">＋ Add Part</button>
      </div>
      ${filtered.length === 0 && abcCatalogueData.length === 0
        ? '<div style="padding:20px;text-align:center;color:var(--muted)">No parts yet. Click ＋ Add Part to start building the catalogue.</div>'
        : table
      }
    </div>`
}

npi.bom.loadABCCatalogue = function() {
  return npiRelFetchABCCatalogue()
    .then(results => {
      abcCatalogueData = results || []
    })
    .catch(err => {
      console.error('[NPI] Failed to load ABC catalogue:', err)
      abcCatalogueData = []
    })
}

npi.bom.setABCSearch = function(val) {
  abcCatalogueSearch = val
}

// ── Add / Edit / Delete ──────────────────────────────
npi.bom.openABCNew = function() {
  abcEditTarget = null
  document.getElementById('abcEditForm_pn').value = ''
  document.getElementById('abcEditForm_desc').value = ''
  document.getElementById('abcEditForm_supplierPn').value = ''
  document.getElementById('abcEditForm_unit').value = 'ea'
  document.getElementById('abcEditForm_class').value = 'C'
  document.getElementById('abcEditForm_inSage').checked = false
  document.getElementById('abcEditForm_notes').value = ''
  showModal('modalABCEdit')
}

npi.bom.openABCEdit = function(i) {
  const entry = abcCatalogueData[i]
  if (!entry) return
  abcEditTarget = i
  document.getElementById('abcEditForm_pn').value = entry.pn || ''
  document.getElementById('abcEditForm_desc').value = entry.item_desc || ''
  document.getElementById('abcEditForm_supplierPn').value = entry.supplier_pn || ''
  document.getElementById('abcEditForm_unit').value = entry.unit || 'ea'
  document.getElementById('abcEditForm_class').value = entry.abc_class || 'C'
  document.getElementById('abcEditForm_inSage').checked = entry.in_sage || false
  document.getElementById('abcEditForm_notes').value = entry.notes || ''
  showModal('modalABCEdit')
}

npi.bom.saveABCEdit = async function() {
  const pn = document.getElementById('abcEditForm_pn').value.trim()
  const desc = document.getElementById('abcEditForm_desc').value.trim()
  const supplierPn = document.getElementById('abcEditForm_supplierPn').value.trim()
  const unit = document.getElementById('abcEditForm_unit').value.trim()
  const abcClass = document.getElementById('abcEditForm_class').value || 'C'
  const inSage = document.getElementById('abcEditForm_inSage').checked
  const notes = document.getElementById('abcEditForm_notes').value.trim()

  if (!pn) {
    alert('Part Number (PN) is required')
    return
  }
  if (!desc) {
    alert('Description is required')
    return
  }

  const entry = {
    pn,
    item_desc: desc,
    supplier_pn: supplierPn || null,
    unit: unit || 'ea',
    abc_class: abcClass,
    in_sage: inSage,
    notes: notes || ''
  }

  // If editing, include the ID
  if (abcEditTarget !== null && abcCatalogueData[abcEditTarget]) {
    entry.id = abcCatalogueData[abcEditTarget].id
  }

  const saved = await npiRelSaveABCCatalogueEntry(entry)
  if (saved) {
    // Reload and re-render
    abcCatalogueLoaded = false
    closeModal('modalABCEdit')
    render()
  } else {
    alert('Failed to save catalogue entry. Check if PN already exists.')
  }
}

npi.bom.delABCEntry = async function(i) {
  const entry = abcCatalogueData[i]
  if (!entry) return
  if (!confirm(`Delete "${esc(entry.item_desc)}" from catalogue?`)) return

  await npiRelDeleteABCCatalogueEntry(entry.id)
  // Reload and re-render
  abcCatalogueLoaded = false
  render()
}

npi.bom.cancelABCEdit = function() {
  abcEditTarget = null
  closeModal('modalABCEdit')
}
