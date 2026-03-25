// ═══════════════════════════════════
// dashboard.js — Project home and KPI dashboard rendering
// Depends on: state.js, helpers.js, navigation.js, npi-constants.js, npi.js, gates.js, pfmea.js
// ═══════════════════════════════════

// ── Lane collapse state (persisted to localStorage) ──────────
const npiCollapsedLanes = new Set(JSON.parse(localStorage.getItem('npi_collapsed_lanes') || '[]'))

const NPI_PROJECTS_VIEW_MODE_KEY = 'npi_projects_view_mode'
let npiProjectsViewMode = localStorage.getItem(NPI_PROJECTS_VIEW_MODE_KEY) || 'active'
if (!['active', 'all', 'completed'].includes(npiProjectsViewMode)) {
  npiProjectsViewMode = 'active'
}

let npiProjectsSearch = ''
let npiProjectsFamilyFilter = 'all'
let npiProjectsStatusFilter = 'all'

npi.dashboard.setProjectsViewMode = function (mode) {
  if (!['active', 'all', 'completed'].includes(mode)) return
  npiProjectsViewMode = mode
  localStorage.setItem(NPI_PROJECTS_VIEW_MODE_KEY, mode)
  npiProjectsStatusFilter = 'all'
  // Update URL to persist view mode
  const parts = ['s=projects']
  if (npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab))
  if (npiProjectsSearch) parts.push('ps=' + encodeURIComponent(npiProjectsSearch))
  if (npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(npiProjectsFamilyFilter))
  if (mode !== 'active') parts.push('pvm=' + encodeURIComponent(mode))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.dashboard.setProjectsSearch = function (value) {
  npiProjectsSearch = (value || '').trim().toLowerCase()
  // Update URL to persist search (use replace to avoid flooding history)
  const parts = ['s=projects']
  if (npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab))
  if (npiProjectsSearch) parts.push('ps=' + encodeURIComponent(npiProjectsSearch))
  if (npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(npiProjectsFamilyFilter))
  if (npiProjectsStatusFilter !== 'all') parts.push('pst=' + encodeURIComponent(npiProjectsStatusFilter))
  if (npiProjectsViewMode !== 'active') parts.push('pvm=' + encodeURIComponent(npiProjectsViewMode))
  writeNavigationHistory('#' + parts.join('&'), { push: false })
  render()
}

npi.dashboard.setProjectsSearchFromInput = function (inputEl) {
  if (!inputEl) {
    npi.dashboard.setProjectsSearch('')
    return
  }

  if (typeof preserveInputCaretAfterRender === 'function') {
    preserveInputCaretAfterRender(inputEl, function() {
      npi.dashboard.setProjectsSearch(inputEl.value)
    }, {
      replacementSelector: '.npi-search-input[name="npi_projects_search"]'
    })
    return
  }

  const selectionStart =
    typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : null
  const selectionEnd = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : null

  npi.dashboard.setProjectsSearch(inputEl.value)

  // Search updates re-render the dashboard; restore caret on the replacement input.
  setTimeout(() => {
    const nextInput = document.querySelector('.npi-search-input[name="npi_projects_search"]')
    if (!nextInput) return

    nextInput.focus()

    const len = nextInput.value.length
    const safeStart =
      typeof selectionStart === 'number' ? Math.max(0, Math.min(selectionStart, len)) : len
    const safeEnd =
      typeof selectionEnd === 'number' ? Math.max(safeStart, Math.min(selectionEnd, len)) : safeStart

    if (typeof nextInput.setSelectionRange === 'function') {
      nextInput.setSelectionRange(safeStart, safeEnd)
    }
  }, 0)
}

