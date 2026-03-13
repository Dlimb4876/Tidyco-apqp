// ═══════════════════════════════════
// npi-cp.js — Control Plan tab rendering and UI actions
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

npi.cp = npi.cp || {}

npi.cp.render = function() {
  const p = prog()
  const cpCauseKeys = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))
  const miss = []
  p.pfmea.forEach(mode => {
    (mode.effects || []).forEach(ef => {
      (ef.causes || []).forEach(ca => { if (!cpCauseKeys.has(ca.id)) miss.push({ mode, ef, ca }) })
    })
  })

  const rows = p.cp.map((r, i) => {
    const fr = p.pfmea.find(f => f.id === r.pfmeaId)
    const ef = fr && r.pfmeaEffectId ? (fr.effects || []).find(e => e.id === r.pfmeaEffectId) : null
    const ca = ef && r.pfmeaCauseId ? (ef.causes || []).find(c => c.id === r.pfmeaCauseId) : null
    const step = fr ? p.pfd.find(s => s.id === fr.pfdId) : null
    const sl = step ? `${step.stepNum} – ${esc(step.op || '')}` : '—'
    const ctqs = (step ? step.ctqIds || [] : []).map(cid => {
      const ci = p.ctq.findIndex(c => c.id === cid)
      return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : ''
    }).join('')
    const rpn = ca && ef ? (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) : 0
    const rpnBadge = rpn ? npi.components.rpnBadge(rpn) : ''

    return `<tr><td class="w100"><span class="tag tag-step" style="font-size:10px">${sl}</span></td>
      <td class="w140" style="font-size:11px;color:var(--mid)">${fr ? esc(fr.mode || '—') : '—'}${ef ? `<span style="color:var(--muted)"> → ${esc(ef.effect || '')}</span>` : ''}${ca ? `<div style="font-size:10px;color:var(--muted);margin-top:1px">Cause: ${esc(ca.cause || '')}</div>` : ''}${rpnBadge ? ` ${rpnBadge}` : ''}</td>
      <td><input class="cell-edit" value="${esc(r.char)}" onchange="npi.cp.upd(${i},'char',this.value)" placeholder="Characteristic"></td>
      <td class="w80"><select class="cell-edit" onchange="npi.cp.upd(${i},'type',this.value)">${['Product', 'Process', 'Dimensional', 'Functional', 'Visual'].map(o => `<option${r.type === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
      <td class="w110"><input class="cell-edit mono" value="${esc(r.spec)}" onchange="npi.cp.upd(${i},'spec',this.value)" placeholder="Spec"></td>
      <td class="w110"><input class="cell-edit" value="${esc(r.method)}" onchange="npi.cp.upd(${i},'method',this.value)" placeholder="Method"></td>
      <td class="w60"><input class="cell-edit" value="${esc(r.freq)}" onchange="npi.cp.upd(${i},'freq',this.value)" placeholder="100%"></td>
      <td class="w70"><input class="cell-edit" value="${esc(r.resp)}" onchange="npi.cp.upd(${i},'resp',this.value)" placeholder="Who"></td>
      <td><textarea class="cell-edit" rows="2" onchange="npi.cp.upd(${i},'reaction',this.value)" placeholder="Reaction plan">${esc(r.reaction)}</textarea></td>
      <td class="w50"><div style="display:flex;flex-wrap:wrap;gap:2px">${ctqs || '—'}</div></td>
      <td class="w28 ctr"><button class="del-btn" onclick="npi.cp.del(${i})">×</button></td></tr>`
  }).join('')

  const syncBanner = miss.length > 0
    ? `<div style="background:var(--amber-pale);border:1px solid var(--amber-mid);border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:13px;color:var(--amber)">⚠ ${miss.length} PFMEA effect${miss.length !== 1 ? 's' : ''} not in control plan.</span><button class="btn btn-sm" style="background:var(--amber);color:white;border:none" onclick="npi.cp.syncFromPFMEA()">Auto-populate from PFMEA</button></div>`
    : ''

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 04</div><div class="sec-title">Control Plan</div><div class="sec-desc">Linked to PFMEA and PFD. Step numbers and CTQs carry through automatically.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="npi.cp.syncFromPFMEA()">Sync from PFMEA</button><button class="btn btn-primary btn-sm" onclick="npi.cp.add()">＋ Add Row</button></div></div>
  ${syncBanner}
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">Control Plan</span><span class="card-meta">${p.cp.length} characteristics</span></div>
  ${p.cp.length === 0 ? emptyState('📊', 'No entries yet', miss.length > 0 ? 'Use "Sync from PFMEA" to auto-populate' : 'Complete PFMEA first') : `<div class="sticky-table-wrap"><table class="tbl" style="min-width:1100px">${npi.components.tableHeader([{label:'Step'},{label:'FMEA/RPN'},{label:'Characteristic'},{label:'Type'},{label:'Spec'},{label:'Method'},{label:'Freq'},{label:'Resp'},{label:'Reaction Plan'},{label:'CTQs'},{label:''}])}<tbody>${rows}</tbody></table></div>`}
  <button class="add-row" onclick="npi.cp.add()">＋ Add Row</button></div>`
}

npi.cp.syncFromPFMEA = function() { npi.data.cp.syncFromPFMEA(); render() }
npi.cp.add = function() { npi.data.cp.add(); render() }
npi.cp.upd = function(i, f, v) { npi.data.cp.upd(i, f, v) }
npi.cp.del = function(i) { npi.data.cp.del(i); render() }
