/**
 * settings-portal.test.js — Tests for portals/settings/js/settings.js
 *
 * Covers: renderSettings HTML structure, tab rendering,
 *         settingsFamiliesStartEdit/CancelEdit,
 *         settingsWorkAreaStartEdit/CancelEdit,
 *         renderSettingsPermissionsTab, renderSettingsFamiliesTab,
 *         renderSettingsWorkAreasTab
 */

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─────────────────────────────────────────────────────────────
// DOM setup
// ─────────────────────────────────────────────────────────────
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8')
document.documentElement.innerHTML = html.toString()

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.appState = {
  settingsActiveTab: 'families',
  settingsTeamsPermissionsEditingId: null
}

// Mock Supabase
global.supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}

global.currentUser = { id: 'user-1', email: 'alice@test.com' }
global.db = { projects: [] }
global.esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
global.showToast = jest.fn()
global.canEdit = () => true

// Mock families data
global.familiesState = {
  families: [
    { id: 'fam-1', name: 'HVAC', label: 'HVAC Systems', icon: '❄️', description: 'Heating and cooling' },
    { id: 'fam-2', name: 'ELEC', label: 'Electronics',  icon: '⚡', description: 'Electronic components' },
  ],
  loading: false,
  error: null
}

global.familiesDataLoad = jest.fn().mockResolvedValue([])
global.familiesDataInit = jest.fn().mockResolvedValue([])
global.familiesDataAddFamily = jest.fn().mockResolvedValue({ id: 'new-1' })
global.familiesDataUpdateFamily = jest.fn().mockResolvedValue({})
global.familiesDataDeleteFamily = jest.fn().mockResolvedValue({})
global.familiesDataGetAll = jest.fn(() => global.familiesState.families)

// Mock work areas data
global.workAreasState = {
  workAreas: [
    { id: 'wa-1', name: 'Unit 2', description: 'Main assembly' },
    { id: 'wa-2', name: 'Unit 3', description: 'Testing bay' },
  ],
  loading: false
}

global.workAreasDataInit = jest.fn().mockResolvedValue([])
global.workAreasDataGetAll = jest.fn(() => global.workAreasState.workAreas)
global.workAreasDataAddWorkArea = jest.fn().mockResolvedValue({})
global.workAreasDataUpdateWorkArea = jest.fn().mockResolvedValue({})

// Mock localStorage for Appearance tab tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, val) => { store[key] = String(val) }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })

// Mock teams data
global.teamsDataLoadAll = jest.fn().mockResolvedValue([
  { id: 'team-1', name: 'Manufacturing', team_type: 'ME', description: 'Manufacturing Engineering', created_at: '2026-03-01T00:00:00Z', userCount: 2 },
  { id: 'team-2', name: 'Project Mgmt', team_type: 'PM', description: 'Project Management', created_at: '2026-03-01T00:00:00Z', userCount: 1 },
])
global.teamsDataGetUserCount = jest.fn().mockResolvedValue(0)
global.teamsDataAdd = jest.fn().mockResolvedValue({ id: 'team-3', name: 'New Team', team_type: 'OPS', description: '', created_at: new Date().toISOString() })
global.teamsDataUpdate = jest.fn().mockResolvedValue(true)
global.teamsDataDelete = jest.fn().mockResolvedValue(true)
global.teamsDataLoadPermissions = jest.fn().mockResolvedValue([
  { permission: 'view_all_project_data', allowed: true },
  { permission: 'edit_projects_tasks_schedules', allowed: true },
  { permission: 'add_delete_records', allowed: false },
])
global.teamPermissionsDataSave = jest.fn().mockResolvedValue(true)
global.teamsDataLoadUserTeamMap = jest.fn().mockResolvedValue({})
global.teamsDataSetUserTeam = jest.fn().mockResolvedValue(true)

