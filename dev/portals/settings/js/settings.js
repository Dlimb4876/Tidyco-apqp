// ═══════════════════════════════════════════════════════════════
// settings.js — Global Settings Portal
// Depends on: state.js, helpers.js, navigation.js,
//             families-data.js, work-areas-data.js
// ═══════════════════════════════════════════════════════════════

import { appState, db } from '../../../core/js/state.js'
import { esc, showToast, canEdit, emptyState } from '../../../utils/js/helpers.js'
import { render } from '../../../utils/js/navigation.js'
import {
  familiesState,
  familiesDataInit,
  familiesDataGetAll,
  familiesDataAddFamily,
  familiesDataUpdateFamily,
  familiesDataDeleteFamily
} from '../../product-development/js/families-data.js'
import {
  workAreasState,
  workAreasDataInit,
  workAreasDataGetAll,
  workAreasDataAddWorkArea,
  workAreasDataUpdateWorkArea
} from '../../capacity/production/js/work-areas-data.js'
import {
  renderSettingsGateQuestionsTab,
  settingsEnsureGateQuestionsData,
  settingsGateQuestionsCancelAdd,
  settingsGateQuestionsCancelEdit,
  settingsGateQuestionsConfirmAdd,
  settingsGateQuestionsDelete,
  settingsGateQuestionsSaveEdit,
  settingsGateQuestionsStartAdd,
  settingsGateQuestionsStartEdit
} from './settings-gate-questions.js'
import {
  renderSettingsMcsTab,
  settingsEnsureMcsData,
  settingsMcsAddApprover,
  settingsMcsAddGateSignoff,
  settingsMcsRemoveApprover,
  settingsMcsRemoveGateSignoff
} from './settings-mcs.js'
import {
  renderSettingsPermissionsTab,
  renderSettingsTeamsTab,
  settingsEnsurePermissionsData,
  settingsEnsureTeamsData,
  settingsPermissionsChangeRole,
  settingsPermissionsChangeTeam,
  settingsTeamsAdd,
  settingsTeamsDelete,
  settingsTeamsEdit,
  settingsTeamsPermissionsCancel,
  settingsTeamsPermissionsSave,
  settingsTeamsPermissionsToggle
} from './settings-teams.js'

let settingsEventListenerRoot = null;
let settingsFamiliesEditingId = null;
let settingsFamiliesLoading = false;
let settingsFamiliesLoadError = null;
let settingsWorkAreasEditingId = null;
let settingsPermissionsLoading = false;
let settingsPermissionsData = null;
let settingsPermissionsError = null;
let settingsPermissionsTeams = [];
let settingsTeamsPermissionsData = {};

// ── Appearance preferences (persisted to localStorage) ─────────
const APPEARANCE_STORAGE_KEY = 'tidyco_prefs';
const SETTINGS_CORE_STATE_KEYS = new Set([
  'settingsFamiliesEditingId',
  'settingsFamiliesLoading',
  'settingsFamiliesLoadError',
  'settingsWorkAreasEditingId',
  'settingsPermissionsLoading',
  'settingsPermissionsData',
  'settingsPermissionsError',
  'settingsPermissionsTeams',
  'settingsTeamsPermissionsData',
]);

export function settingsSetCoreState(partial) {
  if (!partial || typeof partial !== 'object') return;
  Object.keys(partial).forEach((key) => {
    if (!SETTINGS_CORE_STATE_KEYS.has(key)) return;
    if (key === 'settingsFamiliesEditingId') settingsFamiliesEditingId = partial[key];
    else if (key === 'settingsFamiliesLoading') settingsFamiliesLoading = partial[key];
    else if (key === 'settingsFamiliesLoadError') settingsFamiliesLoadError = partial[key];
    else if (key === 'settingsWorkAreasEditingId') settingsWorkAreasEditingId = partial[key];
    else if (key === 'settingsPermissionsLoading') settingsPermissionsLoading = partial[key];
    else if (key === 'settingsPermissionsData') settingsPermissionsData = partial[key];
    else if (key === 'settingsPermissionsError') settingsPermissionsError = partial[key];
    else if (key === 'settingsPermissionsTeams') settingsPermissionsTeams = partial[key];
    else if (key === 'settingsTeamsPermissionsData') settingsTeamsPermissionsData = partial[key];
  });
}

