// ═══════════════════════════════════
// documents.js — NPI Document Register
// Depends on: state.js, helpers.js, navigation.js, npi.js, npi-data.js
// All functions under npi.docs.*
// ═══════════════════════════════════

const DOC_TYPES = ['Drawing', 'Specification', 'Test Plan', 'Work Instruction', 'Report', 'Other']
const DOC_STATUSES = ['Draft', 'Issue']

npi.docs.render = function() {
  const p = prog()
  const liveUpdateBadge = typeof npiRealtimeIndicatorHTML === 'function' ? npiRealtimeIndicatorHTML() : ''
  const docs = p.docs || []

  const rows = docs.map((d, i) => `<tr>
    <td class="w28 ctr" style="color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:11px">${i + 1}</td>
    <td><input class="cell-edit" value="${esc(d.docNumber)}" onchange="npi.docs.upd(${i},'docNumber',this.value)" placeholder="e.g. DWG-001" style="width:100%"></td>
    <td><input class="cell-edit" value="${esc(d.title)}" onchange="npi.docs.upd(${i},'title',this.value)" placeholder="Document title" style="width:100%"></td>
    <td><select class="cell-edit" onchange="npi.docs.upd(${i},'type',this.value)" style="width:100%">${DOC_TYPES.map(t => `<option${d.type === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></td>
    <td><input class="cell-edit" type="number" value="${esc(d.issue)}" onchange="npi.docs.upd(${i},'issue',this.value)" placeholder="e.g. 1" style="width:100%;text-align:center"></td>
    <td><input class="cell-edit" value="${esc(d.owner)}" onchange="npi.docs.upd(${i},'owner',this.value)" placeholder="Owner" style="width:100%"></td>
    <td><select class="cell-edit" onchange="npi.docs.upd(${i},'status',this.value)" style="width:100%">${DOC_STATUSES.map(s => `<option${d.status === s ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></td>
    <td><input class="cell-edit" value="${esc(d.notes)}" onchange="npi.docs.upd(${i},'notes',this.value)" placeholder="Notes" style="width:100%"></td>
    <td style="text-align:center"><button class="del-btn" onclick="npi.docs.del(${i})">×</button></td>
  </tr>`).join('')

  return `<div class="sec-head">
    <div>
      <div class="sec-eyebrow">Project</div>
      <div class="sec-title">Document Register</div>
      <div class="sec-desc">Reference list of all project documents. Edit all fields inline.</div>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button>
      <button class="btn btn-primary btn-sm" onclick="npi.docs.add()">＋ Add Document</button>
    </div>
  </div>
  ${liveUpdateBadge ? `<div style="margin:0 0 12px 0;display:flex;justify-content:flex-end">${liveUpdateBadge}</div>` : ''}
  <div class="card" style="overflow-x:auto">
    <div class="card-head">
      <span class="card-title">All Documents</span>
      <span class="card-meta">${docs.length} total</span>
    </div>
    ${docs.length === 0
      ? emptyState('📄', 'No documents yet', 'Click ＋ Add Document to start the register')
      : `<div class="sticky-card-scroll"><table class="tbl" style="table-layout:fixed;width:100%">
          <colgroup>
            <col style="width:36px">
            <col style="width:110px">
            <col style="width:260px">
            <col style="width:130px">
            <col style="width:70px">
            <col style="width:110px">
            <col style="width:110px">
            <col style="width:200px">
            <col style="width:32px">
          </colgroup>
          <thead><tr>
            <th>#</th>
            <th>Doc Number</th>
            <th>Title</th>
            <th>Type</th>
            <th>Issue</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Notes</th>
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`}
    <button class="add-row" onclick="npi.docs.add()">＋ Add Document</button>
  </div>`
}

npi.docs.add = function() {
  npi.data.docs.add()
  render()
}

npi.docs.upd = function(i, f, v) {
  npi.data.docs.upd(i, f, v)
}

npi.docs.del = function(i) {
  npi.data.docs.del(i)
  render()
}
