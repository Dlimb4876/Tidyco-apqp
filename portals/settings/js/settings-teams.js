// ═══════════════════════════════════════════════════════════════
// settings-teams.js — Teams and Permissions tab logic
// Depends on: settings.js (shared helpers), teams-data.js
// ═══════════════════════════════════════════════════════════════

import { appState, currentUserRole } from '../../../core/js/state.js'
import { currentUser, supabase as supa } from '../../../core/js/supa.js'
import { esc, getPermissionDefinitions, isAdmin, showToast, registerProfileDataProvider } from '../../../utils/js/helpers.js'
import {
  settingsEmailToName,
  settingsLoadingState,
  settingsState
} from './settings.js'
import {
  teamPermissionsDataSave,
  teamsDataAdd,
  teamsDataDelete,
  teamsDataGetUserCount,
  teamsDataLoadAll,
  teamsDataLoadAllWithCounts,
  teamsDataLoadPermissions,
  teamsDataLoadUserTeamMap,
  teamsDataSetUserTeam
} from './teams-data.js'

// Wire up profile data provider so helpers.js can build owner dropdowns
registerProfileDataProvider(() => settingsState.settingsPermissionsData)

export function settingsGetPermissionsData() {
  return Array.isArray(settingsState.settingsPermissionsData) ? settingsState.settingsPermissionsData : []
}

// ── Ensure teams data is loaded ──────────────────────────────
export async function settingsEnsureTeamsData(forceReload = false) {
  if (appState.settingsTeamsLoading) return;
  if (!forceReload && appState.settingsTeamsData !== null) return;

  appState.settingsTeamsLoading = true;
  appState.settingsTeamsError = null;
  renderSettingsTeamsTab();

  try {
    appState.settingsTeamsData = await teamsDataLoadAllWithCounts()
  }catch (err) {
    appState.settingsTeamsError = err?.message || 'Failed to load teams';
    appState.settingsTeamsData = [];
  } finally {
    appState.settingsTeamsLoading = false;
    renderSettingsTeamsTab();
  }
}

// ── Ensure permissions data is loaded ─────────────────────────
export async function settingsEnsurePermissionsData(forceReload = false) {
  if (settingsState.settingsPermissionsLoading) return;
  if (!forceReload && settingsState.settingsPermissionsData !== null) return;

  settingsState.settingsPermissionsLoading = true;
  settingsState.settingsPermissionsError = null;
  renderSettingsPermissionsTab();

  try {
    const [{ data: profiles, error }, teams, teamMap] = await Promise.all([
      supa.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: true }),
      teamsDataLoadAll(),
      teamsDataLoadUserTeamMap()
    ]);

    if (error) throw error;

    settingsState.settingsPermissionsTeams = Array.isArray(teams) ? teams : [];
    settingsState.settingsPermissionsData = (profiles || []).map((user) => {
      const assignment = teamMap?.[user.id] || null;
      return {
        ...user,
        team_id: assignment?.teamId || '',
        team_name: assignment?.teamName || ''
      };
    });
  } catch (err) {
    settingsState.settingsPermissionsError = err?.message || 'Failed to load user accounts';
    settingsState.settingsPermissionsData = [];
    settingsState.settingsPermissionsTeams = [];
  } finally {
    settingsState.settingsPermissionsLoading = false;
    renderSettingsPermissionsTab();
  }
}

// ── Change a user's role ───────────────────────────────────────
export async function settingsPermissionsChangeRole(userId, newRole, isLastAdmin) {
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
    if (settingsState.settingsPermissionsData) {
      const rec = settingsState.settingsPermissionsData.find(u => u.id === userId);
      if (rec) rec.role = newRole;
    }
    showToast('Role updated. Change takes effect on that user\'s next login.', 'info');
    renderSettingsPermissionsTab();
  } catch (err) {
    showToast('Failed to update role: ' + err.message, 'error');
    settingsEnsurePermissionsData(true);
  }
}

