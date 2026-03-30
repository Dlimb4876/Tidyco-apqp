// ═══════════════════════════════════
// npi-events.js — Delegated UI event router for NPI portal
// ═══════════════════════════════════

import { preserveInputCaretAfterRender } from '../../../../utils/js/helpers.js'
import { showGuide } from '../../../../utils/js/guide.js'
import { flushDeferred } from '../../../../utils/js/render-scheduler.js'

let _npiEventsContainer = null
let _pfmeaSearchTimer = null
let _bomPickSearchTimer = null
let npiRef = null

function getNpi() {
  return npiRef
}

function npiActionTarget(evt) {
  return evt && evt.target ? evt.target.closest('[data-action]') : null
}

function npiNum(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

function onClick(evt) {
  const npi = getNpi()
  if (!npi) return
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'ctq-add': npi.ctq.add(); break
  case 'ctq-del': npi.ctq.del(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'ctq-filter-clear': evt.preventDefault(); npi.ctq.clearFilters(); break

  case 'cp-sync': npi.cp.syncFromPFMEA(); break
  case 'cp-add': npi.cp.add(); break
  case 'cp-del': npi.cp.del(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'pfd-add-main': npi.pfd.addMainStep(); break
  case 'pfd-open-insert': npi.pfd.openInsert(el.getAttribute('data-after') === '' ? null : npiNum(el.getAttribute('data-after'), null)); break
  case 'pfd-add-header-after': npi.pfd.addHeaderAfter(el.getAttribute('data-after-id')); break
  case 'pfd-confirm-insert': npi.pfd.confirmInsert(); break
  case 'pfd-del': npi.pfd.del(el.getAttribute('data-id')); break
  case 'pfd-scroll': npi.pfd.scrollTo(el.getAttribute('data-id')); break
  case 'pfd-toggle-group': npi.pfd.toggleGroup(el.getAttribute('data-key')); break
  case 'pfd-open-ctq-pick': npi.pfd.openCtqPick(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'pfd-save-ctq-pick': npi.pfd.saveCtqPick(); break
  case 'pfd-open-bom-pick': npi.pfd.openBomPick(el.getAttribute('data-id')); break
  case 'pfd-save-bom-pick': npi.pfd.saveBomPick(); break
  case 'pfd-open-resource-edit': npi.pfd.openResourceEdit(el.getAttribute('data-step-id'), el.getAttribute('data-bom-type'), el.getAttribute('data-item-id')); break
  case 'pfd-set-bom-filter': npi.pfd.setBomFilter(el.getAttribute('data-filter'), el.getAttribute('data-filter-id'), el.getAttribute('data-list-id')); break
  case 'pfd-toggle-bom-pick': npi.pfd.toggleBomPick(el.getAttribute('data-key'), el.closest('.bom-pick-item')); break
  case 'pfd-open-doc-pick': npi.pfd.openDocPick(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'pfd-save-doc-pick': npi.pfd.saveDocPick(); break
  case 'pfd-del-doc-ref': npi.pfd.delDocRef(el.getAttribute('data-step-id'), el.getAttribute('data-doc-id')); break
  case 'pfd-toggle-view': npi.pfd.toggleView(); break
  case 'pfd-toggle-layout': npi.pfd.toggleLayout(); break

  case 'pfmea-add-mode': npi.pfmea.pfAddMode(el.getAttribute('data-step-id')); break
  case 'pfmea-add-effect': npi.pfmea.pfAddEffect(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'pfmea-del-mode': npi.pfmea.pfDelMode(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'pfmea-add-cause': npi.pfmea.pfAddCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
  case 'pfmea-del-effect': npi.pfmea.pfDelEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
  case 'pfmea-del-cause': npi.pfmea.pfDelCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
  case 'pfmea-set-view': npi.pfmea.setView(el.getAttribute('data-view')); break
  case 'pfmea-set-col-view': npi.pfmea.setColumnView(el.getAttribute('data-col-view')); break
  case 'pfmea-show-hist': npi.pfmea.pfShowHist(evt, el.getAttribute('data-cause-id')); break
  case 'pfmea-show-warnings': npi.pfmea.pfShowWarnings(el.getAttribute('data-warnings')); break
  case 'pfmea-implement': npi.pfmea.pfImplementAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
  case 'pfmea-filter-all': evt.preventDefault(); npi.pfmea.setRpnFilter('all'); break
  case 'pfmea-clear-extra-filters': npi.pfmea.pfClearExtraFilters(); break

  case 'gate-sign': npi.gate.signOff(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break
  case 'gate-unsign': npi.gate.unsign(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break

  case 'tracker-add-action': npi.tracker.addAction(); break
  case 'tracker-del-action': npi.tracker.delAction(npiNum(el.getAttribute('data-idx'), -1)); break
  case 'tracker-add-risk': npi.tracker.addRisk(); break
  case 'tracker-del-risk': npi.tracker.delRisk(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'bom-set-tab': npi.bom.setBomTab(el.getAttribute('data-tab')); break
  case 'bom-register-set-view': npi.bom.setPartsRegisterView(el.getAttribute('data-view')); break
  case 'bom-add-row': npi.bom.addBomRow(el.getAttribute('data-type')); break
  case 'bom-del-row': npi.bom.delBom(el.getAttribute('data-type'), npiNum(el.getAttribute('data-idx'), -1)); break
  case 'bom-tree-toggle': npi.bom.toggleTreeNode(el.getAttribute('data-id')); break
  case 'bom-tree-add-part': npi.bom.openTreeAddPart(el.getAttribute('data-parent') || null); break
  case 'bom-tree-add-subasm': npi.bom.openTreeAddSubAsm(el.getAttribute('data-parent') || null); break
  case 'bom-tree-del-node': npi.bom.delTreeNode(el.getAttribute('data-id')); break
  case 'bom-open-abc-pick': npi.bom.openABCPick(); break
  case 'bom-abc-filter': npi.bom.setAbcFilter(el.getAttribute('data-cls')); break
  case 'bom-abc-info': npi.bom.showAbcInfo(); break
  case 'bom-import-abc': npi.bom.importABCPart(npiNum(el.getAttribute('data-idx'), -1)); break

  case 'bom-aaw-add-group': npi.bom.addAawGroup(); break
  case 'bom-aaw-del-group': npi.bom.delAawGroup(el.getAttribute('data-id')); break
  case 'bom-aaw-tree-toggle': npi.bom.toggleAawTreeNode(el.getAttribute('data-id')); break
  case 'bom-aaw-tree-add-part': npi.bom.openAawAddPart(el.getAttribute('data-group'), el.getAttribute('data-parent') || null); break
  case 'bom-aaw-tree-add-subasm': npi.bom.openAawAddSubAsm(el.getAttribute('data-group'), el.getAttribute('data-parent') || null); break
  case 'bom-aaw-tree-del-node': npi.bom.delAawTreeNode(el.getAttribute('data-id'), el.getAttribute('data-group')); break

  case 'gantt-toggle-month': npi.timing.toggleMonth(npiNum(el.getAttribute('data-mi'), -1)); break
  case 'gantt-toggle-plan': npi.timing.ganttTogglePlan(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
  case 'gantt-toggle-act': npi.timing.ganttToggleAct(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
  case 'gantt-add-row': npi.timing.ganttAddRow(el.getAttribute('data-sec')); break
  case 'gantt-del-row': npi.timing.ganttDelRow(el.getAttribute('data-id')); break
  case 'gantt-clear': npi.timing.ganttClear(); break

  case 'show-guide': {
    const key = el.getAttribute('data-guide')
    if (key) showGuide(key)
    break
  }

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

function onChange(evt) {
  const npi = getNpi()
  if (!npi) return
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'ctq-upd': npi.ctq.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.type === 'checkbox' ? el.checked : el.value); break
  case 'ctq-filter-source': npi.ctq.setSourceFilter(el.value); break
  case 'ctq-filter-oos': npi.ctq.setOosFilter(el.value); break
  case 'ctq-filter-agreed': npi.ctq.setAgreedFilter(el.value); break
  case 'ctq-filter-coverage': npi.ctq.setCoverageFilter(el.value); break
  case 'cp-upd': npi.cp.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfd-upd': npi.pfd.upd(el.getAttribute('data-id'), el.getAttribute('data-field'), el.value); break
  case 'pfd-toggle-ctq-pick': npi.pfd.toggleCtqPick(el.getAttribute('data-id'), !!el.checked); break
  case 'pfd-toggle-doc-pick': npi.pfd.toggleDocPick(el.getAttribute('data-id'), !!el.checked); break

  case 'pfmea-upd-mode': npi.pfmea.pfUpdMode(npiNum(el.getAttribute('data-mi'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-effect': npi.pfmea.pfUpdEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-cause': npi.pfmea.pfUpdCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-upd-cause-action': npi.pfmea.pfUpdCauseAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
  case 'pfmea-filter': npi.pfmea.setRpnFilter(el.value); break
  case 'pfmea-special-char': npi.pfmea.pfUpdSpecialChar(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), el.value); break
  case 'pfmea-owner-filter': npi.pfmea.pfSetExtraFilter('owner', el.value || null); break
  case 'pfmea-overdue-filter': npi.pfmea.pfSetExtraFilter('overdueOnly', el.checked); break
  case 'pfmea-sc-filter': npi.pfmea.pfSetExtraFilter('specialChar', el.value || null); break

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
  case 'bom-tree-upd-qty': npi.bom.updTreeNodeQty(el.getAttribute('data-id'), el.value); break
  case 'bom-tree-upd-desc': npi.bom.updTreeNodeDesc(el.getAttribute('data-id'), el.value); break
  case 'bom-aaw-tree-upd-qty': npi.bom.updAawTreeNodeQty(el.getAttribute('data-id'), el.getAttribute('data-group'), el.value); break
  case 'bom-aaw-tree-upd-desc': npi.bom.updAawTreeNodeDesc(el.getAttribute('data-id'), el.getAttribute('data-group'), el.value); break
  case 'bom-aaw-upd-title': npi.data.bom.updAawGroupTitle(el.getAttribute('data-id'), el.value); break
  case 'bom-aaw-upd-pn': npi.data.bom.updAawGroupPn(el.getAttribute('data-id'), el.value); break
  case 'bom-aaw-upd-tag': {
    const id = el.getAttribute('data-id')
    const tag = el.getAttribute('data-tag')
    npi.data.bom.updAawGroupTag(id, tag)
    break
  }

  case 'gantt-upd-task': npi.timing.ganttUpdTask(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-sec': npi.timing.ganttUpdSec(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-role': npi.timing.ganttUpdRole(el.getAttribute('data-id'), el.value); break
  case 'gantt-upd-notes': npi.timing.ganttUpdNotes(el.getAttribute('data-id'), el.value); break
  case 'gantt-set-start': npi.timing.ganttSetStart(el.value); break

  case 'dash-family-filter': npi.dashboard.setProjectsFamilyFilter(el.value); break

  default: break
  }
}

function onInput(evt) {
  const npi = getNpi()
  if (!npi) return
  const el = npiActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-action')

  switch (action) {
  case 'pfmea-text-search': {
    clearTimeout(_pfmeaSearchTimer)
    const searchInput = el
    const searchValue = el.value
    _pfmeaSearchTimer = setTimeout(() => {
      preserveInputCaretAfterRender(searchInput, () => {
        npi.pfmea.pfSetExtraFilter('searchText', searchValue)
      }, {
        replacementSelector: 'input[data-action="pfmea-text-search"]'
      })
    }, 300)
    break
  }

  case 'pfd-search-bom': {
    clearTimeout(_bomPickSearchTimer)
    const searchValue = el.value
    _bomPickSearchTimer = setTimeout(() => {
      npi.pfd.searchBomPick(searchValue)
    }, 200)
    break
  }

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
      npi.pfmea.pfRefreshRPN()
    } else if (kind === 'cause-occ') {
      npi.pfmea.pfUpdCause(mi, ei, ci, 'occ', v, false)
      npi.pfmea.pfLiveRPN(mi, ei, ci)
      npi.pfmea.pfRefreshRPN()
    } else if (kind === 'cause-det') {
      npi.pfmea.pfUpdCause(mi, ei, ci, 'det', v, false)
      npi.pfmea.pfLiveRPN(mi, ei, ci)
      npi.pfmea.pfRefreshRPN()
    } else if (kind === 'action-occ') {
      npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newOcc', v, false)
      npi.pfmea.pfLiveForecast(mi, ei, ci)
      npi.pfmea.pfRefreshRPN()
    } else if (kind === 'action-det') {
      npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newDet', v, false)
      npi.pfmea.pfLiveForecast(mi, ei, ci)
      npi.pfmea.pfRefreshRPN()
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

  case 'dash-search': npi.dashboard.setProjectsSearchFromInput(el); break

  default: break
  }
}

function onFocusOut(evt) {
  const nextFocus = evt.relatedTarget
  if (nextFocus && nextFocus.closest('table')) return
  flushDeferred('npi')
}

export function setupNpiEvents() {
  const container = document.getElementById('npi-content')
  if (!container) return
  if (_npiEventsContainer === container) return
  if (_npiEventsContainer) teardownNpiEvents()

  document.addEventListener('click', onClick)
  document.addEventListener('change', onChange)
  document.addEventListener('input', onInput)
  container.addEventListener('focusout', onFocusOut)
  _npiEventsContainer = container
}

export function teardownNpiEvents() {
  if (!_npiEventsContainer) return
  document.removeEventListener('click', onClick)
  document.removeEventListener('change', onChange)
  document.removeEventListener('input', onInput)
  _npiEventsContainer.removeEventListener('focusout', onFocusOut)
  _npiEventsContainer = null
}

export function initNpiEvents({ getNpi: getNpiFn } = {}) {
  npiRef = getNpiFn()
  if (!npiRef) return

  npiRef.events = npiRef.events || {}
  npiRef.events.setup = setupNpiEvents
  npiRef.events.teardown = teardownNpiEvents
  npiRef.events._onClick = onClick
  npiRef.events._onChange = onChange
  npiRef.events._onInput = onInput
  npiRef.events._onFocusOut = onFocusOut
}
