/* ============================================================
   me-product-taskload.js — Product Task Load Tab
   Shows demand calculation per product from task list
   ============================================================ */

const meProductLoadTableState = {
  ME: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' },
  PM: { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' }
};

function meProductLoadGetState(department) {
  const key = department === 'PM' ? 'PM' : 'ME';
  if (!meProductLoadTableState[key]) {
    meProductLoadTableState[key] = { search: '', family: 'all', sortBy: 'total', sortDir: 'desc' };
  }
  return meProductLoadTableState[key];
}

function meProductLoadRefreshTable() {
  if (typeof meRefreshCurrentTab === 'function') {
    meRefreshCurrentTab();
    return;
  }
  if (typeof render === 'function') render();
}

window.meProductLoadSetSearch = function(value, department) {
  const state = meProductLoadGetState(department);
  state.search = (value || '').toString();
  meProductLoadRefreshTable();
};

window.meProductLoadSetFamilyFilter = function(value, department) {
  const state = meProductLoadGetState(department);
  state.family = value || 'all';
  meProductLoadRefreshTable();
};

window.meProductLoadSetSort = function(value, department) {
  const state = meProductLoadGetState(department);
  state.sortBy = value || 'total';
  meProductLoadRefreshTable();
};

window.meProductLoadToggleSortDir = function(department) {
  const state = meProductLoadGetState(department);
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  meProductLoadRefreshTable();
};

window.meProductLoadClearFilters = function(department) {
  const state = meProductLoadGetState(department);
  state.search = '';
  state.family = 'all';
  state.sortBy = 'total';
  state.sortDir = 'desc';
  meProductLoadRefreshTable();
};

// HTML escape utility is provided globally by utils/js/helpers.js

window.meRenderProductTaskLoadTab = function(tasksArray, productsArray) {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  const isPmContext = department === 'PM';
  const state = meProductLoadGetState(department);

  const weeksPerMonth = 4.33;
  const allProds = typeof window.productsDataGetAll === 'function' ? window.productsDataGetAll() : [];
  const families = typeof getFamilies === 'function' ? getFamilies() : [];

  function resolveFamilyLabel(familyRef) {
    if (!familyRef) return '—';

    if (typeof findFamilyRecord === 'function') {
      const matched = findFamilyRecord(familyRef);
      if (matched) return matched.label || matched.name || matched.id || familyRef;
    }

    const matched = families.find(f =>
      f.id === familyRef ||
      f.name === familyRef ||
      f.label === familyRef
    );
    return matched ? (matched.label || matched.name || matched.id || familyRef) : familyRef;
  }

  function resolveFamilyLabelForProduct(product) {
    if (!product) return '—';

    let dbProduct = null;
    if (product.productDatabaseId) {
      dbProduct = allProds.find(p => p.id === product.productDatabaseId) || null;
    }

    // Fallback for legacy ME/PM rows that predate productDatabaseId backfill.
    if (!dbProduct && product.name) {
      dbProduct = allProds.find(p => p.name === product.name) || null;
    }

    const familyRef = (dbProduct && dbProduct.family)
      ? dbProduct.family
      : (product.family || product.familyId || '');

    return resolveFamilyLabel(familyRef);
  }

  // Group tasks by productId
  const tasksByProduct = {};
  tasksArray.forEach(task => {
    const productId = task.productId || 'unassigned';
    if (!tasksByProduct[productId]) {
      tasksByProduct[productId] = [];
    }
    tasksByProduct[productId].push(task);
  });

  // Build product load summary
  const productLoads = productsArray.map(product => {
    const tasks = tasksByProduct[product.id] || [];
    const totalHours = tasks.reduce((sum, t) => sum + (t.totalHours || 0), 0);
    const taskCount = tasks.length;

    const familyLabel = resolveFamilyLabelForProduct(product);

    // Group tasks by category
    const categories = {};
    tasks.forEach(task => {
      const cat = task.category || 'Other';
      if (!categories[cat]) {
        categories[cat] = { count: 0, hours: 0 };
      }
      categories[cat].count += 1;
      categories[cat].hours += parseFloat(task.totalHours) || 0;
    });

    return {
      productId: product.id,
      productName: product.name,
      family: familyLabel,
      totalHours,
      taskCount,
      categories,
      tasks,
      hoursPerWeek: product.hoursPerWeek || 0
    };
  });

  const familyOptions = Array.from(new Set(
    productLoads
      .map(load => load.family)
      .filter(label => label && label !== '—')
  )).sort((a, b) => a.localeCompare(b));

  const searchNeedle = state.search.trim().toLowerCase();
  let visibleLoads = productLoads.filter(load => {
    const familyMatch = state.family === 'all' || load.family === state.family;
    if (!familyMatch) return false;
    if (!searchNeedle) return true;

    const haystack = [load.productName, load.family]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchNeedle);
  });

  const dir = state.sortDir === 'desc' ? -1 : 1;
  visibleLoads.sort((a, b) => {
    switch (state.sortBy) {
      case 'product':
        return a.productName.localeCompare(b.productName) * dir;
      case 'family':
        return a.family.localeCompare(b.family) * dir;
      case 'tasks':
        return (a.taskCount - b.taskCount) * dir;
      case 'support':
        return (a.hoursPerWeek - b.hoursPerWeek) * dir;
      case 'total':
      default:
        return (a.totalHours - b.totalHours) * dir;
    }
  });

  // Calculate totals
  const totalTaskHours = productLoads.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1);
  const totalTasks = tasksArray.length;
  const totalMonthlySupport = (productsArray.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0) * weeksPerMonth).toFixed(1);
  const totalMonthlyLoad = (parseFloat(totalTaskHours) + parseFloat(totalMonthlySupport)).toFixed(1);

  // Unassigned tasks
  const unassignedTasks = tasksByProduct['unassigned'] || [];
  const unassignedHours = unassignedTasks.reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);

  let rows = '';
  visibleLoads.forEach(load => {
    rows += `
      <tr>
        <td><strong>${esc(load.productName)}</strong></td>
        <td>${esc(load.family)}</td>
        <td style="text-align: center;">${load.taskCount}</td>
        <td style="text-align: right;">${(load.hoursPerWeek * weeksPerMonth).toFixed(1)}h</td>
        <td style="text-align: right;">${load.totalHours.toFixed(1)}</td>
        <td style="text-align: right;">${(parseFloat(load.totalHours) + load.hoursPerWeek * weeksPerMonth).toFixed(1)}h</td>
      </tr>`;
  });

  // Add unassigned row if exists
  if (unassignedHours > 0) {
    rows += `
      <tr style="background: var(--surface-low);">
        <td><em>Unassigned Tasks</em></td>
        <td style="text-align: center;">${unassignedTasks.length}</td>
        <td style="text-align: right;">—</td>
        <td style="text-align: right;">${unassignedHours}</td>
        <td style="text-align: right;">${unassignedHours}h</td>
      </tr>`;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalTaskHours}</div>
          <div class="me-kpi-label">Task Demand</div>
          <div class="me-kpi-month">total hours</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${totalMonthlySupport}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${totalMonthlyLoad}</div>
          <div class="me-kpi-label">Total Load</div>
          <div class="me-kpi-month">task + support</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${totalTasks}</div>
          <div class="me-kpi-label">Tasks</div>
          <div class="me-kpi-month">assigned</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCT TASK LOAD ANALYSIS</span>
          <span style="font-size:12px;color:var(--muted)">Demand from ${isPmContext ? 'PM' : 'ME'} capacity tasks per product · Showing ${visibleLoads.length}/${productLoads.length}</span>
        </div>
        <div class="me-card-body">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
            <input
              type="text"
              placeholder="Filter by product"
              value="${esc(state.search)}"
              data-cap-action="cap-product-load-search"
              data-dept="${department}"
              style="min-width:220px;flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
            >
            <select
              data-cap-action="cap-product-load-family-filter"
              data-dept="${department}"
              style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
            >
              <option value="all" ${state.family === 'all' ? 'selected' : ''}>All families</option>
              ${familyOptions.map(label => `<option value="${esc(label)}" ${state.family === label ? 'selected' : ''}>${esc(label)}</option>`).join('')}
            </select>
            <select
              data-cap-action="cap-product-load-sort"
              data-dept="${department}"
              style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
            >
              <option value="total" ${state.sortBy === 'total' ? 'selected' : ''}>Sort: Task Demand</option>
              <option value="tasks" ${state.sortBy === 'tasks' ? 'selected' : ''}>Sort: Tasks</option>
              <option value="support" ${state.sortBy === 'support' ? 'selected' : ''}>Sort: Support/Month</option>
              <option value="family" ${state.sortBy === 'family' ? 'selected' : ''}>Sort: Family</option>
              <option value="product" ${state.sortBy === 'product' ? 'selected' : ''}>Sort: Product</option>
            </select>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-product-load-sort-dir" data-dept="${department}" title="Toggle sort direction">
              ${state.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-product-load-clear-filters" data-dept="${department}">Clear</button>
          </div>
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="width:200px">Product</th>
                <th style="width:150px">Family</th>
                <th style="width:80px">Tasks</th>
                <th style="width:120px">Support/Month</th>
                <th style="width:120px">Task Demand</th>
                <th style="width:120px">Total Product Demand</th>
              </tr></thead>
              <tbody>
                ${rows || '<tr><td colspan="7"><div style="text-align:center;padding:40px;color:var(--muted)">No tasks assigned to products</div></td></tr>'}
              </tbody>
            </table>
          </div>
          <div style="font-size: 12px; color: var(--muted); padding: 12px 0; margin-top: 12px;">
            💡 Support/Month = support hours per week × 4.33 | Total Load = Task Demand + Support/Month | Task Demand = sum of ${isPmContext ? 'PM' : 'ME'} capacity task hours
          </div>
        </div>
      </div>
    </div>
  `;
};
