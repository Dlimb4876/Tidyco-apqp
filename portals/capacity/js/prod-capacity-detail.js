// ═══════════════════════════════════════════════════════════════
// prod-capacity-detail.js — Batch Workload Breakdown Tab
// Full list of all batches with monthly hour distribution
// Depends on: prod-capacity-data.js
// ═══════════════════════════════════════════════════════════════

let prodCapDetailFilter = { status: '', family: '', workArea: '' };

// ── Helper: resolve family ID to label ──────────────────────────
function prodCapGetFamilyLabel(familyIdOrName) {
  if (!familyIdOrName) return 'Other';
  // Check if familiesState exists and has families
  if (typeof familiesState !== 'undefined' && familiesState?.families) {
    const family = familiesState.families.find(f => f.id === familyIdOrName);
    if (family) return family.label;
  }
  // Fall back to direct name (not a UUID)
  return familyIdOrName;
}

function renderProdCapDetail() {
  const batches  = prodState?.batches  || [];
  const products = prodState?.products || [];

  const productMap = {};
  products.forEach(p => { productMap[p.id] = p; });

  // Families for filter — resolve IDs to labels
  const familySet = new Set();
  products.forEach(p => {
    const label = prodCapGetFamilyLabel(p.family);
    if (label && label !== '—') familySet.add(label);
  });
  const families  = Array.from(familySet).sort();
  const workAreas = prodCapGetWorkAreas();

  // Apply filters
  let filtered = batches.filter(b => {
    const prod = productMap[b.product_id];
    if (prodCapDetailFilter.status && b.status !== prodCapDetailFilter.status) return false;
    if (prodCapDetailFilter.workArea && b.work_location !== prodCapDetailFilter.workArea) return false;
    if (prodCapDetailFilter.family && prodCapGetFamilyLabel(prod?.family) !== prodCapDetailFilter.family) return false;
    return true;
  });

  filtered.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  const monthKeys = prodCapGet24MonthKeys();

  // Batch rows
  const rows = filtered.map(batch => {
    const prod = productMap[batch.product_id];
    const hoursPerUnit = prod ? Number(prod.current_overhaul_hours) || 0 : 0;
    const totalHours   = hoursPerUnit * (batch.quantity || 0);
    const family       = prod ? prodCapGetFamilyLabel(prod.family) : '—';
    const wa           = batch.work_location || prod?.work_location || '—';

    // Monthly distribution for this batch
    const batchStart = batch.start_date ? new Date(batch.start_date + 'T00:00:00') : null;
    const batchEnd   = batch.due_date   ? new Date(batch.due_date   + 'T00:00:00') : null;
    const totalDays  = (batchStart && batchEnd) ? Math.max(1, (batchEnd - batchStart) / 86400000 + 1) : 1;

    // Find months with load
    const monthsWithLoad = monthKeys
      .map(key => {
        if (!batchStart || !batchEnd) return null;
        const { year, month } = prodCapParseKey(key);
        const mStart = new Date(year, month - 1, 1);
        const mEnd   = new Date(year, month, 0);
        const oStart = batchStart > mStart ? batchStart : mStart;
        const oEnd   = batchEnd   < mEnd   ? batchEnd   : mEnd;
        if (oStart > oEnd) return null;
        const days  = (oEnd - oStart) / 86400000 + 1;
        const hours = totalHours * (days / totalDays);
        return { key, hours };
      })
      .filter(Boolean);

    const monthPills = monthsWithLoad.map(({ key, hours }) =>
      `<span class="pc-month-pill">${prodCapMonthLabel(key)} <strong>${Math.round(hours)}h</strong></span>`
    ).join('');

    const statusColor = batch.status === 'In Progress' ? 'var(--amber)' :
                        batch.status === 'Complete'    ? 'var(--green)'  : 'var(--muted)';
    const hasHours    = hoursPerUnit > 0 && batch.quantity;

    return `
      <tr class="${batch.status === 'Complete' ? 'pc-row-complete' : ''}">
        <td>
          <div style="font-weight:600;font-size:13px">${prod ? esc(prod.name) : '—'}</div>
          <div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono'">${prod ? esc(prod.code || '') : ''}</div>
        </td>
        <td><span class="pc-family-badge">${esc(family)}</span></td>
        <td class="pc-tbl-mono">${esc(wa)}</td>
        <td class="pc-tbl-num">${batch.quantity || '—'}</td>
        <td class="pc-tbl-mono" style="font-size:11px">${formatDisplayDate(batch.start_date) || '—'} → ${formatDisplayDate(batch.due_date) || '—'}</td>
        <td class="pc-tbl-num">
          ${hasHours ? `<strong>${Math.round(totalHours).toLocaleString()}h</strong>
            <div style="font-size:10px;color:var(--muted)">${hoursPerUnit}h/unit</div>` : '—'}
        </td>
        <td>
          <div class="pc-month-pills">
            ${monthPills || '<span style="color:var(--muted);font-size:11px">No dates set</span>'}
          </div>
        </td>
        <td><span style="color:${statusColor};font-size:11px;font-weight:600">${esc(batch.status || '—')}</span></td>
      </tr>`;
  }).join('');

  // Summary totals
  const totalUnits = filtered.reduce((s, b) => s + (b.quantity || 0), 0);
  const totalH     = filtered.reduce((b, batch) => {
    const prod = productMap[batch.product_id];
    return b + (Number(prod?.current_overhaul_hours) || 0) * (batch.quantity || 0);
  }, 0);

  // Average hours per unit and per batch
  const avgHourPerUnit = totalUnits > 0 ? totalH / totalUnits : 0;
  const avgHourPerBatch = filtered.length > 0 ? totalH / filtered.length : 0;

  return `
    <div class="pc-detail">

      <!-- Filters -->
      <div class="pc-filters">
        <div class="filter-group">
          <label>Status</label>
          <select onchange="prodCapDetailFilter.status=this.value;render()">
            <option value="">— All</option>
            <option value="Planned"     ${prodCapDetailFilter.status==='Planned'     ?'selected':''}>Planned</option>
            <option value="In Progress" ${prodCapDetailFilter.status==='In Progress' ?'selected':''}>In Progress</option>
            <option value="Complete"    ${prodCapDetailFilter.status==='Complete'    ?'selected':''}>Complete</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Family</label>
          <select onchange="prodCapDetailFilter.family=this.value;render()">
            <option value="">— All</option>
            ${families.map(f => `<option value="${esc(f)}" ${prodCapDetailFilter.family===f?'selected':''}>${esc(f)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Work Area</label>
          <select onchange="prodCapDetailFilter.workArea=this.value;render()">
            <option value="">— All</option>
            ${workAreas.map(w => `<option value="${esc(w)}" ${prodCapDetailFilter.workArea===w?'selected':''}>${esc(w)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="pc-kpi-row">
        <div class="pc-kpi" style="border-left:4px solid var(--blue)">
          <div class="pc-kpi-val">${filtered.length}</div>
          <div class="pc-kpi-label">Batches</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--green)">
          <div class="pc-kpi-val">${totalUnits.toLocaleString()}</div>
          <div class="pc-kpi-label">Units</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--amber)">
          <div class="pc-kpi-val">${Math.round(totalH).toLocaleString()}h</div>
          <div class="pc-kpi-label">Total Hours</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--navy)">
          <div class="pc-kpi-val">${Math.round(avgHourPerUnit)}</div>
          <div class="pc-kpi-label">Avg Hours/Unit</div>
        </div>
      </div>

      <!-- Batch Table -->
      <div class="pc-card">
        <div class="pc-table-wrap">
          <table class="pc-tbl" style="table-layout:auto">
            <thead>
              <tr>
                <th style="min-width:180px">Product</th>
                <th>Family</th>
                <th>Work Area</th>
                <th>Qty</th>
                <th>Dates</th>
                <th>Hours</th>
                <th style="min-width:300px">Monthly Load</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="8" class="pc-tbl-empty">No batches match the current filters.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
