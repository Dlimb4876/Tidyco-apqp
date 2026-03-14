/* ============================================================
   me-products.js — Products Tab Rendering
   ============================================================ */

const meProductsTableState = {
  ME: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc' },
  PM: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc' }
};

function meProductsGetState(department) {
  const key = department === 'PM' ? 'PM' : 'ME';
  if (!meProductsTableState[key]) {
    meProductsTableState[key] = { search: '', family: 'all', sortBy: 'name', sortDir: 'asc' };
  }
  return meProductsTableState[key];
}

function meProductsRefreshTable() {
  if (typeof meRefreshCurrentTab === 'function') {
    meRefreshCurrentTab();
    return;
  }
  if (typeof render === 'function') render();
}

window.meProductsSetSearch = function(value, department) {
  const state = meProductsGetState(department);
  state.search = (value || '').toString();
  meProductsRefreshTable();
};

window.meProductsSetFamilyFilter = function(value, department) {
  const state = meProductsGetState(department);
  state.family = value || 'all';
  meProductsRefreshTable();
};

window.meProductsSetSort = function(value, department) {
  const state = meProductsGetState(department);
  state.sortBy = value || 'name';
  meProductsRefreshTable();
};

window.meProductsToggleSortDir = function(department) {
  const state = meProductsGetState(department);
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  meProductsRefreshTable();
};

window.meProductsClearFilters = function(department) {
  const state = meProductsGetState(department);
  state.search = '';
  state.family = 'all';
  state.sortBy = 'name';
  state.sortDir = 'asc';
  meProductsRefreshTable();
};

