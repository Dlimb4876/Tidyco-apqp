// ═══════════════════════════════════
// parts-modals.js — Parts Database modals
// Dynamically injects Parts Database modal HTML into the document
// ═══════════════════════════════════

let partsDatabaseModalsInjected = false

export function injectPartsDatabaseModals() {
  if (partsDatabaseModalsInjected) return
  if (!document.body) return

  const modalContainer = document.createElement('div')
  modalContainer.id = 'parts-database-modal-container'
  modalContainer.innerHTML = `
<!-- ABC Class Info -->
<div class="modal-bg" id="modalAbcInfo" style="display:none">
  <div class="modal modal-sm">
    <div class="modal-title">ABC Inventory Classification</div>
    <div style="display:flex;flex-direction:column;gap:12px;padding:4px 0 8px">
      <div class="abc-info-row">
        <span class="abc-badge abc-A">A</span>
        <div><strong>Class A — High Value / Critical</strong><br>
          <span style="font-size:12px;color:var(--muted)">Typically top ~10–20% of parts by value or criticality. Tightly controlled, closely monitored stock levels. Usually the smallest number of unique parts.</span>
        </div>
      </div>
      <div class="abc-info-row">
        <span class="abc-badge abc-B">B</span>
        <div><strong>Class B — Medium Value</strong><br>
          <span style="font-size:12px;color:var(--muted)">Middle tier ~30% of parts. Moderate control. Reviewed periodically. Larger number of unique parts than A.</span>
        </div>
      </div>
      <div class="abc-info-row">
        <span class="abc-badge abc-C">C</span>
        <div><strong>Class C — Low Value / Common</strong><br>
          <span style="font-size:12px;color:var(--muted)">Typically ~50–70% of unique part types but only ~5–10% of total value. Fasteners, consumables, standard fixings. Often bulk-stocked. These are shared across projects and tracked in the Parts Database.</span>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal('modalAbcInfo')">Got it</button>
    </div>
  </div>
</div>

<!-- ABC Parts Catalogue Picker -->
<div class="modal-bg" id="modalABCPick" style="display:none">
  <div class="modal modal-lg">
    <div class="modal-title">＋ Add from Parts Database</div>
    <p style="font-size:12px;color:var(--muted);margin:0 0 12px">
      Search the global parts catalogue, select one or more parts, then click the <strong>Add</strong> button.
    </p>
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <input type="text" id="abcPickSearchInput" class="cell-edit"
        placeholder="Search by description or PN…" style="flex:1"
        oninput="partsDatabase.setPickSearch(this.value); document.getElementById('abcPickList').innerHTML=partsDatabase.renderPickList()">
      <div style="display:flex;gap:4px">
        <button class="bom-abc-chip" onclick="partsDatabase.setPickClassFilter('all'); document.getElementById('abcPickList').innerHTML=partsDatabase.renderPickList()">All</button>
        <button class="bom-abc-chip" onclick="partsDatabase.setPickClassFilter('A'); document.getElementById('abcPickList').innerHTML=partsDatabase.renderPickList()">A</button>
        <button class="bom-abc-chip" onclick="partsDatabase.setPickClassFilter('B'); document.getElementById('abcPickList').innerHTML=partsDatabase.renderPickList()">B</button>
        <button class="bom-abc-chip" onclick="partsDatabase.setPickClassFilter('C'); document.getElementById('abcPickList').innerHTML=partsDatabase.renderPickList()">C</button>
      </div>
    </div>
    <div class="bom-pick-list" id="abcPickList">
      <div style="padding:20px;text-align:center;color:var(--muted)">Loading...</div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('modalABCPick')">Cancel</button>
      <button class="btn btn-primary" id="abcPickAddBtn" disabled onclick="partsDatabase.confirmPick()">Add Parts</button>
    </div>
  </div>
</div>

<!-- Parts Database Entry Edit/Add -->
<div class="modal-bg" id="modalABCEdit" style="display:none">
  <div class="modal">
    <div class="modal-title">📦 Parts Database Entry</div>
    <div class="field">
      <label for="abcEditForm_pn">Tidyco Part Number *</label>
      <input id="abcEditForm_pn" class="cell-edit" placeholder="e.g. FAS-001" style="font-family:'IBM Plex Mono',monospace">
    </div>
    <div class="field">
      <label for="abcEditForm_desc">Description *</label>
      <input id="abcEditForm_desc" class="cell-edit" placeholder="e.g. M6 × 20mm Bolt">
    </div>
    <div class="field">
      <label for="abcEditForm_supplierPn">Supplier PN</label>
      <input id="abcEditForm_supplierPn" class="cell-edit" placeholder="e.g. ABC-123456" style="font-family:'IBM Plex Mono',monospace">
    </div>
    <div class="field-row">
      <div class="field">
        <label for="abcEditForm_unit">Unit</label>
        <input id="abcEditForm_unit" class="cell-edit" value="ea" placeholder="ea">
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="abcEditForm_class">ABC Class *</label>
        <select id="abcEditForm_class">
          <option value="A">A — Critical</option>
          <option value="B">B — Important</option>
          <option value="C" selected>C — Standard</option>
        </select>
      </div>
      <div class="field" style="justify-content:flex-end;padding-top:22px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="abcEditForm_inSage" style="width:16px;height:16px;accent-color:var(--green)">
          Part in Sage (MRP)
        </label>
      </div>
    </div>
    <div class="field">
      <label for="abcEditForm_notes">Notes</label>
      <textarea id="abcEditForm_notes" class="cell-edit" placeholder="Optional notes about this part…" rows="3" style="resize:vertical"></textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="abcEditForm_manufacturer">Manufacturer (OEM)</label>
        <input id="abcEditForm_manufacturer" class="cell-edit" placeholder="e.g. Bossard">
      </div>
      <div class="field">
        <label for="abcEditForm_manufacturerPn">Manufacturer PN</label>
        <input id="abcEditForm_manufacturerPn" class="cell-edit" placeholder="e.g. MPN-0042" style="font-family:'IBM Plex Mono',monospace">
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="abcEditForm_datasheetUrl">Datasheet URL</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="abcEditForm_datasheetUrl" class="cell-edit" type="url" placeholder="https://…" style="flex:1">
          <button type="button" id="abcEditForm_openDatasheetBtn" class="btn btn-secondary" onclick="partsDatabase.openDatasheetLink()">Open Link</button>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button id="abcEditForm_deleteBtn" class="btn btn-danger" onclick="partsDatabase.deleteFromModal()" style="margin-right:auto;display:none">🗑 Delete Part</button>
      <button class="btn btn-ghost" onclick="partsDatabase.cancelEdit()">Cancel</button>
      <button class="btn btn-primary" onclick="partsDatabase.saveEdit()">Save</button>
    </div>
  </div>
</div>

<!-- Where Used Modal -->
<div class="modal-bg" id="modalWhereUsed" style="display:none">
  <div class="modal" style="max-width:600px">
    <div class="modal-title">📍 Where Used</div>
    <div id="whereUsedTitle" style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--line)"></div>
    <div id="whereUsedContent" style="max-height:400px;overflow-y:auto"></div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal('modalWhereUsed')">Close</button>
    </div>
  </div>
</div>
  `

  document.body.appendChild(modalContainer)
  partsDatabaseModalsInjected = true
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPartsDatabaseModals)
} else {
  injectPartsDatabaseModals()
}
