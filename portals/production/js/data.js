// Production Planning Data Layer
// Handles CRUD for products and batches with Supabase persistence

let prodState = {
  products: [],
  batches: [],
  activeUnit: 'Unit 2'
};

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
    // Load products from product management database (not production_products table)
    const products = await supa.from('products')
      .select('*')
      .order('name', { ascending: true });

    const batches = await supa.from('production_batches')
      .select('*')
      .order('created_at', { ascending: true });

    prodState.products = products.data || [];
    prodState.batches = batches.data || [];

    // Set up real-time sync
    prodDataSubscribe();
  } catch (err) {
    console.error('Error loading production data:', err);
    // Preserve activeUnit when resetting state
    prodState = { products: [], batches: [], activeUnit: 'Unit 2' };
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
    case 'part_number':
      updates.part_number = value ? value.trim() : null;
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
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const product = products.find(p => p.id === productId);
  return product ? `${product.name} (${product.part_number || 'N/A'})` : 'Unknown Product';
};

window.prodDataGetProductById = function(productId) {
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  return products.find(p => p.id === productId);
};

window.prodDataGetBatchesByProduct = function(productId) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : [];
  return batches.filter(b => b.product_id === productId);
};

window.prodDataGetBatchesByWorkLocation = function(workLocation) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : [];
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  
  return batches.filter(b => {
    const batchLocation = b.work_location;
    if (batchLocation === workLocation) return true;
    // Fallback to product's work_location if batch doesn't have one
    if (!batchLocation) {
      const product = products.find(p => p.id === b.product_id);
      return product && product.work_location === workLocation;
    }
    return false;
  });
};

window.prodSetActiveUnit = function(unit) {
  prodState.activeUnit = unit;
};

// ────────────────────────────────────────────────────────────
// Real-Time Sync (Generic System)
// ────────────────────────────────────────────────────────────

window.prodDataSubscribe = function() {
  if (!currentUser) return;

  // Subscribe to production batches changes
  createRealtimeSubscription('production_batches', 'prod_batches_channel', {
    onInsert: (newBatch) => {
      if (!prodState || !Array.isArray(prodState.batches)) return;
      if (!prodState.batches.some(b => b.id === newBatch.id)) {
        prodState.batches.push(newBatch);
        render();
      }
    },
    onUpdate: (updated) => {
      if (!prodState || !Array.isArray(prodState.batches)) return;
      const idx = prodState.batches.findIndex(b => b.id === updated.id);
      if (idx >= 0) {
        prodState.batches[idx] = updated;
        render();
      }
    },
    onDelete: (deleted) => {
      if (!prodState || !Array.isArray(prodState.batches)) return;
      prodState.batches = prodState.batches.filter(b => b.id !== deleted.id);
      render();
    }
  });

  // Subscribe to products changes (from product management)
  createRealtimeSubscription('products', 'prod_products_channel', {
    onInsert: (newProduct) => {
      if (!prodState || !Array.isArray(prodState.products)) return;
      if (!prodState.products.some(p => p.id === newProduct.id)) {
        prodState.products.push(newProduct);
        render();
      }
    },
    onUpdate: (updated) => {
      if (!prodState || !Array.isArray(prodState.products)) return;
      const idx = prodState.products.findIndex(p => p.id === updated.id);
      if (idx >= 0) {
        prodState.products[idx] = updated;
        render();
      }
    },
    onDelete: (deleted) => {
      if (!prodState || !Array.isArray(prodState.products)) return;
      prodState.products = prodState.products.filter(p => p.id !== deleted.id);
      render();
    }
  });
};

window.prodDataUnsubscribe = function() {
  removeRealtimeSubscription('prod_batches_channel');
  removeRealtimeSubscription('prod_products_channel');
};
