/* ============================================================
   me-data.js — ME Capacity Data Layer (Global Namespace)
   Combines all data/me-data/*.js modules into one file

  Supabase Tables: me_teams, me_tasks, me_products, me_holidays
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// Global data object
// ─────────────────────────────────────────────────────────────
window.meDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: [],
  productSupportHistory: []
};

window.meDataPendingDeletes = {
  tasks: []
};

window.meDataSaveInProgress = false;
window.meDataSaveQueued = false;
window.meDataInitialized = false;

function meNormalizeDepartmentTag(value, fallback = 'ME') {
  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  return normalized === 'PM' ? 'PM' : 'ME';
}

window.meGetDepartmentFromContext = function(explicitDepartment) {
  if (explicitDepartment) {
    return meNormalizeDepartmentTag(explicitDepartment, 'ME');
  }

  if (typeof window.meCurrentDepartmentContext === 'string' && window.meCurrentDepartmentContext.length > 0) {
    return meNormalizeDepartmentTag(window.meCurrentDepartmentContext, 'ME');
  }

  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects') {
    return 'PM';
  }

  return 'ME';
};

window.meFilterByDepartment = function(list, department, fallback = 'ME') {
  if (!Array.isArray(list)) return [];
  const target = meNormalizeDepartmentTag(department, fallback);
  return list.filter(item => meNormalizeDepartmentTag(item && item.department, fallback) === target);
};

function meNormalizeHolidayRecord(holiday) {
  if (!holiday || typeof holiday !== 'object') return null;

  const personId = holiday.personId || holiday.person_id;
  const date = holiday.date || '';
  const type = holiday.type === 'half' ? 'half' : 'full';

  if (!personId || !date) return null;

  return {
    id: holiday.id || meUUID(),
    personId,
    date,
    type,
    department: meNormalizeDepartmentTag(holiday.department, 'ME'),
    createdAt: holiday.createdAt || holiday.created_at || new Date().toISOString()
  };
}

function meNormalizeAndDedupeHolidays(holidays) {
  if (!Array.isArray(holidays)) return [];

  const byPersonDate = new Map();
  holidays.forEach(rawHoliday => {
    const normalized = meNormalizeHolidayRecord(rawHoliday);
    if (!normalized) return;
    byPersonDate.set(`${normalized.personId}|${normalized.date}`, normalized);
  });

  return Array.from(byPersonDate.values());
}

function meNormalizeDateOnly(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function meGetDateMinusOneDay(dateValue) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() - 1);
  return parsed.toISOString().split('T')[0];
}

function meNormalizeSupportHistoryRecord(record, fallbackDepartment = 'ME') {
  if (!record || typeof record !== 'object') return null;

  const productId = record.productId || record.product_id;
  const effectiveDate = meNormalizeDateOnly(record.effectiveDate || record.effective_date);
  if (!productId || !effectiveDate) return null;

  return {
    id: record.id || meUUID(),
    productId,
    hoursPerWeek: Number(record.hoursPerWeek ?? record.hours_per_week ?? 0) || 0,
    effectiveDate,
    endDate: meNormalizeDateOnly(record.endDate || record.end_date) || '',
    changeReason: record.changeReason || record.change_reason || '',
    notes: record.notes || '',
    department: meNormalizeDepartmentTag(record.department, fallbackDepartment),
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || ''
  };
}

function meSortSupportHistoryByDate(historyRows) {
  return (historyRows || []).slice().sort((a, b) => {
    const aDate = meNormalizeDateOnly(a.effectiveDate || a.effective_date);
    const bDate = meNormalizeDateOnly(b.effectiveDate || b.effective_date);
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });
}

function meNormalizeAndDedupeSupportHistory(rows) {
  if (!Array.isArray(rows)) return [];

  const deduped = new Map();
  rows.forEach(raw => {
    const normalized = meNormalizeSupportHistoryRecord(raw);
    if (!normalized) return;
    const key = `${normalized.productId}|${normalized.effectiveDate}|${normalized.department}`;
    deduped.set(key, normalized);
  });

  return meSortSupportHistoryByDate(Array.from(deduped.values()));
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
  meDataState.productSupportHistory.push({
    id: meUUID(),
    productId: product.id,
    hoursPerWeek: Number(product.hoursPerWeek || 0) || 0,
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

// Initialize missing date fields on backward compatibility
function meInitTeamDates() {
  meDataState.team.forEach(member => {
    if (!member.startDate) member.startDate = '';
    if (!member.endDate) member.endDate = '';
  });
}


// ─────────────────────────────────────────────────────────────
// TEAM CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddTeam = function(name, hoursPerWeek, utilisation, startDate, endDate, department) {
  if (!name || name.trim().length === 0) return false;
  const member = {
    id: meUUID(),
    name: name.trim(),
    hoursPerWeek: meGetHoursPerWeek(hoursPerWeek),
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
    department: meGetDepartmentFromContext(department),
    startDate: startDate || '',
    endDate: endDate || ''
  };
  meDataState.team.push(member);
  return true;
};

window.meDataUpdateTeam = function(idx, field, value) {
  if (idx < 0 || idx >= meDataState.team.length) return false;
  const member = meDataState.team[idx];
  switch (field) {
    case 'name':
      member.name = value.trim();
      break;
    case 'hoursPerWeek':
      member.hoursPerWeek = meGetHoursPerWeek(value);
      break;
    case 'utilisation':
      member.utilisation = parseFloat(value) || 80;
      break;
    case 'jobTitle':
      member.jobTitle = value ? value.trim() : '';
      break;
    case 'group':
      member.group = value ? value.trim() : '';
      break;
    case 'department':
      member.department = meNormalizeDepartmentTag(value, 'ME');
      break;
    case 'startDate':
      member.startDate = value || '';
      break;
    case 'endDate':
      member.endDate = value || '';
      break;
    default:
      return false;
  }
  return true;
};

window.meDataDeleteTeam = function(idx) {
  if (idx < 0 || idx >= meDataState.team.length) return false;
  meDataState.team.splice(idx, 1);
  return true;
};

window.meDataGetTeam = function() {
  return meDataState.team;
};

// ─────────────────────────────────────────────────────────────
// TASK CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddTask = function(name, category, assigneeId, startDate, endDate, totalHours, productId, department) {
  if (!name || name.trim().length === 0) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  const task = {
    id: meUUID(),
    name: name.trim(),
    category: category || 'NPI',
    type: 'standard',
    department: meGetDepartmentFromContext(department),
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate || todayStr,
    endDate: endDate || todayStr,
    totalHours: parseFloat(totalHours) || 0,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString()
  };
  meDataState.tasks.push(task);
  return true;
};

window.meDataUpdateTask = function(idx, field, value) {
  if (idx < 0 || idx >= meDataState.tasks.length) return false;
  const task = meDataState.tasks[idx];
  switch (field) {
    case 'name':
      task.name = value.trim();
      break;
    case 'category':
      task.category = value || 'NPI';
      break;
    case 'department':
      task.department = meNormalizeDepartmentTag(value, 'ME');
      break;
    case 'assigneeId':
      task.assigneeId = value || '';
      break;
    case 'productId':
      task.productId = value || '';
      break;
    case 'startDate':
      task.startDate = value;
      break;
    case 'endDate':
      task.endDate = value;
      break;
    case 'totalHours':
      task.totalHours = parseFloat(value) || 0;
      break;
    case 'status':
      task.status = value || 'SCHEDULED';
      break;
    default:
      return false;
  }
  return true;
};

window.meDataDeleteTask = function(idx) {
  if (idx < 0 || idx >= meDataState.tasks.length) return false;
  const removedTask = meDataState.tasks[idx];
  meDataState.tasks.splice(idx, 1);
  if (removedTask && removedTask.id) {
    const pending = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.tasks)
      ? window.meDataPendingDeletes.tasks
      : [];
    if (!pending.includes(removedTask.id)) {
      pending.push(removedTask.id);
    }
    window.meDataPendingDeletes = { tasks: pending };
  }
  return true;
};

window.meDataGetTasks = function() {
  return meDataState.tasks;
};

// ─────────────────────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddProduct = function(name, hoursPerWeek, notes, productDatabaseId, department) {
  if (!name || name.trim().length === 0) return false;
  const product = {
    id: meUUID(),
    name: name.trim(),
    department: meGetDepartmentFromContext(department),
    hoursPerWeek: parseFloat(hoursPerWeek) || 5,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  };
  meDataState.products.push(product);
  meEnsureProductSupportHistoryBaseline(product);
  return true;
};

window.meDataUpdateProduct = function(idx, field, value, metadata) {
  if (idx < 0 || idx >= meDataState.products.length) return false;
  const product = meDataState.products[idx];
  switch (field) {
    case 'name':
      product.name = value.trim();
      break;
    case 'hoursPerWeek':
      product.hoursPerWeek = parseFloat(value) || 0;

      // Maintain effective-dated support history so past capacity can be reproduced.
      if (typeof window.meDataAddProductSupportHistory === 'function') {
        const effectiveDate = metadata && metadata.effectiveDate
          ? metadata.effectiveDate
          : meNormalizeDateOnly(new Date());
        window.meDataAddProductSupportHistory(
          product.id,
          product.hoursPerWeek,
          effectiveDate,
          metadata && metadata.changeReason ? metadata.changeReason : '',
          metadata && metadata.notes ? metadata.notes : '',
          product.department
        );
      }
      product.supportEffectiveDate = metadata && metadata.effectiveDate
        ? meNormalizeDateOnly(metadata.effectiveDate)
        : (product.supportEffectiveDate || meNormalizeDateOnly(new Date()));
      break;
    case 'supportEffectiveDate':
      product.supportEffectiveDate = meNormalizeDateOnly(value) || product.supportEffectiveDate || '';
      break;
    case 'notes':
      product.notes = value ? value.trim() : '';
      break;
    case 'department':
      product.department = meNormalizeDepartmentTag(value, 'ME');
      break;
    default:
      return false;
  }
  return true;
};

window.meDataDeleteProduct = function(idx) {
  if (idx < 0 || idx >= meDataState.products.length) return false;
  meDataState.products.splice(idx, 1);
  return true;
};

window.meDataGetProducts = function() {
  return meDataState.products;
};

window.meDataGetProductSupportHistory = function() {
  meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
  return meDataState.productSupportHistory;
};

window.meDataAddProductSupportHistory = function(productId, hoursPerWeek, effectiveDate, changeReason, notes, department) {
  if (!productId) return false;

  const normalizedDate = meNormalizeDateOnly(effectiveDate) || meNormalizeDateOnly(new Date());
  const targetDepartment = meNormalizeDepartmentTag(department, 'ME');
  const existingRows = meGetProductSupportHistoryRows(productId, targetDepartment);
  const sameDateRow = existingRows.find(row => row.effectiveDate === normalizedDate);
  if (sameDateRow) {
    sameDateRow.hoursPerWeek = Number(hoursPerWeek) || 0;
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
    hoursPerWeek: Number(hoursPerWeek) || 0,
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

/**
 * Auto-sync products from product management database into a department stream.
 * Includes all product statuses so capacity planners can filter in the UI.
 */
