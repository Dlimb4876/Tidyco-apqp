// ═══════════════════════════════════
// dashboard.js — Project home and KPI dashboard rendering
// Depends on: state.js, helpers.js, navigation.js, npi-constants.js, npi.js, gates.js, pfmea.js
// ═══════════════════════════════════

// ── Lane collapse state (persisted to localStorage) ──────────
const npiCollapsedLanes = new Set(
  JSON.parse(localStorage.getItem('npi_collapsed_lanes') || '[]')
)

// ── Auto-create programmes for all products ───────────────────
npi.dashboard.ensureProductProgrammes = function() {
  const products = productsDataGetAll()
  if (!products || products.length === 0) return
  let created = 0
  products.forEach(product => {
    const existing = db.programmes.find(p => p.product_id === product.id)
    if (!existing) {
      const np = migrateprog({
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        name: product.name,
        customer: product.customer || '',
        family: product.family || '',
        unit: product.code || '',
        product_id: product.id,
        date: new Date().toISOString().slice(0, 10),
        status: 'Active',
      })
      db.programmes.push(np)
      created++
    }
  })
  if (created > 0) save()
}

npi.dashboard.toggleNpiLane = function(familyId) {
  if (npiCollapsedLanes.has(familyId)) {
    npiCollapsedLanes.delete(familyId)
  } else {
    npiCollapsedLanes.add(familyId)
  }
  localStorage.setItem('npi_collapsed_lanes', JSON.stringify([...npiCollapsedLanes]))
  const elemId = 'npi-lane-' + familyId.replace(/[^a-zA-Z0-9]/g, '_')
  const lane = document.getElementById(elemId)
  if (lane) {
    const collapsed = npiCollapsedLanes.has(familyId)
    lane.classList.toggle('npi-lane-collapsed', collapsed)
    const tog = lane.querySelector('.npi-lane-toggle')
    if (tog) tog.textContent = collapsed ? '▸' : '▾'
  }
}

