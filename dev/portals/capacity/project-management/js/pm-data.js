/* ============================================================
   pm-data.js — PM Capacity Data Layer (Isolated)

   Own tables: pm_teams, pm_tasks, pm_products, pm_holidays,
               pm_product_support_history

   Depends on me-data.js for shared utilities:
   meNormalizeDepartmentTag, meNormalizeProductSupportBreakdown,
   meNormalizeDateOnly, meUUID, meGetHoursPerWeek,
   meNormalizeAndDedupeHolidays, meNormalizeHolidayRecord,
   meNormalizeSupportHistoryRecord, meNormalizeAndDedupeSupportHistory,
   meSortSupportHistoryByDate, meApplyLatestSupportHistoryToProduct,
   meEnsureProductSupportHistoryBaseline (patched to use pmDataState)
   ============================================================ */

window.pmDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
};

window.pmDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };
window.pmDataSaveInProgress = false;
window.pmDataSaveQueued = false;
window.pmDataInitialized = false;

// ─────────────────────────────────────────────────────────────
// GETTERS
// ─────────────────────────────────────────────────────────────

window.pmDataGetTeam     = function() { return pmDataState.team; };
window.pmDataGetTasks    = function() { return pmDataState.tasks; };
window.pmDataGetProducts = function() { return pmDataState.products; };
window.pmDataGetHolidays = function() {
  pmDataState.holidays = meNormalizeAndDedupeHolidays(pmDataState.holidays);
  return pmDataState.holidays;
};
window.pmDataGetProductSupportHistory = function() {
  pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
  return pmDataState.productSupportHistory;
};

// ─────────────────────────────────────────────────────────────
// TEAM CRUD
// ─────────────────────────────────────────────────────────────

window.pmDataAddTeam = function(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false;
  pmDataState.team.push({
    id: meUUID(), name: name.trim(),
    hoursPerWeek: meGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '', group: '', department: 'PM',
    startDate: startDate || '', endDate: endDate || ''
  });
  return true;
};

window.pmDataUpdateTeam = function(idx, field, value) {
  if (idx < 0 || idx >= pmDataState.team.length) return false;
  const member = pmDataState.team[idx];
  switch (field) {
    case 'name': member.name = value.trim(); break;
    case 'hoursPerWeek': member.hoursPerWeek = meGetHoursPerWeek(value); break;
    case 'utilisation': member.utilisation = parseFloat(value) || 80; break;
    case 'jobTitle': member.jobTitle = value ? value.trim() : ''; break;
    case 'group': member.group = value ? value.trim() : ''; break;
    case 'startDate': member.startDate = value || ''; break;
    case 'endDate': member.endDate = value || ''; break;
    default: return false;
  }
  return true;
};

window.pmDataDeleteTeam = function(idx) {
  if (idx < 0 || idx >= pmDataState.team.length) return false;
  const removed = pmDataState.team[idx];
  pmDataState.team.splice(idx, 1);
  if (removed && removed.id) {
    const pendingTasks = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.tasks)
      ? window.pmDataPendingDeletes.tasks
      : [];
    const pendingTeams = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.teams)
      ? window.pmDataPendingDeletes.teams
      : [];
    const pendingSupportHistory = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.supportHistory)
      ? window.pmDataPendingDeletes.supportHistory
      : [];
    if (!pendingTeams.includes(removed.id)) pendingTeams.push(removed.id);
    window.pmDataPendingDeletes = {
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    };
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// TASK CRUD
// ─────────────────────────────────────────────────────────────

window.pmDataAddTask = function(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  pmDataState.tasks.push({
    id: meUUID(), name: name.trim(), category: category || 'NPI',
    type: 'standard', department: 'PM', assigneeId: assigneeId || '',
    productId: productId || '', startDate: startDate || todayStr,
    endDate: endDate || todayStr, totalHours: parseFloat(totalHours) || 0,
    status: 'SCHEDULED', isDisabled: false, createdAt: new Date().toISOString()
  });
  return true;
};

