// ═══════════════════════════════════
// npi-gates-editor.js — Tender gate scope selection modal
// ═══════════════════════════════════

import {
  appState,
  db,
  prog,
  findProjectByProductId,
  GATE_DEFS,
  getProjectGateSelection,
  getDefaultGateSelection,
  normalizeGateSelections,
  isGateSelectionLocked
} from '../../../../core/js/state.js'
import { currentUser } from '../../../../core/js/supa.js'
import { save } from '../../../../core/js/db.js'
import { esc, showModal, closeModal, showToast } from '../../../../utils/js/helpers.js'
import { npi } from './npi-shared.js'

const tenderGateScopeState = appState.tenderGateScopeState

let modalListenersBound = false

function getProjectById(id) {
  if (!id) return null
  return (db.projects || []).find(p => p.id === id) || null
}

function resolveProject(productId) {
  if (productId) {
    const byProduct = findProjectByProductId(productId)
    if (byProduct) return byProduct
  }

  if (tenderGateScopeState && tenderGateScopeState.projectId) {
    const byState = getProjectById(tenderGateScopeState.projectId)
    if (byState) return byState
  }

  return prog()
}

function buildSelectionsSnapshot(projectId) {
  const out = {}
  GATE_DEFS.forEach(g => {
    out[String(g.num)] = getProjectGateSelection(projectId, g.num)
  })
  return out
}

function getWorkingGateSelection(gateNum) {
  const gateKey = String(gateNum)
  const working = tenderGateScopeState && tenderGateScopeState.workingSelections
  if (!working || !Array.isArray(working[gateKey])) return []
  return working[gateKey]
}

function selectedCountLabel(projectId, gateNum) {
  const selected = getWorkingGateSelection(gateNum).length
  const total = getDefaultGateSelection(gateNum).length
  if (!projectId) return '0 / ' + total
  return selected + ' / ' + total
}

function renderGateTabs(projectId) {
  return GATE_DEFS.map(g => {
    const active = tenderGateScopeState.selectedGate === g.num
    const count = selectedCountLabel(projectId, gateNum)
    return '<button class="btn ' + (active ? 'btn-primary' : 'btn-ghost') + '" style="padding:6px 10px" data-action="tender-gate-select" data-gate="' + g.num + '">' +
      'Gate ' + g.num + ' <span style="margin-left:6px;opacity:.85">' + count + '</span></button>'
  }).join('')
}

function renderCurrentGateChecklist() {
  const gateNum = tenderGateScopeState.selectedGate
  const gateDef = GATE_DEFS.find(g => g.num === gateNum)
  if (!gateDef) return '<div class="empty">No gate selected.</div>'

  const locked = isGateSelectionLocked(tenderGateScopeState.projectId)
  const selectedSet = new Set(getWorkingGateSelection(gateNum))

  return gateDef.items.map((item, idx) => {
    const checked = selectedSet.has(idx) ? 'checked' : ''
    const disabled = locked ? 'disabled' : ''
    return '<label style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--white)">' +
      '<input type="checkbox" name="tender_gate_' + gateNum + '_item_' + idx + '" ' + checked + ' ' + disabled + ' data-action="tender-gate-toggle" data-gate="' + gateNum + '" data-item="' + idx + '" style="margin-top:2px">' +
      '<span style="font-size:13px;line-height:1.35"><strong style="color:var(--muted)">Q' + (idx + 1) + '.</strong> ' + esc(item) + '</span>' +
    '</label>'
  }).join('')
}

function renderSummary() {
  const rows = GATE_DEFS.map(g => {
    const selected = getWorkingGateSelection(g.num).length
    const total = getDefaultGateSelection(g.num).length
    return '<tr>' +
      '<td style="padding:6px 8px;border-bottom:1px solid var(--line)">Gate ' + g.num + '</td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid var(--line)">' + esc(g.name) + '</td>' +
      '<td style="padding:6px 8px;border-bottom:1px solid var(--line);text-align:right"><strong>' + selected + ' / ' + total + '</strong></td>' +
    '</tr>'
  }).join('')

  return '<table style="width:100%;border-collapse:collapse;font-size:12px;background:var(--white);border:1px solid var(--line);border-radius:8px;overflow:hidden">' +
    '<thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Gate</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Phase</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--line)">Selected</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
  '</table>'
}

