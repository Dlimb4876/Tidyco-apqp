// Production Planning Data Layer
// Handles CRUD for products and batches with Supabase persistence

import { supabase as supa, currentUser } from '../../../core/js/supa.js'
import { appState, getFamilies } from '../../../core/js/state.js'
import { render } from '../../../utils/js/navigation.js'
import { showToast, isEditingInlineCell } from '../../../utils/js/helpers.js'
import { requestRender } from '../../../utils/js/render-scheduler.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../utils/js/realtime.js'
import { realtimePatchUpdate, realtimePatchDelete } from '../../../utils/js/realtime-patch.js'

export const prodState = {
  products: [],
  batches: [],
  activeUnit: 'Unit 2',
  activeProductId: null
}

let prodRefreshTabBodyHandler = null
let prodRenderSchedulingRowHandler = null
let prodGetFilteredBatchesHandler = null

export function setProdDataRefreshTabBodyHandler(handler) {
  prodRefreshTabBodyHandler = typeof handler === 'function' ? handler : null
}

export function setProdDataSchedulingRenderHelpers({ renderSchedulingRow, getFilteredBatches } = {}) {
  prodRenderSchedulingRowHandler = typeof renderSchedulingRow === 'function' ? renderSchedulingRow : null
  prodGetFilteredBatchesHandler = typeof getFilteredBatches === 'function' ? getFilteredBatches : null
}

// ── Date formatting helpers ─────────────────────────────
export function formatDisplayDate(isoDate) {
  if (!isoDate) return ''
  // Convert YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function parseDisplayDate(displayDate) {
  if (!displayDate) return ''
  // Convert DD/MM/YYYY to YYYY-MM-DD (also handle YYYY-MM-DD as-is)
  if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return displayDate // Already in ISO format
  }
  if (displayDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = displayDate.split('/')
    return `${year}-${month}-${day}`
  }
  return null
}

function normalizeProductName(product) {
  if (!product || typeof product.name !== 'string') return ''
  return product.name.trim()
}

function sortProductsByNameSafe(products) {
  if (!Array.isArray(products)) return
  products.sort((a, b) => normalizeProductName(a).localeCompare(normalizeProductName(b)))
}

// Initialize production data from Supabase
export async function prodDataInit() {
  try {
    // Load products from product management database (not production_products table)
    const products = await supa.from('products')
      .select('*')
      .order('name', { ascending: true })

    const batches = await supa.from('production_batches')
      .select('*')
      .order('created_at', { ascending: true })

    prodState.products = products.data || []
    prodState.batches = batches.data || []

    // Set up real-time sync
    prodDataSubscribe()
  } catch (err) {
    console.error('Error loading production data:', err)
    // Preserve activeUnit when resetting state
    prodState.products = []
    prodState.batches = []
    prodState.activeUnit = 'Unit 2'
    prodState.activeProductId = null
  }
}

// Load batches filtered by product (for performance optimization)
export async function prodDataLoadBatchesForProduct(productId) {
  try {
    if (!productId) {
      // Load all batches if no product specified
      const { data, error } = await supa.from('production_batches')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      prodState.batches = data || []
    } else {
      // Load only batches for specific product
      const { data, error } = await supa.from('production_batches')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })
      if (error) throw error
      prodState.batches = data || []
    }
    if (typeof render === 'function') render()
    return true
  } catch (err) {
    console.error('Error loading batches for product:', err)
    return false
  }
}

// Reload products (called when products are added/updated elsewhere)
export async function prodDataReloadProducts() {
  try {
    const { data, error } = await supa.from('products')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    prodState.products = data || []
  } catch (err) {
    console.error('Error reloading products:', err)
  }
}

// ===== PRODUCT MANAGEMENT =====

export async function prodDataAddProduct(name, code, family, lead_time_days, notes, status, assigned_unit) {
  if (!name || !name.trim()) return false

  const product = {
    user_id: currentUser.id,
    name: name.trim(),
    code: code ? code.trim() : null,
    family: family || null,
    lead_time_days: lead_time_days ? parseInt(lead_time_days) : null,
    notes: notes ? notes.trim() : null,
    status: status || 'active',
    assigned_unit: assigned_unit || null
  }

  try {
    const { data, error } = await supa.from('products').insert([product]).select()
    if (error) throw error

    if (data && data[0]) {
      prodState.products.push(data[0])
      sortProductsByNameSafe(prodState.products)
      render()
      return true
    }
  } catch (err) {
    console.error('Error adding product:', err)
    showToast('Failed to add product: ' + err.message, 'error')
  }
  return false
}