window.pmDataUpdateTask = function(idx, field, value) {
  if (idx < 0 || idx >= pmDataState.tasks.length) return false;
  const task = pmDataState.tasks[idx];
  switch (field) {
    case 'name': task.name = value.trim(); break;
    case 'category': task.category = value || 'NPI'; break;
    case 'assigneeId': task.assigneeId = value || ''; break;
    case 'productId': task.productId = value || ''; break;
    case 'startDate': task.startDate = value; break;
    case 'endDate': task.endDate = value; break;
    case 'totalHours': task.totalHours = parseFloat(value) || 0; break;
    case 'status': task.status = value || 'SCHEDULED'; break;
    case 'isDisabled': task.isDisabled = value === true || value === 'true'; break;
    default: return false;
  }
  return true;
};

window.pmDataDeleteTask = function(idx) {
  if (idx < 0 || idx >= pmDataState.tasks.length) return false;
  const removed = pmDataState.tasks[idx];
  pmDataState.tasks.splice(idx, 1);
  if (removed && removed.id) {
    const pendingTasks = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.tasks)
      ? window.pmDataPendingDeletes.tasks
      : [];
    const pendingTeams = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.teams)
      ? window.pmDataPendingDeletes.teams
      : [];
    const pendingSupportHistory = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.supportHistory)
      ? window.pmDataPendingDeletes.supportHistory
      : [];
    if (!pendingTasks.includes(removed.id)) pendingTasks.push(removed.id);
    window.pmDataPendingDeletes = {
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    };
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────────────────────

window.pmDataAddProduct = function(name, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false;
  const breakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek);
  const product = {
    id: meUUID(), name: name.trim(), department: 'PM',
    hoursPerWeek: breakdown.hoursPerWeek, kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '', productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  };
  pmDataState.products.push(product);
  pmEnsureProductSupportHistoryBaseline(product);
  return true;
};

window.pmDataUpdateProduct = function(idx, field, value, metadata) {
  if (idx < 0 || idx >= pmDataState.products.length) return false;
  const product = pmDataState.products[idx];
  switch (field) {
    case 'name': product.name = value.trim(); break;
    case 'hoursPerWeek': {
      const breakdown = meNormalizeProductSupportBreakdown({
        hoursPerWeek: value,
        kittingHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'kittingHours') ? metadata.kittingHours : undefined,
        bookingInOutHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'bookingInOutHours') ? metadata.bookingInOutHours : undefined,
        productMovementHours: metadata && Object.prototype.hasOwnProperty.call(metadata, 'productMovementHours') ? metadata.productMovementHours : undefined
      }, value);
      product.hoursPerWeek = breakdown.hoursPerWeek;
      product.kittingHours = breakdown.kittingHours;
      product.bookingInOutHours = breakdown.bookingInOutHours;
      product.kittingTimeBookingHours = breakdown.kittingHours;
      product.productMovementHours = breakdown.productMovementHours;
      if (typeof window.pmDataAddProductSupportHistory === 'function') {
        const effectiveDate = metadata && metadata.effectiveDate ? metadata.effectiveDate : meNormalizeDateOnly(new Date());
        window.pmDataAddProductSupportHistory(product.id, product.hoursPerWeek, effectiveDate,
          metadata && metadata.changeReason ? metadata.changeReason : '',
          metadata && metadata.notes ? metadata.notes : '',
          product.kittingHours, product.bookingInOutHours, product.productMovementHours);
      }
      product.supportEffectiveDate = metadata && metadata.effectiveDate
        ? meNormalizeDateOnly(metadata.effectiveDate)
        : (product.supportEffectiveDate || meNormalizeDateOnly(new Date()));
      break;
    }
    case 'kittingTimeBookingHours':
    case 'kittingHours': {
      const bd = meNormalizeProductSupportBreakdown({ kittingHours: value, bookingInOutHours: product.bookingInOutHours, productMovementHours: product.productMovementHours }, product.hoursPerWeek);
      product.hoursPerWeek = bd.hoursPerWeek; product.kittingHours = bd.kittingHours;
      product.bookingInOutHours = bd.bookingInOutHours; product.kittingTimeBookingHours = bd.kittingHours;
      product.productMovementHours = bd.productMovementHours; break;
    }
    case 'bookingInOutHours': {
      const bd = meNormalizeProductSupportBreakdown({ kittingHours: product.kittingHours, bookingInOutHours: value, productMovementHours: product.productMovementHours }, product.hoursPerWeek);
      product.hoursPerWeek = bd.hoursPerWeek; product.kittingHours = bd.kittingHours;
      product.bookingInOutHours = bd.bookingInOutHours; product.kittingTimeBookingHours = bd.kittingHours;
      product.productMovementHours = bd.productMovementHours; break;
    }
    case 'productMovementHours': {
      const bd = meNormalizeProductSupportBreakdown({ kittingHours: product.kittingHours, bookingInOutHours: product.bookingInOutHours, productMovementHours: value }, product.hoursPerWeek);
      product.hoursPerWeek = bd.hoursPerWeek; product.kittingHours = bd.kittingHours;
      product.bookingInOutHours = bd.bookingInOutHours; product.kittingTimeBookingHours = bd.kittingHours;
      product.productMovementHours = bd.productMovementHours; break;
    }
    case 'supportEffectiveDate': product.supportEffectiveDate = meNormalizeDateOnly(value) || product.supportEffectiveDate || ''; break;
    case 'notes': product.notes = value ? value.trim() : ''; break;
    default: return false;
  }
  return true;
};

