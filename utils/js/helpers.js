// ═══════════════════════════════════
// helpers.js — Escaping, UI utils, and modal helpers
// ═══════════════════════════════════

import { appState, currentUserRole, currentUserPermissions } from '../../core/js/state.js';
import { save } from '../../core/js/db.js';
import { navigate } from './navigation.js';

// ── Permission helpers ─────────────────────────────────────────
export const HYBRID_PERMISSION_DEFINITIONS = [
  { key: 'portal_hub_view', label: 'Access Hub', description: 'Lets the user open the main hub and use its shortcut cards.', group: 'Portal access' },
  { key: 'portal_projects_view', label: 'Access Projects and APQP pages', description: 'Lets the user open project records and APQP working pages.', group: 'Portal access' },
  { key: 'portal_capacity_view', label: 'Access Capacity portal', description: 'Lets the user open the capacity planning area.', group: 'Portal access' },
  { key: 'portal_capacity_production_view', label: 'Access Capacity - Production', description: 'Lets the user open the Production stream inside Capacity.', group: 'Portal access' },
  { key: 'portal_capacity_me_view', label: 'Access Capacity - ME', description: 'Lets the user open the Manufacturing Engineering stream inside Capacity.', group: 'Portal access' },
  { key: 'portal_capacity_projects_view', label: 'Access Capacity - Project Management', description: 'Lets the user open the Project Management stream inside Capacity.', group: 'Portal access' },
  { key: 'portal_capacity_logistics_view', label: 'Access Capacity - Logistics', description: 'Lets the user open the Logistics stream inside Capacity.', group: 'Portal access' },
  { key: 'portal_capacity_unit6_view', label: 'Access Capacity - Unit 6', description: 'Lets the user open the Unit 6 stream inside Capacity.', group: 'Portal access' },
  { key: 'portal_operations_view', label: 'Access Operations portal', description: 'Lets the user open operations dashboards and views.', group: 'Portal access' },
  { key: 'portal_production_view', label: 'Access Production portal', description: 'Lets the user open production schedules and production views.', group: 'Portal access' },
  { key: 'portal_production_scheduling_view', label: 'Access Production - Schedule', description: 'Lets the user open the Schedule page inside Production.', group: 'Portal access' },
  { key: 'portal_production_by_product_view', label: 'Access Production - Plan by Product', description: 'Lets the user open the Plan by Product page inside Production.', group: 'Portal access' },
  { key: 'portal_production_by_unit_view', label: 'Access Production - Plan by Work Area', description: 'Lets the user open the Plan by Work Area page inside Production.', group: 'Portal access' },
  { key: 'portal_product_development_view', label: 'Access Product Development portal', description: 'Lets the user open product development and NPI pages.', group: 'Portal access' },
  { key: 'portal_product_development_npi_view', label: 'Access Product Development - NPI Projects', description: 'Lets the user open the NPI Projects page inside Product Development.', group: 'Portal access' },
  { key: 'portal_product_development_product_management_view', label: 'Access Product Development - Product Management', description: 'Lets the user open the Product Management page inside Product Development.', group: 'Portal access' },
  { key: 'portal_product_development_product_family_db_view', label: 'Access Product Development - Product Family Database', description: 'Lets the user open the Product Family Database page inside Product Development.', group: 'Portal access' },
  { key: 'portal_product_development_parts_database_view', label: 'Access Product Development - Parts Database', description: 'Lets the user open the Parts Database page inside Product Development.', group: 'Portal access' },
  { key: 'portal_action_centre_view', label: 'Access Action Centre', description: 'Lets the user open the Action Centre and review tracked actions.', group: 'Portal access' },
  { key: 'portal_feedback_view', label: 'Access Feedback portal', description: 'Lets the user open the feedback and bug reporting area.', group: 'Portal access' },
  { key: 'portal_mcs_view', label: 'Access Manufacturing Change', description: 'Lets the user open manufacturing change records and workflows.', group: 'Portal access' },
  { key: 'portal_settings_view', label: 'Access Settings portal', description: 'Lets the user open the Settings area.', group: 'Portal access' },
  { key: 'feature_view_all_project_data', label: 'View all project data', description: 'Lets the user see project records, schedules, and related planning data.', group: 'Features' },
  { key: 'feature_edit_projects_tasks_schedules', label: 'Edit projects, tasks and schedules', description: 'Lets the user change project details, task lists, and schedule information.', group: 'Features' },
  { key: 'feature_add_delete_records', label: 'Add and delete records', description: 'Lets the user create new records and remove existing ones.', group: 'Features' },
  { key: 'feature_manage_families', label: 'Manage product families', description: 'Lets the user add, edit, and organise product family records.', group: 'Features' },
  { key: 'feature_manage_work_areas', label: 'Manage work areas', description: 'Lets the user maintain production work areas and their settings.', group: 'Features' },
  { key: 'feature_manage_capacity', label: 'Manage capacity planning', description: 'Lets the user update capacity teams, loads, and planning settings.', group: 'Features' },
  { key: 'feature_manage_user_roles', label: 'Change user roles and team assignments', description: 'Lets the user change another user\'s role or team assignment.', group: 'Features' },
  { key: 'feature_access_settings', label: 'Edit Settings content', description: 'Lets the user change editable content inside the Settings portal.', group: 'Features' },
  { key: 'feature_mcs_approve', label: 'Approve or reject manufacturing changes', description: 'Lets the user complete MCS approval decisions.', group: 'Features' },
  { key: 'feature_npi_signoff_me_manager', label: 'Sign off NPI gates as ME Manager', description: 'Lets the user complete NPI gate sign-off as the ME Manager approver.', group: 'Features' },
  { key: 'feature_npi_signoff_operations_director', label: 'Sign off NPI gates as Operations Director', description: 'Lets the user complete NPI gate sign-off as the Operations Director approver.', group: 'Features' },
  { key: 'feature_npi_signoff_sales_director', label: 'Sign off NPI gates as Sales Director', description: 'Lets the user complete NPI gate sign-off as the Sales Director approver.', group: 'Features' },
  { key: 'field_settings_permissions_edit', label: 'Edit role and team assignment fields', description: 'Lets the user use the dropdown fields on the Permissions page.', group: 'Field-level' },
  { key: 'data_scope_global', label: 'Global data scope', description: 'Gives access to the shared data set used across the portal.', group: 'Data scope' }
];

