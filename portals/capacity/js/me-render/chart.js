// ME Capacity Chart - Render Component

import { ME_CATEGORY_COLORS, CHART_CONFIG } from '../me-utils/constants.js';
import { getMonthLabel, getNextMonthKey, getPrevMonthKey, getMonthRange } from '../me-utils/dates.js';
import { meGetMonthData } from '../me-utils/calculations.js';

/**
 * Render chart tab with KPI strip and canvas
 * @param {string} chartStartMonth ISO month string (current month to display)
 * @param {Array} teamArray Team members
 * @param {Array} tasksArray Tasks
 * @param {Array} productsArray Products
 * @param {Array} holidaysArray Holidays
 * @param {Function} onMonthChange Callback: onMonthChange(newMonth)
 * @returns {string} HTML
 */
export function meRenderChart(
  chartStartMonth,
  teamArray,
  tasksArray,
  productsArray,
  holidaysArray,
  onMonthChange
) {
  const currentMonthData = meGetMonthData(
    chartStartMonth,
    teamArray,
    tasksArray,
    productsArray,
    holidaysArray
  );

  const capacity = currentMonthData.capacity.toFixed(1);
  const demand = currentMonthData.totalDemand.toFixed(1);
  const utilisation = currentMonthData.utilisation;
  const headroom = Math.max(0, currentMonthData.capacity - currentMonthData.totalDemand).toFixed(1);

  // Color based on utilisation
  const utilisationColor = utilisation < 85 ? 'var(--green)' :
                           utilisation < 100 ? 'var(--amber)' : 'var(--red)';

  const html = `
    <div class="me-chart-container">
      <!-- KPI Strip -->
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${capacity}</div>
          <div class="me-kpi-label">Team Capacity (hours)</div>
          <div class="me-kpi-month">${getMonthLabel(chartStartMonth)}</div>
        </div>

        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${demand}</div>
          <div class="me-kpi-label">Total Demand (hours)</div>
          <div class="me-kpi-month">${getMonthLabel(chartStartMonth)}</div>
        </div>

        <div class="me-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-kpi-value">${utilisation}%</div>
          <div class="me-kpi-label">Utilisation</div>
          <div class="me-kpi-month">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>

        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${headroom}</div>
          <div class="me-kpi-label">Available Headroom (hours)</div>
          <div class="me-kpi-month">${getMonthLabel(chartStartMonth)}</div>
        </div>
      </div>

      <!-- Chart Controls -->
      <div class="me-chart-controls">
        <button class="btn btn-secondary" onclick="meOnPrevMonth()">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${chartStartMonth}" onchange="meOnMonthChange(this.value)" />
        <button class="btn btn-secondary" onclick="meOnNextMonth()">Next →</button>
      </div>

      <!-- Chart Canvas -->
      <div class="me-chart-wrapper">
        <canvas id="meChart" height="300"></canvas>
      </div>

      <!-- Legend -->
      <div class="me-chart-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: ${ME_CATEGORY_COLORS.npi};"></div>
          <span>NPI</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${ME_CATEGORY_COLORS.improvement};"></div>
          <span>Improvement</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${ME_CATEGORY_COLORS.tendering};"></div>
          <span>Tendering</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${ME_CATEGORY_COLORS.support};"></div>
          <span>Support</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${ME_CATEGORY_COLORS.other};"></div>
          <span>Other</span>
        </div>
        <div class="legend-item" style="margin-left: 30px;">
          <div class="legend-line" style="background: #ef4444;"></div>
          <span>Team Capacity</span>
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Draw the 18-month forecast chart
 * @param {string} chartStartMonth Starting month
 * @param {Array} teamArray Team members
 * @param {Array} tasksArray Tasks
 * @param {Array} productsArray Products
 * @param {Array} holidaysArray Holidays
 * @returns {Chart} Chart.js instance
 */
export function meDrawChart(
  chartStartMonth,
  teamArray,
  tasksArray,
  productsArray,
  holidaysArray
) {
  const canvas = document.getElementById('meChart');
  if (!canvas) return null;

  // Destroy previous chart if exists
  if (window.meChartInst) {
    window.meChartInst.destroy();
  }

  // Get 18 months of data
  const monthKeys = getMonthRange(chartStartMonth, 18);
  const monthLabels = monthKeys.map(m => getMonthLabel(m));

  const capacityData = [];
  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];

  monthKeys.forEach(monthKey => {
    const data = meGetMonthData(
      monthKey,
      teamArray,
      tasksArray,
      productsArray,
      holidaysArray
    );

    capacityData.push(data.capacity);
    npiData.push(data.npi);
    improvementData.push(data.improvement);
    tenderingData.push(data.tendering);
    supportData.push(data.support);
    otherData.push(data.other);
  });

  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    canvas.parentElement.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--muted);">Chart.js library not loaded</p>';
    return null;
  }

  // Create chart
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'NPI',
          data: npiData,
          backgroundColor: ME_CATEGORY_COLORS.npi,
          order: 2
        },
        {
          label: 'Improvement',
          data: improvementData,
          backgroundColor: ME_CATEGORY_COLORS.improvement,
          order: 2
        },
        {
          label: 'Tendering',
          data: tenderingData,
          backgroundColor: ME_CATEGORY_COLORS.tendering,
          order: 2
        },
        {
          label: 'Support',
          data: supportData,
          backgroundColor: ME_CATEGORY_COLORS.support,
          order: 2
        },
        {
          label: 'Other',
          data: otherData,
          backgroundColor: ME_CATEGORY_COLORS.other,
          order: 2
        },
        {
          label: 'Team Capacity',
          data: capacityData,
          borderColor: '#ef4444',
          borderWidth: 2,
          type: 'line',
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: '#ef4444',
          order: 1
        }
      ]
    },
    options: {
      ...CHART_CONFIG,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 12, family: 'IBM Plex Mono' },
          bodyFont: { size: 11, family: 'IBM Plex Mono' },
          callbacks: {
            afterLabel: function (context) {
              if (context.datasetIndex === 5) {
                // Capacity line - show utilisation
                const capacity = context.parsed.y;
                const idx = context.dataIndex;
                const npi = npiData[idx] || 0;
                const improvement = improvementData[idx] || 0;
                const tendering = tenderingData[idx] || 0;
                const support = supportData[idx] || 0;
                const other = otherData[idx] || 0;
                const totalDemand = npi + improvement + tendering + support + other;
                const util = capacity > 0 ? Math.round((totalDemand / capacity) * 100) : 0;
                return `Utilisation: ${util}%`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { family: 'IBM Plex Mono', size: 10 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            font: { family: 'IBM Plex Mono', size: 10 },
            callback: function (value) {
              return value.toFixed(0);
            }
          }
        }
      }
    }
  });

  window.meChartInst = chart;
  return chart;
}
