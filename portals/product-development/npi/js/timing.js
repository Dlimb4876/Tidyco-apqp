// ═══════════════════════════════════
// timing.js — Gantt chart and NPI timing plan
// Depends on: npi-constants.js, state.js, helpers.js, navigation.js, npi.js
// Constants: GANTT_WEEKS, GANTT_ROLES, GANTT_SECTIONS, PLAN_COLOR, ACT_COLOR from npi-constants.js
// All functions under npi.timing.*
// ═══════════════════════════════════

import { prog, appState } from '../../../../core/js/state.js'
import { save } from '../../../../core/js/db.js'
import { canEdit, esc, emptyState } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { render } from '../../../../utils/js/navigation.js'
import { npi } from './npi-shared.js'
import { npiData } from './npi-data.js'
import {
  GANTT_WEEKS,
  GANTT_ROLES,
  GANTT_SECTIONS,
  PLAN_COLOR,
  ACT_COLOR
} from './npi-constants.js'

// ── Timeline length — stored in localStorage, independent of project ──
npi.timing.getWeeks = function() {
  return parseInt(localStorage.getItem('ganttWeeks') || String(GANTT_WEEKS), 10)
}
npi.timing.setWeeks = function(val) {
  localStorage.setItem('ganttWeeks', String(val))
  render()
}

npi.timing.ganttNewRow = function(section) { return npiData.ganttNewRow(section) }

npi.timing.ganttWeekDate = function(startStr, wi) {
  if (!startStr) return null
  const d   = new Date(startStr)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 1 ? 0 : day === 0 ? 1 : 8 - day))
  d.setDate(d.getDate() + wi * 7)
  return d
}

npi.timing.fmtWeekDate = function(d) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function isMonthCollapsed(p, mi) { return (p.ganttCollapsed || []).includes(mi) }
function isSectionCollapsed(p, secId) { return (p.ganttSectionCollapsed || []).includes(secId) }

npi.timing.toggleMonth = function(mi) {
  const p = prog()
  if (!p.ganttCollapsed) p.ganttCollapsed = []
  const i = p.ganttCollapsed.indexOf(mi)
  if (i >= 0) p.ganttCollapsed.splice(i, 1); else p.ganttCollapsed.push(mi)
  save(); render()
}

npi.timing.toggleSection = function(secId) {
  const p = prog()
  if (!p.ganttSectionCollapsed) p.ganttSectionCollapsed = []
  const i = p.ganttSectionCollapsed.indexOf(secId)
  if (i >= 0) p.ganttSectionCollapsed.splice(i, 1); else p.ganttSectionCollapsed.push(secId)
  save(); render()
}

npi.timing.buildMonthGroups = function(startStr, weeks) {
  const groups = []
  let cur = { label: '', mo: 0, weeks: [] }
  for (let w = 0; w < weeks; w++) {
    const d     = npi.timing.ganttWeekDate(startStr, w)
    const label = d
      ? d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      : `M${Math.floor(w / 4) + 1}`
    if (label !== cur.label) {
      if (cur.weeks.length) groups.push({ ...cur })
      cur = { label, mo: groups.length, weeks: [w] }
    } else { cur.weeks.push(w) }
  }
  if (cur.weeks.length) groups.push({ ...cur })
  return groups
}

