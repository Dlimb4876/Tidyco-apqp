// ═══════════════════════════════════════════════════════════════
// settings.js — Global Settings Portal
// Depends on: state.js, helpers.js, navigation.js,
//             families-data.js, work-areas-data.js
// ═══════════════════════════════════════════════════════════════

let settingsEventListenerRoot = null;
let settingsFamiliesEditingId = null;
let settingsFamiliesLoading = false;
let settingsFamiliesLoadError = null;
let settingsWorkAreasEditingId = null;
let settingsPermissionsLoading = false;
let settingsPermissionsData = null;
let settingsPermissionsError = null;

// ── Main settings page render ──────────────────────────────────
function renderSettings() {
  const tab = settingsActiveTab || 'families';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setupSettingsEventListeners();
      if (tab === 'families') {
        renderSettingsFamiliesTab();
        settingsEnsureFamiliesData();
      } else if (tab === 'work-areas') {
        renderSettingsWorkAreasTab();
        settingsEnsureWorkAreasData();
      } else if (tab === 'permissions') {
        renderSettingsPermissionsTab();
        settingsEnsurePermissionsData();
      }
    });
  });

  return `
    <div class="settings-portal" id="settingsPortalRoot">
      <div class="settings-header">
        <h1>Settings</h1>
        <p class="settings-header-desc">Global configuration for the operations portal.</p>
      </div>
      <div class="settings-layout">
        <nav class="settings-sidebar" aria-label="Settings categories">
          <span class="settings-nav-group-label">Configuration</span>
          <button class="settings-nav-item ${tab === 'families' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="families">
            <span class="nav-icon">📦</span> Product Families
          </button>
          <button class="settings-nav-item ${tab === 'work-areas' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="work-areas">
            <span class="nav-icon">🏭</span> Work Areas
          </button>
          <span class="settings-nav-group-label" style="margin-top:8px">Access</span>
          <button class="settings-nav-item ${tab === 'permissions' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="permissions">
            <span class="nav-icon">🔒</span> Permissions
          </button>
        </nav>
        <div class="settings-content">
          <div id="settingsFamiliesTab"   class="settings-tab-content ${tab === 'families'    ? 'active' : ''}"></div>
          <div id="settingsWorkAreasTab"  class="settings-tab-content ${tab === 'work-areas'  ? 'active' : ''}"></div>
          <div id="settingsPermissionsTab" class="settings-tab-content ${tab === 'permissions' ? 'active' : ''}"></div>
        </div>
      </div>
    </div>
  `;
}

// ── Ensure families data is loaded ────────────────────────────
async function settingsEnsureFamiliesData(forceReload = false) {
  if (settingsFamiliesLoading) return;
  if (!forceReload && Array.isArray(familiesState?.families) && familiesState.families.length > 0) return;

  settingsFamiliesLoading = true;
  settingsFamiliesLoadError = null;
  renderSettingsFamiliesTab();

  try {
    if (typeof familiesDataLoad === 'function') {
      await familiesDataLoad();
    } else if (typeof familiesDataInit === 'function') {
      await familiesDataInit();
    }
  } catch (err) {
    settingsFamiliesLoadError = err?.message || 'Failed to load families';
  } finally {
    settingsFamiliesLoading = false;
    renderSettingsFamiliesTab();
  }
}

// ── Ensure work areas data is loaded ──────────────────────────
async function settingsEnsureWorkAreasData() {
  if (workAreasState.loading) return;
  if (Array.isArray(workAreasState.workAreas) && workAreasState.workAreas.length > 0) return;
  try {
    await workAreasDataInit();
    renderSettingsWorkAreasTab();
  } catch (err) {
    console.error('Failed to load work areas for settings:', err);
  }
}

