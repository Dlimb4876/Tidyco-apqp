/* ============================================================
   cap-products.js — Products Tab Rendering
   ============================================================ */

const capProductsTableState = {
  ME: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  PM: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  LOG: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  UNIT6: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} }
};

window.capProductsTableState = capProductsTableState;

function capProductsWithLegacyDepartment(department, callback) {
  const contextKey = 'me' + 'CurrentDepartmentContext';
  const previous = window[contextKey];
  window[contextKey] = department || 'ME';
  try {
    return callback();
  } finally {
    window[contextKey] = previous;
  }
}

function capProductsLegacyHelper(name) {
  return window['me' + 'Products' + name];
}

function capProductsNormalizeDepartmentKey(department) {
  const key = (department || 'ME').toString().toUpperCase();
  if (key === 'PM' || key === 'LOG' || key === 'UNIT6') return key;
  return 'ME';
}

function capProductsGetState(department) {
  const key = capProductsNormalizeDepartmentKey(department);
  if (!capProductsTableState[key]) {
    capProductsTableState[key] = { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} };
  }
  return capProductsTableState[key];
}

function capProductsRefreshTable(department) {
  if (department === 'PM' && typeof window.pmRefreshCurrentTab === 'function') return window.pmRefreshCurrentTab();
  if (department === 'LOG' && typeof window.logRefreshCurrentTab === 'function') return window.logRefreshCurrentTab();
  if (department === 'UNIT6' && typeof window.unit6RefreshCurrentTab === 'function') return window.unit6RefreshCurrentTab();
  if (typeof window.meRefreshCurrentTab === 'function') return window.meRefreshCurrentTab();
  if (typeof window.render === 'function') window.render();
  return null;
}

function capProductsNormalizeRowIndex(rowIndex) {
  const parsed = Number(rowIndex);
  if (!Number.isFinite(parsed) || parsed < 0) return -1;
  return Math.trunc(parsed);
}

function capProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId) {
  const keys = [];
  if (productId) keys.push(`product:${productId}`);
  if (productDatabaseId) keys.push(`db:${productDatabaseId}`);
  const normalizedRowIndex = capProductsNormalizeRowIndex(rowIndex);
  if (normalizedRowIndex >= 0) keys.push(`row:${normalizedRowIndex}`);
  return keys;
}

function capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId) {
  const candidates = capProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId);
  for (let index = 0; index < candidates.length; index += 1) {
    const key = candidates[index];
    if (state.drafts[key]) {
      return { key, value: state.drafts[key], candidates };
    }
  }
  return { key: candidates[0] || null, value: null, candidates };
}

function capProductsEscape(value) {
  if (typeof window.escapeHtml === 'function') return window.escapeHtml(value == null ? '' : String(value));
  if (typeof window.esc === 'function') return window.esc(value == null ? '' : String(value));
  return String(value == null ? '' : value);
}