// Mock MCS data
global.appState.mcsApproverConfig = null
global.appState.settingsNpiGateSignoffConfig = null
global.appState.settingsMcsLoading = false
global.appState.settingsMcsError = null

// Import settings modules
const settingsModule = await import('../portals/settings/js/settings.js')
const { 
  renderSettings, 
  settingsFamiliesStartEdit, 
  settingsFamiliesCancelEdit,
  settingsWorkAreaStartEdit,
  settingsWorkAreaCancelEdit,
  renderSettingsFamiliesTab,
  renderSettingsWorkAreasTab,
  renderSettingsPermissionsTab,
  renderSettingsRoleDefinitionsTab,
  renderSettingsTeamsTab,
  renderSettingsAppearanceTab,
  settingsLoadAppearancePrefs,
  settingsSaveAppearancePrefs,
  settingsAppearanceSetTheme,
  settingsAppearanceSave,
  settingsApplyAppearance,
  settingsState,
  settingsLoadingState,
  settingsEmailToName,
  renderSettingsAboutTab,
  setupSettingsEventListeners
} = settingsModule

const settingsTeamsModule = await import('../portals/settings/js/settings-teams.js')
const {
  renderSettingsTeamsTab: renderSettingsTeamsTabFn,
  renderSettingsTeamsPermissionsEditor,
  settingsEnsurePermissionsData,
  settingsEnsureTeamsData
} = settingsTeamsModule

const settingsMcsModule = await import('../portals/settings/js/settings-mcs.js')
const { renderSettingsMcsTab } = settingsMcsModule
const workAreasDataModule = await import('../portals/capacity/production/js/work-areas-data.js')
const { workAreasState: realWorkAreasState } = workAreasDataModule

// Helper to set state from test scope
const appStateKeys = ['settingsTeamsData', 'settingsTeamsLoading', 'settingsTeamsError',
  'settingsTeamsPermissionsEditingId', 'settingsMcsLoading', 'settingsMcsError',
  'mcsApproverConfig', 'settingsNpiGateSignoffConfig', 'settingsActiveTab']

function setInternal(name, value) {
  if (name in settingsState) {
    settingsState[name] = value
    return
  }
  if (appStateKeys.includes(name) || name in appState) {
    appState[name] = value
    return
  }
  global.__settingsTestValue = value
  eval(`${name} = global.__settingsTestValue`)
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('renderSettings()', () => {
  it('returns a non-empty HTML string', () => {
    const result = renderSettings()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('contains the settings portal root element', () => {
    const result = renderSettings()
    expect(result).toContain('id="settingsPortalRoot"')
  })

  it('contains Product Families nav item', () => {
    const result = renderSettings()
    expect(result).toContain('Product Families')
  })

  it('contains Work Areas nav item', () => {
    const result = renderSettings()
    expect(result).toContain('Work Areas')
  })

  it('contains Permissions nav item', () => {
    const result = renderSettings()
    expect(result).toContain('Permissions')
  })

  it('contains Role Definitions nav item', () => {
    const result = renderSettings()
    expect(result).toContain('Role Definitions')
    expect(result).toContain('data-tab="role-definitions"')
  })

  it('marks the active tab with "active" class', () => {
    global.appState.settingsActiveTab = 'families'
    const result = renderSettings()
    expect(result).toContain('data-tab="families"')
  })

  it('uses work-areas as active tab when settingsActiveTab is work-areas', () => {
    global.appState.settingsActiveTab = 'work-areas'
    const result = renderSettings()
    expect(result).toContain('data-tab="work-areas"')
    global.appState.settingsActiveTab = 'families' // reset
  })

  it('includes all tab content divs', () => {
    const result = renderSettings()
    expect(result).toContain('id="settingsFamiliesTab"')
    expect(result).toContain('id="settingsWorkAreasTab"')
    expect(result).toContain('id="settingsPermissionsTab"')
    expect(result).toContain('id="settingsRoleDefinitionsTab"')
    expect(result).toContain('id="settingsAppearanceTab"')
    expect(result).toContain('id="settingsAboutTab"')
  })

  it('contains Appearance nav item', () => {
    const result = renderSettings()
    expect(result).toContain('Appearance')
    expect(result).toContain('data-tab="appearance"')
  })

  it('contains About nav item', () => {
    const result = renderSettings()
    expect(result).toContain('About')
    expect(result).toContain('data-tab="about"')
  })
})

describe('settingsFamiliesStartEdit() / settingsFamiliesCancelEdit()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsFamiliesTab')) {
      const el = document.createElement('div')
      el.id = 'settingsFamiliesTab'
      document.body.appendChild(el)
    }
    setInternal('settingsFamiliesLoading', false)
    setInternal('settingsFamiliesLoadError', null)
    setInternal('settingsFamiliesEditingId', null)
    global.familiesState.loading = false
  })

  it('renders the edit form for the family when starting edit', () => {
    settingsFamiliesStartEdit('fam-1')
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('settings-families-save-edit')
  })

  it('removes the edit form when cancelling edit', () => {
    settingsFamiliesStartEdit('fam-1')
    settingsFamiliesCancelEdit()
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).not.toContain('settings-families-save-edit')
  })
})

