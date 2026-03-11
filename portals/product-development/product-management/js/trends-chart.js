/**
 * Overhaul Trends Chart & KPI visualization
 * Enhanced charting with Chart.js for product overhaul analysis
 */

let trendsChartInstance = null;

/**
 * Calculate KPIs for a product's overhaul history
 */
function calculateOverhaulKPIs(history) {
  if (history.length === 0) {
    return {
      current: 0,
      average: 0,
      minTime: 0,
      maxTime: 0,
      changePercent: 0,
      changeDirection: 'neutral',
      totalRecords: 0,
      latestDate: null,
      earliestDate: null
    };
  }

  // Sort by effective date (oldest first)
  const sorted = [...history].sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));

  const hours = sorted.map(h => h.overhaul_hours);
  const current = hours[hours.length - 1]; // Latest
  const earliest = hours[0]; // Oldest
  const average = hours.reduce((a, b) => a + b, 0) / hours.length;
  const min = Math.min(...hours);
  const max = Math.max(...hours);

  // Calculate change as percentage from earliest to current
  let changePercent = 0;
  let changeDirection = 'neutral';
  if (earliest !== 0) {
    changePercent = ((current - earliest) / earliest) * 100;
    changeDirection = current < earliest ? 'improvement' : (current > earliest ? 'worsening' : 'neutral');
  }

  return {
    current,
    average: Math.round(average * 10) / 10,
    minTime: min,
    maxTime: max,
    changePercent: Math.round(changePercent * 10) / 10,
    changeDirection,
    totalRecords: history.length,
    latestDate: sorted[sorted.length - 1].effective_date,
    earliestDate: sorted[0].effective_date
  };
}

/**
 * Render KPI cards for a single product
 */
function renderKPICards(kpis) {
  const directionIcon = kpis.changeDirection === 'improvement' ? '📈' :
                        kpis.changeDirection === 'worsening' ? '📉' : '→';
  const directionText = kpis.changeDirection === 'improvement' ? 'Improved' :
                        kpis.changeDirection === 'worsening' ? 'Increased' : 'Stable';
  const directionColor = kpis.changeDirection === 'improvement' ? '#2e7d32' :
                         kpis.changeDirection === 'worsening' ? '#c62828' : '#666';

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
        <div class="kpi-value" style="color: ${directionColor};">${directionIcon} ${directionText}</div>
        <div class="kpi-unit">${kpis.changePercent > 0 ? '+' : ''}${kpis.changePercent}% change</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Total Records</div>
        <div class="kpi-value">${kpis.totalRecords}</div>
        <div class="kpi-unit">estimations</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Date Range</div>
        <div class="kpi-value" style="font-size: 0.95em;">${kpis.earliestDate} to ${kpis.latestDate}</div>
        <div class="kpi-unit">&nbsp;</div>
      </div>
    </div>
  `;
}

/**
 * Render line chart using Chart.js
 */
function renderLineChart(productId, history) {
  const container = document.getElementById('trendChart');

  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">No history data for this product.</div>';
    return;
  }

  // Sort by effective date (oldest first)
  const sorted = [...history].sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));

  const labels = sorted.map(h => h.effective_date);
  const data = sorted.map(h => h.overhaul_hours);
  const reasons = sorted.map(h => h.change_reason || '—');

  // Create canvas if not exists
  if (!document.getElementById('chartCanvas')) {
    container.innerHTML = '<canvas id="chartCanvas"></canvas>';
  }

  const ctx = document.getElementById('chartCanvas').getContext('2d');

  // Destroy existing chart if any
  if (trendsChartInstance) {
    trendsChartInstance.destroy();
  }

  const average = data.reduce((a, b) => a + b, 0) / data.length;

  trendsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Overhaul Time (hours)',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.05)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#45a049',
          segment: {
            borderDash: (ctx) => ctx.p0DataIndex === undefined ? [] : []
          }
        },
        {
          label: 'Average (' + average.toFixed(1) + 'h)',
          data: Array(labels.length).fill(average),
          borderColor: '#FF9800',
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
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12, weight: '500' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            afterLabel: function(context) {
              if (context.datasetIndex === 0) {
                return 'Reason: ' + reasons[context.dataIndex];
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: { size: 11 },
            color: '#666'
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: { size: 11 },
            color: '#666'
          },
          title: {
            display: true,
            text: 'Overhaul Time (hours)',
            font: { weight: 'bold' }
          }
        }
      }
    }
  });
}

/**
 * Render all products comparison grid
 */
function renderAllProductsTrends() {
  const container = document.getElementById('productsTrends');
  const products = productsDataGetAll();

  if (products.length === 0) {
    container.innerHTML = '<div class="empty-state">No products to display trends. Add products first.</div>';
    return;
  }

  // Build comparison data
  const productTrends = products.map(p => {
    const history = productsDataGetHistory(p.id);
    const kpis = calculateOverhaulKPIs(history);
    return { product: p, kpis, history };
  }).filter(pt => pt.history.length > 0); // Only products with history

  if (productTrends.length === 0) {
    container.innerHTML = '<div class="empty-state">No products have overhaul history yet. Add estimations to see trends.</div>';
    return;
  }

  let html = `
    <div class="trends-header">
      <h3>Overhaul Time Trends</h3>
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
            const hist = productsDataGetHistory(p.id);
            const badge = hist.length > 0 ? `<span class="history-badge">${hist.length}</span>` : '';
            return `<option value="${p.id}">${p.name} (${p.code})</option>`;
          }).join('')}
        </select>
      </div>
      <div id="trendChart" style="margin-top: 20px;"></div>
    </div>

    <div id="compareProductsView" class="trend-view-content">
      <div class="comparison-grid">
        ${productTrends.map(pt => `
          <div class="comparison-card">
            <div class="card-header">
              <h4>${pt.product.name}</h4>
              <span class="card-code">${pt.product.code}</span>
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
                <span class="mini-value" style="color: ${pt.kpis.changeDirection === 'improvement' ? '#2e7d32' : pt.kpis.changeDirection === 'worsening' ? '#c62828' : '#666'};">
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
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Setup event listeners
  document.querySelectorAll('.trend-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.trend-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.trend-view-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(view === 'single' ? 'singleProductView' : 'compareProductsView').classList.add('active');
    });
  });

  document.getElementById('trendProductSelect').addEventListener('change', (e) => {
    const productId = e.target.value;
    if (productId) {
      const history = productsDataGetHistory(productId);
      const kpis = calculateOverhaulKPIs(history);
      const kpiHtml = renderKPICards(kpis);
      const chartContainer = document.getElementById('trendChart');
      chartContainer.innerHTML = kpiHtml + '<div id="chartCanvas" style="margin-top: 30px;"></div>';
      renderLineChart(productId, history);
    } else {
      document.getElementById('trendChart').innerHTML = '';
    }
  });
}