// ── Projects list (Kanban with family swim lanes) ─────────────
npi.dashboard.renderProjects = function() {
  npi.dashboard.ensureProductProgrammes()
  const user = currentUser ? currentUser.email.split('@')[0] : ''
  const products = productsDataGetAll()
  const families = getFamilies()
  const STATUSES = [
    { key: 'Tender',     icon: '📋', color: 'var(--amber)' },
    { key: 'NPI',        icon: '🔧', color: 'var(--blue)'  },
    { key: 'Production', icon: '🏭', color: 'var(--green)' },
  ]

  if (!products || products.length === 0) {
    return `<div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">NPI Projects</div>
          <div class="proj-home-sub">Signed in as ${esc(user)}</div>
        </div>
        <button class="btn btn-ghost" onclick="npi.nav.navigate('hub')">← Back to Hub</button>
      </div>
      <div style="text-align:center;padding:80px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No products yet</div>
        <div style="font-size:13px;margin-bottom:24px">Add products in Product Management to get started</div>
        <button class="btn btn-primary" onclick="npi.nav.setProductDevelopmentTab('product-management')">Go to Product Management</button>
      </div>
    </div>`
  }

  // Group active products by family
  const activeProducts = products.filter(p => p.status !== 'Closed')
  const familyMap = {}
  families.forEach(fam => { familyMap[fam.id] = [] })
  familyMap['__other__'] = []
  activeProducts.forEach(product => {
    const famId = product.family && familyMap[product.family] !== undefined
      ? product.family : '__other__'
    familyMap[famId].push(product)
  })

  // Global counts per status column
  const totalByStatus = {}
  STATUSES.forEach(s => {
    totalByStatus[s.key] = activeProducts.filter(p => p.status === s.key).length
  })

  const colHeadersHTML = STATUSES.map(s =>
    `<div class="npi-col-header-label" style="border-top-color:${s.color}">
      <span>${s.icon} ${s.key}</span>
      <span class="npi-tab-badge">${totalByStatus[s.key]}</span>
    </div>`
  ).join('')

  let html = `<div class="proj-home">
    <div class="proj-home-header">
      <div>
        <div class="proj-home-title">NPI Projects</div>
        <div class="proj-home-sub">Signed in as ${esc(user)}</div>
      </div>
      <button class="btn btn-ghost" onclick="npi.nav.navigate('hub')">← Back to Hub</button>
    </div>
    <div class="npi-swimlane-wrap">
      <div class="npi-col-headers">${colHeadersHTML}</div>`

  const renderLane = (famId, famLabel, famIcon, prods) => {
    if (prods.length === 0) return ''
    const elemId    = 'npi-lane-' + famId.replace(/[^a-zA-Z0-9]/g, '_')
    const collapsed = npiCollapsedLanes.has(famId)
    const countBits = STATUSES.map(s => {
      const n = prods.filter(p => p.status === s.key).length
      return n > 0 ? `<span style="color:${s.color}">${n}</span>` : null
    }).filter(Boolean).join('<span style="color:var(--line2)"> · </span>')

    const colsHTML = STATUSES.map(s => {
      const col = prods.filter(p => p.status === s.key)
      return `<div class="npi-lane-col">
        ${col.length === 0
          ? `<div class="npi-lane-empty">—</div>`
          : col.map(product => {
              const programme = db.programmes.find(p => p.product_id === product.id)
              return npi.dashboard.renderNpiSlimCard(product, programme)
            }).join('')
        }
      </div>`
    }).join('')

    return `<div class="npi-lane${collapsed ? ' npi-lane-collapsed' : ''}" id="${elemId}">
      <div class="npi-lane-header" data-fam-id="${esc(famId)}" onclick="npi.dashboard.toggleNpiLane(this.getAttribute('data-fam-id'))">
        <span class="npi-lane-toggle">${collapsed ? '▸' : '▾'}</span>
        <span class="npi-lane-label">${famIcon} ${esc(famLabel)}</span>
        <span class="npi-lane-counts">${countBits}</span>
      </div>
      <div class="npi-lane-body">${colsHTML}</div>
    </div>`
  }

  families.forEach(fam => {
    html += renderLane(fam.id, fam.label, fam.icon, familyMap[fam.id] || [])
  })
  if ((familyMap['__other__'] || []).length > 0) {
    html += renderLane('__other__', 'Unassigned', '📋', familyMap['__other__'])
  }

  html += `</div></div>`
  return html
}

// ── Slim card for a product + its linked programme ────────────
npi.dashboard.renderNpiSlimCard = function(product, programme) {
  let pipsHtml = ''
  if (programme) {
    const gates = programme.gates || []
    const curGate = gates.findIndex(g => !npi.gate.gateAllSigned(g))
    pipsHtml = `<div class="proj-card-gate" style="margin-top:6px">` +
      GATE_DEFS.map((g, i) => {
        const gd  = gates[i]
        const cls = gd && npi.gate.gateAllSigned(gd) ? 'done' : i === curGate ? 'active' : ''
        return `<div class="proj-gate-pip ${cls}" title="Gate ${g.num}: ${g.name}"></div>`
      }).join('') + `</div>`
  }
  const targetProgId = programme ? programme.id : ''
  return `<div class="npi-slim-card" onclick="npi.dashboard.openProjectOrRender('${targetProgId}')">
    <div class="npi-slim-card-name">${esc(product.name)}</div>
    ${product.code     ? `<div class="npi-slim-card-code">${esc(product.code)}</div>` : ''}
    ${product.customer ? `<div class="npi-slim-card-meta">👤 ${esc(product.customer)}</div>` : ''}
    ${pipsHtml}
  </div>`
}

