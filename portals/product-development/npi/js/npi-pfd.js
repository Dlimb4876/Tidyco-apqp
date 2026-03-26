// ═══════════════════════════════════
// npi-pfd.js — PFD tab rendering and modal handlers
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.pfd = npi.pfd || {}
npi.pfd.viewMode = 'table' // 'table' or 'flowchart'
npi.pfd.flowDirection = 'TD' // 'TD' (top-down) or 'LR' (left-right)

function pfdStepType(step) {
  return npi.data.pfdType.normalize(step && step.pfd_type)
}

function pfdLinkValue(value) {
  return npi.data.normalizePfdLink(value)
}

function pfdStepNodeId(stepNum) {
  return `S${stepNum}`
}

function pfdMermaidLabel(step) {
  const raw = step && step.op ? String(step.op) : `Step ${step.stepNum}`
  return raw
    .replace(/\r?\n+/g, ' ')
    .replace(/"/g, '&quot;')
    .replace(/[{}\[\]]/g, ' ')
    .trim()
}

function isHeaderStep(step) {
  return npi.data.pfdType.isHeader(step.type)
}

function isExecutableStep(step) {
  return npi.data.pfdType.isExecutable(step.type)
}

function getSectionStepCount(sorted, headerIndex) {
  let count = 0
  for (let i = headerIndex + 1; i < sorted.length; i++) {
    if (isHeaderStep(sorted[i])) break
    if (isExecutableStep(sorted[i])) count++
  }
  return count
}

function stepRowHTML(s, oi, p) {
  const ctqBadges = (s.ctqIds || []).map(cid => {
    const ci = p.ctq.findIndex(c => c.id === cid)
    return ci >= 0 ? `<span class="ctq-pick-item" data-action="pfd-open-ctq-pick" data-idx="${oi}">C${ci + 1}</span>` : ''
  }).join('')
  const pfCnt = p.pfmea.filter(r => r.pfdId === s.id).length
  const pills = (s.bomRefs || []).map(ref => {
    // Handle aggregated parts from BOM tree
    if (ref.bomType === 'parts_agg') {
      const aggregatedParts = npi.bom._aggregatePartsRegister ? npi.bom._aggregatePartsRegister(p) : []
      const part = aggregatedParts.find(x => (x.pn || x.desc) === ref.itemId)
      if (!part) return ''
      const sources = Array.from(part.sources || [])
      const isAaw = sources.includes('aaw')
      const isRepair = sources.includes('repair')
      const name = part.desc || part.pn || 'Part'
      const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
      return `<span class="res-pill res-pill-part" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${esc(ref.itemId)}" title="Click to edit quantity"` : ''}>🔩 ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay}${isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}${isRepair ? ' <span class="flag flag-repair" style="font-size:9px">RPR</span>' : ''}</span>`
    }
    
    // Handle AAW/Repair assemblies
    if (ref.bomType === 'aaw_asm') {
      const group = (p.bom.aaw_repair || []).find(x => x.id === ref.itemId)
      if (!group) return ''
      const tagLabel = group.tag === 'aaw' ? 'AAW' : (group.tag === 'repair' ? 'RPR' : 'ASM')
      const name = group.title || 'Assembly'
      const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
      return `<span class="res-pill res-pill-asm" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${esc(ref.itemId)}" title="Click to edit quantity"` : ''}>🔧 ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay} <span class="flag ${group.tag === 'aaw' ? 'flag-aaw' : 'flag-repair'}" style="font-size:9px">${tagLabel}</span></span>`
    }
    
    // Handle standard BOM types
    const bt = p.bom[ref.bomType]; if (!bt) return ''
    const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
    const t = BOM_TYPES[ref.bomType]
    const name = item.desc || (item.pn || item.toolId || item.equipId || '?')
    const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
    return `<span class="res-pill ${t.pc}" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${ref.itemId}" title="Click to edit quantity"` : ''}>${t.icon} ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay}${item.isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}${item.isRepair ? ' <span class="flag flag-repair" style="font-size:9px">RPR</span>' : ''}</span>`
  }).join('')
  const docBadges = (s.docRefs || []).map(docId => {
    const doc = (p.docs || []).find(d => d.id === docId)
    return doc ? `<span class="ctq-pick-item" ${canEdit() ? `data-action="pfd-del-doc-ref" data-step-id="${s.id}" data-doc-id="${docId}" title="Click to remove"` : ''}>${esc(doc.docNumber || 'Doc')} ${esc(doc.title || '')}</span>` : ''
  }).join('')

  const stepType = pfdStepType(s)
  const isDecision = npi.data.pfdType.isDecision(stepType)
  const isInspection = npi.data.pfdType.isInspection(stepType)
  const isTwoPath = npi.data.pfdType.isTwoPath(stepType)
  const typeChipMap = { Process: 'PROC', Decision: 'DEC', Inspection: 'INSP', Rework: 'RWK', Transport: 'TRN' }
  const typeChip = `<span class="pfd-type-chip pfd-type-chip--${stepType.toLowerCase()}">${typeChipMap[stepType] || stepType}</span>`
  const flowControlHTML = `<div class="step-field f-flow">
    <div class="flow-control-group">
      <label>Type</label>
      <select class="cell-edit" data-action="pfd-upd" data-id="${s.id}" data-field="pfd_type">
        <option value="Process" ${stepType === 'Process' ? 'selected' : ''}>Process</option>
        <option value="Decision" ${stepType === 'Decision' ? 'selected' : ''}>Decision</option>
        <option value="Inspection" ${stepType === 'Inspection' ? 'selected' : ''}>Inspection</option>
        <option value="Rework" ${stepType === 'Rework' ? 'selected' : ''}>Rework</option>
        <option value="Transport" ${stepType === 'Transport' ? 'selected' : ''}>Transport</option>
      </select>
    </div>
    ${isTwoPath
    ? `<div class="flow-control-group">
          <label>Next (${isInspection ? 'Pass' : 'Yes'})</label>
          <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId_yes) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId_yes" placeholder="Step #">
        </div>
        <div class="flow-control-group">
          <label>Next (${isInspection ? 'Fail' : 'No'})</label>
          <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId_no) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId_no" placeholder="Step #">
        </div>`
    : `<div class="flow-control-group">
          <label>Next Step</label>
          <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId" placeholder="Step #">
        </div>`
    }
  </div>`

  return `<div class="step-row" id="pfd-row-${s.id}"><div class="step-main-row"><div class="step-num-cell"><div class="step-num-badge">${s.stepNum}</div>${typeChip}<div style="display:flex;flex-direction:column;gap:2px">${canEdit() ? `<button class="mini-btn" data-action="pfd-open-insert" data-after="${oi}">＋</button><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button>` : ''}</div></div><div class="step-body"><div class="step-fields"><div class="step-field f-op"><input class="cell-edit" value="${esc(s.op)}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Operation" style="font-weight:600"></div><div class="step-field f-detail"><textarea class="cell-edit" rows="2" data-action="pfd-upd" data-id="${s.id}" data-field="detail" placeholder="Method / notes…">${esc(s.detail)}</textarea></div><div class="step-field f-ctq"><div class="ctq-pick">${ctqBadges}${canEdit() && p.ctq.length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-ctq-pick" data-idx="${oi}">＋ CTQ</span>` : ''}</div></div><div class="step-field f-doc"><div class="ctq-pick">${docBadges}${canEdit() && (p.docs||[]).length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-doc-pick" data-idx="${oi}">＋ Doc</span>` : ''}</div></div><div class="step-field f-pfmea">${pfCnt > 0 ? `<span class="tag tag-amber">${pfCnt} FMEA</span>` : '<span style="font-size:11px;color:var(--muted)">—</span>'}</div>${canEdit() ? flowControlHTML : ''}</div></div></div><div class="step-resources">${pills}${canEdit() ? `<button class="res-add-btn" data-action="pfd-open-bom-pick" data-id="${s.id}">＋ Resource</button>` : ''}</div></div>`
}

