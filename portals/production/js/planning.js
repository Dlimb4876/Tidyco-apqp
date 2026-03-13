// Production Planning Views

function renderPlanByProduct() {
  const activeProducts = prodState.products.filter(p => p.status && p.status?.toLowerCase() !== 'closed' && p.status?.toLowerCase() !== 'inactive');

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
            <div class="batch-location">${batch.work_location || '—'}</div>
            <div class="batch-qty">${batch.quantity || '—'} units</div>
            <div class="batch-dates">${formatDisplayDate(batch.start_date) || '—'} to ${formatDisplayDate(batch.due_date) || '—'}</div>
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
            <div class="product-code">${esc(product.part_number || 'N/A')}</div>
          </div>
          <div class="product-meta">
            ${product.family ? `<span>${esc(getFamilies().find(f => f.id === product.family)?.label || product.family)}</span>` : ''}
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
    const batches = prodDataGetBatchesByWorkLocation(unit);
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
  const batches = prodDataGetBatchesByWorkLocation(activeUnit);
  const sortedBatches = batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  // Calculate date range
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

  // Ensure we have a range
  if (!minDate || !maxDate) {
    minDate = todayStr;
    const end = new Date();
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
          <div class="sec-title">By Work Area</div>
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
  const today = new Date(todayStr);

  // Initialize month offset if not set
  if (prodPlanMonthOffset === undefined) {
    prodPlanMonthOffset = 0;
  }

  // Calculate the view month (starting from today + offset months)
  const viewDate = new Date(today);
  viewDate.setMonth(viewDate.getMonth() + prodPlanMonthOffset);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Get first and last day of the month
  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = monthEnd.getDate();

  // Calculate grid size (need to account for days before month starts if they're in the week grid)
  const firstDayOfWeek = monthStart.getDay();
  const totalGridDays = firstDayOfWeek + daysInMonth;

  // Today tracking
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  // Month header
  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long' });
  const monthHeader = `${monthName} ${viewYear}`;

  // Navigation controls (can go back to past, forward to future)
  const navHtml = `
    <div class="gantt-nav-controls">
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset - 1}); render()">← Previous Month</button>
      <div class="gantt-month-header">${monthHeader}</div>
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset + 1}); render()">Next Month →</button>
    </div>
  `;

  // Simple date range header
  const monthEndStr = `${String(viewMonth + 1).padStart(2, '0')}/${String(monthEnd.getDate()).padStart(2, '0')}/${viewYear}`;
  const monthStartStr = `${String(viewMonth + 1).padStart(2, '0')}/01/${viewYear}`;
  const dateRangeHtml = `<div style="padding: 8px 12px; font-size: 12px; font-weight: 600; color: var(--mid); white-space: nowrap;">${monthStartStr} — ${monthEndStr}</div>`;

  // Generate batch rows for the month view
  let batchRowsHtml = '';
  batches.forEach((batch, idx) => {
    const product = prodDataGetProductById(batch.product_id);
    const productName = product ? product.name : `Batch ${idx + 1}`;
    const startD = batch.start_date ? new Date(batch.start_date) : null;
    const endD = batch.due_date ? new Date(batch.due_date) : null;

    // Determine bar color
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
    const displayLabel = product ? esc(product.part_number) : `${batch.quantity || 0}u`;

    // Format batch meta with IN/OUT
    const inDate = formatDisplayDate(batch.start_date) || '—';
    const outDate = formatDisplayDate(batch.due_date) || '—';
    const batchMetaText = `${batch.quantity || 0} units • IN: ${inDate} OUT: ${outDate}`;

    // Calculate batch position as percentage of the month
    let barLeftPercent = 0;
    let barWidthPercent = 100;

    if (startD && endD) {
      const monthLength = daysInMonth;
      let daysFromStart = 1;
      let daySpan = 1;

      if (startD.getMonth() === viewMonth && startD.getFullYear() === viewYear) {
        daysFromStart = startD.getDate();
      } else if (startD < monthStart) {
        daysFromStart = 1;
      }

      if (endD.getMonth() === viewMonth && endD.getFullYear() === viewYear) {
        daySpan = endD.getDate() - daysFromStart + 1;
      } else if (endD > monthEnd) {
        daySpan = daysInMonth - daysFromStart + 1;
      }

      barLeftPercent = ((daysFromStart - 1) / monthLength) * 100;
      barWidthPercent = (daySpan / monthLength) * 100;
    }

    batchRowsHtml += `
      <div class="gantt-batch-row" data-batch-id="${batch.id}">
        <div class="gantt-batch-label">
          <div class="gantt-product-code">${esc(productName)}</div>
          <div class="gantt-batch-meta">${batchMetaText}</div>
        </div>
        <div class="gantt-batch-chart" style="position: relative; height: 40px;">
          <div class="gantt-bar ${isOverdue ? 'overdue' : ''}"
               style="position: absolute; left: ${barLeftPercent}%; width: ${barWidthPercent}%; height: 28px; top: 6px; background-color: ${barColor};"
               title="${esc(productName)} - ${inDate} to ${outDate}">
              <div class="gantt-bar-label">${displayLabel}</div>
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
      ${navHtml}
      <div class="gantt-header">
        <div class="gantt-header-label">Product</div>
        <div class="gantt-header-chart">
          ${dateRangeHtml}
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

function prodSetMonthOffset(offset) {
  prodPlanMonthOffset = offset;
}
