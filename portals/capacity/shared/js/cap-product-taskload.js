/* ============================================================
   cap-product-taskload.js — Product Task Load Tab
   ============================================================ */

const capProductLoadTableState = {
  ME: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' },
  PM: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' },
  LOG: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' },
  UNIT6: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' }
};

window.capProductLoadTableState = capProductLoadTableState;

function capProductLoadRefresh(department) {
  if (department === 'PM' && typeof window.pmRefreshCurrentTab === 'function') return window.pmRefreshCurrentTab();
  if (department === 'LOG' && typeof window.logRefreshCurrentTab === 'function') return window.logRefreshCurrentTab();
  if (department === 'UNIT6' && typeof window.unit6RefreshCurrentTab === 'function') return window.unit6RefreshCurrentTab();
  if (typeof window.meRefreshCurrentTab === 'function') return window.meRefreshCurrentTab();
  if (typeof window.render === 'function') window.render();
  return null;
}

function capProductLoadResolveFamily(product) {
  if (!product) return '—';

  const allProducts = typeof window.productsDataGetAll === 'function' ? window.productsDataGetAll() : [];
  let dbProduct = null;
  if (product.productDatabaseId) {
    dbProduct = allProducts.find(entry => entry && entry.id === product.productDatabaseId) || null;
  }
  if (!dbProduct && product.name) {
    dbProduct = allProducts.find(entry => entry && entry.name === product.name) || null;
  }

  const familyRef = dbProduct && dbProduct.family ? dbProduct.family : (product.family || product.familyId || '');
  if (!familyRef) return '—';
  if (typeof window.findFamilyRecord === 'function') {
    const record = window.findFamilyRecord(familyRef);
    if (record) return record.label || record.name || record.id || familyRef;
  }

  const families = typeof window.getFamilies === 'function' ? window.getFamilies() : [];
  const match = families.find(entry => entry.id === familyRef || entry.name === familyRef || entry.label === familyRef);
  return match ? (match.label || match.name || match.id || familyRef) : familyRef;
}