function renderModal() {
  const modal = ensureModalRoot()
  const mount = modal.querySelector('#tenderGateScopeMount')
  if (!mount) return

  const project = getProjectById(tenderGateScopeState.projectId)
  if (!project) {
    mount.innerHTML = '<div class="modal-title">Tender Gate Scope</div><div class="empty">No linked project found.</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-action="tender-gate-close">Close</button></div>'
    return
  }

  const locked = isGateSelectionLocked(project.id)
  const lockNote = locked
    ? 'Gate scope is locked for this project.'
    : 'Select which standard gate questions apply for this tender.'

  mount.innerHTML =
    '<div class="modal-title">Tender Gate Scope</div>' +
    '<div style="font-size:12px;color:var(--muted);margin:-6px 0 10px">Project: <strong style="color:var(--text)">' + esc(project.name || 'Unnamed') + '</strong></div>' +
    '<div style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);font-size:12px;margin-bottom:10px">' + esc(lockNote) + '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' + renderGateTabs(project.id) + '</div>' +
    '<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:10px">' +
      '<div style="display:flex;flex-direction:column;gap:8px;max-height:min(56vh,520px);overflow:auto;padding-right:2px">' + renderCurrentGateChecklist() + '</div>' +
      '<div>' + renderSummary() + '</div>' +
    '</div>' +
    '<div class="modal-actions" style="margin-top:12px">' +
      '<button class="btn btn-ghost" data-action="tender-gate-close">Close</button>' +
      '<button class="btn btn-ghost" ' + (locked ? '' : 'disabled') + ' data-action="tender-gate-unlock">Unlock (Testing)</button>' +
      '<button class="btn btn-ghost" ' + (locked ? 'disabled' : '') + ' data-action="tender-gate-save">Save</button>' +
      '<button class="btn btn-primary" ' + (locked ? 'disabled' : '') + ' data-action="tender-gate-confirm-lock">Confirm and Lock</button>' +
    '</div>'
}

function handleModalClick(event) {
  const actionEl = event.target.closest('[data-action]')
  if (!actionEl) return

  const action = actionEl.getAttribute('data-action')
  if (action === 'tender-gate-close') {
    closeTenderGateSelectionModal()
    return
  }
  if (action === 'tender-gate-select') {
    tenderGateScopeSelectGate(actionEl.getAttribute('data-gate'))
    return
  }
  if (action === 'tender-gate-save') {
    tenderGateScopeSave()
    return
  }
  if (action === 'tender-gate-confirm-lock') {
    tenderGateScopeConfirmAndLock()
    return
  }
  if (action === 'tender-gate-unlock') {
    tenderGateScopeUnlockForTesting()
  }
}

function handleModalChange(event) {
  const actionEl = event.target.closest('[data-action]')
  if (!actionEl) return
  const action = actionEl.getAttribute('data-action')
  if (action !== 'tender-gate-toggle') return

  tenderGateScopeToggleItem(
    actionEl.getAttribute('data-gate'),
    actionEl.getAttribute('data-item'),
    !!actionEl.checked
  )
}

function bindModalListeners(modal) {
  if (modalListenersBound) return
  modalListenersBound = true

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeTenderGateSelectionModal()
      return
    }
    handleModalClick(event)
  })
  modal.addEventListener('change', handleModalChange)
}

function ensureModalRoot() {
  let modal = document.getElementById('modalTenderGateScope')
  if (modal) {
    bindModalListeners(modal)
    return modal
  }

  modal = document.createElement('div')
  modal.id = 'modalTenderGateScope'
  modal.className = 'modal-bg'
  modal.style.display = 'none'
  modal.innerHTML = '<div class="modal" style="max-width:920px;width:min(92vw,920px)"><div id="tenderGateScopeMount"></div></div>'

  document.body.appendChild(modal)
  bindModalListeners(modal)
  return modal
}

