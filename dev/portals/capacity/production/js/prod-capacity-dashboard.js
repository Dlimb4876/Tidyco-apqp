// ═══════════════════════════════════════════════════════════════
// prod-capacity-dashboard.js — Production Capacity Dashboard Tab
// 2-year stacked bar chart (demand by family), capacity line, KPI row, alerts
// ═══════════════════════════════════════════════════════════════

import { Chart } from 'chart.js'
import { appState } from '../../../../core/js/state.js'
import { prodState } from '../../../production/js/data.js'
import {
  prodCapGet24MonthKeys,
  prodCapGetWorkAreas,
  prodCapCalcDemandMatrix,
  prodCapCalcFamilyDemandMatrix,
  prodCapCalcSupplyMatrix,
  prodCapUtil,
  prodCapMonthLabel,
  prodCapMonthLabelFull
} from './prod-capacity-data.js'

let prodCapDashChartInst = null

export function renderProdCapDashboard() {
  const monthKeys  = prodCapGet24MonthKeys();
  const workAreas  = prodCapGetWorkAreas();
  const demandMx   = prodCapCalcDemandMatrix(monthKeys);
  const familyMx   = prodCapCalcFamilyDemandMatrix(monthKeys);
  const supplyMx   = prodCapCalcSupplyMatrix(monthKeys, workAreas);

  // ── KPI calculations (rolling 3-month window around today) ──
  const today    = new Date();
  const thisKey  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const next3    = monthKeys.slice(0, 3);

  const totalDemand3  = next3.reduce((s, k) => s + (demandMx[k]?._total || 0), 0);
  const totalSupply3  = next3.reduce((s, k) => s + (supplyMx[k]?._total || 0), 0);
  const util3         = prodCapUtil(totalDemand3, totalSupply3);
  const headroom3     = Math.max(0, totalSupply3 - totalDemand3);

  // ── Over-capacity alert months ───────────────────────────────
  const alertMonths = monthKeys.filter(k => {
    const d = demandMx[k]?._total || 0;
    const s = supplyMx[k]?._total || 0;
    return s > 0 && d > s;
  });

  const noCapacityMonths = monthKeys.filter(k => {
    const d = demandMx[k]?._total || 0;
    const s = supplyMx[k]?._total || 0;
    return s === 0 && d > 0;
  });

  // ── Utilisation colour ───────────────────────────────────────
  const utilColor = util3 < 80 ? 'var(--blue)' : util3 < 100 ? 'var(--amber)' : 'var(--red)';
  const utilLabel = util3 < 80 ? '● Healthy' : util3 < 100 ? '⚠ Tight' : '✗ Over capacity';

  // ── Alerts HTML ──────────────────────────────────────────────
  let alertsHtml = '';
  if (alertMonths.length > 0) {
    const names = alertMonths.slice(0, 6).map(k => prodCapMonthLabel(k)).join(', ');
    alertsHtml += `
      <div class="pc-alert pc-alert-red">
        <strong>⚠ Over capacity:</strong> ${names}${alertMonths.length > 6 ? ` (+${alertMonths.length - 6} more)` : ''} —
        demand exceeds available staff hours. Add capacity in Settings or reduce scheduled workload.
      </div>`;
  }
  if (noCapacityMonths.length > 0) {
    const names = noCapacityMonths.slice(0, 4).map(k => prodCapMonthLabel(k)).join(', ');
    alertsHtml += `
      <div class="pc-alert pc-alert-amber">
        <strong>○ No capacity set:</strong> ${names}${noCapacityMonths.length > 4 ? ` (+${noCapacityMonths.length - 4} more)` : ''} —
        batches are scheduled but no staff headcount has been entered. Go to Settings to configure.
      </div>`;
  }
  if (!alertsHtml && (prodState?.batches || []).length === 0) {
    alertsHtml = `<div class="pc-alert pc-alert-info">No production batches scheduled yet. Add batches in Production → Schedule to see capacity load.</div>`;
  }

  // ── Month offset indicator
  const offsetLabel = prodCapMonthLabelFull(prodCapGet24MonthKeys()[0]);

  return `
    <div class="pc-dashboard">

      <!-- KPI Row -->
      <div class="pc-kpi-row">
        <div class="pc-kpi" style="border-left:4px solid var(--amber)">
          <div class="pc-kpi-val">${Math.round(totalDemand3).toLocaleString()}h</div>
          <div class="pc-kpi-label">Demand (next 3 months)</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--green)">
          <div class="pc-kpi-val">${Math.round(totalSupply3).toLocaleString()}h</div>
          <div class="pc-kpi-label">Capacity (next 3 months)</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid ${utilColor}">
          <div class="pc-kpi-val" style="color:${utilColor}">${util3}%</div>
          <div class="pc-kpi-label">Utilisation</div>
          <div class="pc-kpi-sub" style="color:${utilColor}">${utilLabel}</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--navy)">
          <div class="pc-kpi-val">${Math.round(headroom3).toLocaleString()}h</div>
          <div class="pc-kpi-label">Headroom (next 3 months)</div>
        </div>
      </div>

      <!-- Alerts -->
      ${alertsHtml}

      <!-- 2-Year Chart -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div>
            <div class="pc-card-title">2-Year Production Load Forecast</div>
            <div class="pc-card-sub">Demand stacked by product family · Capacity line = available staff hours</div>
            <button
              type="button"
              class="pc-card-sub"
              data-cap-action="cap-prod-capacity-help"
              title="Capacity formula: staff x working days x 8h. Working days are Mon-Fri and exclude UK bank holidays. This is a 40h/week baseline per person (5 x 8h), then adjusted by the utilization factor."
              style="margin-top:4px;color:var(--blue);font-weight:600;cursor:pointer;background:none;border:none;padding:0;text-align:left"
              aria-label="Show how production capacity is calculated"
            >
              ⓘ How capacity is calculated
            </button>
          </div>
          <div class="pc-window-controls" style="margin-bottom: 0; padding: 0; border: none; background: none;">
            <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-prev-month" title="View previous month">← Previous</button>
            <div class="pc-window-label">${offsetLabel}</div>
            <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-next-month" title="View next month">Next →</button>
            ${appState.prodCapMonthOffset !== 0 ? `<button class="btn btn-sm btn-outline" data-cap-action="cap-prod-reset-month" title="Reset to current month">Reset</button>` : ''}
          </div>
        </div>
        <div class="pc-chart-wrap">
          <canvas id="prodCapDashChart" style="width:100%;height:320px"></canvas>
        </div>
      </div>

      <!-- Monthly Summary Table -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title">Monthly Summary</div>
        </div>
        <div class="pc-table-wrap">
          ${_prodCapDashSummaryTable(monthKeys, demandMx, supplyMx)}
        </div>
      </div>

    </div>
  `;
}

