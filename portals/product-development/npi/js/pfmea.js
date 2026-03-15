/* ============================================================
   pfmea.js — PFMEA render, mutations, and RPN logic
   Depends on: state.js (prog), db.js (save), navigation.js (render), helpers.js (esc)
   npi-constants.js (RPN_HIGH, RPN_CRITICAL), npi.js
   renderRpnBurndown() is defined in rpn-chart.js (loaded before this file)
   ============================================================ */

// ══════════════════════════════════════
// PFMEA — grouped by PFD step, multi-row per step
// ══════════════════════════════════════
npi.pfmea.getRpnFilter = function() {
  const cur = (globalThis.pfmeaRpnFilter || 'all').toString()
  return ['all', 'high', 'r1_49', 'r50_99', 'r100_199', 'r200_plus'].includes(cur) ? cur : 'all'
}

npi.pfmea.setRpnFilter = function(nextFilter) {
  const safe = (nextFilter || 'all').toString()
  globalThis.pfmeaRpnFilter = ['all', 'high', 'r1_49', 'r50_99', 'r100_199', 'r200_plus'].includes(safe) ? safe : 'all'
  render()
}

npi.pfmea.rpnInFilter = function(rpn, filter) {
  const v = Number(rpn) || 0
  if (filter === 'high') return v >= RPN_HIGH
  if (filter === 'r1_49') return v >= 1 && v <= 49
  if (filter === 'r50_99') return v >= 50 && v <= 99
  if (filter === 'r100_199') return v >= 100 && v <= 199
  if (filter === 'r200_plus') return v >= 200
  return true
}

npi.pfmea.modeMatchesFilter = function(mode, filter) {
  if (filter === 'all') return true
  return npi.pfmea.rpnInFilter(npi.pfmea.calcRPN(mode), filter)
}