function meDataAutoSyncDepartmentProducts(department) {
  if (!productsState || !productsState.products) {
    return false;
  }

  const targetDepartment = meNormalizeDepartmentTag(department, 'ME');
  const dbProducts = Array.isArray(productsState.products) ? productsState.products : [];

  // Build a map of DB products by ID for quick lookup
  const dbMap = {};
  dbProducts.forEach(p => {
    if (p && p.id) dbMap[p.id] = p;
  });

  // Update or create department-tagged products from the master products DB.
  // Build a Map keyed by productDatabaseId so each lookup is O(1) instead of O(n).
  const existingByDbId = new Map(
    meDataState.products
      .filter(meP => meNormalizeDepartmentTag(meP.department, targetDepartment) === targetDepartment && meP.productDatabaseId)
      .map(meP => [meP.productDatabaseId, meP])
  );

  dbProducts.forEach(dbProduct => {
    const existing = existingByDbId.get(dbProduct.id);

    if (existing) {
      existing.name = dbProduct.name;
      existing.notes = dbProduct.notes || '';
      existing.department = targetDepartment;
    } else {
      // Temporarily set context so meDataAddProduct tags the product correctly
      const savedContext = window.meCurrentDepartmentContext;
      window.meCurrentDepartmentContext = targetDepartment;
      meDataAddProduct(dbProduct.name, '', '', 0, dbProduct.notes || '', dbProduct.id, targetDepartment);
      window.meCurrentDepartmentContext = savedContext;
    }
  });

  // De-dup department products and remove DB-linked rows that no longer exist in products DB
  const seenDbIds = new Set();
  const seenNames = new Set();
  meDataState.products = meDataState.products.filter(meP => {
    if (meNormalizeDepartmentTag(meP.department, targetDepartment) !== targetDepartment) {
      return true;
    }

    if (!meP.productDatabaseId) {
      // For manual entries (no DB ID), de-dup by name
      const manualName = (meP.name || '').trim().toLowerCase();
      if (seenNames.has(manualName)) return false;
      seenNames.add(manualName);
      return true;
    }

    // For DB-linked products, keep only the first instance and only if still in master DB
    if (seenDbIds.has(meP.productDatabaseId)) {
      return false;
    }
    seenDbIds.add(meP.productDatabaseId);
    return dbMap[meP.productDatabaseId] !== undefined;
  });

  return true;
}

