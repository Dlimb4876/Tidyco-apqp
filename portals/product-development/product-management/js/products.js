/**
 * Products Management Portal
 * Main orchestrator for product list, CRUD, and overhaul history tracking
 * Uses inline editing — no modals
 */

// Track which product row is currently being edited
let productsEditingId = null;
let productsPortalListenerRoot = null;

// Track which products sub-tab is active so re-renders restore the correct tab
let productsActiveTab = 'list'; // 'list' | 'trends' | 'families'

// 1.7 Persist search state across renders
const PRODUCTS_SEARCH_KEY = 'products_search_state';
function loadProductsSearch() {
  try { return localStorage.getItem(PRODUCTS_SEARCH_KEY) || ''; } catch { return ''; }
}
function saveProductsSearch(val) {
  try { localStorage.setItem(PRODUCTS_SEARCH_KEY, val); } catch(e) {}
}

/**
 * Get products portal HTML
 */
function renderProductsPortalHTML() {
  const tab = productsActiveTab || 'list';
  return `
    <div class="products-portal" id="productsPortalRoot">
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
        <button class="btn btn-ghost" data-action="products-back-root">← Back to Product Development</button>
      </div>

      <div class="products-tabs">
        <button class="products-tab-btn ${tab === 'list' ? 'active' : ''}" data-action="products-switch-tab" data-tab="list">Product List</button>
        <button class="products-tab-btn ${tab === 'trends' ? 'active' : ''}" data-action="products-switch-tab" data-tab="trends">Overhaul Trends</button>
        <button class="products-tab-btn ${tab === 'families' ? 'active' : ''}" data-action="products-switch-tab" data-tab="families">Product Families</button>
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
    ensureFamiliesTabData(true);
  } else {
    renderProductsList();
  }
}

/**
 * Track which family is currently being edited
 */
let familiesEditingId = null;
let familiesTabLoading = false;
let familiesTabLoadError = null;

async function ensureFamiliesTabData(forceReload = false) {
  if (familiesTabLoading) return;
  if (!forceReload && Array.isArray(familiesState?.families) && familiesState.families.length > 0) return;

  familiesTabLoading = true;
  familiesTabLoadError = null;
  renderFamiliesTabContent();

  try {
    if (typeof familiesDataLoad === 'function') {
      await familiesDataLoad();
    } else if (typeof familiesDataInit === 'function') {
      await familiesDataInit();
    }
  } catch (err) {
    familiesTabLoadError = err?.message || 'Failed to load families';
  } finally {
    familiesTabLoading = false;
    renderFamiliesTabContent();
  }
}

/**
 * Render families tab content as editable table
 */
function renderFamiliesTabContent() {
  const container = document.getElementById('productsFamiliesTab');
  if (!container) return;

  // If families are still loading, show a spinner
  if (familiesTabLoading || familiesState.loading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families...</div>';
    return;
  }

  if (familiesTabLoadError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load product families</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(familiesTabLoadError)}</div>
        <button class="btn btn-ghost" data-action="families-retry-load">Retry</button>
      </div>
    `;
    return;
  }

  // If families state is missing or data array is absent, trigger a reload
  if (!familiesState || !Array.isArray(familiesState.families)) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families...</div>';
    ensureFamiliesTabData(true);
    return;
  }

  const families = typeof familiesDataGetAll === 'function' ? familiesDataGetAll() : [...familiesState.families];

  // Count usage in projects
  const usageMap = {};
  (db.programmes || []).forEach(p => {
    const fid = p.family || 'Other';
    usageMap[fid] = (usageMap[fid] || 0) + 1;
  });

  const html = `
    <div class="families-table-wrap">
      <table class="prod-tbl families-inline-table" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="width:60px">
          <col style="min-width:120px">
          <col style="min-width:180px">
          <col style="min-width:220px">
          <col style="width:80px">
          <col style="width:100px">
        </colgroup>
        <thead>
          <tr>
            <th class="ctr">Icon</th>
            <th>Family ID</th>
            <th>Family Name</th>
            <th>Description</th>
            <th class="ctr">Projects</th>
            <th class="families-actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- New row -->
          <tr class="row-new" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
            <td><input class="cell-edit" id="fNew-icon" placeholder="📋" maxlength="4" style="width:50px;text-align:center"></td>
            <td><input class="cell-edit" id="fNew-id" placeholder="e.g. HVAC"></td>
            <td><input class="cell-edit" id="fNew-label" placeholder="e.g. HVAC Systems"></td>
            <td><input class="cell-edit" id="fNew-desc" placeholder="Description…"></td>
            <td class="ctr">—</td>
            <td class="families-actions-col">
              <button class="btn-del" title="Add family" data-action="families-add-row">✓</button>
            </td>
          </tr>
          ${families.length === 0 ? `
            <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">No families defined yet.</td></tr>
          ` : families.map(f => {
            const usage = usageMap[f.id] || 0;
            if (familiesEditingId === f.id) {
              return `
              <tr class="row-new" style="background-color:rgba(255,191,0,0.05);border-top:2px solid rgba(255,191,0,0.2)">
                <td><input class="cell-edit" id="fEdit-icon" value="${esc(f.icon || '📋')}" style="width:50px;text-align:center"></td>
                <td><input class="cell-edit" id="fEdit-id" value="${esc(f.name || f.id)}"></td>
                <td><input class="cell-edit" id="fEdit-label" value="${esc(f.label || '')}"></td>
                <td><input class="cell-edit" id="fEdit-desc" value="${esc(f.description || '')}"></td>
                <td class="ctr">${usage}</td>
                <td class="families-actions-col">
                  <button class="btn-del" title="Save" data-action="families-save-edit" data-family-id="${esc(f.id)}">✓</button>
                  <button class="btn-del" title="Cancel" data-action="families-cancel-edit">✕</button>
                </td>
              </tr>`;
            }
            return `
            <tr>
              <td class="ctr" style="font-size:1.3em">${esc(f.icon || '📋')}</td>
              <td><code style="background:#f0f0f0;padding:2px 6px;border-radius:3px">${esc(f.name || f.id)}</code></td>
              <td><strong>${esc(f.label)}</strong></td>
              <td>${esc(f.description || '—')}</td>
              <td class="ctr"><span class="badge badge-NPI">${usage}</span></td>
              <td class="families-actions-col">
                <button class="btn-del" title="Edit" data-action="families-start-edit" data-family-id="${esc(f.id)}">✏️</button>
                <button class="btn-del" title="Delete" data-action="families-delete-row" data-family-id="${esc(f.id)}" data-family-label="${esc(f.label)}">🗑️</button>
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
    showToast('Error adding family: ' + err.message, 'error');
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
    showToast('Error saving family: ' + err.message, 'error');
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
    showToast('Error deleting family: ' + err.message, 'error');
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
  // 1.7 Restore saved search state if input not already focused
  const searchInput = document.getElementById('productSearch');
  if (searchInput && document.activeElement !== searchInput) {
    const saved = loadProductsSearch();
    if (saved) searchInput.value = saved;
  }
  const searchTerm = (searchInput?.value || '').toLowerCase();

  const filtered = products.filter(p => {
    if (!searchTerm) return true;
    return (p.name || '').toLowerCase().includes(searchTerm) ||
           (p.part_number || '').toLowerCase().includes(searchTerm) ||
           (p.customer || '').toLowerCase().includes(searchTerm);
  });

  const html = `
    <div class="products-table-wrap">
      <table class="prod-tbl products-inline-table" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="min-width:200px">
          <col style="min-width:140px">
          <col style="min-width:140px">
          <col style="min-width:100px">
          <col style="min-width:140px">
          <col style="min-width:120px">
          <col style="min-width:120px">
          <col style="min-width:200px">
          <col style="min-width:100px">
          <col style="width:80px">
        </colgroup>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Part Number</th>
          <th>Family</th>
          <th>Location</th>
          <th>Customer</th>
          <th class="ctr">Overhaul (hrs)</th>
          <th class="ctr">Turnaround (days)</th>
          <th>Notes</th>
          <th>Status</th>
          <th class="ctr">Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- New row -->
        <tr class="row-new" id="productsNewRow" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
          <td><input class="cell-edit" id="pNew-name" placeholder="Product name"></td>
          <td><input class="cell-edit" id="pNew-partNumber" placeholder="Part number"></td>
          <td><select class="cell-edit" id="pNew-family">${buildFamilyOptions('')}</select></td>
          <td><select class="cell-edit" id="pNew-location">${buildLocationOptions('')}</select></td>
          <td><input class="cell-edit" id="pNew-customer" placeholder="Customer"></td>
          <td><input class="cell-edit cell-num" id="pNew-hours" type="number" min="0" step="0.5" placeholder="0"></td>
          <td><input class="cell-edit cell-num" id="pNew-turnaround" type="number" min="0" step="1" placeholder="—"></td>
          <td><input class="cell-edit" id="pNew-notes" placeholder="Notes"></td>
          <td><select class="cell-edit" id="pNew-status">${buildStatusOptions('Tender')}</select></td>
          <td class="w28 ctr">
            <button class="btn-del" title="Add product" data-action="products-add-row">✓</button>
          </td>
        </tr>
        ${filtered.length === 0 ? `
          <tr><td colspan="10" style="text-align:center;padding:32px">
            <div style="color:var(--muted);margin-bottom:12px">No products found.</div>
            <button class="btn btn-primary btn-sm" data-action="products-focus-add">＋ Add First Product</button>
          </td></tr>
        ` : filtered.map(p => {
          const familyLabel = p.family ? (getFamilies().find(f => f.id === p.family)?.label || '—') : '—';
          if (productsEditingId === p.id) {
            return `
            <tr class="row-new" style="background-color:rgba(255,191,0,0.05);border-top:2px solid rgba(255,191,0,0.2)">
              <td><input class="cell-edit" id="pEdit-name" value="${esc(p.name || '')}"></td>
              <td><input class="cell-edit" id="pEdit-partNumber" value="${esc(p.part_number || '')}"></td>
              <td><select class="cell-edit" id="pEdit-family">${buildFamilyOptions(p.family || '')}</select></td>
              <td><select class="cell-edit" id="pEdit-location">${buildLocationOptions(p.work_location || '')}</select></td>
              <td><input class="cell-edit" id="pEdit-customer" value="${esc(p.customer || '')}"></td>
              <td><input class="cell-edit cell-num" id="pEdit-hours" type="number" min="0" step="0.5" value="${p.current_overhaul_hours || 0}"></td>
              <td><input class="cell-edit cell-num" id="pEdit-turnaround" type="number" min="0" step="1" value="${p.turnaround_days || ''}"></td>
              <td><input class="cell-edit" id="pEdit-notes" value="${esc(p.notes || '')}"></td>
              <td><select class="cell-edit" id="pEdit-status">${buildStatusOptions(p.status || 'Tender')}</select></td>
              <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
                <button class="btn-del" title="Save" data-action="products-save-edit" data-product-id="${esc(p.id)}">✓</button>
                <button class="btn-del" title="Cancel" data-action="products-cancel-edit">✕</button>
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
            <td class="ctr">${(p.current_overhaul_hours || 0).toFixed(1)}</td>
            <td class="ctr">${p.turnaround_days ? Math.round(p.turnaround_days) : '—'}</td>
            <td><div class="cell-display" title="${esc(p.notes || '')}">${p.notes ? esc(p.notes).substring(0, 40) + (p.notes.length > 40 ? '…' : '') : '—'}</div></td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
              <button class="btn-del" title="Edit" data-action="products-start-edit" data-product-id="${esc(p.id)}">✏️</button>
              <button class="btn-del" title="Delete" data-action="products-delete-row" data-product-id="${esc(p.id)}" data-product-name="${esc(p.name)}">🗑️</button>
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
    // 1.6 Clear fields for quick sequential entry; keep family/location/status
    const resetFields = {
      'pNew-name': '', 'pNew-partNumber': '', 'pNew-customer': '',
      'pNew-notes': '', 'pNew-hours': '0', 'pNew-turnaround': ''
    };
    Object.entries(resetFields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
    renderProductsList();
    // Return focus to name for next entry
    document.getElementById('pNew-name')?.focus();
    // Brief highlight on add row
    const newRow = document.getElementById('productsNewRow');
    if (newRow) {
      newRow.style.backgroundColor = 'rgba(59,130,246,0.12)';
      setTimeout(() => { newRow.style.backgroundColor = ''; }, 500);
    }
  } catch (err) {
    showToast('Error adding product: ' + err.message, 'error');
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
    showToast('Error saving product: ' + err.message, 'error');
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
    showToast('Error deleting product: ' + err.message, 'error');
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
  const root = document.getElementById('productsPortalRoot');
  if (root && productsPortalListenerRoot !== root) {
    productsPortalListenerRoot = root;
    root.addEventListener('click', async (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl || !root.contains(actionEl)) return;

      const action = actionEl.dataset.action;

      if (action === 'products-back-root') {
        setProductDevelopmentTab('root');
        render();
        return;
      }

      if (action === 'products-switch-tab') {
        const tab = actionEl.dataset.tab;
        if (!tab) return;

        productsActiveTab = tab;
        document.querySelectorAll('.products-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.products-tab-content').forEach(c => c.classList.remove('active'));
        actionEl.classList.add('active');
        document.getElementById(`products${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`)?.classList.add('active');

        if (tab === 'trends') {
          renderProductsTrends();
        } else if (tab === 'families') {
          renderFamiliesTabContent();
          ensureFamiliesTabData(true);
        } else {
          renderProductsList();
        }
        return;
      }

      if (action === 'families-retry-load') {
        ensureFamiliesTabData(true);
        return;
      }

      if (action === 'families-add-row') {
        await familiesAddRow();
        return;
      }

      if (action === 'families-save-edit') {
        await familiesSaveEdit(actionEl.dataset.familyId || '');
        return;
      }

      if (action === 'families-cancel-edit') {
        familiesCancelEdit();
        return;
      }

      if (action === 'families-start-edit') {
        familiesStartEdit(actionEl.dataset.familyId || '');
        return;
      }

      if (action === 'families-delete-row') {
        await familiesDeleteRow(actionEl.dataset.familyId || '', actionEl.dataset.familyLabel || '');
        return;
      }

      if (action === 'products-add-row') {
        await productsAddRow();
        return;
      }

      if (action === 'products-save-edit') {
        await productsSaveEdit(actionEl.dataset.productId || '');
        return;
      }

      if (action === 'products-cancel-edit') {
        productsCancelEdit();
        return;
      }

      if (action === 'products-start-edit') {
        productsStartEdit(actionEl.dataset.productId || '');
        return;
      }

      if (action === 'products-delete-row') {
        await productsDeleteRow(actionEl.dataset.productId || '', actionEl.dataset.productName || '');
      }

      if (action === 'products-focus-add') {
        document.getElementById('pNew-name')?.focus();
      }
    });
  }

  // Search — save state for persistence (1.7)
  document.getElementById('productSearch')?.addEventListener('input', (e) => {
    saveProductsSearch(e.target.value);
    renderProductsList();
  });

  // Allow Enter key on new row inputs to trigger add
  ['pNew-name', 'pNew-partNumber', 'pNew-customer', 'pNew-hours', 'pNew-turnaround', 'pNew-notes'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') productsAddRow();
    });
  });
}
