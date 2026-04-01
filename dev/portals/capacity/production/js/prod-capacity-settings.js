// ═══════════════════════════════════════════════════════════════
// prod-capacity-settings.js — Production Capacity Settings Tab
// 2-year scrollable grid: months (rows) × work areas (columns)
// Each cell = number of staff for that area/month
// 1 staff = working days (Mon-Fri, excluding UK bank holidays) x 8h
// ═══════════════════════════════════════════════════════════════

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { appState } from '../../../../core/js/state.js'
import { render } from '../../../../utils/js/navigation.js'
import { esc, canEdit, showToast } from '../../../../utils/js/helpers.js'
import {
  prodCapState,
  prodCapGet24MonthKeys,
  prodCapGetWorkAreas,
  prodCapParseKey,
  prodCapDataGetStaff,
  prodCapDataSetStaff,
  prodCapAvailableHours,
  prodCapMonthLabelFull,
  prodCapSaveUtilization,
  prodCapDataGetNotes,
  prodCapDataSetNotes
} from './prod-capacity-data.js'

let prodCapSettingsSaveTimer = null

export function renderProdCapSettings() {
  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();

  if (workAreas.length === 0) {
    return `
      <div class="pc-settings">
        <div class="pc-card-header" style="margin-bottom:16px">
          <div class="pc-card-title">Capacity Settings</div>
          <div class="pc-card-sub">Set staff per work area per month. 1 person = Mon-Fri working days (excluding UK bank holidays) x 8h (40h/week baseline).</div>
        </div>
        <div class="pc-alert pc-alert-info">
          No work areas found. Add work areas in the Work Areas section of Capacity Settings.
        </div>
      </div>`;
  }

  // ── Build work area header columns ────────────────────────
  const today = new Date();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const workAreaHeaderCells = workAreas.map(wa =>
    `<th class="pc-settings-area-label" style="text-align:center;width:140px;min-width:140px">${esc(wa)}</th>`
  ).join('');

  // ── Build month rows ──────────────────────────────────────
  const monthRows = monthKeys.map(key => {
    const { year, month } = prodCapParseKey(key);
    const isCurrent = key === currentKey;
    const monthLabel = new Date(0, month-1).toLocaleString('en', {month:'short'});

    const cells = workAreas.map(wa => {
      const staff = prodCapDataGetStaff(wa, year, month);
      const hours = staff > 0 ? Math.round(prodCapAvailableHours(wa, year, month)) : 0;

      return `
        <td style="text-align:center;padding:4px 2px${isCurrent ? ';background:rgba(59,130,246,0.05)' : ''}">
          <input
            class="pc-staff-input"
            type="number"
            min="0"
            step="0.5"
            value="${staff > 0 ? staff : ''}"
            placeholder="0"
            title="${esc(wa)} — ${prodCapMonthLabelFull(key)} — ${hours}h available at current setting"
            data-cap-action="cap-prod-settings-capacity"
            data-workarea="${esc(wa)}"
            data-year="${year}"
            data-month="${month}"
            data-key="${key}"
            id="pcStaff_${btoa(wa).replace(/=/g,'')}_${key}"
          >
          ${staff > 0 ? `<div class="pc-staff-hours">${hours}h</div>` : ''}
        </td>`;
    }).join('');

    // Row total (all work areas for this month)
    const totalH = workAreas.reduce((s, wa) => s + prodCapAvailableHours(wa, year, month), 0);
    const totalS = workAreas.reduce((s, wa) => s + prodCapDataGetStaff(wa, year, month), 0);

    const notes = esc(prodCapDataGetNotes(year, month));

    return `
      <tr>
        <td class="pc-settings-area-label" style="width:140px;min-width:140px${isCurrent ? ';background:rgba(59,130,246,0.05)' : ''}">
          <div class="pc-area-name">${monthLabel} ${year}</div>
        </td>
        ${cells}
        <td style="padding:4px 6px;min-width:160px${isCurrent ? ';background:rgba(59,130,246,0.05)' : ''}">
          <input
            class="pc-notes-input"
            type="text"
            value="${notes}"
            placeholder="Add comment…"
            data-cap-action="cap-prod-settings-notes"
            data-year="${year}"
            data-month="${month}"
            data-key="${key}"
            id="pcNotes_${key}"
          >
        </td>
        <td style="text-align:center;font-size:11px;color:var(--mid);border-top:2px solid var(--line);white-space:nowrap;padding:0 8px">
          <div style="font-weight:700">${totalS > 0 ? totalS : '—'}</div>
          <div>${totalH > 0 ? Math.round(totalH) + 'h' : ''}</div>
        </td>
      </tr>`;
  }).join('');

  // ── Column totals row (work area totals over 24 months) ───
  const colTotals = workAreas.map(wa => {
    const totalHours = monthKeys.reduce((s, k) => {
      const { year, month } = prodCapParseKey(k);
      return s + prodCapAvailableHours(wa, year, month);
    }, 0);
    return `<td style="text-align:center;color:var(--mid);font-size:11px;white-space:nowrap;padding:0 8px">
      ${totalHours > 0 ? Math.round(totalHours/24).toLocaleString() + 'h/mo avg' : '—'}
    </td>`;
  }).join('');

  const utilPercent = Math.round(appState.prodCapUtilizationFactor * 100)

  // ── Month offset indicator
  const offsetLabel = prodCapMonthLabelFull(prodCapGet24MonthKeys()[0]);

  return `
    <div class="pc-settings">

      <!-- Utilization Factor Slider -->
      <div class="pc-card" style="margin-bottom:16px">
        <div class="pc-card-header">
          <div>
            <div class="pc-card-title">Capacity Utilization Factor</div>
            <div class="pc-card-sub">Adjust the percentage of available capacity that can be scheduled. Reduces total load capacity across all areas.</div>
          </div>
        </div>
        <div style="padding:0 16px 16px">
          <div style="display:flex;align-items:center;gap:16px">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value="${utilPercent}"
              data-cap-action="cap-prod-settings-utilization"
              style="flex:1;cursor:pointer"
            >
            <div style="min-width:60px;text-align:center;font-weight:700;color:var(--blue);font-size:16px">
              ${utilPercent}%
            </div>
          </div>
          <div style="font-size:11px;color:var(--mid);margin-top:8px">
            At ${utilPercent}% utilization, scheduled workload can be up to ${utilPercent}% of total staff capacity.
          </div>
        </div>
      </div>

      <!-- Perpetual Window Controls -->
      <div class="pc-window-controls" style="margin-bottom: 16px">
        <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-prev-month" title="View previous month">← Previous</button>
        <div class="pc-window-label">${offsetLabel}</div>
        <button class="btn btn-sm btn-ghost" data-cap-action="cap-prod-next-month" title="View next month">Next →</button>
        ${appState.prodCapMonthOffset !== 0 ? `<button class="btn btn-sm btn-outline" data-cap-action="cap-prod-reset-month" title="Reset to current month">Reset</button>` : ''}
      </div>

      <div class="pc-card-header" style="margin-bottom:16px">
        <div>
          <div class="pc-card-title">Capacity Settings — Staff Headcount</div>
          <div class="pc-card-sub">
            Enter staff count per work area per month. Decimals allowed (e.g. 0.5 for a half-time person).
            <br>1 person = Mon-Fri working days (excluding UK bank holidays) x 8h = available capacity hours shown in grey below each cell.
          </div>
        </div>
        ${canEdit() ? `<div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-prod-settings-fill-forward">↠ Fill Forward</button>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-prod-settings-clear-all" style="color:var(--red)">✕ Clear All</button>
        </div>` : ''}
      </div>

      <!-- Settings Grid -->
      <div class="pc-settings-grid-wrap">
        <table class="pc-settings-tbl">
          <thead>
            <tr>
              <th style="width:140px;min-width:140px">Month</th>
              ${workAreaHeaderCells}
              <th style="min-width:120px">Comments</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${monthRows}
            <tr>
              <td class="pc-settings-area-label" style="font-weight:700;width:140px;min-width:140px">Avg/mo</td>
              ${colTotals}
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `;
}

