/* ============================================================
   me-dashboard.js — ME Capacity Dashboard
   ============================================================ */

window.meRenderDashboardTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  // Always use current month for dashboard data
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const monthData = meCalculateMonthData(currentMonthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const monthLabel = meGetMonthLabel(currentMonthKey);

  // KPI calculations
  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  // Task summary
  const tasksSorted = tasksArray
    .filter(t => t.startDate && t.endDate)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  const upcomingTasks = tasksSorted
    .filter(t => {
      const endDate = new Date(t.endDate);
      const now = new Date();
      return endDate > now;
    })
    .slice(0, 3);

  const utilisationColor = utilisation < 85 ? 'var(--green)' :
                           utilisation < 100 ? 'var(--amber)' : 'var(--red)';

  return `
    <div class="me-dashboard">
      <!-- Top KPI Row -->
      <div class="me-dashboard-kpis">
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-dashboard-kpi-value">${teamArray.length}</div>
          <div class="me-dashboard-kpi-label">Team Members</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-dashboard-kpi-value">${capacity}</div>
          <div class="me-dashboard-kpi-label">Capacity (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid #f59e0b;">
          <div class="me-dashboard-kpi-value">${demand}</div>
          <div class="me-dashboard-kpi-label">Demand (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-dashboard-kpi-value">${utilisation}%</div>
          <div class="me-dashboard-kpi-label">Utilisation</div>
          <div class="me-dashboard-kpi-sub">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-dashboard-kpi-value">${headroom}</div>
          <div class="me-dashboard-kpi-label">Headroom (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
      </div>

      <!-- 6-Month Capacity Chart & Current Month Heat Map -->
      <div class="me-dashboard-grid">
        <!-- Mini 6-Month Capacity Chart -->
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">6-Month Load Forecast</div>
          <div class="me-dashboard-mini-chart">
            <canvas id="meMiniChart" height="200"></canvas>
          </div>
        </div>

        <!-- Current Month Heat Map -->
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">Current Month Utilisation</div>
          <div class="me-dashboard-mini-heatmap">
            <div id="meMiniHeatmapGrid" class="me-mini-heatmap-grid"></div>
          </div>
        </div>
      </div>

      <!-- Upcoming Tasks -->
      <div class="me-dashboard-card">
        <div class="me-dashboard-card-title">Upcoming Deadlines</div>
        ${upcomingTasks.length > 0 ? `
          <div class="me-dashboard-tasks">
            ${upcomingTasks.map(task => {
              const endDate = new Date(task.endDate);
              const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
              const urgency = daysUntil <= 7 ? 'urgent' : daysUntil <= 14 ? 'warning' : 'normal';
              return `
                <div class="me-task-item ${urgency}">
                  <div class="me-task-details">
                    <div class="me-task-name">${esc(task.name)}</div>
                    <div class="me-task-meta">${daysUntil} days · ${task.totalHours}h · ${task.category || 'Other'}</div>
                  </div>
                  <div class="me-task-date">${task.endDate}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="me-dashboard-empty">No upcoming tasks</div>
        `}
      </div>
    </div>
  `;
};

/**
 * Draw mini 6-month capacity chart on dashboard
 */
window.meDashboardDrawMiniChart = function(teamArray, tasksArray, productsArray, holidaysArray) {
  if (!window.Chart) {
    console.warn('Chart.js not loaded');
    return;
  }

  const canvas = document.getElementById('meMiniChart');
  if (!canvas) return;

  // Destroy existing instance
  if (window.meMiniChartInst) window.meMiniChartInst.destroy();

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // 6-month range from current month
  const monthKeys = meGetMonthRange(currentMonthKey, 6);
  const monthLabels = monthKeys.map(m => meGetMonthLabel(m).join(' '));

  const capacityData = [];
  const demandData = [];

  monthKeys.forEach(monthKey => {
    const data = meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
    capacityData.push(data.capacity);
    demandData.push(data.totalDemand);
  });

  const ctx = canvas.getContext('2d');
  window.meMiniChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'Demand',
          data: demandData,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.7,
          order: 2
        },
        {
          label: 'Capacity',
          data: capacityData,
          type: 'line',
          borderColor: '#1e40af',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#1e40af',
          fill: false,
          tension: 0.3,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'x',
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 }, padding: 8 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 10 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
};

/**
 * Draw mini current month heat map on dashboard
 */
window.meDashboardDrawMiniHeatmap = function(teamArray, tasksArray, holidaysArray) {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const weeks = meGetWeekRange(currentMonthKey, 5);
  const container = document.getElementById('meMiniHeatmapGrid');

  if (!container) return;

  // Build compact grid
  let html = `<div class="me-mini-heatmap-header"></div>`;

  // Week headers
  weeks.forEach(({ start, end }) => {
    const startDate = new Date(start);
    const monthLabel = meGetMonthLabel(start.substring(0, 7));
    const weekLabel = `${startDate.getDate()}`;
    html += `<div class="me-mini-heatmap-week-header">${weekLabel}</div>`;
  });

  // Person rows
  teamArray.forEach(person => {
    if (!person.startDate) return;

    html += `<div class="me-mini-heatmap-person-name">${esc(person.name)}</div>`;

    weeks.forEach(({ start, end }) => {
      const data = meCalcWeekUtilisation(person.id, start, end, tasksArray, holidaysArray);
      const util = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0;

      let bgColor = '#e5e7eb';
      if (data.capacity > 0) {
        bgColor = util < 80 ? '#10b981' : util < 100 ? '#f59e0b' : '#ef4444';
      }

      html += `<div class="me-mini-heatmap-cell" style="background: ${bgColor}; title="${util}%">${util}%</div>`;
    });
  });

  container.innerHTML = `<div class="me-mini-heatmap-grid-content">${html}</div>`;
};

