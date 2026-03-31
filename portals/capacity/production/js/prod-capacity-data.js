// ═══════════════════════════════════════════════════════════════
// prod-capacity-data.js — Production Capacity Data Layer
// Handles: production_capacity table CRUD, demand calculation engine
// ═══════════════════════════════════════════════════════════════

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { appState, getFamilies } from '../../../../core/js/state.js'
import { render } from '../../../../utils/js/navigation.js'
import { isEditingInlineCell } from '../../../../utils/js/helpers.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../../utils/js/realtime.js'
import { getBankHolidaysForYear } from '../../shared/js/cap-utils.js'
import { workAreasState } from './work-areas-data.js'
import { prodState } from '../../../production/js/data.js'

const PROD_CAP_HOURS_PER_DAY = 8
const PROD_CAP_DAYS_PER_WEEK = 5
const PROD_CAP_HOURS_PER_WEEK = PROD_CAP_HOURS_PER_DAY * PROD_CAP_DAYS_PER_WEEK
const PROD_CAP_DATA_CHANNEL = 'prod_cap_data_channel'

export let prodCapPendingRealTimeUpdate = false
let prodCapRefreshCurrentTabHandler = () => {}

export const prodCapState = {
  capacityRecords: [], // { id, work_area, year, month, staff_count, notes }
  loaded: false
}

// ── Initialise from Supabase ──────────────────────────────────
export async function prodCapDataInit() {
  if (!currentUser) return;
  try {
    const { data, error } = await supa.from('production_capacity')
      .select('*')
      .order('year',  { ascending: true })
      .order('month', { ascending: true });
    if (error) throw error;
    prodCapState.capacityRecords = data || [];
    prodCapState.loaded = true;
    prodCapSubscribeData();
  } catch (err) {
    console.error('❌ Error loading production capacity:', err);
    prodCapState.capacityRecords = [];
  }
  // Load perpetual month offset
  prodCapLoadMonthOffset()
}

// ── Load utilization factor from Supabase (global) or localStorage ────────
export async function prodCapLoadUtilization() {
  try {
    // Try to load from global_settings table (no user_id, system-wide setting)
    const { data, error } = await supa.from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'prod_cap_utilization')
      .maybeSingle();

    if (!error && data && data.setting_value) {
      const value = parseFloat(data.setting_value);
      if (!isNaN(value) && value >= 0 && value <= 1) {
          appState.prodCapUtilizationFactor = value
          prodCapSubscribeUtilization()
          return
      }
    }
  } catch (err) {
    // Table might not exist yet, fall through to localStorage
    console.debug('Supabase global_settings not available, checking localStorage');
  }

  // Fall back to localStorage
  const stored = localStorage.getItem('prodCapUtilization')
  if (stored) {
    const value = parseFloat(stored)
    if (!isNaN(value) && value >= 0 && value <= 1) {
      appState.prodCapUtilizationFactor = value
    }
  }
}

export function setProdCapRefreshCurrentTab(handler) {
  prodCapRefreshCurrentTabHandler = typeof handler === 'function' ? handler : () => {}
}

// ── Subscribe to utilization factor changes (real-time sync) ────────────
function prodCapSubscribeUtilization() {
  createRealtimeSubscription('global_settings', 'prod_cap_util_channel', {
    onUpdate: (updated) => {
      if (updated.setting_key === 'prod_cap_utilization') {
        const newValue = parseFloat(updated.setting_value);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
          appState.prodCapUtilizationFactor = newValue
          if (isEditingInlineCell()) { prodCapPendingRealTimeUpdate = true; return }
          if (typeof prodCapRefreshCurrentTabHandler === 'function') prodCapRefreshCurrentTabHandler()
        }
      }
    }
  }, {
    filter: 'setting_key=eq.prod_cap_utilization',
    events: ['UPDATE']
  });
}

export function prodCapUnsubscribeUtilization() {
  removeRealtimeSubscription('prod_cap_util_channel');
}

