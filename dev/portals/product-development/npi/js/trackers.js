// ═══════════════════════════════════
// trackers.js — Action Tracker and Risk Register
// Depends on: state.js, helpers.js, navigation.js, npi.js
// All functions under npi.tracker.*
// ═══════════════════════════════════

import { appState, db, prog } from '../../../../core/js/state.js'
import { esc, canEdit, emptyState, ownerSelectOptions, showModal } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { render, writeNavigationHistory } from '../../../../utils/js/navigation.js'
import { npi } from './npi-shared.js'
import { npiComponents } from './npi-components.js'
import { npiData } from './npi-data.js'
import { npiRelSaveRisk } from './npi-data-relational.js'

npi.components = npiComponents

// Helper function to update tracker sub-assembly filter and URL
npi.tracker.setSubAsmFilter = function(value) {
  appState.trackerSubAsmFilter = value || 'all'
  // Update URL to persist tracker filter
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project']
  if (appState.trackerSubAsmFilter !== 'all') parts.push('tsf=' + encodeURIComponent(appState.trackerSubAsmFilter))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

// ══════════════════════════════════════
// ACTION TRACKER
// ══════════════════════════════════════
npi.tracker.renderActions = function() {
  const p     = prog()
  const today = new Date()
  const liveUpdateBadge = typeof npiRealtimeIndicatorHTML === 'function' ? npiRealtimeIndicatorHTML() : ''
  const open  = p.actions.filter(a => a.status !== 'Closed').length
  const od    = p.actions.filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < today).length

  // Sub-assembly list for attribution
  const subAsms = (p.subAssemblies || []).map(link => {
    const child = db.projects.find(x => x.id === link.id)
    return child ? { id: child.id, name: child.name } : null
  }).filter(Boolean)
  const hasSubAsms = subAsms.length > 0
  // Validate filter value
  if (!hasSubAsms || (appState.trackerSubAsmFilter !== 'all' && appState.trackerSubAsmFilter !== 'root' && !subAsms.find(s => s.id === appState.trackerSubAsmFilter))) {
    appState.trackerSubAsmFilter = 'all'
  }

  // Filter chips markup
  const filterBar = hasSubAsms ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
    <button class="btn btn-sm ${appState.trackerSubAsmFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('all')">All</button>
    <button class="btn btn-sm ${appState.trackerSubAsmFilter === 'root' ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('root')">Root only</button>
    ${subAsms.map(s => `<button class="btn btn-sm ${appState.trackerSubAsmFilter === s.id ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('${s.id}')">${esc(s.name)}</button>`).join('')}
  </div>` : ''

  // Build visible rows (preserve original indices for in-place edits)
  const subAsmOpts = hasSubAsms
    ? `<option value="">Root</option>${subAsms.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}`
    : ''
  const allWithIdx = p.actions.map((a, i) => ({ a, i }))
  const visible = appState.trackerSubAsmFilter === 'all'
    ? allWithIdx
    : appState.trackerSubAsmFilter === 'root'
    ? allWithIdx.filter(({ a }) => !a.subAsm || a.subAsm === '' || a.subAsm === 'root')
    : allWithIdx.filter(({ a }) => a.subAsm === appState.trackerSubAsmFilter)
  const rows  = visible.map(({ a, i }, vi) => {
    const overdue = a.status !== 'Closed' && a.due && new Date(a.due) < today
    const subAsmLabel = hasSubAsms
      ? subAsms.find(s => s.id === a.subAsm)?.name || 'Root'
      : ''
    return `<tr class="${overdue ? 'row-overdue' : ''}" data-action-id="${esc(a.id || '')}">
      <td class="w28 ctr" style="color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:calc(var(--ui-font-size) * 0.79)">${vi + 1}</td>
      <td><textarea class="cell-edit" name="tracker_action_${i}_desc" rows="1" data-autoresize onchange="npi.tracker.updAction(${i},'desc',this.value)" placeholder="Action description">${esc(a.desc)}</textarea></td>
      <td><select class="cell-edit" name="tracker_action_${i}_owner" onchange="npi.tracker.updAction(${i},'owner',this.value)" style="width:100%">${ownerSelectOptions(a.owner)}</select></td>
      <td><input type="date" class="cell-edit" name="tracker_action_${i}_due" value="${a.due || ''}" onchange="npi.tracker.updAction(${i},'due',this.value)" style="width:100%;${overdue ? 'color:var(--red);font-weight:600' : ''}"></td>
      <td><select class="cell-edit" name="tracker_action_${i}_status" onchange="npi.tracker.updAction(${i},'status',this.value)" style="width:100%">${['Open', 'In Progress', 'Closed', 'Blocked'].map(s => `<option${a.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><select class="cell-edit" name="tracker_action_${i}_priority" onchange="npi.tracker.updAction(${i},'priority',this.value)" style="width:100%">${['High', 'Medium', 'Low'].map(s => `<option${a.priority === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><select class="cell-edit" name="tracker_action_${i}_source" onchange="npi.tracker.updAction(${i},'source',this.value)" style="width:100%">${['Gate', 'PFMEA', 'Risk', 'General'].map(s => `<option${a.source === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      ${hasSubAsms ? `<td><select class="cell-edit" name="tracker_action_${i}_subAsm" onchange="npi.tracker.updAction(${i},'subAsm',this.value)" style="width:100%">${subAsmOpts.replace(`value="${a.subAsm || ''}"`, `value="${a.subAsm || ''}" selected`)}</select></td>` : ''}
      <td><textarea class="cell-edit" name="tracker_action_${i}_notes" rows="1" data-autoresize onchange="npi.tracker.updAction(${i},'notes',this.value)" placeholder="Notes">${esc(a.notes)}</textarea></td>
      <td style="text-align:center">${canEdit() ? `<button class="del-btn" onclick="npi.tracker.delAction(${i})">×</button>` : ''}</td>
    </tr>`
  }).join('')
  const colgroup = hasSubAsms
    ? `<colgroup><col style="width:36px"><col style="width:240px"><col style="width:110px"><col style="width:110px"><col style="width:110px"><col style="width:90px"><col style="width:90px"><col style="width:110px"><col style="width:180px"><col style="width:32px"></colgroup>`
    : `<colgroup><col style="width:36px"><col style="width:280px"><col style="width:120px"><col style="width:110px"><col style="width:120px"><col style="width:100px"><col style="width:100px"><col style="width:220px"><col style="width:32px"></colgroup>`
  const thead = hasSubAsms
    ? `<tr><th>#</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th>Priority</th><th>Source</th><th>Sub-Asm</th><th>Notes</th><th></th></tr>`
    : `<tr><th>#</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th>Priority</th><th>Source</th><th>Notes</th><th></th></tr>`
  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">Action Tracker</div><div class="sec-desc">Central log of all actions. Overdue items highlighted. Edit all fields inline.</div></div>
  <div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-actions')" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-primary btn-sm" onclick="npi.tracker.addAction()">＋ Add Action</button>` : ''}</div></div>
  ${liveUpdateBadge ? `<div style="margin:0 0 12px 0;display:flex;justify-content:flex-end">${liveUpdateBadge}</div>` : ''}
  <div style="display:flex;gap:10px;margin-bottom:16px">
    <div class="kpi-card" style="--kpi-color:var(--amber);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57)">${open}</div><div class="kpi-label">Open</div></div>
    <div class="kpi-card" style="--kpi-color:var(--red);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--red)">${od}</div><div class="kpi-label">Overdue</div></div>
    <div class="kpi-card" style="--kpi-color:var(--green);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--green)">${p.actions.filter(a => a.status === 'Closed').length}</div><div class="kpi-label">Closed</div></div>
  </div>
  ${filterBar}
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">All Actions</span><span class="card-meta">${visible.length}${appState.trackerSubAsmFilter !== 'all' ? ` shown · ${p.actions.length} total` : ' total'}</span></div>
  ${p.actions.length === 0
    ? emptyState('✅', 'No actions yet', 'Click ＋ Add Action to start tracking')
    : visible.length === 0
    ? emptyState('✅', 'No actions match this filter', 'Try a different sub-assembly filter above')
    : `<div class="sticky-card-scroll"><table class="tbl act-tbl" style="table-layout:fixed;width:100%">${colgroup}<thead>${thead}</thead><tbody>${rows}</tbody></table></div>`}
  ${canEdit() ? `<button class="add-row" onclick="npi.tracker.addAction()">＋ Add Action</button>` : ''}</div>`
}
npi.tracker.addAction = function() {
  npiData.tracker.addAction()
  render()
}
npi.tracker.updAction = function(i, f, v) {
  npiData.tracker.updAction(i, f, v)
  if (f === 'status' || f === 'due') render()
}
npi.tracker.delAction = function(i) { npiData.tracker.delAction(i); render() }

// ══════════════════════════════════════
// RISK REGISTER
// ══════════════════════════════════════
npi.tracker.renderRisks = function() {
  const p    = prog()
  const liveUpdateBadge = typeof npiRealtimeIndicatorHTML === 'function' ? npiRealtimeIndicatorHTML() : ''
  const open = p.risks.filter(r => r.status !== 'Closed')
  const hi   = open.filter(r => r.lik * r.imp >= 12).length
  const med  = open.filter(r => { const s = r.lik * r.imp; return s >= 6 && s < 12 }).length
  const lo   = open.filter(r => r.lik * r.imp < 6).length

  // Sub-assembly list for attribution
  const subAsms = (p.subAssemblies || []).map(link => {
    const child = db.projects.find(x => x.id === link.id)
    return child ? { id: child.id, name: child.name } : null
  }).filter(Boolean)
  const hasSubAsms = subAsms.length > 0
  // Validate filter value (shared with actions tab)
  if (!hasSubAsms || (appState.trackerSubAsmFilter !== 'all' && appState.trackerSubAsmFilter !== 'root' && !subAsms.find(s => s.id === appState.trackerSubAsmFilter))) {
    appState.trackerSubAsmFilter = 'all'
  }

  // Filter chips markup
  const filterBar = hasSubAsms ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
    <button class="btn btn-sm ${appState.trackerSubAsmFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('all')">All</button>
    <button class="btn btn-sm ${appState.trackerSubAsmFilter === 'root' ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('root')">Root only</button>
    ${subAsms.map(s => `<button class="btn btn-sm ${appState.trackerSubAsmFilter === s.id ? 'btn-primary' : 'btn-ghost'}" onclick="npi.tracker.setSubAsmFilter('${s.id}')">${esc(s.name)}</button>`).join('')}
  </div>` : ''

  const subAsmOpts = hasSubAsms
    ? `<option value="">Root</option>${subAsms.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}`
    : ''
  const allWithIdx = p.risks.map((r, i) => ({ r, i }))
  const visible = appState.trackerSubAsmFilter === 'all'
    ? allWithIdx
    : appState.trackerSubAsmFilter === 'root'
    ? allWithIdx.filter(({ r }) => !r.subAsm || r.subAsm === '' || r.subAsm === 'root')
    : allWithIdx.filter(({ r }) => r.subAsm === appState.trackerSubAsmFilter)
  const rows = visible.map(({ r, i }, vi) => {
    const score = r.lik * r.imp
    const sc    = score >= 12 ? 'rpn-hi' : score >= 6 ? 'rpn-md' : 'rpn-lo'
    return `<tr class="${score >= 12 && r.status !== 'Closed' ? 'row-hi' : ''}" data-risk-id="${esc(r.id || '')}">
      <td style="text-align:center;color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:calc(var(--ui-font-size) * 0.79)">${vi + 1}</td>
      <td><textarea class="cell-edit" name="tracker_risk_${i}_desc" rows="1" data-autoresize onchange="npi.tracker.updRisk(${i},'desc',this.value)" placeholder="Risk description">${esc(r.desc)}</textarea></td>
      <td><select class="cell-edit" name="tracker_risk_${i}_cat" onchange="npi.tracker.updRisk(${i},'cat',this.value)" style="width:100%">${['Technical', 'Supply Chain', 'Schedule', 'Resource', 'Customer', 'Commercial'].map(s => `<option${r.cat === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><select class="cell-edit" name="tracker_risk_${i}_owner" onchange="npi.tracker.updRisk(${i},'owner',this.value)" style="width:100%">${ownerSelectOptions(r.owner)}</select></td>
      ${hasSubAsms ? `<td><select class="cell-edit" name="tracker_risk_${i}_subAsm" onchange="npi.tracker.updRisk(${i},'subAsm',this.value)" style="width:100%">${subAsmOpts.replace(`value="${r.subAsm || ''}"`, `value="${r.subAsm || ''}" selected`)}</select></td>` : ''}
      <td class="risk-score-cell">${npi.components.scoreInput(r.lik || 1, { min: 1, max: 5, className: 'cell-edit mono risk-score-input', name: `tracker_risk_${i}_lik`, oninput: `const v=npi.tracker.riskScorePreview(this,${r.lik || 1});npi.tracker.updRisk(${i},'lik',v,false);npi.tracker.refreshRS(${i},false)`, onchange: `const v=npi.tracker.riskScoreInput(this);npi.tracker.updRisk(${i},'lik',v);npi.tracker.refreshRS(${i})` })}</td>
      <td class="risk-score-cell">${npi.components.scoreInput(r.imp || 1, { min: 1, max: 5, className: 'cell-edit mono risk-score-input', name: `tracker_risk_${i}_imp`, oninput: `const v=npi.tracker.riskScorePreview(this,${r.imp || 1});npi.tracker.updRisk(${i},'imp',v,false);npi.tracker.refreshRS(${i},false)`, onchange: `const v=npi.tracker.riskScoreInput(this);npi.tracker.updRisk(${i},'imp',v);npi.tracker.refreshRS(${i})` })}</td>
      <td style="text-align:center"><span class="rpn ${sc}" id="rs_${i}">${score}</span></td>
      <td><textarea class="cell-edit" name="tracker_risk_${i}_mit" rows="1" data-autoresize onchange="npi.tracker.updRisk(${i},'mit',this.value)" placeholder="Mitigation">${esc(r.mit)}</textarea></td>
      <td><select class="cell-edit" name="tracker_risk_${i}_status" onchange="npi.tracker.updRisk(${i},'status',this.value)" style="width:100%">${['Open', 'Mitigated', 'Closed'].map(s => `<option${r.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td style="text-align:center">${canEdit() ? `<button class="del-btn" onclick="npi.tracker.delRisk(${i})">×</button>` : ''}</td>
    </tr>`
  }).join('')
  const colgroup = hasSubAsms
    ? `<colgroup><col style="width:36px"><col style="width:240px"><col style="width:110px"><col style="width:100px"><col style="width:100px"><col style="width:52px"><col style="width:52px"><col style="width:56px"><col style="width:240px"><col style="width:90px"><col style="width:32px"></colgroup>`
    : `<colgroup><col style="width:36px"><col style="width:280px"><col style="width:120px"><col style="width:110px"><col style="width:52px"><col style="width:52px"><col style="width:56px"><col style="width:280px"><col style="width:100px"><col style="width:32px"></colgroup>`
  const thead = hasSubAsms
    ? `<tr><th>#</th><th>Risk Description</th><th>Category</th><th>Owner</th><th>Sub-Asm</th><th title="Likelihood (1–5): How likely is this risk to occur?" style="line-height:1.3">L<br><span style="font-size:calc(var(--ui-font-size) * 0.64);font-weight:400;color:var(--muted);text-transform:none;letter-spacing:0">Likelihood</span></th><th title="Impact (1–5): How severe would the consequences be?" style="line-height:1.3">I<br><span style="font-size:calc(var(--ui-font-size) * 0.64);font-weight:400;color:var(--muted);text-transform:none;letter-spacing:0">Impact</span></th><th>Score</th><th>Mitigation</th><th>Status</th><th></th></tr>`
    : `<tr><th>#</th><th>Risk Description</th><th>Category</th><th>Owner</th><th title="Likelihood (1–5): How likely is this risk to occur?" style="line-height:1.3">L<br><span style="font-size:calc(var(--ui-font-size) * 0.64);font-weight:400;color:var(--muted);text-transform:none;letter-spacing:0">Likelihood</span></th><th title="Impact (1–5): How severe would the consequences be?" style="line-height:1.3">I<br><span style="font-size:calc(var(--ui-font-size) * 0.64);font-weight:400;color:var(--muted);text-transform:none;letter-spacing:0">Impact</span></th><th>Score</th><th>Mitigation</th><th>Status</th><th></th></tr>`
  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">Risk Register</div><div class="sec-desc">Project-level risks. Likelihood × Impact = Score. All fields editable inline. High risks ≥ 12.</div></div>
  <div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button><button class="btn btn-ghost btn-sm" onclick="showModal('modalRiskMatrix')">📊 Risk Matrix</button><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-risks')" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-primary btn-sm" onclick="npi.tracker.addRisk()">＋ Add Risk</button>` : ''}</div></div>
  ${liveUpdateBadge ? `<div style="margin:0 0 12px 0;display:flex;justify-content:flex-end">${liveUpdateBadge}</div>` : ''}
  <div style="display:flex;gap:10px;margin-bottom:16px">
    <div class="kpi-card" style="--kpi-color:var(--red);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--red)">${hi}</div><div class="kpi-label">High ≥12</div></div>
    <div class="kpi-card" style="--kpi-color:var(--amber);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--amber)">${med}</div><div class="kpi-label">Medium 6–11</div></div>
    <div class="kpi-card" style="--kpi-color:var(--green);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--green)">${lo}</div><div class="kpi-label">Low &lt;6</div></div>
    <div class="kpi-card" style="--kpi-color:var(--muted);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:calc(var(--ui-font-size) * 1.57);color:var(--muted)">${p.risks.filter(r => r.status === 'Closed').length}</div><div class="kpi-label">Closed</div></div>
  </div>
  ${filterBar}
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">Risk Register</span><span class="card-meta">${visible.length}${appState.trackerSubAsmFilter !== 'all' ? ` shown · ${p.risks.length} total` : ' risks'} · L × I = Score</span></div>
  ${p.risks.length === 0
    ? emptyState('🛡', 'No risks yet', 'Click ＋ Add Risk to start — all fields edit inline')
    : visible.length === 0
    ? emptyState('🛡', 'No risks match this filter', 'Try a different sub-assembly filter above')
    : `<div class="sticky-card-scroll"><table class="tbl risk-tbl" style="table-layout:fixed;width:100%">${colgroup}<thead>${thead}</thead><tbody>${rows}</tbody></table></div>`}
  ${canEdit() ? `<button class="add-row" onclick="npi.tracker.addRisk()">＋ Add Risk</button>` : ''}</div>`
}
npi.tracker.addRisk = function() {
  npiData.tracker.addRisk()
  render()
}
npi.tracker.normalizeRiskScore = function(v) {
  const n = parseInt(v, 10)
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, n))
}
npi.tracker.riskScoreInput = function(inputEl) {
  const safe = npi.tracker.normalizeRiskScore(inputEl.value)
  inputEl.value = String(safe)
  return safe
}
npi.tracker.riskScorePreview = function(inputEl, fallback) {
  const raw = inputEl.value === undefined || inputEl.value === null ? '' : String(inputEl.value).trim()
  if (!raw) return npi.tracker.normalizeRiskScore(fallback)
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return npi.tracker.normalizeRiskScore(fallback)
  return Math.min(5, Math.max(1, n))
}
npi.tracker.updRisk = function(i, f, v) {
  const saveNow = arguments.length < 4 ? true : !!arguments[3]
  npiData.tracker.updRisk(i, f, v, saveNow)
  if (f === 'status') render()
}
npi.tracker.delRisk = function(i) { npiData.tracker.delRisk(i); render() }
npi.tracker.refreshRS = function(i, saveNow) {
  const r     = prog().risks[i]
  const score = r.lik * r.imp
  const el    = document.getElementById('rs_' + i)
  if (el) { el.textContent = score; el.className = 'rpn ' + (score >= 12 ? 'rpn-hi' : score >= 6 ? 'rpn-md' : 'rpn-lo') }
  const row = el ? el.closest('tr') : null
  if (row) {
    if (score >= 12 && r.status !== 'Closed') row.classList.add('row-hi')
    else row.classList.remove('row-hi')
  }
  if (saveNow !== false) npiRelSaveRisk(r)
}

export const npiTracker = npi.tracker
export const renderActions = npi.tracker.renderActions
export const renderRisks = npi.tracker.renderRisks