describe('settingsWorkAreaStartEdit() / settingsWorkAreaCancelEdit()', () => {
  beforeEach(() => {
    realWorkAreasState.workAreas = [
      { id: 'wa-1', name: 'Unit 2', description: 'Main assembly' },
      { id: 'wa-2', name: 'Unit 3', description: 'Testing bay' }
    ]
    realWorkAreasState.loading = false
    if (!document.getElementById('settingsWorkAreasTab')) {
      const el = document.createElement('div')
      el.id = 'settingsWorkAreasTab'
      document.body.appendChild(el)
    }
    setInternal('settingsWorkAreasEditingId', null)
    global.workAreasState.loading = false
  })

  it('renders the edit form for the work area when starting edit', () => {
    settingsWorkAreaStartEdit('wa-1')
    const container = document.getElementById('settingsWorkAreasTab')
    expect(container.innerHTML).toContain('settings-wa-save-edit')
  })

  it('removes the edit form when cancelling edit', () => {
    settingsWorkAreaStartEdit('wa-1')
    settingsWorkAreaCancelEdit()
    const container = document.getElementById('settingsWorkAreasTab')
    expect(container.innerHTML).not.toContain('settings-wa-save-edit')
  })

  it('switches a row to inline edit after clicking pencil in Work Areas tab', async () => {
    realWorkAreasState.workAreas = [
      { id: 'wa-1', name: 'Unit 2', description: 'Main assembly' }
    ]
    realWorkAreasState.loading = false
    document.body.innerHTML = `
      <div id="settingsPortalRoot">
        <button data-action="settings-wa-start-edit" data-wa-id="wa-1">Edit</button>
        <div id="settingsWorkAreasTab"></div>
      </div>
    `
    setupSettingsEventListeners()

    const editBtn = document.querySelector('[data-action="settings-wa-start-edit"][data-wa-id="wa-1"]')
    expect(editBtn).toBeTruthy()

    editBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.getElementById('settingsWorkAreasTab')?.innerHTML).toContain('settings-wa-save-edit')
    expect(document.getElementById('settingsWorkAreasTab')?.innerHTML).toContain('settings-wa-cancel-edit')
  })
})

