// ═══════════════════════════════════
// parts-database.js — standalone Parts Database subsystem
// Product Development owns the catalogue UI; NPI consumes it through wrappers
// ═══════════════════════════════════

window.partsDatabase = window.partsDatabase || {}

;(function() {
  const partsDb = window.partsDatabase
  const channel = 'abc_catalogue_channel'
  let inlineSaveTimer = null
  let usageCache = {}

  function getFilteredRows() {
    const searchTerm = (abcCatalogueSearch || '').toLowerCase()
    let filtered = searchTerm
      ? abcCatalogueData.filter((row) =>
        (row.item_desc || '').toLowerCase().includes(searchTerm) ||
        (row.pn || '').toLowerCase().includes(searchTerm) ||
        (row.supplier_pn || '').toLowerCase().includes(searchTerm) ||
        (row.manufacturer || '').toLowerCase().includes(searchTerm) ||
        (row.manufacturer_pn || '').toLowerCase().includes(searchTerm)
      )
      : [...abcCatalogueData]

    if (abcCatalogueClassFilter !== 'all') {
      filtered = filtered.filter((row) => row.abc_class === abcCatalogueClassFilter)
    }

    const sortField = abcCatalogueSort.field
    const ascending = abcCatalogueSort.ascending
    filtered.sort((a, b) => {
      let valA = a[sortField] || ''
      let valB = b[sortField] || ''
      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()
      if (valA < valB) return ascending ? -1 : 1
      if (valA > valB) return ascending ? 1 : -1
      return 0
    })

    return filtered
  }

  function shouldRefreshActiveView() {
    if (currentSection === 'product-development' && productDevelopmentTab === 'parts-database') {
      return true
    }

    if (currentSection === 'projects' && npiDashboardTab === 'abc-catalogue') {
      return true
    }

    return !!document.getElementById('abcCatalogueResults')
  }

  function getSortIcon(field) {
    if (abcCatalogueSort.field !== field) return '↕'
    return abcCatalogueSort.ascending ? '↑' : '↓'
  }

  function toggleSort(field) {
    if (abcCatalogueSort.field === field) {
      abcCatalogueSort.ascending = !abcCatalogueSort.ascending
    } else {
      abcCatalogueSort.field = field
      abcCatalogueSort.ascending = true
    }
    partsDb.refreshCatalogueResults()
  }

  function renderTableHeader() {
    const sortableClass = 'abc-sortable-header'
    return `
      <tr>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('pn')" style="cursor:pointer">Tidyco PN ${getSortIcon('pn')}</th>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('abc_class')" style="cursor:pointer;width:80px">Class ${getSortIcon('abc_class')}</th>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('item_desc')" style="cursor:pointer">Description ${getSortIcon('item_desc')}</th>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('unit')" style="cursor:pointer;width:80px">Units ${getSortIcon('unit')}</th>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('manufacturer')" style="cursor:pointer">Manufacturer OEM ${getSortIcon('manufacturer')}</th>
        <th class="${sortableClass}" onclick="partsDatabase.toggleSort('manufacturer_pn')" style="cursor:pointer">Manufacturer PN ${getSortIcon('manufacturer_pn')}</th>
        <th style="width:70px">In Sage</th>
        <th style="width:70px">Used In</th>
        <th style="width:44px"></th>
      </tr>
    `
  }

  function getPickAlreadyAddedIds() {
    if (!abcPickTarget || typeof abcPickTarget.getAlreadyAddedIds !== 'function') {
      return new Set()
    }

    const value = abcPickTarget.getAlreadyAddedIds()
    if (value instanceof Set) return value
    return new Set(value || [])
  }

  partsDb.renderCatalogueResults = function() {
    const filtered = getFilteredRows()

    const stats = `<div style="display:flex;gap:8px;margin-bottom:10px">
      <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid)">${filtered.length} part${filtered.length !== 1 ? 's' : ''}</span>
    </div>`

    const tableRows = filtered.length === 0
      ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted)">${abcCatalogueData.length === 0 ? 'No parts yet. Click ＋ Add Part to start building the catalogue.' : 'No parts match the current filter.'}</td></tr>`
      : filtered.map((row) => {
        const index = abcCatalogueData.indexOf(row)
        const usageCount = usageCache[row.id] !== undefined ? usageCache[row.id] : '-'

        return `<tr>
          <td class="w110"><input class="cell-edit mono" value="${esc(row.pn || '')}"
            onchange="partsDatabase.updateInline(${index}, 'pn', this.value)" placeholder="Tidyco PN" style="width:100%"></td>
          <td class="w60 ctr">
            <select class="abc-class-select abc-${row.abc_class || 'C'}"
              onchange="partsDatabase.updateInline(${index}, 'abc_class', this.value); this.className='abc-class-select abc-' + this.value">
              <option value="A" ${(row.abc_class || 'C') === 'A' ? 'selected' : ''}>A</option>
              <option value="B" ${(row.abc_class || 'C') === 'B' ? 'selected' : ''}>B</option>
              <option value="C" ${(row.abc_class || 'C') === 'C' ? 'selected' : ''}>C</option>
            </select>
          </td>
          <td class="bom-col-desc"><input class="cell-edit" value="${esc(row.item_desc || '')}"
            onchange="partsDatabase.updateInline(${index}, 'item_desc', this.value)" placeholder="Description" style="width:100%"></td>
          <td class="w60"><input class="cell-edit" value="${esc(row.unit || 'ea')}"
            onchange="partsDatabase.updateInline(${index}, 'unit', this.value)" placeholder="ea" style="width:100%"></td>
          <td class="w110"><input class="cell-edit" value="${esc(row.manufacturer || '')}"
            onchange="partsDatabase.updateInline(${index}, 'manufacturer', this.value)" placeholder="Manufacturer (OEM)" style="width:100%"></td>
          <td class="w110"><input class="cell-edit mono" value="${esc(row.manufacturer_pn || '')}"
            onchange="partsDatabase.updateInline(${index}, 'manufacturer_pn', this.value)" placeholder="Manufacturer PN" style="width:100%"></td>
          <td class="w44 ctr"><input type="checkbox" ${row.in_sage ? 'checked' : ''}
            onchange="partsDatabase.updateInline(${index}, 'in_sage', this.checked)"
            style="accent-color:var(--green);width:15px;height:15px;cursor:pointer" title="Part in Sage (MRP)"></td>
          <td class="w60 ctr" style="cursor:pointer" onclick="partsDatabase.showWhereUsed('${row.id}')" title="Click to see where used">
            <span class="flag bom-summary-pill" style="background:var(--bg);border:1px solid var(--line);color:var(--mid);font-size:11px;padding:2px 6px" data-usage-id="${row.id}">${usageCount}</span>
          </td>
          <td class="ctr" style="white-space:nowrap;padding:2px 4px">${canEdit() ? `<button class="btn btn-ghost btn-sm" onclick="partsDatabase.openEdit(${index})" title="Edit details" style="padding:1px 4px;font-size:12px">✏️</button>` : ''}</td>
        </tr>`
      }).join('')

    const table = `<div style="overflow-x:auto">
      <table class="tbl bom-tbl abc-catalogue-tbl abc-tbl-compact" style="table-layout:fixed;width:auto">
        <colgroup>
          <col style="width:150px">
          <col style="width:80px">
          <col style="width:350px">
          <col style="width:80px">
          <col style="width:170px">
          <col style="width:170px">
          <col style="width:70px">
          <col style="width:70px">
          <col style="width:44px">
        </colgroup>
        <thead>${renderTableHeader()}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`

    return `${stats}<div class="card">${table}</div>`
  }

  partsDb.refreshCatalogueResults = function() {
    const resultsEl = document.getElementById('abcCatalogueResults')
    if (!resultsEl) return

    resultsEl.innerHTML = partsDb.renderCatalogueResults()
    setTimeout(() => partsDb.loadPartUsageCounts(), 100)
  }

  partsDb.renderCatalogue = function() {
    if (!abcCatalogueLoaded && !abcCatalogueLoading) {
      abcCatalogueLoading = true
      Promise.resolve().then(() => partsDb.loadCatalogue()).then(() => {
        abcCatalogueLoaded = true
        abcCatalogueLoading = false
        render()
        setTimeout(() => partsDb.loadPartUsageCounts(), 200)
      }).catch((err) => {
        console.error('[Parts Database] Failed to load catalogue:', err)
        abcCatalogueLoading = false
        abcCatalogueLoaded = true
        render()
      })
    } else if (abcCatalogueLoaded) {
      setTimeout(() => partsDb.loadPartUsageCounts(), 100)
    }

    const toolbar = `<div class="bom-abc-filter-row" style="margin-bottom:14px">
      <span class="bom-abc-filter-label">Class:</span>
      ${['all', 'A', 'B', 'C'].map((cls) =>
        `<button class="bom-abc-chip${abcCatalogueClassFilter === cls ? ' active' : ''}"
          onclick="abcCatalogueClassFilter='${cls}';partsDatabase.refreshCatalogueResults()">${cls === 'all' ? 'All' : cls}</button>`
      ).join('')}
      <input type="text" class="cell-edit" id="abcCatalogueSearch" value="${esc(abcCatalogueSearch)}"
        oninput="partsDatabase.setSearch(this.value);partsDatabase.refreshCatalogueResults()"
        placeholder="Search by PN, manufacturer PN, or description…" style="flex:1;min-width:160px;max-width:260px;margin-left:4px">
      <span style="margin-left:auto;display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="partsDatabase.showInfo()">What are A / B / C? ℹ</button>
        ${canEdit() ? `<button class="btn btn-primary btn-sm" onclick="partsDatabase.openNew()">＋ Add Part</button>` : ''}
      </span>
    </div>`

    return `<div style="width:fit-content;min-width:600px">${toolbar}<div id="abcCatalogueResults">${partsDb.renderCatalogueResults()}</div></div>`
  }

  partsDb.renderPortal = function() {
    const loadingMsg = '<div style="padding:20px;text-align:center;color:var(--muted)">Loading catalogue...</div>'
    const catalogueHTML = partsDb.renderCatalogue() || loadingMsg

    return `
      <div class="proj-home">
        <div class="proj-home-header">
          <div>
            <div class="proj-home-title">Parts Database</div>
            <div class="proj-home-sub">A, B & C-Class central parts catalogue</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="parts-database" title="User Guide">❓ Guide</button>
            <button class="btn btn-ghost" data-action="pd-nav-root">← Back</button>
          </div>
        </div>
        ${catalogueHTML}
      </div>
    `
  }

  partsDb.loadCatalogue = function() {
    return partsDb.data.fetchCatalogue()
      .then((results) => {
        abcCatalogueData = results || []
        partsDb.subscribeCatalogue()
      })
      .catch((err) => {
        console.error('[Parts Database] Failed to load catalogue:', err)
        abcCatalogueData = []
      })
  }

  partsDb.subscribeCatalogue = function() {
    createRealtimeSubscription('abc_catalogue', channel, {
      onInsert: (row) => {
        if (!abcCatalogueData.find((entry) => entry.id === row.id)) {
          abcCatalogueData.push(row)
          if (shouldRefreshActiveView()) partsDb.refreshCatalogueResults()
        }
      },
      onUpdate: (row) => {
        const index = abcCatalogueData.findIndex((entry) => entry.id === row.id)
        if (index >= 0) {
          abcCatalogueData[index] = row
          usageCache[row.id] = undefined
          if (shouldRefreshActiveView()) partsDb.refreshCatalogueResults()
        }
      },
      onDelete: (row) => {
        abcCatalogueData = abcCatalogueData.filter((entry) => entry.id !== row.id)
        delete usageCache[row.id]
        if (shouldRefreshActiveView()) partsDb.refreshCatalogueResults()
      }
    })
  }

  partsDb.unsubscribeCatalogue = function() {
    removeRealtimeSubscription(channel)
  }

  partsDb.setSearch = function(value) {
    abcCatalogueSearch = value
  }

  partsDb.toggleSort = toggleSort

  partsDb.showInfo = function() {
    showModal('modalAbcInfo')
  }

  partsDb.setPickSearch = function(value) {
    abcPickSearch = value
  }

  partsDb.setPickClassFilter = function(value) {
    abcPickClassFilter = value || 'all'
  }

  partsDb.refreshPickButton = function() {
    const button = document.getElementById('abcPickAddBtn')
    if (!button) return

    const count = abcPickSelected.length
    button.textContent = count > 0 ? `Add ${count} Part${count !== 1 ? 's' : ''}` : 'Add Parts'
    button.disabled = count === 0
  }

  partsDb.renderPickList = function() {
    if (abcPickLoading) {
      return '<div class="skeleton-loader"><div class="skeleton-line" style="width:80%"></div><div class="skeleton-line" style="width:60%"></div><div class="skeleton-line" style="width:90%"></div></div>'
    }

    const searchTerm = (abcPickSearch || '').toLowerCase()
    let filtered = searchTerm
      ? abcPickResults.filter((row) =>
        (row.item_desc || '').toLowerCase().includes(searchTerm) ||
        (row.pn || '').toLowerCase().includes(searchTerm)
      )
      : abcPickResults

    if (abcPickClassFilter !== 'all') {
      filtered = filtered.filter((row) => row.abc_class === abcPickClassFilter)
    }

    if (!filtered.length) {
      return '<div style="padding:20px;text-align:center;color:var(--muted)">No parts found.</div>'
    }

    const alreadyAdded = getPickAlreadyAddedIds()

    return filtered.map((row) => {
      const index = abcPickResults.indexOf(row)
      const selected = abcPickSelected.includes(row.id)
      const added = alreadyAdded.has(row.id)
      const sageBadge = row.in_sage ? '<span style="color:var(--green);margin-left:4px">· Sage</span>' : ''
      const addedBadge = added ? '<span style="color:var(--muted);font-size:11px;margin-left:4px">· Already in BOM</span>' : ''

      return `
        <div class="bom-pick-item${selected ? ' selected' : ''}${added ? ' bom-pick-item--added' : ''}"
             onclick="partsDatabase.togglePick(${index})" style="cursor:pointer">
          <input type="checkbox" name="bom_abc_pick_${index}" ${selected || added ? 'checked' : ''} ${added ? 'disabled' : ''} style="pointer-events:none;margin-right:8px">
          <div style="flex:1;min-width:0">
            <div class="bom-pick-name">${row.pn ? esc(row.pn) + ' — ' : ''}${esc(row.item_desc)}${addedBadge}</div>
            <div class="bom-pick-meta">${esc(row.unit || 'ea')}${row.notes ? ' · ' + esc(row.notes) : ''}${sageBadge}</div>
          </div>
          <span class="abc-badge abc-${row.abc_class}">${row.abc_class}</span>
        </div>`
    }).join('')
  }

  partsDb.togglePick = function(index) {
    const row = abcPickResults[index]
    if (!row) return

    const alreadyAdded = getPickAlreadyAddedIds()
    if (alreadyAdded.has(row.id)) return

    if (abcPickSelected.includes(row.id)) {
      abcPickSelected = abcPickSelected.filter((id) => id !== row.id)
    } else {
      abcPickSelected.push(row.id)
    }

    const listEl = document.getElementById('abcPickList')
    if (listEl) listEl.innerHTML = partsDb.renderPickList()
    partsDb.refreshPickButton()
  }

  partsDb.openPick = async function(options) {
    const config = options || {}
    abcPickTarget = config
    abcPickResults = []
    abcPickSelected = []
    abcPickLoading = true
    abcPickSearch = ''
    abcPickClassFilter = 'all'

    const searchEl = document.getElementById('abcPickSearchInput')
    if (searchEl) searchEl.value = ''

    showModal('modalABCPick')
    partsDb.refreshPickButton()

    abcPickResults = await partsDb.data.fetchCatalogue()
    abcPickLoading = false

    const listEl = document.getElementById('abcPickList')
    if (listEl) listEl.innerHTML = partsDb.renderPickList()
  }

  partsDb.confirmPick = async function() {
    if (!abcPickTarget || !abcPickSelected.length) return

    const selectedRows = abcPickSelected
      .map((id) => abcPickResults.find((row) => row.id === id))
      .filter(Boolean)

    if (!selectedRows.length) return

    if (typeof abcPickTarget.onConfirm === 'function') {
      await Promise.resolve(abcPickTarget.onConfirm(selectedRows))
    }

    abcPickSelected = []
    partsDb.refreshPickButton()
    closeModal('modalABCPick')
  }

  partsDb.openNew = function() {
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

  partsDb.openEdit = function(index) {
    const entry = abcCatalogueData[index]
    if (!entry) return

    abcEditTarget = index
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

  partsDb.deleteFromModal = async function() {
    const entry = abcCatalogueData[abcEditTarget]
    if (!entry) return
    if (!confirm(`Delete "${entry.item_desc}" from the parts catalogue?\n\nThis cannot be undone.`)) return

    closeModal('modalABCEdit')
    await partsDb.data.deleteCatalogueEntry(entry.id)
    abcCatalogueLoaded = false
    render()
  }

  partsDb.saveEdit = async function() {
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

    const existingEntry = abcCatalogueData.find(
      (item) =>
        item.pn &&
        item.pn.toLowerCase() === pn.toLowerCase() &&
        (abcEditTarget === null || item.id !== abcCatalogueData[abcEditTarget].id)
    )
    if (existingEntry) {
      showToast('Part number "' + pn + '" already exists in the catalogue', 'error')
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

    if (abcEditTarget !== null && abcCatalogueData[abcEditTarget]) {
      entry.id = abcCatalogueData[abcEditTarget].id
    }

    const saved = await partsDb.data.saveCatalogueEntry(entry)
    if (saved) {
      usageCache = {}
      abcCatalogueLoaded = false
      closeModal('modalABCEdit')
      render()
      return
    }

    showToast('Failed to save catalogue entry. Check if PN already exists.', 'error')
  }

  partsDb.cancelEdit = function() {
    abcEditTarget = null
    closeModal('modalABCEdit')
  }

  partsDb.openDatasheetLink = function() {
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
      console.error('[Parts Database] Invalid datasheet URL:', err)
      showToast('Enter a valid URL', 'warning')
    }
  }

  partsDb.updateInline = function(index, field, value) {
    const entry = abcCatalogueData[index]
    if (!entry) return

    entry[field] = value
    clearTimeout(inlineSaveTimer)
    inlineSaveTimer = setTimeout(async () => {
      await partsDb.data.saveCatalogueEntry(entry)
      usageCache[entry.id] = undefined
    }, 800)
  }

  partsDb.loadPartUsageCounts = async function() {
    const visibleParts = getFilteredRows()

    visibleParts.forEach((part) => {
      if (usageCache[part.id] !== undefined) {
        const badge = document.querySelector(`[data-usage-id="${part.id}"]`)
        if (badge) badge.textContent = usageCache[part.id]
      }
    })

    const uncachedParts = visibleParts.filter((part) => usageCache[part.id] === undefined)
    if (uncachedParts.length === 0) return

    for (const part of uncachedParts) {
      try {
        const usage = await partsDb.data.fetchPartUsage(part.id)
        usageCache[part.id] = usage.length
        const badge = document.querySelector(`[data-usage-id="${part.id}"]`)
        if (badge) badge.textContent = usage.length
      } catch (err) {
        console.warn('Failed to load usage for part:', part.id, err)
        usageCache[part.id] = 0
        const badge = document.querySelector(`[data-usage-id="${part.id}"]`)
        if (badge) badge.textContent = '0'
      }
    }
  }

  partsDb.showWhereUsed = async function(partId) {
    const part = abcCatalogueData.find((row) => row.id === partId)
    if (!part) return

    const usage = await partsDb.data.fetchPartUsage(partId)
    const titleEl = document.getElementById('whereUsedTitle')
    const contentEl = document.getElementById('whereUsedContent')

    if (titleEl) {
      titleEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <span class="abc-badge abc-${part.abc_class || 'C'}">${part.abc_class || 'C'}</span>
          <span class="mono">${esc(part.pn || '')}</span>
          <span style="color:var(--muted)">—</span>
          <span>${esc(part.item_desc || '')}</span>
        </div>
      `
    }

    if (contentEl) {
      if (usage.length === 0) {
        contentEl.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px">Not used in any projects</p>'
      } else {
        const byProject = {}
        usage.forEach((item) => {
          if (!byProject[item.projectId]) {
            byProject[item.projectId] = {
              projectName: item.projectName,
              items: []
            }
          }
          byProject[item.projectId].items.push(item)
        })

        const rows = Object.values(byProject).map((project) => {
          const itemRows = project.items.map((item) => `
            <tr>
              <td style="padding:4px 8px;color:var(--muted);padding-left:16px">${esc(item.location)}</td>
              <td style="padding:4px 8px;text-align:right;width:60px">${item.qty}</td>
            </tr>
          `).join('')

          return `
            <tr style="background:var(--bg)">
              <td colspan="2" style="padding:8px;font-weight:500">${esc(project.projectName)}</td>
            </tr>
            ${itemRows}
          `
        }).join('')

        contentEl.innerHTML = `
          <table class="tbl" style="width:100%;font-size:13px">
            <thead>
              <tr>
                <th style="text-align:left">Location</th>
                <th style="text-align:right;width:60px">Qty</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);text-align:center;color:var(--muted);font-size:12px">
            ${usage.length} reference${usage.length !== 1 ? 's' : ''} across ${Object.keys(byProject).length} project${Object.keys(byProject).length !== 1 ? 's' : ''}
          </div>
        `
      }
    }

    showModal('modalWhereUsed')
  }

  partsDb.closeWhereUsed = function() {
    closeModal('modalWhereUsed')
  }
})()