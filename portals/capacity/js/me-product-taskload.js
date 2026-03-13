/* ============================================================
   me-product-taskload.js — Product Task Load Tab
   Shows demand calculation per product from task list
   ============================================================ */

// HTML escape utility
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.meRenderProductTaskLoadTab = function(tasksArray, productsArray) {
  const weeksPerMonth = 4.33;

  // Group tasks by productId
  const tasksByProduct = {};
  tasksArray.forEach(task => {
    const productId = task.productId || 'unassigned';
    if (!tasksByProduct[productId]) {
      tasksByProduct[productId] = [];
    }
    tasksByProduct[productId].push(task);
  });

  // Build product load summary
  const productLoads = productsArray.map(product => {
    const tasks = tasksByProduct[product.id] || [];
    const totalHours = tasks.reduce((sum, t) => sum + (t.totalHours || 0), 0);
    const taskCount = tasks.length;

    // Group tasks by category
    const categories = {};
    tasks.forEach(task => {
      const cat = task.category || 'Other';
      if (!categories[cat]) {
        categories[cat] = { count: 0, hours: 0 };
      }
      categories[cat].count += 1;
      categories[cat].hours += parseFloat(task.totalHours) || 0;
    });

    return {
      productId: product.id,
      productName: product.name,
      totalHours,
      taskCount,
      categories,
      tasks,
      hoursPerWeek: product.hoursPerWeek || 0
    };
  });

  // Sort by hours descending
  productLoads.sort((a, b) => b.totalHours - a.totalHours);

  // Calculate totals
  const totalTaskHours = productLoads.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1);
  const totalTasks = tasksArray.length;
  const totalMonthlySupport = (productsArray.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0) * weeksPerMonth).toFixed(1);
  const totalMonthlyLoad = (parseFloat(totalTaskHours) + parseFloat(totalMonthlySupport)).toFixed(1);

  // Unassigned tasks
  const unassignedTasks = tasksByProduct['unassigned'] || [];
  const unassignedHours = unassignedTasks.reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);

  let rows = '';
  productLoads.forEach(load => {
    rows += `
      <tr>
        <td><strong>${esc(load.productName)}</strong></td>
        <td style="text-align: center;">${load.taskCount}</td>
        <td style="text-align: right;">${(load.hoursPerWeek * weeksPerMonth).toFixed(1)}h</td>
        <td style="text-align: right; font-weight: 600; color: var(--blue);">${load.totalHours.toFixed(1)}h</td>
        <td style="text-align: right;">${(parseFloat(load.totalHours) + load.hoursPerWeek * weeksPerMonth).toFixed(1)}h</td>
      </tr>`;
  });

  // Add unassigned row if exists
  if (unassignedHours > 0) {
    rows += `
      <tr style="background: var(--surface-low);">
        <td><em>Unassigned Tasks</em></td>
        <td style="text-align: center;">${unassignedTasks.length}</td>
        <td style="text-align: right;">—</td>
        <td style="text-align: right; font-weight: 600; color: var(--blue);">${unassignedHours}h</td>
        <td style="text-align: right;">${unassignedHours}h</td>
      </tr>`;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalTaskHours}</div>
          <div class="me-kpi-label">Task Demand</div>
          <div class="me-kpi-month">total hours</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${totalMonthlySupport}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${totalMonthlyLoad}</div>
          <div class="me-kpi-label">Total Load</div>
          <div class="me-kpi-month">task + support</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${totalTasks}</div>
          <div class="me-kpi-label">Tasks</div>
          <div class="me-kpi-month">assigned</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCT TASK LOAD ANALYSIS</span>
          <span style="font-size:12px;color:var(--muted)">Demand from ME capacity tasks per product</span>
        </div>
        <div class="me-card-body">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="width:200px">Product</th>
                <th style="width:80px">Tasks</th>
                <th style="width:120px">Support/Month</th>
                <th style="width:120px">Task Demand</th>
                <th style="width:120px">Total Product Demand</th>
              </tr></thead>
              <tbody>
                ${rows || '<tr><td colspan="7"><div style="text-align:center;padding:40px;color:var(--muted)">No tasks assigned to products</div></td></tr>'}
              </tbody>
            </table>
          </div>
          <div style="font-size: 12px; color: var(--muted); padding: 12px 0; margin-top: 12px;">
            💡 Support/Month = support hours per week × 4.33 | Total Load = Task Demand + Support/Month | Task Demand = sum of ME capacity task hours
          </div>
        </div>
      </div>
    </div>
  `;
};
