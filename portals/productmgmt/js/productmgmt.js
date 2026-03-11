// ═══════════════════════════════════
// productmgmt.js — Product Management Portal
// Manages product families (add / edit / delete)
// Depends on: state.js (db, FAMILIES, getFamilies, save, esc), app.js (populateFamilySelects)
// ═══════════════════════════════════

function renderProductMgmt() {
  const families = getFamilies();

  const rows = families.map((f, i) => `
    <div class="pm-family-row">
      <span class="pm-family-icon">${esc(f.icon)}</span>
      <div class="pm-family-info">
        <span class="pm-family-name">${esc(f.label)}</span>
        ${f.description ? `<span class="pm-family-desc">${esc(f.description)}</span>` : ''}
      </div>
      <div class="pm-family-actions">
        <button class="btn btn-ghost btn-sm" onclick="pmEditFamily(${i})">Edit</button>
        <button class="btn btn-ghost btn-sm pm-btn-danger" onclick="pmDeleteFamily(${i})">Delete</button>
      </div>
    </div>`).join('');

  const usageMap = {};
  db.programmes.forEach(p => {
    const fid = p.family || 'Other';
    usageMap[fid] = (usageMap[fid] || 0) + 1;
  });

  const usageRows = families.map(f => `
    <div class="pm-usage-row">
      <span class="pm-family-icon">${esc(f.icon)}</span>
      <span class="pm-family-name">${esc(f.label)}</span>
      <span class="pm-usage-count">${usageMap[f.id] || 0} project${(usageMap[f.id] || 0) !== 1 ? 's' : ''}</span>
    </div>`).join('');

  return `
    <div class="productmgmt-shell">
      <div class="productmgmt-header">
        <div>
          <div class="productmgmt-title">Product Management</div>
          <div class="productmgmt-sub">Manage product families and classifications</div>
        </div>
      </div>
      <div class="productmgmt-content">

        <!-- Families List -->
        <div class="productmgmt-section">
          <div class="pm-section-head">
            <h3>Product Families</h3>
            <button class="btn btn-primary btn-sm" onclick="pmShowAddForm()">＋ Add Family</button>
          </div>

          <div id="pmAddForm" class="pm-add-form" style="display:none">
            <div class="pm-add-form-row">
              <div class="field" style="flex:0 0 72px;margin:0">
                <label>Icon</label>
                <input id="pmNewIcon" type="text" placeholder="📋" maxlength="4" class="pm-icon-input">
              </div>
              <div class="field" style="flex:1;margin:0">
                <label>Family Name</label>
                <input id="pmNewLabel" type="text" placeholder="e.g. Rotating Machines"
                       onkeydown="if(event.key==='Enter')pmSaveNew()">
              </div>
              <div class="field" style="flex:1;margin:0">
                <label>Description</label>
                <input id="pmNewDescription" type="text" placeholder="e.g. Fans & pumps"
                       onkeydown="if(event.key==='Enter')pmSaveNew()">
              </div>
              <div class="pm-add-form-btns">
                <button class="btn btn-primary" onclick="pmSaveNew()">Add</button>
                <button class="btn btn-ghost" onclick="document.getElementById('pmAddForm').style.display='none'">Cancel</button>
              </div>
            </div>
          </div>

          ${families.length === 0
            ? `<p class="pm-empty">No families defined — add one above.</p>`
            : `<div class="pm-family-list">${rows}</div>`
          }
        </div>

        <!-- Usage Summary -->
        <div class="productmgmt-section">
          <div class="pm-section-head">
            <h3>Project Counts by Family</h3>
          </div>
          ${families.length === 0
            ? `<p class="pm-empty">No families to display.</p>`
            : `<div class="pm-usage-list">${usageRows}</div>`
          }
        </div>

      </div>
    </div>
  `;
}

// ── Families tab content (used inside the Product Management portal) ──
function renderFamiliesTabContent() {
  const families = getFamilies();

  const rows = families.map((f, i) => `
    <div class="pm-family-row">
      <span class="pm-family-icon">${esc(f.icon)}</span>
      <div class="pm-family-info">
        <span class="pm-family-name">${esc(f.label)}</span>
        ${f.description ? `<span class="pm-family-desc">${esc(f.description)}</span>` : ''}
      </div>
      <div class="pm-family-actions">
        <button class="btn btn-ghost btn-sm" onclick="pmEditFamily(${i})">Edit</button>
        <button class="btn btn-ghost btn-sm pm-btn-danger" onclick="pmDeleteFamily(${i})">Delete</button>
      </div>
    </div>`).join('');

  return `
    <div id="pmAddForm" class="pm-add-form" style="display:none">
      <div class="pm-add-form-row">
        <div class="field" style="flex:0 0 72px;margin:0">
          <label>Icon</label>
          <input id="pmNewIcon" type="text" placeholder="📋" maxlength="4" class="pm-icon-input">
        </div>
        <div class="field" style="flex:1;margin:0">
          <label>Family Name</label>
          <input id="pmNewLabel" type="text" placeholder="e.g. Rotating Machines"
                 onkeydown="if(event.key==='Enter')pmSaveNew()">
        </div>
        <div class="field" style="flex:1;margin:0">
          <label>Description</label>
          <input id="pmNewDescription" type="text" placeholder="e.g. Fans & pumps"
                 onkeydown="if(event.key==='Enter')pmSaveNew()">
        </div>
        <div class="pm-add-form-btns">
          <button class="btn btn-primary" onclick="pmSaveNew()">Add</button>
          <button class="btn btn-ghost" onclick="document.getElementById('pmAddForm').style.display='none'">Cancel</button>
        </div>
      </div>
    </div>

    <div class="pm-section-head" style="margin-bottom:12px">
      <span style="font-size:13px;color:var(--muted)">${families.length} famil${families.length !== 1 ? 'ies' : 'y'} defined</span>
      <button class="btn btn-primary btn-sm" onclick="pmShowAddForm()">＋ Add Family</button>
    </div>

    ${families.length === 0
      ? `<p class="pm-empty">No families defined — add one above.</p>`
      : `<div class="pm-family-list">${rows}</div>`
    }
  `;
}

