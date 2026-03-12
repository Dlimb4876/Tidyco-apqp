/**
 * Products Management Portal
 * Main orchestrator for product list, CRUD, and overhaul history tracking
 * Uses inline editing — no modals
 */

// Track which product row is currently being edited
let productsEditingId = null;

/**
 * Get products portal HTML
 */
function renderProductsPortalHTML() {
  return `
    <div class="products-portal">
      <div class="products-header">
        <div>
          <h1>Product Management</h1>
          <div class="products-controls">
            <input
              type="text"
              id="productSearch"
              class="search-input"
              placeholder="Search by name, part number, or customer..."
            >
          </div>
        </div>
        <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root');render()">← Back to Product Development</button>
      </div>

      <div class="products-tabs">
        <button class="products-tab-btn active" data-tab="list">Product List</button>
        <button class="products-tab-btn" data-tab="trends">Overhaul Trends</button>
        <button class="products-tab-btn" data-tab="families">Product Families</button>
      </div>

      <div id="productsListTab" class="products-tab-content active">
        <div id="productsTable"></div>
      </div>

      <div id="productsTrendsTab" class="products-tab-content">
        <div id="productsTrends"></div>
      </div>

      <div id="productsFamiliesTab" class="products-tab-content">
      </div>
    </div>
  `;
}

/**
 * Setup products portal after rendering
 */
function renderProductsPortalSetup() {
  setupProductsEventListeners();
  renderProductsList();
}

/**
 * Build family select options HTML
 */
function buildFamilyOptions(selectedId) {
  return '<option value="">— Family —</option>' +
    getFamilies().map(f =>
      `<option value="${esc(f.id)}" ${f.id === selectedId ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`
    ).join('');
}

/**
 * Build status select options HTML
 */
function buildStatusOptions(selected) {
  return ['Tender', 'NPI', 'Production', 'Closed'].map(s =>
    `<option value="${s}" ${s === selected ? 'selected' : ''}>${s}</option>`
  ).join('');
}

/**
 * Build work location select options HTML
 */
function buildLocationOptions(selected) {
  return '<option value="">— Location —</option>' +
    ['Unit 2', 'Unit 3', 'Unit 6'].map(l =>
      `<option value="${l}" ${l === selected ? 'selected' : ''}>${l}</option>`
    ).join('');
}

/**
 * Render products list table with inline add/edit
 */