npi.timing.renderTimingPlan = function() {
  const p = prog()
  if (!p.gantt) p.gantt = []
  if (!p.ganttStart && p.date) p.ganttStart = p.date
  if (!p.ganttMilestones) p.ganttMilestones = []

  const weeks = npi.timing.getWeeks()

  // Migrate old format — expand arrays to current week count
  p.gantt.forEach(r => {
    if (r.weeks && !r.planned) { r.planned = r.weeks; r.actual = Array(weeks).fill(0); delete r.weeks }
    if (!r.planned || r.planned.length < weeks) {
      const old = r.planned || []
      r.planned = Array(weeks).fill(0).map((_, i) => old[i] || 0)
    }
    if (!r.actual || r.actual.length < weeks) {
      const old = r.actual || []
      r.actual = Array(weeks).fill(0).map((_, i) => old[i] || 0)
    }
  })

  const startDate = p.ganttStart || new Date().toISOString().slice(0, 10)
  const months    = npi.timing.buildMonthGroups(startDate, weeks)
  const today     = new Date()
  let todayCol    = -1
  for (let w = 0; w < weeks; w++) {
    const d = npi.timing.ganttWeekDate(startDate, w)
    if (d && d <= today && (w === weeks - 1 || npi.timing.ganttWeekDate(startDate, w + 1) > today)) { todayCol = w; break }
  }

  // ── Build header rows ────────────────────────────────────────
  let monthHeaders = '', weekHeaders = '', milestoneHeaders = ''

  months.forEach(mo => {
    const collapsed = isMonthCollapsed(p, mo.mo)
    if (collapsed) {
      monthHeaders      += `<th colspan="1" style="cursor:pointer;min-width:20px" onclick="npi.timing.toggleMonth(${mo.mo})" title="Expand ${mo.label}">▶</th>`
      weekHeaders       += `<th class="gantt-wk gantt-collapsed-wk" title="Expand ${mo.label}" onclick="npi.timing.toggleMonth(${mo.mo})" style="cursor:pointer">…</th>`
      milestoneHeaders  += `<td class="gantt-ms-cell gantt-collapsed-cell"></td>`
    } else {
      monthHeaders += `<th colspan="${mo.weeks.length}" onclick="npi.timing.toggleMonth(${mo.mo})" title="Collapse ${mo.label}" style="cursor:pointer">${mo.label}</th>`
      mo.weeks.forEach(w => {
        const isToday = w === todayCol
        const d   = npi.timing.ganttWeekDate(startDate, w)
        const lbl = d ? npi.timing.fmtWeekDate(d) : `W${w + 1}`
        weekHeaders += `<th class="gantt-wk${isToday ? ' gantt-today-hdr' : ''}" title="W${w + 1}${d ? ' · w/c ' + lbl : ''}">${lbl}</th>`
        const ms = p.ganttMilestones.find(m => m.week === w)
        if (ms) {
          milestoneHeaders += `<td class="gantt-ms-cell gantt-ms-set${isToday ? ' gantt-today-col' : ''}" title="${esc(ms.label)} — click to remove" onclick="npi.timing.ganttDelMilestone('${ms.id}')">◆</td>`
        } else if (canEdit()) {
          milestoneHeaders += `<td class="gantt-ms-cell${isToday ? ' gantt-today-col' : ''}" title="W${w + 1}: click to add milestone" onclick="npi.timing.ganttAddMilestone(${w})"></td>`
        } else {
          milestoneHeaders += `<td class="gantt-ms-cell${isToday ? ' gantt-today-col' : ''}"></td>`
        }
      })
    }
  })

  const visibleCols = months.reduce((n, mo) => n + (isMonthCollapsed(p, mo.mo) ? 1 : mo.weeks.length), 0)
  const ROLE_COL    = { ME: '#0066cc', PM: '#6d3fa0', Tec: '#0a7566', QA: '#b45309', Log: '#6b7a99' }
  const grouped     = {}
  GANTT_SECTIONS.forEach(s => { grouped[s.id] = p.gantt.filter(r => r.section === s.id) })

  let body = ''
  GANTT_SECTIONS.forEach(sec => {
    const rows         = grouped[sec.id] || []
    const secCollapsed = isSectionCollapsed(p, sec.id)
    const chevron      = secCollapsed ? '▶' : '▼'

    // ── Section header row ─────────────────────────────────────
    body += `<tr class="gantt-section-hdr" onclick="npi.timing.toggleSection('${sec.id}')">
      <td colspan="${visibleCols + 5}" style="border-left:4px solid ${sec.color};background:${sec.color}18;padding:5px 10px;cursor:pointer">
        <span style="font-size:11px;font-weight:700;color:${sec.color};letter-spacing:.4px">${chevron} ${sec.label}</span>
        <span style="font-size:10px;color:${sec.color}99;margin-left:8px">${rows.length} task${rows.length !== 1 ? 's' : ''}</span>
        ${canEdit() && !secCollapsed ? `<button class="add-row" onclick="event.stopPropagation();npi.timing.ganttAddRow('${sec.id}')" style="float:right;font-size:10px;padding:2px 10px;margin:0 2px">＋ Add task</button>` : ''}
      </td>
    </tr>`

    if (secCollapsed) return

    rows.forEach((row, ri) => {
      let planCells = '', actCells = ''
      months.forEach(mo => {
        const collapsed = isMonthCollapsed(p, mo.mo)
        if (collapsed) {
          const anyPlan = mo.weeks.some(w => row.planned[w])
          const anyAct  = mo.weeks.some(w => row.actual[w])
          planCells += `<td class="gantt-cell gantt-collapsed-cell" style="${anyPlan ? 'background:' + PLAN_COLOR + ';opacity:.4' : ''}" title="Expand to edit"></td>`
          actCells  += `<td class="gantt-cell gantt-collapsed-cell" style="${anyAct  ? 'background:' + ACT_COLOR  + ';opacity:.4' : ''}" title="Expand to edit"></td>`
        } else {
          mo.weeks.forEach(w => {
            const isToday = w === todayCol
            const pv = row.planned[w] || 0
            const av = row.actual[w]  || 0
            planCells += `<td class="gantt-cell${pv ? ' gantt-filled' : ''}${isToday ? ' gantt-today-col' : ''}" onclick="npi.timing.ganttTogglePlan('${row.id}',${w})" style="${pv ? 'background:' + PLAN_COLOR + ';opacity:.85' : ''}" title="W${w + 1} Planned${pv ? ' ✓' : ''}"></td>`
            actCells  += `<td class="gantt-cell gantt-actual-cell${av ? ' gantt-filled' : ''}${isToday ? ' gantt-today-col' : ''}" onclick="npi.timing.ganttToggleAct('${row.id}',${w})" style="${av ? 'background:' + ACT_COLOR + ';opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0,rgba(255,255,255,.18) 2px,transparent 2px,transparent 6px)' : ''}" title="W${w + 1} Actual${av ? ' ✓' : ''}"></td>`
          })
        }
      })
      const rolecol     = ROLE_COL[row.role] || '#6b7a99'
      const canMoveUp   = ri > 0
      const canMoveDown = ri < rows.length - 1
      body += `<tr class="gantt-row gantt-plan-row">
        <td class="gantt-task-cell" rowspan="2">
          <input class="cell-edit" name="timing_${row.id}_task" value="${esc(row.task)}" onchange="npi.timing.ganttUpdTask('${row.id}',this.value)" placeholder="Task name" style="width:100%;font-size:12px">
          <select class="cell-edit" name="timing_${row.id}_section" onchange="npi.timing.ganttUpdSec('${row.id}',this.value)" style="width:100%;font-size:10px;margin-top:2px">${GANTT_SECTIONS.map(s => `<option value="${s.id}"${row.section === s.id ? ' selected' : ''}>${s.label}</option>`).join('')}</select>
        </td>
        <td class="gantt-role-cell" rowspan="2">
          <select class="cell-edit" name="timing_${row.id}_role" onchange="npi.timing.ganttUpdRole('${row.id}',this.value)" style="width:100%;font-size:11px;font-weight:600;color:${rolecol};border-color:${rolecol}33">${GANTT_ROLES.map(r => `<option value="${r}"${row.role === r ? ' selected' : ''}>${r}</option>`).join('')}</select>
        </td>
        <td class="gantt-rowlabel">Plan</td>
        ${planCells}
        <td class="gantt-notes-cell" rowspan="2"><input class="cell-edit" name="timing_${row.id}_notes" value="${esc(row.notes)}" onchange="npi.timing.ganttUpdNotes('${row.id}',this.value)" placeholder="Notes" style="width:100%;font-size:11px"></td>
        <td class="gantt-actions-cell" rowspan="2">
          ${canEdit() ? `<div class="gantt-row-actions">
            <button class="del-btn" onclick="npi.timing.ganttMoveRow('${row.id}',-1)" title="Move up" ${canMoveUp ? '' : 'disabled'}>↑</button>
            <button class="del-btn" onclick="npi.timing.ganttMoveRow('${row.id}',1)" title="Move down" ${canMoveDown ? '' : 'disabled'}>↓</button>
            <button class="del-btn" onclick="npi.timing.ganttDelRow('${row.id}')" title="Delete">×</button>
          </div>` : ''}
        </td>
      </tr>
      <tr class="gantt-row gantt-act-row">
        <td class="gantt-rowlabel gantt-rowlabel-act">Actual</td>
        ${actCells}
      </tr>`
    })
  })

  const totalRows = p.gantt.length

  // colgroup: task(200) + role(64) + label(36) + week cols + notes(128) + actions(44)
  let colgroup = `<col style="width:200px"><col style="width:64px"><col style="width:36px">`
  months.forEach(mo => {
    if (isMonthCollapsed(p, mo.mo)) { colgroup += `<col style="width:18px">` }
    else { mo.weeks.forEach(() => { colgroup += `<col style="width:22px">` }) }
  })
  colgroup += `<col style="width:128px"><col style="width:44px">`

  const weekOpts = [24, 36, 48, 60, 72].map(n =>
    `<option value="${n}"${n === weeks ? ' selected' : ''}>${n}w (${Math.round(n / 4.33)}mo)</option>`
  ).join('')

  // ── Reusable chart controls strip (shared between normal and fullscreen render) ──
  const ganttControls = `
  <div style="display:flex;gap:16px;padding:8px 16px;flex-wrap:wrap;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);flex-shrink:0">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${PLAN_COLOR};opacity:.85"></span>Planned</span>
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${ACT_COLOR};opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 6px)"></span>Actual</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--mid)"><span style="color:#7c3aed;font-size:10px">◆</span>Milestone</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <label style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap">Start:</label>
      <input type="date" class="cell-edit" name="timing_plan_start" value="${startDate}" onchange="npi.timing.ganttSetStart(this.value)" style="font-size:12px;padding:3px 7px;border-radius:5px;border:1.5px solid var(--line2)">
      <label style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap">Timeline:</label>
      <select class="cell-edit" onchange="npi.timing.setWeeks(+this.value)" style="font-size:11px;padding:3px 6px;border-radius:5px;border:1.5px solid var(--line2)">${weekOpts}</select>
      ${todayCol >= 0 ? `<span style="font-size:11px;color:var(--blue);font-family:'IBM Plex Mono',monospace">▼ W${todayCol + 1} today</span>` : ''}
    </div>
  </div>`

  const ganttTable = `
  <div style="overflow-x:auto;overflow-y:auto;flex:1" id="gantt-scroll-container">
    <table class="tbl tbl--compact gantt-tbl" style="table-layout:fixed;width:max-content;min-width:100%;border-collapse:collapse">
      <colgroup>${colgroup}</colgroup>
      <thead>
        <tr class="gantt-month-row">
          <th colspan="3" class="gantt-th-left"></th>
          ${monthHeaders}
          <th class="gantt-th-notes"></th>
          <th></th>
        </tr>
        <tr class="gantt-week-row">
          <th class="gantt-th-left" colspan="3"></th>
          ${weekHeaders}
          <th class="gantt-th-notes"></th>
          <th></th>
        </tr>
        <tr class="gantt-milestone-row">
          <th colspan="3" style="text-align:right;padding:0 6px;font-size:9px;font-weight:700;color:#7c3aed;white-space:nowrap;letter-spacing:.3px">◆ Milestones</th>
          ${milestoneHeaders}
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>`

  // Fullscreen overlay: whole-screen mode for big-screen Gantt editing
  if (appState.ganttExpanded) {
    return `<div class="portal-fullscreen-overlay">
      <div class="portal-fullscreen-bar">
        <span><span class="portal-fullscreen-title">NPI Timing Plan</span><span class="portal-fullscreen-project">${esc(p.name || '')}</span></span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="npi.timing.ganttExportPdf()" title="Export as PDF">⬇ PDF</button>
          ${canEdit() ? `<button class="btn btn-ghost btn-sm" onclick="npi.timing.ganttClear()">Clear All</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="gantt-toggle-expand">✕ Exit Fullscreen</button>
        </div>
      </div>
      ${ganttControls}
      <div class="portal-fullscreen-body" style="padding:0">
        ${ganttTable}
        ${totalRows === 0 ? `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No tasks yet — click a section header to expand it, then <strong>＋ Add task</strong></div>` : ''}
      </div>
    </div>`
  }

  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">NPI Timing Plan</div>
    <div class="sec-desc">Planned (green) and Actual (orange). Click section or month headers to collapse/expand. Click ◆ row to set milestones.</div></div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button>
      <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-timing')" title="User Guide">❓ Guide</button>
      <button class="btn btn-ghost btn-sm" onclick="npi.timing.ganttExportPdf()" title="Export as PDF">⬇ PDF</button>
      ${canEdit() ? `<button class="btn btn-ghost btn-sm" onclick="npi.timing.ganttClear()">Clear All</button>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="gantt-toggle-expand" title="Fullscreen mode">⛶ Expand</button>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${PLAN_COLOR};opacity:.85"></span>Planned</span>
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${ACT_COLOR};opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 6px)"></span>Actual</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--mid)"><span style="color:#7c3aed;font-size:10px">◆</span>Milestone — click to set/remove</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <label style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap">Start:</label>
      <input type="date" class="cell-edit" name="timing_plan_start" value="${startDate}" onchange="npi.timing.ganttSetStart(this.value)" style="font-size:12px;padding:3px 7px;border-radius:5px;border:1.5px solid var(--line2)">
      <label style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap">Timeline:</label>
      <select class="cell-edit" onchange="npi.timing.setWeeks(+this.value)" style="font-size:11px;padding:3px 6px;border-radius:5px;border:1.5px solid var(--line2)">${weekOpts}</select>
      ${todayCol >= 0 ? `<span style="font-size:11px;color:var(--blue);font-family:'IBM Plex Mono',monospace">▼ W${todayCol + 1} today</span>` : ''}
    </div>
  </div>
  <div style="overflow-x:auto;border:1px solid var(--line);border-radius:8px" id="gantt-scroll-container">
    <table class="tbl tbl--compact gantt-tbl" style="table-layout:fixed;width:max-content;min-width:100%;border-collapse:collapse">
      <colgroup>${colgroup}</colgroup>
      <thead>
        <tr class="gantt-month-row">
          <th colspan="3" class="gantt-th-left"></th>
          ${monthHeaders}
          <th class="gantt-th-notes"></th>
          <th></th>
        </tr>
        <tr class="gantt-week-row">
          <th class="gantt-th-left" colspan="3"></th>
          ${weekHeaders}
          <th class="gantt-th-notes"></th>
          <th></th>
        </tr>
        <tr class="gantt-milestone-row">
          <th colspan="3" style="text-align:right;padding:0 6px;font-size:9px;font-weight:700;color:#7c3aed;white-space:nowrap;letter-spacing:.3px">◆ Milestones</th>
          ${milestoneHeaders}
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${totalRows === 0 ? `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No tasks yet — click a section header to expand it, then <strong>＋ Add task</strong></div>` : ''}`
}

// Toggle fullscreen for focused Gantt editing on large screens
npi.timing.toggleExpand = function() {
  appState.ganttExpanded = !appState.ganttExpanded
  render()
}

npi.timing.ganttTogglePlan= function(id, wi)    { npiData.timing.togglePlan(id, wi); render() }
npi.timing.ganttToggleAct     = function(id, wi)    { npiData.timing.toggleAct(id, wi); render() }
npi.timing.ganttAddRow        = function(section)   { npiData.timing.addRow(section); render() }
npi.timing.ganttUpdTask       = function(id, val)   { npiData.timing.updTask(id, val) }
npi.timing.ganttUpdSec        = function(id, val)   { npiData.timing.updSec(id, val); render() }
npi.timing.ganttUpdRole       = function(id, val)   { npiData.timing.updRole(id, val); render() }
npi.timing.ganttUpdNotes      = function(id, val)   { npiData.timing.updNotes(id, val) }
npi.timing.ganttDelRow        = function(id)        { npiData.timing.delRow(id); render() }
npi.timing.ganttSetStart      = function(val)       { npiData.timing.setStart(val); render() }
npi.timing.ganttMoveRow       = function(id, dir)   { npiData.timing.moveRow(id, dir); render() }
npi.timing.ganttAddMilestone  = function(week)      {
  const label = prompt('Milestone label (e.g. "G1 Gate Review"):')
  if (!label || !label.trim()) return
  npiData.timing.addMilestone(week, label.trim())
  render()
}
npi.timing.ganttDelMilestone  = function(id)        { npiData.timing.delMilestone(id); render() }
npi.timing.ganttClear         = function() {
  if (!confirm('Clear all timing plan tasks?')) return
  npiData.timing.clear()
  render()
}
npi.timing.ganttExportPdf = async function() {
  const p = prog()
  if (!p) return

  const weeks     = npi.timing.getWeeks()
  const startDate = p.ganttStart || new Date().toISOString().slice(0, 10)
  const months    = npi.timing.buildMonthGroups(startDate, weeks)
  const gantt     = p.gantt || []
  const milestones = p.ganttMilestones || []

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  // Today column
  const today = new Date()
  let todayCol = -1
  for (let w = 0; w < weeks; w++) {
    const d = npi.timing.ganttWeekDate(startDate, w)
    if (d && d <= today && (w === weeks - 1 || npi.timing.ganttWeekDate(startDate, w + 1) > today)) {
      todayCol = w; break
    }
  }

  // Embed logo as base64 so the standalone window can display it
  let logoSrc = ''
  try {
    const resp = await fetch('./Tidyco logo-blue.png')
    const blob = await resp.blob()
    logoSrc = await new Promise(res => {
      const r = new FileReader()
      r.onloadend = () => res(r.result)
      r.readAsDataURL(blob)
    })
  } catch (_) { /* proceed without logo */ }

  // Summary stats
  const totalTasks      = gantt.length
  const activeSections  = new Set(gantt.map(r => r.section)).size
  let plannedCells = 0, actualCells = 0
  gantt.forEach(r => {
    ;(r.planned || []).forEach(v => { if (v) plannedCells++ })
    ;(r.actual  || []).forEach(v => { if (v) actualCells++ })
  })
  const progressPct = plannedCells > 0 ? Math.round((actualCells / plannedCells) * 100) : 0
  const progressColor = progressPct >= 80 ? '#1f8f65' : progressPct >= 50 ? '#b67700' : '#b2352f'

  // Table headers
  let monthHeaders = '', weekHeaders = '', msHeaders = ''
  months.forEach(mo => {
    monthHeaders += `<th colspan="${mo.weeks.length}" style="background:#e8ecf0;font-size:10px;font-weight:700;color:#1a2634;text-align:center;padding:3px 0;border:1px solid #d0d7e0;">${mo.label}</th>`
    mo.weeks.forEach(w => {
      const isToday = w === todayCol
      const d   = npi.timing.ganttWeekDate(startDate, w)
      const lbl = d ? npi.timing.fmtWeekDate(d) : `W${w + 1}`
      weekHeaders += `<th style="font-size:8px;color:${isToday ? '#0066cc' : '#6b7a99'};text-align:center;padding:2px 0;border:1px solid #d0d7e0;white-space:nowrap;${isToday ? 'background:#dbeafe;' : ''}">${lbl}</th>`
      const ms = milestones.find(m => m.week === w)
      msHeaders  += `<td style="text-align:center;padding:0;border:1px solid #d0d7e0;font-size:9px;${isToday ? 'background:#dbeafe;' : ''}color:${ms ? '#7c3aed' : 'transparent'};">◆</td>`
    })
  })

  // Milestone label list
  const msLabelsList = milestones.map(ms => {
    const d   = npi.timing.ganttWeekDate(startDate, ms.week)
    const wkL = d ? npi.timing.fmtWeekDate(d) : `W${ms.week + 1}`
    return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;margin-right:14px;"><span style="color:#7c3aed;">◆</span>${ms.label} <span style="color:#9aabb8;">(${wkL})</span></span>`
  }).join('')

  // Gantt body
  const ROLE_COL = { ME: '#0066cc', PM: '#6d3fa0', Tec: '#0a7566', QA: '#b45309', Log: '#6b7a99' }
  let body = ''
  const colWeekCols = months.map(mo => mo.weeks.map(() => '<col style="width:14px">').join('')).join('')

  GANTT_SECTIONS.forEach(sec => {
    const rows = gantt.filter(r => r.section === sec.id)
    if (!rows.length) return

    body += `<tr>
      <td colspan="${weeks + 4}" style="background:${sec.color}18;border-left:4px solid ${sec.color};padding:4px 8px;font-size:10px;font-weight:700;color:${sec.color};letter-spacing:.3px;border-bottom:1px solid ${sec.color}33;">
        ${sec.label} <span style="font-weight:400;color:${sec.color}99;margin-left:6px;">(${rows.length} task${rows.length !== 1 ? 's' : ''})</span>
      </td>
    </tr>`

    rows.forEach(row => {
      let planCells = '', actCells = ''
      months.forEach(mo => {
        mo.weeks.forEach(w => {
          const isToday = w === todayCol
          const pv = (row.planned || [])[w] || 0
          const av = (row.actual  || [])[w] || 0
          const todayBorder = isToday ? 'border-left:1px solid #93c5fd;' : ''
          planCells += `<td style="border:1px solid #e8ecf0;${todayBorder}${pv ? 'background:' + PLAN_COLOR + ';opacity:.85;' : ''}padding:0;"></td>`
          actCells  += `<td style="border:1px solid #e8ecf0;${todayBorder}${av ? 'background:' + ACT_COLOR + ';opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 6px);' : ''}padding:0;"></td>`
        })
      })
      const roleColor = ROLE_COL[row.role] || '#6b7a99'
      body += `<tr style="height:14px;">
        <td rowspan="2" style="font-size:10px;color:#1a2634;padding:2px 6px;border:1px solid #e8ecf0;max-width:160px;overflow:hidden;word-break:break-word;vertical-align:middle;">${row.task || ''}</td>
        <td rowspan="2" style="font-size:9px;font-weight:700;color:${roleColor};text-align:center;padding:2px 3px;border:1px solid #e8ecf0;white-space:nowrap;vertical-align:middle;">${row.role || ''}</td>
        <td style="font-size:8px;color:#888;padding:1px 4px;border:1px solid #e8ecf0;white-space:nowrap;">Plan</td>
        ${planCells}
        <td rowspan="2" style="font-size:9px;color:#6b7a99;padding:2px 5px;border:1px solid #e8ecf0;max-width:90px;overflow:hidden;vertical-align:middle;">${row.notes || ''}</td>
      </tr>
      <tr style="height:14px;">
        <td style="font-size:8px;color:#b67700;padding:1px 4px;border:1px solid #e8ecf0;white-space:nowrap;">Actual</td>
        ${actCells}
      </tr>`
    })
  })

  const logoTag = logoSrc
    ? `<img src="${logoSrc}" alt="Tidyco" style="height:44px;width:auto;object-fit:contain;flex-shrink:0;filter:brightness(0) invert(1);opacity:.8;">`
    : `<span style="font-size:18px;font-weight:700;color:rgba(246,251,255,.9);flex-shrink:0;letter-spacing:-.5px;">Tidyco</span>`

  const metaFields = [
    p.customer   ? `<span><span style="color:rgba(246,251,255,.45);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-right:4px;">Customer</span>${p.customer}</span>` : '',
    p.partNumber ? `<span><span style="color:rgba(246,251,255,.45);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-right:4px;">Part No.</span>${p.partNumber}</span>` : '',
    p.family     ? `<span><span style="color:rgba(246,251,255,.45);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-right:4px;">Family</span>${p.family}</span>` : ''
  ].filter(Boolean).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NPI Timing Plan — ${p.name || 'Project'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f4f7fb; color: #1a2634; }
  .page { max-width: 1240px; margin: 0 auto; padding: 28px 20px; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #0f2f4d; color: #fff; border: none;
    border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
  .print-btn:hover { background: #1a4a6b; }
  @page { size: A3 landscape; margin: 10mm; }
  @media print {
    .print-btn { display: none; }
    body { background: #fff; }
    .page { padding: 0; max-width: 100%; }
    .gantt-wrap { overflow: visible; }
  }
  .card { background: #fff; border: 1px solid #dde3ea; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .stat-box { background: #fff; border: 1px solid #dde3ea; border-radius: 10px; padding: 12px 14px; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 700; color: #1a2634; line-height: 1.1; }
  .stat-lbl { font-size: 10px; color: #6b7b8d; margin-top: 4px; text-transform: uppercase; letter-spacing: .06em; }
  .gantt-wrap { overflow-x: auto; border: 1px solid #dde3ea; border-radius: 10px; background: #fff; }
  table { border-collapse: collapse; table-layout: fixed; width: max-content; min-width: 100%; }
  th { border: 1px solid #d0d7e0; }
  td { height: 14px; }
  .legend { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: #6b7a99; }
  .swatch { display: inline-block; width: 20px; height: 9px; border-radius: 2px; }
</style>
</head>
<body>
<button class="print-btn" onclick="globalThis.print()">Print / Save PDF</button>
<div class="page">

  <!-- Header -->
  <div class="card" style="background:linear-gradient(135deg,#10293e 0%,#0f4c70 55%,#0a7566 100%);border:none;margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:rgba(246,251,255,.55);margin-bottom:4px;">NPI Timing Plan</div>
        <div style="font-size:22px;font-weight:700;color:#f7fbff;margin-bottom:8px;">${p.name || 'Untitled Project'}</div>
        ${metaFields ? `<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:rgba(246,251,255,.8);margin-bottom:8px;">${metaFields}</div>` : ''}
        <div style="font-size:11px;color:rgba(246,251,255,.45);">Generated ${dateStr} at ${timeStr}</div>
      </div>
      ${logoTag}
    </div>
  </div>

  <!-- Summary stats -->
  <div class="stats-grid">
    <div class="stat-box"><div class="stat-val">${totalTasks}</div><div class="stat-lbl">Tasks</div></div>
    <div class="stat-box"><div class="stat-val">${activeSections}</div><div class="stat-lbl">Active Phases</div></div>
    <div class="stat-box"><div class="stat-val">${milestones.length}</div><div class="stat-lbl">Milestones</div></div>
    <div class="stat-box"><div class="stat-val" style="color:${progressColor};">${progressPct}%</div><div class="stat-lbl">Progress</div></div>
  </div>

  <!-- Legend + milestone labels -->
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
    <div class="legend">
      <span class="legend-item"><span class="swatch" style="background:${PLAN_COLOR};opacity:.85;"></span>Planned</span>
      <span class="legend-item"><span class="swatch" style="background:${ACT_COLOR};opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 6px);"></span>Actual</span>
      <span class="legend-item"><span style="color:#7c3aed;font-size:12px;">◆</span>Milestone</span>
      ${todayCol >= 0 ? `<span class="legend-item"><span style="display:inline-block;width:2px;height:12px;background:#0066cc;border-radius:1px;"></span>Today (W${todayCol + 1})</span>` : ''}
    </div>
    ${milestones.length > 0 ? `<div>${msLabelsList}</div>` : ''}
  </div>

  <!-- Gantt table -->
  <div class="gantt-wrap">
    <table>
      <colgroup>
        <col style="width:160px"><col style="width:46px"><col style="width:34px">
        ${colWeekCols}
        <col style="width:90px">
      </colgroup>
      <thead>
        <tr>
          <th colspan="3" style="padding:0;border:1px solid #d0d7e0;"></th>
          ${monthHeaders}
          <th style="background:#e8ecf0;font-size:10px;font-weight:700;color:#1a2634;padding:3px 5px;border:1px solid #d0d7e0;">Notes</th>
        </tr>
        <tr>
          <th style="font-size:10px;font-weight:700;color:#1a2634;padding:3px 6px;text-align:left;border:1px solid #d0d7e0;">Task</th>
          <th style="font-size:10px;font-weight:700;color:#1a2634;padding:3px 4px;border:1px solid #d0d7e0;">Role</th>
          <th style="border:1px solid #d0d7e0;"></th>
          ${weekHeaders}
          <th style="border:1px solid #d0d7e0;"></th>
        </tr>
        <tr>
          <th colspan="3" style="font-size:9px;font-weight:700;color:#7c3aed;text-align:right;padding:0 5px;border:1px solid #d0d7e0;">◆ Milestones</th>
          ${msHeaders}
          <th style="border:1px solid #d0d7e0;"></th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:10px;color:#9aabb8;margin-top:10px;">
    Tidyco APQP · NPI Timing Plan · ${p.name || ''} · ${dateStr}
  </div>

</div>
</body>
</html>`

  const win = globalThis.open('', '_blank', 'width=1240,height=820,scrollbars=yes')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this page and try again.')
    return
  }
  win.document.write(html)
  win.document.close()
}

export const npiTiming = npi.timing
export const renderTimingPlan = npi.timing.renderTimingPlan