// ── Subscribe to production capacity changes (real-time sync) ────────────
function prodCapSubscribeData() {
  createRealtimeSubscription('production_capacity', PROD_CAP_DATA_CHANNEL, {
    onInsert: (row) => {
      // Avoid duplicates
      if (!prodCapState.capacityRecords.find(r => r.id === row.id)) {
        prodCapState.capacityRecords.push(row);
        if (appState.currentSection === 'capacity' && appState.capacityTab === 'production') {
          if (isEditingInlineCell()) { prodCapPendingRealTimeUpdate = true; return }
          if (typeof prodCapRefreshCurrentTabHandler === 'function') prodCapRefreshCurrentTabHandler()
        }
      }
    },
    onUpdate: (row) => {
      const idx = prodCapState.capacityRecords.findIndex(r => r.id === row.id);
      if (idx >= 0) {
        prodCapState.capacityRecords[idx] = row;
        if (appState.currentSection === 'capacity' && appState.capacityTab === 'production') {
          if (isEditingInlineCell()) { prodCapPendingRealTimeUpdate = true; return }
          if (typeof prodCapRefreshCurrentTabHandler === 'function') prodCapRefreshCurrentTabHandler()
        }
      }
    },
    onDelete: (row) => {
      prodCapState.capacityRecords = prodCapState.capacityRecords.filter(r => r.id !== row.id)
      if (appState.currentSection === 'capacity' && appState.capacityTab === 'production') {
        if (isEditingInlineCell()) { prodCapPendingRealTimeUpdate = true; return }
        if (typeof prodCapRefreshCurrentTabHandler === 'function') prodCapRefreshCurrentTabHandler()
      }
    }
  })
}

export function prodCapacityDataSubscribe() {
  prodCapSubscribeData()
}

export function prodCapacityDataUnsubscribe() {
  prodCapUnsubscribeData()
}

function prodCapUnsubscribeData() {
  removeRealtimeSubscription(PROD_CAP_DATA_CHANNEL)
}

