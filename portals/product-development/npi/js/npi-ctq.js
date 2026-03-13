// ═══════════════════════════════════
// npi-ctq.js — CTQ tab rendering and UI actions
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.ctq = npi.ctq || {}

npi.ctq.render = function() {
  const p = prog()
  const rows = p.ctq.map((r, i) => `<tr>
    <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>
    <td><textarea class="cell-edit" rows="2" onchange="npi.ctq.upd(${i},'req',this.value)" placeholder="CTQ requirement">${esc(r.req)}</textarea></td>
    <td><input class="cell-edit mono" value="${esc(r.spec)}" onchange="npi.ctq.upd(${i},'spec',this.value)" placeholder="e.g. 50±0.05mm" style="width:100%"></td>
    <td><input class="cell-edit" value="${esc(r.testMethod || '')}" onchange="npi.ctq.upd(${i},'testMethod',this.value)" placeholder="e.g. CMM, Gauge, Visual" style="width:100%"></td>
    <td><select class="cell-edit" onchange="npi.ctq.upd(${i},'source',this.value)" style="width:100%">${['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing'].map(o => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><select class="cell-edit" onchange="npi.ctq.upd(${i},'oos_action',this.value)" style="width:100%">${['Repair', 'Replace', 'Scrap', 'Review', 'TBD'].map(o => `<option${r.oos_action === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
    <td><div class="ctq-agreed">
      <input type="checkbox" ${r.customerAgreed ? 'checked' : ''} onchange="npi.ctq.upd(${i},'customerAgreed',this.checked);render()" title="Customer has agreed this CTQ method and out-of-spec plan">
      <span class="ctq-agreed-label" style="color:${r.customerAgreed ? 'var(--green)' : 'var(--muted)'}">${r.customerAgreed ? 'AGREED' : '—'}</span>
    </div></td>
    <td style="text-align:center"><button class="del-btn" onclick="npi.ctq.del(${i})">×</button></td>
  </tr>`).join('')

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 01</div><div class="sec-title">CTQ Matrix</div><div class="sec-desc">Critical-to-Quality requirements — source of truth for PFD, PFMEA and Control Plan.</div></div><div class="sec-actions"><button class="btn btn-primary btn-sm" onclick="npi.ctq.add()">＋ Add CTQ</button></div></div>
  <div class="card"><div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
  ${p.ctq.length === 0 ? emptyState('🎯', 'No CTQs yet', 'Add critical requirements') : `<div class="sticky-table-wrap"><table class="tbl ctq-tbl" style="min-width:960px;table-layout:fixed;width:100%"><colgroup><col style="width:40px"><col style="width:22%"><col style="width:14%"><col style="width:18%"><col style="width:13%"><col style="width:13%"><col style="width:74px"><col style="width:30px"></colgroup>${npi.components.tableHeader([{label:'Ref'},{label:'Requirement'},{label:'Target / Tolerance'},{label:'Test Method'},{label:'Source'},{label:'Out-of-Spec Action'},{label:'Agreed',style:'text-align:center'},{label:''}])}<tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="npi.ctq.add()">＋ Add CTQ</button></div>
  ${p.ctq.length > 0 ? `<div class="info-banner">💡 ${p.ctq.length} CTQs defined. Next: <a href="#" onclick="npi.nav.setApqpTab('pfd');return false" style="color:var(--blue)">Process Flow →</a></div>` : ''}`
}

npi.ctq.add = function() { npi.data.ctq.add(); render() }
npi.ctq.upd = function(i, f, v) { npi.data.ctq.upd(i, f, v) }
npi.ctq.del = function(i) { npi.data.ctq.del(i); render() }
