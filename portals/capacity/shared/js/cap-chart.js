/* ============================================================
   cap-chart.js — Chart Tab & Utilities
   ============================================================ */

import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import { capCalculateMonthData as capCalc, countNetworkDaysBetween as netDaysFn, capGetHolidayDaysInRange as holidayRangeFn } from './cap-calculations.js'
import { getMonthLabel as getLabel, getMonthRange as getRange, getUtilisationColor as getUtilColor, escapeHtml as escHtml, capGetHoursPerWeek as getHPW, getBankHolidaysForYear as getBankHols } from './cap-utils.js'
import { capRenderHeatmapTab as capHeatmap } from './cap-heatmap.js'

// Fix regression: auto-register Chart.js controllers so bar/line forecast charts always render after ESM updates.
// Hybrid approach: Prefer globals if they exist (for test mocks), otherwise use ESM imports
ChartJs.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend
)
const Chart = typeof window !== 'undefined' && window.Chart ? window.Chart : ChartJs
const capCalculateMonthData = typeof window !== 'undefined' && window.capCalculateMonthData ? window.capCalculateMonthData : capCalc
const getMonthLabel = typeof window !== 'undefined' && window.getMonthLabel ? window.getMonthLabel : getLabel
const getMonthRange = typeof window !== 'undefined' && window.getMonthRange ? window.getMonthRange : getRange
const getUtilisationColor = typeof window !== 'undefined' && window.getUtilisationColor ? window.getUtilisationColor : getUtilColor
const capRenderHeatmapTab = typeof window !== 'undefined' && window.capRenderHeatmapTab ? window.capRenderHeatmapTab : capHeatmap
const escapeHtml = typeof window !== 'undefined' && window.escapeHtml ? window.escapeHtml : escHtml
const capGetHoursPerWeek = typeof window !== 'undefined' && window.capGetHoursPerWeek ? window.capGetHoursPerWeek : getHPW
const getBankHolidaysForYear = typeof window !== 'undefined' && window.getBankHolidaysForYear ? window.getBankHolidaysForYear : getBankHols
const countNetworkDaysBetween = typeof window !== 'undefined' && window.countNetworkDaysBetween ? window.countNetworkDaysBetween : netDaysFn
const capGetHolidayDaysInRange = typeof window !== 'undefined' && window.capGetHolidayDaysInRange ? window.capGetHolidayDaysInRange : holidayRangeFn

export function capGetChartRefreshText() {
  return 'Updates when this chart page is opened';
}

