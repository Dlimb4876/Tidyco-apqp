// ═══════════════════════════════════════════════════════════════
// prod-capacity-workarea.js — Capacity by Work Area Tab
// Per-area chart + monthly breakdown table + active batch list
// ═══════════════════════════════════════════════════════════════

import { Chart } from 'chart.js'
import { appState } from '../../../../core/js/state.js'
import { esc } from '../../../../utils/js/helpers.js'
import { formatDisplayDate, prodState } from '../../../production/js/data.js'
import {
  prodCapGet24MonthKeys,
  prodCapGetWorkAreas,
  prodCapCalcDemandMatrix,
  prodCapCalcSupplyMatrix,
  prodCapParseKey,
  prodCapDataGetStaff,
  prodCapUtil,
  prodCapMonthLabel,
  prodCapMonthLabelFull
} from './prod-capacity-data.js'

let prodCapWorkAreaSelected = null
let prodCapWorkAreaChartInst = null

export function prodCapSetWorkArea(workArea) {
  prodCapWorkAreaSelected = workArea || null
}

function _renderProdCapKpiCards(kpis) {
  const { totalProducts, activeBatches, totalDemand, totalSupply, oneYearHeadroom, peakUtil } = kpis

  const headroom = totalSupply - totalDemand
  const roundedHeadroom = Math.round(headroom)
  const roundedOneYearHeadroom = Math.round(oneYearHeadroom)
  const totalUtil = totalSupply > 0 ? Math.round((totalDemand / totalSupply) * 100) : 0

  const headroomColor = headroom > 0 ? 'var(--green)' : 'var(--red)'
  const oneYearHeadroomColor = oneYearHeadroom > 0 ? 'var(--green)' : 'var(--red)'
  const utilColor = totalUtil < 80 ? 'var(--blue)' : totalUtil < 100 ? 'var(--amber)' : 'var(--red)'
  const utilLabel = totalUtil < 80 ? '● Healthy' : totalUtil < 100 ? '⚠ Tight' : '✗ Over capacity'
  const peakColor = peakUtil < 80 ? 'var(--blue)' : peakUtil < 100 ? 'var(--amber)' : 'var(--red)'
  const peakLabel = peakUtil < 80 ? '● Healthy' : peakUtil < 100 ? '⚠ Tight' : '✗ Over capacity'

  return `
    <div class="pc-kpi-row">
      <div class="pc-kpi" style="border-left:4px solid var(--blue)">
        <div class="pc-kpi-val">${totalProducts}</div>
        <div class="pc-kpi-label">Products</div>
      </div>
      <div class="pc-kpi" style="border-left:4px solid var(--navy)">
        <div class="pc-kpi-val">${activeBatches}</div>
        <div class="pc-kpi-label">Active Batches</div>
      </div>
      <div class="pc-kpi" style="border-left:4px solid ${oneYearHeadroomColor}">
        <div class="pc-kpi-val" style="color:${oneYearHeadroomColor}">${roundedOneYearHeadroom.toLocaleString()}h</div>
        <div class="pc-kpi-label">1-Yr Headroom</div>
      </div>
      <div class="pc-kpi" style="border-left:4px solid ${headroomColor}">
        <div class="pc-kpi-val" style="color:${headroomColor}">${roundedHeadroom.toLocaleString()}h</div>
        <div class="pc-kpi-label">2-Yr Headroom</div>
      </div>
      <div class="pc-kpi" style="border-left:4px solid ${utilColor}">
        <div class="pc-kpi-val" style="color:${utilColor}">${totalUtil}%</div>
        <div class="pc-kpi-label">2-Yr Utilisation</div>
        <div class="pc-kpi-sub" style="color:${utilColor}">${utilLabel}</div>
      </div>
      <div class="pc-kpi" style="border-left:4px solid ${peakColor}">
        <div class="pc-kpi-val" style="color:${peakColor}">${Math.round(peakUtil)}%</div>
        <div class="pc-kpi-label">Peak Utilisation</div>
        <div class="pc-kpi-sub" style="color:${peakColor}">${peakLabel}</div>
      </div>
    </div>
  `
}

