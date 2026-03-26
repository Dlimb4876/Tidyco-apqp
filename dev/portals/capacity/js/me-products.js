/* ============================================================
   me-products.js — Products Tab Rendering
   ============================================================ */

function meProductsCreateState() {
  return {
    search: '',
    family: 'all',
    sortBy: 'name',
    sortDir: 'asc',
    hiddenStatuses: [],
    historyOpenProductIds: [],
    historyEditingId: null,
    historyEditDraft: null,
    drafts: {}
  };
}

function meProductsNormalizeDepartmentKey(department) {
  const key = (department || 'ME').toString().toUpperCase();
  if (key === 'PM' || key === 'LOG' || key === 'UNIT6') return key;
  return 'ME';
}

function meProductsNormalizeRowIndex(rowIndex) {
  const parsed = Number(rowIndex);
  if (!Number.isFinite(parsed) || parsed < 0) return -1;
  return Math.trunc(parsed);
}

function meProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId) {
  const keys = [];
  if (productId) keys.push(`product:${productId}`);
  if (productDatabaseId) keys.push(`db:${productDatabaseId}`);

  const normalizedRowIndex = meProductsNormalizeRowIndex(rowIndex);
  if (normalizedRowIndex >= 0) keys.push(`row:${normalizedRowIndex}`);
  return keys;
}

function meProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId) {
  const candidates = meProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId);
  for (let i = 0; i < candidates.length; i++) {
    const key = candidates[i];
    if (state.drafts[key]) {
      return {
        key,
        value: state.drafts[key],
        candidates
      };
    }
  }

  return {
    key: candidates[0] || null,
    value: null,
    candidates
  };
}

function meProductsGetDraftValue(draft, field, fallback) {
  return draft && Object.prototype.hasOwnProperty.call(draft, field)
    ? draft[field]
    : fallback;
}

const meProductsTableState = {
  ME: meProductsCreateState(),
  PM: meProductsCreateState(),
  LOG: meProductsCreateState(),
  UNIT6: meProductsCreateState()
};

function meProductsGetState(department) {
  const key = meProductsNormalizeDepartmentKey(department);
  if (!meProductsTableState[key]) {
    meProductsTableState[key] = meProductsCreateState();
  }
  return meProductsTableState[key];
}

window.meProductsUpdateHistoryEditDraft = function(department, field, value) {
  const state = meProductsGetState(department);
  if (!state.historyEditDraft) return;
  state.historyEditDraft[field] = value;
};

window.meProductsSetDraftValue = function(department, productId, rowIndex, patch, productDatabaseId) {
  const state = meProductsGetState(department);
  const resolved = meProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId);
  const key = resolved.key;
  if (!key) return null;

  const current = resolved.value || {};
  state.drafts[key] = Object.assign({}, current, patch || {});

  // Keep a single canonical key so rerenders cannot strand draft values.
  resolved.candidates.forEach(candidate => {
    if (candidate !== key) delete state.drafts[candidate];
  });
  return state.drafts[key];
};

window.meProductsGetDraftValue = function(department, productId, rowIndex, productDatabaseId) {
  const state = meProductsGetState(department);
  return meProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId).value || null;
};

window.meProductsClearDraft = function(department, productId, rowIndex, productDatabaseId) {
  const state = meProductsGetState(department);
  const resolved = meProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId);
  resolved.candidates.forEach(key => {
    delete state.drafts[key];
  });
};

window.meProductsClearAllDrafts = function(department) {
  const state = meProductsGetState(department);
  state.drafts = {};
};

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

window.meProductsSortByColumn = function(column, department) {
  const state = meProductsGetState(department);
  const nextColumn = (column || '').toString();
  if (!nextColumn) return;

  if (state.sortBy === nextColumn) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortBy = nextColumn;
    state.sortDir = 'asc';
  }
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

function meProductsGetSortIcon(state, key) {
  if (!state || state.sortBy !== key) return '↕';
  return state.sortDir === 'asc' ? '↑' : '↓';
}

function meProductsRenderSortableHeader(label, key, state, department, width) {
  const style = width ? ` style="width:${width};cursor:pointer;user-select:none"` : ' style="cursor:pointer;user-select:none"';
  return `<th${style} data-cap-action="cap-products-sort-column" data-sort-key="${key}" data-dept="${department}" title="Sort by ${label}">${meProductsGetSortIcon(state, key)} ${label}</th>`;
}