// ── Dashboard ─────────────────────────────────────────────────
npi.dashboard.renderDashboard = function() {
  const p          = prog()
  const openAct    = p.actions.filter(a => a.status !== 'Closed').length
  const overdueAct = p.actions.filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length
  const highRisks  = p.risks.filter(r => r.lik * r.imp >= 12 && r.status !== 'Closed').length
  const highRPN    = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
  const gatesDone  = p.gates.filter(g => npi.gate.gateAllSigned(g)).length
  const curGate    = p.gates.findIndex(g => !npi.gate.gateAllSigned(g))
  const aaw        = [...p.bom.parts, ...p.bom.mat, ...p.bom.cons].filter(x => x.isAaw).length
  const gantt      = p.gantt || []
  const timingTotal  = gantt.length
  const timingFilled = gantt.filter(r => r.weeks && r.weeks.some(w => w > 0)).length

  let alerts = ''
  if (overdueAct > 0) alerts += `<div class="alert-item alert-red">🔴 <strong>${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}</strong> — <a href="#" onclick="npi.nav.navigate('actions');return false" style="color:inherit;text-decoration:underline">View Actions →</a></div>`
  if (highRisks > 0) alerts += `<div class="alert-item alert-amber">🟡 <strong>${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}</strong> open — <a href="#" onclick="npi.nav.navigate('risks');return false" style="color:inherit;text-decoration:underline">View Risks →</a></div>`
  if (highRPN > 0)   alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRPN} failure cause${highRPN !== 1 ? 's' : ''} with RPN ≥ 100</strong> — <a href="#" onclick="npi.nav.openPfmeaTab();return false" style="color:inherit;text-decoration:underline">View PFMEA →</a></div>`

  const gateStrip = GATE_DEFS.map((g, i) => {
    const gd      = p.gates[i] || {}
    const signed  = npi.gate.gateAllSigned(gd)
    const checks  = gd.checks || []
    const done    = checks.filter(Boolean).length
    const total   = g.items.length
    const pct     = total > 0 ? Math.round(done / total * 100) : 0
    const hasActivity = done > 0
    const dotCls  = signed ? 'gs-signed' : hasActivity ? 'gs-open' : 'gs-pending'
    const labelCol = signed ? 'var(--green)' : i === (curGate < 0 ? 5 : curGate) ? 'var(--blue)' : 'var(--muted)'
    const nodeBg  = signed ? 'background:var(--green-pale)' : hasActivity ? 'background:var(--amber-pale)' : ''
    return `<div class="gate-node" style="${nodeBg}" onclick="npi.nav.navigate('gate_${g.num}')" title="Open Gate ${g.num}: ${g.name}">
      <div class="gate-node-num" style="color:${labelCol}">Gate ${g.num}</div>
      <div class="gate-node-name">${g.name}</div>
      <div style="display:flex;align-items:center;gap:5px;margin-top:5px">
        <div class="gate-status-dot ${dotCls}"></div>
        <span style="font-size:10px;color:var(--muted);font-family:'IBM Plex Mono',monospace">${pct}%</span>
        ${signed ? '<span style="font-size:9px;font-weight:700;color:var(--green);margin-left:auto;font-family:\'IBM Plex Mono\',monospace">✓</span>' : ''}
      </div>
    </div>`
  }).join('')

  const totalBomItems = Object.keys(BOM_TYPES).reduce((n, k) => n + p.bom[k].length, 0)
  const sections = [
    { id: 'timing',  icon: '📅', title: 'NPI Timing Plan',   desc: `${timingTotal} rows · ${timingFilled} with activity`, color: 'var(--teal)'   },
    { id: 'apqp',    icon: '📐', title: 'APQP',              desc: 'CTQ · PFD · PFMEA · Control Plan',                   color: 'var(--purple)' },
    { id: 'bom',     icon: '📦', title: 'Bill of Materials',  desc: `${totalBomItems} items · ${p.bom.kits.length} kits · ${aaw} AAW`, color: 'var(--navy)' },
    { id: 'actions', icon: '✅', title: 'Actions',            desc: `${openAct} open${overdueAct > 0 ? ' · ' + overdueAct + ' overdue' : ''}`, color: overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)' },
    { id: 'risks',   icon: '🛡', title: 'Risk Register',      desc: `${p.risks.filter(r => r.status !== 'Closed').length} open · ${highRisks} high`, color: highRisks > 0 ? 'var(--red)' : 'var(--blue)' },
  ]

  // ── Sub-assemblies (left column of split) ────────────────────
  if (!p.subAssemblies) p.subAssemblies = []
  const subAsmHTML = (() => {
    const cards = p.subAssemblies.map((link, li) => {
      const sp = db.programmes.find(x => x.id === link.id)
      if (!sp) return ''
      const sg        = sp.gates || []
      const sgDone    = sg.filter(g => g.signed).length
      const sgTotal   = sg.length || 6
      const curGateSA = sg.findIndex(g => !g.signed)
      const gLabel    = curGateSA < 0 ? '✓ Complete' : `Gate ${curGateSA}`
      const gatePct   = Math.round(sgDone / sgTotal * 100)
      const saOpen    = (sp.actions || []).filter(a => a.status !== 'Closed').length
      const saOverdue = (sp.actions || []).filter(a => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()).length
      const saRisks   = (sp.risks || []).filter(r => r.status !== 'Closed').length
      const saHighR   = (sp.risks || []).filter(r => r.lik * r.imp >= 12 && r.status !== 'Closed').length
      const saHighRPN = (sp.pfmea || []).filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
      return `<div class="sub-asm-card" onclick="npi.nav.openProjectById('${sp.id}')">
        <div class="sub-asm-card-head">
          <span class="sub-asm-name">${esc(sp.name)}</span>
          <button class="del-btn" style="font-size:10px" onclick="npi.nav.stopEvent(event);npi.dashboard.unlinkSubAsm(${li})">× Unlink</button>
        </div>
        ${sp.unit ? `<div style="font-size:10px;color:var(--muted);margin-bottom:6px">🚂 ${esc(sp.unit)}</div>` : ''}
        <div class="sub-asm-stats">
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saOpen > 0 ? 'var(--red)' : 'var(--green)'}">${saOpen}</span><span class="sub-asm-stat-lbl">Actions${saOverdue > 0 ? ` (${saOverdue} OD)` : ''}</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saHighR > 0 ? 'var(--red)' : 'var(--ink)'}">${saRisks}</span><span class="sub-asm-stat-lbl">Risks${saHighR > 0 ? ` (${saHighR} hi)` : ''}</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${saHighRPN > 0 ? 'var(--amber)' : 'var(--ink)'}">${saHighRPN}</span><span class="sub-asm-stat-lbl">High RPN</span></div>
        </div>
        <div>
          <div class="sub-asm-gate-bar"><div class="sub-asm-gate-fill" style="width:${gatePct}%"></div></div>
          <div class="sub-asm-gate-label">${gLabel} · ${gatePct}%</div>
        </div>
      </div>`
    }).filter(Boolean).join('')
    const addCard = `<div class="sub-asm-add-card" onclick="npi.dashboard.openSubAsmModal()"><span style="font-size:16px">＋</span> Link sub-assembly project</div>`
    return `<div class="sub-asm-grid">${cards}${addCard}</div>`
  })()

  // ── RPN Burndown (right column of split) ──────────────────────
  const rpnBurndownHTML = p.pfmea && p.pfmea.length > 0 ? `
    <div class="card" style="margin-bottom:0;padding:0;overflow:hidden;height:100%;box-sizing:border-box">
      <div class="card-head" style="padding:10px 14px">
        <span class="card-title">RPN Burndown — Original vs Current</span>
        <button class="btn btn-ghost btn-sm" onclick="npi.nav.openPfmeaTab()">Full PFMEA →</button>
      </div>
      <div style="padding:14px 16px 16px">${renderRpnBurndown(true)}</div>
    </div>` : `<div class="card" style="margin-bottom:0;display:flex;align-items:center;justify-content:center;min-height:80px">
      <span style="font-size:12px;color:var(--muted)">No PFMEA data yet</span>
    </div>`

  const launcherHTML = sections.map(s =>
    `<div class="section-card" onclick="npi.nav.navigate('${s.id}')" style="--sc-color:${s.color}"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${s.color};margin-bottom:1px">${s.icon} ${s.title}</div><div class="section-card-desc">${s.desc}</div></div>`
  ).join('')

  const actHTML = p.actions.filter(a => a.status !== 'Closed').slice(0, 5).map(a => {
    const od = a.due && new Date(a.due) < new Date()
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);${od ? 'background:#fff8f8' : ''}"><span class="sp sp-${a.status === 'In Progress' ? 'inprog' : 'open'}">${a.status || 'Open'}</span><span style="flex:1;font-size:12px">${esc(a.desc)}</span><span style="font-size:10px;color:${od ? 'var(--red)' : 'var(--muted)'}">${a.owner ? esc(a.owner) + ' ' : ''} ${a.due || ''}</span></div>`
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open actions</div>`

  const riskHTML = p.risks.filter(r => r.status !== 'Closed').sort((a, b) => b.lik * b.imp - a.lik * a.imp).slice(0, 4).map(r => {
    const s = r.lik * r.imp
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line)"><span class="rs ${s >= 12 ? 'rs-hi' : s >= 6 ? 'rs-med' : 'rs-lo'}">${s}</span><span style="flex:1;font-size:12px">${esc(r.desc)}</span><span style="font-size:10px;color:var(--muted)">${esc(r.cat || '')}</span></div>`
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open risks</div>`

  const famIcon    = FAMILIES.find(f => f.id === (p.family || 'Other'))?.icon || '📋'
  const parentProg = p.parentId ? db.programmes.find(x => x.id === p.parentId) : null

  return `<div class="dash-hero"><div style="display:flex;align-items:center;gap:12px"><button class="btn btn-ghost" style="border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)" onclick="npi.nav.navigate('projects')">← Back to Projects</button><div><div class="dash-prog-name">${esc(p.name)}</div><div class="dash-prog-meta"><span>${famIcon} ${esc(p.family || 'Other')}</span> ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''} ${p.unit ? `<span>🚂 ${esc(p.unit)}</span>` : ''} ${p.lead ? `<span>🧑‍💼 ME Lead: ${esc(p.lead)}</span>` : ''} ${p.pm ? `<span>📋 Project Manager: ${esc(p.pm)}</span>` : ''} ${p.qNumber ? `<span>🔢 Q: ${esc(p.qNumber)}</span>` : ''} ${totalBomItems > 0 ? `<span>📦 BOM: ${totalBomItems} items</span>` : ''} ${p.date ? `<span>📅 ${p.date}</span>` : ''} <span>📍 Gate ${curGate >= 0 ? curGate : '✓ All complete'}</span></div></div><button class="btn btn-ghost btn-sm" style="margin-left:auto;border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.8)" onclick="npi.dashboard.showEditProject()">✎ Edit Project</button></div></div>
  <div class="dash-body">
    <div class="kpi-grid">
      <div class="kpi-card" onclick="npi.nav.navigate('gate_${curGate >= 0 ? curGate : 5}')" style="--kpi-color:var(--green)"><div class="kpi-num">${gatesDone}<span style="font-size:16px;color:var(--muted)">/6</span></div><div class="kpi-label">Gates Signed</div></div>
      <div class="kpi-card" onclick="npi.nav.navigate('actions')" style="--kpi-color:${overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${openAct}</div><div class="kpi-label">Open Actions</div><div class="kpi-sub">${overdueAct > 0 ? `<span style="color:var(--red)">${overdueAct} overdue</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="npi.nav.navigate('risks')" style="--kpi-color:${highRisks > 0 ? 'var(--red)' : 'var(--blue)'}"><div class="kpi-num">${p.risks.filter(r => r.status !== 'Closed').length}</div><div class="kpi-label">Open Risks</div><div class="kpi-sub">${highRisks > 0 ? `<span style="color:var(--red)">${highRisks} high</span>` : '—'}</div></div>
      <div class="kpi-card" onclick="npi.nav.openPfmeaTab()" style="--kpi-color:${highRPN > 0 ? 'var(--amber)' : 'var(--green)'}"><div class="kpi-num">${highRPN}</div><div class="kpi-label">High RPN</div><div class="kpi-sub">${p.pfmea.length} total rows</div></div>
    </div>
    ${alerts ? `<div class="alert-row">${alerts}</div>` : ''}
    <div class="dash-section-label">Gate Progress</div>
    <div class="gate-strip">${gateStrip}</div>
    <div class="dash-section-label" style="margin-top:8px">Tools</div>
    <div class="section-launcher" style="margin-bottom:16px">${launcherHTML}</div>
    ${parentProg ? `<div class="parent-prog-card" onclick="npi.nav.openProjectById('${parentProg.id}')">
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
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Open Actions</span><button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('actions')">View all →</button></div>${actHTML}</div>
      <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Top Risks</span><button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('risks')">View all →</button></div>${riskHTML}</div>
    </div>
  </div>`
}