npi.pfmea.renderPFMEA = function() {
  const p = prog()
  const sorted = npi.data.sortedPfd(p.pfd).filter(s => s.type !== 'group')
  if (sorted.length === 0) return emptyState('⚠️', 'No process steps', 'Add steps in Process Flow first.')

  // NOTE: PFMEA structure migration has been moved to migrateprog() in db.js
  // and now runs once per load rather than on every render.

  const highRPN = p.pfmea.reduce((n, m) => n + (m.effects || []).reduce((en, ef) => en + (ef.causes || []).filter(ca => (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) >= RPN_HIGH).length, 0), 0)
  const activeFilter = npi.pfmea.getRpnFilter()

  const byStep = {}; sorted.forEach(s => { byStep[s.id] = [] }); byStep['__none'] = []
  p.pfmea.forEach(r => { const key = (r.pfdId && byStep[r.pfdId] !== undefined) ? r.pfdId : '__none'; byStep[key].push(r) })

  const visibleSteps = sorted.reduce((acc, step) => {
    const stepModes = byStep[step.id] || []
    const filteredModes = stepModes.filter(mode => npi.pfmea.modeMatchesFilter(mode, activeFilter))
    if (activeFilter === 'all' || filteredModes.length > 0) acc.push({ step, modes: activeFilter === 'all' ? stepModes : filteredModes })
    return acc
  }, [])

  const totalModeCount = p.pfmea.length
  const visibleModeCount = visibleSteps.reduce((sum, block) => sum + block.modes.length, 0)

  let html = `<div class="pfmea-wrap" style="-webkit-overflow-scrolling:touch"><table class="tbl tbl--compact pfmea-tbl" style="table-layout:fixed;min-width:1808px;width:100%">
  <colgroup>
    <col style="width:180px"><!-- failure mode -->
    <col style="width:180px"><!-- effect -->
    <col style="width:44px"> <!-- SEV -->
    <col style="width:180px"><!-- cause -->
    <col style="width:44px"> <!-- OCC -->
    <col style="width:180px"><!-- prevent -->
    <col style="width:180px"><!-- detect -->
    <col style="width:44px"> <!-- DET -->
    <col style="width:60px"> <!-- RPN -->
    <col style="width:150px"><!-- recommended action -->
    <col style="width:150px"><!-- action taken -->
    <col style="width:80px"> <!-- owner -->
    <col style="width:100px"><!-- due -->
    <col style="width:44px"> <!-- new OCC -->
    <col style="width:44px"> <!-- new DET -->
    <col style="width:60px"> <!-- forecast -->
    <col style="width:60px"> <!-- implement -->
    <col style="width:28px"> <!-- del -->
  </colgroup>
  <thead>
    <tr>
      <th rowspan="2">Failure Mode</th>
      <th rowspan="2">Effect</th>
      <th rowspan="2" title="Severity of effect">SEV</th>
      <th rowspan="2">Cause</th>
      <th rowspan="2" title="Occurrence of cause">OCC</th>
      <th rowspan="2">Controls — Prevent</th>
      <th rowspan="2">Controls — Detect</th>
      <th rowspan="2" title="Detection rating">DET</th>
      <th rowspan="2">RPN</th>
      <th colspan="8" style="background:#dbeafe;color:#1e40af;letter-spacing:.5px">RECOMMENDED ACTION &amp; RESCORING</th>
      <th rowspan="2"></th>
    </tr>
    <tr>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Recommended<br>Action</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Action<br>Taken</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Owner</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Due</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">New<br>OCC</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">New<br>DET</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Forecast<br>RPN</th>
      <th style="background:#dbeafe;color:#1e40af;white-space:normal;line-height:1.3;padding:3px 4px">Implement</th>
    </tr>
  </thead>
  <tbody>`

  visibleSteps.forEach(block => {
    const s = block.step
    const modes = block.modes || []
    const ctqBadges = (s.ctqIds || []).map(cid => {
      const ci = p.ctq.findIndex(c => c.id === cid)
      return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : ''
    }).join(' ')

    html += `<tr><td colspan="18" style="padding:0;border-top:3px solid #6b7280"><div class="pfmea-step-header"><span class="pfmea-step-label">Step ${s.stepNum} — ${esc(s.op || '(unnamed)')}</span><div class="pfmea-step-ctqs">${ctqBadges}</div></div></td></tr>`

    if (modes.length === 0 && activeFilter === 'all') {
      html += `<tr class="pfmea-row-sub"><td colspan="17" style="padding:8px 14px;color:var(--muted);font-size:12px;font-style:italic">No failure modes yet</td><td></td></tr>`
    }

    modes.forEach(mode => {
      const mi = p.pfmea.indexOf(mode)
      const effects = mode.effects || []
      const totalCauseRows = effects.reduce((n, ef) => n + Math.max(1, (ef.causes || []).length), 0)
      const modeRowspan = Math.max(1, totalCauseRows)

      effects.forEach((ef, ei) => {
        const causes = ef.causes || []
        const efRowspan = Math.max(1, causes.length)
        const sev = ef.sev || 1

        causes.forEach((ca, ci) => {
          const occ = ca.occ || 1, det = ca.det || 1
          const rpn = sev * occ * det
          const rpnCls = rpn >= RPN_CRITICAL ? 'rpn-hi' : rpn >= RPN_HIGH ? 'rpn-md' : 'rpn-lo'
          const act = ca.action || {}
          const hist = ca.history || []
          const hasAction = !!(act.newOcc || act.newDet)
          const newOcc = act.newOcc ? +act.newOcc : occ
          const newDet = act.newDet ? +act.newDet : det
          const forecast = sev * newOcc * newDet
          const fCls = forecast >= RPN_CRITICAL ? 'rpn-hi' : forecast >= RPN_HIGH ? 'rpn-md' : 'rpn-lo'

          const histRows = hist.length > 0 ? hist.map(h => {
            const rpnDown = h.newRpn < h.rpn
            const occDown = (h.newOcc ?? h.oldOcc) < (h.oldOcc ?? h.newOcc)
            const detDown = (h.newDet ?? h.oldDet) < (h.oldDet ?? h.newDet)
            return `<div style="border-bottom:1px solid var(--line);padding:5px 0;margin-bottom:4px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:${rpnDown ? '#16a34a' : '#dc2626'}">${h.rpn}→${h.newRpn}</span>
                <span style="color:var(--muted);font-size:9px;margin-left:auto">${h.date}</span>
              </div>
              ${(h.oldOcc || h.oldDet) ? `<div style="color:var(--muted);font-size:9px;margin-top:2px">
                OCC <b>${h.oldOcc ?? '—'}</b>→<b style="color:${occDown ? '#16a34a' : '#dc2626'}">${h.newOcc ?? '—'}</b>
                &nbsp;·&nbsp;
                DET <b>${h.oldDet ?? '—'}</b>→<b style="color:${detDown ? '#16a34a' : '#dc2626'}">${h.newDet ?? '—'}</b>
              </div>` : ''}
              <div style="color:var(--mid);font-size:10px;margin-top:3px;font-style:italic">"${esc(h.desc)}"</div>
            </div>`
          }).join('') : '<span style="font-size:10px;color:var(--muted);font-style:italic">No history yet</span>'

          let rowHtml = `<tr class="pfmea-row-sub">`

          // Mode cell — first effect, first cause only
          if (ei === 0 && ci === 0) {
            rowHtml += `<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
                <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
              </div>
            </td>`
          }

          // Effect + SEV — first cause of each effect only
          if (ci === 0) {
            rowHtml += `<td rowspan="${efRowspan}" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
              <div style="margin-top:3px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
                <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
              </div>
            </td>
            <td rowspan="${efRowspan}" class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="effect-sev" data-fallback="${sev}">
            </td>`
          }

          rowHtml += `
            <td class="pfmea-cause-cell pfmea-cause-text" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="cause" placeholder="Cause of failure" style="width:100%">${esc(ca.cause)}</textarea>
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${occ}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-occ" data-fallback="${occ}">
            </td>
            <td style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="prevent" placeholder="Prevention controls" style="width:100%">${esc(ca.prevent || '')}</textarea>
            </td>
            <td style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="detect" placeholder="Detection controls" style="width:100%">${esc(ca.detect || '')}</textarea>
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${det}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-det" data-fallback="${det}">
            </td>
            <td class="pfmea-score-cell">
              ${npi.components.rpnBadge(rpn, { id: `rpn_${mi}_${ei}_${ci}` })}
              ${hist.length > 0 ? `<button class="rpn-hist-btn" data-action="pfmea-show-hist" data-cause-id="${ca.id}">⏱${hist.length}</button>` : ''}
              <div class="hist-popup" id="hist_${ca.id}" style="display:none;position:fixed;z-index:9999;background:white;border:1px solid var(--line);border-radius:8px;padding:10px 12px;width:300px;box-shadow:0 8px 32px rgba(0,0,0,.15);max-height:400px;overflow-y:auto">
                <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">RPN History</div>
                ${histRows}
              </div>
            </td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="desc" placeholder="Recommended action" style="width:100%;background:${act.desc ? '#eff6ff' : ''};">${esc(act.desc || '')}</textarea></td>
            <td style="vertical-align:top"><textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="taken" placeholder="Action taken" style="width:100%">${esc(act.taken || '')}</textarea></td>
            <td><input class="cell-edit" value="${esc(act.owner || '')}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="owner" placeholder="Owner" style="width:100%"></td>
            <td><input type="date" class="cell-edit mono" value="${esc(act.due || '')}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="due" style="width:100%;font-size:11px"></td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newOcc || ''}" placeholder="${occ}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-occ" data-allow-blank="1" data-fallback="" style="background:#eff6ff">
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newDet || ''}" placeholder="${det}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-det" data-allow-blank="1" data-fallback="" style="background:#eff6ff">
            </td>
            <td class="pfmea-score-cell">
              <span style="opacity:${hasAction ? '1' : '0'}">${npi.components.rpnBadge(hasAction ? forecast : 0, { id: `forecast_${mi}_${ei}_${ci}`, emptyLabel: '—' })}</span>
            </td>
            <td style="text-align:center;vertical-align:top;padding-top:4px">
              <button class="btn btn-sm btn-green" style="font-size:9px;padding:3px 6px;white-space:nowrap" data-action="pfmea-implement" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" title="Apply new OCC/DET and log to history">▶ Apply</button>
            </td>
            <td style="text-align:center"><button class="del-btn" data-action="pfmea-del-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}">×</button></td>
          </tr>`
          html += rowHtml
        })

        // Effect with no causes
        if (causes.length === 0) {
          let rowHtml = `<tr class="pfmea-row-sub">`
          if (ei === 0) {
            rowHtml += `<td rowspan="1" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              <div style="margin-top:4px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
                <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
              </div>
            </td>`
          }
          rowHtml += `<td style="vertical-align:top">
              <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
              <div style="margin-top:3px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
                <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
              </div>
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="-1" data-kind="effect-sev" data-fallback="${sev}">
            </td>
            <td colspan="15" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No causes yet — click ＋ Cause</td>
          </tr>`
          html += rowHtml
        }
      })

      // Mode with no effects
      if (effects.length === 0) {
        html += `<tr class="pfmea-row-sub">
          <td class="pfmea-mode-cell" style="vertical-align:top">
            <textarea class="cell-edit" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
            <div style="margin-top:4px;display:flex;gap:3px">
              <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
              <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
            </div>
          </td>
          <td colspan="17" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No effects yet — click ＋ Effect</td>
        </tr>`
      }
    })

    html += `<tr><td colspan="18" style="padding:0"><div class="pfmea-add-row" data-action="pfmea-add-mode" data-step-id="${s.id}">＋ Add failure mode for Step ${s.stepNum}</div></td></tr>`
  })

  if (visibleSteps.length === 0) {
    html += `<tr class="pfmea-row-sub"><td colspan="18" style="padding:14px;color:var(--muted);font-size:12px;font-style:italic;text-align:center">No operations match this RPN filter. <a href="#" data-action="pfmea-filter-all" style="color:var(--blue)">Show all</a></td></tr>`
  }

  html += '</tbody></table></div>'

  const filterLabel = activeFilter === 'all' ? 'All RPN' :
    activeFilter === 'high' ? `High RPN (>=${RPN_HIGH})` :
    activeFilter === 'r1_49' ? 'RPN 1-49' :
    activeFilter === 'r50_99' ? 'RPN 50-99' :
    activeFilter === 'r100_199' ? 'RPN 100-199' : 'RPN 200+'

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
  <div class="sec-desc">Failure Mode → Effect (SEV) → Cause (OCC) → Controls Prevent / Detect (DET) → RPN. Actions and rescoring per cause.</div></div>
  <div class="sec-actions pfmea-filter-wrap">
    <label class="pfmea-filter-label">RPN Filter
      <select class="pfmea-filter-select" data-action="pfmea-filter">
        <option value="all"${activeFilter === 'all' ? ' selected' : ''}>All</option>
        <option value="high"${activeFilter === 'high' ? ' selected' : ''}>High only (>=${RPN_HIGH})</option>
        <option value="r1_49"${activeFilter === 'r1_49' ? ' selected' : ''}>1-49</option>
        <option value="r50_99"${activeFilter === 'r50_99' ? ' selected' : ''}>50-99</option>
        <option value="r100_199"${activeFilter === 'r100_199' ? ' selected' : ''}>100-199</option>
        <option value="r200_plus"${activeFilter === 'r200_plus' ? ' selected' : ''}>200+</option>
      </select>
    </label>
    <span class="tag" style="align-self:center">${filterLabel}: ${visibleModeCount}/${totalModeCount} operations</span>
    ${highRPN > 0 ? `<span class="tag tag-amber" style="align-self:center">⚠ ${highRPN} high RPN ≥${RPN_HIGH}</span>` : ''}
    <button class="btn btn-ghost btn-sm" onclick="showGuide('npi-pfmea')" title="User Guide">❓ Guide</button>
  </div></div>
<div class="card" style="margin-bottom:18px;padding:0;overflow:hidden">
    <div class="card-head" style="padding:10px 14px">
      <span class="card-title">📉 RPN Burndown — Total Original vs Total Current</span>
      <span class="card-meta" style="margin-left:auto">Sum across all failure modes · green = improved</span>
    </div>
    <div style="padding:14px 16px 16px">${renderRpnBurndown(false)}</div>
</div>
<div class="card">${html}</div>
${p.pfmea.length > 0 ? `<div class="info-banner">💡 RPN = SEV × OCC × DET. ▶ Apply writes new scores and logs old RPN to history. Next: <a href="#" data-action="npi-set-apqp" data-tab="cp" style="color:var(--blue)">Control Plan →</a></div>` : ''}`
}

// ── History popup ─────────────────────────────────────────────
npi.pfmea.pfShowHist = function(evt, cid) {
  document.querySelectorAll('.hist-popup').forEach(p => { if (p.id !== 'hist_' + cid) p.style.display = 'none' })
  const el = document.getElementById('hist_' + cid)
  if (!el) return
  if (el.style.display === 'block') { el.style.display = 'none'; return }
  const btn = evt.currentTarget
  const r = btn.getBoundingClientRect()
  el.style.display = 'block'
  let top = r.bottom + 6
  let left = r.left
  if (left + 304 > window.innerWidth) left = window.innerWidth - 310
  if (top + 400 > window.innerHeight) top = r.top - Math.min(400, top + 400 - window.innerHeight + 10)
  el.style.top = top + 'px'
  el.style.left = left + 'px'
  evt.stopPropagation()
}
document.addEventListener('click', () => document.querySelectorAll('.hist-popup').forEach(p => p.style.display = 'none'))

// ── PFMEA data mutators ───────────────────────────────────────
npi.pfmea.pfAddMode = function(pfdId) { npi.data.pfmea.addMode(pfdId); render() }
npi.pfmea.pfUpdMode = function(mi, f, v) { npi.data.pfmea.updMode(mi, f, v) }
npi.pfmea.pfDelMode = function(mi) { npi.data.pfmea.delMode(mi); render() }
npi.pfmea.pfAddEffect = function(mi) { npi.data.pfmea.addEffect(mi); render() }
npi.pfmea.pfNormalizeScore = function(v, allowBlank) {
  const raw = v === undefined || v === null ? '' : String(v).trim()
  if (!raw) return allowBlank ? '' : 1
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(n)) return allowBlank ? '' : 1
  return Math.min(PFMEA_SCORE_MAX, Math.max(PFMEA_SCORE_MIN, n))
}
npi.pfmea.pfScoreInput = function(inputEl, allowBlank) {
  const safe = npi.pfmea.pfNormalizeScore(inputEl.value, allowBlank)
  inputEl.value = safe === '' ? '' : String(safe)
  return safe
}
npi.pfmea.pfScorePreview = function(inputEl, allowBlank, fallback) {
  const raw = inputEl.value === undefined || inputEl.value === null ? '' : String(inputEl.value).trim()
  if (!raw) return allowBlank ? '' : npi.pfmea.pfNormalizeScore(fallback, false)
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(n)) return allowBlank ? '' : npi.pfmea.pfNormalizeScore(fallback, false)
  return Math.min(PFMEA_SCORE_MAX, Math.max(PFMEA_SCORE_MIN, n))
}
npi.pfmea.pfUpdEffect = function(mi, ei, f, v) {
  const saveNow = arguments.length < 5 ? true : !!arguments[4]
  npi.data.pfmea.updEffect(mi, ei, f, v, saveNow)
}
npi.pfmea.pfDelEffect = function(mi, ei) { npi.data.pfmea.delEffect(mi, ei); render() }
npi.pfmea.pfAddCause = function(mi, ei) { npi.data.pfmea.addCause(mi, ei); render() }
npi.pfmea.pfUpdCause = function(mi, ei, ci, f, v) {
  const saveNow = arguments.length < 6 ? true : !!arguments[5]
  npi.data.pfmea.updCause(mi, ei, ci, f, v, saveNow)
}
npi.pfmea.pfUpdCauseAction = function(mi, ei, ci, f, v) {
  const saveNow = arguments.length < 6 ? true : !!arguments[5]
  npi.data.pfmea.updCauseAction(mi, ei, ci, f, v, saveNow)
}
npi.pfmea.pfImplementAction = function(mi, ei, ci) {
  const p = prog()
  const mode = p.pfmea[mi]; const ef = mode.effects[ei]; const ca = ef.causes[ci]
  const act = ca.action || {}
  if (!act.desc && !act.newOcc && !act.newDet) { showToast('Add an action and/or new scores before implementing.', 'warning'); return }
  const oldRpn = (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
  const newOcc = act.newOcc ? +act.newOcc : ca.occ
  const newDet = act.newDet ? +act.newDet : ca.det
  if (!confirm(`Implement action?\n\nThis will:\n• Update OCC: ${ca.occ} → ${newOcc}\n• Update DET: ${ca.det} → ${newDet}\n• New RPN: ${(ef.sev || 1) * newOcc * newDet}\n• Log old RPN (${oldRpn}) to history\n• Clear the action fields`)) return

  if (typeof npi.data?.pfmea?.implementAction === 'function') {
    const result = npi.data.pfmea.implementAction(mi, ei, ci)
    if (!result.ok) return
    render()
    return
  }

  // Legacy fallback for isolated test loads where npi-data.js is not loaded.
  const newRpn = (ef.sev || 1) * newOcc * newDet
  if (!ca.history) ca.history = []
  const histEntry = {
    rpn: oldRpn,
    newRpn,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
    desc: act.taken || act.desc || 'Action implemented',
    oldOcc: ca.occ, oldDet: ca.det,
    newOcc, newDet
  }
  ca.history.push(histEntry)
  ca.occ = newOcc
  ca.det = newDet
  ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
  if (typeof npiRelSavePFMEACause === 'function') npiRelSavePFMEACause(ef.id, ca)
  if (typeof npiRelSavePFMEAHistory === 'function') npiRelSavePFMEAHistory(ca.id, histEntry)
  else if (typeof save === 'function') save()
  render()
}
npi.pfmea.pfDelCause = function(mi, ei, ci) { npi.data.pfmea.delCause(mi, ei, ci); render() }
npi.pfmea.pfRefreshRPN = function() {}

// Returns max RPN across all effects/causes of a failure mode row
npi.pfmea.calcRPN = function(mode) {
  let max = 0
  ;(mode.effects || []).forEach(ef => {
    ;(ef.causes || []).forEach(ca => {
      const rpn = (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
      if (rpn > max) max = rpn
    })
  })
  return max
}

// ── Live DOM RPN / Forecast updates ──────────────────────────
npi.pfmea.pfRpnClass = function(rpn) { return rpn >= RPN_CRITICAL ? 'rpn-hi' : rpn >= RPN_HIGH ? 'rpn-md' : 'rpn-lo' }

npi.pfmea.rpnColor = function(rpn) {
  if (rpn <= 1)            return { bg: '#dcfce7', fg: '#166534' }
  if (rpn < 25)            return { bg: '#bbf7d0', fg: '#166534' }
  if (rpn < 50)            return { bg: '#fef9c3', fg: '#854d0e' }
  if (rpn < RPN_HIGH)      return { bg: '#fed7aa', fg: '#9a3412' }
  if (rpn < 150)           return { bg: '#fca5a5', fg: '#7f1d1d' }
  if (rpn < RPN_CRITICAL)  return { bg: '#f87171', fg: '#fff' }
  if (rpn < 300)           return { bg: '#ef4444', fg: '#fff' }
  return { bg: '#991b1b', fg: '#fff' }
}

npi.pfmea.pfLiveRPN = function(mi, ei, ci) {
  const p = prog()
  const mode = p.pfmea[mi]; if (!mode) return
  const ef = mode.effects[ei]; if (!ef) return
  const sev = ef.sev || 1
  const targets = ci === -1
    ? ef.causes.map((ca, idx) => ({ ca, idx }))
    : [{ ca: ef.causes[ci], idx: ci }]
  targets.forEach(({ ca, idx }) => {
    const rpn = sev * (ca.occ || 1) * (ca.det || 1)
    const el = document.getElementById(`rpn_${mi}_${ei}_${idx}`)
    if (el) { el.textContent = rpn; el.className = 'rpn ' + npi.pfmea.pfRpnClass(rpn) }
  })
}

npi.pfmea.pfLiveForecast = function(mi, ei, ci) {
  const p = prog()
  const ef = p.pfmea[mi].effects[ei]
  const ca = ef.causes[ci]
  const act = ca.action || {}
  const sev = ef.sev || 1
  const newOcc = act.newOcc ? +act.newOcc : (ca.occ || 1)
  const newDet = act.newDet ? +act.newDet : (ca.det || 1)
  const forecast = sev * newOcc * newDet
  const hasAction = !!(act.newOcc || act.newDet)
  const el = document.getElementById(`forecast_${mi}_${ei}_${ci}`)
  if (el) {
    el.textContent = hasAction ? forecast : '—'
    el.className = 'rpn ' + (hasAction ? npi.pfmea.pfRpnClass(forecast) : 'rpn-lo')
    el.style.opacity = hasAction ? '1' : '0'
  }
}