npi.dashboard.setProjectsFamilyFilter = function (value) {
  npiProjectsFamilyFilter = value || 'all'
  // Update URL to persist family filter
  const parts = ['s=projects']
  if (npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab))
  if (npiProjectsSearch) parts.push('ps=' + encodeURIComponent(npiProjectsSearch))
  if (npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(npiProjectsFamilyFilter))
  if (npiProjectsStatusFilter !== 'all') parts.push('pst=' + encodeURIComponent(npiProjectsStatusFilter))
  if (npiProjectsViewMode !== 'active') parts.push('pvm=' + encodeURIComponent(npiProjectsViewMode))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.dashboard.setProjectsStatusFilter = function (value) {
  npiProjectsStatusFilter = value || 'all'
  // Update URL to persist status filter
  const parts = ['s=projects']
  if (npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab))
  if (npiProjectsSearch) parts.push('ps=' + encodeURIComponent(npiProjectsSearch))
  if (npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(npiProjectsFamilyFilter))
  if (npiProjectsStatusFilter !== 'all') parts.push('pst=' + encodeURIComponent(npiProjectsStatusFilter))
  if (npiProjectsViewMode !== 'active') parts.push('pvm=' + encodeURIComponent(npiProjectsViewMode))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.dashboard.clearProjectFilters = function () {
  npiProjectsSearch = ''
  npiProjectsFamilyFilter = 'all'
  npiProjectsStatusFilter = 'all'
  // Update URL to clear filters
  const parts = ['s=projects']
  if (npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.dashboard.setDashTab = function (tab) {
  if (!['projects'].includes(tab)) return
  npiDashboardTab = tab
  render()
}

// ── Auto-create projects for all products ───────────────────
npi.dashboard.ensureProductProjects = function () {
  const products = productsDataGetAll()
  if (!products || products.length === 0) return

  let created = 0
  let updated = 0
  products.forEach((product) => {
    const existing =
      typeof findProjectByProductId === 'function'
        ? findProjectByProductId(product.id)
        : db.projects.find((p) => p.product_id === product.id)
    const family =
      typeof normalizeFamilyId === 'function'
        ? normalizeFamilyId(product.family || '', 'Other')
        : product.family || 'Other'

    if (!existing) {
      const np = migrateprog({
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        name: product.name,
        customer: product.customer || '',
        family: family,
        unit: product.code || '',
        product_id: product.id,
        date: new Date().toISOString().slice(0, 10),
        status: 'Active'
      })
      db.projects.push(np)
      created++
      return
    }

    if (typeof syncProjectFamily === 'function') {
      if (syncProjectFamily(existing, family, existing.family || 'Other')) updated++
    } else if ((existing.family || '') !== family) {
      existing.family = family
      updated++
    }
  })
  if (created > 0 || updated > 0) save()
}

npi.dashboard.toggleNpiLane = function (familyId) {
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
npi.dashboard.renderProjects = function () {
  npi.dashboard.ensureProductProjects()
  const user = currentUser ? currentUser.email.split('@')[0] : ''
  const products = productsDataGetAll() || []
  const families = getFamilies()
  const baseStatuses = [
    { key: 'Tender', icon: '📋', color: 'var(--amber)' },
    { key: 'NPI', icon: '🔧', color: 'var(--blue)' },
    { key: 'Production', icon: '🏭', color: 'var(--green)' }
  ]
  const STATUSES =
    npiProjectsViewMode === 'active'
      ? baseStatuses
      : [...baseStatuses, { key: 'Closed', icon: '📦', color: 'var(--muted)' }]
  const statusKeys = new Set(STATUSES.map((s) => s.key))
  const completedCount = products.filter((p) => p.status === 'Closed').length
  const familyKeys = new Set(families.map((f) => f.id))

  if (!products || products.length === 0) {
    return `<div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">NPI Projects</div>
          <div class="proj-home-sub">Signed in as ${esc(user)}</div>
        </div>
        <button class="btn btn-ghost" onclick="npi.nav.navigate('hub')">← Back to Hub</button>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-projects')" title="User Guide">❓ Guide</button>
      </div>
      <div style="text-align:center;padding:80px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No products yet</div>
        <div style="font-size:13px;margin-bottom:24px">Add products in Product Management to get started</div>
        <button class="btn btn-primary" onclick="npi.nav.setProductDevelopmentTab('product-management')">Go to Product Management</button>
      </div>
    </div>`
  }

  const productsByMode = products.filter((p) => {
    if (npiProjectsViewMode === 'active') return p.status !== 'Closed'
    if (npiProjectsViewMode === 'completed') return p.status === 'Closed'
    return true
  })

  const visibleProducts = productsByMode.filter((product) => {
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
        product.family
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(npiProjectsSearch)) return false
    }

    return true
  })

  const buildFamilyBucket = () => {
    const byStatus = {}
    STATUSES.forEach((s) => {
      byStatus[s.key] = []
    })
    return { all: [], byStatus }
  }

  // Group visible products by family
  const familyMap = {}
  families.forEach((fam) => {
    familyMap[fam.id] = buildFamilyBucket()
  })
  familyMap['__other__'] = buildFamilyBucket()
  visibleProducts.forEach((product) => {
    const famId =
      product.family && familyMap[product.family] !== undefined ? product.family : '__other__'
    const bucket = familyMap[famId]
    const status = statusKeys.has(product.status) ? product.status : 'Tender'
    bucket.all.push(product)
    bucket.byStatus[status].push(product)
  })

  // Global counts per status column
  const totalByStatus = {}
  STATUSES.forEach((s) => {
    totalByStatus[s.key] = 0
  })
  visibleProducts.forEach((product) => {
    const status = statusKeys.has(product.status) ? product.status : 'Tender'
    totalByStatus[status]++
  })

  const colHeadersHTML = STATUSES.map(
    (s) =>
      `<div class="npi-col-header-label" style="border-top-color:${s.color}">
      <span>${s.icon} ${s.key}</span>
      <span class="npi-tab-badge">${totalByStatus[s.key]}</span>
    </div>`
  ).join('')

  const modeButtons = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' }
  ]
    .map(
      (mode) =>
        `<button class="btn btn-ghost npi-mode-btn${npiProjectsViewMode === mode.key ? ' is-active' : ''}" onclick="npi.dashboard.setProjectsViewMode('${mode.key}')">${mode.label}</button>`
    )
    .join('')

  const visibleLabel =
    npiProjectsViewMode === 'active'
      ? 'Active view'
      : npiProjectsViewMode === 'completed'
        ? 'Completed view'
        : 'All projects view'

  const statusFilterButtons = [
    { key: 'all', label: 'All status' },
    ...STATUSES.map((s) => ({ key: s.key, label: s.key }))
  ]
    .map(
      (s) =>
        `<button class="btn btn-ghost npi-status-chip${npiProjectsStatusFilter === s.key ? ' is-active' : ''}" onclick="npi.dashboard.setProjectsStatusFilter('${s.key}')">${s.label}</button>`
    )
    .join('')

  const familyOptions = [
    `<option value="all" ${npiProjectsFamilyFilter === 'all' ? 'selected' : ''}>All families</option>`,
    ...families.map(
      (f) =>
        `<option value="${esc(f.id)}" ${npiProjectsFamilyFilter === f.id ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`
    ),
    `<option value="__other__" ${npiProjectsFamilyFilter === '__other__' ? 'selected' : ''}>📋 Unassigned</option>`
  ].join('')

  const hasActiveFilters =
    !!npiProjectsSearch || npiProjectsFamilyFilter !== 'all' || npiProjectsStatusFilter !== 'all'

  const projectByProductId = new Map(
    (db.projects || []).filter((p) => p.product_id).map((p) => [p.product_id, p])
  )

  let html = `<div class="proj-home">
    <div class="proj-home-header">
      <div>
        <div class="proj-home-title">NPI Projects</div>
        <div class="proj-home-sub">Signed in as ${esc(user)} · Status is managed in Product Management</div>
      </div>
      <div class="npi-projects-toolbar">
        <div class="npi-mode-group">${modeButtons}</div>
        <span class="npi-completed-badge" title="Completed projects retained in archive view">Completed: ${completedCount}</span>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-projects')" title="User Guide">❓ Guide</button>
        <button class="btn btn-ghost" onclick="npi.nav.navigate('hub')">← Back to Hub</button>
      </div>
    </div>
    <div class="npi-swimlane-wrap">
      <div class="npi-view-note">${visibleLabel} · ${visibleProducts.length} shown</div>
      <div class="npi-filter-row">
        <input class="npi-search-input" name="npi_projects_search" type="search" placeholder="Search name, code, customer..." value="${esc(npiProjectsSearch)}" oninput="npi.dashboard.setProjectsSearchFromInput(this)">
        <select class="npi-family-filter" name="npi_projects_family_filter" onchange="npi.dashboard.setProjectsFamilyFilter(this.value)">
          ${familyOptions}
        </select>
        <div class="npi-status-chips">${statusFilterButtons}</div>
        ${hasActiveFilters ? `<button class="btn btn-ghost" onclick="npi.dashboard.clearProjectFilters()">Clear filters</button>` : ''}
      </div>
      <div class="npi-col-headers" style="grid-template-columns:repeat(${STATUSES.length}, minmax(0, 1fr))">${colHeadersHTML}</div>`

  const renderLane = (famId, famLabel, famIcon, laneData) => {
    if (!laneData || laneData.all.length === 0) return ''
    const elemId = 'npi-lane-' + famId.replace(/[^a-zA-Z0-9]/g, '_')
    const collapsed = npiCollapsedLanes.has(famId)
    const countBits = STATUSES.map((s) => {
      const n = laneData.byStatus[s.key].length
      return n > 0 ? `<span style="color:${s.color}">${n}</span>` : null
    })
      .filter(Boolean)
      .join('<span style="color:var(--line2)"> · </span>')

    const colsHTML = STATUSES.map((s) => {
      const col = laneData.byStatus[s.key]
      return `<div class="npi-lane-col">
        ${
          col.length === 0
            ? `<div class="npi-lane-empty">—</div>`
            : col
                .map((product) => {
                  const project = projectByProductId.get(product.id)
                  return npi.dashboard.renderNpiSlimCard(product, project)
                })
                .join('')
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

  families.forEach((fam) => {
    html += renderLane(fam.id, fam.label, fam.icon, familyMap[fam.id])
  })
  if ((familyMap['__other__'] || {}).all && familyMap['__other__'].all.length > 0) {
    html += renderLane('__other__', 'Unassigned', '📋', familyMap['__other__'])
  }

  if (visibleProducts.length === 0) {
    html += `<div class="npi-empty-view" style="text-align:center;padding:40px">
      <div style="color:var(--muted);margin-bottom:12px">No projects match this view/filter combination.</div>
      <div style="color:var(--muted)">Projects are created automatically when products are added in Product Management.</div>
    </div>`
  }

  // 3-A: "Load more" footer — only shown when more pages are available
  if (typeof projectsAllLoaded !== 'undefined' && !projectsAllLoaded) {
    html += `<div class="npi-load-more-row">
      <button class="btn btn-ghost" onclick="loadMoreProjects()">⬇ Load more projects</button>
    </div>`
  }

  html += `</div></div>`
  return html
}

// ── Slim card for a product + its linked project ────────────
npi.dashboard.renderNpiSlimCard = function (product, project) {
  const isFavourite = typeof hubIsProductFavourite === 'function'
    ? hubIsProductFavourite(product.id)
    : false
  let pipsHtml = ''
  let gateScopeBadge = ''
  if (project) {
    if (project.parentId) {
      pipsHtml = `<div style="margin-top:6px;font-size:10px;color:var(--muted);font-family:'IBM Plex Mono',monospace">Root-managed gates</div>`
      gateScopeBadge = `<div style="margin-top:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;padding:3px 7px;border-radius:999px;border:1px solid var(--line);color:var(--muted);display:inline-flex;gap:6px;align-items:center">Sub-assembly · APQP + BOM</div>`
    } else {
      const gates = project.gates || []
      const curGate = gates.findIndex((g) => !npi.gate.gateAllSigned(g))
      pipsHtml =
        `<div class="proj-card-gate" style="margin-top:6px">` +
        GATE_DEFS.map((g, i) => {
          const gd = gates[i]
          const cls = gd && npi.gate.gateAllSigned(gd) ? 'done' : i === curGate ? 'active' : ''
          return `<div class="proj-gate-pip ${cls}" title="Gate ${g.num}: ${g.name}"></div>`
        }).join('') +
        `</div>`

      const scoped = !!project.gate_selections
      const locked = !!project.gate_selection_locked
      const selectedTotal = GATE_DEFS.reduce(
        (sum, g) => sum + getProjectGateSelection(project.id, g.num).length,
        0
      )
      const totalQuestions = GATE_DEFS.reduce(
        (sum, g) => sum + getDefaultGateSelection(g.num).length,
        0
      )
      const perGate = GATE_DEFS.map((g) => {
        const sel = getProjectGateSelection(project.id, g.num).length
        const tot = getDefaultGateSelection(g.num).length
        return `G${g.num} ${sel}/${tot}`
      }).join(' · ')
      const label = locked ? 'Scope Locked' : scoped ? 'Scope Editable' : 'Scope Default'
      const border = locked ? 'var(--green-mid)' : scoped ? 'var(--blue)' : 'var(--line)'
      const text = locked ? 'var(--green)' : scoped ? 'var(--blue)' : 'var(--muted)'

      gateScopeBadge = `<div title="${esc(perGate)}" style="margin-top:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;padding:3px 7px;border-radius:999px;border:1px solid ${border};color:${text};display:inline-flex;gap:6px;align-items:center">${label} · ${selectedTotal}/${totalQuestions}</div>`
    }
  }
  const hasHighRPN = project && (project.pfmea || []).some((r) => npi.pfmea.calcRPN(r) >= RPN_HIGH)
  const rpnBadge = hasHighRPN ? `<div class="npi-slim-rpn-badge">⚠ High RPN</div>` : ''
  const subAsmCount = project && Array.isArray(project.subAssemblies) ? project.subAssemblies.length : 0
  const subAsmBadge = subAsmCount > 0
    ? `<div class="npi-slim-subasm-badge">🔩 ${subAsmCount} sub-assembl${subAsmCount === 1 ? 'y' : 'ies'}</div>`
    : ''
  const targetProgId = project ? project.id : ''
  const productScope = product.scope || 'overhaul'
  const scopeIcons = { overhaul: '🔄', repair: '🔧', assembly: '🔩' }
  const scopeIcon = scopeIcons[productScope] || '🔄'
  const scopeLabel = productScope.charAt(0).toUpperCase() + productScope.slice(1)
  const scopeBadge = `<div class="npi-slim-card-meta" style="margin-top:4px">${scopeIcon} ${esc(scopeLabel)}</div>`
  return `<div class="npi-slim-card" onclick="npi.dashboard.openProjectOrRender('${targetProgId}')">
    <button
      class="npi-slim-fav-toggle${isFavourite ? ' is-active' : ''}"
      type="button"
      title="${isFavourite ? 'Remove from favourites' : 'Add to favourites'}"
      data-product-id="${esc(product.id || '')}"
      onclick="npi.nav.stopEvent(event);hubToggleProductFavourite(this.dataset.productId, event)">
      ${isFavourite ? '★' : '☆'}
    </button>
    <div class="npi-slim-card-name">${esc(product.name)}</div>
    ${product.code ? `<div class="npi-slim-card-code">${esc(product.code)}</div>` : ''}
    ${product.customer ? `<div class="npi-slim-card-meta">👤 ${esc(product.customer)}</div>` : ''}
    ${scopeBadge}
    ${gateScopeBadge}
    ${subAsmBadge}
    ${rpnBadge}
    ${pipsHtml}
  </div>`
}

// ── Shared APQP completion helpers ───────────────────────────
// Used by renderDashboard (main project), sub-assembly cards, and the
// sub-assembly average completion reducer — defined once to avoid drift.
function apqpCompletionPct(project) {
  const done = ['ctq', 'pfd', 'pfmea', 'cp'].filter(
    (k) => (project[k] || []).length > 0
  ).length
  return Math.round((done / 4) * 100)
}

function bomTotalItems(project) {
  return Object.keys(BOM_TYPES).reduce(
    (n, k) => n + ((project.bom && project.bom[k]) ? project.bom[k].length : 0),
    0
  )
}

// ── Dashboard ─────────────────────────────────────────────────
npi.dashboard.renderDashboard = function () {
  const p = prog()
  if (!p) return '<div class="mc-shell"><p style="padding:24px;color:var(--muted)">No project selected.</p></div>'
  const actions = Array.isArray(p.actions) ? p.actions : []
  const risks = Array.isArray(p.risks) ? p.risks : []
  const pfmea = Array.isArray(p.pfmea) ? p.pfmea : []
  const gates = Array.isArray(p.gates) ? p.gates : []
  const gantt = Array.isArray(p.gantt) ? p.gantt : []
  const subAssemblies = Array.isArray(p.subAssemblies) ? p.subAssemblies : []
  const bom = p.bom || {}
  const bomParts = Array.isArray(bom.parts) ? bom.parts : []
  const bomMat = Array.isArray(bom.mat) ? bom.mat : []
  const bomCons = Array.isArray(bom.cons) ? bom.cons : []
  const bomKits = Array.isArray(bom.kits) ? bom.kits : []
  const openAct = actions.filter((a) => a.status !== 'Closed').length
  const overdueAct = actions.filter(
    (a) => a.status !== 'Closed' && a.due && new Date(a.due) < new Date()
  ).length
  const highRisks = risks.filter((r) => r.lik * r.imp >= 12 && r.status !== 'Closed').length
  const highRPN = pfmea.filter((r) => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
  const gatesDone = gates.filter((g) => npi.gate.gateAllSigned(g)).length
  const curGate = gates.findIndex((g) => !npi.gate.gateAllSigned(g))
  const aaw = [...bomParts, ...bomMat, ...bomCons].filter((x) => x.isAaw).length
  const timingTotal = gantt.length
  const timingFilled = gantt.filter((r) => r.weeks && r.weeks.some((w) => w > 0)).length
  const parentProg = p.parentId ? db.projects.find((x) => x.id === p.parentId) : null

  if (parentProg) {
    const childBomItems = bomTotalItems(p)
    const apqpPct = apqpCompletionPct(p)
    const linkedInParent = (parentProg.subAssemblies || []).find((x) => x.id === p.id)
    const linkedKit = linkedInParent
      ? (parentProg.bom.kits || []).find((k) => k.id === linkedInParent.kitId)
      : null

    return `<div class="mc-shell"><div class="dash-hero"><div class="hero-left"><div class="eyebrow">SUB-ASSEMBLY WORKSPACE</div><div class="dash-prog-name">${esc(p.name)}</div><div class="hero-sub">APQP and BoM only. Gates and project management are controlled in root project ${esc(parentProg.name)}.</div></div><div class="hero-right"><button class="btn btn-ghost" onclick="npi.nav.openProjectById('${parentProg.id}')">← Open Root Project</button><button class="btn btn-primary" onclick="npi.nav.navigate('apqp')">Open APQP</button></div></div><div class="dash-body"><section class="layout"><div class="panel stack"><div class="stack-card"><h3>Sub-assembly Progress</h3><div class="dash-prog-meta"><span>📐 APQP tools: ${apqpPct}%</span><span>📦 BoM items: ${childBomItems}</span><span>🧩 Root kit: ${linkedKit ? esc(linkedKit.name || 'Linked') : 'Missing'}</span></div></div><div class="stack-card muted"><h3>Root-managed controls</h3><div class="chips"><button onclick="npi.nav.openParentSection('project')">Gate and PM Dashboard</button><button onclick="npi.nav.openParentSection('actions')">Root Actions</button><button onclick="npi.nav.openParentSection('risks')">Root Risks</button></div></div></div><div class="panel stack"><div class="stack-card"><h3>Quick Launch</h3><div class="chips"><button onclick="npi.nav.navigate('apqp')">📐 APQP</button><button onclick="npi.nav.navigate('bom')">📦 BOM</button></div></div></div></section></div></div>`
  }

  let alerts = ''
  if (overdueAct > 0)
    alerts += `<div class="alert-item alert-red">🔴 <strong>${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}</strong> — <a href="#" onclick="npi.nav.navigate('actions');return false" style="color:inherit;text-decoration:underline">View Actions →</a></div>`
  if (highRisks > 0)
    alerts += `<div class="alert-item alert-amber">🟡 <strong>${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}</strong> open — <a href="#" onclick="npi.nav.navigate('risks');return false" style="color:inherit;text-decoration:underline">View Risks →</a></div>`
  if (highRPN > 0)
    alerts += `<div class="alert-item alert-amber">⚠ <strong>${highRPN} failure cause${highRPN !== 1 ? 's' : ''} with RPN ≥ 100</strong> ${npi.components.badge(highRPN, { low: 1, high: 5, critical: 10 })} — <a href="#" onclick="npi.nav.openPfmeaTab();return false" style="color:inherit;text-decoration:underline">View PFMEA →</a></div>`

  const gateStrip = GATE_DEFS.map((g, i) => {
    const gd = p.gates[i] || {}
    const signed = npi.gate.gateAllSigned(gd)
    const checks = gd.checks || []
    const done = checks.filter(Boolean).length
    const total = g.items.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const hasActivity = done > 0
    const dotCls = signed ? 'gs-signed' : hasActivity ? 'gs-open' : 'gs-pending'
    const labelCol = signed
      ? 'var(--green)'
      : i === (curGate < 0 ? 5 : curGate)
        ? 'var(--blue)'
        : 'var(--muted)'
    const nodeBg = signed
      ? 'background:var(--green-pale)'
      : hasActivity
        ? 'background:var(--amber-pale)'
        : ''
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

  const totalBomItems = bomTotalItems(p)
  const sections = [
    {
      id: 'timing',
      icon: '📅',
      title: 'NPI Timing Plan',
      desc: `${timingTotal} rows · ${timingFilled} with activity`,
      color: 'var(--teal)'
    },
    {
      id: 'apqp',
      icon: '📐',
      title: 'APQP',
      desc: 'CTQ · PFD · PFMEA · Control Plan',
      color: 'var(--purple)'
    },
    {
      id: 'bom',
      icon: '📦',
      title: 'Bill of Materials',
      desc: `${totalBomItems} items · ${bomKits.length} kits · ${aaw} AAW`,
      color: 'var(--navy)'
    },
    {
      id: 'actions',
      icon: '✅',
      title: 'Actions',
      desc: `${openAct} open${overdueAct > 0 ? ' · ' + overdueAct + ' overdue' : ''}`,
      color: overdueAct > 0 ? 'var(--red)' : openAct > 0 ? 'var(--amber)' : 'var(--green)'
    },
    {
      id: 'risks',
      icon: '🛡',
      title: 'Risk Register',
      desc: `${p.risks.filter((r) => r.status !== 'Closed').length} open · ${highRisks} high`,
      color: highRisks > 0 ? 'var(--red)' : 'var(--blue)'
    }
  ]

  // ── Sub-assemblies ────────────────────────────────────────────
  if (!p.subAssemblies) p.subAssemblies = []
  const subAsmHTML = (() => {
    const cards = p.subAssemblies
      .map((link, li) => {
        const sp = db.projects.find((x) => x.id === link.id)
        if (!sp) return ''
        const apqpPct = apqpCompletionPct(sp)
        const bomItemCount = bomTotalItems(sp)
        const linkedKit = bomKits.find((k) => k.id === link.kitId)
        return `<div class="sub-asm-card" onclick="npi.nav.openProjectById('${sp.id}')">
        <div class="sub-asm-card-head">
          <span class="sub-asm-name">${esc(sp.name)}</span>
          ${canEdit() ? `<button class="del-btn" style="font-size:10px" onclick="npi.nav.stopEvent(event);npi.dashboard.deleteSubAsm(${li})">× Delete</button>` : ''}
        </div>
        ${sp.unit ? `<div style="font-size:10px;color:var(--muted);margin-bottom:6px">🚂 ${esc(sp.unit)}</div>` : ''}
        <div class="sub-asm-stats">
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:var(--ink)">${bomItemCount}</span><span class="sub-asm-stat-lbl">BoM items</span></div>
          <div class="sub-asm-stat"><span class="sub-asm-stat-val" style="color:${linkedKit ? 'var(--green)' : 'var(--red)'}">${linkedKit ? 'Yes' : 'No'}</span><span class="sub-asm-stat-lbl">Root kit</span></div>
        </div>
        <div>
          <div class="sub-asm-gate-bar"><div class="sub-asm-gate-fill" style="width:${apqpPct}%"></div></div>
          <div class="sub-asm-gate-label">APQP completion · ${apqpPct}%</div>
        </div>
      </div>`
      })
      .filter(Boolean)
      .join('')
    const addCard = canEdit() ? `<div class="sub-asm-add-card" onclick="npi.dashboard.createSubAsm()"><span style="font-size:16px">＋</span> Create sub-assembly</div>` : ''
    return `<div class="sub-asm-grid">${cards}${addCard}</div>`
  })()

  // Calculate sub-assembly summary for hero badge
  const subAsmCount = subAssemblies.length
  const subAsmAvgCompletion =
    subAsmCount > 0
      ? Math.round(
          subAssemblies.reduce((sum, link) => {
            const sp = db.projects.find((x) => x.id === link.id)
            if (!sp) return sum
            return sum + apqpCompletionPct(sp)
          }, 0) / subAsmCount
        )
      : 0

  // ── RPN Burndown (right column of split) ──────────────────────
  const rpnBurndownHTML =
    pfmea.length > 0
      ? `
    <div class="card" style="margin-bottom:0;padding:0;overflow:hidden;height:100%;box-sizing:border-box">
      <div class="card-head" style="padding:10px 14px">
        <span class="card-title">RPN Burndown — Original vs Current</span>
        <button class="btn btn-ghost btn-sm" onclick="npi.nav.openPfmeaTab()">Full PFMEA →</button>
      </div>
      <div style="padding:14px 16px 16px">${renderRpnBurndown(true)}</div>
    </div>`
      : `<div class="card" style="margin-bottom:0;display:flex;align-items:center;justify-content:center;min-height:80px">
      <span style="font-size:12px;color:var(--muted)">No PFMEA data yet</span>
    </div>`

  const launcherHTML = sections
    .map(
      (s) =>
        `<div class="section-card" onclick="npi.nav.navigate('${s.id}')" style="--sc-color:${s.color}"><div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${s.color};margin-bottom:1px">${s.icon} ${s.title}</div><div class="section-card-desc">${s.desc}</div></div>`
    )
    .join('')

  const actHTML =
    actions
      .filter((a) => a.status !== 'Closed')
      .slice(0, 5)
      .map((a) => {
        const od = a.due && new Date(a.due) < new Date()
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);${od ? 'background:var(--red-pale)' : ''}"><span class="sp sp-${a.status === 'In Progress' ? 'inprog' : 'open'}">${a.status || 'Open'}</span><span style="flex:1;font-size:12px">${esc(a.desc)}</span><span style="font-size:10px;color:${od ? 'var(--red)' : 'var(--muted)'}">${a.owner ? esc(a.owner) + ' ' : ''} ${a.due || ''}</span></div>`
      })
      .join('') ||
    `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open actions</div>`

  const riskHTML =
    risks
      .filter((r) => r.status !== 'Closed')
      .sort((a, b) => b.lik * b.imp - a.lik * a.imp)
      .slice(0, 4)
      .map((r) => {
        const s = r.lik * r.imp
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line)"><span class="rpn ${s >= 12 ? 'rpn-hi' : s >= 6 ? 'rpn-md' : 'rpn-lo'}">${s}</span><span style="flex:1;font-size:12px">${esc(r.desc)}</span><span style="font-size:10px;color:var(--muted)">${esc(r.cat || '')}</span></div>`
      })
      .join('') ||
    `<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No open risks</div>`

  const familyInfo =
    typeof findFamilyRecord === 'function' ? findFamilyRecord(p.family || 'Other') : null
  const famIcon = familyInfo?.icon || '📋'
  const famLabel = familyInfo?.label || familyInfo?.name || p.family || 'Other'
  const linkedProduct =
    p.product_id && productsState
      ? productsState.products.find((pr) => pr.id === p.product_id)
      : null
  const linkedPartNumber = linkedProduct?.part_number || p.partNumber || ''
  const linkedScope = linkedProduct ? linkedProduct.scope || 'overhaul' : null
  const scopeDisplayIcons = { overhaul: '🔄', repair: '🔧', assembly: '🔩' }
  const linkedScopeIcon = linkedScope ? scopeDisplayIcons[linkedScope] || '🔄' : '🔄'
  const linkedScopeLabel = linkedScope
    ? linkedScope.charAt(0).toUpperCase() + linkedScope.slice(1)
    : null
  const liveUpdateBadge =
    typeof npiRealtimeIndicatorHTML === 'function' ? npiRealtimeIndicatorHTML() : ''
  // Task 2-A: presence badges — other users viewing this project
  const presenceUsers = typeof getPresenceForProg === 'function' ? getPresenceForProg(progId) : []
  const presenceBadgesHTML =
    presenceUsers.length > 0
      ? presenceUsers
          .map((u) => {
            const initials =
              typeof _getPresenceInitials === 'function'
                ? _getPresenceInitials(u.email)
                : u.email?.slice(0, 2)?.toUpperCase() || '??'
            return `<span class="presence-badge" title="${esc(u.email)}">${esc(initials)}</span>`
          })
          .join('')
      : ''
  const curGateIndex = curGate >= 0 ? curGate : 5
  const curGateDef = GATE_DEFS[curGateIndex]
  const openRiskCount = risks.filter((r) => r.status !== 'Closed').length
  const gateScopeSelections = getAllProjectGateSelections(p.id)
  const gateScopeLocked = isGateSelectionLocked(p.id)
  const gateScopeSelectedCount = GATE_DEFS.reduce(
    (sum, g) => sum + getProjectGateSelection(p.id, g.num).length,
    0
  )
  const gateScopeTotalCount = GATE_DEFS.reduce(
    (sum, g) => sum + getDefaultGateSelection(g.num).length,
    0
  )
  const gateScopeStatusText = gateScopeLocked
    ? 'Locked'
    : gateScopeSelections
      ? 'Editable'
      : 'Not set (using standard questions)'

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
  if (overdueAct > 0)
    nextSteps.push(`Close ${overdueAct} overdue action${overdueAct !== 1 ? 's' : ''}`)
  if (curGateDef) {
    const curGateData = p.gates[curGateIndex] || {}
    const curGateChecks = curGateData.checks || []
    const allChecksDone = curGateChecks.length > 0 && curGateChecks.every(Boolean)
    nextSteps.push(
      allChecksDone
        ? `Complete gate sign off`
        : `Complete remaining checks for Gate ${curGateDef.num}`
    )
  }
  if (highRisks > 0)
    nextSteps.push(`Review ${highRisks} high-severity risk${highRisks !== 1 ? 's' : ''}`)
  if (nextSteps.length === 0) nextSteps.push('Project is in good shape, continue planned activity')

  return `<div class="mc-shell">
    <div class="dash-hero">
      <div class="hero-left">
        <div class="eyebrow">APQP MISSION CONTROL</div>
        <div class="dash-prog-name">
          ${esc(p.name)}
          ${subAsmCount > 0 ? `<span class="sub-asm-badge" title="Sub-assemblies: ${subAsmAvgCompletion}% avg completion">🔩 ${subAsmCount} Sub-asm${subAsmCount !== 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="hero-sub">Focus view: what matters now, what is blocked, what to do next.</div>
      </div>
      <div class="hero-right">
        ${presenceBadgesHTML ? `<div class="presence-strip">${presenceBadgesHTML}</div>` : ''}
        <button class="btn btn-ghost" onclick="npi.nav.navigate('projects')">← Back</button>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-dashboard')" title="User Guide">❓ Guide</button>
        <button class="btn btn-ghost" onclick="npi.dashboard.openGateScopeEditor()">Gate Scope</button>
        ${canEdit() ? `<button class="btn btn-primary" onclick="npi.dashboard.showEditProject()">Edit Project</button>` : ''}
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
            <h2>Gate Progress</h2>
            <span>Click a gate to open detail</span>
          </div>
          <div class="trajectory">${trajectoryHTML}</div>
          <div class="next-box">
            <h3>Current Focus</h3>
            <ul>${nextSteps.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="panel stack">
          ${
            subAsmCount > 0
              ? `
          <div class="stack-card">
            <h3>Sub-Assemblies ${subAsmCount > 0 ? `<span style="font-size:11px;color:var(--muted);font-weight:400;margin-left:6px">(${subAsmCount} total · ${subAsmAvgCompletion}% avg completion)</span>` : ''}</h3>
            ${subAsmHTML}
          </div>
          `
              : ''
          }
          <div class="stack-card">
            <h3>Quick Launch</h3>
            <div class="chips">
              <button onclick="npi.nav.navigate('apqp')">📐 APQP</button>
              <button onclick="npi.nav.navigate('bom')">📦 BOM</button>
              <button onclick="npi.nav.navigate('timing')">📅 Timing</button>
              <button onclick="npi.nav.navigate('actions')">✅ Actions</button>
              <button onclick="npi.nav.navigate('risks')">🛡 Risks</button>
              <button onclick="npi.nav.navigate('documents')">📄 Documents</button>
            </div>
          </div>

          <div class="stack-card muted">
            <h3>Project Snapshot</h3>
            <div class="dash-prog-meta">
              <span>${famIcon} ${esc(famLabel)}</span>
              ${p.customer ? `<span>👤 ${esc(p.customer)}</span>` : ''}
              ${p.unit ? `<span>🚂 ${esc(p.unit)}</span>` : ''}
              ${p.pm ? `<span>📋 ${esc(p.pm)}</span>` : ''}
              ${p.qNumber ? `<span>🔢 Q ${esc(p.qNumber)}</span>` : ''}
              ${linkedPartNumber ? `<span>🏷 ${esc(linkedPartNumber)}</span>` : ''}
              ${linkedScopeLabel ? `<span>${linkedScopeIcon} ${esc(linkedScopeLabel)}</span>` : ''}
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--muted)">
              Gate Scope: <strong style="color:${gateScopeLocked ? 'var(--green)' : 'var(--blue)'}">${esc(gateScopeStatusText)}</strong>
              <span style="margin-left:6px">· ${gateScopeSelectedCount} / ${gateScopeTotalCount} selected checks</span>
            </div>
            ${parentProg ? `<div class="parent-link" onclick="npi.nav.openProjectById('${parentProg.id}')">Parent: ${esc(parentProg.name)}</div>` : ''}
          </div>
        </div>
      </section>

      <div class="stack-card muted detail-stack">
        <h3>Details (Collapsed by default)</h3>
        ${
          subAsmCount === 0
            ? `
        <details>
          <summary>Sub-assemblies</summary>
          <div class="detail-body">${subAsmHTML}</div>
        </details>
        `
            : ''
        }
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
npi.dashboard.openProject = function (id) {
  progId = id
  navigate('project')
}
npi.dashboard.openProjectOrRender = function (id) {
  if (id) {
    npi.dashboard.openProject(id)
    return
  }
  npi.nav.render()
}

npi.dashboard.openGateScopeEditor = function () {
  const p = prog()
  if (!p) return
  if (typeof tenderGateScopeState === 'object' && tenderGateScopeState) {
    tenderGateScopeState.projectId = p.id
  }
  if (typeof window.openTenderGateSelectionModal === 'function') {
    window.openTenderGateSelectionModal(p.product_id || null)
    return
  }
  showToast('Gate scope editor is not available yet. Please refresh and try again.', 'warning')
}

npi.dashboard.newProjectInFamily = function (famId) {
  const sel = document.getElementById('np_family')
  if (sel) sel.value = famId
  showModal('modalNewProj')
}

npi.dashboard.createProg = function () {
  const name = document.getElementById('np_name').value.trim()
  if (!name) {
    showToast('Project name is required.', 'warning')
    return
  }
  const id = 'p_' + Math.random().toString(36).slice(2)
  const family = document.getElementById('np_family')?.value || 'Other'
  const customer = document.getElementById('np_customer')?.value || ''
  const unit = document.getElementById('np_unit')?.value || ''
  const lead = document.getElementById('np_lead')?.value || ''
  const pm = document.getElementById('np_pm')?.value || ''
  const date = document.getElementById('np_date')?.value || ''
  const qNumber = document.getElementById('np_qNumber')?.value?.trim() || ''
  const partNumber = document.getElementById('np_partNumber')?.value?.trim() || ''
  const parentId = document.getElementById('np_parent')?.value || null
  const newProg = migrateprog({
    id,
    name,
    family,
    customer,
    unit,
    lead,
    pm,
    date,
    qNumber,
    partNumber,
    parentId: parentId || null,
    status: 'Active',
    gates: [],
    ctq: [],
    pfd: [],
    pfmea: [],
    bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    actions: [],
    risks: [],
    gantt: [],
    subAssemblies: []
  })
  db.projects.push(newProg)
  if (parentId) {
    const parent = db.projects.find((x) => x.id === parentId)
    if (parent) {
      if (!parent.subAssemblies) parent.subAssemblies = []
      if (!parent.subAssemblies.find((x) => x.id === id)) parent.subAssemblies.push({ id })
    }
  }
  progId = id
  save()
  closeModal('modalNewProj')
  navigate('project')
}

npi.dashboard.showEditProject = function () {
  const p = prog()
  if (!p) return
  // Read-only product info
  const familyInfo = typeof findFamilyRecord === 'function' ? findFamilyRecord(p.family) : null
  const familyName = familyInfo?.label || familyInfo?.name || p.family || '—'
  document.getElementById('ep_ro_name').textContent = p.name || '—'
  document.getElementById('ep_ro_customer').textContent = p.customer
    ? 'Customer: ' + p.customer
    : ''
  document.getElementById('ep_ro_unit').textContent = p.unit ? 'Unit: ' + p.unit : ''
  document.getElementById('ep_ro_family').textContent = familyName ? 'Family: ' + familyName : ''
  // Editable project fields
  document.getElementById('ep_status').value = p.status || 'Active'
  document.getElementById('ep_lead').value = p.lead || ''
  document.getElementById('ep_pm').value = p.pm || ''
  document.getElementById('ep_date').value = p.date || ''
  document.getElementById('ep_qNumber').value = p.qNumber || ''
  showModal('modalEditProj')
}

npi.dashboard.saveEditProject = function () {
  const p = prog()
  if (!p) return
  p.status = document.getElementById('ep_status').value || 'Active'
  p.lead = document.getElementById('ep_lead').value.trim() || ''
  p.pm = document.getElementById('ep_pm').value.trim() || ''
  p.date = document.getElementById('ep_date').value || ''
  p.qNumber = document.getElementById('ep_qNumber').value.trim() || ''
  save()
  closeModal('modalEditProj')
  render()
}

npi.dashboard.deleteProject = async function () {
  const p = prog()
  if (!p) return
  if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return
  const deletedId = progId
  // Remove from Supabase first; abort the local delete if it fails.
  if (typeof supa !== 'undefined') {
    const { error } = await supa.from('projects').delete().eq('prog_id', deletedId)
    if (error) {
      showToast('Could not delete project — ' + (error.message || 'unknown error'), 'error')
      return
    }
    // Task 2-C: cascade-delete all NPI relational data for this project.
    if (typeof npiRelDeleteAllForProject === 'function') {
      showToast('Deleting NPI data…', 'info', 3000)
      await npiRelDeleteAllForProject(deletedId).catch((err) => {
        console.warn('NPI cascade delete error:', err)
      })
    }
  }
  db.projects = db.projects.filter((x) => x.id !== deletedId)
  progId = db.projects.length ? db.projects[0].id : null
  // Save any remaining dirty projects but do not mark the deleted one.
  if (dirtyProjects.has(deletedId)) dirtyProjects.delete(deletedId)
  if (db.projects.length > 0) save()
  closeModal('modalEditProj')
  navigate('projects')
}

// ── Sub-assembly management ───────────────────────────────────
npi.dashboard.ensureSubAsmKit = function (child) {
  const p = prog()
  if (!p || !child) return null
  if (!p.subAssemblies) p.subAssemblies = []

  const link = p.subAssemblies.find((x) => x.id === child.id)
  if (link && link.kitId) {
    const existingKit = (p.bom.kits || []).find((k) => k.id === link.kitId)
    if (existingKit) return existingKit
  }

  const kit = npi.data.bom.addKit()
  kit.name = `${child.name || 'Sub-assembly'} Kit`
  kit.linkedSubAssemblyId = child.id
  if (typeof npiRelSaveBOMKit === 'function') {
    npiRelSaveBOMKit(kit)
  }

  if (link) {
    link.kitId = kit.id
  } else {
    p.subAssemblies.push({ id: child.id, kitId: kit.id })
  }
  return kit
}

npi.dashboard.createSubAsm = function () {
  const p = prog()
  if (!p) return
  const nameEl = document.getElementById('nsa_name')
  const unitEl = document.getElementById('nsa_unit')
  if (nameEl) {
    nameEl.value = ''
    nameEl.classList.remove('input-error')
  }
  if (unitEl) unitEl.value = p.unit || ''
  showModal('modalNewSubAsm')
  setTimeout(() => {
    const el = document.getElementById('nsa_name')
    if (el) el.focus()
  }, 50)
}

npi.dashboard.saveNewSubAsm = function () {
  const p = prog()
  if (!p) return
  const nameEl = document.getElementById('nsa_name')
  const unitEl = document.getElementById('nsa_unit')
  const name = nameEl ? nameEl.value.trim() : ''
  if (!name) {
    if (nameEl) {
      nameEl.classList.add('input-error')
      nameEl.focus()
    }
    return
  }
  const unit = unitEl ? unitEl.value.trim() : ''
  closeModal('modalNewSubAsm')
  const id = 'p_' + Math.random().toString(36).slice(2)

  const child = migrateprog({
    id,
    name,
    family: p.family || 'Other',
    customer: p.customer || '',
    unit: unit || p.unit || '',
    lead: p.lead || '',
    pm: p.pm || '',
    date: p.date || '',
    parentId: p.id,
    status: 'Active',
    gates: [],
    ctq: [],
    pfd: [],
    pfmea: [],
    cp: [],
    bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    actions: [],
    risks: [],
    gantt: []
  })

  db.projects.push(child)
  if (!p.subAssemblies) p.subAssemblies = []
  if (!p.subAssemblies.find((x) => x.id === child.id)) p.subAssemblies.push({ id: child.id })
  npi.dashboard.ensureSubAsmKit(child)
  save(child.id)
  render()
  showToast(`Sub-assembly "${child.name}" created.`, 'success')
}

npi.dashboard.openSubAsmModal = function () {
  npi.dashboard.createSubAsm()
}

npi.dashboard.linkSubAsm = function (id) {
  const p = prog()
  if (!p) return
  const child = db.projects.find((x) => x.id === id)
  if (!child) return

  if (!p.subAssemblies) p.subAssemblies = []
  if (!p.subAssemblies.find((x) => x.id === id)) p.subAssemblies.push({ id })
  child.parentId = progId
  child.gates = []

  npi.dashboard.ensureSubAsmKit(child)
  save(id)
  render()
}

npi.dashboard.deleteSubAsm = async function (li) {
  const p = prog()
  if (!p || !p.subAssemblies || !p.subAssemblies[li]) return
  const linked = p.subAssemblies[li]
  const child = db.projects.find((x) => x.id === linked.id)
  if (!child) {
    p.subAssemblies.splice(li, 1)
    save()
    render()
    return
  }

  const msg = `Delete sub-assembly "${child.name}"?\n\nThis will permanently delete:\n- The sub-assembly project\n- Its APQP data\n- Its linked root kit`
  if (!confirm(msg)) return

  if (typeof supa !== 'undefined') {
    const { error } = await supa.from('projects').delete().eq('prog_id', child.id)
    if (error) {
      showToast('Could not delete sub-assembly — ' + (error.message || 'unknown error'), 'error')
      return
    }
    if (typeof npiRelDeleteAllForProject === 'function') {
      await npiRelDeleteAllForProject(child.id).catch((err) => {
        console.warn('Sub-assembly cascade delete error:', err)
      })
    }
  }

  const kitIndex = (p.bom.kits || []).findIndex(
    (k) => k.id === linked.kitId || k.linkedSubAssemblyId === child.id
  )
  if (kitIndex >= 0) {
    npi.data.bom.delKit(kitIndex)
  }

  p.subAssemblies.splice(li, 1)
  db.projects = db.projects.filter((x) => x.id !== child.id)
  if (dirtyProjects.has(child.id)) dirtyProjects.delete(child.id)

  save()
  render()
  showToast(`Sub-assembly "${child.name}" deleted.`, 'success')
}

npi.dashboard.unlinkSubAsm = function (li) {
  npi.dashboard.deleteSubAsm(li)
}

npi.dashboard.closeSubAsmModal = function () {
  const el = document.getElementById('subAsmModalBg')
  if (el) el.remove()
}