// ── Project CRUD ──────────────────────────────────────────────
npi.dashboard.openProject = function(id) { progId = id; navigate('project') }
npi.dashboard.openProjectOrRender = function(id) {
  if (id) {
    npi.dashboard.openProject(id)
    return
  }
  npi.nav.render()
}

npi.dashboard.newProjectInFamily = function(famId) {
  const sel = document.getElementById('np_family')
  if (sel) sel.value = famId
  showModal('modalNewProj')
}

npi.dashboard.createProg = function() {
  const name = document.getElementById('np_name').value.trim()
  if (!name) { alert('Project name is required.'); return }
  const id       = 'p_' + Math.random().toString(36).slice(2)
  const family   = document.getElementById('np_family')?.value   || 'Other'
  const customer = document.getElementById('np_customer')?.value || ''
  const unit     = document.getElementById('np_unit')?.value     || ''
  const lead     = document.getElementById('np_lead')?.value     || ''
  const pm       = document.getElementById('np_pm')?.value       || ''
  const date     = document.getElementById('np_date')?.value     || ''
  const qNumber  = document.getElementById('np_qNumber')?.value?.trim()  || ''
  const partNumber = document.getElementById('np_partNumber')?.value?.trim() || ''
  const parentId = document.getElementById('np_parent')?.value   || null
  const newProg  = migrateprog({
    id, name, family, customer, unit, lead, pm, date, qNumber, partNumber,
    parentId: parentId || null,
    status: 'Active',
    gates: [], ctq: [], pfd: [], pfmea: [], bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    actions: [], risks: [], gantt: [], subAssemblies: []
  })
  db.programmes.push(newProg)
  if (parentId) {
    const parent = db.programmes.find(x => x.id === parentId)
    if (parent) {
      if (!parent.subAssemblies) parent.subAssemblies = []
      if (!parent.subAssemblies.find(x => x.id === id)) parent.subAssemblies.push({ id })
    }
  }
  progId = id
  save()
  closeModal('modalNewProj')
  navigate('project')
}

