// ═══════════════════════════════════
// dashboard.js — Project home and KPI dashboard rendering
// Depends on: state.js, helpers.js, navigation.js, npi-constants.js, npi.js, gates.js, pfmea.js
// ═══════════════════════════════════

// ── Lane collapse state (persisted to localStorage) ──────────
const npiCollapsedLanes = new Set(
  JSON.parse(localStorage.getItem('npi_collapsed_lanes') || '[]')
)

const NPI_PROJECTS_VIEW_MODE_KEY = 'npi_projects_view_mode'
let npiProjectsViewMode = localStorage.getItem(NPI_PROJECTS_VIEW_MODE_KEY) || 'active'
if (!['active', 'all', 'completed'].includes(npiProjectsViewMode)) {
  npiProjectsViewMode = 'active'
}

let npiProjectsSearch = ''
let npiProjectsFamilyFilter = 'all'
let npiProjectsStatusFilter = 'all'

npi.dashboard.setProjectsViewMode = function(mode) {
  if (!['active', 'all', 'completed'].includes(mode)) return
  npiProjectsViewMode = mode
  localStorage.setItem(NPI_PROJECTS_VIEW_MODE_KEY, mode)
  npiProjectsStatusFilter = 'all'
  render()
}

npi.dashboard.setProjectsSearch = function(value) {
  npiProjectsSearch = (value || '').trim().toLowerCase()
  render()
}

npi.dashboard.setProjectsFamilyFilter = function(value) {
  npiProjectsFamilyFilter = value || 'all'
  render()
}

npi.dashboard.setProjectsStatusFilter = function(value) {
  npiProjectsStatusFilter = value || 'all'
  render()
}

