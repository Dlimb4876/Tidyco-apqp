import { meDataGetTeam, meDataGetTasks, meDataGetHolidays } from './me-data.js';
import { meGetMonthLabel, meFormatDate, meCountWorkDaysBetween } from './me-chart.js';
import { meChartStart, meOnPrevMonth, meOnNextMonth, meOnMonthChange } from './me-capacity.js';
import { esc } from '../../../utils/js/helpers.js';

export let meHeatmapDetailOpen = null; // { personId, weekStart, weekEnd } when modal is open

// ── Main render function ────────────────────────────────────
export function meRenderHeatmapTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const monthLabel = meGetMonthLabel(monthKey);

  // Calculate overall stats
  const weeks = meGetWeekRange(monthKey, 20);
  let totalCapacity = 0, totalDemand = 0;

  teamArray.forEach(person => {
    if (!person.startDate) return;
    weeks.forEach(({ start, end }) => {
      const data = meCalcWeekUtilisation(person.id, start, end, tasksArray, holidaysArray);
      totalCapacity += data.capacity;
      totalDemand += data.demand;
    });
  });

  const avgUtil = totalCapacity > 0 ? Math.round((totalDemand / totalCapacity) * 100) : 0;
  const utilizationColor = avgUtil < 85 ? 'var(--green)' : avgUtil < 100 ? 'var(--amber)' : 'var(--red)';

  return `
    <div class="me-heatmap-container">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalCapacity.toFixed(0)}</div>
          <div class="me-kpi-label">Total Capacity (hours)</div>
          <div class="me-kpi-month">12-week view</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${totalDemand.toFixed(0)}</div>
          <div class="me-kpi-label">Total Demand (hours)</div>
          <div class="me-kpi-month">12-week view</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid ${utilizationColor};">
          <div class="me-kpi-value">${avgUtil}%</div>
          <div class="me-kpi-label">Avg Team Utilisation</div>
          <div class="me-kpi-month">${avgUtil < 85 ? '✓ Healthy' : avgUtil < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${Math.max(0, totalCapacity - totalDemand).toFixed(0)}</div>
          <div class="me-kpi-label">Available Headroom (hours)</div>
          <div class="me-kpi-month">Unused capacity</div>
        </div>
      </div>

      <div class="me-chart-controls">
        <button class="btn btn-secondary" onclick="meOnPrevMonth()">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${monthKey}" onchange="meOnMonthChange(this.value)" />
        <button class="btn btn-secondary" onclick="meOnNextMonth()">Next →</button>
      </div>

      <div class="me-heatmap-wrapper">
        <div id="meHeatmapGrid" class="me-heatmap-grid"></div>
      </div>

      <div class="me-chart-legend">
        <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div><span>Underutilized (&lt;80%)</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #f59e0b;"></div><span>At Capacity (80–100%)</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #ef4444;"></div><span>Overloaded (&gt;100%)</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #e5e7eb;"></div><span>No capacity</span></div>
      </div>
    </div>

    <!-- Drill-down modal -->
    <div id="meDetailModal" class="me-detail-modal" style="display:none;">
      <div class="me-detail-modal-overlay" onclick="meCloseHeatmapDetail()"></div>
      <div class="me-detail-modal-content">
        <div class="me-detail-header">
          <button class="btn btn-ghost btn-sm" onclick="meCloseHeatmapDetail()">✕</button>
          <div>
            <div class="me-detail-title" id="meDetailTitle">Person Name · Week</div>
            <div class="me-detail-subtitle" id="meDetailSubtitle">Capacity & Tasks</div>
          </div>
        </div>
        <div class="me-detail-body" id="meDetailBody"></div>
      </div>
    </div>
  `;
};

// ── Heat map rendering ──────────────────────────────────────
export function meDrawHeatmapNow() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const holidays = meDataGetHolidays();
  const monthKey = meChartStart;

  const weeks = meGetWeekRange(monthKey, 20);
  const container = document.getElementById('meHeatmapGrid');

  if (!container) return;

  // Build grid: sticky person column + week columns
  let html = `<div class="me-heatmap-person-header"></div>`;

  // Week headers
  weeks.forEach(({ start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    html += `
      <div class="me-heatmap-week-header">
        <div class="me-heatmap-week-label">${startDay}–${endDay}<br/>${month}</div>
      </div>
    `;
  });

  // Team rows
  team.forEach(person => {
    if (!person.startDate) return;

    html += `<div class="me-heatmap-person-label">${esc(person.name)}</div>`;

    weeks.forEach(({ start, end }) => {
      const data = meCalcWeekUtilisation(person.id, start, end, tasks, holidays);
      const util = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0;

      let cellClass = 'me-heatmap-cell';
      if (data.capacity === 0) cellClass += ' me-heatmap-no-capacity';
      else if (util < 80) cellClass += ' me-heatmap-util-low';
      else if (util < 100) cellClass += ' me-heatmap-util-mid';
      else cellClass += ' me-heatmap-util-high';

      html += `
        <div class="${cellClass}"
             onclick="meOpenHeatmapDetail('${person.id}', '${start}', '${end}')"
             title="${person.name}: ${util}% (${data.demand.toFixed(1)}h / ${data.capacity.toFixed(1)}h)">
          <div class="me-heatmap-cell-value">${util}%</div>
        </div>
      `;
    });
  });

  container.innerHTML = html;
};

