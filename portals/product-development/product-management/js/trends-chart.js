/**
 * Overhaul Trends Chart & KPI visualization
 * Portfolio-level KPIs with year selector + per-product chart and inline history management
 */

import { esc, showToast } from '../../../../utils/js/helpers.js'
import {
  productsDataGetAll,
  productsDataGetHistory,
  productsDataDeleteHistory,
  productsDataAddHistory
} from './products-data.js'

let trendsChartInstance = null;
let trendsSelectedYear = null; // Will be set to first year on render
let trendsPreSelectProductId = null; // Set externally (e.g. from 📊 button) before calling renderAllProductsTrends

// ── Per-Product KPI Calculations ──────────────────────────────────────────

function calculateOverhaulKPIs(history) {
  if (history.length === 0) {
    return {
      current: 0, average: 0, minTime: 0, maxTime: 0,
      changePercent: 0, changeDirection: 'neutral',
      totalRecords: 0, latestDate: null, earliestDate: null
    };
  }

  const sorted = [...history].sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
  const hours = sorted.map(h => h.overhaul_hours);
  const current = hours[hours.length - 1];
  const earliest = hours[0];
  const average = hours.reduce((a, b) => a + b, 0) / hours.length;

  let changePercent = 0, changeDirection = 'neutral';
  if (earliest !== 0) {
    changePercent = ((current - earliest) / earliest) * 100;
    changeDirection = current < earliest ? 'improvement' : (current > earliest ? 'worsening' : 'neutral');
  }

  return {
    current,
    average: Math.round(average * 10) / 10,
    minTime: Math.min(...hours),
    maxTime: Math.max(...hours),
    changePercent: Math.round(changePercent * 10) / 10,
    changeDirection,
    totalRecords: history.length,
    latestDate: sorted[sorted.length - 1].effective_date,
    earliestDate: sorted[0].effective_date
  };
}

// ── Portfolio KPI Calculations ─────────────────────────────────────────────

function getAvailableYears() {
  const years = new Set();
  productsDataGetAll().forEach(p => {
    productsDataGetHistory(p.id).forEach(h => {
      years.add(new Date(h.effective_date).getFullYear());
    });
  });
  return [...years].sort((a, b) => b - a);
}

function calculatePortfolioKPIs(year) {
  const products = productsDataGetAll();

  // Flatten all history with product info attached
  const allHistory = [];
  products.forEach(p => {
    productsDataGetHistory(p.id).forEach(h => {
      allHistory.push({ ...h, _pid: p.id, _pname: p.name, _pcode: p.code });
    });
  });

  const filtered = year === 'all'
    ? allHistory
    : allHistory.filter(h => new Date(h.effective_date).getFullYear() === parseInt(year));

  const productsInPeriod = [...new Set(filtered.map(h => h._pid))];
  const productsWithHistory = products.filter(p => productsDataGetHistory(p.id).length > 0);

  const fleetAverage = productsWithHistory.length > 0
    ? productsWithHistory.reduce((sum, p) => sum + p.current_overhaul_hours, 0) / productsWithHistory.length
    : 0;
  const totalFleetHours = productsWithHistory.reduce((sum, p) => sum + p.current_overhaul_hours, 0);

  // Most improved in period (biggest absolute reduction in hours)
  let mostImproved = null;
  let biggestReduction = 0;
  productsInPeriod.forEach(pid => {
    const hist = filtered.filter(h => h._pid === pid)
      .sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
    if (hist.length >= 2) {
      const first = hist[0].overhaul_hours;
      const last = hist[hist.length - 1].overhaul_hours;
      const reduction = first - last;
      if (reduction > biggestReduction) {
        biggestReduction = reduction;
        mostImproved = {
          name: hist[0]._pname,
          reduction,
          percent: Math.round((reduction / first) * 100 * 10) / 10
        };
      }
    }
  });

  // Average change % across products with 2+ records in period
  const productChanges = [];
  productsInPeriod.forEach(pid => {
    const hist = filtered.filter(h => h._pid === pid)
      .sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
    if (hist.length >= 2 && hist[0].overhaul_hours !== 0) {
      const first = hist[0].overhaul_hours;
      const last = hist[hist.length - 1].overhaul_hours;
      productChanges.push(((last - first) / first) * 100);
    }
  });
  const avgChange = productChanges.length > 0
    ? Math.round(productChanges.reduce((a, b) => a + b, 0) / productChanges.length * 10) / 10
    : null;

  return {
    totalEstimations: filtered.length,
    productsUpdated: productsInPeriod.length,
    productsWithHistory: productsWithHistory.length,
    fleetAverage: Math.round(fleetAverage * 10) / 10,
    totalFleetHours: Math.round(totalFleetHours * 10) / 10,
    mostImproved,
    avgChange
  };
}