window.pmDataDeleteProduct = function(idx) {
  if (idx < 0 || idx >= pmDataState.products.length) return false;
  pmDataState.products.splice(idx, 1);
  return true;
};

// ─────────────────────────────────────────────────────────────
// PRODUCT SUPPORT HISTORY
// ─────────────────────────────────────────────────────────────

function pmGetProductSupportHistoryRows(productId) {
  if (!Array.isArray(pmDataState.productSupportHistory)) return [];
  return meSortSupportHistoryByDate(
    pmDataState.productSupportHistory.filter(row => row && row.productId === productId)
  );
}

function pmEnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return;
  const existing = pmGetProductSupportHistoryRows(product.id);
  if (existing.length > 0) return;
  const baselineDate = meNormalizeDateOnly(product.createdAt || product.created_at) || meNormalizeDateOnly(new Date());
  const breakdown = meNormalizeProductSupportBreakdown(product, product.hoursPerWeek);
  pmDataState.productSupportHistory.push({
    id: meUUID(), productId: product.id,
    hoursPerWeek: breakdown.hoursPerWeek, kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours, kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours,
    effectiveDate: baselineDate, endDate: '', changeReason: 'Baseline from product support value',
    notes: '', department: 'PM', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
}

window.pmDataAddProductSupportHistory = function(productId, hoursPerWeek, effectiveDate, changeReason, notes, kittingHours, bookingInOutHours, productMovementHours) {
  if (!productId) return false;
  const normalizedDate = meNormalizeDateOnly(effectiveDate) || meNormalizeDateOnly(new Date());
  const existingRows = pmGetProductSupportHistoryRows(productId);
  const sameDateRow = existingRows.find(row => row.effectiveDate === normalizedDate);
  const breakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek, kittingHours, bookingInOutHours, productMovementHours }, hoursPerWeek);

  if (sameDateRow) {
    sameDateRow.hoursPerWeek = breakdown.hoursPerWeek;
    sameDateRow.kittingHours = breakdown.kittingHours;
    sameDateRow.bookingInOutHours = breakdown.bookingInOutHours;
    sameDateRow.kittingTimeBookingHours = breakdown.kittingHours;
    sameDateRow.productMovementHours = breakdown.productMovementHours;
    sameDateRow.changeReason = changeReason || sameDateRow.changeReason || '';
    sameDateRow.notes = notes || sameDateRow.notes || '';
    sameDateRow.updatedAt = new Date().toISOString();
    pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
    return true;
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate);
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1];
    prior.endDate = meGetDateMinusOneDay(normalizedDate);
    prior.updatedAt = new Date().toISOString();
  }

  pmDataState.productSupportHistory.push({
    id: meUUID(), productId, hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours, bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingHours, productMovementHours: breakdown.productMovementHours,
    effectiveDate: normalizedDate, endDate: '', changeReason: changeReason || '',
    notes: notes || '', department: 'PM',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
  return true;
};

window.pmDataDeleteProductSupportHistoryEntry = function(historyId) {
  if (!historyId) return false;
  pmDataState.productSupportHistory = pmDataState.productSupportHistory.filter(h => h.id !== historyId);
  if (!window.pmDataPendingDeletes.supportHistory) window.pmDataPendingDeletes.supportHistory = [];
  if (!window.pmDataPendingDeletes.supportHistory.includes(historyId)) {
    window.pmDataPendingDeletes.supportHistory.push(historyId);
  }
  return true;
};

window.pmDataUpdateProductSupportHistoryEntry = function(historyId, patch) {
  if (!historyId || !patch) return false;
  const entry = pmDataState.productSupportHistory.find(h => h.id === historyId);
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

  const siblings = pmDataState.productSupportHistory
    .filter(h => h.productId === entry.productId)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0));
  siblings.forEach((sib, i) => {
    sib.endDate = i + 1 < siblings.length
      ? (typeof meGetDateMinusOneDay === 'function' ? meGetDateMinusOneDay(siblings[i + 1].effectiveDate) : siblings[i + 1].effectiveDate)
      : '';
  });

  pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
  return true;
};

