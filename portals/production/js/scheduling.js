// Production Batch Scheduling

let prodSchedulingSort = { field: 'start_date', ascending: true };
let prodSchedulingFilters = { family: '', product: '', unit: '', dateFrom: '', dateTo: '' };
let prodSchedulingNewRow = false;
let prodSchedulingHideComplete = localStorage.getItem('prodSchedulingHideComplete') === 'true';

function renderScheduling() {
  const batches = prodState.batches;
  const activeBatches = getFilteredBatches();

  let rows = '';

  // Quick-add empty row at the top
  rows += `
    <tr class="row-new" id="batch-new-row" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
      <td class="w28 ctr">+</td>
      <td>
        <select class="cell-edit" id="batch-new-product" onchange="calcBatchDueDate(); updateFamilyDisplay('new')" onkeydown="handleBatchRowKey(event, 'product')">
          <option value="">— Select Product</option>
          ${prodState.products.filter(p => p.status !== 'closed').map(p => `<option value="${p.id}">${p.name} (${p.code || 'N/A'})</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="cell-display" id="batch-new-family">—</div>
      </td>
      <td>
        <select class="cell-edit" id="batch-new-unit" onkeydown="handleBatchRowKey(event, 'unit')">
          <option value="">—</option>
          <option value="Unit 2">Unit 2</option>
          <option value="Unit 3">Unit 3</option>
          <option value="Unit 6">Unit 6</option>
        </select>
      </td>
      <td><input class="cell-edit" id="batch-new-qty" type="number" placeholder="Qty" onkeydown="handleBatchRowKey(event, 'qty')"></td>
      <td>
        <input class="cell-edit" id="batch-new-start" placeholder="YYYY-MM-DD or +7, t" onchange="calcBatchDueDate()" onblur="smartDateFormat('batch-new-start', calcBatchDueDate)" onkeydown="handleDateInput(event, 'batch-new-start', 'start')">
      </td>
      <td>
        <input class="cell-edit" id="batch-new-due" placeholder="YYYY-MM-DD or +7, t" onblur="smartDateFormat('batch-new-due')" onkeydown="handleDateInput(event, 'batch-new-due', 'due')">
      </td>
      <td>
        <select class="cell-edit" id="batch-new-status" onkeydown="handleBatchRowKey(event, 'status')">
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>
      </td>
      <td><textarea class="cell-edit" id="batch-new-notes" placeholder="Notes" onkeydown="handleBatchRowKey(event, 'notes')"></textarea></td>
      <td class="w28 ctr"><button class="btn-del" onclick="addNewBatchRow()" title="Save (Ctrl+Enter)">✓</button></td>
    </tr>
  `;

  activeBatches.forEach((batch, idx) => {
    const product = prodDataGetProductById(batch.product_id);
    const batchIdx = prodState.batches.indexOf(batch);

    rows += `
      <tr>
        <td class="w28 ctr">${activeBatches.indexOf(batch) + 1}</td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'product_id', this.value)" onkeydown="handleCellKey(event)">
            ${prodState.products.filter(p => p.status !== 'closed').map(p => `<option value="${p.id}" ${batch.product_id === p.id ? 'selected' : ''}>${p.name} (${p.code || 'N/A'})</option>`).join('')}
          </select>
        </td>
        <td>
          <div class="cell-display">${product && product.family_id ? (prodState.families.find(f => f.id === product.family_id)?.label || '—') : '—'}</div>
        </td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'unit', this.value)" onkeydown="handleCellKey(event)">
            <option value="">—</option>
            <option value="Unit 2" ${batch.unit === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${batch.unit === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${batch.unit === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
          </select>
        </td>
        <td><input class="cell-edit" type="number" value="${batch.quantity || ''}" onchange="prodDataUpdateBatch(${batchIdx}, 'quantity', this.value)" onkeydown="handleCellKey(event)"></td>
        <td>
          <input class="cell-edit" placeholder="YYYY-MM-DD or +7, t" value="${batch.start_date || ''}" onchange="prodDataUpdateBatch(${batchIdx}, 'start_date', this.value)" onblur="smartDateFormat('batch-start-${batchIdx}', () => prodDataUpdateBatch(${batchIdx}, 'start_date', document.getElementById('batch-start-${batchIdx}').value))" onkeydown="handleDateInput(event, 'batch-start-${batchIdx}', 'start', ${batchIdx})" id="batch-start-${batchIdx}">
        </td>
        <td>
          <input class="cell-edit" placeholder="YYYY-MM-DD or +7, t" value="${batch.due_date || ''}" onchange="prodDataUpdateBatch(${batchIdx}, 'due_date', this.value)" onblur="smartDateFormat('batch-due-${batchIdx}', () => prodDataUpdateBatch(${batchIdx}, 'due_date', document.getElementById('batch-due-${batchIdx}').value))" onkeydown="handleDateInput(event, 'batch-due-${batchIdx}', 'due')" id="batch-due-${batchIdx}">
        </td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'status', this.value)" onkeydown="handleCellKey(event)">
            <option value="Planned" ${batch.status === 'Planned' ? 'selected' : ''}>Planned</option>
            <option value="In Progress" ${batch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Complete" ${batch.status === 'Complete' ? 'selected' : ''}>Complete</option>
          </select>
        </td>
        <td><textarea class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'notes', this.value)" onkeydown="handleCellKey(event)">${esc(batch.notes || '')}</textarea></td>
        <td class="w28 ctr"><button class="btn-del" onclick="if(confirm('Delete batch?')) prodDataDeleteBatch(${batchIdx})">✕</button></td>
      </tr>
    `;
  });

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">BATCH SCHEDULING</div>
          <div class="sec-title">Production Batches</div>
          <div class="sec-desc">${activeBatches.length} of ${batches.length} batches — Click cells to edit, Tab/Enter to navigate</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn ${prodSchedulingHideComplete ? 'btn-primary' : 'btn-ghost'}" onclick="toggleHideCompleteBatches()" title="Hide completed batches">${prodSchedulingHideComplete ? '✓ Hide Complete' : '○ Show All'}</button>
          <button class="btn btn-primary" onclick="focusBatchNewRow()">➕ Add Batch</button>
          <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="prod-filters">
        <div class="filter-group">
          <label>Family:</label>
          <select onchange="prodSchedulingFilters.family = this.value; prodSchedulingFilters.product = ''; render()">
            <option value="">— All Families</option>
            ${prodState.families.map(f => `<option value="${f.id}" ${prodSchedulingFilters.family === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Product:</label>
          <select onchange="prodSchedulingFilters.product = this.value; render()">
            <option value="">— All Products</option>
            ${prodState.products.filter(p => p.status !== 'closed' && (!prodSchedulingFilters.family || p.family === prodSchedulingFilters.family)).map(p => `<option value="${p.id}" ${prodSchedulingFilters.product === p.id ? 'selected' : ''}>${p.name} (${p.code || ''})</option>`).join('')}
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
      <table class="tbl prod-tbl" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="width:36px">
          <col style="min-width:220px">
          <col style="min-width:100px">
          <col style="min-width:100px">
          <col style="min-width:80px">
          <col style="min-width:130px">
          <col style="min-width:130px">
          <col style="min-width:120px">
          <col style="min-width:220px">
          <col style="width:36px">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th onclick="toggleSort('product_id')" style="cursor:pointer">Product ${prodSchedulingSort.field === 'product_id' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('family')" style="cursor:pointer">Family ${prodSchedulingSort.field === 'family' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
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
  `;
}

function getFilteredBatches() {
  let filtered = prodState.batches;

  if (prodSchedulingFilters.family) {
    // Filter by family ID
    const familyProducts = prodState.products.filter(p => p.family_id === prodSchedulingFilters.family).map(p => p.id);
    filtered = filtered.filter(b => familyProducts.includes(b.product_id));
  }

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

  if (prodSchedulingHideComplete) {
    filtered = filtered.filter(b => b.status !== 'Complete');
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal, bVal;

    // Special handling for family (pulled from product and family database)
    if (prodSchedulingSort.field === 'family') {
      const productA = prodState.products.find(p => p.id === a.product_id);
      const productB = prodState.products.find(p => p.id === b.product_id);
      const familyA = productA ? prodState.families.find(f => f.id === productA.family_id) : null;
      const familyB = productB ? prodState.families.find(f => f.id === productB.family_id) : null;
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
    const fields = ['product', 'unit', 'qty', 'start', 'due', 'status', 'notes'];
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
  const unit = document.getElementById('batch-new-unit')?.value;
  const qty = document.getElementById('batch-new-qty')?.value;
  const start = document.getElementById('batch-new-start')?.value;
  const due = document.getElementById('batch-new-due')?.value;
  const status = document.getElementById('batch-new-status')?.value || 'Planned';
  const notes = document.getElementById('batch-new-notes')?.value;

  if (!productId || !unit) {
    alert('Product and Unit are required');
    return;
  }

  await prodDataAddBatch(productId, unit, qty, start, due, status, notes);

  // Reset new row fields
  document.getElementById('batch-new-product').value = '';
  document.getElementById('batch-new-unit').value = '';
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
  const startDate = startInput.value;

  if (!productId || !startDate) return;

  const product = prodState.products.find(p => p.id === productId);
  if (!product || !product.lead_time_days) return;

  // Calculate due date: start date + lead time days
  const start = new Date(startDate);
  const due = new Date(start);
  due.setDate(due.getDate() + parseInt(product.lead_time_days));

  // Format as YYYY-MM-DD
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  dueInput.value = `${year}-${month}-${day}`;
}

function toggleHideCompleteBatches() {
  prodSchedulingHideComplete = !prodSchedulingHideComplete;
  localStorage.setItem('prodSchedulingHideComplete', prodSchedulingHideComplete);
  render();
}

// ── Smart date input helpers ─────────────────────────────
function handleDateInput(event, fieldId, fieldType, batchIdx) {
  if (event.key === 'Tab') {
    // Handle relative date input on blur/tab
    const input = event.target;
    const val = input.value.trim().toLowerCase();

    if (val && !val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsed = parseDateInput(val);
      if (parsed) {
        input.value = parsed;
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
    field.value = today;
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
  if (!val) return; // Empty is OK

  // Already in correct format
  if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
    if (callback) callback();
    return;
  }

  // Try to parse shorthand
  const parsed = parseDateInput(val);
  if (parsed) {
    input.value = parsed;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (callback) callback();
    return;
  }

  // Invalid format - prompt user
  alert(`Invalid date format: "${val}"\n\nUse YYYY-MM-DD or shorthand:\n• t or today\n• +7 or -3 for relative dates`);
  input.focus();
  input.select();
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
  const product = prodState.products.find(p => p.id === productId);
  familyDisplay.textContent = product && product.family ? product.family : '—';
}
