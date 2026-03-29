// ═══════════════════════════════════════════════════════════════
// settings-mcs.js — MCS approvals tab logic
// Depends on: settings.js (shared helpers), mcs approvers data module
// ═══════════════════════════════════════════════════════════════

import { appState, currentUserRole } from '../../../core/js/state.js'
import { esc, isAdmin, showToast } from '../../../utils/js/helpers.js'
import {
  MCS_APPROVAL_STEPS,
  NPI_GATE_SIGNOFF_ROLES,
  mcsApproversAdd,
  mcsApproversLoad,
  mcsApproversRemove,
  npiGateSignoffAdd,
  npiGateSignoffLoad,
  npiGateSignoffRemove
} from '../../mcs/js/mcs-approvers-data.js'
import {
  settingsEmailToName,
  settingsGetCoreState,
  settingsLoadingState
} from './settings.js'
import { settingsEnsurePermissionsData } from './settings-teams.js'

let settingsNpiGateSignoffConfig = null

// ── Ensure approvals data is loaded ───────────────────────────
export async function settingsEnsureMcsData(forceReload = false) {
  if (appState.settingsMcsLoading) return;
  if (!forceReload && appState.mcsApproverConfig !== null && settingsNpiGateSignoffConfig !== null) {
    await settingsEnsurePermissionsData();
    renderSettingsMcsTab();
    return;
  }

  appState.settingsMcsLoading = true;
  appState.settingsMcsError = null;
  renderSettingsMcsTab();

  try {
    await settingsEnsurePermissionsData();
    const [approverConfig, signoffConfig] = await Promise.all([
      mcsApproversLoad(),
      npiGateSignoffLoad(),
    ]);
    appState.mcsApproverConfig = approverConfig;
    settingsNpiGateSignoffConfig = signoffConfig;
    if (!appState.mcsApproverConfig) {
      appState.settingsMcsError = 'Failed to load approver config';
      appState.mcsApproverConfig = null;
    }
  } catch (err) {
    appState.settingsMcsError = err?.message || 'Failed to load';
  } finally {
    appState.settingsMcsLoading = false;
    renderSettingsMcsTab();
  }
}