export async function prodDataUpdateProduct(idx, field, value) {
  if (idx < 0 || idx >= prodState.products.length) return false

  const product = prodState.products[idx]
  const updates = { updated_at: new Date().toISOString() }

  switch (field) {
    case 'name':
      updates.name = value || ''
      break
    case 'part_number':
      updates.part_number = value ? value.trim() : null
      break
    case 'family':
      updates.family = value || null
      break
    case 'lead_time_days':
      updates.lead_time_days = value ? parseInt(value) : null
      break
    case 'notes':
      updates.notes = value ? value.trim() : null
      break
    case 'status':
      updates.status = value || 'active'
      break
    case 'assigned_unit':
      updates.assigned_unit = value || null
      break
    default:
      return false
  }

  try {
    const { error } = await supa.from('products')
      .update(updates)
      .eq('id', product.id)

    if (error) throw error

    Object.assign(product, updates)
    sortProductsByNameSafe(prodState.products)
    requestRender('prod', {
      trigger: 'save',
      renderNow: render,
      isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell(),
      debounceMs: 0
    })
    return true
  } catch (err) {
    console.error('Error updating product:', err)
    showToast('Failed to update product: ' + err.message, 'error')
  }
  return false
}

export async function prodDataDeleteProduct(idx) {
  if (idx < 0 || idx >= prodState.products.length) return false

  const product = prodState.products[idx]

  try {
    const { error } = await supa.from('products').delete().eq('id', product.id)
    if (error) throw error

    prodState.products.splice(idx, 1)
    render()
    return true
  } catch (err) {
    console.error('Error deleting product:', err)
    showToast('Failed to delete product: ' + err.message, 'error')
  }
  return false
}

// ===== BATCH CRUD =====

export async function prodDataAddBatch(productId, workLocation, quantity, startDate, dueDate, status, notes) {
  if (!productId || !workLocation) return false

  const batch = {
    user_id: currentUser.id,
    product_id: productId,
    work_location: workLocation,
    quantity: quantity ? parseInt(quantity) : null,
    start_date: startDate || null,
    due_date: dueDate || null,
    status: status || 'Planned',
    notes: notes ? notes.trim() : null
  }

  try {
    const { data, error } = await supa.from('production_batches').insert([batch]).select()
    if (error) throw error

    if (data && data[0]) {
      prodState.batches.push(data[0])
      render()
      return true
    }
  } catch (err) {
    console.error('Error adding batch:', err)
  }
  return false
}

export async function prodDataUpdateBatch(idx, field, value) {
  if (idx < 0 || idx >= prodState.batches.length) return false

  const batch = prodState.batches[idx]
  const updates = { updated_at: new Date().toISOString() }

  switch (field) {
    case 'product_id':
      updates.product_id = value
      break
    case 'work_location':
      updates.work_location = value || ''
      break
    case 'quantity':
      updates.quantity = value ? parseInt(value) : null
      break
    case 'start_date':
      updates.start_date = value || null
      break
    case 'due_date':
      updates.due_date = value || null
      break
    case 'status':
      updates.status = value || 'Planned'
      break
    case 'notes':
      updates.notes = value ? value.trim() : null
      break
    default:
      return false
  }

  try {
    const { error } = await supa.from('production_batches')
      .update(updates)
      .eq('id', batch.id)

    if (error) throw error

    Object.assign(batch, updates)
    requestRender('prod', {
      trigger: 'save',
      renderNow: render,
      isEditing: typeof isEditingInlineCell === 'function' && isEditingInlineCell(),
      debounceMs: 0
    })
    return true
  } catch (err) {
    console.error('Error updating batch:', err)
  }
  return false
}

export async function prodDataDeleteBatch(idx) {
  if (idx < 0 || idx >= prodState.batches.length) return false

  const batch = prodState.batches[idx]

  try {
    const { error } = await supa.from('production_batches').delete().eq('id', batch.id)
    if (error) throw error

    prodState.batches.splice(idx, 1)
    render()
    return true
  } catch (err) {
    console.error('Error deleting batch:', err)
  }
  return false
}

// ===== HELPERS =====

export function prodDataGetProductName(productId) {
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : []
  const product = products.find(p => p.id === productId)
  return product ? `${product.name} (${product.part_number || 'N/A'})` : 'Unknown Product'
}

export function prodDataGetProductById(productId) {
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : []
  return products.find(p => p.id === productId)
}

export function prodDataGetBatchesByProduct(productId) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : []
  return batches.filter(b => b.product_id === productId)
}

export function prodDataGetBatchesByWorkLocation(workLocation) {
  const batches = (prodState && Array.isArray(prodState.batches)) ? prodState.batches : []
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : []

  return batches.filter(b => {
    const batchLocation = b.work_location
    if (batchLocation === workLocation) return true
    // Fallback to product's work_location if batch doesn't have one
    if (!batchLocation) {
      const product = products.find(p => p.id === b.product_id)
      return product && product.work_location === workLocation
    }
    return false
  })
}

