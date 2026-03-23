// Production Batch Scheduling

let prodSchedulingSort = { field: 'start_date', ascending: true };
let prodSchedulingFilters = { family: '', product: '', workLocation: '', dateFrom: '', dateTo: '' };
let prodSchedulingHideComplete = localStorage.getItem('prodSchedulingHideComplete') === 'true';
let selectedBatchIds = new Set();

function flashSaved(el) {
  el.classList.add('cell-saved');
  setTimeout(() => el.classList.remove('cell-saved'), 1000);
}

function updateBulkToolbar() {
  const toolbar = document.getElementById('bulk-toolbar');
  const countEl = document.getElementById('bulk-count');
  if (!toolbar) return;
  if (selectedBatchIds.size > 0) {
    toolbar.classList.remove('hidden');
    if (countEl) countEl.textContent = `${selectedBatchIds.size} selected`;
  } else {
    toolbar.classList.add('hidden');
  }
}

function renderSchedulingNewRow() {
  // Defensive check: ensure prodState exists
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  
  return `
    <tr class="row-new" id="batch-new-row" style="background-color:var(--row-highlight-blue);border-top:2px solid var(--blue)">
      <td class="w28 ctr">+</td>
      <td>
        <select class="cell-edit" id="batch-new-product" data-field="product">
          <option value="">— Select Product</option>
          ${products.filter(p => p.status?.toLowerCase() !== 'closed').map(p => `<option value="${p.id}">${p.name} (${p.part_number || 'N/A'})</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="cell-display" id="batch-new-family">—</div>
      </td>
      <td>
        <div class="cell-display" id="batch-new-work-location">—</div>
      </td>
      <td><input class="cell-edit" id="batch-new-qty" type="number" placeholder="Qty" data-field="qty"></td>
      <td>
        <input class="cell-edit" id="batch-new-start" placeholder="DD/MM/YYYY" data-field="start">
      </td>
      <td>
        <input class="cell-edit" id="batch-new-due" placeholder="DD/MM/YYYY" data-field="due">
      </td>
      <td>
        <select class="cell-edit" id="batch-new-status" data-field="status">
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>
      </td>
      <td><textarea class="cell-edit" id="batch-new-notes" placeholder="Notes" data-field="notes"></textarea></td>
      <td class="w28 ctr"><button class="btn-del" id="batch-new-save" title="Save (Ctrl+Enter)">✓</button></td>
    </tr>
  `;
}

function addSchedulingNewRowEventListeners() {
  document.getElementById('batch-new-product').addEventListener('change', () => {
    calcBatchDueDate();
    updateFamilyDisplay('new');
    autoPopulateWorkLocation();
  });
  document.getElementById('batch-new-start').addEventListener('change', calcBatchDueDate);
  document.getElementById('batch-new-start').addEventListener('blur', () => smartDateFormat('batch-new-start', calcBatchDueDate));
  document.getElementById('batch-new-due').addEventListener('blur', () => smartDateFormat('batch-new-due'));
  document.getElementById('batch-new-save').addEventListener('click', addNewBatchRow);

  const fields = ['product', 'qty', 'start', 'due', 'status', 'notes'];
  fields.forEach(field => {
    document.getElementById(`batch-new-${field}`).addEventListener('keydown', (event) => handleBatchRowKey(event, field));
  });
}

function renderSchedulingRow(batch, idx, activeBatches, productMap, allFamilies) {
  const product = productMap ? productMap.get(batch.product_id) : prodDataGetProductById(batch.product_id);
  const batchIdx = (prodState && Array.isArray(prodState.batches)) ? prodState.batches.indexOf(batch) : -1;

  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const families = allFamilies || getFamilies();

  let workLocation = batch.work_location;
  if (!workLocation && product && product.work_location) {
    workLocation = product.work_location;
  }

  let dueBadge = '';
  let rowUrgencyClass = '';
  if (batch.due_date && batch.status !== 'Complete') {
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(batch.due_date); due.setHours(0,0,0,0);
    const daysLeft = Math.round((due - today) / 86400000);
    if (daysLeft < 0) {
      dueBadge = `<div class="batch-due-badge batch-overdue">⚠ Overdue</div>`;
      rowUrgencyClass = 'batch-row-overdue';
    } else if (daysLeft <= 7) {
      dueBadge = `<div class="batch-due-badge batch-due-soon">⚠ Due soon</div>`;
      rowUrgencyClass = 'batch-row-due-soon';
    }
  }

  const isSelected = selectedBatchIds.has(batch.id);

  return `
    <tr id="batch-row-${batchIdx}" class="${rowUrgencyClass}${isSelected ? ' batch-row-selected' : ''}">
      <td class="w28 ctr">
        <input type="checkbox" class="batch-select-cb" data-batch-id="${batch.id}" ${isSelected ? 'checked' : ''}>
      </td>
      <td>
        <select class="cell-edit" name="batch_${batchIdx}_product_id" data-field="product_id">
          ${products.filter(p => p.status?.toLowerCase() !== 'closed').map(p => `<option value="${p.id}" ${batch.product_id === p.id ? 'selected' : ''}>${p.name} (${p.part_number || 'N/A'})</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="cell-display">${product && product.family ? (families.find(f => f.id === product.family)?.label || '—') : '—'}</div>
      </td>
      <td>
        <div class="cell-display">${workLocation || '—'}</div>
      </td>
      <td><input class="cell-edit" name="batch_${batchIdx}_quantity" type="number" value="${batch.quantity || ''}" data-field="quantity"></td>
      <td>
        <input class="cell-edit" placeholder="DD/MM/YYYY" value="${formatDisplayDate(batch.start_date || '')}" data-field="start_date" id="batch-start-${batchIdx}">
      </td>
      <td>
        <input class="cell-edit" placeholder="DD/MM/YYYY" value="${formatDisplayDate(batch.due_date || '')}" data-field="due_date" id="batch-due-${batchIdx}">
        ${dueBadge}
      </td>
      <td>
        <select class="cell-edit" name="batch_${batchIdx}_status" data-field="status">
          <option value="Planned" ${batch.status === 'Planned' ? 'selected' : ''}>Planned</option>
          <option value="In Progress" ${batch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Complete" ${batch.status === 'Complete' ? 'selected' : ''}>Complete</option>
        </select>
      </td>
      <td><textarea class="cell-edit" name="batch_${batchIdx}_notes" data-field="notes">${esc(batch.notes || '')}</textarea></td>
      <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
        ${canEdit() ? `<button class="btn-del" data-action="duplicate" title="Duplicate batch">⧉</button>
        <button class="btn-del" data-action="delete" title="Delete batch">✕</button>` : ''}
      </td>
    </tr>
  `;
}

function addSchedulingRowEventListeners(batch) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : [];
  const batchIdx = batches.indexOf(batch);
  const row = document.getElementById(`batch-row-${batchIdx}`);
  if (!row) return;

  row.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const field = e.target.getAttribute('data-field');
      if (field === 'start_date' || field === 'due_date') return;
      const value = e.target.value;
      const ok = await prodDataUpdateBatch(batchIdx, field, value);
      if (ok) flashSaved(e.target);
      if (field === 'product_id') {
        autoPopulateWorkLocationForBatch(batchIdx, value);
      }
    });
    input.addEventListener('keydown', handleCellKey);
  });

  row.querySelector(`[data-field="start_date"]`).addEventListener('blur', (e) => smartDateFormat(e.target.id, async () => {
    const ok = await prodDataUpdateBatch(batchIdx, 'start_date', parseDisplayDate(e.target.value));
    if (ok) flashSaved(e.target);
  }));
  row.querySelector(`[data-field="due_date"]`).addEventListener('blur', (e) => smartDateFormat(e.target.id, async () => {
    const ok = await prodDataUpdateBatch(batchIdx, 'due_date', parseDisplayDate(e.target.value));
    if (ok) flashSaved(e.target);
  }));

  row.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateBatchRow(batchIdx));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => {
    if (confirm('Delete batch?')) {
      prodDataDeleteBatch(batchIdx);
    }
  });
}

