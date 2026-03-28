/* ============================================================
   log-data.js — Logistics Capacity Data Layer (Isolated)

   Own tables: log_teams, log_tasks, log_products, log_holidays,
               log_product_support_history

  Depends on shared cap utilities with ME legacy fallbacks until
  the shared bootstrap cut-over is complete.
   ============================================================ */

window.logDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
};

window.logDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };
window.logDataSaveInProgress = false;
window.logDataSaveQueued = false;
window.logDataInitialized = false;

var meNormalizeProductSupportBreakdown = window.capNormalizeProductSupportBreakdown || window.meNormalizeProductSupportBreakdown;
var meNormalizeDateOnly = window.capNormalizeDateOnly || window.meNormalizeDateOnly;
var meUUID = window.capUUID || window.meUUID || (() => crypto.randomUUID());
var meGetHoursPerWeek = window.capGetHoursPerWeek || window.meGetHoursPerWeek;
var meNormalizeAndDedupeHolidays = window.capNormalizeAndDedupeHolidays || window.meNormalizeAndDedupeHolidays;
var meNormalizeAndDedupeSupportHistory = window.capNormalizeAndDedupeSupportHistory || window.meNormalizeAndDedupeSupportHistory;
var meNormalizeHolidayRecord = window.capNormalizeHolidayRecord || window.meNormalizeHolidayRecord;
var meNormalizeSupportHistoryRecord = window.capNormalizeSupportHistoryRecord || window.meNormalizeSupportHistoryRecord;
var meSortSupportHistoryByDate = window.capSortSupportHistoryByDate || window.meSortSupportHistoryByDate;
var meGetDateMinusOneDay = window.capGetDateMinusOneDay || window.meGetDateMinusOneDay;

window.logDataGetTeam = function() { return logDataState.team; };
window.logDataGetTasks = function() { return logDataState.tasks; };
window.logDataGetProducts = function() { return logDataState.products; };
window.logDataGetHolidays = function() {
  logDataState.holidays = meNormalizeAndDedupeHolidays(logDataState.holidays);
  return logDataState.holidays;
};
window.logDataGetProductSupportHistory = function() {
  logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
  return logDataState.productSupportHistory;
};

window.logDataAddTeam = function(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false;
  logDataState.team.push({
    id: meUUID(),
    name: name.trim(),
    hoursPerWeek: meGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: 'LOG',
    startDate: startDate || '',
    endDate: endDate || ''
  });
  return true;
};

window.logDataUpdateTeam = function(idx, field, value) {
  if (idx < 0 || idx >= logDataState.team.length) return false;
  const member = logDataState.team[idx];
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

window.logDataDeleteTeam = function(idx) {
  if (idx < 0 || idx >= logDataState.team.length) return false;
  const removed = logDataState.team[idx];
  logDataState.team.splice(idx, 1);
  if (removed && removed.id) {
    const pendingTasks = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.tasks)
      ? window.logDataPendingDeletes.tasks
      : [];
    const pendingTeams = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.teams)
      ? window.logDataPendingDeletes.teams
      : [];
    const pendingSupportHistory = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.supportHistory)
      ? window.logDataPendingDeletes.supportHistory
      : [];
    if (!pendingTeams.includes(removed.id)) pendingTeams.push(removed.id);
    window.logDataPendingDeletes = {
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    };
  }
  return true;
};

window.logDataAddTask = function(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  logDataState.tasks.push({
    id: meUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: 'LOG',
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate || todayStr,
    endDate: endDate || todayStr,
    totalHours: parseFloat(totalHours) || 0,
    status: 'SCHEDULED',
    isDisabled: false,
    createdAt: new Date().toISOString()
  });
  return true;
};

