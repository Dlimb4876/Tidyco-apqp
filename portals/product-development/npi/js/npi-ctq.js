// ═══════════════════════════════════
// npi-ctq.js — CTQ tab rendering and UI actions
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.ctq = npi.ctq || {}

const CTQ_SOURCES = ['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing']
const CTQ_OOS_ACTIONS = ['Repair', 'Replace', 'Scrap', 'Review', 'TBD']

npi.ctq.getSourceFilter = function() {
  const cur = (globalThis.ctqSourceFilter || 'all').toString()
  return ['all', ...CTQ_SOURCES].includes(cur) ? cur : 'all'
}

npi.ctq.setSourceFilter = function(v) {
  const safe = (v || 'all').toString()
  globalThis.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'
  render()
}

npi.ctq.getOosFilter = function() {
  const cur = (globalThis.ctqOosFilter || 'all').toString()
  return ['all', ...CTQ_OOS_ACTIONS].includes(cur) ? cur : 'all'
}

npi.ctq.setOosFilter = function(v) {
  const safe = (v || 'all').toString()
  globalThis.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'
  render()
}

npi.ctq.getAgreedFilter = function() {
  const cur = (globalThis.ctqAgreedFilter || 'all').toString()
  return ['all', 'yes', 'no'].includes(cur) ? cur : 'all'
}

npi.ctq.setAgreedFilter = function(v) {
  const safe = (v || 'all').toString()
  globalThis.ctqAgreedFilter = ['all', 'yes', 'no'].includes(safe) ? safe : 'all'
  render()
}

npi.ctq.clearFilters = function() {
  globalThis.ctqSourceFilter = 'all'
  globalThis.ctqOosFilter = 'all'
  globalThis.ctqAgreedFilter = 'all'
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
  const hasFilters = sourceFilter !== 'all' || oosFilter !== 'all' || agreedFilter !== 'all'

  const filteredIdx = p.ctq
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => npi.ctq.matchesFilter(r, sourceFilter, oosFilter, agreedFilter))

  const rows = filteredIdx.map(({ r, i }) => `<tr>
    <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>
    <td><textarea class="cell-edit" name="ctq_${i}_req" rows="2" data-action="ctq-upd" data-idx="${i}" data-field="req" placeholder="CTQ requirement">${esc(r.req)}</textarea></td>
    <td><input class="cell-edit mono" name="ctq_${i}_spec" value="${esc(r.spec)}" data-action="ctq-upd" data-idx="${i}" data-field="spec" placeholder="e.g. 50±0.05mm" style="width:100%"></td>
    <td><input class="cell-edit" name="ctq_${i}_testMethod" value="${esc(r.testMethod || '')}" data-action="ctq-upd" data-idx="${i}" data-field="testMethod" placeholder="e.g. CMM, Gauge, Visual" style="width:100%"></td>
    <td><select class="cell-edit" name="ctq_${i}_source" data-action="ctq-upd" data-idx="${i}" data-field="source" style="width:100%">${CTQ_SOURCES.map(o => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><select class="cell-edit" name="ctq_${i}_oos_action" data-action="ctq-upd" data-idx="${i}" data-field="oos_action" style="width:100%">${CTQ_OOS_ACTIONS.map(o => `<option${r.oos_action === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><div class="ctq-agreed">
      <input type="checkbox" name="ctq_${i}_customerAgreed" ${r.customerAgreed ? 'checked' : ''} data-action="ctq-upd" data-idx="${i}" data-field="customerAgreed" title="Customer has accepted this CTQ method and out-of-spec plan">
      <span class="ctq-agreed-label" style="color:${r.customerAgreed ? 'var(--green)' : 'var(--muted)'}">${r.customerAgreed ? 'ACCEPTED' : '—'}</span>
    </div></td>
    <td style="text-align:center">${canEdit() ? `<button class="del-btn" data-action="ctq-del" data-idx="${i}">×</button>` : ''}</td>
  </tr>`).join('')

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
    <div class="ctq-filter-summary">
      <span class="tag">${filteredIdx.length}/${p.ctq.length} shown</span>
      ${hasFilters ? `<button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button>` : ''}
    </div>
  </div>` : ''

  const tableContent = p.ctq.length === 0
    ? emptyState('🎯', 'No CTQs yet', canEdit() ? 'Add critical requirements' : 'No CTQs defined yet')
    : filteredIdx.length === 0
      ? emptyState('🔍', 'No matches', `${p.ctq.length} CTQ${p.ctq.length !== 1 ? 's' : ''} exist but none match the active filters.`) + `<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button></div>`
      : `<div class="sticky-table-wrap"><table class="tbl ctq-tbl" style="min-width:960px;table-layout:fixed;width:100%"><colgroup><col style="width:40px"><col style="width:22%"><col style="width:14%"><col style="width:18%"><col style="width:13%"><col style="width:13%"><col style="width:90px"><col style="width:30px"></colgroup>${npi.components.tableHeader([{label:'Ref'},{label:'Requirement'},{label:'Target / Tolerance'},{label:'Test Method'},{label:'Source'},{label:'Out-of-Spec Action'},{label:'Customer Accepted',style:'text-align:center'},{label:''}])}<tbody>${rows}</tbody></table></div>`

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 01</div><div class="sec-title">CTQ Matrix</div><div class="sec-desc">Critical-to-Quality requirements — source of truth for PFD, PFMEA and Control Plan.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-ctq')" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div></div>
  ${filterBar}
  <div class="card"><div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
  ${tableContent}
  ${canEdit() ? `<button class="add-row" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div>
  ${p.ctq.length > 0 ? `<div class="info-banner">💡 ${p.ctq.length} CTQs defined. Next: <a href="#" data-action="npi-set-apqp" data-tab="pfd" style="color:var(--blue)">Process Flow →</a></div>` : ''}`
}

npi.ctq.add = function() { npi.data.ctq.add() }
npi.ctq.upd = function(i, f, v) { npi.data.ctq.upd(i, f, v) }
npi.ctq.del = function(i) { npi.data.ctq.del(i) }