// ── Portfolio KPI Section HTML ─────────────────────────────────────────────

function renderPortfolioKpiGridHtml(kpis, year) {
  const avgChangeHtml = kpis.avgChange !== null
    ? `<span style="color:${kpis.avgChange < 0 ? 'var(--green)' : kpis.avgChange > 0 ? 'var(--red)' : 'var(--muted)'}">${kpis.avgChange > 0 ? '+' : ''}${kpis.avgChange}%</span>`
    : '<span style="color:var(--mid)">—</span>';

  const mostImprovedVal = kpis.mostImproved ? esc(kpis.mostImproved.name) : '—';
  const mostImprovedUnit = kpis.mostImproved
    ? `−${kpis.mostImproved.reduction.toFixed(1)}h (${kpis.mostImproved.percent}%)`
    : 'no data in period';

  return `
    <div class="kpi-card">
      <div class="kpi-label">Products Updated</div>
      <div class="kpi-value">${kpis.productsUpdated}</div>
      <div class="kpi-unit">of ${kpis.productsWithHistory} with history</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Fleet Average</div>
      <div class="kpi-value">${kpis.fleetAverage.toFixed(1)}</div>
      <div class="kpi-unit">hours per product</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Fleet Hours</div>
      <div class="kpi-value">${kpis.totalFleetHours.toFixed(1)}</div>
      <div class="kpi-unit">across all products</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Avg Change</div>
      <div class="kpi-value">${avgChangeHtml}</div>
      <div class="kpi-unit">across products with changes</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Most Improved</div>
      <div class="kpi-value" style="font-size:1em;">${mostImprovedVal}</div>
      <div class="kpi-unit">${mostImprovedUnit}</div>
    </div>
  `;
}