// ── Save utilization factor to Supabase (global) and localStorage ────────
export async function prodCapSaveUtilization(percent) {
  const value = Math.max(0, Math.min(1, parseInt(percent) / 100));

  // Always save to localStorage as fallback
  localStorage.setItem('prodCapUtilization', value.toString());

  try {
    // Try to save to global_settings table (system-wide, no user_id)
    const { data: existing, error: getError } = await supa.from('global_settings')
      .select('id')
      .eq('setting_key', 'prod_cap_utilization')
      .maybeSingle();

    if (!getError && existing) {
      // Update existing
      await supa.from('global_settings')
        .update({ setting_value: value.toString(), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Insert new
      await supa.from('global_settings')
        .insert([{
          setting_key: 'prod_cap_utilization',
          setting_value: value.toString()
        }]);
    }
  } catch (err) {
    // Supabase unavailable, but localStorage is already saved
    console.debug('Could not save to global_settings, localStorage fallback active');
  }
}

// ── Capacity record accessors ─────────────────────────────────

export function prodCapDataGetStaff(workArea, year, month) {
  const rec = prodCapState.capacityRecords.find(
    r => r.work_area === workArea && r.year === year && r.month === month
  );
  return rec ? Number(rec.staff_count) : 0;
}

export async function prodCapDataSetStaff(workArea, year, month, staffCount) {
  if (!currentUser) return;
  const count = Math.max(0, parseFloat(staffCount) || 0);

  try {
    const existing = prodCapState.capacityRecords.find(
      r => r.work_area === workArea && r.year === year && r.month === month
    );

    if (existing) {
      // Update existing record - don't use .select().single() to avoid RLS issues
      const { error } = await supa.from('production_capacity')
        .update({ staff_count: count, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
      // Update local state directly
      const idx = prodCapState.capacityRecords.findIndex(r => r.id === existing.id);
      if (idx >= 0) {
        prodCapState.capacityRecords[idx] = {
          ...prodCapState.capacityRecords[idx],
          staff_count: count,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Insert new record and retrieve the generated id so subsequent updates work correctly.
      // Use maybeSingle() rather than single() — single() throws PGRST116 when RLS blocks
      // returning the inserted row, which would bubble up as an unhandled error.
      const { data: insertedRow, error } = await supa.from('production_capacity')
        .insert([{ user_id: currentUser.id, work_area: workArea, year, month, staff_count: count }])
        .select('id')
        .maybeSingle();
      if (error) throw error;
      // Add to local state with the real id from Supabase
      prodCapState.capacityRecords.push({
        id: insertedRow?.id,
        user_id: currentUser.id,
        work_area: workArea,
        year: year,
        month: month,
        staff_count: count
      });
    }
  } catch (err) {
    console.error('❌ Error saving production capacity:', err);
    throw err; // Re-throw so caller can handle
  }
}

// ── Working day helpers (Mon–Fri, excluding UK bank holidays) ─
function prodCapDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function prodCapGetBankHolidaySetForYears(years) {
  const set = new Set()
  years.forEach(year => {
    const holidays = getBankHolidaysForYear(year) || []
    holidays.forEach(holiday => {
      if (holiday?.date) set.add(holiday.date)
    })
  })
  return set
}

export function prodCapGetBankHolidaySetForRange(startDate, endDate) {
  const years = new Set();
  for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
    years.add(y);
  }
  return prodCapGetBankHolidaySetForYears(years);
}

function prodCapIsWorkingDay(date, bankHolSet) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  return !bankHolSet.has(prodCapDateKey(date));
}

export function prodCapCountWorkingDaysBetween(startDate, endDate, bankHolSet) {
  if (!startDate || !endDate || startDate > endDate) return 0;
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (prodCapIsWorkingDay(current, bankHolSet)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Count working days in a given year/month (1-indexed month)
function prodCapWorkingDays(year, month) {
  const bankHolSet = prodCapGetBankHolidaySetForYears([year]);
  let count = 0;
  const days = new Date(year, month, 0).getDate(); // last day of month
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month - 1, d);
    if (prodCapIsWorkingDay(date, bankHolSet)) count++;
  }
  return count;
}

// Available hours for a work area in a specific month
export function prodCapAvailableHours(workArea, year, month) {
  const staff = prodCapDataGetStaff(workArea, year, month);
  if (staff === 0) return 0;
  const workingDays = prodCapWorkingDays(year, month);
  const baseHours = staff * PROD_CAP_HOURS_PER_WEEK * (workingDays / PROD_CAP_DAYS_PER_WEEK);
  // Apply global utilization factor
  return baseHours * appState.prodCapUtilizationFactor
}

// ── Work area accessors ───────────────────────────────────────
export function prodCapGetWorkAreas() {
  const areas = new Set();

  // Always include Unit 2, Unit 3, Unit 6 as default work areas
  const defaultAreas = ['Unit 2', 'Unit 3', 'Unit 6'];
  for (let i = 0; i < defaultAreas.length; i++) {
    areas.add(defaultAreas[i]);
  }

  // Get work areas from database (if loaded)
  if (typeof workAreasState !== 'undefined' && Array.isArray(workAreasState.workAreas)) {
    const waList = workAreasState.workAreas;
    for (let i = 0; i < waList.length; i++) {
      if (waList[i] && waList[i].name) {
        areas.add(waList[i].name);
      }
    }
  } else {
    // Fallback: discover from production data if work_areas table not available
    const products = (typeof prodState !== 'undefined' && Array.isArray(prodState.products)) ? prodState.products : [];
    for (let i = 0; i < products.length; i++) {
      if (products[i] && products[i].work_location) {
        areas.add(products[i].work_location);
      }
    }

    const batches = (typeof prodState !== 'undefined' && Array.isArray(prodState.batches)) ? prodState.batches : [];
    for (let i = 0; i < batches.length; i++) {
      if (batches[i] && batches[i].work_location) {
        areas.add(batches[i].work_location);
      }
    }

    if (typeof prodCapState !== 'undefined' && Array.isArray(prodCapState.capacityRecords)) {
      const records = prodCapState.capacityRecords;
      for (let i = 0; i < records.length; i++) {
        if (records[i] && records[i].work_area) {
          areas.add(records[i].work_area);
        }
      }
    }
  }

  const result = Array.from(areas);
  result.sort();
  return result;
}

// ── Month key helpers ─────────────────────────────────────────
// Returns 'YYYY-MM' for a month offset from a base
function prodCapMonthKey(baseYear, baseMonth, offset) {
  let m = baseMonth + offset;
  let y = baseYear;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function prodCapParseKey(key) {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}

export function prodCapMonthLabel(key) {
  const { year, month } = prodCapParseKey(key);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export function prodCapMonthLabelFull(key) {
  const { year, month } = prodCapParseKey(key);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Generate ordered month keys for a 2-year window (perpetual, rolling) ──────────
export function prodCapGet24MonthKeys() {
  const today = new Date();
  let baseYear  = today.getFullYear();
  const rawOffset = Number(appState.prodCapMonthOffset)
  const safeOffset = Number.isFinite(rawOffset) ? rawOffset : 0
  let baseMonth = today.getMonth() + 1 + safeOffset;
  // Normalize base month
  while (baseMonth > 12) { baseMonth -= 12; baseYear++; }
  while (baseMonth < 1) { baseMonth += 12; baseYear--; }
  const keys = [];
  for (let i = 0; i < 24; i++) {
    keys.push(prodCapMonthKey(baseYear, baseMonth, i));
  }
  return keys;
}

// ── Demand matrix calculation ─────────────────────────────────
// Returns { 'YYYY-MM': { workArea: hours, _total: hours } }
export function prodCapCalcDemandMatrix(monthKeys) {
  const batches  = (typeof prodState !== 'undefined' && Array.isArray(prodState.batches)) ? prodState.batches : [];
  const products = (typeof prodState !== 'undefined' && Array.isArray(prodState.products)) ? prodState.products : [];

  const productMap = {};
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (p && p.id) productMap[p.id] = p;
  }

  // Initialise matrix
  const matrix = {};
  for (let i = 0; i < monthKeys.length; i++) {
    matrix[monthKeys[i]] = { _total: 0 };
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch || !batch.start_date || !batch.due_date || !batch.product_id || !batch.quantity) continue;

    const product = productMap[batch.product_id];
    if (!product) continue;

    const hoursPerUnit = Number(product.current_overhaul_hours) || 0;
    if (hoursPerUnit === 0) continue;

    const totalHours = hoursPerUnit * Number(batch.quantity);
    const workArea   = batch.work_location || product.work_location || 'Unknown';

    const batchStart = new Date(batch.start_date + 'T00:00:00');
    const batchEnd   = new Date(batch.due_date   + 'T00:00:00');
    const bankHolSet = prodCapGetBankHolidaySetForRange(batchStart, batchEnd);
    const totalDays  = prodCapCountWorkingDaysBetween(batchStart, batchEnd, bankHolSet);
    if (totalDays === 0) continue;

    for (let j = 0; j < monthKeys.length; j++) {
      const key = monthKeys[j];
      const { year, month } = prodCapParseKey(key);
      const mStart = new Date(year, month - 1, 1);
      const mEnd   = new Date(year, month, 0);     // last day

      const overlapStart = batchStart > mStart ? batchStart : mStart;
      const overlapEnd   = batchEnd   < mEnd   ? batchEnd   : mEnd;

      if (overlapStart > overlapEnd) continue;

      const overlapDays = prodCapCountWorkingDaysBetween(overlapStart, overlapEnd, bankHolSet);
      if (overlapDays === 0) continue;
      const hours       = totalHours * (overlapDays / totalDays);

      if (!matrix[key][workArea]) matrix[key][workArea] = 0;
      matrix[key][workArea] += hours;
      matrix[key]._total    += hours;
    }
  }

  return matrix;
}

// ── Helper: resolve family ID to label for display ────────────
function prodCapResolveFamilyLabel(familyIdOrName) {
  if (!familyIdOrName) return 'Other';
  const families = typeof getFamilies === 'function' ? getFamilies() : []
  if (Array.isArray(families) && families.length > 0) {
    const family = families.find(f => f.id === familyIdOrName)
    if (family) return family.label
  }
  // Fall back to direct name (not a UUID)
  return familyIdOrName;
}

// ── Family-grouped demand matrix ─────────────────────────────
// Returns { 'YYYY-MM': { familyName: hours } }
export function prodCapCalcFamilyDemandMatrix(monthKeys) {
  const batches  = (typeof prodState !== 'undefined' && Array.isArray(prodState.batches)) ? prodState.batches : [];
  const products = (typeof prodState !== 'undefined' && Array.isArray(prodState.products)) ? prodState.products : [];

  const productMap = {};
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (p && p.id) productMap[p.id] = p;
  }

  const matrix = {};
  for (let i = 0; i < monthKeys.length; i++) {
    matrix[monthKeys[i]] = {};
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch || !batch.start_date || !batch.due_date || !batch.product_id || !batch.quantity) continue;

    const product = productMap[batch.product_id];
    if (!product) continue;

    const hoursPerUnit = Number(product.current_overhaul_hours) || 0;
    if (hoursPerUnit === 0) continue;

    const totalHours = hoursPerUnit * Number(batch.quantity);
    const family     = prodCapResolveFamilyLabel(product.family) || 'Other';

    const batchStart = new Date(batch.start_date + 'T00:00:00');
    const batchEnd   = new Date(batch.due_date   + 'T00:00:00');
    const bankHolSet = prodCapGetBankHolidaySetForRange(batchStart, batchEnd);
    const totalDays  = prodCapCountWorkingDaysBetween(batchStart, batchEnd, bankHolSet);
    if (totalDays === 0) continue;

    for (let j = 0; j < monthKeys.length; j++) {
      const key = monthKeys[j];
      const { year, month } = prodCapParseKey(key);
      const mStart = new Date(year, month - 1, 1);
      const mEnd   = new Date(year, month, 0);

      const overlapStart = batchStart > mStart ? batchStart : mStart;
      const overlapEnd   = batchEnd   < mEnd   ? batchEnd   : mEnd;

      if (overlapStart > overlapEnd) continue;

      const overlapDays = prodCapCountWorkingDaysBetween(overlapStart, overlapEnd, bankHolSet);
      if (overlapDays === 0) continue;
      const hours       = totalHours * (overlapDays / totalDays);

      if (!matrix[key][family]) matrix[key][family] = 0;
      matrix[key][family] += hours;
    }
  }

  return matrix;
}

// ── Utilisation capacity matrix ────────────────────────────────────
// Returns { 'YYYY-MM': { workArea: hours, _total: hours } }
export function prodCapCalcSupplyMatrix(monthKeys, workAreas) {
  const matrix = {};
  monthKeys.forEach(key => {
    const { year, month } = prodCapParseKey(key);
    matrix[key] = { _total: 0 };
    workAreas.forEach(wa => {
      const h = prodCapAvailableHours(wa, year, month);
      matrix[key][wa]     = h;
      matrix[key]._total += h;
    });
  });
  return matrix;
}

// ── Utilisation helper ────────────────────────────────────────
export function prodCapUtil(demand, supply) {
  if (!supply || supply === 0) return demand > 0 ? 999 : 0;
  return Math.round((demand / supply) * 100);
}

// ── Perpetual window adjustment ────────────────────────────────
export function prodCapShiftMonth(direction) {
  const delta = direction === 'next' ? 1 : -1;
  appState.prodCapMonthOffset += delta
  localStorage.setItem('prodCapMonthOffset', appState.prodCapMonthOffset.toString())
  render()
}

export function prodCapResetMonthOffset() {
  appState.prodCapMonthOffset = 0
  localStorage.setItem('prodCapMonthOffset', '0')
  render()
}

function prodCapLoadMonthOffset() {
  const stored = localStorage.getItem('prodCapMonthOffset')
  if (stored != null) {
    const parsed = parseInt(stored, 10)
    // Why: guard against corrupt localStorage values causing invalid month keys and render crashes.
    appState.prodCapMonthOffset = Number.isFinite(parsed) ? parsed : 0
  }
}

export function prodCapUnsubscribeAll() {
  prodCapUnsubscribeData()
  prodCapUnsubscribeUtilization()
}

export function setProdCapPendingRealTimeUpdate(value) {
  prodCapPendingRealTimeUpdate = !!value
}
