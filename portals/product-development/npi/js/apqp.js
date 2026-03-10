// ═══════════════════════════════════
// apqp.js — Unified APQP tab management (CTQ, PFD, CP)
// Depends on: state.js, helpers.js, navigation.js, pfmea.js (renderPFMEA, calcRPN)
// ═══════════════════════════════════

// ── Tab shell ─────────────────────────────────────────────────
function renderAPQP() {
  const p      = prog();
  const highRPN = p.pfmea.filter(r => calcRPN(r) >= 100).length;
  const tabs = [
    { id: 'ctq',   label: 'CTQ Matrix',   badge: p.ctq.length },
    { id: 'pfd',   label: 'Process Flow',  badge: p.pfd.filter(s => s.type !== 'group').length },
    { id: 'pfmea', label: 'PFMEA',         badge: p.pfmea.length, warn: highRPN > 0 },
    { id: 'cp',    label: 'Control Plan',  badge: p.cp.length }
  ];
  const tabNav = `<div style="display:flex;background:var(--white);border:1px solid var(--line);border-radius:8px 8px 0 0;overflow:hidden;border-bottom:none">${
    tabs.map(t => `<button style="padding:10px 20px;font-size:12px;font-weight:${apqpTab === t.id ? '600' : '500'};cursor:pointer;border:none;border-bottom:2px solid ${apqpTab === t.id ? 'var(--blue)' : 'transparent'};color:${apqpTab === t.id ? 'var(--blue)' : 'var(--muted)'};background:${apqpTab === t.id ? 'var(--blue-pale)' : 'transparent'};font-family:'IBM Plex Sans',sans-serif;transition:all .15s;white-space:nowrap" onclick="setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? ` <span style="font-size:10px;font-family:'IBM Plex Mono',monospace;opacity:.7">(${t.badge})</span>` : ''}${t.warn ? ` <span style="color:var(--amber)">⚠</span>` : ''}</button>`).join('')
  }</div>`;
  const inner = apqpTab === 'ctq' ? renderCTQ() : apqpTab === 'pfd' ? renderPFD() : apqpTab === 'pfmea' ? renderPFMEA() : renderCP();
  return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">APQP</div><div class="sec-desc">CTQ requirements, process flow, PFMEA and control plan in one place.</div></div><div style="display:flex;gap:8px;flex-shrink:0"><button class="btn btn-ghost btn-sm" onclick="goHome()">← Dashboard</button></div></div>
  ${tabNav}
  <div style="background:var(--white);border:1px solid var(--line);border-top:none;border-radius:0 0 4px 4px;padding:20px 0 0"></div>
  <div class="apqp-tab-content" style="padding-top:18px">${inner}</div>`;
}

