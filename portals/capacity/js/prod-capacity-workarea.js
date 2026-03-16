// ═══════════════════════════════════════════════════════════════
// prod-capacity-workarea.js — Capacity by Work Area Tab
// Per-area chart + monthly breakdown table + active batch list
// Depends on: prod-capacity-data.js, Chart.js
// ═══════════════════════════════════════════════════════════════

let prodCapWorkAreaSelected = null;
let prodCapWorkAreaChartInst = null;

window.prodCapSetWorkArea = function(workArea) {
  prodCapWorkAreaSelected = workArea || null;
};

function renderProdCapWorkArea() {
  const workAreas = prodCapGetWorkAreas();

  if (workAreas.length === 0) {
    return `
      <div class="pc-empty">
        <div class="pc-empty-icon">🏭</div>
        <div class="pc-empty-title">No work areas found</div>
        <div class="pc-empty-sub">Add work locations to products in Product Management, then schedule batches in Production → Schedule.</div>
      </div>`;
  }

  if (!prodCapWorkAreaSelected || !workAreas.includes(prodCapWorkAreaSelected)) {
    prodCapWorkAreaSelected = workAreas[0];
  }

  const monthKeys = prodCapGet24MonthKeys();
  const demandMx  = prodCapCalcDemandMatrix(monthKeys);
  const supplyMx  = prodCapCalcSupplyMatrix(monthKeys, workAreas);

  // ── Area tabs ─────────────────────────────────────────────
  const tabPills = workAreas.map(wa => {
    const active = wa === prodCapWorkAreaSelected;
    return `
      <button class="pc-nav-btn ${active ? 'active' : ''}" data-cap-action="cap-prod-set-workarea" data-workarea="${esc(wa)}">
        ${esc(wa)}
      </button>`;
  }).join('');

  // ── Per-area data for selected area ──────────────────────
  const wa      = prodCapWorkAreaSelected;
  const waProds = (prodState?.products || []).filter(p => p.work_location === wa);
  const waBatches = (prodState?.batches || []).filter(b =>
    b.work_location === wa && b.status !== 'Complete'
  );

  // Monthly breakdown for selected area
  const tableRows = monthKeys.map(key => {
    const demand = demandMx[key]?.[wa] || 0;
    const supply = supplyMx[key]?.[wa]  || 0;
    const { year, month } = prodCapParseKey(key);
    const staff  = prodCapDataGetStaff(wa, year, month);
    const util   = prodCapUtil(demand, supply);
    const over   = supply > 0 && demand > supply;
    const noCap  = supply === 0 && demand > 0;

    const utilColor = util < 80 ? 'var(--green)' : util < 100 ? 'var(--amber)' : 'var(--red)';
    const rowStyle  = over ? 'background:rgba(239,68,68,0.06)' : noCap ? 'background:rgba(245,158,11,0.06)' : '';
    const barWidth  = supply > 0 ? Math.min(100, (demand / supply) * 100) : demand > 0 ? 100 : 0;

    return `
      <tr style="${rowStyle}">
        <td class="pc-tbl-month">${prodCapMonthLabel(key)}</td>
        <td class="pc-tbl-num">${staff > 0 ? staff : '—'}</td>
        <td class="pc-tbl-num">${supply > 0 ? Math.round(supply).toLocaleString() + 'h' : '—'}</td>
        <td class="pc-tbl-num">${demand > 0 ? Math.round(demand).toLocaleString() + 'h' : '—'}</td>
        <td class="pc-tbl-num">
          ${supply > demand ? `<span style="color:var(--green)">+${Math.round(supply-demand).toLocaleString()}h</span>`
          : supply === 0 && demand === 0 ? '—'
          : `<span style="color:var(--red)">${Math.round(supply-demand).toLocaleString()}h</span>`}
        </td>
        <td style="min-width:140px">
          <div class="pc-util-bar-wrap">
            <div class="pc-util-bar" style="width:${barWidth}%;background:${utilColor}"></div>
            <span style="color:${utilColor};font-size:11px;font-weight:600;margin-left:6px">
              ${supply > 0 ? util + '%' : noCap ? '?' : '—'}
            </span>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Active batches for this area
  const batchRows = waBatches.length === 0
    ? `<tr><td colspan="6" class="pc-tbl-empty">No active batches for ${esc(wa)}</td></tr>`
    : waBatches
        .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
        .map(batch => {
          const prod = (prodState?.products || []).find(p => p.id === batch.product_id);
          const totalHours = prod ? (Number(prod.current_overhaul_hours) || 0) * (batch.quantity || 0) : 0;
          const statusColor = batch.status === 'In Progress' ? 'var(--amber)' :
                              batch.status === 'Complete'    ? 'var(--green)'  : 'var(--muted)';
          return `
            <tr>
              <td>${prod ? esc(prod.name) : '—'}</td>
              <td class="pc-tbl-mono">${prod ? esc(prod.code || '—') : '—'}</td>
              <td class="pc-tbl-num">${batch.quantity || '—'}</td>
              <td class="pc-tbl-mono">${formatDisplayDate(batch.start_date) || '—'} → ${formatDisplayDate(batch.due_date) || '—'}</td>
              <td class="pc-tbl-num">${totalHours > 0 ? Math.round(totalHours).toLocaleString() + 'h' : '—'}</td>
              <td><span style="color:${statusColor};font-size:11px;font-weight:600">${esc(batch.status || '—')}</span></td>
            </tr>`;
        }).join('');

  // ── Month offset indicator
  const offsetLabel = prodCapMonthOffset === 0 ? 'Current' :
                      prodCapMonthOffset > 0 ? `+${prodCapMonthOffset} month${prodCapMonthOffset > 1 ? 's' : ''}` :
                      `${prodCapMonthOffset} month${prodCapMonthOffset < -1 ? 's' : ''}`;

  return `
    <div class="pc-workarea">

      <!-- Work Area Tabs -->
      <div class="pc-nav" style="margin-bottom:20px">${tabPills}</div>

      <!-- Perpetual Window Controls -->
      <div class="pc-window-controls">
        <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-prev-month" title="View previous month">← Previous</button>
        <div class="pc-window-label">${offsetLabel}</div>
        <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-next-month" title="View next month">Next →</button>
        ${prodCapMonthOffset !== 0 ? `<button class="btn btn-sm btn-outline" data-cap-action="cap-prod-reset-month" title="Reset to current month">Reset</button>` : ''}
      </div>

      <!-- Chart -->
      <div class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title">${esc(wa)} — 2-Year Capacity vs Demand</div>
          <div class="pc-card-sub">Available hours (capacity) vs scheduled workload (demand)</div>
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
          <div class="pc-card-sub">${waBatches.length} batch${waBatches.length !== 1 ? 'es' : ''} in progress / planned</div>
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
  `;
}

function prodCapDrawWorkAreaChart() {
  const canvas = document.getElementById('prodCapWorkAreaChart');
  if (!canvas || !prodCapWorkAreaSelected) return;

  const wa        = prodCapWorkAreaSelected;
  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();
  const demandMx  = prodCapCalcDemandMatrix(monthKeys);
  const supplyMx  = prodCapCalcSupplyMatrix(monthKeys, workAreas);

  const labels   = monthKeys.map(k => prodCapMonthLabel(k));
  const demand   = monthKeys.map(k => Math.round((demandMx[k]?.[wa] || 0) * 10) / 10);
  const capacity = monthKeys.map(k => Math.round(supplyMx[k]?.[wa]  || 0));

  if (prodCapWorkAreaChartInst) prodCapWorkAreaChartInst.destroy();

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
          order: 1,
        },
        {
          label: 'Capacity',
          data: capacity,
          type: 'line',
          borderColor: 'rgba(239,68,68,0.9)',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          pointBackgroundColor: 'rgba(239,68,68,0.9)',
          backgroundColor: 'transparent',
          fill: false,
          order: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'IBM Plex Sans', size: 11 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}h` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours', font: { size: 11 } },
          ticks: { callback: v => v.toLocaleString() + 'h' }
        }
      }
    }
  });
}
