// ═══════════════════════════════════
// npi-gates-editor.js — Tender gate scope selection modal
// Depends on: state.js, helpers.js, db.js
// ═══════════════════════════════════

(function() {
  function getProgrammeById(id) {
    if (!id) return null;
    return (db.programmes || []).find(p => p.id === id) || null;
  }

  function resolveProgramme(productId) {
    if (productId && typeof findProgrammeByProductId === 'function') {
      const byProduct = findProgrammeByProductId(productId);
      if (byProduct) return byProduct;
    }

    if (tenderGateScopeState && tenderGateScopeState.programmeId) {
      const byState = getProgrammeById(tenderGateScopeState.programmeId);
      if (byState) return byState;
    }

    return typeof prog === 'function' ? prog() : null;
  }

  function buildSelectionsSnapshot(programmeId) {
    const out = {};
    GATE_DEFS.forEach(g => {
      out[String(g.num)] = getProjectGateSelection(programmeId, g.num);
    });
    return out;
  }

  function ensureModalRoot() {
    let modal = document.getElementById('modalTenderGateScope');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modalTenderGateScope';
    modal.className = 'modal-bg';
    modal.style.display = 'none';
    modal.innerHTML = '<div class="modal" style="max-width:920px;width:min(92vw,920px)"><div id="tenderGateScopeMount"></div></div>';

    modal.addEventListener('click', function(e) {
      if (e.target === modal) window.closeTenderGateSelectionModal();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function getWorkingGateSelection(gateNum) {
    const gateKey = String(gateNum);
    const working = tenderGateScopeState && tenderGateScopeState.workingSelections;
    if (!working || !Array.isArray(working[gateKey])) return [];
    return working[gateKey];
  }

  function selectedCountLabel(programmeId, gateNum) {
    const selected = getWorkingGateSelection(gateNum).length;
    const total = getDefaultGateSelection(gateNum).length;
    if (!programmeId) return '0 / ' + total;
    return selected + ' / ' + total;
  }

  function renderGateTabs(programmeId) {
    return GATE_DEFS.map(g => {
      const active = tenderGateScopeState.selectedGate === g.num;
      const count = selectedCountLabel(programmeId, g.num);
      return '<button class="btn ' + (active ? 'btn-primary' : 'btn-ghost') + '" style="padding:6px 10px" onclick="tenderGateScopeSelectGate(' + g.num + ')">' +
        'Gate ' + g.num + ' <span style="margin-left:6px;opacity:.85">' + count + '</span></button>';
    }).join('');
  }

  function renderCurrentGateChecklist() {
    const gateNum = tenderGateScopeState.selectedGate;
    const gateDef = GATE_DEFS.find(g => g.num === gateNum);
    if (!gateDef) return '<div class="empty">No gate selected.</div>';

    const locked = isGateSelectionLocked(tenderGateScopeState.programmeId);
    const selectedSet = new Set(getWorkingGateSelection(gateNum));

    return gateDef.items.map(function(item, idx) {
      const checked = selectedSet.has(idx) ? 'checked' : '';
      const disabled = locked ? 'disabled' : '';
      return '<label style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--white)">' +
        '<input type="checkbox" ' + checked + ' ' + disabled + ' onchange="tenderGateScopeToggleItem(' + gateNum + ',' + idx + ',this.checked)" style="margin-top:2px">' +
        '<span style="font-size:13px;line-height:1.35"><strong style="color:var(--muted)">Q' + (idx + 1) + '.</strong> ' + esc(item) + '</span>' +
      '</label>';
    }).join('');
  }

  function renderSummary() {
    const rows = GATE_DEFS.map(g => {
      const selected = getWorkingGateSelection(g.num).length;
      const total = getDefaultGateSelection(g.num).length;
      return '<tr>' +
        '<td style="padding:6px 8px;border-bottom:1px solid var(--line)">Gate ' + g.num + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid var(--line)">' + esc(g.name) + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid var(--line);text-align:right"><strong>' + selected + ' / ' + total + '</strong></td>' +
      '</tr>';
    }).join('');

    return '<table style="width:100%;border-collapse:collapse;font-size:12px;background:var(--white);border:1px solid var(--line);border-radius:8px;overflow:hidden">' +
      '<thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Gate</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)">Phase</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid var(--line)">Selected</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  }

  function renderModal() {
    const modal = ensureModalRoot();
    const mount = modal.querySelector('#tenderGateScopeMount');
    if (!mount) return;

    const programme = getProgrammeById(tenderGateScopeState.programmeId);
    if (!programme) {
      mount.innerHTML = '<div class="modal-title">Tender Gate Scope</div><div class="empty">No linked programme found.</div>' +
        '<div class="modal-actions"><button class="btn btn-ghost" onclick="closeTenderGateSelectionModal()">Close</button></div>';
      return;
    }

    const locked = isGateSelectionLocked(programme.id);
    const lockNote = locked
      ? 'Gate scope is locked for this project.'
      : 'Select which standard gate questions apply for this tender.';

    mount.innerHTML =
      '<div class="modal-title">Tender Gate Scope</div>' +
      '<div style="font-size:12px;color:var(--muted);margin:-6px 0 10px">Project: <strong style="color:var(--text)">' + esc(programme.name || 'Unnamed') + '</strong></div>' +
      '<div style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);font-size:12px;margin-bottom:10px">' + esc(lockNote) + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' + renderGateTabs(programme.id) + '</div>' +
      '<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:10px">' +
        '<div style="display:flex;flex-direction:column;gap:8px;max-height:min(56vh,520px);overflow:auto;padding-right:2px">' + renderCurrentGateChecklist() + '</div>' +
        '<div>' + renderSummary() + '</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:12px">' +
        '<button class="btn btn-ghost" onclick="closeTenderGateSelectionModal()">Close</button>' +
        '<button class="btn btn-ghost" ' + (locked ? '' : 'disabled') + ' onclick="tenderGateScopeUnlockForTesting()">Unlock (Testing)</button>' +
        '<button class="btn btn-ghost" ' + (locked ? 'disabled' : '') + ' onclick="tenderGateScopeSave()">Save</button>' +
        '<button class="btn btn-primary" ' + (locked ? 'disabled' : '') + ' onclick="tenderGateScopeConfirmAndLock()">Confirm and Lock</button>' +
      '</div>';
  }

  window.openTenderGateSelectionModal = function(productId) {
    const programme = resolveProgramme(productId);
    if (!programme) {
      alert('Could not find a linked NPI project for this product.');
      return;
    }

    tenderGateScopeState.isOpen = true;
    tenderGateScopeState.programmeId = programme.id;
    tenderGateScopeState.selectedGate = Number.isInteger(tenderGateScopeState.selectedGate)
      ? tenderGateScopeState.selectedGate
      : 0;
    tenderGateScopeState.workingSelections = buildSelectionsSnapshot(programme.id);

    renderModal();
    showModal('modalTenderGateScope');
  };

  window.closeTenderGateSelectionModal = function() {
    tenderGateScopeState.isOpen = false;
    tenderGateScopeState.workingSelections = null;
    closeModal('modalTenderGateScope');
  };

  window.tenderGateScopeSelectGate = function(gateNum) {
    tenderGateScopeState.selectedGate = Number(gateNum) || 0;
    renderModal();
  };

  window.tenderGateScopeToggleItem = function(gateNum, itemIndex, isChecked) {
    const programmeId = tenderGateScopeState.programmeId;
    if (!programmeId || isGateSelectionLocked(programmeId)) return;

    const gateKey = String(gateNum);
    if (!tenderGateScopeState.workingSelections) {
      tenderGateScopeState.workingSelections = buildSelectionsSnapshot(programmeId);
    }

    const current = Array.isArray(tenderGateScopeState.workingSelections[gateKey])
      ? tenderGateScopeState.workingSelections[gateKey].slice()
      : [];

    if (isChecked) {
      if (!current.includes(itemIndex)) current.push(itemIndex);
    } else {
      const at = current.indexOf(itemIndex);
      if (at >= 0) current.splice(at, 1);
    }

    current.sort(function(a, b) { return a - b; });
    tenderGateScopeState.workingSelections[gateKey] = current;
    renderModal();
  };

  window.tenderGateScopeSave = function() {
    const programme = getProgrammeById(tenderGateScopeState.programmeId);
    if (!programme) return;
    if (isGateSelectionLocked(programme.id)) {
      alert('Gate scope is locked and cannot be edited.');
      return;
    }

    const normalized = normalizeGateSelections(tenderGateScopeState.workingSelections);
    programme.gate_selections = normalized;
    save();
    renderModal();
  };

  window.tenderGateScopeConfirmAndLock = function() {
    const programme = getProgrammeById(tenderGateScopeState.programmeId);
    if (!programme) return;
    if (isGateSelectionLocked(programme.id)) {
      alert('Gate scope is already locked for this project.');
      return;
    }

    const normalized = normalizeGateSelections(tenderGateScopeState.workingSelections);
    programme.gate_selections = normalized;
    programme.gate_selection_locked = true;
    programme.gate_selection_locked_at = new Date().toISOString();
    programme.gate_selection_locked_by = (currentUser && currentUser.email) ? currentUser.email : null;

    save();
    renderModal();
  };

  window.tenderGateScopeUnlockForTesting = function() {
    const programme = getProgrammeById(tenderGateScopeState.programmeId);
    if (!programme) return;
    if (!isGateSelectionLocked(programme.id)) return;

    const ok = confirm('Unlock this gate scope for testing? This allows editing and re-locking.');
    if (!ok) return;

    programme.gate_selection_locked = false;
    programme.gate_selection_locked_at = null;
    programme.gate_selection_locked_by = null;

    tenderGateScopeState.workingSelections = buildSelectionsSnapshot(programme.id);
    save();
    renderModal();
  };
})();