function headerRowHTML(s, oi, meta) {
  const title = esc(s.op || 'Section Header')
  const collapsed = !!(meta && meta.collapsed)
  const stepCount = meta && Number.isFinite(meta.stepCount) ? meta.stepCount : 0
  const summary = stepCount === 1 ? '1 step' : `${stepCount} steps`
  const actions = s.isDefault || !canEdit()
    ? ''
    : `<div class="pfd-header-actions"><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button></div>`
  return `<div class="step-row pfd-header-row" id="pfd-row-${s.id}"><div class="pfd-header-main"><button class="pfd-header-toggle" data-action="pfd-toggle-group" data-key="${s.id}" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Expand section' : 'Collapse section'}"><span class="pfd-header-toggle-icon">${collapsed ? '▸' : '▾'}</span></button><div class="pfd-header-title"><span class="pfd-header-chip">SECTION</span><input class="cell-edit pfd-header-input" value="${title}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Section title (e.g. STRIP DOWN UNIT)"></div><div class="pfd-header-meta">${collapsed ? `Hidden: ${summary}` : summary}</div>${actions}</div></div>`
}

function getInsertBounds(p, afterOi) {
  if (afterOi == null) return null
  const anchor = p.pfd[afterOi]
  if (!anchor) return null

  const base = Number(anchor.stepNum) || 0
  const nextExecutable = npi.data.sortedPfd(p.pfd)
    .filter(isExecutableStep)
    .find(s => Number(s.stepNum) > base)

  return {
    base,
    ceil: nextExecutable ? Number(nextExecutable.stepNum) : base + 10
  }
}

npi.pfd._hideDetail = function(canvasEl) {
  const host = canvasEl || document.querySelector('.pfd-flowchart-canvas')
  if (!host) return
  const panel = host.querySelector('.pfd-detail-popover')
  if (!panel) return
  panel.className = 'pfd-detail-popover'
}

