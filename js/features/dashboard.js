/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DASHBOARD.JS
 * Purpose: Handles project listing, the main project dashboard, and RPN analytics.
 * Dependencies: state.js, helpers.js, navigation.js, gates.js
 * ══════════════════════════════════════════════════════════════════════════════
 */

/**
 * BLOCK 1: RPN ANALYTICS & VISUALIZATION
 * Calculates and renders the RPN Burndown SVG chart showing Original vs. Current RPN.
 */
function renderRpnBurndown(compact) {
  const p = prog();
  if (!p.pfmea || p.pfmea.length === 0) {
    return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No PFMEA rows yet — add failure modes to see RPN chart.</div>`;
  }

  let totalOriginal = 0, totalCurrent = 0, rowCount = 0, rowsImproved = 0;

  p.pfmea.forEach(mode => {
    (mode.effects || []).forEach(ef => {
      const sev = ef.sev || 1;
      (ef.causes || []).forEach(ca => {
        const curOcc = ca.occ || 1;
        const curDet = ca.det || 1;
        const currentRPN = sev * curOcc * curDet;
        let originalRPN = currentRPN;
        if (ca.history && ca.history.length > 0) {
          originalRPN = ca.history[0].rpn || currentRPN;
        }
        totalOriginal += originalRPN;
        totalCurrent += currentRPN;
        rowCount++;
        if (currentRPN < originalRPN) rowsImproved++;
      });
    });
  });

  if (rowCount === 0) return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No cause rows found.</div>`;

  const reduction = totalOriginal > 0 ? Math.round((1 - totalCurrent / totalOriginal) * 100) : 0;
  const maxRPN = Math.max(totalOriginal, totalCurrent, 1);
  const vbW = 1000, labelW = compact ? 0 : 130, chartX = compact ? 0 : labelW;
  const chartW = vbW - chartX - 60, barH = compact ? 32 : 40, gap = compact ? 16 : 20;
  const svgH = barH * 2 + gap + (compact ? 0 : 28);

  const origBarW = Math.round((totalOriginal / maxRPN) * chartW);
  const currBarW = Math.round((totalCurrent / maxRPN) * chartW);
  const currFill = totalCurrent < totalOriginal ? '#22c55e' : totalCurrent === totalOriginal ? '#94a3b8' : '#ef4444';

  let bars = '';
  if (!compact) {
    bars += `<text x="${labelW - 8}" y="${barH / 2 + 5}" text-anchor="end" font-size="12" font-weight="600" fill="var(--mid)" font-family="IBM Plex Sans,sans-serif">Original</text>`;
    bars += `<text x="${labelW - 8}" y="${barH + gap + barH / 2 + 5}" text-anchor="end" font-size="12" font-weight="600" fill="var(--mid)" font-family="IBM Plex Sans,sans-serif">Current</text>`;
  }
  bars += `<rect x="${chartX}" y="0" width="${origBarW}" height="${barH}" rx="4" fill="#94a3b8" opacity="0.5"/>`;
  bars += `<text x="${chartX + origBarW + 8}" y="${barH / 2 + 5}" font-size="${compact ? 14 : 16}" font-weight="700" fill="var(--mid)" font-family="IBM Plex Mono,monospace">${totalOriginal}</text>`;
  bars += `<rect x="${chartX}" y="${barH + gap}" width="${currBarW}" height="${barH}" rx="4" fill="${currFill}" opacity="0.7"/>`;
  bars += `<text x="${chartX + currBarW + 8}" y="${barH + gap + barH / 2 + 5}" font-size="${compact ? 14 : 16}" font-weight="700" fill="${currFill}" font-family="IBM Plex Mono,monospace">${totalCurrent}</text>`;

  return `<svg viewBox="0 0 ${vbW} ${svgH}" style="width:100%; height:auto; max-height:${compact ? 72 : 100}px; display:block;">${bars}</svg>`;
}

/**
 * BLOCK 2: PROJECTS LIST (HOME SCREEN)
 */
function renderProjects() {
  const user = currentUser ? currentUser.email.split('@')[0] : '';
  let html = `<div class="proj-home">
    <div class="proj-home-header">
      <div>
        <div class="proj-home-title">Projects</div>
        <div class="proj-home-sub">Signed in as ${esc(user)}</div>
      </div>
      <button class="btn btn-primary" onclick="showModal('modalNewProj')">＋ New Project</button>
    </div>`;

  if (db.programmes.length === 0) {
    html += `<div style="text-align:center;padding:80px 20px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:16px">📋</div>
      <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No projects yet</div>
      <button class="btn btn-primary" onclick="showModal('modalNewProj')">＋ New Project</button>
    </div>`;
  } else {
    FAMILIES.forEach(fam => {
      const projs = db.programmes.filter(p => (p.family || 'Other') === fam.id);
      if (projs.length === 0) return;
      html += `<div class="proj-family-group">
        <div class="proj-family-label"><span>${fam.icon}</span>${fam.label}</div>
        <div class="proj-cards">`;
      projs.forEach(p => {
        const curGate = (p.gates || []).findIndex(g => !gateAllSigned(g));
        const overdueAct = (p.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
        const rag = overdueAct > 0 ? 'r' : 'g';
        html += `<div class="proj-card" onclick="openProject('${p.id}')">
          <div class="proj-card-name">${esc(p.name)}</div>
          <div class="proj-card-meta"><span>👤 ${esc(p.customer || 'Internal')}</span> <span>🚂 ${esc(p.unit || '—')}</span></div>
          <div class="proj-card-gate"><span class="proj-card-gate-label">GATE ${curGate >= 0 ? curGate : '✓'}</span></div>
          <div class="proj-card-footer"><span><span class="proj-rag proj-rag-${rag}"></span>${overdueAct > 0 ? 'Action Required' : 'On Track'}</span></div>
        </div>`;
      });
      html += `<div class="proj-add-card" onclick="newProjectInFamily('${fam.id}')">＋ Add ${fam.label}</div></div></div>`;
    });
  }
  return html + `</div>`;
}

/**
 * BLOCK 3: MAIN DASHBOARD RENDERING
 * Now uses "dashboard-wrapper" to match page margins.
 */
function renderDashboard() {
  const p = prog();
  const openAct = p.actions.filter(a => a.status !== 'Closed').length;
  const overdueAct = p.actions.filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
  const highRPN = p.pfmea.filter(r => calcRPN(r) >= 100).length;
  const gatesDone = p.gates.filter(g => gateAllSigned(g)).length;
  const curGate = p.gates.findIndex(g => !gateAllSigned(g));
  const famIcon = FAMILIES.find(f => f.id === (p.family || 'Other'))?.icon || '📋';

  const gateStrip = GATE_DEFS.map((g, i) => {
    const gd = p.gates[i] || {};
    const signed = gateAllSigned(gd);
    const done = (gd.checks || []).filter(Boolean).length; 
    const pct = g.items.length > 0 ? Math.round(done / g.items.length * 100) : 0;
    const dotCls = signed ? 'gs-signed' : done > 0 ? 'gs-open' : 'gs-pending';
    const nodeBg = signed ? 'background:var(--green-pale)' : done > 0 ? 'background:var(--amber-pale)' : '';
    
    return `<div class="gate-node" style="${nodeBg}" onclick="navigate('gate_${g.num}')">
      <div class="gate-node-num">Gate ${g.num}</div>
      <div class="gate-node-name">${g.name}</div>
      <div style="display:flex;align-items:center;gap:5px;margin-top:5px">
        <div class="gate-status-dot ${dotCls}"></div>
        <span style="font-size:10px;color:var(--muted)">${pct}%</span>
      </div>
    </div>`;
  }).join('');

const sections = [
  { id: 'timing',  icon: '📅', title: 'NPI Timing Plan',    desc: 'Planned vs Actual Timeline', color: 'var(--teal)'   },
  { id: 'apqp',    icon: '📐', title: 'APQP Hub',           desc: 'CTQ · PFD · PFMEA · Control Plan', color: 'var(--purple)' },
  { id: 'bom',     icon: '📦', title: 'Bill of Materials',   desc: 'Parts · Tools · Equipment · Kits', color: 'var(--navy)' },
  { id: 'actions', icon: '✅', title: 'Action Tracker',     desc: 'Project Task List', color: overdueAct > 0 ? 'var(--red)' : 'var(--amber)' },
];

  const launcherHTML = sections.map(s =>
    `<div class="section-card" onclick="navigate('${s.id}')" style="--sc-color:${s.color}">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${s.color}">${s.icon} ${s.title}</div>
    </div>`
  ).join('');

  const subAsmHTML = (p.subAssemblies || []).map(link => {
    const sp = db.programmes.find(x => x.id === link.id);
    if (!sp) return '';
    const sgDone = (sp.gates || []).filter(g => gateAllSigned(g)).length;
    return `<div class="sub-asm-card" onclick="progId='${sp.id}';navigate('project')">
      <div class="sub-asm-card-name">${esc(sp.name)}</div>
      <div class="sub-asm-gate-bar"><div class="sub-asm-gate-fill" style="width:${Math.round(sgDone/6*100)}%"></div></div>
    </div>`;
  }).join('') + `<div class="sub-asm-add-card" onclick="openSubAsmModal()">＋ Link sub-assembly</div>`;

  return `
  <div class="dashboard-wrapper">
    <div class="dash-hero">
      <div style="flex:1">
        <div class="dash-prog-name"><span>${famIcon}</span> ${esc(p.name)}</div>
        <div class="dash-prog-meta">
          <div class="meta-pill">👤 <strong>${esc(p.customer || 'Internal')}</strong></div>
          <div class="meta-pill">🚂 <strong>${esc(p.unit || 'No Unit')}</strong></div>
          <div class="meta-pill status-pill">📍 <strong>Gate ${curGate >= 0 ? curGate : '✓'}</strong></div>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="showEditProject()">✎ Edit Project</button>
    </div>

    <div class="dash-body">
      <div class="kpi-grid">
        <div class="kpi-card" style="--kpi-color:var(--green)"><div class="kpi-num">${gatesDone}/6</div><div class="kpi-label">Gates Signed</div></div>
        <div class="kpi-card" style="--kpi-color:var(--amber)"><div class="kpi-num">${openAct}</div><div class="kpi-label">Open Actions</div></div>
        <div class="kpi-card" style="--kpi-color:var(--red)"><div class="kpi-num">${highRPN}</div><div class="kpi-label">High RPN</div></div>
      </div>
      <div class="gate-strip-label">Gate Progress</div>
      <div class="gate-strip">${gateStrip}</div>
      <div class="section-launcher">${launcherHTML}</div>
      <div class="dash-split-row">
        <div class="dash-split-col"><h4>Sub-assemblies</h4><div class="sub-asm-grid">${subAsmHTML}</div></div>
        <div class="dash-split-col"><h4>RPN Burndown</h4><div class="rpn-chart-container">${renderRpnBurndown(true)}</div></div>
      </div>
    </div>
  </div>`;
}

/**
 * BLOCK 4: PROJECT MANAGEMENT & UTILS
 */
function openProject(id) { progId = id; navigate('project'); }

function showEditProject() {
  const p = prog(); if (!p) return;
  document.getElementById('ep_name').value = p.name || '';
  document.getElementById('ep_customer').value = p.customer || '';
  document.getElementById('ep_unit').value = p.unit || '';
  showModal('modalEditProj');
}

function saveEditProject() {
  const p = prog(); if (!p) return;
  p.name = document.getElementById('ep_name').value.trim();
  p.customer = document.getElementById('ep_customer').value.trim();
  p.unit = document.getElementById('ep_unit').value.trim();
  save(); closeModal('modalEditProj'); render();
}

function openSubAsmModal() {
  /* ... existing logic for linking sub-assemblies ... */
}
