// ═══════════════════════════════════════════════════════════════
// prod-capacity-detail.js — Batch Workload Breakdown Tab
// Full list of all batches with monthly hour distribution
// ═══════════════════════════════════════════════════════════════

import { getFamilies } from '../../../../core/js/state.js'
import { formatDisplayDate, prodState } from '../../../production/js/data.js'
import { esc } from '../../../../utils/js/helpers.js'
import {
  prodCapGet24MonthKeys,
  prodCapGetWorkAreas,
  prodCapParseKey,
  prodCapMonthLabel,
  prodCapCountWorkingDaysBetween,
  prodCapGetBankHolidaySetForRange
} from './prod-capacity-data.js'

export let prodCapDetailFilter = { status: '', family: '', workArea: '' }
export function setProdCapDetailFilter(partial = {}) {
  prodCapDetailFilter = { ...prodCapDetailFilter, ...partial }
}

// ── Helper: resolve family ID to label ──────────────────────────
function prodCapGetFamilyLabel(familyIdOrName) {
  if (!familyIdOrName) return 'Other';
  const families = typeof getFamilies === 'function' ? getFamilies() : []
  if (Array.isArray(families) && families.length > 0) {
    const family = families.find(f => f.id === familyIdOrName);
    if (family) return family.label;
  }
  // Fall back to direct name (not a UUID)
  return familyIdOrName;
}

function prodCapBuildProductMap(products) {
  const productMap = {};
  products.forEach(p => { productMap[p.id] = p; });
  return productMap;
}

function prodCapGetDetailFamilies(products) {
  const familySet = new Set();
  products.forEach(p => {
    const label = prodCapGetFamilyLabel(p.family);
    if (label && label !== '—') familySet.add(label);
  });
  return Array.from(familySet).sort();
}

function prodCapGetBatchMonthsWithLoad(batch, totalHours, monthKeys) {
  const batchStart = batch.start_date ? new Date(batch.start_date + 'T00:00:00') : null;
  const batchEnd = batch.due_date ? new Date(batch.due_date + 'T00:00:00') : null;
  
  if (!batchStart || !batchEnd) return [];
  
  // Use working days, excluding weekends and bank holidays
  const bankHolSet = prodCapGetBankHolidaySetForRange(batchStart, batchEnd);
  const totalDays = prodCapCountWorkingDaysBetween(batchStart, batchEnd, bankHolSet);
  if (totalDays === 0) return [];

  return monthKeys
    .map(key => {
      const { year, month } = prodCapParseKey(key);
      const mStart = new Date(year, month - 1, 1);
      const mEnd = new Date(year, month, 0);
      const oStart = batchStart > mStart ? batchStart : mStart;
      const oEnd = batchEnd < mEnd ? batchEnd : mEnd;
      if (oStart > oEnd) return null;
      
      // Calculate working days in the overlap period
      const overlapDays = prodCapCountWorkingDaysBetween(oStart, oEnd, bankHolSet);
      if (overlapDays === 0) return null;
      
      const hours = totalHours * (overlapDays / totalDays);
      return { key, hours };
    })
    .filter(Boolean);
}

function getProdCapDetailViewData(filter) {
  const batches = prodState?.batches || [];
  const products = prodState?.products || [];
  const productMap = prodCapBuildProductMap(products);
  const monthKeys = prodCapGet24MonthKeys();

  const filteredBatches = batches
    .filter(batch => {
      const prod = productMap[batch.product_id];
      if (filter.status && batch.status !== filter.status) return false;
      if (filter.workArea && batch.work_location !== filter.workArea) return false;
      if (filter.family && prodCapGetFamilyLabel(prod?.family) !== filter.family) return false;
      return true;
    })
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  const viewBatches = filteredBatches.map(batch => {
    const prod = productMap[batch.product_id];
    const hoursPerUnit = prod ? Number(prod.current_overhaul_hours) || 0 : 0;
    const totalHours = hoursPerUnit * (batch.quantity || 0);
    const family = prod ? prodCapGetFamilyLabel(prod.family) : '—';
    const workArea = batch.work_location || prod?.work_location || '—';
    const monthsWithLoad = prodCapGetBatchMonthsWithLoad(batch, totalHours, monthKeys);

    return {
      batch,
      productName: prod ? esc(prod.name) : '—',
      productCode: prod ? esc(prod.code || '') : '',
      family,
      workArea,
      quantity: batch.quantity || '—',
      startDate: (typeof formatDisplayDate === 'function' ? formatDisplayDate(batch.start_date) : batch.start_date) || '—',
      dueDate: (typeof formatDisplayDate === 'function' ? formatDisplayDate(batch.due_date) : batch.due_date) || '—',
      hoursPerUnit,
      totalHours,
      hasHours: hoursPerUnit > 0 && batch.quantity,
      monthsWithLoad,
      status: batch.status || '—',
      statusColor: batch.status === 'In Progress' ? 'var(--amber)' :
        batch.status === 'Complete' ? 'var(--green)' : 'var(--muted)'
    };
  });

  const totalUnits = filteredBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  const totalHours = filteredBatches.reduce((sum, batch) => {
    const prod = productMap[batch.product_id];
    return sum + (Number(prod?.current_overhaul_hours) || 0) * (batch.quantity || 0);
  }, 0);

  return {
    filter,
    families: prodCapGetDetailFamilies(products),
    workAreas: prodCapGetWorkAreas(),
    batches: viewBatches,
    kpis: {
      totalBatches: filteredBatches.length,
      totalUnits,
      totalHours,
      avgHoursPerUnit: totalUnits > 0 ? totalHours / totalUnits : 0
    }
  };
}

