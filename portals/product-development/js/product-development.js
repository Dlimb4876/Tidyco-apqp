// Product Development Portal Hub
// Entry point for NPI and product development

let productDevelopmentPortalDelegationContainer = null;

function setProductDevelopmentTab(tab) {
  const prevTab = productDevelopmentTab;
  productDevelopmentTab = tab;
  const parts = ['s=product-development'];
  if (tab !== 'root') parts.push('pdt=' + encodeURIComponent(tab));
  const hash = '#' + parts.join('&');
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory(hash, { push: prevTab !== tab });
  } else {
    history.replaceState(null, '', hash);
  }
  render();
}

function productDevelopmentNavBar() {
  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-action="pd-nav-root">← Back</button>
      <button class="prod-nav-item ${productDevelopmentTab === 'npi' ? 'active' : ''}" data-action="pd-nav-tab" data-tab="npi">📋 NPI</button>
      <button class="prod-nav-item ${productDevelopmentTab === 'product-management' ? 'active' : ''}" data-action="pd-nav-tab" data-tab="product-management">📦 Products</button>
      <button class="prod-nav-item ${productDevelopmentTab === 'product-family-db' ? 'active' : ''}" data-action="pd-nav-tab" data-tab="product-family-db">🏢 Families</button>
      <button class="prod-nav-item ${productDevelopmentTab === 'parts-database' ? 'active' : ''}" data-action="pd-nav-tab" data-tab="parts-database">🔩 Parts</button>
    </div>
  `;
}

function renderProductDevelopment() {
  const nav = productDevelopmentNavBar();
  if (productDevelopmentTab === 'npi') {
    setTimeout(setupProductDevelopmentPortalDelegation, 0);
    return `<div id="product-development-portal-container">${nav}${npi.dashboard.renderProjects()}</div>`;
  }
  if (productDevelopmentTab === 'product-management') {
    setTimeout(setupProductDevelopmentPortalDelegation, 0);
    return `<div id="product-development-portal-container">${nav}${renderProductManagement()}</div>`;
  }
  if (productDevelopmentTab === 'product-family-db') {
    setTimeout(setupProductDevelopmentPortalDelegation, 0);
    return `<div id="product-development-portal-container">${nav}${renderProductFamilyDatabase()}</div>`;
  }
  if (productDevelopmentTab === 'parts-database') {
    setTimeout(setupProductDevelopmentPortalDelegation, 0);
    return `<div id="product-development-portal-container">${nav}${renderPartsDatabase()}</div>`;
  }

  // Root hub view
  setTimeout(setupProductDevelopmentPortalDelegation, 0);
  const favNpi = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('product-development::npi');
  const favProductManagement = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('product-development::product-management');
  const favProductFamilies = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('product-development::product-family-db');
  const favPartsDatabase = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('product-development::parts-database');
  return `
    <div class="proj-home" id="product-development-portal-container">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Development</div>
          <div class="proj-home-sub">New Product Introduction & Project Management</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="product-development" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="pd-nav-hub">← Back to Portal</button>
        </div>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" data-action="pd-hub-tab" data-tab="npi">
          <button
            class="hub-fav-toggle${favNpi ? ' is-active' : ''}"
            type="button"
            title="${favNpi ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('product-development::npi', event)">
            ${favNpi ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">📋</div>
            <div class="proj-card-name">NPI Projects</div>
            <div class="proj-card-meta">APQP Gates, PFMEA & BoM</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="pd-hub-tab" data-tab="product-management">
          <button
            class="hub-fav-toggle${favProductManagement ? ' is-active' : ''}"
            type="button"
            title="${favProductManagement ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('product-development::product-management', event)">
            ${favProductManagement ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">📦</div>
            <div class="proj-card-name">Product Management</div>
            <div class="proj-card-meta">Product Catalog & Lifecycle</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="pd-hub-tab" data-tab="product-family-db">
          <button
            class="hub-fav-toggle${favProductFamilies ? ' is-active' : ''}"
            type="button"
            title="${favProductFamilies ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('product-development::product-family-db', event)">
            ${favProductFamilies ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🏢</div>
            <div class="proj-card-name">Product Family Database</div>
            <div class="proj-card-meta">Family definitions & attributes</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="pd-hub-tab" data-tab="parts-database">
          <button
            class="hub-fav-toggle${favPartsDatabase ? ' is-active' : ''}"
            type="button"
            title="${favPartsDatabase ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('product-development::parts-database', event)">
            ${favPartsDatabase ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🔩</div>
            <div class="proj-card-name">Parts Database</div>
            <div class="proj-card-meta">A, B & C-Class parts database</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupProductDevelopmentPortalDelegation() {
  const container = document.getElementById('product-development-portal-container');
  if (!container || productDevelopmentPortalDelegationContainer === container) return;

  productDevelopmentPortalDelegationContainer = container;

  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !container.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    const isOverlayAction = actionEl.dataset.overlay === 'true';

    if (isOverlayAction && actionEl !== event.target) {
      return;
    }

    if (action === 'pd-nav-tab' || action === 'pd-hub-tab') {
      const tab = actionEl.dataset.tab;
      if (tab) setProductDevelopmentTab(tab);
      return;
    }

    if (action === 'pd-nav-root') {
      setProductDevelopmentTab('root');
      return;
    }

    if (action === 'pd-nav-hub') {
      navigate('hub');
      return;
    }

    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey;
      if (key && typeof showGuide === 'function') showGuide(key);
      return;
    }

    // Product Development specific actions
    if (action === 'pd-show-family-modal') {
      const familyId = actionEl.dataset.familyId || null;
      showFamilyModal(familyId);
      return;
    }

    if (action === 'pd-family-edit') {
      const familyId = actionEl.dataset.familyId;
      const field = actionEl.dataset.field;
      if (familyId && field) startFamilyEdit(familyId, field);
      return;
    }

    if (action === 'pd-show-template-manager') {
      const familyId = actionEl.dataset.familyId;
      if (familyId) showTemplateManager(familyId);
      return;
    }

    if (action === 'pd-delete-family') {
      const familyId = actionEl.dataset.familyId;
      if (familyId && confirm('Delete this family?')) familiesDataDeleteFamily(familyId);
      return;
    }

    if (action === 'pd-close-family-modal') {
      closeFamilyModal();
      return;
    }

    if (action === 'pd-save-family-modal') {
      saveFamilyModal();
      return;
    }

    if (action === 'pd-close-template-manager') {
      closeTemplateManager();
      return;
    }

    if (action === 'pd-close-template-viewer') {
      closeTemplateViewer();
      return;
    }

    if (action === 'pd-show-template-viewer') {
      const templateName = actionEl.dataset.templateName;
      if (templateName) showTemplateViewer(templateManagerState.familyId, templateName);
      return;
    }

    if (action === 'pd-delete-template') {
      const templateName = actionEl.dataset.templateName;
      if (templateName && confirm('Delete template "' + templateName + '"?')) deleteTemplate(templateManagerState.familyId, templateName);
      return;
    }
  });
}

function renderPartsDatabase() {
  const loadingMsg = '<div style="padding:20px;text-align:center;color:var(--muted)">Loading catalogue...</div>';
  const catalogueHTML = (typeof npi !== 'undefined' && npi.bom && npi.bom.renderABCCatalogue)
    ? (npi.bom.renderABCCatalogue() || loadingMsg)
    : loadingMsg;

  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Parts Database</div>
          <div class="proj-home-sub">A, B & C-Class central parts catalogue</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="parts-database" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="pd-nav-root">← Back</button>
        </div>
      </div>
      ${catalogueHTML}
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
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="product-family-db" title="User Guide">❓ Guide</button>
            <button class="btn btn-ghost" data-action="pd-nav-root">← Back</button>
          </div>
        </div>
        <div style="text-align:center;padding:80px 20px;color:var(--muted)">
          <div class="skeleton-loader" style="max-width:600px;margin:0 auto">
          <div class="skeleton-line" style="width:80%"></div>
          <div class="skeleton-line" style="width:60%"></div>
          <div class="skeleton-line" style="width:90%"></div>
          <div class="skeleton-line" style="width:70%"></div>
        </div>
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
            <button class="btn btn-primary" data-action="pd-show-family-modal">➕ Add Family</button>
            <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="product-family-db" title="User Guide">❓ Guide</button>
            <button class="btn btn-ghost" data-action="pd-nav-root">← Back</button>
          </div>
        </div>

        <div style="text-align:center;padding:80px 20px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">🏢</div>
          <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No Product Families</div>
          <div style="font-size:13px;margin-bottom:20px">Create your first product family to get started</div>
          <button class="btn btn-primary" data-action="pd-show-family-modal">➕ Add Family</button>
        </div>
      </div>
    `;
  }

  const familyRows = families.map(fam => {
    const stats = familyTemplatesGetStats(fam.id);
    return `
      <tr style="border-bottom:1px solid var(--line)">
        <td style="padding:12px 16px;font-size:13px;font-weight:500;color:var(--ink);width:25%;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" data-action="pd-family-edit" data-family-id="${fam.id}" data-field="label" title="Click to edit">${esc(fam.label)}</td>
        <td style="padding:12px 16px;font-size:13px;color:var(--text);width:50%;max-width:400px;cursor:pointer" data-action="pd-family-edit" data-family-id="${fam.id}" data-field="description" title="Click to edit">${fam.description ? esc(fam.description) : '<span style="color:var(--muted)">No description</span>'}</td>
        <td style="padding:12px 16px;font-size:24px;text-align:center;width:80px;cursor:pointer" data-action="pd-family-edit" data-family-id="${fam.id}" data-field="icon" title="Click to edit">${fam.icon || '📋'}</td>
        <td style="padding:12px 16px;text-align:right;width:150px;white-space:nowrap">
          <span style="display:inline-flex;gap:6px;justify-content:flex-end;align-items:center">
            <button class="btn btn-sm" data-action="pd-show-template-manager" data-family-id="${fam.id}" title="Manage PFMEA Templates" style="font-size:11px;padding:4px 8px">📋 Templates</button>
          </span>
        </td>
      </tr>
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
          <button class="btn btn-primary" data-action="pd-show-family-modal">➕ Add Family</button>
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="product-family-db" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="pd-nav-root">← Back</button>
        </div>
      </div>

      <div style="overflow-x:auto;margin:20px;border:1px solid var(--line);border-radius:6px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead style="background:var(--bg);border-bottom:2px solid var(--line)">
            <tr>
              <th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--mid);text-transform:uppercase;font-size:11px;letter-spacing:0.3px;width:25%">Family</th>
              <th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--mid);text-transform:uppercase;font-size:11px;letter-spacing:0.3px;width:50%">Description</th>
              <th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--mid);text-transform:uppercase;font-size:11px;letter-spacing:0.3px;width:80px">Icon</th>
              <th style="padding:12px 16px;text-align:right;font-weight:600;color:var(--mid);text-transform:uppercase;font-size:11px;letter-spacing:0.3px;width:150px">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${familyRows}
          </tbody>
        </table>
      </div>

      <div style="padding:0 20px 20px;color:var(--muted);font-size:12px">
        💡 Click any cell to edit inline
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
    showToast('Name and Label are required', 'warning');
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
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-bg);display:flex;align-items:center;justify-content:center;z-index:1000" data-action="pd-close-family-modal" data-overlay="true">
      <div style="background:var(--white);border-radius:8px;padding:24px;width:90%;max-width:500px;box-shadow:0 10px 40px rgba(0,0,0,0.15)">
        <div style="font-size:16px;font-weight:600;color:var(--ink);margin-bottom:16px">
          ${isEdit ? 'Edit Family' : 'Add Family'}
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
          <div>
            <label for="family-modal-name" style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Name (ID)*</label>
            <input type="text" id="family-modal-name" placeholder="e.g., HVAC" value="${family?.name || ''}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px" ${isEdit ? 'disabled' : ''}>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Unique identifier (cannot be changed)</div>
          </div>

          <div>
            <label for="family-modal-label" style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Display Label*</label>
            <input type="text" id="family-modal-label" placeholder="e.g., HVAC Systems" value="${family?.label || ''}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px">
          </div>

          <div>
            <label for="family-modal-icon" style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Icon</label>
            <input type="text" id="family-modal-icon" placeholder="e.g., ❄️" value="${family?.icon || '📋'}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;max-width:100px">
          </div>

          <div>
            <label for="family-modal-desc" style="display:block;font-size:12px;font-weight:600;color:var(--mid);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px">Description</label>
            <textarea id="family-modal-desc" placeholder="Brief description of this product family..." style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;font-family:inherit;resize:vertical;min-height:60px">${family?.description || ''}</textarea>
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--line);padding-top:16px">
          <button class="btn btn-ghost" data-action="pd-close-family-modal">Cancel</button>
          <button class="btn btn-primary" data-action="pd-save-family-modal">Save</button>
        </div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════