npi.pfd._showDetail = function(s, p, anchorEl, canvasEl) {
  const host = canvasEl || document.querySelector('.pfd-flowchart-canvas')
  if (!host || !anchorEl) return

  let panel = host.querySelector('.pfd-detail-popover')
  if (!panel) {
    panel = document.createElement('div')
    panel.className = 'pfd-detail-popover'
    host.appendChild(panel)
  }

  const stepType = pfdStepType(s)
  const typeTagClass = { Process: '', Decision: 'tag-amber', Inspection: 'tag-teal', Rework: 'tag-orange', Transport: 'tag-purple' }[stepType] || ''
  const pfCnt = p.pfmea.filter(r => r.pfdId === s.id).length
  const maxRpn = (p.pfmea || []).filter(r => r.pfdId === s.id).reduce((max, row) => {
    const rpn = (row.causes || []).reduce((m, c) => Math.max(m, npi.data.calcCauseRpn(c.sev, c.occ, c.det)), 0)
    return Math.max(max, rpn)
  }, 0)

  const ctqItems = (s.ctqIds || []).map(cid => {
    const ci = p.ctq.findIndex(c => c.id === cid)
    if (ci < 0) return ''
    const c = p.ctq[ci]
    return `<span class="tag tag-ctq">C${ci + 1}</span> <span>${esc(c.req || 'Unnamed')}${c.spec ? ` <span style="color:var(--muted);font-size:11px">(${esc(c.spec)})</span>` : ''}</span>`
  }).filter(Boolean)

  const docItems = (s.docRefs || []).map(docId => {
    const doc = (p.docs || []).find(d => d.id === docId)
    if (!doc) return ''
    return `<span class="tag">${esc(doc.docNumber || '—')}</span> <span>${esc(doc.title || 'Untitled')}</span>`
  }).filter(Boolean)

  const resItems = (s.bomRefs || []).map(ref => {
    const bt = p.bom && p.bom[ref.bomType]; if (!bt) return ''
    const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
    const t = BOM_TYPES[ref.bomType]
    return `<span class="res-pill ${t.pc}">${t.icon} ${esc((item.desc || item.pn || item.toolId || item.equipId || '?').slice(0, 40))}</span>`
  }).filter(Boolean)

  const listHTML = items => items.map(i => `<li>${i}</li>`).join('')

  panel.className = 'pfd-detail-popover pfd-detail-popover--open'
  panel.innerHTML = `
    <div class="pfd-detail-inner">
      <div class="pfd-detail-header">
        <span class="step-num-badge">${s.stepNum}</span>
        <span class="pfd-detail-title">${esc(s.op || 'Untitled Step')}</span>
        <span class="tag ${typeTagClass}" style="flex-shrink:0">${esc(stepType)}</span>
        ${maxRpn >= (window.RPN_HIGH || 100) ? `<span class="tag tag-red" style="flex-shrink:0;font-size:10px">⚑ RPN ${maxRpn}</span>` : ''}
        <button class="mini-btn pfd-detail-close" style="margin-left:auto">✕</button>
      </div>
      ${s.detail ? `<div class="pfd-detail-notes">${esc(s.detail)}</div>` : ''}
      ${ctqItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">CTQs</div><ul class="pfd-detail-list">${listHTML(ctqItems)}</ul></div>` : ''}
      ${docItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">Documents</div><ul class="pfd-detail-list">${listHTML(docItems)}</ul></div>` : ''}
      ${resItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">Resources</div><div style="display:flex;flex-wrap:wrap;gap:4px">${resItems.join('')}</div></div>` : ''}
      ${pfCnt > 0 ? `<div class="pfd-detail-section"><div class="pfd-detail-label">PFMEA</div><span class="tag ${maxRpn >= (window.RPN_HIGH || 100) ? 'tag-red' : 'tag-amber'}">${pfCnt} failure mode${pfCnt > 1 ? 's' : ''}${maxRpn > 0 ? ` · max RPN ${maxRpn}` : ''}</span></div>` : ''}
      ${ctqItems.length === 0 && docItems.length === 0 && resItems.length === 0 && pfCnt === 0 && !s.detail ? '<p style="color:var(--muted);font-size:13px;margin:0">No additional details recorded for this step.</p>' : ''}
    </div>`

  const closeBtn = panel.querySelector('.pfd-detail-close')
  if (closeBtn) closeBtn.addEventListener('click', () => npi.pfd._hideDetail(host))

  const hostRect = host.getBoundingClientRect()
  const anchorRect = anchorEl.getBoundingClientRect()
  let left = (anchorRect.right - hostRect.left) + host.scrollLeft + 12
  let top = (anchorRect.top - hostRect.top) + host.scrollTop

  panel.style.left = `${left}px`
  panel.style.top = `${top}px`

  const hostRight = host.scrollLeft + host.clientWidth - 8
  const hostBottom = host.scrollTop + host.clientHeight - 8
  const hostLeft = host.scrollLeft + 8
  const hostTop = host.scrollTop + 8

  if (left + panel.offsetWidth > hostRight) {
    const leftSide = (anchorRect.left - hostRect.left) + host.scrollLeft - panel.offsetWidth - 12
    left = Math.max(hostLeft, leftSide)
  }
  if (top + panel.offsetHeight > hostBottom) {
    top = Math.max(hostTop, hostBottom - panel.offsetHeight)
  }
  if (top < hostTop) top = hostTop

  panel.style.left = `${left}px`
  panel.style.top = `${top}px`
}

npi.pfd.generateMermaidSyntax = function() {
  const p = prog()
  if (!p || !p.pfd) return 'graph LR\n  A["No PFD data available"];'

  const sorted = npi.data.sortedPfd(p.pfd)
  const executable = sorted.filter(isExecutableStep).sort((a, b) => a.stepNum - b.stepNum)
  if (executable.length === 0) return 'graph LR\n  A["No steps in PFD"];'

  const stepMap = new Map(executable.map(s => [s.stepNum, s]))
  const processNodeIds = []
  const decisionNodeIds = []
  const inspectionNodeIds = []
  const reworkNodeIds = []
  const transportNodeIds = []

  // Build set of high-risk step numbers (PFMEA RPN >= RPN_HIGH)
  const highRiskStepIds = new Set()
  ;(p.pfmea || []).forEach(row => {
    const rpn = (row.causes || []).reduce((max, c) => Math.max(max, npi.data.calcCauseRpn(c.sev, c.occ, c.det)), 0)
    if (rpn >= (window.RPN_HIGH || 100) && row.pfdId) {
      const step = p.pfd.find(s => s.id === row.pfdId)
      if (step && step.stepNum) highRiskStepIds.add(step.stepNum)
    }
  })
  const riskNodeIds = []

  // Group steps by preceding section header for subgraph blocks
  const sections = []
  let currentSection = null
  sorted.forEach(s => {
    if (isHeaderStep(s)) {
      currentSection = { title: s.op || null, steps: [] }
      sections.push(currentSection)
    } else if (isExecutableStep(s)) {
      if (!currentSection) {
        currentSection = { title: null, steps: [] }
        sections.push(currentSection)
      }
      currentSection.steps.push(s)
    }
  })

  const direction = npi.pfd.flowDirection || 'TD'
  let syntax = `graph ${direction}\n`
  syntax += '  PFDSTART([START])\n'

  // Declare nodes inside subgraph blocks (skip empty sections)
  sections.forEach((sec, i) => {
    if (sec.steps.length === 0) return
    const useSubgraph = !!sec.title
    if (useSubgraph) {
      const secLabel = sec.title.replace(/"/g, '&quot;').replace(/[{}\[\]]/g, ' ').trim()
      syntax += `  subgraph SG${i} ["${secLabel}"]\n`
    }
    sec.steps.forEach(s => {
      const nodeId = pfdStepNodeId(s.stepNum)
      const isRisk = highRiskStepIds.has(s.stepNum)
      const riskMark = isRisk ? ' ⚑' : ''
      const nodeLabel = `${s.stepNum}: ${pfdMermaidLabel(s)}${riskMark}`
      const type = pfdStepType(s)
      if (npi.data.pfdType.isDecision(type)) {
        syntax += `    ${nodeId}{"${nodeLabel}"}\n`
        decisionNodeIds.push(nodeId)
      } else if (npi.data.pfdType.isInspection(type)) {
        syntax += `    ${nodeId}(("${nodeLabel}"))\n`
        inspectionNodeIds.push(nodeId)
      } else if (type === 'Rework') {
        syntax += `    ${nodeId}[/"${nodeLabel}"/]\n`
        reworkNodeIds.push(nodeId)
      } else if (type === 'Transport') {
        syntax += `    ${nodeId}(["${nodeLabel}"])\n`
        transportNodeIds.push(nodeId)
      } else {
        syntax += `    ${nodeId}["${nodeLabel}"]\n`
        processNodeIds.push(nodeId)
      }
      if (isRisk) riskNodeIds.push(nodeId)
    })
    if (useSubgraph) syntax += '  end\n'
  })

  syntax += '  PFDEND([END])\n'

  // Edges: START → first step
  syntax += `  PFDSTART --> ${pfdStepNodeId(executable[0].stepNum)}\n`

  // Edges: between steps
  executable.forEach((s, index) => {
    const nodeId = pfdStepNodeId(s.stepNum)
    const type = pfdStepType(s)
    if (npi.data.pfdType.isTwoPath(type)) {
      const isInsp = npi.data.pfdType.isInspection(type)
      const yesLabel = isInsp ? 'Pass' : 'Yes'
      const noLabel = isInsp ? 'Fail' : 'No'
      const yesTarget = pfdLinkValue(s.nextStepId_yes)
      const noTarget = pfdLinkValue(s.nextStepId_no)
      if (yesTarget && stepMap.has(yesTarget)) syntax += `  ${nodeId} -- ${yesLabel} --> ${pfdStepNodeId(yesTarget)}\n`
      if (noTarget && stepMap.has(noTarget)) syntax += `  ${nodeId} -- ${noLabel} --> ${pfdStepNodeId(noTarget)}\n`
    } else {
      const fallbackNext = executable[index + 1] ? executable[index + 1].stepNum : null
      const nextTarget = pfdLinkValue(s.nextStepId) || fallbackNext
      if (nextTarget && stepMap.has(nextTarget)) {
        syntax += `  ${nodeId} --> ${pfdStepNodeId(nextTarget)}\n`
      } else {
        syntax += `  ${nodeId} --> PFDEND\n`
      }
    }
  })

  syntax += '  classDef processNode fill:#eef4ff,stroke:#2b5da8,color:#173d73,stroke-width:1.2px\n'
  syntax += '  classDef decisionNode fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:1.5px\n'
  syntax += '  classDef inspectionNode fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:1.5px\n'
  syntax += '  classDef reworkNode fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:1.5px\n'
  syntax += '  classDef transportNode fill:#ede9fe,stroke:#7c3aed,color:#2e1065,stroke-width:1.5px\n'
  syntax += '  classDef termNode fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1.5px\n'
  syntax += '  classDef riskBorder stroke:#dc2626,stroke-width:2.5px\n'
  if (processNodeIds.length > 0) syntax += `  class ${processNodeIds.join(',')} processNode\n`
  if (decisionNodeIds.length > 0) syntax += `  class ${decisionNodeIds.join(',')} decisionNode\n`
  if (inspectionNodeIds.length > 0) syntax += `  class ${inspectionNodeIds.join(',')} inspectionNode\n`
  if (reworkNodeIds.length > 0) syntax += `  class ${reworkNodeIds.join(',')} reworkNode\n`
  if (transportNodeIds.length > 0) syntax += `  class ${transportNodeIds.join(',')} transportNode\n`
  syntax += '  class PFDSTART,PFDEND termNode\n'
  if (riskNodeIds.length > 0) syntax += `  class ${riskNodeIds.join(',')} riskBorder\n`

  return syntax
}

npi.pfd.render = function() {
  const p = prog()
  npi.data.pfd.ensureLeadingHeader()
  const sorted = npi.data.sortedPfd(p.pfd)
  const executable = sorted.filter(isExecutableStep)

  const showFlowchart = npi.pfd.viewMode === 'table'
  const isLR = npi.pfd.flowDirection === 'LR'
  const viewToggleButton = `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-view">${showFlowchart ? 'Show Flowchart' : 'Show Table'}</button>`
  const layoutToggleButton = !showFlowchart ? `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-layout" title="Toggle flowchart orientation">${isLR ? '↕ Vertical' : '↔ Horizontal'}</button>` : ''

  const header = `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Section navigator at top for fast jumps in large flows. Steps stay numbered in 10s, and those numbers remain permanent PFMEA and Control Plan references.</div></div>
  <div class="sec-actions">${viewToggleButton}${layoutToggleButton}<button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfd" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="pfd-add-main">＋ Add Step</button>` : ''}</div></div>`

  if (npi.pfd.viewMode === 'flowchart') {
    const syntax = npi.pfd.generateMermaidSyntax()
    setTimeout(() => {
      const el = document.querySelector('.mermaid')
      if (!el) return

      if (typeof mermaid === 'undefined' || typeof mermaid.render !== 'function') {
        el.innerHTML = '<div class="info-banner">Flowchart is unavailable right now. The step links are still saved in the table view.</div>'
        return
      }

      try {
        if (!npi.pfd._mermaidReady && typeof mermaid.initialize === 'function') {
          mermaid.initialize({
            theme: 'base',
            startOnLoad: false,
            securityLevel: 'strict',
            flowchart: {
              useMaxWidth: true,
              nodeSpacing: 60,
              rankSpacing: 80,
              padding: 20,
              htmlLabels: false
            },
            themeVariables: {
              fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
              fontSize: '13px',
              lineColor: '#4b5563',
              edgeLabelBackground: '#ffffff',
              primaryTextColor: '#1f2937'
            },
            themeCSS: '.edgeLabel text{font-weight:600;letter-spacing:0.01em}.edge-thickness-normal{stroke-width:1px}.arrowheadPath{fill:#4b5563}'
          })
          npi.pfd._mermaidReady = true
        }

        const renderId = `npi-pfd-flow-${Date.now()}`
        const p = prog()
        const execSteps = npi.data.sortedPfd(p.pfd).filter(isExecutableStep)
        const stepMap = new Map(execSteps.map(s => [s.stepNum, s]))
        Promise.resolve(mermaid.render(renderId, syntax)).then(result => {
          if (!result || !result.svg) throw new Error('No SVG returned from Mermaid')
          el.innerHTML = `<div class="pfd-flowchart-zoom">${result.svg}</div>`
          // Attach click-to-expand handlers
          el.querySelectorAll('g.node').forEach(g => {
            const match = g.id && g.id.match(/flowchart-S(\d+)/)
            if (!match) return
            const step = stepMap.get(parseInt(match[1]))
            if (!step) return
            g.style.cursor = 'pointer'
            g.setAttribute('title', step.op || '')
            g.addEventListener('click', ev => {
              ev.stopPropagation()
              npi.pfd._showDetail(step, p, g, el)
            })
          })
          el.addEventListener('click', ev => {
            if (!ev.target.closest('.pfd-detail-popover')) npi.pfd._hideDetail(el)
          })
        }).catch(e => {
          console.error('Mermaid rendering failed:', e)
          el.innerHTML = '<div class="info-banner">Flowchart could not be rendered. Check that linked step numbers point to existing steps.</div>'
        })
      } catch (e) {
        console.error('Mermaid rendering failed:', e)
        el.innerHTML = '<div class="info-banner">Flowchart could not be rendered. Check that linked step numbers point to existing steps.</div>'
      }
    }, 50)
    const legend = `<div class="pfd-flowchart-legend"><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--process"></span>Process</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--decision"></span>Decision</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--inspection"></span>Inspection</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--rework"></span>Rework</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--transport"></span>Transport</span><span class="pfd-legend-item"><span class="pfd-legend-risk-icon">⚑</span>High RPN</span></div>`
    return `${header}<div class="card pfd-flowchart-shell"><div class="card-head"><span class="card-title">Process Flowchart</span><span class="card-meta">Click any step to see its details.</span></div><div class="pfd-flowchart-help">Blank process links auto-continue to the next numbered step. ⚑ = high RPN in PFMEA.</div><div class="mermaid pfd-flowchart-canvas"></div>${legend}</div>`
  }

  // Table view (default)
  const sectionNavigator = []
  let activeSection = null
  sorted.forEach(s => {
    if (isHeaderStep(s)) {
      if (activeSection) sectionNavigator.push(activeSection)
      activeSection = {
        id: s.id,
        title: esc(s.op) || 'Section',
        count: 0,
        firstStepNum: null,
        lastStepNum: null
      }
      return
    }

    if (!isExecutableStep(s)) return

    if (!activeSection) {
      activeSection = {
        id: s.id,
        title: 'Main Flow',
        count: 0,
        firstStepNum: null,
        lastStepNum: null
      }
    }

    activeSection.count++
    const stepNum = Number(s.stepNum)
    if (Number.isFinite(stepNum)) {
      if (activeSection.firstStepNum == null) activeSection.firstStepNum = stepNum
      activeSection.lastStepNum = stepNum
    }
  })
  if (activeSection) sectionNavigator.push(activeSection)

  const ribbon = sectionNavigator.map((section, i, arr) => {
    const countLabel = section.count === 1 ? '1 step' : `${section.count} steps`
    const rangeLabel = section.firstStepNum == null
      ? ''
      : (section.firstStepNum === section.lastStepNum
        ? ` · ${section.firstStepNum}`
        : ` · ${section.firstStepNum}-${section.lastStepNum}`)

    return `<div class="flow-node" data-action="pfd-scroll" data-id="${section.id}"><div class="flow-node-num">${countLabel}${rangeLabel}</div><div class="flow-node-name">${section.title || 'Section'}</div></div>${i < arr.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
  }).join('')

  let body = ''
  let activeSectionId = null
  let hideSectionRows = false

  sorted.forEach((s, sortedIndex) => {
    const oi = p.pfd.indexOf(s)
    if (isHeaderStep(s)) {
      activeSectionId = s.id
      hideSectionRows = collapsedGroups.has(s.id)
      body += headerRowHTML(s, oi, {
        collapsed: hideSectionRows,
        stepCount: getSectionStepCount(sorted, sortedIndex)
      })
      return
    }

    if (!hideSectionRows) {
      body += stepRowHTML(s, oi, p)
      if (canEdit()) body += `<div class="insert-row"><button class="insert-btn" data-action="pfd-open-insert" data-after="${oi}">＋ step after</button><button class="insert-btn" data-action="pfd-add-header-after" data-after-id="${s.id}">＋ section after</button></div>`
    }
  })

  return `${header}
  ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
  <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${executable.length} executable steps</span></div>
  ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div class="pfd-col-header"><div class="pfd-col-num">Step</div><div class="pfd-col-op">Operation</div><div class="pfd-col-detail">Method / Notes</div><div class="pfd-col-ctq">CTQs</div><div class="pfd-col-doc">Documents</div><div class="pfd-col-pfmea">PFMEA</div>${canEdit() ? '<div class="pfd-col-flow">Flow</div>' : ''}</div><div>${body}</div>`}
  ${canEdit() ? `<button class="add-row" data-action="pfd-add-main">＋ Add Process Step</button>` : ''}</div>
  ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" data-action="npi-set-apqp" data-tab="pfmea" style="color:var(--blue)">PFMEA →</a></div>` : ''}`
}

npi.pfd.toggleView = function() {
  npi.pfd.viewMode = npi.pfd.viewMode === 'table' ? 'flowchart' : 'table'
  npi.notify('render')
}

npi.pfd.toggleLayout = function() {
  npi.pfd.flowDirection = npi.pfd.flowDirection === 'TD' ? 'LR' : 'TD'
  npi.pfd._mermaidReady = false
  npi.notify('render')
}

npi.pfd.addMainStep = function() { npi.data.pfd.addMainStep() }

npi.pfd.addHeaderAfter = function(afterStepId) {
  const result = npi.data.pfd.addSectionHeaderAfter(afterStepId)
  if (!result.ok) showToast(result.error, 'error')
}

npi.pfd.openInsert = function(afterOi) {
  insertOriginIdx = afterOi
  const p = prog()
  const ni = document.getElementById('insertNum')
  const hi = document.getElementById('insertNumHint')

  if (afterOi != null) {
    const bounds = getInsertBounds(p, afterOi)
    const base = bounds ? bounds.base : 0
    const ceil = bounds ? bounds.ceil : 10
    ni.value = base + 1 <= ceil - 1 ? base + 1 : ''
    hi.textContent = `Available: ${base + 1}–${ceil - 1}`
  } else {
    const n = npi.data.nextMainStepNum(p.pfd)
    ni.value = n
    hi.textContent = `Next: ${n}`
  }
  showModal('modalInsert')
}

npi.pfd.confirmInsert = function() {
  const rawNum = document.getElementById('insertNum').value
  const num = rawNum === '' ? null : parseInt(rawNum, 10)
  const result = npi.data.pfd.insertStep(num, 'step')
  if (!result.ok) return showToast(result.error, 'error')
  closeModal('modalInsert')
}

npi.pfd.del = function(sid) { npi.data.pfd.del(sid) }
npi.pfd.upd = function(sid, f, v) {
  npi.data.pfd.upd(sid, f, v)
  if (f === 'pfd_type') {
    npi.notify('render')
  }
}
npi.pfd.scrollTo = function(sid) { const el = document.getElementById('pfd-row-' + sid); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
npi.pfd.toggleGroup = function(key) { npi.data.pfd.toggleGroup(collapsedGroups, key) }
npi.pfd.delBomRef = function(sid, bt, iid) { npi.data.pfd.delBomRef(sid, bt, iid) }

npi.pfd.openResourceEdit = function(stepId, bomType, itemId) {
  const p = prog()
  if (!p) return
  const step = p.pfd.find(x => x.id === stepId)
  if (!step) return
  const ref = (step.bomRefs || []).find(r => r.bomType === bomType && r.itemId === itemId)
  if (!ref) return

  resourceEditTarget = { stepId, bomType, itemId }
  resourceEditQty = ref.qty || 1

  let itemName = 'Resource'
  let itemDetails = ''

  if (bomType === 'parts_agg') {
    const aggregatedParts = npi.bom._aggregatePartsRegister ? npi.bom._aggregatePartsRegister(p) : []
    const part = aggregatedParts.find(x => (x.pn || x.desc) === itemId)
    if (part) {
      itemName = part.desc || part.pn || 'Part'
      itemDetails = part.pn ? `Part Number: ${part.pn}` : ''
    }
  } else if (bomType === 'aaw_asm') {
    const group = (p.bom.aaw_repair || []).find(x => x.id === itemId)
    if (group) {
      itemName = group.title || 'Assembly'
      itemDetails = group.tag === 'aaw' ? 'AAW Assembly' : (group.tag === 'repair' ? 'Repair Assembly' : 'Assembly')
    }
  } else {
    const bt = p.bom[bomType]
    if (bt) {
      const item = bt.find(x => x.id === itemId)
      if (item) {
        const t = BOM_TYPES[bomType]
        itemName = item.desc || (item.pn || item.toolId || item.equipId || 'Item')
        itemDetails = `${t.label}${item.pn ? ' · ' + item.pn : ''}`
      }
    }
  }

  document.getElementById('resourceEditTitle').textContent = `Edit Resource`
  document.getElementById('resourceEditQty').value = resourceEditQty
  document.getElementById('resourceEditInfo').innerHTML = `<strong>${esc(itemName)}</strong><br>${esc(itemDetails)}`

  showModal('modalResourceEdit')
}

npi.pfd.saveResourceEdit = function() {
  if (!resourceEditTarget) return
  const qtyInput = document.getElementById('resourceEditQty')
  const qty = parseInt(qtyInput.value, 10) || 1
  resourceEditQty = Math.max(1, qty)

  npi.data.pfd.updateResourceQty(resourceEditTarget.stepId, resourceEditTarget.bomType, resourceEditTarget.itemId, resourceEditQty)
  closeModal('modalResourceEdit')
  resourceEditTarget = null
}

npi.pfd.deleteResourceEdit = function() {
  if (!resourceEditTarget) return
  npi.data.pfd.delBomRef(resourceEditTarget.stepId, resourceEditTarget.bomType, resourceEditTarget.itemId)
  closeModal('modalResourceEdit')
  resourceEditTarget = null
}

npi.pfd.openCtqPick = function(oi) {
  const p = prog(); ctqPickTarget = oi; ctqPickSelected = [...(p.pfd[oi].ctqIds || [])]
  document.getElementById('ctqPickList').innerHTML = p.ctq.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No CTQs defined.</p>'
    : p.ctq.map((c, i) => `<label class="ctq-pick-label"><input type="checkbox" ${ctqPickSelected.includes(c.id) ? 'checked' : ''} data-action="pfd-toggle-ctq-pick" data-id="${c.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag tag-ctq">C${i + 1}</span><span style="font-size:12px;font-weight:600">${esc(c.req || 'Unnamed')}</span></div><div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;margin-top:1px">${esc(c.spec)}</div></div></label>`).join('')
  showModal('modalCtqPick')
}