function renderProdCapDetailRow(viewBatch) {
  const monthPills = viewBatch.monthsWithLoad
    .map(({ key, hours }) =>
      `<span class="pc-month-pill">${prodCapMonthLabel(key)} <strong>${Math.round(hours)}h</strong></span>`
    )
    .join('');

  return `
      <tr class="${viewBatch.status === 'Complete' ? 'pc-row-complete' : ''}">
        <td>
          <div style="font-weight:600;font-size:13px">${viewBatch.productName}</div>
          <div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono'">${viewBatch.productCode}</div>
        </td>
        <td><span class="pc-family-badge">${esc(viewBatch.family)}</span></td>
        <td class="pc-tbl-mono">${esc(viewBatch.workArea)}</td>
        <td class="pc-tbl-num">${viewBatch.quantity}</td>
        <td class="pc-tbl-mono" style="font-size:11px">${viewBatch.startDate} → ${viewBatch.dueDate}</td>
        <td class="pc-tbl-num">
          ${viewBatch.hasHours ? `<strong>${Math.round(viewBatch.totalHours).toLocaleString()}h</strong>
            <div style="font-size:10px;color:var(--muted)">${viewBatch.hoursPerUnit}h/unit</div>` : '—'}
        </td>
        <td>
          <div class="pc-month-pills">
            ${monthPills || '<span style="color:var(--muted);font-size:11px">No dates set</span>'}
          </div>
        </td>
        <td><span style="color:${viewBatch.statusColor};font-size:11px;font-weight:600">${esc(viewBatch.status)}</span></td>
      </tr>`;
}

export function renderProdCapDetail() {
  const viewData = getProdCapDetailViewData(prodCapDetailFilter);
  const rows = viewData.batches.map(renderProdCapDetailRow).join('');

  return `
    <div class="pc-detail">

      <!-- Filters -->
      <div class="pc-filters">
        <div class="filter-group">
          <label for="cap_prod_detail_filter_status">Status</label>
          <select id="cap_prod_detail_filter_status" name="cap_prod_detail_filter_status" data-cap-action="cap-prod-detail-filter-status">
            <option value="">— All</option>
            <option value="Planned"     ${prodCapDetailFilter.status==='Planned'     ?'selected':''}>Planned</option>
            <option value="In Progress" ${prodCapDetailFilter.status==='In Progress' ?'selected':''}>In Progress</option>
            <option value="Complete"    ${prodCapDetailFilter.status==='Complete'    ?'selected':''}>Complete</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="cap_prod_detail_filter_family">Family</label>
          <select id="cap_prod_detail_filter_family" name="cap_prod_detail_filter_family" data-cap-action="cap-prod-detail-filter-family">
            <option value="">— All</option>
            ${viewData.families.map(f => `<option value="${esc(f)}" ${prodCapDetailFilter.family===f?'selected':''}>${esc(f)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label for="cap_prod_detail_filter_workarea">Work Area</label>
          <select id="cap_prod_detail_filter_workarea" name="cap_prod_detail_filter_workarea" data-cap-action="cap-prod-detail-filter-workarea">
            <option value="">— All</option>
            ${viewData.workAreas.map(w => `<option value="${esc(w)}" ${prodCapDetailFilter.workArea===w?'selected':''}>${esc(w)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="pc-kpi-row">
        <div class="pc-kpi" style="border-left:4px solid var(--blue)">
          <div class="pc-kpi-val">${viewData.kpis.totalBatches}</div>
          <div class="pc-kpi-label">Batches</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--green)">
          <div class="pc-kpi-val">${viewData.kpis.totalUnits.toLocaleString()}</div>
          <div class="pc-kpi-label">Units</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--amber)">
          <div class="pc-kpi-val">${Math.round(viewData.kpis.totalHours).toLocaleString()}h</div>
          <div class="pc-kpi-label">Total Hours</div>
        </div>
        <div class="pc-kpi" style="border-left:4px solid var(--navy)">
          <div class="pc-kpi-val">${Math.round(viewData.kpis.avgHoursPerUnit)}</div>
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
