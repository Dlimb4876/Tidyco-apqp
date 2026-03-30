// ═══════════════════════════════════
// modals.js — NPI portal modals
// Dynamically injects modal HTML into the document
// ═══════════════════════════════════

import { npi } from './npi-shared.js'

let npiModalsInjected = false

export function injectNPIModals() {
  if (npiModalsInjected) return
  if (!document.body) return

  const modalContainer = document.createElement('div')
  modalContainer.id = 'npi-modal-container'
  modalContainer.innerHTML = `
<!-- New Project -->
<div class="modal-bg" id="modalNewProj" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">New Project</div>
    <div class="field"><label for="np_name">Project Name *</label><input id="np_name" placeholder="e.g. Class 158 Traction Motor Overhaul"></div>
    <div class="field-row">
      <div class="field"><label for="np_customer">Customer</label><input id="np_customer"></div>
      <div class="field"><label for="np_unit">Unit / Product</label><input id="np_unit"></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="np_family">Product Family</label>
        <select id="np_family"></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label for="np_lead">ME Lead</label><input id="np_lead"></div>
      <div class="field"><label for="np_pm">Project Manager</label><input id="np_pm"></div>
    </div>
    <div class="field"><label for="np_date">Start Date</label><input type="date" id="np_date"></div>
    <div class="field-row">
      <div class="field"><label for="np_qNumber">Q Number</label><input id="np_qNumber"></div>
      <div class="field"><label for="np_partNumber">Part Number</label><input id="np_partNumber"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalNewProj')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.dashboard.createProg()">Create</button>
    </div>
  </div>
</div>

<!-- New Sub-Assembly -->
<div class="modal-bg" id="modalNewSubAsm" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">New Sub-Assembly</div>
    <div class="field"><label for="nsa_name">Sub-Assembly Name *</label><input id="nsa_name" placeholder="e.g. Gearbox Sub-Assembly"></div>
    <div class="field"><label for="nsa_unit">Unit (optional)</label><input id="nsa_unit" placeholder="e.g. Unit 158001"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalNewSubAsm')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.dashboard.saveNewSubAsm()">Create</button>
    </div>
  </div>
</div>

<!-- Edit Project -->
<div class="modal-bg" id="modalEditProj" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">Edit Project</div>
    <div id="ep_product_info" style="background:var(--bg-alt);border:1px solid var(--line);border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--muted)">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">Product (managed in Product Registry)</div>
      <div style="font-weight:600;font-size:14px;color:var(--text)" id="ep_ro_name"></div>
      <div style="margin-top:3px;display:flex;gap:12px;flex-wrap:wrap">
        <span id="ep_ro_customer"></span>
        <span id="ep_ro_unit"></span>
        <span id="ep_ro_family"></span>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label for="ep_status">Project Status</label>
        <select id="ep_status">
          <option value="Active">Active</option>
          <option value="Tender">Tender</option>
          <option value="Archive">Archive</option>
        </select>
      </div>
      <div class="field"><label for="ep_date">Start Date</label><input type="date" id="ep_date"></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="ep_lead">ME Lead</label><input id="ep_lead"></div>
      <div class="field"><label for="ep_pm">Project Manager</label><input id="ep_pm"></div>
    </div>
    <div class="field"><label for="ep_qNumber">Q Number</label><input id="ep_qNumber" placeholder="e.g. Q-1234"></div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
      <button class="btn btn-ghost" style="color:var(--red);border-color:var(--red)" onclick="npi.dashboard.deleteProject()">Delete Project</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" onclick="closeModal('modalEditProj')">Cancel</button>
        <button class="btn btn-primary" onclick="npi.dashboard.saveEditProject()">Save</button>
      </div>
    </div>
  </div>
</div>

<!-- Insert PFD Step -->
<div class="modal-bg" id="modalInsert" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">Insert Step</div>
    <div class="field">
      <label for="insertNum">Step Number</label>
      <input type="number" id="insertNum" min="1" step="1">
      <div style="font-size:11px;color:var(--muted);margin-top:3px" id="insertNumHint"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalInsert')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.apqp.confirmInsert()">Insert</button>
    </div>
  </div>
</div>

<!-- CTQ Picker -->
<div class="modal-bg" id="modalCtqPick" style="display:none">
  <div class="modal">
    <div class="modal-title">Link CTQ Requirements</div>
    <div id="ctqPickList" style="display:flex;flex-direction:column;gap:7px;max-height:340px;overflow-y:auto"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalCtqPick')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.apqp.saveCtqPick()">Save</button>
    </div>
  </div>
</div>

<!-- BoM Picker for PFD step resources -->
<div class="modal-bg" id="modalBomPick" style="display:none">
  <div class="modal modal-lg">
    <div class="modal-title" id="bomPickTitle">Link Resources</div>
    <div class="bom-filter-row" id="bomPickFilter"></div>
    <div style="padding:12px 16px;border-bottom:1px solid var(--line);background:var(--bg-soft)">
      <input type="text" id="bomPickSearch" class="cell-edit" placeholder="🔍 Search resources..." data-action="pfd-search-bom" style="width:100%">
    </div>
    <div class="bom-pick-list" id="bomPickList"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalBomPick')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.apqp.saveBomPick()">Save</button>
    </div>
  </div>
</div>

<!-- Resource Edit Modal for PFD step resources -->
<div class="modal-bg" id="modalResourceEdit" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title" id="resourceEditTitle">Edit Resource</div>
    <div id="resourceEditContent" style="display:flex;flex-direction:column;gap:16px">
      <div class="field">
        <label for="resourceEditQty">Quantity</label>
        <input type="number" id="resourceEditQty" class="cell-edit" min="1" step="1" value="1" placeholder="Amount needed">
      </div>
      <div id="resourceEditInfo" style="font-size:13px;color:var(--muted)"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-danger" onclick="npi.pfd.deleteResourceEdit()">Remove</button>
      <button class="btn btn-ghost" onclick="closeModal('modalResourceEdit')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.pfd.saveResourceEdit()">Save</button>
    </div>
  </div>
</div>

<!-- Document Picker for PFD step doc references -->
<div class="modal-bg" id="modalDocPick" style="display:none">
  <div class="modal">
    <div class="modal-title">Link Documents</div>
    <div id="docPickList" style="display:flex;flex-direction:column;gap:7px;max-height:340px;overflow-y:auto"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalDocPick')">Cancel</button>
      <button class="btn btn-primary" onclick="npi.pfd.saveDocPick()">Save</button>
    </div>
  </div>
</div>

<!-- BoM Tree — Add Sub-Assembly -->
<div class="modal-bg" id="modalBomTreeSubAsm" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">📦 Add Sub-Assembly</div>
    <form id="bomTreeSubAsmForm" onsubmit="event.preventDefault(); npi.bom.saveTreeSubAsm()">
      <div class="field">
        <label for="bomTreeSubAsmPn">Part Number *</label>
        <input id="bomTreeSubAsmPn" class="cell-edit" placeholder="e.g. SA-001" style="font-family:'IBM Plex Mono',monospace" autocomplete="off">
      </div>
      <div class="field">
        <label for="bomTreeSubAsmDesc">Description</label>
        <input id="bomTreeSubAsmDesc" class="cell-edit" placeholder="e.g. Gearbox Assembly">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal('modalBomTreeSubAsm')">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Sub-Assembly</button>
      </div>
    </form>
  </div>
</div>

<!-- Risk Matrix -->
<div class="modal-bg" id="modalRiskMatrix" style="display:none">
  <div class="modal" style="max-width:500px">
    <div class="modal-title">5×5 Risk Matrix</div>
    <p style="font-size:12px;color:var(--muted);margin:0 0 16px">Score = Likelihood × Impact. Rate each between 1 (lowest) and 5 (highest).</p>
    <table style="border-collapse:collapse;width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:12px;text-align:center">
      <!-- Top axis header: Impact -->
      <thead>
        <tr>
          <td style="width:36px"></td>
          <td style="width:28px"></td>
          <th colspan="5" style="padding:7px 6px;background:#e0eeff;border-radius:6px 6px 0 0;font-size:12px;font-weight:700;color:#1e3a5f;letter-spacing:0.04em">IMPACT →</th>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <th style="padding:6px 4px;color:var(--muted);font-weight:600;font-size:11px">1</th>
          <th style="padding:6px 4px;color:var(--muted);font-weight:600;font-size:11px">2</th>
          <th style="padding:6px 4px;color:var(--muted);font-weight:600;font-size:11px">3</th>
          <th style="padding:6px 4px;color:var(--muted);font-weight:600;font-size:11px">4</th>
          <th style="padding:6px 4px;color:var(--muted);font-weight:600;font-size:11px">5</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <!-- Left axis header: Likelihood (rowspan 5) -->
          <th rowspan="5" style="writing-mode:vertical-rl;transform:rotate(180deg);background:#e0eeff;border-radius:6px 6px 0 0;font-size:12px;font-weight:700;color:#1e3a5f;letter-spacing:0.04em;padding:8px 4px;white-space:nowrap">← LIKELIHOOD</th>
          <td style="padding:4px 6px;color:var(--muted);font-weight:600;font-size:11px;vertical-align:middle">1</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">1</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">2</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">3</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">4</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">5</td>
        </tr>
        <tr>
          <td style="padding:4px 6px;color:var(--muted);font-weight:600;font-size:11px;vertical-align:middle">2</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">2</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">4</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">6</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">8</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">10</td>
        </tr>
        <tr>
          <td style="padding:4px 6px;color:var(--muted);font-weight:600;font-size:11px;vertical-align:middle">3</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">3</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">6</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">9</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">12</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">15</td>
        </tr>
        <tr>
          <td style="padding:4px 6px;color:var(--muted);font-weight:600;font-size:11px;vertical-align:middle">4</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">4</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">8</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">12</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">16</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">20</td>
        </tr>
        <tr>
          <td style="padding:4px 6px;color:var(--muted);font-weight:600;font-size:11px;vertical-align:middle">5</td>
          <td style="padding:8px 6px;background:#d1fae5;font-weight:700;font-size:13px;color:#065f46">5</td>
          <td style="padding:8px 6px;background:#fef3c7;font-weight:700;font-size:13px;color:#92400e">10</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">15</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">20</td>
          <td style="padding:8px 6px;background:#fee2e2;font-weight:700;font-size:13px;color:#991b1b">25</td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex;gap:16px;margin-top:14px;font-size:12px;align-items:center">
      <span style="display:flex;align-items:center;gap:5px"><span style="display:inline-block;width:14px;height:14px;background:#d1fae5;border-radius:3px;border:1px solid #a7f3d0"></span><strong style="color:#065f46">Low</strong> &lt;6</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="display:inline-block;width:14px;height:14px;background:#fef3c7;border-radius:3px;border:1px solid #fcd34d"></span><strong style="color:#92400e">Medium</strong> 6–11</span>
      <span style="display:flex;align-items:center;gap:5px"><span style="display:inline-block;width:14px;height:14px;background:#fee2e2;border-radius:3px;border:1px solid #fca5a5"></span><strong style="color:#991b1b">High</strong> ≥12</span>
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn btn-ghost" onclick="closeModal('modalRiskMatrix')">Close</button>
    </div>
  </div>
</div>

<!-- PFMEA Validation Warnings Modal -->
<div class="modal-bg" id="modalPfmeaWarnings" style="display:none">
  <div class="modal">
    <div class="modal-head">
      <div class="modal-title">Validation Warnings</div>
      <button class="modal-close" onclick="closeModal('modalPfmeaWarnings')" aria-label="Close">×</button>
    </div>
    <ul id="pfmeaWarningList" class="pf-warning-list"></ul>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal('modalPfmeaWarnings')">Dismiss</button>
    </div>
  </div>
</div>

<!-- PFMEA History Modal -->
<div class="modal-bg" id="modalPfmeaHistory" style="display:none">
  <div class="modal modal-lg pfmea-history-modal">
    <div class="modal-head">
      <div class="modal-title" id="pfmeaHistoryModalTitle">PFMEA History</div>
      <button class="modal-close" onclick="closeModal('modalPfmeaHistory')" aria-label="Close PFMEA history">×</button>
    </div>
    <div id="pfmeaHistoryModalBody"></div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal('modalPfmeaHistory')">Close</button>
    </div>
  </div>
</div>
  `

  document.body.appendChild(modalContainer)
  npiModalsInjected = true
}

// Auto-inject when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectNPIModals)
} else {
  injectNPIModals()
}

if (npi) {
  npi.modals = npi.modals || {}
  npi.modals.inject = injectNPIModals
}
