// ═══════════════════════════════════
// productmgmt.js — Product Management Portal
// Manages product families (add / edit / delete)
// Depends on: state.js (db, FAMILIES, getFamilies, save, esc), app.js (populateFamilySelects)
// ═══════════════════════════════════

function pmRenderFamilyRow(f, i) {
  return `
    <div class="pm-family-row" id="pm-row-${i}">
      <span class="pm-family-icon" contenteditable="false">${esc(f.icon)}</span>
      <div class="pm-family-info">
        <span class="pm-family-name" contenteditable="false">${esc(f.label)}</span>
        <span class="pm-family-desc" contenteditable="false">${esc(f.description || '')}</span>
      </div>
      <div class="pm-family-actions">
        <button class="btn btn-ghost btn-sm btn-edit" onclick="pmToggleEdit(${i}, true)">Edit</button>
        <button class="btn btn-primary btn-sm btn-save" style="display:none;" onclick="pmSaveInline(${i})">Save</button>
        <button class="btn btn-ghost btn-sm btn-cancel" style="display:none;" onclick="pmToggleEdit(${i}, false)">Cancel</button>
        <button class="btn btn-ghost btn-sm pm-btn-danger" onclick="pmDeleteFamily(${i})">Delete</button>
      </div>
    </div>`;
}

function renderProductMgmt() {
  const families = getFamilies();
  const pmFamilyListHeader = `
    <div class="pm-family-row pm-family-header">
      <span class="pm-family-icon">Icon</span>
      <div class="pm-family-info">
        <span class="pm-family-name">Family Name</span>
        <span class="pm-family-desc">Description</span>
      </div>
      <div class="pm-family-actions">Actions</div>
    </div>
  `;
  const rows = families.map(pmRenderFamilyRow).join('');

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
            : `<div class="pm-family-list">${pmFamilyListHeader}${rows}</div>`
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

// ── Families tab content (used inside the productmgmt portal) ──
function pmRenderFamiliesContent() {
  const families = getFamilies();
  const pmFamilyListHeader = `
    <div class="pm-family-row pm-family-header">
      <span class="pm-family-icon">Icon</span>
      <div class="pm-family-info">
        <span class="pm-family-name">Family Name</span>
        <span class="pm-family-desc">Description</span>
      </div>
      <div class="pm-family-actions">Actions</div>
    </div>
  `;
  const rows = families.map(pmRenderFamilyRow).join('');

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
      : `<div class="pm-family-list">${pmFamilyListHeader}${rows}</div>`
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
    if (tab) tab.innerHTML = pmRenderFamiliesContent();
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
  if (!label) { showToast('Please enter a family name.', 'warning'); return; }

  pmEnsureCustomFamilies();

  if (db.families.find(f => f.label.toLowerCase() === label.toLowerCase())) {
    showToast('A family with this name already exists.', 'warning'); return;
  }

  db.families.push({ id: label, label, icon, description });
  save();
  populateFamilySelects();
  pmRefresh();
}

function pmToggleEdit(idx, isEditing) {
  const row = document.getElementById(`pm-row-${idx}`);
  if (!row) return;

  const icon = row.querySelector('.pm-family-icon');
  const name = row.querySelector('.pm-family-name');
  const desc = row.querySelector('.pm-family-desc');
  
  const editBtn = row.querySelector('.btn-edit');
  const saveBtn = row.querySelector('.btn-save');
  const cancelBtn = row.querySelector('.btn-cancel');

  if (isEditing) {
    icon.contentEditable = true;
    name.contentEditable = true;
    desc.contentEditable = true;
    row.classList.add('editing');
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    name.focus();
  } else {
    icon.contentEditable = false;
    name.contentEditable = false;
    desc.contentEditable = false;
    row.classList.remove('editing');
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    // Restore original values
    const originalFamily = getFamilies()[idx];
    icon.textContent = originalFamily.icon;
    name.textContent = originalFamily.label;
    desc.textContent = originalFamily.description || '';
  }
}

function pmSaveInline(idx) {
  const row = document.getElementById(`pm-row-${idx}`);
  if (!row) return;

  const icon  = row.querySelector('.pm-family-icon').textContent.trim() || '📋';
  const label = row.querySelector('.pm-family-name').textContent.trim();
  const description = row.querySelector('.pm-family-desc').textContent.trim() || '';

  if (!label) {
    showToast('Please enter a family name.', 'warning');
    return;
  }

  pmEnsureCustomFamilies();

  const oldId = db.families[idx]?.id;
  const newId = label;

  if (db.families.some((f, i) => i !== idx && f.label.toLowerCase() === label.toLowerCase())) {
    showToast('A family with this name already exists.', 'warning');
    return;
  }

  db.families[idx] = { id: newId, label, icon, description };

  // Update any projects that used the old family id
  if (oldId && oldId !== newId) {
    db.programmes.forEach(p => { if (p.family === oldId) p.family = newId; });
  }

  save();
  populateFamilySelects();
  pmToggleEdit(idx, false); // Exit edit mode
  pmRefresh(); // Re-render to reflect changes everywhere
}

function pmDeleteFamily(idx) {
  const families = getFamilies();
  const f = families[idx];
  if (!f) return;

  const used = db.programmes.filter(p => (p.family || 'Other') === f.id).length;
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
