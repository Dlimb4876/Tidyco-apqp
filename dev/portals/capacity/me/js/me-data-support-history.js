/* ============================================================
   me-data-support-history.js — ME Capacity Product Support History
   Effective-dated support history helpers extracted from me-data.js
   ============================================================ */

function meApplyLatestSupportHistoryToProduct(product, department) {
  if (!product || !product.id) return;

  const targetDepartment = meNormalizeDepartmentTag(department || product.department, 'ME');
  const latestHistory = meGetProductSupportHistoryRows(product.id, targetDepartment).slice(-1)[0] || null;
  const breakdown = meNormalizeProductSupportBreakdown(latestHistory || product, product.hoursPerWeek);

  product.hoursPerWeek = breakdown.hoursPerWeek;
  product.kittingHours = breakdown.kittingHours;
  product.bookingInOutHours = breakdown.bookingInOutHours;
  product.kittingTimeBookingHours = breakdown.kittingHours;
  product.productMovementHours = breakdown.productMovementHours;
  product.supportEffectiveDate = latestHistory
    ? (latestHistory.effectiveDate || meNormalizeDateOnly(product.createdAt || product.created_at) || '')
    : (product.supportEffectiveDate || meNormalizeDateOnly(product.createdAt || product.created_at) || '');
}

function meGetProductSupportHistoryRows(productId, department) {
  if (!Array.isArray(meDataState.productSupportHistory)) return [];
  const targetDepartment = meNormalizeDepartmentTag(department, 'ME');
  return meSortSupportHistoryByDate(
    meDataState.productSupportHistory.filter(row =>
      row &&
      row.productId === productId &&
      meNormalizeDepartmentTag(row.department, targetDepartment) === targetDepartment
    )
  );
}

function meEnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return;
  const department = meNormalizeDepartmentTag(product.department, 'ME');
  const existing = meGetProductSupportHistoryRows(product.id, department);
  if (existing.length > 0) return;

  const baselineDate = meNormalizeDateOnly(product.createdAt || product.created_at) || meNormalizeDateOnly(new Date());
  const breakdown = meNormalizeProductSupportBreakdown(product, product.hoursPerWeek);
  meDataState.productSupportHistory.push({
    id: meUUID(),
    productId: product.id,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate: baselineDate,
    endDate: '',
    changeReason: 'Baseline from product support value',
    notes: '',
    department,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function meEnsureAllProductSupportHistoryBaselines() {
  meDataState.products.forEach(product => meEnsureProductSupportHistoryBaseline(product));
  meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
}

window.meDataDeleteProductSupportHistoryEntry = function(historyId) {
  if (!historyId) return false;
  meDataState.productSupportHistory = meDataState.productSupportHistory.filter(h => h.id !== historyId);
  if (!window.meDataPendingDeletes.supportHistory) window.meDataPendingDeletes.supportHistory = [];
  if (!window.meDataPendingDeletes.supportHistory.includes(historyId)) {
    window.meDataPendingDeletes.supportHistory.push(historyId);
  }
  return true;
};

window.meDataUpdateProductSupportHistoryEntry = function(historyId, patch) {
  if (!historyId || !patch) return false;
  const entry = meDataState.productSupportHistory.find(h => h.id === historyId);
  if (!entry) return false;

  if (patch.effectiveDate !== undefined) {
    const normalized = meNormalizeDateOnly(patch.effectiveDate);
    if (normalized) entry.effectiveDate = normalized;
  }
  if (patch.changeReason !== undefined) entry.changeReason = patch.changeReason;

  const hasSplitFields = patch.kittingHours !== undefined || patch.bookingInOutHours !== undefined || patch.productMovementHours !== undefined;
  if (hasSplitFields) {
    const kitting = Number(patch.kittingHours !== undefined ? patch.kittingHours : entry.kittingHours) || 0;
    const booking = Number(patch.bookingInOutHours !== undefined ? patch.bookingInOutHours : entry.bookingInOutHours) || 0;
    const movement = Number(patch.productMovementHours !== undefined ? patch.productMovementHours : entry.productMovementHours) || 0;
    entry.kittingHours = kitting;
    entry.kittingTimeBookingHours = kitting;
    entry.bookingInOutHours = booking;
    entry.productMovementHours = movement;
    entry.hoursPerWeek = kitting + booking + movement;
  } else if (patch.hoursPerWeek !== undefined) {
    entry.hoursPerWeek = Number(patch.hoursPerWeek) || 0;
  }
  entry.updatedAt = new Date().toISOString();

  const dept = String(entry.department || 'ME').toUpperCase();
  const siblings = meDataState.productSupportHistory
    .filter(h => h.productId === entry.productId && String(h.department || 'ME').toUpperCase() === dept)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0));
  siblings.forEach((sib, i) => {
    sib.endDate = i + 1 < siblings.length
      ? (typeof meGetDateMinusOneDay === 'function' ? meGetDateMinusOneDay(siblings[i + 1].effectiveDate) : siblings[i + 1].effectiveDate)
      : '';
  });

  meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
  if (typeof meApplyLatestSupportHistoryToProduct === 'function') {
    meDataState.products.forEach(product => {
      if (product.id !== entry.productId) return;
      if (meNormalizeDepartmentTag(product.department, entry.department) !== meNormalizeDepartmentTag(entry.department, 'ME')) return;
      meApplyLatestSupportHistoryToProduct(product, entry.department);
    });
  }
  return true;
};

