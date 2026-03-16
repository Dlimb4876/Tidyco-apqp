/* ============================================================
   me-data.js — ME Capacity Data Layer (Global Namespace)
   Combines all data/me-data/*.js modules into one file

   Supabase Tables: me_teams, me_tasks, me_task_subtasks,
                    me_task_pert_history, me_products, me_holidays
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// Global data object
// ─────────────────────────────────────────────────────────────
window.meDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: []
};

window.meDataSaveInProgress = false;
window.meDataSaveQueued = false;

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
  meDataState.tasks.splice(idx, 1);
  return true;
};

window.meDataGetTasks = function() {
  return meDataState.tasks;
};

// ─────────────────────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddProduct = function(name, supportFrom, supportUntil, hoursPerWeek, notes, productDatabaseId, department) {
  if (!name || name.trim().length === 0) return false;
  const product = {
    id: meUUID(),
    name: name.trim(),
    department: meGetDepartmentFromContext(department),
    supportFrom: supportFrom,
    supportUntil: supportUntil,
    hoursPerWeek: parseFloat(hoursPerWeek) || 5,
    notes: notes ? notes.trim() : '',
    productDatabaseId: productDatabaseId || '',
    createdAt: new Date().toISOString()
  };
  meDataState.products.push(product);
  return true;
};

window.meDataUpdateProduct = function(idx, field, value) {
  if (idx < 0 || idx >= meDataState.products.length) return false;
  const product = meDataState.products[idx];
  switch (field) {
    case 'name':
      product.name = value.trim();
      break;
    case 'supportFrom':
      product.supportFrom = value;
      break;
    case 'supportUntil':
      product.supportUntil = value;
      break;
    case 'hoursPerWeek':
      product.hoursPerWeek = parseFloat(value) || 0;
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

/**
 * Auto-sync production products from product management database
 * Syncs products with status = "Production", removes those that are no longer production
 */
window.meDataAutoSyncProductionProducts = function() {
  if (!productsState || !productsState.products) {
    return false;
  }

  // Get only "Production" status products from product management database
  const pmProducts = productsState.products.filter(p => p.status === 'Production');

  // Build a map of productDatabaseId to PM product for quick lookup
  const pmMap = {};
  pmProducts.forEach(p => {
    pmMap[p.id] = p;
  });

  // Update or create products that exist in PM with Production status
  pmProducts.forEach(pmProd => {
    const existing = meDataState.products.find(meP => meP.productDatabaseId === pmProd.id);
    if (existing) {
      // Update existing product with latest info from PM (name, notes)
      existing.name = pmProd.name;
      existing.notes = pmProd.notes || '';
    } else {
      // Create new product if not found
      meDataAddProduct(pmProd.name, '', '', 0, pmProd.notes || '', pmProd.id);
    }
  });

  // Remove duplicates by keeping only the first instance of each productDatabaseId
  const seenDbIds = new Set();
  const seenNames = new Set();
  meDataState.products = meDataState.products.filter(meP => {
    if (!meP.productDatabaseId) {
      // For manual entries (no database ID), de-dup by name
      if (seenNames.has(meP.name)) {
        return false;
      }
      seenNames.add(meP.name);
      return true;
    }
    // For DB-linked products, keep only the first instance
    if (seenDbIds.has(meP.productDatabaseId)) {
      return false;
    }
    seenDbIds.add(meP.productDatabaseId);
    // Keep only those still in PM with Production status
    return pmMap[meP.productDatabaseId] !== undefined;
  });

  return true;
};

/**
 * Auto-sync project products (Tender/NPI status) from product management database
 * for the PM capacity view. Mirrors meDataAutoSyncProductionProducts for the PM stream.
 */