export const LEGACY_TEAM_PERMISSION_MAP = {
  view_all_project_data: 'feature_view_all_project_data',
  edit_projects_tasks_schedules: 'feature_edit_projects_tasks_schedules',
  add_delete_records: 'feature_add_delete_records',
  manage_families: 'feature_manage_families',
  manage_work_areas: 'feature_manage_work_areas',
  manage_capacity: 'feature_manage_capacity',
  manage_user_roles: 'feature_manage_user_roles',
  access_settings: 'feature_access_settings'
};

export const SECTION_VIEW_PERMISSION_MAP = {
  hub: 'portal_hub_view',
  projects: 'portal_projects_view',
  project: 'portal_projects_view',
  apqp: 'portal_projects_view',
  actions: 'portal_projects_view',
  risks: 'portal_projects_view',
  bom: 'portal_projects_view',
  timing: 'portal_projects_view',
  documents: 'portal_projects_view',
  capacity: 'portal_capacity_view',
  operations: 'portal_operations_view',
  production: 'portal_production_view',
  'product-development': 'portal_product_development_view',
  'action-centre': 'portal_action_centre_view',
  feedback: 'portal_feedback_view',
  mcs: 'portal_mcs_view',
  settings: 'portal_settings_view'
};

export const SECTION_EDIT_PERMISSION_MAP = {
  settings: 'feature_access_settings',
  capacity: 'feature_manage_capacity',
  mcs: 'feature_mcs_approve',
  project: 'feature_edit_projects_tasks_schedules',
  apqp: 'feature_edit_projects_tasks_schedules',
  actions: 'feature_edit_projects_tasks_schedules',
  risks: 'feature_edit_projects_tasks_schedules',
  bom: 'feature_edit_projects_tasks_schedules',
  timing: 'feature_edit_projects_tasks_schedules',
  documents: 'feature_edit_projects_tasks_schedules'
};

export const PORTAL_TAB_VIEW_PERMISSION_MAP = {
  'capacity::production': 'portal_capacity_production_view',
  'capacity::me': 'portal_capacity_me_view',
  'capacity::projects': 'portal_capacity_projects_view',
  'capacity::logistics': 'portal_capacity_logistics_view',
  'capacity::unit6': 'portal_capacity_unit6_view',
  'production::scheduling': 'portal_production_scheduling_view',
  'production::by-product': 'portal_production_by_product_view',
  'production::by-unit': 'portal_production_by_unit_view',
  'product-development::npi': 'portal_product_development_npi_view',
  'product-development::product-management': 'portal_product_development_product_management_view',
  'product-development::product-family-db': 'portal_product_development_product_family_db_view',
  'product-development::parts-database': 'portal_product_development_parts_database_view'
};

export function getPermissionDefinitions() {
  return HYBRID_PERMISSION_DEFINITIONS.slice();
}