window.logDataUpdateTask = function(taskId, field, value) {
  const task = logDataState.tasks.find(t => t.id === taskId);
  if (!task) return false;
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

window.logDataDeleteTask = function(taskId) {
  const idx = logDataState.tasks.findIndex(t => t.id === taskId);
  if (idx < 0) return false;
  const removed = logDataState.tasks[idx];
  logDataState.tasks.splice(idx, 1);
  if (removed && removed.id) {
    const pendingTasks = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.tasks)
      ? window.logDataPendingDeletes.tasks
      : [];
    const pendingTeams = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.teams)
      ? window.logDataPendingDeletes.teams
      : [];
    const pendingSupportHistory = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.supportHistory)
      ? window.logDataPendingDeletes.supportHistory
      : [];
    if (!pendingTasks.includes(removed.id)) pendingTasks.push(removed.id);
    window.logDataPendingDeletes = {
      tasks: pendingTasks,
      teams: pendingTeams,
      supportHistory: pendingSupportHistory
    };
  }
  return true;
};

window.logDataAddProduct = function(name, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false;
  const breakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek }, hoursPerWeek);
  const product = {
    id: meUUID(),
    name: name.trim(),
    department: 'LOG',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours || 0,
    kittingTimeBookingHours: breakdown.kittingHours,
    productMovementHours: breakdown.productMovementHours || 0,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  };
  logDataState.products.push(product);
  logEnsureProductSupportHistoryBaseline(product);
  return true;
};

window.logDataUpdateProduct = function(idx, field, value, metadata) {
  if (idx < 0 || idx >= logDataState.products.length) return false;
  const product = logDataState.products[idx];
  switch (field) {
    case 'name':
      product.name = value.trim();
      break;
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
      if (typeof window.logDataAddProductSupportHistory === 'function') {
        const effectiveDate = metadata && metadata.effectiveDate ? metadata.effectiveDate : meNormalizeDateOnly(new Date());
        window.logDataAddProductSupportHistory(
          product.id,
          product.hoursPerWeek,
          effectiveDate,
          metadata && metadata.changeReason ? metadata.changeReason : '',
          metadata && metadata.notes ? metadata.notes : '',
          product.kittingHours,
          product.bookingInOutHours,
          product.productMovementHours
        );
      }
      product.supportEffectiveDate = metadata && metadata.effectiveDate
        ? meNormalizeDateOnly(metadata.effectiveDate)
        : (product.supportEffectiveDate || meNormalizeDateOnly(new Date()));
      break;
    }
    case 'kittingTimeBookingHours':
    case 'kittingHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: value,
        bookingInOutHours: product.bookingInOutHours,
        productMovementHours: product.productMovementHours
      }, product.hoursPerWeek);
      product.hoursPerWeek = breakdown.hoursPerWeek;
      product.kittingHours = breakdown.kittingHours;
      product.bookingInOutHours = breakdown.bookingInOutHours;
      product.kittingTimeBookingHours = breakdown.kittingHours;
      product.productMovementHours = breakdown.productMovementHours;
      break;
    }
    case 'bookingInOutHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: product.kittingHours,
        bookingInOutHours: value,
        productMovementHours: product.productMovementHours
      }, product.hoursPerWeek);
      product.hoursPerWeek = breakdown.hoursPerWeek;
      product.kittingHours = breakdown.kittingHours;
      product.bookingInOutHours = breakdown.bookingInOutHours;
      product.kittingTimeBookingHours = breakdown.kittingHours;
      product.productMovementHours = breakdown.productMovementHours;
      break;
    }
    case 'productMovementHours': {
      const breakdown = meNormalizeProductSupportBreakdown({
        kittingHours: product.kittingHours,
        bookingInOutHours: product.bookingInOutHours,
        productMovementHours: value
      }, product.hoursPerWeek);
      product.hoursPerWeek = breakdown.hoursPerWeek;
      product.kittingHours = breakdown.kittingHours;
      product.bookingInOutHours = breakdown.bookingInOutHours;
      product.kittingTimeBookingHours = breakdown.kittingHours;
      product.productMovementHours = breakdown.productMovementHours;
      break;
    }
    case 'supportEffectiveDate':
      product.supportEffectiveDate = meNormalizeDateOnly(value) || product.supportEffectiveDate || '';
      break;
    case 'notes':
      product.notes = value ? value.trim() : '';
      break;
    default:
      return false;
  }
  return true;
};

