/**
 * Products Management Portal
 * Main orchestrator for product list, CRUD, and overhaul history tracking
 * Uses inline editing — no modals
 */

import { getFamilies } from '../../../../core/js/state.js'
import { esc, canEdit, showToast } from '../../../../utils/js/helpers.js'
import { render } from '../../../../utils/js/navigation.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { getWorkAreaOptions, workAreasDataGetAll } from '../../../../utils/js/work-areas-helpers.js'
import {
  productsDataGetAll,
  productsDataAddProduct,
  productsDataUpdateProduct,
  productsDataDeleteProduct,
  productsDataGetRelatedDataCounts
} from './products-data.js'
import { renderAllProductsTrends } from './trends-chart.js'

let productsSetProductDevelopmentTab = null

export function setProductsTabSetter(setter) {
  productsSetProductDevelopmentTab = typeof setter === 'function' ? setter : null
}

// Track which product row is currently being edited
let productsEditingId = null;
let productsPortalListenerRoot = null;

// Track which products sub-tab is active so re-renders restore the correct tab
let productsActiveTab = 'list'; // 'list' | 'trends'

export function setProductsActiveTab(tab) {
  productsActiveTab = tab === 'trends' ? 'trends' : 'list'
}

// 1.7 Persist search state across renders
const PRODUCTS_SEARCH_KEY = 'products_search_state';
function loadProductsSearch() {
  try { return localStorage.getItem(PRODUCTS_SEARCH_KEY) || ''; } catch { return ''; }
}
function saveProductsSearch(val) {
  try { localStorage.setItem(PRODUCTS_SEARCH_KEY, val); } catch(e) {
    console.debug('Failed to save products search:', e)
  }
}

const PRODUCTS_FILTERS_KEY = 'products_filters_state';
function getDefaultProductsFilters() {
  return {
    family: 'all',
    location: 'all',
    scope: 'all',
    status: 'all',
    showClosed: false
  };
}
function loadProductsFilters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCTS_FILTERS_KEY) || '{}');
    return { ...getDefaultProductsFilters(), ...parsed };
  } catch {
    return getDefaultProductsFilters();
  }
}
function saveProductsFilters() {
  try { localStorage.setItem(PRODUCTS_FILTERS_KEY, JSON.stringify(productsFilters)); } catch (e) {
    console.debug('Failed to save products filters:', e)
  }
}
let productsFilters = loadProductsFilters();

/**
 * Get products portal HTML
 */
export function renderProductsPortalHTML() {
  const tab = productsActiveTab || 'list';
  return `
    <div class="products-portal" id="productsPortalRoot">
      <div class="products-header">
        <div>
          <h1>Product Management</h1>
          <div class="products-controls">
            <input
              type="text"
              id="productSearch"
              class="search-input"
              placeholder="Search by name, part number, or customer..."
            >
          </div>
        </div>
        <button class="btn btn-ghost" data-action="products-back-root">← Back to Product Development</button>
        <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="product-management" title="User Guide">❓ Guide</button>
      </div>

      <div class="products-tabs">
        <button class="products-tab-btn ${tab === 'list' ? 'active' : ''}" data-action="products-switch-tab" data-tab="list">Product List</button>
        <button class="products-tab-btn ${tab === 'trends' ? 'active' : ''}" data-action="products-switch-tab" data-tab="trends">Overhaul Trends</button>
      </div>

      <div id="productsListTab" class="products-tab-content ${tab === 'list' ? 'active' : ''}">
        <div id="productsTable"></div>
      </div>

      <div id="productsTrendsTab" class="products-tab-content ${tab === 'trends' ? 'active' : ''}">
        <div id="productsTrends"></div>
      </div>
    </div>
  `;
}

/**
 * Setup products portal after rendering
 */
export function renderProductsPortalSetup() {
  setupProductsEventListeners();
  if (productsActiveTab === 'trends') {
    renderProductsTrends();
  } else {
    renderProductsList();
  }
}

/**
 * Build family select options HTML
 */
function buildFamilyOptions(selectedId) {
  return '<option value="">— Family —</option>' +
    getFamilies().map(f =>
      `<option value="${esc(f.id)}" ${f.id === selectedId ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`
    ).join('');
}