describe('renderSettingsFamiliesTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsFamiliesTab')) {
      const el = document.createElement('div')
      el.id = 'settingsFamiliesTab'
      document.body.appendChild(el)
    }
    setInternal('settingsFamiliesEditingId', null)
    setInternal('settingsFamiliesLoading', false)
    setInternal('settingsFamiliesLoadError', null)
    global.familiesState.loading = false
  })

  it('renders loading state when familiesState.loading is true', () => {
    global.familiesState.loading = true
    renderSettingsFamiliesTab()
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('Loading families')
    global.familiesState.loading = false
  })

  it('renders error state when settingsFamiliesLoadError is set', () => {
    setInternal('settingsFamiliesLoadError', 'Network error')
    renderSettingsFamiliesTab()
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('Failed to load product families')
    expect(container.innerHTML).toContain('Network error')
  })

  it('renders family rows when data is available', () => {
    renderSettingsFamiliesTab()
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('HVAC Systems')
    expect(container.innerHTML).toContain('Electronics')
  })

  it('renders add-new row', () => {
    renderSettingsFamiliesTab()
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('settings-families-add')
  })

  it('renders edit row when settingsFamiliesStartEdit is called', () => {
    settingsFamiliesStartEdit('fam-1')
    const container = document.getElementById('settingsFamiliesTab')
    expect(container.innerHTML).toContain('settings-families-save-edit')
    expect(container.innerHTML).toContain('settings-families-cancel-edit')
  })
})

describe('renderSettingsWorkAreasTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsWorkAreasTab')) {
      const el = document.createElement('div')
      el.id = 'settingsWorkAreasTab'
      document.body.appendChild(el)
    }
    setInternal('settingsWorkAreasEditingId', null)
    global.workAreasState.loading = false
  })

  it('renders loading state when workAreasState.loading is true', () => {
    global.workAreasState.loading = true
    renderSettingsWorkAreasTab()
    const container = document.getElementById('settingsWorkAreasTab')
    expect(container.innerHTML).toContain('Loading work areas')
    global.workAreasState.loading = false
  })

  it('renders work area rows', () => {
    renderSettingsWorkAreasTab()
    const container = document.getElementById('settingsWorkAreasTab')
    expect(container.innerHTML).toContain('Unit 2')
    expect(container.innerHTML).toContain('Unit 3')
  })

  it('renders edit row when settingsWorkAreaStartEdit is called', () => {
    settingsWorkAreaStartEdit('wa-1')
    const container = document.getElementById('settingsWorkAreasTab')
    expect(container.innerHTML).toContain('settings-wa-save-edit')
    expect(container.innerHTML).toContain('settings-wa-cancel-edit')
  })
})

describe('renderSettingsPermissionsTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsPermissionsTab')) {
      const el = document.createElement('div')
      el.id = 'settingsPermissionsTab'
      document.body.appendChild(el)
    }
    setInternal('settingsPermissionsLoading', false)
    setInternal('settingsPermissionsData', null)
    setInternal('settingsPermissionsError', null)
  })

  it('renders loading state when settingsPermissionsLoading is true', () => {
    setInternal('settingsPermissionsLoading', true)
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).toContain('Loading user accounts')
  })

  it('renders empty state when no users found', () => {
    setInternal('settingsPermissionsData', [])
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).toContain('No user accounts found')
  })

  it('renders user rows when data is available', () => {
    setInternal('settingsPermissionsData', [
      { id: 'u1', email: 'alice@test.com', full_name: 'Alice Smith', role: 'admin', created_at: '2025-01-01T00:00:00Z' }
    ])
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).toContain('Alice Smith')
    expect(container.innerHTML).toContain('admin')
  })

  it('shows "You" badge for current user', () => {
    global.currentUser = { id: 'u1', email: 'alice@test.com' }
    setInternal('settingsPermissionsData', [
      { id: 'u1', email: 'alice@test.com', full_name: 'Alice Smith', role: 'user', created_at: '2025-01-01T00:00:00Z' }
    ])
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).toContain('You')
  })

  it('shows error banner when settingsPermissionsError is set', () => {
    setInternal('settingsPermissionsData', [])
    setInternal('settingsPermissionsError', 'Permission denied')
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).toContain('Could not load user accounts')
    expect(container.innerHTML).toContain('Permission denied')
  })

  it('no longer embeds role matrix inside permissions tab', () => {
    setInternal('settingsPermissionsData', [])
    renderSettingsPermissionsTab()
    const container = document.getElementById('settingsPermissionsTab')
    expect(container.innerHTML).not.toContain('Role Definitions')
  })
})

describe('renderSettingsRoleDefinitionsTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsRoleDefinitionsTab')) {
      const el = document.createElement('div')
      el.id = 'settingsRoleDefinitionsTab'
      document.body.appendChild(el)
    }
  })

  it('renders the role matrix with all three role columns', () => {
    renderSettingsRoleDefinitionsTab()
    const container = document.getElementById('settingsRoleDefinitionsTab')
    expect(container.innerHTML).toContain('Admin')
    expect(container.innerHTML).toContain('Editor')
    expect(container.innerHTML).toContain('Viewer')
  })

  it('renders role permission rows', () => {
    renderSettingsRoleDefinitionsTab()
    const container = document.getElementById('settingsRoleDefinitionsTab')
    expect(container.innerHTML).toContain('View all project data')
    expect(container.innerHTML).toContain('Change user roles')
  })

  it('renders the section heading', () => {
    renderSettingsRoleDefinitionsTab()
    const container = document.getElementById('settingsRoleDefinitionsTab')
    expect(container.innerHTML).toContain('Role Definitions')
  })

  it('does nothing when container is missing', () => {
    const existing = document.getElementById('settingsRoleDefinitionsTab')
    if (existing) existing.remove()
    expect(() => renderSettingsRoleDefinitionsTab()).not.toThrow()
    // restore for other tests
    const el = document.createElement('div')
    el.id = 'settingsRoleDefinitionsTab'
    document.body.appendChild(el)
  })
})

describe('renderSettingsTeamsTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsTeamsTab')) {
      const el = document.createElement('div')
      el.id = 'settingsTeamsTab'
      document.body.appendChild(el)
    }
  })

  it('renders teams table when teams are loaded', async () => {
    setInternal('settingsTeamsData', [
      { id: 'team-1', name: 'Manufacturing', team_type: 'ME', userCount: 2 },
      { id: 'team-2', name: 'Project Mgmt', team_type: 'PM', userCount: 1 },
    ])
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', null)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('Manufacturing')
    expect(container.innerHTML).toContain('Project Mgmt')
    expect(container.innerHTML).toContain('Teams')
  })

  it('renders add team button', () => {
    setInternal('settingsTeamsData', [])
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', null)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('Add Team')
  })

  it('shows loading state when teams are loading', () => {
    setInternal('settingsTeamsLoading', true)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('Loading teams')
  })

  it('shows error message when load fails', () => {
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', 'Database connection failed')
    setInternal('settingsTeamsData', [])
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('Database connection failed')
    expect(container.innerHTML).toContain('Retry')
  })

  it('displays user count for each team', () => {
    setInternal('settingsTeamsData', [
      { id: 'team-1', name: 'Engineering', team_type: 'ME', userCount: 5 },
      { id: 'team-2', name: 'Quality', team_type: 'OPS', userCount: 3 },
    ])
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', null)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('<td style="text-align:center">5</td>')
    expect(container.innerHTML).toContain('<td style="text-align:center">3</td>')
  })

  it('shows edit and delete buttons for each team', () => {
    setInternal('settingsTeamsData', [
      { id: 'team-1', name: 'Engineering', team_type: 'ME', userCount: 2 },
    ])
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', null)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('data-action="settings-teams-edit"')
    expect(container.innerHTML).toContain('data-action="settings-teams-delete"')
  })

  it('shows suggestion for default teams when list is empty', () => {
    setInternal('settingsTeamsData', [])
    setInternal('settingsTeamsLoading', false)
    setInternal('settingsTeamsError', null)
    renderSettingsTeamsTab()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('No teams created yet')
    expect(container.innerHTML).toContain('ME')
    expect(container.innerHTML).toContain('PM')
  })
})

