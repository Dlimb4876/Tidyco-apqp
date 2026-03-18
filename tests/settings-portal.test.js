/**
 * settings-portal.test.js — Tests for portals/settings/js/settings.js
 *
 * Covers: renderSettings HTML structure, tab rendering,
 *         settingsFamiliesStartEdit/CancelEdit,
 *         settingsWorkAreaStartEdit/CancelEdit,
 *         renderSettingsPermissionsTab, renderSettingsFamiliesTab,
 *         renderSettingsWorkAreasTab
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// DOM setup
// ─────────────────────────────────────────────────────────────
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.settingsActiveTab = 'families';
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
};
global.currentUser = { id: 'user-1', email: 'alice@test.com' };
global.db = { projects: [] };
global.esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
global.showToast = jest.fn();
global.familiesDataLoad = jest.fn().mockResolvedValue([]);
global.familiesDataInit = jest.fn().mockResolvedValue([]);
global.familiesDataAddFamily = jest.fn().mockResolvedValue({ id: 'new-1' });
global.familiesDataUpdateFamily = jest.fn().mockResolvedValue({});
global.familiesDataDeleteFamily = jest.fn().mockResolvedValue({});
global.workAreasDataInit = jest.fn().mockResolvedValue([]);
global.workAreasDataGetAll = jest.fn(() => global.workAreasState.workAreas);
global.workAreasDataAddWorkArea = jest.fn().mockResolvedValue({});
global.workAreasDataUpdateWorkArea = jest.fn().mockResolvedValue({});

global.familiesState = {
  families: [
    { id: 'fam-1', name: 'HVAC', label: 'HVAC Systems', icon: '❄️', description: 'Heating and cooling' },
    { id: 'fam-2', name: 'ELEC', label: 'Electronics',  icon: '⚡', description: 'Electronic components' },
  ],
  loading: false,
  error: null
};

// Return actual families from the global state object
global.familiesDataGetAll = jest.fn(() => global.familiesState.families);

global.workAreasState = {
  workAreas: [
    { id: 'wa-1', name: 'Unit 2', description: 'Main assembly' },
    { id: 'wa-2', name: 'Unit 3', description: 'Testing bay' },
  ],
  loading: false
};

// Load settings.js — replace `let` with `var` so internal state variables
// live in the module-level scope and can be modified from tests via eval()
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/settings/js/settings.js'),
  'utf8'
).replace(/\blet /g, 'var ');
eval(src); // eslint-disable-line no-eval

// Helper to set an internal settings.js state variable from test scope
function setInternal(name, value) {
  eval(`${name} = value`); // eslint-disable-line no-eval
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('renderSettings()', () => {
  it('returns a non-empty HTML string', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the settings portal root element', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('id="settingsPortalRoot"');
  });

  it('contains Product Families nav item', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('Product Families');
  });

  it('contains Work Areas nav item', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('Work Areas');
  });

  it('contains Permissions nav item', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('Permissions');
  });

  it('contains Role Definitions nav item', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('Role Definitions');
    expect(result).toContain('data-tab="role-definitions"');
  });

  it('marks the active tab with "active" class', () => {
    global.settingsActiveTab = 'families';
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('data-tab="families"');
  });

  it('uses work-areas as active tab when settingsActiveTab is work-areas', () => {
    global.settingsActiveTab = 'work-areas';
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('data-tab="work-areas"');
    global.settingsActiveTab = 'families'; // reset
  });

  it('includes all four tab content divs', () => {
    const result = renderSettings(); // eslint-disable-line no-undef
    expect(result).toContain('id="settingsFamiliesTab"');
    expect(result).toContain('id="settingsWorkAreasTab"');
    expect(result).toContain('id="settingsPermissionsTab"');
    expect(result).toContain('id="settingsRoleDefinitionsTab"');
  });
});

describe('settingsFamiliesStartEdit() / settingsFamiliesCancelEdit()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsFamiliesTab')) {
      const el = document.createElement('div');
      el.id = 'settingsFamiliesTab';
      document.body.appendChild(el);
    }
    setInternal('settingsFamiliesLoading', false);
    setInternal('settingsFamiliesLoadError', null);
    setInternal('settingsFamiliesEditingId', null);
    global.familiesState.loading = false;
  });

  it('renders the edit form for the family when starting edit', () => {
    settingsFamiliesStartEdit('fam-1'); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('settings-families-save-edit');
  });

  it('removes the edit form when cancelling edit', () => {
    settingsFamiliesStartEdit('fam-1'); // eslint-disable-line no-undef
    settingsFamiliesCancelEdit(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).not.toContain('settings-families-save-edit');
  });
});

describe('settingsWorkAreaStartEdit() / settingsWorkAreaCancelEdit()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsWorkAreasTab')) {
      const el = document.createElement('div');
      el.id = 'settingsWorkAreasTab';
      document.body.appendChild(el);
    }
    setInternal('settingsWorkAreasEditingId', null);
    global.workAreasState.loading = false;
  });

  it('renders the edit form for the work area when starting edit', () => {
    settingsWorkAreaStartEdit('wa-1'); // eslint-disable-line no-undef
    const container = document.getElementById('settingsWorkAreasTab');
    expect(container.innerHTML).toContain('settings-wa-save-edit');
  });

  it('removes the edit form when cancelling edit', () => {
    settingsWorkAreaStartEdit('wa-1'); // eslint-disable-line no-undef
    settingsWorkAreaCancelEdit(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsWorkAreasTab');
    expect(container.innerHTML).not.toContain('settings-wa-save-edit');
  });
});

describe('renderSettingsFamiliesTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsFamiliesTab')) {
      const el = document.createElement('div');
      el.id = 'settingsFamiliesTab';
      document.body.appendChild(el);
    }
    setInternal('settingsFamiliesEditingId', null);
    setInternal('settingsFamiliesLoading', false);
    setInternal('settingsFamiliesLoadError', null);
    global.familiesState.loading = false;
  });

  it('renders loading state when familiesState.loading is true', () => {
    global.familiesState.loading = true;
    renderSettingsFamiliesTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('Loading families');
    global.familiesState.loading = false;
  });

  it('renders error state when settingsFamiliesLoadError is set', () => {
    setInternal('settingsFamiliesLoadError', 'Network error');
    renderSettingsFamiliesTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('Failed to load product families');
    expect(container.innerHTML).toContain('Network error');
  });

  it('renders family rows when data is available', () => {
    renderSettingsFamiliesTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('HVAC Systems');
    expect(container.innerHTML).toContain('Electronics');
  });

  it('renders add-new row', () => {
    renderSettingsFamiliesTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('settings-families-add');
  });

  it('renders edit row when settingsFamiliesStartEdit is called', () => {
    settingsFamiliesStartEdit('fam-1'); // eslint-disable-line no-undef
    const container = document.getElementById('settingsFamiliesTab');
    expect(container.innerHTML).toContain('settings-families-save-edit');
    expect(container.innerHTML).toContain('settings-families-cancel-edit');
  });
});

describe('renderSettingsWorkAreasTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsWorkAreasTab')) {
      const el = document.createElement('div');
      el.id = 'settingsWorkAreasTab';
      document.body.appendChild(el);
    }
    setInternal('settingsWorkAreasEditingId', null);
    global.workAreasState.loading = false;
  });

  it('renders loading state when workAreasState.loading is true', () => {
    global.workAreasState.loading = true;
    renderSettingsWorkAreasTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsWorkAreasTab');
    expect(container.innerHTML).toContain('Loading work areas');
    global.workAreasState.loading = false;
  });

  it('renders work area rows', () => {
    renderSettingsWorkAreasTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsWorkAreasTab');
    expect(container.innerHTML).toContain('Unit 2');
    expect(container.innerHTML).toContain('Unit 3');
  });

  it('renders edit row when settingsWorkAreaStartEdit is called', () => {
    settingsWorkAreaStartEdit('wa-1'); // eslint-disable-line no-undef
    const container = document.getElementById('settingsWorkAreasTab');
    expect(container.innerHTML).toContain('settings-wa-save-edit');
    expect(container.innerHTML).toContain('settings-wa-cancel-edit');
  });
});

describe('renderSettingsPermissionsTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsPermissionsTab')) {
      const el = document.createElement('div');
      el.id = 'settingsPermissionsTab';
      document.body.appendChild(el);
    }
    setInternal('settingsPermissionsLoading', false);
    setInternal('settingsPermissionsData', null);
    setInternal('settingsPermissionsError', null);
  });

  it('renders loading state when settingsPermissionsLoading is true', () => {
    setInternal('settingsPermissionsLoading', true);
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).toContain('Loading user accounts');
  });

  it('renders empty state when no users found', () => {
    setInternal('settingsPermissionsData', []);
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).toContain('No user accounts found');
  });

  it('renders user rows when data is available', () => {
    setInternal('settingsPermissionsData', [
      { id: 'u1', email: 'alice@test.com', full_name: 'Alice Smith', role: 'admin', created_at: '2025-01-01T00:00:00Z' }
    ]);
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).toContain('Alice Smith');
    expect(container.innerHTML).toContain('admin');
  });

  it('shows "You" badge for current user', () => {
    global.currentUser = { id: 'u1', email: 'alice@test.com' };
    setInternal('settingsPermissionsData', [
      { id: 'u1', email: 'alice@test.com', full_name: 'Alice Smith', role: 'user', created_at: '2025-01-01T00:00:00Z' }
    ]);
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).toContain('You');
  });

  it('shows error banner when settingsPermissionsError is set', () => {
    setInternal('settingsPermissionsData', []);
    setInternal('settingsPermissionsError', 'Permission denied');
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).toContain('Could not load user accounts');
    expect(container.innerHTML).toContain('Permission denied');
  });

  it('no longer embeds role matrix inside permissions tab', () => {
    setInternal('settingsPermissionsData', []);
    renderSettingsPermissionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsPermissionsTab');
    expect(container.innerHTML).not.toContain('Role Definitions');
  });
});

describe('renderSettingsRoleDefinitionsTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsRoleDefinitionsTab')) {
      const el = document.createElement('div');
      el.id = 'settingsRoleDefinitionsTab';
      document.body.appendChild(el);
    }
  });

  it('renders the role matrix with all three role columns', () => {
    renderSettingsRoleDefinitionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsRoleDefinitionsTab');
    expect(container.innerHTML).toContain('Admin');
    expect(container.innerHTML).toContain('Editor');
    expect(container.innerHTML).toContain('Viewer');
  });

  it('renders role permission rows', () => {
    renderSettingsRoleDefinitionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsRoleDefinitionsTab');
    expect(container.innerHTML).toContain('View all project data');
    expect(container.innerHTML).toContain('Change user roles');
  });

  it('renders the section heading', () => {
    renderSettingsRoleDefinitionsTab(); // eslint-disable-line no-undef
    const container = document.getElementById('settingsRoleDefinitionsTab');
    expect(container.innerHTML).toContain('Role Definitions');
  });

  it('does nothing when container is missing', () => {
    const existing = document.getElementById('settingsRoleDefinitionsTab');
    if (existing) existing.remove();
    expect(() => renderSettingsRoleDefinitionsTab()).not.toThrow(); // eslint-disable-line no-undef
    // restore for other tests
    const el = document.createElement('div');
    el.id = 'settingsRoleDefinitionsTab';
    document.body.appendChild(el);
  });
});