// ── Render Approvals tab ───────────────────────────────────────
export function renderSettingsMcsTab() {
  const container = document.getElementById('settingsMcsTab');
  if (!container) return;

  if (appState.settingsMcsLoading) {
    container.innerHTML = settingsLoadingState('Loading…');
    return;
  }

  if (appState.settingsMcsError) {
    container.innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:6px;background:var(--white)">
        <div style="font-weight:600;color:var(--red);margin-bottom:8px">Failed to load approvals config</div>
        <div style="color:var(--mid);font-size:13px;margin-bottom:12px">${esc(appState.settingsMcsError)}</div>
        <button class="btn btn-ghost" data-action="settings-mcs-retry">Retry</button>
      </div>`;
    return;
  }

  if (!appState.mcsApproverConfig || !settingsNpiGateSignoffConfig) {
    container.innerHTML = settingsLoadingState('Loading…');
    settingsEnsureMcsData(true);
    return;
  }

  const users = settingsGetCoreState().settingsPermissionsData || [];

  // ── MCS approval steps ────────────────────────────────────────
  const mcsStepsHtml = MCS_APPROVAL_STEPS.map(step => {
    const approvers = appState.mcsApproverConfig[step.key] || [];
    const availableUsers = users.filter(u => !approvers.some(a => a.user_id === u.id));

    const approverRows = approvers.length === 0
      ? `<div style="color:var(--muted);font-size:13px;padding:8px 0">No specific approver assigned — any editor or admin can approve this step.</div>`
      : approvers.map(a => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)">
            <span style="flex:1;font-size:13px">${esc(a.user_name)}</span>
            ${isAdmin() ? `<button class="btn btn-sm btn-ghost" style="color:var(--red)"
              data-action="settings-mcs-remove-approver"
              data-step="${esc(step.key)}"
              data-user-id="${esc(a.user_id)}">Remove</button>` : ''}
          </div>`).join('');

    const addRow = isAdmin() && availableUsers.length > 0 ? `
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
        <select class="cell-edit" id="mcs-add-user-${esc(step.key)}" style="flex:1">
          <option value="">Select user to add…</option>
          ${availableUsers.map(u => `<option value="${esc(u.id)}" data-name="${esc(u.full_name || settingsEmailToName(u.email))}" data-email="${esc(u.email || '')}">${esc(u.full_name || settingsEmailToName(u.email))}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary"
          data-action="settings-mcs-add-approver"
          data-step="${esc(step.key)}">+ Add</button>
      </div>` : '';

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-head">
          <span class="card-title">${esc(step.label)}</span>
          <span class="card-meta">${approvers.length} approver${approvers.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0 16px 12px">
          ${approverRows}
          ${addRow}
        </div>
      </div>`;
  }).join('');

  // ── NPI gate signoff roles ────────────────────────────────────
  const gateStepsHtml = NPI_GATE_SIGNOFF_ROLES.map(role => {
    const assignees = settingsNpiGateSignoffConfig[role.key] || [];
    const availableUsers = users.filter(u => !assignees.some(a => a.user_id === u.id));

    const assigneeRows = assignees.length === 0
      ? `<div style="color:var(--muted);font-size:13px;padding:8px 0">No individual assigned — falls back to team permission.</div>`
      : assignees.map(a => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)">
            <span style="flex:1;font-size:13px">${esc(a.user_name)}</span>
            ${isAdmin() ? `<button class="btn btn-sm btn-ghost" style="color:var(--red)"
              data-action="settings-gate-signoff-remove"
              data-role="${esc(role.key)}"
              data-user-id="${esc(a.user_id)}">Remove</button>` : ''}
          </div>`).join('');

    const addRow = isAdmin() && availableUsers.length > 0 ? `
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
        <select class="cell-edit" id="gate-signoff-add-user-${esc(role.key)}" style="flex:1">
          <option value="">Select user to add…</option>
          ${availableUsers.map(u => `<option value="${esc(u.id)}" data-name="${esc(u.full_name || settingsEmailToName(u.email))}" data-email="${esc(u.email || '')}">${esc(u.full_name || settingsEmailToName(u.email))}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary"
          data-action="settings-gate-signoff-add"
          data-role="${esc(role.key)}">+ Add</button>
      </div>` : '';

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-head">
          <span class="card-title">${esc(role.label)}</span>
          <span class="card-meta">${assignees.length} assignee${assignees.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="padding:0 16px 12px">
          ${assigneeRows}
          ${addRow}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="settings-section-header">
      <h2>Approvals</h2>
      <p class="settings-section-desc">
        Assign individuals to approval and sign-off roles across the system.
      </p>
    </div>
    ${!isAdmin() ? `<div class="permissions-notice">Only admins can change assignments. Your current role is <strong>${esc(currentUserRole || 'editor')}</strong>.</div>` : ''}

    <h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Manufacturing Change Sign-offs</h3>
    <p style="font-size:13px;color:var(--mid);margin:0 0 16px">Assign users to each step in the MCS approval chain. Assigned users will see pending changes in their Action Centre and can approve or reject their step. Each step can have multiple approvers.</p>
    ${mcsStepsHtml}

    <h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:24px 0 8px">NPI Gate Sign-offs</h3>
    <p style="font-size:13px;color:var(--mid);margin:0 0 16px">Assign individuals who can sign off each gate review role. If no individual is assigned, the role falls back to team-based permission.</p>
    ${gateStepsHtml}
  `;
}

// ── MCS approver CRUD ─────────────────────────────────────────
export async function settingsMcsAddApprover(stepKey) {
  if (!isAdmin()) { showToast('Only admins can change approvers.', 'error'); return; }
  const select = document.getElementById(`mcs-add-user-${stepKey}`);
  if (!select || !select.value) return;

  const userId = select.value;
  const option = select.querySelector(`option[value="${userId}"]`);
  const userName = option?.dataset.name || option?.textContent || userId;
  const userEmail = option?.dataset.email || '';

  const ok = await mcsApproversAdd(stepKey, userId, userName, userEmail);
  if (!ok) { showToast('Failed to add approver', 'error'); return; }

  // Update local state
  if (appState.mcsApproverConfig && appState.mcsApproverConfig[stepKey]) {
    const entry = { user_id: userId, user_name: userName };
    if (userEmail) entry.user_email = userEmail;
    appState.mcsApproverConfig[stepKey].push(entry);
  }
  showToast(`${esc(userName)} added as ${stepKey} approver`, 'success');
  renderSettingsMcsTab();
}

export async function settingsMcsRemoveApprover(stepKey, userId) {
  if (!isAdmin()) { showToast('Only admins can change approvers.', 'error'); return; }

  const approver = (appState.mcsApproverConfig?.[stepKey] || []).find(a => a.user_id === userId);
  const name = approver?.user_name || userId;

  if (!confirm(`Remove ${name} as an approver for ${stepKey}?`)) return;

  const ok = await mcsApproversRemove(stepKey, userId);
  if (!ok) { showToast('Failed to remove approver', 'error'); return; }

  if (appState.mcsApproverConfig && appState.mcsApproverConfig[stepKey]) {
    appState.mcsApproverConfig[stepKey] = appState.mcsApproverConfig[stepKey].filter(a => a.user_id !== userId);
  }
  showToast('Approver removed', 'info');
  renderSettingsMcsTab();
}

// ── Gate signoff CRUD ─────────────────────────────────────────
export async function settingsMcsAddGateSignoff(roleKey) {
  if (!isAdmin()) { showToast('Only admins can change assignments.', 'error'); return; }
  const select = document.getElementById(`gate-signoff-add-user-${roleKey}`);
  if (!select || !select.value) return;

  const userId = select.value;
  const option = select.querySelector(`option[value="${userId}"]`);
  const userName = option?.dataset.name || option?.textContent || userId;
  const userEmail = option?.dataset.email || '';

  const ok = await npiGateSignoffAdd(roleKey, userId, userName, userEmail);
  if (!ok) { showToast('Failed to add assignee', 'error'); return; }

  if (settingsNpiGateSignoffConfig) {
    if (!settingsNpiGateSignoffConfig[roleKey]) settingsNpiGateSignoffConfig[roleKey] = [];
    const entry = { user_id: userId, user_name: userName };
    if (userEmail) entry.user_email = userEmail;
    settingsNpiGateSignoffConfig[roleKey].push(entry);
  }
  const role = NPI_GATE_SIGNOFF_ROLES.find(r => r.key === roleKey);
  showToast(`${esc(userName)} added as ${role ? role.label : roleKey} sign-off`, 'success');
  renderSettingsMcsTab();
}

export async function settingsMcsRemoveGateSignoff(roleKey, userId) {
  if (!isAdmin()) { showToast('Only admins can change assignments.', 'error'); return; }

  const assignee = (settingsNpiGateSignoffConfig?.[roleKey] || []).find(a => a.user_id === userId);
  const name = assignee?.user_name || userId;
  const role = NPI_GATE_SIGNOFF_ROLES.find(r => r.key === roleKey);
  const roleLabel = role?.label || roleKey;

  if (!confirm(`Remove ${name} as ${roleLabel} sign-off?`)) return;

  const ok = await npiGateSignoffRemove(roleKey, userId);
  if (!ok) { showToast('Failed to remove assignee', 'error'); return; }

  if (settingsNpiGateSignoffConfig && settingsNpiGateSignoffConfig[roleKey]) {
    settingsNpiGateSignoffConfig[roleKey] = settingsNpiGateSignoffConfig[roleKey].filter(a => a.user_id !== userId);
  }
  showToast('Assignee removed', 'info');
  renderSettingsMcsTab();
}