npi.pfd.toggleCtqPick = function(cid, checked) {
  if (checked) {
    if (!ctqPickSelected.includes(cid)) ctqPickSelected.push(cid)
  } else {
    ctqPickSelected = ctqPickSelected.filter(x => x !== cid)
  }
}

npi.pfd.saveCtqPick = function() {
  npi.data.pfd.saveCtqPick(ctqPickTarget, ctqPickSelected)
  closeModal('modalCtqPick')
}

npi.pfd.openDocPick = function(oi) {
  const p = prog(); docPickTarget = oi; docPickSelected = [...(p.pfd[oi].docRefs || [])]
  const docs = p.docs || []
  document.getElementById('docPickList').innerHTML = docs.length === 0
    ? '<p style="color:var(--muted);font-size:13px">No documents in register.</p>'
    : docs.map((d, i) => `<label class="ctq-pick-label"><input type="checkbox" ${docPickSelected.includes(d.id) ? 'checked' : ''} data-action="pfd-toggle-doc-pick" data-id="${d.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag" style="font-size:9px;background:var(--bg);border:1px solid var(--line);color:var(--muted)">${esc(d.docNumber || '—')}</span><span style="font-size:12px;font-weight:600">${esc(d.title || 'Untitled')}</span></div><div style="font-size:11px;color:var(--muted);margin-top:1px">${esc(d.type || '')}${d.issue ? ' · Issue ' + esc(String(d.issue)) : ''}</div></div></label>`).join('')
  showModal('modalDocPick')
}

