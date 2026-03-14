// ═══════════════════════════════════
// npi-events.js — Delegated UI event router for NPI portal
// Depends on: npi.js and NPI feature modules
// ═══════════════════════════════════

npi.events = npi.events || {}

let _npiEventsContainer = null

function npiActionTarget(evt) {
  return evt && evt.target ? evt.target.closest('[data-action]') : null
}

function npiNum(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

npi.events.setup = function() {
  const container = document.getElementById('npi-content')
  if (!container) return
  if (_npiEventsContainer === container) return
  if (_npiEventsContainer) npi.events.teardown()

  container.addEventListener('click', npi.events._onClick)
  container.addEventListener('change', npi.events._onChange)
  container.addEventListener('input', npi.events._onInput)
  _npiEventsContainer = container
}

npi.events.teardown = function() {
  if (!_npiEventsContainer) return
  _npiEventsContainer.removeEventListener('click', npi.events._onClick)
  _npiEventsContainer.removeEventListener('change', npi.events._onChange)
  _npiEventsContainer.removeEventListener('input', npi.events._onInput)
  _npiEventsContainer = null
}

npi.events._onClick = function(evt) {
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'ctq-add': npi.ctq.add(); break
  case 'ctq-del': npi.ctq.del(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'cp-sync': npi.cp.syncFromPFMEA(); break
  case 'cp-add': npi.cp.add(); break
  case 'cp-del': npi.cp.del(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'pfd-add-main': npi.pfd.addMainStep(); break
  case 'pfd-open-insert': npi.pfd.openInsert(el.getAttribute('data-after') === '' ? null : npiNum(el.getAttribute('data-after'), null), el.getAttribute('data-type') || undefined); break
  case 'pfd-confirm-insert': npi.pfd.confirmInsert(); break
  case 'pfd-del': npi.pfd.del(el.getAttribute('data-id')); break
  case 'pfd-scroll': npi.pfd.scrollTo(el.getAttribute('data-id')); break
  case 'pfd-toggle-group': npi.pfd.toggleGroup(el.getAttribute('data-key')); break
  case 'pfd-open-ctq-pick': npi.pfd.openCtqPick(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'pfd-save-ctq-pick': npi.pfd.saveCtqPick(); break
  case 'pfd-open-bom-pick': npi.pfd.openBomPick(el.getAttribute('data-id')); break
  case 'pfd-save-bom-pick': npi.pfd.saveBomPick(); break
  case 'pfd-del-bom-ref': npi.pfd.delBomRef(el.getAttribute('data-step-id'), el.getAttribute('data-bom-type'), el.getAttribute('data-item-id')); break
  case 'pfd-set-bom-filter': npi.pfd.setBomFilter(el.getAttribute('data-filter'), el.getAttribute('data-filter-id'), el.getAttribute('data-list-id')); break
  case 'pfd-toggle-bom-pick': npi.pfd.toggleBomPick(el.getAttribute('data-key'), el.closest('.bom-pick-item')); break

  case 'pfmea-add-mode': npi.pfmea.pfAddMode(el.getAttribute('data-step-id')); break
  case 'pfmea-add-effect': npi.pfmea.pfAddEffect(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'pfmea-del-mode': npi.pfmea.pfDelMode(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'pfmea-add-cause': npi.pfmea.pfAddCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
  case 'pfmea-del-effect': npi.pfmea.pfDelEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
  case 'pfmea-del-cause': npi.pfmea.pfDelCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
  case 'pfmea-show-hist': npi.pfmea.pfShowHist(evt, el.getAttribute('data-cause-id')); break
  case 'pfmea-implement': npi.pfmea.pfImplementAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
  case 'pfmea-filter-all': evt.preventDefault(); npi.pfmea.setRpnFilter('all'); break

  case 'gate-sign': npi.gate.signOff(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break
  case 'gate-unsign': npi.gate.unsign(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break

  case 'tracker-add-action': npi.tracker.addAction(); break
  case 'tracker-del-action': npi.tracker.delAction(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'tracker-add-risk': npi.tracker.addRisk(); break
  case 'tracker-del-risk': npi.tracker.delRisk(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'bom-set-tab': npi.bom.setBomTab(el.getAttribute('data-tab')); break
  case 'bom-add-row': npi.bom.addBomRow(el.getAttribute('data-type')); break
  case 'bom-del-row': npi.bom.delBom(el.getAttribute('data-type'), npiNum(el.getAttribute('data-idx'), -1)); break
  case 'bom-add-kit': npi.bom.addKit(); break
  case 'bom-del-kit': npi.bom.delKit(npiNum(el.getAttribute('data-ki'), -1)); break
  case 'bom-open-kit-pick': npi.bom.openKitPick(npiNum(el.getAttribute('data-ki'), -1)); break
  case 'bom-save-kit-pick': npi.bom.saveKitPick(); break
  case 'bom-del-kit-item': npi.bom.delKitItem(npiNum(el.getAttribute('data-ki'), -1), npiNum(el.getAttribute('data-ri'), -1)); break
  case 'bom-open-abc-pick': npi.bom.openABCPick(); break
  case 'bom-abc-filter': npi.bom.setAbcFilter(el.getAttribute('data-cls')); break
  case 'bom-abc-info': npi.bom.showAbcInfo(); break
  case 'bom-import-abc': npi.bom.importABCPart(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'gantt-toggle-month': npi.timing.toggleMonth(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'gantt-toggle-plan': npi.timing.ganttTogglePlan(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
  case 'gantt-toggle-act': npi.timing.ganttToggleAct(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
  case 'gantt-add-row': npi.timing.ganttAddRow(el.getAttribute('data-sec')); break
  case 'gantt-del-row': npi.timing.ganttDelRow(el.getAttribute('data-id')); break
  case 'gantt-clear': npi.timing.ganttClear(); break

  case 'npi-go-home': npi.nav.goHome(); break
  case 'npi-navigate': npi.nav.navigate(el.getAttribute('data-target')); break
  case 'npi-set-apqp': evt.preventDefault(); npi.nav.setApqpTab(el.getAttribute('data-tab')); break

  case 'dash-open-project': npi.dashboard.openProjectOrRender(el.getAttribute('data-id')); break
  case 'dash-set-view': npi.dashboard.setProjectsViewMode(el.getAttribute('data-mode')); break
  case 'dash-set-status': npi.dashboard.setProjectsStatusFilter(el.getAttribute('data-status')); break
  case 'dash-clear-filters': npi.dashboard.clearProjectFilters(); break
  case 'dash-toggle-lane': npi.dashboard.toggleNpiLane(el.getAttribute('data-fam-id')); break

  default: break
  }
}

npi.events._onChange = function(evt) {
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'ctq-upd': npi.ctq.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.type === 'checkbox' ? el.checked : el.value); break
  case 'cp-upd': npi.cp.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfd-upd': npi.pfd.upd(el.getAttribute('data-id'), el.getAttribute('data-field'), el.value); break
  case 'pfd-toggle-ctq-pick': npi.pfd.toggleCtqPick(el.getAttribute('data-id'), !!el.checked); break

  case 'pfmea-upd-mode': npi.pfmea.pfUpdMode(npiNum(el.getAttribute('data-mi'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-effect': npi.pfmea.pfUpdEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-cause': npi.pfmea.pfUpdCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-cause-action': npi.pfmea.pfUpdCauseAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-filter': npi.pfmea.setRpnFilter(el.value); break

  case 'pfmea-score': {
    const mi = npiNum(el.getAttribute('data-mi'), -1)
    const ei = npiNum(el.getAttribute('data-ei'), -1)
    const ci = npiNum(el.getAttribute('data-ci'), -1)
    const kind = el.getAttribute('data-kind')
    const allowBlank = el.getAttribute('data-allow-blank') === '1'
    const v = npi.pfmea.pfScoreInput(el, allowBlank)

    if (kind === 'effect-sev') npi.pfmea.pfUpdEffect(mi, ei, 'sev', v)
    else if (kind === 'cause-occ') npi.pfmea.pfUpdCause(mi, ei, ci, 'occ', v)
    else if (kind === 'cause-det') npi.pfmea.pfUpdCause(mi, ei, ci, 'det', v)
    else if (kind === 'action-occ') npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newOcc', v)
    else if (kind === 'action-det') npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newDet', v)
    break
  }

  case 'gate-toggle': npi.gate.toggleCheck(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-ii'), -1), !!el.checked); break
  case 'gate-upd-sig': npi.gate.updSig(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1), el.getAttribute('data-field'), el.value); break

  case 'action-upd': npi.tracker.updAction(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
  case 'risk-upd': npi.tracker.updRisk(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
  case 'risk-score': {
    const i = npiNum(el.getAttribute('data-idx'), -1)
    const field = el.getAttribute('data-field')
    const v = npi.tracker.riskScoreInput(el)
    npi.tracker.updRisk(i, field, v, false)
    npi.tracker.refreshRS(i)
    break
  }

  case 'bom-upd-row': {
    const type = el.getAttribute('data-type')
    const idx = npiNum(el.getAttribute('data-idx'), -1)
    const field = el.getAttribute('data-field')
    let value = el.type === 'checkbox' ? !!el.checked : el.value
    if (el.getAttribute('data-number') === '1') value = Number(value)
    if (el.getAttribute('data-nullable') === '1') value = value || null
    npi.bom.updBom(type, idx, field, value)
    break
  }
  case 'bom-upd-kit': npi.bom.updKit(npiNum(el.getAttribute('data-ki'), -1), el.getAttribute('data-field'), el.value); break
  case 'bom-upd-kit-item': npi.bom.updKitItem(npiNum(el.getAttribute('data-ki'), -1), npiNum(el.getAttribute('data-ri'), -1), el.getAttribute('data-field'), Number(el.value)); break

  case 'gantt-upd-task': npi.timing.ganttUpdTask(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-sec': npi.timing.ganttUpdSec(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-role': npi.timing.ganttUpdRole(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-notes': npi.timing.ganttUpdNotes(el.getAttribute('data-id'), el.value); break
  case 'gantt-set-start': npi.timing.ganttSetStart(el.value); break

  case 'dash-family-filter': npi.dashboard.setProjectsFamilyFilter(el.value); break

  default: break
  }
}

npi.events._onInput = function(evt) {
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'pfmea-score': {
    const mi = npiNum(el.getAttribute('data-mi'), -1)
    const ei = npiNum(el.getAttribute('data-ei'), -1)
    const ci = npiNum(el.getAttribute('data-ci'), -1)
    const kind = el.getAttribute('data-kind')
    const allowBlank = el.getAttribute('data-allow-blank') === '1'
    const fallbackAttr = el.getAttribute('data-fallback')
    const fallback = allowBlank ? '' : npiNum(fallbackAttr, 1)
    const v = npi.pfmea.pfScorePreview(el, allowBlank, fallback)

    if (kind === 'effect-sev') {
      npi.pfmea.pfUpdEffect(mi, ei, 'sev', v, false)
      npi.pfmea.pfLiveRPN(mi, ei, -1)
    } else if (kind === 'cause-occ') {
      npi.pfmea.pfUpdCause(mi, ei, ci, 'occ', v, false)
      npi.pfmea.pfLiveRPN(mi, ei, ci)
    } else if (kind === 'cause-det') {
      npi.pfmea.pfUpdCause(mi, ei, ci, 'det', v, false)
      npi.pfmea.pfLiveRPN(mi, ei, ci)
    } else if (kind === 'action-occ') {
      npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newOcc', v, false)
      npi.pfmea.pfLiveForecast(mi, ei, ci)
    } else if (kind === 'action-det') {
      npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newDet', v, false)
      npi.pfmea.pfLiveForecast(mi, ei, ci)
    }
    break
  }

  case 'risk-score': {
    const i = npiNum(el.getAttribute('data-idx'), -1)
    const field = el.getAttribute('data-field')
    const fallback = npiNum(el.getAttribute('data-fallback'), 1)
    const v = npi.tracker.riskScorePreview(el, fallback)
    npi.tracker.updRisk(i, field, v, false)
    npi.tracker.refreshRS(i, false)
    break
  }

  case 'dash-search': npi.dashboard.setProjectsSearch(el.value); break

  default: break
  }
}
