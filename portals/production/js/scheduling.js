// Production Batch Scheduling

let prodSchedulingSort = { field: 'start_date', ascending: true };
let prodSchedulingFilters = { product: '', unit: '', dateFrom: '', dateTo: '' };

function renderScheduling() {
  const batches = prodState.batches;
  const activeBatches = getFilteredBatches();

  let rows = '';
  activeBatches.forEach((batch, idx) => {
    const product = prodDataGetProductById(batch.product_id);
    const productName = product ? `${product.name} (${product.code || ''})` : 'Unknown';

    rows += `
      <tr>
        <td class="w28 ctr">${activeBatches.indexOf(batch) + 1}</td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'product_id', this.value)">
            ${prodState.products.map(p => `<option value="${p.id}" ${batch.product_id === p.id ? 'selected' : ''}>${p.name} (${p.code || 'N/A'})</option>`).join('')}
          </select>
        </td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'unit', this.value)">
            <option value="">—</option>
            <option value="Unit 2" ${batch.unit === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${batch.unit === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${batch.unit === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
          </select>
        </td>
        <td><input class="cell-edit" type="number" value="${batch.quantity || ''}" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'quantity', this.value)"></td>
        <td><input class="cell-edit" type="date" value="${batch.start_date || ''}" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'start_date', this.value)"></td>
        <td><input class="cell-edit" type="date" value="${batch.due_date || ''}" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'due_date', this.value)"></td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'status', this.value)">
            <option value="Planned" ${batch.status === 'Planned' ? 'selected' : ''}>Planned</option>
            <option value="In Progress" ${batch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Complete" ${batch.status === 'Complete' ? 'selected' : ''}>Complete</option>
          </select>
        </td>
        <td><textarea class="cell-edit" onchange="prodDataUpdateBatch(${prodState.batches.indexOf(batch)}, 'notes', this.value)">${esc(batch.notes || '')}</textarea></td>
        <td class="w28 ctr"><button class="btn-del" onclick="if(confirm('Delete batch?')) prodDataDeleteBatch(${prodState.batches.indexOf(batch)})">✕</button></td>
      </tr>
    `;
  });

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">BATCH SCHEDULING</div>
          <div class="sec-title">Production Batches</div>
          <div class="sec-desc">${activeBatches.length} of ${batches.length} batches</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="document.getElementById('batchAddModal').style.display='flex'">➕ Add Batch</button>
          <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="prod-filters">
        <div class="filter-group">
          <label>Product:</label>
          <select onchange="prodSchedulingFilters.product = this.value; render()">
            <option value="">— All Products</option>
            ${prodState.products.map(p => `<option value="${p.id}" ${prodSchedulingFilters.product === p.id ? 'selected' : ''}>${p.name} (${p.code || ''})</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Unit:</label>
          <select onchange="prodSchedulingFilters.unit = this.value; render()">
            <option value="">— All Units</option>
            <option value="Unit 2" ${prodSchedulingFilters.unit === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${prodSchedulingFilters.unit === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${prodSchedulingFilters.unit === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Date Range:</label>
          <div style="display:flex;gap:6px">
            <input type="date" value="${prodSchedulingFilters.dateFrom}" onchange="prodSchedulingFilters.dateFrom = this.value; render()">
            <span style="display:flex;align-items:center">–</span>
            <input type="date" value="${prodSchedulingFilters.dateTo}" onchange="prodSchedulingFilters.dateTo = this.value; render()">
          </div>
        </div>
      </div>

      <!-- Batch Table -->
      <table class="tbl prod-tbl" style="table-layout:fixed;width:100%">
        <colgroup>
          <col style="width:36px">
          <col style="width:200px">
          <col style="width:80px">
          <col style="width:70px">
          <col style="width:110px">
          <col style="width:110px">
          <col style="width:100px">
          <col style="width:140px">
          <col style="width:36px">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th onclick="toggleSort('product_id')" style="cursor:pointer">Product ${prodSchedulingSort.field === 'product_id' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('unit')" style="cursor:pointer">Unit ${prodSchedulingSort.field === 'unit' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('quantity')" style="cursor:pointer">Qty ${prodSchedulingSort.field === 'quantity' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('start_date')" style="cursor:pointer">Start Date ${prodSchedulingSort.field === 'start_date' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('due_date')" style="cursor:pointer">Due Date ${prodSchedulingSort.field === 'due_date' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('status')" style="cursor:pointer">Status ${prodSchedulingSort.field === 'status' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted)">No batches scheduled. Click "Add Batch" to get started.</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Add Batch Modal -->
    <div class="modal-bg" id="batchAddModal" style="display:none">
      <div class="modal modal-md">
        <div class="modal-title">Add Production Batch</div>
        <div class="field">
          <label>Product *</label>
          <select id="batch_product">
            <option value="">— Select Product</option>
            ${prodState.products.filter(p => p.status === 'active').map(p => `<option value="${p.id}">${p.name} (${p.code || 'N/A'})</option>`).join('')}
          </select>
        </div>
        <div class="field-row">
          <div class="field" style="flex:1">
            <label>Unit *</label>
            <select id="batch_unit">
              <option value="">— Select Unit</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 6">Unit 6</option>
            </select>
          </div>
          <div class="field" style="flex:1">
            <label>Quantity</label>
            <input id="batch_qty" type="number" placeholder="e.g., 500">
          </div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:1">
            <label>Start Date</label>
            <input id="batch_start" type="date">
          </div>
          <div class="field" style="flex:1">
            <label>Due Date</label>
            <input id="batch_due" type="date">
          </div>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="batch_status">
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        </div>
        <div class="field">
          <label>Notes</label>
          <textarea id="batch_notes" placeholder="Additional notes" style="min-height:60px"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="document.getElementById('batchAddModal').style.display='none'">Cancel</button>
          <button class="btn btn-primary" onclick="batchAddBatch()">Add Batch</button>
        </div>
      </div>
    </div>
  `;
}

function getFilteredBatches() {
  let filtered = prodState.batches;

  if (prodSchedulingFilters.product) {
    filtered = filtered.filter(b => b.product_id === prodSchedulingFilters.product);
  }

  if (prodSchedulingFilters.unit) {
    filtered = filtered.filter(b => b.unit === prodSchedulingFilters.unit);
  }

  if (prodSchedulingFilters.dateFrom) {
    filtered = filtered.filter(b => !b.start_date || b.start_date >= prodSchedulingFilters.dateFrom);
  }

  if (prodSchedulingFilters.dateTo) {
    filtered = filtered.filter(b => !b.start_date || b.start_date <= prodSchedulingFilters.dateTo);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal = a[prodSchedulingSort.field];
    let bVal = b[prodSchedulingSort.field];

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

function batchAddBatch() {
  const productId = document.getElementById('batch_product').value;
  const unit = document.getElementById('batch_unit').value;
  const qty = document.getElementById('batch_qty').value;
  const start = document.getElementById('batch_start').value;
  const due = document.getElementById('batch_due').value;
  const status = document.getElementById('batch_status').value;
  const notes = document.getElementById('batch_notes').value;

  if (!productId || !unit) {
    alert('Product and Unit are required');
    return;
  }

  prodDataAddBatch(productId, unit, qty, start, due, status, notes);
  document.getElementById('batchAddModal').style.display = 'none';
  document.getElementById('batch_product').value = '';
  document.getElementById('batch_unit').value = '';
  document.getElementById('batch_qty').value = '';
  document.getElementById('batch_start').value = '';
  document.getElementById('batch_due').value = '';
  document.getElementById('batch_status').value = 'Planned';
  document.getElementById('batch_notes').value = '';
}