export function settingsGetCoreState() {
  return {
    settingsFamiliesEditingId,
    settingsFamiliesLoading,
    settingsFamiliesLoadError,
    settingsWorkAreasEditingId,
    settingsPermissionsLoading,
    settingsPermissionsData,
    settingsPermissionsError,
    settingsPermissionsTeams,
    settingsTeamsPermissionsData,
  };
}

export function settingsLoadingState(msg) {
  if (typeof loadingState === 'function') return loadingState(msg);
  return `<div style="padding:40px;text-align:center;color:var(--muted)">${esc(msg)}</div>`;
}

export function settingsLoadAppearancePrefs() {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function settingsSaveAppearancePrefs(prefs) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch (_) { /* ignore storage errors */ }
}

export function settingsApplyAppearance() {
  const prefs = settingsLoadAppearancePrefs();
  const theme = prefs.theme === 'dark' ? 'dark' : prefs.theme === 'terminal' ? 'terminal' : 'light';

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'terminal' ? 'dark' : theme;

  if (document.body) {
    document.body.classList.toggle('theme-dark', theme === 'dark' || theme === 'terminal');
    document.body.classList.toggle('compact-tables', prefs.tableDensity === 'compact');
  }

  // Organisation / app name in topbar
  const brandName = document.querySelector('.brand-name');
  const brandSub  = document.querySelector('.brand-sub');
  if (brandName) brandName.textContent = prefs.orgName   || 'TIDYCO';
  if (brandSub)  brandSub.textContent  = prefs.appSubtitle || 'Operations Portal';
}

export function settingsAppearanceSetTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : theme === 'terminal' ? 'terminal' : 'light';
  const prefs = settingsLoadAppearancePrefs();
  settingsSaveAppearancePrefs({ ...prefs, theme: nextTheme });
  settingsApplyAppearance();
}

function settingsAppearanceSetDensityCard(root, density) {
  if (!root) return;
  root
    .querySelectorAll('.density-card')
    .forEach((card) => card.classList.remove('selected'));
  const next = root.querySelector(`.density-card input[name="ap-density"][value="${density}"]`);
  if (!next) return;
  next.checked = true;
  next.closest('.density-card')?.classList.add('selected');
}

settingsApplyAppearance();

// ── Main settings page render ──────────────────────────────────
export function renderSettings() {
  const tab = appState.settingsActiveTab || 'families';

  const hydrateSettingsDom = () => {
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
    } else if (tab === 'mcs-approvers') {
      renderSettingsMcsTab();
      settingsEnsureMcsData();
    } else if (tab === 'gate-questions') {
      renderSettingsGateQuestionsTab();
      settingsEnsureGateQuestionsData();
    } else if (tab === 'appearance') {
      renderSettingsAppearanceTab();
    } else if (tab === 'about') {
      renderSettingsAboutTab();
    }
  };

  // Use microtask hydration so handlers attach as soon as settings markup is inserted.
  // This avoids click dead-zones caused by frame throttling where rAF callbacks are delayed.
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(hydrateSettingsDom);
  } else {
    Promise.resolve().then(hydrateSettingsDom);
  }

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
          <button class="settings-nav-item ${tab === 'gate-questions' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="gate-questions">
            <span class="nav-icon">✅</span> Gate Questions
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
          <button class="settings-nav-item ${tab === 'mcs-approvers' ? 'active' : ''}" data-action="settings-switch-tab" data-tab="mcs-approvers">
            <span class="nav-icon">✅</span> Approvals
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
          <div id="settingsGateQuestionsTab"   class="settings-tab-content ${tab === 'gate-questions'   ? 'active' : ''}"></div>
          <div id="settingsTeamsTab"           class="settings-tab-content ${tab === 'teams'            ? 'active' : ''}"></div>
          <div id="settingsPermissionsTab"     class="settings-tab-content ${tab === 'permissions'      ? 'active' : ''}"></div>
          <div id="settingsRoleDefinitionsTab" class="settings-tab-content ${tab === 'role-definitions' ? 'active' : ''}"></div>
          <div id="settingsMcsTab"            class="settings-tab-content ${tab === 'mcs-approvers'    ? 'active' : ''}"></div>
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

