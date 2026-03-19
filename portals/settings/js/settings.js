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
let settingsTeamsLoading = false;
let settingsTeamsData = null;
let settingsTeamsError = null;
let settingsTeamsEditingId = null;
let settingsTeamsPermissionsEditingId = null;
let settingsTeamsPermissionsData = {};

// ── Appearance preferences (persisted to localStorage) ─────────
const APPEARANCE_STORAGE_KEY = 'tidyco_prefs';

function settingsLoadAppearancePrefs() {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function settingsSaveAppearancePrefs(prefs) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch (_) { /* ignore storage errors */ }
}

function settingsApplyAppearance() {
  const prefs = settingsLoadAppearancePrefs();

  // Organisation / app name in topbar
  const brandName = document.querySelector('.brand-name');
  const brandSub  = document.querySelector('.brand-sub');
  if (brandName) brandName.textContent = prefs.orgName   || 'TIDYCO';
  if (brandSub)  brandSub.textContent  = prefs.appSubtitle || 'Operations Portal';

  // Compact table density
  document.body.classList.toggle('compact-tables', prefs.tableDensity === 'compact');
}

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
      } else if (tab === 'teams') {
        renderSettingsTeamsTab();
        settingsEnsureTeamsData();
      } else if (tab === 'permissions') {
        renderSettingsPermissionsTab();
        settingsEnsurePermissionsData();
      } else if (tab === 'role-definitions') {
        renderSettingsRoleDefinitionsTab();
      } else if (tab === 'appearance') {
        renderSettingsAppearanceTab();
      } else if (tab === 'about') {
        renderSettingsAboutTab();
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
          <button class="settings-nav-item ${tab === 'teams' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="teams">
            <span class="nav-icon">🏢</span> Teams
          </button>
          <button class="settings-nav-item ${tab === 'permissions' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="permissions">
            <span class="nav-icon">🔒</span> Permissions
          </button>
          <button class="settings-nav-item ${tab === 'role-definitions' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="role-definitions">
            <span class="nav-icon">🔐</span> Role Definitions
          </button>
          <span class="settings-nav-group-label" style="margin-top:8px">Preferences</span>
          <button class="settings-nav-item ${tab === 'appearance' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="appearance">
            <span class="nav-icon">🎨</span> Appearance
          </button>
          <span class="settings-nav-group-label" style="margin-top:8px">Help</span>
          <button class="settings-nav-item ${tab === 'about' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="about">
            <span class="nav-icon">ℹ️</span> About
          </button>
        </nav>
        <div class="settings-content">
          <div id="settingsFamiliesTab"        class="settings-tab-content ${tab === 'families'         ? 'active' : ''}"></div>
          <div id="settingsWorkAreasTab"       class="settings-tab-content ${tab === 'work-areas'       ? 'active' : ''}"></div>
          <div id="settingsTeamsTab"           class="settings-tab-content ${tab === 'teams'            ? 'active' : ''}"></div>
          <div id="settingsPermissionsTab"     class="settings-tab-content ${tab === 'permissions'      ? 'active' : ''}"></div>
          <div id="settingsRoleDefinitionsTab" class="settings-tab-content ${tab === 'role-definitions' ? 'active' : ''}"></div>
          <div id="settingsAppearanceTab"      class="settings-tab-content ${tab === 'appearance'       ? 'active' : ''}"></div>
          <div id="settingsAboutTab"           class="settings-tab-content ${tab === 'about'            ? 'active' : ''}"></div>
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

// ── Ensure teams data is loaded ──────────────────────────────
async function settingsEnsureTeamsData(forceReload = false) {
  if (settingsTeamsLoading) return;
  if (!forceReload && settingsTeamsData !== null) return;

  settingsTeamsLoading = true;
  settingsTeamsError = null;
  renderSettingsTeamsTab();

  try {
    settingsTeamsData = await teamsDataLoadAll();
    // Load user counts for each team
    for (const team of settingsTeamsData) {
      team.userCount = await teamsDataGetUserCount(team.id);
    }
  } catch (err) {
    settingsTeamsError = err?.message || 'Failed to load teams';
    settingsTeamsData = [];
  } finally {
    settingsTeamsLoading = false;
    renderSettingsTeamsTab();
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
          ${canEdit() ? `<tr class="row-new" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
            <td><input class="cell-edit" id="sfNew-icon" placeholder="📋" maxlength="4" style="width:50px;text-align:center"></td>
            <td><input class="cell-edit" id="sfNew-id" placeholder="e.g. HVAC"></td>
            <td><input class="cell-edit" id="sfNew-label" placeholder="e.g. HVAC Systems"></td>
            <td><input class="cell-edit" id="sfNew-desc" placeholder="Description…"></td>
            <td class="ctr">—</td>
            <td class="families-actions-col">
              <button class="btn-del" title="Add family" data-action="settings-families-add">✓</button>
            </td>
          </tr>` : ''}
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
                ${canEdit() ? `<button class="btn-del" title="Edit" data-action="settings-families-start-edit" data-family-id="${esc(f.id)}">✏️</button>
                <button class="btn-del" title="Delete" data-action="settings-families-delete" data-family-id="${esc(f.id)}" data-family-label="${esc(f.label)}">🗑️</button>` : '—'}
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
          ${canEdit() ? `<tr class="row-new" style="background-color:rgba(59,130,246,0.05);border-top:2px solid rgba(59,130,246,0.2)">
            <td><input class="cell-edit" id="waNew-name" placeholder="e.g. Unit 9"></td>
            <td><input class="cell-edit" id="waNew-desc" placeholder="Description (optional)"></td>
            <td class="families-actions-col">
              <button class="btn-del" title="Add work area" data-action="settings-wa-add">✓</button>
            </td>
          </tr>` : ''}
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
                ${canEdit() ? `<button class="btn-del" title="Rename" data-action="settings-wa-start-edit" data-wa-id="${esc(w.id)}">✏️</button>` : '—'}
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

// ── Derive a display name from an email address prefix ────────
// e.g. daniel.limb@tidyco.co.uk → "Daniel Limb"
function settingsEmailToName(email) {
  if (!email) return '—';
  const local = email.split('@')[0];
  return local.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// ── Change a user's role ───────────────────────────────────────
async function settingsPermissionsChangeRole(userId, newRole, isLastAdmin) {
  if (!isAdmin()) { showToast('Only admins can change roles.', 'error'); return; }
  if (!userId || !newRole) return;
  if (isLastAdmin && newRole !== 'admin') {
    showToast('Cannot remove the last admin. Promote another user to admin first.', 'warning');
    settingsEnsurePermissionsData(true);
    return;
  }
  try {
    const { error } = await supa.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;
    // Update local cache so the UI stays consistent without a full reload
    if (settingsPermissionsData) {
      const rec = settingsPermissionsData.find(u => u.id === userId);
      if (rec) rec.role = newRole;
    }
    showToast('Role updated. Change takes effect on that user\'s next login.', 'info');
    renderSettingsPermissionsTab();
  } catch (err) {
    showToast('Failed to update role: ' + err.message, 'error');
    settingsEnsurePermissionsData(true);
  }
}

// ── Render teams tab ───────────────────────────────────────────
function renderSettingsTeamsTab() {
  const container = document.getElementById('settingsTeamsTab');
  if (!container) return;

  if (settingsTeamsLoading) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading teams…</div>';
    return;
  }

  if (settingsTeamsError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load teams</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(settingsTeamsError)}</div>
        <button class="btn btn-ghost" data-action="settings-teams-retry">Retry</button>
      </div>
    `;
    return;
  }

  const teams = settingsTeamsData || [];
  const DEFAULT_TEAMS = ['ME', 'PM', 'OPS', 'Admin', 'ReadOnly'];

  let tableBody = '';
  if (teams.length === 0) {
    // Show default teams as suggestions if none exist
    tableBody = DEFAULT_TEAMS.map(type => `
      <tr style="opacity:0.6">
        <td>${type}</td>
        <td>${type}</td>
        <td style="text-align:center">0</td>
        <td style="text-align:center;color:var(--muted)">—</td>
      </tr>
    `).join('');
  } else {
    tableBody = teams.map(t => `
      <tr>
        <td>${esc(t.name)}</td>
        <td>${esc(t.team_type)}</td>
        <td style="text-align:center">${t.userCount || 0}</td>
        <td style="text-align:center">
          <button class="btn btn-sm btn-ghost" data-action="settings-teams-edit" data-team-id="${esc(t.id)}" title="Edit permissions">Edit</button>
          <button class="btn btn-sm btn-ghost" data-action="settings-teams-delete" data-team-id="${esc(t.id)}" title="Delete team" style="color:var(--red)">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Teams</h2>
      <p class="settings-section-desc">Organize users by department and manage group permissions.</p>
    </div>
    <div style="margin-bottom:16px">
      <button class="btn btn-primary" data-action="settings-teams-add">+ Add Team</button>
    </div>
    <table class="prod-tbl" style="width:100%">
      <thead>
        <tr>
          <th>Team Name</th>
          <th>Type</th>
          <th>Users</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${tableBody}
      </tbody>
    </table>
    ${teams.length === 0 ? `
      <div class="permissions-notice" style="margin-top:16px">
        <strong>No teams created yet.</strong> Click "Add Team" to create your first team. Default types: ME, PM, OPS, Admin, ReadOnly.
      </div>
    ` : ''}
  `;
}

// ── Team CRUD operations ────────────────────────────────────────
async function settingsTeamsAdd() {
  const name = prompt('Team name:');
  if (!name || !name.trim()) return;

  const type = prompt('Team type (ME, PM, OPS, Admin, ReadOnly):');
  if (!type || !type.trim()) return;

  const validTypes = ['ME', 'PM', 'OPS', 'Admin', 'ReadOnly'];
  if (!validTypes.includes(type.trim())) {
    showToast('Invalid team type. Use: ME, PM, OPS, Admin, or ReadOnly', 'error');
    return;
  }

  const description = prompt('Team description (optional):');

  try {
    const newTeam = await teamsDataAdd({
      name: name.trim(),
      team_type: type.trim(),
      description: description?.trim() || ''
    });

    if (!newTeam) {
      showToast('Failed to create team', 'error');
      return;
    }

    newTeam.userCount = 0;
    settingsTeamsData.push(newTeam);
    showToast('Team created successfully', 'success');
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error creating team: ' + err.message, 'error');
  }
}

async function settingsTeamsDelete(teamId) {
  if (!teamId) return;

  const team = settingsTeamsData.find(t => t.id === teamId);
  if (!team) return;

  if (team.userCount && team.userCount > 0) {
    showToast(`Cannot delete team with ${team.userCount} user(s). Reassign users first.`, 'warning');
    return;
  }

  if (!confirm(`Delete team "${esc(team.name)}"? This cannot be undone.`)) return;

  try {
    const success = await teamsDataDelete(teamId);
    if (!success) {
      showToast('Failed to delete team', 'error');
      return;
    }

    settingsTeamsData = settingsTeamsData.filter(t => t.id !== teamId);
    showToast('Team deleted', 'success');
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error deleting team: ' + err.message, 'error');
  }
}

async function settingsTeamsEdit(teamId) {
  if (!teamId) return;

  settingsTeamsPermissionsEditingId = teamId;
  try {
    settingsTeamsPermissionsData[teamId] = await teamsDataLoadPermissions(teamId);
    renderSettingsTeamsPermissionsEditor();
  } catch (err) {
    showToast('Failed to load permissions: ' + err.message, 'error');
  }
}

async function settingsTeamsPermissionsSave() {
  const teamId = settingsTeamsPermissionsEditingId;
  if (!teamId) return;

  const permissions = settingsTeamsPermissionsData[teamId] || [];
  try {
    const success = await teamPermissionsDataSave(teamId, permissions);
    if (!success) {
      showToast('Failed to save permissions', 'error');
      return;
    }

    showToast('Permissions saved', 'success');
    settingsTeamsPermissionsEditingId = null;
    settingsEnsureTeamsData(true);
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error saving permissions: ' + err.message, 'error');
  }
}

function settingsTeamsPermissionsCancel() {
  settingsTeamsPermissionsEditingId = null;
  renderSettingsTeamsTab();
}

function settingsTeamsPermissionsToggle(teamId, permission) {
  if (!settingsTeamsPermissionsData[teamId]) return;
  const perm = settingsTeamsPermissionsData[teamId].find(p => p.permission === permission);
  if (perm) {
    perm.allowed = !perm.allowed;
    renderSettingsTeamsPermissionsEditor();
  }
}

// ── Render permissions editor ──────────────────────────────────
function renderSettingsTeamsPermissionsEditor() {
  const teamId = settingsTeamsPermissionsEditingId;
  if (!teamId) return;

  const team = settingsTeamsData.find(t => t.id === teamId);
  if (!team) return;

  const permissions = settingsTeamsPermissionsData[teamId] || [];
  const PERMISSION_LABELS = {
    'view_all_project_data': 'View all project data',
    'edit_projects_tasks_schedules': 'Edit projects, tasks & schedules',
    'add_delete_records': 'Add & delete records',
    'manage_families': 'Manage product families',
    'manage_work_areas': 'Manage work areas',
    'manage_capacity': 'Manage capacity planning',
    'manage_user_roles': 'Change user roles',
    'access_settings': 'Access Settings page'
  };

  let permRows = '';
  Object.entries(PERMISSION_LABELS).forEach(([permKey, label]) => {
    const perm = permissions.find(p => p.permission === permKey);
    const isAllowed = perm?.allowed || false;
    permRows += `
      <tr>
        <td>${label}</td>
        <td style="text-align:center">
          <input type="checkbox" ${isAllowed ? 'checked' : ''}
                 data-action="settings-teams-permission-toggle"
                 data-permission="${esc(permKey)}"
                 style="cursor:pointer;width:18px;height:18px">
        </td>
      </tr>
    `;
  });

  const container = document.getElementById('settingsTeamsTab');
  if (!container) return;

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Edit Permissions: ${esc(team.name)}</h2>
      <p class="settings-section-desc">Configure what this team can do in the system.</p>
    </div>
    <table class="prod-tbl" style="width:100%;margin-bottom:16px">
      <thead>
        <tr>
          <th>Permission</th>
          <th style="width:80px;text-align:center">Allowed</th>
        </tr>
      </thead>
      <tbody>
        ${permRows}
      </tbody>
    </table>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" data-action="settings-teams-permissions-save">Save</button>
      <button class="btn btn-ghost" data-action="settings-teams-permissions-cancel">Cancel</button>
    </div>
  `;
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

  const adminCount = users.filter(u => (u.role || 'editor') === 'admin').length;
  const viewerIsAdmin = isAdmin();

  let tableBody = '';
  if (users.length === 0 && !settingsPermissionsError) {
    tableBody = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No user accounts found.</td></tr>`;
  } else {
    tableBody = users.map(u => {
      const isYou = u.email === currentEmail;
      const name = esc(u.full_name || settingsEmailToName(u.email));
      const email = esc(u.email || '—');
      const role = u.role || 'editor';
      const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '—';
      const isLastAdmin = role === 'admin' && adminCount <= 1;

      // Admins see a dropdown; everyone else sees a read-only badge
      const roleCell = viewerIsAdmin
        ? `<select class="cell-edit" style="width:100px" data-action="settings-permissions-change-role" data-user-id="${esc(u.id)}" data-is-last-admin="${isLastAdmin}" ${isYou && isLastAdmin ? 'disabled title="Cannot remove your own admin role when you are the only admin"' : ''}>
            <option value="admin"  ${role === 'admin'  ? 'selected' : ''}>Admin</option>
            <option value="editor" ${role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="viewer" ${role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>`
        : `<span class="permissions-badge">${esc(role)}</span>`;

      return `
      <tr>
        <td>
          ${name}
          ${isYou ? '<span class="permissions-badge you">You</span>' : ''}
        </td>
        <td>${email}</td>
        <td>${roleCell}</td>
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

  const adminNote = viewerIsAdmin
    ? `<div class="permissions-notice" style="background:rgba(59,130,246,0.06);border-color:rgba(59,130,246,0.25)">
        <strong>Admin tip:</strong> Use the dropdowns to change a user's role. Changes take effect on the user's next login.
      </div>`
    : `<div class="permissions-notice">Only admins can change roles. Your current role is <strong>${esc(currentUserRole || 'editor')}</strong>.</div>`;

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Permissions</h2>
      <p class="settings-section-desc">Role-based access control. Admins can assign roles to control what each user can do.</p>
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
    ${adminNote}
  `;
}

// ── Render role definitions tab ────────────────────────────────
function renderSettingsRoleDefinitionsTab() {
  const container = document.getElementById('settingsRoleDefinitionsTab');
  if (!container) return;

  const roleMatrix = [
    { label: 'View all project data',            admin: true,  editor: true,  viewer: true  },
    { label: 'Edit projects, tasks & schedules', admin: true,  editor: true,  viewer: false },
    { label: 'Add & delete records',             admin: true,  editor: true,  viewer: false },
    { label: 'Manage product families',          admin: true,  editor: true,  viewer: false },
    { label: 'Manage work areas',                admin: true,  editor: true,  viewer: false },
    { label: 'Manage capacity planning',         admin: true,  editor: true,  viewer: false },
    { label: 'Change user roles',                admin: true,  editor: false, viewer: false },
    { label: 'Access Settings page',             admin: true,  editor: false, viewer: false },
  ];

  const tick  = `<span style="color:var(--green,#22c55e);font-size:1.1em">✓</span>`;
  const cross = `<span style="color:var(--muted,#aaa);font-size:1.1em">—</span>`;

  const matrixRows = roleMatrix.map(r => `
    <tr>
      <td>${esc(r.label)}</td>
      <td class="ctr">${r.admin  ? tick : cross}</td>
      <td class="ctr">${r.editor ? tick : cross}</td>
      <td class="ctr">${r.viewer ? tick : cross}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Role Definitions</h2>
      <p class="settings-section-desc">What each role can do across the portal. Go to <strong>Permissions</strong> to assign roles to users.</p>
    </div>
    <table class="prod-tbl" style="width:100%;max-width:600px">
      <thead>
        <tr>
          <th>Permission</th>
          <th class="ctr" style="width:80px">Admin</th>
          <th class="ctr" style="width:80px">Editor</th>
          <th class="ctr" style="width:80px">Viewer</th>
        </tr>
      </thead>
      <tbody>
        ${matrixRows}
      </tbody>
    </table>
  `;
}

// ── Render appearance tab ──────────────────────────────────────
function renderSettingsAppearanceTab() {
  const container = document.getElementById('settingsAppearanceTab');
  if (!container) return;

  const prefs = settingsLoadAppearancePrefs();
  const orgName     = esc(prefs.orgName      || '');
  const appSubtitle = esc(prefs.appSubtitle  || '');
  const density     = prefs.tableDensity     || 'normal';
  const toastDur    = prefs.toastDuration    || 'normal';

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Appearance</h2>
      <p class="settings-section-desc">Personalise how the portal looks. These preferences are saved to this browser only.</p>
    </div>

    <div class="appearance-group">
      <h3 class="appearance-group-title">Branding</h3>
      <p class="appearance-group-desc">Customise the name shown in the top-left corner of the portal.</p>
      <div class="appearance-row">
        <label class="appearance-label" for="ap-orgName">Organisation name</label>
        <input class="cell-edit appearance-input" id="ap-orgName" placeholder="TIDYCO" maxlength="40" value="${orgName}">
        <span class="appearance-hint">Shown as the main brand name. Leave blank for default.</span>
      </div>
      <div class="appearance-row">
        <label class="appearance-label" for="ap-appSubtitle">App sub-title</label>
        <input class="cell-edit appearance-input" id="ap-appSubtitle" placeholder="Operations Portal" maxlength="50" value="${appSubtitle}">
        <span class="appearance-hint">Shown next to the organisation name. Leave blank for default.</span>
      </div>
    </div>

    <div class="appearance-group">
      <h3 class="appearance-group-title">Tables</h3>
      <div class="appearance-row">
        <label class="appearance-label">Row density</label>
        <div class="appearance-radio-group">
          <label class="appearance-radio-label">
            <input type="radio" name="ap-density" value="normal"  ${density === 'normal'  ? 'checked' : ''}> Normal
          </label>
          <label class="appearance-radio-label">
            <input type="radio" name="ap-density" value="compact" ${density === 'compact' ? 'checked' : ''}> Compact
          </label>
        </div>
        <span class="appearance-hint">Compact reduces row height to fit more rows on screen.</span>
      </div>
    </div>

    <div class="appearance-group">
      <h3 class="appearance-group-title">Notifications</h3>
      <div class="appearance-row">
        <label class="appearance-label">Toast duration</label>
        <div class="appearance-radio-group">
          <label class="appearance-radio-label">
            <input type="radio" name="ap-toast" value="short"  ${toastDur === 'short'  ? 'checked' : ''}> Short (2 s)
          </label>
          <label class="appearance-radio-label">
            <input type="radio" name="ap-toast" value="normal" ${toastDur === 'normal' ? 'checked' : ''}> Normal (4 s)
          </label>
          <label class="appearance-radio-label">
            <input type="radio" name="ap-toast" value="long"   ${toastDur === 'long'   ? 'checked' : ''}> Long (6 s)
          </label>
        </div>
        <span class="appearance-hint">How long notification pop-ups stay on screen.</span>
      </div>
    </div>

    <div class="appearance-actions">
      <button class="btn btn-primary" data-action="settings-appearance-save">Save preferences</button>
      <button class="btn btn-ghost" data-action="settings-appearance-reset">Reset to defaults</button>
    </div>
  `;
}

// ── Save / reset appearance preferences ───────────────────────
function settingsAppearanceSave() {
  const orgName     = document.getElementById('ap-orgName')?.value.trim()     || '';
  const appSubtitle = document.getElementById('ap-appSubtitle')?.value.trim() || '';
  const density     = document.querySelector('input[name="ap-density"]:checked')?.value || 'normal';
  const toastDur    = document.querySelector('input[name="ap-toast"]:checked')?.value   || 'normal';

  settingsSaveAppearancePrefs({ orgName, appSubtitle, tableDensity: density, toastDuration: toastDur });
  settingsApplyAppearance();
  showToast('Appearance preferences saved.', 'info');
  renderSettingsAppearanceTab();
}

function settingsAppearanceReset() {
  settingsSaveAppearancePrefs({});
  settingsApplyAppearance();
  showToast('Appearance reset to defaults.', 'info');
  renderSettingsAppearanceTab();
}

// ── Render about tab ───────────────────────────────────────────
function renderSettingsAboutTab() {
  const container = document.getElementById('settingsAboutTab');
  if (!container) return;

  const shortcuts = [
    { key: '?  or  Ctrl / ⌘ + /',  desc: 'Show keyboard shortcuts help' },
    { key: 'Ctrl / ⌘ + S',         desc: 'Save current work' },
    { key: 'Ctrl / ⌘ + F',         desc: 'Focus search' },
    { key: 'Ctrl / ⌘ + Enter',     desc: 'Save form / row' },
    { key: 'Enter',                 desc: 'Add item (in add-row inputs)' },
    { key: 'Escape',                desc: 'Cancel edit / close modal' },
    { key: 'Tab',                   desc: 'Move to next field' },
    { key: 'Backspace',             desc: 'Navigate back (when not editing)' },
  ];

  const shortcutRows = shortcuts.map(s => `
    <tr>
      <td><kbd class="about-kbd">${esc(s.key)}</kbd></td>
      <td>${esc(s.desc)}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>About</h2>
      <p class="settings-section-desc">App information, keyboard shortcuts, and help resources.</p>
    </div>

    <div class="about-card">
      <div class="about-app-name">Tidyco Operations Portal</div>
      <p class="about-app-desc">
        A web-based APQP quality tool covering NPI project management, capacity planning,
        production scheduling, and operations oversight. Data is stored securely in Supabase
        and shared in real time across all users in your organisation.
      </p>
      ${typeof showGuide === 'function' ? `
        <button class="btn btn-primary" data-action="settings-about-open-guide">📖 Open User Guide</button>
      ` : ''}
    </div>

    <div class="settings-section-header" style="margin-top:24px">
      <h2 style="font-size:1rem">Keyboard Shortcuts</h2>
    </div>
    <table class="prod-tbl about-shortcuts-table" style="width:100%;max-width:560px">
      <thead>
        <tr><th>Keys</th><th>Action</th></tr>
      </thead>
      <tbody>${shortcutRows}</tbody>
    </table>

    <div class="settings-section-header" style="margin-top:24px">
      <h2 style="font-size:1rem">Support</h2>
    </div>
    <p style="font-size:0.88rem;color:var(--mid)">
      For help or to report issues, use the
      <strong>💬 Feedback &amp; Bugs</strong> button in the top bar.
    </p>
  `;
}


function setupSettingsEventListeners() {
  const root = document.getElementById('settingsPortalRoot');
  if (!root || settingsEventListenerRoot === root) return;
  settingsEventListenerRoot = root;

  root.addEventListener('click', async (event) => {
    // Skip native form controls — selects/inputs handle their own events via 'change'.
    // Intercepting their click can cause the browser dropdown to close immediately.
    const tag = event.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

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
      const tabMap = {
        families: 'settingsFamiliesTab',
        'work-areas': 'settingsWorkAreasTab',
        teams: 'settingsTeamsTab',
        permissions: 'settingsPermissionsTab',
        'role-definitions': 'settingsRoleDefinitionsTab',
        appearance: 'settingsAppearanceTab',
        about: 'settingsAboutTab',
      };
      document.getElementById(tabMap[tab])?.classList.add('active');
      if (tab === 'families') {
        renderSettingsFamiliesTab();
        settingsEnsureFamiliesData();
      } else if (tab === 'work-areas') {
        renderSettingsWorkAreasTab();
        settingsEnsureWorkAreasData();
      } else if (tab === 'teams') {
        renderSettingsTeamsTab();
        settingsEnsureTeamsData();
      } else if (tab === 'permissions') {
        renderSettingsPermissionsTab();
        settingsEnsurePermissionsData();
      } else if (tab === 'role-definitions') {
        renderSettingsRoleDefinitionsTab();
      } else if (tab === 'appearance') {
        renderSettingsAppearanceTab();
      } else if (tab === 'about') {
        renderSettingsAboutTab();
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

    // Teams tab actions
    if (action === 'settings-teams-retry') { settingsEnsureTeamsData(true); return; }
    if (action === 'settings-teams-add') { await settingsTeamsAdd(); return; }
    if (action === 'settings-teams-edit') { await settingsTeamsEdit(actionEl.dataset.teamId || ''); return; }
    if (action === 'settings-teams-delete') { await settingsTeamsDelete(actionEl.dataset.teamId || ''); return; }
    if (action === 'settings-teams-permissions-save') { await settingsTeamsPermissionsSave(); return; }
    if (action === 'settings-teams-permissions-cancel') { settingsTeamsPermissionsCancel(); return; }
    if (action === 'settings-teams-permission-toggle') { settingsTeamsPermissionsToggle(settingsTeamsPermissionsEditingId, actionEl.dataset.permission || ''); return; }

    // Permissions tab actions
    if (action === 'settings-permissions-retry') { settingsEnsurePermissionsData(true); return; }

    // Appearance tab actions
    if (action === 'settings-appearance-save')  { settingsAppearanceSave();  return; }
    if (action === 'settings-appearance-reset') { settingsAppearanceReset(); return; }

    // About tab actions
    if (action === 'settings-about-open-guide') {
      if (typeof showGuide === 'function') showGuide('hub');
      return;
    }
  });

  // Role dropdowns and checkboxes fire 'change', not 'click' — handle separately to prevent the
  // dropdown from closing the instant it opens (click fires before the user picks).
  root.addEventListener('change', async (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !root.contains(actionEl)) return;
    const action = actionEl.dataset.action;

    if (action === 'settings-permissions-change-role') {
      await settingsPermissionsChangeRole(actionEl.dataset.userId || '', actionEl.value, actionEl.dataset.isLastAdmin === 'true');
      return;
    }

    if (action === 'settings-teams-permission-toggle') {
      settingsTeamsPermissionsToggle(settingsTeamsPermissionsEditingId, actionEl.dataset.permission || '');
      return;
    }
  });
}