export function normalizePermissionKey(permissionKey) {
  if (!permissionKey) return '';
  return LEGACY_TEAM_PERMISSION_MAP[permissionKey] || permissionKey;
}

export function getRoleBaselinePermissions(role) {
  const viewer = {
    portal_hub_view: true,
    portal_projects_view: true,
    portal_capacity_view: true,
    portal_capacity_production_view: true,
    portal_capacity_me_view: true,
    portal_capacity_projects_view: true,
    portal_capacity_logistics_view: true,
    portal_capacity_unit6_view: true,
    portal_operations_view: true,
    portal_production_view: true,
    portal_production_scheduling_view: true,
    portal_production_by_product_view: true,
    portal_production_by_unit_view: true,
    portal_product_development_view: true,
    portal_product_development_npi_view: true,
    portal_product_development_product_management_view: true,
    portal_product_development_product_family_db_view: true,
    portal_product_development_parts_database_view: true,
    portal_action_centre_view: true,
    portal_feedback_view: true,
    portal_mcs_view: true,
    feature_view_all_project_data: true,
    data_scope_global: true
  };

  const editor = {
    ...viewer,
    portal_settings_view: true,
    feature_edit_projects_tasks_schedules: true,
    feature_add_delete_records: true,
    feature_manage_families: true,
    feature_manage_work_areas: true,
    feature_manage_capacity: true,
    feature_access_settings: true,
    feature_mcs_approve: true,
    field_settings_permissions_edit: true
  };

  if (role === 'viewer') return viewer;
  if (role === 'admin') {
    return {
      ...editor,
      feature_manage_user_roles: true
    };
  }

  // Default legacy behavior remains editor-capable to avoid lockouts.
  return editor;
}

export function getEffectivePermissionMap() {
  const baseline = getRoleBaselinePermissions(typeof currentUserRole === 'undefined' ? null : currentUserRole);
  const resolved = { ...baseline };
  const source = (typeof currentUserPermissions === 'object' && currentUserPermissions) ? currentUserPermissions : null;
  if (!source) return resolved;

  Object.keys(source).forEach((rawKey) => {
    const key = normalizePermissionKey(rawKey);
    resolved[key] = !!source[rawKey];
  });

  return resolved;
}

export function isAdmin() {
  return typeof currentUserRole !== 'undefined' && currentUserRole === 'admin';
}

export function hasPermission(permissionKey) {
  const key = normalizePermissionKey(permissionKey);
  if (!key) return false;
  if (isAdmin()) return true;
  const resolved = getEffectivePermissionMap();
  return !!resolved[key];
}

export function canViewSection(sectionKey) {
  const permissionKey = SECTION_VIEW_PERMISSION_MAP[sectionKey];
  if (!permissionKey) return true;
  return hasPermission(permissionKey);
}

export function getPortalTabViewPermission(sectionKey, tabKey) {
  if (!sectionKey || !tabKey || tabKey === 'root') return '';
  return PORTAL_TAB_VIEW_PERMISSION_MAP[`${sectionKey}::${tabKey}`] || '';
}

export function hasConfiguredPortalTabPolicy(sectionKey) {
  const source = (typeof currentUserPermissions === 'object' && currentUserPermissions)
    ? currentUserPermissions
    : null;
  if (!source || !sectionKey) return false;

  const prefix = `${sectionKey}::`;
  const tabPermissionKeys = Object.keys(PORTAL_TAB_VIEW_PERMISSION_MAP)
    .filter((pageKey) => pageKey.startsWith(prefix))
    .map((pageKey) => PORTAL_TAB_VIEW_PERMISSION_MAP[pageKey]);

  if (tabPermissionKeys.length === 0) return false;

  // Treat tab policy as configured only when at least one child grant is enabled.
  // This keeps legacy parent-only permission sets working during migration.
  return tabPermissionKeys.some((permissionKey) => {
    const rawKey = Object.keys(source).find((k) => normalizePermissionKey(k) === permissionKey);
    return !!(rawKey && source[rawKey]);
  });
}

export function canViewPortalTab(sectionKey, tabKey) {
  if (!sectionKey) return false;
  if (!canViewSection(sectionKey)) return false;
  const permissionKey = getPortalTabViewPermission(sectionKey, tabKey);
  if (!permissionKey) return true;

  if (hasPermission(permissionKey)) return true;

  // Backward compatibility: if no child tab policy is configured yet,
  // inherit access from the parent portal grant.
  if (!hasConfiguredPortalTabPolicy(sectionKey)) return true;

  return false;
}

