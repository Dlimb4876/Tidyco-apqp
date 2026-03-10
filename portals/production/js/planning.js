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
        onclick="prodSetActiveUnit('${unit}'); setProductionTab('by-unit')"
      >
        ${unit} <span class="tab-count">${count}</span>
      </button>
    `;
  }).join('');

  // Render Gantt timeline for active unit
  const batches = prodDataGetBatchesByUnit(activeUnit);
  const sortedBatches = batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  // Calculate date range (add 7 days padding to end)
  let minDate = null, maxDate = null;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  sortedBatches.forEach(batch => {
    if (batch.start_date) {
      minDate = !minDate || batch.start_date < minDate ? batch.start_date : minDate;
    }
    if (batch.due_date) {
      maxDate = !maxDate || batch.due_date > maxDate ? batch.due_date : maxDate;
    }
  });

  // Ensure at least 4 weeks of view
  if (minDate && maxDate) {
    const startD = new Date(minDate);
    const endD = new Date(maxDate);
    const diff = (endD - startD) / (1000 * 60 * 60 * 24);
    if (diff < 28) {
      const endD2 = new Date(endD);
      endD2.setDate(endD2.getDate() + (28 - diff));
      maxDate = endD2.toISOString().split('T')[0];
    }
  } else if (sortedBatches.length === 0) {
    const start = new Date();
    minDate = start.toISOString().split('T')[0];
    const end = new Date(start);
    end.setDate(end.getDate() + 28);
    maxDate = end.toISOString().split('T')[0];
  }

  let timelineHtml = '';
  if (sortedBatches.length === 0) {
    timelineHtml = '<div style="padding:32px;text-align:center;color:var(--muted);font-style:italic">No batches scheduled for this unit</div>';
  } else {
    timelineHtml = buildGanttTimeline(sortedBatches, minDate, maxDate, todayStr);
  }

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCTION PLAN</div>
          <div class="sec-title">By Unit</div>
          <div class="sec-desc">Gantt timeline showing due dates</div>
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

function buildGanttTimeline(batches, minDate, maxDate, todayStr) {
  const startDate = new Date(minDate);
  const endDate = new Date(maxDate);
  const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Generate week headers with labels
  let weekHeadersHtml = '';
  let dayHeadersHtml = '';
  let prevWeekNum = -1;
  for (let i = 0; i < dayDiff; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const weekNum = Math.floor(i / 7);
    const dayOfWeek = d.getDay();

    if (weekNum !== prevWeekNum) {
      // New week: calculate week end
      const weekEnd = new Date(startDate);
      weekEnd.setDate(startDate.getDate() + (weekNum + 1) * 7 - 1);
      const daysInWeek = Math.min(7, dayDiff - weekNum * 7);

      weekHeadersHtml += `<div class="gantt-week-header" style="grid-column: span ${daysInWeek};">
        <div class="gantt-week-label">Week ${weekNum + 1}</div>
        <div class="gantt-week-dates">${formatDateShort(d)} – ${formatDateShort(weekEnd)}</div>
      </div>`;
      prevWeekNum = weekNum;
    }

    // Day headers - show all dates
    dayHeadersHtml += `<div class="gantt-week-col" data-date="${dStr}" data-week="${weekNum}">
      <div class="gantt-date">${formatDateShort(d)}</div>
    </div>`;
  }

  // Generate batch rows with bars spanning their duration
  let batchRowsHtml = '';
  batches.forEach((batch, idx) => {
    const product = prodDataGetProductById(batch.product_id);
    const productName = product ? product.code : `Batch ${idx + 1}`;
    const startD = batch.start_date ? new Date(batch.start_date) : null;
    const endD = batch.due_date ? new Date(batch.due_date) : null;

    // Calculate bar position
    let startOffset = 0, duration = 1;
    if (startD && endD) {
      startOffset = Math.max(0, Math.ceil((startD - startDate) / (1000 * 60 * 60 * 24)));
      duration = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Determine bar color based on status and due date
    let barColor = 'var(--blue)';
    if (batch.status === 'Complete') {
      barColor = 'var(--green)';
    } else if (batch.status === 'In Progress') {
      barColor = 'var(--amber)';
    } else if (endD && endD < new Date(todayStr)) {
      barColor = 'var(--red)'; // Overdue
    }

    const statusBadge = getStatusBadge(batch.status);
    const isOverdue = endD && endD < new Date(todayStr) && batch.status !== 'Complete';
    const displayLabel = product ? esc(product.code) : `${batch.quantity || 0}u`;

    batchRowsHtml += `
      <div class="gantt-batch-row" data-batch-id="${batch.id}">
        <div class="gantt-batch-label">
          <div class="gantt-product-code">${esc(productName)}</div>
          <div class="gantt-batch-meta">${batch.quantity || 0} units • ${batch.start_date || '—'} to ${batch.due_date || '—'}</div>
        </div>
        <div class="gantt-batch-chart">
          <div class="gantt-bar-container">
            <div class="gantt-spacer" style="grid-column: ${startOffset + 1} / span 1;"></div>
            <div class="gantt-bar ${isOverdue ? 'overdue' : ''}"
                 style="grid-column: ${startOffset + 1} / span ${Math.max(1, duration)}; background-color: ${barColor};"
                 title="${esc(productName)} - ${batch.start_date} to ${batch.due_date}">
              <div class="gantt-bar-label">${displayLabel}</div>
            </div>
          </div>
        </div>
        <div class="gantt-batch-status">
          ${statusBadge}
        </div>
      </div>
    `;
  });

  return `
    <div class="gantt-container">
      <div class="gantt-header">
        <div class="gantt-header-label">Product</div>
        <div class="gantt-header-chart">
          <div class="gantt-week-row" style="display: grid; grid-template-columns: repeat(${dayDiff}, 1fr); gap: 1px;">
            ${weekHeadersHtml}
          </div>
          <div class="gantt-week-grid" style="display: grid; grid-template-columns: repeat(${dayDiff}, 1fr); gap: 1px;">
            ${dayHeadersHtml}
          </div>
        </div>
        <div class="gantt-header-status">Status</div>
      </div>
      <div class="gantt-rows">
        ${batchRowsHtml}
      </div>
      <div class="gantt-legend">
        <div class="gantt-legend-item">
          <div class="gantt-legend-color" style="background: var(--blue);"></div>
          <span>Planned</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color" style="background: var(--amber);"></div>
          <span>In Progress</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color" style="background: var(--green);"></div>
          <span>Complete</span>
        </div>
        <div class="gantt-legend-item">
          <div class="gantt-legend-color" style="background: var(--red);"></div>
          <span>Overdue</span>
        </div>
      </div>
    </div>
  `;
}

function formatDateShort(d) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${day}/${m}`;
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
