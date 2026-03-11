/* ============================================================
   me-data.js — ME Capacity Data Layer (Global Namespace)
   Combines all data/me-data/*.js modules into one file

   Supabase Table: me_capacity
   Data Structure:
   {
     user_id: string,
     data: {
       team: [{id, name, hoursPerWeek, utilisation, jobTitle, group}],
       tasks: [{id, name, category, assigneeId, startDate, endDate, totalHours, advancedEstimation}],
       products: [{id, name, supportFrom, supportUntil, hoursPerWeek, notes}],
       holidays: [{id, personId, date, type ('full'|'half')}]
     },
     updated_at: ISO string
   }
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

window.meDataAddTeam = function(name, hoursPerWeek, utilisation, startDate, endDate) {
  if (!name || name.trim().length === 0) return false;
  const member = {
    id: meUUID(),
    name: name.trim(),
    hoursPerWeek: parseFloat(hoursPerWeek) || 37.5,
    utilisation: parseFloat(utilisation) || 80,
    jobTitle: '',
    group: '',
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
      member.hoursPerWeek = parseFloat(value) || 37.5;
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

window.meDataAddTask = function(name, category, assigneeId, startDate, endDate, totalHours, productId) {
  if (!name || name.trim().length === 0) return false;
  const task = {
    id: meUUID(),
    name: name.trim(),
    category: category || 'NPI',
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate,
    endDate: endDate,
    totalHours: parseFloat(totalHours) || 0,
    createdAt: new Date().toISOString(),
    advancedEstimation: null
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
    case 'advancedEstimation':
      task.advancedEstimation = value || null;
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

window.meDataAddProduct = function(name, supportFrom, supportUntil, hoursPerWeek, notes, productDatabaseId) {
  if (!name || name.trim().length === 0) return false;
  const product = {
    id: meUUID(),
    name: name.trim(),
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

  // Remove products that no longer have Production status or don't have a productDatabaseId
  // (old manually-added products without a DB link are removed to prevent duplicates)
  meDataState.products = meDataState.products.filter(meP => {
    if (!meP.productDatabaseId) {
      // Remove products without a database ID (old manual entries - no longer needed)
      return false;
    }
    // Keep only those still in PM with Production status
    return pmMap[meP.productDatabaseId] !== undefined;
  });

  return true;
};

// ─────────────────────────────────────────────────────────────
// HOLIDAY CRUD
// ─────────────────────────────────────────────────────────────

window.meDataAddHoliday = function(personId, date, type) {
  if (!personId || !date || !['full', 'half'].includes(type)) return false;
  const existing = meDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (existing) {
    existing.type = type;
    return true;
  }
  const holiday = {
    id: meUUID(),
    personId: personId,
    date: date,
    type: type,
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
  return meDataState.holidays;
};

// ─────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────

window.meDataInit = async function() {
  try {
    if (typeof supa !== 'undefined' && typeof currentUser !== 'undefined' && currentUser) {
      console.log('Loading ME capacity data for user:', currentUser.id);

      const { data, error } = await supa
        .from('me_capacity')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      // PGRST116 = no rows found (expected for new users)
      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase load error (code ' + error.code + '):', error.message);
      }

      // 🔴 FIX #3: Robust data validation to prevent data loss
      if (data) {
        console.log('Loaded existing ME capacity record');
        // Handle nested structure (current format)
        if (data.data && typeof data.data === 'object') {
          meDataState = {
            team: Array.isArray(data.data.team) ? data.data.team : [],
            tasks: Array.isArray(data.data.tasks) ? data.data.tasks : [],
            products: Array.isArray(data.data.products) ? data.data.products : [],
            holidays: Array.isArray(data.data.holidays) ? data.data.holidays : []
          };
        }
        // Handle flat structure (fallback for migration)
        else if (data.team || data.tasks || data.products || data.holidays) {
          console.log('Loaded ME capacity in flat format (migration fallback)');
          meDataState = {
            team: Array.isArray(data.team) ? data.team : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            products: Array.isArray(data.products) ? data.products : [],
            holidays: Array.isArray(data.holidays) ? data.holidays : []
          };
        }
        // Ensure all team members have jobTitle, group, startDate, endDate fields (migration for old records)
        meDataState.team.forEach(member => {
          if (!('jobTitle' in member)) {
            member.jobTitle = '';
          }
          if (!('group' in member)) {
            member.group = '';
          }
          if (!('startDate' in member)) {
            member.startDate = '';
          }
          if (!('endDate' in member)) {
            member.endDate = '';
          }
        });
        // Ensure all tasks have advancedEstimation field (migration for old records)
        meDataState.tasks.forEach(task => {
          if (!('advancedEstimation' in task)) {
            task.advancedEstimation = null;
          }
        });
        // Ensure all products have productDatabaseId field (migration for old records)
        meDataState.products.forEach(product => {
          if (!('productDatabaseId' in product)) {
            product.productDatabaseId = '';
          }
        });
        window.meDataState = meDataState;
      } else {
        console.log('No existing ME capacity data found - will create new record on first save');
      }
    } else {
      console.warn('ME init skipped: supa or currentUser not available');
    }
  } catch (err) {
    console.warn('Supabase load exception, using defaults:', err);
  }
  meEnsureStructure();
};

window.meDataSave = async function(showAlert) {
  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      console.warn('ME save: Supabase not available');
      return;
    }

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('syncing', 'Saving...');
    }

    const payload = {
      user_id: currentUser.id,
      data: {
        team: meDataState.team,
        tasks: meDataState.tasks,
        products: meDataState.products,
        holidays: meDataState.holidays
      },
      updated_at: new Date().toISOString()
    };

    console.log('ME save: user=' + currentUser.id + ' team=' + payload.data.team.length + ' tasks=' + payload.data.tasks.length + ' products=' + payload.data.products.length + ' holidays=' + payload.data.holidays.length);

    // Try to fetch existing record for this user
    const { data: existing } = await supa
      .from('me_capacity')
      .select('id')
      .eq('user_id', currentUser.id)
      .single();

    let error;
    if (existing) {
      // Update existing record
      const { error: updateError } = await supa
        .from('me_capacity')
        .update(payload)
        .eq('user_id', currentUser.id);
      error = updateError;
      if (!error) console.log('ME save: updated existing record');
    } else {
      // Insert new record
      const { error: insertError } = await supa
        .from('me_capacity')
        .insert([payload]);
      error = insertError;
      if (!error) console.log('ME save: inserted new record');
    }

    if (error) {
      console.error('ME save database error:', error);
      throw new Error(error.message || 'Save failed');
    }

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('saved', 'Saved');
    }
    if (showAlert) console.log('ME capacity saved');
  } catch (err) {
    console.error('ME save exception:', err.message || err);
    if (typeof setSyncBadge === 'function') {
      setSyncBadge('error', 'Save failed');
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