npi.dashboard.showEditProject = function() {
  const p = prog(); if (!p) return
  populateFamilySelects()
  document.getElementById('ep_name').value     = p.name     || ''
  document.getElementById('ep_family').value   = p.family   || getFamilies()[0]?.id || 'Other'
  document.getElementById('ep_status').value   = p.status   || 'Active'
  document.getElementById('ep_customer').value = p.customer || ''
  document.getElementById('ep_unit').value     = p.unit     || ''
  document.getElementById('ep_lead').value     = p.lead     || ''
  document.getElementById('ep_pm').value       = p.pm       || ''
  document.getElementById('ep_date').value     = p.date     || ''
  document.getElementById('ep_qNumber').value    = p.qNumber    || ''
  document.getElementById('ep_partNumber').value = p.partNumber || ''
  showModal('modalEditProj')
}

npi.dashboard.saveEditProject = function() {
  const p = prog(); if (!p) return
  p.name     = document.getElementById('ep_name').value.trim()     || p.name
  p.family   = document.getElementById('ep_family').value          || 'Other'
  p.status   = document.getElementById('ep_status').value          || 'Active'
  p.customer = document.getElementById('ep_customer').value.trim() || ''
  p.unit     = document.getElementById('ep_unit').value.trim()     || ''
  p.lead     = document.getElementById('ep_lead').value.trim()     || ''
  p.pm       = document.getElementById('ep_pm').value.trim()       || ''
  p.date     = document.getElementById('ep_date').value            || ''
  p.qNumber    = document.getElementById('ep_qNumber').value.trim()    || ''
  p.partNumber = document.getElementById('ep_partNumber').value.trim() || ''
  save()
  closeModal('modalEditProj')
  render()
}

