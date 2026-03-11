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

// Convert old PERT data (pertData.estimates[]) to new subtasks[] structure
function meConvertPertDataToSubtasks(tasks) {
  return tasks.map(task => {
    // Skip if already has subtasks array or no advanced estimation
    if (task.subtasks || !task.advancedEstimation?.pertData?.estimates) {
      return task;
    }

    // Convert pertData.estimates → subtasks[] (inheriting root task's date range)
    const subtasks = task.advancedEstimation.pertData.estimates.map(est => ({
      id: est.id,
      name: est.name,
      assigneeId: est.assigneeId || '',
      hours: est.finalHours || 0,
      startDate: task.startDate,  // Subtask inherits root task's date range
      endDate: task.endDate,
      source: 'pert'
    }));

    // Find primary assignee (first with assigneeId)
    const primaryAssignee = task.advancedEstimation.pertData.estimates
      .find(e => e.assigneeId)?.assigneeId || '';

    return {
      ...task,
      type: 'root',
      assigneeId: primaryAssignee,
      subtasks,
      advancedEstimation: {
        ...task.advancedEstimation,
        pertEstimates: task.advancedEstimation.pertData.estimates,
        totalFinalHours: subtasks.reduce((sum, s) => sum + (s.hours || 0), 0)
      }
    };
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
    type: 'standard',
    assigneeId: assigneeId || '',
    productId: productId || '',
    startDate: startDate,
    endDate: endDate,
    totalHours: parseFloat(totalHours) || 0,
    createdAt: new Date().toISOString(),
    advancedEstimation: null,
    subtasks: []
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

      // ─────────────────────────────────────────────────────────────
      // PHASE 1: Try loading from relational tables first (fallback to JSON)
      // ─────────────────────────────────────────────────────────────

      let loadedFromRelational = false;

      // Step 1: Try relational tables
      if (typeof meLoadRelationalTeams === 'function') {
        try {
          console.log('Attempting to load from relational tables...');
          const relTeam = await meLoadRelationalTeams(currentUser.id);
          const relTasks = await meLoadRelationalTasks(currentUser.id);
          const relProducts = await meLoadRelationalProducts(currentUser.id);
          const relHolidays = await meLoadRelationalHolidays(currentUser.id);

          // If we got any data from relational tables, use it
          if ((relTeam && relTeam.length > 0) || (relTasks && relTasks.length > 0) ||
              (relProducts && relProducts.length > 0) || (relHolidays && relHolidays.length > 0)) {
            meDataState = {
              team: relTeam || [],
              tasks: relTasks || [],
              products: relProducts || [],
              holidays: relHolidays || []
            };
            loadedFromRelational = true;
            console.log('✓ Loaded from relational tables (team=' + meDataState.team.length +
                       ' tasks=' + meDataState.tasks.length + ')');
          } else {
            console.log('Relational tables empty - will try JSON blob fallback');
          }
        } catch (relErr) {
          console.warn('Relational load failed:', relErr.message, '- falling back to JSON');
        }
      }

      // Step 2: If relational empty, try JSON blob fallback
      if (!loadedFromRelational) {
        const { data, error } = await supa
          .from('me_capacity')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        // PGRST116 = no rows found (expected for new users)
        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase JSON load error (code ' + error.code + '):', error.message);
        }

        if (data) {
          console.log('Loaded from JSON blob fallback');
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
            console.log('Loaded in flat format (migration fallback)');
            meDataState = {
              team: Array.isArray(data.team) ? data.team : [],
              tasks: Array.isArray(data.tasks) ? data.tasks : [],
              products: Array.isArray(data.products) ? data.products : [],
              holidays: Array.isArray(data.holidays) ? data.holidays : []
            };
          }

          // Step 3: Auto-migrate JSON to relational if we loaded from JSON blob
          if (meDataState.team.length > 0 || meDataState.tasks.length > 0 ||
              meDataState.products.length > 0 || meDataState.holidays.length > 0) {
            if (typeof meMigrateJsonToRelational === 'function') {
              console.log('Auto-migrating JSON data to relational tables...');
              const migResult = await meMigrateJsonToRelational(currentUser.id, meDataState);
              if (migResult.success !== false) {
                console.log('✓ Migration complete: ' +
                  (migResult.teams || 0) + ' teams, ' +
                  (migResult.tasks || 0) + ' tasks, ' +
                  (migResult.products || 0) + ' products, ' +
                  (migResult.holidays || 0) + ' holidays');
              } else {
                console.warn('Migration had issues:', migResult.errors);
              }
            }
          }
        } else {
          console.log('No existing ME capacity data found - will create new record on first save');
        }
      }

      // Ensure all data has backward-compatible fields
      meDataState.team.forEach(member => {
        if (!('jobTitle' in member)) member.jobTitle = '';
        if (!('group' in member)) member.group = '';
        if (!('startDate' in member)) member.startDate = '';
        if (!('endDate' in member)) member.endDate = '';
      });

      meDataState.tasks.forEach(task => {
        if (!('advancedEstimation' in task)) task.advancedEstimation = null;
        if (!('type' in task)) {
          task.type = task.advancedEstimation && task.advancedEstimation.pertData ? 'root' : 'standard';
        }
        if (!('subtasks' in task)) task.subtasks = [];
      });

      // Convert old pertData.estimates[] to new subtasks[] structure (if not already done)
      meDataState.tasks = meConvertPertDataToSubtasks(meDataState.tasks);

      meDataState.products.forEach(product => {
        if (!('productDatabaseId' in product)) product.productDatabaseId = '';
      });

      window.meDataState = meDataState;
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

    console.log('ME save: user=' + currentUser.id + ' team=' + meDataState.team.length +
                ' tasks=' + meDataState.tasks.length + ' products=' + meDataState.products.length +
                ' holidays=' + meDataState.holidays.length);

    let relationalSuccess = true;
    let jsonSuccess = true;

    // ─────────────────────────────────────────────────────────────
    // PHASE 1: Dual-write to both relational and JSON blob
    // This maintains backward compatibility while enabling relational
    // ─────────────────────────────────────────────────────────────

    // Step 1: Save to relational tables (if functions available)
    if (typeof meSaveTeamRelational === 'function' &&
        typeof meSaveTaskRelational === 'function' &&
        typeof meSaveProductRelational === 'function' &&
        typeof meSaveHolidayRelational === 'function') {
      try {
        console.log('Saving to relational tables...');

        // Save all team members
        for (let i = 0; i < meDataState.team.length; i++) {
          const success = await meSaveTeamRelational(currentUser.id, meDataState.team[i]);
          if (!success) {
            console.warn('Failed to save team member', i);
            relationalSuccess = false;
          }
        }

        // Save all tasks with subtasks
        for (let i = 0; i < meDataState.tasks.length; i++) {
          const task = meDataState.tasks[i];
          const taskSuccess = await meSaveTaskRelational(currentUser.id, task);
          if (!taskSuccess) {
            console.warn('Failed to save task', i);
            relationalSuccess = false;
          } else {
            // Save subtasks if task has them
            if (task.subtasks && task.subtasks.length > 0) {
              const subtaskSuccess = await meSaveTaskSubtasksRelational(task.id, task.subtasks);
              if (!subtaskSuccess) {
                console.warn('Failed to save subtasks for task', i);
                relationalSuccess = false;
              }
            }
            // Save PERT history if task is root type
            if (task.type === 'root' && task.advancedEstimation) {
              const histSuccess = await meSaveTaskPertHistoryRelational(
                task.id,
                task.advancedEstimation.pertEstimates || [],
                task.advancedEstimation.confidenceLevel || 0
              );
              if (!histSuccess) {
                console.warn('Failed to save PERT history for task', i);
              }
            }
          }
        }

        // Save all products
        for (let i = 0; i < meDataState.products.length; i++) {
          const success = await meSaveProductRelational(currentUser.id, meDataState.products[i]);
          if (!success) {
            console.warn('Failed to save product', i);
            relationalSuccess = false;
          }
        }

        // Save all holidays
        for (let i = 0; i < meDataState.holidays.length; i++) {
          const success = await meSaveHolidayRelational(currentUser.id, meDataState.holidays[i]);
          if (!success) {
            console.warn('Failed to save holiday', i);
            relationalSuccess = false;
          }
        }

        if (relationalSuccess) {
          console.log('✓ Relational save complete');
        } else {
          console.warn('⚠ Relational save had issues, continuing with JSON backup...');
        }
      } catch (relErr) {
        console.warn('Relational save error:', relErr.message, '- continuing with JSON backup...');
        relationalSuccess = false;
      }
    } else {
      console.log('Relational functions not available, skipping relational save');
    }

    // Step 2: Always save to JSON blob as backup (Phase 1 dual-write)
    try {
      console.log('Saving to JSON blob...');
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
        if (!error) console.log('✓ JSON blob updated');
      } else {
        // Insert new record
        const { error: insertError } = await supa
          .from('me_capacity')
          .insert([payload]);
        error = insertError;
        if (!error) console.log('✓ JSON blob inserted');
      }

      if (error) {
        console.error('JSON save error:', error);
        jsonSuccess = false;
      }
    } catch (jsonErr) {
      console.error('JSON save exception:', jsonErr.message);
      jsonSuccess = false;
    }

    // Final status
    if (relationalSuccess && jsonSuccess) {
      if (typeof setSyncBadge === 'function') {
        setSyncBadge('saved', 'Saved');
      }
      if (showAlert) console.log('ME capacity saved (relational + JSON backup)');
    } else if (jsonSuccess) {
      if (typeof setSyncBadge === 'function') {
        setSyncBadge('saved', 'Saved (backup mode)');
      }
      console.warn('ME capacity saved to JSON blob only (relational had issues)');
    } else {
      throw new Error('Save failed on both relational and JSON');
    }
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
