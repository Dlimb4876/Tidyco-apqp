import { db, prog, progId, npiTab, FAMILIES, getFamilies, BOM_TYPES, GATE_DEFS, setNpiTab, setProgId } from '../../../core/js/state.js';
import { currentUser } from '../../../core/js/auth.js';
import { esc, calcRPN, showModal, closeModal, navigate } from '../../../utils/js/helpers.js';
import { gateAllSigned } from './gates.js';
import { renderRpnBurndown } from './apqp.js';

// ── Projects list ─────────────────────────────────────────────
export function renderProjects() {
  const user    = currentUser ? currentUser.email.split('@')[0] : '';
  const families = getFamilies();

  // Count projects by type
  const activeProjects = db.programmes.filter(p => (p.status || 'Active') === 'Active');
  const tenderCount = db.programmes.filter(p => p.status === 'Tender').length;
  const archiveCount = db.programmes.filter(p => p.status === 'Archive').length;
  const allCount = db.programmes.length;

  // Build tabs: All + Tenders + Archive + one per family
  let tabsHTML = `<button class="npi-tab${npiTab === 'all' ? ' npi-tab-active' : ''}" onclick="setNpiTab('all')">All<span class="npi-tab-badge">${allCount}</span></button>`;

  tabsHTML += `<button class="npi-tab${npiTab === 'tenders' ? ' npi-tab-active' : ''}" onclick="setNpiTab('tenders')">📋 Tenders<span class="npi-tab-badge">${tenderCount}</span></button>`;
  tabsHTML += `<button class="npi-tab${npiTab === 'archive' ? ' npi-tab-active' : ''}" onclick="setNpiTab('archive')">📦 Archive<span class="npi-tab-badge">${archiveCount}</span></button>`;

  families.forEach(fam => {
    const count = activeProjects.filter(p => (p.family || 'Other') === fam.id).length;
    tabsHTML += `<button class="npi-tab${npiTab === fam.id ? ' npi-tab-active' : ''}" onclick="setNpiTab(${JSON.stringify(fam.id)})">${fam.icon} ${esc(fam.label)}<span class="npi-tab-badge">${count}</span></button>`;
  });

  // "New Project" button behavior
  const newProjOnclick = (npiTab !== 'all' && npiTab !== 'tenders' && npiTab !== 'archive')
    ? `newProjectInFamily(${JSON.stringify(npiTab)})`
    : `showModal('modalNewProj')`;

  let html = `<div class="proj-home">
    <div class="proj-home-header">
      <div>
        <div class="proj-home-title">Projects</div>
        <div class="proj-home-sub">Signed in as ${esc(user)}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Hub</button>
        <button class="btn btn-primary" onclick="${newProjOnclick}">＋ New Project</button>
      </div>
    </div>
    <div class="npi-tabs">${tabsHTML}</div>`;

  if (db.programmes.length === 0) {
    html += `<div style="text-align:center;padding:80px 20px;color:var(--muted)">
      <div style="font-size:48px;margin-bottom:16px">📋</div>
      <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No projects yet</div>
      <div style="font-size:13px;margin-bottom:24px">Create your first project to get started</div>
      <button class="btn btn-primary" onclick="showModal('modalNewProj')">＋ New Project</button>
    </div>`;
  } else if (npiTab === 'all') {
    // Show every family group that has at least one active project
    let hasAny = false;
    families.forEach(fam => {
      const projs = activeProjects.filter(p => (p.family || 'Other') === fam.id);
      if (projs.length === 0) return;
      hasAny = true;
      html += renderFamilyGroup(fam, projs, false);
    });
    if (!hasAny) {
      html += `<div style="text-align:center;padding:60px 20px;color:var(--muted);font-size:13px">No active projects match any known family.</div>`;
    }
  } else if (npiTab === 'tenders') {
    // Show all tender projects
    const tenderProjs = db.programmes.filter(p => p.status === 'Tender');
    if (tenderProjs.length === 0) {
      html += `<div style="text-align:center;padding:80px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">📋</div>
        <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No tender projects</div>
        <div style="font-size:13px;margin-bottom:24px">Tender projects will appear here</div>
      </div>`;
    } else {
      const tenderFam = { id: 'tenders', label: 'Tenders', icon: '📋' };
      html += renderFamilyGroup(tenderFam, tenderProjs, true);
    }
  } else if (npiTab === 'archive') {
    // Show all archived projects
    const archiveProjs = db.programmes.filter(p => p.status === 'Archive');
    if (archiveProjs.length === 0) {
      html += `<div style="text-align:center;padding:80px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No archived projects</div>
        <div style="font-size:13px;margin-bottom:24px">Archived projects will appear here</div>
      </div>`;
    } else {
      const archiveFam = { id: 'archive', label: 'Archive', icon: '📦' };
      html += renderFamilyGroup(archiveFam, archiveProjs, true);
    }
  } else {
    // Single-family tab view (only shows active projects)
    const fam   = families.find(f => f.id === npiTab);
    const projs = fam ? activeProjects.filter(p => (p.family || 'Other') === fam.id) : [];
    if (!fam || projs.length === 0) {
      const famLabel = fam ? esc(fam.label) : esc(npiTab);
      const famIcon  = fam ? fam.icon : '📋';
      html += `<div style="text-align:center;padding:80px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">${famIcon}</div>
        <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No ${famLabel} projects yet</div>
        <div style="font-size:13px;margin-bottom:24px">Create the first ${famLabel} project to get started</div>
        <button class="btn btn-primary" onclick="newProjectInFamily(${JSON.stringify(npiTab)})">＋ New ${famLabel} Project</button>
      </div>`;
    } else {
      // Hide the family header — the active tab already labels it
      html += renderFamilyGroup(fam, projs, true);
    }
  }

  html += `</div>`;
  return html;
}

