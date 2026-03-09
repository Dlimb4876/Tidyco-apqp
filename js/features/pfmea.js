/* ============================================================
   pfmea.js — PFMEA render, mutations, and RPN logic
   Fixed version: Addresses header overlap via dynamic measurement.
   ============================================================ */

/**
 * Synchronizes sticky positions of headers to prevent overlap.
 */
function pfmeaSyncRow2() {
  const row0 = document.querySelector('.pfmea-tbl thead tr:first-child');
  const row2ths = document.querySelectorAll('.pfmea-thead-row2 th');
  if (!row0 || !row2ths.length) return;

  const navH = 52; // Matches .topbar height in main.css
  const row0H = Math.ceil(row0.getBoundingClientRect().height);
  const topValue = (navH + row0H) + 'px';

  row2ths.forEach(th => {
    th.style.top = topValue;
  });

  // Also align step headers below both main header rows
  const row2 = document.querySelector('.pfmea-thead-row2');
  if (row2) {
    const row2H = Math.ceil(row2.getBoundingClientRect().height);
    const stepTop = (navH + row0H + row2H) + 'px';
    document.querySelectorAll('.pfmea-step-header').forEach(sh => {
      sh.style.top = stepTop;
    });
  }
}

function renderPFMEA() {
  const p = prog();
  const sorted = sortedPfd(p.pfd).filter(s => s.type !== 'group');
  if (sorted.length === 0) return emptyState('⚠️', 'No process steps', 'Add steps in Process Flow first.');

  const highRPN = p.pfmea.reduce((n, m) => n + (m.effects || []).reduce((en, ef) => en + (ef.causes || []).filter(ca => (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) >= 100).length, 0), 0);

  const byStep = {}; sorted.forEach(s => { byStep[s.id] = []; }); byStep['__none'] = [];
  p.pfmea.forEach(r => { const key = (r.pfdId && byStep[r.pfdId] !== undefined) ? r.pfdId : '__none'; byStep[key].push(r); });

  let html = `<div class="pfmea-wrap" style="-webkit-overflow-scrolling:touch"><table class="tbl pfmea-tbl" style="table-layout:fixed;min-width:1808px;width:100%">
  <colgroup>
    <col style="width:180px"><col style="width:180px"><col style="width:44px">
    <col style="width:180px"><col style="width:44px"><col style="width:180px">
    <col style="width:180px"><col style="width:44px"><col style="width:60px">
    <col style="width:150px"><col style="width:150px"><col style="width:80px">
    <col style="width:100px"><col style="width:44px"><col style="width:44px">
    <col style="width:60px"><col style="width:60px"><col style="width:28px">
  </colgroup>
  <thead>
    <tr>
      <th rowspan="2">Failure Mode</th>
      <th rowspan="2">Effect</th>
      <th rowspan="2" title="Severity of effect">SEV</th>
      <th rowspan="2">Cause</th>
      <th rowspan="2" title="Occurrence of cause">OCC</th>
      <th rowspan="2">Controls — Prevent</th>
      <th rowspan="2">Controls — Detect</th>
      <th rowspan="2" title="Detection rating">DET</th>
      <th rowspan="2">RPN</th>
      <th colspan="8" style="background:#dbeafe;color:#1e40af;letter-spacing:.5px">RECOMMENDED ACTION & RESCORING</th>
      <th rowspan="2"></th>
    </tr>
    <tr class="pfmea-thead-row2">
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Recommended Action</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Action Taken</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Owner</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Due</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">New OCC</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">New DET</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Forecast RPN</th>
      <th style="background:#dbeafe;color:#1e40af;padding:3px 4px">Implement</th>
    </tr>
  </thead><tbody>`;

  sorted.forEach(s => {
    const modes = byStep[s.id] || [];
    const ctqBadges = (s.ctqIds || []).map(cid => { const ci = p.ctq.findIndex(c => c.id === cid); return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : '' }).join(' ');
    html += `<tr><td colspan="18" style="padding:0;border-top:3px solid #6b7280"><div class="pfmea-step-header"><span class="pfmea-step-label">Step ${s.stepNum} — ${esc(s.op || '(unnamed)')}</span><div class="pfmea-step-ctqs">${ctqBadges}</div></div></td></tr>`;

    modes.forEach(mode => {
      const mi = p.pfmea.indexOf(mode);
      const effects = mode.effects || [];
      const totalCauseRows = effects.reduce((n, ef) => n + Math.max(1, (ef.causes || []).length), 0);
      const modeRowspan = Math.max(1, totalCauseRows);

      effects.forEach((ef, ei) => {
        const causes = ef.causes || [];
        const efRowspan = Math.max(1, causes.length);
        const sev = ef.sev || 1;

        causes.forEach((ca, ci) => {
          const occ = ca.occ || 1, det = ca.det || 1;
          const rpn = sev * occ * det;
          const rpnCls = rpn >= 200 ? 'rpn-hi' : rpn >= 100 ? 'rpn-md' : 'rpn-lo';
          const act = ca.action || {};
          const hasAction = !!(act.newOcc || act.newDet);
          const forecast = sev * (act.newOcc ? +act.newOcc : occ) * (act.newDet ? +act.newDet : det);

          let rowHtml = `<tr class="pfmea-row-sub">`;
          if (ei === 0 && ci === 0) {
            rowHtml += `<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdMode(${mi},'mode',this.value)" placeholder="Failure mode">${esc(mode.mode)}</textarea>
              <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">
                <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddEffect(${mi})">＋ Effect</button>
                <button class="del-btn" onclick="pfDelMode(${mi})" style="font-size:9px">×</button>
              </div></td>`;
          }
          if (ci === 0) {
            rowHtml += `<td rowspan="${efRowspan}" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdEffect(${mi},${ei},'effect',this.value)" placeholder="Effect">${esc(ef.effect)}</textarea>
              <div style="margin-top:3px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" onclick="pfAddCause(${mi},${ei})">＋ Cause</button>
                <button class="del-btn" onclick="pfDelEffect(${mi},${ei})" style="font-size:9px">×</button>
              </div></td>
            <td rowspan="${efRowspan}" style="text-align:center;vertical-align:top;padding-top:6px">
              <input type="number" class="cell-edit mono" min="1" max="10" value="${sev}" oninput="pfUpdEffect(${mi},${ei},'sev',+this.value);pfLiveRPN(${mi},${ei},-1)" style="width:30px;text-align:center;font-weight:700"></td>`;
          }

          rowHtml += `
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'cause',this.value)" placeholder="Root cause">${esc(ca.cause)}</textarea></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><input type="number" class="cell-edit mono" min="1" max="10" value="${occ}" oninput="pfUpdCause(${mi},${ei},${ci},'occ',+this.value);pfLiveRPN(${mi},${ei},${ci})" style="width:30px;text-align:center"></td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'prevent',this.value)" placeholder="Prevention">${esc(ca.prevent || '')}</textarea></td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCause(${mi},${ei},${ci},'detect',this.value)" placeholder="Detection">${esc(ca.detect || '')}</textarea></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><input type="number" class="cell-edit mono" min="1" max="10" value="${det}" oninput="pfUpdCause(${mi},${ei},${ci},'det',+this.value);pfLiveRPN(${mi},${ei},${ci})" style="width:30px;text-align:center"></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><span id="rpn_${mi}_${ei}_${ci}" class="rpn ${rpnCls}">${rpn}</span></td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCauseAction(${mi},${ei},${ci},'desc',this.value)" placeholder="Action" style="background:${act.desc ? '#eff6ff' : ''}">${esc(act.desc || '')}</textarea></td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize onchange="pfUpdCauseAction(${mi},${ei},${ci},'taken',this.value)" placeholder="Taken">${esc(act.taken || '')}</textarea></td>
            <td><input class="cell-edit" value="${esc(act.owner || '')}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'owner',this.value)" placeholder="Owner"></td>
            <td><input type="date" class="cell-edit mono" value="${esc(act.due || '')}" onchange="pfUpdCauseAction(${mi},${ei},${ci},'due',this.value)" style="font-size:11px"></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><input type="number" class="cell-edit mono" min="1" max="10" value="${act.newOcc || ''}" oninput="pfUpdCauseAction(${mi},${ei},${ci},'newOcc',this.value);pfLiveForecast(${mi},${ei},${ci})" style="width:30px;text-align:center"></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><input type="number" class="cell-edit mono" min="1" max="10" value="${act.newDet || ''}" oninput="pfUpdCauseAction(${mi},${ei},${ci},'newDet',this.value);pfLiveForecast(${mi},${ei},${ci})" style="width:30px;text-align:center"></td>
            <td style="text-align:center;vertical-align:top;padding-top:6px"><span id="forecast_${mi}_${ei}_${ci}" class="rpn ${hasAction ? rpnCls : 'rpn-lo'}" style="opacity:${hasAction ? '1' : '0'}">${hasAction ? forecast : '—'}</span></td>
            <td style="text-align:center;vertical-align:top;padding-top:4px"><button class="btn btn-sm btn-green" onclick="pfImplementAction(${mi},${ei},${ci})">Apply</button></td>
            <td style="text-align:center"><button class="del-btn" onclick="pfDelCause(${mi},${ei},${ci})">×</button></td>
          </tr>`;
          html += rowHtml;
        });
      });
    });
    html += `<tr><td colspan="18"><div class="pfmea-add-row" onclick="pfAddMode('${s.id}')">＋ Add failure mode for Step ${s.stepNum}</div></td></tr>`;
  });

  html += '</tbody></table></div>';
  
  const burndownCard = p.pfmea.length > 0 ? `
    <div class="card" style="margin-bottom:18px;padding:14px 16px 16px">
      <div class="card-title" style="margin-bottom:12px">📉 RPN Burndown</div>
      ${renderRpnBurndown(false)}
    </div>` : '';

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div></div></div>
  ${burndownCard}
  <div class="card">${html}</div>`;
}

// ── PFMEA Mutators ──
function pfAddMode(pfdId) { prog().pfmea.push({ id: 'f_' + Date.now(), pfdId, mode: '', effects: [{ id: 'e_' + Date.now(), effect: '', sev: 1, causes: [{ id: 'c_' + Date.now(), cause: '', occ: 1, det: 1 }] }] }); save(); render(); }
function pfUpdMode(mi, f, v) { prog().pfmea[mi][f] = v; save(); }
function pfDelMode(mi) { prog().pfmea.splice(mi, 1); save(); render(); }
function pfAddEffect(mi) { prog().pfmea[mi].effects.push({ id: 'e_' + Date.now(), effect: '', sev: 1, causes: [{ id: 'c_' + Date.now(), cause: '', occ: 1, det: 1 }] }); save(); render(); }
function pfUpdEffect(mi, ei, f, v) { prog().pfmea[mi].effects[ei][f] = v; save(); }
function pfDelEffect(mi, ei) { prog().pfmea[mi].effects.splice(ei, 1); save(); render(); }
function pfAddCause(mi, ei) { prog().pfmea[mi].effects[ei].causes.push({ id: 'c_' + Date.now(), cause: '', occ: 1, det: 1 }); save(); render(); }
function pfUpdCause(mi, ei, ci, f, v) { prog().pfmea[mi].effects[ei].causes[ci][f] = v; save(); }
function pfDelCause(mi, ei, ci) { prog().pfmea[mi].effects[ei].causes.splice(ci, 1); save(); render(); }
function pfUpdCauseAction(mi, ei, ci, f, v) { const ca = prog().pfmea[mi].effects[ei].causes[ci]; if (!ca.action) ca.action = {}; ca.action[f] = v; save(); }

function pfLiveRPN(mi, ei, ci) {
  const ef = prog().pfmea[mi].effects[ei];
  const targets = ci === -1 ? ef.causes : [ef.causes[ci]];
  targets.forEach((ca, idx) => {
    const rpn = (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1);
    const el = document.getElementById(`rpn_${mi}_${ei}_${ci === -1 ? idx : ci}`);
    if (el) { el.textContent = rpn; el.className = 'rpn ' + (rpn >= 200 ? 'rpn-hi' : rpn >= 100 ? 'rpn-md' : 'rpn-lo'); }
  });
}

function pfLiveForecast(mi, ei, ci) {
  const ef = prog().pfmea[mi].effects[ei]; const ca = ef.causes[ci]; const act = ca.action || {};
  const forecast = (ef.sev || 1) * (act.newOcc ? +act.newOcc : ca.occ) * (act.newDet ? +act.newDet : ca.det);
  const el = document.getElementById(`forecast_${mi}_${ei}_${ci}`);
  if (el) { el.textContent = forecast; el.className = 'rpn ' + (forecast >= 200 ? 'rpn-hi' : forecast >= 100 ? 'rpn-md' : 'rpn-lo'); }
}

function pfImplementAction(mi, ei, ci) {
  const ca = prog().pfmea[mi].effects[ei].causes[ci]; const act = ca.action || {};
  if (act.newOcc) ca.occ = +act.newOcc;
  if (act.newDet) ca.det = +act.newDet;
  ca.action = {}; save(); render();
}

// Legacy compat
function calcRPN(r) { return (r.sev || 1) * (r.occ || 1) * (r.det || 1); }
