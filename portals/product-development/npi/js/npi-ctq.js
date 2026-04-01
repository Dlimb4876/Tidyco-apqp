// ═══════════════════════════════════
// npi-ctq.js — CTQ tab rendering and UI actions
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

import { appState, prog } from '../../../../core/js/state.js'
import { esc, canEdit, emptyState } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { writeNavigationHistory, render } from '../../../../utils/js/navigation.js'
import { npi } from './npi-shared.js'
import { npiComponents } from './npi-components.js'
import { npiData } from './npi-data.js'

const CTQ_SOURCES = ['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing']
const CTQ_OOS_ACTIONS = ['Repair', 'Replace', 'Scrap', 'Review', 'TBD']
const CTQ_COVERAGE_OPTIONS = ['all', 'linked', 'orphaned']

// ═══════════════════════════════════════════════════════════════
// Coverage helpers — track where CTQs are referenced
// ═══════════════════════════════════════════════════════════════
npi.ctq.getCoverage = function(ctqId, p) {
  const pfdCount = p.pfd.filter(s => (s.ctqIds || []).includes(ctqId)).length
  const pfmeaCount = p.pfmea.filter(m => (m.ctqIds || []).includes(ctqId)).length
  return { pfdCount, pfmeaCount, total: pfdCount + pfmeaCount }
}

npi.ctq.getCoverageFilter = function() {
  const cur = (appState.ctqCoverageFilter || 'all').toString()
  return CTQ_COVERAGE_OPTIONS.includes(cur) ? cur : 'all'
}

