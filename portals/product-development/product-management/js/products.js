/**
 * Products Management Portal
 * Main orchestrator for product list, CRUD, and overhaul history tracking
 * Uses inline editing — no modals
 */

// Track which product row is currently being edited
let productsEditingId = null;

// Track which products sub-tab is active so re-renders restore the correct tab
let productsActiveTab = 'list'; // 'list' | 'trends' | 'families'

/**
 * Get products portal HTML
 */
function renderProductsPortalHTML() {
  const tab = productsActiveTab || 'list';
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
        <button class="products-tab-btn ${tab === 'list' ? 'active' : ''}" data-tab="list">Product List</button>
        <button class="products-tab-btn ${tab === 'trends' ? 'active' : ''}" data-tab="trends">Overhaul Trends</button>
        <button class="products-tab-btn ${tab === 'families' ? 'active' : ''}" data-tab="families">Product Families</button>
      </div>

      <div id="productsListTab" class="products-tab-content ${tab === 'list' ? 'active' : ''}">
        <div id="productsTable"></div>
      </div>

      <div id="productsTrendsTab" class="products-tab-content ${tab === 'trends' ? 'active' : ''}">
        <div id="productsTrends"></div>
      </div>

      <div id="productsFamiliesTab" class="products-tab-content ${tab === 'families' ? 'active' : ''}">
      </div>
    </div>
  `;
}

/**
 * Setup products portal after rendering
 */
function renderProductsPortalSetup() {
  setupProductsEventListeners();
  if (productsActiveTab === 'trends') {
    renderProductsTrends();
  } else if (productsActiveTab === 'families') {
    renderFamiliesTabContent();
  } else {
    renderProductsList();
  }
}

/**
 * Track which family is currently being edited
 */
let familiesEditingId = null;

/**
 * Render families tab content as editable table
 */
function renderFamiliesTabContent() {
  const container = document.getElementById('productsFamiliesTab');
  if (!container) return;

  // If families are still loading, show a spinner
  if (familiesState.loading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families...</div>';
    return;
  }

  // If families state is missing or data array is absent, trigger a reload
  if (!familiesState || !Array.isArray(familiesState.families)) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families...</div>';
    if (typeof familiesDataInit === 'function') familiesDataInit().then(() => renderFamiliesTabContent());
    return;
  }

  const families = familiesDataGetAll();

  // Count usage in projects
  const usageMap = {};
  (db.programmes || []).forEach(p => {
    const fid = p.family || 'Other';
    usageMap[fid] = (usageMap[fid] || 0) + 1;
  });

  const html = `
    <div class="families-table-wrap">
      <table class="data-table families-inline-table">
        <thead>
          <tr>
            <th class="col-icon">Icon</th>
            <th>Family ID</th>
            <th>Family Name</th>
            <th>Description</th>
            <th class="col-center">Projects</th>
            <th class="col-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- New row -->
          <tr class="families-new-row">
            <td><input class="cell-edit" id="fNew-icon" placeholder="📋" maxlength="4" style="width:50px;text-align:center"></td>
            <td><input class="cell-edit" id="fNew-id" placeholder="e.g. HVAC"></td>
            <td><input class="cell-edit" id="fNew-label" placeholder="e.g. HVAC Systems"></td>
            <td><input class="cell-edit" id="fNew-desc" placeholder="Description…"></td>
            <td class="col-center">—</td>
            <td class="col-center">
              <button class="btn-icon" title="Add family" onclick="familiesAddRow()">✓</button>
            </td>
          </tr>
          ${families.length === 0 ? `
            <tr><td colspan="6" class="empty-state-cell">No families defined yet.</td></tr>
          ` : families.map(f => {
            const usage = usageMap[f.id] || 0;
            if (familiesEditingId === f.id) {
              return `
              <tr class="families-edit-row">
                <td><input class="cell-edit" id="fEdit-icon" value="${esc(f.icon || '📋')}" style="width:50px;text-align:center"></td>
                <td><input class="cell-edit" id="fEdit-id" value="${esc(f.name || f.id)}"></td>
                <td><input class="cell-edit" id="fEdit-label" value="${esc(f.label || '')}"></td>
                <td><input class="cell-edit" id="fEdit-desc" value="${esc(f.description || '')}"></td>
                <td class="col-center">${usage}</td>
                <td class="col-center">
                  <button class="btn-icon" title="Save" onclick="familiesSaveEdit('${esc(f.id)}')">✓</button>
                  <button class="btn-icon" title="Cancel" onclick="familiesCancelEdit()">✕</button>
                </td>
              </tr>`;
            }
            return `
            <tr>
              <td class="col-center" style="font-size:1.3em">${esc(f.icon || '📋')}</td>
              <td><code style="background:#f0f0f0;padding:2px 6px;border-radius:3px">${esc(f.name || f.id)}</code></td>
              <td><strong>${esc(f.label)}</strong></td>
              <td>${esc(f.description || '—')}</td>
              <td class="col-center"><span class="badge badge-NPI">${usage}</span></td>
              <td class="col-center">
                <button class="btn-icon" title="Edit" onclick="familiesStartEdit('${esc(f.id)}')">✏️</button>
                <button class="btn-icon" title="Delete" onclick="familiesDeleteRow('${esc(f.id)}', '${esc(f.label)}')">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Add new family from the new row inputs
 */
async function familiesAddRow() {
  const icon = document.getElementById('fNew-icon')?.value.trim() || '📋';
  const id = document.getElementById('fNew-id')?.value.trim();
  const label = document.getElementById('fNew-label')?.value.trim();
  const description = document.getElementById('fNew-desc')?.value.trim() || '';

  if (!id) {
    document.getElementById('fNew-id')?.focus();
    return;
  }
  if (!label) {
    document.getElementById('fNew-label')?.focus();
    return;
  }

  try {
    await familiesDataAddFamily(id, label, icon, description);
    // Re-focus id input for quick entry of next family
    document.getElementById('fNew-id').value = '';
    document.getElementById('fNew-label').value = '';
    document.getElementById('fNew-desc').value = '';
    document.getElementById('fNew-id')?.focus();
  } catch (err) {
    alert('Error adding family: ' + err.message);
  }
}

/**
 * Start editing a family row inline
 */
function familiesStartEdit(familyId) {
  familiesEditingId = familyId;
  renderFamiliesTabContent();
  document.getElementById('fEdit-label')?.focus();
}

/**
 * Save inline edit
 */
async function familiesSaveEdit(familyId) {
  const id = document.getElementById('fEdit-id')?.value.trim();
  const label = document.getElementById('fEdit-label')?.value.trim();

  if (!id) {
    document.getElementById('fEdit-id')?.focus();
    return;
  }
  if (!label) {
    document.getElementById('fEdit-label')?.focus();
    return;
  }

  const updates = {
    name: id,
    label: label,
    icon: document.getElementById('fEdit-icon')?.value.trim() || '📋',
    description: document.getElementById('fEdit-desc')?.value.trim() || ''
  };

  try {
    await familiesDataUpdateFamily(familyId, updates);
  } catch (err) {
    alert('Error saving family: ' + err.message);
  }

  familiesEditingId = null;
  renderFamiliesTabContent();
}

/**
 * Cancel inline edit
 */
function familiesCancelEdit() {
  familiesEditingId = null;
  renderFamiliesTabContent();
}

/**
 * Delete a family
 */
async function familiesDeleteRow(familyId, familyLabel) {
  // Check usage
  const usage = (db.programmes || []).filter(p => p.family === familyId).length;
  if (usage > 0) {
    if (!confirm(`Delete family "${familyLabel}"?\n\nWarning: ${usage} project${usage !== 1 ? 's' : ''} use this family. They will need to be reassigned manually.`)) {
      return;
    }
  } else {
    if (!confirm(`Delete family "${familyLabel}"? This cannot be undone.`)) return;
  }

  try {
    await familiesDataDeleteFamily(familyId);
    if (familiesEditingId === familyId) familiesEditingId = null;
    renderFamiliesTabContent();
  } catch (err) {
    alert('Error deleting family: ' + err.message);
  }
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
      productsActiveTab = tab;
      document.querySelectorAll('.products-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.products-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`products${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.add('active');

      if (tab === 'trends') {
        renderProductsTrends();
      } else if (tab === 'families') {
        renderFamiliesTabContent();
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