// ══════════════════════════════════════
// CTQ
// ══════════════════════════════════════
function renderCTQ() {
  const p = prog();
  const rows = p.ctq.map((r, i) => `<tr>
    <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>
    <td><textarea class="cell-edit" rows="2" onchange="updCTQ(${i},'req',this.value)" placeholder="CTQ requirement">${esc(r.req)}</textarea></td>
    <td><input class="cell-edit mono" value="${esc(r.spec)}" onchange="updCTQ(${i},'spec',this.value)" placeholder="e.g. 50±0.05mm" style="width:100%"></td>
    <td><input class="cell-edit" value="${esc(r.testMethod || '')}" onchange="updCTQ(${i},'testMethod',this.value)" placeholder="e.g. CMM, Gauge, Visual" style="width:100%"></td>
    <td><select class="cell-edit" onchange="updCTQ(${i},'source',this.value)" style="width:100%">${['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing'].map(o => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><select class="cell-edit" onchange="updCTQ(${i},'oos_action',this.value)" style="width:100%">${['Repair', 'Replace', 'Scrap', 'Review', 'TBD'].map(o => `<option${r.oos_action === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><div class="ctq-agreed">
      <input type="checkbox" ${r.customerAgreed ? 'checked' : ''} onchange="updCTQ(${i},'customerAgreed',this.checked);render()" title="Customer has agreed this CTQ method and out-of-spec plan">
      <span class="ctq-agreed-label" style="color:${r.customerAgreed ? 'var(--green)' : 'var(--muted)'}">${r.customerAgreed ? 'AGREED' : '—'}</span>
    </div></td>
    <td style="text-align:center"><button class="del-btn" onclick="delCTQ(${i})">×</button></td>
  </tr>`).join('');
  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 01</div><div class="sec-title">CTQ Matrix</div><div class="sec-desc">Critical-to-Quality requirements — source of truth for PFD, PFMEA and Control Plan.</div></div><div class="sec-actions"><button class="btn btn-primary btn-sm" onclick="addCTQ()">＋ Add CTQ</button></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
  ${p.ctq.length === 0 ? emptyState('🎯', 'No CTQs yet', 'Add critical requirements') : `<div class="sticky-table-wrap"><table class="tbl ctq-tbl" style="min-width:960px;table-layout:fixed;width:100%"><colgroup><col style="width:40px"><col style="width:22%"><col style="width:14%"><col style="width:18%"><col style="width:13%"><col style="width:13%"><col style="width:74px"><col style="width:30px"></colgroup><thead><tr><th>Ref</th><th>Requirement</th><th>Target / Tolerance</th><th>Test Method</th><th>Source</th><th>Out-of-Spec Action</th><th style="text-align:center">Agreed</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="addCTQ()">＋ Add CTQ</button></div>
  ${p.ctq.length > 0 ? `<div class="info-banner">💡 ${p.ctq.length} CTQs defined. Next: <a href="#" onclick="setApqpTab('pfd');return false" style="color:var(--blue)">Process Flow →</a></div>` : ''}`;
}
function addCTQ() { prog().ctq.push({ id: 'c_' + Date.now(), req: '', spec: '', testMethod: '', source: 'Customer Spec', oos_action: 'TBD', customerAgreed: false }); save(); render(); }
function updCTQ(i, f, v) { prog().ctq[i][f] = v; save(); }
function delCTQ(i) { const cid = prog().ctq[i].id; prog().pfd.forEach(s => s.ctqIds = (s.ctqIds || []).filter(x => x !== cid)); prog().pfmea.forEach(r => r.ctqIds = (r.ctqIds || []).filter(x => x !== cid)); prog().ctq.splice(i, 1); save(); render(); }

// ══════════════════════════════════════
// PFD
// ══════════════════════════════════════
function sortedPfd(pfd) { return [...pfd].sort((a, b) => a.stepNum - b.stepNum); }
function nextMainStepNum(pfd) { const t = pfd.filter(s => s.stepNum % 10 === 0).map(s => s.stepNum); return t.length ? Math.max(...t) + 10 : 10; }
function stepNumConflict(pfd, num, xid) { return pfd.some(s => s.stepNum === num && s.id !== xid); }

function renderPFD() {
  const p      = prog();
  const sorted = sortedPfd(p.pfd);
  const ribbon = sorted.filter(s => s.type !== 'group').map((s, i, arr) =>
    `<div class="flow-node${s.type === 'sub' ? ' is-sub' : ''}" onclick="scrollToPfd('${s.id}')"><div class="flow-node-num">${s.stepNum}</div><div class="flow-node-name">${esc(s.op) || '—'}</div></div>${i < arr.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
  ).join('');

  let body = '', i = 0;
  while (i < sorted.length) {
    const s  = sorted[i];
    const oi = p.pfd.indexOf(s);
    if (s.type === 'group') {
      const ch = []; let j = i + 1;
      while (j < sorted.length && sorted[j].type === 'sub' && Math.floor(sorted[j].stepNum / 10) === Math.floor(s.stepNum / 10)) {
        ch.push({ s: sorted[j], oi: p.pfd.indexOf(sorted[j]) }); j++;
      }
      const col = collapsedGroups.has(s.id);
      body += `<div class="step-row" id="pfd-row-${s.id}"><div class="sub-group-header" onclick="toggleGroup('${s.id}')"><span style="font-size:10px;color:var(--purple);display:inline-block;${col ? '' : 'transform:rotate(90deg)'}">▶</span><span class="tag tag-sub">${s.stepNum}</span><span style="font-size:13px;font-weight:600;color:var(--purple)">${esc(s.op) || 'Sub-assembly Group'}</span><span style="font-size:11px;color:#9b74cc;margin-left:auto">${ch.length} step${ch.length !== 1 ? 's' : ''}</span><button class="del-btn" style="margin-left:8px" onclick="event.stopPropagation();delPFD('${s.id}')">×</button></div><div class="sub-group-body${col ? ' collapsed' : ''}"> ${ch.map(c => stepRowHTML(c.s, c.oi, p)).join('')}</div></div>`;
      i = j;
    } else { body += stepRowHTML(s, oi, p); i++; }
    body += `<div class="insert-row"><button class="insert-btn" onclick="openInsert(${oi})">＋ after ${s.stepNum}</button></div>`;
  }
  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Steps numbered in 10s. Insert between steps. Numbers are permanent references in PFMEA and Control Plan.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="openInsert(null,'group')">＋ Sub-assembly</button><button class="btn btn-primary btn-sm" onclick="addMainStep()">＋ Add Step</button></div></div>
  ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
  <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${p.pfd.filter(s => s.type !== 'group').length} executable steps</span></div>
  ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div>${body}</div>`}
  <button class="add-row" onclick="addMainStep()">＋ Add Process Step</button></div>
  ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" onclick="setApqpTab('pfmea');return false" style="color:var(--blue)">PFMEA →</a></div>` : ''}`;
}

function stepRowHTML(s, oi, p) {
  const ctqBadges = (s.ctqIds || []).map(cid => { const ci = p.ctq.findIndex(c => c.id === cid); return ci >= 0 ? `<span class="ctq-pick-item" onclick="openCtqPick(${oi})">C${ci + 1}</span>` : ''; }).join('');
  const pfCnt  = p.pfmea.filter(r => r.pfdId === s.id).length;
  const pills  = (s.bomRefs || []).map(ref => { const bt = p.bom[ref.bomType]; if (!bt) return ''; const item = bt.find(x => x.id === ref.itemId); if (!item) return ''; const t = BOM_TYPES[ref.bomType]; const name = item.desc || (item.pn || item.toolId || item.equipId || '?'); return `<span class="res-pill ${t.pc}" onclick="delBomRef('${s.id}','${ref.bomType}','${ref.itemId}')" title="Click to remove">${t.icon} ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${item.isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}</span>`; }).join('');
  return `<div class="step-row" id="pfd-row-${s.id}"><div class="step-main-row"><div class="step-num-cell"><div class="step-num-badge">${s.stepNum}</div><div style="display:flex;flex-direction:column;gap:2px"><button class="mini-btn" onclick="openInsert(${oi})">＋</button><button class="mini-btn danger" onclick="delPFD('${s.id}')">×</button></div></div><div class="step-body"><div class="step-fields"><div class="step-field f-op"><input class="cell-edit" value="${esc(s.op)}" onchange="updPFD('${s.id}','op',this.value)" placeholder="Operation" style="font-weight:600"></div><div class="step-field f-detail"><textarea class="cell-edit" rows="2" onchange="updPFD('${s.id}','detail',this.value)" placeholder="Method / notes…">${esc(s.detail)}</textarea></div><div class="step-field f-ctq"><div class="ctq-pick">${ctqBadges}${p.ctq.length > 0 ? `<span class="ctq-pick-add" onclick="openCtqPick(${oi})">＋ CTQ</span>` : ''}</div></div><div class="step-field f-pfmea">${pfCnt > 0 ? `<span class="tag tag-amber">${pfCnt} FMEA</span>` : '<span style="font-size:11px;color:var(--muted)">—</span>'}</div></div></div></div><div class="step-resources">${pills}<button class="res-add-btn" onclick="openBomPick('${s.id}')">＋ Resource</button></div></div>`;
}

function addMainStep()   { const p = prog(); p.pfd.push({ id: 's_' + Date.now(), stepNum: nextMainStepNum(p.pfd), type: 'step', op: '', detail: '', ctqIds: [], bomRefs: [] }); save(); render(); }
function openInsert(afterOi, ft) {
  insertOriginIdx = afterOi; const p = prog(); const sorted = sortedPfd(p.pfd);
  if (ft) document.getElementById('insertType').value = ft;
  const ni = document.getElementById('insertNum'), hi = document.getElementById('insertNumHint');
  if (afterOi != null) { const as = p.pfd[afterOi]; const asi = sorted.findIndex(s => s.id === as.id); const ns = asi < sorted.length - 1 ? sorted[asi + 1] : null; const base = as.stepNum, ceil = ns ? ns.stepNum : base + 10; ni.value = base + 1 <= ceil - 1 ? base + 1 : ''; hi.textContent = `Available: ${base + 1}–${ceil - 1}`; }
  else { const n = nextMainStepNum(p.pfd); ni.value = n; hi.textContent = `Next: ${n}`; }
  showModal('modalInsert');
}
function confirmInsert() { const p = prog(); const num = parseInt(document.getElementById('insertNum').value); const type = document.getElementById('insertType').value; if (!num || num < 1) return alert('Enter valid number'); if (stepNumConflict(p.pfd, num)) return alert(`Step ${num} exists`); p.pfd.push({ id: 's_' + Date.now(), stepNum: num, type, op: '', detail: '', ctqIds: [], bomRefs: [] }); save(); closeModal('modalInsert'); render(); }
function delPFD(sid)     { const p = prog(); const i = p.pfd.findIndex(s => s.id === sid); if (i < 0) return; p.pfmea.forEach(r => { if (r.pfdId === sid) r.pfdId = ''; }); p.pfd.splice(i, 1); save(); render(); }
function updPFD(sid, f, v) { const s = prog().pfd.find(x => x.id === sid); if (s) { s[f] = v; save(); } }
function scrollToPfd(sid) { const el = document.getElementById('pfd-row-' + sid); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function toggleGroup(key) { if (collapsedGroups.has(key)) collapsedGroups.delete(key); else collapsedGroups.add(key); render(); }
function delBomRef(sid, bt, iid) { const s = prog().pfd.find(x => x.id === sid); if (!s) return; s.bomRefs = (s.bomRefs || []).filter(r => !(r.bomType === bt && r.itemId === iid)); save(); render(); }

// ── CTQ picker modal ──────────────────────────────────────────
function openCtqPick(oi) {
  const p = prog(); ctqPickTarget = oi; ctqPickSelected = [...(p.pfd[oi].ctqIds || [])];
  document.getElementById('ctqPickList').innerHTML = p.ctq.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No CTQs defined.</p>'
    : p.ctq.map((c, i) => `<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:7px;border-radius:5px;border:1px solid var(--line);background:var(--white)" onmouseover="this.style.background='var(--blue-pale)'" onmouseout="this.style.background='var(--white)'"><input type="checkbox" ${ctqPickSelected.includes(c.id) ? 'checked' : ''} onchange="tCP('${c.id}',this.checked)" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag tag-ctq">C${i + 1}</span><span style="font-size:12px;font-weight:600">${esc(c.req || 'Unnamed')}</span></div><div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;margin-top:1px">${esc(c.spec)}</div></div></label>`).join('');
  showModal('modalCtqPick');
}
function tCP(cid, checked) { if (checked) { if (!ctqPickSelected.includes(cid)) ctqPickSelected.push(cid); } else ctqPickSelected = ctqPickSelected.filter(x => x !== cid); }
function saveCtqPick() { prog().pfd[ctqPickTarget].ctqIds = [...ctqPickSelected]; save(); closeModal('modalCtqPick'); render(); }

// ── BOM picker modal ──────────────────────────────────────────
function openBomPick(sid) {
  bomPickTarget = sid; const p = prog(); const s = p.pfd.find(x => x.id === sid);
  bomPickSelected = [...(s.bomRefs || []).map(r => r.bomType + '|' + r.itemId)];
  bomPickFilter = 'all';
  document.getElementById('bomPickTitle').textContent = `Resources — Step ${s.stepNum}: ${s.op || '(unnamed)'}`;
  refreshBomPickModal(p, 'bomPickFilter', 'bomPickList', bomPickFilter);
  showModal('modalBomPick');
}
function refreshBomPickModal(p, filterId, listId, activeFilter) {
  const types = Object.entries(BOM_TYPES);
  const total = types.reduce((n, [k]) => n + p.bom[k].length, 0);
  document.getElementById(filterId).innerHTML = `<button class="bom-filter-btn${activeFilter === 'all' ? ' active' : ''}" onclick="setBomFilter('all','${filterId}','${listId}')">All (${total})</button>` + types.map(([k, t]) => `<button class="bom-filter-btn${activeFilter === k ? ' active' : ''}" onclick="setBomFilter('${k}','${filterId}','${listId}')">${t.icon} ${t.label} (${p.bom[k].length})</button>`).join('');
  let items = [];
  types.forEach(([k, t]) => {
    if (activeFilter !== 'all' && activeFilter !== k) return;
    p.bom[k].forEach(item => {
      const key   = k + '|' + item.id;
      const name  = item.desc || (item.pn || item.toolId || item.equipId || '');
      const flags = [];
      if (item.isAaw)    flags.push('<span class="flag flag-aaw">AAW</span>');
      if (item.isRepair) flags.push('<span class="flag flag-repair">RPR</span>');
      const meta = [item.pn || item.toolId || item.equipId, item.spec].filter(Boolean).join(' · ');
      items.push(`<div class="bom-pick-item${bomPickSelected.includes(key) ? ' selected' : ''}" onclick="toggleBomPick('${key}',this,'${listId}')"><input type="checkbox" ${bomPickSelected.includes(key) ? 'checked' : ''} onchange="toggleBomPick('${key}',this.closest('.bom-pick-item'),'${listId}')"><div class="bom-pick-info"><div class="bom-pick-name">${t.icon} ${esc(name || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">${t.label}</span></div>`);
    });
  });
  document.getElementById(listId).innerHTML = items.length ? items.join('') : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No items in BoM yet.</div>';
}
function setBomFilter(f, fid, lid) { bomPickFilter = f; refreshBomPickModal(prog(), fid, lid, f); }
function toggleBomPick(key, el, lid) { const chk = el.querySelector('input'); if (bomPickSelected.includes(key)) { bomPickSelected = bomPickSelected.filter(x => x !== key); el.classList.remove('selected'); if (chk) chk.checked = false; } else { bomPickSelected.push(key); el.classList.add('selected'); if (chk) chk.checked = true; } }
function saveBomPick() { const s = prog().pfd.find(x => x.id === bomPickTarget); if (!s) return; s.bomRefs = bomPickSelected.map(k => { const [bt, id] = k.split('|'); return { bomType: bt, itemId: id }; }); save(); closeModal('modalBomPick'); render(); }

// ══════════════════════════════════════
// CONTROL PLAN
// ══════════════════════════════════════
function renderCP() {
  const p = prog();
  const cpCauseKeys = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId));
  const miss = [];
  p.pfmea.forEach(mode => {
    (mode.effects || []).forEach(ef => {
      (ef.causes || []).forEach(ca => { if (!cpCauseKeys.has(ca.id)) miss.push({ mode, ef, ca }); });
    });
  });
  const rows = p.cp.map((r, i) => {
    const fr  = p.pfmea.find(f => f.id === r.pfmeaId);
    const ef  = fr && r.pfmeaEffectId ? (fr.effects || []).find(e => e.id === r.pfmeaEffectId) : null;
    const ca  = ef && r.pfmeaCauseId  ? (ef.causes  || []).find(c => c.id === r.pfmeaCauseId)  : null;
    const step = fr ? p.pfd.find(s => s.id === fr.pfdId) : null;
    const sl   = step ? `${step.stepNum} – ${esc(step.op || '')}` : '—';
    const ctqs = (step ? step.ctqIds || [] : []).map(cid => { const ci = p.ctq.findIndex(c => c.id === cid); return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : ''; }).join('');
    const rpn  = ca && ef ? (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) : 0;
    const rc   = rpn >= 200 ? 'rpn-hi' : rpn >= 100 ? 'rpn-md' : 'rpn-lo';
    const modeLabel   = fr  ? esc(fr.mode  || '—') : '—';
    const effectLabel = ef  ? `<span style="color:var(--muted)"> → ${esc(ef.effect || '')}</span>` : '';
    const causeLabel  = ca  ? `<div style="font-size:10px;color:var(--muted);margin-top:1px">Cause: ${esc(ca.cause || '')}</div>` : '';
    return `<tr><td class="w100"><span class="tag tag-step" style="font-size:10px">${sl}</span></td>
      <td class="w140" style="font-size:11px;color:var(--mid)">${modeLabel}${effectLabel}${causeLabel}${rpn ? ` <span class="rpn ${rc}" style="font-size:10px;padding:1px 5px">${rpn}</span>` : ''}</td>
      <td><input class="cell-edit" value="${esc(r.char)}" onchange="updCP(${i},'char',this.value)" placeholder="Characteristic"></td>
      <td class="w80"><select class="cell-edit" onchange="updCP(${i},'type',this.value)">${['Product', 'Process', 'Dimensional', 'Functional', 'Visual'].map(o => `<option${r.type === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
      <td class="w110"><input class="cell-edit mono" value="${esc(r.spec)}" onchange="updCP(${i},'spec',this.value)" placeholder="Spec"></td>
      <td class="w110"><input class="cell-edit" value="${esc(r.method)}" onchange="updCP(${i},'method',this.value)" placeholder="Method"></td>
      <td class="w60"><input class="cell-edit" value="${esc(r.freq)}" onchange="updCP(${i},'freq',this.value)" placeholder="100%"></td>
      <td class="w70"><input class="cell-edit" value="${esc(r.resp)}" onchange="updCP(${i},'resp',this.value)" placeholder="Who"></td>
      <td><textarea class="cell-edit" rows="2" onchange="updCP(${i},'reaction',this.value)" placeholder="Reaction plan">${esc(r.reaction)}</textarea></td>
      <td class="w50"><div style="display:flex;flex-wrap:wrap;gap:2px">${ctqs || '—'}</div></td>
      <td class="w28 ctr"><button class="del-btn" onclick="delCP(${i})">×</button></td></tr>`;
  }).join('');
  const syncBanner = miss.length > 0
    ? `<div style="background:var(--amber-pale);border:1px solid var(--amber-mid);border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:13px;color:var(--amber)">⚠ ${miss.length} PFMEA effect${miss.length !== 1 ? 's' : ''} not in control plan.</span><button class="btn btn-sm" style="background:var(--amber);color:white;border:none" onclick="syncFromPFMEA()">Auto-populate from PFMEA</button></div>`
    : '';
  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 04</div><div class="sec-title">Control Plan</div><div class="sec-desc">Linked to PFMEA and PFD. Step numbers and CTQs carry through automatically.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="syncFromPFMEA()">Sync from PFMEA</button><button class="btn btn-primary btn-sm" onclick="addCP()">＋ Add Row</button></div></div>
  ${syncBanner}
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">Control Plan</span><span class="card-meta">${p.cp.length} characteristics</span></div>
  ${p.cp.length === 0 ? emptyState('📊', 'No entries yet', miss.length > 0 ? 'Use "Sync from PFMEA" to auto-populate' : 'Complete PFMEA first') : `<div class="sticky-table-wrap"><table class="tbl" style="min-width:1100px"><thead><tr><th>Step</th><th>FMEA/RPN</th><th>Characteristic</th><th>Type</th><th>Spec</th><th>Method</th><th>Freq</th><th>Resp</th><th>Reaction Plan</th><th>CTQs</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="addCP()">＋ Add Row</button></div>`;
}

function syncFromPFMEA() {
  const p  = prog();
  const ex = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId));
  let n    = 0;
  p.pfmea.forEach(mode => {
    const step = p.pfd.find(s => s.id === mode.pfdId);
    const cids = step ? (step.ctqIds || []) : [];
    const fc   = cids.length > 0 ? p.ctq.find(c => c.id === cids[0]) : null;
    (mode.effects || []).forEach(ef => {
      (ef.causes || []).forEach(ca => {
        if (ex.has(ca.id)) return;
        p.cp.push({
          id: 'cp_' + Date.now() + '_' + (n++),
          pfmeaId: mode.id, pfmeaEffectId: ef.id, pfmeaCauseId: ca.id, pfdId: mode.pfdId,
          char: mode.mode + (ef.effect ? ' → ' + ef.effect : '') + (ca.cause ? ' (' + ca.cause + ')' : ''),
          type: 'Process', spec: fc ? fc.spec : '', method: ca.detect || ca.prevent || '',
          freq: '100%', resp: '', reaction: fc ? fc.oos_action || '' : '', ctqIds: [...cids]
        });
      });
    });
  });
  if (n === 0) return alert('All PFMEA causes already in control plan.');
  save(); render();
}
function addCP()         { prog().cp.push({ id: 'cp_' + Date.now(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }); save(); render(); }
function updCP(i, f, v)  { prog().cp[i][f] = v; save(); }
function delCP(i)        { prog().cp.splice(i, 1); save(); render(); }
