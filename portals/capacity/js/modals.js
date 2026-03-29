// ═══════════════════════════════════
// modals.js — Capacity portal modals
// Dynamically injects modal HTML into the document
// ═══════════════════════════════════

import { closeModal } from '../../../utils/js/helpers.js'

let capacityModalsInjected = false

export function injectCapacityModals() {
  if (capacityModalsInjected) return
  if (!document.body) return

  const modalContainer = document.createElement('div')
  modalContainer.id = 'capacity-modal-container'
  modalContainer.innerHTML = `
<!-- Production Capacity Formula Modal -->
<div class="modal-bg" id="modalProdCapacityFormula" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">How Capacity Is Calculated</div>
    <div style="display:grid;gap:10px;font-size:13px;color:var(--text)">
      <div>
        <strong>Formula</strong>
        <div style="margin-top:4px">Capacity = Staff x Working Days x 8 hours x Utilization Factor</div>
      </div>
      <div>
        <strong>Working Days</strong>
        <div style="margin-top:4px">Working days include Monday to Friday and exclude UK bank holidays.</div>
      </div>
      <div>
        <strong>Baseline</strong>
        <div style="margin-top:4px">The baseline is 40 hours per person per week (5 days x 8 hours), then adjusted by the utilization factor set in Capacity Settings.</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" data-cap-action="cap-prod-capacity-modal-close">Close</button>
    </div>
  </div>
</div>
  `

  document.body.appendChild(modalContainer)
  capacityModalsInjected = true
}

// Auto-inject when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCapacityModals)
} else {
  injectCapacityModals()
}

export function closeProdCapacityFormulaModal() {
  closeModal('modalProdCapacityFormula')
}
