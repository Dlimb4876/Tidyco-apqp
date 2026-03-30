/* ============================================================
   cap-team.js — Team Tab Rendering
   ============================================================ */

import { capGetHoursPerWeek, getMonthLabel } from './cap-utils.js'
import { esc } from '../../../../utils/js/helpers.js'

export const capTeamSort = {
  ME: { column: '', direction: 'asc' },
  PM: { column: '', direction: 'asc' },
  LOG: { column: '', direction: 'asc' },
  UNIT6: { column: '', direction: 'asc' }
}

function capTeamNormalizeDepartment(department) {
  const dept = (department || 'ME').toString().toUpperCase()
  if (dept === 'PM' || dept === 'LOG' || dept === 'UNIT6') return dept
  return 'ME'
}

export function capTeamSortBy(column, department) {
  const dept = capTeamNormalizeDepartment(department)
  const sortState = capTeamSort[dept]
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.column = column
    sortState.direction = 'asc'
  }
}

export function capGetTeamSortIcon(column, department) {
  const dept = capTeamNormalizeDepartment(department)
  const sortState = capTeamSort[dept]
  if (sortState.column !== column) return '↕'
  return sortState.direction === 'asc' ? '↑' : '↓'
}

function capTeamCompareValues(left, right, isNumeric = false) {
  if (isNumeric) return (Number(left) || 0) - (Number(right) || 0)

  const leftValue = String(left || '').trim().toLowerCase()
  const rightValue = String(right || '').trim().toLowerCase()

  if (!leftValue && !rightValue) return 0
  if (!leftValue) return 1
  if (!rightValue) return -1

  return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' })
}