window.logDataDeleteProduct = function(idx) {
  if (idx < 0 || idx >= logDataState.products.length) return false;
  logDataState.products.splice(idx, 1);
  return true;
};

function logGetProductSupportHistoryRows(productId) {
  if (!Array.isArray(logDataState.productSupportHistory)) return [];
  return meSortSupportHistoryByDate(
    logDataState.productSupportHistory.filter(row => row && row.productId === productId)
  );
}

function logEnsureProductSupportHistoryBaseline(product) {
  if (!product || !product.id) return;
  const existing = logGetProductSupportHistoryRows(product.id);
  if (existing.length > 0) return;

  const baselineDate = meNormalizeDateOnly(product.createdAt || product.created_at) || meNormalizeDateOnly(new Date());
  const breakdown = meNormalizeProductSupportBreakdown(product, product.hoursPerWeek);
  logDataState.productSupportHistory.push({
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
    department: 'LOG',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

window.logDataAddProductSupportHistory = function(productId, hoursPerWeek, effectiveDate, changeReason, notes, kittingHours, bookingInOutHours, productMovementHours) {
  if (!productId) return false;

  const normalizedDate = meNormalizeDateOnly(effectiveDate) || meNormalizeDateOnly(new Date());
  const existingRows = logGetProductSupportHistoryRows(productId);
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
    logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
    return true;
  }

  const priorRows = existingRows.filter(row => row.effectiveDate < normalizedDate);
  if (priorRows.length > 0) {
    const prior = priorRows[priorRows.length - 1];
    prior.endDate = meGetDateMinusOneDay(normalizedDate);
    prior.updatedAt = new Date().toISOString();
  }

  logDataState.productSupportHistory.push({
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
    department: 'LOG',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
  return true;
};

window.logDataUpdateProductSupportHistoryEntry = function(historyId, patch) {
  if (!historyId || !patch) return false;
  const entry = logDataState.productSupportHistory.find(h => h.id === historyId);
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

  const siblings = logDataState.productSupportHistory
    .filter(h => h.productId === entry.productId)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0));
  siblings.forEach((sib, i) => {
    sib.endDate = i + 1 < siblings.length
      ? (typeof meGetDateMinusOneDay === 'function' ? meGetDateMinusOneDay(siblings[i + 1].effectiveDate) : siblings[i + 1].effectiveDate)
      : '';
  });

  logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
  return true;
};

window.logDataDeleteProductSupportHistoryEntry = function(historyId) {
  if (!historyId) return false;
  logDataState.productSupportHistory = logDataState.productSupportHistory.filter(h => h.id !== historyId);
  if (!window.logDataPendingDeletes.supportHistory) window.logDataPendingDeletes.supportHistory = [];
  if (!window.logDataPendingDeletes.supportHistory.includes(historyId)) {
    window.logDataPendingDeletes.supportHistory.push(historyId);
  }
  return true;
};

window.logDataGetProductSupportRateForDate = function(productId, targetDate, fallbackHoursPerWeek) {
  const normalizedTargetDate = meNormalizeDateOnly(targetDate);
  const rows = logGetProductSupportHistoryRows(productId);
  if (!normalizedTargetDate || rows.length === 0) return Number(fallbackHoursPerWeek || 0) || 0;

  const matches = rows.filter(row => {
    if (!row.effectiveDate || row.effectiveDate > normalizedTargetDate) return false;
    if (!row.endDate) return true;
    return row.endDate >= normalizedTargetDate;
  });
  if (matches.length === 0) return Number(fallbackHoursPerWeek || 0) || 0;
  return Number(matches[matches.length - 1].hoursPerWeek || 0) || 0;
};

window.logDataAddHoliday = function(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false;
  const existing = logDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (existing) {
    existing.type = type;
    existing.department = 'LOG';
    return true;
  }
  logDataState.holidays.push({
    id: meUUID(),
    personId,
    date,
    type,
    department: 'LOG',
    createdAt: new Date().toISOString()
  });
  return true;
};

window.logDataUpdateHoliday = function(personId, date, newType) {
  const holiday = logDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (!holiday) return newType ? logDataAddHoliday(personId, date, newType) : false;
  if (!newType) return logDataDeleteHoliday(personId, date);
  if (!['full', 'half'].includes(newType)) return false;
  holiday.type = newType;
  return true;
};

window.logDataDeleteHoliday = function(personId, date) {
  const idx = logDataState.holidays.findIndex(h => h.personId === personId && h.date === date);
  if (idx === -1) return false;
  logDataState.holidays.splice(idx, 1);
  return true;
};

window.logDataAutoSyncLogProducts = function() {
  if (!productsState || !productsState.products) return false;
  let changed = false;
  const dbProducts = Array.isArray(productsState.products) ? productsState.products : [];
  const dbMap = {};
  const dbNameSet = new Set();
  dbProducts.forEach(product => {
    if (product && product.id) dbMap[product.id] = product;
    const normalizedName = (product && product.name ? String(product.name) : '').trim().toLowerCase();
    if (normalizedName) dbNameSet.add(normalizedName);
  });

  const existingByDbId = new Map(
    logDataState.products.filter(product => product.productDatabaseId).map(product => [product.productDatabaseId, product])
  );

  dbProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id);
    if (existing) {
      const newNotes = dbProduct.notes || '';
      if (existing.name !== dbProduct.name || existing.notes !== newNotes || existing.department !== 'LOG') {
        existing.name = dbProduct.name;
        existing.notes = newNotes;
        existing.department = 'LOG';
        changed = true;
      }
      return;
    }

    const seedBreakdown = meNormalizeProductSupportBreakdown({ hoursPerWeek: 0 }, 0);
    logDataState.products.push({
      id: meUUID(),
      name: dbProduct.name,
      department: 'LOG',
      hoursPerWeek: seedBreakdown.hoursPerWeek,
      kittingHours: seedBreakdown.kittingHours,
      bookingInOutHours: seedBreakdown.bookingInOutHours || 0,
      kittingTimeBookingHours: seedBreakdown.kittingHours,
      productMovementHours: seedBreakdown.productMovementHours || 0,
      notes: dbProduct.notes || '',
      productDatabaseId: dbProduct.id,
      createdAt: new Date().toISOString()
    });
    const created = logDataState.products[logDataState.products.length - 1];
    logEnsureProductSupportHistoryBaseline(created);
    changed = true;
  });

  const countBefore = logDataState.products.length;
  const seenDbIds = new Set();
  const seenNames = new Set();
  logDataState.products = logDataState.products.filter(product => {
    if (!product.productDatabaseId) {
      const manualName = (product.name || '').trim().toLowerCase();
      if (manualName && dbNameSet.has(manualName)) return false;
      if (seenNames.has(manualName)) return false;
      seenNames.add(manualName);
      return true;
    }

    if (seenDbIds.has(product.productDatabaseId)) return false;
    seenDbIds.add(product.productDatabaseId);
    return dbMap[product.productDatabaseId] !== undefined;
  });
  if (logDataState.products.length !== countBefore) changed = true;

  return changed;
};