npi.ctq.setCoverageFilter = function(v) {
  const safe = (v || 'all').toString()
  appState.ctqCoverageFilter = CTQ_COVERAGE_OPTIONS.includes(safe) ? safe : 'all'
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.ctq.matchesCoverageFilter = function(r, p, coverageFilter) {
  if (coverageFilter === 'all') return true
  const coverage = npi.ctq.getCoverage(r.id, p)
  if (coverageFilter === 'linked') return coverage.total > 0
  if (coverageFilter === 'orphaned') return coverage.total === 0
  return true
}

npi.ctq.getSourceFilter = function() {
  const cur = (appState.ctqSourceFilter || 'all').toString()
  return ['all', ...CTQ_SOURCES].includes(cur) ? cur : 'all'
}

npi.ctq.setSourceFilter = function(v) {
  const safe = (v || 'all').toString()
  appState.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.ctq.getOosFilter = function() {
  const cur = (appState.ctqOosFilter || 'all').toString()
  return ['all', ...CTQ_OOS_ACTIONS].includes(cur) ? cur : 'all'
}

npi.ctq.setOosFilter = function(v) {
  const safe = (v || 'all').toString()
  appState.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.ctq.getAgreedFilter = function() {
  const cur = (appState.ctqAgreedFilter || 'all').toString()
  return ['all', 'yes', 'no'].includes(cur) ? cur : 'all'
}

npi.ctq.setAgreedFilter = function(v) {
  const safe = (v || 'all').toString()
  appState.ctqAgreedFilter = ['all', 'yes', 'no'].includes(safe) ? safe : 'all'
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.ctq.clearFilters = function() {
  appState.ctqSourceFilter = 'all'
  appState.ctqOosFilter = 'all'
  appState.ctqAgreedFilter = 'all'
  appState.ctqCoverageFilter = 'all'
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
  writeNavigationHistory('#' + parts.join('&'), { push: true })
  render()
}

npi.ctq.matchesFilter = function(r, sourceFilter, oosFilter, agreedFilter) {
  if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
  if (oosFilter !== 'all' && r.oos_action !== oosFilter) return false
  if (agreedFilter === 'yes' && !r.customerAgreed) return false
  if (agreedFilter === 'no' && r.customerAgreed) return false
  return true
}

npi.ctq.render = function() {
  const p = prog()
  const sourceFilter = npi.ctq.getSourceFilter()
  const oosFilter = npi.ctq.getOosFilter()
  const agreedFilter = npi.ctq.getAgreedFilter()
  const coverageFilter = npi.ctq.getCoverageFilter()
  const hasFilters = sourceFilter !== 'all' || oosFilter !== 'all' || agreedFilter !== 'all' || coverageFilter !== 'all'

  const filteredIdx = p.ctq
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => npi.ctq.matchesFilter(r, sourceFilter, oosFilter, agreedFilter))
    .filter(({ r }) => npi.ctq.matchesCoverageFilter(r, p, coverageFilter))

  const coverageStats = p.ctq.map(r => npi.ctq.getCoverage(r.id, p))
  const linkedCount = coverageStats.filter(c => c.total > 0).length
  const orphanedCount = coverageStats.filter(c => c.total === 0).length

  const rows = filteredIdx.map(({ r, i }) => {
    const coverage = npi.ctq.getCoverage(r.id, p)
    const coverageHtml = coverage.total === 0
      ? `<span class="tag tag-amber" title="Not linked to any PFD steps or PFMEA modes">⚠️ Orphaned</span>`
      : `<span class="tag tag-green" title="Linked to ${coverage.pfdCount} PFD step(s) and ${coverage.pfmeaCount} PFMEA mode(s)">✓ ${coverage.total}</span>`
    return `<tr>
    <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>
    <td><textarea class="cell-edit" name="ctq_${i}_req" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="req" data-autoresize placeholder="CTQ requirement">${esc(r.req)}</textarea></td>
    <td><textarea class="cell-edit mono" name="ctq_${i}_spec" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="spec" data-autoresize placeholder="e.g. 50±0.05mm">${esc(r.spec)}</textarea></td>
    <td><textarea class="cell-edit" name="ctq_${i}_testMethod" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="testMethod" data-autoresize placeholder="e.g. CMM, Gauge, Visual">${esc(r.testMethod || '')}</textarea></td>
    <td><select class="cell-edit" name="ctq_${i}_source" data-action="ctq-upd" data-idx="${i}" data-field="source" style="width:100%">${CTQ_SOURCES.map(o => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><textarea class="cell-edit" name="ctq_${i}_source_ref" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="source_ref" data-autoresize placeholder="e.g. Doc-123, §4.2">${esc(r.source_ref || '')}</textarea></td>
    <td><select class="cell-edit" name="ctq_${i}_oos_action" data-action="ctq-upd" data-idx="${i}" data-field="oos_action" style="width:100%">${CTQ_OOS_ACTIONS.map(o => `<option${r.oos_action === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><div class="ctq-agreed">
      <input type="checkbox" name="ctq_${i}_customerAgreed" ${r.customerAgreed ? 'checked' : ''} data-action="ctq-upd" data-idx="${i}" data-field="customerAgreed" title="Customer has accepted this CTQ method and out-of-spec plan">
      <span class="ctq-agreed-label" style="color:${r.customerAgreed ? 'var(--green)' : 'var(--muted)'}">${r.customerAgreed ? 'ACCEPTED' : '—'}</span>
    </div></td>
    <td style="text-align:center">${coverageHtml}</td>
    <td style="text-align:center">${canEdit() ? `<button class="del-btn" data-action="ctq-del" data-idx="${i}">×</button>` : ''}</td>
  </tr>`
  }).join('')

  const filterBar = p.ctq.length > 0 ? `<div class="apqp-filters">
    <div class="filter-group">
      <label class="ctq-filter-label">Source</label>
      <select class="cell-edit" data-action="ctq-filter-source">
        <option value="all"${sourceFilter === 'all' ? ' selected' : ''}>All sources</option>
        ${CTQ_SOURCES.map(o => `<option value="${esc(o)}"${sourceFilter === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
      </select>
    </div>
    <div class="filter-group">
      <label class="ctq-filter-label">Out-of-Spec Action</label>
      <select class="cell-edit" data-action="ctq-filter-oos">
        <option value="all"${oosFilter === 'all' ? ' selected' : ''}>All actions</option>
        ${CTQ_OOS_ACTIONS.map(o => `<option value="${esc(o)}"${oosFilter === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
      </select>
    </div>
    <div class="filter-group">
      <label class="ctq-filter-label">Customer Accepted</label>
      <select class="cell-edit" data-action="ctq-filter-agreed">
        <option value="all"${agreedFilter === 'all' ? ' selected' : ''}>All</option>
        <option value="yes"${agreedFilter === 'yes' ? ' selected' : ''}>Accepted only</option>
        <option value="no"${agreedFilter === 'no' ? ' selected' : ''}>Not accepted</option>
      </select>
    </div>
    <div class="filter-group">
      <label class="ctq-filter-label">Coverage</label>
      <select class="cell-edit" data-action="ctq-filter-coverage">
        <option value="all"${coverageFilter === 'all' ? ' selected' : ''}>All CTQs</option>
        <option value="linked"${coverageFilter === 'linked' ? ' selected' : ''}>Linked (${linkedCount})</option>
        <option value="orphaned"${coverageFilter === 'orphaned' ? ' selected' : ''}>Orphaned (${orphanedCount})</option>
      </select>
    </div>
    <div class="ctq-filter-summary">
      <span class="tag">${filteredIdx.length}/${p.ctq.length} shown</span>
      ${hasFilters ? `<button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button>` : ''}
    </div>
  </div>` : ''

  const tableContent = p.ctq.length === 0
    ? emptyState('🎯', 'No CTQs yet', canEdit() ? 'Add critical requirements' : 'No CTQs defined yet')
    : filteredIdx.length === 0
      ? emptyState('🔍', 'No matches', `${p.ctq.length} CTQ${p.ctq.length !== 1 ? 's' : ''} exist but none match the active filters.`) + `<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button></div>`
      : `<div class="sticky-table-wrap"><table class="tbl ctq-tbl" style="min-width:1060px;table-layout:fixed;width:100%"><colgroup><col style="width:40px"><col style="width:18%"><col style="width:12%"><col style="width:14%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:90px"><col style="width:80px"><col style="width:30px"></colgroup>${npiComponents.tableHeader([{label:'Ref'},{label:'Requirement'},{label:'Target / Tolerance'},{label:'Test Method'},{label:'Source'},{label:'Source Ref'},{label:'Out-of-Spec Action'},{label:'Customer Accepted',style:'text-align:center'},{label:'Coverage',style:'text-align:center'},{label:''}])}<tbody>${rows}</tbody></table></div>`

  const coverageBanner = p.ctq.length > 0
    ? `<div class="coverage-banner"><span class="coverage-stat"><span class="tag tag-green">${linkedCount}</span> linked</span><span class="coverage-stat"><span class="tag tag-amber">${orphanedCount}</span> orphaned</span>${orphanedCount > 0 ? ' <a href="#" data-action="npi-set-apqp" data-tab="pfd" style="color:var(--blue)">Link to PFD →</a>' : ''}</div>`
    : ''

  // Fullscreen overlay: expands the CTQ table to fill the whole screen
  if (appState.ctqExpanded) {
    return `<div class="portal-fullscreen-overlay">
      <div class="portal-fullscreen-bar">
        <span><span class="portal-fullscreen-title">CTQ Matrix</span><span class="portal-fullscreen-project">${esc(p.name || '')}</span></span>
        <div style="display:flex;gap:8px;align-items:center">
          ${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="ctq-add">＋ Add CTQ</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="ctq-toggle-expand">✕ Exit Fullscreen</button>
        </div>
      </div>
      ${filterBar}
      ${coverageBanner}
      <div class="portal-fullscreen-body">
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
          ${tableContent}
          ${canEdit() ? `<button class="add-row" data-action="ctq-add">＋ Add CTQ</button>` : ''}
        </div>
      </div>
    </div>`
  }

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 01</div><div class="sec-title">CTQ Matrix</div><div class="sec-desc">Critical-to-Quality requirements — source of truth for PFD, PFMEA and Control Plan.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-ctq')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" data-action="ctq-toggle-expand" title="Fullscreen mode">⛶ Expand</button>${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div></div>
  ${filterBar}
  ${coverageBanner}
  <div class="card"><div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
  ${tableContent}
  ${canEdit() ? `<button class="add-row" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div>
  ${p.ctq.length > 0 ? `<div class="info-banner">💡 ${p.ctq.length} CTQs defined. Next: <a href="#" data-action="npi-set-apqp" data-tab="pfd" style="color:var(--blue)">Process Flow →</a></div>` : ''}`
}

// Toggle fullscreen for focused CTQ Matrix editing on large screens
npi.ctq.toggleExpand = function() {
  appState.ctqExpanded = !appState.ctqExpanded
  render()
}

npi.ctq.add = function() { npiData.ctq.add() }
npi.ctq.upd = function(i, f, v) { npiData.ctq.upd(i, f, v) }
npi.ctq.del = function(i) { npiData.ctq.del(i) }

export const npiCtq = npi.ctq
export const renderCtq = npi.ctq.render
export const addCtq = npi.ctq.add
export const updateCtq = npi.ctq.upd
export const deleteCtq = npi.ctq.del
