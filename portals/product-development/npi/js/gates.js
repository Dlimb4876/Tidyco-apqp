// ═══════════════════════════════════
// gates.js — Gate checklist and sign-off logic
// Depends on: state.js, helpers.js, npi.js
// All functions under npi.gate.*
// ═══════════════════════════════════

npi.gate.gateAllSigned = function(gd) {
  return gd.sigs && gd.sigs.length > 0 && gd.sigs.every(s => s.signed)
}

npi.gate.resolveGateChecklistItems = function(projectId, gateNum) {
  const p = (db.projects || []).find(x => x.id === projectId)
  if (!p) return []
  const g = GATE_DEFS[gateNum]
  const gd = p.gates[gateNum] || { checks: [] }
  if (!g) return []

  const selected = getProjectGateSelection(projectId, gateNum)
  return selected.map(sourceIndex => ({
    sourceIndex,
    text: g.items[sourceIndex] || '',
    checked: !!gd.checks[sourceIndex]
  })).filter(x => x.text !== '')
}

npi.gate.countSelectedGateQuestions = function(projectId, gateNum) {
  return npi.gate.resolveGateChecklistItems(projectId, gateNum).length
}

npi.gate.countCompletedSelectedGateQuestions = function(projectId, gateNum) {
  return npi.gate.resolveGateChecklistItems(projectId, gateNum).filter(x => x.checked).length
}

