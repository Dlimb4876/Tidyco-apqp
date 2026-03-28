/* ============================================================
   cap-chart.js — Chart Tab & Utilities
   ============================================================ */

window.capGetChartRefreshText = function() {
  return 'Updates when this chart page is opened';
};

window.capRenderChartTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department) {
  const dept = department || 'ME';
  const refreshText = capGetChartRefreshText();
  const currentMonthData = capCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);

  const capacity = currentMonthData.capacity.toFixed(1);
  const demand = currentMonthData.totalDemand.toFixed(1);
  const utilisation = currentMonthData.utilisation;
  const headroom = Math.max(0, currentMonthData.capacity - currentMonthData.totalDemand).toFixed(1);
  const utilisationColor = getUtilisationColor(utilisation);
  const currentMonthLabel = getMonthLabel(monthKey);
  const monthControls = typeof window.renderMonthPicker === 'function'
    ? window.renderMonthPicker(monthKey)
    : `
      <div class="me-chart-controls">
        <button class="btn btn-secondary" data-cap-action="cap-me-prev-month">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${monthKey}" data-cap-action="cap-me-month-change" />
        <button class="btn btn-secondary" data-cap-action="cap-me-next-month">Next →</button>
      </div>
    `;
  const heatmapPanel = typeof window.capRenderHeatmapTab === 'function'
    ? window.capRenderHeatmapTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, dept)
    : '';

  return `
    <div class="me-chart-container">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left:4px solid var(--green);">
          <div class="me-kpi-label">Available Capacity</div>
          <div class="me-kpi-value">${capacity} <span style="font-size:14px;font-weight:500;color:var(--muted);">h</span></div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--blue);">
          <div class="me-kpi-label">Total Demand</div>
          <div class="me-kpi-value">${demand} <span style="font-size:14px;font-weight:500;color:var(--muted);">h</span></div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid ${utilisationColor};">
          <div class="me-kpi-label">Utilisation</div>
          <div class="me-kpi-value" style="color:${utilisationColor};">${utilisation}%</div>
          <div class="me-kpi-month">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over capacity'}</div>
        </div>
        <div class="me-kpi" style="border-left:4px solid var(--navy);">
          <div class="me-kpi-label">Headroom</div>
          <div class="me-kpi-value">${headroom} <span style="font-size:14px;font-weight:500;color:var(--muted);">h</span></div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
      </div>

      <div class="me-card" style="margin-bottom:20px;">
        <div class="me-card-head">
          <div>
            <div class="me-card-title">TEAM CAPACITY FORECAST</div>
            <div style="font-size:11px;color:var(--muted);">18-Month Outlook · ${dept} Department · ${refreshText}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            ${monthControls}
            <a href="javascript:void(0)" class="me-chart-today-link" data-cap-action="cap-me-today">Today</a>
          </div>
        </div>
        <div class="me-card-body">
          <div class="me-chart-wrapper">
            <canvas id="capChart" height="300"></canvas>
          </div>
          <div style="margin-top:10px;font-size:12px;color:var(--muted);">Selected month: ${currentMonthLabel}</div>
        </div>
      </div>

      ${heatmapPanel}
    </div>`;
};

window.capDrawChartNow = function(teamArray, tasksArray, productsArray, holidaysArray, monthKey, department) {
  if (!window.Chart) {
    console.warn('Chart.js not loaded');
    return;
  }

  const canvas = document.getElementById('capChart');
  if (!canvas) return;

  if (window.capChartInst) window.capChartInst.destroy();

  const monthKeys = getMonthRange(monthKey, 18);
  const monthLabels = monthKeys.map(m => getMonthLabel(m));

  const capacityData = [];
  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];

  monthKeys.forEach(mk => {
    const data = capCalculateMonthData(mk, teamArray, tasksArray, productsArray, holidaysArray);
    capacityData.push(data.capacity);
    npiData.push(data.npi || 0);
    improvementData.push(data.improvement || 0);
    tenderingData.push(data.tendering || 0);
    supportData.push(data.support || 0);
    otherData.push(data.other || 0);
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  window.capChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'NPI',
          data: npiData,
          backgroundColor: '#2563eb',
          stack: 'demand',
          order: 2
        },
        {
          label: 'Improvement',
          data: improvementData,
          backgroundColor: '#16a34a',
          stack: 'demand',
          order: 2
        },
        {
          label: 'Tendering',
          data: tenderingData,
          backgroundColor: '#ea580c',
          stack: 'demand',
          order: 2
        },
        {
          label: 'Support',
          data: supportData,
          backgroundColor: '#0891b2',
          stack: 'demand',
          order: 2
        },
        {
          label: 'Other',
          data: otherData,
          backgroundColor: '#7c3aed',
          stack: 'demand',
          order: 2
        },
        {
          label: 'Team Capacity',
          data: capacityData,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          borderWidth: 2,
          type: 'line',
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: '#dc2626',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
};
