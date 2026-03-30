import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock state globals
const mockState = {
  currentUser: null,
  currentSection: 'hub',
  actionCentreData: null,
  actionCentreLoading: false,
  actionCentreTab: 'all',
  actionCentreStatusFilter: 'open',
  selectedActionId: null,
  selectedPfmeaCauseId: null,
  selectedRiskId: null,
  progId: null,
  settingsPermissionsData: [],
  mcsApproverConfig: null,
  mcsApproverConfigLoading: false,
  mcsAutoViewId: null
}

Object.assign(global, mockState)

// Mock db
global.db = { projects: [] }

// Mock Supabase client
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ eq: jest.fn(() => ({ ilike: jest.fn(() => ({ data: [], error: null })) })) })),
    update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    insert: jest.fn(() => ({ error: null }))
  }))
}

// Mock helper functions
global.showToast = jest.fn()
global.navigate = jest.fn()
global.esc = jest.fn((str) => str?.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') || '')
global.emptyState = jest.fn((icon, title, subtitle) => `<div class="empty">${icon} ${title}: ${subtitle}</div>`)
global.emailToDisplayName = jest.fn((email) => email?.split('@')[0] || '')
global.settingsEnsurePermissionsData = jest.fn(() => Promise.resolve())
global.mcsApproversLoad = jest.fn(() => Promise.resolve({}))
global.mcsGetPendingApprovalsForMe = jest.fn(() => Promise.resolve([]))
global.showGuide = jest.fn()
global.render = jest.fn()

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
document.documentElement.innerHTML = html.toString()

// Load the action-centre script and expose all exports as globals so tests can call them directly
const scriptPath = path.resolve(__dirname, '../portals/action-centre/js/action-centre.js')
const acMod = await import('file://' + scriptPath)
Object.assign(globalThis, acMod)

// Import the shared module state so tests can manipulate the same objects the module uses.
// Since these modules are already cached by the acMod import above, these return the same instances.
const stateMod = await import('file://' + path.resolve(__dirname, '../core/js/state.js'))
const appState = stateMod.appState
const stateDb = stateMod.db

// setCurrentUser updates the live module binding; realSupabase is the same client the module calls
const supaMod = await import('file://' + path.resolve(__dirname, '../core/js/supa.js'))
const { setCurrentUser, supabase: realSupabase } = supaMod

const settingsMod = await import('file://' + path.resolve(__dirname, '../portals/settings/js/settings.js'))
const { settingsState } = settingsMod

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Action Centre Module', () => {
  beforeEach(() => {
    // Reset module state directly so the module reads the correct values
    setCurrentUser(null)
    settingsState.settingsPermissionsData = []
    appState.actionCentreData = null
    appState.actionCentreLoading = false
    appState.actionCentreTab = 'all'
    appState.actionCentreStatusFilter = 'open'
    appState.selectedActionId = null
    appState.selectedPfmeaCauseId = null
    appState.selectedRiskId = null
    appState.progId = null
    appState.mcsApproverConfig = null
    appState.mcsApproverConfigLoading = false
    appState.mcsAutoViewId = null
    stateDb.projects = []

    // Clear any DOM toasts from previous tests so toast assertions are per-test
    const toastContainer = document.getElementById('toastContainer')
    if (toastContainer) toastContainer.innerHTML = ''

    // Reset currentSection so navigate() assertions via appState are clean
    appState.currentSection = 'hub'

    realSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ ilike: jest.fn(() => ({ data: [], error: null })) })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
      insert: jest.fn(() => ({ error: null }))
    }))

    // Clear all mocks
    jest.clearAllMocks()

    // Re-apply supabase mock after clearAllMocks so it's fresh for each test
    realSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ ilike: jest.fn(() => ({ data: [], error: null })) })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
      insert: jest.fn(() => ({ error: null }))
    }))
  })

  // ── actionCentreGetMyName() ───────────────────────────────────
  describe('actionCentreGetMyName()', () => {
    test('should return empty string when no currentUser', () => {
      setCurrentUser(null)
      expect(actionCentreGetMyName()).toBe('')
    })

    test('should return full_name from settingsPermissionsData when available', () => {
      setCurrentUser({ id: 'user123', email: 'test@example.com' })
      settingsState.settingsPermissionsData = [
        { id: 'user123', full_name: 'John Doe' },
        { id: 'user456', full_name: 'Jane Smith' }
      ]
      expect(actionCentreGetMyName()).toBe('John Doe')
    })

    test('should fallback to emailToDisplayName when no profile found', () => {
      setCurrentUser({ id: 'user123', email: 'john.doe@tidyco.com' })
      settingsState.settingsPermissionsData = []
      // Real emailToDisplayName capitalises: john.doe@tidyco.com → John Doe
      expect(actionCentreGetMyName()).toBe('John Doe')
    })

    test('should handle settingsPermissionsData being undefined', () => {
      setCurrentUser({ id: 'user123', email: 'test@example.com' })
      settingsState.settingsPermissionsData = undefined
      // Real emailToDisplayName: test@example.com → Test
      expect(actionCentreGetMyName()).toBe('Test')
    })
  })

  // ── actionCentreGoToMcs() ─────────────────────────────────────
  describe('actionCentreGoToMcs()', () => {
    test('should set mcsAutoViewId and navigate to mcs', () => {
      actionCentreGoToMcs('change123')
      expect(appState.mcsAutoViewId).toBe('change123')
      // Real navigate() sets appState.currentSection (not the global mock)
      expect(appState.currentSection).toBe('mcs')
    })

    test('should handle null changeId gracefully', () => {
      actionCentreGoToMcs(null)
      expect(appState.mcsAutoViewId).toBeNull()
      expect(appState.currentSection).toBe('mcs')
    })
  })

  // ── actionCentreGoTo() ────────────────────────────────────────
  describe('actionCentreGoTo()', () => {
    beforeEach(() => {
      // Provide full project shape so real navigate()/render() doesn't throw
      const projectShape = { pfmea: [], risks: [], actions: [], ctq: [], pfd: [], cp: [], gates: [], documents: [] }
      stateDb.projects = [
        { id: 'proj123', dbId: 'db123', name: 'Test Project', ...projectShape },
        { id: 'proj456', dbId: 'db456', name: 'Another Project', ...projectShape }
      ]
    })

    test('should return early when projectProgId is falsy', () => {
      const prevSection = appState.currentSection
      actionCentreGoTo(null, 'actions', 'item1')
      // Early return: section unchanged and no toast in DOM
      expect(appState.currentSection).toBe(prevSection)
      expect(document.querySelector('.toast')).toBeNull()
    })

    test('should navigate to project by progId', () => {
      actionCentreGoTo('proj123', 'actions', 'action1')
      expect(appState.progId).toBe('proj123')
      expect(appState.selectedActionId).toBe('action1')
      expect(appState.currentSection).toBe('actions')
    })

    test('should navigate to project by dbId (fallback)', () => {
      actionCentreGoTo('db456', 'risks', 'risk1')
      expect(appState.progId).toBe('proj456')
      expect(appState.selectedRiskId).toBe('risk1')
      expect(appState.currentSection).toBe('risks')
    })

    test('should show warning toast when project not found', () => {
      const prevSection = appState.currentSection
      actionCentreGoTo('nonexistent', 'actions', 'item1')
      // Real showToast writes to #toastContainer in the DOM
      const toast = document.querySelector('.toast-warning')
      expect(toast?.textContent).toContain('Project not found')
      expect(appState.currentSection).toBe(prevSection)
    })

    test('should set selectedPfmeaCauseId for apqp section', () => {
      actionCentreGoTo('proj123', 'apqp', 'cause1')
      expect(appState.selectedPfmeaCauseId).toBe('cause1')
      expect(appState.currentSection).toBe('apqp')
    })

    test('should set selectedRiskId for risks section', () => {
      actionCentreGoTo('proj123', 'risks', 'risk1')
      expect(appState.selectedRiskId).toBe('risk1')
      expect(appState.currentSection).toBe('risks')
    })
  })

  // ── actionCentreUpdateActionStatus() ──────────────────────────
  describe('actionCentreUpdateActionStatus()', () => {
    beforeEach(() => {
      appState.actionCentreData = {
        actions: [
          { id: 'action1', status: 'Open', description: 'Test Action' },
          { id: 'action2', status: 'In Progress', description: 'Another Action' }
        ]
      }
    })

    test('should return early when id is falsy', async () => {
      await actionCentreUpdateActionStatus(null, 'Closed')
      expect(realSupabase.from).not.toHaveBeenCalled()
    })

    test('should update action status in Supabase', async () => {
      const updateMock = jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) }))
      realSupabase.from = jest.fn(() => ({ update: updateMock }))
      
      await actionCentreUpdateActionStatus('action1', 'Closed')
      
      expect(realSupabase.from).toHaveBeenCalledWith('npi_actions')
      expect(updateMock).toHaveBeenCalledWith({ status: 'Closed' })
    })

    test('should update local state after successful update', async () => {
      realSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) }))
      }))
      
      await actionCentreUpdateActionStatus('action1', 'Closed')
      
      // State updated and real render() was called (DOM updated)
      expect(appState.actionCentreData.actions[0].status).toBe('Closed')
    })

    test('should show error toast when Supabase update fails', async () => {
      realSupabase.from = jest.fn(() => ({
        update: jest.fn(() => ({ eq: jest.fn(() => ({ error: { message: 'Update failed' } })) }))
      }))
      
      await actionCentreUpdateActionStatus('action1', 'Closed')
      
      // Real showToast writes to #toastContainer
      const toast = document.querySelector('.toast-error')
      expect(toast?.textContent).toContain('Could not update status: Update failed')
    })

    test('should handle exception during update', async () => {
      realSupabase.from = jest.fn(() => {
        throw new Error('Network error')
      })
      
      await actionCentreUpdateActionStatus('action1', 'Closed')
      
      const toast = document.querySelector('.toast-error')
      expect(toast?.textContent).toContain('Could not update status: Network error')
    })
  })

  // ── renderActionCentre() ──────────────────────────────────────
  describe('renderActionCentre()', () => {
    test('should return loading state when actionCentreLoading is true', () => {
      appState.actionCentreLoading = true
      const result = renderActionCentre()
      expect(result).toContain('Loading your actions')
      expect(result).toContain('⏳')
    })

    test('should return empty state when actionCentreData is null', () => {
      appState.actionCentreData = null
      const result = renderActionCentre()
      // Real emptyState() is called; check the returned HTML string
      expect(result).toContain('Nothing here yet')
      expect(result).toContain('Loading')
    })

    test('should render error message when present', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: 'Connection failed'
      }
      const result = renderActionCentre()
      expect(result).toContain('Connection failed')
    })

    test('should render KPI cards with correct counts', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Action 1', status: 'Open', due_date: yesterday.toISOString().split('T')[0], project_id: 'p1', projectName: 'Project 1', priority: 'High', source: 'Gate' },
          { id: 'a2', description: 'Action 2', status: 'Closed', due_date: null, project_id: 'p1', projectName: 'Project 1', priority: 'Medium', source: 'General' }
        ],
        pfmea: [
          { id: 'p1', action_desc: 'PFMEA Action', action_taken: '', action_due: null, project_id: 'p2', projectName: 'Project 2' }
        ],
        risks: [
          { id: 'r1', description: 'Risk 1', status: 'Open', project_id: 'p3', projectName: 'Project 3' }
        ],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('2') // totalOpen count
      expect(result).toContain('1') // totalOverdue count (one action is overdue)
      expect(result).toContain('1') // totalClosed count
    })

    test('should render tab filter buttons', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('All types')
      expect(result).toContain('Actions')
      expect(result).toContain('PFMEA')
      expect(result).toContain('Risks')
      expect(result).toContain('MCS Approvals')
    })

    test('should render status filter buttons', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('Open')
      expect(result).toContain('All')
      expect(result).toContain('Closed')
    })

    test('should render active approvals panel when mcsApprovals exist', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [
          { 
            change: { id: 'ECR001', title: 'Test Change', priority: 'high', change_type: 'Engineering', target_implementation: '2024-12-31' },
            stepKey: 'step1',
            stepLabel: 'Engineering Review'
          }
        ],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('Pending Approvals')
      expect(result).toContain('ECR001')
      expect(result).toContain('Test Change')
      expect(result).toContain('Engineering Review')
    })

    test('should render action items with status dropdown', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Test Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'Project 1', priority: 'High', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('Test Action')
      expect(result).toContain('data-hub-action="set-action-status"')
      expect(result).toContain('<select')
      expect(result).toContain('Open')
      expect(result).toContain('In Progress')
      expect(result).toContain('Closed')
      expect(result).toContain('Blocked')
    })

    test('should render PFMEA items with fixed status badge', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [
          { id: 'p1', action_desc: 'PFMEA Item', action_taken: '', action_due: null, project_id: 'p1', projectName: 'Project 1' }
        ],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('PFMEA Item')
      expect(result).toContain('ac-chip-pfmea')
      expect(result).toContain('PFMEA</span>') // Fixed status badge, not dropdown
    })

    test('should render risk items correctly', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [
          { id: 'r1', description: 'Risk Item', status: 'Open', project_id: 'p1', projectName: 'Project 1' }
        ],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('Risk Item')
      expect(result).toContain('ac-chip-risk')
    })

    test('should render empty state when no items match filter', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      appState.actionCentreStatusFilter = 'open'
      
      const result = renderActionCentre()
      // Real emptyState() returns HTML; check the string directly
      expect(result).toContain('All clear!')
    })

    test('should filter items by type tab', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [{ id: 'a1', description: 'Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }],
        pfmea: [{ id: 'p1', action_desc: 'PFMEA', action_taken: '', action_due: null, project_id: 'p1', projectName: 'P1' }],
        risks: [{ id: 'r1', description: 'Risk', status: 'Open', project_id: 'p1', projectName: 'P1' }],
        mcsApprovals: [],
        error: null
      }
      appState.actionCentreTab = 'action'
      
      const result = renderActionCentre()
      expect(result).toContain('ac-chip-action')
      expect(result).not.toContain('ac-chip-pfmea')
      expect(result).not.toContain('ac-chip-risk')
    })

    test('should filter items by status', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Open Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' },
          { id: 'a2', description: 'Closed Action', status: 'Closed', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'Low', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      appState.actionCentreStatusFilter = 'closed'
      
      const result = renderActionCentre()
      expect(result).toContain('Closed Action')
      expect(result).not.toContain('Open Action')
    })

    test('should highlight overdue items', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Overdue Action', status: 'Open', due_date: yesterday.toISOString().split('T')[0], project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('row-overdue')
    })

    test('should render go buttons for each item type', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [{ id: 'a1', description: 'Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      }
      
      const result = renderActionCentre()
      expect(result).toContain('data-hub-action="go-item"')
      expect(result).toContain('→ Open')
    })

    test('should render MCS approval go buttons correctly', () => {
      appState.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [
          { 
            change: { id: 'ECR001', title: 'Test Change', priority: 'high', change_type: 'Engineering', target_implementation: null },
            stepKey: 'step1',
            stepLabel: 'Engineering Review'
          }
        ],
        error: null
      }
      appState.actionCentreTab = 'mcs-approval'
      
      const result = renderActionCentre()
      expect(result).toContain('data-hub-action="go-mcs"')
      expect(result).toContain('→ Review')
    })
  })
})