// ── Ensure permissions data is loaded ─────────────────────────
async function settingsEnsurePermissionsData(forceReload = false) {
  if (settingsPermissionsLoading) return;
  if (!forceReload && settingsPermissionsData !== null) return;

  settingsPermissionsLoading = true;
  settingsPermissionsError = null;
  renderSettingsPermissionsTab();

  try {
    const { data, error } = await supa.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: true });
    if (error) throw error;
    settingsPermissionsData = data || [];
  } catch (err) {
    settingsPermissionsError = err?.message || 'Failed to load user accounts';
    settingsPermissionsData = [];
  } finally {
    settingsPermissionsLoading = false;
    renderSettingsPermissionsTab();
  }
}

// ── Render families tab ───────────────────────────────────────
function renderSettingsFamiliesTab() {
  const container = document.getElementById('settingsFamiliesTab');
  if (!container) return;

  if (settingsFamiliesLoading || familiesState.loading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families…</div>';
    return;
  }

  if (settingsFamiliesLoadError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load product families</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(settingsFamiliesLoadError)}</div>
        <button class="btn btn-ghost" data-action="settings-families-retry">Retry</button>
      </div>
    `;
    return;
  }

  if (!familiesState || !Array.isArray(familiesState.families)) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading families…</div>';
    settingsEnsureFamiliesData(true);
    return;
  }

  const families = typeof familiesDataGetAll === 'function' ? familiesDataGetAll() : [...familiesState.families];

  const usageMap = {};
  (db.projects || []).forEach(p => {
    const fid = p.family || 'Other';
    usageMap[fid] = (usageMap[fid] || 0) + 1;
  });

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Product Families</h2>
      <p class="settings-section-desc">Define the product families used across all projects. Changes apply globally.</p>
    </div>
    <div class="families-table-wrap">
      <table class="prod-tbl families-inline-table" style="table-layout:auto;width:100%">
        <colgroup>
          <col style="width:60px">
          <col style="min-width:120px">
          <col style="min-width:180px">
          <col style="min-width:220px">
          <col style="width:80px">
          <col style="width:100px">
        </colgroup>
        <thead>
          <tr>
            <th class="ctr">Icon</th>
            <th>Family ID</th>
            <th>Family Name</th>
            <th>Description</th>
            <th class="ctr">Projects</th>
            <th class="families-actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="row-new" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
            <td><input class="cell-edit" id="sfNew-icon" placeholder="📋" maxlength="4" style="width:50px;text-align:center"></td>
            <td><input class="cell-edit" id="sfNew-id" placeholder="e.g. HVAC"></td>
            <td><input class="cell-edit" id="sfNew-label" placeholder="e.g. HVAC Systems"></td>
            <td><input class="cell-edit" id="sfNew-desc" placeholder="Description…"></td>
            <td class="ctr">—</td>
            <td class="families-actions-col">
              <button class="btn-del" title="Add family" data-action="settings-families-add">✓</button>
            </td>
          </tr>
          ${families.length === 0 ? `
            <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">No families defined yet. Add one above.</td></tr>
          ` : families.map(f => {
            const usage = usageMap[f.id] || 0;
            if (settingsFamiliesEditingId === f.id) {
              return `
              <tr class="row-new" style="background-color:rgba(255,191,0,0.05);border-top:2px solid rgba(255,191,0,0.2)">
                <td><input class="cell-edit" id="sfEdit-icon" value="${esc(f.icon || '📋')}" style="width:50px;text-align:center"></td>
                <td><input class="cell-edit" id="sfEdit-id" value="${esc(f.name || f.id)}"></td>
                <td><input class="cell-edit" id="sfEdit-label" value="${esc(f.label || '')}"></td>
                <td><input class="cell-edit" id="sfEdit-desc" value="${esc(f.description || '')}"></td>
                <td class="ctr">${usage}</td>
                <td class="families-actions-col">
                  <button class="btn-del" title="Save" data-action="settings-families-save-edit" data-family-id="${esc(f.id)}">✓</button>
                  <button class="btn-del" title="Cancel" data-action="settings-families-cancel-edit">✕</button>
                </td>
              </tr>`;
            }
            return `
            <tr>
              <td class="ctr" style="font-size:1.3em">${esc(f.icon || '📋')}</td>
              <td><code style="background:#f0f0f0;padding:2px 6px;border-radius:3px">${esc(f.name || f.id)}</code></td>
              <td><strong>${esc(f.label)}</strong></td>
              <td>${esc(f.description || '—')}</td>
              <td class="ctr"><span class="badge badge-NPI">${usage}</span></td>
              <td class="families-actions-col">
                <button class="btn-del" title="Edit" data-action="settings-families-start-edit" data-family-id="${esc(f.id)}">✏️</button>
                <button class="btn-del" title="Delete" data-action="settings-families-delete" data-family-id="${esc(f.id)}" data-family-label="${esc(f.label)}">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Families CRUD ──────────────────────────────────────────────
async function settingsFamiliesAdd() {
  const icon = document.getElementById('sfNew-icon')?.value.trim() || '📋';
  const id = document.getElementById('sfNew-id')?.value.trim();
  const label = document.getElementById('sfNew-label')?.value.trim();
  const description = document.getElementById('sfNew-desc')?.value.trim() || '';

  if (!id) { document.getElementById('sfNew-id')?.focus(); return; }
  if (!label) { document.getElementById('sfNew-label')?.focus(); return; }

  try {
    await familiesDataAddFamily(id, label, icon, description);
    document.getElementById('sfNew-id').value = '';
    document.getElementById('sfNew-label').value = '';
    document.getElementById('sfNew-desc').value = '';
    document.getElementById('sfNew-id')?.focus();
  } catch (err) {
    showToast('Error adding family: ' + err.message, 'error');
  }
}

function settingsFamiliesStartEdit(familyId) {
  settingsFamiliesEditingId = familyId;
  renderSettingsFamiliesTab();
  document.getElementById('sfEdit-label')?.focus();
}

async function settingsFamiliesSaveEdit(familyId) {
  const id = document.getElementById('sfEdit-id')?.value.trim();
  const label = document.getElementById('sfEdit-label')?.value.trim();

  if (!id) { document.getElementById('sfEdit-id')?.focus(); return; }
  if (!label) { document.getElementById('sfEdit-label')?.focus(); return; }

  const updates = {
    name: id,
    label,
    icon: document.getElementById('sfEdit-icon')?.value.trim() || '📋',
    description: document.getElementById('sfEdit-desc')?.value.trim() || ''
  };

  try {
    await familiesDataUpdateFamily(familyId, updates);
  } catch (err) {
    showToast('Error saving family: ' + err.message, 'error');
  }

  settingsFamiliesEditingId = null;
  renderSettingsFamiliesTab();
}

function settingsFamiliesCancelEdit() {
  settingsFamiliesEditingId = null;
  renderSettingsFamiliesTab();
}

async function settingsFamiliesDelete(familyId, familyLabel) {
  const usage = (db.projects || []).filter(p => p.family === familyId).length;
  if (usage > 0) {
    if (!confirm(`Delete family "${familyLabel}"?\n\nWarning: ${usage} project${usage !== 1 ? 's' : ''} use this family. They will need to be reassigned manually.`)) return;
  } else {
    if (!confirm(`Delete family "${familyLabel}"? This cannot be undone.`)) return;
  }

  try {
    await familiesDataDeleteFamily(familyId);
    if (settingsFamiliesEditingId === familyId) settingsFamiliesEditingId = null;
    renderSettingsFamiliesTab();
  } catch (err) {
    showToast('Error deleting family: ' + err.message, 'error');
  }
}

// ── Render work areas tab ──────────────────────────────────────
function renderSettingsWorkAreasTab() {
  const container = document.getElementById('settingsWorkAreasTab');
  if (!container) return;

  if (workAreasState.loading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading work areas…</div>';
    return;
  }

  const areas = typeof workAreasDataGetAll === 'function' ? workAreasDataGetAll() : [...workAreasState.workAreas];

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Work Areas</h2>
      <p class="settings-section-desc">Manage the physical work areas used in capacity planning (e.g. Unit 2, Unit 3).</p>
    </div>
    <div class="families-table-wrap">
      <table class="prod-tbl" style="table-layout:auto;width:100%;max-width:600px">
        <colgroup>
          <col style="min-width:200px">
          <col>
          <col style="width:100px">
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th class="families-actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="row-new" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
            <td><input class="cell-edit" id="waNew-name" placeholder="e.g. Unit 9"></td>
            <td><input class="cell-edit" id="waNew-desc" placeholder="Description (optional)"></td>
            <td class="families-actions-col">
              <button class="btn-del" title="Add work area" data-action="settings-wa-add">✓</button>
            </td>
          </tr>
          ${areas.length === 0 ? `
            <tr><td colspan="3" style="text-align:center;padding:24px;color:var(--muted)">No work areas defined yet. Add one above.</td></tr>
          ` : areas.map(w => {
            if (settingsWorkAreasEditingId === w.id) {
              return `
              <tr class="row-new" style="background-color:rgba(255,191,0,0.05);border-top:2px solid rgba(255,191,0,0.2)">
                <td><input class="cell-edit" id="waEdit-name" value="${esc(w.name)}"></td>
                <td><input class="cell-edit" id="waEdit-desc" value="${esc(w.description || '')}"></td>
                <td class="families-actions-col">
                  <button class="btn-del" title="Save" data-action="settings-wa-save-edit" data-wa-id="${esc(w.id)}">✓</button>
                  <button class="btn-del" title="Cancel" data-action="settings-wa-cancel-edit">✕</button>
                </td>
              </tr>`;
            }
            return `
            <tr>
              <td><strong>${esc(w.name)}</strong></td>
              <td>${esc(w.description || '—')}</td>
              <td class="families-actions-col">
                <button class="btn-del" title="Rename" data-action="settings-wa-start-edit" data-wa-id="${esc(w.id)}">✏️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Work Areas CRUD ────────────────────────────────────────────
async function settingsWorkAreaAdd() {
  const name = document.getElementById('waNew-name')?.value.trim();
  const description = document.getElementById('waNew-desc')?.value.trim() || '';

  if (!name) { document.getElementById('waNew-name')?.focus(); return; }

  try {
    await workAreasDataAddWorkArea(name, description);
    document.getElementById('waNew-name').value = '';
    document.getElementById('waNew-desc').value = '';
    document.getElementById('waNew-name')?.focus();
    renderSettingsWorkAreasTab();
  } catch (err) {
    showToast('Error adding work area: ' + err.message, 'error');
  }
}

function settingsWorkAreaStartEdit(workAreaId) {
  settingsWorkAreasEditingId = workAreaId;
  renderSettingsWorkAreasTab();
  document.getElementById('waEdit-name')?.focus();
}

async function settingsWorkAreaSaveEdit(workAreaId) {
  const name = document.getElementById('waEdit-name')?.value.trim();
  if (!name) { document.getElementById('waEdit-name')?.focus(); return; }

  const updates = {
    name,
    description: document.getElementById('waEdit-desc')?.value.trim() || null
  };

  try {
    await workAreasDataUpdateWorkArea(workAreaId, updates);
  } catch (err) {
    showToast('Error saving work area: ' + err.message, 'error');
  }

  settingsWorkAreasEditingId = null;
  renderSettingsWorkAreasTab();
}

function settingsWorkAreaCancelEdit() {
  settingsWorkAreasEditingId = null;
  renderSettingsWorkAreasTab();
}

// ── Render permissions tab ─────────────────────────────────────
function renderSettingsPermissionsTab() {
  const container = document.getElementById('settingsPermissionsTab');
  if (!container) return;

  if (settingsPermissionsLoading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading user accounts…</div>';
    return;
  }

  const users = settingsPermissionsData || [];
  const currentEmail = currentUser?.email || '';

  let tableBody = '';
  if (users.length === 0 && !settingsPermissionsError) {
    tableBody = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No user accounts found.</td></tr>`;
  } else {
    tableBody = users.map(u => {
      const isYou = u.email === currentEmail;
      const name = esc(u.full_name || '—');
      const email = esc(u.email || '—');
      const role = esc(u.role || 'user');
      const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '—';
      return `
      <tr>
        <td>
          ${name}
          ${isYou ? '<span class="permissions-badge you">You</span>' : ''}
        </td>
        <td>${email}</td>
        <td><span class="permissions-badge">${role}</span></td>
        <td>${joined}</td>
      </tr>`;
    }).join('');
  }

  const errorBanner = settingsPermissionsError ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.25);border-radius:6px;font-size:0.82rem;color:var(--red)">
      Could not load user accounts: ${esc(settingsPermissionsError)}
      <button class="btn btn-ghost" style="margin-left:12px;font-size:0.8rem;padding:2px 8px" data-action="settings-permissions-retry">Retry</button>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Permissions</h2>
      <p class="settings-section-desc">All registered user accounts. Role-based access controls are planned for a future release.</p>
    </div>
    ${errorBanner}
    <table class="prod-tbl" style="width:100%">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${tableBody}
      </tbody>
    </table>
    <div class="permissions-notice">
      Role-based permissions are not yet active. All authenticated users currently have full access to the portal.
    </div>
  `;
}

// ── Event listener setup ───────────────────────────────────────
function setupSettingsEventListeners() {
  const root = document.getElementById('settingsPortalRoot');
  if (!root || settingsEventListenerRoot === root) return;
  settingsEventListenerRoot = root;

  root.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !root.contains(actionEl)) return;
    const action = actionEl.dataset.action;

    if (action === 'settings-switch-tab') {
      const tab = actionEl.dataset.tab;
      if (!tab) return;
      settingsActiveTab = tab;
      root.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
      root.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
      actionEl.classList.add('active');
      const tabMap = { families: 'settingsFamiliesTab', 'work-areas': 'settingsWorkAreasTab', permissions: 'settingsPermissionsTab' };
      document.getElementById(tabMap[tab])?.classList.add('active');
      if (tab === 'families') {
        renderSettingsFamiliesTab();
        settingsEnsureFamiliesData();
      } else if (tab === 'work-areas') {
        renderSettingsWorkAreasTab();
        settingsEnsureWorkAreasData();
      } else if (tab === 'permissions') {
        renderSettingsPermissionsTab();
        settingsEnsurePermissionsData();
      }
      return;
    }

    // Families tab actions
    if (action === 'settings-families-retry') { settingsEnsureFamiliesData(true); return; }
    if (action === 'settings-families-add') { await settingsFamiliesAdd(); return; }
    if (action === 'settings-families-start-edit') { settingsFamiliesStartEdit(actionEl.dataset.familyId || ''); return; }
    if (action === 'settings-families-save-edit') { await settingsFamiliesSaveEdit(actionEl.dataset.familyId || ''); return; }
    if (action === 'settings-families-cancel-edit') { settingsFamiliesCancelEdit(); return; }
    if (action === 'settings-families-delete') { await settingsFamiliesDelete(actionEl.dataset.familyId || '', actionEl.dataset.familyLabel || ''); return; }

    // Work areas tab actions
    if (action === 'settings-wa-add') { await settingsWorkAreaAdd(); return; }
    if (action === 'settings-wa-start-edit') { settingsWorkAreaStartEdit(actionEl.dataset.waId || ''); return; }
    if (action === 'settings-wa-save-edit') { await settingsWorkAreaSaveEdit(actionEl.dataset.waId || ''); return; }
    if (action === 'settings-wa-cancel-edit') { settingsWorkAreaCancelEdit(); return; }

    // Permissions tab actions
    if (action === 'settings-permissions-retry') { settingsEnsurePermissionsData(true); return; }
  });
}
