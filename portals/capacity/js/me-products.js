/* ============================================================
   me-products.js — Products Tab Rendering
   ============================================================ */

window.meRenderProductsTab = function(productsArray, availableProducts, tasksArray) {
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
    const taskCount = tasks.filter(t => t.productId === product.id).length;
    const taskDemand = demandByProduct[product.id] || 0;
    const supportPerMonth = ((product.hoursPerWeek || 0) * weeksPerMonth).toFixed(1);
    const totalLoad = (taskDemand + parseFloat(supportPerMonth)).toFixed(1);

    rows += `
      <tr>
        <td>${esc(product.name)}</td>
        <td style="text-align:center">${taskCount}</td>
        <td style="text-align:right">${taskDemand.toFixed(1)} h</td>
        <td style="text-align:right">${supportPerMonth} h</td>
        <td style="text-align:right; font-weight:bold">${totalLoad} h</td>
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
          <span style="font-size:12px;color:var(--muted)">${totalLoadWeekly} h/wk</span>
        </div>
      <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:200px">PRODUCT</th>
              <th style="width:80px;text-align:center">TASKS</th>
              <th style="width:120px;text-align:right">TASK DEMAND</th>
              <th style="width:120px;text-align:right">SUPPORT/MONTH</th>
              <th style="width:120px;text-align:right">TOTAL LOAD</th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="5"><div style="text-align:center;padding:40px;color:var(--muted)">No production products found</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div style="font-size: 12px; color: var(--muted); padding: 12px 0;">
          💡 Products are synced from the Product Management database. Task Demand is calculated from assigned tasks. Support/Month and Total Load are shown for capacity planning.
        </div>
      </div>
    </div>
    </div>`;
};
