// ═══════════════════════════════════
// timing.js — Gantt chart and NPI timing plan
// Depends on: npi-constants.js, state.js, helpers.js, navigation.js, npi.js
// Constants: GANTT_WEEKS, GANTT_ROLES, GANTT_SECTIONS, PLAN_COLOR, ACT_COLOR from npi-constants.js
// All functions under npi.timing.*
// ═══════════════════════════════════

npi.timing.ganttNewRow = function(section) {
  return {
    id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    task: '', section: section || 's1', role: 'ME',
    planned: Array(GANTT_WEEKS).fill(0),
    actual:  Array(GANTT_WEEKS).fill(0),
    notes: '', collapsed: false
  }
}

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

npi.timing.toggleMonth = function(mi) {
  const p = prog()
  if (!p.ganttCollapsed) p.ganttCollapsed = []
  const i = p.ganttCollapsed.indexOf(mi)
  if (i >= 0) p.ganttCollapsed.splice(i, 1); else p.ganttCollapsed.push(mi)
  save(); render()
}

npi.timing.buildMonthGroups = function(startStr) {
  const groups = []
  let cur = { label: '', mo: 0, weeks: [] }
  for (let w = 0; w < GANTT_WEEKS; w++) {
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

  // Migrate old format
  p.gantt.forEach(r => {
    if (r.weeks && !r.planned) { r.planned = r.weeks; r.actual = Array(GANTT_WEEKS).fill(0); delete r.weeks }
    if (!r.planned || r.planned.length < GANTT_WEEKS) {
      const old = r.planned || []
      r.planned = Array(GANTT_WEEKS).fill(0).map((_, i) => old[i] || 0)
    }
    if (!r.actual || r.actual.length < GANTT_WEEKS) {
      const old = r.actual || []
      r.actual = Array(GANTT_WEEKS).fill(0).map((_, i) => old[i] || 0)
    }
  })

  const startDate = p.ganttStart || new Date().toISOString().slice(0, 10)
  const months    = npi.timing.buildMonthGroups(startDate)
  const today     = new Date()
  let todayCol    = -1
  for (let w = 0; w < GANTT_WEEKS; w++) {
    const d = npi.timing.ganttWeekDate(startDate, w)
    if (d && d <= today && (w === GANTT_WEEKS - 1 || npi.timing.ganttWeekDate(startDate, w + 1) > today)) { todayCol = w; break }
  }

  // ── Build header rows ────────────────────────────────────────
  let monthHeaders = '', weekHeaders = ''

  months.forEach(mo => {
    const collapsed = isMonthCollapsed(p, mo.mo)
    if (collapsed) {
      monthHeaders += `<th colspan="1" style="cursor:pointer;min-width:20px" onclick="npi.timing.toggleMonth(${mo.mo})" title="Expand ${mo.label}">▶</th>`
      weekHeaders  += `<th class="gantt-wk gantt-collapsed-wk" title="Expand ${mo.label}" onclick="npi.timing.toggleMonth(${mo.mo})" style="cursor:pointer">…</th>`
    } else {
      monthHeaders += `<th colspan="${mo.weeks.length}" onclick="npi.timing.toggleMonth(${mo.mo})" title="Collapse ${mo.label}" style="cursor:pointer">${mo.label}</th>`
      mo.weeks.forEach(w => {
        const isToday = w === todayCol
        const d   = npi.timing.ganttWeekDate(startDate, w)
        const lbl = d ? npi.timing.fmtWeekDate(d) : `W${w + 1}`
        weekHeaders += `<th class="gantt-wk${isToday ? ' gantt-today-hdr' : ''}" title="W${w + 1}${d ? ' · w/c ' + lbl : ''}">${lbl}</th>`
      })
    }
  })

  const visibleCols = months.reduce((n, mo) => n + (isMonthCollapsed(p, mo.mo) ? 1 : mo.weeks.length), 0)
  const ROLE_COL    = { ME: '#0066cc', PM: '#6d3fa0', Tec: '#0a7566', QA: '#b45309', Log: '#6b7a99' }
  const grouped     = {}
  GANTT_SECTIONS.forEach(s => { grouped[s.id] = p.gantt.filter(r => r.section === s.id) })

  let body = ''
  GANTT_SECTIONS.forEach(sec => {
    const rows = grouped[sec.id] || []
    if (rows.length === 0 && p.gantt.length > 0) return
    rows.forEach(row => {
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
      const rolecol = ROLE_COL[row.role] || '#6b7a99'
      body += `<tr class="gantt-row gantt-plan-row">
        <td class="gantt-task-cell" rowspan="2">
          <input class="cell-edit" value="${esc(row.task)}" onchange="npi.timing.ganttUpdTask('${row.id}',this.value)" placeholder="Task name" style="width:100%;font-size:12px">
          <select class="cell-edit" onchange="npi.timing.ganttUpdSec('${row.id}',this.value)" style="width:100%;font-size:10px;margin-top:2px">${GANTT_SECTIONS.map(s => `<option value="${s.id}"${row.section === s.id ? ' selected' : ''}>${s.label}</option>`).join('')}</select>
        </td>
        <td class="gantt-role-cell" rowspan="2">
          <select class="cell-edit" onchange="npi.timing.ganttUpdRole('${row.id}',this.value)" style="width:100%;font-size:11px;font-weight:600;color:${rolecol};border-color:${rolecol}33">${GANTT_ROLES.map(r => `<option value="${r}"${row.role === r ? ' selected' : ''}>${r}</option>`).join('')}</select>
        </td>
        <td class="gantt-rowlabel">Plan</td>
        ${planCells}
        <td class="gantt-notes-cell" rowspan="2"><input class="cell-edit" value="${esc(row.notes)}" onchange="npi.timing.ganttUpdNotes('${row.id}',this.value)" placeholder="Notes" style="width:100%;font-size:11px"></td>
        <td style="text-align:center" rowspan="2"><button class="del-btn" onclick="npi.timing.ganttDelRow('${row.id}')">×</button></td>
      </tr>
      <tr class="gantt-row gantt-act-row">
        <td class="gantt-rowlabel gantt-rowlabel-act">Actual</td>
        ${actCells}
      </tr>`
    })
    body += `<tr class="gantt-add-row">
      <td colspan="${visibleCols + 5}" style="padding:2px 8px">
        <button class="add-row" style="font-size:10px;padding:2px 10px" onclick="npi.timing.ganttAddRow('${sec.id}')">＋ Add ${sec.label} task</button>
      </td>
    </tr>`
  })

  const totalRows = p.gantt.length

  // colgroup: task(220) + role(70) + plan/actual label(42) + week cols + notes(140) + del(28)
  let colgroup = `<col style="width:220px"><col style="width:70px"><col style="width:42px">`
  months.forEach(mo => {
    if (isMonthCollapsed(p, mo.mo)) { colgroup += `<col style="width:20px">` }
    else { mo.weeks.forEach(() => { colgroup += `<col style="width:26px">` }) }
  })
  colgroup += `<col style="width:140px"><col style="width:28px">`

  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">NPI Timing Plan</div>
    <div class="sec-desc">Planned (green) and Actual (orange). Click month headers to collapse. Click cells to toggle.</div></div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="goHome()">← Dashboard</button>
      <button class="btn btn-ghost btn-sm" onclick="npi.timing.ganttClear()">Clear All</button>
      <button class="btn btn-primary btn-sm" onclick="npi.timing.ganttAddRow('s1')">＋ Add Task</button>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${PLAN_COLOR};opacity:.85"></span>Planned</span>
      <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mid)"><span style="display:inline-block;width:22px;height:10px;border-radius:2px;background:${ACT_COLOR};opacity:.85;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 6px)"></span>Actual (hatched)</span>
      <span style="font-size:11px;color:var(--muted)">· Click month header to collapse</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <label style="font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap">Plan start:</label>
      <input type="date" class="cell-edit" value="${startDate}" onchange="npi.timing.ganttSetStart(this.value)" style="font-size:12px;padding:3px 7px;border-radius:5px;border:1.5px solid var(--line2)">
      ${todayCol >= 0 ? `<span style="font-size:11px;color:var(--blue);font-family:'IBM Plex Mono',monospace">▼ Today = W${todayCol + 1}</span>` : ''}
    </div>
  </div>
  <div style="overflow-x:auto;border:1px solid var(--line);border-radius:8px">
    <table class="tbl gantt-tbl" style="table-layout:fixed;width:max-content;min-width:100%;border-collapse:collapse">
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
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${totalRows === 0 ? `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No tasks yet — click <strong>＋ Add Task</strong> to start</div>` : ''}`
}

npi.timing.ganttTogglePlan = function(id, wi) { const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return; if (!row.planned || row.planned.length < GANTT_WEEKS) row.planned = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.planned || [])[i] || 0); row.planned[wi] = row.planned[wi] ? 0 : 1; save(); render() }
npi.timing.ganttToggleAct  = function(id, wi) { const p = prog(); const row = p.gantt.find(r => r.id === id); if (!row) return; if (!row.actual  || row.actual.length  < GANTT_WEEKS) row.actual  = Array(GANTT_WEEKS).fill(0).map((_, i) => (row.actual  || [])[i] || 0); row.actual[wi]  = row.actual[wi]  ? 0 : 1; save(); render() }
npi.timing.ganttAddRow     = function(section) { const p = prog(); if (!p.gantt) p.gantt = []; p.gantt.push(npi.timing.ganttNewRow(section)); save(); render() }
npi.timing.ganttUpdTask    = function(id, val) { const p = prog(); const r = p.gantt.find(x => x.id === id); if (r) { r.task    = val; save() } }
npi.timing.ganttUpdSec     = function(id, val) { const p = prog(); const r = p.gantt.find(x => x.id === id); if (r) { r.section = val; save(); render() } }
npi.timing.ganttUpdRole    = function(id, val) { const p = prog(); const r = p.gantt.find(x => x.id === id); if (r) { r.role    = val; save(); render() } }
npi.timing.ganttUpdNotes   = function(id, val) { const p = prog(); const r = p.gantt.find(x => x.id === id); if (r) { r.notes   = val; save() } }
npi.timing.ganttDelRow     = function(id)      { const p = prog(); p.gantt = p.gantt.filter(r => r.id !== id); save(); render() }
npi.timing.ganttSetStart   = function(val)     { const p = prog(); p.ganttStart = val; save(); render() }
npi.timing.ganttClear      = function()        { if (!confirm('Clear all timing plan tasks?')) return; prog().gantt = []; save(); render() }
