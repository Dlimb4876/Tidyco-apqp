// Product Development Portal Hub
// Entry point for NPI and product development

function setProductDevelopmentTab(tab) {
  productDevelopmentTab = tab;
  const parts = ['s=product-development'];
  if (tab !== 'root') parts.push('pdt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function renderProductDevelopment() {
  if (productDevelopmentTab === 'npi') return renderProjects();
  if (productDevelopmentTab === 'product-management') return renderProductManagement();
  if (productDevelopmentTab === 'product-family-db') return renderProductFamilyDatabase();

  // Root hub view
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Development</div>
          <div class="proj-home-sub">New Product Introduction & Project Management</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('npi')">
          <div class="hub-card-content">
            <div class="hub-icon">📋</div>
            <div class="proj-card-name">NPI Projects</div>
            <div class="proj-card-meta">APQP Gates, PFMEA & BoM</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('product-management')">
          <div class="hub-card-content">
            <div class="hub-icon">📦</div>
            <div class="proj-card-name">Product Management</div>
            <div class="proj-card-meta">Product Catalog & Lifecycle</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('product-family-db')">
          <div class="hub-card-content">
            <div class="hub-icon">🏢</div>
            <div class="proj-card-name">Product Family Database</div>
            <div class="proj-card-meta">Family definitions & attributes</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProductFamilyDatabase() {
  const families = familiesState.families || [];

  if (familiesState.loading) {
    return `
      <div class="proj-home">
        <div class="proj-home-header">
          <div>
            <div class="proj-home-title">Product Family Database</div>
            <div class="proj-home-sub">Loading families...</div>
          </div>
          <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
        </div>
        <div style="text-align:center;padding:80px 20px;color:var(--muted)">
          <div style="font-size:24px;">⏳ Loading...</div>
        </div>
      </div>
    `;
  }

  if (families.length === 0) {
    return `
      <div class="proj-home">
        <div class="proj-home-header">
          <div>
            <div class="proj-home-title">Product Family Database</div>
            <div class="proj-home-sub">Manage product families, attributes, and configurations</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" onclick="showFamilyModal()">➕ Add Family</button>
            <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
          </div>
        </div>

        <div style="text-align:center;padding:80px 20px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">🏢</div>
          <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No Product Families</div>
          <div style="font-size:13px;margin-bottom:20px">Create your first product family to get started</div>
          <button class="btn btn-primary" onclick="showFamilyModal()">➕ Add Family</button>
        </div>
      </div>
    `;
  }

  const familyCards = families.map(fam => {
    const stats = familyTemplatesGetStats(fam.id);
    return `
      <div class="proj-card hub-card" style="position:relative">
        <div class="hub-card-content">
          <div class="hub-icon">${fam.icon || '📋'}</div>
          <div class="proj-card-name">${esc(fam.label)}</div>
          <div class="proj-card-meta">${fam.description ? esc(fam.description) : 'No description'}</div>
          ${stats.templateCount > 0 ? `<div style="margin-top:8px;font-size:11px;color:var(--blue);font-weight:600">📋 ${stats.templateCount} PFMEA template(s)</div>` : ''}
        </div>
        <div style="position:absolute;top:12px;right:12px;display:flex;gap:4px">
          <button class="btn-sm" onclick="showTemplateManager('${fam.id}')" title="Manage PFMEA Templates" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;background:transparent;border:1px solid var(--line);cursor:pointer;color:var(--blue)">📋</button>
          <button class="btn-sm" onclick="showFamilyModal('${fam.id}')" title="Edit" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;background:transparent;border:1px solid var(--line);cursor:pointer;color:var(--mid)">✎</button>
          <button class="btn-sm" onclick="if(confirm('Delete ${esc(fam.label)}?')) familiesDataDeleteFamily('${fam.id}')" title="Delete" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px;background:transparent;border:1px solid var(--line);cursor:pointer;color:var(--red)">✕</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Family Database</div>
          <div class="proj-home-sub">${families.length} product families defined</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="showFamilyModal()">➕ Add Family</button>
          <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
        </div>
      </div>

      <div class="proj-cards hub-grid">
        ${familyCards}
      </div>
    </div>
  `;
}

// Family modal state
let familyModalState = { isOpen: false, familyId: null };

function showFamilyModal(familyId = null) {
  familyModalState.isOpen = true;
  familyModalState.familyId = familyId;
  render();
}

function closeFamilyModal() {
  familyModalState.isOpen = false;
  familyModalState.familyId = null;
  render();
}

async function saveFamilyModal() {
  const nameInput = document.getElementById('family-modal-name');
  const labelInput = document.getElementById('family-modal-label');
  const iconInput = document.getElementById('family-modal-icon');
  const descInput = document.getElementById('family-modal-desc');

  const name = nameInput?.value.trim();
  const label = labelInput?.value.trim();
  const icon = iconInput?.value.trim() || '📋';
  const description = descInput?.value.trim();

  if (!name || !label) {
    alert('Name and Label are required');
    return;
  }

  if (familyModalState.familyId) {
    // Update existing
    await familiesDataUpdateFamily(familyModalState.familyId, { label, icon, description });
  } else {
    // Create new
    await familiesDataAddFamily(name, label, icon, description);
  }

  closeFamilyModal();
}

function renderFamilyModal() {
  const family = familyModalState.familyId
    ? familiesState.families.find(f => f.id === familyModalState.familyId)
    : null;

  const isEdit = !!family;

  return `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000" onclick="if(event.target === this) closeFamilyModal()">
      <div style="background:var(--white);border-radius:8px;padding:24px;width:90%;max-width:500px;box-shadow:0 10px 40px rgba(0,0,0,0.15)">
        <div style="font-size:16px;font-weight:600;color:var(--ink);margin-bottom:16px">
          ${isEdit ? 'Edit Family' : 'Add Family'}
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Name (ID)*</label>
            <input type="text" id="family-modal-name" placeholder="e.g., HVAC" value="${family?.name || ''}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px" ${isEdit ? 'disabled' : ''}>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Unique identifier (cannot be changed)</div>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Display Label*</label>
            <input type="text" id="family-modal-label" placeholder="e.g., HVAC Systems" value="${family?.label || ''}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px">
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Icon</label>
            <input type="text" id="family-modal-icon" placeholder="e.g., ❄️" value="${family?.icon || '📋'}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;max-width:100px">
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Description</label>
            <textarea id="family-modal-desc" placeholder="Brief description of this product family..." style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;font-family:inherit;resize:vertical;min-height:60px">${family?.description || ''}</textarea>
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--line);padding-top:16px">
          <button class="btn btn-ghost" onclick="closeFamilyModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveFamilyModal()">Save</button>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════
// FAMILY PFMEA TEMPLATE MANAGER
// ═══════════════════════════════════

let templateManagerState = { isOpen: false, familyId: null };

function showTemplateManager(familyId) {
  templateManagerState.isOpen = true;
  templateManagerState.familyId = familyId;
  render();
}

function closeTemplateManager() {
  templateManagerState.isOpen = false;
  templateManagerState.familyId = null;
  render();
}

function renderTemplateManager() {
  const family = familiesState.families.find(f => f.id === templateManagerState.familyId);
  if (!family) return '';

  const grouped = familyTemplatesGetGroupedByFamily(templateManagerState.familyId);
  const templateNames = Object.keys(grouped).sort();

  return `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;overflow-y:auto" onclick="if(event.target === this) closeTemplateManager()">
      <div style="background:var(--white);border-radius:8px;width:90%;max-width:900px;max-height:85vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.15);margin:20px 0">
        <!-- Header -->
        <div style="padding:20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--white)">
          <div>
            <div style="font-size:18px;font-weight:600;color:var(--ink)">${family.icon} PFMEA Templates for ${esc(family.label)}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${templateNames.length} template(s) defined</div>
          </div>
          <button onclick="closeTemplateManager()" style="border:none;background:transparent;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
        </div>

        <!-- Content -->
        <div style="padding:20px">
          ${templateNames.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;color:var(--muted)">
              <div style="font-size:32px;margin-bottom:8px">📋</div>
              <div style="font-size:14px;font-weight:600;color:var(--mid);margin-bottom:8px">No PFMEA Templates Yet</div>
              <div style="font-size:12px;margin-bottom:20px">Create a template to speed up PFMEA creation for new products in this family</div>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:16px">
              ${templateNames.map(templateName => {
                const items = grouped[templateName];
                return `
                  <div style="border:1px solid var(--line);border-radius:6px;overflow:hidden">
                    <div style="background:var(--bg);padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
                      <div>
                        <div style="font-weight:600;color:var(--ink);font-size:13px">${esc(templateName)}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px">${items.length} failure mode(s) · Avg RPN: ${(items.reduce((s, i) => s + i.severity * i.occurrence * i.detection, 0) / items.length).toFixed(0)}</div>
                      </div>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm" onclick="showTemplateViewer('${templateManagerState.familyId}', '${templateName}')" style="font-size:11px;padding:6px 12px">📖 View</button>
                        <button class="btn btn-sm" onclick="if(confirm('Delete template ${esc(templateName)}?')) deleteTemplate('${templateManagerState.familyId}', '${templateName}')" style="font-size:11px;padding:6px 12px;color:var(--red);border-color:var(--red);background:transparent">Delete</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Footer -->
        <div style="padding:16px 20px;border-top:1px solid var(--line);display:flex;gap:8px;justify-content:flex-end;position:sticky;bottom:0;background:var(--white)">
          <button class="btn btn-ghost" onclick="closeTemplateManager()">Close</button>
          <button class="btn btn-primary" onclick="showCreateTemplateModal('${templateManagerState.familyId}')">➕ Create Template</button>
        </div>
      </div>
    </div>
  `;
}

function showTemplateViewer(familyId, templateName) {
  // Placeholder for detailed template viewer
  alert('Template viewer for "' + templateName + '" - shows all failure modes and allows editing');
}

function deleteTemplate(familyId, templateName) {
  familyTemplatesDeleteFamily(familyId, templateName).then(() => {
    render();
  });
}

function showCreateTemplateModal(familyId) {
  // Placeholder for creating new template
  const templateName = prompt('Enter template name (e.g., "Standard HVAC PFMEA")');
  if (!templateName) return;
  alert('Template creation for "' + templateName + '" - UI coming soon');
}

function deleteTemplate(familyId, templateName) {
  familyTemplatesDeleteFamily(familyId, templateName).then(() => {
    render();
  });
}