window.meDataAutoSyncProductionProducts = function() {
  return meDataAutoSyncDepartmentProducts('ME');
};

/**
 * Auto-sync products from product management database for the PM capacity stream.
 */
window.meDataAutoSyncPMProducts = function() {
  return meDataAutoSyncDepartmentProducts('PM');
};

// ─────────────────────────────────────────────────────────────
// HOLIDAY CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddHoliday = function(personId, date, type, department) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false;
  const existing = meDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (existing) {
    existing.type = type;
    existing.department = meGetDepartmentFromContext(department);
    return true;
  }
  const holiday = {
    id: meUUID(),
    personId: personId,
    date: date,
    type: type,
    department: meGetDepartmentFromContext(department),
    createdAt: new Date().toISOString()
  };
  meDataState.holidays.push(holiday);
  return true;
};

window.meDataUpdateHoliday = function(personId, date, newType) {
  const holiday = meDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (!holiday) {
    if (newType) {
      return meDataAddHoliday(personId, date, newType);
    }
    return false;
  }
  if (!newType) {
    return meDataDeleteHoliday(personId, date);
  }
  if (!['full', 'half'].includes(newType)) {
    return false;
  }
  holiday.type = newType;
  return true;
};

window.meDataDeleteHoliday = function(personId, date) {
  const idx = meDataState.holidays.findIndex(h => h.personId === personId && h.date === date);
  if (idx === -1) return false;
  meDataState.holidays.splice(idx, 1);
  return true;
};

