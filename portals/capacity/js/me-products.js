import { meDataUpdateProduct, meDataAddProduct, meDataDeleteProduct, meDataSyncFromProductManagement } from './me-data.js';
import { meOnSave, meSetTab, meRefreshCurrentTab } from './me-capacity.js';
import { esc } from '../../../utils/js/helpers.js';

export function meRenderProductsTab(productsArray, availableProducts) {
  availableProducts = availableProducts || [];
  const weeksPerMonth = 4.33;
  const totalLoadWeekly = productsArray.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0).toFixed(1);
  const totalLoadMonthly = (totalLoadWeekly * weeksPerMonth).toFixed(1);
  const today = new Date();
  const activeProducts = productsArray.filter(p => {
    const from = new Date(p.supportFrom);
    const until = new Date(p.supportUntil);
    return from <= today && today <= until;
  }).length;

  let rows = '';
  productsArray.forEach((product, idx) => {
    rows += `
      <tr>
        <td><input value="${esc(product.name)}" onchange="meDataUpdateProduct(${idx}, 'name', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportFrom}" onchange="meDataUpdateProduct(${idx}, 'supportFrom', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportUntil}" onchange="meDataUpdateProduct(${idx}, 'supportUntil', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${product.hoursPerWeek || 0}" step="0.1" onchange="meDataUpdateProduct(${idx}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td><input value="${esc(product.notes || '')}" onchange="meDataUpdateProduct(${idx}, 'notes', this.value); meDebouncedSave();"></td>
        <td style="text-align: center;"><button class="me-del-btn" onclick="if(confirm('Delete product?')) { meDataDeleteProduct(${idx}); meOnSave(); meSetTab('products'); }">✕</button></td>
      </tr>`;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalLoadMonthly}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${activeProducts}</div>
          <div class="me-kpi-label">Active Products</div>
          <div class="me-kpi-month">in support</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${productsArray.length}</div>
          <div class="me-kpi-label">Total Products</div>
          <div class="me-kpi-month">tracked</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:12px;color:var(--muted)">${totalLoadWeekly} h/wk</span>
        </div>
      <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:180px">Product/Fleet Name</th>
              <th style="width:110px">Support From</th>
              <th style="width:110px">Support Until</th>
              <th style="width:110px">Hours/Week</th>
              <th style="width:250px">Notes</th>
              <th style="width:36px"></th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="6"><div style="text-align:center;padding:40px;color:var(--muted)">No products added</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="me-add-row">
          ${availableProducts && availableProducts.length > 0 ? `
            <button class="btn btn-ghost btn-sm" onclick="meDataSyncFromProductManagement(); meDebouncedSave(); meRefreshCurrentTab();" title="Pre-populate with non-closed products from Product Management">📥 Load from Product Management</button>
          ` : ''}
          <button class="btn btn-primary btn-sm" onclick="meAddDefaultProduct();">＋ Add Product</button>
        </div>
      </div>
    </div>
    </div>`;
};

export function meAddDefaultProduct() {
  meDataAddProduct('New Product', '', '', 0, '');
  meOnSave();
  meSetTab('products');
};