function _prodCapDashSummaryTable(monthKeys, demandMx, supplyMx) {
  const rows = monthKeys.map(key => {
    const demand = demandMx[key]?._total || 0;
    const supply = supplyMx[key]?._total || 0;
    const util   = prodCapUtil(demand, supply);
    const headrm = supply - demand;
    const over   = supply > 0 && demand > supply;
    const noCap  = supply === 0 && demand > 0;

    const utilColor = util < 80 ? 'var(--green)' : util < 100 ? 'var(--amber)' : 'var(--red)';
    const rowStyle  = over ? 'background:rgba(239,68,68,0.06)' : noCap ? 'background:rgba(245,158,11,0.06)' : '';

    const barWidth  = supply > 0 ? Math.min(100, (demand / supply) * 100) : (demand > 0 ? 100 : 0);
    const barColor  = util < 80 ? 'var(--green)' : util < 100 ? 'var(--amber)' : 'var(--red)';

    return `
      <tr style="${rowStyle}">
        <td class="pc-tbl-month">${prodCapMonthLabel(key)}</td>
        <td class="pc-tbl-center">${demand > 0 ? Math.round(demand).toLocaleString() + 'h' : '—'}</td>
        <td class="pc-tbl-center">${supply > 0 ? Math.round(supply).toLocaleString() + 'h' : '—'}</td>
        <td class="pc-tbl-center">
          ${headrm >= 0 ? `<span style="color:var(--green)">+${Math.round(headrm).toLocaleString()}h</span>`
                        : `<span style="color:var(--red)">${Math.round(headrm).toLocaleString()}h</span>`}
        </td>
        <td style="min-width:120px">
          <div class="pc-util-bar-wrap">
            <div class="pc-util-bar" style="width:${barWidth}%;background:${barColor}"></div>
            <span style="color:${utilColor};font-size:11px;font-weight:600;margin-left:6px">${supply > 0 ? util + '%' : noCap ? '?' : '—'}</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table class="pc-tbl">
      <thead>
        <tr>
          <th>Month</th>
          <th class="pc-tbl-center">Demand (h)</th>
          <th class="pc-tbl-center">Capacity (h)</th>
          <th class="pc-tbl-center">Headroom</th>
          <th>Utilisation</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── Chart drawing (called after render via setTimeout) ────────
export function prodCapDrawDashChart() {
  const canvas = document.getElementById('prodCapDashChart');
  if (!canvas) return;

  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();
  const familyMx  = prodCapCalcFamilyDemandMatrix(monthKeys);
  const supplyMx  = prodCapCalcSupplyMatrix(monthKeys, workAreas);

  // Gather all families
  const familySet = new Set();
  monthKeys.forEach(k => Object.keys(familyMx[k] || {}).forEach(f => familySet.add(f)));
  const families = Array.from(familySet).sort();

  const labels = monthKeys.map(k => prodCapMonthLabel(k));

  // Colour palette
  const palette = [
    'rgba(59,130,246,0.8)',  // blue
    'rgba(16,185,129,0.8)',  // green
    'rgba(245,158,11,0.8)',  // amber
    'rgba(139,92,246,0.8)',  // purple
    'rgba(236,72,153,0.8)',  // pink
    'rgba(20,184,166,0.8)',  // teal
    'rgba(249,115,22,0.8)',  // orange
    'rgba(100,116,139,0.8)', // slate
  ];

  const datasets = families.map((fam, i) => ({
    label: fam,
    data: monthKeys.map(k => Math.round((familyMx[k]?.[fam] || 0) * 10) / 10),
    backgroundColor: palette[i % palette.length],
    stack: 'demand',
    borderWidth: 0,
    borderRadius: 2,
    order: 1,
  }));

  // Capacity line
  datasets.push({
    label: 'Capacity',
    data: monthKeys.map(k => Math.round(supplyMx[k]?._total || 0)),
    type: 'line',
    borderColor: '#ef4444',
    borderWidth: 3,
    tension: 0.3,
    pointRadius: 5,
    pointBackgroundColor: '#fff',
    pointBorderColor: '#ef4444',
    pointBorderWidth: 2,
    pointHoverRadius: 6,
    backgroundColor: 'transparent',
    fill: false,
    order: 0,
  });

  if (prodCapDashChartInst) prodCapDashChartInst.destroy();

  prodCapDashChartInst = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'IBM Plex Sans', size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}h`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 10 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: 'Hours', font: { size: 11 } },
          ticks: { callback: v => v.toLocaleString() + 'h' }
        }
      }
    }
  });
}