window.meProductsStartHistoryEdit = function(historyId, entrySnapshot, department) {
  if (!historyId) return;
  const state = meProductsGetState(department);
  state.historyEditingId = historyId;
  state.historyEditDraft = Object.assign({}, entrySnapshot);
  meProductsRefreshTable();
};

window.meProductsCancelHistoryEdit = function(department) {
  const state = meProductsGetState(department);
  state.historyEditingId = null;
  state.historyEditDraft = null;
  meProductsRefreshTable();
};

window.meProductsSaveHistoryEdit = function(historyId, department, domRow) {
  const state = meProductsGetState(department);
  const cleanHistoryId = historyId ? String(historyId).trim() : '';
  if (!state.historyEditDraft || !cleanHistoryId) return;

  // Read current values from DOM inputs (safe: no rerender fires during inline edit)
  const isLogContext = department === 'LOG';
  if (domRow) {
    const get = sel => domRow.querySelector(sel);
    const dateEl = get('[data-history-edit-field="effectiveDate"]');
    const hoursEl = get('[data-history-edit-field="hoursPerWeek"]');
    const reasonEl = get('[data-history-edit-field="changeReason"]');
    if (dateEl) state.historyEditDraft.effectiveDate = dateEl.value;
    if (hoursEl) state.historyEditDraft.hoursPerWeek = parseFloat(hoursEl.value) || 0;
    if (reasonEl) state.historyEditDraft.changeReason = reasonEl.value;
    if (isLogContext) {
      const kittingEl = get('[data-history-edit-field="kittingHours"]');
      const bookingEl = get('[data-history-edit-field="bookingInOutHours"]');
      const movementEl = get('[data-history-edit-field="productMovementHours"]');
      if (kittingEl) state.historyEditDraft.kittingHours = parseFloat(kittingEl.value) || 0;
      if (bookingEl) state.historyEditDraft.bookingInOutHours = parseFloat(bookingEl.value) || 0;
      if (movementEl) state.historyEditDraft.productMovementHours = parseFloat(movementEl.value) || 0;
    }
  }

  const draft = state.historyEditDraft;
  if (!isLogContext) {
    delete draft.kittingHours;
    delete draft.bookingInOutHours;
    delete draft.productMovementHours;
  }

  const effectiveDate = (draft.effectiveDate || '').trim();
  const changeReason = (draft.changeReason || '').trim();

  if (!effectiveDate) {
    alert('Effective Date is required.');
    return;
  }
  if (changeReason.length < 3) {
    alert('Reason must be at least 3 characters.');
    return;
  }

  const updateFn = department === 'PM'
    ? window.pmDataUpdateProductSupportHistoryEntry
    : department === 'UNIT6'
      ? window.unit6DataUpdateProductSupportHistoryEntry
      : department === 'LOG'
        ? window.logDataUpdateProductSupportHistoryEntry
        : window.meDataUpdateProductSupportHistoryEntry;
  if (typeof updateFn === 'function') {
    const ok = updateFn(cleanHistoryId, draft);
    if (!ok) {
      console.error('History update failed:', { historyId: cleanHistoryId, draft, department });
      alert('Could not update history entry. See console for details.');
      return;
    }
  }

  state.historyEditingId = null;
  state.historyEditDraft = null;
  meProductsRefreshTable();

  const contextType = department === 'PM' ? 'pm' : department === 'LOG' ? 'log' : department === 'UNIT6' ? 'unit6' : 'me';
  if (typeof capRunDebouncedSave === 'function') capRunDebouncedSave(contextType);
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
    const rawKitting = Number(product && (product.kittingHours ?? product.kitting_hours ?? product.kittingTimeBookingHours ?? product.kitting_time_booking_hours));
    const rawBookingInOut = Number(product && (product.bookingInOutHours ?? product.booking_in_out_hours));
    const rawMovement = Number(product && (product.productMovementHours ?? product.product_movement_hours));
    if (Number.isFinite(rawKitting) || Number.isFinite(rawBookingInOut) || Number.isFinite(rawMovement)) {
      return Math.max(0, Number.isFinite(rawKitting) ? rawKitting : 0) +
        Math.max(0, Number.isFinite(rawBookingInOut) ? rawBookingInOut : 0) +
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
    const rowIndex = idx;
    const familyLabel = resolveFamilyLabelForProduct(product);
    const statusLabel = resolveStatusForProduct(product);
    return {
      product,
      rowIndex,
      familyLabel,
      status: statusLabel,
      name: (product.name || '').toString(),
      hoursPerWeek: getSupportPerBatch(product),
      kittingHours: Math.max(0, Number(product.kittingHours ?? product.kittingTimeBookingHours) || 0),
      bookingInOutHours: Math.max(0, Number(product.bookingInOutHours) || 0),
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
      case 'kittingHours':
        return (a.kittingHours - b.kittingHours) * dir;
      case 'bookingInOutHours':
        return (a.bookingInOutHours - b.bookingInOutHours) * dir;
      case 'productMovementHours':
        return (a.productMovementHours - b.productMovementHours) * dir;
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
  const totalColumnCount = isLogContext ? 11 : 8;
  visibleRows.forEach(row => {
    const product = row.product;
    const rowIndex = row.rowIndex;
    const draft = typeof window.meProductsGetDraftValue === 'function'
      ? window.meProductsGetDraftValue(department, product.id, rowIndex, product.productDatabaseId)
      : null;
    const historyRows = getProductHistoryRows(product);
    const historyIsOpen = historyOpenSet.has(product.id);
    const historyColumnCount = isLogContext ? 8 : 5;
    const draftKittingHours = meProductsGetDraftValue(draft, 'kittingHours', row.kittingHours);
    const draftBookingInOutHours = meProductsGetDraftValue(draft, 'bookingInOutHours', row.bookingInOutHours);
    const draftProductMovementHours = meProductsGetDraftValue(draft, 'productMovementHours', row.productMovementHours);
    const draftHoursPerWeek = meProductsGetDraftValue(draft, 'hoursPerWeek', row.hoursPerWeek);
    const draftSupportEffectiveDate = meProductsGetDraftValue(draft, 'supportEffectiveDate', row.supportEffectiveDate || '2026-01-01');
    const draftSupportChangeReason = meProductsGetDraftValue(draft, 'supportChangeReason', '');
    const historyBody = historyRows.length > 0
      ? historyRows.map(entry => {
          const isEditing = state.historyEditingId === entry.id;
          const editDraft = isEditing ? (state.historyEditDraft || {}) : {};
          if (isEditing) {
            return `
        <tr data-history-edit-row="${esc(entry.id || '')}">
          <td><input type="date" data-cap-action="cap-products-history-edit-field" data-history-edit-field="effectiveDate" data-dept="${department}" value="${esc(editDraft.effectiveDate || entry.effectiveDate || '')}" style="width:130px"></td>
          <td style="color:var(--muted);font-size:12px">auto</td>
          ${isLogContext
            ? `<td><input type="number" data-cap-action="cap-products-history-edit-field" data-history-edit-field="kittingHours" data-dept="${department}" value="${Number(editDraft.kittingHours !== undefined ? editDraft.kittingHours : (entry.kittingHours ?? entry.kittingTimeBookingHours ?? 0)).toFixed(2)}" step="0.5" min="0" style="width:80px"></td>
              <td><input type="number" data-cap-action="cap-products-history-edit-field" data-history-edit-field="bookingInOutHours" data-dept="${department}" value="${Number(editDraft.bookingInOutHours !== undefined ? editDraft.bookingInOutHours : (entry.bookingInOutHours || 0)).toFixed(2)}" step="0.5" min="0" style="width:80px"></td>
              <td><input type="number" data-cap-action="cap-products-history-edit-field" data-history-edit-field="productMovementHours" data-dept="${department}" value="${Number(editDraft.productMovementHours !== undefined ? editDraft.productMovementHours : (entry.productMovementHours || 0)).toFixed(2)}" step="0.5" min="0" style="width:80px"></td>
              <td style="color:var(--muted);font-size:12px">auto</td>`
            : `<td><input type="number" data-cap-action="cap-products-history-edit-field" data-history-edit-field="hoursPerWeek" data-dept="${department}" value="${Number(editDraft.hoursPerWeek !== undefined ? editDraft.hoursPerWeek : (entry.hoursPerWeek || 0)).toFixed(2)}" step="0.5" min="0" style="width:90px"></td>`}
          <td><input type="text" data-cap-action="cap-products-history-edit-field" data-history-edit-field="changeReason" data-dept="${department}" value="${esc(editDraft.changeReason !== undefined ? editDraft.changeReason : (entry.changeReason || ''))}" placeholder="Reason" style="width:140px"></td>
          <td style="white-space:nowrap">
            <button class="btn btn-primary btn-sm" data-cap-action="cap-products-save-history-edit" data-history-id="${esc(entry.id || '')}" data-dept="${department}">Save</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-cancel-history-edit" data-dept="${department}">Cancel</button>
          </td>
        </tr>`;
          }
          return `
        <tr>
          <td>${esc(entry.effectiveDate || '')}</td>
          <td>${esc(entry.endDate || 'Current')}</td>
          ${isLogContext
            ? `<td>${Number(entry.kittingHours ?? entry.kittingTimeBookingHours ?? 0).toFixed(2)}</td>
              <td>${Number(entry.bookingInOutHours || 0).toFixed(2)}</td>
          <td>${Number(entry.productMovementHours || 0).toFixed(2)}</td>
          <td>${Number(entry.hoursPerWeek || 0).toFixed(2)}</td>`
    : `<td>${Number(entry.hoursPerWeek || 0).toFixed(2)}</td>`}
          <td>${esc(entry.changeReason || '')}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-edit-history" data-history-id="${esc(entry.id || '')}" data-dept="${department}" data-effective-date="${esc(entry.effectiveDate || '')}" data-hours="${Number(entry.hoursPerWeek || 0).toFixed(2)}"${isLogContext ? ` data-kitting="${Number(entry.kittingHours ?? entry.kittingTimeBookingHours ?? 0).toFixed(2)}" data-booking="${Number(entry.bookingInOutHours || 0).toFixed(2)}" data-movement="${Number(entry.productMovementHours || 0).toFixed(2)}"` : ''} data-reason="${esc(entry.changeReason || '')}" title="Edit this history entry">Edit</button>
            <button class="btn btn-danger btn-sm" data-cap-action="cap-products-delete-history" data-history-id="${esc(entry.id || '')}" data-dept="${department}" title="Delete this history entry">Delete</button>
          </td>
        </tr>`;
        }).join('')
      : `<tr><td colspan="${historyColumnCount}" style="color:var(--muted)">No support history entries yet.</td></tr>`;

    rows += `
      <tr data-product-idx="${rowIndex}" data-product-id="${esc(product.id || '')}" data-product-db-id="${esc(product.productDatabaseId || product.product_database_id || '')}">
        <td>${esc(product.name)}</td>
        <td>${esc(row.familyLabel)}</td>
        <td>${typeof renderStatusBadge === 'function' ? renderStatusBadge(row.status) : esc(row.status)}</td>
        <td style="font-weight:600;color:var(--green);white-space:nowrap">${row.hoursPerWeek > 0 ? row.hoursPerWeek.toFixed(2) + ' h' : '<span style="color:var(--muted)">—</span>'}</td>
        ${isLogContext
      ? `<td><input name="cap_products_${rowIndex}_kittingHours" type="number" value="${esc(draftKittingHours)}" step="0.5" min="0" data-cap-action="cap-products-draft" data-field="kittingHours"></td>
        <td><input name="cap_products_${rowIndex}_bookingInOutHours" type="number" value="${esc(draftBookingInOutHours)}" step="0.5" min="0" data-cap-action="cap-products-draft" data-field="bookingInOutHours"></td>
        <td><input name="cap_products_${rowIndex}_productMovementHours" type="number" value="${esc(draftProductMovementHours)}" step="0.5" min="0" data-cap-action="cap-products-draft" data-field="productMovementHours"></td>
        <td><input name="cap_products_${rowIndex}_hoursPerWeek" type="number" value="${esc(draftHoursPerWeek)}" step="0.5" data-field="hoursPerWeek" class="me-calculated-field" readonly tabindex="-1"></td>`
    : `<td><input name="cap_products_${rowIndex}_hoursPerWeek" type="number" value="${esc(draftHoursPerWeek)}" step="0.5" min="0" data-cap-action="cap-products-draft" data-field="hoursPerWeek"></td>`}
        <td><input name="cap_products_${rowIndex}_supportEffectiveDate" type="date" value="${esc(draftSupportEffectiveDate)}" data-cap-action="cap-products-draft" data-field="supportEffectiveDate"></td>
        <td><input name="cap_products_${rowIndex}_supportChangeReason" type="text" value="${esc(draftSupportChangeReason)}" placeholder="Reason for change" data-cap-action="cap-products-draft" data-field="supportChangeReason"></td>
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
                  ${isLogContext
    ? `<th style="width:120px">Kitting</th>
                  <th style="width:140px">Booking In/Out</th>
                  <th style="width:150px">Product Movement</th>
                  <th style="width:120px">Hours/Batch</th>`
    : `<th style="width:120px">Hours/Batch</th>`}
                  <th>Reason</th>
                  <th style="width:80px"></th>
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
      <div class="me-card-body me-products-card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <input
            type="text"
            placeholder="Filter by product"
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
        <div style="display:flex;gap:8px;margin-bottom:12px;justify-content:flex-end;align-items:center;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--muted)" id="cap-bulk-status-${esc(department)}"></span>
          <button class="btn btn-primary" data-cap-action="cap-products-bulk-save" data-dept="${department}" style="font-weight:600">
            📦 Bulk Save All Changes
          </button>
        </div>
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              ${meProductsRenderSortableHeader('Product Name', 'name', state, department, '200px')}
              ${meProductsRenderSortableHeader('Product Family', 'family', state, department, '150px')}
              ${meProductsRenderSortableHeader('Product Status', 'status', state, department, '130px')}
              ${meProductsRenderSortableHeader('Current', 'hours', state, department, '110px')}
              ${isLogContext
          ? `${meProductsRenderSortableHeader('Kitting', 'kittingHours', state, department, '120px')}
                ${meProductsRenderSortableHeader('Booking In/Out', 'bookingInOutHours', state, department, '140px')}
              ${meProductsRenderSortableHeader('Product Movement', 'productMovementHours', state, department, '150px')}
              ${meProductsRenderSortableHeader('Hours/Batch', 'hours', state, department, '120px')}`
    : `${meProductsRenderSortableHeader('Hours/Batch', 'hours', state, department, '120px')}`}
              ${meProductsRenderSortableHeader('Effective Date', 'effectiveDate', state, department, '150px')}
              <th style="width:180px">Change Reason</th>
              <th style="width:180px">Actions</th>
            </tr></thead>
            <tbody>
              ${rows || `<tr><td colspan="${totalColumnCount}"><div style="text-align:center;padding:40px;color:var(--muted)">No ${isPmContext ? 'project' : 'production'} products found</div></td></tr>`}
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--muted); padding: 12px 0;">
          💡 ${isPmContext ? 'Project products' : 'Products'} are synced from the Product Management database. ${isLogContext ? 'For Logistics, Hours/Batch is calculated from Kitting, Booking In/Out, and Product Movement. ' : ''}To avoid accidental history edits, support rate changes only save when you click Apply Change with an effective date and reason. Use View History on each row to audit past rates.
        </div>
      </div>
    </div>
    </div>`;
};

window.meProductsBulkSaveChanges = function(department) {
  const state = meProductsGetState(department);
  const drafts = state.drafts || {};
  const api = typeof capGetDataApi === 'function' ? capGetDataApi(
    department === 'PM' ? 'pm' : 
    department === 'LOG' ? 'log' : 
    department === 'UNIT6' ? 'unit6' : 'me'
  ) : null;

  if (!api || typeof api.getProducts !== 'function' || typeof api.updateProduct !== 'function') {
    console.error('API not available for bulk save');
    return;
  }

  const products = api.getProducts() || [];
  const draftKeys = Object.keys(drafts);
  
  if (draftKeys.length === 0) {
    alert('No changes to save. Edit some product support values first.');
    return;
  }

  // Process each draft
  let savedCount = 0;
  let errorCount = 0;
  const errors = [];

  draftKeys.forEach(draftKey => {
    const draft = drafts[draftKey];
    if (!draft) return;

    // Extract product index from draft key
    let productIdx = -1;
    if (draftKey.startsWith('product:')) {
      const productId = draftKey.slice(8);
      productIdx = products.findIndex(p => p.id === productId);
      // Fallback: try finding by productDatabaseId if productId lookup failed
      if (productIdx < 0 && productId) {
        productIdx = products.findIndex(p => p.productDatabaseId === productId || p.product_database_id === productId);
      }
    } else if (draftKey.startsWith('db:')) {
      const productDatabaseId = draftKey.slice(3);
      productIdx = products.findIndex(p => (p.productDatabaseId || p.product_database_id || '') === productDatabaseId);
    } else if (draftKey.startsWith('row:')) {
      productIdx = parseInt(draftKey.slice(4), 10);
    }

    if (productIdx < 0 || productIdx >= products.length) {
      // Last resort: try to find by matching any draft values
      const productName = draft.supportChangeReason ? 'unknown product' : 'unknown';
      errors.push(`Product not found for draft: ${draftKey}`);
      errorCount++;
      return;
    }

    const product = products[productIdx];
    const isLogContext = department === 'LOG';
    const hasSplitFields = isLogContext;
    const kittingValue = hasSplitFields ? (Number(draft.kittingHours) || 0) : 0;
    const bookingInOutValue = hasSplitFields ? (Number(draft.bookingInOutHours) || 0) : 0;
    const movementValue = hasSplitFields ? (Number(draft.productMovementHours) || 0) : 0;
    const hoursValue = hasSplitFields
      ? (kittingValue + bookingInOutValue + movementValue)
      : Number(draft.hoursPerWeek || 0);
    const effectiveDate = (draft.supportEffectiveDate || '').trim();
    const changeReason = (draft.supportChangeReason || '').trim();

    // Validate
    if (hasSplitFields) {
      if (!Number.isFinite(kittingValue) || kittingValue < 0 ||
          !Number.isFinite(bookingInOutValue) || bookingInOutValue < 0 ||
          !Number.isFinite(movementValue) || movementValue < 0) {
        errors.push(`${esc(product.name)}: Invalid Kitting, Booking, or Movement hours`);
        errorCount++;
        return;
      }
    } else {
      if (!Number.isFinite(hoursValue) || hoursValue < 0) {
        errors.push(`${esc(product.name)}: Invalid Hours/Batch value`);
        errorCount++;
        return;
      }
    }

    if (!effectiveDate) {
      errors.push(`${esc(product.name)}: Missing Effective Date`);
      errorCount++;
      return;
    }

    if (changeReason.length < 3) {
      errors.push(`${esc(product.name)}: Reason too short (min 3 chars)`);
      errorCount++;
      return;
    }

    // Check for backdate
    const currentEffectiveDate = (product && product.supportEffectiveDate) ? String(product.supportEffectiveDate) : '';
    if (currentEffectiveDate && effectiveDate < currentEffectiveDate) {
      const confirmMsg = `${esc(product.name)}: You are backdating this support change before the current effective date. Continue intentionally?`;
      const proceed = window.confirm(confirmMsg);
      if (!proceed) {
        errors.push(`${esc(product.name)}: Backdate cancelled by user`);
        errorCount++;
        return;
      }
    }

    // Apply the change
    try {
      api.updateProduct(productIdx, 'hoursPerWeek', String(hoursValue), {
        effectiveDate,
        changeReason,
        kittingHours: hasSplitFields ? kittingValue : undefined,
        bookingInOutHours: hasSplitFields ? bookingInOutValue : undefined,
        productMovementHours: hasSplitFields ? movementValue : undefined
      });
      savedCount++;
    } catch (e) {
      errors.push(`${esc(product.name)}: ${e.message || 'Unknown error'}`);
      errorCount++;
    }
  });

  // Clear all drafts
  Object.keys(drafts).forEach(key => {
    delete drafts[key];
  });

  // Show summary
  if (savedCount === 0 && errorCount === 0) {
    alert('No changes were saved. Please ensure you have entered an Effective Date and a Reason (min 3 characters) for each product.');
  } else if (errorCount > 0) {
    const errorMsg = errors.length > 0 ? errors.slice(0, 5).join('\n') : `${errorCount} error(s) occurred`;
    const more = errors.length > 5 ? `\n... and ${errors.length - 5} more` : '';
    alert(`Bulk Save Complete:\n✓ ${savedCount} saved\n✗ ${errorCount} failed\n\n${errorMsg}${more}`);
  } else if (savedCount > 0) {
    alert(`✓ Bulk Save Complete: ${savedCount} product support change${savedCount === 1 ? '' : 's'} applied`);
  }

  // Refresh and save
  if (typeof meProductsRefreshTable === 'function') {
    meProductsRefreshTable();
  }

  const contextType = department === 'PM' ? 'pm' : 
                      department === 'LOG' ? 'log' : 
                      department === 'UNIT6' ? 'unit6' : 'me';
  if (typeof capRunDebouncedSave === 'function') {
    capRunDebouncedSave(contextType);
  }
};