window.pmDataGetProductSupportRateForDate = function(productId, targetDate, fallbackHoursPerWeek) {
  const normalizedTargetDate = meNormalizeDateOnly(targetDate);
  const rows = pmGetProductSupportHistoryRows(productId);
  if (!normalizedTargetDate || rows.length === 0) return Number(fallbackHoursPerWeek || 0) || 0;
  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false;
    if (!row.endDate) return true;
    return row.endDate >= normalizedTargetDate;
  });
  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0;
  return Number(matches[matches.length - 1].hoursPerWeek || 0) || 0;
};

// ─────────────────────────────────────────────────────────────
// HOLIDAY CRUD
// ─────────────────────────────────────────────────────────────

window.pmDataAddHoliday = function(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false;
  const existing = pmDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (existing) { existing.type = type; existing.department = 'PM'; return true; }
  pmDataState.holidays.push({
    id: meUUID(), personId, date, type, department: 'PM', createdAt: new Date().toISOString()
  });
  return true;
};

window.pmDataUpdateHoliday = function(personId, date, newType) {
  const holiday = pmDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (!holiday) { return newType ? pmDataAddHoliday(personId, date, newType) : false; }
  if (!newType) return pmDataDeleteHoliday(personId, date);
  if (!['full', 'half'].includes(newType)) return false;
  holiday.type = newType;
  return true;
};

window.pmDataDeleteHoliday = function(personId, date) {
  const idx = pmDataState.holidays.findIndex(h => h.personId === personId && h.date === date);
  if (idx === -1) return false;
  pmDataState.holidays.splice(idx, 1);
  return true;
};

// ─────────────────────────────────────────────────────────────
// AUTO-SYNC PRODUCTS
// ─────────────────────────────────────────────────────────────

window.pmDataAutoSyncPMProducts = function() {
  if (!productsState || !productsState.products) return false;
  let changed = false;
  const dbProducts = Array.isArray(productsState.products) ? productsState.products : [];
  const dbMap = {};
  const dbNameSet = new Set();
  dbProducts.forEach(p => {
    if (p && p.id) dbMap[p.id] = p;
    const n = (p && p.name ? String(p.name) : '').trim().toLowerCase();
    if (n) dbNameSet.add(n);
  });

  const existingByDbId = new Map(
    pmDataState.products.filter(p => p.productDatabaseId).map(p => [p.productDatabaseId, p])
  );

  dbProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id);
    if (existing) {
      const newNotes = dbProduct.notes || '';
      if (existing.name !== dbProduct.name || existing.notes !== newNotes || existing.department !== 'PM') {
        existing.name = dbProduct.name;
        existing.notes = newNotes;
        existing.department = 'PM';
        changed = true;
      }
    } else {
      const seedBreakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek: 0 }, 0);
      pmDataState.products.push({
        id: meUUID(), name: dbProduct.name, department: 'PM',
        hoursPerWeek: seedBreakdown.hoursPerWeek, kittingHours: seedBreakdown.kittingHours,
        bookingInOutHours: seedBreakdown.bookingInOutHours || 0,
        kittingTimeBookingHours: seedBreakdown.kittingHours,
        productMovementHours: seedBreakdown.productMovementHours || 0,
        notes: dbProduct.notes || '', productDatabaseId: dbProduct.id,
        createdAt: new Date().toISOString()
      });
      const created = pmDataState.products[pmDataState.products.length - 1];
      pmEnsureProductSupportHistoryBaseline(created);
      changed = true;
    }
  });

  const countBefore = pmDataState.products.length;
  const seenDbIds = new Set();
  const seenNames = new Set();
  pmDataState.products = pmDataState.products.filter(p => {
    if (!p.productDatabaseId) {
      const manualName = (p.name || '').trim().toLowerCase();
      if (manualName && dbNameSet.has(manualName)) return false;
      if (seenNames.has(manualName)) return false;
      seenNames.add(manualName);
      return true;
    }
    if (seenDbIds.has(p.productDatabaseId)) return false;
    seenDbIds.add(p.productDatabaseId);
    return dbMap[p.productDatabaseId] !== undefined;
  });
  if (pmDataState.products.length !== countBefore) changed = true;

  return changed;
};

