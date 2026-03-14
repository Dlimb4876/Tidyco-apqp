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

const PRODUCTS_CHANNEL = 'products_channel';
let productsRealtimeActive = false;

function productsDataIsKanbanVisible() {
  return currentSection === 'projects' ||
    (currentSection === 'product-development' && productDevelopmentTab === 'npi');
}

function productsDataTriggerKanbanRefresh() {
  if (!productsDataIsKanbanVisible()) return;
  if (typeof render === 'function') render();
}

function productsDataUpsertProduct(row) {
  if (!row || !row.id) return;
  const idx = productsState.products.findIndex(p => p.id === row.id);
  if (idx >= 0) {
    productsState.products[idx] = row;
  } else {
    productsState.products.push(row);
  }
  productsState.products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function productsDataRemoveProduct(productId) {
  if (!productId) return;
  productsState.products = productsState.products.filter(p => p.id !== productId);
  delete productsState.history[productId];
}

function productsDataSyncLinkedProgrammeFamily(productId, familyRef) {
  if (!productId || !Array.isArray(db?.programmes)) return false;

  const linkedProgramme = typeof findProgrammeByProductId === 'function'
    ? findProgrammeByProductId(productId)
    : db.programmes.find(p => p && p.product_id === productId);

  if (!linkedProgramme) return false;

  if (typeof syncProgrammeFamily === 'function') {
    return syncProgrammeFamily(linkedProgramme, familyRef || '', linkedProgramme.family || 'Other');
  }

  const fallbackFamily = linkedProgramme.family || 'Other';
  const normalizedFamily = typeof normalizeFamilyId === 'function'
    ? normalizeFamilyId(familyRef || '', fallbackFamily)
    : (familyRef || fallbackFamily);

  if ((linkedProgramme.family || '') === normalizedFamily) return false;

  linkedProgramme.family = normalizedFamily;
  return true;
}

function productsDataInitRealtime() {
  if (productsRealtimeActive) return;
  if (typeof createRealtimeSubscription !== 'function') return;

  const sub = createRealtimeSubscription('products', PRODUCTS_CHANNEL, {
    onInsert: (row) => {
      productsDataUpsertProduct(row);
      productsDataTriggerKanbanRefresh();
    },
    onUpdate: (row) => {
      productsDataUpsertProduct(row);
      productsDataTriggerKanbanRefresh();
    },
    onDelete: (row) => {
      productsDataRemoveProduct(row?.id);
      productsDataTriggerKanbanRefresh();
    }
  });

  productsRealtimeActive = !!sub;
}

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

    // Validate family references - warn about orphaned families
    if (typeof getFamilies === 'function') {
      const validFamilies = getFamilies().map(f => f.id);
      productsState.products.forEach(p => {
        const isValidFamily = typeof findFamilyRecord === 'function'
          ? !!findFamilyRecord(p.family)
          : validFamilies.includes(p.family);
        if (p.family && !isValidFamily) {
          console.warn(`⚠️ Product "${p.name}" has invalid family "${p.family}". Valid families: ${validFamilies.join(', ')}`);
        }
      });
    }

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
    productsDataInitRealtime();
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

function productTenderStatusTriggered(productId, productData) {
  let linkedProgramme = typeof findProgrammeByProductId === 'function'
    ? findProgrammeByProductId(productId)
    : db.programmes.find(p => p.product_id === productId);

  if (!linkedProgramme && npi && npi.dashboard && typeof npi.dashboard.ensureProductProgrammes === 'function') {
    npi.dashboard.ensureProductProgrammes();
    linkedProgramme = typeof findProgrammeByProductId === 'function'
      ? findProgrammeByProductId(productId)
      : db.programmes.find(p => p.product_id === productId);
  }

  if (!linkedProgramme) {
    console.warn('No linked programme found for Tender product:', productId);
    return;
  }

  if (typeof tenderGateScopeState === 'object' && tenderGateScopeState) {
    tenderGateScopeState.programmeId = linkedProgramme.id;
    tenderGateScopeState.isOpen = false;
    tenderGateScopeState.selectedGate = 0;
    tenderGateScopeState.workingSelections = null;
  }

  if (typeof window !== 'undefined' && typeof window.openTenderGateSelectionModal === 'function') {
    window.openTenderGateSelectionModal(productId);
    return;
  }

  const productName = (productData && productData.name) || linkedProgramme.name || 'this product';
  const openLinkedProject = confirm(
    'Product "' + productName + '" moved to Tender.\n\nOpen the linked NPI project now to set gate scope?'
  );
  if (!openLinkedProject) return;

  if (npi && npi.dashboard && typeof npi.dashboard.openProject === 'function') {
    npi.dashboard.openProject(linkedProgramme.id);
    return;
  }

  progId = linkedProgramme.id;
  navigate('project');
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
      part_number: product.part_number,
      family: product.family || '',
      customer: product.customer,
      current_overhaul_hours: product.current_overhaul_hours || 0,
      turnaround_days: product.turnaround_days || null,
      work_location: product.work_location || null,
      status: product.status || 'active',
      notes: product.notes || ''
    };

    const result = await supa.from('products').insert([newProduct]).select().single();
    if (result.error) throw result.error;
    const data = result.data;

    productsState.products.push(data);
    productsState.products.sort((a, b) => a.name.localeCompare(b.name));
    productsDataTriggerKanbanRefresh();

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
    const existingProduct = productsState.products.find(p => p.id === productId);
    const previousStatus = String((existingProduct && existingProduct.status) || '').toLowerCase();

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

    const programmeFamilyUpdated = productsDataSyncLinkedProgrammeFamily(productId, data.family);
    if (programmeFamilyUpdated && typeof save === 'function') save();

    productsDataTriggerKanbanRefresh();

    const nextStatus = String((data && data.status) || '').toLowerCase();
    if (previousStatus !== 'tender' && nextStatus === 'tender') {
      productTenderStatusTriggered(productId, data);
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
    productsDataTriggerKanbanRefresh();

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
