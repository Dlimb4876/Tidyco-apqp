// Production Planning Data Layer
// Handles CRUD for products and batches with Supabase persistence

let prodState = {
  families: [],
  products: [],
  batches: [],
  activeUnit: 'Unit 2'
};

let prodDebouncedSave = null;

// ── Date formatting helpers ─────────────────────────────
function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  // Convert YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function parseDisplayDate(displayDate) {
  if (!displayDate) return '';
  // Convert DD/MM/YYYY to YYYY-MM-DD (also handle YYYY-MM-DD as-is)
  if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return displayDate; // Already in ISO format
  }
  if (displayDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month}-${day}`;
  }
  return null;
}

// Initialize production data from Supabase
async function prodDataInit() {
  try {
    // Load families from database
    const families = await supa.from('families')
      .select('*')
      .order('label', { ascending: true });

    // Load products from product management database (not production_products table)
    const products = await supa.from('products')
      .select('*')
      .order('name', { ascending: true });

    const batches = await supa.from('production_batches')
      .select('*')
      .order('created_at', { ascending: true });

    prodState.families = families.data || [];
    prodState.products = products.data || [];
    prodState.batches = batches.data || [];
  } catch (err) {
    console.error('Error loading production data:', err);
    prodState = { families: [], products: [], batches: [] };
  }
}

// Reload products (called when products are added/updated elsewhere)
async function prodDataReloadProducts() {
  try {
    const { data, error } = await supa.from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    prodState.products = data || [];
    console.log('✓ Production portal products reloaded');
  } catch (err) {
    console.error('Error reloading products:', err);
  }
}

// Debounced save function
function prodDebouncedSaveNow() {
  if (prodDebouncedSave) clearTimeout(prodDebouncedSave);
  prodDebouncedSave = setTimeout(() => prodDataSave(), 800);
}

// Main save function - persists to Supabase
async function prodDataSave() {
  try {
    // Products are synced back to Supabase via individual insert/update operations
    // Batches are synced back to Supabase via individual insert/update operations
    // This is done in the individual CRUD functions
  } catch (err) {
    console.error('Error saving production data:', err);
  }
}

// ===== PRODUCT MANAGEMENT =====

window.prodDataAddProduct = async function(name, code, family, lead_time_days, notes, status, assigned_unit) {
  if (!name || !name.trim()) return false;

  const product = {
    user_id: currentUser.id,
    name: name.trim(),
    code: code ? code.trim() : null,
    family: family || null,
    lead_time_days: lead_time_days ? parseInt(lead_time_days) : null,
    notes: notes ? notes.trim() : null,
    status: status || 'active',
    assigned_unit: assigned_unit || null
  };

  try {
    const { data, error } = await supa.from('products').insert([product]).select();
    if (error) throw error;

    if (data && data[0]) {
      prodState.products.push(data[0]);
      prodState.products.sort((a, b) => a.name.localeCompare(b.name));
      render();
      return true;
    }
  } catch (err) {
    console.error('Error adding product:', err);
    alert('Failed to add product: ' + err.message);
  }
  return false;
};

window.prodDataUpdateProduct = async function(idx, field, value) {
  if (idx < 0 || idx >= prodState.products.length) return false;

  const product = prodState.products[idx];
  const updates = { updated_at: new Date().toISOString() };

  switch(field) {
    case 'name':
      updates.name = value || '';
      break;
    case 'code':
      updates.code = value ? value.trim() : null;
      break;
    case 'family':
      updates.family = value || null;
      break;
    case 'lead_time_days':
      updates.lead_time_days = value ? parseInt(value) : null;
      break;
    case 'notes':
      updates.notes = value ? value.trim() : null;
      break;
    case 'status':
      updates.status = value || 'active';
      break;
    case 'assigned_unit':
      updates.assigned_unit = value || null;
      break;
    default:
      return false;
  }

  try {
    const { error } = await supa.from('products')
      .update(updates)
      .eq('id', product.id);

    if (error) throw error;

    Object.assign(product, updates);
    prodState.products.sort((a, b) => a.name.localeCompare(b.name));
    render();
    return true;
  } catch (err) {
    console.error('Error updating product:', err);
    alert('Failed to update product: ' + err.message);
  }
  return false;
};

window.prodDataDeleteProduct = async function(idx) {
  if (idx < 0 || idx >= prodState.products.length) return false;

  const product = prodState.products[idx];

  try {
    const { error } = await supa.from('products').delete().eq('id', product.id);
    if (error) throw error;

    prodState.products.splice(idx, 1);
    render();
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    alert('Failed to delete product: ' + err.message);
  }
  return false;
};

// ===== BATCH CRUD =====

window.prodDataAddBatch = async function(productId, workLocation, quantity, startDate, dueDate, status, notes) {
  if (!productId || !workLocation) return false;

  const batch = {
    user_id: currentUser.id,
    product_id: productId,
    work_location: workLocation,
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

window.prodDataUpdateBatch = async function(idx, field, value) {
  if (idx < 0 || idx >= prodState.batches.length) return false;

  const batch = prodState.batches[idx];
  const updates = { updated_at: new Date().toISOString() };

  switch(field) {
    case 'product_id':
      updates.product_id = value;
      break;
    case 'work_location':
      updates.work_location = value || '';
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

window.prodDataDeleteBatch = async function(idx) {
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

// ===== HELPERS =====

window.prodDataGetProductName = function(productId) {
  const product = prodState.products.find(p => p.id === productId);
  return product ? `${product.name} (${product.code || 'N/A'})` : 'Unknown Product';
};

window.prodDataGetProductById = function(productId) {
  return prodState.products.find(p => p.id === productId);
};

window.prodDataGetBatchesByProduct = function(productId) {
  return prodState.batches.filter(b => b.product_id === productId);
};

window.prodDataGetBatchesByWorkLocation = function(workLocation) {
  return prodState.batches.filter(b => b.work_location === workLocation);
};

window.prodSetActiveUnit = function(unit) {
  prodState.activeUnit = unit;
  prodPlanMonthOffset = 0; // Reset month offset when switching units
};

// ===== FAMILY MANAGEMENT =====

window.prodDataAddFamily = async function(name, label, icon, description) {
  if (!name || !label) return null;

  const family = {
    user_id: currentUser.id,
    name: name.trim(),
    label: label.trim(),
    icon: icon || '📋',
    description: description ? description.trim() : null
  };

  try {
    const { data, error } = await supa.from('families').insert([family]).select();
    if (error) throw error;

    if (data && data[0]) {
      prodState.families.push(data[0]);
      prodState.families.sort((a, b) => a.label.localeCompare(b.label));
      render();
      return data[0];
    }
  } catch (err) {
    console.error('Error adding family:', err);
    alert('Failed to add family: ' + err.message);
  }
  return null;
};

window.prodDataUpdateFamily = async function(familyId, updates) {
  const family = prodState.families.find(f => f.id === familyId);
  if (!family) return false;

  try {
    const { error } = await supa.from('families')
      .update(updates)
      .eq('id', familyId);

    if (error) throw error;

    Object.assign(family, updates);
    prodState.families.sort((a, b) => a.label.localeCompare(b.label));
    render();
    return true;
  } catch (err) {
    console.error('Error updating family:', err);
    alert('Failed to update family: ' + err.message);
  }
  return false;
};

window.prodDataDeleteFamily = async function(familyId) {
  const idx = prodState.families.findIndex(f => f.id === familyId);
  if (idx === -1) return false;

  try {
    const { error } = await supa.from('families').delete().eq('id', familyId);
    if (error) throw error;

    prodState.families.splice(idx, 1);
    render();
    return true;
  } catch (err) {
    console.error('Error deleting family:', err);
    alert('Failed to delete family: ' + err.message);
  }
  return false;
};

window.prodDataGetFamilyName = function(familyId) {
  const family = prodState.families.find(f => f.id === familyId);
  return family ? family.label : 'Unknown Family';
};
