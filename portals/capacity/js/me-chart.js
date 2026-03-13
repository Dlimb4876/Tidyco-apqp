/* ============================================================
   me-chart.js — Chart Tab & Utilities
   ============================================================ */

window.meRenderChartTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  // KPIs always reflect the current calendar month
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = meCalculateMonthData(currentMonthKey, teamArray, tasksArray, productsArray, holidaysArray);

  const capacity    = currentMonthData.capacity.toFixed(1);
  const demand      = currentMonthData.totalDemand.toFixed(1);
  const utilisation = currentMonthData.utilisation;
  const headroom    = Math.max(0, currentMonthData.capacity - currentMonthData.totalDemand).toFixed(1);

  const utilisationColor = getUtilisationColor(utilisation);
  const currentMonthLabel = meGetMonthLabel(currentMonthKey);

  // ── Demand breakdown rows ──────────────────────────────────
  const pct = (v) => currentMonthData.totalDemand === 0 ? '—' : ((v / currentMonthData.totalDemand) * 100).toFixed(0) + '%';

  const breakdownRows = `
    <tr>
      <td>NPI</td>
      <td style="text-align:right;">${currentMonthData.npi.toFixed(1)} h</td>
      <td style="text-align:right;">${pct(currentMonthData.npi)}</td>
    </tr>
    <tr>
      <td>Improvement</td>
      <td style="text-align:right;">${currentMonthData.improvement.toFixed(1)} h</td>
      <td style="text-align:right;">${pct(currentMonthData.improvement)}</td>
    </tr>
    <tr>
      <td>Tendering</td>
      <td style="text-align:right;">${currentMonthData.tendering.toFixed(1)} h</td>
      <td style="text-align:right;">${pct(currentMonthData.tendering)}</td>
    </tr>
    <tr>
      <td>Support</td>
      <td style="text-align:right;">${currentMonthData.support.toFixed(1)} h</td>
      <td style="text-align:right;">${pct(currentMonthData.support)}</td>
    </tr>
    <tr>
      <td>Other</td>
      <td style="text-align:right;">${currentMonthData.other.toFixed(1)} h</td>
      <td style="text-align:right;">${pct(currentMonthData.other)}</td>
    </tr>
    <tr style="border-top:2px solid var(--line);font-weight:700;background:#fafbfd;">
      <td>Total Demand</td>
      <td style="text-align:right;">${currentMonthData.totalDemand.toFixed(1)} h</td>
      <td style="text-align:right;">100%</td>
    </tr>
  `;

  // ── Per-engineer capacity rows ─────────────────────────────
  // NOTE: members without a startDate are excluded here to match meCalculateMonthData
  // (fixes mismatch between KPI totals and table totals)
  const [currentYear, currentMonthNum] = currentMonthKey.split('-').map(Number);
  const monthStart  = new Date(currentYear, currentMonthNum - 1, 1);
  const monthEnd    = new Date(currentYear, currentMonthNum, 0);
  const bankHolSet  = new Set(getBankHolidaysForYear(currentYear).map(h => h.date));

  let teamCapacityTotal = 0;
  const memberCapacityRows = teamArray.map(member => {
    if (!member || !member.id) return null;
    if (!member.startDate) return null;   // must match meCalculateMonthData exclusion logic

    const memberName    = escapeHtml(member.name || 'Unnamed');
    const hoursPerWeek  = meGetHoursPerWeek(member.hoursPerWeek);
    const utilisationPct = member.utilisation || 80;

    let activeStart = new Date(Math.max(monthStart, new Date(member.startDate)));
    let activeEnd   = monthEnd;
    if (member.endDate) {
      activeEnd = new Date(Math.min(monthEnd, new Date(member.endDate)));
    }

    if (activeStart > activeEnd) {
      // Member not active this month — show zero row but don't add to total
      return `
        <tr>
          <td>${memberName}</td>
          <td style="text-align:right;">${utilisationPct}%</td>
          <td style="text-align:right;">0</td>
          <td style="text-align:right;">—</td>
          <td style="text-align:right;">0.0 h</td>
          <td style="text-align:right;font-weight:600;color:var(--muted);">0.0 h</td>
        </tr>
      `;
    }

    const netDays    = countNetworkDaysBetween(activeStart, activeEnd, bankHolSet);
    const totalHours = hoursPerWeek * (netDays / 5);

    // Count holiday days — deducted from gross (1 day = 8h) BEFORE utilisation is applied
    let holidayDays = 0;
    holidaysArray.forEach(holiday => {
      if (!holiday || holiday.personId !== member.id || !holiday.date) return;
      if (holiday.date.substring(0, 7) !== currentMonthKey) return;

      const hd = new Date(holiday.date);
      hd.setHours(0, 0, 0, 0);
      const dow = hd.getDay();
      if (dow === 0 || dow === 6) return;

      const hdStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
      if (bankHolSet.has(hdStr)) return;
      if (hd < activeStart || hd > activeEnd) return;

      if (holiday.type === 'full')      holidayDays += 1;
      else if (holiday.type === 'half') holidayDays += 0.5;
    });

    const adjustedTotal  = Math.max(0, totalHours - holidayDays * 8);
    const utilisedHours  = adjustedTotal * (utilisationPct / 100);
    teamCapacityTotal += utilisedHours;

    return `
      <tr>
        <td>${memberName}</td>
        <td style="text-align:right;">${utilisationPct}%</td>
        <td style="text-align:right;">${netDays}</td>
        <td style="text-align:right;">${holidayDays > 0 ? holidayDays + ' d' : '—'}</td>
        <td style="text-align:right;">${totalHours.toFixed(1)} h</td>
        <td style="text-align:right;font-weight:600;">${utilisedHours.toFixed(1)} h</td>
      </tr>
    `;
  }).filter(Boolean);

  const memberCapacityTableBody = memberCapacityRows.length
    ? memberCapacityRows.join('') + `
      <tr style="border-top:2px solid var(--line);font-weight:700;background:#fafbfd;">
        <td colspan="5">Total Available (after holidays &amp; utilisation)</td>
        <td style="text-align:right;">${teamCapacityTotal.toFixed(1)} h</td>
      </tr>
    `
    : `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--muted);padding:20px;font-style:italic;">
          No engineers with a start date set — add start dates on the Team tab.
        </td>
      </tr>
    `;

  const heatmapPanelHtml = typeof meRenderHeatmapPanel === 'function'
    ? meRenderHeatmapPanel(monthKey)
    : '';

  return `
    <div class="me-chart-container">

      <!-- ── KPI Strip ── -->
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

      <!-- ── Chart Card (DO NOT MODIFY CHART INTERNALS) ── -->
      <div class="me-card" style="margin-bottom:20px;">
        <div class="me-card-head" style="flex-wrap:wrap;gap:12px;padding:12px 16px;">
          <div>
            <div class="me-card-title">TEAM CAPACITY FORECAST</div>
            <div style="font-size:11px;color:var(--muted);margin-top:3px;font-weight:400;">18-Month Outlook &nbsp;·&nbsp; Stacked demand by category vs. available capacity</div>
          </div>
          <div class="me-chart-ctrl-left">
            <button class="btn btn-secondary btn-sm" onclick="meOnPrevMonth()">← Prev</button>
            <input type="month" id="meChartMonthInput" value="${monthKey}" onchange="meOnMonthChange(this.value)" />
            <button class="btn btn-secondary btn-sm" onclick="meOnNextMonth()">Next →</button>
            <a href="javascript:void(0)" class="me-chart-today-link" onclick="meOnTodayClick()">Today</a>
          </div>
        </div>
        <div class="me-card-body" style="padding:16px;">
          <div class="me-chart-wrapper">
            <canvas id="meChart" height="300"></canvas>
          </div>
          <div class="me-chart-legend">
            <div class="legend-item"><div class="legend-color" style="background:#1e40af;"></div><span>NPI</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#15803d;"></div><span>Improvement</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#ea580c;"></div><span>Tendering</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#be185d;"></div><span>Support</span></div>
            <div class="legend-item"><div class="legend-color" style="background:#7c3aed;"></div><span>Other</span></div>
            <div class="legend-item" style="margin-left:24px;"><div class="legend-line" style="background:#ef4444;"></div><span>Team Capacity</span></div>
          </div>
        </div>
      </div>

      <!-- ── Lower Grid: breakdown + per-engineer ── -->
      <div class="me-chart-lower-grid">

        <div class="me-card">
          <div class="me-card-head">
            <span class="me-card-title">DEMAND BREAKDOWN</span>
            <span style="font-size:11px;color:var(--muted);">${currentMonthLabel}</span>
          </div>
          <div class="me-card-body">
            <div class="me-tbl-wrap">
              <table class="me-tbl">
                <thead><tr>
                  <th>Category</th>
                  <th style="text-align:right;">Hours</th>
                  <th style="text-align:right;">Share</th>
                </tr></thead>
                <tbody>${breakdownRows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="me-card">
          <div class="me-card-head">
            <span class="me-card-title">CAPACITY PER ENGINEER</span>
            <span style="font-size:11px;color:var(--muted);">${currentMonthLabel}</span>
          </div>
          <div class="me-card-body">
            <div class="me-tbl-wrap">
              <table class="me-tbl">
                <thead><tr>
                  <th>Engineer</th>
                  <th style="text-align:right;">Util %</th>
                  <th style="text-align:right;">Working Days</th>
                  <th style="text-align:right;">Holiday (days)</th>
                  <th style="text-align:right;">Gross (h)</th>
                  <th style="text-align:right;">Available (h)</th>
                </tr></thead>
                <tbody>${memberCapacityTableBody}</tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      ${heatmapPanelHtml}

    </div>
  `;
};