window.logDataInit = async function() {
  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) return;

    const relState = {
      team: await logLoadRelationalTeams() || [],
      tasks: await logLoadRelationalTasks() || [],
      products: await logLoadRelationalProducts() || [],
      holidays: meNormalizeAndDedupeHolidays(await logLoadRelationalHolidays()),
      productSupportHistory: await logLoadRelationalProductSupportHistory() || []
    };

    logDataState.team = relState.team;
    logDataState.tasks = relState.tasks;
    logDataState.products = relState.products;
    logDataState.holidays = relState.holidays;
    logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(relState.productSupportHistory);

    logDataState.team.forEach(member => {
      if (!('jobTitle' in member)) member.jobTitle = '';
      if (!('group' in member)) member.group = '';
      if (!('startDate' in member)) member.startDate = '';
      if (!('endDate' in member)) member.endDate = '';
    });
    logDataState.tasks.forEach(task => {
      if (!('type' in task)) task.type = 'standard';
      if (!('status' in task)) task.status = 'SCHEDULED';
      if (!('isDisabled' in task)) task.isDisabled = false;
    });
    logDataState.products.forEach(product => {
      if (!('productDatabaseId' in product)) product.productDatabaseId = '';
    });

    logDataState.products.forEach(product => logEnsureProductSupportHistoryBaseline(product));
    logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);

    window.logDataState = logDataState;
    window.logDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };
    logDataSubscribe();
  } catch (err) {
    console.warn('logDataInit exception:', err.message);
  }
  window.logDataInitialized = true;
};