// ─────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────

window.pmDataInit = async function() {
  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) return;

    const relState = {
      team: await pmLoadRelationalTeams() || [],
      tasks: await pmLoadRelationalTasks() || [],
      products: await pmLoadRelationalProducts() || [],
      holidays: meNormalizeAndDedupeHolidays(await pmLoadRelationalHolidays()),
      productSupportHistory: await pmLoadRelationalProductSupportHistory() || []
    };

    pmDataState.team = relState.team;
    pmDataState.tasks = relState.tasks;
    pmDataState.products = relState.products;
    pmDataState.holidays = relState.holidays;
    pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(relState.productSupportHistory);

    pmDataState.team.forEach(m => {
      if (!('jobTitle' in m)) m.jobTitle = '';
      if (!('group' in m)) m.group = '';
      if (!('startDate' in m)) m.startDate = '';
      if (!('endDate' in m)) m.endDate = '';
    });
    pmDataState.tasks.forEach(t => {
      if (!('type' in t)) t.type = 'standard';
      if (!('status' in t)) t.status = 'SCHEDULED';
      if (!('isDisabled' in t)) t.isDisabled = false;
    });
    pmDataState.products.forEach(p => {
      if (!('productDatabaseId' in p)) p.productDatabaseId = '';
    });

    pmDataState.products.forEach(p => pmEnsureProductSupportHistoryBaseline(p));
    pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);

    window.pmDataState = pmDataState;
    window.pmDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };

    pmDataSubscribe();
  } catch (err) {
    console.warn('pmDataInit exception:', err.message);
  }
  window.pmDataInitialized = true;
};