window.meDataGetHolidays = function() {
  meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays);
  return meDataState.holidays;
};

// ─────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────

window.meDataInit = async function() {
  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      // meDataInit is called during early boot as well as post-login; skip quietly until auth is ready.
      meEnsureStructure();
      return;
    }

      let relState = {
        team: [],
        tasks: [],
        products: [],
        holidays: [],
        productSupportHistory: []
      };

      // Load from relational tables first.
      if (typeof meLoadRelationalTeams === 'function') {
        try {
          relState = {
            team: await meLoadRelationalTeams(currentUser.id) || [],
            tasks: await meLoadRelationalTasks(currentUser.id) || [],
            products: await meLoadRelationalProducts(currentUser.id) || [],
            holidays: meNormalizeAndDedupeHolidays(await meLoadRelationalHolidays(currentUser.id)),
            productSupportHistory: typeof meLoadRelationalProductSupportHistory === 'function'
              ? (await meLoadRelationalProductSupportHistory(currentUser.id) || [])
              : []
          };
        } catch (relErr) {
          console.warn('ME relational load failed:', relErr.message);
        }
      }

      meDataState = {
        team: relState.team,
        tasks: relState.tasks,
        products: relState.products,
        holidays: relState.holidays,
        productSupportHistory: meNormalizeAndDedupeSupportHistory(relState.productSupportHistory)
      };

      // Ensure all data has backward-compatible fields
      meDataState.team.forEach(member => {
        if (!('jobTitle' in member)) member.jobTitle = '';
        if (!('group' in member)) member.group = '';
        if (!('department' in member)) member.department = 'ME';
        if (!('startDate' in member)) member.startDate = '';
        if (!('endDate' in member)) member.endDate = '';
      });

      meDataState.tasks.forEach(task => {
        if (!('type' in task)) task.type = 'standard';
        if (!('department' in task)) task.department = 'ME';
        if (!('status' in task)) task.status = 'SCHEDULED';
      });

      meDataState.products.forEach(product => {
        if (!('productDatabaseId' in product)) product.productDatabaseId = '';
        if (!('department' in product)) product.department = 'ME';
      });

      meEnsureAllProductSupportHistoryBaselines();
      meDataState.products.forEach(product => {
        if (!('supportEffectiveDate' in product)) {
          product.supportEffectiveDate = window.meDataGetProductLatestSupportEffectiveDate(
            product.id,
            product.department,
            product.createdAt
          );
        }
      });

      meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays || []);

      window.meDataState = meDataState;
      window.meDataPendingDeletes = { tasks: [] };

      // Set up real-time sync
      meDataSubscribe();
  } catch (err) {
    console.warn('Supabase load exception, using defaults:', err);
  }
  meEnsureStructure();
  window.meDataInitialized = true;
};

