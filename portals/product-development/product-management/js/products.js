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
        <h1>Product Management</h1>
        <div class="products-controls">
          <input
            type="text"
            id="productSearch"
            class="search-input"
            placeholder="Search by name, code, or customer..."
          >
          <button class="btn btn-primary" id="btnAddProduct">+ Add Product</button>
        </div>
      </div>

      <div class="products-tabs">
        <button class="products-tab-btn active" data-tab="list">Product List</button>
        <button class="products-tab-btn" data-tab="trends">Overhaul Trends</button>
      </div>

      <div id="productsListTab" class="products-tab-content active">
        <div id="productsTable"></div>
      </div>

      <div id="productsTrendsTab" class="products-tab-content">
        <div id="productsTrends"></div>
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
              <label>Product Code *</label>
              <input type="text" id="productCode" required>
            </div>
            <div class="form-group">
              <label>Product Family</label>
              <select id="productFamily">
                <option value="">Select a family...</option>
                <option value="HVAC">HVAC</option>
                <option value="Rotating Machines">Rotating Machines</option>
                <option value="Pneumatics">Pneumatics</option>
                <option value="Other">Other</option>
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

      <!-- Overhaul History Modal -->
      <div id="historyModal" class="modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2 id="historyTitle">Overhaul History</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div id="historyContent"></div>
        </div>
      </div>

      <!-- Add History Record Modal -->
      <div id="addHistoryModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add Overhaul Estimation</h2>
            <button class="modal-close">&times;</button>
          </div>
          <form id="historyForm">
            <div class="form-group">
              <label>Effective Date *</label>
              <input type="date" id="historyDate" required>
            </div>
            <div class="form-group">
              <label>Overhaul Time (hours) *</label>
              <input type="number" id="historyHours" min="0" step="0.5" required>
            </div>
            <div class="form-group">
              <label>Change Reason</label>
              <select id="historyReason">
                <option value="">Select a reason...</option>
                <option value="Process Improvement">Process Improvement</option>
                <option value="Equipment Upgrade">Equipment Upgrade</option>
                <option value="Scope Change">Scope Change</option>
                <option value="Efficiency Gain">Efficiency Gain</option>
                <option value="Design Change">Design Change</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea id="historyNotes" rows="3"></textarea>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Save Estimation</button>
              <button type="button" class="btn btn-secondary" id="btnHistoryCancel">Cancel</button>
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
           p.code.toLowerCase().includes(term) ||
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
          <th>Code</th>
          <th>Product Name</th>
          <th>Family</th>
          <th>Customer</th>
          <th>Current Overhaul (hrs)</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(p => `
          <tr>
            <td><strong>${esc(p.code)}</strong></td>
            <td>${esc(p.name)}</td>
            <td>${esc(p.family || '—')}</td>
            <td>${esc(p.customer)}</td>
            <td class="numeric">${p.current_overhaul_hours.toFixed(1)}</td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td class="actions">
              <button class="btn-icon" title="View History" data-action="history" data-id="${p.id}">📊</button>
              <button class="btn-icon" title="Edit" data-action="edit" data-id="${p.id}">✏️</button>
              <button class="btn-icon" title="Delete" data-action="delete" data-id="${p.id}">🗑️</button>
            </td>
          </tr>
        `).join('')}
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

      if (action === 'history') {
        showHistoryModal(productId, product);
      } else if (action === 'edit') {
        showProductModal(productId, product);
      } else if (action === 'delete') {
        if (confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
          await productsDataDeleteProduct(productId);
          renderProductsList();
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

  if (productId && product) {
    title.textContent = `Edit Product: ${product.name}`;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCode').value = product.code;
    document.getElementById('productFamily').value = product.family || '';
    document.getElementById('productCustomer').value = product.customer;
    document.getElementById('productOverhaulHours').value = product.current_overhaul_hours;
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productNotes').value = product.notes || '';
    form.dataset.productId = productId;
  } else {
    title.textContent = 'Add Product';
    form.reset();
    delete form.dataset.productId;
    document.getElementById('productOverhaulHours').value = 0;
    document.getElementById('productStatus').value = 'Tender';
  }

  modal.classList.add('active');
}

/**
 * Show overhaul history modal
 */
function showHistoryModal(productId, product) {
  const modal = document.getElementById('historyModal');
  const title = document.getElementById('historyTitle');
  const content = document.getElementById('historyContent');

  title.textContent = `Overhaul History: ${product.name} (${product.code})`;

  const history = productsDataGetHistory(productId);

  let html = `
    <div class="history-view">
      <div class="history-summary">
        <div class="summary-item">
          <div class="summary-label">Current Overhaul Time</div>
          <div class="summary-value">${product.current_overhaul_hours.toFixed(1)} hours</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Records</div>
          <div class="summary-value">${history.length}</div>
        </div>
      </div>
      <button class="btn btn-primary" id="btnAddHistoryFromModal">+ Add Estimation</button>
  `;

  if (history.length === 0) {
    html += '<div class="empty-state">No history records. Add one to start tracking.</div>';
  } else {
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Effective Date</th>
            <th>Overhaul (hrs)</th>
            <th>Change Reason</th>
            <th>Notes</th>
            <th>Created By</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((h, idx) => `
            <tr>
              <td><strong>${h.effective_date}</strong></td>
              <td class="numeric">${h.overhaul_hours.toFixed(1)}</td>
              <td>${esc(h.change_reason || '—')}</td>
              <td>${esc(h.notes || '—')}</td>
              <td>${esc(h.created_by_name || 'Unknown')}</td>
              <td>${new Date(h.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn-icon delete-history" data-history-id="${h.id}" title="Delete">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  html += '</div>';
  content.innerHTML = html;

  // Add event listeners for this modal
  document.getElementById('btnAddHistoryFromModal').addEventListener('click', () => {
    modal.classList.remove('active');
    showAddHistoryModal(productId);
  });

  content.querySelectorAll('.delete-history').forEach(btn => {
    btn.addEventListener('click', async () => {
      const historyId = btn.dataset.historyId;
      if (confirm('Delete this history record?')) {
        await productsDataDeleteHistory(productId, historyId);
        showHistoryModal(productId, product);
      }
    });
  });

  modal.classList.add('active');
}

/**
 * Show add history modal
 */
function showAddHistoryModal(productId) {
  const modal = document.getElementById('addHistoryModal');
  const form = document.getElementById('historyForm');

  form.reset();
  form.dataset.productId = productId;

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('historyDate').value = today;

  modal.classList.add('active');
}

/**
 * Render overhaul trends visualization
 */
function renderProductsTrends() {
  const container = document.getElementById('productsTrends');
  const products = productsDataGetAll();

  if (products.length === 0) {
    container.innerHTML = '<div class="empty-state">No products to display trends. Add products first.</div>';
    return;
  }

  const html = `
    <div class="trends-container">
      <h3>Overhaul Time Trends</h3>
      <p class="trends-subtitle">Select a product to view overhaul time changes over time</p>
      <select id="trendProductSelect" class="trend-select">
        <option value="">Choose a product...</option>
        ${products.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
      </select>
      <div id="trendChart" style="margin-top: 20px;"></div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('trendProductSelect').addEventListener('change', (e) => {
    const productId = e.target.value;
    if (productId) {
      renderTrendChart(productId);
    } else {
      document.getElementById('trendChart').innerHTML = '';
    }
  });
}

/**
 * Render trend chart for a specific product
 */
function renderTrendChart(productId) {
  const history = productsDataGetHistory(productId);
  const chartContainer = document.getElementById('trendChart');

  if (history.length === 0) {
    chartContainer.innerHTML = '<div class="empty-state">No history data for this product.</div>';
    return;
  }

  // Sort by effective date (oldest first)
  const sorted = [...history].sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));

  // Build simple chart HTML
  const maxHours = Math.max(...sorted.map(h => h.overhaul_hours));
  const minHours = Math.min(...sorted.map(h => h.overhaul_hours));
  const range = maxHours - minHours || 1;

  let html = `
    <div class="trend-chart">
      <table class="trend-table">
        <tr>
          <td style="text-align: right; padding-right: 10px; white-space: nowrap;"><strong>${maxHours.toFixed(1)}h</strong></td>
          <td colspan="2" style="height: 1px; background: #ddd;"></td>
        </tr>
  `;

  sorted.forEach((h, idx) => {
    const normalized = (h.overhaul_hours - minHours) / range * 100;
    html += `
      <tr>
        <td style="text-align: right; padding-right: 10px; white-space: nowrap; font-size: 0.9em;">${h.overhaul_hours.toFixed(1)}h</td>
        <td style="padding: 0;">
          <div style="display: flex; align-items: center; height: 30px;">
            <div style="width: ${normalized}%; height: 24px; background: #4CAF50; border-radius: 4px;" title="${h.effective_date}"></div>
          </div>
        </td>
        <td style="padding-left: 10px; font-size: 0.85em; color: #666;">
          <strong>${h.effective_date}</strong><br>
          ${esc(h.change_reason || '—')}
        </td>
      </tr>
    `;
  });

  html += `
      <tr>
        <td style="text-align: right; padding-right: 10px; white-space: nowrap;"><strong>${minHours.toFixed(1)}h</strong></td>
        <td colspan="2" style="height: 1px; background: #ddd;"></td>
      </tr>
    </table>
  </div>
  `;

  chartContainer.innerHTML = html;
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
      code: document.getElementById('productCode').value,
      family: document.getElementById('productFamily').value,
      customer: document.getElementById('productCustomer').value,
      current_overhaul_hours: parseFloat(document.getElementById('productOverhaulHours').value) || 0,
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
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  });

  // History form
  document.getElementById('historyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('historyForm').dataset.productId;
    const historyData = {
      overhaul_hours: parseFloat(document.getElementById('historyHours').value),
      effective_date: document.getElementById('historyDate').value,
      change_reason: document.getElementById('historyReason').value,
      notes: document.getElementById('historyNotes').value
    };

    try {
      await productsDataAddHistory(productId, historyData);
      document.getElementById('addHistoryModal').classList.remove('active');

      // Show updated history modal
      const product = productsDataGetAll().find(p => p.id === productId);
      showHistoryModal(productId, product);
    } catch (err) {
      alert('Error saving estimation: ' + err.message);
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

  document.getElementById('btnHistoryCancel').addEventListener('click', () => {
    document.getElementById('addHistoryModal').classList.remove('active');
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
