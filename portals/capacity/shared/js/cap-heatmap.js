/* ============================================================
   cap-heatmap.js — Team Capacity Heat Map & Detail View
   ============================================================ */

import { capGetWeekRange, capCalcWeekUtilisation, getEffectiveSubtasks, capParseDateOnlyLocal, countNetworkDaysBetween } from './cap-calculations.js'
import { getMonthLabel, getBankHolidaysForYear } from './cap-utils.js'
import { esc } from '../../../../utils/js/helpers.js'

// Context stored at draw time so capOpenHeatmapDetail can access it
let _heatmapCtx = null

const LEGEND_ITEMS = [
  { cls: 'me-heatmap-util-very-clear', label: '< 50%',   note: 'Very clear' },
  { cls: 'me-heatmap-util-clear',      label: '50–65%',  note: 'Clear' },
  { cls: 'me-heatmap-util-good',       label: '65–80%',  note: 'Good' },
  { cls: 'me-heatmap-util-caution',    label: '80–90%',  note: 'Caution' },
  { cls: 'me-heatmap-util-warning',    label: '90–95%',  note: 'Warning' },
  { cls: 'me-heatmap-util-near',       label: '95–99%',  note: 'Nearly full' },
  { cls: 'me-heatmap-util-over',       label: '≥ 100%',  note: 'Over' },
  { cls: 'me-heatmap-no-capacity',     label: '—',       note: 'No data' }
]

function utilClass(utilisation, capacity) {
  if (capacity === 0) return 'me-heatmap-no-capacity'
  if (utilisation < 50)  return 'me-heatmap-util-very-clear'
  if (utilisation < 65)  return 'me-heatmap-util-clear'
  if (utilisation < 80)  return 'me-heatmap-util-good'
  if (utilisation < 90)  return 'me-heatmap-util-caution'
  if (utilisation < 95)  return 'me-heatmap-util-warning'
  if (utilisation < 100) return 'me-heatmap-util-near'
  return 'me-heatmap-util-over'
}

function formatWeekRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const startDay = String(s.getDate()).padStart(2, '0')
  const endDay = String(e.getDate()).padStart(2, '0')
  const startMon = s.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const endMon = e.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  return startMon === endMon
    ? `${startDay}–${endDay} ${startMon}`
    : `${startDay} ${startMon}–${endDay} ${endMon}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function capRenderHeatmapTab(monthKey, _teamArray, _tasksArray, _productsArray, _holidaysArray, department) {
  const dept = department || 'ME'
  const monthLabel = getMonthLabel(monthKey)

  const legendHtml = LEGEND_ITEMS.map(item => `
    <span class="me-heatmap-legend-item">
      <span class="me-heatmap-legend-swatch ${item.cls}">${item.label}</span>
      <span style="color:var(--muted);font-size:11px">${item.note}</span>
    </span>
  `).join('')

  return `
    <div class="me-card">
      <div class="me-card-head">
        <span class="me-card-title">TEAM UTILISATION HEAT MAP</span>
        <span style="font-size:12px;color:var(--muted)">${monthLabel} · ${dept} · Click a cell to see task detail</span>
      </div>
      <div class="me-card-body me-card-body-gutter">
        <div class="me-heatmap-legend" aria-label="Heatmap utilisation legend">
          ${legendHtml}
        </div>
        <div class="me-heatmap-wrapper">
          <div id="capHeatmapGrid" class="me-heatmap-grid"></div>
        </div>
      </div>
    </div>`
}

export function capDrawHeatmapNow(teamArray, tasksArray, _productsArray, holidaysArray, monthKey) {
  const container = document.getElementById('capHeatmapGrid')
  if (!container) return

  const weeks = capGetWeekRange(monthKey, 26)
  const team = Array.isArray(teamArray) ? teamArray : []
  const tasks = Array.isArray(tasksArray) ? tasksArray : []
  const holidays = Array.isArray(holidaysArray) ? holidaysArray : []
  const today = todayStr()

  _heatmapCtx = { teamArray: team, tasksArray: tasks, holidaysArray: holidays }

  let html = '<div class="me-heatmap-person-header"></div>'

  weeks.forEach(({ start, end }) => {
    const isToday = today >= start && today <= end
    const todayCls = isToday ? ' me-heatmap-week-today' : ''
    html += `<div class="me-heatmap-week-header${todayCls}">${formatWeekRange(start, end)}</div>`
  })

  team.forEach(person => {
    if (!person || !person.startDate) return
    html += `<div class="me-heatmap-person-label" title="${esc(person.name || '')}">${esc(person.name || '')}</div>`

    weeks.forEach(({ start, end }) => {
      const data = capCalcWeekUtilisation(person.id, start, end, tasks, holidays, team)
      const utilisation = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0
      const cls = utilClass(utilisation, data.capacity)
      const isToday = today >= start && today <= end
      const todayCls = isToday ? ' me-heatmap-cell-today' : ''
      const displayVal = data.capacity === 0 ? '—' : `${utilisation}%`

      html += `
        <div class="me-heatmap-cell ${cls}${todayCls}"
          data-cap-action="cap-me-heatmap-open"
          data-member-id="${esc(person.id)}"
          data-start="${start}"
          data-end="${end}"
          title="${esc(person.name || '')}: ${displayVal} (${data.demand.toFixed(1)}h / ${data.capacity.toFixed(1)}h)">
          <div class="me-heatmap-cell-value">${displayVal}</div>
        </div>`
    })
  })

  container.innerHTML = html
}

export function capOpenHeatmapDetail(personId, weekStart, weekEnd) {
  if (!_heatmapCtx) return
  const { teamArray, tasksArray, holidaysArray } = _heatmapCtx

  const person = teamArray.find(p => p && p.id === personId)
  if (!person) return

  const data = capCalcWeekUtilisation(personId, weekStart, weekEnd, tasksArray, holidaysArray, teamArray)
  const utilPct = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0
  const barWidth = Math.min(utilPct, 100)
  const barColor = utilPct >= 100 ? 'var(--red)' : utilPct >= 80 ? 'var(--amber)' : 'var(--green)'

  // Collect tasks contributing to this person this week
  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekEnd)

  const relevantYears = new Set([weekStartDate.getFullYear(), weekEndDate.getFullYear()])
  const bankHolSet = new Set()
  relevantYears.forEach(y => getBankHolidaysForYear(y).forEach(h => bankHolSet.add(h.date)))

  const taskDetails = []
  ;(tasksArray || []).forEach(task => {
    if (!task || task.isDisabled === true || !task.startDate || !task.endDate) return
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    if (taskStart > weekEndDate || taskEnd < weekStartDate) return

    const effectiveSubs = getEffectiveSubtasks(task)
    effectiveSubs.forEach(sub => {
      if (sub.assigneeId !== personId) return
      const taskNetDays = countNetworkDaysBetween(taskStart, taskEnd, bankHolSet)
      if (taskNetDays === 0) return
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStartDate.getTime()))
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEndDate.getTime()))
      const overlapNetDays = countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet)
      const proratedHours = (sub.hours || 0) * (overlapNetDays / taskNetDays)
      if (proratedHours > 0.05) {
        taskDetails.push({ name: task.name || sub.name || 'Unnamed task', hours: proratedHours })
      }
    })
  })

  // Collect holidays in week
  const weekHolidays = (holidaysArray || []).filter(h =>
    h && h.personId === personId && h.date >= weekStart && h.date <= weekEnd
  )

  const weekLabel = formatWeekRange(weekStart, weekEnd)

  let tasksHtml = ''
  if (taskDetails.length === 0) {
    tasksHtml = '<div class="me-detail-empty">No tasks assigned this week</div>'
  } else {
    tasksHtml = `
      <div class="me-detail-task-count">${taskDetails.length} task${taskDetails.length === 1 ? '' : 's'}</div>
      <div class="me-detail-tasks">
        ${taskDetails.map(t => `
          <div class="me-detail-task-row">
            <div class="me-detail-task-header">
              <span class="me-detail-task-name">${esc(t.name)}</span>
              <span class="me-detail-task-hours">${t.hours.toFixed(1)}h</span>
            </div>
          </div>`).join('')}
      </div>`
  }

  let holidaysHtml = ''
  if (weekHolidays.length > 0) {
    holidaysHtml = `
      <div class="me-detail-holidays">
        <div class="me-detail-section-label">Leave this week</div>
        ${weekHolidays.map(h => `
          <div class="me-detail-holiday">${h.date} · ${h.type === 'full' ? 'Full day' : 'Half day'}</div>
        `).join('')}
      </div>`
  }

  const modalHtml = `
    <div class="me-detail-modal" id="capHeatmapDetailModal" role="dialog" aria-modal="true">
      <div class="me-detail-modal-overlay" data-cap-action="cap-me-heatmap-close"></div>
      <div class="me-detail-modal-content">
        <div class="me-detail-header">
          <div>
            <div class="me-detail-title">${esc(person.name || '')}</div>
            <div class="me-detail-subtitle">${weekLabel}</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-heatmap-close" aria-label="Close">✕</button>
        </div>
        <div class="me-detail-body">
          <div class="me-detail-stats">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
                <span style="font-size:12px;font-weight:600;color:var(--ink)">${utilPct}% utilised</span>
                <span class="me-detail-util-label">${data.demand.toFixed(1)}h demand / ${data.capacity.toFixed(1)}h capacity</span>
              </div>
              <div class="me-detail-util-bar-wrap">
                <div class="me-detail-util-bar" style="width:${barWidth}%;background:${barColor}"></div>
              </div>
            </div>
            ${tasksHtml}
            ${holidaysHtml}
          </div>
        </div>
      </div>
    </div>`

  document.body.insertAdjacentHTML('beforeend', modalHtml)

  // The delegation listener is on #mainContent; the modal lives on body, so wire close directly
  document.getElementById('capHeatmapDetailModal')
    ?.querySelectorAll('[data-cap-action="cap-me-heatmap-close"]')
    .forEach(el => el.addEventListener('click', capCloseHeatmapDetail))
}

export function capCloseHeatmapDetail() {
  document.getElementById('capHeatmapDetailModal')?.remove()
}