// ── Drill-down modal ────────────────────────────────────────
export function meOpenHeatmapDetail(personId, weekStart, weekEnd) {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const holidays = meDataGetHolidays();

  const person = team.find(p => p.id === personId);
  if (!person) return;

  meHeatmapDetailOpen = { personId, weekStart, weekEnd };

  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = startDate.getFullYear();

  document.getElementById('meDetailTitle').textContent = `${person.name} · ${startDay}–${endDay} ${month} ${year}`;

  const data = meCalcWeekUtilisation(personId, weekStart, weekEnd, tasks, holidays);
  const util = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0;

  let subtitle = `${util}% utilised · ${data.demand.toFixed(1)}h / ${data.capacity.toFixed(1)}h`;
  document.getElementById('meDetailSubtitle').textContent = subtitle;

  const detailHTML = meRenderDetailPanel(personId, weekStart, weekEnd, tasks, holidays);
  document.getElementById('meDetailBody').innerHTML = detailHTML;

  document.getElementById('meDetailModal').style.display = 'flex';
};

export function meCloseHeatmapDetail() {
  meHeatmapDetailOpen = null;
  document.getElementById('meDetailModal').style.display = 'none';
};

function meRenderDetailPanel(personId, weekStart, weekEnd, tasksArray, holidaysArray) {
  const weekStart_d = new Date(weekStart);
  const weekEnd_d = new Date(weekEnd);

  // Get assigned tasks for this person in this week
  const weekTasks = [];
  tasksArray.forEach(task => {
    if (task.assigneeId !== personId) return;
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // Check if task overlaps with week
    if (taskStart <= weekEnd_d && taskEnd >= weekStart_d) {
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart_d.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd_d.getTime()));

      const taskDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const proratedHours = (task.totalHours || 0) * (overlapDays / taskDays);

      weekTasks.push({
        ...task,
        proratedHours: proratedHours.toFixed(1)
      });
    }
  });

  let html = `<div class="me-detail-stats">`;

  if (weekTasks.length === 0) {
    html += `<div class="me-detail-empty">No assigned tasks this week</div>`;
  } else {
    html += `<div class="me-detail-task-count">${weekTasks.length} task${weekTasks.length === 1 ? '' : 's'} assigned</div>`;
    html += `<div class="me-detail-tasks">`;

    weekTasks.forEach(task => {
      const catClass = `me-cat me-cat-${task.category ? task.category.toLowerCase() : 'other'}`;
      html += `
        <div class="me-detail-task-row">
          <div class="me-detail-task-header">
            <span class="${catClass}">${task.category || 'OTHER'}</span>
            <span class="me-detail-task-name">${esc(task.name)}</span>
          </div>
          <div class="me-detail-task-hours">${task.proratedHours}h (this week)</div>
          <div class="me-detail-task-dates">${task.startDate} → ${task.endDate}</div>
        </div>
      `;
    });

    html += `</div>`;
  }

  // Show holidays in this week
  const weekHolidays = holidaysArray.filter(h => {
    const hDate = new Date(h.date);
    return hDate >= weekStart_d && hDate <= weekEnd_d;
  });

  if (weekHolidays.length > 0) {
    html += `<div class="me-detail-holidays">`;
    html += `<div class="me-detail-section-label">Time Off</div>`;
    weekHolidays.forEach(h => {
      const typeLabel = h.type === 'full' ? 'Full day' : 'Half day';
      html += `<div class="me-detail-holiday">${h.date} · ${typeLabel}</div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Calculations ────────────────────────────────────────────
export function meCalcWeekUtilisation(personId, weekStart, weekEnd, tasksArray, holidaysArray) {
  const person = meDataGetTeam().find(p => p.id === personId);
  if (!person || !person.startDate) return { capacity: 0, demand: 0, utilisation: 0 };

  const weekStart_d = new Date(weekStart);
  const weekEnd_d = new Date(weekEnd);

  // Calculate capacity (37.5h/week adjusted by utilisation %)
  const baseHours = (person.hoursPerWeek || 37.5);
  const adjustedHours = baseHours * ((person.utilisation || 80) / 100);

  // Count working days in this week
  const workDays = meCountWorkDaysBetween(weekStart_d, weekEnd_d);
  const capacityBefore = adjustedHours * (workDays / 5);

  // Subtract holidays for this person in this week
  let holidayDeduction = 0;
  const hoursPerDay = 7.5;  // 37.5 / 5

  holidaysArray.forEach(holiday => {
    if (holiday.personId !== personId) return;
    const hDate = new Date(holiday.date);
    if (hDate >= weekStart_d && hDate <= weekEnd_d) {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  const capacity = Math.max(0, capacityBefore - holidayDeduction);

  // Calculate demand from assigned tasks
  let demand = 0;
  tasksArray.forEach(task => {
    if (task.assigneeId !== personId) return;
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // Check overlap with week
    if (taskStart <= weekEnd_d && taskEnd >= weekStart_d) {
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart_d.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd_d.getTime()));

      const taskDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const proratedHours = (task.totalHours || 0) * (overlapDays / taskDays);

      demand += proratedHours;
    }
  });

  const utilisation = capacity > 0 ? Math.round((demand / capacity) * 100) : 0;

  return { capacity, demand, utilisation };
}

// ── Week range generation ───────────────────────────────────
export function meGetWeekRange(monthKey, weekCount) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);

  // Find first Monday of the month
  let current = new Date(monthStart);
  const dayOfWeek = current.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  if (daysUntilMonday > 0) {
    current.setDate(current.getDate() + daysUntilMonday);
  }

  const weeks = [];
  for (let i = 0; i < weekCount; i++) {
    const start = meFormatDate(new Date(current));
    const end = meFormatDate(new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000)); // Add 6 days
    weeks.push({ start, end });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

// Escape HTML
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