window.meDataGetProductSupportHistory = function() {
  meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
  return meDataState.productSupportHistory;
};

window.meDataAddProductSupportHistory = function(productId, hoursPerWeek, effectiveDate, changeReason, notes, department, kittingHours, bookingInOutHours, productMovementHours) {
  if (!productId) return false;

  const normalizedDate = meNormalizeDateOnly(effectiveDate) || meNormalizeDateOnly(new Date());
  const targetDepartment = meNormalizeDepartmentTag(department, 'ME');
  const existingRows = meGetProductSupportHistoryRows(productId, targetDepartment);
  const sameDateRow = existingRows.find(row => row.effectiveDate === normalizedDate);
  const breakdown = meNormalizeProductSupportBreakdown({
    hoursPerWeek,
    kittingHours,
    bookingInOutHours,
    productMovementHours
  }, hoursPerWeek);
  if (sameDateRow) {
    sameDateRow.hoursPerWeek = breakdown.hoursPerWeek;
    sameDateRow.kittingHours = breakdown.kittingHours;
    sameDateRow.bookingInOutHours = breakdown.bookingInOutHours;
    sameDateRow.kittingTimeBookingHours = breakdown.kittingHours;
    sameDateRow.productMovementHours = breakdown.productMovementHours;
    sameDateRow.changeReason = changeReason || sameDateRow.changeReason || '';
    sameDateRow.notes = notes || sameDateRow.notes || '';
    sameDateRow.updatedAt = new Date().toISOString();
    meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
    return true;
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate);
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1];
    prior.endDate = meGetDateMinusOneDay(normalizedDate);
    prior.updatedAt = new Date().toISOString();
  }

  meDataState.productSupportHistory.push({
    id: meUUID(),
    productId,
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate: normalizedDate,
    endDate: '',
    changeReason: changeReason || '',
    notes: notes || '',
    department: targetDepartment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
  return true;
};

window.meDataGetProductSupportRateForDate = function(productId, targetDate, fallbackHoursPerWeek, department) {
  const normalizedTargetDate = meNormalizeDateOnly(targetDate);
  const rows = meGetProductSupportHistoryRows(productId, department);
  if (!normalizedTargetDate || rows.length === 0) {
    return Number(fallbackHoursPerWeek || 0) || 0;
  }

  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false;
    if (!row.endDate) return true;
    return row.endDate >= normalizedTargetDate;
  });

  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0;
  const latestMatch = matches[matches.length - 1];
  return Number(latestMatch.hoursPerWeek || 0) || 0;
};

window.meDataGetProductLatestSupportEffectiveDate = function(productId, department, fallbackDate) {
  const rows = meGetProductSupportHistoryRows(productId, department);
  if (rows.length === 0) return meNormalizeDateOnly(fallbackDate) || '';
  return rows[rows.length - 1].effectiveDate || meNormalizeDateOnly(fallbackDate) || '';
};