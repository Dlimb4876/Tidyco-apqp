// ═══════════════════════════════════════════════════════════════
// prod-capacity-data.js — Production Capacity Data Layer
// Handles: production_capacity table CRUD, demand calculation engine
// Depends on: auth.js (supa, currentUser), portals/production/js/data.js (prodState)
// ═══════════════════════════════════════════════════════════════

const PROD_CAP_HOURS_PER_DAY = 8;

let prodCapState = {
  capacityRecords: [], // { id, work_area, year, month, staff_count, notes }
  loaded: false
};

// ── Initialise from Supabase ──────────────────────────────────
async function prodCapDataInit() {
  if (!currentUser) return;
  try {
    const { data, error } = await supa.from('production_capacity')
      .select('*')
      .order('year',  { ascending: true })
      .order('month', { ascending: true });
    if (error) throw error;
    prodCapState.capacityRecords = data || [];
    prodCapState.loaded = true;
    console.log('✓ Production capacity loaded:', prodCapState.capacityRecords.length, 'records');
  } catch (err) {
    console.error('❌ Error loading production capacity:', err);
    prodCapState.capacityRecords = [];
  }
}

// ── Capacity record accessors ─────────────────────────────────

function prodCapDataGetStaff(workArea, year, month) {
  const rec = prodCapState.capacityRecords.find(
    r => r.work_area === workArea && r.year === year && r.month === month
  );
  return rec ? Number(rec.staff_count) : 0;
}

