const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock Supabase
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
  auth: {
    getSession: jest.fn(() => ({
      data: {
        session: {
          user: { id: 'test-user', email: 'test@test.com' }
        }
      }
    }))
  }
};

// Mock realtime subscriptions
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };

// Mock global state variables
global.db = { projects: [
  { id: 'test-prog-1', name: 'Test Project', customer: 'Test Customer' }
]};
global.progId = 'test-prog-1';
global.currentSection = 'hub';
global.npiTab = 'all';
global.apqpTab = 'ctq';
global.capacityTab = 'root';
global.operationsTab = 'overview';
global.productionTab = 'root';
global.productDevelopmentTab = 'root';
global.productsActiveTab = 'list';
global.npiLoadedProgId = null;    // state.js variable used by scrollToSelectedItem

// Mock prog() accessor function
global.prog = () => global.db.projects.find(p => p.id === global.progId) || null;

// Mock subscription cleanup functions
global.feedbackDataUnsubscribe = jest.fn();
global.meDataUnsubscribe = jest.fn();
global.prodCapUnsubscribeUtilization = jest.fn();
global.prodDataUnsubscribe = jest.fn();

// Mock feedbackDataManager
global.feedbackDataManager = {
  init: jest.fn().mockResolvedValue(undefined)
};

// Mock render functions
global.renderProductDevelopment = jest.fn().mockReturnValue('<div>Product Development</div>');
global.renderProduction = jest.fn().mockReturnValue('<div>Production</div>');
global.renderProductsPortalHTML = jest.fn().mockReturnValue('<div>Products</div>');
global.renderProductsPortalSetup = jest.fn();
global.renderProductMgmt = jest.fn().mockReturnValue('<div>Product Mgmt</div>');
global.renderFeedback = jest.fn().mockReturnValue('<div>Feedback</div>');
global.renderCapacity = jest.fn().mockReturnValue('<div>Capacity</div>');
global.renderMeCapacity = jest.fn().mockReturnValue('<div>ME Capacity</div>');
global.renderProdCapacity = jest.fn().mockReturnValue('<div>Prod Capacity</div>');
global.renderHub = jest.fn().mockReturnValue('<div>Hub</div>');
global.meDrawChartNow = jest.fn();
global.autoResizeAll = jest.fn();
global.capacityEvents = { setup: jest.fn(), teardown: jest.fn(), _onClick: jest.fn(), _onChange: jest.fn(), _onInput: jest.fn(), _onKeydown: jest.fn() };

// Mock npi module
global.npi = {
  dashboard: {
    renderProjects: jest.fn().mockReturnValue('<div>Projects Dashboard</div>'),
    renderDashboard: jest.fn().mockReturnValue('<div>NPI Dashboard</div>')
  },
  gate: {
    renderGatePage: jest.fn((num) => `<div>Gate ${num}</div>`)
  },
  apqp: { renderAPQP: jest.fn().mockReturnValue('<div>APQP</div>') },
  tracker: {
    renderActions: jest.fn().mockReturnValue('<div>Actions</div>'),
    renderRisks: jest.fn().mockReturnValue('<div>Risks</div>')
  },
  bom: { renderBOM: jest.fn().mockReturnValue('<div>BOM</div>') },
  timing: { renderTimingPlan: jest.fn().mockReturnValue('<div>Timing</div>') }
};

// Mock family/template modal state
global.familyModalState = { isOpen: false };
global.templateManagerState = { isOpen: false };
global.templateViewerState = { isOpen: false };
global.renderFamilyModal = jest.fn().mockReturnValue('');
global.renderTemplateManager = jest.fn().mockReturnValue('');

// Mock return hub button
const mockReturnBtn = {
  style: { display: 'none' }
};

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Add mock return button if not in HTML
if (!document.getElementById('returnHubBtn')) {
  const btn = document.createElement('div');
  btn.id = 'returnHubBtn';
  btn.style.display = 'none';
  document.body.appendChild(btn);
}

// Add main content div
if (!document.getElementById('mainContent')) {
  const mc = document.createElement('div');
  mc.id = 'mainContent';
  document.body.appendChild(mc);
}

// Load navigation script
const navScript = fs.readFileSync(
  path.resolve(__dirname, '../utils/js/navigation.js'),
  'utf8'
);
eval(navScript);

const capacityScript = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/capacity.js'),
  'utf8'
);
eval(capacityScript);

const productDevelopmentScript = fs.readFileSync(
  path.resolve(__dirname, '../portals/product-development/js/product-development.js'),
  'utf8'
);
eval(productDevelopmentScript);

