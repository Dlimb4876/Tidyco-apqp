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

  let content = '';
  units.forEach(unit => {
    const batches = prodDataGetBatchesByUnit(unit);
    const sortedBatches = batches.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

    let batchesHtml = '';
    if (sortedBatches.length === 0) {
      batchesHtml = '<div style="padding:12px;color:var(--muted);font-style:italic">No batches scheduled</div>';
    } else {
      sortedBatches.forEach(batch => {
        const product = prodDataGetProductById(batch.product_id);
        const productName = product ? `${product.code || 'Unknown'}` : 'Unknown';
        const statusBadge = getStatusBadge(batch.status);

        batchesHtml += `
          <div class="unit-batch-item">
            <div class="ub-product">${esc(productName)}</div>
            <div class="ub-qty">${batch.quantity || '—'} qty</div>
            <div class="ub-dates">${batch.start_date || '—'} – ${batch.due_date || '—'}</div>
            <div class="ub-status">${statusBadge}</div>
          </div>
        `;
      });
    }

    content += `
      <div class="unit-column">
        <div class="unit-header">${unit}</div>
        <div class="unit-batches">
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
          <div class="sec-title">By Unit</div>
          <div class="sec-desc">Batches by production unit</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductionTab('root')">← Back</button>
      </div>

      <div class="prod-plan-units">
        ${content}
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
