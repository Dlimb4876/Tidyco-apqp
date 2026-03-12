// Production Batch Scheduling

let prodSchedulingSort = { field: 'start_date', ascending: true };
let prodSchedulingFilters = { family: '', product: '', workLocation: '', dateFrom: '', dateTo: '' };
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
        <select class="cell-edit" id="batch-new-product" onchange="calcBatchDueDate(); updateFamilyDisplay('new'); autoPopulateWorkLocation()" onkeydown="handleBatchRowKey(event, 'product')">
          <option value="">— Select Product</option>
          ${prodState.products.filter(p => p.status?.toLowerCase() !== 'closed').map(p => `<option value="${p.id}">${p.name} (${p.part_number || 'N/A'})</option>`).join('')}
        </select>
      </td>
      <td>
        <div class="cell-display" id="batch-new-family">—</div>
      </td>
      <td>
        <div class="cell-display" id="batch-new-work-location">—</div>
      </td>
      <td><input class="cell-edit" id="batch-new-qty" type="number" placeholder="Qty" onkeydown="handleBatchRowKey(event, 'qty')"></td>
      <td>
        <input class="cell-edit" id="batch-new-start" placeholder="DD/MM/YYYY" onchange="calcBatchDueDate()" onblur="smartDateFormat('batch-new-start', calcBatchDueDate)" onkeydown="handleDateInput(event, 'batch-new-start', 'start')">
      </td>
      <td>
        <input class="cell-edit" id="batch-new-due" placeholder="DD/MM/YYYY" onblur="smartDateFormat('batch-new-due')" onkeydown="handleDateInput(event, 'batch-new-due', 'due')">
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

    // Auto-populate work location if empty
    let workLocation = batch.work_location;
    if (!workLocation && product && product.work_location) {
      workLocation = product.work_location;
    }

    rows += `
      <tr>
        <td class="w28 ctr">${activeBatches.indexOf(batch) + 1}</td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'product_id', this.value); autoPopulateWorkLocationForBatch(${batchIdx}, this.value)" onkeydown="handleCellKey(event)">
            ${prodState.products.filter(p => p.status?.toLowerCase() !== 'closed').map(p => `<option value="${p.id}" ${batch.product_id === p.id ? 'selected' : ''}>${p.name} (${p.part_number || 'N/A'})</option>`).join('')}
          </select>
        </td>
        <td>
          <div class="cell-display">${product && product.family ? (prodState.families.find(f => f.id === product.family)?.label || '—') : '—'}</div>
        </td>
        <td>
          <div class="cell-display">${workLocation || '—'}</div>
        </td>
        <td><input class="cell-edit" type="number" value="${batch.quantity || ''}" onchange="prodDataUpdateBatch(${batchIdx}, 'quantity', this.value)" onkeydown="handleCellKey(event)"></td>
        <td>
          <input class="cell-edit" placeholder="DD/MM/YYYY" value="${formatDisplayDate(batch.start_date || '')}" onchange="prodDataUpdateBatch(${batchIdx}, 'start_date', parseDisplayDate(this.value))" onblur="smartDateFormat('batch-start-${batchIdx}', () => prodDataUpdateBatch(${batchIdx}, 'start_date', parseDisplayDate(document.getElementById('batch-start-${batchIdx}').value)))" onkeydown="handleDateInput(event, 'batch-start-${batchIdx}', 'start', ${batchIdx})" id="batch-start-${batchIdx}">
        </td>
        <td>
          <input class="cell-edit" placeholder="DD/MM/YYYY" value="${formatDisplayDate(batch.due_date || '')}" onchange="prodDataUpdateBatch(${batchIdx}, 'due_date', parseDisplayDate(this.value))" onblur="smartDateFormat('batch-due-${batchIdx}', () => prodDataUpdateBatch(${batchIdx}, 'due_date', parseDisplayDate(document.getElementById('batch-due-${batchIdx}').value)))" onkeydown="handleDateInput(event, 'batch-due-${batchIdx}', 'due')" id="batch-due-${batchIdx}">
        </td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'status', this.value)" onkeydown="handleCellKey(event)">
            <option value="Planned" ${batch.status === 'Planned' ? 'selected' : ''}>Planned</option>
            <option value="In Progress" ${batch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Complete" ${batch.status === 'Complete' ? 'selected' : ''}>Complete</option>
          </select>
        </td>
        <td><textarea class="cell-edit" onchange="prodDataUpdateBatch(${batchIdx}, 'notes', this.value)" onkeydown="handleCellKey(event)">${esc(batch.notes || '')}</textarea></td>
        <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
          <button class="btn-del" onclick="duplicateBatchRow(${batchIdx})" title="Duplicate batch">⧉</button>
          <button class="btn-del" onclick="if(confirm('Delete batch?')) prodDataDeleteBatch(${batchIdx})">✕</button>
        </td>
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
            ${prodState.products.filter(p => p.status?.toLowerCase() !== 'closed' && (!prodSchedulingFilters.family || p.family === prodSchedulingFilters.family)).map(p => `<option value="${p.id}" ${prodSchedulingFilters.product === p.id ? 'selected' : ''}>${p.name} (${p.part_number || ''})</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Work Location:</label>
          <select onchange="prodSchedulingFilters.workLocation = this.value; render()">
            <option value="">— All Locations</option>
            <option value="Unit 2" ${prodSchedulingFilters.workLocation === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${prodSchedulingFilters.workLocation === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${prodSchedulingFilters.workLocation === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
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
          <col style="min-width:100px">
          <col style="min-width:100px">
          <col style="min-width:120px">
          <col style="min-width:220px">
          <col style="width:36px">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th onclick="toggleSort('product_id')" style="cursor:pointer">Product ${prodSchedulingSort.field === 'product_id' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('family')" style="cursor:pointer">Family ${prodSchedulingSort.field === 'family' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
            <th onclick="toggleSort('work_location')" style="cursor:pointer">Work Location ${prodSchedulingSort.field === 'work_location' ? (prodSchedulingSort.ascending ? '↑' : '↓') : ''}</th>
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
    const familyProducts = prodState.products.filter(p => p.family === prodSchedulingFilters.family).map(p => p.id);
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

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal, bVal;

    // Special handling for family (pulled from product and family database)
    if (prodSchedulingSort.field === 'family') {
      const productA = prodState.products.find(p => p.id === a.product_id);
      const productB = prodState.products.find(p => p.id === b.product_id);
      const familyA = productA ? prodState.families.find(f => f.id === productA.family) : null;
      const familyB = productB ? prodState.families.find(f => f.id === productB.family) : null;
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
    alert('Product and Work Location are required');
    return;
  }

  // Parse dates from DD/MM/YYYY to YYYY-MM-DD format
  const start = startInput ? parseDisplayDate(startInput) : null;
  const due = dueInput ? parseDisplayDate(dueInput) : null;

  // Validate dates if provided
  if (startInput && !start) {
    alert(`Invalid start date format: "${startInput}"\n\nUse DD/MM/YYYY, t (today), or +7/-3 (relative dates)`);
    document.getElementById('batch-new-start').focus();
    return;
  }
  if (dueInput && !due) {
    alert(`Invalid due date format: "${dueInput}"\n\nUse DD/MM/YYYY, t (today), or +7/-3 (relative dates)`);
    document.getElementById('batch-new-due').focus();
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

  const product = prodState.products.find(p => p.id === productId);
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
  if (batchIdx < 0 || batchIdx >= prodState.batches.length) return;

  const source = prodState.batches[batchIdx];
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
  if (!val) return; // Empty is OK

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
  const product = prodState.products.find(p => p.id === productId);

  if (product && product.family) {
    const family = prodState.families.find(f => f.id === product.family);
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
  const product = prodState.products.find(p => p.id === productId);

  if (product && product.work_location) {
    workLocationDiv.textContent = product.work_location;
  } else {
    workLocationDiv.textContent = '—';
  }
}

// Auto-populate work location from selected product (existing batch row)
function autoPopulateWorkLocationForBatch(batchIdx, productId) {
  const product = prodState.products.find(p => p.id === productId);

  if (product && product.work_location) {
    prodDataUpdateBatch(batchIdx, 'work_location', product.work_location);
  }
}