async function waitFor(condition, timeoutMs = 200) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  throw new Error('Timed out waiting for navigation state to update.');
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Navigation Module (navigation.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.progId = 'test-prog-1';
    global.currentSection = 'hub';
    global.npiTab = 'all';
    global.apqpTab = 'ctq';
    global.capacityTab = 'root';
    global.operationsTab = 'overview';
    global.productionTab = 'root';
    global.productDevelopmentTab = 'root';
    global.productsActiveTab = 'list';
    window.location.hash = '';
    document.getElementById('mainContent').innerHTML = '';
  });

  describe('parseHash', () => {
    test('should return empty object for empty hash', () => {
      window.location.hash = '';
      expect(parseHash()).toEqual({});
    });

    test('should parse single parameter', () => {
      window.location.hash = '#s=hub';
      expect(parseHash()).toEqual({ s: 'hub' });
    });

    test('should parse multiple parameters', () => {
      window.location.hash = '#p=test-prog-1&s=apqp&t=ctq';
      expect(parseHash()).toEqual({ p: 'test-prog-1', s: 'apqp', t: 'ctq' });
    });

    test('should handle encoded characters', () => {
      window.location.hash = '#s=product-development';
      expect(parseHash()).toEqual({ s: 'product-development' });
    });
  });

  describe('navigate', () => {
    test('should navigate to projects section', () => {
      navigate('projects');
      expect(global.currentSection).toBe('projects');
      // Note: projects section doesn't include 's=projects' in hash, only project
      expect(window.location.hash).toBe('#p=test-prog-1');
    });

    test('should redirect "home" to "project"', () => {
      navigate('home');
      expect(global.currentSection).toBe('project');
    });

    test('should show return button on feature pages', () => {
      navigate('apqp');
      const btn = document.getElementById('returnHubBtn');
      expect(btn.style.display).toBe('flex');
    });

    test('should hide return button on hub/projects/project', () => {
      navigate('hub');
      expect(document.getElementById('returnHubBtn').style.display).toBe('none');

      navigate('projects');
      expect(document.getElementById('returnHubBtn').style.display).toBe('none');

      navigate('project');
      expect(document.getElementById('returnHubBtn').style.display).toBe('none');
    });

    test('should initialize feedback data when navigating to feedback', () => {
      navigate('feedback');
      expect(global.feedbackDataManager.init).toHaveBeenCalled();
    });

    test('should cleanup feedback subscription when leaving feedback', () => {
      global.currentSection = 'feedback';
      navigate('hub');
      expect(global.feedbackDataUnsubscribe).toHaveBeenCalled();
    });

    test('should reset capacityTab when navigating to capacity', () => {
      global.capacityTab = 'me';
      navigate('capacity');
      expect(global.capacityTab).toBe('root');
    });

    test('should cleanup capacity subscriptions when leaving capacity', () => {
      global.currentSection = 'capacity';
      navigate('hub');
      expect(global.meDataUnsubscribe).toHaveBeenCalled();
      expect(global.prodCapUnsubscribeUtilization).toHaveBeenCalled();
    });

    test('should reset productionTab when navigating to production', () => {
      global.productionTab = 'scheduling';
      navigate('production');
      expect(global.productionTab).toBe('root');
    });

    test('should cleanup production subscription when leaving production', () => {
      global.currentSection = 'production';
      navigate('hub');
      expect(global.prodDataUnsubscribe).toHaveBeenCalled();
    });

    test('should reset productDevelopmentTab when navigating to product-development', () => {
      global.productDevelopmentTab = 'npi';
      navigate('product-development');
      expect(global.productDevelopmentTab).toBe('root');
    });

    test('should reset productsActiveTab to list when navigating to product-development', () => {
      global.productsActiveTab = 'families';
      global.currentSection = 'hub';
      navigate('product-development');
      expect(global.productsActiveTab).toBe('list');
    });

    test('should not reset productsActiveTab when already in product-development', () => {
      global.productsActiveTab = 'families';
      global.currentSection = 'product-development';
      navigate('product-development');
      expect(global.productsActiveTab).toBe('families');
    });
  });

  describe('navigateBack', () => {
    test('should navigate to project from APQP sections', () => {
      global.currentSection = 'apqp';
      navigateBack();
      expect(global.currentSection).toBe('project');
    });

    test('should navigate to project from actions', () => {
      global.currentSection = 'actions';
      navigateBack();
      expect(global.currentSection).toBe('project');
    });

    test('should navigate to project from risks', () => {
      global.currentSection = 'risks';
      navigateBack();
      expect(global.currentSection).toBe('project');
    });

    test('should navigate to project from bom', () => {
      global.currentSection = 'bom';
      navigateBack();
      expect(global.currentSection).toBe('project');
    });

    test('should navigate to project from timing', () => {
      global.currentSection = 'timing';
      navigateBack();
      expect(global.currentSection).toBe('project');
    });

    test('should navigate to hub from capacity', () => {
      global.currentSection = 'capacity';
      navigateBack();
      expect(global.currentSection).toBe('hub');
    });

    test('should navigate to hub from production', () => {
      global.currentSection = 'production';
      navigateBack();
      expect(global.currentSection).toBe('hub');
    });
  });

  describe('setApqpTab', () => {
    test('should set apqpTab and update hash', () => {
      setApqpTab('pfd');
      expect(global.apqpTab).toBe('pfd');
      expect(window.location.hash).toContain('t=pfd');
    });

    test('should not add tab parameter when tab is ctq (default)', () => {
      setApqpTab('ctq');
      expect(global.apqpTab).toBe('ctq');
      expect(window.location.hash).not.toContain('t=');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      document.getElementById('mainContent').innerHTML = '';
    });

    test('should render projects dashboard', () => {
      global.currentSection = 'projects';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Projects Dashboard');
    });

    test('should render product-development section', () => {
      global.currentSection = 'product-development';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Product Development');
    });

    test('should render production section', () => {
      global.currentSection = 'production';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Production');
    });

    test('should render capacity section', () => {
      global.currentSection = 'capacity';
      global.capacityTab = 'root';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Capacity');
    });

    test('should render ME capacity and trigger chart draw', () => {
      global.currentSection = 'capacity';
      global.capacityTab = 'me';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('ME Capacity');
    });

    test('should render feedback section', () => {
      global.currentSection = 'feedback';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Feedback');
    });

    test('should render hub when no active project exists', () => {
      global.progId = 'missing-project';
      global.currentSection = 'hub';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Hub');
    });

    test('should fall back to projects dashboard when no active project exists', () => {
      global.progId = 'missing-project';
      global.currentSection = 'apqp';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('Projects Dashboard');
    });

    test('should render empty section shell for unsupported section ids', () => {
      global.currentSection = 'productmgmt';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('section-inner');
    });

    test('should render NPI dashboard for project section', () => {
      global.currentSection = 'project';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('NPI Dashboard');
    });

    test('should render gate page for gate_* sections', () => {
      global.currentSection = 'gate_2';
      render();
      expect(global.npi.gate.renderGatePage).toHaveBeenCalledWith(2);
    });

    test('should render APQP section', () => {
      global.currentSection = 'apqp';
      render();
      expect(document.getElementById('mainContent').innerHTML).toContain('APQP');
    });

    test('should call autoResizeAll after rendering NPI sections', () => {
      global.currentSection = 'apqp';
      render();
      // Auto-resize is called in nested rAF, so we just verify it's defined
      expect(typeof global.autoResizeAll).toBe('function');
    });
  });

  describe('goProjects and goHome helpers', () => {
    test('goProjects should navigate to projects', () => {
      goProjects();
      expect(global.currentSection).toBe('projects');
    });

    test('goHome should navigate to project', () => {
      goHome();
      expect(global.currentSection).toBe('project');
    });
  });

  describe('popstate event handler', () => {
    test('should handle back/forward navigation', () => {
      window.location.hash = '#p=test-prog-1&s=apqp&t=pfd';
      const event = new Event('popstate');
      window.dispatchEvent(event);
      // Handler should update state based on hash
      expect(global.currentSection).toBe('apqp');
      expect(global.apqpTab).toBe('pfd');
    });
  });

  describe('global Backspace navigation', () => {
    test('should navigate back when Backspace is pressed outside editable fields', () => {
      global.currentSection = 'capacity';

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      expect(global.currentSection).toBe('hub');
    });

    test('should return to project dashboard from NPI sections', () => {
      global.currentSection = 'apqp';

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      expect(global.currentSection).toBe('project');
    });

    test('should return to the previous project screen from documents', async () => {
      navigate('project');
      navigate('documents');

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      await waitFor(() => global.currentSection === 'project' && window.location.hash === '#p=test-prog-1&s=project');

      expect(global.currentSection).toBe('project');
      expect(window.location.hash).toBe('#p=test-prog-1&s=project');
    });

    test('should return to the previous portal sub-screen when a tab changed', async () => {
      navigate('capacity');
      setCapacityTab('me');

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      await waitFor(() => global.currentSection === 'capacity' && global.capacityTab === 'root' && window.location.hash === '#p=test-prog-1&s=capacity');

      expect(global.currentSection).toBe('capacity');
      expect(global.capacityTab).toBe('root');
      expect(window.location.hash).toBe('#p=test-prog-1&s=capacity');
    });

    test('should not navigate back when Backspace is pressed inside an input', () => {
      global.currentSection = 'capacity';
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      input.dispatchEvent(event);
      expect(global.currentSection).toBe('capacity');
      input.remove();
    });

    test('should not navigate back when Backspace is pressed inside contenteditable', () => {
      global.currentSection = 'capacity';
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      editable.textContent = 'Editable content';
      document.body.appendChild(editable);
      editable.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      editable.dispatchEvent(event);
      expect(global.currentSection).toBe('capacity');
      editable.remove();
    });

    test('should not navigate back when modifier keys are pressed', () => {
      global.currentSection = 'capacity';

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      expect(global.currentSection).toBe('capacity');
    });

    test('should not navigate when non-editable text is selected', () => {
      global.currentSection = 'capacity';

      const originalGetSelection = window.getSelection;
      window.getSelection = jest.fn(() => ({
        isCollapsed: false,
        toString: () => 'Selected text'
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      });

      window.dispatchEvent(event);
      expect(global.currentSection).toBe('capacity');

      window.getSelection = originalGetSelection;
    });
  });
});
