import { supa, currentUser } from '../../../core/js/auth.js';
import { render } from '../../../utils/js/navigation.js';

// ── Production Planning Data Layer ─────────────────────────
export let prodState = {
  products: [],
  batches: [],
  activeUnit: 'Unit 2'
};

let prodDebouncedSave = null;

// Initialize production data from Supabase
export async function prodDataInit() {
  try {
    // Load products from product management database (not production_products table)
    const products = await supa.from('products')
      .select('*')
      .order('name', { ascending: true });

    const batches = await supa.from('production_batches')
      .select('*')
      .order('created_at', { ascending: true });

    prodState.products = products.data || [];
    prodState.batches = batches.data || [];
  } catch (err) {
    console.error('Error loading production data:', err);
    prodState = { products: [], batches: [] };
  }
}

// Debounced save function
export function prodDebouncedSaveNow() {
  if (prodDebouncedSave) clearTimeout(prodDebouncedSave);
  prodDebouncedSave = setTimeout(() => prodDataSave(), 800);
}

// Main save function - persists to Supabase
export async function prodDataSave() {
  try {
    // Products are synced back to Supabase via individual insert/update operations
    // Batches are synced back to Supabase via individual insert/update operations
    // This is done in the individual CRUD functions
  } catch (err) {
    console.error('Error saving production data:', err);
  }
}

// ===== PRODUCT MANAGEMENT =====
// Products are now managed from the product management database
// This module only provides read access to products for batch scheduling

// ===== BATCH CRUD =====

export async function prodDataAddBatch(productId, unit, quantity, startDate, dueDate, status, notes) {
  if (!productId || !unit) return false;

  const batch = {
    user_id: currentUser.id,
    product_id: productId,
    unit: unit,
    quantity: quantity ? parseInt(quantity) : null,
    start_date: startDate || null,
    due_date: dueDate || null,
    status: status || 'Planned',
    notes: notes ? notes.trim() : null
  };

  try {
    const { data, error } = await supa.from('production_batches').insert([batch]).select();
    if (error) throw error;

    if (data && data[0]) {
      prodState.batches.push(data[0]);
      render();
      return true;
    }
  } catch (err) {
    console.error('Error adding batch:', err);
  }
  return false;
};

export async function prodDataUpdateBatch(idx, field, value) {
  if (idx < 0 || idx >= prodState.batches.length) return false;

  const batch = prodState.batches[idx];
  const updates = { updated_at: new Date().toISOString() };

  switch(field) {
    case 'product_id':
      updates.product_id = value;
      break;
    case 'unit':
      updates.unit = value || '';
      break;
    case 'quantity':
      updates.quantity = value ? parseInt(value) : null;
      break;
    case 'start_date':
      updates.start_date = value || null;
      break;
    case 'due_date':
      updates.due_date = value || null;
      break;
    case 'status':
      updates.status = value || 'Planned';
      break;
    case 'notes':
      updates.notes = value ? value.trim() : null;
      break;
    default:
      return false;
  }

  try {
    const { error } = await supa.from('production_batches')
      .update(updates)
      .eq('id', batch.id);

    if (error) throw error;

    Object.assign(batch, updates);
    render();
    prodDebouncedSaveNow();
    return true;
  } catch (err) {
    console.error('Error updating batch:', err);
  }
  return false;
};

export async function prodDataDeleteBatch(idx) {
  if (idx < 0 || idx >= prodState.batches.length) return false;

  const batch = prodState.batches[idx];

  try {
    const { error } = await supa.from('production_batches').delete().eq('id', batch.id);
    if (error) throw error;

    prodState.batches.splice(idx, 1);
    render();
    return true;
  } catch (err) {
    console.error('Error deleting batch:', err);
  }
  return false;
};

export async function prodDataShiftBatchDates(batchIds, days) {
  if (!batchIds || batchIds.length === 0 || !days) return false;

  const updates = [];
  const now = new Date().toISOString();

  batchIds.forEach(id => {
    const batch = prodState.batches.find(b => b.id === id);
    if (!batch) return;

    const newStart = batch.start_date ? shiftDateString(batch.start_date, days) : null;
    const newDue = batch.due_date ? shiftDateString(batch.due_date, days) : null;

    updates.push({
      id: id,
      start_date: newStart,
      due_date: newDue,
      updated_at: now
    });
  });

  try {
    // Supabase individual updates (upsert pattern for bulk update by ID)
    const { error } = await supa.from('production_batches').upsert(updates);
    if (error) throw error;

    // Update local state
    updates.forEach(u => {
      const batch = prodState.batches.find(b => b.id === u.id);
      if (batch) {
        batch.start_date = u.start_date;
        batch.due_date = u.due_date;
        batch.updated_at = u.updated_at;
      }
    });

    return true;
  } catch (err) {
    console.error('Error shifting batch dates:', err);
    alert('Error shifting dates: ' + err.message);
    return false;
  }
};

function shiftDateString(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ===== HELPERS =====

export function prodDataGetProductName(productId) {
  const product = prodState.products.find(p => p.id === productId);
  return product ? `${product.name} (${product.code || 'N/A'})` : 'Unknown Product';
};

export function prodDataGetProductById(productId) {
  return prodState.products.find(p => p.id === productId);
};

export function prodDataGetBatchesByProduct(productId) {
  return prodState.batches.filter(b => b.product_id === productId);
};

export function prodDataGetBatchesByUnit(unit) {
  return prodState.batches.filter(b => b.unit === unit);
};

export function prodSetActiveUnit(unit) {
  prodState.activeUnit = unit;
  prodPlanWeekOffset = 0; // Reset week offset when switching units
};