npi.gate.renderGatePage = function(gateNum) {
  const p   = prog()
  const g   = GATE_DEFS[gateNum]
  const gd  = p.gates[gateNum]
  const checklistItems = npi.gate.resolveGateChecklistItems(p.id, gateNum)
  const checked = checklistItems.filter(x => x.checked).length
  const total   = checklistItems.length
  const pct     = total > 0 ? Math.round(checked / total * 100) : 0
  const allSigned  = npi.gate.gateAllSigned(gd)
  const hasActivity = checked > 0 || (gd.sigs && gd.sigs.some(s => s.signed))

  const bannerBg     = allSigned ? 'var(--green-pale)'  : hasActivity ? 'var(--amber-pale)'  : 'var(--bg)'
  const bannerBorder = allSigned ? 'var(--green-mid)'   : hasActivity ? 'var(--amber-mid)'   : 'var(--line)'
  const bannerCol    = allSigned ? 'var(--green)'       : hasActivity ? 'var(--amber)'       : 'var(--muted)'
  const bannerText   = allSigned
    ? `✓ Gate signed off by all required signatories`
    : hasActivity
      ? `⚙ In progress — ${checked}/${total} items checked · ${gd.sigs.filter(s => s.signed).length}/${gd.sigs.length} signed`
      : `⏸ Not yet started — ${total} checklist items`

  const checklist = checklistItems.map(row => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 16px;border-bottom:1px solid var(--line);${row.checked ? 'background:var(--bg-soft);' : ''}">
      <input type="checkbox" id="gc_${gateNum}_${row.sourceIndex}" ${row.checked ? 'checked' : ''} onchange="npi.gate.toggleCheck(${gateNum},${row.sourceIndex},this.checked)" style="width:15px;height:15px;accent-color:var(--blue);flex-shrink:0;margin-top:3px;cursor:pointer">
      <label for="gc_${gateNum}_${row.sourceIndex}" style="font-size:13px;color:${row.checked ? 'var(--muted)' : 'var(--ink)'};cursor:pointer;flex:1;${row.checked ? 'text-decoration:line-through;' : ''}">${esc(row.text)}</label>
    </div>`).join('')

  const sigCards = (gd.sigs || []).map((sig, si) => `
    <div style="background:var(--white);border:1px solid ${sig.signed ? 'var(--green-mid)' : 'var(--line)'};border-radius:8px;overflow:hidden;${sig.signed ? 'background:var(--green-pale);' : ''}">
      <div style="padding:10px 14px;border-bottom:1px solid ${sig.signed ? 'var(--green-mid)' : 'var(--line)'};display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:12px;font-weight:700;color:var(--ink)">${esc(sig.role)}</span>
        <span style="font-size:10px;font-weight:700;font-family:'IBM Plex Mono',monospace;padding:2px 7px;border-radius:4px;${sig.signed ? 'background:var(--green);color:white' : 'background:var(--line);color:var(--muted)'}">${sig.signed ? '✓ SIGNED' : 'PENDING'}</span>
      </div>
      <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
        <div><label style="display:block;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Name</label><input name="gate_${gateNum}_sig_${si}_name" style="width:100%;padding:6px 9px;border:1px solid var(--line);border-radius:5px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;${sig.signed ? 'background:var(--green-pale);border-color:var(--green-mid)' : ''}" value="${esc(sig.name)}" placeholder="Full name" onchange="npi.gate.updSig(${gateNum},${si},'name',this.value)"></div>
        <div><label style="display:block;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Date</label><input type="date" name="gate_${gateNum}_sig_${si}_date" style="width:100%;padding:6px 9px;border:1px solid var(--line);border-radius:5px;font-size:13px;font-family:'IBM Plex Sans',sans-serif;outline:none;${sig.signed ? 'background:var(--green-pale);border-color:var(--green-mid)' : ''}" value="${sig.date || ''}" onchange="npi.gate.updSig(${gateNum},${si},'date',this.value)"></div>
        ${!sig.signed
          ? `<button style="width:100%;padding:8px;border:none;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;${sig.name ? 'background:var(--blue);color:white' : 'background:var(--line);color:var(--muted);cursor:not-allowed'}" onclick="${sig.name ? `npi.gate.signOff(${gateNum},${si})` : 'npi.nav.alertEnterNameFirst()'}">${sig.name ? 'Sign Off' : 'Enter name to sign'}</button>`
          : `<button style="width:100%;padding:8px;border:none;border-radius:5px;font-size:13px;font-weight:600;background:var(--green);color:white;cursor:default;font-family:'IBM Plex Sans',sans-serif">✓ Signed</button>
             <button onclick="npi.gate.unsign(${gateNum},${si})" style="font-size:11px;color:var(--muted);text-decoration:underline;cursor:pointer;background:none;border:none;font-family:'IBM Plex Sans',sans-serif;padding:0;margin-top:2px">Undo sign-off</button>`}
      </div>
    </div>`).join('')

  const prevGate = gateNum > 0 ? gateNum - 1 : null
  const nextGate = gateNum < 5 ? gateNum + 1 : null

  return `
  <div style="padding:24px 28px 18px;background:var(--white);border-bottom:1px solid var(--line)">
    <div style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;font-family:'IBM Plex Mono',monospace;margin-bottom:10px;background:${allSigned ? 'var(--green-pale)' : hasActivity ? 'var(--amber-pale)' : 'var(--bg)'};color:${allSigned ? 'var(--green)' : hasActivity ? 'var(--amber)' : 'var(--muted)'};border:1px solid ${allSigned ? 'var(--green-mid)' : hasActivity ? 'var(--amber-mid)' : 'var(--line)'}">${g.phase}</div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:22px;font-weight:700;color:var(--ink)">Gate ${g.num} — ${g.name}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px">Required signatories: ${g.signatories.join(' · ')}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        ${prevGate !== null ? `<button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('gate_${prevGate}')">← Gate ${prevGate}</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">Dashboard</button>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-gates')" title="User Guide">❓ Guide</button>
        ${nextGate !== null ? `<button class="btn btn-ghost btn-sm" onclick="npi.nav.navigate('gate_${nextGate}')">Gate ${nextGate} →</button>` : ''}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:14px">
      <div style="flex:1;height:5px;background:var(--line);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${allSigned ? 'var(--green)' : 'var(--blue)'};border-radius:3px;transition:width .3s"></div></div>
      <span style="font-size:11px;font-family:'IBM Plex Mono',monospace;color:var(--muted);white-space:nowrap">${checked}/${total} items</span>
    </div>
  </div>
  <div style="padding:20px 28px 60px">
    <div style="padding:11px 16px;border-radius:8px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;margin-bottom:16px;background:${bannerBg};color:${bannerCol};border:1px solid ${bannerBorder}">${bannerText}</div>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start">
      <div style="background:var(--white);border:1px solid var(--line);border-radius:8px;overflow:hidden">
        <div style="padding:12px 16px;border-bottom:1px solid var(--line);background:var(--bg-soft);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:13px;font-weight:600">Checklist</span>
          <span style="font-size:12px;color:var(--muted)">${checked}/${total} complete</span>
        </div>
        <div style="height:4px;background:var(--line)"><div style="height:100%;width:${pct}%;background:var(--blue);transition:width .3s"></div></div>
        ${checklist || `<div style="padding:14px 16px;font-size:12px;color:var(--muted)">No checklist questions are selected for this gate.</div>`}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">${sigCards}</div>
    </div>
  </div>`
}

npi.gate.toggleCheck = function(gi, ii, v) { npi.data.gate.toggleCheck(gi, ii, v); render() }
npi.gate.updSig     = function(gi, si, f, v) { npi.data.gate.updSig(gi, si, f, v) }
npi.gate.signOff    = function(gi, si) { npi.data.gate.signOff(gi, si); render() }
npi.gate.unsign     = function(gi, si) { npi.data.gate.unsign(gi, si); render() }