export function openTenderGateSelectionModal(productId) {
  const project = resolveProject(productId)
  if (!project) {
    showToast('Could not find a linked NPI project for this product.', 'warning')
    return
  }

  tenderGateScopeState.isOpen = true
  tenderGateScopeState.projectId = project.id
  tenderGateScopeState.selectedGate = Number.isInteger(tenderGateScopeState.selectedGate)
    ? tenderGateScopeState.selectedGate
    : 0
  tenderGateScopeState.workingSelections = buildSelectionsSnapshot(project.id)

  renderModal()
  showModal('modalTenderGateScope')
}

export function closeTenderGateSelectionModal() {
  tenderGateScopeState.isOpen = false
  tenderGateScopeState.workingSelections = null
  closeModal('modalTenderGateScope')
}

export function tenderGateScopeSelectGate(gateNum) {
  tenderGateScopeState.selectedGate = Number(gateNum) || 0
  renderModal()
}

export function tenderGateScopeToggleItem(gateNum, itemIndex, isChecked) {
  const projectId = tenderGateScopeState.projectId
  if (!projectId || isGateSelectionLocked(projectId)) return

  const gateKey = String(gateNum)
  if (!tenderGateScopeState.workingSelections) {
    tenderGateScopeState.workingSelections = buildSelectionsSnapshot(projectId)
  }

  const current = Array.isArray(tenderGateScopeState.workingSelections[gateKey])
    ? tenderGateScopeState.workingSelections[gateKey].slice()
    : []

  const itemIdx = Number(itemIndex)
  if (isChecked) {
    if (!current.includes(itemIdx)) current.push(itemIdx)
  } else {
    const at = current.indexOf(itemIdx)
    if (at >= 0) current.splice(at, 1)
  }

  current.sort((a, b) => a - b)
  tenderGateScopeState.workingSelections[gateKey] = current
  renderModal()
}

export function tenderGateScopeSave() {
  const project = getProjectById(tenderGateScopeState.projectId)
  if (!project) return
  if (isGateSelectionLocked(project.id)) {
    showToast('Gate scope is locked and cannot be edited.', 'warning')
    return
  }

  const normalized = normalizeGateSelections(tenderGateScopeState.workingSelections)
  project.gate_selections = normalized
  save()
  renderModal()
}

export function tenderGateScopeConfirmAndLock() {
  const project = getProjectById(tenderGateScopeState.projectId)
  if (!project) return
  if (isGateSelectionLocked(project.id)) {
    showToast('Gate scope is already locked for this project.', 'warning')
    return
  }

  const normalized = normalizeGateSelections(tenderGateScopeState.workingSelections)
  project.gate_selections = normalized
  project.gate_selection_locked = true
  project.gate_selection_locked_at = new Date().toISOString()
  project.gate_selection_locked_by = (currentUser && currentUser.email) ? currentUser.email : null

  save()
  renderModal()
}

export function tenderGateScopeUnlockForTesting() {
  const project = getProjectById(tenderGateScopeState.projectId)
  if (!project) return
  if (!isGateSelectionLocked(project.id)) return

  const ok = confirm('Unlock this gate scope for testing? This allows editing and re-locking.')
  if (!ok) return

  project.gate_selection_locked = false
  project.gate_selection_locked_at = null
  project.gate_selection_locked_by = null

  tenderGateScopeState.workingSelections = buildSelectionsSnapshot(project.id)
  save()
  renderModal()
}

if (npi) {
  npi.gateEditor = npi.gateEditor || {}
  Object.assign(npi.gateEditor, {
    openTenderGateSelectionModal,
    closeTenderGateSelectionModal,
    tenderGateScopeSelectGate,
    tenderGateScopeToggleItem,
    tenderGateScopeSave,
    tenderGateScopeConfirmAndLock,
    tenderGateScopeUnlockForTesting
  })
}