window.meDataSave = async function(showAlert) {
  if (window.meDataSaveInProgress) {
    window.meDataSaveQueued = true;
    return;
  }

  window.meDataSaveInProgress = true;

  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      console.warn('ME save: Supabase not available');
      return;
    }

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('syncing', 'Saving...');
    }

    let relationalSuccess = true;

    // Save to relational tables (if functions available)
    if (typeof meSaveTeamRelational === 'function' &&
        typeof meSaveTaskRelational === 'function' &&
        typeof meSaveProductRelational === 'function') {
      try {
  
        // 1. Save products FIRST (tasks FK-reference products)
        for (let i = 0; i < meDataState.products.length; i++) {
          const success = await meSaveProductRelational(currentUser.id, meDataState.products[i]);
          if (!success) {
            console.warn('Failed to save product', i);
            relationalSuccess = false;
          }
        }

        // Build set of valid product IDs now in DB
        const validProductIds = new Set(meDataState.products.map(p => p.id).filter(Boolean));

        // 1-B. Save support history rows once products have stable IDs.
        if (typeof meSaveProductSupportHistoryRelational === 'function') {
          meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
          if (meDataState.productSupportHistory.length > 0) {
            const supportSaveOk = await meSaveProductSupportHistoryRelational(currentUser.id, meDataState.productSupportHistory);
            if (!supportSaveOk) {
              relationalSuccess = false;
            }
          }
        }

        // 2. Save team members
        for (let i = 0; i < meDataState.team.length; i++) {
          const success = await meSaveTeamRelational(currentUser.id, meDataState.team[i]);
          if (!success) {
            console.warn('Failed to save team member', i);
            relationalSuccess = false;
          }
        }

        // 3. Save tasks (products must already be saved above)
        for (let i = 0; i < meDataState.tasks.length; i++) {
          const task = meDataState.tasks[i];

          // Null out productId if it doesn't exist in me_products (prevents FK violation)
          if (task.productId && !validProductIds.has(task.productId)) {
            task.productId = '';
          }

          const taskResult = await meSaveTaskRelational(currentUser.id, task);
          if (!taskResult.success) {
            console.warn('Failed to save task', i);
            relationalSuccess = false;
          } else {
            const taskId = taskResult.taskId || task.id;
            if (!task.id && taskId) {
              task.id = taskId;
            }
          }
        }

        // 3-B. Persist queued task deletions so refresh does not resurrect removed rows.
        const queuedTaskDeletes = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.tasks)
          ? window.meDataPendingDeletes.tasks.slice()
          : [];

        if (queuedTaskDeletes.length > 0) {
          if (typeof meDeleteTaskRelational === 'function') {
            const failedTaskDeletes = [];
            for (let i = 0; i < queuedTaskDeletes.length; i++) {
              const taskId = queuedTaskDeletes[i];
              const deleted = await meDeleteTaskRelational(taskId);
              if (!deleted) {
                failedTaskDeletes.push(taskId);
                relationalSuccess = false;
              }
            }
            window.meDataPendingDeletes.tasks = failedTaskDeletes;
          } else {
            console.warn('Task deletes queued but meDeleteTaskRelational is unavailable');
            relationalSuccess = false;
          }
        }

        // 4. Save holidays for the current user only, then reload as shared data.
        // The table's unique key is (user_id, person_id, date), so global deletes are
        // destructive and can wipe other users' rows if one user saves an empty state.
        const _holSeen = new Set();
        meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays);
        const holidayData = (meDataState.holidays || [])
          .filter(h => {
            const key = h.personId + '_' + h.date;
            if (_holSeen.has(key)) return false;
            _holSeen.add(key);
            return true;
          })
          .map(h => {
            const row = {
              id: h.id,
              user_id: currentUser.id,
              person_id: h.personId,
              date: h.date,
              type: h.type,
              department: meNormalizeDepartmentTag(h.department, 'ME')
            };
            return row;
          });

        const { error: delHolErr } = await supa
          .from('me_holidays')
          .delete()
          .eq('user_id', currentUser.id);

        if (delHolErr) {
          console.warn('Failed to clear holidays:', delHolErr.message);
          relationalSuccess = false;
        } else if (holidayData.length > 0) {
          const { error: insHolErr } = await supa
            .from('me_holidays')
            .insert(holidayData);
          if (insHolErr) {
            console.warn('Failed to insert holidays:', insHolErr.message);
            relationalSuccess = false;
          }
        }

        if (relationalSuccess) {
        } else {
          console.warn('⚠ Relational save had issues');
        }
      } catch (relErr) {
        console.warn('Relational save error:', relErr.message);
        relationalSuccess = false;
      }
    } else {
      console.warn('Relational functions not available');
      relationalSuccess = false;
    }

    // Final status
    if (relationalSuccess) {
      if (typeof setSyncBadge === 'function') {
        setSyncBadge('saved', 'Saved');
      }
    } else {
      throw new Error('Relational save failed');
    }
  } catch (err) {
    console.error('ME save exception:', err.message || err);
    if (typeof setSyncBadge === 'function') {
      setSyncBadge('error', 'Save failed');
    }
  } finally {
    window.meDataSaveInProgress = false;
    if (window.meDataSaveQueued) {
      window.meDataSaveQueued = false;
      await window.meDataSave(false);
    }
  }
};