npi.dashboard.clearProjectFilters = function() {
  npiProjectsSearch = ''
  npiProjectsFamilyFilter = 'all'
  npiProjectsStatusFilter = 'all'
  render()
}

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
  const products = productsDataGetAll() || []
  const families = getFamilies()
  const baseStatuses = [
    { key: 'Tender',     icon: '📋', color: 'var(--amber)' },
    { key: 'NPI',        icon: '🔧', color: 'var(--blue)'  },
    { key: 'Production', icon: '🏭', color: 'var(--green)' },
  ]
  const STATUSES = npiProjectsViewMode === 'active'
    ? baseStatuses
    : [...baseStatuses, { key: 'Closed', icon: '📦', color: 'var(--muted)' }]
  const statusKeys = new Set(STATUSES.map(s => s.key))
  const completedCount = products.filter(p => p.status === 'Closed').length
  const familyKeys = new Set(families.map(f => f.id))

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

  const productsByMode = products.filter(p => {
    if (npiProjectsViewMode === 'active') return p.status !== 'Closed'
    if (npiProjectsViewMode === 'completed') return p.status === 'Closed'
    return true
  })

  const visibleProducts = productsByMode.filter(product => {
    if (npiProjectsFamilyFilter !== 'all') {
      const familyId = familyKeys.has(product.family) ? product.family : '__other__'
      if (familyId !== npiProjectsFamilyFilter) return false
    }

    if (npiProjectsStatusFilter !== 'all' && product.status !== npiProjectsStatusFilter) {
      return false
    }

    if (npiProjectsSearch) {
      const haystack = [
        product.name,
        product.code,
        product.part_number,
        product.customer,
        product.family,
      ].join(' ').toLowerCase()
      if (!haystack.includes(npiProjectsSearch)) return false
    }

    return true
  })

  const buildFamilyBucket = () => {
    const byStatus = {}
    STATUSES.forEach(s => { byStatus[s.key] = [] })
    return { all: [], byStatus }
  }

  // Group visible products by family
  const familyMap = {}
  families.forEach(fam => { familyMap[fam.id] = buildFamilyBucket() })
  familyMap['__other__'] = buildFamilyBucket()
  visibleProducts.forEach(product => {
    const famId = product.family && familyMap[product.family] !== undefined
      ? product.family : '__other__'
    const bucket = familyMap[famId]
    const status = statusKeys.has(product.status) ? product.status : 'Tender'
    bucket.all.push(product)
    bucket.byStatus[status].push(product)
  })

  // Global counts per status column
  const totalByStatus = {}
  STATUSES.forEach(s => { totalByStatus[s.key] = 0 })
  visibleProducts.forEach(product => {
    const status = statusKeys.has(product.status) ? product.status : 'Tender'
    totalByStatus[status]++
  })

  const colHeadersHTML = STATUSES.map(s =>
    `<div class="npi-col-header-label" style="border-top-color:${s.color}">
      <span>${s.icon} ${s.key}</span>
      <span class="npi-tab-badge">${totalByStatus[s.key]}</span>
    </div>`
  ).join('')

  const modeButtons = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
  ].map(mode =>
    `<button class="btn btn-ghost npi-mode-btn${npiProjectsViewMode === mode.key ? ' is-active' : ''}" onclick="npi.dashboard.setProjectsViewMode('${mode.key}')">${mode.label}</button>`
  ).join('')

  const visibleLabel = npiProjectsViewMode === 'active'
    ? 'Active view'
    : npiProjectsViewMode === 'completed'
      ? 'Completed view'
      : 'All projects view'

  const statusFilterButtons = [{ key: 'all', label: 'All status' }, ...STATUSES.map(s => ({ key: s.key, label: s.key }))]
    .map(s => `<button class="btn btn-ghost npi-status-chip${npiProjectsStatusFilter === s.key ? ' is-active' : ''}" onclick="npi.dashboard.setProjectsStatusFilter('${s.key}')">${s.label}</button>`)
    .join('')

  const familyOptions = [
    `<option value="all" ${npiProjectsFamilyFilter === 'all' ? 'selected' : ''}>All families</option>`,
    ...families.map(f => `<option value="${esc(f.id)}" ${npiProjectsFamilyFilter === f.id ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`),
    `<option value="__other__" ${npiProjectsFamilyFilter === '__other__' ? 'selected' : ''}>📋 Unassigned</option>`
  ].join('')

  const hasActiveFilters = !!npiProjectsSearch || npiProjectsFamilyFilter !== 'all' || npiProjectsStatusFilter !== 'all'

  const programmeByProductId = new Map((db.programmes || []).filter(p => p.product_id).map(p => [p.product_id, p]))

  let html = `<div class="proj-home">
    <div class="proj-home-header">
      <div>
        <div class="proj-home-title">NPI Projects</div>
        <div class="proj-home-sub">Signed in as ${esc(user)} · Status is managed in Product Management</div>
      </div>
      <div class="npi-projects-toolbar">
        <div class="npi-mode-group">${modeButtons}</div>
        <span class="npi-completed-badge" title="Completed projects retained in archive view">Completed: ${completedCount}</span>
        <button class="btn btn-ghost" onclick="npi.nav.navigate('hub')">← Back to Hub</button>
      </div>
    </div>
    <div class="npi-swimlane-wrap">
      <div class="npi-view-note">${visibleLabel} · ${visibleProducts.length} shown</div>
      <div class="npi-filter-row">
        <input class="npi-search-input" type="search" placeholder="Search name, code, customer..." value="${esc(npiProjectsSearch)}" oninput="npi.dashboard.setProjectsSearch(this.value)">
        <select class="npi-family-filter" onchange="npi.dashboard.setProjectsFamilyFilter(this.value)">
          ${familyOptions}
        </select>
        <div class="npi-status-chips">${statusFilterButtons}</div>
        ${hasActiveFilters ? `<button class="btn btn-ghost" onclick="npi.dashboard.clearProjectFilters()">Clear filters</button>` : ''}
      </div>
      <div class="npi-col-headers" style="grid-template-columns:repeat(${STATUSES.length}, minmax(0, 1fr))">${colHeadersHTML}</div>`

  const renderLane = (famId, famLabel, famIcon, laneData) => {
    if (!laneData || laneData.all.length === 0) return ''
    const elemId    = 'npi-lane-' + famId.replace(/[^a-zA-Z0-9]/g, '_')
    const collapsed = npiCollapsedLanes.has(famId)
    const countBits = STATUSES.map(s => {
      const n = laneData.byStatus[s.key].length
      return n > 0 ? `<span style="color:${s.color}">${n}</span>` : null
    }).filter(Boolean).join('<span style="color:var(--line2)"> · </span>')

    const colsHTML = STATUSES.map(s => {
      const col = laneData.byStatus[s.key]
      return `<div class="npi-lane-col">
        ${col.length === 0
          ? `<div class="npi-lane-empty">—</div>`
          : col.map(product => {
              const programme = programmeByProductId.get(product.id)
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
      <div class="npi-lane-body" style="grid-template-columns:repeat(${STATUSES.length}, minmax(0, 1fr))">${colsHTML}</div>
    </div>`
  }

  families.forEach(fam => {
    html += renderLane(fam.id, fam.label, fam.icon, familyMap[fam.id])
  })
  if ((familyMap['__other__'] || {}).all && familyMap['__other__'].all.length > 0) {
    html += renderLane('__other__', 'Unassigned', '📋', familyMap['__other__'])
  }

  if (visibleProducts.length === 0) {
    html += `<div class="npi-empty-view">No projects match this view/filter combination.</div>`
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
  const hasHighRPN = programme && (programme.pfmea || []).some(r => npi.pfmea.calcRPN(r) >= RPN_HIGH)
  const rpnBadge = hasHighRPN ? `<div class="npi-slim-rpn-badge">⚠ High RPN</div>` : ''
  const targetProgId = programme ? programme.id : ''
  return `<div class="npi-slim-card" onclick="npi.dashboard.openProjectOrRender('${targetProgId}')">
    <div class="npi-slim-card-name">${esc(product.name)}</div>
    ${product.code     ? `<div class="npi-slim-card-code">${esc(product.code)}</div>` : ''}
    ${product.customer ? `<div class="npi-slim-card-meta">👤 ${esc(product.customer)}</div>` : ''}
    ${rpnBadge}
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
  if (highRPN > 0)   alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRPN} failure cause${highRPN !== 1 ? 's' : ''} with RPN ≥ 100</strong> ${npi.components.badge(highRPN, { low: 1, high: 5, critical: 10 })} — <a href="#" onclick="npi.nav.openPfmeaTab();return false" style="color:inherit;text-decoration:underline">View PFMEA →</a></div>`

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
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line)"><span class="rpn ${s >= 12 ? 'rpn-hi' : s >= 6 ? 'rpn-md' : 'rpn-lo'}">${s}</span><span style="flex:1;font-size:12px">${esc(r.desc)}</span><span style="font-size:10px;color:var(--muted)">${esc(r.cat || '')}</span></div>`
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open risks</div>`

  const famIcon    = FAMILIES.find(f => f.id === (p.family || 'Other'))?.icon || '📋'
  const parentProg = p.parentId ? db.programmes.find(x => x.id === p.parentId) : null
  const liveUpdateBadge = typeof npiRealtimeIndicatorHTML === 'function' ? npiRealtimeIndicatorHTML() : ''
  const curGateIndex = curGate >= 0 ? curGate : 5
  const curGateDef = GATE_DEFS[curGateIndex]
  const openRiskCount = p.risks.filter(r => r.status !== 'Closed').length

  const trajectoryHTML = GATE_DEFS.map((g, i) => {
    const gd = p.gates[i] || {}
    const done = npi.gate.gateAllSigned(gd)
    const cls = done ? 'done' : i === curGateIndex ? 'active pulse' : ''
    const node = `<button class="gate ${cls}" onclick="npi.nav.navigate('gate_${g.num}')" title="Open Gate ${g.num}: ${g.name}">${g.num}</button>`
    if (i === GATE_DEFS.length - 1) return node
    const connectorCls = i < curGateIndex ? 'done' : i === curGateIndex - 1 ? 'active' : ''
    return `${node}<div class="connector ${connectorCls}"></div>`
  }).join('')

  const nextSteps = []
  if (overdueAct > 0) nextSteps.push(`Close ${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}`)
  if (curGateDef) nextSteps.push(`Complete remaining checks for Gate ${curGateDef.num}`)
  if (highRisks > 0) nextSteps.push(`Review ${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}`)
  if (nextSteps.length === 0) nextSteps.push('Project is in good shape, continue planned activity')

  return `<div class="mc-shell">
    <div class="dash-hero">
      <div class="hero-left">
        <div class="eyebrow">APQP MISSION CONTROL</div>
        <div class="dash-prog-name">${esc(p.name)}</div>
        <div class="hero-sub">Focus view: what matters now, what is blocked, what to do next.</div>
      </div>
      <div class="hero-right">
        <button class="btn btn-ghost" onclick="npi.nav.navigate('projects')">← Back</button>
        <button class="btn btn-primary" onclick="npi.dashboard.showEditProject()">Edit Project</button>
      </div>
    </div>
    ${liveUpdateBadge ? `<div class="live-row">${liveUpdateBadge}</div>` : ''}
    <div class="dash-body">
      <div class="command-strip">
        <article class="cmd-card spotlight" onclick="npi.nav.navigate('gate_${curGateIndex}')">
          <div class="cmd-title">Current Gate</div>
          <div class="cmd-big">Gate ${curGateIndex}</div>
          <div class="cmd-sub">${esc(curGateDef ? curGateDef.name : 'All complete')}</div>
        </article>
        <article class="cmd-card alarm" onclick="npi.nav.navigate('actions')">
          <div class="cmd-title">Critical Attention</div>
          <div class="cmd-big">${overdueAct}</div>
          <div class="cmd-sub">Overdue actions</div>
        </article>
        <article class="cmd-card" onclick="npi.nav.navigate('risks')">
          <div class="cmd-title">Risk Heat</div>
          <div class="cmd-big">${highRisks}</div>
          <div class="cmd-sub">High severity open risks</div>
        </article>
      </div>

      <section class="layout">
        <div class="panel gate-panel">
          <div class="panel-head">
            <h2>Gate Trajectory</h2>
            <span>Click a gate to open detail</span>
          </div>
          <div class="trajectory">${trajectoryHTML}</div>
          <div class="next-box">
            <h3>Next 72 Hours</h3>
            <ul>${nextSteps.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="panel stack">
          <div class="stack-card">
            <h3>Quick Launch</h3>
            <div class="chips">
              <button onclick="npi.nav.navigate('apqp')">APQP</button>
              <button onclick="npi.nav.navigate('bom')">BOM</button>
              <button onclick="npi.nav.navigate('timing')">Timing</button>
              <button onclick="npi.nav.navigate('actions')">Actions</button>
              <button onclick="npi.nav.navigate('risks')">Risks</button>
            </div>
          </div>

          <div class="stack-card muted">
            <h3>Project Snapshot</h3>
            <div class="dash-prog-meta">
              <span>${famIcon} ${esc(p.family || 'Other')}</span>
              ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''}
              ${p.unit ? `<span>🚂 ${esc(p.unit)}</span>` : ''}
              ${p.pm ? `<span>📋 ${esc(p.pm)}</span>` : ''}
              ${p.qNumber ? `<span>🔢 Q ${esc(p.qNumber)}</span>` : ''}
            </div>
            ${parentProg ? `<div class="parent-link" onclick="npi.nav.openProjectById('${parentProg.id}')">Parent: ${esc(parentProg.name)}</div>` : ''}
          </div>
        </div>
      </section>

      <div class="stack-card muted detail-stack">
        <h3>Details (Collapsed by default)</h3>
        <details>
          <summary>Sub-assemblies</summary>
          <div class="detail-body">${subAsmHTML}</div>
        </details>
        <details>
          <summary>RPN Burndown</summary>
          <div class="detail-body">${rpnBurndownHTML}</div>
        </details>
        <details>
          <summary>Open Actions and Top Risks</summary>
          <div class="detail-body dash-grid">
            <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Open Actions</span><button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('actions')">View all →</button></div>${actHTML}</div>
            <div class="card" style="margin-bottom:0"><div class="card-head"><span class="card-title">Top Risks</span><button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('risks')">View all →</button></div>${riskHTML}</div>
          </div>
        </details>
      </div>
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
  // Read-only product info
  const familyName = getFamilies().find(f => f.id === p.family)?.name || p.family || '—'
  document.getElementById('ep_ro_name').textContent     = p.name     || '—'
  document.getElementById('ep_ro_customer').textContent = p.customer ? 'Customer: ' + p.customer : ''
  document.getElementById('ep_ro_unit').textContent     = p.unit     ? 'Unit: ' + p.unit         : ''
  document.getElementById('ep_ro_family').textContent   = familyName ? 'Family: ' + familyName   : ''
  // Editable project fields
  document.getElementById('ep_status').value = p.status || 'Active'
  document.getElementById('ep_lead').value   = p.lead   || ''
  document.getElementById('ep_pm').value     = p.pm     || ''
  document.getElementById('ep_date').value   = p.date   || ''
  document.getElementById('ep_qNumber').value = p.qNumber || ''
  showModal('modalEditProj')
}

npi.dashboard.saveEditProject = function() {
  const p = prog(); if (!p) return
  p.status = document.getElementById('ep_status').value || 'Active'
  p.lead   = document.getElementById('ep_lead').value.trim()    || ''
  p.pm     = document.getElementById('ep_pm').value.trim()      || ''
  p.date   = document.getElementById('ep_date').value           || ''
  p.qNumber = document.getElementById('ep_qNumber').value.trim() || ''
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
