/* ============================================================
   cap-heatmap.js — Team Capacity Heat Map & Detail View
   ============================================================ */

import { capGetWeekRange, capCalcWeekUtilisation } from './cap-calculations.js'
import { getMonthLabel } from './cap-utils.js'
import { esc } from '../../../../utils/js/helpers.js'

export function capRenderHeatmapTab(monthKey, _teamArray, _tasksArray, _productsArray, _holidaysArray, department) {
  const dept = department || 'ME'
  const monthLabel = getMonthLabel(monthKey)
  
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
    </div>`
}

export function capDrawHeatmapNow(teamArray, tasksArray, _productsArray, holidaysArray, monthKey) {
  const container = document.getElementById('capHeatmapGrid')
  if (!container) return

  const weeks = capGetWeekRange(monthKey, 12)
  const team = Array.isArray(teamArray) ? teamArray : []
  const tasks = Array.isArray(tasksArray) ? tasksArray : []
  const holidays = Array.isArray(holidaysArray) ? holidaysArray : []

  let html = '<div class="me-heatmap-person-header"></div>'

  weeks.forEach(({ start, end }) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startDay = String(startDate.getDate()).padStart(2, '0')
    const endDay = String(endDate.getDate()).padStart(2, '0')
    const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    html += `
      <div class="me-heatmap-week-header">
        <div class="me-heatmap-week-label">${startDay}-${endDay}<br/>${month}</div>
      </div>
    `
  })

  team.forEach(person => {
    if (!person || !person.startDate) return
    html += `<div class="me-heatmap-person-label">${esc(person.name || '')}</div>`

    weeks.forEach(({ start, end }) => {
      const data = capCalcWeekUtilisation(person.id, start, end, tasks, holidays, team)
      const utilisation = data.capacity > 0 ? Math.round((data.demand / data.capacity) * 100) : 0

      let cellClass = 'me-heatmap-cell'
      if (data.capacity === 0) cellClass += ' me-heatmap-no-capacity'
      else if (utilisation < 80) cellClass += ' me-heatmap-util-low'
      else if (utilisation < 100) cellClass += ' me-heatmap-util-mid'
      else cellClass += ' me-heatmap-util-high'

      html += `
        <div class="${cellClass}" title="${esc(person.name || '')}: ${utilisation}% (${data.demand.toFixed(1)}h / ${data.capacity.toFixed(1)}h)">
          <div class="me-heatmap-cell-value">${utilisation}%</div>
        </div>
      `
    })
  })

  container.innerHTML = html
}

export function capOpenHeatmapDetail(_personId, _weekStart, _weekEnd) {}

export function capCloseHeatmapDetail() {}
