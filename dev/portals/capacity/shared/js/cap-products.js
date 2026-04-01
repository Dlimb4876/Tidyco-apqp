/* ============================================================
   cap-products.js — Products Tab Rendering
   ============================================================ */

import { esc } from '../../../../utils/js/helpers.js'
import { escapeHtml } from './cap-utils.js'
import { getFamilies, findFamilyRecord, db } from '../../../../core/js/state.js'

export const capProductsTableState = {
  ME: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  PM: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  LOG: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} },
  UNIT6: { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} }
}

const capProductsDeps = {
  refreshByDepartment: null,
  getAllProducts: () => [],
  apiByDepartment: {
    ME: {},
    PM: {},
    LOG: {},
    UNIT6: {}
  }
}

export function setCapProductsDependencies(deps = {}) {
  if (Object.prototype.hasOwnProperty.call(deps, 'refreshByDepartment')) {
    capProductsDeps.refreshByDepartment = typeof deps.refreshByDepartment === 'function'
      ? deps.refreshByDepartment
      : null
  }

  if (Object.prototype.hasOwnProperty.call(deps, 'getAllProducts')) {
    capProductsDeps.getAllProducts = typeof deps.getAllProducts === 'function'
      ? deps.getAllProducts
      : () => []
  }

  if (deps.apiByDepartment && typeof deps.apiByDepartment === 'object') {
    ;['ME', 'PM', 'LOG', 'UNIT6'].forEach(key => {
      if (deps.apiByDepartment[key] && typeof deps.apiByDepartment[key] === 'object') {
        capProductsDeps.apiByDepartment[key] = Object.assign({}, capProductsDeps.apiByDepartment[key], deps.apiByDepartment[key])
      }
    })
  }
}

function capProductsNormalizeDepartmentKey(department) {
  const key = (department || 'ME').toString().toUpperCase()
  if (key === 'PM' || key === 'LOG' || key === 'UNIT6') return key
  return 'ME'
}

function capProductsGetState(department) {
  const key = capProductsNormalizeDepartmentKey(department)
  if (!capProductsTableState[key]) {
    capProductsTableState[key] = { search: '', family: 'all', sortBy: 'name', sortDir: 'asc', hiddenStatuses: [], historyOpenProductIds: [], historyEditingId: null, historyEditDraft: null, drafts: {} }
  }
  return capProductsTableState[key]
}

function capProductsRefreshTable(department) {
  if (typeof capProductsDeps.refreshByDepartment === 'function') {
    return capProductsDeps.refreshByDepartment(department)
  }
  return null
}

function capProductsNormalizeRowIndex(rowIndex) {
  const parsed = Number(rowIndex)
  if (!Number.isFinite(parsed) || parsed < 0) return -1
  return Math.trunc(parsed)
}

function capProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId) {
  const keys = []
  if (productId) keys.push(`product:${productId}`)
  if (productDatabaseId) keys.push(`db:${productDatabaseId}`)
  const normalizedRowIndex = capProductsNormalizeRowIndex(rowIndex)
  if (normalizedRowIndex >= 0) keys.push(`row:${normalizedRowIndex}`)
  return keys
}

function capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId) {
  const candidates = capProductsBuildDraftCandidates(productId, rowIndex, productDatabaseId)
  for (let index = 0; index < candidates.length; index += 1) {
    const key = candidates[index]
    if (state.drafts[key]) {
      return { key, value: state.drafts[key], candidates }
    }
  }
  return { key: candidates[0] || null, value: null, candidates }
}

function capProductsEscape(value) {
  return escapeHtml(value == null ? '' : String(value))
}

function capProductsResolveFamily(product) {
  if (!product) return '—'
  const allProducts = capProductsDeps.getAllProducts()
  let dbProduct = null
  if (product.productDatabaseId) {
    dbProduct = allProducts.find(entry => entry && entry.id === product.productDatabaseId) || null
  }
  if (!dbProduct && product.name) {
    dbProduct = allProducts.find(entry => entry && entry.name === product.name) || null
  }
  const familyRef = dbProduct && dbProduct.family ? dbProduct.family : (product.family || product.familyId || '')
  if (!familyRef) return '—'

  const record = findFamilyRecord(familyRef)
  if (record) return record.label || record.name || record.id || familyRef

  const families = getFamilies()
  const match = families.find(entry => entry.id === familyRef || entry.name === familyRef || entry.label === familyRef)
  return match ? (match.label || match.name || match.id || familyRef) : familyRef
}

function capProductsGetApi(department) {
  return capProductsDeps.apiByDepartment[capProductsNormalizeDepartmentKey(department)] || {}
}

function capProductsGetHistoryRows(department, productId) {
  const api = capProductsGetApi(department)
  const rows = typeof api.getHistory === 'function' ? api.getHistory() : []
  return (Array.isArray(rows) ? rows : [])
    .filter(row => row && row.productId === productId)
    .sort((left, right) => {
      const leftDate = left.effectiveDate || ''
      const rightDate = right.effectiveDate || ''
      if (leftDate < rightDate) return -1
      if (leftDate > rightDate) return 1
      return 0
    })
}

function capProductsRoleLabel(department) {
  if (department === 'LOG') return 'Logistics'
  if (department === 'UNIT6') return 'Unit 6'
  if (department === 'PM') return 'Project Management'
  return 'ME'
}