// Teams/permissions logic moved to settings-teams.js

// ── Render families tab ───────────────────────────────────────
// Single-row HTML for a family (used for initial render and surgical realtime patches).
// usage is optional — omit or pass -1 to compute from db.projects at call time.
function settingsFamilyRenderRowHTML(f, usage) {
  if (usage === undefined || usage < 0) {
    usage = (db.projects || []).filter(p => (p.family || 'Other') === f.id).length;
  }
  return `
  <tr data-id="${esc(f.id)}">
    <td class="ctr" style="font-size:1.3em">${esc(f.icon || '📋')}</td>
    <td><code style="background:var(--code-bg);padding:2px 6px;border-radius:3px">${esc(f.name || f.id)}</code></td>
    <td><strong>${esc(f.label)}</strong></td>
    <td>${esc(f.description || '—')}</td>
    <td class="ctr"><span class="badge badge-NPI">${usage}</span></td>
    <td class="families-actions-col">
      ${canEdit() ? `<button class="btn-del" title="Edit" data-action="settings-families-start-edit" data-family-id="${esc(f.id)}">✏️</button>
      <button class="btn-del" title="Delete" data-action="settings-families-delete" data-family-id="${esc(f.id)}" data-family-label="${esc(f.label)}">🗑️</button>` : '—'}
    </td>
  </tr>`;
}

// Re-sort families data rows inside #families-tbody alphabetically by label.
function _familiesResortTbody(tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
  rows.sort((a, b) => {
    const na = (a.querySelector('strong')?.textContent || '').trim();
    const nb = (b.querySelector('strong')?.textContent || '').trim();
    return na.localeCompare(nb);
  });
  rows.forEach(r => tbody.appendChild(r));
}