function renderPortfolioKPIsSection(year) {
  const years = getAvailableYears();
  const kpis = calculatePortfolioKPIs(year);

  return `
    <div class="portfolio-kpis-section">
      <div class="portfolio-kpis-header">
        <h3>Portfolio Overview</h3>
        <div class="year-selector-wrap">
          <label for="portfolioYearSelect">Year:</label>
          <select id="portfolioYearSelect" class="trend-select" style="width:auto;min-width:130px;">
            ${years.map(y => `<option value="${y}"${year == y ? ' selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="kpi-grid" id="portfolioKpiGrid">
        ${renderPortfolioKpiGridHtml(kpis, year)}
      </div>
    </div>
  `;
}

// ── Per-Product KPI Cards ──────────────────────────────────────────────────

function renderKPICards(kpis) {
  const directionIcon = kpis.changeDirection === 'improvement' ? '📈' :
                        kpis.changeDirection === 'worsening' ? '📉' : '→';
  const directionText = kpis.changeDirection === 'improvement' ? 'Improved' :
                        kpis.changeDirection === 'worsening' ? 'Increased' : 'Stable';
  const directionColor = kpis.changeDirection === 'improvement' ? 'var(--green)' :
                         kpis.changeDirection === 'worsening' ? 'var(--red)' : 'var(--muted)';

  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Current Overhaul Time</div>
        <div class="kpi-value">${kpis.current.toFixed(1)}</div>
        <div class="kpi-unit">hours</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Average Time</div>
        <div class="kpi-value">${kpis.average.toFixed(1)}</div>
        <div class="kpi-unit">hours</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Time Range</div>
        <div class="kpi-value">${kpis.minTime.toFixed(1)} − ${kpis.maxTime.toFixed(1)}</div>
        <div class="kpi-unit">hours</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Trend Direction</div>
        <div class="kpi-value" style="color:${directionColor};">${directionIcon} ${directionText}</div>
        <div class="kpi-unit">${kpis.changePercent > 0 ? '+' : ''}${kpis.changePercent}% change</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Records</div>
        <div class="kpi-value">${kpis.totalRecords}</div>
        <div class="kpi-unit">estimations</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Date Range</div>
        <div class="kpi-value" style="font-size:0.95em;">${kpis.earliestDate} to ${kpis.latestDate}</div>
        <div class="kpi-unit">&nbsp;</div>
      </div>
    </div>
  `;
}

// ── Chart ──────────────────────────────────────────────────────────────────

function renderLineChart(productId, history) {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas || history.length === 0) return;

  const ctx = canvas.getContext('2d');

  if (trendsChartInstance) {
    trendsChartInstance.destroy();
    trendsChartInstance = null;
  }

  const sorted = [...history].sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));
  const labels = sorted.map(h => h.effective_date);
  const data = sorted.map(h => h.overhaul_hours);
  const reasons = sorted.map(h => h.change_reason || '—');
  const average = data.reduce((a, b) => a + b, 0) / data.length;

  // Resolve CSS custom properties for Chart.js (getComputedStyle required — Chart.js cannot use var())
  const chartStyle = getComputedStyle(document.documentElement);
  const cGreen  = chartStyle.getPropertyValue('--green').trim();
  const cAmber  = chartStyle.getPropertyValue('--amber').trim();
  const cLine   = chartStyle.getPropertyValue('--line').trim();
  const cMuted  = chartStyle.getPropertyValue('--muted').trim();
  const cWhite  = chartStyle.getPropertyValue('--white').trim();

  trendsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Overhaul Time (hours)',
          data,
          borderColor: cGreen,
          backgroundColor: cLine,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: cGreen,
          pointBorderColor: cWhite,
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: cGreen
        },
        {
          label: 'Average (' + average.toFixed(1) + 'h)',
          data: Array(labels.length).fill(average),
          borderColor: cAmber,
          borderDash: [5, 5],
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { size: 12, weight: '500' }, padding: 15, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            afterLabel: (context) => context.datasetIndex === 0 ? 'Reason: ' + reasons[context.dataIndex] : ''
          }
        }
      },
      scales: {
        x: {
          grid: { color: cLine, drawBorder: false },
          ticks: { font: { size: 11 }, color: cMuted }
        },
        y: {
          beginAtZero: false,
          grid: { color: cLine, drawBorder: false },
          ticks: { font: { size: 11 }, color: cMuted },
          title: { display: true, text: 'Overhaul Time (hours)', font: { weight: 'bold' } }
        }
      }
    }
  });
}

// ── Product Detail (KPIs + chart + inline history) ─────────────────────────

function renderProductDetail(productId) {
  const chartContainer = document.getElementById('trendChart');
  if (!chartContainer) return;

  if (!productId) {
    chartContainer.innerHTML = '';
    return;
  }

  const product = productsDataGetAll().find(p => p.id === productId);
  if (!product) return;

  const history = productsDataGetHistory(productId);
  const kpis = calculateOverhaulKPIs(history);
  const sorted = [...history].sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
  const today = new Date().toISOString().split('T')[0];

  const historyTableHtml = sorted.length === 0
    ? '<p style="color:var(--mid);font-size:0.9em;margin:0 0 12px;">No history records yet. Add the first estimation below.</p>'
    : `<div style="overflow-x:auto;margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Total (hrs)</th>
              <th>Change (hrs)</th>
              <th>Change Reason</th>
              <th>Notes</th>
              <th>Created By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(h => {
              const delta = h.time_impact_hours;
              const deltaStr = delta == null ? '—'
                : delta > 0 ? `<span style="color:var(--red)">+${delta.toFixed(1)}</span>`
                : delta < 0 ? `<span style="color:var(--green)">${delta.toFixed(1)}</span>`
                : '0.0';
              return `
              <tr>
                <td><strong>${esc(h.effective_date)}</strong></td>
                <td class="numeric">${h.overhaul_hours.toFixed(1)}</td>
                <td class="numeric">${deltaStr}</td>
                <td>${esc(h.change_reason || '—')}</td>
                <td>${esc(h.notes || '—')}</td>
                <td>${esc(h.created_by_name || '—')}</td>
                <td>
                  <button class="btn-icon" data-action="del-history"
                    data-history-id="${h.id}" data-product-id="${productId}" title="Delete">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

  const chartSection = history.length > 0
    ? `<div class="product-chart-wrap"><canvas id="chartCanvas"></canvas></div>`
    : `<div class="empty-state" style="margin:20px 0;">No history data — add an estimation to see the trend chart.</div>`;

  chartContainer.innerHTML = `
    ${renderKPICards(kpis)}
    ${chartSection}
    <div class="history-inline-section">
      <div class="history-inline-header">
        <h4>Estimation History</h4>
        <button class="btn btn-primary" style="padding:6px 14px;font-size:0.9em;"
          data-action="toggle-add-form">+ Add Estimation</button>
      </div>
      ${historyTableHtml}
      <div id="inlineAddForm" class="inline-add-form" style="display:none;">
        <div class="inline-form-grid">
          <div class="form-group">
            <label>Effective Date *</label>
            <input type="date" id="inlineHistoryDate" value="${today}">
          </div>
          <div class="form-group">
            <label>
              Time Change (hours) *
              <span class="field-tooltip" title="Enter how many hours this change adds or removes. Use a negative number for an improvement — e.g. −2 means the overhaul now takes 2 hours less. The new total will be calculated automatically from the current value.">ⓘ</span>
            </label>
            <input type="number" id="inlineHistoryDelta" step="0.5" placeholder="e.g. −2 or +3">
          </div>
          <div class="form-group">
            <label>Change Reason</label>
            <select id="inlineHistoryReason">
              <option value="">Select a reason...</option>
              <option value="Process Improvement">Process Improvement</option>
              <option value="Equipment Upgrade">Equipment Upgrade</option>
              <option value="Scope Change">Scope Change</option>
              <option value="Efficiency Gain">Efficiency Gain</option>
              <option value="Design Change">Design Change</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="inlineHistoryNotes" rows="2"></textarea>
          </div>
        </div>
        <div class="inline-form-actions">
          <button class="btn btn-primary" data-action="save-history" data-product-id="${productId}">Save</button>
          <button class="btn btn-secondary" data-action="cancel-add-form">Cancel</button>
        </div>
      </div>
    </div>
  `;

  if (history.length > 0) {
    renderLineChart(productId, history);
  }
}