window.capRenderProductTaskLoadTab = function(tasksArray, productsArray, department, tableState) {
  const dept = department || 'ME';
  const state = tableState || capProductLoadTableState[dept];
  const taskRows = Array.isArray(tasksArray) ? tasksArray : [];
  const productRows = Array.isArray(productsArray) ? productsArray : [];
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const tasksByProduct = {};

  taskRows.forEach(task => {
    const productId = task && task.productId ? task.productId : 'unassigned';
    if (!tasksByProduct[productId]) tasksByProduct[productId] = [];
    tasksByProduct[productId].push(task);
  });

  const loads = productRows.map(product => {
    const productTasks = tasksByProduct[product.id] || [];
    const family = capProductLoadResolveFamily(product);
    const supportPerBatch = Number(product.hoursPerWeek || 0) || 0;
    const batchCount = typeof window.capGetProductBatchCountInRange === 'function'
      ? window.capGetProductBatchCountInRange(product, monthStart, monthEnd)
      : 0;
    const taskHours = productTasks.reduce((sum, task) => sum + (Number(task && task.totalHours) || 0), 0);
    return {
      id: product.id,
      name: product.name || '(Unnamed product)',
      family,
      taskCount: productTasks.length,
      taskHours,
      monthlySupport: supportPerBatch * batchCount,
      total: taskHours + (supportPerBatch * batchCount)
    };
  });

  const familyOptions = Array.from(new Set(loads.map(load => load.family).filter(Boolean).filter(label => label !== '—'))).sort((left, right) => left.localeCompare(right));
  const searchNeedle = (state.search || '').trim().toLowerCase();
  const filteredLoads = loads.filter(load => {
    if (state.family !== 'all' && load.family !== state.family) return false;
    if (!searchNeedle) return true;
    return `${load.name} ${load.family}`.toLowerCase().includes(searchNeedle);
  });

  const direction = state.sortDir === 'asc' ? 1 : -1;
  filteredLoads.sort((left, right) => {
    if (state.sortBy === 'product') return left.name.localeCompare(right.name) * direction;
    if (state.sortBy === 'family') return left.family.localeCompare(right.family) * direction;
    if (state.sortBy === 'tasks') return (left.taskCount - right.taskCount) * direction;
    if (state.sortBy === 'support') return (left.monthlySupport - right.monthlySupport) * direction;
    return (left.total - right.total) * direction;
  });

  const totalTaskHours = loads.reduce((sum, load) => sum + load.taskHours, 0).toFixed(1);
  const totalMonthlySupport = loads.reduce((sum, load) => sum + load.monthlySupport, 0).toFixed(1);
  const totalMonthlyLoad = loads.reduce((sum, load) => sum + load.total, 0).toFixed(1);

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left:4px solid var(--green);">
          <div class="me-kpi-value">${totalTaskHours}</div>
          <div class="me-kpi-label">Task Hours</div>
          <div class="me-kpi-month">this month</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--blue);">
          <div class="me-kpi-value">${totalMonthlySupport}</div>
          <div class="me-kpi-label">Support Hours</div>
          <div class="me-kpi-month">batch-driven</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--navy);">
          <div class="me-kpi-value">${totalMonthlyLoad}</div>
          <div class="me-kpi-label">Total Load</div>
          <div class="me-kpi-month">${filteredLoads.length} products</div>
        </div>
      </div>
      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCT TASK LOAD ANALYSIS</span>
          <span style="font-size:11px;color:var(--muted);">${dept} Department</span>
        </div>
        <div class="me-card-body me-card-body-gutter">
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
            <input type="text" autocomplete="off" value="${esc(state.search || '')}" placeholder="Search products" data-cap-action="cap-product-load-search" data-dept="${dept}" style="min-width:220px;flex:1 1 220px;">
            <select autocomplete="off" data-cap-action="cap-product-load-family-filter" data-dept="${dept}">
              <option value="all">All families</option>
              ${familyOptions.map(family => `<option value="${esc(family)}" ${state.family === family ? 'selected' : ''}>${esc(family)}</option>`).join('')}
            </select>
            <select autocomplete="off" data-cap-action="cap-product-load-sort" data-dept="${dept}">
              <option value="total" ${state.sortBy === 'total' ? 'selected' : ''}>Sort by total load</option>
              <option value="product" ${state.sortBy === 'product' ? 'selected' : ''}>Sort by product</option>
              <option value="family" ${state.sortBy === 'family' ? 'selected' : ''}>Sort by family</option>
              <option value="tasks" ${state.sortBy === 'tasks' ? 'selected' : ''}>Sort by tasks</option>
              <option value="support" ${state.sortBy === 'support' ? 'selected' : ''}>Sort by support</option>
            </select>
            <button class="btn btn-secondary btn-sm" data-cap-action="cap-product-load-sort-dir" data-dept="${dept}">${state.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-product-load-clear-filters" data-dept="${dept}">Clear</button>
          </div>
          <table class="tbl" style="width:100%;">
            <thead>
              <tr>
                <th>Product</th>
                <th>Family</th>
                <th style="text-align:right;">Tasks</th>
                <th style="text-align:right;">Task Hours</th>
                <th style="text-align:right;">Support / Month</th>
                <th style="text-align:right;">Total Load</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoads.length === 0 ? `<tr><td colspan="6" style="padding:16px;text-align:center;color:var(--muted);">No product load rows match the current filters.</td></tr>` : filteredLoads.map(load => `
                <tr>
                  <td>${esc(load.name)}</td>
                  <td>${esc(load.family)}</td>
                  <td style="text-align:right;">${load.taskCount}</td>
                  <td style="text-align:right;">${load.taskHours.toFixed(1)} h</td>
                  <td style="text-align:right;">${load.monthlySupport.toFixed(1)} h</td>
                  <td style="text-align:right;font-weight:600;">${load.total.toFixed(1)} h</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
};

window.capProductLoadSetSearch = function(value, department) {
  const state = capProductLoadTableState[department] || capProductLoadTableState.ME;
  state.search = (value || '').toString();
  capProductLoadRefresh(department);
};

window.capProductLoadSetFamilyFilter = function(value, department) {
  const state = capProductLoadTableState[department] || capProductLoadTableState.ME;
  state.family = value || 'all';
  capProductLoadRefresh(department);
};

window.capProductLoadSetSort = function(value, department) {
  const state = capProductLoadTableState[department] || capProductLoadTableState.ME;
  state.sortBy = value || 'total';
  capProductLoadRefresh(department);
};

window.capProductLoadToggleSortDir = function(department) {
  const state = capProductLoadTableState[department] || capProductLoadTableState.ME;
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  capProductLoadRefresh(department);
};

window.capProductLoadClearFilters = function(department) {
  const state = capProductLoadTableState[department] || capProductLoadTableState.ME;
  state.search = '';
  state.family = 'all';
  state.sortBy = 'total';
  state.sortDir = 'desc';
  capProductLoadRefresh(department);
};
