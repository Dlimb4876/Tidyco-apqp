/* ============================================================
   me-chart.js — Chart Tab & Utilities
   ============================================================ */

window.meRenderChartTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const department = typeof window.meCurrentDepartmentContext === 'string'
    ? window.meCurrentDepartmentContext
    : 'ME';

  // Keep KPI cards aligned with the selected chart month.
  const selectedMonthKey = typeof monthKey === 'string' && /^\d{4}-\d{2}$/.test(monthKey)
    ? monthKey
    : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = meCalculateMonthData(selectedMonthKey, teamArray, tasksArray, productsArray, holidaysArray);

  const capacity    = currentMonthData.capacity.toFixed(1);
  const demand      = currentMonthData.totalDemand.toFixed(1);
  const utilisation = currentMonthData.utilisation;
  const headroom    = Math.max(0, currentMonthData.capacity - currentMonthData.totalDemand).toFixed(1);

  const utilisationColor = getUtilisationColor(utilisation);
  const currentMonthLabel = meGetMonthLabel(selectedMonthKey);

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
    <tr style="border-top:2px solid var(--line);font-weight:700;background:var(--bg-soft);">
      <td>Total Demand</td>
      <td style="text-align:right;">${currentMonthData.totalDemand.toFixed(1)} h</td>
      <td style="text-align:right;">100%</td>
    </tr>
  `;

  // ── Per-engineer capacity rows ─────────────────────────────
  // NOTE: members without a startDate are excluded here to match meCalculateMonthData
  // (fixes mismatch between KPI totals and table totals)
  const [currentYear, currentMonthNum] = selectedMonthKey.split('-').map(Number);
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

    let holidayDays = 0;
    holidaysArray.forEach(holiday => {
      if (!holiday || !holiday.date) return;
      const holidayPersonId = holiday.personId || holiday.person_id;
      if (holidayPersonId !== member.id) return;

      const parsedDate = typeof meParseDateOnlyLocal === 'function'
        ? meParseDateOnlyLocal(holiday.date)
        : new Date(String(holiday.date).substring(0, 10));
      if (!parsedDate) return;

      const hd = new Date(parsedDate);
      hd.setHours(0, 0, 0, 0);
      const dow = hd.getDay();
      if (dow === 0 || dow === 6) return;

      const hdStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
      if (bankHolSet.has(hdStr)) return;
      if (hd < activeStart || hd > activeEnd) return;

      const holidayType = String(holiday.type || 'full').toLowerCase();
      if (holidayType === 'half') holidayDays += 0.5;
      else holidayDays += 1;
    });

    const holidayHours = holidayDays * (hoursPerWeek / 5);
    const grossAfterHoliday = Math.max(0, totalHours - holidayHours);
    const utilisedHours  = grossAfterHoliday * (utilisationPct / 100);
    teamCapacityTotal += utilisedHours;

    return `
      <tr>
        <td>${memberName}</td>
        <td style="text-align:right;">${utilisationPct}%</td>
        <td style="text-align:right;">${netDays}</td>
        <td style="text-align:right;">${holidayDays > 0 ? holidayDays + ' d' : '—'}</td>
        <td style="text-align:right;">${grossAfterHoliday.toFixed(1)} h</td>
        <td style="text-align:right;font-weight:600;">${utilisedHours.toFixed(1)} h</td>
      </tr>
    `;
  }).filter(Boolean);

  const memberCapacityTableBody = memberCapacityRows.length
    ? memberCapacityRows.join('') + `
      <tr style="border-top:2px solid var(--line);font-weight:700;background:var(--bg-soft);">
        <td colspan="5">Total Available (after holidays &amp; utilisation)</td>
        <td style="text-align:right;">${teamCapacityTotal.toFixed(1)} h</td>
      </tr>
    `
    : `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--muted);padding:20px;font-style:italic;">
          No ${department === 'PM' ? 'managers' : department === 'LOG' ? 'logistics technicians' : department === 'UNIT6' ? 'technicians' : 'engineers'} with a start date set — add start dates on the Team tab.
        </td>
      </tr>
    `;

  const roleSingular = department === 'PM'
    ? 'Manager'
    : department === 'LOG'
      ? 'Logistics Technician'
      : department === 'UNIT6'
        ? 'Technician'
        : 'Engineer';
  const capacityCardTitle = department === 'PM'
    ? 'CAPACITY PER MANAGER'
    : department === 'LOG'
      ? 'CAPACITY PER LOGISTICS TECHNICIAN'
      : department === 'UNIT6'
        ? 'CAPACITY PER TECHNICIAN'
        : 'CAPACITY PER ENGINEER';

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
            <button class="btn btn-secondary btn-sm" data-cap-action="cap-me-prev-month">← Prev</button>
            <input type="month" id="meChartMonthInput" value="${monthKey}" data-cap-action="cap-me-month-change" />
            <button class="btn btn-secondary btn-sm" data-cap-action="cap-me-next-month">Next →</button>
            <a href="javascript:void(0)" class="me-chart-today-link" data-cap-action="cap-me-today">Today</a>
          </div>
        </div>
        <div class="me-card-body" style="padding:16px;">
          <div class="me-chart-wrapper">
            <canvas id="meChart" height="300"></canvas>
          </div>
          <div class="me-chart-legend">
            <div class="legend-item"><div class="legend-color" style="background:var(--chart-blue);"></div><span>NPI</span></div>
            <div class="legend-item"><div class="legend-color" style="background:var(--chart-green);"></div><span>Improvement</span></div>
            <div class="legend-item"><div class="legend-color" style="background:var(--chart-amber);"></div><span>Tendering</span></div>
            <div class="legend-item"><div class="legend-color" style="background:var(--chart-pink);"></div><span>Support</span></div>
            <div class="legend-item"><div class="legend-color" style="background:var(--chart-purple);"></div><span>Other</span></div>
            <div class="legend-item" style="margin-left:24px;"><div class="legend-line" style="background:var(--chart-red);"></div><span>Team Capacity</span></div>
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
            <span class="me-card-title">${capacityCardTitle}</span>
            <span style="font-size:11px;color:var(--muted);">${currentMonthLabel}</span>
          </div>
          <div class="me-card-body">
            <div class="me-tbl-wrap">
              <table class="me-tbl">
                <thead><tr>
                  <th>${roleSingular}</th>
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
  const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

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

  // Resolve CSS custom properties for Chart.js (getComputedStyle required — Chart.js cannot use var())
  const style = getComputedStyle(document.documentElement);
  const colorBlue   = style.getPropertyValue('--chart-blue').trim();
  const colorGreen  = style.getPropertyValue('--chart-green').trim();
  const colorAmber  = style.getPropertyValue('--chart-amber').trim();
  const colorPink   = style.getPropertyValue('--chart-pink').trim();
  const colorPurple = style.getPropertyValue('--chart-purple').trim();

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
        { label: 'NPI', data: npiData, backgroundColor: colorBlue, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Improvement', data: improvementData, backgroundColor: colorGreen, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Tendering', data: tenderingData, backgroundColor: colorAmber, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Support', data: supportData, backgroundColor: colorPink, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
        { label: 'Other', data: otherData, backgroundColor: colorPurple, type: 'bar', order: 2, stack: 'demand', borderRadius: 2 },
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
            autoSkip: false,
            maxRotation: isSmallScreen ? 35 : 0,
            minRotation: isSmallScreen ? 35 : 0,
            font: { size: 11, weight: '500' },
            padding: 8,
            color: '#666'
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

  // Handle holidays tab for ME capacity
  if (typeof meTab !== 'undefined' && meTab === 'holidays') {
    meHolidayMonth = currentMonthKey;
    if (typeof meRefreshCurrentTab === 'function') meRefreshCurrentTab();
    return;
  }

  // Handle holidays tab for PM capacity
  if (typeof pmTab !== 'undefined' && pmTab === 'holidays') {
    pmHolidayMonth = currentMonthKey;
    if (typeof pmRefreshCurrentTab === 'function') pmRefreshCurrentTab();
    return;
  }

  // Default: chart tab
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