async function prodCapDataSetStaff(workArea, year, month, staffCount) {
  if (!currentUser) return;
  const count = Math.max(0, parseFloat(staffCount) || 0);

  try {
    const existing = prodCapState.capacityRecords.find(
      r => r.work_area === workArea && r.year === year && r.month === month
    );

    if (existing) {
      const { data, error } = await supa.from('production_capacity')
        .update({ staff_count: count, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      const idx = prodCapState.capacityRecords.findIndex(r => r.id === existing.id);
      if (idx >= 0) prodCapState.capacityRecords[idx] = data;
    } else {
      const { data, error } = await supa.from('production_capacity')
        .insert([{ user_id: currentUser.id, work_area: workArea, year, month, staff_count: count }])
        .select()
        .single();
      if (error) throw error;
      prodCapState.capacityRecords.push(data);
    }
  } catch (err) {
    console.error('❌ Error saving production capacity:', err);
  }
}

// ── Working days calculator ───────────────────────────────────
// Count Mon–Fri days in a given year/month (1-indexed month)
function prodCapWorkingDays(year, month) {
  let count = 0;
  const days = new Date(year, month, 0).getDate(); // last day of month
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

// Available hours for a work area in a specific month
function prodCapAvailableHours(workArea, year, month) {
  const staff = prodCapDataGetStaff(workArea, year, month);
  if (staff === 0) return 0;
  const baseHours = staff * prodCapWorkingDays(year, month) * PROD_CAP_HOURS_PER_DAY;
  // Apply global utilization factor
  return baseHours * prodCapUtilizationFactor;
}

// ── Work area accessors ───────────────────────────────────────
function prodCapGetWorkAreas() {
  const areas = new Set();

  // Always include Unit 2, Unit 3, Unit 6 as default work areas
  ['Unit 2', 'Unit 3', 'Unit 6'].forEach(u => areas.add(u));

  // Get work areas from database (if loaded)
  if (workAreasState?.workAreas && workAreasState.workAreas.length > 0) {
    workAreasState.workAreas.forEach(w => areas.add(w.name));
  } else {
    // Fallback: discover from production data if work_areas table not available
    // From products
    const prods = prodState?.products || [];
    prods.forEach(p => { if (p.work_location) areas.add(p.work_location); });
    // From batches (may have a location not on any current product)
    const batches = prodState?.batches || [];
    batches.forEach(b => { if (b.work_location) areas.add(b.work_location); });
    // From capacity records already set
    prodCapState.capacityRecords.forEach(r => areas.add(r.work_area));
  }

  return Array.from(areas).sort();
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

function prodCapParseKey(key) {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}

function prodCapMonthLabel(key) {
  const { year, month } = prodCapParseKey(key);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function prodCapMonthLabelFull(key) {
  const { year, month } = prodCapParseKey(key);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Generate ordered month keys for a 2-year window ──────────
function prodCapGet24MonthKeys() {
  const today = new Date();
  const baseYear  = today.getFullYear();
  const baseMonth = today.getMonth() + 1;
  const keys = [];
  for (let i = 0; i < 24; i++) {
    keys.push(prodCapMonthKey(baseYear, baseMonth, i));
  }
  return keys;
}

// ── Demand matrix calculation ─────────────────────────────────
// Returns { 'YYYY-MM': { workArea: hours, _total: hours } }
function prodCapCalcDemandMatrix(monthKeys) {
  const batches  = prodState?.batches  || [];
  const products = prodState?.products || [];

  const productMap = {};
  products.forEach(p => { productMap[p.id] = p; });

  // Initialise matrix
  const matrix = {};
  monthKeys.forEach(k => { matrix[k] = { _total: 0 }; });

  batches.forEach(batch => {
    if (!batch.start_date || !batch.due_date || !batch.product_id || !batch.quantity) return;

    const product = productMap[batch.product_id];
    if (!product) return;

    const hoursPerUnit = Number(product.current_overhaul_hours) || 0;
    if (hoursPerUnit === 0) return;

    const totalHours = hoursPerUnit * Number(batch.quantity);
    const workArea   = batch.work_location || product.work_location || 'Unknown';

    const batchStart = new Date(batch.start_date + 'T00:00:00');
    const batchEnd   = new Date(batch.due_date   + 'T00:00:00');
    const totalMs    = batchEnd - batchStart;
    const totalDays  = Math.max(1, totalMs / 86400000 + 1);

    monthKeys.forEach(key => {
      const { year, month } = prodCapParseKey(key);
      const mStart = new Date(year, month - 1, 1);
      const mEnd   = new Date(year, month, 0);     // last day

      const overlapStart = batchStart > mStart ? batchStart : mStart;
      const overlapEnd   = batchEnd   < mEnd   ? batchEnd   : mEnd;

      if (overlapStart > overlapEnd) return;

      const overlapDays = (overlapEnd - overlapStart) / 86400000 + 1;
      const hours       = totalHours * (overlapDays / totalDays);

      if (!matrix[key][workArea]) matrix[key][workArea] = 0;
      matrix[key][workArea] += hours;
      matrix[key]._total    += hours;
    });
  });

  return matrix;
}

// ── Family-grouped demand matrix ─────────────────────────────
// Returns { 'YYYY-MM': { familyName: hours } }
function prodCapCalcFamilyDemandMatrix(monthKeys) {
  const batches  = prodState?.batches  || [];
  const products = prodState?.products || [];

  const productMap = {};
  products.forEach(p => { productMap[p.id] = p; });

  const matrix = {};
  monthKeys.forEach(k => { matrix[k] = {}; });

  batches.forEach(batch => {
    if (!batch.start_date || !batch.due_date || !batch.product_id || !batch.quantity) return;

    const product = productMap[batch.product_id];
    if (!product) return;

    const hoursPerUnit = Number(product.current_overhaul_hours) || 0;
    if (hoursPerUnit === 0) return;

    const totalHours = hoursPerUnit * Number(batch.quantity);
    const family     = product.family || 'Other';

    const batchStart = new Date(batch.start_date + 'T00:00:00');
    const batchEnd   = new Date(batch.due_date   + 'T00:00:00');
    const totalDays  = Math.max(1, (batchEnd - batchStart) / 86400000 + 1);

    monthKeys.forEach(key => {
      const { year, month } = prodCapParseKey(key);
      const mStart = new Date(year, month - 1, 1);
      const mEnd   = new Date(year, month, 0);

      const overlapStart = batchStart > mStart ? batchStart : mStart;
      const overlapEnd   = batchEnd   < mEnd   ? batchEnd   : mEnd;

      if (overlapStart > overlapEnd) return;

      const overlapDays = (overlapEnd - overlapStart) / 86400000 + 1;
      const hours       = totalHours * (overlapDays / totalDays);

      if (!matrix[key][family]) matrix[key][family] = 0;
      matrix[key][family] += hours;
    });
  });

  return matrix;
}

// ── Capacity supply matrix ────────────────────────────────────
// Returns { 'YYYY-MM': { workArea: hours, _total: hours } }
function prodCapCalcSupplyMatrix(monthKeys, workAreas) {
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
function prodCapUtil(demand, supply) {
  if (!supply || supply === 0) return demand > 0 ? 999 : 0;
  return Math.round((demand / supply) * 100);
}
