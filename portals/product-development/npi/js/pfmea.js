/* ============================================================
   pfmea.js — PFMEA render, mutations, and RPN logic
   Depends on: state.js (prog), db.js (save), navigation.js (render), helpers.js (esc)
   npi-constants.js (RPN_HIGH, RPN_CRITICAL), npi.js
   renderRpnBurndown() is defined in rpn-chart.js (loaded before this file)
   ============================================================ */

// ══════════════════════════════════════
// PFMEA — grouped by PFD step, multi-row per step
// ══════════════════════════════════════
const PFMEA_RPN_FILTERS = ['all', 'high', 'r1_49', 'r50_99', 'r100_199', 'r200_plus']
const PFMEA_VIEWS = ['worksheet', 'history']

npi.pfmea.getRpnFilter = function() {
  const cur = (globalThis.pfmeaRpnFilter || 'all').toString()
  return PFMEA_RPN_FILTERS.includes(cur) ? cur : 'all'
}

npi.pfmea.setRpnFilter = function(nextFilter) {
  const safe = (nextFilter || 'all').toString()
  globalThis.pfmeaRpnFilter = PFMEA_RPN_FILTERS.includes(safe) ? safe : 'all'
  render()
}

npi.pfmea.getView = function() {
  const cur = (globalThis.pfmeaView || 'worksheet').toString()
  return PFMEA_VIEWS.includes(cur) ? cur : 'worksheet'
}

