const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Core globals used by navigation and operations modules.
global.currentUser = null;
global.db = { programmes: [] };
global.progId = 'prog-1';
global.currentSection = 'hub';
global.npiTab = 'all';
global.apqpTab = 'ctq';
global.capacityTab = 'root';
global.operationsTab = 'overview';
global.productionTab = 'root';
global.productDevelopmentTab = 'root';
global.productsActiveTab = 'list';

global.prog = () => global.db.programmes.find(p => p.id === global.progId) || null;

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Realtime stubs used by operations module.
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();

global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({ data: [], error: null }))
    }))
  })),
  removeChannel: jest.fn()
};

global.loadRemote = jest.fn().mockResolvedValue(undefined);
global.prodDataReloadProducts = jest.fn().mockResolvedValue(undefined);
global.meLoadRelationalTeams = jest.fn().mockResolvedValue([]);
global.meLoadRelationalTasks = jest.fn().mockResolvedValue([]);
global.meLoadRelationalProducts = jest.fn().mockResolvedValue([]);
global.meLoadRelationalHolidays = jest.fn().mockResolvedValue([]);

global.prodState = { products: [], batches: [] };
global.meDataState = { team: [], tasks: [], products: [], holidays: [] };
global.bugDataManager = { state: { reports: [] } };

global.renderProductDevelopment = jest.fn().mockReturnValue('<div>Product Development</div>');
global.renderProduction = jest.fn().mockReturnValue('<div>Production</div>');
global.renderProductsPortalHTML = jest.fn().mockReturnValue('<div>Products</div>');
global.renderProductsPortalSetup = jest.fn();
global.renderProductMgmt = jest.fn().mockReturnValue('<div>Product Mgmt</div>');
global.renderBugReports = jest.fn().mockReturnValue('<div>Bug Reports</div>');
global.renderCapacity = jest.fn().mockReturnValue('<div>Capacity</div>');
global.renderMeCapacity = jest.fn().mockReturnValue('<div>ME Capacity</div>');
global.renderProdCapacity = jest.fn().mockReturnValue('<div>Prod Capacity</div>');
global.renderHub = jest.fn().mockReturnValue('<div>Hub</div>');
global.meDrawChartNow = jest.fn();
global.autoResizeAll = jest.fn();

global.npi = {
  dashboard: {
    renderProjects: jest.fn().mockReturnValue('<div>Projects</div>'),
    renderDashboard: jest.fn().mockReturnValue('<div>NPI Dashboard</div>')
  },
  gate: { renderGatePage: jest.fn().mockReturnValue('<div>Gate</div>') },
  apqp: { renderAPQP: jest.fn().mockReturnValue('<div>APQP</div>') },
  tracker: {
    renderActions: jest.fn().mockReturnValue('<div>Actions</div>'),
    renderRisks: jest.fn().mockReturnValue('<div>Risks</div>')
  },
  bom: { renderBOM: jest.fn().mockReturnValue('<div>BOM</div>') },
  timing: { renderTimingPlan: jest.fn().mockReturnValue('<div>Timing</div>') }
};

global.familyModalState = { isOpen: false };
global.templateManagerState = { isOpen: false };
global.renderFamilyModal = jest.fn().mockReturnValue('');
global.renderTemplateManager = jest.fn().mockReturnValue('');

const opsScript = fs.readFileSync(
  path.resolve(__dirname, '../portals/operations/js/operations-dashboard.js'),
  'utf8'
);
const navScript = fs.readFileSync(
  path.resolve(__dirname, '../utils/js/navigation.js'),
  'utf8'
);

eval(opsScript);
eval(navScript);

describe('Operations Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentSection = 'hub';
    operationsTab = 'overview';
    productionTab = 'root';
    capacityTab = 'root';
    productDevelopmentTab = 'root';
    window.location.hash = '';
  });

  test('setOperationsTab updates hash and section tab state', () => {
    setOperationsTab('risk');

    expect(operationsTab).toBe('risk');
    expect(window.location.hash).toContain('s=operations');
    expect(window.location.hash).toContain('od=risk');
  });

  test('navigate to operations resets sub-tab on new entry', () => {
    operationsTab = 'actions';

    navigate('operations');

    expect(currentSection).toBe('operations');
    expect(operationsTab).toBe('overview');
    expect(window.location.hash).toContain('s=operations');
    expect(window.location.hash).not.toContain('od=actions');
  });

  test('opsBuildMetrics aggregates expected KPI values', () => {
    db.programmes = [{
      id: 'prog-1',
      status: 'Active',
      gates: [{ checks: [true, false, true] }],
      actions: [
        { status: 'Open', due: '2020-01-01' },
        { status: 'Closed', due: '2020-01-02' }
      ],
      risks: [{ likelihood: 4, impact: 3 }],
      pfmea: [{ effects: [{ sev: 10, causes: [{ occ: 5, det: 3 }] }] }]
    }];

    bugDataManager.state.reports = [
      { status: 'open' },
      { status: 'closed', responded_at: new Date().toISOString() }
    ];

    meDataState = {
      team: [{ id: 'm1', department: 'ME' }],
      tasks: [{ id: 't1', department: 'ME' }],
      products: [],
      holidays: []
    };

    global.meFilterByDepartment = (arr) => arr;
    global.meCalculateMonthData = jest.fn().mockReturnValue({
      capacity: 100,
      totalDemand: 75,
      utilisation: 75
    });

    prodState = {
      products: [],
      batches: [
        { status: 'In Progress' },
        { status: 'Done' }
      ]
    };

    const metrics = opsBuildMetrics();

    expect(metrics.gate.percentage).toBe(67);
    expect(metrics.actions.overdue).toBe(1);
    expect(metrics.risk.highRisks).toBe(1);
    expect(metrics.risk.highRpn).toBe(1);
    expect(metrics.bugs.open).toBe(1);
    expect(metrics.me.utilisation).toBe(75);
    expect(metrics.production.total).toBe(2);
    expect(metrics.production.completed).toBe(1);
  });
});