export function renderProdCapWorkArea() {
  const workAreas = prodCapGetWorkAreas()

  if (workAreas.length === 0) {
    return `
      <div class="pc-empty">
        <div class="pc-empty-icon">🏭</div>
        <div class="pc-empty-title">No work areas found</div>
        <div class="pc-empty-sub">Add work locations to products in Product Management, then schedule batches in Production → Schedule.</div>
      </div>`
  }

  if (!prodCapWorkAreaSelected || !workAreas.includes(prodCapWorkAreaSelected)) {
    prodCapWorkAreaSelected = workAreas[0]
  }

  const monthKeys = prodCapGet24MonthKeys()
  const demandMx = prodCapCalcDemandMatrix(monthKeys)
  const supplyMx = prodCapCalcSupplyMatrix(monthKeys, workAreas)

  // ── Area tabs ─────────────────────────────────────────────
  const tabPills = workAreas
    .map((wa) => {
      const active = wa === prodCapWorkAreaSelected
      return `
      <button class="pc-nav-btn ${active ? 'active' : ''}" data-cap-action="cap-prod-set-workarea" data-workarea="${esc(wa)}">
        ${esc(wa)}
      </button>`
    })
    .join('')

  // ── Per-area data for selected area ──────────────────────
  const wa = prodCapWorkAreaSelected
  const waProds = (prodState?.products || []).filter((p) => p.work_location === wa)
  const waBatches = (prodState?.batches || []).filter(
    (b) => b.work_location === wa && b.status !== 'Complete'
  )

  // ── KPI Calculations ───────────────────────────────────
  const totalProducts = waProds.length
  const activeBatches = waBatches.length
  const oneYearMonthKeys = monthKeys.slice(0, 12)
  let totalDemand = 0
  let totalSupply = 0
  let oneYearDemand = 0
  let oneYearSupply = 0
  let peakUtil = 0

  monthKeys.forEach((key) => {
    const demand = demandMx[key]?.[wa] || 0
    const supply = supplyMx[key]?.[wa] || 0
    totalDemand += demand
    totalSupply += supply
    if (supply > 0) {
      const util = (demand / supply) * 100
      if (util > peakUtil) {
        peakUtil = util
      }
    }
  })

  oneYearMonthKeys.forEach((key) => {
    oneYearDemand += demandMx[key]?.[wa] || 0
    oneYearSupply += supplyMx[key]?.[wa] || 0
  })

  const oneYearHeadroom = oneYearSupply - oneYearDemand
  const kpis = { totalProducts, activeBatches, totalDemand, totalSupply, oneYearHeadroom, peakUtil }

  // Monthly breakdown for selected area
  const tableRows = monthKeys
    .map((key) => {
      const demand = demandMx[key]?.[wa] || 0
      const supply = supplyMx[key]?.[wa] || 0
      const { year, month } = prodCapParseKey(key)
      const staff = prodCapDataGetStaff(wa, year, month)
      const util = prodCapUtil(demand, supply)
      const over = supply > 0 && demand > supply
      const noCap = supply === 0 && demand > 0

      const utilColor =
        util < 80 ? 'var(--green)' : util < 100 ? 'var(--amber)' : 'var(--red)'
      const rowStyle = over
        ? 'background:rgba(239,68,68,0.06)'
        : noCap
        ? 'background:rgba(245,158,11,0.06)'
        : ''
      const barWidth = supply > 0 ? Math.min(100, (demand / supply) * 100) : demand > 0 ? 100 : 0

      return `
      <tr style="${rowStyle}">
        <td class="pc-tbl-month">${prodCapMonthLabel(key)}</td>
        <td class="pc-tbl-num">${staff > 0 ? staff : '—'}</td>
        <td class="pc-tbl-num">${
          supply > 0 ? Math.round(supply).toLocaleString() + 'h' : '—'
        }</td>
        <td class="pc-tbl-num">${
          demand > 0 ? Math.round(demand).toLocaleString() + 'h' : '—'
        }</td>
        <td class="pc-tbl-num">
          ${
            supply > demand
              ? `<span style="color:var(--green)">+${Math.round(
                  supply - demand
                ).toLocaleString()}h</span>`
              : supply === 0 && demand === 0
              ? '—'
              : `<span style="color:var(--red)">${Math.round(
                  supply - demand
                ).toLocaleString()}h</span>`
          }
        </td>
        <td style="min-width:140px">
          <div class="pc-util-bar-wrap">
            <div class="pc-util-bar" style="width:${barWidth}%;background:${utilColor}"></div>
            <span style="color:${utilColor};font-size:11px;font-weight:600;margin-left:6px">
              ${supply > 0 ? util + '%' : noCap ? '?' : '—'}
            </span>
          </div>
        </td>
      </tr>`
    })
    .join('')

  // Active batches for this area
  const batchRows =
    waBatches.length === 0
      ? `<tr><td colspan="6" class="pc-tbl-empty">No active batches for ${esc(wa)}</td></tr>`
      : waBatches
          .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
          .map((batch) => {
            const prod = (prodState?.products || []).find((p) => p.id === batch.product_id)
            const totalHours = prod
              ? (Number(prod.current_overhaul_hours) || 0) * (batch.quantity || 0)
              : 0
            const statusColor =
              batch.status === 'In Progress'
                ? 'var(--amber)'
                : batch.status === 'Complete'
                ? 'var(--green)'
                : 'var(--muted)'
            return `
            <tr>
              <td>${prod ? esc(prod.name) : '—'}</td>
              <td class="pc-tbl-mono">${prod ? esc(prod.code || '—') : '—'}</td>
              <td class="pc-tbl-num">${batch.quantity || '—'}</td>
              <td class="pc-tbl-mono">${
                (typeof formatDisplayDate === 'function' ? formatDisplayDate(batch.start_date) : batch.start_date) || '—'
              } → ${(typeof formatDisplayDate === 'function' ? formatDisplayDate(batch.due_date) : batch.due_date) || '—'}</td>
              <td class="pc-tbl-num">${
                totalHours > 0 ? Math.round(totalHours).toLocaleString() + 'h' : '—'
              }</td>
              <td><span style="color:${statusColor};font-size:11px;font-weight:600">${esc(
              batch.status || '—'
            )}</span></td>
            </tr>`
          })
          .join('')

  // ── Month offset indicator
  const offsetLabel = prodCapMonthLabelFull(prodCapGet24MonthKeys()[0])

  return `
    <div class="pc-workarea">

      <!-- Work Area Tabs -->
      <div class="pc-nav" style="margin-bottom:20px">${tabPills}</div>

      <!-- KPIs -->
      ${_renderProdCapKpiCards(kpis)}

      <!-- Chart -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div>
            <div class="pc-card-title">${esc(wa)} — 2-Year Capacity vs Demand</div>
            <div class="pc-card-sub">Available hours (capacity) vs scheduled workload (demand)</div>
          </div>
          <div class="pc-window-controls" style="margin-bottom: 0; padding: 0; border: none; background: none;">
            <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-prev-month" title="View previous month">← Previous</button>
            <div class="pc-window-label">${offsetLabel}</div>
            <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-next-month" title="View next month">Next →</button>
            ${
              appState.prodCapMonthOffset !== 0
                ? `<button class="btn btn-sm btn-outline" data-cap-action="cap-prod-reset-month" title="Reset to current month">Reset</button>`
                : ''
            }
          </div>
        </div>
        <div class="pc-chart-wrap">
          <canvas id="prodCapWorkAreaChart" style="width:100%;height:280px"></canvas>
        </div>
      </div>

      <!-- Monthly Table -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title">Monthly Breakdown — ${esc(wa)}</div>
        </div>
        <div class="pc-table-wrap">
          <table class="pc-tbl">
            <thead>
              <tr>
                <th>Month</th>
                <th>Staff</th>
                <th>Capacity (h)</th>
                <th>Demand (h)</th>
                <th>Headroom</th>
                <th>Utilisation</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Active Batch List -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title">Active Batches — ${esc(wa)}</div>
          <div class="pc-card-sub">${waBatches.length} batch${
    waBatches.length !== 1 ? 'es' : ''
  } in progress / planned</div>
        </div>
        <div class="pc-table-wrap">
          <table class="pc-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Qty</th>
                <th>Dates</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${batchRows}</tbody>
          </table>
        </div>
      </div>

    </div>
  `
}