// ── Cell update (debounced save) ──────────────────────────────
export async function prodCapSettingsUpdate(workArea, year, month, value) {
  await prodCapDataSetStaff(workArea, year, month, value);
  // Update the hours label below the input
  const safeKey = btoa(workArea).replace(/=/g, '');
  const key     = `${year}-${String(month).padStart(2, '0')}`;
  const inputEl = document.getElementById(`pcStaff_${safeKey}_${key}`);
  if (inputEl) {
    const hours = prodCapAvailableHours(workArea, year, month);
    const staff = prodCapDataGetStaff(workArea, year, month);
    let hoursEl = inputEl.nextElementSibling;
    if (staff > 0) {
      if (!hoursEl || !hoursEl.classList.contains('pc-staff-hours')) {
        hoursEl = document.createElement('div');
        hoursEl.className = 'pc-staff-hours';
        inputEl.parentNode.insertBefore(hoursEl, inputEl.nextSibling);
      }
      hoursEl.textContent = Math.round(hours) + 'h';
    } else if (hoursEl && hoursEl.classList.contains('pc-staff-hours')) {
      hoursEl.remove();
    }
  }
  // Debounce full re-render to update totals row
  clearTimeout(prodCapSettingsSaveTimer);
  prodCapSettingsSaveTimer = setTimeout(() => {
    render();
  }, 300);
}