export function prodSetActiveUnit(unit) {
  prodState.activeUnit = unit
}

export function prodSetActiveProduct(productId) {
  prodState.activeProductId = productId || null
}

// ────────────────────────────────────────────────────────────
// Real-Time Sync (Generic System)
// ────────────────────────────────────────────────────────────

export function prodDataSubscribe() {
  if (!currentUser) return

  // Subscribe to production batches changes
  createRealtimeSubscription('production_batches', 'prod_batches_channel', {
    onInsert: (newBatch) => {
      if (!prodState || !Array.isArray(prodState.batches)) return
      if (!prodState.batches.some(b => b.id === newBatch.id)) {
        prodState.batches.push(newBatch)
        requestRender('prod', {
          trigger: 'realtime',
          renderNow: function() {
            if (prodRefreshTabBodyHandler && appState.currentSection === 'production') {
              prodRefreshTabBodyHandler()
            }
          },
          isEditing: isEditingInlineCell()
        })
      }
    },
    onUpdate: (updated) => {
      if (!prodState || !Array.isArray(prodState.batches)) return
      const idx = prodState.batches.findIndex(b => b.id === updated.id)
      if (idx >= 0) {
        prodState.batches[idx] = updated
        requestRender('prod', {
          trigger: 'realtime',
          renderNow: function() {
            if (appState.currentSection !== 'production') return
            const rowInDOM = document.querySelector(`#prod-sched-tbody [data-id="${CSS.escape(String(updated.id))}"]`)
            if (rowInDOM && prodRenderSchedulingRowHandler) {
              const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : []
              const productMap = new Map(products.map(p => [p.id, p]))
              const activeBatches = prodGetFilteredBatchesHandler ? prodGetFilteredBatchesHandler() : prodState.batches
              const batchIdx = activeBatches.indexOf(prodState.batches[idx])
              if (batchIdx >= 0) {
                const allFamilies = getFamilies()
                realtimePatchUpdate('#prod-sched-tbody', updated.id, prodRenderSchedulingRowHandler(prodState.batches[idx], batchIdx, activeBatches, productMap, allFamilies))
              } else if (prodRefreshTabBodyHandler) {
                prodRefreshTabBodyHandler()
              }
            } else if (prodRefreshTabBodyHandler) {
              prodRefreshTabBodyHandler()
            }
          },
          isEditing: isEditingInlineCell()
        })
      }
    },
    onDelete: (deleted) => {
      if (!prodState || !Array.isArray(prodState.batches)) return
      prodState.batches = prodState.batches.filter(b => b.id !== deleted.id)
      requestRender('prod', {
        trigger: 'realtime',
        renderNow: function() {
          if (appState.currentSection === 'production') {
            realtimePatchDelete('#prod-sched-tbody', deleted.id)
            if (prodRefreshTabBodyHandler) prodRefreshTabBodyHandler()
          }
        },
        isEditing: isEditingInlineCell()
      })
    }
  })

  // Subscribe to products changes (from product management)
  createRealtimeSubscription('products', 'prod_products_channel', {
    onInsert: (newProduct) => {
      if (!prodState || !Array.isArray(prodState.products)) return
      if (!prodState.products.some(p => p.id === newProduct.id)) {
        prodState.products.push(newProduct)
        requestRender('prod', {
          trigger: 'realtime',
          renderNow: function() {
            if (prodRefreshTabBodyHandler && appState.currentSection === 'production') {
              prodRefreshTabBodyHandler()
            }
          },
          isEditing: isEditingInlineCell()
        })
      }
    },
    onUpdate: (updated) => {
      if (!prodState || !Array.isArray(prodState.products)) return
      const idx = prodState.products.findIndex(p => p.id === updated.id)
      if (idx >= 0) {
        prodState.products[idx] = updated
        requestRender('prod', {
          trigger: 'realtime',
          renderNow: function() {
            if (prodRefreshTabBodyHandler && appState.currentSection === 'production') {
              prodRefreshTabBodyHandler()
            }
          },
          isEditing: isEditingInlineCell()
        })
      }
    },
    onDelete: (deleted) => {
      if (!prodState || !Array.isArray(prodState.products)) return
      prodState.products = prodState.products.filter(p => p.id !== deleted.id)
      requestRender('prod', {
        trigger: 'realtime',
        renderNow: function() {
          if (prodRefreshTabBodyHandler && appState.currentSection === 'production') {
            prodRefreshTabBodyHandler()
          }
        },
        isEditing: isEditingInlineCell()
      })
    }
  })
}

export function prodDataUnsubscribe() {
  removeRealtimeSubscription('prod_batches_channel')
  removeRealtimeSubscription('prod_products_channel')
}

export const productionDataSubscribe = prodDataSubscribe
export const productionDataUnsubscribe = prodDataUnsubscribe