export function prodCapDrawWorkAreaChart() {
  const canvas = document.getElementById('prodCapWorkAreaChart')
  if (!canvas || !prodCapWorkAreaSelected) return

  const wa = prodCapWorkAreaSelected
  const monthKeys = prodCapGet24MonthKeys()
  const workAreas = prodCapGetWorkAreas()
  const demandMx = prodCapCalcDemandMatrix(monthKeys)
  const supplyMx = prodCapCalcSupplyMatrix(monthKeys, workAreas)

  const labels = monthKeys.map((k) => prodCapMonthLabel(k))
  const demand = monthKeys.map((k) => Math.round((demandMx[k]?.[wa] || 0) * 10) / 10)
  const capacity = monthKeys.map((k) => Math.round(supplyMx[k]?.[wa] || 0))
  const utilFactor = Number(appState.prodCapUtilizationFactor) || 0
  const totalAvailable = monthKeys.map((k) => {
    const utilisedCapacity = Number(supplyMx[k]?.[wa] || 0)
    if (utilFactor <= 0) return 0
    return Math.round(utilisedCapacity / utilFactor)
  })

  if (prodCapWorkAreaChartInst) prodCapWorkAreaChartInst.destroy()

  prodCapWorkAreaChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Demand',
          data: demand,
          backgroundColor: 'rgba(59,130,246,0.7)',
          borderWidth: 0,
          borderRadius: 2,
          order: 1,
        },
        {
          label: 'Capacity',
          data: capacity,
          type: 'line',
          borderColor: '#ef4444',
          // Why: keep line at baseline even with other plotted series.
          stack: 'workarea-capacity-line',
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
        },
        {
          // Why: show full 100%-utilisation baseline for the selected work area.
          label: 'Total Available (100%)',
          data: totalAvailable,
          type: 'line',
          borderColor: '#64748b',
          backgroundColor: '#64748b',
          stack: 'workarea-available-line',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.3,
          pointRadius: 2,
          pointBackgroundColor: '#64748b',
          fill: false,
          order: 0
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'IBM Plex Sans', size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}h` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours', font: { size: 11 } },
          ticks: { callback: (v) => v.toLocaleString() + 'h' },
        },
      },
    },
  })
}