/**
 * Build status select options HTML
 */
function buildStatusOptions(selected) {
  return ['Tender', 'NPI', 'Production', 'Closed'].map(s =>
    `<option value="${s}" ${s === selected ? 'selected' : ''}>${s}</option>`
  ).join('');
}

/**
 * Build work location select options HTML
 */
function buildLocationOptions(selected) {
  // Dynamic work areas from database instead of hardcoded list
  return '<option value="">— Location —</option>' +
    getWorkAreaOptions(selected);
}

/**
 * Build scope select options HTML
 */
function buildScopeOptions(selected) {
  const val = selected || 'overhaul';
  return ['overhaul', 'repair', 'assembly'].map(s =>
    `<option value="${s}" ${s === val ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
  ).join('');
}

/**
 * Render products list table with inline add/edit
 */
function renderProductsList() {
  const container = document.getElementById('productsTable');
  if (!container) return;

  const products = productsDataGetAll();
  // 1.7 Restore saved search state if input not already focused
  const searchInput = document.getElementById('productSearch');
  if (searchInput && document.activeElement !== searchInput) {
    const saved = loadProductsSearch();
    if (saved) searchInput.value = saved;
  }
  const searchTerm = (searchInput?.value || '').toLowerCase();
  const families = getFamilies();
  const statusLabelMap = {
    all: 'All Statuses',
    tender: 'Tender',
    npi: 'NPI',
    production: 'Production',
    closed: 'Closed'
  };

  const filtered = products.filter(p => {
    const normalizedStatus = String(p.status || 'Tender').toLowerCase();
    const normalizedScope = String(p.scope || 'overhaul').toLowerCase();

    if (!productsFilters.showClosed && normalizedStatus === 'closed') return false;
    if (productsFilters.status !== 'all' && normalizedStatus !== productsFilters.status) return false;
    if (productsFilters.family !== 'all' && String(p.family || '') !== productsFilters.family) return false;
    if (productsFilters.location !== 'all' && String(p.work_location || '') !== productsFilters.location) return false;
    if (productsFilters.scope !== 'all' && normalizedScope !== productsFilters.scope) return false;

    if (!searchTerm) return true;
    return (p.name || '').toLowerCase().includes(searchTerm) ||
      (p.part_number || '').toLowerCase().includes(searchTerm) ||
      (p.customer || '').toLowerCase().includes(searchTerm);
  });

  const familyFilterOpts = '<option value="all" ' + (productsFilters.family === 'all' ? 'selected' : '') + '>All Families</option>' +
    families.map(f => `<option value="${esc(f.id)}" ${productsFilters.family === f.id ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`).join('');
  // Dynamic work areas from database instead of hardcoded list
  const workAreas = workAreasDataGetAll();
  const locationFilterOpts = '<option value="all" ' + (productsFilters.location === 'all' ? 'selected' : '') + '>All Locations</option>' +
    workAreas.map(w => `<option value="${esc(w.name)}" ${productsFilters.location === w.name ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
  const scopeFilterOpts = ['all', 'overhaul', 'repair', 'assembly'].map(scope => {
    const label = scope === 'all' ? 'All Scopes' : scope.charAt(0).toUpperCase() + scope.slice(1);
    return `<option value="${esc(scope)}" ${productsFilters.scope === scope ? 'selected' : ''}>${esc(label)}</option>`;
  }).join('');
  const statusFilterOpts = Object.entries(statusLabelMap).map(([value, label]) =>
    `<option value="${esc(value)}" ${productsFilters.status === value ? 'selected' : ''}>${esc(label)}</option>`
  ).join('');

  const html = `
    <div class="products-table-wrap">
      <div class="products-controls" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <select id="productsFilterFamily" class="search-input" data-action="products-filter-family">${familyFilterOpts}</select>
        <select id="productsFilterLocation" class="search-input" data-action="products-filter-location">${locationFilterOpts}</select>
        <select id="productsFilterScope" class="search-input" data-action="products-filter-scope">${scopeFilterOpts}</select>
        <select id="productsFilterStatus" class="search-input" data-action="products-filter-status">${statusFilterOpts}</select>
        <button class="btn ${productsFilters.showClosed ? 'btn-primary' : 'btn-ghost'} btn-sm" data-action="products-toggle-closed" title="Show or hide closed products">${productsFilters.showClosed ? 'Hide Closed' : 'Show Closed'}</button>
        <button class="btn btn-ghost btn-sm" data-action="products-clear-filters" title="Clear product filters">Clear Filters</button>
      </div>
      <table class="prod-tbl products-inline-table" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="min-width:200px">
          <col style="min-width:140px">
          <col style="min-width:140px">
          <col style="min-width:100px">
          <col style="min-width:140px">
          <col style="min-width:120px">
          <col style="min-width:120px">
          <col style="min-width:110px">
          <col style="min-width:200px">
          <col style="min-width:100px">
          <col style="min-width:110px">
          <col style="width:80px">
        </colgroup>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Part Number</th>
          <th>Family</th>
          <th>Location</th>
          <th>Customer</th>
          <th class="ctr">Overhaul (hrs)</th>
          <th class="ctr">Turnaround (days)</th>
          <th class="ctr">Unit Value (£)</th>
          <th>Notes</th>
          <th>Status</th>
          <th>Scope</th>
          <th class="ctr">Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- New row (editors/admins only) -->
        ${canEdit() ? `<tr class="row-new" id="productsNewRow" style="background-color:var(--row-highlight-blue);border-top:2px solid var(--chart-blue-lt)">
          <td><input class="cell-edit" id="pNew-name" placeholder="Product name"></td>
          <td><input class="cell-edit" id="pNew-partNumber" placeholder="Part number"></td>
          <td><select class="cell-edit" id="pNew-family">${buildFamilyOptions('')}</select></td>
          <td><select class="cell-edit" id="pNew-location">${buildLocationOptions('')}</select></td>
          <td><input class="cell-edit" id="pNew-customer" placeholder="Customer"></td>
          <td><input class="cell-edit cell-num" id="pNew-hours" type="number" min="0" step="0.5" placeholder="0"></td>
          <td><input class="cell-edit cell-num" id="pNew-turnaround" type="number" min="0" step="1" placeholder="—"></td>
          <td><input class="cell-edit cell-num" id="pNew-unitValue" type="number" min="0" step="0.01" placeholder="100"></td>
          <td><input class="cell-edit" id="pNew-notes" placeholder="Notes"></td>
          <td><select class="cell-edit" id="pNew-status">${buildStatusOptions('Tender')}</select></td>
          <td><select class="cell-edit" id="pNew-scope">${buildScopeOptions('overhaul')}</select></td>
          <td class="w28 ctr">
            <button class="btn-del" title="Add product" data-action="products-add-row">✓</button>
          </td>
        </tr>` : ''}
        ${filtered.length === 0 ? `
          <tr><td colspan="12" style="text-align:center;padding:32px">
            <div style="color:var(--muted);margin-bottom:12px">No products found.</div>
            ${canEdit() ? '<button class="btn btn-primary btn-sm" data-action="products-focus-add">＋ Add First Product</button>' : ''}
          </td></tr>
        ` : filtered.map(p => {
          const familyLabel = p.family ? (getFamilies().find(f => f.id === p.family)?.label || '—') : '—';
          if (productsEditingId === p.id) {
            return `
            <tr class="row-new" style="background-color:var(--row-highlight-amber);border-top:2px solid var(--chart-amber-lt)">
              <td><input class="cell-edit" id="pEdit-name" value="${esc(p.name || '')}"></td>
              <td><input class="cell-edit" id="pEdit-partNumber" value="${esc(p.part_number || '')}"></td>
              <td><select class="cell-edit" id="pEdit-family">${buildFamilyOptions(p.family || '')}</select></td>
              <td><select class="cell-edit" id="pEdit-location">${buildLocationOptions(p.work_location || '')}</select></td>
              <td><input class="cell-edit" id="pEdit-customer" value="${esc(p.customer || '')}"></td>
              <td><span class="cell-display" style="font-variant-numeric:tabular-nums;" title="Overhaul time is maintained automatically via MCS changes and the Overhaul Trends history. Edit is disabled.">${(p.current_overhaul_hours || 0).toFixed(1)} h</span></td>
              <td><input class="cell-edit cell-num" id="pEdit-turnaround" type="number" min="0" step="1" value="${p.turnaround_days || ''}"></td>
              <td><input class="cell-edit cell-num" id="pEdit-unitValue" type="number" min="0" step="0.01" value="${p.unit_value != null ? p.unit_value : 100}"></td>
              <td><input class="cell-edit" id="pEdit-notes" value="${esc(p.notes || '')}"></td>
              <td><select class="cell-edit" id="pEdit-status">${buildStatusOptions(p.status || 'Tender')}</select></td>
              <td><select class="cell-edit" id="pEdit-scope">${buildScopeOptions(p.scope || 'overhaul')}</select></td>
              <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
                <button class="btn-del" title="Save" data-action="products-save-edit" data-product-id="${esc(p.id)}">✓</button>
                <button class="btn-del" title="Cancel" data-action="products-cancel-edit">✕</button>
              </td>
            </tr>`;
          }
          return `
          <tr>
            <td>${esc(p.name)}</td>
            <td><strong>${esc(p.part_number || '')}</strong></td>
            <td>${esc(familyLabel)}</td>
            <td>${esc(p.work_location || '—')}</td>
            <td>${esc(p.customer || '')}</td>
            <td class="ctr">${(p.current_overhaul_hours || 0).toFixed(1)}</td>
            <td class="ctr">${p.turnaround_days ? Math.round(p.turnaround_days) : '—'}</td>
            <td class="ctr">£${p.unit_value != null ? Number(p.unit_value).toFixed(2) : '100.00'}</td>
            <td><div class="cell-display" title="${esc(p.notes || '')}">${p.notes ? esc(p.notes).substring(0, 40) + (p.notes.length > 40 ? '…' : '') : '—'}</div></td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td><span class="badge badge-scope-${esc(p.scope || 'overhaul')}">${(p.scope || 'overhaul').charAt(0).toUpperCase() + (p.scope || 'overhaul').slice(1)}</span></td>
            <td class="w28 ctr" style="display:flex;gap:4px;justify-content:center">
              ${canEdit() ? `<button class="btn-del" title="Edit" data-action="products-start-edit" data-product-id="${esc(p.id)}">✏️</button>
              <button class="btn-del" title="Delete" data-action="products-delete-row" data-product-id="${esc(p.id)}" data-product-name="${esc(p.name)}">🗑️</button>` : ''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Add new product from the new row inputs
 */
async function productsAddRow() {
  const name = document.getElementById('pNew-name')?.value.trim();
  const partNumber = document.getElementById('pNew-partNumber')?.value.trim();
  const customer = document.getElementById('pNew-customer')?.value.trim();

  if (!name) {
    document.getElementById('pNew-name')?.focus();
    return;
  }

  const productData = {
    name,
    part_number: partNumber || '',
    family: document.getElementById('pNew-family')?.value || '',
    work_location: document.getElementById('pNew-location')?.value || null,
    customer: customer || '',
    current_overhaul_hours: parseFloat(document.getElementById('pNew-hours')?.value) || 0,
    turnaround_days: parseFloat(document.getElementById('pNew-turnaround')?.value) || null,
    notes: document.getElementById('pNew-notes')?.value.trim() || '',
    status: document.getElementById('pNew-status')?.value || 'Tender',
    scope: document.getElementById('pNew-scope')?.value || 'overhaul',
    unit_value: parseFloat(document.getElementById('pNew-unitValue')?.value) || 100
  };

  try {
    await productsDataAddProduct(productData);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts()
    // 1.6 Clear fields for quick sequential entry; keep family/location/status
    const resetFields = {
      'pNew-name': '', 'pNew-partNumber': '', 'pNew-customer': '',
      'pNew-notes': '', 'pNew-hours': '0', 'pNew-turnaround': ''
    };
    Object.entries(resetFields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
    renderProductsList();
    // Return focus to name for next entry
    document.getElementById('pNew-name')?.focus();
    // Brief highlight on add row
    const newRow = document.getElementById('productsNewRow');
    if (newRow) {
      newRow.style.backgroundColor = 'var(--field-highlight)';
      setTimeout(() => { newRow.style.backgroundColor = ''; }, 500);
    }
  } catch (err) {
    showToast('Error adding product: ' + err.message, 'error');
  }
}

/**
 * Start editing a product row inline
 */
function productsStartEdit(productId) {
  productsEditingId = productId;
  renderProductsList();
  document.getElementById('pEdit-name')?.focus();
}

/**
 * Save inline edit
 */
async function productsSaveEdit(productId) {
  const name = document.getElementById('pEdit-name')?.value.trim();
  if (!name) {
    document.getElementById('pEdit-name')?.focus();
    return;
  }

  const updates = {
    name,
    part_number: document.getElementById('pEdit-partNumber')?.value.trim() || '',
    family: document.getElementById('pEdit-family')?.value || '',
    work_location: document.getElementById('pEdit-location')?.value || null,
    customer: document.getElementById('pEdit-customer')?.value.trim() || '',

    turnaround_days: parseFloat(document.getElementById('pEdit-turnaround')?.value) || null,
    notes: document.getElementById('pEdit-notes')?.value.trim() || '',
    status: document.getElementById('pEdit-status')?.value || 'Tender',
    scope: document.getElementById('pEdit-scope')?.value || 'overhaul',
    unit_value: parseFloat(document.getElementById('pEdit-unitValue')?.value) || 100
  };

  try {
    await productsDataUpdateProduct(productId, updates);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts()
  } catch (err) {
    showToast('Error saving product: ' + err.message, 'error');
  }

  productsEditingId = null;
  renderProductsList();
}

/**
 * Cancel inline edit
 */
function productsCancelEdit() {
  productsEditingId = null;
  renderProductsList();
}

/**
 * Delete a product with enhanced confirmation
 */
async function productsDeleteRow(productId, productName) {
  // First confirmation - basic warning
  if (!confirm(`Delete product "${productName}"?\n\nThis will also delete all related data including NPI projects, APQP data, BOM, Gates, Actions, Risks, and ME capacity records.\n\nAre you sure you want to continue?`)) {
    return;
  }

  // Get counts of related data
  let counts = null;
  try {
    counts = await productsDataGetRelatedDataCounts(productId)
  } catch (err) {
    console.warn('Could not fetch related data counts:', err);
  }

  // Second confirmation - detailed warning with counts
  let detailedMessage = `⚠️ PERMANENT DELETION WARNING ⚠️\n\n`;
  detailedMessage += `Product: "${productName}"\n\n`;
  detailedMessage += `This will PERMANENTLY delete:\n`;

  if (counts) {
    if (counts.overhaulHistory > 0) {
      detailedMessage += `• ${counts.overhaulHistory} overhaul history record${counts.overhaulHistory === 1 ? '' : 's'}\n`;
    }
    if (counts.npiProjects > 0) {
      detailedMessage += `• ${counts.npiProjects} NPI project${counts.npiProjects === 1 ? '' : 's'} (including all APQP, PFMEA, BOM, Gates, Actions, Risks, CTQ, Documents, Gantt data)\n`;
    }
    if (counts.meProducts > 0) {
      detailedMessage += `• ${counts.meProducts} ME capacity support record${counts.meProducts === 1 ? '' : 's'}\n`;
    }
    if (counts.meTasks > 0) {
      detailedMessage += `• ${counts.meTasks} ME task${counts.meTasks === 1 ? '' : 's'}\n`;
    }

    const totalItems = counts.overhaulHistory + counts.npiProjects + counts.meProducts + counts.meTasks;
    if (totalItems === 0) {
      detailedMessage += `• The product record (no related data found)\n`;
    }
  } else {
    detailedMessage += `• All overhaul history records\n`;
    detailedMessage += `• All linked NPI projects and their data\n`;
    detailedMessage += `• All ME capacity records\n`;
  }

  detailedMessage += `\n❌ THIS CANNOT BE UNDONE ❌\n\n`;
  detailedMessage += `Type the product name to confirm deletion.`;

  // Show detailed confirmation
  const userInput = prompt(detailedMessage);

  if (userInput !== productName) {
    if (userInput !== null) {
      showToast('Deletion cancelled - product name did not match', 'info');
    }
    return;
  }

  // Perform deletion with loading indicator
  try {
    showToast('Deleting product and all related data...', 'info');
    await productsDataDeleteProduct(productId);
    if (typeof prodDataReloadProducts === 'function') await prodDataReloadProducts()
    if (productsEditingId === productId) productsEditingId = null;
    renderProductsList();
    showToast(`Product "${productName}" and all related data deleted successfully`, 'success');
  } catch (err) {
    showToast('Error deleting product: ' + err.message, 'error');
  }
}

/**
 * Render overhaul trends visualization
 */
function renderProductsTrends() {
  renderAllProductsTrends();
}

/**
 * Setup event listeners
 */
function setupProductsEventListeners() {
  const root = document.getElementById('productsPortalRoot');
  if (root && productsPortalListenerRoot !== root) {
    productsPortalListenerRoot = root;
    root.addEventListener('click', async (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl || !root.contains(actionEl)) return;

      const action = actionEl.dataset.action;

      if (action === 'products-back-root') {
        if (productsSetProductDevelopmentTab) productsSetProductDevelopmentTab('root')
        render();
        return;
      }

      if (action === 'products-switch-tab') {
        const tab = actionEl.dataset.tab;
        if (!tab) return;

        productsActiveTab = tab;
        document.querySelectorAll('.products-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.products-tab-content').forEach(c => c.classList.remove('active'));
        actionEl.classList.add('active');
        document.getElementById(`products${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`)?.classList.add('active');

        if (tab === 'trends') {
          renderProductsTrends();
        } else {
          renderProductsList();
        }
        return;
      }

      if (action === 'products-add-row') {
        await productsAddRow();
        return;
      }

      if (action === 'products-save-edit') {
        await productsSaveEdit(actionEl.dataset.productId || '');
        return;
      }

      if (action === 'products-cancel-edit') {
        productsCancelEdit();
        return;
      }

      if (action === 'products-start-edit') {
        productsStartEdit(actionEl.dataset.productId || '');
        return;
      }

      if (action === 'products-delete-row') {
        await productsDeleteRow(actionEl.dataset.productId || '', actionEl.dataset.productName || '');
      }

      if (action === 'products-toggle-closed') {
        productsFilters.showClosed = !productsFilters.showClosed;
        saveProductsFilters();
        renderProductsList();
        return;
      }

      if (action === 'products-clear-filters') {
        productsFilters = getDefaultProductsFilters();
        saveProductsFilters();
        renderProductsList();
        return;
      }

      if (action === 'products-focus-add') {
        document.getElementById('pNew-name')?.focus();
      }

      if (action === 'show-guide') {
        const key = actionEl.dataset.guideKey;
        if (key && typeof showGuide === 'function') showGuide(key);
      }
    });
  }

  // Search — save state for persistence (1.7)
  document.getElementById('productSearch')?.addEventListener('input', (e) => {
    saveProductsSearch(e.target.value);
    renderProductsList();
  });

  root?.addEventListener('change', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !root.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    if (action === 'products-filter-family') {
      productsFilters.family = actionEl.value || 'all';
      saveProductsFilters();
      renderProductsList();
      return;
    }
    if (action === 'products-filter-location') {
      productsFilters.location = actionEl.value || 'all';
      saveProductsFilters();
      renderProductsList();
      return;
    }
    if (action === 'products-filter-scope') {
      productsFilters.scope = actionEl.value || 'all';
      saveProductsFilters();
      renderProductsList();
      return;
    }
    if (action === 'products-filter-status') {
      productsFilters.status = actionEl.value || 'all';
      if (productsFilters.status === 'closed') {
        productsFilters.showClosed = true;
      }
      saveProductsFilters();
      renderProductsList();
    }
  });

  // Allow Enter key on new row inputs to trigger add
  ['pNew-name', 'pNew-partNumber', 'pNew-customer', 'pNew-hours', 'pNew-turnaround', 'pNew-notes'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') productsAddRow();
    });
  });
}