window.meDrawChartNow = function() {
  const dept = window.meCurrentDepartmentContext || 'ME';
  const team     = meFilterByDepartment(meDataGetTeam(),     dept, 'ME');
  const tasks    = meFilterByDepartment(meDataGetTasks(),    dept, 'ME');
  const products = meFilterByDepartment(meDataGetProducts(), dept, 'ME');
  const holidays = meFilterByDepartment(meDataGetHolidays(), dept, 'ME');

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

  // Create gradient colors for bars
  const gradientNPI = ctx.createLinearGradient(0, 0, 0, 200);
  gradientNPI.addColorStop(0, '#1e40af');
  gradientNPI.addColorStop(1, '#3b82f6');

  const gradientImprovement = ctx.createLinearGradient(0, 0, 0, 200);
  gradientImprovement.addColorStop(0, '#15803d');
  gradientImprovement.addColorStop(1, '#4ade80');

  const gradientTendering = ctx.createLinearGradient(0, 0, 0, 200);
  gradientTendering.addColorStop(0, '#ea580c');
  gradientTendering.addColorStop(1, '#fb923c');

  const gradientSupport = ctx.createLinearGradient(0, 0, 0, 200);
  gradientSupport.addColorStop(0, '#be185d');
  gradientSupport.addColorStop(1, '#ec4899');

  const gradientOther = ctx.createLinearGradient(0, 0, 0, 200);
  gradientOther.addColorStop(0, '#7c3aed');
  gradientOther.addColorStop(1, '#a78bfa');

  // Calculate total demand for each month (for tooltip percentages)
  const totalDemandByMonth = monthKeys.map((_, idx) =>
    npiData[idx] + improvementData[idx] + tenderingData[idx] + supportData[idx] + otherData[idx]
  );

  // Calculate max capacity for threshold zone shading
  const maxCapacity = Math.max(...capacityData);

  // Plugin to draw threshold zone shading (green, amber, red zones)
  const thresholdZonePlugin = {
    id: 'thresholdZones',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;

      if (!yScale || !xScale) return;

      // Get pixel positions for threshold zones
      const healthyEnd = yScale.getPixelForValue(maxCapacity * 0.8);   // 80%
      const tightEnd = yScale.getPixelForValue(maxCapacity);           // 100%
      const chartTop = yScale.getPixelForValue(maxCapacity * 1.2);     // Top of chart
      const chartBottom = yScale.getPixelForValue(0);

      // Draw zone backgrounds
      ctx.save();
      ctx.globalAlpha = 0.04;

      // Green zone (0-80%)
      ctx.fillStyle = '#1a7a3c';
      ctx.fillRect(xScale.left, healthyEnd, xScale.right - xScale.left, chartBottom - healthyEnd);

      // Amber zone (80-100%)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(xScale.left, tightEnd, xScale.right - xScale.left, healthyEnd - tightEnd);

      // Red zone (100%+)
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(xScale.left, chartTop, xScale.right - xScale.left, tightEnd - chartTop);

      ctx.restore();

      // Draw threshold line at 100% capacity
      const capacityLineY = yScale.getPixelForValue(maxCapacity);
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(xScale.left, capacityLineY);
      ctx.lineTo(xScale.right, capacityLineY);
      ctx.stroke();
      ctx.restore();
    }
  };

  meChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'NPI', data: npiData, backgroundColor: gradientNPI, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Improvement', data: improvementData, backgroundColor: gradientImprovement, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Tendering', data: tenderingData, backgroundColor: gradientTendering, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Support', data: supportData, backgroundColor: gradientSupport, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Other', data: otherData, backgroundColor: gradientOther, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Team Capacity', data: capacityData, borderColor: '#ef4444', borderWidth: 3, type: 'line', fill: false, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: '#ef4444', pointBorderWidth: 2, tension: 0.3, order: 1, pointHoverRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 15,
          top: 5
        }
      },
      plugins: {
        legend: { display: false },
        thresholdZones: {},
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          displayColors: true,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const monthIdx = items[0].dataIndex;
              return monthLabels[monthIdx];
            },
            label: (context) => {
              const value = context.parsed.y || context.parsed;
              if (typeof value !== 'number' || isNaN(value)) {
                return context.dataset.label;
              }
              if (context.dataset.type === 'line') {
                const monthIdx = context.dataIndex;
                const util = totalDemandByMonth[monthIdx] > 0
                  ? ((totalDemandByMonth[monthIdx] / value) * 100).toFixed(0)
                  : 0;
                return `Team Capacity: ${value.toFixed(1)}h (${util}% util)`;
              }
              const monthIdx = context.dataIndex;
              const totalDemand = totalDemandByMonth[monthIdx] || 1;
              const percentage = ((value / totalDemand) * 100).toFixed(0);
              return `${context.dataset.label}: ${value.toFixed(1)}h (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: true, color: 'rgba(0,0,0,0.02)', drawBorder: false },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 11, weight: '500' },
            padding: 8,
            color: '#666',
            maxTicksLimit: 10
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.08)', drawBorder: false },
          ticks: {
            color: '#666',
            font: { size: 11 },
            callback: (value) => value + 'h'
          }
        }
      }
    },
    plugins: [thresholdZonePlugin]
  });
};

// ── Control Handlers ──────────────────────────────────────
window.meOnTodayClick = function() {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const input = document.getElementById('meChartMonthInput');
  if (input) {
    input.value = currentMonthKey;
    meOnMonthChange(currentMonthKey);
  }
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