npi.dashboard.deleteProject = function() {
  const p = prog(); if (!p) return
  if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return
  db.programmes = db.programmes.filter(x => x.id !== progId)
  progId = db.programmes.length ? db.programmes[0].id : null
  save()
  closeModal('modalEditProj')
  navigate('projects')
}

// ── Sub-assembly management ───────────────────────────────────
npi.dashboard.openSubAsmModal = function() {
  const p = prog(); if (!p) return
  const others = db.programmes.filter(x => x.id !== progId && !(p.subAssemblies || []).find(s => s.id === x.id))
  if (others.length === 0) { alert('No other projects to link.'); return }
  const existing = document.getElementById('subAsmModalBg'); if (existing) existing.remove()
  const opts = others.map(x =>
    `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line);cursor:pointer;border-radius:6px" onmouseenter="this.style.background='var(--bg)'" onmouseleave="this.style.background=''" onclick="npi.dashboard.linkSubAsm('${x.id}')">
      <span style="font-size:13px">🔩</span>
      <span style="flex:1;font-size:12px;font-weight:600">${esc(x.name)}</span>
      ${x.unit ? `<span style="font-size:10px;color:var(--muted)">${esc(x.unit)}</span>` : ''}
    </div>`
  ).join('')
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'subAsmModalBg'
  bg.innerHTML = `<div class="modal" style="max-width:420px"><div class="modal-head"><span class="modal-title">Link Sub-assembly Project</span><button class="modal-close" onclick="npi.dashboard.closeSubAsmModal()">✕</button></div><div style="padding:8px 4px;max-height:320px;overflow-y:auto">${opts}</div></div>`
  bg.addEventListener('click', e => { if (e.target === bg) npi.dashboard.closeSubAsmModal() })
  document.body.appendChild(bg)
}

npi.dashboard.linkSubAsm = function(id) {
  const p = prog(); if (!p.subAssemblies) p.subAssemblies = []
  if (!p.subAssemblies.find(x => x.id === id)) p.subAssemblies.push({ id })
  const child = db.programmes.find(x => x.id === id)
  if (child && !child.parentId) child.parentId = progId
  save(); npi.dashboard.closeSubAsmModal(); render()
}

npi.dashboard.unlinkSubAsm = function(li) {
  const p = prog()
  const linked = p.subAssemblies[li]
  if (linked) {
    const child = db.programmes.find(x => x.id === linked.id)
    if (child && child.parentId === progId) child.parentId = null
  }
  p.subAssemblies.splice(li, 1)
  save(); render()
}

npi.dashboard.closeSubAsmModal = function() { const el = document.getElementById('subAsmModalBg'); if (el) el.remove() }
