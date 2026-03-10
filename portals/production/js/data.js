// Production Planning Data Layer
// Handles CRUD for products and batches with Supabase persistence

let prodState = {
  products: [],
  batches: []
};

let prodDebouncedSave = null;

// Initialize production data from Supabase
async function prodDataInit() {
  try {
    const products = await supa.from('production_products')
      .select('*')
      .order('created_at', { ascending: true });

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

// ===== PRODUCT CRUD =====

window.prodDataAddProduct = async function(name, code, family, leadTime, notes, status, assignedUnit) {
  if (!name || name.trim().length === 0) return false;

  const product = {
    user_id: currentUser.id,
    name: name.trim(),
    code: code ? code.trim() : null,
    family: family ? family.trim() : null,
    lead_time_days: leadTime ? parseInt(leadTime) : null,
    notes: notes ? notes.trim() : null,
    status: status || 'active',
    assigned_unit: assignedUnit || null
  };

  try {
    const { data, error } = await supa.from('production_products').insert([product]).select();
    if (error) throw error;

    if (data && data[0]) {
      prodState.products.push(data[0]);
      return true;
    }
  } catch (err) {
    console.error('Error adding product:', err);
  }
  return false;
};

window.prodDataUpdateProduct = async function(idx, field, value) {
  if (idx < 0 || idx >= prodState.products.length) return false;

  const product = prodState.products[idx];
  const updates = { updated_at: new Date().toISOString() };

  // Map field names and validate
  switch(field) {
    case 'name':
      if (!value || value.trim().length === 0) return false;
      updates.name = value.trim();
      break;
    case 'code':
      updates.code = value ? value.trim() : null;
      break;
    case 'family':
      updates.family = value ? value.trim() : null;
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
      updates.assigned_unit = value ? value : null;
      break;
    default:
      return false;
  }

  try {
    const { error } = await supa.from('production_products')
      .update(updates)
      .eq('id', product.id);

    if (error) throw error;

    Object.assign(product, updates);
    render();
    prodDebouncedSaveNow();
    return true;
  } catch (err) {
    console.error('Error updating product:', err);
  }
  return false;
};

window.prodDataDeleteProduct = async function(idx) {
  if (idx < 0 || idx >= prodState.products.length) return false;

  const product = prodState.products[idx];

  try {
    const { error } = await supa.from('production_products').delete().eq('id', product.id);
    if (error) throw error;

    prodState.products.splice(idx, 1);
    render();
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
  }
  return false;
};

// ===== BATCH CRUD =====

window.prodDataAddBatch = async function(productId, unit, quantity, startDate, dueDate, status, notes) {
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

window.prodDataUpdateBatch = async function(idx, field, value) {
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

window.prodDataGetBatchesByUnit = function(unit) {
  return prodState.batches.filter(b => b.unit === unit);
};
