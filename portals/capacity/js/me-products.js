/* ============================================================
   me-products.js — Products Tab Rendering
   ============================================================ */

window.meRenderProductsTab = function(productsArray, availableProducts, tasksArray) {
  // Auto-sync products from product management (status = "Production")
  meDataAutoSyncProductionProducts();
  const updated = meDataGetProducts();
  const tasks = tasksArray || meDataGetTasks();

  const weeksPerMonth = 4.33;
  const totalLoadWeekly = updated.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0).toFixed(1);
  const totalLoadMonthly = (totalLoadWeekly * weeksPerMonth).toFixed(1);
  const today = new Date();
  const activeProducts = updated.filter(p => {
    const from = new Date(p.supportFrom);
    const until = new Date(p.supportUntil);
    return from <= today && today <= until;
  }).length;

  // Calculate total demand (hours from tasks) for each product
  const demandByProduct = {};
  tasks.forEach(task => {
    if (task.productId) {
      if (!demandByProduct[task.productId]) demandByProduct[task.productId] = 0;
      const hours = task.type === 'root' ? (task.advancedEstimation?.totalFinalHours || 0) : (task.totalHours || 0);
      demandByProduct[task.productId] += hours;
    }
  });

  let rows = '';
  updated.forEach((product, idx) => {
    const totalDemand = (demandByProduct[product.id] || 0).toFixed(1);
    rows += `
      <tr>
        <td>${esc(product.name)}</td>
        <td><input type="date" value="${product.supportFrom}" onchange="meDataUpdateProduct(${idx}, 'supportFrom', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportUntil}" onchange="meDataUpdateProduct(${idx}, 'supportUntil', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${product.hoursPerWeek || 0}" step="0.1" onchange="meDataUpdateProduct(${idx}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td style="text-align: right; font-weight: 600; color: var(--blue);">${totalDemand}</td>
        <td><input value="${esc(product.notes || '')}" onchange="meDataUpdateProduct(${idx}, 'notes', this.value); meDebouncedSave();"></td>
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
          <div class="me-kpi-value">${updated.length}</div>
          <div class="me-kpi-label">Total Products</div>
          <div class="me-kpi-month">in production</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:12px;color:var(--muted)">${totalLoadWeekly} h/wk · Auto-synced from Product Management</span>
        </div>
      <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:200px">Product Name</th>
              <th style="width:120px">Support From</th>
              <th style="width:120px">Support Until</th>
              <th style="width:120px">Hours/Week</th>
              <th style="width:100px">Task Demand</th>
              <th style="width:200px">Notes</th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="6"><div style="text-align:center;padding:40px;color:var(--muted)">No production products found</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--muted); padding: 12px 0;">
          💡 Products are automatically loaded from Product Management (status: Production). Edit support dates and hours as needed.
        </div>
      </div>
    </div>
    </div>`;
};
