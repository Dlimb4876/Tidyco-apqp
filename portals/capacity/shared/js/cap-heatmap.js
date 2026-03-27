/* ============================================================
   cap-heatmap.js — Team Capacity Heat Map & Detail View
   ============================================================ */

window.capRenderHeatmapTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray, department) {
  if (typeof window.meRenderHeatmapTab === 'function') {
    const contextKey = 'me' + 'CurrentDepartmentContext';
    const previous = window[contextKey];
    window[contextKey] = department || 'ME';
    try {
      return window.meRenderHeatmapTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
    } finally {
      window[contextKey] = previous;
    }
  }

  const dept = department || 'ME';
  const monthLabel = getMonthLabel(monthKey);
  
  return `
    <div class="me-card">
      <div class="me-card-head">
        <span class="me-card-title">TEAM UTILISATION HEAT MAP</span>
        <span style="font-size:12px;color:var(--muted)">${monthLabel} · ${dept}</span>
      </div>
      <div class="me-card-body" style="padding: 16px;">
        <div class="me-heatmap-wrapper">
          <div id="capHeatmapGrid" class="me-heatmap-grid"></div>
        </div>
      </div>
    </div>`;
};

window.capDrawHeatmapNow = function(teamArray, tasksArray, productsArray, holidaysArray, monthKey, department) {
  if (typeof window.meDrawHeatmapNow === 'function') {
    const contextKey = 'me' + 'CurrentDepartmentContext';
    const previous = window[contextKey];
    window[contextKey] = department || 'ME';
    try {
      window.meDrawHeatmapNow();
    } finally {
      window[contextKey] = previous;
    }
    return;
  }

  const container = document.getElementById('capHeatmapGrid');
  if (!container) return;

  const weeks = typeof window.capGetWeekRange === 'function'
    ? window.capGetWeekRange(monthKey, 12)
    : [];
  const team = Array.isArray(teamArray) ? teamArray : [];
  const tasks = Array.isArray(tasksArray) ? tasksArray : [];
  const holidays = Array.isArray(holidaysArray) ? holidaysArray : [];

  let html = '<div class="me-heatmap-person-header"></div>';

  weeks.forEach(({ start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    html += `
      <div class="me-heatmap-week-header">
        <div class="me-heatmap-week-label">${startDay}-${endDay}<br/>${month}</div>
      </div>
    `;
  });

  team.forEach(person => {
    if (!person || !person.startDate) return;
    html += `<div class="me-heatmap-person-label">${esc(person.name || '')}</div>`;

    weeks.forEach(({ start, end }) => {
      const data = typeof window.capCalcWeekUtilisation === 'function'
        ? window.capCalcWeekUtilisation(person.id, start, end, tasks, holidays, team)
        : { capacity: 0, demand: 0 };
      const utilisation = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0;

      let cellClass = 'me-heatmap-cell';
      if (data.capacity === 0) cellClass += ' me-heatmap-no-capacity';
      else if (utilisation < 80) cellClass += ' me-heatmap-util-low';
      else if (utilisation < 100) cellClass += ' me-heatmap-util-mid';
      else cellClass += ' me-heatmap-util-high';

      html += `
        <div class="${cellClass}" title="${esc(person.name || '')}: ${utilisation}% (${data.demand.toFixed(1)}h / ${data.capacity.toFixed(1)}h)">
          <div class="me-heatmap-cell-value">${utilisation}%</div>
        </div>
      `;
    });
  });

  container.innerHTML = html;
};

window.capOpenHeatmapDetail = function(personId, weekStart, weekEnd) {
  if (typeof window.meOpenHeatmapDetail === 'function') {
    window.meOpenHeatmapDetail(personId, weekStart, weekEnd);
  }
};

window.capCloseHeatmapDetail = function() {
  if (typeof window.meCloseHeatmapDetail === 'function') {
    window.meCloseHeatmapDetail();
  }
};