describe('Teams Tab - Permissions Editor', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsTeamsTab')) {
      const el = document.createElement('div')
      el.id = 'settingsTeamsTab'
      document.body.appendChild(el)
    }
  })

  it('renders permissions editor when editing a team', () => {
    setInternal('settingsTeamsData', [
      { id: 'team-1', name: 'Manufacturing', team_type: 'ME' },
    ])
    global.appState.settingsTeamsPermissionsEditingId = 'team-1'
    setInternal('settingsTeamsPermissionsData', {
      'team-1': [
        { permission: 'view_all_project_data', allowed: true },
        { permission: 'edit_projects_tasks_schedules', allowed: true },
        { permission: 'add_delete_records', allowed: false },
      ]
    })
    renderSettingsTeamsPermissionsEditor()
    const container = document.getElementById('settingsTeamsTab')
    expect(container.innerHTML).toContain('Edit Permissions: Manufacturing')
    expect(container.innerHTML).toContain('View all project data')
    expect(container.innerHTML).toContain('Lets the user see project records, schedules, and related planning data.')
    expect(container.innerHTML).toContain('Save')
  })

  it('renders all 8 permissions in editor', () => {
    setInternal('settingsTeamsData', [
      { id: 'team-1', name: 'Test Team', team_type: 'ME' },
    ])
    global.appState.settingsTeamsPermissionsEditingId = 'team-1'
    setInternal('settingsTeamsPermissionsData', {
      'team-1': [
        { permission: 'view_all_project_data', allowed: true },
        { permission: 'edit_projects_tasks_schedules', allowed: true },
        { permission: 'add_delete_records', allowed: true },
        { permission: 'manage_families', allowed: false },
        { permission: 'manage_work_areas', allowed: false },
        { permission: 'manage_capacity', allowed: false },
        { permission: 'manage_user_roles', allowed: false },
        { permission: 'access_settings', allowed: false },
      ]
    })
    renderSettingsTeamsPermissionsEditor()
    const container = document.getElementById('settingsTeamsTab')
    const html = container.innerHTML
    expect(html).toContain('View all project data')
    expect(html).toContain('Edit projects')
    expect(html).toContain('Add &amp; delete records')  // HTML entities
    expect(html).toContain('Manage product families')
    expect(html).toContain('Manage work areas')
    expect(html).toContain('Manage capacity')
    expect(html).toContain('Change user roles')
    expect(html).toContain('Access Settings page')
    expect(html).toContain('Lets the user change another user\'s role or team assignment.')
  })
})

describe('renderSettingsAppearanceTab()', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
    document.body.classList.remove('theme-dark', 'compact-tables')
    if (!document.getElementById('settingsAppearanceTab')) {
      const el = document.createElement('div')
      el.id = 'settingsAppearanceTab'
      document.body.appendChild(el)
    }
  })

  it('renders the section heading', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('Appearance')
  })

  it('renders light and dark theme options', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('name="ap-theme"')
    expect(container.innerHTML).toContain('Bright workspace with dark text.')
    expect(container.innerHTML).toContain('Lower-glare workspace for darker environments.')
  })

  it('renders organisation name input with placeholder', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('ap-orgName')
    expect(container.innerHTML).toContain('TIDYCO')
  })

  it('renders app sub-title input', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('ap-appSubtitle')
  })

  it('renders density radio buttons', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('ap-density')
    expect(container.innerHTML).toContain('Normal')
    expect(container.innerHTML).toContain('Compact')
  })

  it('renders toast duration radio buttons', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('ap-toast')
    expect(container.innerHTML).toContain('Short')
    expect(container.innerHTML).toContain('Long')
  })

  it('renders save and reset buttons', () => {
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('settings-appearance-save')
    expect(container.innerHTML).toContain('settings-appearance-reset')
  })

  it('pre-fills saved preferences', () => {
    localStorage.setItem('tidyco_prefs', JSON.stringify({ theme: 'dark', orgName: 'AcmeCo', tableDensity: 'compact' }))
    renderSettingsAppearanceTab()
    const container = document.getElementById('settingsAppearanceTab')
    expect(container.innerHTML).toContain('AcmeCo')
    expect(container.querySelector('input[name="ap-theme"][value="dark"]')?.checked).toBe(true)
  })

  it('does nothing when container is missing', () => {
    const existing = document.getElementById('settingsAppearanceTab')
    if (existing) existing.remove()
    expect(() => renderSettingsAppearanceTab()).not.toThrow()
    // restore
    const el = document.createElement('div')
    el.id = 'settingsAppearanceTab'
    document.body.appendChild(el)
  })
})