function capProductsResolveFamily(product) {
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

function capProductsGetApi(department) {
  if (department === 'PM') {
    return {
      getProducts: window.pmDataGetProducts,
      getHistory: window.pmDataGetProductSupportHistory,
      updateProduct: window.pmDataUpdateProduct,
      updateHistory: window.pmDataUpdateProductSupportHistoryEntry,
      deleteHistory: window.pmDataDeleteProductSupportHistoryEntry,
      debouncedSave: window.pmDebouncedSave
    };
  }
  if (department === 'LOG') {
    return {
      getProducts: window.logDataGetProducts,
      getHistory: window.logDataGetProductSupportHistory,
      updateProduct: window.logDataUpdateProduct,
      updateHistory: window.logDataUpdateProductSupportHistoryEntry,
      deleteHistory: window.logDataDeleteProductSupportHistoryEntry,
      debouncedSave: window.logDebouncedSave
    };
  }
  if (department === 'UNIT6') {
    return {
      getProducts: window.unit6DataGetProducts,
      getHistory: window.unit6DataGetProductSupportHistory,
      updateProduct: window.unit6DataUpdateProduct,
      updateHistory: window.unit6DataUpdateProductSupportHistoryEntry,
      deleteHistory: window.unit6DataDeleteProductSupportHistoryEntry,
      debouncedSave: window.unit6DebouncedSave
    };
  }
  return {
    getProducts: window.meDataGetProducts,
    getHistory: window.meDataGetProductSupportHistory,
    updateProduct: window.meDataUpdateProduct,
    updateHistory: window.meDataUpdateProductSupportHistoryEntry,
    deleteHistory: window.meDataDeleteProductSupportHistoryEntry,
    debouncedSave: window.meDebouncedSave
  };
}

function capProductsGetHistoryRows(department, productId) {
  const api = capProductsGetApi(department);
  const rows = typeof api.getHistory === 'function' ? api.getHistory() : [];
  return (Array.isArray(rows) ? rows : [])
    .filter(row => row && row.productId === productId)
    .sort((left, right) => {
      const leftDate = left.effectiveDate || '';
      const rightDate = right.effectiveDate || '';
      if (leftDate < rightDate) return -1;
      if (leftDate > rightDate) return 1;
      return 0;
    });
}

function capProductsRoleLabel(department) {
  if (department === 'LOG') return 'Logistics';
  if (department === 'UNIT6') return 'Unit 6';
  if (department === 'PM') return 'Project Management';
  return 'ME';
}

function capProductsHistoryTable(productId, department, historyRows, state, isLogContext) {
  if (!state.historyOpenProductIds.includes(productId)) return '';

  if (!historyRows.length) {
    return `
      <tr class="cap-products-history-row">
        <td colspan="${isLogContext ? 9 : 6}" style="padding:12px 16px;color:var(--muted);">No support history recorded yet for this product.</td>
      </tr>
    `;
  }

  return historyRows.map(row => {
    const isEditing = state.historyEditingId === row.id;
    if (isEditing) {
      const draft = state.historyEditDraft || row;
      return `
        <tr class="cap-products-history-row" data-history-edit-row>
          <td colspan="${isLogContext ? 9 : 6}" style="padding:12px 16px;background:var(--overlay-light);">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <input type="date" value="${capProductsEscape(draft.effectiveDate || '')}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="effectiveDate" data-dept="${department}">
              ${isLogContext ? `<input type="number" step="0.1" value="${capProductsEscape(draft.kittingHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="kittingHours" data-dept="${department}" placeholder="Kitting">` : ''}
              ${isLogContext ? `<input type="number" step="0.1" value="${capProductsEscape(draft.bookingInOutHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="bookingInOutHours" data-dept="${department}" placeholder="Booking In/Out">` : ''}
              ${isLogContext ? `<input type="number" step="0.1" value="${capProductsEscape(draft.productMovementHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="productMovementHours" data-dept="${department}" placeholder="Product Movement">` : ''}
              <input type="number" step="0.1" value="${capProductsEscape(draft.hoursPerWeek || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="hoursPerWeek" data-dept="${department}" ${isLogContext ? 'readonly' : ''}>
              <input type="text" value="${capProductsEscape(draft.changeReason || '')}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="changeReason" data-dept="${department}" placeholder="Reason">
              <button class="btn btn-primary btn-sm" data-cap-action="cap-products-save-history-edit" data-history-id="${row.id}" data-dept="${department}">Save</button>
              <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-cancel-history-edit" data-dept="${department}">Cancel</button>
            </div>
          </td>
        </tr>
      `;
    }

    return `
      <tr class="cap-products-history-row">
        <td colspan="${isLogContext ? 9 : 6}" style="padding:12px 16px;background:var(--overlay-light);">
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
            <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
              <span><strong>Effective:</strong> ${capProductsEscape(row.effectiveDate || '—')}</span>
              ${isLogContext ? `<span><strong>Kitting:</strong> ${Number(row.kittingHours || 0).toFixed(1)} h</span>` : ''}
              ${isLogContext ? `<span><strong>Booking In/Out:</strong> ${Number(row.bookingInOutHours || 0).toFixed(1)} h</span>` : ''}
              ${isLogContext ? `<span><strong>Movement:</strong> ${Number(row.productMovementHours || 0).toFixed(1)} h</span>` : ''}
              <span><strong>Hours/Batch:</strong> ${Number(row.hoursPerWeek || 0).toFixed(1)} h</span>
              <span><strong>Reason:</strong> ${capProductsEscape(row.changeReason || '—')}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-edit-history" data-history-id="${row.id}" data-dept="${department}" data-effective-date="${capProductsEscape(row.effectiveDate || '')}" data-hours="${capProductsEscape(row.hoursPerWeek || 0)}" data-reason="${capProductsEscape(row.changeReason || '')}" data-kitting="${capProductsEscape(row.kittingHours || 0)}" data-booking="${capProductsEscape(row.bookingInOutHours || 0)}" data-movement="${capProductsEscape(row.productMovementHours || 0)}">Edit</button>
              <button class="btn btn-danger btn-sm" data-cap-action="cap-products-delete-history" data-history-id="${row.id}" data-dept="${department}">Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.capRenderProductsTab = function(productsArray, tasksArray, department, tableState) {
  const dept = department || 'ME';
  const state = tableState || capProductsGetState(dept);
  const products = Array.isArray(productsArray) ? productsArray : [];
  const historyCount = products.reduce((sum, product) => sum + capProductsGetHistoryRows(dept, product.id).length, 0);
  const isLogContext = dept === 'LOG';
  const today = new Date().toISOString().split('T')[0];

  const rows = products.map((product, index) => {
    const family = capProductsResolveFamily(product);
    const historyRows = capProductsGetHistoryRows(dept, product.id);
    const latestHistory = historyRows.length ? historyRows[historyRows.length - 1] : null;
    const status = product.status || 'Active';
    const draft = window.capProductsGetDraftValue(dept, product.id, index, product.productDatabaseId) || {};
    const kittingHours = Number(draft.kittingHours != null ? draft.kittingHours : (product.kittingHours != null ? product.kittingHours : (latestHistory && latestHistory.kittingHours != null ? latestHistory.kittingHours : 0))) || 0;
    const bookingInOutHours = Number(draft.bookingInOutHours != null ? draft.bookingInOutHours : (product.bookingInOutHours != null ? product.bookingInOutHours : (latestHistory && latestHistory.bookingInOutHours != null ? latestHistory.bookingInOutHours : 0))) || 0;
    const productMovementHours = Number(draft.productMovementHours != null ? draft.productMovementHours : (product.productMovementHours != null ? product.productMovementHours : (latestHistory && latestHistory.productMovementHours != null ? latestHistory.productMovementHours : 0))) || 0;
    const baseHours = draft.hoursPerWeek != null
      ? Number(draft.hoursPerWeek)
      : Number(product.hoursPerWeek != null ? product.hoursPerWeek : (latestHistory ? latestHistory.hoursPerWeek : 0));
    const hoursPerWeek = isLogContext ? (kittingHours + bookingInOutHours + productMovementHours) : (Number.isFinite(baseHours) ? baseHours : 0);
    const effectiveDate = draft.supportEffectiveDate || product.supportEffectiveDate || (latestHistory && latestHistory.effectiveDate) || today;
    const changeReason = draft.supportChangeReason || '';
    return {
      product,
      index,
      family,
      status,
      historyRows,
      latestHistory,
      hoursPerWeek,
      kittingHours,
      bookingInOutHours,
      productMovementHours,
      effectiveDate,
      changeReason
    };
  }).filter(row => {
    if (state.family !== 'all' && row.family !== state.family) return false;
    if (state.hiddenStatuses.includes(row.status)) return false;
    if (!state.search) return true;
    return `${row.product.name || ''} ${row.family} ${row.status}`.toLowerCase().includes(state.search.trim().toLowerCase());
  });

  const direction = state.sortDir === 'desc' ? -1 : 1;
  rows.sort((left, right) => {
    if (state.sortBy === 'family') return left.family.localeCompare(right.family) * direction;
    if (state.sortBy === 'hours') return (left.hoursPerWeek - right.hoursPerWeek) * direction;
    if (state.sortBy === 'updated') {
      const leftDate = left.latestHistory && left.latestHistory.effectiveDate ? left.latestHistory.effectiveDate : '';
      const rightDate = right.latestHistory && right.latestHistory.effectiveDate ? right.latestHistory.effectiveDate : '';
      return leftDate.localeCompare(rightDate) * direction;
    }
    return (left.product.name || '').localeCompare(right.product.name || '') * direction;
  });

  const familyOptions = Array.from(new Set(products.map(product => capProductsResolveFamily(product)).filter(Boolean).filter(label => label !== '—'))).sort((left, right) => left.localeCompare(right));

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left:4px solid var(--green);">
          <div class="me-kpi-value">${products.length}</div>
          <div class="me-kpi-label">Products</div>
          <div class="me-kpi-month">${capProductsRoleLabel(dept)} stream</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--blue);">
          <div class="me-kpi-value">${historyCount}</div>
          <div class="me-kpi-label">History Rows</div>
          <div class="me-kpi-month">support changes logged</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--navy);">
          <div class="me-kpi-value">${rows.length}</div>
          <div class="me-kpi-label">Visible</div>
          <div class="me-kpi-month">after filters</div>
        </div>
      </div>
      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:11px;color:var(--muted);">${dept} Department</span>
        </div>
        <div class="me-card-body me-products-card-body">
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
            <input type="text" value="${capProductsEscape(state.search || '')}" placeholder="Search products" data-cap-action="cap-products-search" data-dept="${dept}" style="min-width:220px;flex:1 1 220px;">
            <select data-cap-action="cap-products-family-filter" data-dept="${dept}">
              <option value="all">All families</option>
              ${familyOptions.map(family => `<option value="${capProductsEscape(family)}" ${state.family === family ? 'selected' : ''}>${capProductsEscape(family)}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" data-cap-action="cap-products-bulk-save" data-dept="${dept}">Bulk Save All Changes</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-clear-filters" data-dept="${dept}">Clear</button>
          </div>
          <table class="tbl" style="width:100%;">
            <thead>
              <tr>
                <th data-cap-action="cap-products-sort-column" data-sort-key="name" data-dept="${dept}" style="cursor:pointer;">Product</th>
                <th data-cap-action="cap-products-sort-column" data-sort-key="family" data-dept="${dept}" style="cursor:pointer;">Family</th>
                ${isLogContext ? '<th>Kitting</th><th>Booking In/Out</th><th>Product Movement</th>' : ''}
                <th data-cap-action="cap-products-sort-column" data-sort-key="hours" data-dept="${dept}" style="cursor:pointer;">Hours / Batch</th>
                <th>Effective Date</th>
                <th>Reason</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td colspan="${isLogContext ? 8 : 6}" style="padding:16px;text-align:center;color:var(--muted);">No products match the current filters.</td></tr>` : rows.map(row => `
                <tr data-product-idx="${row.index}" data-product-id="${capProductsEscape(row.product.id || '')}" data-product-db-id="${capProductsEscape(row.product.productDatabaseId || '')}">
                  <td>
                    <div style="font-weight:600;">${capProductsEscape(row.product.name || '(Unnamed product)')}</div>
                    <div style="font-size:11px;color:var(--muted);">${capProductsEscape(row.status)}</div>
                  </td>
                  <td>${capProductsEscape(row.family)}</td>
                  ${isLogContext ? `<td><input type="number" step="0.1" value="${capProductsEscape(row.kittingHours)}" data-cap-action="cap-products-draft" data-field="kittingHours"></td>` : ''}
                  ${isLogContext ? `<td><input type="number" step="0.1" value="${capProductsEscape(row.bookingInOutHours)}" data-cap-action="cap-products-draft" data-field="bookingInOutHours"></td>` : ''}
                  ${isLogContext ? `<td><input type="number" step="0.1" value="${capProductsEscape(row.productMovementHours)}" data-cap-action="cap-products-draft" data-field="productMovementHours"></td>` : ''}
                  <td><input type="number" step="0.1" value="${capProductsEscape(row.hoursPerWeek)}" data-cap-action="cap-products-draft" data-field="hoursPerWeek" ${isLogContext ? 'readonly' : ''}></td>
                  <td><input type="date" value="${capProductsEscape(row.effectiveDate)}" data-cap-action="cap-products-draft" data-field="supportEffectiveDate"></td>
                  <td><input type="text" value="${capProductsEscape(row.changeReason)}" data-cap-action="cap-products-draft" data-field="supportChangeReason" placeholder="Reason for change"></td>
                  <td>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                      <button class="btn btn-primary btn-sm" data-cap-action="cap-products-apply-hours">Apply</button>
                      <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-toggle-history" data-product-id="${capProductsEscape(row.product.id || '')}" data-dept="${dept}">${state.historyOpenProductIds.includes(row.product.id) ? 'Hide' : 'View'} History (${row.historyRows.length})</button>
                    </div>
                  </td>
                </tr>
                ${capProductsHistoryTable(row.product.id, dept, row.historyRows, state, isLogContext)}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
};

window.capProductsUpdateHistoryEditDraft = function(department, field, value) {
  const state = capProductsGetState(department);
  if (!state.historyEditDraft) return;
  state.historyEditDraft[field] = value;
};

window.capProductsSetDraftValue = function(department, productId, rowIndex, patch, productDatabaseId) {
  const state = capProductsGetState(department);
  const resolved = capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId);
  if (!resolved.key) return null;
  const current = resolved.value || {};
  state.drafts[resolved.key] = Object.assign({}, current, patch || {});
  resolved.candidates.forEach(candidate => {
    if (candidate !== resolved.key) delete state.drafts[candidate];
  });
  return state.drafts[resolved.key];
};

window.capProductsGetDraftValue = function(department, productId, rowIndex, productDatabaseId) {
  const state = capProductsGetState(department);
  return capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId).value || null;
};

window.capProductsClearDraft = function(department, productId, rowIndex, productDatabaseId) {
  const state = capProductsGetState(department);
  const resolved = capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId);
  resolved.candidates.forEach(candidate => {
    delete state.drafts[candidate];
  });
};

window.capProductsSetSearch = function(value, department) {
  const state = capProductsGetState(department);
  state.search = (value || '').toString();
  capProductsRefreshTable(department);
};

window.capProductsSetFamilyFilter = function(value, department) {
  const state = capProductsGetState(department);
  state.family = value || 'all';
  capProductsRefreshTable(department);
};

window.capProductsSetSort = function(value, department) {
  const state = capProductsGetState(department);
  state.sortBy = value || 'name';
  capProductsRefreshTable(department);
};

window.capProductsSortByColumn = function(column, department) {
  const state = capProductsGetState(department);
  const nextColumn = (column || '').toString();
  if (!nextColumn) return;
  if (state.sortBy === nextColumn) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortBy = nextColumn;
    state.sortDir = 'asc';
  }
  capProductsRefreshTable(department);
};

window.capProductsToggleSortDir = function(department) {
  const state = capProductsGetState(department);
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  capProductsRefreshTable(department);
};

window.capProductsClearFilters = function(department) {
  const state = capProductsGetState(department);
  state.search = '';
  state.family = 'all';
  state.sortBy = 'name';
  state.sortDir = 'asc';
  state.hiddenStatuses = [];
  state.historyOpenProductIds = [];
  capProductsRefreshTable(department);
};

window.capProductsStartHistoryEdit = function(historyId, entrySnapshot, department) {
  const state = capProductsGetState(department);
  if (!historyId) return;
  state.historyEditingId = historyId;
  state.historyEditDraft = Object.assign({}, entrySnapshot);
  capProductsRefreshTable(department);
};

window.capProductsCancelHistoryEdit = function(department) {
  const state = capProductsGetState(department);
  state.historyEditingId = null;
  state.historyEditDraft = null;
  capProductsRefreshTable(department);
};

window.capProductsSaveHistoryEdit = function(historyId, department, domRow) {
  const state = capProductsGetState(department);
  if (!state.historyEditDraft || !historyId) return;
  const draft = Object.assign({}, state.historyEditDraft);
  if (domRow) {
    const getField = selector => domRow.querySelector(selector);
    const dateEl = getField('[data-history-edit-field="effectiveDate"]');
    const hoursEl = getField('[data-history-edit-field="hoursPerWeek"]');
    const reasonEl = getField('[data-history-edit-field="changeReason"]');
    if (dateEl) draft.effectiveDate = dateEl.value;
    if (hoursEl) draft.hoursPerWeek = parseFloat(hoursEl.value) || 0;
    if (reasonEl) draft.changeReason = reasonEl.value;
    if (department === 'LOG') {
      const kittingEl = getField('[data-history-edit-field="kittingHours"]');
      const bookingEl = getField('[data-history-edit-field="bookingInOutHours"]');
      const movementEl = getField('[data-history-edit-field="productMovementHours"]');
      if (kittingEl) draft.kittingHours = parseFloat(kittingEl.value) || 0;
      if (bookingEl) draft.bookingInOutHours = parseFloat(bookingEl.value) || 0;
      if (movementEl) draft.productMovementHours = parseFloat(movementEl.value) || 0;
      draft.hoursPerWeek = (draft.kittingHours || 0) + (draft.bookingInOutHours || 0) + (draft.productMovementHours || 0);
    }
  }
  if (!draft.effectiveDate) {
    alert('Effective Date is required.');
    return;
  }
  if (!draft.changeReason || draft.changeReason.trim().length < 3) {
    alert('Reason must be at least 3 characters.');
    return;
  }
  const api = capProductsGetApi(department);
  if (typeof api.updateHistory === 'function') api.updateHistory(historyId, draft);
  state.historyEditingId = null;
  state.historyEditDraft = null;
  capProductsRefreshTable(department);
  if (typeof api.debouncedSave === 'function') api.debouncedSave();
};

window.capProductsToggleStatusFilter = function(status, isEnabled, department) {
  const state = capProductsGetState(department);
  const nextHidden = state.hiddenStatuses.filter(entry => entry !== status);
  if (!isEnabled) nextHidden.push(status);
  state.hiddenStatuses = nextHidden;
  capProductsRefreshTable(department);
};

window.capProductsToggleHistory = function(productId, department) {
  const state = capProductsGetState(department);
  const nextOpen = state.historyOpenProductIds.slice();
  const index = nextOpen.indexOf(productId);
  if (index >= 0) nextOpen.splice(index, 1);
  else nextOpen.push(productId);
  state.historyOpenProductIds = nextOpen;
  capProductsRefreshTable(department);
};

window.capProductsBulkSaveChanges = function(department) {
  const dept = capProductsNormalizeDepartmentKey(department);
  const api = capProductsGetApi(dept);
  const products = typeof api.getProducts === 'function' ? api.getProducts() : [];
  let applied = 0;
  products.forEach((product, index) => {
    const draft = window.capProductsGetDraftValue(dept, product.id, index, product.productDatabaseId);
    if (!draft) return;
    const metadata = {
      effectiveDate: draft.supportEffectiveDate || product.supportEffectiveDate || new Date().toISOString().split('T')[0],
      changeReason: draft.supportChangeReason || 'Bulk update',
      kittingHours: draft.kittingHours != null ? Number(draft.kittingHours) : undefined,
      bookingInOutHours: draft.bookingInOutHours != null ? Number(draft.bookingInOutHours) : undefined,
      productMovementHours: draft.productMovementHours != null ? Number(draft.productMovementHours) : undefined
    };
    if (!metadata.effectiveDate || metadata.changeReason.trim().length < 3) return;
    let hoursValue = Number(draft.hoursPerWeek);
    if (dept === 'LOG') {
      hoursValue = (metadata.kittingHours || 0) + (metadata.bookingInOutHours || 0) + (metadata.productMovementHours || 0);
    }
    if (!Number.isFinite(hoursValue) || hoursValue < 0) return;
    if (typeof api.updateProduct === 'function') {
      api.updateProduct(index, 'hoursPerWeek', String(hoursValue), metadata);
      window.capProductsClearDraft(dept, product.id, index, product.productDatabaseId);
      applied += 1;
    }
  });
  capProductsRefreshTable(dept);
  if (typeof api.debouncedSave === 'function' && applied > 0) api.debouncedSave();
};