// ── Helpers ────────────────────────────────────────────────────

function pmEnsureCustomFamilies() {
  // Copy defaults into db.families so edits don't mutate the const
  if (!db.families || db.families.length === 0) {
    db.families = FAMILIES.map(f => ({ ...f }));
  }
}

// Re-render whichever surface the families UI is displayed on
function pmRefresh() {
  if (currentSection === 'productmgmt') {
    render();
  } else {
    // Inside the Product Management portal families tab
    const tab = document.getElementById('productsFamiliesTab');
    if (tab) tab.innerHTML = renderFamiliesTabContent();
    // Update the product family select if it exists
    const sel = document.getElementById('productFamily');
    if (sel) {
      const cur = sel.value;
      sel.innerHTML = '<option value="">Select a family...</option>' +
        getFamilies().map(f => `<option value="${esc(f.id)}">${esc(f.icon)} ${esc(f.label)}</option>`).join('');
      if (cur) sel.value = cur;
    }
  }
}

function pmShowAddForm() {
  document.getElementById('pmNewIcon').value  = '';
  document.getElementById('pmNewLabel').value = '';
  document.getElementById('pmNewDescription').value = '';
  document.getElementById('pmAddForm').style.display = 'block';
  document.getElementById('pmNewIcon').focus();
}

function pmSaveNew() {
  const icon  = document.getElementById('pmNewIcon').value.trim()  || '📋';
  const label = document.getElementById('pmNewLabel').value.trim();
  const description = document.getElementById('pmNewDescription').value.trim() || '';
  if (!label) { alert('Please enter a family name.'); return; }

  pmEnsureCustomFamilies();

  if (db.families.find(f => f.label.toLowerCase() === label.toLowerCase())) {
    alert('A family with this name already exists.'); return;
  }

  db.families.push({ id: label, label, icon, description });
  save();
  populateFamilySelects();
  pmRefresh();
}

function pmEditFamily(idx) {
  const f = getFamilies()[idx];
  if (!f) return;
  document.getElementById('pmEditIcon').value  = f.icon;
  document.getElementById('pmEditLabel').value = f.label;
  document.getElementById('pmEditDescription').value = f.description || '';
  document.getElementById('pmEditIdx').value   = idx;
  const modal = document.getElementById('pmEditModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
  }
  document.getElementById('pmEditLabel').focus();
}

function pmCloseEditModal() {
  closeModal('pmEditModal');
}

function pmSaveEdit() {
  const idx   = parseInt(document.getElementById('pmEditIdx').value, 10);
  const icon  = document.getElementById('pmEditIcon').value.trim()  || '📋';
  const label = document.getElementById('pmEditLabel').value.trim();
  const description = document.getElementById('pmEditDescription').value.trim() || '';
  if (!label) { alert('Please enter a family name.'); return; }

  pmEnsureCustomFamilies();

  const oldId = db.families[idx]?.id;
  const newId = label;

  if (db.families.some((f, i) => i !== idx && f.label.toLowerCase() === label.toLowerCase())) {
    alert('A family with this name already exists.'); return;
  }

  db.families[idx] = { id: newId, label, icon, description };

  // Update any projects that used the old family id
  if (oldId && oldId !== newId) {
    db.programmes.forEach(p => { if (p.family === oldId) p.family = newId; });
  }

  save();
  populateFamilySelects();
  pmCloseEditModal();
  pmRefresh();
}

function pmDeleteFamily(idx) {
  const families = getFamilies();
  const f = families[idx];
  if (!f) return;

  const used     = db.programmes.filter(p => (p.family || 'Other') === f.id).length;
  const fallback = families.find(x => x.id !== f.id)?.id || 'Other';

  let msg = `Delete family "${f.label}"?`;
  if (used > 0) {
    msg = `"${f.label}" is used by ${used} project${used !== 1 ? 's' : ''}. Those projects will be moved to "${fallback}". Continue?`;
  }
  if (!confirm(msg)) return;

  pmEnsureCustomFamilies();

  if (used > 0) db.programmes.forEach(p => { if (p.family === f.id) p.family = fallback; });

  db.families.splice(idx, 1);
  save();
  populateFamilySelects();
  pmRefresh();
}