npi.pfmea.setView = function(nextView) {
  const safe = (nextView || 'worksheet').toString()
  globalThis.pfmeaView = PFMEA_VIEWS.includes(safe) ? safe : 'worksheet'
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

npi.pfmea.parseHistoryDate = function(value) {
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : 0
}

npi.pfmea.collectHistoryEntries = function() {
  const p = prog()
  const stepById = {}
  ;(p?.pfd || []).forEach(step => { stepById[step.id] = step })

  const entries = []
  ;(p?.pfmea || []).forEach(mode => {
    const step = stepById[mode.pfdId] || null
    ;(mode.effects || []).forEach(ef => {
      ;(ef.causes || []).forEach(ca => {
        ;(ca.history || []).forEach((hist, index) => {
          const oldRpn = Number(hist.rpn) || 0
          const newRpn = Number(hist.newRpn) || ((ef.sev || 1) * (hist.newOcc ?? ca.occ ?? 1) * (hist.newDet ?? ca.det ?? 1))
          entries.push({
            causeId: ca.id,
            historyIndex: index,
            stepId: step?.id || '',
            stepNum: step?.stepNum ?? '—',
            stepName: step?.op || 'Unlinked step',
            mode: mode.mode || '',
            effect: ef.effect || '',
            cause: ca.cause || '',
            oldRpn,
            newRpn,
            oldOcc: hist.oldOcc ?? '',
            newOcc: hist.newOcc ?? '',
            oldDet: hist.oldDet ?? '',
            newDet: hist.newDet ?? '',
            desc: hist.desc || '',
            date: hist.date || '',
            currentRpn: (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
          })
        })
      })
    })
  })

  return entries.sort((a, b) => {
    const dateDelta = npi.pfmea.parseHistoryDate(b.date) - npi.pfmea.parseHistoryDate(a.date)
    if (dateDelta !== 0) return dateDelta
    return (Number(a.stepNum) || 0) - (Number(b.stepNum) || 0)
  })
}

npi.pfmea.findCauseContext = function(causeId) {
  const p = prog()
  const stepById = {}
  ;(p?.pfd || []).forEach(step => { stepById[step.id] = step })

  for (const mode of (p?.pfmea || [])) {
    for (const ef of (mode.effects || [])) {
      for (const ca of (ef.causes || [])) {
        if (ca.id !== causeId) continue
        const step = stepById[mode.pfdId] || null
        return {
          step,
          mode,
          effect: ef,
          cause: ca,
          currentRpn: (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
        }
      }
    }
  }

  return null
}

npi.pfmea.renderHistoryView = function(entries) {
  if (!entries.length) {
    return `<div class="card"><div style="padding:26px">${emptyState('🕘', 'No PFMEA history yet', 'Implement a recommended action to log PFMEA changes across all steps.')}</div></div>`
  }

  return `<div class="card">
    <div class="card-head">
      <span class="card-title">PFMEA Change History</span>
      <span class="card-meta">All logged PFMEA changes across every step, newest first</span>
    </div>
    <div class="sticky-card-scroll">
      <table class="tbl tbl--compact pfmea-history-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Failure Chain</th>
            <th>RPN Change</th>
            <th>OCC / DET</th>
            <th>Action Logged</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => {
            const rpnDown = entry.newRpn < entry.oldRpn
            const occChanged = entry.oldOcc !== '' || entry.newOcc !== ''
            const detChanged = entry.oldDet !== '' || entry.newDet !== ''
            return `<tr>
              <td>
                <div class="pfmea-history-step">Step ${esc(entry.stepNum)}</div>
                <div class="pfmea-history-step-name">${esc(entry.stepName)}</div>
              </td>
              <td>
                <div class="pfmea-history-chain">${esc(entry.mode || '—')}</div>
                <div class="pfmea-history-subchain">${esc(entry.effect || '—')}</div>
                <div class="pfmea-history-subchain">Cause: ${esc(entry.cause || '—')}</div>
              </td>
              <td>
                <div class="pfmea-history-rpn-change ${rpnDown ? 'improved' : 'raised'}">${entry.oldRpn} → ${entry.newRpn}</div>
                <div class="pfmea-history-current">Current: ${npi.components.rpnBadge(entry.currentRpn)}</div>
              </td>
              <td>
                <div class="pfmea-history-score">OCC ${entry.oldOcc === '' ? '—' : entry.oldOcc} → ${entry.newOcc === '' ? '—' : entry.newOcc}</div>
                <div class="pfmea-history-score">DET ${entry.oldDet === '' ? '—' : entry.oldDet} → ${entry.newDet === '' ? '—' : entry.newDet}</div>
              </td>
              <td>${esc(entry.desc || 'Action implemented')}</td>
              <td>${esc(entry.date || '—')}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`
}

npi.pfmea.renderHistoryModalBody = function(context) {
  const hist = [...(context.cause.history || [])].reverse()
  return `<div class="pfmea-history-modal-summary">
    <div class="pfmea-history-modal-grid">
      <div>
        <div class="pfmea-history-label">Step</div>
        <div class="pfmea-history-value">Step ${esc(context.step?.stepNum ?? '—')} · ${esc(context.step?.op || 'Unlinked step')}</div>
      </div>
      <div>
        <div class="pfmea-history-label">Current RPN</div>
        <div class="pfmea-history-value">${npi.components.rpnBadge(context.currentRpn)}</div>
      </div>
      <div>
        <div class="pfmea-history-label">Failure Mode</div>
        <div class="pfmea-history-value">${esc(context.mode.mode || '—')}</div>
      </div>
      <div>
        <div class="pfmea-history-label">Effect</div>
        <div class="pfmea-history-value">${esc(context.effect.effect || '—')}</div>
      </div>
      <div class="pfmea-history-modal-span">
        <div class="pfmea-history-label">Cause</div>
        <div class="pfmea-history-value">${esc(context.cause.cause || '—')}</div>
      </div>
    </div>
  </div>
  <div class="pfmea-history-modal-list">
    ${hist.length ? hist.map(item => {
      const oldRpn = Number(item.rpn) || 0
      const newRpn = Number(item.newRpn) || oldRpn
      const improved = newRpn < oldRpn
      return `<div class="pfmea-history-event">
        <div class="pfmea-history-event-head">
          <span class="pfmea-history-rpn-change ${improved ? 'improved' : 'raised'}">${oldRpn} → ${newRpn}</span>
          <span class="pfmea-history-date">${esc(item.date || '—')}</span>
        </div>
        <div class="pfmea-history-event-scores">OCC ${item.oldOcc ?? '—'} → ${item.newOcc ?? '—'} · DET ${item.oldDet ?? '—'} → ${item.newDet ?? '—'}</div>
        <div class="pfmea-history-event-desc">${esc(item.desc || 'Action implemented')}</div>
      </div>`
    }).join('') : `<div style="padding:8px 0">${emptyState('🕘', 'No history yet', 'This cause has not logged any PFMEA changes yet.')}</div>`}
  </div>`
}

npi.pfmea.renderPFMEA = function() {
  const p = prog()
  const sorted = npi.data.sortedPfd(p.pfd).filter(s => npi.data.pfdType.isExecutable(s.type))
  if (sorted.length === 0) return emptyState('⚠️', 'No process steps', 'Add steps in Process Flow first.')

  // NOTE: PFMEA structure migration has been moved to migrateprog() in db.js
  // and now runs once per load rather than on every render.

  const highRPN = p.pfmea.reduce((n, m) => n + (m.effects || []).reduce((en, ef) => en + (ef.causes || []).filter(ca => (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1) >= RPN_HIGH).length, 0), 0)
  const activeFilter = npi.pfmea.getRpnFilter()
  const activeView = npi.pfmea.getView()
  const historyEntries = npi.pfmea.collectHistoryEntries()

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
      <th colspan="8" style="background:var(--blue-pale);color:var(--blue);letter-spacing:.5px">RECOMMENDED ACTION &amp; RESCORING</th>
      <th rowspan="2"></th>
    </tr>
    <tr>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Recommended<br>Action</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Action<br>Taken</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Owner</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Due</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">New<br>OCC</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">New<br>DET</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Forecast<br>RPN</th>
      <th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Implement</th>
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

    html += `<tr><td colspan="18" style="padding:0;border-top:3px solid var(--gray-500)"><div class="pfmea-step-header"><span class="pfmea-step-label">Step ${s.stepNum} — ${esc(s.op || '(unnamed)')}</span><div class="pfmea-step-ctqs">${ctqBadges}</div></div></td></tr>`

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
                <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:${rpnDown ? 'var(--green)' : 'var(--red)'}">${h.rpn}→${h.newRpn}</span>
                <span style="color:var(--muted);font-size:9px;margin-left:auto">${h.date}</span>
              </div>
              ${(h.oldOcc || h.oldDet) ? `<div style="color:var(--muted);font-size:9px;margin-top:2px">
                OCC <b>${h.oldOcc ?? '—'}</b>→<b style="color:${occDown ? 'var(--green)' : 'var(--red)'}">${h.newOcc ?? '—'}</b>
                &nbsp;·&nbsp;
                DET <b>${h.oldDet ?? '—'}</b>→<b style="color:${detDown ? 'var(--green)' : 'var(--red)'}">${h.newDet ?? '—'}</b>
              </div>` : ''}
              <div style="color:var(--mid);font-size:10px;margin-top:3px;font-style:italic">"${esc(h.desc)}"</div>
            </div>`
          }).join('') : '<span style="font-size:10px;color:var(--muted);font-style:italic">No history yet</span>'

          let rowHtml = `<tr class="pfmea-row-sub" data-cause-id="${esc(ca.id || '')}">`

          // Mode cell — first effect, first cause only
          if (ei === 0 && ci === 0) {
            rowHtml += `<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
                <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
              </div>` : ''}
            </td>`
          }

          // Effect + SEV — first cause of each effect only
          if (ci === 0) {
            rowHtml += `<td rowspan="${efRowspan}" style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_effect_${mi}_${ei}" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
              ${canEdit() ? `<div style="margin-top:3px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
                <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
              </div>` : ''}
            </td>
            <td rowspan="${efRowspan}" class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_sev_${mi}_${ei}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="effect-sev" data-fallback="${sev}">
            </td>`
          }

          rowHtml += `
            <td class="pfmea-cause-cell pfmea-cause-text" style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_cause_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="cause" placeholder="Cause of failure" style="width:100%">${esc(ca.cause)}</textarea>
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_occ_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${occ}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-occ" data-fallback="${occ}">
            </td>
            <td style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_prevent_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="prevent" placeholder="Prevention controls" style="width:100%">${esc(ca.prevent || '')}</textarea>
            </td>
            <td style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_detect_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="detect" placeholder="Detection controls" style="width:100%">${esc(ca.detect || '')}</textarea>
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_det_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${det}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-det" data-fallback="${det}">
            </td>
            <td class="pfmea-score-cell">
              ${npi.components.rpnBadge(rpn, { id: `rpn_${mi}_${ei}_${ci}` })}
              ${hist.length > 0 ? `<button class="rpn-hist-btn" data-action="pfmea-show-hist" data-cause-id="${ca.id}">⏱${hist.length}</button>` : ''}
            </td>
            <td style="vertical-align:top"><textarea class="cell-edit" name="pfmea_action_desc_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="desc" placeholder="Recommended action" style="width:100%;background:${act.desc ? 'var(--field-highlight)' : ''};">${esc(act.desc || '')}</textarea></td>
            <td style="vertical-align:top"><textarea class="cell-edit" name="pfmea_action_taken_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="taken" placeholder="Action taken" style="width:100%">${esc(act.taken || '')}</textarea></td>
            <td><select class="cell-edit" name="pfmea_action_owner_${mi}_${ei}_${ci}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="owner" style="width:100%">${ownerSelectOptions(act.owner || '')}</select></td>
            <td><input type="date" class="cell-edit mono" name="pfmea_action_due_${mi}_${ei}_${ci}" value="${esc(act.due || '')}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="due" style="width:100%;font-size:11px"></td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_action_occ_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newOcc || ''}" placeholder="${occ}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-occ" data-allow-blank="1" data-fallback="" style="background:var(--field-highlight)">
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_action_det_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newDet || ''}" placeholder="${det}"
                data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-det" data-allow-blank="1" data-fallback="" style="background:var(--field-highlight)">
            </td>
            <td class="pfmea-score-cell">
              <span id="forecast_wrap_${mi}_${ei}_${ci}" style="display:inline-block;opacity:${hasAction ? '1' : '0'}">${npi.components.rpnBadge(hasAction ? forecast : 0, { id: `forecast_${mi}_${ei}_${ci}`, emptyLabel: '—' })}</span>
            </td>
            <td style="text-align:center;vertical-align:top;padding-top:4px">
              ${canEdit() ? `<button class="btn btn-sm btn-green" style="font-size:9px;padding:3px 6px;white-space:nowrap" data-action="pfmea-implement" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" title="Apply new OCC/DET and log to history">▶ Apply</button>` : ''}
            </td>
            <td style="text-align:center">${canEdit() ? `<button class="del-btn" data-action="pfmea-del-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}">×</button>` : ''}</td>
          </tr>`
          html += rowHtml
        })

        // Effect with no causes
        if (causes.length === 0) {
          let rowHtml = `<tr class="pfmea-row-sub">`
          if (ei === 0) {
            rowHtml += `<td rowspan="1" class="pfmea-mode-cell" style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
              ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
                <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
              </div>` : ''}
            </td>`
          }
          rowHtml += `<td style="vertical-align:top">
              <textarea class="cell-edit" name="pfmea_effect_${mi}_${ei}" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
              ${canEdit() ? `<div style="margin-top:3px;display:flex;gap:3px">
                <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
                <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
              </div>` : ''}
            </td>
            <td class="pfmea-score-cell">
              <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_sev_${mi}_${ei}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
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
            <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
            ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px">
              <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
              <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
            </div>` : ''}
          </td>
          <td colspan="17" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No effects yet — click ＋ Effect</td>
        </tr>`
      }
    })

    if (canEdit()) html += `<tr><td colspan="18" style="padding:0"><div class="pfmea-add-row" data-action="pfmea-add-mode" data-step-id="${s.id}">＋ Add failure mode for Step ${s.stepNum}</div></td></tr>`
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

  const viewTabs = `<div class="pfmea-toolbar"><div class="pfmea-view-tabs">
    <button class="pfmea-view-btn ${activeView === 'worksheet' ? 'active' : ''}" data-action="pfmea-set-view" data-view="worksheet">Worksheet</button>
    <button class="pfmea-view-btn ${activeView === 'history' ? 'active' : ''}" data-action="pfmea-set-view" data-view="history">History${historyEntries.length ? ` <span class="pfmea-view-count">${historyEntries.length}</span>` : ''}</button>
  </div>${activeView === 'worksheet'
    ? `<div class="pfmea-filter-wrap">
      <label class="pfmea-filter-label">RPN Filter
        <select class="pfmea-filter-select" name="pfmea_filter" data-action="pfmea-filter">
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
    </div>`
    : `<div class="pfmea-history-summary"><span class="tag" style="align-self:center">${historyEntries.length} logged change${historyEntries.length === 1 ? '' : 's'}</span></div>`}
  </div>`

  if (activeView === 'history') {
    return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
    <div class="sec-desc">Failure history across all PFMEA steps in one place.</div></div>
    <div class="sec-actions"><button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfmea" title="User Guide">❓ Guide</button></div></div>
    ${viewTabs}
    ${npi.pfmea.renderHistoryView(historyEntries)}`
  }

  return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
  <div class="sec-desc">Failure Mode → Effect (SEV) → Cause (OCC) → Controls Prevent / Detect (DET) → RPN. Actions and rescoring per cause.</div></div>
  <div class="sec-actions">
    <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfmea" title="User Guide">❓ Guide</button>
  </div></div>