// ── Main Trends Tab Render ─────────────────────────────────────────────────

export function renderAllProductsTrends() {
  const container = document.getElementById('productsTrends');
  const products = productsDataGetAll();

  if (products.length === 0) {
    container.innerHTML = '<div class="empty-state">No products to display trends. Add products first.</div>';
    return;
  }

  // Initialize trendsSelectedYear to first year if not set
  const years = getAvailableYears();
  if (!trendsSelectedYear && years.length > 0) {
    trendsSelectedYear = years[0];
  }

  const productTrends = products.map(p => {
    const history = productsDataGetHistory(p.id);
    return { product: p, kpis: calculateOverhaulKPIs(history), history };
  }).filter(pt => pt.history.length > 0);

  const preSelect = trendsPreSelectProductId;
  trendsPreSelectProductId = null; // Consume immediately

  container.innerHTML = `
    ${renderPortfolioKPIsSection(trendsSelectedYear)}

    <div class="trends-detail-section">
      <div class="trends-header">
        <h3>Product Detail</h3>
        <div class="trend-tabs">
          <button class="trend-tab-btn active" data-view="single">Single Product</button>
          <button class="trend-tab-btn" data-view="compare">Compare All</button>
        </div>
      </div>

      <div id="singleProductView" class="trend-view-content active">
        <div class="trend-controls">
          <select id="trendProductSelect" class="trend-select">
            <option value="">Choose a product...</option>
            ${products.map(p => {
              const histCount = productsDataGetHistory(p.id).length;
              const sel = preSelect === p.id ? ' selected' : '';
              const badge = histCount > 0 ? ` · ${histCount} record${histCount > 1 ? 's' : ''}` : '';
              return `<option value="${p.id}"${sel}>${esc(p.name)} (${esc(p.code)})${badge}</option>`;
            }).join('')}
          </select>
        </div>
        <div id="trendChart" style="margin-top:20px;"></div>
      </div>

      <div id="compareProductsView" class="trend-view-content">
        ${productTrends.length === 0
          ? '<div class="empty-state">No products have overhaul history yet.</div>'
          : `<div class="comparison-grid">
              ${productTrends.map(pt => `
                <div class="comparison-card">
                  <div class="card-header">
                    <h4>${esc(pt.product.name)}</h4>
                    <span class="card-code">${esc(pt.product.code)}</span>
                  </div>
                  <div class="card-kpis">
                    <div class="mini-kpi">
                      <span class="mini-label">Current</span>
                      <span class="mini-value">${pt.kpis.current.toFixed(1)}h</span>
                    </div>
                    <div class="mini-kpi">
                      <span class="mini-label">Average</span>
                      <span class="mini-value">${pt.kpis.average.toFixed(1)}h</span>
                    </div>
                    <div class="mini-kpi">
                      <span class="mini-label">Trend</span>
                      <span class="mini-value" style="color:${pt.kpis.changeDirection === 'improvement' ? 'var(--green)' : pt.kpis.changeDirection === 'worsening' ? 'var(--red)' : 'var(--muted)'};">
                        ${pt.kpis.changeDirection === 'improvement' ? '📈' : pt.kpis.changeDirection === 'worsening' ? '📉' : '→'}
                        ${Math.abs(pt.kpis.changePercent)}%
                      </span>
                    </div>
                    <div class="mini-kpi">
                      <span class="mini-label">Records</span>
                      <span class="mini-value">${pt.kpis.totalRecords}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    </div>
  `;

  // If a product was pre-selected, auto-render its detail
  if (preSelect) {
    renderProductDetail(preSelect);
  }

  // ── Delegated event handling ───────────────────────────────────────────

  container.addEventListener('change', (e) => {
    if (e.target.id === 'portfolioYearSelect') {
      trendsSelectedYear = e.target.value;
      const kpis = calculatePortfolioKPIs(trendsSelectedYear);
      const grid = document.getElementById('portfolioKpiGrid');
      if (grid) grid.innerHTML = renderPortfolioKpiGridHtml(kpis, trendsSelectedYear);
    }

    if (e.target.id === 'trendProductSelect') {
      renderProductDetail(e.target.value);
    }
  });

  container.addEventListener('click', async (e) => {
    // Check for tab switching first
    if (e.target.classList.contains('trend-tab-btn')) {
      const view = e.target.dataset.view;
      container.querySelectorAll('.trend-tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.trend-view-content').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      document.getElementById(view === 'single' ? 'singleProductView' : 'compareProductsView').classList.add('active');
      return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'toggle-add-form') {
      const form = document.getElementById('inlineAddForm');
      if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
      return;
    }

    if (action === 'cancel-add-form') {
      const form = document.getElementById('inlineAddForm');
      if (form) form.style.display = 'none';
      return;
    }

    if (action === 'del-history') {
      const historyId = btn.dataset.historyId;
      const productId = btn.dataset.productId;
      if (confirm('Delete this history record?')) {
        await productsDataDeleteHistory(productId, historyId);
        renderProductDetail(productId);
        // Refresh portfolio KPIs
        const kpis = calculatePortfolioKPIs(trendsSelectedYear);
        const grid = document.getElementById('portfolioKpiGrid');
        if (grid) grid.innerHTML = renderPortfolioKpiGridHtml(kpis, trendsSelectedYear);
      }
      return;
    }

    if (action === 'save-history') {
      const productId = btn.dataset.productId;
      const date = document.getElementById('inlineHistoryDate')?.value;
      const deltaVal = document.getElementById('inlineHistoryDelta')?.value;
      const delta = parseFloat(deltaVal);

      if (!date || deltaVal === '' || isNaN(delta)) {
        showToast('Please enter a date and a time change (hours).', 'warning');
        return;
      }

      const historyData = {
        time_impact_hours: delta,
        effective_date: date,
        change_reason: document.getElementById('inlineHistoryReason')?.value || '',
        notes: document.getElementById('inlineHistoryNotes')?.value || ''
      };

      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        await productsDataAddHistory(productId, historyData);
        renderProductDetail(productId);
        // Refresh portfolio KPIs
        const kpis = calculatePortfolioKPIs(trendsSelectedYear);
        const grid = document.getElementById('portfolioKpiGrid');
        if (grid) grid.innerHTML = renderPortfolioKpiGridHtml(kpis, trendsSelectedYear);
        // Refresh year selector options in case this is a new year
        const yearSel = document.getElementById('portfolioYearSelect');
        if (yearSel) {
          const years = getAvailableYears();
          yearSel.innerHTML = years.map(y => `<option value="${y}"${trendsSelectedYear == y ? ' selected' : ''}>${y}</option>`).join('');
        }
      } catch (err) {
        showToast('Error saving estimation: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Save Estimation';
      }
      return;
    }
  });
}

export function setTrendsPreSelectProductId(productId) {
  trendsPreSelectProductId = productId || null
}
