/**
 * Products Data Layer
 * Manages product master list and overhaul history
 * Syncs with Supabase tables: products, overhaul_history
 */

let productsState = {
  products: [],
  history: {},  // product_id -> array of history records
  loaded: false
};

/**
 * Initialize products data from Supabase
 */
async function productsDataInit() {
  if (!currentUser) return;
  try {
    // Load products
    const prods = await supa.from('products').select('*').order('name', { ascending: true });
    if (prods.error) throw prods.error;
    productsState.products = prods.data || [];

    // Load overhaul history for all products
    if (productsState.products.length > 0) {
      const productIds = productsState.products.map(p => p.id);
      const hist = await supa.from('overhaul_history')
        .select('*')
        .in('product_id', productIds)
        .order('effective_date', { ascending: false });

      if (hist.error) throw hist.error;

      // Group history by product_id
      productsState.history = {};
      (hist.data || []).forEach(record => {
        if (!productsState.history[record.product_id]) {
          productsState.history[record.product_id] = [];
        }
        productsState.history[record.product_id].push(record);
      });
    }

    productsState.loaded = true;
    console.log('✓ Products data initialized:', productsState.products.length, 'products');
  } catch (err) {
    console.error('❌ Error initializing products:', err);
  }
}

/**
 * Get all products
 */
function productsDataGetAll() {
  return productsState.products;
}

/**
 * Get single product with history
 */
function productsDataGetProduct(productId) {
  const product = productsState.products.find(p => p.id === productId);
  const history = productsState.history[productId] || [];
  return { product, history };
}

/**
 * Get history for a product
 */
function productsDataGetHistory(productId) {
  return productsState.history[productId] || [];
}

/**
 * Add new product
 */
async function productsDataAddProduct(product) {
  if (!currentUser) return;
  try {
    const newProduct = {
      user_id: currentUser.id,
      name: product.name,
      code: product.code,
      family: product.family || '',
      customer: product.customer,
      current_overhaul_hours: product.current_overhaul_hours || 0,
      status: product.status || 'active',
      notes: product.notes || ''
    };

    const result = await supa.from('products').insert([newProduct]).select().single();
    if (result.error) throw result.error;
    const data = result.data;

    productsState.products.push(data);
    productsState.products.sort((a, b) => a.name.localeCompare(b.name));

    console.log('✓ Product added:', data.id);
    return data;
  } catch (err) {
    console.error('❌ Error adding product:', err);
    throw err;
  }
}

/**
 * Update product
 */
async function productsDataUpdateProduct(productId, updates) {
  try {
    const result = await supa.from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (result.error) throw result.error;
    const data = result.data;

    const idx = productsState.products.findIndex(p => p.id === productId);
    if (idx >= 0) {
      productsState.products[idx] = data;
      productsState.products.sort((a, b) => a.name.localeCompare(b.name));
    }

    console.log('✓ Product updated:', productId);
    return data;
  } catch (err) {
    console.error('❌ Error updating product:', err);
    throw err;
  }
}

/**
 * Delete product (and its history)
 */
async function productsDataDeleteProduct(productId) {
  try {
    // RLS cascade will delete history records
    const result = await supa.from('products').delete().eq('id', productId);
    if (result.error) throw result.error;

    productsState.products = productsState.products.filter(p => p.id !== productId);
    delete productsState.history[productId];

    console.log('✓ Product deleted:', productId);
  } catch (err) {
    console.error('❌ Error deleting product:', err);
    throw err;
  }
}

/**
 * Add overhaul history record (new estimation)
 */
async function productsDataAddHistory(productId, historyRecord) {
  if (!currentUser) return;
  try {
    const newRecord = {
      user_id: currentUser.id,
      product_id: productId,
      overhaul_hours: historyRecord.overhaul_hours,
      effective_date: historyRecord.effective_date,  // YYYY-MM-DD
      change_reason: historyRecord.change_reason || '',
      notes: historyRecord.notes || '',
      created_by_name: currentUser.email || 'Unknown'
    };

    const result = await supa.from('overhaul_history').insert([newRecord]).select().single();
    if (result.error) throw result.error;
    const data = result.data;

    // Add to state and sort by effective_date (newest first)
    if (!productsState.history[productId]) {
      productsState.history[productId] = [];
    }
    productsState.history[productId].unshift(data);

    // Update current_overhaul_hours on product
    await productsDataUpdateProduct(productId, {
      current_overhaul_hours: historyRecord.overhaul_hours
    });

    console.log('✓ Overhaul history record added:', data.id);
    return data;
  } catch (err) {
    console.error('❌ Error adding history record:', err);
    throw err;
  }
}

/**
 * Delete history record
 */
async function productsDataDeleteHistory(productId, historyId) {
  try {
    const result = await supa.from('overhaul_history').delete().eq('id', historyId);
    if (result.error) throw result.error;

    if (productsState.history[productId]) {
      productsState.history[productId] = productsState.history[productId]
        .filter(h => h.id !== historyId);
    }

    console.log('✓ History record deleted:', historyId);
  } catch (err) {
    console.error('❌ Error deleting history record:', err);
    throw err;
  }
}

/**
 * Get current overhaul time for a product
 */
function productsDataGetCurrentOverhaulTime(productId) {
  const product = productsState.products.find(p => p.id === productId);
  return product ? product.current_overhaul_hours : 0;
}

/**
 * Get overhaul time effective on a specific date
 */
function productsDataGetOverhaulTimeOnDate(productId, targetDate) {
  const history = productsState.history[productId] || [];

  // Find the most recent record on or before targetDate
  const applicable = history
    .filter(h => new Date(h.effective_date) <= new Date(targetDate))
    .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));

  return applicable.length > 0 ? applicable[0].overhaul_hours : 0;
}

/**
 * Force save to ensure Supabase is synced
 */
async function productsDataSave() {
  // Data is auto-saved on each operation, but this can be called for explicit sync
  console.log('✓ Products data synced');
}