window.logDataSave = async function(showAlert) {
  if (window.logDataSaveInProgress) {
    window.logDataSaveQueued = true;
    return;
  }
  window.logDataSaveInProgress = true;

  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      console.warn('LOG save: Supabase not available');
      return;
    }
    if (typeof setSyncBadge === 'function') setSyncBadge('syncing', 'Saving...');
    let ok = true;

    for (let i = 0; i < logDataState.products.length; i++) {
      if (!await logSaveProductRelational(currentUser.id, logDataState.products[i])) ok = false;
    }
    const validProductIds = new Set(logDataState.products.map(product => product.id).filter(Boolean));

    logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
    const validHistory = logDataState.productSupportHistory.filter(row => row && row.productId && validProductIds.has(row.productId));
    if (validHistory.length > 0) {
      if (!await logSaveProductSupportHistoryRelational(currentUser.id, validHistory)) ok = false;
    }

    for (let i = 0; i < logDataState.team.length; i++) {
      if (!await logSaveTeamRelational(currentUser.id, logDataState.team[i])) ok = false;
    }

    for (let i = 0; i < logDataState.tasks.length; i++) {
      const task = logDataState.tasks[i];
      if (task.productId && !validProductIds.has(task.productId)) task.productId = '';
      const result = await logSaveTaskRelational(currentUser.id, task);
      if (!result.success) ok = false;
      else if (!task.id && result.taskId) task.id = result.taskId;
    }

    const queuedDeletes = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.tasks)
      ? window.logDataPendingDeletes.tasks.slice()
      : [];
    if (queuedDeletes.length > 0) {
      const failedDeletes = [];
      for (const taskId of queuedDeletes) {
        if (!await logDeleteTaskRelational(taskId)) {
          failedDeletes.push(taskId);
          ok = false;
        }
      }
      window.logDataPendingDeletes.tasks = failedDeletes;
    }

    const queuedTeamDeletes = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.teams)
      ? window.logDataPendingDeletes.teams.slice()
      : [];
    if (queuedTeamDeletes.length > 0) {
      const failedTeamDeletes = [];
      for (const teamId of queuedTeamDeletes) {
        if (!await logDeleteTeamRelational(teamId)) {
          failedTeamDeletes.push(teamId);
          ok = false;
        }
      }
      window.logDataPendingDeletes.teams = failedTeamDeletes;
    }

    const queuedSupportHistoryDeletes = window.logDataPendingDeletes && Array.isArray(window.logDataPendingDeletes.supportHistory)
      ? window.logDataPendingDeletes.supportHistory.slice()
      : [];
    if (queuedSupportHistoryDeletes.length > 0) {
      const failedSupportHistoryDeletes = [];
      for (const historyId of queuedSupportHistoryDeletes) {
        if (!await logDeleteSupportHistoryRelational(historyId)) {
          failedSupportHistoryDeletes.push(historyId);
          ok = false;
        }
      }
      window.logDataPendingDeletes.supportHistory = failedSupportHistoryDeletes;
    }

    const seen = new Set();
    logDataState.holidays = meNormalizeAndDedupeHolidays(logDataState.holidays);
    const holidayData = logDataState.holidays
      .filter(holiday => {
        if (holiday.userId && holiday.userId !== currentUser.id) return false;
        const key = holiday.personId + '_' + holiday.date;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(holiday => ({
        id: holiday.id,
        user_id: currentUser.id,
        person_id: holiday.personId,
        date: holiday.date,
        type: holiday.type,
        department: 'LOG'
      }));

    const { error: delHolErr } = await supa.from('log_holidays').delete().eq('user_id', currentUser.id);
    if (delHolErr) {
      console.warn('LOG holiday delete error:', delHolErr.message);
      ok = false;
    } else if (holidayData.length > 0) {
      const { error: insHolErr } = await supa.from('log_holidays').insert(holidayData);
      if (insHolErr) {
        console.warn('LOG holiday insert error:', insHolErr.message);
        ok = false;
      }
    }

    if (typeof setSyncBadge === 'function') setSyncBadge(ok ? 'saved' : 'error', ok ? 'Saved' : 'Save failed');
    if (!ok) throw new Error('LOG relational save had issues');
  } catch (err) {
    console.error('LOG save exception:', err.message || err);
    if (typeof setSyncBadge === 'function') setSyncBadge('error', 'Save failed');
  } finally {
    window.logDataSaveInProgress = false;
    if (window.logDataSaveQueued) {
      window.logDataSaveQueued = false;
      await window.logDataSave(false);
    }
  }
};