export function renderSettingsFamiliesTab() {
  const container = document.getElementById('settingsFamiliesTab');
  if (!container) return;

  if (settingsFamiliesLoading || familiesState.loading) {
    container.innerHTML = settingsLoadingState('Loading families…');
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
    container.innerHTML = settingsLoadingState('Loading families…');
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
        <tbody id="families-tbody">
          ${canEdit() ? `<tr class="row-new" style="background-color:var(--row-highlight-blue);border-top:2px solid var(--blue)">
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
              <tr class="row-new" style="background-color:var(--row-highlight-amber);border-top:2px solid var(--amber)">
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
            return settingsFamilyRenderRowHTML(f, usage);
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

export function settingsFamiliesStartEdit(familyId) {
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

export function settingsFamiliesCancelEdit() {
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
// Single-row HTML for a work area (used for initial render and surgical realtime patches).
// Must carry data-id on the root element.
function settingsWARenderRowHTML(w) {
  return `
  <tr data-id="${esc(w.id)}">
    <td><strong>${esc(w.name)}</strong></td>
    <td>${esc(w.description || '—')}</td>
    <td class="families-actions-col">
      ${canEdit() ? `<button class="btn-del" title="Rename" data-action="settings-wa-start-edit" data-wa-id="${esc(w.id)}">✏️</button>` : '—'}
    </td>
  </tr>`;
}

// Re-sort data rows inside #wa-tbody alphabetically by name.
function _waResortTbody(tbody) {
  const rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
  rows.sort((a, b) => {
    const na = (a.querySelector('strong')?.textContent || '').trim();
    const nb = (b.querySelector('strong')?.textContent || '').trim();
    return na.localeCompare(nb);
  });
  rows.forEach(r => tbody.appendChild(r));
}

export function renderSettingsWorkAreasTab() {
  const container = document.getElementById('settingsWorkAreasTab');
  if (!container) return;

  if (workAreasState.loading) {
    container.innerHTML = settingsLoadingState('Loading work areas…');
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
        <tbody id="wa-tbody">
          ${canEdit() ? `<tr class="row-new" style="background-color:var(--row-highlight-blue);border-top:2px solid var(--blue)">
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
              <tr class="row-new" style="background-color:var(--row-highlight-amber);border-top:2px solid var(--amber)">
                <td><input class="cell-edit" id="waEdit-name" value="${esc(w.name)}"></td>
                <td><input class="cell-edit" id="waEdit-desc" value="${esc(w.description || '')}"></td>
                <td class="families-actions-col">
                  <button class="btn-del" title="Save" data-action="settings-wa-save-edit" data-wa-id="${esc(w.id)}">✓</button>
                  <button class="btn-del" title="Cancel" data-action="settings-wa-cancel-edit">✕</button>
                </td>
              </tr>`;
            }
            return settingsWARenderRowHTML(w);
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

export function settingsWorkAreaStartEdit(workAreaId) {
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

export function settingsWorkAreaCancelEdit() {
  settingsWorkAreasEditingId = null;
  renderSettingsWorkAreasTab();
}

// ── Derive a display name from an email address prefix ────────
// e.g. daniel.limb@tidyco.co.uk → "Daniel Limb"
export function settingsEmailToName(email) {
  if (!email) return '—';
  const local = email.split('@')[0];
  return local.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// Teams/permissions tab implementation moved to settings-teams.js

// ── Render role definitions tab ────────────────────────────────
export function renderSettingsRoleDefinitionsTab() {
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

  const tick  = `<span style="color:var(--green);font-size:1.1em">✓</span>`;
  const cross = `<span style="color:var(--muted);font-size:1.1em">—</span>`;

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
export function renderSettingsAppearanceTab() {
  const container = document.getElementById('settingsAppearanceTab');
  if (!container) return;

  const prefs = settingsLoadAppearancePrefs();
  const theme       = prefs.theme === 'dark' ? 'dark' : prefs.theme === 'terminal' ? 'terminal' : 'light';
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
      <h3 class="appearance-group-title">Colour theme</h3>
      <p class="appearance-group-desc">Choose whether the portal uses a light or dark colour scheme.</p>
      <div class="appearance-theme-grid">
        <label class="appearance-theme-card ${theme === 'light' ? 'selected' : ''}">
          <input type="radio" name="ap-theme" value="light" ${theme === 'light' ? 'checked' : ''}>
          <span class="appearance-theme-swatch appearance-theme-swatch-light" aria-hidden="true"></span>
          <span class="appearance-theme-copy">
            <strong>Light</strong>
            <span>Bright workspace with dark text.</span>
          </span>
        </label>
        <label class="appearance-theme-card ${theme === 'dark' ? 'selected' : ''}">
          <input type="radio" name="ap-theme" value="dark" ${theme === 'dark' ? 'checked' : ''}>
          <span class="appearance-theme-swatch appearance-theme-swatch-dark" aria-hidden="true"></span>
          <span class="appearance-theme-copy">
            <strong>Dark</strong>
            <span>Lower-glare workspace for darker environments.</span>
          </span>
        </label>
        <label class="appearance-theme-card ${theme === 'terminal' ? 'selected' : ''}">
          <input type="radio" name="ap-theme" value="terminal" ${theme === 'terminal' ? 'checked' : ''}>
          <span class="appearance-theme-swatch appearance-theme-swatch-terminal" aria-hidden="true"></span>
          <span class="appearance-theme-copy">
            <strong>Terminal</strong>
            <span>Phosphor-green on black. Classic.</span>
          </span>
        </label>
      </div>
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
        <div class="density-picker">
          <label class="density-card ${density === 'normal' ? 'selected' : ''}">
            <input type="radio" name="ap-density" value="normal" ${density === 'normal' ? 'checked' : ''}>
            <div class="density-preview">
              <div class="dp-header"><div class="dp-cell dp-cell--wide"></div><div class="dp-cell"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--normal"><div class="dp-cell dp-cell--wide dp-cell--text"></div><div class="dp-cell dp-cell--badge"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--normal"><div class="dp-cell dp-cell--wide dp-cell--text dp-cell--dim"></div><div class="dp-cell dp-cell--badge dp-cell--green"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--normal"><div class="dp-cell dp-cell--wide dp-cell--text"></div><div class="dp-cell dp-cell--badge dp-cell--amber"></div><div class="dp-cell"></div></div>
            </div>
            <span class="density-card-label">Normal</span>
          </label>
          <label class="density-card ${density === 'compact' ? 'selected' : ''}">
            <input type="radio" name="ap-density" value="compact" ${density === 'compact' ? 'checked' : ''}>
            <div class="density-preview">
              <div class="dp-header"><div class="dp-cell dp-cell--wide"></div><div class="dp-cell"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--compact"><div class="dp-cell dp-cell--wide dp-cell--text"></div><div class="dp-cell dp-cell--badge"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--compact"><div class="dp-cell dp-cell--wide dp-cell--text dp-cell--dim"></div><div class="dp-cell dp-cell--badge dp-cell--green"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--compact"><div class="dp-cell dp-cell--wide dp-cell--text"></div><div class="dp-cell dp-cell--badge dp-cell--amber"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--compact"><div class="dp-cell dp-cell--wide dp-cell--text dp-cell--dim"></div><div class="dp-cell dp-cell--badge"></div><div class="dp-cell"></div></div>
              <div class="dp-row dp-row--compact"><div class="dp-cell dp-cell--wide dp-cell--text"></div><div class="dp-cell dp-cell--badge dp-cell--green"></div><div class="dp-cell"></div></div>
            </div>
            <span class="density-card-label">Compact</span>
          </label>
        </div>
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
export function settingsAppearanceSave() {
  const theme       = document.querySelector('input[name="ap-theme"]:checked')?.value       || 'light';
  const orgName     = document.getElementById('ap-orgName')?.value.trim()     || '';
  const appSubtitle = document.getElementById('ap-appSubtitle')?.value.trim() || '';
  const density     = document.querySelector('input[name="ap-density"]:checked')?.value || 'normal';
  const toastDur    = document.querySelector('input[name="ap-toast"]:checked')?.value   || 'normal';

  settingsSaveAppearancePrefs({ theme, orgName, appSubtitle, tableDensity: density, toastDuration: toastDur });
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
export function renderSettingsAboutTab() {
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


// MCS approvals implementation moved to settings-mcs.js

export function setupSettingsEventListeners() {
  const root = document.getElementById('settingsPortalRoot');
  if (!root || settingsEventListenerRoot === root) return;
  settingsEventListenerRoot = root;

  root.addEventListener('click', async (event) => {
    const densityCard = event.target.closest('.density-card');
    if (densityCard && root.contains(densityCard)) {
      const densityInput = densityCard.querySelector('input[name="ap-density"]');
      if (densityInput) settingsAppearanceSetDensityCard(root, densityInput.value);
      return;
    }

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
      appState.settingsActiveTab = tab;
      root.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
      root.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
      actionEl.classList.add('active');
      const tabMap = {
        families: 'settingsFamiliesTab',
        'work-areas': 'settingsWorkAreasTab',
        'gate-questions': 'settingsGateQuestionsTab',
        teams: 'settingsTeamsTab',
        permissions: 'settingsPermissionsTab',
        'role-definitions': 'settingsRoleDefinitionsTab',
        'mcs-approvers': 'settingsMcsTab',
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
      } else if (tab === 'mcs-approvers') {
        renderSettingsMcsTab();
        settingsEnsureMcsData();
      } else if (tab === 'gate-questions') {
        renderSettingsGateQuestionsTab();
        settingsEnsureGateQuestionsData();
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
    if (action === 'settings-teams-permission-toggle') { settingsTeamsPermissionsToggle(appState.settingsTeamsPermissionsEditingId, actionEl.dataset.permission || ''); return; }

    // Permissions tab actions
    if (action === 'settings-permissions-retry') { settingsEnsurePermissionsData(true); return; }

    // MCS approvers tab actions
    if (action === 'settings-mcs-retry') { settingsEnsureMcsData(true); return; }
    if (action === 'settings-mcs-add-approver') { await settingsMcsAddApprover(actionEl.dataset.step || ''); return; }
    if (action === 'settings-mcs-remove-approver') { await settingsMcsRemoveApprover(actionEl.dataset.step || '', actionEl.dataset.userId || ''); return; }
    if (action === 'settings-gate-signoff-add') { await settingsMcsAddGateSignoff(actionEl.dataset.role || ''); return; }
    if (action === 'settings-gate-signoff-remove') { await settingsMcsRemoveGateSignoff(actionEl.dataset.role || '', actionEl.dataset.userId || ''); return; }

    // Gate questions tab actions
    if (action === 'settings-gq-retry')       { settingsEnsureGateQuestionsData(true); return; }
    if (action === 'settings-gq-start-add')   { settingsGateQuestionsStartAdd(actionEl.dataset.gate || 0); return; }
    if (action === 'settings-gq-cancel-add')  { settingsGateQuestionsCancelAdd(); return; }
    if (action === 'settings-gq-confirm-add') { await settingsGateQuestionsConfirmAdd(actionEl.dataset.gate || 0); return; }
    if (action === 'settings-gq-start-edit')  { settingsGateQuestionsStartEdit(actionEl.dataset.id || ''); return; }
    if (action === 'settings-gq-cancel-edit') { settingsGateQuestionsCancelEdit(); return; }
    if (action === 'settings-gq-save-edit')   { await settingsGateQuestionsSaveEdit(actionEl.dataset.id || ''); return; }
    if (action === 'settings-gq-delete')      { await settingsGateQuestionsDelete(actionEl.dataset.id || '', actionEl.dataset.text || ''); return; }

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
    if (event.target.name === 'ap-theme') {
      settingsAppearanceSetTheme(event.target.value);
      root
        .querySelectorAll('.appearance-theme-card')
        .forEach((card) => card.classList.remove('selected'));
      event.target.closest('.appearance-theme-card')?.classList.add('selected');
      return;
    }

    if (event.target.name === 'ap-density') {
      settingsAppearanceSetDensityCard(root, event.target.value);
      return;
    }

    if (!actionEl || !root.contains(actionEl)) return;
    const action = actionEl.dataset.action;

    if (action === 'settings-permissions-change-role') {
      await settingsPermissionsChangeRole(actionEl.dataset.userId || '', actionEl.value, actionEl.dataset.isLastAdmin === 'true');
      return;
    }

    if (action === 'settings-permissions-change-team') {
      await settingsPermissionsChangeTeam(actionEl.dataset.userId || '', actionEl.value || '');
      return;
    }

    if (action === 'settings-teams-permission-toggle') {
      settingsTeamsPermissionsToggle(appState.settingsTeamsPermissionsEditingId, actionEl.dataset.permission || '');
      return;
    }
  });
}