${viewTabs}
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

// ── History modal ─────────────────────────────────────────────
npi.pfmea.pfShowHist = function(evt, cid) {
  const context = npi.pfmea.findCauseContext(cid)
  if (!context) return
  const titleEl = document.getElementById('pfmeaHistoryModalTitle')
  const bodyEl = document.getElementById('pfmeaHistoryModalBody')
  if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`
  if (bodyEl) bodyEl.innerHTML = npi.pfmea.renderHistoryModalBody(context)
  if (typeof showModal === 'function') showModal('modalPfmeaHistory')
  else {
    const modal = document.getElementById('modalPfmeaHistory')
    if (modal) modal.style.display = 'flex'
  }
  if (evt?.stopPropagation) evt.stopPropagation()
}

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
npi.pfmea.pfRefreshRPN = function() {
  const card = Array.from(document.querySelectorAll('.card')).find(c => c.querySelector('.card-title')?.textContent?.includes('RPN Burndown'))
  if (!card) return
  const contentDiv = card.querySelector('div[style*="padding:14px 16px"]')
  if (!contentDiv) return
  contentDiv.innerHTML = renderRpnBurndown(false)
}

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
  const wrap = document.getElementById(`forecast_wrap_${mi}_${ei}_${ci}`)
  if (el) {
    el.textContent = hasAction ? forecast : '—'
    el.className = 'rpn ' + (hasAction ? npi.pfmea.pfRpnClass(forecast) : 'rpn-lo')
  }
  if (wrap) wrap.style.opacity = hasAction ? '1' : '0'
}