// ── Notes update (debounced save) ──────────────────────────────
export async function prodCapSettingsUpdateNotes(year, month, value) {
  await prodCapDataSetNotes(year, month, value);
}

// ── Keyboard navigation between cells ────────────────────────
export function prodCapSettingsNavKey(event, workArea, key) {
  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();
  const keyIdx    = monthKeys.indexOf(key);
  const areaIdx   = workAreas.indexOf(workArea);

  if (event.key === 'Tab') {
    event.preventDefault();
    const nextAreaIdx = event.shiftKey ? areaIdx - 1 : areaIdx + 1;
    if (nextAreaIdx >= 0 && nextAreaIdx < workAreas.length) {
      const nextArea = workAreas[nextAreaIdx];
      const safeArea = btoa(nextArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${key}`)?.focus();
    }
  } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
    event.preventDefault();
    const nextKeyIdx = keyIdx + 1;
    if (nextKeyIdx < monthKeys.length) {
      const nextKey  = monthKeys[nextKeyIdx];
      const safeArea = btoa(workArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${nextKey}`)?.focus();
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prevKeyIdx = keyIdx - 1;
    if (prevKeyIdx >= 0) {
      const prevKey  = monthKeys[prevKeyIdx];
      const safeArea = btoa(workArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${prevKey}`)?.focus();
    }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    const nextAreaIdx = areaIdx + 1;
    if (nextAreaIdx < workAreas.length) {
      const nextArea = workAreas[nextAreaIdx];
      const safeArea = btoa(nextArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${key}`)?.focus();
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    const prevAreaIdx = areaIdx - 1;
    if (prevAreaIdx >= 0) {
      const prevArea = workAreas[prevAreaIdx];
      const safeArea = btoa(prevArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${key}`)?.focus();
    }
  }
}

// ── Fill forward: copy each cell's value to all subsequent months ─
export async function prodCapSettingsFillForward() {
  if (!confirm('Fill each value forward — this will copy each row\'s staff count to all following months, overwriting any existing values. Continue?')) return;

  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();
  let filled = 0;

  try {
    for (const wa of workAreas) {
      let lastVal = 0;
      for (const key of monthKeys) {
        const { year, month } = prodCapParseKey(key);
        const current = prodCapDataGetStaff(wa, year, month);
        if (lastVal === 0 && current > 0) {
          lastVal = current;
        } else if (lastVal > 0 && current !== lastVal) {
          await prodCapDataSetStaff(wa, year, month, lastVal);
          filled++;
        }
      }
    }
    if (filled > 0) {
      showToast(`Filled ${filled} cell${filled === 1 ? '' : 's'} forward.`, 'success');
    } else {
      showToast('No values to fill forward — enter a value in the first month of each row first.', 'info');
    }
  } catch (err) {
    console.error('Fill forward error:', err);
    showToast('Fill forward failed: ' + (err.message || String(err)), 'error');
  } finally {
    render();
  }
}

// ── Clear all capacity records for confirmation ───────────────
export async function prodCapSettingsClearAll() {
  if (!confirm('Clear ALL capacity settings? This cannot be undone.')) return;
  if (!currentUser) return;

  try {
    // Delete all shared capacity records (data is shared across all users)
    const { error } = await supa.from('production_capacity')
      .delete()
      .gte('year', 0);
    if (error) throw error;
    prodCapState.capacityRecords = [];
    render();
  } catch (err) {
    console.error('Error clearing capacity:', err);
    showToast('Failed to clear: ' + err.message, 'error');
  }
}

// ── Set utilization factor from slider ────────────────────────
export async function prodCapSettingsSetUtilization(percent) {
  appState.prodCapUtilizationFactor = Math.max(0, Math.min(100, parseInt(percent))) / 100
  await prodCapSaveUtilization(percent)
  render()
}