npi.pfd.toggleDocPick = function(docId, checked) {
  if (checked) { if (!docPickSelected.includes(docId)) docPickSelected.push(docId) }
  else { docPickSelected = docPickSelected.filter(x => x !== docId) }
}

npi.pfd.saveDocPick = function() {
  npi.data.pfd.saveDocPick(docPickTarget, docPickSelected)
  closeModal('modalDocPick')
}

npi.pfd.delDocRef = function(sid, docId) {
  const s = prog().pfd.find(x => x.id === sid)
  if (!s) return
  s.docRefs = (s.docRefs || []).filter(x => x !== docId)
  Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
  npi.notify('render')
}

npi.pfd.openBomPick = function(sid) {
  const p = prog(); if (!p) return
  const s = p.pfd.find(x => x.id === sid); if (!s) return
  bomPickTarget = sid
  bomPickSelected = [...(s.bomRefs || []).map(r => r.bomType + '|' + r.itemId)]
  bomPickFilter = 'all'
  bomPickSearch = ''

  const titleEl = document.getElementById('bomPickTitle')
  if (titleEl) titleEl.textContent = `Resources — Step ${s.stepNum}: ${s.op || '(unnamed)'}`

  const searchEl = document.getElementById('bomPickSearch')
  if (searchEl) searchEl.value = ''

  npi.pfd.refreshBomPickModal(p, 'bomPickFilter', 'bomPickList', bomPickFilter, bomPickSearch)
  showModal('modalBomPick')
}

