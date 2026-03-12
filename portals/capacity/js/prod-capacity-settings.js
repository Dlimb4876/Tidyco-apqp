// ═══════════════════════════════════════════════════════════════
// prod-capacity-settings.js — Production Capacity Settings Tab
// 2-year scrollable grid: work areas (rows) × months (columns)
// Each cell = number of staff for that area/month
// 1 staff = working days × 8h of available capacity
// Depends on: prod-capacity-data.js
// ═══════════════════════════════════════════════════════════════

let prodCapSettingsSaveTimer = null;

function renderProdCapSettings() {
  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();

  if (workAreas.length === 0) {
    return `
      <div class="pc-settings">
        <div class="pc-card-header" style="margin-bottom:16px">
          <div class="pc-card-title">Capacity Settings</div>
          <div class="pc-card-sub">Set the number of staff available per work area per month. 1 person = working days × 8h available.</div>
        </div>
        <div class="pc-alert pc-alert-info">
          No work areas found. Add work areas in the Work Areas section of Capacity Settings.
        </div>
      </div>`;
  }

  // ── Build month header row ────────────────────────────────
  // Group by year for a year-label spanning row
  const yearGroups = {};
  monthKeys.forEach(key => {
    const { year } = prodCapParseKey(key);
    if (!yearGroups[year]) yearGroups[year] = [];
    yearGroups[year].push(key);
  });

  const yearHeaderCells = Object.entries(yearGroups).map(([yr, ks]) =>
    `<th colspan="${ks.length}" style="text-align:center;background:var(--bg);border-bottom:2px solid var(--line);letter-spacing:1px">${yr}</th>`
  ).join('');

  const monthHeaderCells = monthKeys.map(key => {
    const { month } = prodCapParseKey(key);
    const today = new Date();
    const isCurrent = key === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
    return `<th style="min-width:60px;text-align:center${isCurrent ? ';background:rgba(59,130,246,0.1);border-top:2px solid var(--blue)' : ''}">${new Date(0, month-1).toLocaleString('en', {month:'short'})}</th>`;
  }).join('');

  // ── Build work area rows ──────────────────────────────────
  const areaRows = workAreas.map(wa => {
    const cells = monthKeys.map(key => {
      const { year, month } = prodCapParseKey(key);
      const staff = prodCapDataGetStaff(wa, year, month);
      const today = new Date();
      const isCurrent = key === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
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
            onchange="prodCapSettingsUpdate('${esc(wa)}', ${year}, ${month}, this.value)"
            onkeydown="prodCapSettingsNavKey(event, '${esc(wa)}', '${key}')"
            id="pcStaff_${btoa(wa).replace(/=/g,'')}_${key}"
          >
          ${staff > 0 ? `<div class="pc-staff-hours">${hours}h</div>` : ''}
        </td>`;
    }).join('');

    // Row totals
    const totalStaff  = monthKeys.reduce((s, k) => {
      const { year, month } = prodCapParseKey(k);
      return s + prodCapDataGetStaff(wa, year, month);
    }, 0);
    const totalHours = monthKeys.reduce((s, k) => {
      const { year, month } = prodCapParseKey(k);
      return s + prodCapAvailableHours(wa, year, month);
    }, 0);

    return `
      <tr>
        <td class="pc-settings-area-label">
          <div class="pc-area-name">${esc(wa)}</div>
          <div class="pc-area-total">${Math.round(totalHours).toLocaleString()}h / 24mo</div>
        </td>
        ${cells}
        <td style="text-align:center;color:var(--mid);font-size:11px;white-space:nowrap;padding:0 8px">
          ${totalHours > 0 ? Math.round(totalHours/24).toLocaleString() + 'h/mo avg' : '—'}
        </td>
      </tr>`;
  }).join('');

  // ── Column totals row ─────────────────────────────────────
  const colTotals = monthKeys.map(key => {
    const { year, month } = prodCapParseKey(key);
    const totalH = workAreas.reduce((s, wa) => s + prodCapAvailableHours(wa, year, month), 0);
    const totalS = workAreas.reduce((s, wa) => s + prodCapDataGetStaff(wa, year, month), 0);
    return `<td style="text-align:center;font-size:11px;color:var(--mid);border-top:2px solid var(--line)">
      <div style="font-weight:700">${totalS > 0 ? totalS : '—'}</div>
      <div>${totalH > 0 ? Math.round(totalH) + 'h' : ''}</div>
    </td>`;
  }).join('');

  const utilPercent = Math.round(prodCapUtilizationFactor * 100);

  // ── Month offset indicator
  const offsetLabel = prodCapMonthOffset === 0 ? 'Current' :
                      prodCapMonthOffset > 0 ? `+${prodCapMonthOffset} month${prodCapMonthOffset > 1 ? 's' : ''}` :
                      `${prodCapMonthOffset} month${prodCapMonthOffset < -1 ? 's' : ''}`;

  return `
    <div class="pc-settings">

      <!-- Perpetual Window Controls -->
      <div class="pc-window-controls">
        <button class="btn btn-sm btn-ghost" onclick="prodCapShiftMonth('prev')" title="View previous month">← Previous</button>
        <div class="pc-window-label">${offsetLabel}</div>
        <button class="btn btn-sm btn-ghost" onclick="prodCapShiftMonth('next')" title="View next month">Next →</button>
        ${prodCapMonthOffset !== 0 ? `<button class="btn btn-sm btn-outline" onclick="prodCapResetMonthOffset()" title="Reset to current month">Reset</button>` : ''}
      </div>

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
              onchange="prodCapSettingsSetUtilization(this.value)"
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

      <div class="pc-card-header" style="margin-bottom:16px">
        <div>
          <div class="pc-card-title">Capacity Settings — Staff Headcount</div>
          <div class="pc-card-sub">
            Enter staff count per work area per month. Decimals allowed (e.g. 0.5 for a half-time person).
            <br>1 person = Mon–Fri working days × 8h = available capacity hours shown in grey below each cell.
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-ghost btn-sm" onclick="prodCapSettingsFillForward()">↠ Fill Forward</button>
          <button class="btn btn-ghost btn-sm" onclick="prodCapSettingsClearAll()" style="color:var(--red)">✕ Clear All</button>
        </div>
      </div>

      <!-- Settings Grid -->
      <div class="pc-settings-grid-wrap">
        <table class="pc-settings-tbl">
          <thead>
            <tr>
              <th style="min-width:160px">Work Area</th>
              ${yearHeaderCells}
              <th>Average</th>
            </tr>
            <tr>
              <th></th>
              ${monthHeaderCells}
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${areaRows}
            <tr>
              <td class="pc-settings-area-label" style="font-weight:700">Total</td>
              ${colTotals}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `;
}

// ── Cell update (debounced save) ──────────────────────────────
async function prodCapSettingsUpdate(workArea, year, month, value) {
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

// ── Keyboard navigation between cells ────────────────────────
function prodCapSettingsNavKey(event, workArea, key) {
  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();
  const keyIdx    = monthKeys.indexOf(key);
  const areaIdx   = workAreas.indexOf(workArea);

  if (event.key === 'Tab') {
    event.preventDefault();
    const nextKeyIdx = event.shiftKey ? keyIdx - 1 : keyIdx + 1;
    if (nextKeyIdx >= 0 && nextKeyIdx < monthKeys.length) {
      const nextKey  = monthKeys[nextKeyIdx];
      const safeArea = btoa(workArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${nextKey}`)?.focus();
    }
  } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
    event.preventDefault();
    const nextAreaIdx = areaIdx + 1;
    if (nextAreaIdx < workAreas.length) {
      const nextArea = workAreas[nextAreaIdx];
      const safeArea = btoa(nextArea).replace(/=/g, '');
      document.getElementById(`pcStaff_${safeArea}_${key}`)?.focus();
    }
  } else if (event.key === 'ArrowUp') {
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
async function prodCapSettingsFillForward() {
  if (!confirm('Fill each value forward — this will copy each cell\'s staff count to all following months in the same row that are currently empty. Continue?')) return;

  const monthKeys = prodCapGet24MonthKeys();
  const workAreas = prodCapGetWorkAreas();

  for (const wa of workAreas) {
    let lastVal = 0;
    for (const key of monthKeys) {
      const { year, month } = prodCapParseKey(key);
      const current = prodCapDataGetStaff(wa, year, month);
      if (current > 0) {
        lastVal = current;
      } else if (lastVal > 0) {
        await prodCapDataSetStaff(wa, year, month, lastVal);
      }
    }
  }
  render();
}

// ── Clear all capacity records for confirmation ───────────────
async function prodCapSettingsClearAll() {
  if (!confirm('Clear ALL capacity settings? This cannot be undone.')) return;
  if (!currentUser) return;

  try {
    const { error } = await supa.from('production_capacity')
      .delete()
      .eq('user_id', currentUser.id);
    if (error) throw error;
    prodCapState.capacityRecords = [];
    render();
  } catch (err) {
    console.error('Error clearing capacity:', err);
    alert('Failed to clear: ' + err.message);
  }
}

// ── Set utilization factor from slider ────────────────────────
async function prodCapSettingsSetUtilization(percent) {
  prodCapUtilizationFactor = Math.max(0, Math.min(100, parseInt(percent))) / 100;
  await prodCapSaveUtilization(percent);
  render();
}