window.pmDataSave = async function(showAlert) {
  if (window.pmDataSaveInProgress) { window.pmDataSaveQueued = true; return; }
  window.pmDataSaveInProgress = true;

  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      console.warn('PM save: Supabase not available'); return;
    }
    if (typeof setSyncBadge === 'function') setSyncBadge('syncing', 'Saving...');
    let ok = true;

    // 1. Products first (FK deps)
    for (let i = 0; i < pmDataState.products.length; i++) {
      if (!await pmSaveProductRelational(currentUser.id, pmDataState.products[i])) ok = false;
    }
    const validProductIds = new Set(pmDataState.products.map(p => p.id).filter(Boolean));

    // 1-B. Support history
    pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
    const validHistory = pmDataState.productSupportHistory.filter(row => row && row.productId && validProductIds.has(row.productId));
    if (validHistory.length > 0) {
      if (!await pmSaveProductSupportHistoryRelational(currentUser.id, validHistory)) ok = false;
    }

    // 2. Team
    for (let i = 0; i < pmDataState.team.length; i++) {
      if (!await pmSaveTeamRelational(currentUser.id, pmDataState.team[i])) ok = false;
    }

    // 3. Tasks
    for (let i = 0; i < pmDataState.tasks.length; i++) {
      const task = pmDataState.tasks[i];
      if (task.productId && !validProductIds.has(task.productId)) task.productId = '';
      const result = await pmSaveTaskRelational(currentUser.id, task);
      if (!result.success) ok = false;
      else if (!task.id && result.taskId) task.id = result.taskId;
    }

    // 3-B. Pending task deletes
    const queuedDeletes = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.tasks)
      ? window.pmDataPendingDeletes.tasks.slice() : [];
    if (queuedDeletes.length > 0) {
      const failedDeletes = [];
      for (const taskId of queuedDeletes) {
        if (!await pmDeleteTaskRelational(taskId)) {
          failedDeletes.push(taskId);
          ok = false;
        }
      }
      window.pmDataPendingDeletes.tasks = failedDeletes;
    }

    // 3-C. Pending team deletes
    const queuedTeamDeletes = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.teams)
      ? window.pmDataPendingDeletes.teams.slice() : [];
    if (queuedTeamDeletes.length > 0) {
      const failedTeamDeletes = [];
      for (const teamId of queuedTeamDeletes) {
        if (!await pmDeleteTeamRelational(teamId)) {
          failedTeamDeletes.push(teamId);
          ok = false;
        }
      }
      window.pmDataPendingDeletes.teams = failedTeamDeletes;
    }

    // 3-D. Pending support history deletes
    const queuedSupportHistoryDeletes = window.pmDataPendingDeletes && Array.isArray(window.pmDataPendingDeletes.supportHistory)
      ? window.pmDataPendingDeletes.supportHistory.slice() : [];
    if (queuedSupportHistoryDeletes.length > 0) {
      const failedSupportHistoryDeletes = [];
      for (const historyId of queuedSupportHistoryDeletes) {
        if (!await pmDeleteSupportHistoryRelational(historyId)) {
          failedSupportHistoryDeletes.push(historyId);
          ok = false;
        }
      }
      window.pmDataPendingDeletes.supportHistory = failedSupportHistoryDeletes;
    }

    // 4. Holidays (delete-for-user then re-insert — safe now, single-dept table)
    const _holSeen = new Set();
    pmDataState.holidays = meNormalizeAndDedupeHolidays(pmDataState.holidays);
    const holidayData = (pmDataState.holidays || [])
      .filter(h => {
        if (h.userId && h.userId !== currentUser.id) return false;
        const key = h.personId + '_' + h.date;
        if (_holSeen.has(key)) return false;
        _holSeen.add(key);
        return true;
      })
      .map(h => ({
        id: h.id, user_id: currentUser.id, person_id: h.personId,
        date: h.date, type: h.type, department: 'PM'
      }));

    const { error: delHolErr } = await supa.from('pm_holidays').delete().eq('user_id', currentUser.id);
    if (delHolErr) { console.warn('PM holiday delete error:', delHolErr.message); ok = false; }
    else if (holidayData.length > 0) {
      const { error: insHolErr } = await supa.from('pm_holidays').insert(holidayData);
      if (insHolErr) { console.warn('PM holiday insert error:', insHolErr.message); ok = false; }
    }

    if (typeof setSyncBadge === 'function') setSyncBadge(ok ? 'saved' : 'error', ok ? 'Saved' : 'Save failed');
    if (!ok) throw new Error('PM relational save had issues');
  } catch (err) {
    console.error('PM save exception:', err.message || err);
    if (typeof setSyncBadge === 'function') setSyncBadge('error', 'Save failed');
  } finally {
    window.pmDataSaveInProgress = false;
    if (window.pmDataSaveQueued) { window.pmDataSaveQueued = false; await window.pmDataSave(false); }
  }
};

window.pmDataReset = function() {
  pmDataState.team = []; pmDataState.tasks = []; pmDataState.products = [];
  pmDataState.holidays = []; pmDataState.productSupportHistory = [];
  window.pmDataState = pmDataState;
  window.pmDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };
};

// ─────────────────────────────────────────────────────────────
// REALTIME
// ─────────────────────────────────────────────────────────────

