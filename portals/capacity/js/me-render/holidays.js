// ME Holiday Planner Tab - Render Component

import { add90Days } from '../me-utils/dates.js';

/**
 * Render 90-day holiday matrix
 * @param {Array} holidaysArray User-marked holidays
 * @param {Array} teamArray Team members
 * @param {Object} bankHolidaysMap Bank holidays {date: name, ...}
 * @param {Function} onToggle Callback: onToggle(personId, date, newType)
 * @returns {string} HTML
 */
export function meRenderHolidayPlanner(holidaysArray, teamArray, bankHolidaysMap, onToggle) {
  const today = new Date();
  const endDate = add90Days(today);

  // Build date range
  const dates = [];
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(new Date(d)));
  }

  let html = `
    <div class="me-holiday-container">
      <div class="me-holiday-info">
        <p><strong>90-day rolling holiday view</strong> — Click cells to toggle: working → full day → half day → remove</p>
        <p style="color: var(--muted); font-size: 0.9rem;">
          Blue cells = UK bank holidays (read-only, always deducted from capacity)
        </p>
      </div>

      <div class="me-holiday-scroll">
        <table class="holiday-matrix">
          <thead>
            <tr>
              <th class="holiday-person-header" style="position: sticky; left: 0; z-index: 10;">Team Member</th>
              ${dates.map(date => {
                const d = new Date(date);
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                const dayNum = d.getDate();
                const isBank = !!bankHolidaysMap[date];
                return `
                  <th class="holiday-date-header ${isBank ? 'bank-holiday' : ''}" title="${date}">
                    <div>${dayName}</div>
                    <div>${dayNum}</div>
                  </th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>`;

  // Rows for each team member
  teamArray.forEach(member => {
    html += `
      <tr>
        <th class="holiday-person-name" style="position: sticky; left: 0; background: var(--white); z-index: 9;">
          ${esc(member.name)}
        </th>`;

    dates.forEach(date => {
      const isBank = !!bankHolidaysMap[date];
      const holiday = holidaysArray.find(h => h.personId === member.id && h.date === date);
      const state = holiday ? holiday.type : null;

      let cellClass = 'holiday-cell';
      let cellContent = '—';

      if (isBank) {
        cellClass += ' bank-holiday';
        cellContent = '⬚';
      } else if (state === 'full') {
        cellClass += ' holiday-full';
        cellContent = 'F';
      } else if (state === 'half') {
        cellClass += ' holiday-half';
        cellContent = 'H';
      }

      const clickHandler = !isBank ? `onclick="meOnHolidayToggle('${member.id}', '${date}')"` : '';

      html += `
        <td class="${cellClass}" ${clickHandler} title="${date}">
          ${cellContent}
        </td>`;
    });

    html += `</tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
}

/**
 * Format Date object to YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Escape HTML special characters
 */
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
