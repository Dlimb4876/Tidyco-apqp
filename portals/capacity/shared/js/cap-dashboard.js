/* ============================================================
   cap-dashboard.js — Capacity Dashboard
   ============================================================ */

window.capRenderDashboardTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department) {
  const dept = department || 'ME';
  const monthData = capCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const monthLabel = getMonthLabel(monthKey);

  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  return `
    <div class="me-dashboard">
      <div class="me-dashboard-kpis">
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-dashboard-kpi-value">${(teamArray || []).length}</div>
          <div class="me-dashboard-kpi-label">Team Members</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-dashboard-kpi-value">${capacity}</div>
          <div class="me-dashboard-kpi-label">Capacity (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-dashboard-kpi-value">${demand}</div>
          <div class="me-dashboard-kpi-label">Demand (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-dashboard-kpi-value">${utilisation}%</div>
          <div class="me-dashboard-kpi-label">Utilisation</div>
          <div class="me-dashboard-kpi-sub">${utilisation < 85 ? 'Healthy' : utilisation < 100 ? 'Tight' : 'Over'}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--purple);">
          <div class="me-dashboard-kpi-value">${headroom}</div>
          <div class="me-dashboard-kpi-label">Headroom (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel}</div>
        </div>
      </div>
      <div class="me-dashboard-grid">
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">6-Month Load Forecast</div>
          <div class="me-dashboard-mini-chart">
            <canvas id="meMiniChart" height="200"></canvas>
          </div>
        </div>
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">Current Month Utilisation</div>
          <div class="me-dashboard-mini-heatmap">
            <div id="meMiniHeatmapGrid" class="me-mini-heatmap-grid"></div>
          </div>
        </div>
      </div>
    </div>`;
};

window.capDashboardDrawMiniChart = function(_teamArray, _tasksArray, _productsArray, _holidaysArray) {
  // Mini chart/heatmap rendering is handled by the department orchestrator
};