// ── Change a user's team assignment ────────────────────────────
export async function settingsPermissionsChangeTeam(userId, teamId) {
  if (!isAdmin()) { showToast('Only admins can change team assignments.', 'error'); return; }
  if (!userId) return

  try {
    const nextTeamId = teamId || '';
    const success = await teamsDataSetUserTeam(userId, nextTeamId);
    if (!success) {
      showToast('Failed to update team assignment', 'error');
      return;
    }

    if (settingsState.settingsPermissionsData) {
      const rec = settingsState.settingsPermissionsData.find((u) => u.id === userId);
      const teamRec = settingsState.settingsPermissionsTeams.find((t) => t.id === nextTeamId);
      if (rec) {
        rec.team_id = nextTeamId;
        rec.team_name = teamRec?.name || '';
      }
    }

    showToast('Team assignment updated.', 'success');
    renderSettingsPermissionsTab();
  } catch (err) {
    showToast('Failed to update team assignment: ' + err.message, 'error');
    settingsEnsurePermissionsData(true);
  }
}

// ── Render teams tab ───────────────────────────────────────────
export function renderSettingsTeamsTab() {
  const container = document.getElementById('settingsTeamsTab');
  if (!container) return;

  if (appState.settingsTeamsLoading) {
    container.innerHTML = settingsLoadingState('Loading teams…');
    return;
  }

  if (appState.settingsTeamsError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load teams</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(appState.settingsTeamsError)}</div>
        <button class="btn btn-ghost" data-action="settings-teams-retry">Retry</button>
      </div>
    `;
    return;
  }

  const teams = appState.settingsTeamsData || [];
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
export async function settingsTeamsAdd() {
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
    appState.settingsTeamsData.push(newTeam);
    showToast('Team created successfully', 'success');
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error creating team: ' + err.message, 'error');
  }
}

export async function settingsTeamsDelete(teamId) {
  if (!teamId) return;

  const team = appState.settingsTeamsData.find(t => t.id === teamId);
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

    appState.settingsTeamsData = appState.settingsTeamsData.filter(t => t.id !== teamId);
    showToast('Team deleted', 'success');
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error deleting team: ' + err.message, 'error');
  }
}

export async function settingsTeamsEdit(teamId) {
  if (!teamId) return;

  appState.settingsTeamsPermissionsEditingId = teamId;
  try {
    const savedPermissions = await teamsDataLoadPermissions(teamId);
    const definitions = settingsGetTeamPermissionDefinitions();
    
    // Initialize ALL permissions with allowed: false, then override with saved values
    const allPermissions = definitions.map(def => {
      const saved = savedPermissions.find(p => p.permission === def.key);
      return {
        permission: def.key,
        allowed: saved ? saved.allowed : false
      };
    });
    
    settingsState.settingsTeamsPermissionsData[teamId] = allPermissions;
    renderSettingsTeamsPermissionsEditor();
  } catch (err) {
    showToast('Failed to load permissions: ' + err.message, 'error');
  }
}

export async function settingsTeamsPermissionsSave() {
  const teamId = appState.settingsTeamsPermissionsEditingId;
  if (!teamId) return;

  const permissions = settingsState.settingsTeamsPermissionsData[teamId] || [];
  try {
    const success = await teamPermissionsDataSave(teamId, permissions);
    if (!success) {
      showToast('Failed to save permissions', 'error');
      return;
    }

    showToast('Permissions saved', 'success');
    appState.settingsTeamsPermissionsEditingId = null;
    settingsEnsureTeamsData(true);
    renderSettingsTeamsTab();
  } catch (err) {
    showToast('Error saving permissions: ' + err.message, 'error');
  }
}

export function settingsTeamsPermissionsCancel() {
  appState.settingsTeamsPermissionsEditingId = null;
  renderSettingsTeamsTab();
}

export function settingsTeamsPermissionsToggle(teamId, permission) {
  if (!settingsState.settingsTeamsPermissionsData[teamId]) return;
  const perm = settingsState.settingsTeamsPermissionsData[teamId].find(p => p.permission === permission);
  if (perm) {
    perm.allowed = !perm.allowed;
  } else {
    settingsState.settingsTeamsPermissionsData[teamId].push({ permission, allowed: true });
  }
  renderSettingsTeamsPermissionsEditor();
}

export function settingsGetTeamPermissionDefinitions() {
  return getPermissionDefinitions().map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description || '',
    group: def.group || 'Other'
  }))
}

// ── Render permissions editor ──────────────────────────────────
export function renderSettingsTeamsPermissionsEditor() {
  const teamId = appState.settingsTeamsPermissionsEditingId;
  if (!teamId) return;

  const team = appState.settingsTeamsData.find(t => t.id === teamId);
  if (!team) return;

  const permissions = settingsState.settingsTeamsPermissionsData[teamId] || [];
  const definitions = settingsGetTeamPermissionDefinitions();

  let permRows = '';
  let activeGroup = '';
  definitions.forEach(({ key, label, description, group }) => {
    if (group !== activeGroup) {
      activeGroup = group;
      permRows += `
        <tr>
          <td colspan="2" style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;background:var(--bg-alt)">${esc(group)}</td>
        </tr>
      `;
    }

    const perm = permissions.find(p => p.permission === key);
    const isAllowed = perm?.allowed || false;
    permRows += `
      <tr>
        <td>
          <div class="settings-permission-copy">
            <div class="settings-permission-label">${esc(label)}</div>
            ${description ? `<div class="settings-permission-desc">${esc(description)}</div>` : ''}
          </div>
        </td>
        <td style="text-align:center">
          <input type="checkbox" ${isAllowed ? 'checked' : ''}
                 data-action="settings-teams-permission-toggle"
                 data-permission="${esc(key)}"
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
      <p class="settings-section-desc">Configure what this team can do in the system. Each permission includes a short description of the access it gives.</p>
    </div>
    <table class="prod-tbl" style="width:100%;margin-bottom:16px">
      <thead>
        <tr>
          <th>Permission</th>
          <th style="width:80px;text-align:center" title="Check to allow this permission for the team">Allow?</th>
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
export function renderSettingsPermissionsTab() {
  const container = document.getElementById('settingsPermissionsTab');
  if (!container) return;

  if (settingsState.settingsPermissionsLoading) {
    container.innerHTML = settingsLoadingState('Loading user accounts…');
    return;
  }

  const users = settingsState.settingsPermissionsData || [];
  const teams = settingsState.settingsPermissionsTeams || [];
  const currentEmail = currentUser?.email || '';

  const adminCount = users.filter(u => (u.role || 'editor') === 'admin').length;
  const viewerIsAdmin = isAdmin();

  let tableBody = '';
  if (users.length === 0 && !settingsState.settingsPermissionsError) {
    tableBody = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No user accounts found.</td></tr>`;
  } else {
    tableBody = users.map(u => {
      const isYou = u.email === currentEmail;
      const name = esc(u.full_name || settingsEmailToName(u.email));
      const email = esc(u.email || '—');
      const role = u.role || 'editor';
      const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '—';
      const isLastAdmin = role === 'admin' && adminCount <= 1;
      const teamId = u.team_id || '';
      const teamName = u.team_name || 'Unassigned';

      const teamCell = viewerIsAdmin
        ? `<select class="cell-edit" style="width:180px" data-action="settings-permissions-change-team" data-user-id="${esc(u.id)}">
            <option value="">Unassigned</option>
            ${teams.map((team) => `<option value="${esc(team.id)}" ${team.id === teamId ? 'selected' : ''}>${esc(team.name)}</option>`).join('')}
          </select>`
        : `<span class="permissions-badge">${esc(teamName)}</span>`;

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
        <td>${teamCell}</td>
        <td>${joined}</td>
      </tr>`;
    }).join('');
  }

  const errorBanner = settingsState.settingsPermissionsError ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:var(--status-red-bg);border:1px solid var(--red);border-radius:6px;font-size:0.82rem;color:var(--red)">
      Could not load user accounts: ${esc(settingsState.settingsPermissionsError)}
      <button class="btn btn-ghost" style="margin-left:12px;font-size:0.8rem;padding:2px 8px" data-action="settings-permissions-retry">Retry</button>
    </div>
  ` : '';

  const adminNote = viewerIsAdmin
    ? `<div class="permissions-notice" style="background:var(--status-blue-bg);border-color:var(--blue)">
        <strong>Admin tip:</strong> Use the dropdowns to assign role and team grants. Role changes take effect on next login, team grants apply immediately.
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
          <th>Team</th>
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