export function capRenderChartTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department, options) {
  const dept = department || 'ME';
  const refreshText = capGetChartRefreshText();
  const currentMonthData = capCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray, options);

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
  
  const heatmapPanel = typeof capRenderHeatmapTab === 'function'
    ? capRenderHeatmapTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray, dept)
    : '';

  // ── Demand breakdown rows ──────────────────────────────────
  const pct = (v) => currentMonthData.totalDemand === 0 ? '—' : ((v / currentMonthData.totalDemand) * 100).toFixed(0) + '%';
  const breakdownRows = `
    <tr><td>NPI</td><td style="text-align:right;">${(currentMonthData.npi || 0).toFixed(1)} h</td><td style="text-align:right;">${pct(currentMonthData.npi || 0)}</td></tr>
    <tr><td>Improvement</td><td style="text-align:right;">${(currentMonthData.improvement || 0).toFixed(1)} h</td><td style="text-align:right;">${pct(currentMonthData.improvement || 0)}</td></tr>
    <tr><td>Tendering</td><td style="text-align:right;">${(currentMonthData.tendering || 0).toFixed(1)} h</td><td style="text-align:right;">${pct(currentMonthData.tendering || 0)}</td></tr>
    <tr><td>Support</td><td style="text-align:right;">${(currentMonthData.support || 0).toFixed(1)} h</td><td style="text-align:right;">${pct(currentMonthData.support || 0)}</td></tr>
    <tr><td>Other</td><td style="text-align:right;">${(currentMonthData.other || 0).toFixed(1)} h</td><td style="text-align:right;">${pct(currentMonthData.other || 0)}</td></tr>
    <tr style="border-top:2px solid var(--line);font-weight:700;background:var(--bg-soft);">
      <td>Total Demand</td>
      <td style="text-align:right;">${currentMonthData.totalDemand.toFixed(1)} h</td>
      <td style="text-align:right;">100%</td>
    </tr>
  `;

  // ── Per-member capacity rows ───────────────────────────────
  const [currentYear, currentMonthNum] = monthKey.split('-').map(Number);
  const monthStart = new Date(currentYear, currentMonthNum - 1, 1);
  const monthEnd = new Date(currentYear, currentMonthNum, 0);

  let teamCapacityTotal = 0;
  const memberCapacityRows = (teamArray || []).map(function(member) {
    if (!member || !member.id || !member.startDate) return null;

    const memberName = escapeHtml(member.name || 'Unnamed');
    const hoursPerWeek = capGetHoursPerWeek(member.hoursPerWeek);
    const utilisationPct = member.utilisation || 80;

    const activeStart = new Date(Math.max(monthStart, new Date(member.startDate)));
    const activeEnd = member.endDate ? new Date(Math.min(monthEnd, new Date(member.endDate))) : monthEnd;

    if (activeStart > activeEnd) {
      return `<tr>
        <td>${memberName}</td>
        <td style="text-align:right;">${utilisationPct}%</td>
        <td style="text-align:right;">0</td>
        <td style="text-align:right;">—</td>
        <td style="text-align:right;">0.0 h</td>
        <td style="text-align:right;font-weight:600;color:var(--muted);">0.0 h</td>
      </tr>`;
    }

    const bankHolSet = new Set(getBankHolidaysForYear(currentYear).map(h => h.date));
    const netDays = countNetworkDaysBetween(activeStart, activeEnd, bankHolSet);
    const totalHours = hoursPerWeek * (netDays / 5);
    const holidayDays = capGetHolidayDaysInRange(member.id, activeStart, activeEnd, holidaysArray, bankHolSet);
    const holidayHours = holidayDays * (hoursPerWeek / 5);
    const grossAfterHoliday = Math.max(0, totalHours - holidayHours);
    const utilisedHours = grossAfterHoliday * (utilisationPct / 100);
    teamCapacityTotal += utilisedHours;

    return `<tr>
      <td>${memberName}</td>
      <td style="text-align:right;">${utilisationPct}%</td>
      <td style="text-align:right;">${netDays}</td>
      <td style="text-align:right;">${holidayDays > 0 ? holidayDays + ' d' : '—'}</td>
      <td style="text-align:right;">${grossAfterHoliday.toFixed(1)} h</td>
      <td style="text-align:right;font-weight:600;">${utilisedHours.toFixed(1)} h</td>
    </tr>`;
  }).filter(Boolean);

  const noMemberLabel = dept === 'PM' ? 'managers' : dept === 'LOG' ? 'logistics technicians' : dept === 'UNIT6' ? 'technicians' : 'engineers';
  const roleSingular = dept === 'PM' ? 'Manager' : dept === 'LOG' ? 'Logistics Technician' : dept === 'UNIT6' ? 'Technician' : 'Engineer';
  const capacityCardTitle = dept === 'PM' ? 'CAPACITY PER MANAGER' : dept === 'LOG' ? 'CAPACITY PER LOGISTICS TECHNICIAN' : dept === 'UNIT6' ? 'CAPACITY PER TECHNICIAN' : 'CAPACITY PER ENGINEER';

  const memberCapacityTableBody = memberCapacityRows.length
    ? memberCapacityRows.join('') + `
      <tr style="border-top:2px solid var(--line);font-weight:700;background:var(--bg-soft);">
        <td colspan="5">Total Available (after holidays &amp; utilisation)</td>
        <td style="text-align:right;">${teamCapacityTotal.toFixed(1)} h</td>
      </tr>`
    : `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;font-style:italic;">
        No ${noMemberLabel} with a start date set — add start dates on the Team tab.
      </td></tr>`;

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

      <div class="me-card">
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

      ${heatmapPanel}
    </div>`;
}

export function capDrawChartNow(teamArray, tasksArray, productsArray, holidaysArray, monthKey, department, options) {
  if (!Chart) {
    console.warn('Chart.js not loaded');
    return;
  }
  if (!monthKey || typeof monthKey !== 'string' || !/^\d{4}-\d{2}$/.test(monthKey)) return

  const canvas = document.getElementById('capChart');
  if (!canvas) return;

  if (window.capChartInst) window.capChartInst.destroy();

  const monthKeys = getMonthRange(monthKey, 18);
  const monthLabels = monthKeys.map(m => getMonthLabel(m));

  const capacityData = [];
  const capacityMaxData = [];
  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];

  monthKeys.forEach(mk => {
    const data = capCalculateMonthData(mk, teamArray, tasksArray, productsArray, holidaysArray, options);
    capacityData.push(data.capacity);
    capacityMaxData.push(data.capacityMax);
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
          order: 1
        },
        {
          label: 'Improvement',
          data: improvementData,
          backgroundColor: '#16a34a',
          stack: 'demand',
          order: 1
        },
        {
          label: 'Tendering',
          data: tenderingData,
          backgroundColor: '#ea580c',
          stack: 'demand',
          order: 1
        },
        {
          label: 'Support',
          data: supportData,
          backgroundColor: '#0891b2',
          stack: 'demand',
          order: 1
        },
        {
          label: 'Other',
          data: otherData,
          backgroundColor: '#7c3aed',
          stack: 'demand',
          order: 1
        },
        {
          label: 'Team Capacity',
          data: capacityData,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          // Why: keep capacity line on its own baseline when chart y-scale stacking is enabled for demand bars.
          stack: 'capacity-line',
          borderWidth: 2,
          type: 'line',
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: '#dc2626',
          order: 0
        },
        {
          // Why: make total 100%-utilisation availability visible so users can compare planned vs maximum hours.
          label: 'Total Available (100%)',
          data: capacityMaxData,
          borderColor: '#475569',
          backgroundColor: '#475569',
          // Why: separate stack key prevents this dashed line from stacking on top of Team Capacity.
          stack: 'available-line',
          borderWidth: 2,
          borderDash: [6, 4],
          type: 'line',
          fill: false,
          pointRadius: 2,
          pointBackgroundColor: '#475569',
          order: 0
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
}

// Assign to window for backward compatibility if needed by non-ESM parts of the app
window.capGetChartRefreshText = capGetChartRefreshText;
window.capRenderChartTab = capRenderChartTab;
window.capDrawChartNow = capDrawChartNow;
