/**
 * Products Management Portal
 * Main orchestrator for product list, CRUD, and overhaul history tracking
 */

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
            <button class="btn btn-primary" id="btnAddProduct">+ Add Product</button>
          </div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('product-development')">← Back to Product Development</button>
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

      <!-- Add/Edit Product Modal -->
      <div id="productModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="modalTitle">Add Product</h2>
            <button class="modal-close">&times;</button>
          </div>
          <form id="productForm">
            <div class="form-group">
              <label>Product Name *</label>
              <input type="text" id="productName" required>
            </div>
            <div class="form-group">
              <label>Part Number *</label>
              <input type="text" id="productPartNumber" required>
            </div>
            <div class="form-group">
              <label>Product Family</label>
              <select id="productFamily">
                <option value="">Select a family...</option>
              </select>
            </div>
            <div class="form-group">
              <label>Customer *</label>
              <input type="text" id="productCustomer" required>
            </div>
            <div class="form-group">
              <label>Current Overhaul Time (hours)</label>
              <input type="number" id="productOverhaulHours" min="0" step="0.5">
            </div>
            <div class="form-group">
              <label>Turnaround Time (days)</label>
              <input type="number" id="productTurnaroundTime" min="0" step="0.5">
            </div>
            <div class="form-group">
              <label>Work Location</label>
              <select id="productWorkLocation">
                <option value="">Select location...</option>
                <option value="Unit 2">Unit 2</option>
                <option value="Unit 3">Unit 3</option>
                <option value="Unit 6">Unit 6</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="productStatus">
                <option value="Tender">Tender</option>
                <option value="NPI">NPI</option>
                <option value="Production">Production</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea id="productNotes" rows="3"></textarea>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Save Product</button>
              <button type="button" class="btn btn-secondary" id="btnModalCancel">Cancel</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `;
}

/**
 * Setup products portal after rendering
 */
function renderProductsPortalSetup() {
  // Populate family select with dynamic families
  const famSel = document.getElementById('productFamily');
  if (famSel) {
    famSel.innerHTML = '<option value="">Select a family...</option>' +
      getFamilies().map(f => `<option value="${esc(f.id)}">${esc(f.icon)} ${esc(f.label)}</option>`).join('');
  }
  setupProductsEventListeners();
  renderProductsList();
}

/**
 * Render products list table
 */
function renderProductsList() {
  const container = document.getElementById('productsTable');
  const products = productsDataGetAll();
  const searchTerm = document.getElementById('productSearch')?.value?.toLowerCase() || '';

  const filtered = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
           p.part_number.toLowerCase().includes(term) ||
           p.customer.toLowerCase().includes(term);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No products found. Add one to get started.</div>';
    return;
  }

  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Part Number</th>
          <th>Product Name</th>
          <th>Family</th>
          <th>Work Location</th>
          <th>Customer</th>
          <th>Overhaul (hrs)</th>
          <th>Turnaround (days)</th>
          <th>Notes</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(p => {
          const familyLabel = p.family ? (getFamilies().find(f => f.id === p.family)?.label || p.family) : '—';
          return `
          <tr>
            <td><strong>${esc(p.part_number)}</strong></td>
            <td>${esc(p.name)}</td>
            <td>${esc(familyLabel)}</td>
            <td>${esc(p.work_location || '—')}</td>
            <td>${esc(p.customer)}</td>
            <td class="numeric">${p.current_overhaul_hours.toFixed(1)}</td>
            <td class="numeric">${p.turnaround_days ? p.turnaround_days.toFixed(0) : '—'}</td>
            <td class="notes-cell" title="${esc(p.notes || '')}">${p.notes ? esc(p.notes).substring(0, 40) + (p.notes.length > 40 ? '...' : '') : '—'}</td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td class="actions">
              <button class="btn-icon" title="Edit" data-action="edit" data-id="${p.id}">✏️</button>
              <button class="btn-icon" title="Delete" data-action="delete" data-id="${p.id}">🗑️</button>
            </td>
          </tr>
        `;}).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  // Event delegation for action buttons
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      const productId = btn.dataset.id;
      const product = productsDataGetAll().find(p => p.id === productId);

      if (action === 'edit') {
        showProductModal(productId, product);
      } else if (action === 'delete') {
        if (confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
          await productsDataDeleteProduct(productId);
          renderProductsList();
          // Sync changes to production portal
          if (typeof prodDataReloadProducts === 'function') {
            await prodDataReloadProducts();
          }
        }
      }
    });
  });
}

/**
 * Show product add/edit modal
 */
function showProductModal(productId = null, product = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const title = document.getElementById('modalTitle');

  // Refresh family options in case families were edited
  const famSel = document.getElementById('productFamily');
  if (famSel) {
    famSel.innerHTML = '<option value="">Select a family...</option>' +
      getFamilies().map(f => `<option value="${esc(f.id)}">${esc(f.icon)} ${esc(f.label)}</option>`).join('');
  }

  if (productId && product) {
    title.textContent = `Edit Product: ${product.name}`;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPartNumber').value = product.part_number;
    document.getElementById('productFamily').value = product.family || '';
    document.getElementById('productCustomer').value = product.customer;
    document.getElementById('productOverhaulHours').value = product.current_overhaul_hours;
    document.getElementById('productTurnaroundTime').value = product.turnaround_days || '';
    document.getElementById('productWorkLocation').value = product.work_location || '';
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productNotes').value = product.notes || '';
    form.dataset.productId = productId;
  } else {
    title.textContent = 'Add Product';
    form.reset();
    delete form.dataset.productId;
    document.getElementById('productOverhaulHours').value = 0;
    document.getElementById('productTurnaroundTime').value = '';
    document.getElementById('productStatus').value = 'Tender';
  }

  modal.classList.add('active');
}

/**
 * Render overhaul trends visualization with KPIs and charts
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

      // Update active tabs/content
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

  // Add product button
  document.getElementById('btnAddProduct').addEventListener('click', () => showProductModal());

  // Product form
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('productForm').dataset.productId;
    const productData = {
      name: document.getElementById('productName').value,
      part_number: document.getElementById('productPartNumber').value,
      family: document.getElementById('productFamily').value,
      customer: document.getElementById('productCustomer').value,
      current_overhaul_hours: parseFloat(document.getElementById('productOverhaulHours').value) || 0,
      turnaround_days: parseFloat(document.getElementById('productTurnaroundTime').value) || null,
      work_location: document.getElementById('productWorkLocation').value || null,
      status: document.getElementById('productStatus').value,
      notes: document.getElementById('productNotes').value
    };

    try {
      if (productId) {
        await productsDataUpdateProduct(productId, productData);
      } else {
        await productsDataAddProduct(productData);
      }
      document.getElementById('productModal').classList.remove('active');
      renderProductsList();
      // Sync changes to production portal
      if (typeof prodDataReloadProducts === 'function') {
        await prodDataReloadProducts();
      }
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });

  // Modal cancel buttons
  document.getElementById('btnModalCancel').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}
