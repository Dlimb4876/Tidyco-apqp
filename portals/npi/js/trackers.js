// ═══════════════════════════════════
// trackers.js — Action Tracker and Risk Register
// Depends on: state.js, helpers.js, navigation.js
// ═══════════════════════════════════

// ══════════════════════════════════════
// ACTION TRACKER
// ══════════════════════════════════════
function renderActions() {
  const p     = prog();
  const today = new Date();
  const open  = p.actions.filter(a => a.status !== 'Closed').length;
  const od    = p.actions.filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < today).length;
  const rows  = p.actions.map((a, i) => {
    const overdue = a.status !== 'Closed' && a.due && new Date(a.due) < today;
    return `<tr class="${overdue ? 'row-overdue' : ''}">
      <td class="w28 ctr" style="color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:11px">${i + 1}</td>
      <td><textarea class="cell-edit" rows="2" onchange="updAction(${i},'desc',this.value)" placeholder="Action description">${esc(a.desc)}</textarea></td>
      <td><input class="cell-edit" value="${esc(a.owner)}" onchange="updAction(${i},'owner',this.value)" placeholder="Owner" style="width:100%"></td>
      <td><input type="date" class="cell-edit" value="${a.due || ''}" onchange="updAction(${i},'due',this.value)" style="width:100%;${overdue ? 'color:var(--red);font-weight:600' : ''}"></td>
      <td><select class="cell-edit" onchange="updAction(${i},'status',this.value)" style="width:100%">${['Open', 'In Progress', 'Closed', 'Blocked'].map(s => `<option${a.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><select class="cell-edit" onchange="updAction(${i},'priority',this.value)" style="width:100%">${['High', 'Medium', 'Low'].map(s => `<option${a.priority === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><select class="cell-edit" onchange="updAction(${i},'source',this.value)" style="width:100%">${['Gate', 'PFMEA', 'Risk', 'General'].map(s => `<option${a.source === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><input class="cell-edit" value="${esc(a.notes)}" onchange="updAction(${i},'notes',this.value)" placeholder="Notes" style="width:100%"></td>
      <td style="text-align:center"><button class="del-btn" onclick="delAction(${i})">×</button></td>
    </tr>`;
  }).join('');
  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">Action Tracker</div><div class="sec-desc">Central log of all actions. Overdue items highlighted. Edit all fields inline.</div></div>
  <div class="sec-actions"><button class="btn btn-primary btn-sm" onclick="addAction()">＋ Add Action</button></div></div>
  <div style="display:flex;gap:10px;margin-bottom:16px">
    <div class="kpi-card" style="--kpi-color:var(--amber);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px">${open}</div><div class="kpi-label">Open</div></div>
    <div class="kpi-card" style="--kpi-color:var(--red);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--red)">${od}</div><div class="kpi-label">Overdue</div></div>
    <div class="kpi-card" style="--kpi-color:var(--green);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--green)">${p.actions.filter(a => a.status === 'Closed').length}</div><div class="kpi-label">Closed</div></div>
  </div>
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">All Actions</span><span class="card-meta">${p.actions.length} total</span></div>
  ${p.actions.length === 0
    ? emptyState('✅', 'No actions yet', 'Click ＋ Add Action to start tracking')
    : `<div class="sticky-card-scroll"><table class="tbl act-tbl" style="table-layout:fixed;width:100%"><colgroup><col style="width:36px"><col style="width:auto"><col style="width:100px"><col style="width:115px"><col style="width:110px"><col style="width:90px"><col style="width:90px"><col style="width:160px"><col style="width:32px"></colgroup><thead><tr><th>#</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th>Priority</th><th>Source</th><th>Notes</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="addAction()">＋ Add Action</button></div>`;
}
function addAction()       { prog().actions.push({ id: 'a_' + Date.now(), desc: '', owner: '', due: '', status: 'Open', priority: 'Medium', source: 'General', notes: '' }); save(); render(); }
function updAction(i, f, v){ prog().actions[i][f] = v; save(); }
function delAction(i)      { prog().actions.splice(i, 1); save(); render(); }

// ══════════════════════════════════════
// RISK REGISTER
// ══════════════════════════════════════
function renderRisks() {
  const p    = prog();
  const open = p.risks.filter(r => r.status !== 'Closed');
  const hi   = open.filter(r => r.lik * r.imp >= 12).length;
  const med  = open.filter(r => { const s = r.lik * r.imp; return s >= 6 && s < 12; }).length;
  const lo   = open.filter(r => r.lik * r.imp < 6).length;
  const rows = p.risks.map((r, i) => {
    const score = r.lik * r.imp;
    const sc    = score >= 12 ? 'rs-hi' : score >= 6 ? 'rs-med' : 'rs-lo';
    return `<tr class="${score >= 12 && r.status !== 'Closed' ? 'row-hi' : ''}">
      <td style="text-align:center;color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:11px">${i + 1}</td>
      <td><textarea class="cell-edit" rows="2" onchange="updRisk(${i},'desc',this.value)" placeholder="Risk description">${esc(r.desc)}</textarea></td>
      <td><select class="cell-edit" onchange="updRisk(${i},'cat',this.value)" style="width:100%">${['Technical', 'Supply Chain', 'Schedule', 'Resource', 'Customer', 'Commercial'].map(s => `<option${r.cat === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><input class="cell-edit" value="${esc(r.owner)}" onchange="updRisk(${i},'owner',this.value)" placeholder="Owner" style="width:100%"></td>
      <td style="text-align:center"><input type="number" class="cell-edit mono" min="1" max="5" value="${r.lik || 1}" onchange="updRisk(${i},'lik',+this.value);refreshRS(${i})" style="width:100%;text-align:center"></td>
      <td style="text-align:center"><input type="number" class="cell-edit mono" min="1" max="5" value="${r.imp || 1}" onchange="updRisk(${i},'imp',+this.value);refreshRS(${i})" style="width:100%;text-align:center"></td>
      <td style="text-align:center"><span class="rs ${sc}" id="rs_${i}">${score}</span></td>
      <td><textarea class="cell-edit" rows="2" onchange="updRisk(${i},'mit',this.value)" placeholder="Mitigation">${esc(r.mit)}</textarea></td>
      <td><select class="cell-edit" onchange="updRisk(${i},'status',this.value)" style="width:100%">${['Open', 'Mitigated', 'Closed'].map(s => `<option${r.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td style="text-align:center"><button class="del-btn" onclick="delRisk(${i})">×</button></td>
    </tr>`;
  }).join('');
  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">Risk Register</div><div class="sec-desc">Project-level risks. Likelihood × Impact = Score. All fields editable inline. High risks ≥ 12.</div></div>
  <div class="sec-actions"><button class="btn btn-primary btn-sm" onclick="addRisk()">＋ Add Risk</button></div></div>
  <div style="display:flex;gap:10px;margin-bottom:16px">
    <div class="kpi-card" style="--kpi-color:var(--red);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--red)">${hi}</div><div class="kpi-label">High ≥12</div></div>
    <div class="kpi-card" style="--kpi-color:var(--amber);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--amber)">${med}</div><div class="kpi-label">Medium 6–11</div></div>
    <div class="kpi-card" style="--kpi-color:var(--green);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--green)">${lo}</div><div class="kpi-label">Low &lt;6</div></div>
    <div class="kpi-card" style="--kpi-color:var(--muted);flex:1;padding:12px 14px;cursor:default"><div class="kpi-num" style="font-size:22px;color:var(--muted)">${p.risks.filter(r => r.status === 'Closed').length}</div><div class="kpi-label">Closed</div></div>
  </div>
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">Risk Register</span><span class="card-meta">${p.risks.length} risks · L × I = Score</span></div>
  ${p.risks.length === 0
    ? emptyState('🛡', 'No risks yet', 'Click ＋ Add Risk to start — all fields edit inline')
    : `<div class="sticky-card-scroll"><table class="tbl risk-tbl" style="table-layout:fixed;width:100%"><colgroup><col style="width:36px"><col style="width:auto"><col style="width:120px"><col style="width:90px"><col style="width:40px"><col style="width:40px"><col style="width:56px"><col style="width:200px"><col style="width:100px"><col style="width:32px"></colgroup><thead><tr><th>#</th><th>Risk Description</th><th>Category</th><th>Owner</th><th>L</th><th>I</th><th>Score</th><th>Mitigation</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="addRisk()">＋ Add Risk</button></div>`;
}
function addRisk()       { prog().risks.push({ id: 'r_' + Date.now(), desc: '', cat: 'Technical', owner: '', lik: 3, imp: 3, mit: '', status: 'Open' }); save(); render(); }
function updRisk(i, f, v){ prog().risks[i][f] = v; save(); }
function delRisk(i)      { prog().risks.splice(i, 1); save(); render(); }
function refreshRS(i) {
  const r     = prog().risks[i];
  const score = r.lik * r.imp;
  const el    = document.getElementById('rs_' + i);
  if (el) { el.textContent = score; el.className = 'rs ' + (score >= 12 ? 'rs-hi' : score >= 6 ? 'rs-med' : 'rs-lo'); }
  save();
}
