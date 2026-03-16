// ═══════════════════════════════════
// bom-cclass.js — ABC Parts Catalogue management
// Central source of truth for A-Class, B-Class, and C-Class parts
// Depends on: state.js, helpers.js, npi-data-relational.js
// All functions under npi.bom.*
// ═══════════════════════════════════

let abcInlineSaveTimer = null
const ABC_CATALOGUE_CHANNEL = 'abc_catalogue_channel'

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
        (r.pn || '').toLowerCase().includes(searchTerm) ||
        (r.supplier_pn || '').toLowerCase().includes(searchTerm) ||
        (r.manufacturer || '').toLowerCase().includes(searchTerm) ||
        (r.manufacturer_pn || '').toLowerCase().includes(searchTerm)
      )
    : abcCatalogueData

  if (abcCatalogueClassFilter !== 'all') {
    filtered = filtered.filter(r => r.abc_class === abcCatalogueClassFilter)
  }

  // Combined toolbar: class filter + search input + info + add button all inline
  const toolbar = `<div class="bom-abc-filter-row" style="margin-bottom:14px">
    <span class="bom-abc-filter-label">Class:</span>
    ${['all','A','B','C'].map(cls =>
      `<button class="bom-abc-chip${abcCatalogueClassFilter === cls ? ' active' : ''}"
        onclick="abcCatalogueClassFilter='${cls}';render()">${cls === 'all' ? 'All' : cls}</button>`
    ).join('')}
    <input type="text" class="cell-edit" id="abcCatalogueSearch" value="${esc(abcCatalogueSearch)}"
      oninput="npi.bom.setABCSearch(this.value);render()"
      placeholder="Search by PN, manufacturer PN, or description…" style="flex:1;min-width:160px;max-width:260px;margin-left:4px">
    <span style="margin-left:auto;display:flex;gap:6px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="npi.bom.showAbcInfo()">What are A / B / C? ℹ</button>
      <button class="btn btn-primary btn-sm" onclick="npi.bom.openABCNew()">＋ Add Part</button>
    </span>
  </div>`

  const stats = `<div style="display:flex;gap:8px;margin-bottom:10px">
    <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${filtered.length} part${filtered.length !== 1 ? 's' : ''}</span>
  </div>`

  const tableRows = filtered.length === 0
    ? `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">${abcCatalogueData.length === 0 ? 'No parts yet. Click ＋ Add Part to start building the catalogue.' : 'No parts match the current filter.'}</td></tr>`
    : filtered.map(r => {
      const i = abcCatalogueData.indexOf(r)
      return `<tr>
        <td class="w110"><input class="cell-edit mono" value="${esc(r.pn || '')}"
          onchange="npi.bom.updABCInline(${i}, 'pn', this.value)" placeholder="Tidyco PN" style="width:100%"></td>
        <td class="w60 ctr">
          <select class="abc-class-select abc-${r.abc_class || 'C'}"
            onchange="npi.bom.updABCInline(${i}, 'abc_class', this.value); this.className='abc-class-select abc-' + this.value">
            <option value="A" ${(r.abc_class||'C')==='A'?'selected':''}>A</option>
            <option value="B" ${(r.abc_class||'C')==='B'?'selected':''}>B</option>
            <option value="C" ${(r.abc_class||'C')==='C'?'selected':''}>C</option>
          </select>
        </td>
        <td class="bom-col-desc"><input class="cell-edit" value="${esc(r.item_desc || '')}"
          onchange="npi.bom.updABCInline(${i}, 'item_desc', this.value)" placeholder="Description" style="width:100%"></td>
        <td class="w60"><input class="cell-edit" value="${esc(r.unit || 'ea')}"
          onchange="npi.bom.updABCInline(${i}, 'unit', this.value)" placeholder="ea" style="width:100%"></td>
        <td class="w110"><input class="cell-edit" value="${esc(r.manufacturer || '')}"
          onchange="npi.bom.updABCInline(${i}, 'manufacturer', this.value)" placeholder="Manufacturer (OEM)" style="width:100%"></td>
        <td class="w110"><input class="cell-edit mono" value="${esc(r.manufacturer_pn || '')}"
          onchange="npi.bom.updABCInline(${i}, 'manufacturer_pn', this.value)" placeholder="Manufacturer PN" style="width:100%"></td>
        <td class="w44 ctr"><input type="checkbox" ${r.in_sage ? 'checked' : ''}
          onchange="npi.bom.updABCInline(${i}, 'in_sage', this.checked)"
          style="accent-color:var(--green);width:15px;height:15px;cursor:pointer" title="Part in Sage (MRP)"></td>
        <td class="ctr" style="white-space:nowrap;padding:2px 4px"><button class="btn btn-ghost btn-sm" onclick="npi.bom.openABCEdit(${i})" title="Edit details" style="padding:1px 4px;font-size:12px">✏️</button></td>
      </tr>`
    }).join('')

  const table = `<div style="overflow-x:auto">
    <table class="tbl bom-tbl abc-catalogue-tbl abc-tbl-compact" style="table-layout:fixed;width:auto">
      <colgroup>
        <col style="width:150px">
        <col style="width:80px">
        <col style="width:140px">
        <col style="width:80px">
        <col style="width:170px">
        <col style="width:170px">
        <col style="width:70px">
        <col style="width:44px">
      </colgroup>
      <thead>${npi.components.tableHeader([{ label: 'Tidyco PN' }, { label: 'Class' }, { label: 'Description' }, { label: 'Units' }, { label: 'Manufacturer OEM' }, { label: 'Manufacturer PN' }, { label: 'In Sage' }, { label: '' }])}</thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>`

  return `<div style="width:fit-content;min-width:600px">${toolbar}${stats}<div class="card">${table}</div></div>`
}

