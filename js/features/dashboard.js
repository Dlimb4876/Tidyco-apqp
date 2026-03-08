// ═══════════════════════════════════
// dashboard.js — Project home and KPI dashboard rendering
// Depends on: state.js, helpers.js, navigation.js, gates.js (gateAllSigned, calcRPN)
// ═══════════════════════════════════

// ── Shared: RPN Burndown Chart (used on Dashboard and PFMEA page) ─────────────
function renderRpnBurndown(compact) {
  const p = prog();
  if (!p.pfmea || p.pfmea.length === 0) {
    return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No PFMEA rows yet — add failure modes to see RPN chart.</div>`;
  }

  // Collect all cause rows with original and current RPN
  const rows = [];
  p.pfmea.forEach((mode, mi) => {
    (mode.effects || []).forEach((ef, ei) => {
      const sev = ef.sev || 1;
      (ef.causes || []).forEach((ca, ci) => {
        const curOcc = ca.occ || 1;
        const curDet = ca.det || 1;
        const currentRPN = sev * curOcc * curDet;

        // Original RPN = earliest history entry's RPN, else current if no history
        let originalRPN = currentRPN;
        if (ca.history && ca.history.length > 0) {
          originalRPN = ca.history[0].rpn || currentRPN;
        }

        const label = (mode.mode || 'Mode').slice(0, 24) + (ci > 0 ? ` (C${ci+1})` : '');
        rows.push({ label, originalRPN, currentRPN, mi, ei, ci });
      });
    });
  });

  if (rows.length === 0) {
    return compact ? '' : `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No cause rows found.</div>`;
  }

  // Totals for summary
  const totalOriginal = rows.reduce((n, r) => n + r.originalRPN, 0);
  const totalCurrent  = rows.reduce((n, r) => n + r.currentRPN, 0);
  const reduction     = totalOriginal > 0 ? Math.round((1 - totalCurrent / totalOriginal) * 100) : 0;
  const rowsImproved  = rows.filter(r => r.currentRPN < r.originalRPN).length;

  // Colour helpers
  function rpnFill(rpn) {
    if (rpn >= 200) return '#ef4444';
    if (rpn >= 100) return '#f59e0b';
    if (rpn >= 50)  return '#fcd34d';
    return '#4ade80';
  }

  // Sort rows by originalRPN descending for visibility
  const sorted = [...rows].sort((a, b) => b.originalRPN - a.originalRPN);

  // Determine bar chart scale
  const maxRPN = Math.max(...sorted.map(r => Math.max(r.originalRPN, r.currentRPN)), 1);

  // Build the SVG bar chart
  const barH    = compact ? 20 : 22;
  const gap     = compact ? 4  : 6;
  const labelW  = compact ? 0  : 180;
  const chartW  = compact ? 320 : 480;
  const totalH  = sorted.length * (barH + gap);
  const svgH    = totalH + 32; // room for x-axis labels

  // In compact mode (dashboard widget) show top 8 only
  const visible = compact ? sorted.slice(0, 8) : sorted;
  const visH    = visible.length * (barH + gap) + 32;

  let bars = '';
  visible.forEach((r, idx) => {
    const y       = idx * (barH + gap);
    const origW   = Math.round((r.originalRPN / maxRPN) * chartW);
    const currW   = Math.round((r.currentRPN  / maxRPN) * chartW);
    const origCol = rpnFill(r.originalRPN);
    const currCol = rpnFill(r.currentRPN);
    const improved = r.currentRPN < r.originalRPN;

    // Original bar (full width, semi-transparent)
    bars += `<rect x="0" y="${y}" width="${origW}" height="${barH}" rx="3" fill="${origCol}" opacity="0.28"/>`;
    // Current bar (solid)
    bars += `<rect x="0" y="${y}" width="${currW}" height="${barH}" rx="3" fill="${currCol}" opacity="0.9"/>`;

    // RPN labels inside/outside bars
    const origLabel = r.originalRPN;
    const currLabel = r.currentRPN;

    if (!compact) {
      // Label: failure mode name on left side
      bars += `<text x="-6" y="${y + barH/2 + 4}" text-anchor="end" font-size="10" fill="var(--mid)" font-family="IBM Plex Sans,sans-serif" style="white-space:nowrap">${escSvg(r.label)}</text>`;
    }

    // Original RPN (ghost number at end of original bar)
    if (origW > 24) {
      bars += `<text x="${origW - 4}" y="${y + barH/2 + 4}" text-anchor="end" font-size="9" fill="${origCol}" opacity="0.8" font-family="IBM Plex Mono,monospace" font-weight="600">${origLabel}</text>`;
    }

    // Current RPN (solid number)
    if (currW > 20) {
      bars += `<text x="${currW - 4}" y="${y + barH/2 + 4}" text-anchor="end" font-size="10" fill="white" font-family="IBM Plex Mono,monospace" font-weight="700">${currLabel}</text>`;
    } else {
      bars += `<text x="${currW + 5}" y="${y + barH/2 + 4}" text-anchor="start" font-size="10" fill="${currCol}" font-family="IBM Plex Mono,monospace" font-weight="700">${currLabel}</text>`;
    }

    // Arrow / delta indicator
    if (improved) {
      const arrow_x = Math.max(currW + 5, 8);
      bars += `<text x="${chartW + 6}" y="${y + barH/2 + 4}" font-size="9" fill="var(--green)" font-family="IBM Plex Mono,monospace">↓${origLabel - currLabel}</text>`;
    }
  });

  // X-axis tick marks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const tx = Math.round(t * chartW);
    const val = Math.round(t * maxRPN);
    return `<line x1="${tx}" y1="0" x2="${tx}" y2="${visible.length * (barH + gap)}" stroke="var(--line)" stroke-width="1"/>
            <text x="${tx}" y="${visible.length * (barH + gap) + 14}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="IBM Plex Mono,monospace">${val}</text>`;
  }).join('');

  const svgWidth  = compact ? (chartW + 50) : (labelW + chartW + 70);
  const svgHeight = visible.length * (barH + gap) + 28;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width:${svgWidth}px;display:block">
    <g transform="translate(${compact ? 0 : labelW},0)">
      ${ticks}
      ${bars}
    </g>
  </svg>`;

  // Legend
  const legend = `<div style="display:flex;align-items:center;gap:16px;font-size:10px;color:var(--muted);margin-top:10px;flex-wrap:wrap">
    <span style="display:flex;align-items:center;gap:5px"><span style="width:24px;height:10px;background:#6b7280;opacity:.3;border-radius:2px;display:inline-block"></span> Original RPN (ghost)</span>
    <span style="display:flex;align-items:center;gap:5px"><span style="width:24px;height:10px;background:#6b7280;border-radius:2px;display:inline-block"></span> Current RPN</span>
    <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#4ade80;border-radius:2px;display:inline-block"></span>&lt;50</span>
    <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#fcd34d;border-radius:2px;display:inline-block"></span>50–99</span>
    <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#f59e0b;border-radius:2px;display:inline-block"></span>100–199</span>
    <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px;display:inline-block"></span>≥200</span>
  </div>`;

  if (compact) {
    // Dashboard compact view — summary stats + small chart
    const moreRows = sorted.length > 8 ? `<div style="text-align:center;font-size:10px;color:var(--muted);margin-top:4px">+ ${sorted.length - 8} more rows — view PFMEA for full chart</div>` : '';
    return `<div style="padding:0 14px 14px">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div style="flex:1;background:var(--bg);border-radius:7px;padding:10px 12px;text-align:center">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:var(--ink)">${totalOriginal}</div>
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Original Total</div>
        </div>
        <div style="flex:1;background:var(--bg);border-radius:7px;padding:10px 12px;text-align:center">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:${totalCurrent < totalOriginal ? 'var(--green)' : 'var(--ink)'}">${totalCurrent}</div>
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Current Total</div>
        </div>
        <div style="flex:1;background:${reduction > 0 ? 'var(--green-pale)' : 'var(--bg)'};border-radius:7px;padding:10px 12px;text-align:center">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:${reduction > 0 ? 'var(--green)' : 'var(--muted)'}">${reduction > 0 ? '↓' : ''}${reduction}%</div>
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Reduction</div>
        </div>
        <div style="flex:1;background:var(--bg);border-radius:7px;padding:10px 12px;text-align:center">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:var(--blue)">${rowsImproved}</div>
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Rows Improved</div>
        </div>
      </div>
      <div style="overflow-x:auto">${svg}</div>
      ${moreRows}
    </div>`;
  }

  // Full view (PFMEA page)
  return `<div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="kpi-card" style="--kpi-color:var(--ink);flex:1;min-width:100px;cursor:default">
        <div class="kpi-num" style="font-size:22px">${totalOriginal}</div>
        <div class="kpi-label">Original Total RPN</div>
      </div>
      <div class="kpi-card" style="--kpi-color:${totalCurrent < totalOriginal ? 'var(--green)' : 'var(--amber)'};flex:1;min-width:100px;cursor:default">
        <div class="kpi-num" style="font-size:22px;color:${totalCurrent < totalOriginal ? 'var(--green)' : 'var(--amber)'}">${totalCurrent}</div>
        <div class="kpi-label">Current Total RPN</div>
      </div>
      <div class="kpi-card" style="--kpi-color:${reduction > 0 ? 'var(--green)' : 'var(--muted)'};flex:1;min-width:100px;cursor:default">
        <div class="kpi-num" style="font-size:22px;color:${reduction > 0 ? 'var(--green)' : 'var(--muted)'}">${reduction > 0 ? '↓' : ''}${reduction}%</div>
        <div class="kpi-label">Total Reduction</div>
      </div>
      <div class="kpi-card" style="--kpi-color:var(--blue);flex:1;min-width:100px;cursor:default">
        <div class="kpi-num" style="font-size:22px">${rowsImproved}<span style="font-size:13px;color:var(--muted)">/${rows.length}</span></div>
        <div class="kpi-label">Rows Improved</div>
      </div>
    </div>
    <div style="overflow-x:auto;padding-bottom:4px">${svg}</div>
    ${legend}
    ${sorted.length > 12 ? `<div style="font-size:10px;color:var(--muted);margin-top:8px">Showing all ${sorted.length} cause rows, sorted by original RPN descending.</div>` : ''}
  </div>`;
}

// SVG-safe escape (no quotes/tags in SVG text)
function escSvg(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Projects list ─────────────────────────────────────────────
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
      <div style="font-size:13px;margin-bottom:24px">Create your first project to get started</div>
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
        const gates      = p.gates || [];
        const curGate    = gates.findIndex(g => !gateAllSigned(g));
        const gatesDone  = gates.filter(g => gateAllSigned(g)).length;
        const openAct    = (p.actions || []).filter(a => a.status !== 'Closed').length;
        const overdueAct = (p.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
        const highRPN    = (p.pfmea || []).filter(r => calcRPN(r) >= 100).length;
        const rag        = overdueAct > 0 || highRPN > 0 ? 'r' : openAct > 0 ? 'a' : 'g';
        const ragLabel   = rag === 'r' ? 'Needs Attention' : rag === 'a' ? 'In Progress' : 'On Track';
        const pips       = GATE_DEFS.map((g, i) => {
          const gd  = gates[i];
          const cls = gd && gateAllSigned(gd) ? 'done' : i === curGate ? 'active' : '';
          return `<div class="proj-gate-pip ${cls}" title="Gate ${g.num}: ${g.name}"></div>`;
        }).join('');
        const lastSaved = p.updated_at
          ? new Date(p.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—';
        html += `<div class="proj-card" onclick="openProject('${p.id}')">
          <div class="proj-card-name">${esc(p.name)}</div>
          <div class="proj-card-meta">
            ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''}
            ${p.unit     ? `<span>🚂 ${esc(p.unit)}</span>`     : ''}
            ${p.lead     ? `<span>🧑‍💼 ME: ${esc(p.lead)}</span>` : ''}
            ${p.pm       ? `<span>📋 PM: ${esc(p.pm)}</span>`   : ''}
          </div>
          <div class="proj-card-gate">
            <span class="proj-card-gate-label">GATE ${curGate >= 0 ? curGate : '✓'}</span>
            ${pips}
          </div>
          <div class="proj-card-footer">
            <span><span class="proj-rag proj-rag-${rag}"></span>${ragLabel}</span>
            <span>${gatesDone}/6 gates · ${lastSaved}</span>
          </div>
        </div>`;
      });
      html += `<div class="proj-add-card" onclick="newProjectInFamily('${fam.id}')">＋ Add ${fam.label} project</div>`;
      html += `</div></div>`;
    });
  }
  html += `</div>`;
  return html;
}

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
  const p          = prog();
  const openAct    = p.actions.filter(a => a.status !== 'Closed').length;
  const overdueAct = p.actions.filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
  const highRisks  = p.risks.filter(r => r.lik * r.imp >= 12 && r.status !== 'Closed').length;
  const highRPN    = p.pfmea.filter(r => calcRPN(r) >= 100).length;
  const gatesDone  = p.gates.filter(g => gateAllSigned(g)).length;
  const curGate    = p.gates.findIndex(g => !gateAllSigned(g));
  const aaw        = [...p.bom.parts, ...p.bom.mat, ...p.bom.cons].filter(x => x.isAaw).length;
  const gantt      = p.gantt || [];
  const timingTotal  = gantt.length;
  const timingFilled = gantt.filter(r => r.weeks && r.weeks.some(w => w > 0)).length;
  const timingRed    = 0;
  const timingAmber  = 0;
  const timingGreen  = timingFilled;

  let alerts = '';
  if (overdueAct > 0)    alerts += `<div class="alert-item alert-red">🔴 <strong>${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}</strong><button class="btn btn-sm" style="margin-left:auto;background:var(--red);color:white;border:none" onclick="navigate('actions')">View →</button></div>`;
  if (timingRed > 0)     alerts += `<div class="alert-item alert-red">🔴 <strong>${timingRed} red item${timingRed !== 1 ? 's' : ''} in timing plan</strong> — recovery plan required<button class="btn btn-sm" style="margin-left:auto;background:var(--red);color:white;border:none" onclick="navigate('timing')">View →</button></div>`;
  if (timingAmber > 0 && timingRed === 0) alerts += `<div class="alert-item alert-amber">⚠ <strong>${timingAmber} amber item${timingAmber !== 1 ? 's' : ''} in timing plan</strong><button class="btn btn-sm" style="margin-left:auto;background:var(--amber);color:white;border:none" onclick="navigate('timing')">View →</button></div>`;
  if (highRisks > 0)     alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}</strong><button class="btn btn-sm" style="margin-left:auto;background:var(--amber);color:white;border:none" onclick="navigate('risks')">View →</button></div>`;
  if (highRPN > 0)       alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRPN} PFMEA row${highRPN !== 1 ? 's' : ''} RPN ≥ 100</strong><button class="btn btn-sm" style="margin-left:auto;background:var(--amber);color:white;border:none" onclick="navigate('apqp')">View →</button></div>`;

  const gateStrip = GATE_DEFS.map(g => {
    const gd         = p.gates[g.num];
    const pct        = Math.round(gd.checks.filter(Boolean).length / g.items.length * 100);
    const signed     = gateAllSigned(gd);
    const hasActivity = gd.checks.some(Boolean) || gd.sigs.some(s => s.signed);
    const dotCls     = signed ? 'gs-signed' : hasActivity ? 'gs-open' : 'gs-pending';
    const labelCol   = signed ? 'var(--green)' : hasActivity ? 'var(--amber)' : 'var(--muted)';
    const nodeBg     = signed ? 'background:var(--green-pale)' : hasActivity ? 'background:var(--amber-pale)' : '';
    return `<div class="gate-node" style="${nodeBg}" onclick="navigate('gate_${g.num}')" title="Open Gate ${g.num}: ${g.name}">
      <div class="gate-node-num" style="color:${labelCol}">Gate ${g.num}</div>
      <div class="gate-node-name">${g.name}</div>
      <div style="display:flex;align-items:center;gap:5px;margin-top:5px">
        <div class="gate-status-dot ${dotCls}"></div>
        <span style="font-size:10px;color:var(--muted);font-family:'IBM Plex Mono',monospace">${pct}%</span>
        ${signed ? '<span style="font-size:9px;font-weight:700;color:var(--green);margin-left:auto;font-family:\'IBM Plex Mono\',monospace">✓</span>' : ''}
      </div>
    </div>`;
  }).join('');

  const totalBomItems = Object.keys(BOM_TYPES).reduce((n, k) => n + p.bom[k].length, 0);
  const sections = [
    { id: 'timing',  icon: '📅', title: 'NPI Timing Plan',    desc: `${timingTotal} rows · ${timingFilled} with activity`, color: 'var(--teal)'   },
    { id: 'apqp',    icon: '📐', title: 'APQP',               desc: 'CTQ · PFD · PFMEA · Control Plan',                   color: 'var(--purple)' },
    { id: 'bom',     icon: '📦', title: 'Bill of Materials',   desc: `${totalBomItems} items · ${p.bom.kits.length} kits · ${aaw} AAW`, color: 'var(--navy)' },
    { id: 'actions', icon: '✅', title: 'Actions',             desc: `${openAct} open${overdueAct > 0 ? ' · ' + overdueAct + ' overdue' : ''}`, color: overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)' },
    { id: 'risks',   icon: '🛡', title: 'Risk Register',       desc: `${p.risks.filter(r => r.status !== 'Closed').length} open · ${highRisks} high`, color: highRisks > 0 ? 'var(--red)' : 'var(--blue)' },
  ];

  if (!p.subAssemblies) p.subAssemblies = [];
  const subAsmHTML = (() => {
    const cards = p.subAssemblies.map((link, li) => {
      const sp = db.programmes.find(x => x.id === link.id);
      if (!sp) return '';
      const sg       = sp.gates || [];
      const sgDone   = sg.filter(g => g.signed).length;
      const sgTotal  = sg.length || 6;
      const curGateSA = sg.findIndex(g => !g.signed);
      const gLabel   = curGateSA < 0 ? 'Complete' : `Gate ${curGateSA}`;
      const gatePct  = Math.round((sgDone / sgTotal) * 100);
      const saOpen   = (sp.actions || []).filter(a => a.status !== 'Closed').length;
      const saOverdue = (sp.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
      const saRisks  = (sp.risks || []).filter(r => r.status !== 'Closed').length;
      const saHighR  = (sp.risks || []).filter(r => r.status !== 'Closed' && r.lik * r.imp >= 12).length;
      const saHighRPN = (sp.pfmea || []).reduce((n, m) => n + (m.effects || []).reduce((en, e) => en + (e.causes || []).filter(c => (e.sev || 1) * (c.occ || 1) * (c.det || 1) >= 100).length, 0), 0);
      return `<div class="sub-asm-card" onclick="progId='${sp.id}';navigate('project')">
        <button class="sub-asm-unlink" onclick="event.stopPropagation();unlinkSubAsm(${li})" title="Unlink sub-assembly">✕</button>
        <div class="sub-asm-card-head">
          <div>
            <div class="sub-asm-card-name">🔩 ${esc(sp.name)}</div>
            ${sp.unit ? `<div class="sub-asm-card-unit">🚂 ${esc(sp.unit)}</div>` : ''}
          </div>
        </div>
        <div class="sub-asm-stats">
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:var(--green)">${sgDone}<span style="font-size:10px;color:var(--muted)">/${sgTotal}</span></span><span class="sub-asm-stat-lbl">Gates</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saOverdue > 0 ? 'var(--red)' : saOpen > 0 ? 'var(--amber)' : 'var(--green)'}">${saOpen}</span><span class="sub-asm-stat-lbl">Actions${saOverdue > 0 ? ` (${saOverdue} OD)` : ''}</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saHighR > 0 ? 'var(--red)' : 'var(--ink)'}">${saRisks}</span><span class="sub-asm-stat-lbl">Risks${saHighR > 0 ? ` (${saHighR} hi)` : ''}</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saHighRPN > 0 ? 'var(--amber)' : 'var(--ink)'}">${saHighRPN}</span><span class="sub-asm-stat-lbl">High RPN</span></div>
        </div>
        <div>
          <div class="sub-asm-gate-bar"><div class="sub-asm-gate-fill" style="width:${gatePct}%"></div></div>
          <div class="sub-asm-gate-label">${gLabel} · ${gatePct}%</div>
        </div>
      </div>`;
    }).filter(Boolean).join('');
    const addCard = `<div class="sub-asm-add-card" onclick="openSubAsmModal()"><span style="font-size:16px">＋</span> Link sub-assembly project</div>`;
    return `<div class="sub-asm-grid">${cards}${addCard}</div>`;
  })();

  const launcherHTML = sections.map(s =>
    `<div class="section-card" onclick="navigate('${s.id}')" style="--sc-color:${s.color}"><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${s.color};margin-bottom:1px">${s.icon} ${s.title}</div><div class="section-card-desc">${s.desc}</div></div>`
  ).join('');

  const actHTML = p.actions.filter(a => a.status !== 'Closed').slice(0, 5).map(a => {
    const od = a.due && new Date(a.due) < new Date();
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);${od ? 'background:#fff8f8' : ''}"><span class="sp sp-${a.status === 'In Progress' ? 'inprog' : 'open'}">${a.status || 'Open'}</span><span style="flex:1;font-size:12px">${esc(a.desc)}</span><span style="font-size:10px;color:${od ? 'var(--red)' : 'var(--muted)'}">${a.owner ? esc(a.owner) + ' ' : ''} ${a.due || ''}</span></div>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open actions</div>`;

  const riskHTML = p.risks.filter(r => r.status !== 'Closed').sort((a, b) => b.lik * b.imp - a.lik * a.imp).slice(0, 4).map(r => {
    const s = r.lik * r.imp;
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line)"><span class="rs ${s >= 12 ? 'rs-hi' : s >= 6 ? 'rs-med' : 'rs-lo'}">${s}</span><span style="flex:1;font-size:12px">${esc(r.desc)}</span><span style="font-size:10px;color:var(--muted)">${esc(r.cat || '')}</span></div>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open risks</div>`;

  const famIcon   = FAMILIES.find(f => f.id === (p.family || 'Other'))?.icon || '📋';
  const parentProg = p.parentId ? db.programmes.find(x => x.id === p.parentId) : null;

  // RPN burndown chart for dashboard
  const rpnBurndownHTML = p.pfmea && p.pfmea.length > 0 ? `
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;margin-top:4px">PFMEA RPN Burndown</div>
    <div class="card" style="margin-bottom:20px;padding:0;overflow:hidden">
      <div class="card-head" style="padding:10px 14px">
        <span class="card-title">RPN Burndown — Original vs Current</span>
        <button class="btn btn-ghost btn-sm" onclick="setApqpTab('pfmea')">Full PFMEA →</button>
      </div>
      ${renderRpnBurndown(true)}
    </div>` : '';

  return `<div class="dash-hero"><div class="dash-prog-name">${esc(p.name)}</div><div class="dash-prog-meta"><span>${famIcon} ${esc(p.family || 'Other')}</span> ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''} ${p.unit ? `<span>🚂 ${esc(p.unit)}</span>` : ''} ${p.lead ? `<span>🧑‍💼 ME: ${esc(p.lead)}</span>` : ''} ${p.pm ? `<span>📋 PM: ${esc(p.pm)}</span>` : ''} ${p.date ? `<span>📅 ${p.date}</span>` : ''} <span>📍 Gate ${curGate >= 0 ? curGate : '✓ All complete'}</span><button class="btn btn-ghost btn-sm" style="margin-left:auto;border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)" onclick="showEditProject()">✎ Edit Project</button></div></div>
  <div class="dash-body">
    <div class="kpi-grid">
      <div class="kpi-card" onclick="navigate('gate_${curGate >= 0 ? curGate : 5}')" style="--kpi-color:var(--green)"><div class="kpi-num">${gatesDone}<span style="font-size:16px;color:var(--muted)">/6</span></div><div class="kpi-label">Gates Signed</div></div>
      <div class="kpi-card" onclick="navigate('actions')" style="--kpi-color:${overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${openAct}</div><div class="kpi-label">Open Actions</div><div class="kpi-sub">${overdueAct > 0 ? `<span style="color:var(--red)">${overdueAct} overdue</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="navigate('risks')" style="--kpi-color:${highRisks > 0 ? 'var(--red)' : 'var(--blue)'}"><div class="kpi-num">${p.risks.filter(r => r.status !== 'Closed').length}</div><div class="kpi-label">Open Risks</div><div class="kpi-sub">${highRisks > 0 ? `<span style="color:var(--red)">${highRisks} high</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="navigate('apqp')" style="--kpi-color:${highRPN > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${highRPN}</div><div class="kpi-label">High RPN</div><div class="kpi-sub">${p.pfmea.length} total rows</div></div>
    </div>
    ${alerts ? `<div class="alert-row">${alerts}</div>` : ''}
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">Gate Progress — click any gate to open</div>
    <div class="gate-strip">${gateStrip}</div>
    ${rpnBurndownHTML}
    ${parentProg ? `<div class="parent-prog-card" onclick="progId='${parentProg.id}';navigate('project')">
      <div class="parent-prog-label">↑ PARENT PROGRAMME</div>
      <div class="parent-prog-name">${esc(parentProg.name)}</div>
      ${parentProg.unit ? `<div class="parent-prog-meta">🚂 ${esc(parentProg.unit)}</div>` : ''}
    </div>` : ''}
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">Tools</div>
    <div class="section-launcher">${launcherHTML}</div>
    <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px;margin-top:16px">Sub-assemblies</div>
    ${subAsmHTML}
    <div class="dash-grid">
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Open Actions</span><button class="btn btn-ghost btn-sm" onclick="navigate('actions')">View all →</button></div>${actHTML}</div>
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Top Risks</span><button class="btn btn-ghost btn-sm" onclick="navigate('risks')">View all →</button></div>${riskHTML}</div>
    </div>
  </div>`;
}

// ── Project CRUD ──────────────────────────────────────────────
function openProject(id) { progId = id; navigate('project'); }

function newProjectInFamily(family) {
  showModal('modalNewProj');
  setTimeout(() => { const f = document.getElementById('np_family'); if (f) f.value = family; }, 50);
}

function createProg() {
  const name = document.getElementById('np_name').value.trim();
  if (!name) { alert('Name required'); return; }
  const p = newProgTemplate(
    name,
    document.getElementById('np_customer').value.trim(),
    document.getElementById('np_unit').value.trim(),
    document.getElementById('np_family').value,
    document.getElementById('np_lead').value.trim(),
    document.getElementById('np_pm').value.trim(),
    document.getElementById('np_date').value
  );
  db.programmes.push(p); progId = p.id; save(); closeModal('modalNewProj'); navigate('project');
  ['np_name', 'np_customer', 'np_unit', 'np_lead', 'np_pm', 'np_date'].forEach(id => document.getElementById(id).value = '');
}

function switchProg(id) { progId = id; navigate('project'); }

function showEditProject() {
  const p = prog(); if (!p) return;
  document.getElementById('ep_name').value     = p.name     || '';
  document.getElementById('ep_customer').value = p.customer || '';
  document.getElementById('ep_unit').value     = p.unit     || '';
  document.getElementById('ep_family').value   = p.family   || 'Other';
  document.getElementById('ep_lead').value     = p.lead     || '';
  document.getElementById('ep_pm').value       = p.pm       || '';
  document.getElementById('ep_date').value     = p.date     || '';
  showModal('modalEditProj');
}

function saveEditProject() {
  const p = prog(); if (!p) return;
  p.name     = document.getElementById('ep_name').value.trim();
  p.customer = document.getElementById('ep_customer').value.trim();
  p.unit     = document.getElementById('ep_unit').value.trim();
  p.family   = document.getElementById('ep_family').value;
  p.lead     = document.getElementById('ep_lead').value.trim();
  p.pm       = document.getElementById('ep_pm').value.trim();
  p.date     = document.getElementById('ep_date').value;
  save(); closeModal('modalEditProj'); render();
}

function deleteProject() {
  const p = prog(); if (!p) return;
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  db.programmes = db.programmes.filter(x => x.id !== progId);
  progId = db.programmes[0]?.id || null;
  save(); closeModal('modalEditProj'); navigate(progId ? 'project' : 'projects');
}

function unlinkSubAsm(li) {
  const p = prog(); if (!p.subAssemblies) return;
  const child = db.programmes.find(x => x.id === p.subAssemblies[li]?.id);
  if (child && child.parentId === progId) delete child.parentId;
  p.subAssemblies.splice(li, 1);
  save(); render();
}

function openSubAsmModal() {
  const p = prog();
  const linked = (p.subAssemblies || []).map(x => x.id);
  const others = db.programmes.filter(x => x.id !== progId && !linked.includes(x.id) && !x.parentId);
  if (others.length === 0) { alert('No available projects to link. Create the sub-assembly project first.'); return; }
  const opts = others.map((x, i) =>
    `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line);cursor:pointer;border-radius:6px" onmouseenter="this.style.background='var(--bg)'" onmouseleave="this.style.background=''" onclick="linkSubAsm('${x.id}')">
      <span style="font-size:13px">🔩</span>
      <span style="flex:1;font-size:12px;font-weight:600">${esc(x.name)}</span>
      ${x.unit ? `<span style="font-size:10px;color:var(--muted)">${esc(x.unit)}</span>` : ''}
    </div>`
  ).join('');
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'subAsmModalBg';
  bg.innerHTML = `<div class="modal" style="max-width:420px"><div class="modal-head"><span class="modal-title">Link Sub-assembly Project</span><button class="modal-close" onclick="closeSubAsmModal()">✕</button></div><div style="padding:8px 4px;max-height:320px;overflow-y:auto">${opts}</div></div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeSubAsmModal(); });
  document.body.appendChild(bg);
}

function linkSubAsm(id) {
  const p = prog(); if (!p.subAssemblies) p.subAssemblies = [];
  if (!p.subAssemblies.find(x => x.id === id)) p.subAssemblies.push({ id });
  const child = db.programmes.find(x => x.id === id);
  if (child && !child.parentId) child.parentId = progId;
  save(); closeSubAsmModal(); render();
}

function closeSubAsmModal() { const el = document.getElementById('subAsmModalBg'); if (el) el.remove(); }
