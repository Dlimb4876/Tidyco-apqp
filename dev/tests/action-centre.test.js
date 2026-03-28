const fs = require('fs');
const path = require('path');

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
};

Object.assign(global, mockState);

// Mock db
global.db = { projects: [] };

// Mock Supabase client
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ eq: jest.fn(() => ({ ilike: jest.fn(() => ({ data: [], error: null })) })) })),
    update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    insert: jest.fn(() => ({ error: null }))
  }))
};

// Mock helper functions
global.showToast = jest.fn();
global.navigate = jest.fn();
global.esc = jest.fn((str) => str?.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') || '');
global.emptyState = jest.fn((icon, title, subtitle) => `<div class="empty">${icon} ${title}: ${subtitle}</div>`);
global.emailToDisplayName = jest.fn((email) => email?.split('@')[0] || '');
global.settingsEnsurePermissionsData = jest.fn(() => Promise.resolve());
global.mcsApproversLoad = jest.fn(() => Promise.resolve({}));
global.mcsGetPendingApprovalsForMe = jest.fn(() => Promise.resolve([]));
global.showGuide = jest.fn();
global.render = jest.fn();

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Load the action-centre script
const script = fs.readFileSync(path.resolve(__dirname, '../portals/action-centre/js/action-centre.js'), 'utf8');
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Action Centre Module', () => {
  beforeEach(() => {
    // Reset all state
    global.currentUser = null;
    global.currentSection = 'hub';
    global.actionCentreData = null;
    global.actionCentreLoading = false;
    global.actionCentreTab = 'all';
    global.actionCentreStatusFilter = 'open';
    global.selectedActionId = null;
    global.selectedPfmeaCauseId = null;
    global.selectedRiskId = null;
    global.progId = null;
    global.settingsPermissionsData = [];
    global.mcsApproverConfig = null;
    global.mcsApproverConfigLoading = false;
    global.mcsAutoViewId = null;
    global.db.projects = [];
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  // ── actionCentreGetMyName() ───────────────────────────────────
  describe('actionCentreGetMyName()', () => {
    test('should return empty string when no currentUser', () => {
      global.currentUser = null;
      expect(actionCentreGetMyName()).toBe('');
    });

    test('should return full_name from settingsPermissionsData when available', () => {
      global.currentUser = { id: 'user123', email: 'test@example.com' };
      global.settingsPermissionsData = [
        { id: 'user123', full_name: 'John Doe' },
        { id: 'user456', full_name: 'Jane Smith' }
      ];
      expect(actionCentreGetMyName()).toBe('John Doe');
    });

    test('should fallback to emailToDisplayName when no profile found', () => {
      global.currentUser = { id: 'user123', email: 'john.doe@tidyco.com' };
      global.settingsPermissionsData = [];
      global.emailToDisplayName.mockReturnValue('john.doe');
      expect(actionCentreGetMyName()).toBe('john.doe');
    });

    test('should handle settingsPermissionsData being undefined', () => {
      global.currentUser = { id: 'user123', email: 'test@example.com' };
      global.settingsPermissionsData = undefined;
      global.emailToDisplayName.mockReturnValue('test');
      expect(actionCentreGetMyName()).toBe('test');
    });
  });

  // ── actionCentreGoToMcs() ─────────────────────────────────────
  describe('actionCentreGoToMcs()', () => {
    test('should set mcsAutoViewId and navigate to mcs', () => {
      actionCentreGoToMcs('change123');
      expect(global.mcsAutoViewId).toBe('change123');
      expect(navigate).toHaveBeenCalledWith('mcs');
    });

    test('should handle null changeId gracefully', () => {
      actionCentreGoToMcs(null);
      expect(global.mcsAutoViewId).toBeNull();
      expect(navigate).toHaveBeenCalledWith('mcs');
    });
  });

  // ── actionCentreGoTo() ────────────────────────────────────────
  describe('actionCentreGoTo()', () => {
    beforeEach(() => {
      global.db.projects = [
        { id: 'proj123', dbId: 'db123', name: 'Test Project' },
        { id: 'proj456', dbId: 'db456', name: 'Another Project' }
      ];
    });

    test('should return early when projectProgId is falsy', () => {
      actionCentreGoTo(null, 'actions', 'item1');
      expect(navigate).not.toHaveBeenCalled();
      expect(showToast).not.toHaveBeenCalled();
    });

    test('should navigate to project by progId', () => {
      actionCentreGoTo('proj123', 'actions', 'action1');
      expect(global.progId).toBe('proj123');
      expect(global.selectedActionId).toBe('action1');
      expect(navigate).toHaveBeenCalledWith('actions');
    });

    test('should navigate to project by dbId (fallback)', () => {
      actionCentreGoTo('db456', 'risks', 'risk1');
      expect(global.progId).toBe('proj456');
      expect(global.selectedRiskId).toBe('risk1');
      expect(navigate).toHaveBeenCalledWith('risks');
    });

    test('should show warning toast when project not found', () => {
      actionCentreGoTo('nonexistent', 'actions', 'item1');
      expect(showToast).toHaveBeenCalledWith('Project not found — please refresh the page', 'warning');
      expect(navigate).not.toHaveBeenCalled();
    });

    test('should set selectedPfmeaCauseId for apqp section', () => {
      actionCentreGoTo('proj123', 'apqp', 'cause1');
      expect(global.selectedPfmeaCauseId).toBe('cause1');
      expect(navigate).toHaveBeenCalledWith('apqp');
    });

    test('should set selectedRiskId for risks section', () => {
      actionCentreGoTo('proj123', 'risks', 'risk1');
      expect(global.selectedRiskId).toBe('risk1');
      expect(navigate).toHaveBeenCalledWith('risks');
    });
  });

  // ── actionCentreUpdateActionStatus() ──────────────────────────
  describe('actionCentreUpdateActionStatus()', () => {
    beforeEach(() => {
      global.actionCentreData = {
        actions: [
          { id: 'action1', status: 'Open', description: 'Test Action' },
          { id: 'action2', status: 'In Progress', description: 'Another Action' }
        ]
      };
    });

    test('should return early when id is falsy', async () => {
      await actionCentreUpdateActionStatus(null, 'Closed');
      expect(supa.from).not.toHaveBeenCalled();
    });

    test('should update action status in Supabase', async () => {
      const updateMock = jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) }));
      global.supa.from = jest.fn(() => ({ update: updateMock }));
      
      await actionCentreUpdateActionStatus('action1', 'Closed');
      
      expect(supa.from).toHaveBeenCalledWith('npi_actions');
      expect(updateMock).toHaveBeenCalledWith({ status: 'Closed' });
    });

    test('should update local state after successful update', async () => {
      global.supa.from = jest.fn(() => ({
        update: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) }))
      }));
      
      await actionCentreUpdateActionStatus('action1', 'Closed');
      
      expect(global.actionCentreData.actions[0].status).toBe('Closed');
      expect(render).toHaveBeenCalled();
    });

    test('should show error toast when Supabase update fails', async () => {
      global.supa.from = jest.fn(() => ({
        update: jest.fn(() => ({ eq: jest.fn(() => ({ error: { message: 'Update failed' } })) }))
      }));
      
      await actionCentreUpdateActionStatus('action1', 'Closed');
      
      expect(showToast).toHaveBeenCalledWith('Could not update status: Update failed', 'error');
    });

    test('should handle exception during update', async () => {
      global.supa.from = jest.fn(() => {
        throw new Error('Network error');
      });
      
      await actionCentreUpdateActionStatus('action1', 'Closed');
      
      expect(showToast).toHaveBeenCalledWith('Could not update status: Network error', 'error');
    });
  });

  // ── renderActionCentre() ──────────────────────────────────────
  describe('renderActionCentre()', () => {
    test('should return loading state when actionCentreLoading is true', () => {
      global.actionCentreLoading = true;
      const result = renderActionCentre();
      expect(result).toContain('Loading your actions');
      expect(result).toContain('⏳');
    });

    test('should return empty state when actionCentreData is null', () => {
      global.actionCentreData = null;
      const result = renderActionCentre();
      expect(emptyState).toHaveBeenCalledWith('✅', 'Nothing here yet', 'Loading…');
    });

    test('should render error message when present', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: 'Connection failed'
      };
      const result = renderActionCentre();
      expect(result).toContain('Connection failed');
    });

    test('should render KPI cards with correct counts', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      global.actionCentreData = {
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
      };
      
      const result = renderActionCentre();
      expect(result).toContain('2'); // totalOpen count
      expect(result).toContain('1'); // totalOverdue count (one action is overdue)
      expect(result).toContain('1'); // totalClosed count
    });

    test('should render tab filter buttons', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('All types');
      expect(result).toContain('Actions');
      expect(result).toContain('PFMEA');
      expect(result).toContain('Risks');
      expect(result).toContain('MCS Approvals');
    });

    test('should render status filter buttons', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('Open');
      expect(result).toContain('All');
      expect(result).toContain('Closed');
    });

    test('should render active approvals panel when mcsApprovals exist', () => {
      global.actionCentreData = {
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
      };
      
      const result = renderActionCentre();
      expect(result).toContain('Pending Approvals');
      expect(result).toContain('ECR001');
      expect(result).toContain('Test Change');
      expect(result).toContain('Engineering Review');
    });

    test('should render action items with status dropdown', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Test Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'Project 1', priority: 'High', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('Test Action');
      expect(result).toContain('actionCentreUpdateActionStatus');
      expect(result).toContain('<select');
      expect(result).toContain('Open');
      expect(result).toContain('In Progress');
      expect(result).toContain('Closed');
      expect(result).toContain('Blocked');
    });

    test('should render PFMEA items with fixed status badge', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [
          { id: 'p1', action_desc: 'PFMEA Item', action_taken: '', action_due: null, project_id: 'p1', projectName: 'Project 1' }
        ],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('PFMEA Item');
      expect(result).toContain('ac-chip-pfmea');
      expect(result).toContain('PFMEA</span>'); // Fixed status badge, not dropdown
    });

    test('should render risk items correctly', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [
          { id: 'r1', description: 'Risk Item', status: 'Open', project_id: 'p1', projectName: 'Project 1' }
        ],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('Risk Item');
      expect(result).toContain('ac-chip-risk');
    });

    test('should render empty state when no items match filter', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      global.actionCentreStatusFilter = 'open';
      
      const result = renderActionCentre();
      expect(emptyState).toHaveBeenCalledWith('✅', 'All clear!', 'No open items assigned to you');
    });

    test('should filter items by type tab', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [{ id: 'a1', description: 'Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }],
        pfmea: [{ id: 'p1', action_desc: 'PFMEA', action_taken: '', action_due: null, project_id: 'p1', projectName: 'P1' }],
        risks: [{ id: 'r1', description: 'Risk', status: 'Open', project_id: 'p1', projectName: 'P1' }],
        mcsApprovals: [],
        error: null
      };
      global.actionCentreTab = 'action';
      
      const result = renderActionCentre();
      expect(result).toContain('ac-chip-action');
      expect(result).not.toContain('ac-chip-pfmea');
      expect(result).not.toContain('ac-chip-risk');
    });

    test('should filter items by status', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Open Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' },
          { id: 'a2', description: 'Closed Action', status: 'Closed', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'Low', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      global.actionCentreStatusFilter = 'closed';
      
      const result = renderActionCentre();
      expect(result).toContain('Closed Action');
      expect(result).not.toContain('Open Action');
    });

    test('should highlight overdue items', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [
          { id: 'a1', description: 'Overdue Action', status: 'Open', due_date: yesterday.toISOString().split('T')[0], project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }
        ],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('row-overdue');
    });

    test('should render go buttons for each item type', () => {
      global.actionCentreData = {
        myName: 'John Doe',
        actions: [{ id: 'a1', description: 'Action', status: 'Open', due_date: null, project_id: 'p1', projectName: 'P1', priority: 'High', source: 'Gate' }],
        pfmea: [],
        risks: [],
        mcsApprovals: [],
        error: null
      };
      
      const result = renderActionCentre();
      expect(result).toContain('actionCentreGoTo');
      expect(result).toContain('→ Open');
    });

    test('should render MCS approval go buttons correctly', () => {
      global.actionCentreData = {
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
      };
      global.actionCentreTab = 'mcs-approval';
      
      const result = renderActionCentre();
      expect(result).toContain('actionCentreGoToMcs');
      expect(result).toContain('→ Review');
    });
  });
});