window.pmDataSubscribe = function() {
  if (!currentUser) return;
  if (typeof createMultiTableRealtimeSubscription !== 'function') return;

  function pmShouldDeferRealtimeRender() {
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) {
      window.pmPendingRealTimeUpdate = true;
      return true;
    }
    return false;
  }

  createMultiTableRealtimeSubscription([
    {
      table: 'pm_teams',
      onInsert: (row) => {
        const n = { id: row.id, name: row.name || '', hoursPerWeek: meGetHoursPerWeek(row.hours_per_week),
          utilisation: parseFloat(row.utilisation) || 80, jobTitle: row.job_title || '',
          group: row.team_group || '', department: 'PM', startDate: row.start_date || '',
          endDate: row.end_date || '', createdAt: row.created_at };
        if (!pmDataState.team.some(t => t.id === n.id)) {
          pmDataState.team.push(n);
          if (pmShouldDeferRealtimeRender()) return;
          if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
        }
      },
      onUpdate: () => {},
      onDelete: (d) => {
        pmDataState.team = pmDataState.team.filter(t => t.id !== d.id);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      }
    },
    {
      table: 'pm_tasks',
      onInsert: (row) => {
        const n = { id: row.id, name: row.name || '', category: row.category || 'NPI',
          type: row.type || 'standard', department: 'PM', assigneeId: row.assignee_id || '',
          productId: row.product_id || '', startDate: row.start_date || '', endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0, status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true, createdAt: row.created_at };
        if (!pmDataState.tasks.some(t => t.id === n.id)) {
          pmDataState.tasks.push(n);
          if (pmShouldDeferRealtimeRender()) return;
          if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
        }
      },
      onUpdate: (row) => {
        const n = { id: row.id, name: row.name || '', category: row.category || 'NPI',
          type: row.type || 'standard', department: 'PM', assigneeId: row.assignee_id || '',
          productId: row.product_id || '', startDate: row.start_date || '', endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0, status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true, createdAt: row.created_at };
        const idx = pmDataState.tasks.findIndex(t => t.id === n.id);
        if (idx < 0) { pmDataState.tasks.push(n); }
        else { pmDataState.tasks[idx] = { ...pmDataState.tasks[idx], ...n }; }
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      },
      onDelete: (d) => {
        pmDataState.tasks = pmDataState.tasks.filter(t => t.id !== d.id);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      }
    },
    {
      table: 'pm_products',
      onInsert: (row) => {
        const bd = meNormalizeProductSupportBreakdown(row, row.hours_per_week);
        const n = { id: row.id, name: row.name || '', productDatabaseId: row.product_database_id || '',
          hoursPerWeek: bd.hoursPerWeek, kittingHours: bd.kittingHours,
          bookingInOutHours: bd.bookingInOutHours, kittingTimeBookingHours: bd.kittingTimeBookingHours,
          productMovementHours: bd.productMovementHours, department: 'PM', notes: row.notes || '',
          createdAt: row.created_at, updatedAt: row.updated_at || '' };
        if (!pmDataState.products.some(p => p.id === n.id)) {
          pmDataState.products.push(n);
          if (pmShouldDeferRealtimeRender()) return;
          if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
        }
      },
      onUpdate: () => {},
      onDelete: (d) => {
        pmDataState.products = pmDataState.products.filter(p => p.id !== d.id);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      }
    },
    {
      table: 'pm_holidays',
      onInsert: (row) => {
        const n = meNormalizeHolidayRecord(row);
        if (!n) return;
        if (!pmDataState.holidays.some(h => h.id === n.id)) {
          pmDataState.holidays.push(n);
          if (pmShouldDeferRealtimeRender()) return;
          if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
        }
      },
      onUpdate: () => {},
      onDelete: (d) => {
        pmDataState.holidays = pmDataState.holidays.filter(h => h.id !== d.id);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      }
    },
    {
      table: 'pm_product_support_history',
      onInsert: (row) => {
        const n = meNormalizeSupportHistoryRecord(row);
        if (!n) return;
        const idx = pmDataState.productSupportHistory.findIndex(h => h.id === n.id);
        if (idx >= 0) pmDataState.productSupportHistory[idx] = n;
        else pmDataState.productSupportHistory.push(n);
        pmDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(pmDataState.productSupportHistory);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      },
      onUpdate: () => {},
      onDelete: (d) => {
        pmDataState.productSupportHistory = pmDataState.productSupportHistory.filter(h => h.id !== d.id);
        if (pmShouldDeferRealtimeRender()) return;
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender();
      }
    }
  ], 'pm-capacity-channel');
};

// ─────────────────────────────────────────────────────────────
// FLUSH on page unload
// ─────────────────────────────────────────────────────────────

window.flushPmDataNow = function() {
  if (window.pmDataSaveInProgress || window.pmDataSaveQueued) {
    pmDataSave(false);
  }
};