function capProductsHistoryTable(productId, department, historyRows, state, isLogContext) {
  if (!state.historyOpenProductIds.includes(productId)) return ''

  if (!historyRows.length) {
    return `
      <tr class="cap-products-history-row">
        <td colspan="${isLogContext ? 10 : 7}" style="padding:12px 16px;color:var(--muted);">No support history recorded yet for this product.</td>
      </tr>
    `
  }

  return historyRows.map(row => {
    const isEditing = state.historyEditingId === row.id
    if (isEditing) {
      const draft = state.historyEditDraft || row
      return `
        <tr class="cap-products-history-row" data-history-edit-row>
          <td colspan="${isLogContext ? 10 : 7}" style="padding:12px 16px;background:var(--overlay-light);">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <input type="date" autocomplete="off" value="${capProductsEscape(draft.effectiveDate || '')}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="effectiveDate" data-dept="${department}">
              ${isLogContext ? `<input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(draft.kittingHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="kittingHours" data-dept="${department}" placeholder="Kitting">` : ''}
              ${isLogContext ? `<input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(draft.bookingInOutHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="bookingInOutHours" data-dept="${department}" placeholder="Booking In/Out">` : ''}
              ${isLogContext ? `<input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(draft.productMovementHours || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="productMovementHours" data-dept="${department}" placeholder="Product Movement">` : ''}
              <input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(draft.hoursPerWeek || 0)}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="hoursPerWeek" data-dept="${department}" ${isLogContext ? 'readonly' : ''}>
              <input type="text" autocomplete="off" value="${capProductsEscape(draft.changeReason || '')}" data-cap-action="cap-products-history-edit-field" data-history-edit-field="changeReason" data-dept="${department}" placeholder="Reason">
              <button class="btn btn-primary btn-sm" data-cap-action="cap-products-save-history-edit" data-history-id="${row.id}" data-dept="${department}">Save</button>
              <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-cancel-history-edit" data-dept="${department}">Cancel</button>
            </div>
          </td>
        </tr>
      `
    }

    return `
      <tr class="cap-products-history-row">
        <td colspan="${isLogContext ? 10 : 7}" style="padding:12px 16px;background:var(--overlay-light);">
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
            <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
              <span><strong>Effective:</strong> ${capProductsEscape(row.effectiveDate || '—')}</span>
              ${isLogContext ? `<span><strong>Kitting:</strong> ${Number(row.kittingHours || 0).toFixed(1)} h</span>` : ''}
              ${isLogContext ? `<span><strong>Booking In/Out:</strong> ${Number(row.bookingInOutHours || 0).toFixed(1)} h</span>` : ''}
              ${isLogContext ? `<span><strong>Movement:</strong> ${Number(row.productMovementHours || 0).toFixed(1)} h</span>` : ''}
              <span><strong>Hours/Batch:</strong> ${Number(row.hoursPerWeek || 0).toFixed(1)} h</span>
              <span><strong>Reason:</strong> ${capProductsEscape(row.changeReason || '—')}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-edit-history" data-history-id="${row.id}" data-dept="${department}" data-effective-date="${capProductsEscape(row.effectiveDate || '')}" data-hours="${capProductsEscape(row.hoursPerWeek || 0)}" data-reason="${capProductsEscape(row.changeReason || '')}" data-kitting="${capProductsEscape(row.kittingHours || 0)}" data-booking="${capProductsEscape(row.bookingInOutHours || 0)}" data-movement="${capProductsEscape(row.productMovementHours || 0)}">Edit</button>
              <button class="btn btn-danger btn-sm" data-cap-action="cap-products-delete-history" data-history-id="${row.id}" data-dept="${department}">Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

export function capRenderProductsTab(productsArray, tasksArray, department, tableState, allocationsArray = []) {
  const dept = department || 'ME'
  const state = tableState || capProductsGetState(dept)
  const products = Array.isArray(productsArray) ? productsArray : []
  const historyCount = products.reduce((sum, product) => sum + capProductsGetHistoryRows(dept, product.id).length, 0)
  const isLogContext = dept === 'LOG'
  const today = new Date().toISOString().split('T')[0]
  const allocations = Array.isArray(allocationsArray) ? allocationsArray : []

  const rows = products.map((product, index) => {
    const family = capProductsResolveFamily(product)
    const historyRows = capProductsGetHistoryRows(dept, product.id)
    const latestHistory = historyRows.length ? historyRows[historyRows.length - 1] : null
    const status = product.status || 'Active'
    const draft = capProductsGetDraftValue(dept, product.id, index, product.productDatabaseId) || {}
    const kittingHours = Number(draft.kittingHours != null ? draft.kittingHours : (product.kittingHours != null ? product.kittingHours : (latestHistory && latestHistory.kittingHours != null ? latestHistory.kittingHours : 0))) || 0
    const bookingInOutHours = Number(draft.bookingInOutHours != null ? draft.bookingInOutHours : (product.bookingInOutHours != null ? product.bookingInOutHours : (latestHistory && latestHistory.bookingInOutHours != null ? latestHistory.bookingInOutHours : 0))) || 0
    const productMovementHours = Number(draft.productMovementHours != null ? draft.productMovementHours : (product.productMovementHours != null ? product.productMovementHours : (latestHistory && latestHistory.productMovementHours != null ? latestHistory.productMovementHours : 0))) || 0
    const baseHours = draft.hoursPerWeek != null
      ? Number(draft.hoursPerWeek)
      : Number(product.hoursPerWeek != null ? product.hoursPerWeek : (latestHistory ? latestHistory.hoursPerWeek : 0))
    const hoursPerWeek = isLogContext ? (kittingHours + bookingInOutHours + productMovementHours) : (Number.isFinite(baseHours) ? baseHours : 0)
    const effectiveDate = draft.supportEffectiveDate || product.supportEffectiveDate || (latestHistory && latestHistory.effectiveDate) || today
    const changeReason = draft.supportChangeReason || ''

    // Status Indicator Logic
    const hasHours = hoursPerWeek > 0
    const hasAllocations = allocations.some(a => a.productId === product.id && !a.endDate)
    let indicatorColor = 'var(--red)'
    let indicatorTitle = 'Support hours and allocations not set'
    if (hasHours && hasAllocations) {
      indicatorColor = 'var(--green)'
      indicatorTitle = 'Support hours and allocations set'
    } else if (hasHours || hasAllocations) {
      indicatorColor = 'var(--amber)'
      indicatorTitle = hasHours ? 'Support hours set, but allocations missing' : 'Allocations set, but support hours are zero'
    }

    return {
      product,
      index,
      family,
      status,
      historyRows,
      latestHistory,
      hoursPerWeek,
      kittingHours,
      bookingInOutHours,
      productMovementHours,
      effectiveDate,
      changeReason,
      indicatorColor,
      indicatorTitle
    }
  }).filter(row => {
    if (state.family !== 'all' && row.family !== state.family) return false
    if (state.hiddenStatuses.includes(row.status)) return false
    if (!state.search) return true
    return `${row.product.name || ''} ${row.family} ${row.status}`.toLowerCase().includes(state.search.trim().toLowerCase())
  })

  const direction = state.sortDir === 'desc' ? -1 : 1
  rows.sort((left, right) => {
    if (state.sortBy === 'family') return (left.family || '').localeCompare(right.family || '') * direction
    if (state.sortBy === 'hours') return (left.hoursPerWeek - right.hoursPerWeek) * direction
    if (state.sortBy === 'status') return (left.status || '').localeCompare(right.status || '') * direction
    if (state.sortBy === 'kitting') return (left.kittingHours - right.kittingHours) * direction
    if (state.sortBy === 'booking') return (left.bookingInOutHours - right.bookingInOutHours) * direction
    if (state.sortBy === 'movement') return (left.productMovementHours - right.productMovementHours) * direction
    if (state.sortBy === 'updated') {
      const leftDate = left.latestHistory && left.latestHistory.effectiveDate ? left.latestHistory.effectiveDate : ''
      const rightDate = right.latestHistory && right.latestHistory.effectiveDate ? right.latestHistory.effectiveDate : ''
      return leftDate.localeCompare(rightDate) * direction
    }
    return (left.product.name || '').localeCompare(right.product.name || '') * direction
  })

  const familyOptions = Array.from(new Set(products.map(product => capProductsResolveFamily(product)).filter(Boolean).filter(label => label !== '—'))).sort((left, right) => left.localeCompare(right))

  const si = key => state.sortBy === key
    ? (state.sortDir === 'asc' ? ' <span style="font-size:10px;">↑</span>' : ' <span style="font-size:10px;">↓</span>')
    : ' <span style="opacity:0.3;font-size:10px;">↕</span>'

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left:4px solid var(--green);">
          <div class="me-kpi-value">${products.length}</div>
          <div class="me-kpi-label">Products</div>
          <div class="me-kpi-month">${capProductsRoleLabel(dept)} stream</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--blue);">
          <div class="me-kpi-value">${historyCount}</div>
          <div class="me-kpi-label">History Rows</div>
          <div class="me-kpi-month">support changes logged</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--navy);">
          <div class="me-kpi-value">${rows.length}</div>
          <div class="me-kpi-label">Visible</div>
          <div class="me-kpi-month">after filters</div>
        </div>
      </div>
      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:11px;color:var(--muted);">${dept} Department</span>
        </div>
        <div class="me-card-body me-products-card-body">
          <div style="margin-bottom:12px;display:flex;gap:16px;align-items:center;padding:8px 12px;background:var(--overlay-light);border-radius:6px;font-size:12px;">
            <div style="font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">Allocation Status:</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="width:10px;height:10px;border-radius:50%;background:var(--green);"></div>
              <span>Hours & Allocations Set</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="width:10px;height:10px;border-radius:50%;background:var(--amber);"></div>
              <span>Partial (Hours or Allocations)</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="width:10px;height:10px;border-radius:50%;background:var(--red);"></div>
              <span>Not Configured</span>
            </div>
          </div>
          <div class="cap-filter-bar">
            <input type="text" autocomplete="off" value="${capProductsEscape(state.search || '')}" placeholder="Search products" data-cap-action="cap-products-search" data-dept="${dept}">
            <select autocomplete="off" data-cap-action="cap-products-family-filter" data-dept="${dept}">
              <option value="all">All families</option>
              ${familyOptions.map(family => `<option value="${capProductsEscape(family)}" ${state.family === family ? 'selected' : ''}>${capProductsEscape(family)}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" data-cap-action="cap-products-bulk-save" data-dept="${dept}">Bulk Save All Changes</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-clear-filters" data-dept="${dept}">Clear</button>
          </div>
          <table class="tbl" style="width:100%;">
            <thead>
              <tr>
                <th style="width:30px;"></th>
                <th data-cap-action="cap-products-sort-column" data-sort-key="name" data-dept="${dept}" style="cursor:pointer;user-select:none;">Product${si('name')}</th>
                <th data-cap-action="cap-products-sort-column" data-sort-key="status" data-dept="${dept}" style="cursor:pointer;user-select:none;">Status${si('status')}</th>
                <th data-cap-action="cap-products-sort-column" data-sort-key="family" data-dept="${dept}" style="cursor:pointer;user-select:none;">Family${si('family')}</th>
                ${isLogContext ? `<th data-cap-action="cap-products-sort-column" data-sort-key="kitting" data-dept="${dept}" style="cursor:pointer;user-select:none;">Kitting${si('kitting')}</th><th data-cap-action="cap-products-sort-column" data-sort-key="booking" data-dept="${dept}" style="cursor:pointer;user-select:none;">Booking In/Out${si('booking')}</th><th data-cap-action="cap-products-sort-column" data-sort-key="movement" data-dept="${dept}" style="cursor:pointer;user-select:none;">Product Movement${si('movement')}</th>` : ''}
                <th data-cap-action="cap-products-sort-column" data-sort-key="hours" data-dept="${dept}" style="cursor:pointer;user-select:none;">Hours / Batch${si('hours')}</th>
                <th data-cap-action="cap-products-sort-column" data-sort-key="updated" data-dept="${dept}" style="cursor:pointer;user-select:none;">Effective Date${si('updated')}</th>
                <th>Reason</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td colspan="${isLogContext ? 11 : 8}" style="padding:16px;text-align:center;color:var(--muted);">No products match the current filters.</td></tr>` : rows.map(row => `
                <tr data-product-idx="${row.index}" data-product-id="${capProductsEscape(row.product.id || '')}" data-product-db-id="${capProductsEscape(row.product.productDatabaseId || '')}">
                  <td style="text-align:center;"><div style="width:10px;height:10px;border-radius:50%;background:${row.indicatorColor};margin:0 auto;" title="${capProductsEscape(row.indicatorTitle)}"></div></td>
                  <td><div style="font-weight:600;">${capProductsEscape(row.product.name || '(Unnamed product)')}</div></td>
                  <td><span style="font-size:12px;">${capProductsEscape(row.status)}</span></td>
                  <td>${capProductsEscape(row.family)}</td>
                  ${isLogContext ? `<td><input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(row.kittingHours)}" data-cap-action="cap-products-draft" data-field="kittingHours"></td>` : ''}
                  ${isLogContext ? `<td><input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(row.bookingInOutHours)}" data-cap-action="cap-products-draft" data-field="bookingInOutHours"></td>` : ''}
                  ${isLogContext ? `<td><input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(row.productMovementHours)}" data-cap-action="cap-products-draft" data-field="productMovementHours"></td>` : ''}
                  <td><input type="number" step="0.1" autocomplete="off" value="${capProductsEscape(row.hoursPerWeek)}" data-cap-action="cap-products-draft" data-field="hoursPerWeek" ${isLogContext ? 'readonly' : ''}></td>
                  <td><input type="date" autocomplete="off" value="${capProductsEscape(row.effectiveDate)}" data-cap-action="cap-products-draft" data-field="supportEffectiveDate"></td>
                  <td><input type="text" autocomplete="off" value="${capProductsEscape(row.changeReason)}" data-cap-action="cap-products-draft" data-field="supportChangeReason" placeholder="Reason for change"></td>
                  <td>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                      <button class="btn btn-primary btn-sm" data-cap-action="cap-products-apply-hours">Apply</button>
                      <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-toggle-history" data-product-id="${capProductsEscape(row.product.id || '')}" data-dept="${dept}">${state.historyOpenProductIds.includes(row.product.id) ? 'Hide' : 'View'} History (${row.historyRows.length})</button>
                      <button class="btn btn-ghost btn-sm" data-cap-action="cap-products-allocations" data-product-id="${capProductsEscape(row.product.id || '')}" data-dept="${dept}">Allocations (${allocations.filter(a => a.productId === row.product.id).length})</button>
                    </div>
                  </td>
                </tr>
                ${capProductsHistoryTable(row.product.id, dept, row.historyRows, state, isLogContext)}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`
}

export function capProductsUpdateHistoryEditDraft(department, field, value) {
  const state = capProductsGetState(department)
  if (!state.historyEditDraft) return
  state.historyEditDraft[field] = value
}

export function capProductsSetDraftValue(department, productId, rowIndex, patch, productDatabaseId) {
  const state = capProductsGetState(department)
  const resolved = capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId)
  if (!resolved.key) return null
  const current = resolved.value || {}
  state.drafts[resolved.key] = Object.assign({}, current, patch || {})
  resolved.candidates.forEach(candidate => {
    if (candidate !== resolved.key) delete state.drafts[candidate]
  })
  return state.drafts[resolved.key]
}

export function capProductsGetDraftValue(department, productId, rowIndex, productDatabaseId) {
  const state = capProductsGetState(department)
  return capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId).value || null
}

export function capProductsClearDraft(department, productId, rowIndex, productDatabaseId) {
  const state = capProductsGetState(department)
  const resolved = capProductsResolveDraftEntry(state, productId, rowIndex, productDatabaseId)
  resolved.candidates.forEach(candidate => {
    delete state.drafts[candidate]
  })
}

export function capProductsSetSearch(value, department) {
  const state = capProductsGetState(department)
  state.search = (value || '').toString()
  capProductsRefreshTable(department)
}

export function capProductsSetFamilyFilter(value, department) {
  const state = capProductsGetState(department)
  state.family = value || 'all'
  capProductsRefreshTable(department)
}

export function capProductsSetSort(value, department) {
  const state = capProductsGetState(department)
  state.sortBy = value || 'name'
  capProductsRefreshTable(department)
}

export function capProductsSortByColumn(column, department) {
  const state = capProductsGetState(department)
  const nextColumn = (column || '').toString()
  if (!nextColumn) return
  if (state.sortBy === nextColumn) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    state.sortBy = nextColumn
    state.sortDir = 'asc'
  }
  capProductsRefreshTable(department)
}

export function capProductsToggleSortDir(department) {
  const state = capProductsGetState(department)
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  capProductsRefreshTable(department)
}

export function capProductsClearFilters(department) {
  const state = capProductsGetState(department)
  state.search = ''
  state.family = 'all'
  state.sortBy = 'name'
  state.sortDir = 'asc'
  state.hiddenStatuses = []
  state.historyOpenProductIds = []
  capProductsRefreshTable(department)
}

export function capProductsStartHistoryEdit(historyId, entrySnapshot, department) {
  const state = capProductsGetState(department)
  if (!historyId) return
  state.historyEditingId = historyId
  state.historyEditDraft = Object.assign({}, entrySnapshot)
  capProductsRefreshTable(department)
}

export function capProductsCancelHistoryEdit(department) {
  const state = capProductsGetState(department)
  state.historyEditingId = null
  state.historyEditDraft = null
  capProductsRefreshTable(department)
}

export function capProductsSaveHistoryEdit(historyId, department, domRow) {
  const state = capProductsGetState(department)
  if (!state.historyEditDraft || !historyId) return
  const draft = Object.assign({}, state.historyEditDraft)
  if (domRow) {
    const getField = selector => domRow.querySelector(selector)
    const dateEl = getField('[data-history-edit-field="effectiveDate"]')
    const hoursEl = getField('[data-history-edit-field="hoursPerWeek"]')
    const reasonEl = getField('[data-history-edit-field="changeReason"]')
    if (dateEl) draft.effectiveDate = dateEl.value
    if (hoursEl) draft.hoursPerWeek = parseFloat(hoursEl.value) || 0
    if (reasonEl) draft.changeReason = reasonEl.value
    if (department === 'LOG') {
      const kittingEl = getField('[data-history-edit-field="kittingHours"]')
      const bookingEl = getField('[data-history-edit-field="bookingInOutHours"]')
      const movementEl = getField('[data-history-edit-field="productMovementHours"]')
      if (kittingEl) draft.kittingHours = parseFloat(kittingEl.value) || 0
      if (bookingEl) draft.bookingInOutHours = parseFloat(bookingEl.value) || 0
      if (movementEl) draft.productMovementHours = parseFloat(movementEl.value) || 0
      draft.hoursPerWeek = (draft.kittingHours || 0) + (draft.bookingInOutHours || 0) + (draft.productMovementHours || 0)
    }
  }
  if (!draft.effectiveDate) {
    alert('Effective Date is required.')
    return
  }
  if (!draft.changeReason || draft.changeReason.trim().length < 3) {
    alert('Reason must be at least 3 characters.')
    return
  }
  const api = capProductsGetApi(department)
  if (typeof api.updateHistory === 'function') api.updateHistory(historyId, draft)
  state.historyEditingId = null
  state.historyEditDraft = null
  capProductsRefreshTable(department)
  if (typeof api.debouncedSave === 'function') api.debouncedSave()
}

export function capProductsToggleStatusFilter(status, isEnabled, department) {
  const state = capProductsGetState(department)
  const nextHidden = state.hiddenStatuses.filter(entry => entry !== status)
  if (!isEnabled) nextHidden.push(status)
  state.hiddenStatuses = nextHidden
  capProductsRefreshTable(department)
}

export function capProductsToggleHistory(productId, department) {
  const state = capProductsGetState(department)
  const nextOpen = state.historyOpenProductIds.slice()
  const index = nextOpen.indexOf(productId)
  if (index >= 0) nextOpen.splice(index, 1)
  else nextOpen.push(productId)
  state.historyOpenProductIds = nextOpen
  capProductsRefreshTable(department)
}

/* ── Allocation Modal ────────────────────────────────────────
   Dynamically-created modal for managing per-person support
   demand allocation sets on a product.
   ──────────────────────────────────────────────────────────── */

let _allocCtx = null

/**
 * Opens the allocation modal for a product.
 * @param {string} productId
 * @param {string} productName
 * @param {number} hoursPerWeek — total support hours per batch for this product
 * @param {object} deps — { team, allocations, saveSet, refreshTab, department }
 */
export function capOpenAllocationsModal(productId, productName, hoursPerWeek, deps) {
  _allocCtx = {
    productId,
    productName,
    hoursPerWeek: Number(hoursPerWeek) || 0,
    department: deps.department || 'ME',
    team: Array.isArray(deps.team) ? deps.team.filter(t => t && t.id) : [],
    allocations: Array.isArray(deps.allocations) ? deps.allocations : [],
    saveSet: deps.saveSet || null,
    deleteSet: deps.deleteSet || null,
    getAllocations: deps.getAllocations || null,
    reloadAllocations: deps.reloadAllocations || null,
    refreshTab: deps.refreshTab || null,
    formRows: [{ personId: '', percentage: '' }],
    effectiveDate: new Date().toISOString().split('T')[0]
  }
  _allocRender()
}

export function capCloseAllocationsModal() {
  const el = document.getElementById('capAllocationsModal')
  if (el) el.remove()
  _allocCtx = null
}

function _allocPersonName(id) {
  if (!_allocCtx) return 'Unknown'
  const p = _allocCtx.team.find(t => t.id === id)
  return p ? (p.name || 'Unnamed') : 'Unknown'
}

function _allocRender() {
  // Remove previous instance
  const prev = document.getElementById('capAllocationsModal')
  if (prev) prev.remove()
  const ctx = _allocCtx
  if (!ctx) return

  // Current active allocations (no end_date)
  const current = (ctx.allocations || [])
    .filter(a => a.productId === ctx.productId && !a.endDate)
    .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))

  // Past allocations grouped by effective_date
  const past = (ctx.allocations || [])
    .filter(a => a.productId === ctx.productId && a.endDate)
  const pastSets = {}
  past.forEach(a => {
    const key = a.effectiveDate || 'unknown'
    if (!pastSets[key]) pastSets[key] = []
    pastSets[key].push(a)
  })
  const pastKeys = Object.keys(pastSets).sort().reverse()

  // Current split HTML
  let currentHtml
  if (current.length === 0) {
    currentHtml = '<div style="color:var(--muted);font-size:13px;margin:8px 0;">No allocations set yet.</div>'
  } else {
    const totalPct = current.reduce((s, a) => s + (a.percentage || 0), 0)
    const totalHours = current.reduce((s, a) => s + ((a.percentage || 0) / 100 * ctx.hoursPerWeek), 0)
    const colors = ['var(--blue)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--navy)', 'var(--muted)']
    currentHtml = `
      <table class="tbl" style="width:100%;margin:8px 0;">
        <thead><tr><th>Person</th><th style="width:60px;">%</th><th style="width:70px;">Hours</th><th>Since</th></tr></thead>
        <tbody>${current.map(a => `
          <tr>
            <td>${esc(_allocPersonName(a.personId))}</td>
            <td>${Number(a.percentage || 0).toFixed(0)}%</td>
            <td>${((a.percentage || 0) / 100 * ctx.hoursPerWeek).toFixed(1)}h</td>
            <td>${esc(a.effectiveDate || '—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;font-size:12px;color:var(--muted);">
        <span>Total: ${totalPct}%</span>
        <span>${totalHours.toFixed(1)}h / ${ctx.hoursPerWeek.toFixed(1)}h per batch</span>
      </div>
      <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-bottom:12px;">
        ${current.map((a, i) => `<div style="width:${a.percentage || 0}%;background:${colors[i % colors.length]};height:100%;" title="${esc(_allocPersonName(a.personId))}: ${a.percentage}%"></div>`).join('')}
        ${totalPct < 100 ? `<div style="width:${100 - totalPct}%;background:var(--line);height:100%;" title="Unallocated: ${100 - totalPct}%"></div>` : ''}
      </div>`
  }

  // Form rows
  const formRowsHtml = ctx.formRows.map((row, i) => {
    const rowHours = ((Number(row.percentage) || 0) / 100 * ctx.hoursPerWeek)
    return `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;" data-alloc-row="${i}">
      <select data-alloc-field="person" data-alloc-idx="${i}" style="flex:1;">
        <option value="">Select person…</option>
        ${ctx.team.map(t => `<option value="${esc(t.id)}" ${row.personId === t.id ? 'selected' : ''}>${esc(t.name || 'Unnamed')}</option>`).join('')}
      </select>
      <input type="number" min="0" max="100" step="1" value="${row.percentage}" data-alloc-field="pct" data-alloc-idx="${i}" style="width:70px;" placeholder="%">
      <span data-alloc-hours="${i}" style="font-size:12px;color:var(--muted);width:60px;text-align:right;">${rowHours.toFixed(1)}h</span>
      <button class="btn btn-ghost btn-sm" data-alloc-action="remove-row" data-alloc-idx="${i}" ${ctx.formRows.length <= 1 ? 'disabled' : ''}>✕</button>
    </div>`
  }).join('')

  const formTotal = ctx.formRows.reduce((s, r) => s + (Number(r.percentage) || 0), 0)
  const formTotalHours = (formTotal / 100 * ctx.hoursPerWeek)
  const totalColor = formTotal === 100 ? 'var(--green)' : formTotal > 100 ? 'var(--red)' : 'var(--amber)'

  // History HTML — each past set gets a Delete button
  let historyHtml
  if (pastKeys.length === 0) {
    historyHtml = '<div style="color:var(--muted);font-size:13px;margin:8px 0;">No previous sets.</div>'
  } else {
    historyHtml = pastKeys.map(key => {
      const rows = pastSets[key]
      const setTotalHours = rows.reduce((s, a) => s + ((a.percentage || 0) / 100 * ctx.hoursPerWeek), 0)
      return `
        <div style="margin:6px 0;padding:8px;background:var(--overlay-light);border-radius:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="font-weight:600;font-size:12px;">${esc(key)} → ${esc(rows[0]?.endDate || '—')}</div>
            <button class="btn btn-ghost btn-sm" data-alloc-action="delete-history-set" data-alloc-date="${esc(key)}" aria-label="Delete this allocation set" style="color:var(--red);padding:2px 6px;font-size:11px;">Delete</button>
          </div>
          ${rows.map(a => `<div style="font-size:12px;color:var(--ink);">${esc(_allocPersonName(a.personId))}: ${Number(a.percentage || 0).toFixed(0)}% (${((a.percentage || 0) / 100 * ctx.hoursPerWeek).toFixed(1)}h)</div>`).join('')}
          <div style="font-size:11px;color:var(--muted);margin-top:4px;border-top:1px solid var(--line);padding-top:4px;">Total: ${setTotalHours.toFixed(1)}h / ${ctx.hoursPerWeek.toFixed(1)}h</div>
        </div>`
    }).join('')
  }

  const modalHtml = `
    <div class="me-detail-modal" id="capAllocationsModal" role="dialog" aria-modal="true">
      <div class="me-detail-modal-overlay" data-alloc-action="close"></div>
      <div class="me-detail-modal-content" style="max-width:520px;">
        <div class="me-detail-header">
          <div>
            <div class="me-detail-title">Support Allocations</div>
            <div class="me-detail-subtitle">${esc(ctx.productName)}</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-alloc-action="close" aria-label="Close">✕</button>
        </div>
        <div class="me-detail-body" style="max-height:70vh;overflow-y:auto;">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px;">Current Split</div>
          ${currentHtml}

          <div style="font-weight:600;font-size:13px;margin:16px 0 4px;">New Allocation Set</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;">Effective:</label>
            <input type="date" id="allocEffectiveDate" value="${esc(ctx.effectiveDate)}" style="flex:1;">
          </div>
          <div id="allocFormRows">${formRowsHtml}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
            <button class="btn btn-ghost btn-sm" data-alloc-action="add-row">+ Add Person</button>
            <div style="flex:1;"></div>
            <span id="allocTotalLabel" style="font-size:13px;font-weight:600;color:${totalColor};">Total: ${formTotal}% (${formTotalHours.toFixed(1)}h)</span>
          </div>
          <div style="height:6px;border-radius:3px;overflow:hidden;background:var(--line);margin:8px 0 12px;">
            <div id="allocTotalBar" style="width:${Math.min(formTotal, 100)}%;height:100%;background:${totalColor};transition:width 0.2s;"></div>
          </div>
          <button class="btn btn-primary" id="allocSaveBtn" data-alloc-action="save" ${formTotal !== 100 ? 'disabled' : ''} style="width:100%;">Save Allocation Set</button>

          <div style="font-weight:600;font-size:13px;margin:20px 0 4px;">History</div>
          ${historyHtml}
        </div>
      </div>
    </div>`

  document.body.insertAdjacentHTML('beforeend', modalHtml)
  _allocWireListeners()
}

function _allocWireListeners() {
  const modal = document.getElementById('capAllocationsModal')
  if (!modal) return

  modal.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-alloc-action]')
    if (!target) return
    const act = target.getAttribute('data-alloc-action')

    if (act === 'close') {
      capCloseAllocationsModal()
    } else if (act === 'add-row') {
      if (!_allocCtx) return
      _allocCtx.formRows.push({ personId: '', percentage: '' })
      _allocRender()
    } else if (act === 'remove-row') {
      if (!_allocCtx) return
      const idx = Number(target.getAttribute('data-alloc-idx'))
      if (Number.isFinite(idx) && idx >= 0 && idx < _allocCtx.formRows.length) {
        _allocCtx.formRows.splice(idx, 1)
        if (_allocCtx.formRows.length === 0) _allocCtx.formRows.push({ personId: '', percentage: '' })
        _allocRender()
      }
    } else if (act === 'save') {
      _allocSave()
    } else if (act === 'delete-history-set') {
      // Delete a past allocation set from history
      if (!_allocCtx) return
      const dateKey = target.getAttribute('data-alloc-date')
      if (!dateKey) return
      if (!confirm('Delete this allocation history set? This cannot be undone.')) return
      if (typeof _allocCtx.deleteSet !== 'function') return
      target.disabled = true
      try {
        await _allocCtx.deleteSet(_allocCtx.productId, dateKey)
        if (typeof _allocCtx.reloadAllocations === 'function') await _allocCtx.reloadAllocations()
        if (typeof _allocCtx.getAllocations === 'function') _allocCtx.allocations = _allocCtx.getAllocations()
        _allocRender()
      } catch (err) {
        console.error('Failed to delete allocation set:', err)
        alert('Failed to delete. Please try again.')
      } finally {
        target.disabled = false
      }
    }
  })

  // Live-update total on input changes
  modal.addEventListener('input', _allocHandleInput)
  modal.addEventListener('change', _allocHandleInput)
}

function _allocHandleInput(e) {
  const el = e.target
  if (!_allocCtx) return

  // Track effective date
  if (el.id === 'allocEffectiveDate') {
    _allocCtx.effectiveDate = el.value
    return
  }

  const idx = Number(el.getAttribute('data-alloc-idx'))
  if (!Number.isFinite(idx) || idx < 0 || idx >= _allocCtx.formRows.length) return

  const field = el.getAttribute('data-alloc-field')
  if (field === 'person') {
    _allocCtx.formRows[idx].personId = el.value
  } else if (field === 'pct') {
    _allocCtx.formRows[idx].percentage = el.value
    _allocUpdateTotal()
  }
}

function _allocUpdateTotal() {
  const total = _allocCtx ? _allocCtx.formRows.reduce((s, r) => s + (Number(r.percentage) || 0), 0) : 0
  const totalHours = _allocCtx ? (total / 100 * _allocCtx.hoursPerWeek) : 0
  const color = total === 100 ? 'var(--green)' : total > 100 ? 'var(--red)' : 'var(--amber)'
  const label = document.getElementById('allocTotalLabel')
  if (label) { label.textContent = `Total: ${total}% (${totalHours.toFixed(1)}h)`; label.style.color = color }
  const bar = document.getElementById('allocTotalBar')
  if (bar) { bar.style.width = `${Math.min(total, 100)}%`; bar.style.background = color }
  const btn = document.getElementById('allocSaveBtn')
  if (btn) btn.disabled = total !== 100
  
  // Update individual row hours
  if (_allocCtx) {
    _allocCtx.formRows.forEach((row, idx) => {
      const hoursEl = document.querySelector(`[data-alloc-hours="${idx}"]`)
      if (hoursEl) {
        const rowHours = ((Number(row.percentage) || 0) / 100 * _allocCtx.hoursPerWeek)
        hoursEl.textContent = `${rowHours.toFixed(1)}h`
      }
    })
  }
}

async function _allocSave() {
  if (!_allocCtx || typeof _allocCtx.saveSet !== 'function') return

  const total = _allocCtx.formRows.reduce((s, r) => s + (Number(r.percentage) || 0), 0)
  if (total !== 100) {
    alert('Allocations must total exactly 100% before saving.')
    return
  }
  if (!_allocCtx.effectiveDate) {
    alert('Choose an effective date.')
    return
  }

  const personIds = _allocCtx.formRows.map(r => r.personId).filter(Boolean)
  if (new Set(personIds).size !== personIds.length) {
    alert('Each person can only appear once.')
    return
  }
  if (personIds.length === 0) {
    alert('Add at least one person.')
    return
  }

  const rows = _allocCtx.formRows
    .filter(r => r.personId && Number(r.percentage) > 0)
    .map(r => ({ personId: r.personId, percentage: Number(r.percentage), notes: '' }))

  try {
    await _allocCtx.saveSet(_allocCtx.productId, _allocCtx.effectiveDate, rows)
    // Reload allocations from DB so local state is fresh (don't rely on realtime timing)
    if (typeof _allocCtx.reloadAllocations === 'function') {
      await _allocCtx.reloadAllocations()
    }
    if (typeof _allocCtx.getAllocations === 'function') _allocCtx.allocations = _allocCtx.getAllocations()
    if (typeof _allocCtx.refreshTab === 'function') _allocCtx.refreshTab()
  } catch (err) {
    console.error('Failed to save allocation set:', err)
    alert('Failed to save. Please try again.')
    return
  }
  // Only reset form after all operations complete successfully
  _allocCtx.formRows = [{ personId: '', percentage: '' }]
  _allocCtx.effectiveDate = new Date().toISOString().split('T')[0]
  _allocRender()
}

export function capProductsBulkSaveChanges(department) {
  const dept = capProductsNormalizeDepartmentKey(department)
  const api = capProductsGetApi(dept)
  const products = typeof api.getProducts === 'function' ? api.getProducts() : []
  let applied = 0
  products.forEach((product, index) => {
    const draft = capProductsGetDraftValue(dept, product.id, index, product.productDatabaseId)
    if (!draft) return
    const metadata = {
      effectiveDate: draft.supportEffectiveDate || product.supportEffectiveDate || new Date().toISOString().split('T')[0],
      changeReason: draft.supportChangeReason || 'Bulk update',
      kittingHours: draft.kittingHours != null ? Number(draft.kittingHours) : undefined,
      bookingInOutHours: draft.bookingInOutHours != null ? Number(draft.bookingInOutHours) : undefined,
      productMovementHours: draft.productMovementHours != null ? Number(draft.productMovementHours) : undefined
    }
    if (!metadata.effectiveDate || metadata.changeReason.trim().length < 3) return
    let hoursValue = Number(draft.hoursPerWeek)
    if (dept === 'LOG') {
      hoursValue = (metadata.kittingHours || 0) + (metadata.bookingInOutHours || 0) + (metadata.productMovementHours || 0)
    }
    if (!Number.isFinite(hoursValue) || hoursValue < 0) return
    if (typeof api.updateProduct === 'function') {
      api.updateProduct(index, 'hoursPerWeek', String(hoursValue), metadata)
      capProductsClearDraft(dept, product.id, index, product.productDatabaseId)
      applied += 1
    }
  })
  capProductsRefreshTable(dept)
  if (typeof api.debouncedSave === 'function' && applied > 0) api.debouncedSave()
}
