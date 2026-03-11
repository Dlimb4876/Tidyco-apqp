/* ============================================================
   me-chart.js — Chart Tab & Utilities
   ============================================================ */

window.meRenderChartTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  // Always show KPIs for current month, not the chart start month
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = meCalculateMonthData(currentMonthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const capacity = currentMonthData.capacity.toFixed(1);
  const demand = currentMonthData.totalDemand.toFixed(1);
  const utilisation = currentMonthData.utilisation;
  const headroom = Math.max(0, currentMonthData.capacity - currentMonthData.totalDemand).toFixed(1);

  const utilisationColor = getUtilisationColor(utilisation);

  const currentMonthLabel = meGetMonthLabel(currentMonthKey);

  // Build breakdown table HTML
  const percentOrZero = (value) => {
    if (currentMonthData.totalDemand === 0) return '0%';
    return ((value / currentMonthData.totalDemand) * 100).toFixed(0) + '%';
  };

  const breakdownRows = `
    <tr>
      <td style="width: 120px;">NPI</td>
      <td style="text-align: right; width: 100px;">${currentMonthData.npi.toFixed(1)} h</td>
      <td style="text-align: right; width: 60px;">${percentOrZero(currentMonthData.npi)}</td>
    </tr>
    <tr>
      <td>Improvement</td>
      <td style="text-align: right;">${currentMonthData.improvement.toFixed(1)} h</td>
      <td style="text-align: right;">${percentOrZero(currentMonthData.improvement)}</td>
    </tr>
    <tr>
      <td>Tendering</td>
      <td style="text-align: right;">${currentMonthData.tendering.toFixed(1)} h</td>
      <td style="text-align: right;">${percentOrZero(currentMonthData.tendering)}</td>
    </tr>
    <tr>
      <td>Support</td>
      <td style="text-align: right;">${currentMonthData.support.toFixed(1)} h</td>
      <td style="text-align: right;">${percentOrZero(currentMonthData.support)}</td>
    </tr>
    <tr>
      <td>Other</td>
      <td style="text-align: right;">${currentMonthData.other.toFixed(1)} h</td>
      <td style="text-align: right;">${percentOrZero(currentMonthData.other)}</td>
    </tr>
    <tr style="border-top: 2px solid var(--line); font-weight: 600;">
      <td>Total Demand</td>
      <td style="text-align: right;">${currentMonthData.totalDemand.toFixed(1)} h</td>
      <td style="text-align: right;">100%</td>
    </tr>
  `;

  return `
    <div class="me-chart-container">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${capacity}</div>
          <div class="me-kpi-label">Team Capacity (hours)</div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${demand}</div>
          <div class="me-kpi-label">Total Demand (hours)</div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-kpi-value">${utilisation}%</div>
          <div class="me-kpi-label">Utilisation</div>
          <div class="me-kpi-month">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${headroom}</div>
          <div class="me-kpi-label">Available Headroom (hours)</div>
          <div class="me-kpi-month">${currentMonthLabel}</div>
        </div>
      </div>

      <div class="me-chart-controls">
        <button class="btn btn-secondary" onclick="meOnPrevMonth()">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${monthKey}" onchange="meOnMonthChange(this.value)" />
        <button class="btn btn-secondary" onclick="meOnNextMonth()">Next →</button>
      </div>

      <div class="me-chart-wrapper">
        <canvas id="meChart" height="300"></canvas>
      </div>

      <div class="me-chart-legend">
        <div class="legend-item"><div class="legend-color" style="background: #1e40af;"></div><span>NPI</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #15803d;"></div><span>Improvement</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #ea580c;"></div><span>Tendering</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #be185d;"></div><span>Support</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #7c3aed;"></div><span>Other</span></div>
        <div class="legend-item" style="margin-left: 30px;"><div class="legend-line" style="background: #ef4444;"></div><span>Team Capacity</span></div>
      </div>

      <div class="me-card" style="margin-top: 24px;">
        <div class="me-card-head">
          <span class="me-card-title">DEMAND BREAKDOWN</span>
          <span style="font-size:12px;color:var(--muted)">${currentMonthLabel}</span>
        </div>
        <div class="me-card-body">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="width: 120px;">Category</th>
                <th style="width: 100px; text-align: right;">Hours</th>
                <th style="width: 60px; text-align: right;">Share</th>
              </tr></thead>
              <tbody>
                ${breakdownRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
};

window.meDrawChartNow = function() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  if (!window.Chart) {
    console.warn('Chart.js not loaded');
    return;
  }

  const canvas = document.getElementById('meChart');
  if (!canvas) return;

  if (meChartInst) meChartInst.destroy();

  const monthKeys = meGetMonthRange(meChartStart, 18);
  const monthLabels = monthKeys.map(m => meGetMonthLabel(m));

  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];
  const capacityData = [];
  const capacityMaxData = [];

  monthKeys.forEach(monthKey => {
    const data = meCalculateMonthData(monthKey, team, tasks, products, holidays);
    npiData.push(data.npi);
    improvementData.push(data.improvement);
    tenderingData.push(data.tendering);
    supportData.push(data.support);
    otherData.push(data.other);
    capacityData.push(data.capacity);
    capacityMaxData.push(data.capacityMax);
  });

  const ctx = canvas.getContext('2d');
  meChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'NPI', data: npiData, backgroundColor: '#1e40af', type: 'bar', order: 2, stack: 'demand' },
        { label: 'Improvement', data: improvementData, backgroundColor: '#15803d', type: 'bar', order: 2, stack: 'demand' },
        { label: 'Tendering', data: tenderingData, backgroundColor: '#ea580c', type: 'bar', order: 2, stack: 'demand' },
        { label: 'Support', data: supportData, backgroundColor: '#be185d', type: 'bar', order: 2, stack: 'demand' },
        { label: 'Other', data: otherData, backgroundColor: '#7c3aed', type: 'bar', order: 2, stack: 'demand' },
        { label: 'Team Capacity', data: capacityData, borderColor: '#ef4444', borderWidth: 3, type: 'line', fill: false, pointRadius: 4, pointBackgroundColor: '#ef4444', tension: 0.3, order: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 15
        }
      },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, padding: 5, color: '#000000' } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#000000' } }
      }
    }
  });
};

// ── Utility Functions ──────────────────────────────────────
// Aliases for backward compatibility - use me-utils.js versions instead
window.meGetMonthLabel = function(monthKey) {
  return getMonthLabel(monthKey);
}

window.meGetMonthRange = function(startMonth, count) {
  return getMonthRange(startMonth, count);
}

// NOTE: meCalculateMonthData, meCountWorkDaysInMonth, meCountWorkDaysBetween
// have been moved to me-calculations.js
