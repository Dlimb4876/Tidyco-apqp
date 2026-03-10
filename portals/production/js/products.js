// Product Master List Management

function renderProductMaster() {
  const products = prodState.products;
  const activeCount = products.filter(p => p.status === 'active').length;

  let rows = '';
  products.forEach((prod, idx) => {
    const isInactive = prod.status === 'inactive';
    rows += `
      <tr class="${isInactive ? 'row-inactive' : ''}">
        <td class="w28 ctr">${idx + 1}</td>
        <td><input class="cell-edit" value="${esc(prod.name || '')}" onchange="prodDataUpdateProduct(${idx}, 'name', this.value)"></td>
        <td><input class="cell-edit" value="${esc(prod.code || '')}" onchange="prodDataUpdateProduct(${idx}, 'code', this.value)"></td>
        <td><input class="cell-edit" value="${esc(prod.family || '')}" onchange="prodDataUpdateProduct(${idx}, 'family', this.value)"></td>
        <td><input class="cell-edit" type="number" value="${prod.lead_time_days || ''}" onchange="prodDataUpdateProduct(${idx}, 'lead_time_days', this.value)"></td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateProduct(${idx}, 'status', this.value)">
            <option value="active" ${prod.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${prod.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </td>
        <td>
          <select class="cell-edit" onchange="prodDataUpdateProduct(${idx}, 'assigned_unit', this.value)">
            <option value="">—</option>
            <option value="Unit 2" ${prod.assigned_unit === 'Unit 2' ? 'selected' : ''}>Unit 2</option>
            <option value="Unit 3" ${prod.assigned_unit === 'Unit 3' ? 'selected' : ''}>Unit 3</option>
            <option value="Unit 6" ${prod.assigned_unit === 'Unit 6' ? 'selected' : ''}>Unit 6</option>
          </select>
        </td>
        <td><textarea class="cell-edit" onchange="prodDataUpdateProduct(${idx}, 'notes', this.value)">${esc(prod.notes || '')}</textarea></td>
        <td class="w28 ctr"><button class="btn-del" onclick="if(confirm('Delete product?')) prodDataDeleteProduct(${idx})">✕</button></td>
      </tr>
    `;
  });

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCT MASTER LIST</div>
          <div class="sec-title">Products</div>
          <div class="sec-desc">${activeCount} active products</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="document.getElementById('prodAddModal').style.display='flex'">➕ Add Product</button>
          <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
        </div>
      </div>

      <table class="tbl prod-tbl" style="table-layout:fixed;width:100%">
        <colgroup>
          <col style="width:36px">
          <col style="width:150px">
          <col style="width:100px">
          <col style="width:100px">
          <col style="width:90px">
          <col style="width:80px">
          <col style="width:100px">
          <col style="width:150px">
          <col style="width:36px">
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Code</th>
            <th>Family</th>
            <th>Lead Time</th>
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

    <!-- Add Product Modal -->
    <div class="modal-bg" id="prodAddModal" style="display:none">
      <div class="modal modal-md">
        <div class="modal-title">Add Product</div>
        <div class="field"><label>Product Name *</label><input id="prod_name" placeholder="e.g., Rail Assembly"></div>
        <div class="field-row">
          <div class="field" style="flex:1"><label>Code</label><input id="prod_code" placeholder="e.g., RA-001"></div>
          <div class="field" style="flex:1"><label>Family</label><input id="prod_family" placeholder="e.g., Rails"></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:1"><label>Lead Time (days)</label><input id="prod_lead" type="number" placeholder="30"></div>
          <div class="field" style="flex:1"><label>Assigned Unit</label>
            <select id="prod_unit">
              <option value="">— Flexible</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 6">Unit 6</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Notes</label><textarea id="prod_notes" placeholder="Additional notes" style="min-height:60px"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="document.getElementById('prodAddModal').style.display='none'">Cancel</button>
          <button class="btn btn-primary" onclick="prodAddProduct()">Add Product</button>
        </div>
      </div>
    </div>
  `;
}

function prodAddProduct() {
  const name = document.getElementById('prod_name').value;
  const code = document.getElementById('prod_code').value;
  const family = document.getElementById('prod_family').value;
  const lead = document.getElementById('prod_lead').value;
  const unit = document.getElementById('prod_unit').value;
  const notes = document.getElementById('prod_notes').value;

  if (!name.trim()) {
    alert('Product name is required');
    return;
  }

  prodDataAddProduct(name, code, family, lead, notes, 'active', unit);
  document.getElementById('prodAddModal').style.display = 'none';
  document.getElementById('prod_name').value = '';
  document.getElementById('prod_code').value = '';
  document.getElementById('prod_family').value = '';
  document.getElementById('prod_lead').value = '';
  document.getElementById('prod_unit').value = '';
  document.getElementById('prod_notes').value = '';
}