// FAMILY PFMEA TEMPLATE MANAGER
// ═══════════════════════════════════

let templateManagerState = { isOpen: false, familyId: null };
let templateViewerState = { isOpen: false, familyId: null, templateName: null };

function showTemplateManager(familyId) {
  templateManagerState.isOpen = true;
  templateManagerState.familyId = familyId;
  render();
}

function closeTemplateManager() {
  templateManagerState.isOpen = false;
  templateManagerState.familyId = null;
  closeTemplateViewer(false);
  render();
}

function showTemplateViewer(familyId, templateName) {
  templateViewerState.isOpen = true;
  templateViewerState.familyId = familyId;
  templateViewerState.templateName = templateName;
  render();
}

function closeTemplateViewer(shouldRender = true) {
  templateViewerState.isOpen = false;
  templateViewerState.familyId = null;
  templateViewerState.templateName = null;
  if (shouldRender) render();
}

function renderTemplateManager() {
  const family = familiesState.families.find(f => f.id === templateManagerState.familyId);
  if (!family) return '';

  const grouped = familyTemplatesGetGroupedByFamily(templateManagerState.familyId);
  const templateNames = Object.keys(grouped).sort();

  return `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-bg);display:flex;align-items:center;justify-content:center;z-index:1000;overflow-y:auto" data-action="pd-close-template-manager" data-overlay="true">
      <div style="background:var(--white);border-radius:8px;width:90%;max-width:900px;max-height:85vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.15);margin:20px 0">
        <!-- Header -->
        <div style="padding:20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--white)">
          <div>
            <div style="font-size:18px;font-weight:600;color:var(--ink)">${family.icon} PFMEA Templates for ${esc(family.label)}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${templateNames.length} template(s) defined</div>
          </div>
          <button data-action="pd-close-template-manager" style="border:none;background:transparent;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
        </div>

        <!-- Content -->
        <div style="padding:20px">
          ${templateNames.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;color:var(--muted)">
              <div style="font-size:32px;margin-bottom:8px">📋</div>
              <div style="font-size:14px;font-weight:600;color:var(--mid);margin-bottom:8px">No PFMEA Templates Yet</div>
              <div style="font-size:12px;margin-bottom:20px">A default template is created automatically when a family is added</div>
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
                        <button class="btn btn-sm" data-action="pd-show-template-viewer" data-template-name="${esc(templateName)}" style="font-size:11px;padding:6px 12px">📖 View</button>
                        <button class="btn btn-sm" data-action="pd-delete-template" data-template-name="${esc(templateName)}" style="font-size:11px;padding:6px 12px;color:var(--red);border-color:var(--red);background:transparent">Delete</button>
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
          <button class="btn btn-ghost" data-action="pd-close-template-manager">Close</button>
        </div>
      </div>
    </div>
  `;
}

