/* ============================================================
   me-holidays.js — Holiday Planner Tab Rendering
   ============================================================ */

// ── Utility Functions ───────────────────────────────────────
window.meFormatDate = function(date) {
  if (!date || !(date instanceof Date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

window.meGetBankHolidaysForYear = function(year) {
  // Returns UK bank holidays as a map { dateStr: true }
  const holidays = getBankHolidaysForYear(year);
  const map = {};
  holidays.forEach(h => {
    map[h.date] = true;
  });
  return map;
};

window.meGetMonthLabel = function(monthKey) {
  const label = getMonthLabel(monthKey);
  if (Array.isArray(label)) {
    return `${label[0]} ${label[1]}`;
  }
  return monthKey;
};

// ── Main Renderer ───────────────────────────────────────────
window.meRenderHolidaysTab = function(holidaysArray, teamArray, selectedMonth) {
  // Use selected month or default to current month
  if (!selectedMonth) {
    const today = new Date();
    selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';

  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  // Show 2 months: extend end to end of next month
  const endDate = new Date(year, month + 1, 0);

  // Bank holidays for both months (handle Dec → Jan year boundary)
  const bankHols = Object.assign({}, meGetBankHolidaysForYear(year));
  const nextMonthYear = month === 12 ? year + 1 : year;
  if (nextMonthYear !== year) {
    Object.assign(bankHols, meGetBankHolidaysForYear(nextMonthYear));
  }

  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = meFormatDate(new Date(d));
    const dayOfWeek = new Date(dateStr).getDay();
    // Only include weekdays (Mon=1 to Fri=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      dates.push(dateStr);
    }
  }

  const todayObj = new Date();
  const todayMonthKey = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === todayMonthKey;

  let html = `
    <div class="me-card" style="overflow: auto;">
      <div class="me-card-head">
        <span class="me-card-title">HOLIDAY PLANNER</span>
        <span style="font-size:11px;color:var(--muted)">5-day work week · Click cells: working → full day → half day → remove · Blue = bank holidays (read-only)</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--overlay-light); border-bottom: 1px solid var(--border);">
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-prev-month">← Prev</button>
        <input type="month" name="cap_me_holidays_month" value="${selectedMonth}" data-cap-action="cap-me-month-change" style="padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 14px;">
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-next-month">Next →</button>
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-today" ${isCurrentMonth ? 'disabled style="opacity:0.4;"' : 'style="color:var(--primary);"'}>↩ Today</button>
      </div>
      <div class="me-card-body" style="overflow-x: auto;">
        <table class="holiday-matrix">
          <thead>
            <tr>
              <th style="position: sticky; left: 0; z-index: 10; background: var(--white); text-align: left;"></th>`;

  // Month header row - groups consecutive dates by month
  let currentMonth = null;
  let monthStart = 0;
  dates.forEach((date, idx) => {
    const d = new Date(date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthKey !== currentMonth) {
      if (currentMonth !== null) {
        const monthLabel = meGetMonthLabel(currentMonth);
        const colspan = idx - monthStart;
        html += `<th colspan="${colspan}" style="text-align: center; font-weight: bold; font-size: 13px; background: var(--overlay-light);">${monthLabel}</th>`;
      }
      currentMonth = monthKey;
      monthStart = idx;
    }
  });
  // Close final month cell
  if (currentMonth !== null) {
    const monthLabel = meGetMonthLabel(currentMonth);
    const colspan = dates.length - monthStart;
    html += `<th colspan="${colspan}" style="text-align: center; font-weight: bold; font-size: 13px; background: var(--overlay-light);">${monthLabel}</th>`;
  }

  html += `</tr>
            <tr>
              <th style="position: sticky; left: 0; z-index: 10; background: var(--white); text-align: left; width: 130px; max-width: 130px;">${department === 'PM' ? 'Manager' : department === 'LOG' ? 'Logistics Technician' : department === 'UNIT6' ? 'Technician' : 'Engineer'}</th>`;

  dates.forEach((date, idx) => {
    const d = new Date(date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const dayNum = d.getDate();
    const isBank = !!bankHols[date];
    const isMonday = d.getDay() === 1 ? ' week-start' : '';
    html += `<th class="holiday-date-header ${isBank ? 'bank-holiday-header' : ''}${isMonday}" title="${date}"><div>${dayName}</div><div>${dayNum}</div></th>`;
  });

  html += `</tr></thead><tbody>`;

  teamArray.forEach(member => {
    html += `<tr><th style="position: sticky; left: 0; background: var(--white); z-index: 9; text-align: left; padding: 8px; width: 130px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${esc(member.name)}">${esc(member.name)}</th>`;

    dates.forEach(date => {
      const isBank = !!bankHols[date];
      const holiday = holidaysArray.find(h => h.personId === member.id && h.date === date);
      const state = holiday ? holiday.type : null;
      const d = new Date(date);
      const isMonday = d.getDay() === 1 ? ' week-start' : '';

      let cellClass = `holiday-cell${isMonday}`;
      let cellContent = '—';

      if (isBank) {
        cellClass += ' bank-holiday';
        cellContent = 'BH';
      } else if (state === 'full') {
        cellClass += ' holiday-full';
        cellContent = 'F';
      } else if (state === 'half') {
        cellClass += ' holiday-half';
        cellContent = 'H';
      }

      const clickAttr = !isBank && canEdit() ? `data-cap-action="cap-me-toggle-holiday" data-member-id="${member.id}" data-date="${date}"` : '';
      html += `<td class="${cellClass}" ${clickAttr} title="${date}">${cellContent}</td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table></div></div>`;
  return html;
};

window.meToggleHoliday = function(personId, date) {
  const holidays = meDataGetHolidays();
  const holiday = holidays.find(h => h.personId === personId && h.date === date);

  if (!holiday) {
    meDataAddHoliday(personId, date, 'full');
  } else if (holiday.type === 'full') {
    meDataUpdateHoliday(personId, date, 'half');
  } else {
    meDataDeleteHoliday(personId, date);
  }

  // Save scroll position before re-render
  const scrollContainer = document.querySelector('.me-card-body');
  const scrollPos = scrollContainer ? scrollContainer.scrollLeft : 0;

  meDebouncedSave();
  meSetTab('holidays');

  // Restore scroll position immediately after re-render
  setTimeout(() => {
    const container = document.querySelector('.me-card-body');
    if (container) {
      container.scrollLeft = scrollPos;
    }
  }, 0);
};