function renderScheduling() {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : [];
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const activeBatches = getFilteredBatches();

  // Build lookup maps once for all rows
  const productMap = new Map(products.map(p => [p.id, p]));
  const allFamilies = getFamilies();

  let rows = canEdit() ? renderSchedulingNewRow() : '';

  activeBatches.forEach((batch, idx) => {
    rows += renderSchedulingRow(batch, idx, activeBatches, productMap, allFamilies);
  });

  const html = `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">BATCH SCHEDULING</div>
          <div class="sec-title">Production Batches</div>
          <div class="sec-desc">${activeBatches.length} of ${batches.length} batches — Click cells to edit, Tab/Enter to navigate</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn ${prodSchedulingHideComplete ? 'btn-primary' : 'btn-ghost'}" id="toggle-hide-complete">
            ${prodSchedulingHideComplete ? '✓ Hide Complete' : '○ Show All'}
          </button>
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="production-scheduling" title="User Guide">❓ Guide</button>
          <button class="btn btn-primary" id="add-batch-button">➕ Add Batch</button>
          <button class="btn btn-ghost" id="back-to-prod-hub">← Back</button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="prod-filters">
        <div class="filter-group">
          <label>Family:</label>
          <select id="family-filter">
            <option value="">— All Families</option>
            ${allFamilies.map(f => `<option value="${f.id}" ${prodSchedulingFilters.family === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Product:</label>
          <select id="product-filter">
            <option value="">— All Products</option>
            ${products.filter(p => p.status?.toLowerCase() !== 'closed' && (!prodSchedulingFilters.family || p.family === prodSchedulingFilters.family)).map(p => `<option value="${p.id}" ${prodSchedulingFilters.product === p.id ? 'selected' : ''}>${p.name} (${p.part_number || ''})</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Work Location:</label>
          <select id="work-location-filter">
            <option value="">— All Locations</option>
            ${getWorkAreaOptions(prodSchedulingFilters.workLocation)}
          </select>
        </div>
        <div class="filter-group">
          <label>Date Range:</label>
          <div style="display:flex;gap:6px">
            <input type="date" id="date-from-filter" value="${prodSchedulingFilters.dateFrom}">
            <span style="display:flex;align-items:center">–</span>
            <input type="date" id="date-to-filter" value="${prodSchedulingFilters.dateTo}">
          </div>
        </div>
      </div>

      <!-- Bulk Action Toolbar -->
      <div id="bulk-toolbar" class="bulk-toolbar${selectedBatchIds.size > 0 ? '' : ' hidden'}">
        <span id="bulk-count">${selectedBatchIds.size} selected</span>
        <select id="bulk-status-select">
          <option value="">Set status…</option>
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>
        <button class="btn btn-secondary btn-sm" id="bulk-status-apply">Apply</button>
        <button class="btn btn-danger btn-sm" id="bulk-delete-btn">Delete Selected</button>
        <button class="btn btn-ghost btn-sm" id="bulk-clear-btn">Clear</button>
      </div>

      <!-- Legend -->
      <div style="background:var(--bg-secondary);border-radius:6px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--muted);display:flex;gap:24px;flex-wrap:wrap">
        <div><strong>⧉</strong> Duplicate batch — copies all fields (product, location, qty, dates, notes) to create a new batch</div>
        <div><strong>✕</strong> Delete batch</div>
      </div>

      <!-- Batch Table -->
      <div class="scheduling-table-wrap">
        <table class="tbl prod-tbl" style="table-layout:auto;width:100%">
          <colgroup>
            <col style="width:36px">
            <col style="min-width:220px">
            <col style="min-width:100px">
            <col style="min-width:100px">
            <col style="min-width:80px">
            <col style="min-width:100px">
            <col style="min-width:100px">
            <col style="min-width:120px">
            <col style="min-width:220px">
            <col style="width:36px">
          </colgroup>
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-batches" title="Select all"></th>
            <th data-sort-field="product_id" style="cursor:pointer">Product ${prodSchedulingSort.field === 'product_id' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="family" style="cursor:pointer">Family ${prodSchedulingSort.field === 'family' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="work_location" style="cursor:pointer">Work Location ${prodSchedulingSort.field === 'work_location' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="quantity" style="cursor:pointer">Qty ${prodSchedulingSort.field === 'quantity' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="start_date" style="cursor:pointer">Start Date ${prodSchedulingSort.field === 'start_date' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="due_date" style="cursor:pointer">Due Date ${prodSchedulingSort.field === 'due_date' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th data-sort-field="status" style="cursor:pointer">Status ${prodSchedulingSort.field === 'status' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="10" style="text-align:center;padding:32px">
            <div style="color:var(--muted);margin-bottom:12px">No batches scheduled yet.</div>
            <button class="btn btn-primary btn-sm" onclick="focusBatchNewRow()">＋ Schedule First Batch</button>
          </td></tr>`}
        </tbody>
      </table>
      </div>
    </div>
  `;

  setTimeout(() => {
    addSchedulingNewRowEventListeners();
    activeBatches.forEach(addSchedulingRowEventListeners);

    document.getElementById('toggle-hide-complete')?.addEventListener('click', toggleHideCompleteBatches);
    document.getElementById('add-batch-button')?.addEventListener('click', focusBatchNewRow);
    document.getElementById('back-to-prod-hub')?.addEventListener('click', () => setProductionTab('root'));

    document.getElementById('family-filter')?.addEventListener('change', (e) => {
      prodSchedulingFilters.family = e.target.value;
      // Only clear product filter if the selected product doesn't belong to the new family
      if (prodSchedulingFilters.product) {
        const selectedProduct = products.find(p => p.id === prodSchedulingFilters.product);
        if (!selectedProduct || (e.target.value && selectedProduct.family !== e.target.value)) {
          prodSchedulingFilters.product = '';
        }
      }
      render();
    });
    document.getElementById('product-filter')?.addEventListener('change', (e) => {
      prodSchedulingFilters.product = e.target.value;
      render();
    });
    document.getElementById('work-location-filter')?.addEventListener('change', (e) => {
      prodSchedulingFilters.workLocation = e.target.value;
      render();
    });
    document.getElementById('date-from-filter')?.addEventListener('change', (e) => {
      prodSchedulingFilters.dateFrom = e.target.value;
      render();
    });
    document.getElementById('date-to-filter')?.addEventListener('change', (e) => {
      prodSchedulingFilters.dateTo = e.target.value;
      render();
    });

    document.querySelectorAll('th[data-sort-field]').forEach(th => {
      th.addEventListener('click', () => toggleSort(th.getAttribute('data-sort-field')));
    });

    // Select-all checkbox
    document.getElementById('select-all-batches')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        activeBatches.forEach(b => selectedBatchIds.add(b.id));
      } else {
        selectedBatchIds.clear();
      }
      document.querySelectorAll('.batch-select-cb').forEach(cb => {
        cb.checked = e.target.checked;
        const row = cb.closest('tr');
        if (row) {
          if (e.target.checked) row.classList.add('batch-row-selected');
          else row.classList.remove('batch-row-selected');
        }
      });
      updateBulkToolbar();
    });

    // Individual row checkboxes
    document.querySelectorAll('.batch-select-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const batchId = e.target.getAttribute('data-batch-id');
        if (e.target.checked) {
          selectedBatchIds.add(batchId);
          e.target.closest('tr')?.classList.add('batch-row-selected');
        } else {
          selectedBatchIds.delete(batchId);
          e.target.closest('tr')?.classList.remove('batch-row-selected');
        }
        updateBulkToolbar();
      });
    });

    // Bulk delete
    document.getElementById('bulk-delete-btn')?.addEventListener('click', async () => {
      if (!selectedBatchIds.size) return;
      if (!confirm(`Delete ${selectedBatchIds.size} batch${selectedBatchIds.size > 1 ? 'es' : ''}?`)) return;
      const ids = Array.from(selectedBatchIds);
      for (const batchId of ids) {
        const idx = prodState.batches.findIndex(b => b.id === batchId);
        if (idx >= 0) await prodDataDeleteBatch(idx);
      }
      selectedBatchIds.clear();
      render();
    });

    // Bulk status update
    document.getElementById('bulk-status-apply')?.addEventListener('click', async () => {
      const newStatus = document.getElementById('bulk-status-select').value;
      if (!newStatus || !selectedBatchIds.size) return;
      const ids = Array.from(selectedBatchIds);
      for (const batchId of ids) {
        const idx = prodState.batches.findIndex(b => b.id === batchId);
        if (idx >= 0) await prodDataUpdateBatch(idx, 'status', newStatus);
      }
      selectedBatchIds.clear();
      render();
    });

    // Bulk clear selection
    document.getElementById('bulk-clear-btn')?.addEventListener('click', () => {
      selectedBatchIds.clear();
      render();
    });

  }, 0);

  return html;
}


function getFilteredBatches() {
  if (!prodState || !Array.isArray(prodState.batches)) {
    return [];
  }
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];

  let filtered = prodState.batches;

  if (prodSchedulingFilters.family) {
    const familyProducts = products.filter(p => p.family === prodSchedulingFilters.family).map(p => p.id);
    filtered = filtered.filter(b => familyProducts.includes(b.product_id));
  }

  if (prodSchedulingFilters.product) {
    filtered = filtered.filter(b => b.product_id === prodSchedulingFilters.product);
  }

  if (prodSchedulingFilters.workLocation) {
    filtered = filtered.filter(b => b.work_location === prodSchedulingFilters.workLocation);
  }

  if (prodSchedulingFilters.dateFrom) {
    filtered = filtered.filter(b => !b.start_date || b.start_date >= prodSchedulingFilters.dateFrom);
  }

  if (prodSchedulingFilters.dateTo) {
    filtered = filtered.filter(b => !b.start_date || b.start_date <= prodSchedulingFilters.dateTo);
  }

  if (prodSchedulingHideComplete) {
    filtered = filtered.filter(b => b.status !== 'Complete');
  }

  // Cache families once before sort to avoid repeated calls inside the comparator
  const allFamilies = prodSchedulingSort.field === 'family' ? getFamilies() : [];

  filtered.sort((a, b) => {
    let aVal, bVal;

    if (prodSchedulingSort.field === 'family') {
      const productA = products.find(p => p.id === a.product_id);
      const productB = products.find(p => p.id === b.product_id);
      const familyA = productA ? allFamilies.find(f => f.id === productA.family) : null;
      const familyB = productB ? allFamilies.find(f => f.id === productB.family) : null;
      aVal = familyA?.label || '';
      bVal = familyB?.label || '';
    } else {
      aVal = a[prodSchedulingSort.field];
      bVal = b[prodSchedulingSort.field];
    }

    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    if (typeof aVal === 'string') {
      return prodSchedulingSort.ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return prodSchedulingSort.ascending ? aVal - bVal : bVal - aVal;
    }
  });

  return filtered;
}

function toggleSort(field) {
  if (prodSchedulingSort.field === field) {
    prodSchedulingSort.ascending = !prodSchedulingSort.ascending;
  } else {
    prodSchedulingSort.field = field;
    prodSchedulingSort.ascending = true;
  }
  render();
}

// Keyboard handlers for inline editing
function handleCellKey(event) {
  if (event.key === 'Tab') {
    event.preventDefault();
    const cell = event.target.closest('td');
    const row = cell.closest('tr');
    const cells = row.querySelectorAll('input, select, textarea');
    const currentIdx = Array.from(cells).indexOf(event.target);
    if (event.shiftKey) {
      if (currentIdx > 0) cells[currentIdx - 1].focus();
    } else {
      if (currentIdx < cells.length - 1) cells[currentIdx + 1].focus();
    }
  }
}

function handleBatchRowKey(event, field) {
  if (event.key === 'Tab') {
    event.preventDefault();
    const fields = ['product', 'work-location', 'qty', 'start', 'due', 'status', 'notes'];
    const currentIdx = fields.indexOf(field);
    if (event.shiftKey) {
      if (currentIdx > 0) document.getElementById(`batch-new-${fields[currentIdx - 1]}`).focus();
    } else {
      if (currentIdx < fields.length - 1) {
        document.getElementById(`batch-new-${fields[currentIdx + 1]}`).focus();
      }
    }
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    addNewBatchRow();
  }
}

function focusBatchNewRow() {
  setTimeout(() => document.getElementById('batch-new-product')?.focus(), 50);
}

async function addNewBatchRow() {
  const productId = document.getElementById('batch-new-product')?.value;
  const workLocationDiv = document.getElementById('batch-new-work-location');
  const workLocation = workLocationDiv?.textContent?.trim();
  const qty = document.getElementById('batch-new-qty')?.value;
  const startInput = document.getElementById('batch-new-start')?.value;
  const dueInput = document.getElementById('batch-new-due')?.value;
  const status = document.getElementById('batch-new-status')?.value || 'Planned';
  const notes = document.getElementById('batch-new-notes')?.value;

  if (!productId || !workLocation || workLocation === '—') {
    const productEl = document.getElementById('batch-new-product');
    productEl.style.borderColor = 'var(--red)';
    productEl.title = 'Product and Work Location are required';
    setTimeout(() => {
      productEl.style.borderColor = '';
      productEl.title = '';
    }, 2000);
    return;
  }

  // Parse dates from DD/MM/YYYY to YYYY-MM-DD format
  const start = startInput ? parseDisplayDate(startInput) : null;
  const due = dueInput ? parseDisplayDate(dueInput) : null;

  // Validate dates if provided
  if (startInput && !start) {
    const startEl = document.getElementById('batch-new-start');
    startEl.style.borderColor = 'var(--red)';
    startEl.title = `Invalid start date format: "${startInput}"\n\nUse DD/MM/YYYY, t (today), or +7/-3 (relative dates)`;
    setTimeout(() => {
        startEl.style.borderColor = '';
        startEl.title = '';
    }, 2000);
    startEl.focus();
    return;
  }
  if (dueInput && !due) {
    const dueEl = document.getElementById('batch-new-due');
    dueEl.style.borderColor = 'var(--red)';
    dueEl.title = `Invalid due date format: "${dueInput}"\n\nUse DD/MM/YYYY, t (today), or +7/-3 (relative dates)`;
    setTimeout(() => {
        dueEl.style.borderColor = '';
        dueEl.title = '';
    }, 2000);
    dueEl.focus();
    return;
  }

  await prodDataAddBatch(productId, workLocation, qty, start, due, status, notes);

  // Reset new row fields
  document.getElementById('batch-new-product').value = '';
  document.getElementById('batch-new-work-location').textContent = '—';
  document.getElementById('batch-new-qty').value = '';
  document.getElementById('batch-new-start').value = '';
  document.getElementById('batch-new-due').value = '';
  document.getElementById('batch-new-status').value = 'Planned';
  document.getElementById('batch-new-notes').value = '';

  setTimeout(() => document.getElementById('batch-new-product')?.focus(), 50);
}

function calcBatchDueDate() {
  const productSelect = document.getElementById('batch-new-product');
  const startInput = document.getElementById('batch-new-start');
  const dueInput = document.getElementById('batch-new-due');

  if (!productSelect || !startInput || !dueInput) return;

  const productId = productSelect.value;
  const startDisplayDate = startInput.value;

  if (!productId || !startDisplayDate) return;

  // Parse display date to ISO format
  const startIso = parseDisplayDate(startDisplayDate);
  if (!startIso) return;

  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Calculate due date: start date + lead time days (or just start date if no lead time)
  const start = new Date(startIso);
  const due = new Date(start);
  if (product.lead_time_days && parseInt(product.lead_time_days) > 0) {
    due.setDate(due.getDate() + parseInt(product.lead_time_days));
  }

  // Format as DD/MM/YYYY for display
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  dueInput.value = `${day}/${month}/${year}`;
}

function toggleHideCompleteBatches() {
  prodSchedulingHideComplete = !prodSchedulingHideComplete;
  localStorage.setItem('prodSchedulingHideComplete', prodSchedulingHideComplete);
  render();
}

async function duplicateBatchRow(batchIdx) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : [];
  if (batchIdx < 0 || batchIdx >= batches.length) return;

  const source = batches[batchIdx];
  await prodDataAddBatch(
    source.product_id,
    source.work_location,
    source.quantity,
    source.start_date,
    source.due_date,
    source.status,
    source.notes
  );
}

// ── Smart date input helpers ─────────────────────────────
function handleDateInput(event, fieldId, fieldType, batchIdx) {
  if (event.key === 'Tab') {
    // Handle relative date input on blur/tab
    const input = event.target;
    const val = input.value.trim().toLowerCase();

    if (val && !val.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsed = parseDateInput(val);
      if (parsed) {
        input.value = formatDisplayDate(parsed);
        event.preventDefault();
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Then handle normal tab navigation
    handleCellKey(event);
  }
}

function setDateToday(fieldId) {
  const today = new Date().toISOString().split('T')[0];
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = formatDisplayDate(today);
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function parseDateInput(input) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle "t" or "today"
  if (input === 't' || input === 'today') {
    return formatDate(today);
  }

  // Handle relative dates: +7, -3, etc.
  const relMatch = input.match(/^([+-])(\d+)$/);
  if (relMatch) {
    const offset = parseInt(relMatch[1] + relMatch[2]);
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return formatDate(date);
  }

  // Handle "next Friday" style (optional enhancement)
  return null;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Smart date format: auto-correct or prompt invalid format
function smartDateFormat(fieldId, callback) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  const val = input.value.trim().toLowerCase();
  if (!val) {
    // Empty is valid — save the cleared value so the date is removed from DB
    if (callback) callback();
    return;
  }

  // Already in correct display format
  if (val.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    if (callback) callback();
    return;
  }

  // Try to parse shorthand
  const parsed = parseDateInput(val);
  if (parsed) {
    input.value = formatDisplayDate(parsed);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (callback) callback();
    return;
  }

  // Invalid format - just clear and show inline hint (no blocking alert)
  input.style.borderColor = 'var(--red)';
  input.title = `Invalid format. Use DD/MM/YYYY, t/today, or +7/-3 for relative dates`;
  setTimeout(() => {
    input.style.borderColor = '';
    input.title = '';
  }, 2000);
}

// Update family display when product changes
function updateFamilyDisplay(scope) {
  let productSelect, familyDisplay;

  if (scope === 'new') {
    productSelect = document.getElementById('batch-new-product');
    familyDisplay = document.getElementById('batch-new-family');
  } else {
    // For existing rows, called from product change
    return; // Handled in render
  }

  if (!productSelect || !familyDisplay) return;

  const productId = productSelect.value;
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const product = products.find(p => p.id === productId);

  if (product && product.family) {
    const family = getFamilies().find(f => f.id === product.family);
    familyDisplay.textContent = family ? family.label : '—';
  } else {
    familyDisplay.textContent = '—';
  }
}

// Auto-populate work location from selected product (new row)
function autoPopulateWorkLocation() {
  const productSelect = document.getElementById('batch-new-product');
  const workLocationDiv = document.getElementById('batch-new-work-location');

  if (!productSelect || !workLocationDiv) return;

  const productId = productSelect.value;
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const product = products.find(p => p.id === productId);

  if (product && product.work_location) {
    workLocationDiv.textContent = product.work_location;
  } else {
    workLocationDiv.textContent = '—';
  }
}

// Auto-populate work location from selected product (existing batch row)
function autoPopulateWorkLocationForBatch(batchIdx, productId) {
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const product = products.find(p => p.id === productId);

  if (product && product.work_location) {
    prodDataUpdateBatch(batchIdx, 'work_location', product.work_location);
  }
}
