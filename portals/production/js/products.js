// Product Master List Management

let productMasterDelegationContainer = null;

function renderProductMaster() {
  const products = prodState.products;
  const activeCount = products.filter(p => p.status === 'active').length;

  let rows = '';

  // Quick-add empty row at the top
  rows += `
    <tr class="row-new" id="prod-new-row" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
      <td class="w28 ctr">+</td>
      <td><input class="cell-edit" id="prod-new-name" placeholder="Product name" data-action="new-row-keydown" data-field="name"></td>
      <td><input class="cell-edit" id="prod-new-code" placeholder="Part Number" data-action="new-row-keydown" data-field="code"></td>
      <td>
        <select class="cell-edit" id="prod-new-family" data-action="new-row-keydown" data-field="family">
          <option value="">—</option>
          ${getFamilies().map(f => `<option value="${f.id}">${f.label}</option>`).join('')}
        </select>
      </td>
      <td><input class="cell-edit" id="prod-new-lead" type="number" placeholder="Turnaround time (days)" data-action="new-row-keydown" data-field="lead" title="Time between receipt and delivery (in days)"></td>
      <td>
        <select class="cell-edit" id="prod-new-status" data-action="new-row-keydown" data-field="status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
      <td>
        <select class="cell-edit" id="prod-new-unit" data-action="new-row-keydown" data-field="unit">
          <option value="">—</option>
          <option value="Unit 2">Unit 2</option>
          <option value="Unit 3">Unit 3</option>
          <option value="Unit 6">Unit 6</option>
        </select>
      </td>
      <td><textarea class="cell-edit" id="prod-new-notes" placeholder="Notes" data-action="new-row-keydown" data-field="notes"></textarea></td>
      <td class="w28 ctr"><button class="btn-del" data-action="add-product" title="Save (Ctrl+Enter)">✓</button></td>
    </tr>
  `;

  products.forEach((prod, idx) => {
    const isInactive = prod.status === 'inactive';
    rows += `
      <tr class="${isInactive ? 'row-inactive' : ''}">
        <td class="w28 ctr">${idx + 1}</td>
        <td><input class="cell-edit" value="${esc(prod.name || '')}" data-action="update-product" data-idx="${idx}" data-field="name" data-keydown="edit-row"></td>
        <td><input class="cell-edit" value="${esc(prod.part_number || '')}" data-action="update-product" data-idx="${idx}" data-field="part_number" data-keydown="edit-row"></td>
        <td>
          <select class="cell-edit" data-action="update-product" data-idx="${idx}" data-field="family" data-keydown="edit-row">
            <option value="">—</option>
            ${getFamilies().map(f => `<option value="${f.id}" ${prod.family === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </td>
        <td><input class="cell-edit" type="number" value="${prod.lead_time_days || ''}" data-action="update-product" data-idx="${idx}" data-field="lead_time_days" data-keydown="edit-row"></td>
        <td>
          <select class="cell-edit" data-action="update-product" data-idx="${idx}" data-field="status" data-keydown="edit-row">
            <option value="active" ${prod.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${prod.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </td>
        <td>
          <select class="cell-edit" data-action="update-product" data-idx="${idx}" data-field="assigned_unit" data-keydown="edit-row">
            <option value="">—</option>
            <option value="Unit 2" ${prod.assigned_unit === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${prod.assigned_unit === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${prod.assigned_unit === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
          </select>
        </td>
        <td><textarea class="cell-edit" data-action="update-product" data-idx="${idx}" data-field="notes" data-keydown="edit-row">${esc(prod.notes || '')}</textarea></td>
        <td class="w28 ctr"><button class="btn-del" data-action="delete-product" data-idx="${idx}">✕</button></td>
      </tr>
    `;
  });

  setTimeout(setupProductMasterEventDelegation, 0);

  return `
    <div class="prod-section" id="prod-master-container">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCT MASTER LIST</div>
          <div class="sec-title">Products</div>
          <div class="sec-desc">${activeCount} active products — Click cells to edit, Tab/Enter to navigate</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="focus-new-product">➕ Add Product</button>
          <button class="btn btn-ghost" data-action="set-production-tab" data-tab="root">← Back</button>
        </div>
      </div>

      <table class="tbl prod-tbl" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="width:36px">
          <col style="min-width:200px">
          <col style="min-width:120px">
          <col style="min-width:120px">
          <col style="min-width:120px">
          <col style="min-width:90px">
          <col style="min-width:120px">
          <col style="min-width:220px">
          <col style="width:36px">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Code</th>
            <th>Family</th>
            <th title="Time between receipt and delivery (in days)">Turnaround Time</th>
            <th>Status</th>
            <th>Unit</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted)">No products yet. Click "Add Product" to get started.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function setupProductMasterEventDelegation() {
  const container = document.getElementById('prod-master-container');
  if (!container || productMasterDelegationContainer === container) return;

  productMasterDelegationContainer = container;

  container.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !container.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    if (action === 'add-product') {
      await addNewProductRow();
      return;
    }

    if (action === 'delete-product') {
      const idx = Number(actionEl.dataset.idx);
      if (!Number.isNaN(idx) && confirm('Delete product?')) {
        await prodDataDeleteProduct(idx);
      }
      return;
    }

    if (action === 'focus-new-product') {
      focusProdNewRow();
      return;
    }

    if (action === 'set-production-tab') {
      setProductionTab(actionEl.dataset.tab || 'root');
    }
  });

  container.addEventListener('change', async (event) => {
    const updateEl = event.target.closest('[data-action="update-product"]');
    if (!updateEl || !container.contains(updateEl)) return;

    const idx = Number(updateEl.dataset.idx);
    const field = updateEl.dataset.field;
    if (Number.isNaN(idx) || !field) return;

    await prodDataUpdateProduct(idx, field, updateEl.value);
  });

  container.addEventListener('keydown', (event) => {
    const keydownEl = event.target.closest('[data-keydown], [data-action="new-row-keydown"]');
    if (!keydownEl || !container.contains(keydownEl)) return;

    if (keydownEl.dataset.action === 'new-row-keydown') {
      handleProdRowKey(event, keydownEl.dataset.field);
      return;
    }

    if (keydownEl.dataset.keydown === 'edit-row') {
      handleCellKey(event);
    }
  });
}

// Keyboard handlers for product row
function handleProdRowKey(event, field) {
  if (event.key === 'Tab') {
    event.preventDefault();
    const fields = ['name', 'code', 'family', 'lead', 'status', 'unit', 'notes'];
    const currentIdx = fields.indexOf(field);
    if (event.shiftKey) {
      if (currentIdx > 0) document.getElementById(`prod-new-${fields[currentIdx - 1]}`).focus();
    } else {
      if (currentIdx < fields.length - 1) {
        document.getElementById(`prod-new-${fields[currentIdx + 1]}`).focus();
      }
    }
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    addNewProductRow();
  }
}

function focusProdNewRow() {
  setTimeout(() => document.getElementById('prod-new-name')?.focus(), 50);
}

async function addNewProductRow() {
  const name = document.getElementById('prod-new-name')?.value;
  const code = document.getElementById('prod-new-code')?.value;
  const family = document.getElementById('prod-new-family')?.value;
  const lead = document.getElementById('prod-new-lead')?.value;
  const status = document.getElementById('prod-new-status')?.value || 'active';
  const unit = document.getElementById('prod-new-unit')?.value;
  const notes = document.getElementById('prod-new-notes')?.value;

  if (!name || !name.trim()) {
    showToast('Product name is required', 'warning');
    return;
  }

  await prodDataAddProduct(name, code, family, lead, notes, status, unit);

  // Reset new row fields
  document.getElementById('prod-new-name').value = '';
  document.getElementById('prod-new-code').value = '';
  document.getElementById('prod-new-family').value = '';
  document.getElementById('prod-new-lead').value = '';
  document.getElementById('prod-new-status').value = 'active';
  document.getElementById('prod-new-unit').value = '';
  document.getElementById('prod-new-notes').value = '';

  setTimeout(() => document.getElementById('prod-new-name')?.focus(), 50);
}