window.meRenderProductsTab = function(productsArray, availableProducts, tasksArray) {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  const isPmContext = department === 'PM';
  const state = meProductsGetState(department);

  const updated = Array.isArray(productsArray) ? productsArray : meDataGetProducts();
  const tasks = tasksArray || meDataGetTasks();
  const allProducts = typeof meDataGetProducts === 'function' ? meDataGetProducts() : updated;

  const weeksPerMonth = 4.33;
  const totalLoadWeekly = updated.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0).toFixed(1);
  const totalLoadMonthly = (totalLoadWeekly * weeksPerMonth).toFixed(1);
  const today = new Date();
  const activeProducts = updated.filter(p => {
    const from = new Date(p.supportFrom);
    const until = new Date(p.supportUntil);
    return from <= today && today <= until;
  }).length;

  // Calculate total demand (hours from tasks) for each product
  const demandByProduct = {};
  tasks.forEach(task => {
    if (task.productId) {
      if (!demandByProduct[task.productId]) demandByProduct[task.productId] = 0;
      const hours = task.totalHours || 0;
      demandByProduct[task.productId] += hours;
    }
  });

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

  const preparedRows = updated.map((product, idx) => {
    const globalIdx = allProducts.indexOf(product);
    const rowIndex = globalIdx >= 0 ? globalIdx : idx;
    const familyLabel = resolveFamilyLabelForProduct(product);
    return {
      product,
      rowIndex,
      familyLabel,
      name: (product.name || '').toString(),
      supportFrom: (product.supportFrom || '').toString(),
      supportUntil: (product.supportUntil || '').toString(),
      hoursPerWeek: Number(product.hoursPerWeek) || 0,
      notes: (product.notes || '').toString()
    };
  });

  const familyOptions = Array.from(new Set(
    preparedRows
      .map(r => r.familyLabel)
      .filter(label => label && label !== '—')
  )).sort((a, b) => a.localeCompare(b));

  const searchNeedle = state.search.trim().toLowerCase();
  let visibleRows = preparedRows.filter(row => {
    const familyMatch = state.family === 'all' || row.familyLabel === state.family;
    if (!familyMatch) return false;
    if (!searchNeedle) return true;

    const haystack = [row.name, row.familyLabel, row.notes]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchNeedle);
  });

  const dir = state.sortDir === 'desc' ? -1 : 1;
  visibleRows.sort((a, b) => {
    switch (state.sortBy) {
      case 'family':
        return a.familyLabel.localeCompare(b.familyLabel) * dir;
      case 'hours':
        return (a.hoursPerWeek - b.hoursPerWeek) * dir;
      case 'supportFrom':
        return a.supportFrom.localeCompare(b.supportFrom) * dir;
      case 'supportUntil':
        return a.supportUntil.localeCompare(b.supportUntil) * dir;
      case 'name':
      default:
        return a.name.localeCompare(b.name) * dir;
    }
  });

  let rows = '';
  visibleRows.forEach(row => {
    const product = row.product;
    const rowIndex = row.rowIndex;
    rows += `
      <tr>
        <td>${esc(product.name)}</td>
        <td>${esc(row.familyLabel)}</td>
        <td><input type="date" value="${product.supportFrom || ''}" onblur="meDataUpdateProduct(${rowIndex}, 'supportFrom', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportUntil || ''}" onblur="meDataUpdateProduct(${rowIndex}, 'supportUntil', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${product.hoursPerWeek || 0}" step="0.1" onchange="meDataUpdateProduct(${rowIndex}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td><input value="${esc(product.notes || '')}" onchange="meDataUpdateProduct(${rowIndex}, 'notes', this.value); meDebouncedSave();"></td>
      </tr>`;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalLoadMonthly}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${activeProducts}</div>
          <div class="me-kpi-label">Active Products</div>
          <div class="me-kpi-month">in support</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${updated.length}</div>
          <div class="me-kpi-label">Total Products</div>
          <div class="me-kpi-month">in production</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:12px;color:var(--muted)">${totalLoadWeekly} h/wk · Showing ${visibleRows.length}/${preparedRows.length}</span>
        </div>
      <div class="me-card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <input
            type="text"
            placeholder="Filter by product or notes"
            value="${esc(state.search)}"
            oninput="meProductsSetSearch(this.value, '${department}')"
            style="min-width:220px;flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
          <select
            onchange="meProductsSetFamilyFilter(this.value, '${department}')"
            style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
            <option value="all" ${state.family === 'all' ? 'selected' : ''}>All families</option>
            ${familyOptions.map(label => `<option value="${esc(label)}" ${state.family === label ? 'selected' : ''}>${esc(label)}</option>`).join('')}
          </select>
          <select
            onchange="meProductsSetSort(this.value, '${department}')"
            style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Sort: Product</option>
            <option value="family" ${state.sortBy === 'family' ? 'selected' : ''}>Sort: Family</option>
            <option value="hours" ${state.sortBy === 'hours' ? 'selected' : ''}>Sort: Hours/Week</option>
            <option value="supportFrom" ${state.sortBy === 'supportFrom' ? 'selected' : ''}>Sort: Support From</option>
            <option value="supportUntil" ${state.sortBy === 'supportUntil' ? 'selected' : ''}>Sort: Support Until</option>
          </select>
          <button class="btn btn-ghost btn-sm" onclick="meProductsToggleSortDir('${department}')" title="Toggle sort direction">
            ${state.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="meProductsClearFilters('${department}')">Clear</button>
        </div>
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:200px">Product Name</th>
              <th style="width:150px">Family</th>
              <th style="width:120px">Support From</th>
              <th style="width:120px">Support Until</th>
              <th style="width:120px">Hours/Week</th>
              <th style="width:200px">Notes</th>
            </tr></thead>
            <tbody>
              ${rows || `<tr><td colspan="6"><div style="text-align:center;padding:40px;color:var(--muted)">No ${isPmContext ? 'project' : 'production'} products found</div></td></tr>`}
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--muted); padding: 12px 0;">
          💡 ${isPmContext ? 'Project products' : 'Products'} are synced from the Product Management database. Edit support dates and hours per week as needed for capacity planning.
        </div>
      </div>
    </div>
    </div>`;
};
