/**
 * Products Data Layer
 * Manages product master list and overhaul history
 * Syncs with Supabase tables: products, overhaul_history
 */

window.productsState = {
  products: [],
  history: {},  // product_id -> array of history records
  loaded: false
};

const PRODUCTS_CHANNEL = 'products_channel';
const OVERHAUL_HISTORY_CHANNEL = 'overhaul_history_channel';
let productsRealtimeActive = false;
let overhaulRealtimeActive = false;

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

function productsDataSyncLinkedProjectFamily(productId, familyRef) {
  if (!productId || !Array.isArray(db?.projects)) return false;

  const linkedProject = typeof findProjectByProductId === 'function'
    ? findProjectByProductId(productId)
    : db.projects.find(p => p && p.product_id === productId);

  if (!linkedProject) return false;

  if (typeof syncProjectFamily === 'function') {
    return syncProjectFamily(linkedProject, familyRef || '', linkedProject.family || 'Other');
  }

  const fallbackFamily = linkedProject.family || 'Other';
  const normalizedFamily = typeof normalizeFamilyId === 'function'
    ? normalizeFamilyId(familyRef || '', fallbackFamily)
    : (familyRef || fallbackFamily);

  if ((linkedProject.family || '') === normalizedFamily) return false;

  linkedProject.family = normalizedFamily;
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

function productsDataInitOverhaulRealtime() {
  if (overhaulRealtimeActive) return;
  if (typeof createRealtimeSubscription !== 'function') return;

  const sub = createRealtimeSubscription('overhaul_history', OVERHAUL_HISTORY_CHANNEL, {
    onInsert: (row) => {
      if (!productsState.history[row.product_id]) {
        productsState.history[row.product_id] = [];
      }
      // Avoid duplicates
      if (!productsState.history[row.product_id].find(h => h.id === row.id)) {
        productsState.history[row.product_id].unshift(row);
      }
      if (currentSection === 'product-development' && productDevelopmentTab === 'npi') {
        if (typeof render === 'function') render();
      }
    },
    onUpdate: (row) => {
      if (productsState.history[row.product_id]) {
        const idx = productsState.history[row.product_id].findIndex(h => h.id === row.id);
        if (idx >= 0) {
          productsState.history[row.product_id][idx] = row;
          if (currentSection === 'product-development' && productDevelopmentTab === 'npi') {
            if (typeof render === 'function') render();
          }
        }
      }
    },
    onDelete: (row) => {
      if (productsState.history[row.product_id]) {
        productsState.history[row.product_id] = productsState.history[row.product_id]
          .filter(h => h.id !== row.id);
        if (currentSection === 'product-development' && productDevelopmentTab === 'npi') {
          if (typeof render === 'function') render();
        }
      }
    }
  });

  overhaulRealtimeActive = !!sub;
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
    productsDataInitOverhaulRealtime();
  } catch (err) {
    console.error('❌ Error initializing products:', err);
  }
}

/**
 * Get all products
 */
window.productsDataGetAll = function() {
  return productsState.products;
};

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
  let linkedProject = typeof findProjectByProductId === 'function'
    ? findProjectByProductId(productId)
    : db.projects.find(p => p.product_id === productId);

  if (!linkedProject && npi && npi.dashboard && typeof npi.dashboard.ensureProductProjects === 'function') {
    npi.dashboard.ensureProductProjects();
    linkedProject = typeof findProjectByProductId === 'function'
      ? findProjectByProductId(productId)
      : db.projects.find(p => p.product_id === productId);
  }

  if (!linkedProject) {
    console.warn('No linked project found for Tender product:', productId);
    return;
  }

  if (typeof tenderGateScopeState === 'object' && tenderGateScopeState) {
    tenderGateScopeState.projectId = linkedProject.id;
    tenderGateScopeState.isOpen = false;
    tenderGateScopeState.selectedGate = 0;
    tenderGateScopeState.workingSelections = null;
  }

  if (typeof window !== 'undefined' && typeof window.openTenderGateSelectionModal === 'function') {
    window.openTenderGateSelectionModal(productId);
    return;
  }

  const productName = (productData && productData.name) || linkedProject.name || 'this product';
  const openLinkedProject = confirm(
    'Product "' + productName + '" moved to Tender.\n\nOpen the linked NPI project now to set gate scope?'
  );
  if (!openLinkedProject) return;

  if (npi && npi.dashboard && typeof npi.dashboard.openProject === 'function') {
    npi.dashboard.openProject(linkedProject.id);
    return;
  }

  progId = linkedProject.id;
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
      notes: product.notes || '',
      scope: product.scope || 'overhaul'
    };

    const result = await supa.from('products').insert([newProduct]).select().single();
    if (result.error) throw result.error;
    const data = result.data;

    productsState.products.push(data);
    productsState.products.sort((a, b) => a.name.localeCompare(b.name));
    productsDataTriggerKanbanRefresh();

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

    const projectFamilyUpdated = productsDataSyncLinkedProjectFamily(productId, data.family);
    if (projectFamilyUpdated && typeof save === 'function') save();

    productsDataTriggerKanbanRefresh();

    const nextStatus = String((data && data.status) || '').toLowerCase();
    if (previousStatus !== 'tender' && nextStatus === 'tender') {
      productTenderStatusTriggered(productId, data);
    }

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
}

window.productsDataUnsubscribeAll = function() {
  removeRealtimeSubscription(PRODUCTS_CHANNEL);
  removeRealtimeSubscription(OVERHAUL_HISTORY_CHANNEL);
};
