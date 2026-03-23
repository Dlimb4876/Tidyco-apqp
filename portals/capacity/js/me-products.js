/* ============================================================
   me-products.js — Products Tab Rendering
   ============================================================ */

const meProductsTableState = {
  ME: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [] },
  PM: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [] }
};

function meProductsGetState(department) {
  const key = department === 'PM' ? 'PM' : 'ME';
  if (!meProductsTableState[key]) {
    meProductsTableState[key] = { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [] };
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
  state.hiddenStatuses = [];
  state.historyOpenProductIds = [];
  meProductsRefreshTable();
};

window.meProductsToggleStatusFilter = function(status, isEnabled, department) {
  const state = meProductsGetState(department);
  const label = (status || '').toString();
  if (!label) return;

  if (!Array.isArray(state.hiddenStatuses)) {
    state.hiddenStatuses = [];
  }

  const hidden = new Set(state.hiddenStatuses);
  if (isEnabled) {
    hidden.delete(label);
  } else {
    hidden.add(label);
  }
  state.hiddenStatuses = Array.from(hidden);
  meProductsRefreshTable();
};

window.meProductsToggleHistory = function(productId, department) {
  if (!productId) return;
  const state = meProductsGetState(department);
  const current = new Set(Array.isArray(state.historyOpenProductIds) ? state.historyOpenProductIds : []);
  if (current.has(productId)) current.delete(productId);
  else current.add(productId);
  state.historyOpenProductIds = Array.from(current);
  meProductsRefreshTable();
};

window.meRenderProductsTab = function(productsArray, availableProducts, tasksArray) {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  const isPmContext = department === 'PM';
  const isLogContext = department === 'LOG';
  const state = meProductsGetState(department);

  const getSupportPerBatch = (product) => {
    const rawKitting = Number(product && (product.kittingTimeBookingHours ?? product.kitting_time_booking_hours));
    const rawMovement = Number(product && (product.productMovementHours ?? product.product_movement_hours));
    if (Number.isFinite(rawKitting) || Number.isFinite(rawMovement)) {
      return Math.max(0, Number.isFinite(rawKitting) ? rawKitting : 0) +
        Math.max(0, Number.isFinite(rawMovement) ? rawMovement : 0);
    }

    const explicitTotal = Number(product && (product.hoursPerWeek ?? product.hours_per_week));
    return Math.max(0, Number.isFinite(explicitTotal) ? explicitTotal : 0);
  };

  const updated = Array.isArray(productsArray) ? productsArray : meDataGetProducts();
  const tasks = tasksArray || meDataGetTasks();
  const allProducts = typeof meDataGetProducts === 'function' ? meDataGetProducts() : updated;

  const totalLoadPerBatch = updated.reduce((sum, p) => sum + getSupportPerBatch(p), 0);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const countBatchesForProductInRange = (product, rangeStart, rangeEnd) => {
    if (!product || !rangeStart || !rangeEnd) return 0;
    if (typeof window.meGetProductBatchCountInRange === 'function') {
      return window.meGetProductBatchCountInRange(product, rangeStart, rangeEnd);
    }

    const productDbId = product.productDatabaseId || product.product_database_id || null;
    if (!productDbId) return 0;

    const batches = (window.prodState && Array.isArray(window.prodState.batches))
      ? window.prodState.batches
      : [];

    let count = 0;
    batches.forEach(batch => {
      if (!batch || batch.product_id !== productDbId) return;
      if (!batch.start_date || !batch.due_date) return;

      const batchStart = new Date(batch.start_date);
      const batchEnd = new Date(batch.due_date);
      if (Number.isNaN(batchStart.getTime()) || Number.isNaN(batchEnd.getTime())) return;
      if (batchStart <= rangeEnd && batchEnd >= rangeStart) count += 1;
    });
    return count;
  };
  const totalLoadMonthly = updated.reduce((sum, product) => {
    const fallbackSupportPerBatch = getSupportPerBatch(product);

    if (typeof window.meGetProductBatchesInRange === 'function' && typeof window.meGetProductSupportHoursForBatch === 'function') {
      const overlappingBatches = window.meGetProductBatchesInRange(product, monthStart, monthEnd);
      const productMonthlyHours = overlappingBatches.reduce((running, batch) => {
        return running + window.meGetProductSupportHoursForBatch(product, batch, monthStart, fallbackSupportPerBatch);
      }, 0);
      return sum + productMonthlyHours;
    }

    const batchCount = countBatchesForProductInRange(product, monthStart, monthEnd);
    return sum + (fallbackSupportPerBatch * batchCount);
  }, 0);
  const activeProducts = updated.filter(p => {
    return countBatchesForProductInRange(p, monthStart, monthEnd) > 0;
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

  function resolveStatusForProduct(product) {
    if (!product) return 'Unknown';

    let dbProduct = null;
    if (product.productDatabaseId) {
      dbProduct = allProds.find(p => p.id === product.productDatabaseId) || null;
    }

    if (!dbProduct && product.name) {
      dbProduct = allProds.find(p => p.name === product.name) || null;
    }

    return (dbProduct && dbProduct.status)
      ? dbProduct.status
      : 'Unknown';
  }

  const preparedRows = updated.map((product, idx) => {
    const globalIdx = allProducts.indexOf(product);
    const rowIndex = globalIdx >= 0 ? globalIdx : idx;
    const familyLabel = resolveFamilyLabelForProduct(product);
    const statusLabel = resolveStatusForProduct(product);
    return {
      product,
      rowIndex,
      familyLabel,
      status: statusLabel,
      name: (product.name || '').toString(),
      hoursPerWeek: getSupportPerBatch(product),
      kittingTimeBookingHours: Math.max(0, Number(product.kittingTimeBookingHours) || 0),
      productMovementHours: Math.max(0, Number(product.productMovementHours) || 0),
      supportEffectiveDate: (product.supportEffectiveDate || '').toString(),
      notes: (product.notes || '').toString()
    };
  });

  const familyOptions = Array.from(new Set(
    preparedRows
      .map(r => r.familyLabel)
      .filter(label => label && label !== '—')
  )).sort((a, b) => a.localeCompare(b));

  const statusOptions = Array.from(new Set(
    preparedRows
      .map(r => r.status)
      .filter(label => label && label !== 'Unknown')
  )).sort((a, b) => a.localeCompare(b));

  const hiddenStatuses = Array.isArray(state.hiddenStatuses) ? state.hiddenStatuses : [];
  const hiddenStatusSet = new Set(hiddenStatuses);
  const historyOpenSet = new Set(Array.isArray(state.historyOpenProductIds) ? state.historyOpenProductIds : []);

  const supportHistory = typeof window.meDataGetProductSupportHistory === 'function'
    ? window.meDataGetProductSupportHistory()
    : [];

  function getProductHistoryRows(product) {
    if (!product || !product.id || !Array.isArray(supportHistory)) return [];
    const departmentTag = typeof meGetDepartmentFromContext === 'function'
      ? meGetDepartmentFromContext(product.department)
      : (product.department || 'ME');

    return supportHistory
      .filter(entry => entry && entry.productId === product.id && String(entry.department || 'ME').toUpperCase() === String(departmentTag || 'ME').toUpperCase())
      .slice()
      .sort((a, b) => {
        const aDate = String(a.effectiveDate || '');
        const bDate = String(b.effectiveDate || '');
        if (aDate === bDate) return 0;
        return aDate > bDate ? -1 : 1;
      });
  }

  const searchNeedle = state.search.trim().toLowerCase();
  let visibleRows = preparedRows.filter(row => {
    const familyMatch = state.family === 'all' || row.familyLabel === state.family;
    if (!familyMatch) return false;
    if (hiddenStatusSet.has(row.status)) return false;
    if (!searchNeedle) return true;

    const haystack = [row.name, row.familyLabel, row.status, row.notes]
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
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      case 'effectiveDate':
        return a.supportEffectiveDate.localeCompare(b.supportEffectiveDate) * dir;
      case 'name':
      default:
        return a.name.localeCompare(b.name) * dir;
    }
  });

  let rows = '';
  const totalColumnCount = isLogContext ? 10 : 8;
  visibleRows.forEach(row => {
    const product = row.product;
    const rowIndex = row.rowIndex;
    const historyRows = getProductHistoryRows(product);
    const historyIsOpen = historyOpenSet.has(product.id);
    const historyBody = historyRows.length > 0
      ? historyRows.map(entry => `
        <tr>
          <td>${esc(entry.effectiveDate || '')}</td>
          <td>${esc(entry.endDate || 'Current')}</td>
          <td>${Number(entry.hoursPerWeek || 0).toFixed(2)}</td>
          <td>${esc(entry.changeReason || '')}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="color:var(--muted)">No support history entries yet.</td></tr>`;

    rows += `
      <tr data-product-idx="${rowIndex}">
        <td>${esc(product.name)}</td>
        <td>${esc(row.familyLabel)}</td>
        <td>${typeof renderStatusBadge === 'function' ? renderStatusBadge(row.status) : esc(row.status)}</td>
        ${isLogContext
    ? `<td><input name="cap_products_${rowIndex}_kittingTimeBookingHours" type="number" value="${row.kittingTimeBookingHours || 0}" step="0.5" min="0" data-cap-action="cap-products-upd" data-field="kittingTimeBookingHours"></td>
        <td><input name="cap_products_${rowIndex}_productMovementHours" type="number" value="${row.productMovementHours || 0}" step="0.5" min="0" data-cap-action="cap-products-upd" data-field="productMovementHours"></td>
        <td><input name="cap_products_${rowIndex}_hoursPerWeek" type="number" value="${row.hoursPerWeek || 0}" step="0.5" data-field="hoursPerWeek" readonly></td>`
    : `<td><input name="cap_products_${rowIndex}_hoursPerWeek" type="number" value="${row.hoursPerWeek || 0}" step="0.5" min="0" data-field="hoursPerWeek"></td>`}
        <td><input name="cap_products_${rowIndex}_supportEffectiveDate" type="date" value="${esc(row.supportEffectiveDate || '')}" data-field="supportEffectiveDate"></td>
        <td><input name="cap_products_${rowIndex}_supportChangeReason" type="text" placeholder="Reason for change" data-field="supportChangeReason"></td>
        <td><input name="cap_products_${rowIndex}_notes" value="${esc(product.notes || '')}" data-cap-action="cap-products-upd" data-field="notes"></td>
        <td>
          <button class="btn btn-primary btn-sm" data-cap-action="cap-products-apply-hours">Apply Change</button>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-toggle-history" data-product-id="${esc(product.id || '')}" data-dept="${department}">${historyIsOpen ? 'Hide History' : 'View History'}</button>
        </td>
      </tr>
      ${historyIsOpen ? `
      <tr>
        <td colspan="${totalColumnCount}" style="background:var(--bg-soft)">
          <div style="padding:10px 12px">
            <div style="font-size:12px;font-weight:600;margin-bottom:8px">Support History</div>
            <table class="me-tbl" style="margin:0">
              <thead>
                <tr>
                  <th style="width:130px">Effective</th>
                  <th style="width:130px">Until</th>
                  <th style="width:120px">Hours/Batch</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>${historyBody}</tbody>
            </table>
          </div>
        </td>
      </tr>` : ''}`;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalLoadMonthly.toFixed(1)}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month (schedule)</div>
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
          <span style="font-size:12px;color:var(--muted)">${totalLoadPerBatch.toFixed(1)} h/batch · Showing ${visibleRows.length}/${preparedRows.length}</span>
        </div>
      <div class="me-card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <input
            type="text"
            placeholder="Filter by product or notes"
            value="${esc(state.search)}"
            data-cap-action="cap-products-search"
            data-dept="${department}"
            style="min-width:220px;flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
          <select
            data-cap-action="cap-products-family-filter"
            data-dept="${department}"
            style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
            <option value="all" ${state.family === 'all' ? 'selected' : ''}>All families</option>
            ${familyOptions.map(label => `<option value="${esc(label)}" ${state.family === label ? 'selected' : ''}>${esc(label)}</option>`).join('')}
          </select>
          <select
            data-cap-action="cap-products-sort"
            data-dept="${department}"
            style="min-width:170px;padding:8px 10px;border:1px solid var(--line);border-radius:6px"
          >
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Sort: Product</option>
            <option value="family" ${state.sortBy === 'family' ? 'selected' : ''}>Sort: Family</option>
            <option value="status" ${state.sortBy === 'status' ? 'selected' : ''}>Sort: Status</option>
            <option value="hours" ${state.sortBy === 'hours' ? 'selected' : ''}>Sort: Hours/Batch</option>
            <option value="effectiveDate" ${state.sortBy === 'effectiveDate' ? 'selected' : ''}>Sort: Effective Date</option>
          </select>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-sort-dir" data-dept="${department}" title="Toggle sort direction">
            ${state.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-clear-filters" data-dept="${department}">Clear</button>
        </div>
        ${statusOptions.length > 0 ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
            <span style="font-size:12px;color:var(--muted);font-weight:600">Statuses:</span>
            ${statusOptions.map(status => {
    const enabled = !hiddenStatusSet.has(status);
    return `
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text);padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--panel)">
                  <input
                    type="checkbox"
                    ${enabled ? 'checked' : ''}
                    data-cap-action="cap-products-status-toggle"
                    data-dept="${department}"
                    data-status="${esc(status)}"
                  >
                  <span>${esc(status)}</span>
                </label>
              `;
  }).join('')}
          </div>
        ` : ''}
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:200px">Product Name</th>
              <th style="width:150px">Product Family</th>
              <th style="width:130px">Product Status</th>
              ${isLogContext
    ? `<th style="width:170px">Kitting Booking In/Out</th>
              <th style="width:150px">Product Movement</th>
              <th style="width:120px">Hours/Batch</th>`
    : `<th style="width:120px">Hours/Batch</th>`}
              <th style="width:150px">Effective Date</th>
              <th style="width:180px">Change Reason</th>
              <th style="width:200px">Notes</th>
              <th style="width:180px">Actions</th>
            </tr></thead>
            <tbody>
              ${rows || `<tr><td colspan="${totalColumnCount}"><div style="text-align:center;padding:40px;color:var(--muted)">No ${isPmContext ? 'project' : 'production'} products found</div></td></tr>`}
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--muted); padding: 12px 0;">
          💡 ${isPmContext ? 'Project products' : 'Products'} are synced from the Product Management database. ${isLogContext ? 'For Logistics, Hours/Batch is calculated from Kitting Booking In/Out plus Product Movement. ' : ''}To avoid accidental history edits, support rate changes only save when you click Apply Change with an effective date and reason. Use View History on each row to audit past rates.
        </div>
      </div>
    </div>
    </div>`;
};