window.meDataGetState = function() {
  return { ...meDataState };
};

window.meDataReset = function() {
  meDataState = {
    team: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: []
  };
  window.meDataState = meDataState;
  window.meDataPendingDeletes = { tasks: [] };
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

function meEnsureStructure() {
  if (!meDataState.team) meDataState.team = [];
  if (!meDataState.tasks) meDataState.tasks = [];
  if (!meDataState.products) meDataState.products = [];
  if (!meDataState.holidays) meDataState.holidays = [];
  if (!meDataState.productSupportHistory) meDataState.productSupportHistory = [];
}

function meUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─────────────────────────────────────────────────────────────
// Real-Time Sync (Generic System)
// ─────────────────────────────────────────────────────────────

// Maps a raw Supabase me_tasks row to the camelCase shape used in meDataState.
// Single source of truth used by both the onInsert and onUpdate handlers.
function meNormalizeTaskRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'NPI',
    type: row.type || 'standard',
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    assigneeId: row.assignee_id || '',
    productId: row.product_id || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    totalHours: parseFloat(row.total_hours) || 0,
    status: row.status || 'SCHEDULED',
    createdAt: row.created_at || new Date().toISOString()
  };
}

window.meDataSubscribe = function() {
  if (!currentUser) return;
  if (typeof render !== 'function') {
    console.warn('meDataSubscribe: render() not yet defined, skipping subscription setup');
    return;
  }

  // 3-B: Merge the 4 individual ME capacity channels (me_teams, me_tasks,
  // me_products, me_holidays) into a single Supabase channel to reduce the
  // per-user WebSocket connection count.
  // CRITICAL: NO user_id filter — all users see all records for collaborative editing
  // onUpdate: no render() — state is already current from the local edit that triggered the save.
  // Calling render() on our own write-echo would clobber any in-progress user input.
  createMultiTableRealtimeSubscription([
    {
      table: 'me_teams',
      onInsert: (newTeam) => {
        const normalizedTeam = {
          id: newTeam.id,
          name: newTeam.name || '',
          hoursPerWeek: meGetHoursPerWeek(newTeam.hours_per_week),
          utilisation: parseFloat(newTeam.utilisation) || 80,
          jobTitle: newTeam.job_title || '',
          group: newTeam.team_group || '',
          department: meNormalizeDepartmentTag(newTeam.department, 'ME'),
          startDate: newTeam.start_date || '',
          endDate: newTeam.end_date || '',
          createdAt: newTeam.created_at || new Date().toISOString()
        };
        if (!meDataState.team.some(t => t.id === normalizedTeam.id)) {
          meDataState.team.push(normalizedTeam);
          if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
          meCapSmartRender();
        }
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        meDataState.team = meDataState.team.filter(t => t.id !== deleted.id);
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      }
    },
    {
      table: 'me_tasks',
      onInsert: (newTask) => {
        const normalizedTask = meNormalizeTaskRow(newTask);
        if (!meDataState.tasks.some(t => t.id === normalizedTask.id)) {
          meDataState.tasks.push(normalizedTask);
          if (isEditingInlineCell()) {
            window.mePendingRealTimeUpdate = true;
            return;
          }
          meCapSmartRender();
        }
      },
      onUpdate: (updatedTask) => {
        const normalizedTask = meNormalizeTaskRow(updatedTask);

        const idx = meDataState.tasks.findIndex(t => t.id === normalizedTask.id);
        if (idx < 0) {
          meDataState.tasks.push(normalizedTask);
          if (isEditingInlineCell()) {
            window.mePendingRealTimeUpdate = true;
            return;
          }
          meCapSmartRender();
          return;
        }

        const current = meDataState.tasks[idx];
        const changed =
          current.name !== normalizedTask.name ||
          current.category !== normalizedTask.category ||
          current.type !== normalizedTask.type ||
          current.department !== normalizedTask.department ||
          current.assigneeId !== normalizedTask.assigneeId ||
          current.productId !== normalizedTask.productId ||
          current.startDate !== normalizedTask.startDate ||
          current.endDate !== normalizedTask.endDate ||
          Number(current.totalHours || 0) !== Number(normalizedTask.totalHours || 0) ||
          current.status !== normalizedTask.status;

        if (!changed) return;
        meDataState.tasks[idx] = { ...current, ...normalizedTask };
        if (isEditingInlineCell()) {
          window.mePendingRealTimeUpdate = true;
          return;
        }
        meCapSmartRender();
      },
      onDelete: (deleted) => {
        meDataState.tasks = meDataState.tasks.filter(t => t.id !== deleted.id);
        if (isEditingInlineCell()) {
          window.mePendingRealTimeUpdate = true;
          return;
        }
        meCapSmartRender();
      }
    },
    {
      table: 'me_products',
      onInsert: (newProduct) => {
        const normalizedProduct = {
          id: newProduct.id,
          name: newProduct.name || '(Unknown Product)',
          productDatabaseId: newProduct.product_database_id || '',
          hoursPerWeek: parseFloat(newProduct.hours_per_week) || 0,
          department: meNormalizeDepartmentTag(newProduct.department, 'ME'),
          notes: newProduct.notes || '',
          createdAt: newProduct.created_at || new Date().toISOString(),
          updatedAt: newProduct.updated_at || ''
        };
        if (!meDataState.products.some(p => p.id === normalizedProduct.id)) {
          meDataState.products.push(normalizedProduct);
          if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
          meCapSmartRender();
        }
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        meDataState.products = meDataState.products.filter(p => p.id !== deleted.id);
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      }
    },
    {
      table: 'me_product_support_history',
      onInsert: (newEntry) => {
        const normalized = meNormalizeSupportHistoryRecord(newEntry);
        if (!normalized) return;
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id);
        if (existingIdx >= 0) {
          meDataState.productSupportHistory[existingIdx] = normalized;
        } else {
          meDataState.productSupportHistory.push(normalized);
        }
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
        const product = meDataState.products.find(p => p.id === normalized.productId);
        if (product) {
          product.supportEffectiveDate = window.meDataGetProductLatestSupportEffectiveDate(product.id, product.department, product.createdAt);
        }
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      },
      onUpdate: (updatedEntry) => {
        const normalized = meNormalizeSupportHistoryRecord(updatedEntry);
        if (!normalized) return;
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id);
        if (existingIdx >= 0) {
          meDataState.productSupportHistory[existingIdx] = normalized;
        } else {
          meDataState.productSupportHistory.push(normalized);
        }
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
        const product = meDataState.products.find(p => p.id === normalized.productId);
        if (product) {
          product.supportEffectiveDate = window.meDataGetProductLatestSupportEffectiveDate(product.id, product.department, product.createdAt);
        }
      },
      onDelete: (deleted) => {
        meDataState.productSupportHistory = meDataState.productSupportHistory.filter(h => h.id !== deleted.id);
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      }
    },
    {
      table: 'me_holidays',
      onInsert: (newHoliday) => {
        // meDataSave uses delete-all then re-insert — skip own-save echoes entirely.
        // Each save fires one event per row; in-memory state is already correct.
        if (window.meDataSaveInProgress) return;
        const normalized = meNormalizeHolidayRecord(newHoliday);
        if (!normalized) return;
        const existingIdx = meDataState.holidays.findIndex(h =>
          h.id === normalized.id ||
          (h.personId === normalized.personId && h.date === normalized.date)
        );
        if (existingIdx >= 0) {
          meDataState.holidays[existingIdx] = normalized;
        } else {
          meDataState.holidays.push(normalized);
        }
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        // meDataSave uses delete-all then re-insert — skip own-save echoes entirely.
        if (window.meDataSaveInProgress) return;
        const normalized = meNormalizeHolidayRecord(deleted);
        meDataState.holidays = meDataState.holidays.filter(h => {
          if (h.id === deleted.id) return false;
          if (normalized && h.personId === normalized.personId && h.date === normalized.date) return false;
          return true;
        });
        if (isEditingInlineCell()) { window.mePendingRealTimeUpdate = true; return; }
        meCapSmartRender();
      }
    }
  ], 'me_all_channel');
};

window.meDataUnsubscribe = function() {
  // 3-B: Single consolidated channel replaces the previous 4 individual ones
  removeRealtimeSubscription('me_all_channel');
};