npi.pfd.refreshBomPickModal = function(p, filterId, listId, activeFilter, searchTerm) {
  const filterEl = document.getElementById(filterId)
  const listEl = document.getElementById(listId)
  if (!filterEl || !listEl) return

  const search = (searchTerm || '').toLowerCase().trim()
  const matchesSearch = (text) => !search || (text || '').toLowerCase().includes(search)

  // Aggregate parts from BOM tree and AAW groups
  const aggregatedParts = npi.bom._aggregatePartsRegister ? npi.bom._aggregatePartsRegister(p) : []
  
  // Get AAW/Repair groups (top-level only)
  const aawGroups = p.bom.aaw_repair || []

  const types = Object.entries(BOM_TYPES)
  const flatTotal = types.reduce((n, [k]) => n + (p.bom[k] || []).length, 0)
  const totalCount = flatTotal + aggregatedParts.length + aawGroups.length

  filterEl.innerHTML = `<button class="bom-filter-btn${activeFilter === 'all' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="all" data-filter-id="${filterId}" data-list-id="${listId}">All (${totalCount})</button>` +
    types.map(([k, t]) => `<button class="bom-filter-btn${activeFilter === k ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="${k}" data-filter-id="${filterId}" data-list-id="${listId}">${t.icon} ${t.label} (${(p.bom[k] || []).length})</button>`).join('') +
    `<button class="bom-filter-btn${activeFilter === 'parts_agg' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="parts_agg" data-filter-id="${filterId}" data-list-id="${listId}">🔩 Parts (${aggregatedParts.length})</button>` +
    `<button class="bom-filter-btn${activeFilter === 'aaw_asm' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="aaw_asm" data-filter-id="${filterId}" data-list-id="${listId}">🔧 AAW/Repair Asm (${aawGroups.length})</button>`

  const items = []
  
  // Add flat BOM types (tools, equip, mat, cons)
  types.forEach(([k, t]) => {
    if (activeFilter !== 'all' && activeFilter !== k) return
    ;(p.bom[k] || []).forEach(item => {
      const key = k + '|' + item.id
      const name = item.desc || (item.pn || item.toolId || item.equipId || '')
      const flags = []
      if (item.isAaw) flags.push('<span class="flag-pill flag-aaw">AAW</span>')
      if (item.isRepair) flags.push('<span class="flag-pill flag-repair">RPR</span>')
      const meta = [item.pn || item.toolId || item.equipId, item.spec].filter(Boolean).join(' · ')
      
      // Filter by search term
      if (!matchesSearch(name) && !matchesSearch(item.pn) && !matchesSearch(item.toolId) && !matchesSearch(item.equipId) && !matchesSearch(item.spec)) return
      
      items.push(`<div class="bom-pick-item${bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">${t.icon} ${esc(name || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">${t.label}</span></div>`)
    })
  })
  
  // Add aggregated parts from BOM tree and AAW groups
  if (activeFilter === 'all' || activeFilter === 'parts_agg') {
    aggregatedParts.forEach(part => {
      const key = 'parts_agg|' + (part.pn || part.desc)
      const flags = []
      const sources = Array.from(part.sources || [])
      if (sources.includes('aaw')) flags.push('<span class="flag-pill flag-aaw">AAW</span>')
      if (sources.includes('repair')) flags.push('<span class="flag-pill flag-repair">RPR</span>')
      const meta = [part.pn, `Qty: ${part.qty} ${part.unit}`].filter(Boolean).join(' · ')
      
      // Filter by search term
      if (!matchesSearch(part.desc) && !matchesSearch(part.pn)) return
      
      items.push(`<div class="bom-pick-item${bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">🔩 ${esc(part.desc || part.pn || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">Part</span></div>`)
    })
  }
  
  // Add AAW/Repair assemblies (top-level groups only)
  if (activeFilter === 'all' || activeFilter === 'aaw_asm') {
    aawGroups.forEach(group => {
      const key = 'aaw_asm|' + group.id
      const tagLabel = group.tag === 'aaw' ? 'AAW' : (group.tag === 'repair' ? 'Repair' : 'AAW/Repair')
      const flagClass = group.tag === 'aaw' ? 'flag-pill flag-aaw' : (group.tag === 'repair' ? 'flag-pill flag-repair' : 'flag-pill flag-aaw')
      const totalParts = (group.nodes || []).filter(n => n.nodeType === 'part').length
      const totalSubAsm = (group.nodes || []).filter(n => n.nodeType === 'subassembly').length
      const meta = [`${totalSubAsm} sub-assemblies`, `${totalParts} parts`].join(' · ')
      
      // Filter by search term
      if (!matchesSearch(group.title)) return
      
      items.push(`<div class="bom-pick-item${bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">🔧 ${esc(group.title || 'Unnamed Assembly')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap"><span class="${flagClass}">${tagLabel}</span></div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">Assembly</span></div>`)
    })
  }

  if (items.length) {
    listEl.innerHTML = items.join('')
  } else if (search) {
    listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No resources match "${esc(search)}"</div>`
  } else {
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No items in BoM yet.</div>'
  }
}

npi.pfd.setBomFilter = function(f, fid, lid) { bomPickFilter = f; npi.pfd.refreshBomPickModal(prog(), fid, lid, f, bomPickSearch) }

npi.pfd.searchBomPick = function(query) {
  bomPickSearch = query || ''
  npi.pfd.refreshBomPickModal(prog(), 'bomPickFilter', 'bomPickList', bomPickFilter, bomPickSearch)
}

npi.pfd.toggleBomPick = function(key, el) {
  const chk = el.querySelector('input')
  if (bomPickSelected.includes(key)) {
    bomPickSelected = bomPickSelected.filter(x => x !== key)
    el.classList.remove('selected')
    if (chk) chk.checked = false
  } else {
    bomPickSelected.push(key)
    el.classList.add('selected')
    if (chk) chk.checked = true
  }
}

npi.pfd.saveBomPick = function() {
  npi.data.pfd.saveBomPick(bomPickTarget, bomPickSelected)
  closeModal('modalBomPick')
}
