/**
 * Products Data Layer
 * Manages product master list and overhaul history
 * Syncs with Supabase tables: products, overhaul_history
 */

import {
  appState,
  db,
  getFamilies,
  findFamilyRecord,
  findProjectByProductId,
  syncProjectFamily
} from '../../../../core/js/state.js'
import * as supa from '../../../../core/js/supa.js'
import { save } from '../../../../core/js/db.js'
import { navigate, render } from '../../../../utils/js/navigation.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../../utils/js/realtime.js'

export const productsState = {
  products: [],
  history: {}, // product_id -> array of history records
  loaded: false
}
globalThis.productsState = productsState

const PRODUCTS_CHANNEL = 'products_channel'
const OVERHAUL_HISTORY_CHANNEL = 'overhaul_history_channel'
let productsRealtimeActive = false
let overhaulRealtimeActive = false

function productsDataIsKanbanVisible() {
  return appState.currentSection === 'projects' ||
    (appState.currentSection === 'product-development' && appState.productDevelopmentTab === 'npi')
}

function productsDataTriggerKanbanRefresh() {
  if (!productsDataIsKanbanVisible()) return
  render()
}

function productsDataUpsertProduct(row) {
  if (!row || !row.id) return
  if (row.deleted_at) {
    productsDataRemoveProduct(row.id)
    return
  }
  const idx = productsState.products.findIndex(p => p.id === row.id)
  if (idx >= 0) {
    productsState.products[idx] = row
  } else {
    productsState.products.push(row)
  }
  productsState.products.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

function productsDataRemoveProduct(productId) {
  if (!productId) return
  productsState.products = productsState.products.filter(p => p.id !== productId)
  delete productsState.history[productId]
}

function productsDataSyncLinkedProjectFamily(productId, familyRef) {
  if (!productId || !Array.isArray(db?.projects)) return false

  const linkedProject = findProjectByProductId(productId)
  if (!linkedProject) return false

  return syncProjectFamily(linkedProject, familyRef || '', linkedProject.family || 'Other')
}

function productsDataInitRealtime() {
  if (productsRealtimeActive) return
  const sub = createRealtimeSubscription('products', PRODUCTS_CHANNEL, {
    onInsert: (row) => {
      productsDataUpsertProduct(row)
      productsDataTriggerKanbanRefresh()
    },
    onUpdate: (row) => {
      productsDataUpsertProduct(row)
      productsDataTriggerKanbanRefresh()
    },
    onDelete: (row) => {
      productsDataRemoveProduct(row?.id)
      productsDataTriggerKanbanRefresh()
    }
  })

  productsRealtimeActive = !!sub
}

function productsDataInitOverhaulRealtime() {
  if (overhaulRealtimeActive) return
  const sub = createRealtimeSubscription('overhaul_history', OVERHAUL_HISTORY_CHANNEL, {
    onInsert: (row) => {
      if (!productsState.history[row.product_id]) {
        productsState.history[row.product_id] = []
      }
      if (!productsState.history[row.product_id].find(h => h.id === row.id)) {
        productsState.history[row.product_id].unshift(row)
      }
      if (appState.currentSection === 'product-development' && appState.productDevelopmentTab === 'npi') {
        render()
      }
    },
    onUpdate: (row) => {
      if (productsState.history[row.product_id]) {
        const idx = productsState.history[row.product_id].findIndex(h => h.id === row.id)
        if (idx >= 0) {
          productsState.history[row.product_id][idx] = row
          if (appState.currentSection === 'product-development' && appState.productDevelopmentTab === 'npi') {
            render()
          }
        }
      }
    },
    onDelete: (row) => {
      if (productsState.history[row.product_id]) {
        productsState.history[row.product_id] = productsState.history[row.product_id]
          .filter(h => h.id !== row.id)
        if (appState.currentSection === 'product-development' && appState.productDevelopmentTab === 'npi') {
          render()
        }
      }
    }
  })

  overhaulRealtimeActive = !!sub
}

/**
 * Initialize products data from Supabase
 */
export async function productsDataInit() {
  const user = supa.currentUser
  if (!user) return
  try {
    const prods = await supa.supabase.from('products').select('*').is('deleted_at', null)
      .order('name', { ascending: true })
    if (prods.error) throw prods.error
    productsState.products = prods.data || []

    const validFamilies = (typeof getFamilies === 'function' ? getFamilies() : []).map(f => f.id)
    productsState.products.forEach(p => {
      const isValidFamily = typeof findFamilyRecord === 'function'
        ? !!findFamilyRecord(p.family)
        : validFamilies.includes(p.family)
      if (p.family && !isValidFamily) {
        console.warn(`⚠️ Product "${p.name}" has invalid family "${p.family}". Valid families: ${validFamilies.join(', ')}`)
      }
    })

    if (productsState.products.length > 0) {
      const productIds = productsState.products.map(p => p.id)
      const hist = await supa.supabase.from('overhaul_history')
        .select('*')
        .in('product_id', productIds)
        .order('effective_date', { ascending: false })

      if (hist.error) throw hist.error

      productsState.history = {}
      ;(hist.data || []).forEach(record => {
        if (!productsState.history[record.product_id]) {
          productsState.history[record.product_id] = []
        }
        productsState.history[record.product_id].push(record)
      })
    }

    productsState.loaded = true
    productsDataInitRealtime()
    productsDataInitOverhaulRealtime()
  } catch (err) {
    console.error('❌ Error initializing products:', err)
  }
}

/**
 * Get all products
 */
export function productsDataGetAll() {
  return productsState.products
}

/**
 * Get single product with history
 */
export function productsDataGetProduct(productId) {
  const product = productsState.products.find(p => p.id === productId)
  const history = productsState.history[productId] || []
  return { product, history }
}

/**
 * Get history for a product
 */
export function productsDataGetHistory(productId) {
  return productsState.history[productId] || []
}

function productTenderStatusTriggered(productId, productData) {
  let linkedProject = findProjectByProductId(productId)

  if (!linkedProject && npi && npi.dashboard && typeof npi.dashboard.ensureProductProjects === 'function') {
    npi.dashboard.ensureProductProjects()
    linkedProject = findProjectByProductId(productId)
  }

  if (!linkedProject) {
    console.warn('No linked project found for Tender product:', productId)
    return
  }

  appState.tenderGateScopeState.projectId = linkedProject.id
  appState.tenderGateScopeState.isOpen = false
  appState.tenderGateScopeState.selectedGate = 0
  appState.tenderGateScopeState.workingSelections = null

  if (typeof productsRealtimeHooks.openTenderGateSelectionModal === 'function') {
    productsRealtimeHooks.openTenderGateSelectionModal(productId)
    return
  }

  const productName = (productData && productData.name) || linkedProject.name || 'this product'
  const openLinkedProject = confirm(
    'Product "' + productName + '" moved to Tender.\n\nOpen the linked NPI project now to set gate scope?'
  )
  if (!openLinkedProject) return

  if (npi && npi.dashboard && typeof npi.dashboard.openProject === 'function') {
    npi.dashboard.openProject(linkedProject.id)
    return
  }

  appState.progId = linkedProject.id
  navigate('project')
}

/**
 * Add new product
 */
export async function productsDataAddProduct(product) {
  const user = supa.currentUser
  if (!user) return
  try {
    const newProduct = {
      user_id: user.id,
      name: product.name,
      part_number: product.part_number,
      family: product.family || '',
      customer: product.customer,
      current_overhaul_hours: product.current_overhaul_hours || 0,
      turnaround_days: product.turnaround_days || null,
      work_location: product.work_location || null,
      status: product.status || 'active',
      notes: product.notes || '',
      scope: product.scope || 'overhaul',
      unit_value: product.unit_value != null ? product.unit_value : 100
    }

    const result = await supa.supabase.from('products').insert([newProduct]).select().single()
    if (result.error) throw result.error
    const data = result.data

    productsState.products.push(data)
    productsState.products.sort((a, b) => a.name.localeCompare(b.name))
    productsDataTriggerKanbanRefresh()

    if (data.current_overhaul_hours > 0) {
      const baseline = {
        user_id: user.id,
        product_id: data.id,
        overhaul_hours: data.current_overhaul_hours,
        time_impact_hours: data.current_overhaul_hours,
        effective_date: new Date().toISOString().split('T')[0],
        change_reason: 'Baseline',
        notes: 'Initial overhaul time recorded at product creation.',
        created_by_name: user.email || 'Unknown'
      }
      const bResult = await supa.supabase.from('overhaul_history').insert([baseline]).select().single()
      if (!bResult.error) {
        if (!productsState.history[data.id]) productsState.history[data.id] = []
        productsState.history[data.id].push(bResult.data)
      }
    }

    return data
  } catch (err) {
    console.error('❌ Error adding product:', err)
    throw err
  }
}

/**
 * Update product
 */
export async function productsDataUpdateProduct(productId, updates) {
  try {
    const existingProduct = productsState.products.find(p => p.id === productId)
    const previousStatus = String((existingProduct && existingProduct.status) || '').toLowerCase()

    const result = await supa.supabase.from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (result.error) throw result.error
    const data = result.data

    const idx = productsState.products.findIndex(p => p.id === productId)
    const previousLocation = (existingProduct && existingProduct.work_location) || null
    if (idx >= 0) {
      productsState.products[idx] = data
      productsState.products.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Cascade work_location change to existing production batches (if not Complete)
    const nextLocation = (data && data.work_location) || null
    if (previousLocation !== nextLocation) {
      try {
        await supa.supabase.from('production_batches')
          .update({ work_location: nextLocation })
          .eq('product_id', productId)
          .neq('status', 'Complete')
      } catch (batchErr) {
        console.warn('⚠️ Failed to cascade work_location update to production_batches:', batchErr)
      }
    }

    const projectFamilyUpdated = productsDataSyncLinkedProjectFamily(productId, data.family)
    if (projectFamilyUpdated) save()

    productsDataTriggerKanbanRefresh()

    const nextStatus = String((data && data.status) || '').toLowerCase()
    if (previousStatus !== 'tender' && nextStatus === 'tender') {
      productTenderStatusTriggered(productId, data)
    }

    return data
  } catch (err) {
    console.error('❌ Error updating product:', err)
    throw err
  }
}

/**
 * Get counts of related data for a product
 */
export async function productsDataGetRelatedDataCounts(productId) {
  const counts = {
    overhaulHistory: 0,
    npiProjects: 0,
    meProducts: 0,
    meTasks: 0
  }

  try {
    const historyCount = await supa.supabase
      .from('overhaul_history')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
    counts.overhaulHistory = historyCount.count || 0

    const projectsCount = await supa.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
    counts.npiProjects = projectsCount.count || 0

    const meProductsCount = await supa.supabase
      .from('me_products')
      .select('id', { count: 'exact', head: true })
      .eq('product_database_id', productId)
    counts.meProducts = meProductsCount.count || 0

    const meTasksCount = await supa.supabase
      .from('me_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
    counts.meTasks = meTasksCount.count || 0
  } catch (err) {
    console.warn('Warning: Could not count all related data:', err)
  }

  return counts
}

/**
 * Soft-delete (archive) product to prevent permanent data loss
 */
export async function productsDataDeleteProduct(productId) {
  try {
    const user = supa.currentUser
    const result = await supa.supabase.from('products')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
        delete_reason: 'Archived from Product Management'
      })
      .eq('id', productId)
      .is('deleted_at', null)
      .select()
      .single()
    if (result.error) throw result.error

    productsState.products = productsState.products.filter(p => p.id !== productId)
    delete productsState.history[productId]
    productsDataTriggerKanbanRefresh()
  } catch (err) {
    console.error('❌ Error deleting product:', err)
    throw err
  }
}

/**
 * Add overhaul history record (additive — caller passes a delta in hours).
 * historyRecord.time_impact_hours: positive = more time, negative = improvement.
 * The new absolute overhaul_hours is calculated as: current + delta.
 * current_overhaul_hours on the product is updated to the new absolute value.
 */
export async function productsDataAddHistory(productId, historyRecord) {
  const user = supa.currentUser
  if (!user) return
  try {
    const product = productsState.products.find(p => p.id === productId)
    const currentHours = product ? (product.current_overhaul_hours || 0) : 0
    const delta = historyRecord.time_impact_hours || 0
    const newHours = Math.max(0, currentHours + delta)

    const newRecord = {
      user_id: user.id,
      product_id: productId,
      overhaul_hours: newHours,
      time_impact_hours: delta,
      effective_date: historyRecord.effective_date,
      change_reason: historyRecord.change_reason || '',
      notes: historyRecord.notes || '',
      created_by_name: user.email || 'Unknown'
    }

    const result = await supa.supabase.from('overhaul_history').insert([newRecord]).select().single()
    if (result.error) throw result.error
    const data = result.data

    if (!productsState.history[productId]) {
      productsState.history[productId] = []
    }
    productsState.history[productId].unshift(data)

    await productsDataUpdateProduct(productId, {
      current_overhaul_hours: newHours
    })

    return data
  } catch (err) {
    console.error('❌ Error adding history record:', err)
    throw err
  }
}

/**
 * Delete history record
 */
export async function productsDataDeleteHistory(productId, historyId) {
  try {
    const result = await supa.supabase.from('overhaul_history').delete().eq('id', historyId)
    if (result.error) throw result.error

    if (productsState.history[productId]) {
      productsState.history[productId] = productsState.history[productId]
        .filter(h => h.id !== historyId)
    }
  } catch (err) {
    console.error('❌ Error deleting history record:', err)
    throw err
  }
}

/**
 * Get current overhaul time for a product
 */
export function productsDataGetCurrentOverhaulTime(productId) {
  const product = productsState.products.find(p => p.id === productId)
  return product ? product.current_overhaul_hours : 0
}

/**
 * Get overhaul time effective on a specific date
 */
export function productsDataGetOverhaulTimeOnDate(productId, targetDate) {
  const history = productsState.history[productId] || []

  const applicable = history
    .filter(h => new Date(h.effective_date) <= new Date(targetDate))
    .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))

  return applicable.length > 0 ? applicable[0].overhaul_hours : 0
}

/**
 * Force save to ensure Supabase is synced
 */
export async function productsDataSave() {
  // Data is auto-saved on each operation, but this can be called for explicit sync
}

export function productsDataUnsubscribeAll() {
  removeRealtimeSubscription(PRODUCTS_CHANNEL)
  removeRealtimeSubscription(OVERHAUL_HISTORY_CHANNEL)
  productsRealtimeActive = false
  overhaulRealtimeActive = false
}