// Renders one family section (cards grid + "Add" card).
// Pass hideHeader=true when the active tab already labels the family.
export function renderFamilyGroup(fam, projs, hideHeader) {
  let html = `<div class="proj-family-group">`;
  if (!hideHeader) {
    html += `<div class="proj-family-label"><span>${fam.icon}</span>${esc(fam.label)}</div>`;
  }
  html += `<div class="proj-cards">`;
  projs.forEach(p => {
    const gates      = p.gates || [];
    const curGate    = gates.findIndex(g => !gateAllSigned(g));
    const gatesDone  = gates.filter(g => gateAllSigned(g)).length;
    const openAct    = (p.actions || []).filter(a => a.status !== 'Closed').length;
    const overdueAct = (p.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
    const highRPN    = (p.pfmea || []).filter(r => calcRPN(r) >= 100).length;
    const rag        = overdueAct > 0 || highRPN > 0 ? 'r' : openAct > 0 ? 'a' : 'g';
    const ragShort   = rag === 'r' ? '⚠' : rag === 'a' ? '→' : '✓';
    const pips       = GATE_DEFS.map((g, i) => {
      const gd  = gates[i];
      const cls = gd && gateAllSigned(gd) ? 'done' : i === curGate ? 'active' : '';
      return `<div class="proj-gate-pip ${cls}" title="Gate ${g.num}: ${g.name}"></div>`;
    }).join('');
    const lastSaved = p.updated_at
      ? new Date(p.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '—';
    html += `<div class="proj-card" onclick="openProject('${p.id}')">
      <div class="proj-card-name">${esc(p.name)}</div>
      <div class="proj-card-meta">
        ${p.customer   ? `<span>👤 ${esc(p.customer)}</span>`   : ''}
        ${p.unit       ? `<span>🚂 ${esc(p.unit)}</span>`       : ''}
        ${p.lead       ? `<span>ME: ${esc(p.lead)}</span>`  : ''}
      </div>
      <div class="proj-card-gate">
        <span class="proj-card-gate-label">G${curGate >= 0 ? curGate : '✓'}</span>
        ${pips}
      </div>
      <div class="proj-card-footer">
        <span><span class="proj-rag proj-rag-${rag}"></span>${ragShort}</span>
        <span>${lastSaved}</span>
      </div>
    </div>`;
  });
  html += `<div class="proj-add-card" onclick="newProjectInFamily(${JSON.stringify(fam.id)})">＋ Add ${esc(fam.label)} project</div>`;
  html += `</div></div>`;
  return html;
}

// Switch the active family tab and re-render
function setNpiTab(tab) {
  npiTab = tab;
  const parts = [];
  if (tab !== 'all') parts.push('nft=' + encodeURIComponent(tab));
  history.replaceState(null, '', parts.length ? '#' + parts.join('&') : '#');
  render();
}

// ── Dashboard ─────────────────────────────────────────────────
export function renderDashboard() {
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
  if (overdueAct > 0)    alerts += `<div class="alert-item alert-red">🔴 <strong>${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}</strong> — <a href="#" onclick="navigate('actions');return false" style="color:inherit;text-decoration:underline">View Actions →</a></div>`;
  if (highRisks > 0)     alerts += `<div class="alert-item alert-amber">🟡 <strong>${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}</strong> open — <a href="#" onclick="navigate('risks');return false" style="color:inherit;text-decoration:underline">View Risks →</a></div>`;
  if (highRPN > 0)       alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRPN} failure cause${highRPN !== 1 ? 's' : ''} with RPN ≥ 100</strong> — <a href="#" onclick="apqpTab='pfmea';navigate('apqp');return false" style="color:inherit;text-decoration:underline">View PFMEA →</a></div>`;

  const gateStrip = GATE_DEFS.map((g, i) => {
    const gd         = p.gates[i] || {};
    const signed     = gateAllSigned(gd);
    
    // FIX: Reference gd.checks (the actual data array) instead of gd.items
    const checks     = gd.checks || [];
    const done       = checks.filter(Boolean).length; // Counts 'true' entries
    const total      = g.items.length; // Use length from the gate definition
    
    const pct        = total > 0 ? Math.round(done / total * 100) : 0;
    const hasActivity = done > 0;
    const dotCls     = signed ? 'gs-signed' : hasActivity ? 'gs-open' : 'gs-pending';
    const labelCol   = signed ? 'var(--green)' : i === (curGate < 0 ? 5 : curGate) ? 'var(--blue)' : 'var(--muted)';
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
    { id: 'products', icon: '📦', title: 'Products',           desc: 'Product Master & Production', color: 'var(--teal)', isExternal: true },
    { id: 'actions', icon: '✅', title: 'Actions',             desc: `${openAct} open${overdueAct > 0 ? ' · ' + overdueAct + ' overdue' : ''}`, color: overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)' },
    { id: 'risks',   icon: '🛡', title: 'Risk Register',       desc: `${p.risks.filter(r => r.status !== 'Closed').length} open · ${highRisks} high`, color: highRisks > 0 ? 'var(--red)' : 'var(--blue)' },
  ];

  // ── Sub-assemblies (left column of split) ────────────────────
  if (!p.subAssemblies) p.subAssemblies = [];
  const subAsmHTML = (() => {
    const cards = p.subAssemblies.map((link, li) => {
      const sp = db.programmes.find(x => x.id === link.id);
      if (!sp) return '';
      const sg        = sp.gates || [];
      const sgDone    = sg.filter(g => g.signed).length;
      const sgTotal   = sg.length || 6;
      const curGateSA = sg.findIndex(g => !g.signed);
      const gLabel    = curGateSA < 0 ? '✓ Complete' : `Gate ${curGateSA}`;
      const gatePct   = Math.round(sgDone / sgTotal * 100);
      const saOpen    = (sp.actions || []).filter(a => a.status !== 'Closed').length;
      const saOverdue = (sp.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length;
      const saRisks   = (sp.risks || []).filter(r => r.status !== 'Closed').length;
      const saHighR   = (sp.risks || []).filter(r => r.lik * r.imp >= 12 && r.status !== 'Closed').length;
      const saHighRPN = (sp.pfmea || []).filter(r => calcRPN(r) >= 100).length;
      return `<div class="sub-asm-card" onclick="progId='${sp.id}';navigate('project')">
        <div class="sub-asm-card-head">
          <span class="sub-asm-name">${esc(sp.name)}</span>
          <button class="del-btn" style="font-size:10px" onclick="event.stopPropagation();unlinkSubAsm(${li})">× Unlink</button>
        </div>
        ${sp.unit ? `<div style="font-size:10px;color:var(--muted);margin-bottom:6px">🚂 ${esc(sp.unit)}</div>` : ''}
        <div class="sub-asm-stats">
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saOpen > 0 ? 'var(--red)' : saOpen > 0 ? 'var(--amber)' : 'var(--green)'}">${saOpen}</span><span class="sub-asm-stat-lbl">Actions${saOverdue > 0 ? ` (${saOverdue} OD)` : ''}</span></div>
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

  // ── RPN Burndown (right column of split) — only shown when PFMEA data exists ──
  const rpnBurndownHTML = p.pfmea && p.pfmea.length > 0 ? `
    <div class="card" style="margin-bottom:0;padding:0;overflow:hidden;height:100%;box-sizing:border-box">
      <div class="card-head" style="padding:10px 14px">
        <span class="card-title">RPN Burndown — Original vs Current</span>
        <button class="btn btn-ghost btn-sm" onclick="apqpTab='pfmea';navigate('apqp')">Full PFMEA →</button>
      </div>
      <div style="padding:14px 16px 16px">${renderRpnBurndown(true)}</div>
    </div>` : `<div class="card" style="margin-bottom:0;display:flex;align-items:center;justify-content:center;min-height:80px">
      <span style="font-size:12px;color:var(--muted)">No PFMEA data yet</span>
    </div>`;

  const launcherHTML = sections.map(s => {
    let onclick = `navigate('${s.id}')`;
    if (s.isExternal && s.id === 'products') {
      onclick = `navigate('production', { pushHash: true }); productionTab = 'products'; render()`;
    }
    return `<div class="section-card" onclick="${onclick}" style="--sc-color:${s.color}"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${s.color};margin-bottom:1px">${s.icon} ${s.title}</div><div class="section-card-desc">${s.desc}</div></div>`;
  }).join('');

  const actHTML = p.actions.filter(a => a.status !== 'Closed').slice(0, 5).map(a => {
    const od = a.due && new Date(a.due) < new Date();
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);${od ? 'background:#fff8f8' : ''}"><span class="sp sp-${a.status === 'In Progress' ? 'inprog' : 'open'}">${a.status || 'Open'}</span><span style="flex:1;font-size:12px">${esc(a.desc)}</span><span style="font-size:10px;color:${od ? 'var(--red)' : 'var(--muted)'}">${a.owner ? esc(a.owner) + ' ' : ''} ${a.due || ''}</span></div>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open actions</div>`;

  const riskHTML = p.risks.filter(r => r.status !== 'Closed').sort((a, b) => b.lik * b.imp - a.lik * a.imp).slice(0, 4).map(r => {
    const s = r.lik * r.imp;
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line)"><span class="rs ${s >= 12 ? 'rs-hi' : s >= 6 ? 'rs-med' : 'rs-lo'}">${s}</span><span style="flex:1;font-size:12px">${esc(r.desc)}</span><span style="font-size:10px;color:var(--muted)">${esc(r.cat || '')}</span></div>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open risks</div>`;

  const famIcon    = FAMILIES.find(f => f.id === (p.family || 'Other'))?.icon || '📋';
  const parentProg = p.parentId ? db.programmes.find(x => x.id === p.parentId) : null;

  // ── Layout order: KPIs → Alerts → Gate Strip → Tools → Parent → Split(Sub-assemblies | RPN Burndown) → Actions/Risks
  return `<div class="dash-hero"><div style="display:flex;align-items:center;gap:12px"><button class="btn btn-ghost" style="border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)" onclick="navigate('projects')">← Back to Projects</button><div><div class="dash-prog-name">${esc(p.name)}</div><div class="dash-prog-meta"><span>${famIcon} ${esc(p.family || 'Other')}</span> ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''} ${p.unit ? `<span>🚂 ${esc(p.unit)}</span>` : ''} ${p.lead ? `<span>🧑‍💼 ME Lead: ${esc(p.lead)}</span>` : ''} ${p.pm ? `<span>📋 Project Manager: ${esc(p.pm)}</span>` : ''} ${p.qNumber ? `<span>🔢 Q: ${esc(p.qNumber)}</span>` : ''} ${totalBomItems > 0 ? `<span>📦 BOM: ${totalBomItems} items</span>` : ''} ${p.date ? `<span>📅 ${p.date}</span>` : ''} <span>📍 Gate ${curGate >= 0 ? curGate : '✓ All complete'}</span></div></div><button class="btn btn-ghost btn-sm" style="margin-left:auto;border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)" onclick="showEditProject()">✎ Edit Project</button></div></div>
  <div class="dash-body">
    <div class="kpi-grid">
      <div class="kpi-card" onclick="navigate('gate_${curGate >= 0 ? curGate : 5}')" style="--kpi-color:var(--green)"><div class="kpi-num">${gatesDone}<span style="font-size:16px;color:var(--muted)">/6</span></div><div class="kpi-label">Gates Signed</div></div>
      <div class="kpi-card" onclick="navigate('actions')" style="--kpi-color:${overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${openAct}</div><div class="kpi-label">Open Actions</div><div class="kpi-sub">${overdueAct > 0 ? `<span style="color:var(--red)">${overdueAct} overdue</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="navigate('risks')" style="--kpi-color:${highRisks > 0 ? 'var(--red)' : 'var(--blue)'}"><div class="kpi-num">${p.risks.filter(r => r.status !== 'Closed').length}</div><div class="kpi-label">Open Risks</div><div class="kpi-sub">${highRisks > 0 ? `<span style="color:var(--red)">${highRisks} high</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="apqpTab='pfmea';navigate('apqp')" style="--kpi-color:${highRPN > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${highRPN}</div><div class="kpi-label">High RPN</div><div class="kpi-sub">${p.pfmea.length} total rows</div></div>
    </div>
    ${alerts ? `<div class="alert-row">${alerts}</div>` : ''}
    <div class="dash-section-label">Gate Progress</div>
    <div class="gate-strip">${gateStrip}</div>
    <div class="dash-section-label" style="margin-top:8px">Tools</div>
    <div class="section-launcher" style="margin-bottom:16px">${launcherHTML}</div>
    ${parentProg ? `<div class="parent-prog-card" onclick="progId='${parentProg.id}';navigate('project')">
      <div class="parent-prog-label">↑ PARENT PROGRAMME</div>
      <div class="parent-prog-name">${esc(parentProg.name)}</div>
      ${parentProg.unit ? `<div class="parent-prog-meta">🚂 ${esc(parentProg.unit)}</div>` : ''}
    </div>` : ''}
    <div class="dash-split-row">
      <div class="dash-split-col">
        <div class="dash-section-label">Sub-assemblies</div>
        ${subAsmHTML}
      </div>
      <div class="dash-split-col">
        <div class="dash-section-label">PFMEA RPN Burndown</div>
        ${rpnBurndownHTML}
      </div>
    </div>
    <div class="dash-grid">
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Open Actions</span><button class="btn btn-ghost btn-sm" onclick="navigate('actions')">View all →</button></div>${actHTML}</div>
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Top Risks</span><button class="btn btn-ghost btn-sm" onclick="navigate('risks')">View all →</button></div>${riskHTML}</div>
    </div>
  </div>`;
}

// ── Project CRUD ──────────────────────────────────────────────
export function openProject(id) { setProgId(id); navigate('project'); }

export function newProjectInFamily(famId) {
  // Use the correct select id from index.html's New Project modal
  const sel = document.getElementById('np_family');
  if (sel) sel.value = famId;
  showModal('modalNewProj');
}

export function createProg() {
  const name = document.getElementById('np_name').value.trim();
  if (!name) { alert('Project name is required.'); return; }
  const id = 'p_' + Math.random().toString(36).slice(2);
  const family   = document.getElementById('np_family')?.value   || 'Other';
  const customer = document.getElementById('np_customer')?.value || '';
  const unit     = document.getElementById('np_unit')?.value     || '';
  const lead     = document.getElementById('np_lead')?.value     || '';
  const pm       = document.getElementById('np_pm')?.value       || '';
  const date     = document.getElementById('np_date')?.value     || '';
  const qNumber  = document.getElementById('np_qNumber')?.value?.trim() || '';
  const partNumber = document.getElementById('np_partNumber')?.value?.trim() || '';
  const parentId = document.getElementById('np_parent')?.value   || null;
  const newProg  = migrateprog({
    id, name, family, customer, unit, lead, pm, date, qNumber, partNumber,
    parentId: parentId || null,
    status: 'Active',
    gates: [], ctq: [], pfd: [], pfmea: [], bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    actions: [], risks: [], gantt: [], subAssemblies: []
  });
  db.programmes.push(newProg);
  if (parentId) {
    const parent = db.programmes.find(x => x.id === parentId);
    if (parent) {
      if (!parent.subAssemblies) parent.subAssemblies = [];
      if (!parent.subAssemblies.find(x => x.id === id)) parent.subAssemblies.push({ id });
    }
  }
  progId = id;
  save();
  hideModal('modalNewProj');
  navigate('project');
}
// -- Edit Project Information -------------------------------
export function showEditProject() {
  const p = prog(); if (!p) return;
  populateFamilySelects();
  document.getElementById('ep_name').value     = p.name     || '';
  document.getElementById('ep_family').value   = p.family   || getFamilies()[0]?.id || 'Other';
  document.getElementById('ep_status').value   = p.status   || 'Active';
  document.getElementById('ep_customer').value = p.customer || '';
  document.getElementById('ep_unit').value     = p.unit     || '';
  document.getElementById('ep_lead').value     = p.lead     || '';
  document.getElementById('ep_pm').value       = p.pm       || '';
  document.getElementById('ep_date').value     = p.date     || '';
  document.getElementById('ep_qNumber').value = p.qNumber || '';
  document.getElementById('ep_partNumber').value = p.partNumber || '';
  showModal('modalEditProj'); // Updated ID
}

export function saveEditProject() {
  const p = prog(); if (!p) return;
  p.name     = document.getElementById('ep_name').value.trim()     || p.name;
  p.family   = document.getElementById('ep_family').value          || 'Other';
  p.status   = document.getElementById('ep_status').value          || 'Active';
  p.customer = document.getElementById('ep_customer').value.trim() || '';
  p.unit     = document.getElementById('ep_unit').value.trim()     || '';
  p.lead     = document.getElementById('ep_lead').value.trim()     || '';
  p.pm       = document.getElementById('ep_pm').value.trim()       || '';
  p.date     = document.getElementById('ep_date').value            || '';
  p.qNumber = document.getElementById('ep_qNumber').value.trim() || '';
  p.partNumber = document.getElementById('ep_partNumber').value.trim() || '';
  save();
  closeModal('modalEditProj'); // Use closeModal and updated ID
  render();
}

export function deleteProject() {
  const p = prog(); if (!p) return;
  if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return;
  db.programmes = db.programmes.filter(x => x.id !== progId);
  progId = db.programmes.length ? db.programmes[0].id : null;
  save();
  closeModal('modalEditProj'); // Use closeModal and updated ID
  navigate('projects');
}

// ── Sub-assembly management ───────────────────────────────────
export function openSubAsmModal() {
  const p = prog(); if (!p) return;
  const others = db.programmes.filter(x => x.id !== progId && !(p.subAssemblies || []).find(s => s.id === x.id));
  if (others.length === 0) { alert('No other projects to link.'); return; }
  const opts = others.map((x) =>
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

export function linkSubAsm(id) {
  const p = prog(); if (!p.subAssemblies) p.subAssemblies = [];
  if (!p.subAssemblies.find(x => x.id === id)) p.subAssemblies.push({ id });
  const child = db.programmes.find(x => x.id === id);
  if (child && !child.parentId) child.parentId = progId;
  save(); closeSubAsmModal(); render();
}

export function unlinkSubAsm(li) {
  const p = prog();
  const linked = p.subAssemblies[li];
  if (linked) {
    const child = db.programmes.find(x => x.id === linked.id);
    if (child && child.parentId === progId) child.parentId = null;
  }
  p.subAssemblies.splice(li, 1);
  save(); render();
}

export function closeSubAsmModal() { const el = document.getElementById('subAsmModalBg'); if (el) el.remove(); }