npi.bom.loadABCCatalogue = function() {
  return npiRelFetchABCCatalogue()
    .then(results => {
      abcCatalogueData = results || []
      npi.bom.subscribeABCCatalogue()
    })
    .catch(err => {
      console.error('[NPI] Failed to load ABC catalogue:', err)
      abcCatalogueData = []
    })
}

npi.bom.subscribeABCCatalogue = function() {
  createRealtimeSubscription('abc_catalogue', ABC_CATALOGUE_CHANNEL, {
    onInsert: (row) => {
      // Avoid duplicates
      if (!abcCatalogueData.find(r => r.id === row.id)) {
        abcCatalogueData.push(row)
        if (currentSection === 'projects' && npiDashboardTab === 'abc-catalogue') {
          render()
        }
      }
    },
    onUpdate: (row) => {
      const idx = abcCatalogueData.findIndex(r => r.id === row.id)
      if (idx >= 0) {
        abcCatalogueData[idx] = row
        if (currentSection === 'projects' && npiDashboardTab === 'abc-catalogue') {
          render()
        }
      }
    },
    onDelete: (row) => {
      abcCatalogueData = abcCatalogueData.filter(r => r.id !== row.id)
      if (currentSection === 'projects' && npiDashboardTab === 'abc-catalogue') {
        render()
      }
    }
  })
}

window.unsubscribeABCCatalogue = function() {
  removeRealtimeSubscription(ABC_CATALOGUE_CHANNEL)
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
  document.getElementById('abcEditForm_manufacturer').value = ''
  document.getElementById('abcEditForm_manufacturerPn').value = ''
  document.getElementById('abcEditForm_datasheetUrl').value = ''
  document.getElementById('abcEditForm_deleteBtn').style.display = 'none'
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
  document.getElementById('abcEditForm_manufacturer').value = entry.manufacturer || ''
  document.getElementById('abcEditForm_manufacturerPn').value = entry.manufacturer_pn || ''
  document.getElementById('abcEditForm_datasheetUrl').value = entry.datasheet_url || ''
  document.getElementById('abcEditForm_deleteBtn').style.display = ''
  showModal('modalABCEdit')
}

npi.bom.deleteFromModal = async function() {
  const entry = abcCatalogueData[abcEditTarget]
  if (!entry) return
  if (!confirm(`Delete "${entry.item_desc}" from the parts catalogue?\n\nThis cannot be undone.`)) return
  closeModal('modalABCEdit')
  await npiRelDeleteABCCatalogueEntry(entry.id)
  abcCatalogueLoaded = false
  render()
}

npi.bom.saveABCEdit = async function() {
  const pn = document.getElementById('abcEditForm_pn').value.trim()
  const desc = document.getElementById('abcEditForm_desc').value.trim()
  const supplierPn = document.getElementById('abcEditForm_supplierPn').value.trim()
  const unit = document.getElementById('abcEditForm_unit').value.trim()
  const abcClass = document.getElementById('abcEditForm_class').value || 'C'
  const inSage = document.getElementById('abcEditForm_inSage').checked
  const notes = document.getElementById('abcEditForm_notes').value.trim()
  const manufacturer = document.getElementById('abcEditForm_manufacturer').value.trim()
  const manufacturerPn = document.getElementById('abcEditForm_manufacturerPn').value.trim()
  const datasheetUrl = document.getElementById('abcEditForm_datasheetUrl').value.trim()

  if (!pn) {
    showToast('Tidyco Part Number is required', 'warning')
    return
  }
  if (!desc) {
    showToast('Description is required', 'warning')
    return
  }

  const entry = {
    pn,
    item_desc: desc,
    supplier_pn: supplierPn || null,
    unit: unit || 'ea',
    abc_class: abcClass,
    in_sage: inSage,
    notes: notes || '',
    manufacturer: manufacturer || null,
    manufacturer_pn: manufacturerPn || null,
    datasheet_url: datasheetUrl || null
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
    showToast('Failed to save catalogue entry. Check if PN already exists.', 'error')
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

npi.bom.openABCDatasheetLink = function() {
  const urlInput = document.getElementById('abcEditForm_datasheetUrl')
  if (!urlInput) return

  const rawUrl = urlInput.value.trim()
  if (!rawUrl) {
    showToast('Enter a datasheet URL first', 'warning')
    return
  }

  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  try {
    const parsed = new URL(normalizedUrl)
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
  } catch (err) {
    console.error('[NPI] Invalid datasheet URL:', err)
    showToast('Enter a valid URL', 'warning')
  }
}

// ── Inline cell editing ──────────────────────────────────
npi.bom.updABCInline = function(i, field, value) {
  const entry = abcCatalogueData[i]
  if (!entry) return
  entry[field] = value
  clearTimeout(abcInlineSaveTimer)
  abcInlineSaveTimer = setTimeout(async () => {
    await npiRelSaveABCCatalogueEntry(entry)
  }, 800)
}
