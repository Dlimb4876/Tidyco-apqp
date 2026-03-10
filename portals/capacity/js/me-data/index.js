// ME Capacity Planning - Data Layer API

import * as meTeamModule from './team.js';
import * as meTaskModule from './tasks.js';
import * as meProductModule from './products.js';
import * as meHolidayModule from './holidays.js';

// Global data object (mirrors db.me structure)
let meDataState = {
  team: [],
  tasks: [],
  products: [],
  holidays: []
};

/**
 * Initialize data layer
 * Loads from Supabase if available, otherwise uses empty defaults
 */
export async function meDataInit() {
  try {
    // Attempt to load from Supabase
    if (typeof supa !== 'undefined' && currentUser) {
      const { data, error } = await supa
        .from('me_capacity')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (data) {
        meDataState = {
          team: data.team || [],
          tasks: data.tasks || [],
          products: data.products || [],
          holidays: data.holidays || []
        };
      }
    }
  } catch (err) {
    console.warn('Supabase load failed, using defaults:', err);
  }

  // Ensure structure exists
  meEnsure();
}

/**
 * Ensure data structure exists
 */
function meEnsure() {
  if (!meDataState.team) meDataState.team = [];
  if (!meDataState.tasks) meDataState.tasks = [];
  if (!meDataState.products) meDataState.products = [];
  if (!meDataState.holidays) meDataState.holidays = [];
}

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

export function meDataAddTeam(name, hoursPerWeek, utilisation) {
  meTeamModule.meTeamAdd(meDataState.team, name, hoursPerWeek, utilisation);
}

export function meDataUpdateTeam(idx, field, value) {
  meTeamModule.meTeamUpdate(meDataState.team, idx, field, value);
}

export function meDataDeleteTeam(idx) {
  meTeamModule.meTeamDelete(meDataState.team, idx);
}

export function meDataGetTeam() {
  return meDataState.team;
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export function meDataAddTask(name, category, assigneeId, startDate, endDate, totalHours) {
  meTaskModule.meTaskAdd(meDataState.tasks, name, category, assigneeId, startDate, endDate, totalHours);
}

export function meDataUpdateTask(idx, field, value) {
  meTaskModule.meTaskUpdate(meDataState.tasks, idx, field, value);
}

export function meDataDeleteTask(idx) {
  meTaskModule.meTaskDelete(meDataState.tasks, idx);
}

export function meDataGetTasks() {
  return meDataState.tasks;
}

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

export function meDataAddProduct(name, supportFrom, supportUntil, hoursPerWeek, notes) {
  meProductModule.meProductAdd(meDataState.products, name, supportFrom, supportUntil, hoursPerWeek, notes);
}

export function meDataUpdateProduct(idx, field, value) {
  meProductModule.meProductUpdate(meDataState.products, idx, field, value);
}

export function meDataDeleteProduct(idx) {
  meProductModule.meProductDelete(meDataState.products, idx);
}

export function meDataGetProducts() {
  return meDataState.products;
}

// ============================================================================
// HOLIDAY OPERATIONS
// ============================================================================

export function meDataAddHoliday(personId, date, type) {
  meHolidayModule.meHolidayAdd(meDataState.holidays, personId, date, type);
}

export function meDataUpdateHoliday(personId, date, newType) {
  meHolidayModule.meHolidayUpdate(meDataState.holidays, personId, date, newType);
}

export function meDataDeleteHoliday(personId, date) {
  meHolidayModule.meHolidayDelete(meDataState.holidays, personId, date);
}

export function meDataGetHolidays() {
  return meDataState.holidays;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

export async function meDataSave(showAlert = true) {
  try {
    if (typeof supa === 'undefined' || !currentUser) {
      console.warn('Supabase not available, data not persisted');
      return;
    }

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('syncing', 'Saving...');
    }

    const { error } = await supa
      .from('me_capacity')
      .upsert({
        user_id: currentUser.id,
        team: meDataState.team,
        tasks: meDataState.tasks,
        products: meDataState.products,
        holidays: meDataState.holidays,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('saved', 'Saved');
    }
  } catch (err) {
    console.error('Save error:', err);
    if (typeof setSyncBadge === 'function') {
      setSyncBadge('error', 'Save failed');
    }
  }
}

/**
 * Get entire data state (for debugging)
 */
export function meDataGetState() {
  return { ...meDataState };
}

/**
 * Reset all data to defaults (for testing/reset)
 */
export function meDataReset() {
  meDataState = {
    team: [],
    tasks: [],
    products: [],
    holidays: []
  };
}