function renderProductsList() {
  const container = document.getElementById('productsTable');
  if (!container) return;

  const products = productsDataGetAll();
  const searchTerm = (document.getElementById('productSearch')?.value || '').toLowerCase();

  const filtered = products.filter(p => {
    if (!searchTerm) return true;
    return (p.name || '').toLowerCase().includes(searchTerm) ||
           (p.part_number || '').toLowerCase().includes(searchTerm) ||
           (p.customer || '').toLowerCase().includes(searchTerm);
  });

  const html = `
    <table class="data-table products-inline-table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Part Number</th>
          <th>Family</th>
          <th>Location</th>
          <th>Customer</th>
          <th class="col-center">Overhaul (hrs)</th>
          <th class="col-center">Turnaround (days)</th>
          <th>Notes</th>
          <th>Status</th>
          <th class="col-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- New row -->
        <tr class="products-new-row" id="productsNewRow">
          <td><input class="cell-edit" id="pNew-name" placeholder="Product name"></td>
          <td><input class="cell-edit" id="pNew-partNumber" placeholder="Part number"></td>
          <td><select class="cell-edit" id="pNew-family">${buildFamilyOptions('')}</select></td>
          <td><select class="cell-edit" id="pNew-location">${buildLocationOptions('')}</select></td>
          <td><input class="cell-edit" id="pNew-customer" placeholder="Customer"></td>
          <td><input class="cell-edit cell-num" id="pNew-hours" type="number" min="0" step="0.5" placeholder="0"></td>
          <td><input class="cell-edit cell-num" id="pNew-turnaround" type="number" min="0" step="1" placeholder="—"></td>
          <td><input class="cell-edit" id="pNew-notes" placeholder="Notes"></td>
          <td><select class="cell-edit" id="pNew-status">${buildStatusOptions('Tender')}</select></td>
          <td class="col-center">
            <button class="btn-icon" title="Add product" onclick="productsAddRow()">✓</button>
          </td>
        </tr>
        ${filtered.length === 0 ? `
          <tr><td colspan="10" class="empty-state-cell">No products found.</td></tr>
        ` : filtered.map(p => {
          const familyLabel = p.family ? (getFamilies().find(f => f.id === p.family)?.label || '—') : '—';
          if (productsEditingId === p.id) {
            return `
            <tr class="products-edit-row">
              <td><input class="cell-edit" id="pEdit-name" value="${esc(p.name || '')}"></td>
              <td><input class="cell-edit" id="pEdit-partNumber" value="${esc(p.part_number || '')}"></td>
              <td><select class="cell-edit" id="pEdit-family">${buildFamilyOptions(p.family || '')}</select></td>
              <td><select class="cell-edit" id="pEdit-location">${buildLocationOptions(p.work_location || '')}</select></td>
              <td><input class="cell-edit" id="pEdit-customer" value="${esc(p.customer || '')}"></td>
              <td><input class="cell-edit cell-num" id="pEdit-hours" type="number" min="0" step="0.5" value="${p.current_overhaul_hours || 0}"></td>
              <td><input class="cell-edit cell-num" id="pEdit-turnaround" type="number" min="0" step="1" value="${p.turnaround_days || ''}"></td>
              <td><input class="cell-edit" id="pEdit-notes" value="${esc(p.notes || '')}"></td>
              <td><select class="cell-edit" id="pEdit-status">${buildStatusOptions(p.status || 'Tender')}</select></td>
              <td class="col-center">
                <button class="btn-icon" title="Save" onclick="productsSaveEdit('${p.id}')">✓</button>
                <button class="btn-icon" title="Cancel" onclick="productsCancelEdit()">✕</button>
              </td>
            </tr>`;
          }
          return `
          <tr>
            <td>${esc(p.name)}</td>
            <td><strong>${esc(p.part_number || '')}</strong></td>
            <td>${esc(familyLabel)}</td>
            <td>${esc(p.work_location || '—')}</td>
            <td>${esc(p.customer || '')}</td>
            <td class="col-center">${(p.current_overhaul_hours || 0).toFixed(1)}</td>
            <td class="col-center">${p.turnaround_days ? Math.round(p.turnaround_days) : '—'}</td>
            <td class="notes-cell" title="${esc(p.notes || '')}">${p.notes ? esc(p.notes).substring(0, 40) + (p.notes.length > 40 ? '…' : '') : '—'}</td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td class="col-center">
              <button class="btn-icon" title="Edit" onclick="productsStartEdit('${p.id}')">✏️</button>
              <button class="btn-icon" title="Delete" onclick="productsDeleteRow('${p.id}', '${esc(p.name)}')">🗑️</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * Add new product from the new row inputs
 */
async function productsAddRow() {
  const name = document.getElementById('pNew-name')?.value.trim();
  const partNumber = document.getElementById('pNew-partNumber')?.value.trim();
  const customer = document.getElementById('pNew-customer')?.value.trim();

  if (!name) {
    document.getElementById('pNew-name')?.focus();
    return;
  }

  const productData = {
    name,
    part_number: partNumber || '',
    family: document.getElementById('pNew-family')?.value || '',
    work_location: document.getElementById('pNew-location')?.value || null,
    customer: customer || '',
    current_overhaul_hours: parseFloat(document.getElementById('pNew-hours')?.value) || 0,
    turnaround_days: parseFloat(document.getElementById('pNew-turnaround')?.value) || null,
    notes: document.getElementById('pNew-notes')?.value.trim() || '',
    status: document.getElementById('pNew-status')?.value || 'Tender'
  };

  try {
    await productsDataAddProduct(productData);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts();
    renderProductsList();
    // Re-focus name input for quick entry of next product
    document.getElementById('pNew-name')?.focus();
  } catch (err) {
    alert('Error adding product: ' + err.message);
  }
}

/**
 * Start editing a product row inline
 */
function productsStartEdit(productId) {
  productsEditingId = productId;
  renderProductsList();
  document.getElementById('pEdit-name')?.focus();
}

/**
 * Save inline edit
 */
async function productsSaveEdit(productId) {
  const name = document.getElementById('pEdit-name')?.value.trim();
  if (!name) {
    document.getElementById('pEdit-name')?.focus();
    return;
  }

  const updates = {
    name,
    part_number: document.getElementById('pEdit-partNumber')?.value.trim() || '',
    family: document.getElementById('pEdit-family')?.value || '',
    work_location: document.getElementById('pEdit-location')?.value || null,
    customer: document.getElementById('pEdit-customer')?.value.trim() || '',
    current_overhaul_hours: parseFloat(document.getElementById('pEdit-hours')?.value) || 0,
    turnaround_days: parseFloat(document.getElementById('pEdit-turnaround')?.value) || null,
    notes: document.getElementById('pEdit-notes')?.value.trim() || '',
    status: document.getElementById('pEdit-status')?.value || 'Tender'
  };

  try {
    await productsDataUpdateProduct(productId, updates);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts();
  } catch (err) {
    alert('Error saving product: ' + err.message);
  }

  productsEditingId = null;
  renderProductsList();
}

/**
 * Cancel inline edit
 */
function productsCancelEdit() {
  productsEditingId = null;
  renderProductsList();
}

/**
 * Delete a product
 */
async function productsDeleteRow(productId, productName) {
  if (!confirm(`Delete product "${productName}"? This cannot be undone.`)) return;
  try {
    await productsDataDeleteProduct(productId);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts();
    if (productsEditingId === productId) productsEditingId = null;
    renderProductsList();
  } catch (err) {
    alert('Error deleting product: ' + err.message);
  }
}

/**
 * Render overhaul trends visualization
 */
function renderProductsTrends() {
  renderAllProductsTrends();
}

/**
 * Setup event listeners
 */
function setupProductsEventListeners() {
  // Search
  document.getElementById('productSearch')?.addEventListener('input', () => renderProductsList());

  // Tab switching
  document.querySelectorAll('.products-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.products-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.products-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`products${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.add('active');

      if (tab === 'trends') {
        renderProductsTrends();
      } else if (tab === 'families') {
        document.getElementById('productsFamiliesTab').innerHTML = renderFamiliesTabContent();
      } else {
        renderProductsList();
      }
    });
  });

  // Allow Enter key on new row inputs to trigger add
  ['pNew-name', 'pNew-partNumber', 'pNew-customer', 'pNew-hours', 'pNew-turnaround', 'pNew-notes'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') productsAddRow();
    });
  });
}