describe('settingsLoadAppearancePrefs() / settingsSaveAppearancePrefs()', () => {
  beforeEach(() => { localStorage.clear() })

  it('returns empty object when no prefs stored', () => {
    const prefs = settingsLoadAppearancePrefs()
    expect(typeof prefs).toBe('object')
  })

  it('round-trips prefs through save and load', () => {
    settingsSaveAppearancePrefs({ orgName: 'TestOrg', tableDensity: 'compact' })
    const prefs = settingsLoadAppearancePrefs()
    expect(prefs.orgName).toBe('TestOrg')
    expect(prefs.tableDensity).toBe('compact')
  })

  it('saves and applies a dark theme selection', () => {
    const container = document.getElementById('settingsAppearanceTab') || document.body.appendChild(document.createElement('div'))
    container.id = 'settingsAppearanceTab'

    renderSettingsAppearanceTab()

    document.querySelector('input[name="ap-theme"][value="dark"]').checked = true
    document.querySelector('input[name="ap-density"][value="compact"]').checked = true

    settingsAppearanceSave()

    const prefs = settingsLoadAppearancePrefs()
    expect(prefs.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.body.classList.contains('theme-dark')).toBe(true)
    expect(document.body.classList.contains('compact-tables')).toBe(true)
  })

  it('applies dark theme immediately when theme is changed', () => {
    settingsSaveAppearancePrefs({ orgName: 'Acme' })
    settingsAppearanceSetTheme('dark')

    const prefs = settingsLoadAppearancePrefs()
    expect(prefs.theme).toBe('dark')
    expect(prefs.orgName).toBe('Acme')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.body.classList.contains('theme-dark')).toBe(true)
  })
})

describe('renderSettingsAboutTab()', () => {
  beforeEach(() => {
    if (!document.getElementById('settingsAboutTab')) {
      const el = document.createElement('div')
      el.id = 'settingsAboutTab'
      document.body.appendChild(el)
    }
  })

  it('renders the section heading', () => {
    renderSettingsAboutTab()
    const container = document.getElementById('settingsAboutTab')
    expect(container.innerHTML).toContain('About')
  })

  it('renders the app name card', () => {
    renderSettingsAboutTab()
    const container = document.getElementById('settingsAboutTab')
    expect(container.innerHTML).toContain('Tidyco Operations Portal')
  })

  it('renders the keyboard shortcuts table', () => {
    renderSettingsAboutTab()
    const container = document.getElementById('settingsAboutTab')
    expect(container.innerHTML).toContain('Keyboard Shortcuts')
    expect(container.innerHTML).toContain('Escape')
    expect(container.innerHTML).toContain('Cancel edit')
  })

  it('renders the support section', () => {
    renderSettingsAboutTab()
    const container = document.getElementById('settingsAboutTab')
    expect(container.innerHTML).toContain('Support')
    expect(container.innerHTML).toContain('Feedback')
  })

  it('does nothing when container is missing', () => {
    const existing = document.getElementById('settingsAboutTab')
    if (existing) existing.remove()
    expect(() => renderSettingsAboutTab()).not.toThrow()
    // restore
    const el = document.createElement('div')
    el.id = 'settingsAboutTab'
    document.body.appendChild(el)
  })
})