export function capRenderTeamTab(teamArray, holidaysArray, monthKey, department, canEditFlag) {
  const dept = capTeamNormalizeDepartment(department)
  const isPmContext = dept === 'PM'
  const teamTitle = isPmContext
    ? 'PM TEAM'
    : dept === 'LOG'
      ? 'LOGISTICS TECHNICIANS'
      : dept === 'UNIT6'
        ? 'TECHNICIAN TEAM'
        : 'ENGINEERING TEAM'
  const memberPlural = isPmContext
    ? 'managers'
    : dept === 'LOG'
      ? 'logistics technicians'
      : dept === 'UNIT6'
        ? 'technicians'
        : 'engineers'
  const addFirstLabel = isPmContext
    ? 'Manager'
    : dept === 'LOG'
      ? 'Logistics Technician'
      : dept === 'UNIT6'
        ? 'Technician'
        : 'Engineer'

  const weeksPerMonth = 4.33
  const capTotals = (teamArray || []).reduce((acc, member) => {
    const c = capGetHoursPerWeek(member.hoursPerWeek) * ((member.utilisation || 80) / 100) * weeksPerMonth
    acc.total += c
    if ((member.group || '') === 'NPI') acc.npi += c
    if ((member.group || '') === 'Production') acc.prod += c
    return acc
  }, { total: 0, npi: 0, prod: 0 })
  const totalCapacity = capTotals.total.toFixed(1)
  const npiCapacity = capTotals.npi.toFixed(1)
  const prodCapacity = capTotals.prod.toFixed(1)

  const today = new Date()
  const thisMonth = monthKey || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const holidays = holidaysArray || []
  const holidaysThisMonth = holidays.filter(h => h.date.substring(0, 7) === thisMonth)
  const uniqueHolidayKeysThisMonth = new Set(
    holidaysThisMonth
      .map(h => `${h.personId || h.person_id || ''}|${h.date}`)
      .filter(key => !key.startsWith('|'))
  )

  const sortState = capTeamSort[dept]
  const rowsData = (teamArray || []).map((member, idx) => {
    const hoursPerWeek = capGetHoursPerWeek(member.hoursPerWeek)
    const utilisation = Number(member.utilisation || 80)
    return {
      member,
      rowIndex: idx,
      hoursPerWeek,
      utilisation,
      effective: Number((hoursPerWeek * (utilisation / 100)).toFixed(1))
    }
  })

  if (sortState.column) {
    const direction = sortState.direction === 'asc' ? 1 : -1
    rowsData.sort((left, right) => {
      switch (sortState.column) {
        case 'name':
          return capTeamCompareValues(left.member.name, right.member.name) * direction
        case 'jobTitle':
          return capTeamCompareValues(left.member.jobTitle, right.member.jobTitle) * direction
        case 'group':
          return capTeamCompareValues(left.member.group, right.member.group) * direction
        case 'startDate':
          return capTeamCompareValues(left.member.startDate, right.member.startDate) * direction
        case 'endDate':
          return capTeamCompareValues(left.member.endDate, right.member.endDate) * direction
        case 'hoursPerWeek':
          return capTeamCompareValues(left.hoursPerWeek, right.hoursPerWeek, true) * direction
        case 'utilisation':
          return capTeamCompareValues(left.utilisation, right.utilisation, true) * direction
        case 'effective':
          return capTeamCompareValues(left.effective, right.effective, true) * direction
        default:
          return 0
      }
    })
  }

  const sortHeader = (label, key, width) =>
    `<th style="width:${width};cursor:pointer;" data-cap-action="cap-team-sort" data-sort-key="${key}" title="Sort by ${label.toLowerCase()}">${capGetTeamSortIcon(key, dept)} ${label}</th>`

  let rows = ''
  rowsData.forEach(({ member, rowIndex, hoursPerWeek, utilisation, effective }) => {
    const groupOpts = '<option value="">—</option><option value="NPI" ' + ((member.group || '') === 'NPI' ? 'selected' : '') + '>NPI</option><option value="Production" ' + ((member.group || '') === 'Production' ? 'selected' : '') + '>Production</option>'
    rows += `
      <tr data-member-idx="${rowIndex}">
        <td><input name="cap_team_${rowIndex}_name" value="${esc(member.name)}" data-cap-action="cap-team-upd" data-field="name"></td>
        <td><input name="cap_team_${rowIndex}_jobTitle" value="${esc(member.jobTitle || '')}" data-cap-action="cap-team-upd" data-field="jobTitle"></td>
        <td><select name="cap_team_${rowIndex}_group" data-cap-action="cap-team-upd" data-field="group">${groupOpts}</select></td>
        <td><input name="cap_team_${rowIndex}_startDate" type="date" value="${member.startDate || ''}" data-cap-action="cap-team-upd" data-field="startDate"></td>
        <td><input name="cap_team_${rowIndex}_endDate" type="date" value="${member.endDate || ''}" data-cap-action="cap-team-upd" data-field="endDate"></td>
        <td><input name="cap_team_${rowIndex}_hoursPerWeek" type="number" value="${hoursPerWeek}" min="1" max="80" step="0.5" data-cap-action="cap-team-upd" data-field="hoursPerWeek"></td>
        <td><input name="cap_team_${rowIndex}_utilisation" type="number" value="${utilisation}" min="0" max="100" step="5" data-cap-action="cap-team-upd" data-field="utilisation"></td>
        <td style="font-weight: bold;">${effective.toFixed(1)}</td>
        <td style="text-align: center;">${canEditFlag ? `<button class="me-del-btn" data-cap-action="cap-team-del">✕</button>` : ''}</td>
      </tr>`
  })

  const monthLabel = getMonthLabel(thisMonth)

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalCapacity}</div>
          <div class="me-kpi-label">Total Availability</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${npiCapacity}</div>
          <div class="me-kpi-label">NPI Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${prodCapacity}</div>
          <div class="me-kpi-label">Production Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--teal); cursor: pointer;" data-cap-action="cap-team-holidays">
          <div class="me-kpi-value">${uniqueHolidayKeysThisMonth.size}</div>
          <div class="me-kpi-label">Holidays This Month</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">${teamTitle}</span>
          <span style="font-size:12px;color:var(--muted)">${teamArray.length} ${memberPlural}</span>
        </div>
        <div class="me-card-body me-card-body-gutter">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                ${sortHeader('Name', 'name', '120px')}
                ${sortHeader('Job Title', 'jobTitle', '110px')}
                ${sortHeader('Group', 'group', '100px')}
                ${sortHeader('Start Date', 'startDate', '100px')}
                ${sortHeader('End Date', 'endDate', '100px')}
                ${sortHeader('Hours / Week', 'hoursPerWeek', '100px')}
                ${sortHeader('Utilisation %', 'utilisation', '100px')}
                ${sortHeader('Effective h/wk', 'effective', '110px')}
                <th style="width:36px"></th>
              </tr></thead>
              <tbody>
                ${rows || `<tr><td colspan="9"><div style="text-align:center;padding:40px">
                  <div style="color:var(--muted);margin-bottom:12px">No ${memberPlural} added yet</div>
                  ${canEditFlag ? `<button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add First ${addFirstLabel}</button>` : ''}
                </div></td></tr>`}
              </tbody>
            </table>
          </div>
          ${canEditFlag ? `<div class="me-add-row">
            <button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add ${addFirstLabel}</button>
          </div>` : ''}
        </div>
      </div>
    </div>`
}
