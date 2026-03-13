// Production Planning Views

function renderPlanByProduct() {
  const products = (prodState && Array.isArray(prodState.products)) ? prodState.products : [];
  const activeProducts = products.filter(p => {
    const status = (p.status || '').toLowerCase();
    return status !== 'closed' && status !== 'inactive';
  });

  if (!activeProducts.length) {
    return `
      <div class="prod-section">
        <div class="sec-head">
          <div>
            <div class="sec-eyebrow">PRODUCTION PLAN</div>
            <div class="sec-title">By Product</div>
            <div class="sec-desc">Choose one product and view a 6-month schedule</div>
          </div>
          <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
        </div>

        <div style="padding:32px;text-align:center;color:var(--muted)">No active products to display</div>
      </div>
    `;
  }

  const selectedProductId = (prodState && prodState.activeProductId && activeProducts.some(p => p.id === prodState.activeProductId))
    ? prodState.activeProductId
    : activeProducts[0].id;

  if (!prodState.activeProductId || prodState.activeProductId !== selectedProductId) {
    prodState.activeProductId = selectedProductId;
  }

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId) || activeProducts[0];
  const selectedBatches = prodDataGetBatchesByProduct(selectedProduct.id)
    .slice()
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  const productOptionsHtml = activeProducts.map(product => {
    const batchCount = prodDataGetBatchesByProduct(product.id).length;
    const isSelected = product.id === selectedProduct.id;
    return `<option value="${product.id}" ${isSelected ? 'selected' : ''}>${esc(product.name)} (${batchCount} batch${batchCount === 1 ? '' : 'es'})</option>`;
  }).join('');

  const familyLabel = selectedProduct.family
    ? esc(getFamilies().find(f => f.id === selectedProduct.family)?.label || selectedProduct.family)
    : 'No family set';

  const todayStr = new Date().toISOString().split('T')[0];
  const ganttHtml = buildProductSixMonthGantt(selectedProduct, selectedBatches, todayStr);

  let batchDetailsHtml = '';
  if (!selectedBatches.length) {
    batchDetailsHtml = '<div style="padding:12px;color:var(--muted);font-style:italic">No batches scheduled for this product</div>';
  } else {
    selectedBatches.forEach((batch, idx) => {
      const statusBadge = getStatusBadge(batch.status || 'Planned');
      batchDetailsHtml += `
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

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCTION PLAN</div>
          <div class="sec-title">By Product</div>
          <div class="sec-desc">6-month schedule with weekly and monthly scale</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
      </div>

      <div class="prod-product-toolbar">
        <div class="filter-group">
          <label for="prodProductPicker">Product</label>
          <select id="prodProductPicker" onchange="prodSetActiveProduct(this.value); render()">
            ${productOptionsHtml}
          </select>
        </div>
        <div class="prod-product-summary">
          <div class="product-name">${esc(selectedProduct.name)}</div>
          <div class="product-code">${esc(selectedProduct.part_number || 'N/A')}</div>
          <div class="product-meta">
            <span>${familyLabel}</span>
            ${selectedProduct.lead_time_days ? `<span>${selectedProduct.lead_time_days}d lead time</span>` : ''}
            <span>${selectedBatches.length} scheduled batch${selectedBatches.length === 1 ? '' : 'es'}</span>
          </div>
        </div>
      </div>

      <div class="unit-timeline product-six-month-wrap">
        ${ganttHtml}
      </div>

      <div class="product-card batch-detail-card">
        <div class="product-header">
          <div>
            <div class="product-name">Batch Details</div>
            <div class="product-code">All current card information retained</div>
          </div>
        </div>
        <div class="batches-list">
          ${batchDetailsHtml}
        </div>
      </div>
    </div>
  `;
}

function getIsoWeekLabel(dateObj) {
  const date = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `W${String(weekNo).padStart(2, '0')}`;
}

function buildProductSixMonthGantt(product, batches, todayStr) {
  const today = new Date(`${todayStr}T00:00:00`);

  if (typeof prodPlanMonthOffset !== 'number' || Number.isNaN(prodPlanMonthOffset)) {
    prodPlanMonthOffset = 0;
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setMonth(monthStart.getMonth() + prodPlanMonthOffset);
  const windowStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const windowEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 6, 0);
  const totalDays = Math.floor((windowEnd - windowStart) / (1000 * 60 * 60 * 24)) + 1;

  const dateRangeLabel = `${String(windowStart.getDate()).padStart(2, '0')}/${String(windowStart.getMonth() + 1).padStart(2, '0')}/${windowStart.getFullYear()} - ${String(windowEnd.getDate()).padStart(2, '0')}/${String(windowEnd.getMonth() + 1).padStart(2, '0')}/${windowEnd.getFullYear()}`;

  const monthBands = [];
  for (let i = 0; i < 6; i += 1) {
    const monthDate = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
    const monthDays = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const width = (monthDays / totalDays) * 100;
    const label = monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    monthBands.push(`<div class="gantt-month-band" style="width:${width}%">${label}</div>`);
  }

  const weekMarkers = [];
  let weekCursor = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate());
  while (weekCursor <= windowEnd) {
    const dayOffset = Math.floor((weekCursor - windowStart) / (1000 * 60 * 60 * 24));
    const left = (dayOffset / totalDays) * 100;
    const weekStartLabel = weekCursor.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    weekMarkers.push(`
      <span class="gantt-week-marker" style="left:${left}%">
        <span class="gantt-week-marker-name">${getIsoWeekLabel(weekCursor)}</span>
        <span class="gantt-week-marker-date">${weekStartLabel}</span>
      </span>
    `);
    weekCursor.setDate(weekCursor.getDate() + 7);
  }

  const isTodayInWindow = today >= windowStart && today <= windowEnd;
  let todayLeftPercent = null;
  if (isTodayInWindow) {
    const dayIndex = Math.floor((today - windowStart) / (1000 * 60 * 60 * 24));
    todayLeftPercent = ((dayIndex + 0.5) / totalDays) * 100;
  }

  const navHtml = `
    <div class="gantt-nav-controls">
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset - 1}); render()">← Previous Month</button>
      <div class="gantt-month-header">${windowStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} - ${windowEnd.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset + 1}); render()">Next Month →</button>
    </div>
  `;

  const windowBatches = batches.filter(batch => {
    const startD = batch.start_date ? new Date(`${batch.start_date}T00:00:00`) : null;
    const endD = batch.due_date ? new Date(`${batch.due_date}T00:00:00`) : null;
    if (!startD && !endD) return false;
    if (startD && endD) return !(endD < windowStart || startD > windowEnd);
    if (startD) return startD >= windowStart && startD <= windowEnd;
    return endD >= windowStart && endD <= windowEnd;
  });

  let batchRowsHtml = '';
  windowBatches.forEach((batch, idx) => {
    const startD = batch.start_date ? new Date(`${batch.start_date}T00:00:00`) : null;
    const endD = batch.due_date ? new Date(`${batch.due_date}T00:00:00`) : null;
    const inDate = formatDisplayDate(batch.start_date) || '—';
    const outDate = formatDisplayDate(batch.due_date) || '—';
    const statusBadge = getStatusBadge(batch.status || 'Planned');
    const isOverdue = endD && endD < new Date(todayStr) && batch.status !== 'Complete';

    let barColor = 'var(--blue)';
    if (batch.status === 'Complete') {
      barColor = 'var(--green)';
    } else if (batch.status === 'In Progress') {
      barColor = 'var(--amber)';
    } else if (isOverdue) {
      barColor = 'var(--red)';
    }

    let barLeftPercent = 0;
    let barWidthPercent = 1.8;
    if (startD || endD) {
      const effectiveStart = startD ? new Date(Math.max(startD.getTime(), windowStart.getTime())) : new Date(Math.max(endD.getTime(), windowStart.getTime()));
      const effectiveEnd = endD ? new Date(Math.min(endD.getTime(), windowEnd.getTime())) : new Date(Math.min(startD.getTime(), windowEnd.getTime()));
      const startDiff = Math.max(0, Math.floor((effectiveStart - windowStart) / (1000 * 60 * 60 * 24)));
      const endDiff = Math.max(startDiff, Math.floor((effectiveEnd - windowStart) / (1000 * 60 * 60 * 24)));
      const spanDays = Math.max(1, endDiff - startDiff + 1);
      barLeftPercent = (startDiff / totalDays) * 100;
      barWidthPercent = Math.max(1.8, (spanDays / totalDays) * 100);
    }

    batchRowsHtml += `
      <div class="gantt-batch-row" data-batch-id="${batch.id}">
        <div class="gantt-batch-label">
          <div class="gantt-product-code">Batch ${idx + 1} • ${batch.work_location || 'No Unit'}</div>
          <div class="gantt-batch-meta">${batch.quantity || 0} units • IN: ${inDate} OUT: ${outDate}</div>
        </div>
        <div class="gantt-batch-chart" style="position: relative; height: 40px;">
          ${todayLeftPercent !== null ? `<div class="gantt-today-row-marker" style="left:${todayLeftPercent}%;"></div>` : ''}
          <div class="gantt-bar ${isOverdue ? 'overdue' : ''}"
               style="position: absolute; left: ${barLeftPercent}%; width: ${barWidthPercent}%; height: 28px; top: 6px; background-color: ${barColor};"
               title="${esc(product.name)} - ${inDate} to ${outDate}">
            <div class="gantt-bar-label">${batch.quantity || 0}u</div>
          </div>
        </div>
        <div class="gantt-batch-status">
          ${statusBadge}
        </div>
      </div>
    `;
  });

  return `
    <div class="gantt-container six-month-product-view">
      ${navHtml}
      <div class="gantt-window-label">Window: ${dateRangeLabel}</div>
      <div class="gantt-header">
        <div class="gantt-header-label">Batch / Unit</div>
        <div class="gantt-header-chart">
          <div class="gantt-month-bands">
            ${monthBands.join('')}
          </div>
          <div class="gantt-week-scale">
            ${weekMarkers.join('')}
            ${todayLeftPercent !== null ? `<div class="gantt-today-marker" style="left:${todayLeftPercent}%;"><span class="gantt-today-label">Today</span></div>` : ''}
          </div>
        </div>
        <div class="gantt-header-status">Status</div>
      </div>
      <div class="gantt-rows">
        ${batchRowsHtml || '<div style="padding:22px 14px;color:var(--muted);font-style:italic;text-align:center;">No batches scheduled in this 6-month window.</div>'}
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

function renderPlanByUnit() {
  const units = ['Unit 2', 'Unit 3', 'Unit 6'];
  // Ensure activeUnit is defined with fallback
  const activeUnit = (prodState && prodState.activeUnit) || 'Unit 2';

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

  // Render compact 2-month timeline for active unit
  const batches = prodDataGetBatchesByWorkLocation(activeUnit);
  const sortedBatches = batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  const todayStr = new Date().toISOString().split('T')[0];

  let timelineHtml = '';
  if (sortedBatches.length === 0) {
    timelineHtml = '<div style="padding:32px;text-align:center;color:var(--muted);font-style:italic">No batches scheduled for this unit</div>';
  } else {
    timelineHtml = buildGanttTimeline(sortedBatches, todayStr);
  }

  return `
    <div class="prod-section">
      <div class="sec-head">
        <div>
          <div class="sec-eyebrow">PRODUCTION PLAN</div>
          <div class="sec-title">By Work Area</div>
          <div class="sec-desc">Rolling 2-month timeline showing arrivals and departures</div>
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

function buildGanttTimeline(batches, todayStr) {
  const today = new Date(`${todayStr}T00:00:00`);

  if (typeof prodPlanMonthOffset !== 'number' || Number.isNaN(prodPlanMonthOffset)) {
    prodPlanMonthOffset = 0;
  }

  const monthOneStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthOneStart.setMonth(monthOneStart.getMonth() + prodPlanMonthOffset);
  const monthTwoStart = new Date(monthOneStart.getFullYear(), monthOneStart.getMonth() + 1, 1);
  const monthTwoEnd = new Date(monthTwoStart.getFullYear(), monthTwoStart.getMonth() + 1, 0);
  const monthOneDays = new Date(monthOneStart.getFullYear(), monthOneStart.getMonth() + 1, 0).getDate();
  const monthTwoDays = monthTwoEnd.getDate();
  const totalDays = monthOneDays + monthTwoDays;
  const monthOneWidth = (monthOneDays / totalDays) * 100;

  const windowStart = new Date(monthOneStart.getFullYear(), monthOneStart.getMonth(), 1);
  const windowEnd = new Date(monthTwoEnd.getFullYear(), monthTwoEnd.getMonth(), monthTwoEnd.getDate());

  const monthOneLabel = monthOneStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const monthTwoLabel = monthTwoStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const dateRangeLabel = `${String(windowStart.getDate()).padStart(2, '0')}/${String(windowStart.getMonth() + 1).padStart(2, '0')}/${windowStart.getFullYear()} - ${String(windowEnd.getDate()).padStart(2, '0')}/${String(windowEnd.getMonth() + 1).padStart(2, '0')}/${windowEnd.getFullYear()}`;

  const isTodayInWindow = today >= windowStart && today <= windowEnd;
  let todayLeftPercent = null;
  if (isTodayInWindow) {
    const dayIndex = Math.floor((today - windowStart) / (1000 * 60 * 60 * 24));
    todayLeftPercent = ((dayIndex + 0.5) / totalDays) * 100;
  }

  const navHtml = `
    <div class="gantt-nav-controls">
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset - 1}); render()">← Previous Month</button>
      <div class="gantt-month-header">${monthOneLabel} - ${monthTwoLabel}</div>
      <button class="btn btn-sm btn-ghost" onclick="prodSetMonthOffset(${prodPlanMonthOffset + 1}); render()">Next Month →</button>
    </div>
  `;

  function buildMonthMarkers(offsetDays, daysInMonth) {
    const result = [];
    for (let day = 1; day <= daysInMonth; day += 5) {
      const left = ((offsetDays + day - 1) / totalDays) * 100;
      result.push(`<span class="gantt-day-marker" style="left:${left}%;">${day}</span>`);
    }
    if ((daysInMonth - 1) % 5 !== 0) {
      const monthEndLeft = ((offsetDays + daysInMonth - 1) / totalDays) * 100;
      result.push(`<span class="gantt-day-marker month-end" style="left:${monthEndLeft}%;">${daysInMonth}</span>`);
    }
    return result.join('');
  }

  const dayMarkers = `${buildMonthMarkers(0, monthOneDays)}${buildMonthMarkers(monthOneDays, monthTwoDays)}`;

  const windowBatches = batches.filter(batch => {
    const startD = batch.start_date ? new Date(`${batch.start_date}T00:00:00`) : null;
    const endD = batch.due_date ? new Date(`${batch.due_date}T00:00:00`) : null;
    if (!startD && !endD) return false;
    if (startD && endD) return !(endD < windowStart || startD > windowEnd);
    if (startD) return startD >= windowStart && startD <= windowEnd;
    return endD >= windowStart && endD <= windowEnd;
  });

  let batchRowsHtml = '';
  windowBatches.forEach((batch, idx) => {
    const product = prodDataGetProductById(batch.product_id);
    const productName = product ? product.name : `Batch ${idx + 1}`;
    const startD = batch.start_date ? new Date(`${batch.start_date}T00:00:00`) : null;
    const endD = batch.due_date ? new Date(`${batch.due_date}T00:00:00`) : null;

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
    const displayLabel = product ? esc(product.part_number || product.name || 'Batch') : `${batch.quantity || 0}u`;

    const inDate = formatDisplayDate(batch.start_date) || '—';
    const outDate = formatDisplayDate(batch.due_date) || '—';
    const batchMetaText = `${batch.quantity || 0} units • IN: ${inDate} OUT: ${outDate}`;

    let barLeftPercent = 0;
    let barWidthPercent = 2;

    if (startD || endD) {
      const effectiveStart = startD ? new Date(Math.max(startD.getTime(), windowStart.getTime())) : new Date(Math.max(endD.getTime(), windowStart.getTime()));
      const effectiveEnd = endD ? new Date(Math.min(endD.getTime(), windowEnd.getTime())) : new Date(Math.min(startD.getTime(), windowEnd.getTime()));
      const startDiff = Math.max(0, Math.floor((effectiveStart - windowStart) / (1000 * 60 * 60 * 24)));
      const endDiff = Math.max(startDiff, Math.floor((effectiveEnd - windowStart) / (1000 * 60 * 60 * 24)));
      const spanDays = Math.max(1, endDiff - startDiff + 1);
      barLeftPercent = (startDiff / totalDays) * 100;
      barWidthPercent = Math.max(2, (spanDays / totalDays) * 100);
    }

    batchRowsHtml += `
      <div class="gantt-batch-row" data-batch-id="${batch.id}">
        <div class="gantt-batch-label">
          <div class="gantt-product-code">${esc(productName)}</div>
          <div class="gantt-batch-meta">${batchMetaText}</div>
        </div>
        <div class="gantt-batch-chart" style="position: relative; height: 40px;">
          <div class="gantt-month-divider" style="left:${monthOneWidth}%;"></div>
          ${todayLeftPercent !== null ? `<div class="gantt-today-row-marker" style="left:${todayLeftPercent}%;"></div>` : ''}
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

  const emptyWindowHtml = `
    <div style="padding:22px 14px;color:var(--muted);font-style:italic;text-align:center;">
      No arrivals/departures scheduled in this 2-month window.
    </div>
  `;

  return `
    <div class="gantt-container compact-two-month">
      ${navHtml}
      <div class="gantt-window-label">Window: ${dateRangeLabel}</div>
      <div class="gantt-header">
        <div class="gantt-header-label">Product / Batch</div>
        <div class="gantt-header-chart">
          <div class="gantt-month-bands">
            <div class="gantt-month-band" style="width:${monthOneWidth}%">${monthOneLabel} (${String(monthOneDays).padStart(2, '0')} days)</div>
            <div class="gantt-month-band" style="width:${100 - monthOneWidth}%">${monthTwoLabel} (${String(monthTwoDays).padStart(2, '0')} days)</div>
          </div>
          <div class="gantt-day-scale">
            ${dayMarkers}
            ${todayLeftPercent !== null ? `<div class="gantt-today-marker" style="left:${todayLeftPercent}%;"><span class="gantt-today-label">Today</span></div>` : ''}
          </div>
        </div>
        <div class="gantt-header-status">Status</div>
      </div>
      <div class="gantt-rows">
        ${batchRowsHtml || emptyWindowHtml}
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
  prodPlanMonthOffset = Number(offset) || 0;
}