window.meDataAutoSyncPMProducts = function() {
  if (!productsState || !productsState.products) {
    return false;
  }

  // Get NPI and Production status products (active projects managed by PM)
  const projectProducts = productsState.products.filter(p =>
    p.status === 'NPI' || p.status === 'Production'
  );

  // Build a lookup map by product database ID
  const projectMap = {};
  projectProducts.forEach(p => {
    projectMap[p.id] = p;
  });

  // Update or create PM-tagged products
  projectProducts.forEach(projProd => {
    const existing = meDataState.products.find(meP =>
      meP.productDatabaseId === projProd.id && meP.department === 'PM'
    );
    if (existing) {
      // Keep in sync with latest name/notes from product management
      existing.name = projProd.name;
      existing.notes = projProd.notes || '';
    } else {
      // Temporarily set context to PM so meDataAddProduct tags the product correctly
      const savedContext = window.meCurrentDepartmentContext;
      window.meCurrentDepartmentContext = 'PM';
      meDataAddProduct(projProd.name, '', '', 0, projProd.notes || '', projProd.id);
      window.meCurrentDepartmentContext = savedContext;
    }
  });

  // De-dup PM products and remove those no longer in Tender/NPI
  const seenDbIds = new Set();
  const seenNames = new Set();
  meDataState.products = meDataState.products.filter(meP => {
    if (meP.department !== 'PM') return true; // Leave ME products untouched

    if (!meP.productDatabaseId) {
      // Manual entries: de-dup by name
      if (seenNames.has(meP.name)) return false;
      seenNames.add(meP.name);
      return true;
    }

    if (seenDbIds.has(meP.productDatabaseId)) return false;
    seenDbIds.add(meP.productDatabaseId);
    // Only keep if still NPI or Production
    return projectMap[meP.productDatabaseId] !== undefined;
  });

  return true;
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

      // Load from relational tables
      if (typeof meLoadRelationalTeams === 'function') {
        try {
          const relTeam     = await meLoadRelationalTeams(currentUser.id);
          const relTasks    = await meLoadRelationalTasks(currentUser.id);
          const relProducts = await meLoadRelationalProducts(currentUser.id);
          const relHolidays = meNormalizeAndDedupeHolidays(await meLoadRelationalHolidays(currentUser.id));
          meDataState = {
            team:     relTeam     || [],
            tasks:    relTasks    || [],
            products: relProducts || [],
            holidays: relHolidays || []
          };
        } catch (relErr) {
          console.warn('ME relational load failed:', relErr.message);
        }
      }

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

      meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays || []);

      window.meDataState = meDataState;

      // Set up real-time sync
      meDataSubscribe();
  } catch (err) {
    console.warn('Supabase load exception, using defaults:', err);
  }
  meEnsureStructure();
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

        // 4. Save holidays: delete ALL rows then re-insert current state
        // Shared-data model: all users share one dataset, so delete globally to avoid
        // stale rows from other user_ids causing duplicate key violations on insert.
        // Deduplicate by (person_id, date) in case load returned multi-user duplicates.
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
          .not('person_id', 'is', null);

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
    holidays: []
  };
  window.meDataState = meDataState;
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

function meEnsureStructure() {
  if (!meDataState.team) meDataState.team = [];
  if (!meDataState.tasks) meDataState.tasks = [];
  if (!meDataState.products) meDataState.products = [];
  if (!meDataState.holidays) meDataState.holidays = [];
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
          render();
        }
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        meDataState.team = meDataState.team.filter(t => t.id !== deleted.id);
        render();
      }
    },
    {
      table: 'me_tasks',
      onInsert: (newTask) => {
        const normalizedTask = {
          id: newTask.id,
          name: newTask.name || '',
          category: newTask.category || 'NPI',
          type: newTask.type || 'standard',
          department: meNormalizeDepartmentTag(newTask.department, 'ME'),
          assigneeId: newTask.assignee_id || '',
          productId: newTask.product_id || '',
          startDate: newTask.start_date || '',
          endDate: newTask.end_date || '',
          totalHours: parseFloat(newTask.total_hours) || 0,
          status: newTask.status || 'SCHEDULED',
          createdAt: newTask.created_at || new Date().toISOString()
        };
        if (!meDataState.tasks.some(t => t.id === normalizedTask.id)) {
          meDataState.tasks.push(normalizedTask);
          render();
        }
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        meDataState.tasks = meDataState.tasks.filter(t => t.id !== deleted.id);
        render();
      }
    },
    {
      table: 'me_products',
      onInsert: (newProduct) => {
        const normalizedProduct = {
          id: newProduct.id,
          name: newProduct.name || '(Unknown Product)',
          productDatabaseId: newProduct.product_database_id || '',
          supportFrom: newProduct.support_from || '',
          supportUntil: newProduct.support_until || '',
          hoursPerWeek: parseFloat(newProduct.hours_per_week) || 0,
          department: meNormalizeDepartmentTag(newProduct.department, 'ME'),
          notes: newProduct.notes || '',
          createdAt: newProduct.created_at || new Date().toISOString(),
          updatedAt: newProduct.updated_at || ''
        };
        if (!meDataState.products.some(p => p.id === normalizedProduct.id)) {
          meDataState.products.push(normalizedProduct);
          render();
        }
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        meDataState.products = meDataState.products.filter(p => p.id !== deleted.id);
        render();
      }
    },
    {
      table: 'me_holidays',
      onInsert: (newHoliday) => {
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
        render();
      },
      onUpdate: () => { /* no-op — local state already up to date */ },
      onDelete: (deleted) => {
        const normalized = meNormalizeHolidayRecord(deleted);
        meDataState.holidays = meDataState.holidays.filter(h => {
          if (h.id === deleted.id) return false;
          if (normalized && h.personId === normalized.personId && h.date === normalized.date) return false;
          return true;
        });
        render();
      }
    }
  ], 'me_all_channel');
};

window.meDataUnsubscribe = function() {
  // 3-B: Single consolidated channel replaces the previous 4 individual ones
  removeRealtimeSubscription('me_all_channel');
};
