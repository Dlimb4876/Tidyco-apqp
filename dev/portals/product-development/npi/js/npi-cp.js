// ═══════════════════════════════════
// npi-cp.js — Control Plan tab rendering and UI actions
// Depends on: npi.js, npi-data.js
// ═══════════════════════════════════

import { prog } from '../../../../core/js/state.js'
import { calcRPN, esc, canEdit, emptyState, showToast } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { npi } from './npi-shared.js'
import { npiComponents } from './npi-components.js'
import { npiData } from './npi-data.js'

npi.cp.calcCauseRpn = function(sev, occ, det) {
  if (typeof calcRPN === 'function') return calcRPN({ sev, occ, det })
  return (sev || 1) * (occ || 1) * (det || 1)
}

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
    const rpn = ca && ef ? npi.cp.calcCauseRpn(ef.sev, ca.occ, ca.det) : 0
    const rpnBadge = rpn ? npiComponents.rpnBadge(rpn) : ''

    return `<tr><td class="w100"><span class="tag tag-step" style="font-size:10px">${sl}</span></td>
      <td class="w140" style="font-size:11px;color:var(--mid)">${fr ? esc(fr.mode || '—') : '—'}${ef ? `<span style="color:var(--muted)"> → ${esc(ef.effect || '')}</span>` : ''}${ca ? `<div style="font-size:10px;color:var(--muted);margin-top:1px">Cause: ${esc(ca.cause || '')}</div>` : ''}${rpnBadge ? ` ${rpnBadge}` : ''}</td>
      <td><input class="cell-edit" name="cp_${i}_char" value="${esc(r.char)}" data-action="cp-upd" data-idx="${i}" data-field="char" placeholder="Characteristic"></td>
      <td class="w80"><select class="cell-edit" name="cp_${i}_type" data-action="cp-upd" data-idx="${i}" data-field="type">${['Product', 'Process', 'Dimensional', 'Functional', 'Visual'].map(o => `<option${r.type === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
      <td class="w110"><input class="cell-edit mono" name="cp_${i}_spec" value="${esc(r.spec)}" data-action="cp-upd" data-idx="${i}" data-field="spec" placeholder="Spec"></td>
      <td class="w110"><input class="cell-edit" name="cp_${i}_method" value="${esc(r.method)}" data-action="cp-upd" data-idx="${i}" data-field="method" placeholder="Method"></td>
      <td class="w60"><input class="cell-edit" name="cp_${i}_freq" value="${esc(r.freq)}" data-action="cp-upd" data-idx="${i}" data-field="freq" placeholder="100%"></td>
      <td class="w70"><input class="cell-edit" name="cp_${i}_resp" value="${esc(r.resp)}" data-action="cp-upd" data-idx="${i}" data-field="resp" placeholder="Who"></td>
      <td><textarea class="cell-edit" name="cp_${i}_reaction" rows="2" data-action="cp-upd" data-idx="${i}" data-field="reaction" placeholder="Reaction plan">${esc(r.reaction)}</textarea></td>
      <td class="w50"><div style="display:flex;flex-wrap:wrap;gap:2px">${ctqs || '—'}</div></td>
      <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="cp-del" data-idx="${i}">×</button>` : ''}</td></tr>`
  }).join('')

  const syncBanner = miss.length > 0
    ? `<div style="background:var(--amber-pale);border:1px solid var(--amber-mid);border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:13px;color:var(--amber)">⚠ ${miss.length} PFMEA effect${miss.length !== 1 ? 's' : ''} not in control plan.</span><button class="btn btn-sm" style="background:var(--amber);color:white;border:none" data-action="cp-sync">Auto-populate from PFMEA</button></div>`
    : ''

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 04</div><div class="sec-title">Control Plan</div><div class="sec-desc">Linked to PFMEA and PFD. Step numbers and CTQs carry through automatically.</div></div>
  <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-cp')" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-ghost btn-sm" data-action="cp-sync">Sync from PFMEA</button><button class="btn btn-primary btn-sm" data-action="cp-add">＋ Add Row</button>` : ''}</div></div>
  ${syncBanner}
  <div class="card" style="overflow-x:auto">
  <div class="card-head"><span class="card-title">Control Plan</span><span class="card-meta">${p.cp.length} characteristics</span></div>
   ${p.cp.length === 0 ? emptyState('📊', 'No entries yet', miss.length > 0 ? 'Use "Sync from PFMEA" to auto-populate' : 'Complete PFMEA first') : `<div class="sticky-table-wrap"><table class="tbl" style="min-width:1100px">${npiComponents.tableHeader([{label:'Step'},{label:'FMEA/RPN'},{label:'Characteristic'},{label:'Type'},{label:'Spec'},{label:'Method'},{label:'Freq'},{label:'Resp'},{label:'Reaction Plan'},{label:'CTQs'},{label:''}])}<tbody>${rows}</tbody></table></div>`}
  ${canEdit() ? `<button class="add-row" data-action="cp-add">＋ Add Row</button>` : ''}</div>`
}

npi.cp.syncFromPFMEA = function() { npiData.cp.syncFromPFMEA() }
npi.cp.add = function() { npiData.cp.add() }
npi.cp.upd = function(i, f, v) { npiData.cp.upd(i, f, v) }
npi.cp.del = function(i) { npiData.cp.del(i) }

export const npiCp = npi.cp
export const renderCp = npi.cp.render
export const syncCpFromPfmea = npi.cp.syncFromPFMEA
export const addCp = npi.cp.add
export const updateCp = npi.cp.upd
export const deleteCp = npi.cp.del