export function canViewPageKey(pageKey) {
  const key = String(pageKey || '').trim();
  if (!key) return false;
  if (!key.includes('::')) return canViewSection(key);

  const [sectionKey, tabKey] = key.split('::');
  return canViewPortalTab(sectionKey, tabKey);
}

// Returns true if the current user can create, edit, or delete data.
// Backward-compatible: canEdit() with no argument keeps legacy behavior.
export function canEdit(scopeKey = '') {
  if (!scopeKey) {
    return (typeof currentUserRole !== 'undefined') && (currentUserRole === 'admin' || currentUserRole === 'editor');
  }

  if (SECTION_EDIT_PERMISSION_MAP[scopeKey]) {
    return hasPermission(SECTION_EDIT_PERMISSION_MAP[scopeKey]);
  }

  if (scopeKey.startsWith('feature_') || scopeKey.startsWith('field_') || scopeKey.startsWith('portal_')) {
    return hasPermission(scopeKey);
  }

  return (typeof currentUserRole !== 'undefined') && (currentUserRole === 'admin' || currentUserRole === 'editor');
}

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function emptyState(icon, title, desc) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div></div>`;
}

export function loadingState(msg = 'Loading...') {
  return `<div class="loading-state">${esc(msg)}</div>`;
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  // Clear picker state to prevent carry-over between opens
  if (id === 'modalCtqPick') {
    appState.ctqPickTarget = null;
    appState.ctqPickSelected = [];
  } else if (id === 'modalBomPick') {
    appState.bomPickTarget = null;
    appState.bomPickSelected = [];
    appState.bomPickFilter = 'all';
  } else if (id === 'modalKitPick') {
    appState.kitPickTarget = null;
    appState.kitPickSelected = [];
    appState.kitPickFilter = 'all';
  }
}

export function showModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  // 1.1 Auto-focus first input in modal
  setTimeout(() => {
    const firstInput = el.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) firstInput.focus();
  }, 50);
}
// Helper to sort Process Flow steps by their step number
export function sortedPfd(pfd) {
  return [...pfd].sort((a, b) => a.stepNum - b.stepNum);
}
// js/utils/helpers.js

/**
 * Shared utility to calculate RPN (Risk Priority Number).
 * Required by dashboard.js, apqp.js, and pfmea.js.
 */
export function calcRPN(r) {
  return (r.sev || 1) * (r.occ || 1) * (r.det || 1);
}

// Preserve typing continuity when an input-triggered action re-renders UI.
export function preserveInputCaretAfterRender(inputEl, rerenderFn, options = {}) {
  if (typeof rerenderFn !== 'function') return;

  const selectionStart = inputEl && typeof inputEl.selectionStart === 'number'
    ? inputEl.selectionStart
    : null;
  const selectionEnd = inputEl && typeof inputEl.selectionEnd === 'number'
    ? inputEl.selectionEnd
    : selectionStart;

  rerenderFn();

  if (!inputEl) return;

  const delay = Number.isFinite(options.delayMs) ? options.delayMs : 0;
  setTimeout(() => {
    const scope = typeof options.scopeResolver === 'function'
      ? options.scopeResolver()
      : (options.scope || document);
    const replacement = typeof options.findReplacement === 'function'
      ? options.findReplacement(scope)
      : (options.replacementSelector && scope && typeof scope.querySelector === 'function'
        ? scope.querySelector(options.replacementSelector)
        : null);
    if (!replacement) return;

    replacement.focus();

    if (selectionStart === null || typeof replacement.setSelectionRange !== 'function') return;

    const len = (replacement.value || '').length;
    const safeStart = Math.max(0, Math.min(selectionStart, len));
    const safeEnd = Math.max(safeStart, Math.min(selectionEnd === null ? safeStart : selectionEnd, len));
    replacement.setSelectionRange(safeStart, safeEnd);
  }, delay);
}


export function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ── 1.3 Toast Notifications ───────────────────────────────────
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${esc(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── 1.10 Keyboard Shortcuts ───────────────────────────────────
export function isInputFocused() {
  const active = document.activeElement;
  return active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.tagName === 'SELECT' ||
    active.isContentEditable
  );
}

document.addEventListener('keydown', function(e) {
  const key = String(e.key || '').toLowerCase();
  const hasModifier = !!(e.ctrlKey || e.metaKey);

  if ((e.key === '?' && !isInputFocused()) ||
      (hasModifier && key === '/')) {
    e.preventDefault();
    showModal('shortcutsModal');
    return;
  }

  // Save current work when supported by the active screen.
  if (hasModifier && key === 's') {
    e.preventDefault();
    save();
    return;
  }

  // Focus the most relevant search input in the current view.
  if (hasModifier && key === 'f') {
    const search = document.querySelector(
      'input[type="search"], input[id*="search" i], input[name*="search" i], input[placeholder*="search" i], .search-input'
    );
    if (search) {
      e.preventDefault();
      search.focus();
      if (typeof search.select === 'function') search.select();
    }
    return;
  }

  // Close any visible modal with Escape.
  if (key === 'escape') {
    const openModal = document.querySelector('.modal-bg[style*="display: flex"], .modal-bg[style*="display:flex"], .modal-bg[style*="display: block"], .modal-bg[style*="display:block"]');
    if (openModal && openModal.id) {
      e.preventDefault();
      closeModal(openModal.id);
    }
  }

  // Return to portal (hub) with P key.
  if (key === 'p' && !isInputFocused()) {
    if (isEditableElement(e.target)) return;
    const openModal = document.querySelector('.modal-bg[style*="display: flex"], .modal-bg[style*="display:flex"], .modal-bg[style*="display: block"], .modal-bg[style*="display:block"]');
    if (openModal) return;
    e.preventDefault();
    navigate('hub');
  }
});

// ── 1.11 Smart Date Entry Helper ──────────────────────────────
export function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export function parseSmartDate(input) {
  if (!input) return null;
  const today = new Date();
  const lower = input.toLowerCase().trim();

  if (lower === 'today') return formatDateISO(today);
  if (lower === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return formatDateISO(t);
  }
  if (lower === 'next week') {
    const t = new Date(today);
    t.setDate(t.getDate() + 7);
    return formatDateISO(t);
  }

  const relMatch = lower.match(/^\+(\d+)(d|w|m)$/);
  if (relMatch) {
    const num = parseInt(relMatch[1]);
    const unit = relMatch[2];
    const t = new Date(today);
    if (unit === 'd') t.setDate(t.getDate() + num);
    if (unit === 'w') t.setDate(t.getDate() + num * 7);
    if (unit === 'm') t.setMonth(t.getMonth() + num);
    return formatDateISO(t);
  }

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIdx = days.indexOf(lower);
  if (dayIdx >= 0) {
    const t = new Date(today);
    const currentDay = t.getDay();
    const daysUntil = (dayIdx - currentDay + 7) % 7 || 7;
    t.setDate(t.getDate() + daysUntil);
    return formatDateISO(t);
  }

  return null;
}

export function setupSmartDateInputs() {
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (input.hasAttribute('data-smart-date')) return;
    input.setAttribute('data-smart-date', '');
    input.addEventListener('blur', (e) => {
      const parsed = parseSmartDate(e.target.value);
      if (parsed) {
        e.target.value = parsed;
        e.target.style.backgroundColor = 'var(--green-pale)';
        setTimeout(() => { e.target.style.backgroundColor = ''; }, 1000);
      }
    });
  });
}

// ── Focus Guard Helper for Inline Editing ─────────────────────
/**
 * Returns true if the user's focus is currently inside a table cell
 * (any input, select, or textarea inside a <table> element).
 * Used by focus-guard logic to defer re-renders that would eject cursor.
 */
export function isEditingInlineCell() {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  const tag = active.tagName;
  return (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA')
    && !!active.closest('table');
}

// ── Owner/person helpers ───────────────────────────────────────
// Derives a display name from an email address prefix.
// e.g. daniel.limb@tidyco.co.uk → "Daniel Limb"
export function emailToDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0];
  return local.split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

// Returns a list of user display names loaded from profiles.
// Falls back gracefully when profiles haven't loaded yet.
export function getProfileNames() {
  if (typeof settingsPermissionsData !== 'undefined' && Array.isArray(settingsPermissionsData)) {
    return settingsPermissionsData.map(u => u.full_name || emailToDisplayName(u.email)).filter(Boolean);
  }
  return [];
}

// Builds <option> tags for an owner <select> from loaded profiles.
// Always includes "— Unassigned —" and preserves any legacy free-text value.
export function ownerSelectOptions(currentOwner) {
  const names = getProfileNames();
  let opts = '<option value="">— Unassigned —</option>';
  if (names.length === 0 && currentOwner) {
    opts += `<option value="${esc(currentOwner)}" selected>${esc(currentOwner)}</option>`;
    return opts;
  }
  names.forEach(name => {
    const sel = name === currentOwner ? ' selected' : '';
    opts += `<option value="${esc(name)}"${sel}>${esc(name)}</option>`;
  });
  // Preserve legacy free-text values that don't match any profile
  if (currentOwner && !names.includes(currentOwner)) {
    opts += `<option value="${esc(currentOwner)}" selected>${esc(currentOwner)}</option>`;
  }
  return opts;
}
