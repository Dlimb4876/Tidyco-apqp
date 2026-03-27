/* ============================================================
   cap-holidays.js — Holiday Planner Tab Rendering
   ============================================================ */

window.capFormatDate = function(date) {
  if (!date || !(date instanceof Date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function capHolidayDeptLabel(department) {
  if (department === 'PM') return 'Manager';
  if (department === 'LOG') return 'Logistics Technician';
  if (department === 'UNIT6') return 'Technician';
  return 'Engineer';
}

function capHolidayMonthLabel(monthKey) {
  const label = typeof window.getMonthLabel === 'function' ? window.getMonthLabel(monthKey) : monthKey;
  if (Array.isArray(label)) return `${label[0]} ${label[1]}`;
  return label || monthKey;
}

function capHolidayBankHolidayMap(selectedMonth, bankHolidays) {
  const [year, month] = (selectedMonth || '').split('-').map(Number);
  const holidayMap = {};

  if (Array.isArray(bankHolidays)) {
    bankHolidays.forEach(entry => {
      if (entry && entry.date) holidayMap[entry.date] = true;
    });
  } else if (bankHolidays && typeof bankHolidays === 'object') {
    Object.keys(bankHolidays).forEach(key => {
      if (bankHolidays[key]) holidayMap[key] = true;
    });
  }

  if (typeof window.getBankHolidaysForYear === 'function' && Number.isFinite(year)) {
    window.getBankHolidaysForYear(year).forEach(entry => {
      if (entry && entry.date) holidayMap[entry.date] = true;
    });

    const nextMonthYear = month === 12 ? year + 1 : year;
    if (nextMonthYear !== year) {
      window.getBankHolidaysForYear(nextMonthYear).forEach(entry => {
        if (entry && entry.date) holidayMap[entry.date] = true;
      });
    }
  }

  return holidayMap;
}

window.capRenderHolidaysTab = function(holidaysArray, teamArray, monthKey, department, bankHolidays, canEditFlag) {
  const dept = department || 'ME';
  const selectedMonth = monthKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month + 1, 0);
  const bankHolidayMap = capHolidayBankHolidayMap(selectedMonth, bankHolidays);
  const canEditPlanner = canEditFlag !== false;
  const dates = [];

  for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const dateValue = new Date(cursor);
    const dayOfWeek = dateValue.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      dates.push(window.capFormatDate(dateValue));
    }
  }

  const today = new Date();
  const todayMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === todayMonthKey;
  let monthHeaderHtml = '';
  let currentHeaderMonth = null;
  let monthStartIndex = 0;

  dates.forEach((date, index) => {
    const dateValue = new Date(date);
    const currentKey = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
    if (currentKey !== currentHeaderMonth) {
      if (currentHeaderMonth !== null) {
        monthHeaderHtml += `<th colspan="${index - monthStartIndex}" style="text-align:center;font-weight:bold;font-size:13px;background:var(--overlay-light);">${capHolidayMonthLabel(currentHeaderMonth)}</th>`;
      }
      currentHeaderMonth = currentKey;
      monthStartIndex = index;
    }
  });

  if (currentHeaderMonth !== null) {
    monthHeaderHtml += `<th colspan="${dates.length - monthStartIndex}" style="text-align:center;font-weight:bold;font-size:13px;background:var(--overlay-light);">${capHolidayMonthLabel(currentHeaderMonth)}</th>`;
  }

  let rowsHtml = '';
  (Array.isArray(teamArray) ? teamArray : []).forEach(member => {
    rowsHtml += `<tr><th style="position:sticky;left:0;background:var(--white);z-index:9;text-align:left;padding:8px;width:130px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(member && member.name ? member.name : '')}">${esc(member && member.name ? member.name : '')}</th>`;

    dates.forEach(date => {
      const isBankHoliday = !!bankHolidayMap[date];
      const holiday = (holidaysArray || []).find(entry => entry && entry.personId === member.id && entry.date === date);
      const state = holiday ? holiday.type : null;
      const dateValue = new Date(date);
      const isMonday = dateValue.getDay() === 1 ? ' week-start' : '';

      let cellClass = `holiday-cell${isMonday}`;
      let cellContent = '—';
      if (isBankHoliday) {
        cellClass += ' bank-holiday';
        cellContent = 'BH';
      } else if (state === 'full') {
        cellClass += ' holiday-full';
        cellContent = 'F';
      } else if (state === 'half') {
        cellClass += ' holiday-half';
        cellContent = 'H';
      }

      const clickAttr = !isBankHoliday && canEditPlanner
        ? `data-cap-action="cap-me-toggle-holiday" data-member-id="${member.id}" data-date="${date}"`
        : '';

      rowsHtml += `<td class="${cellClass}" ${clickAttr} title="${date}">${cellContent}</td>`;
    });

    rowsHtml += '</tr>';
  });

  return `
    <div class="me-card">
      <div class="me-card-head">
        <span class="me-card-title">HOLIDAY PLANNER</span>
        <span style="font-size:11px;color:var(--muted)">5-day work week · Click cells: working → full day → half day → remove · Blue = bank holidays</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--overlay-light);border-bottom:1px solid var(--border);">
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-prev-month">← Prev</button>
        <input type="month" name="cap_me_holidays_month" value="${selectedMonth}" data-cap-action="cap-me-month-change" style="padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:14px;">
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-next-month">Next →</button>
        <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-today" ${isCurrentMonth ? 'disabled style="opacity:0.4;"' : 'style="color:var(--primary);"'}>Today</button>
      </div>
      <div class="me-card-body me-card-body-gutter" style="overflow-x:auto;">
        <table class="holiday-matrix">
          <thead>
            <tr>
              <th style="position:sticky;left:0;z-index:10;background:var(--white);text-align:left;"></th>
              ${monthHeaderHtml}
            </tr>
            <tr>
              <th style="position:sticky;left:0;z-index:10;background:var(--white);text-align:left;width:130px;max-width:130px;">${capHolidayDeptLabel(dept)}</th>
              ${dates.map(date => {
                const dateValue = new Date(date);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateValue.getDay()];
                const dayNum = dateValue.getDate();
                const isBankHoliday = !!bankHolidayMap[date];
                const isMonday = dateValue.getDay() === 1 ? ' week-start' : '';
                return `<th class="holiday-date-header ${isBankHoliday ? 'bank-holiday-header' : ''}${isMonday}" title="${date}"><div>${dayName}</div><div>${dayNum}</div></th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>`;
};

window.capToggleHoliday = function(personId, date, holidaysArray, addFn, updateFn, deleteFn) {
  const holidayRows = Array.isArray(holidaysArray) ? holidaysArray : [];
  const holiday = holidayRows.find(h => h.personId === personId && h.date === date);
  
  if (!holiday) {
    if (addFn) addFn(personId, date, 'full');
  } else if (holiday.type === 'full') {
    if (updateFn) updateFn(personId, date, 'half');
  } else {
    if (deleteFn) deleteFn(personId, date);
  }
};