window.logDataReset = function() {
  logDataState.team = [];
  logDataState.tasks = [];
  logDataState.products = [];
  logDataState.holidays = [];
  logDataState.productSupportHistory = [];
  window.logDataState = logDataState;
  window.logDataPendingDeletes = { tasks: [], teams: [], supportHistory: [] };
};

function logIsCapacityFilterInputFocused() {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  if (typeof active.matches !== 'function') return false;

  return active.matches('[data-cap-action="cap-task-search"], [data-cap-action="cap-task-filter-category"], [data-cap-action="cap-task-filter-assignee"], [data-cap-action="cap-task-filter-product"], [data-cap-action="cap-task-filter-month"], [data-cap-action="cap-products-search"], [data-cap-action="cap-product-load-search"]');
}

function logApplyRealtimeRender() {
  requestRender('log', {
    trigger: 'realtime',
    renderNow: function() {
      if (logTab !== 'chart' && typeof logRefreshCurrentTab === 'function') {
        logRefreshCurrentTab();
      }
    },
    isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell(),
    isFiltering: logIsCapacityFilterInputFocused(),
    debounceMs: 150,
  });
}

window.logDataSubscribe = function() {
  if (!currentUser) return;
  if (typeof createMultiTableRealtimeSubscription !== 'function') return;

  createMultiTableRealtimeSubscription([
    {
      table: 'log_teams',
      onInsert: (row) => {
        if (window.logDataSaveInProgress) return;
        const normalized = {
          id: row.id,
          name: row.name || '',
          hoursPerWeek: meGetHoursPerWeek(row.hours_per_week),
          utilisation: parseFloat(row.utilisation) || 80,
          jobTitle: row.job_title || '',
          group: row.team_group || '',
          department: 'LOG',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          createdAt: row.created_at
        };
        if (!logDataState.team.some(member => member.id === normalized.id)) {
          logDataState.team.push(normalized);
          logApplyRealtimeRender();
        }
      },
      onUpdate: () => {},
      onDelete: (deleted) => {
        if (window.logDataSaveInProgress) return;
        logDataState.team = logDataState.team.filter(member => member.id !== deleted.id);
        logApplyRealtimeRender();
      }
    },
    {
      table: 'log_tasks',
      onInsert: (row) => {
        if (window.logDataSaveInProgress) return;
        const normalized = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'LOG',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        };
        if (!logDataState.tasks.some(task => task.id === normalized.id)) {
          logDataState.tasks.push(normalized);
          logApplyRealtimeRender();
        }
      },
      onUpdate: (row) => {
        if (window.logDataSaveInProgress) return;
        const normalized = {
          id: row.id,
          name: row.name || '',
          category: row.category || 'NPI',
          type: row.type || 'standard',
          department: 'LOG',
          assigneeId: row.assignee_id || '',
          productId: row.product_id || '',
          startDate: row.start_date || '',
          endDate: row.end_date || '',
          totalHours: parseFloat(row.total_hours) || 0,
          status: row.status || 'SCHEDULED',
          isDisabled: row.is_disabled === true,
          createdAt: row.created_at
        };
        const idx = logDataState.tasks.findIndex(task => task.id === normalized.id);
        if (idx < 0) logDataState.tasks.push(normalized);
        else logDataState.tasks[idx] = { ...logDataState.tasks[idx], ...normalized };
        logApplyRealtimeRender();
      },
      onDelete: (deleted) => {
        if (window.logDataSaveInProgress) return;
        logDataState.tasks = logDataState.tasks.filter(task => task.id !== deleted.id);
        logApplyRealtimeRender();
      }
    },
    {
      table: 'log_products',
      onInsert: (row) => {
        if (window.logDataSaveInProgress) return;
        const breakdown = meNormalizeProductSupportBreakdown(row, row.hours_per_week);
        const normalized = {
          id: row.id,
          name: row.name || '',
          productDatabaseId: row.product_database_id || '',
          hoursPerWeek: breakdown.hoursPerWeek,
          kittingHours: breakdown.kittingHours,
          bookingInOutHours: breakdown.bookingInOutHours,
          kittingTimeBookingHours: breakdown.kittingTimeBookingHours,
          productMovementHours: breakdown.productMovementHours,
          department: 'LOG',
          notes: row.notes || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at || ''
        };
        if (!logDataState.products.some(product => product.id === normalized.id)) {
          logDataState.products.push(normalized);
          logApplyRealtimeRender();
        }
      },
      onUpdate: () => {},
      onDelete: (deleted) => {
        if (window.logDataSaveInProgress) return;
        logDataState.products = logDataState.products.filter(product => product.id !== deleted.id);
        logApplyRealtimeRender();
      }
    },
    {
      table: 'log_holidays',
      onInsert: (row) => {
        if (window.logDataSaveInProgress) return;
        const normalized = meNormalizeHolidayRecord(row);
        if (!normalized) return;
        if (!logDataState.holidays.some(holiday => holiday.id === normalized.id)) {
          logDataState.holidays.push(normalized);
          logApplyRealtimeRender();
        }
      },
      onUpdate: () => {},
      onDelete: (deleted) => {
        if (window.logDataSaveInProgress) return;
        logDataState.holidays = logDataState.holidays.filter(holiday => holiday.id !== deleted.id);
        logApplyRealtimeRender();
      }
    },
    {
      table: 'log_product_support_history',
      onInsert: (row) => {
        if (window.logDataSaveInProgress) return;
        const normalized = meNormalizeSupportHistoryRecord(row, 'LOG');
        if (!normalized) return;
        const idx = logDataState.productSupportHistory.findIndex(history => history.id === normalized.id);
        if (idx >= 0) logDataState.productSupportHistory[idx] = normalized;
        else logDataState.productSupportHistory.push(normalized);
        logDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(logDataState.productSupportHistory);
        logApplyRealtimeRender();
      },
      onUpdate: () => {},
      onDelete: (deleted) => {
        if (window.logDataSaveInProgress) return;
        logDataState.productSupportHistory = logDataState.productSupportHistory.filter(history => history.id !== deleted.id);
        logApplyRealtimeRender();
      }
    }
  ], 'log-capacity-channel');
};

window.flushLogDataNow = function() {
  if (window.logDataSaveInProgress || window.logDataSaveQueued) {
    logDataSave(false);
  }
};

function logDataUnsubscribe() {
  if (typeof removeRealtimeSubscription === 'function') {
    removeRealtimeSubscription('log-capacity-channel');
  }
}