function renderTemplateViewer() {
  if (!templateViewerState.isOpen) return '';

  const family = familiesState.families.find(f => f.id === templateViewerState.familyId);
  if (!family) return '';

  const items = familyTemplatesGetByFamily(templateViewerState.familyId)
    .filter(t => t.template_name === templateViewerState.templateName);

  return `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-bg);display:flex;align-items:center;justify-content:center;z-index:1001;overflow-y:auto" data-action="pd-close-template-viewer" data-overlay="true">
      <div style="background:var(--white);border-radius:8px;width:92%;max-width:1100px;max-height:88vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,0.2);margin:20px 0">
        <div style="padding:20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;position:sticky;top:0;background:var(--white)">
          <div>
            <div style="font-size:18px;font-weight:600;color:var(--ink)">${esc(templateViewerState.templateName)}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(family.label)} · ${items.length} failure mode(s)</div>
          </div>
          <button class="btn btn-ghost" data-action="pd-close-template-viewer">Close</button>
        </div>

        <div style="padding:20px">
          ${items.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;color:var(--muted)">
              <div style="font-size:32px;margin-bottom:8px">📋</div>
              <div style="font-size:14px;font-weight:600;color:var(--mid);margin-bottom:8px">Template is empty</div>
              <div style="font-size:12px">No PFMEA rows were found for this family template.</div>
            </div>
          ` : `
            <div style="overflow-x:auto;border:1px solid var(--line);border-radius:6px">
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead style="background:var(--bg);border-bottom:2px solid var(--line)">
                  <tr>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Failure Mode</th>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Effect</th>
                    <th style="padding:12px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">SEV</th>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Cause</th>
                    <th style="padding:12px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">OCC</th>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Prevention</th>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Detection</th>
                    <th style="padding:12px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">DET</th>
                    <th style="padding:12px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">RPN</th>
                    <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:var(--mid)">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const severity = item.severity || 3;
                    const occurrence = item.occurrence || 3;
                    const detection = item.detection || 3;
                    const rpn = severity * occurrence * detection;

                    return `
                      <tr style="border-bottom:1px solid var(--line)">
                        <td style="padding:12px 14px;vertical-align:top;color:var(--ink);font-weight:500">${esc(item.failure_mode)}</td>
                        <td style="padding:12px 14px;vertical-align:top">${item.effect ? esc(item.effect) : '<span style="color:var(--muted)">-</span>'}</td>
                        <td style="padding:12px 14px;text-align:center;vertical-align:top">${severity}</td>
                        <td style="padding:12px 14px;vertical-align:top">${item.cause ? esc(item.cause) : '<span style="color:var(--muted)">-</span>'}</td>
                        <td style="padding:12px 14px;text-align:center;vertical-align:top">${occurrence}</td>
                        <td style="padding:12px 14px;vertical-align:top">${item.prevention_control ? esc(item.prevention_control) : '<span style="color:var(--muted)">-</span>'}</td>
                        <td style="padding:12px 14px;vertical-align:top">${item.detection_control ? esc(item.detection_control) : '<span style="color:var(--muted)">-</span>'}</td>
                        <td style="padding:12px 14px;text-align:center;vertical-align:top">${detection}</td>
                        <td style="padding:12px 14px;text-align:center;vertical-align:top;font-weight:600">${rpn}</td>
                        <td style="padding:12px 14px;vertical-align:top">${item.notes ? esc(item.notes) : '<span style="color:var(--muted)">-</span>'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function deleteTemplate(familyId, templateName) {
  familyTemplatesDeleteFamily(familyId, templateName).then(() => {
    render();
  });
}

// ═══════════════════════════════════
// INLINE FAMILY EDITING
// ═══════════════════════════════════

let familyInlineEdit = { familyId: null, field: null };

function startFamilyEdit(familyId, field) {
  const family = familiesState.families.find(f => f.id === familyId);
  if (!family) return;

  familyInlineEdit = { familyId, field };

  let cellId = `fam-${field}-${familyId}`;
  let currentValue = field === 'label' ? family.label : (field === 'description' ? family.description : family.icon);

  let input;
  if (field === 'description') {
    input = `<textarea id="family-edit-input" style="width:100%;padding:6px 8px;border:1px solid var(--blue);border-radius:4px;font-size:13px;font-family:inherit;resize:vertical;min-height:60px">${esc(currentValue || '')}</textarea>`;
  } else {
    input = `<input type="text" id="family-edit-input" value="${esc(currentValue || '')}" style="width:100%;padding:6px 8px;border:1px solid var(--blue);border-radius:4px;font-size:13px" autofocus>`;
  }

  const cell = document.getElementById(cellId);
  if (!cell) return;

  cell.innerHTML = input;
  cell.style.padding = '8px';

  const inputEl = cell.querySelector('#family-edit-input');
  if (inputEl) {
    inputEl.focus();
    inputEl.select?.();

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field !== 'description') {
        saveFamilyInlineEdit(familyId, field);
      } else if (e.key === 'Escape') {
        cancelFamilyInlineEdit(familyId, field);
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => saveFamilyInlineEdit(familyId, field), 100);
    });
  }
}

function saveFamilyInlineEdit(familyId, field) {
  const inputEl = document.getElementById('family-edit-input');
  if (!inputEl) return;

  const newValue = inputEl.value.trim();
  const family = familiesState.families.find(f => f.id === familyId);
  if (!family) return;

  const updates = {};
  if (field === 'label') updates.label = newValue || family.label;
  else if (field === 'description') updates.description = newValue || null;
  else if (field === 'icon') updates.icon = newValue || '📋';

  familiesDataUpdateFamily(familyId, updates);
}

function cancelFamilyInlineEdit(familyId, field) {
  familyInlineEdit = { familyId: null, field: null };
  render();
}
