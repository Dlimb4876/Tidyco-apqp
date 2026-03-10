// Production Planning Views

function renderPlanByProduct() {
  const activeProducts = prodState.products.filter(p => p.status === 'active');

  let content = '';
  activeProducts.forEach(product => {
    const batches = prodDataGetBatchesByProduct(product.id);

    let batchesHtml = '';
    if (batches.length === 0) {
      batchesHtml = '<div style="padding:12px;color:var(--muted);font-style:italic">No batches scheduled</div>';
    } else {
      batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')).forEach((batch, idx) => {
        const statusBadge = getStatusBadge(batch.status);
        batchesHtml += `
          <div class="batch-item">
            <div class="batch-num">Batch ${idx + 1}</div>
            <div class="batch-unit">${batch.unit}</div>
            <div class="batch-qty">${batch.quantity || '—'} units</div>
            <div class="batch-dates">${batch.start_date || '—'} to ${batch.due_date || '—'}</div>
            <div class="batch-status">${statusBadge}</div>
          </div>
        `;
      });
    }

    content += `
      <div class="product-card">
        <div class="product-header">
          <div>
            <div class="product-name">${esc(product.name)}</div>
            <div class="product-code">${esc(product.code || 'N/A')}</div>
          </div>
          <div class="product-meta">
            ${product.family ? `<span>${esc(product.family)}</span>` : ''}
            ${product.lead_time_days ? `<span>${product.lead_time_days}d lead time</span>` : ''}
          </div>
        </div>
        <div class="batches-list">
          ${batchesHtml}
        </div>
      </div>
    `;
  });

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCTION PLAN</div>
          <div class="sec-title">By Product</div>
          <div class="sec-desc">Batches grouped by product</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
      </div>

      <div class="prod-plan-grid">
        ${content || '<div style="padding:32px;text-align:center;color:var(--muted)">No active products to display</div>'}
      </div>
    </div>
  `;
}

function renderPlanByUnit() {
  const units = ['Unit 2', 'Unit 3', 'Unit 6'];
  const activeUnit = prodState.activeUnit || 'Unit 2';

  // Generate tabs
  let tabsHtml = units.map(unit => {
    const batches = prodDataGetBatchesByUnit(unit);
    const count = batches.length;
    const isActive = unit === activeUnit;
    return `
      <button
        class="unit-tab ${isActive ? 'active' : ''}"
        onclick="prodSetActiveUnit('${unit}'); navigate('production?pt=by-unit')"
      >
        ${unit} <span class="tab-count">${count}</span>
      </button>
    `;
  }).join('');

  // Render timeline for active unit
  const batches = prodDataGetBatchesByUnit(activeUnit);
  const sortedBatches = batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  // Calculate date range
  let minDate = null, maxDate = null;
  sortedBatches.forEach(batch => {
    if (batch.start_date) {
      minDate = !minDate || batch.start_date < minDate ? batch.start_date : minDate;
    }
    if (batch.due_date) {
      maxDate = !maxDate || batch.due_date > maxDate ? batch.due_date : maxDate;
    }
  });

  // Generate week headers and batch timeline
  let timelineHtml = '';
  if (sortedBatches.length === 0) {
    timelineHtml = '<div style="padding:32px;text-align:center;color:var(--muted);font-style:italic">No batches scheduled for this unit</div>';
  } else {
    // Build timeline with weeks
    const weeks = getWeeksInRange(minDate, maxDate);
    const weekHeadersHtml = weeks.map(week => {
      return `<div class="week-header">${formatWeekRange(week.start, week.end)}</div>`;
    }).join('');

    const batchesHtml = sortedBatches.map(batch => {
      const product = prodDataGetProductById(batch.product_id);
      const productName = product ? `${product.code || 'Unknown'}` : 'Unknown';
      const statusBadge = getStatusBadge(batch.status);

      return `
        <div class="timeline-batch">
          <div class="tb-meta">
            <div class="tb-product">${esc(productName)}</div>
            <div class="tb-info">
              <span>${batch.quantity || '—'} qty</span>
              <span>${batch.start_date || '—'} to ${batch.due_date || '—'}</span>
            </div>
          </div>
          <div class="tb-status">${statusBadge}</div>
        </div>
      `;
    }).join('');

    timelineHtml = `
      <div class="timeline-weeks">
        ${weekHeadersHtml}
      </div>
      <div class="timeline-batches">
        ${batchesHtml}
      </div>
    `;
  }

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCTION PLAN</div>
          <div class="sec-title">By Unit</div>
          <div class="sec-desc">Weekly production schedule</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
      </div>

      <div class="unit-tabs-container">
        ${tabsHtml}
      </div>

      <div class="unit-timeline">
        ${timelineHtml}
      </div>
    </div>
  `;
}

function getWeeksInRange(startStr, endStr) {
  if (!startStr || !endStr) return [];

  const start = new Date(startStr);
  const end = new Date(endStr);
  const weeks = [];

  let current = new Date(start);
  current.setDate(current.getDate() - current.getDay() + 1); // Start on Monday

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6); // End on Sunday

    weeks.push({ start: weekStart, end: weekEnd });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

function formatWeekRange(startDate, endDate) {
  const fmt = (d) => {
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${day}/${m}`;
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function getStatusBadge(status) {
  let color = 'var(--muted)';
  let emoji = '⚪';

  if (status === 'Complete') {
    color = 'var(--green)';
    emoji = '🟢';
  } else if (status === 'In Progress') {
    color = 'var(--amber)';
    emoji = '🟡';
  }

  return `<span style="color:${color};font-size:12px;font-weight:600">${emoji} ${status}</span>`;
}
