const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Core globals used by navigation and operations modules.
global.currentUser = null;
global.db = { projects: [] };
global.progId = 'prog-1';
global.currentSection = 'hub';
global.npiTab = 'all';
global.apqpTab = 'ctq';
global.capacityTab = 'root';
global.operationsTab = 'overview';
global.productionTab = 'root';
global.productDevelopmentTab = 'root';
global.productsActiveTab = 'list';

global.prog = () => global.db.projects.find(p => p.id === global.progId) || null;

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
global.feedbackDataManager = { state: { feedback: [] } };
global.productsState = { products: [] };

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
global.renderProjects = jest.fn().mockReturnValue('<div>Projects</div>');
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

const opsScript = [
  '../portals/operations/js/operations-dashboard-state.js',
  '../portals/operations/js/operations-dashboard-metrics.js',
  '../portals/operations/js/operations-dashboard-realtime.js',
  '../portals/operations/js/operations-dashboard-render-core.js',
  '../portals/operations/js/operations-dashboard-forecast-view.js',
  '../portals/operations/js/operations-dashboard-forecast-actions.js',
  '../portals/operations/js/operations-dashboard-main.js'
].map((relativePath) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8')).join('\n');
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
    db.projects = [{
      id: 'prog-1',
      product_id: 'prod-npi-1',
      status: 'Active',
      gates: [{ checks: [true, false, true] }],
      actions: [
        { status: 'Open', due: '2020-01-01' },
        { status: 'Closed', due: '2020-01-02' }
      ],
      risks: [{ likelihood: 4, impact: 3 }],
      pfmea: [{ effects: [{ sev: 10, causes: [{ occ: 5, det: 3 }] }] }]
    }];

    // Gate completion KPI only counts projects linked to NPI-status products.
    productsState.products = [{ id: 'prod-npi-1', status: 'NPI' }];

    feedbackDataManager.state.feedback = [
      { feedback_type: 'bug', status: 'open' },
      { feedback_type: 'bug', status: 'squashed', responded_at: new Date().toISOString() }
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

  test('dependency-injected metric functions prefer provided data over globals', () => {
    const projects = [{
      id: 'prog-di-1',
      product_id: 'prod-di-1',
      gates: [{ checks: [true, false] }]
    }];

    productsState.products = [{ id: 'prod-global', status: 'NPI' }];
    feedbackDataManager.state.feedback = [{ feedback_type: 'bug', status: 'open' }];

    const dependencies = {
      products: [{ id: 'prod-di-1', status: 'NPI' }],
      feedback: [{ feedback_type: 'bug', status: 'squashed', responded_at: new Date().toISOString() }],
      meDataState: {
        team: [{ id: 'pm-1', department: 'PM' }],
        tasks: [{ id: 'task-1', department: 'PM' }],
        products: [{ id: 'prod-1', department: 'PM' }],
        holidays: []
      },
      meFilterByDepartment: jest.fn((arr, department) => arr.filter(row => row.department === department)),
      meCalculateMonthData: jest.fn().mockReturnValue({
        capacity: 120,
        totalDemand: 60,
        utilisation: 50
      })
    };

    const gate = opsCalcGateHealth(projects, dependencies);
    const bugs = opsCalcBugHealth(dependencies);
    const pm = opsCalcPmCapacity(dependencies);

    expect(gate.totalChecks).toBe(2);
    expect(gate.doneChecks).toBe(1);
    expect(gate.percentage).toBe(50);

    expect(bugs.open).toBe(0);
    expect(bugs.closed7d).toBe(1);

    expect(pm.ready).toBe(true);
    expect(pm.utilisation).toBe(50);
    expect(pm.capacity).toBe(120);
    expect(pm.demand).toBe(60);
    expect(pm.headroom).toBe(60);
    expect(dependencies.meFilterByDepartment).toHaveBeenCalled();
    expect(dependencies.meCalculateMonthData).toHaveBeenCalled();
  });

  test('forecast edit mode pre-fills form for selected opportunity', () => {
    global.prodCapGet24MonthKeys = jest.fn().mockReturnValue(['2026-01']);
    global.prodCapGetWorkAreas = jest.fn().mockReturnValue(['Unit 2']);
    global.prodCapCalcDemandMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 100 } });
    global.prodCapCalcSupplyMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 200 } });
    global.prodCapUtil = jest.fn().mockReturnValue(50);
    global.prodCapMonthLabel = jest.fn().mockReturnValue('Jan 26');
    global.opsForecastBuildWeightedMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 20 } });
    global.opsForecastIsActiveStatus = jest.fn().mockReturnValue(true);

    global.opsForecastManager = {
      state: { mode: 'remote', lastError: '' },
      getRows: jest.fn().mockReturnValue([
        {
          id: 'opp-1',
          title: 'Tender Alpha',
          owner: 'Alex',
          status: 'quoted',
          work_area: 'Unit 2',
          start_date: '2026-01-01',
          due_date: '2026-01-31',
          total_hours: 120,
          probability_pct: 60,
          notes: 'Priority'
        }
      ])
    };

    currentSection = 'hub';
    operationsTab = 'forecast';
    opsForecastStartEdit('opp-1');
    currentSection = 'operations';

    const html = renderOperationsDashboard();

    expect(html).toContain('Edit Opportunity');
    expect(html).toContain('Save Changes');
    expect(html).toContain('value="Tender Alpha"');
  });

  test('opsForecastSubmit updates existing opportunity when id is present', async () => {
    const upsertMock = jest.fn().mockResolvedValue({ ok: true });
    global.opsForecastManager = {
      upsertOpportunity: upsertMock
    };

    currentSection = 'hub';

    const form = document.createElement('form');
    form.innerHTML = `
      <input name="opportunity_id" value="opp-9" />
      <input name="title" value="Update Me" />
      <input name="owner" value="Jamie" />
      <input name="status" value="quoted" />
      <input name="work_area" value="Unit 6" />
      <input name="start_date" value="2026-02-01" />
      <input name="due_date" value="2026-02-28" />
      <input name="total_hours" value="80" />
      <input name="probability_pct" value="55" />
      <textarea name="notes">Updated notes</textarea>
    `;

    await opsForecastSubmit({
      preventDefault: jest.fn(),
      target: form
    });

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'opp-9',
      title: 'Update Me',
      owner: 'Jamie'
    }));
  });

  test('forecast quick edit renders inline controls for selected row', () => {
    global.prodCapGet24MonthKeys = jest.fn().mockReturnValue(['2026-01']);
    global.prodCapGetWorkAreas = jest.fn().mockReturnValue(['Unit 2']);
    global.prodCapCalcDemandMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 100 } });
    global.prodCapCalcSupplyMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 200 } });
    global.prodCapUtil = jest.fn().mockReturnValue(50);
    global.prodCapMonthLabel = jest.fn().mockReturnValue('Jan 26');
    global.opsForecastBuildWeightedMatrix = jest.fn().mockReturnValue({ '2026-01': { _total: 20 } });
    global.opsForecastIsActiveStatus = jest.fn().mockReturnValue(true);

    global.opsForecastManager = {
      state: { mode: 'remote', lastError: '' },
      getRows: jest.fn().mockReturnValue([
        {
          id: 'opp-inline',
          title: 'Inline Tender',
          owner: 'Alex',
          status: 'quoted',
          work_area: 'Unit 2',
          start_date: '2026-01-01',
          due_date: '2026-01-31',
          total_hours: 120,
          probability_pct: 60,
          notes: 'Priority'
        }
      ])
    };

    operationsTab = 'forecast';
    currentSection = 'hub';
    opsForecastStartInlineEdit('opp-inline');
    currentSection = 'operations';

    const html = renderOperationsDashboard();

    expect(html).toContain('opsForecastInline_opp-inline_title');
    expect(html).toContain('opsForecastSaveInline');
  });

  test('opsForecastSaveInline updates row values', async () => {
    const upsertMock = jest.fn().mockResolvedValue({ ok: true });
    global.opsForecastManager = {
      getRows: jest.fn().mockReturnValue([
        {
          id: 'opp-save',
          title: 'Original',
          status: 'identified',
          work_area: 'Unit 2',
          start_date: '2026-01-01',
          due_date: '2026-01-31',
          total_hours: 80,
          probability_pct: 40
        }
      ]),
      upsertOpportunity: upsertMock
    };

    document.body.innerHTML = `
      <input id="opsForecastInline_opp-save_title" value="Updated Inline" />
      <select id="opsForecastInline_opp-save_status"><option value="quoted" selected>Quoted</option></select>
      <input id="opsForecastInline_opp-save_work_area" value="Unit 6" />
      <input id="opsForecastInline_opp-save_start_date" value="2026-02-01" />
      <input id="opsForecastInline_opp-save_due_date" value="2026-02-20" />
      <input id="opsForecastInline_opp-save_total_hours" value="95" />
      <input id="opsForecastInline_opp-save_probability_pct" value="70" />
    `;

    await opsForecastSaveInline('opp-save');

    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'opp-save',
      title: 'Updated Inline',
      status: 'quoted',
      work_area: 'Unit 6',
      total_hours: 95,
      probability_pct: 70
    }));
  });

  test('opsForecastInlineKeydown Enter triggers inline save', () => {
    const saveSpy = jest.spyOn(global, 'opsForecastSaveInline').mockImplementation(() => Promise.resolve());
    const cancelSpy = jest.spyOn(global, 'opsForecastCancelInline').mockImplementation(() => {});

    const event = {
      key: 'Enter',
      preventDefault: jest.fn()
    };

    opsForecastInlineKeydown(event, 'opp-key');

    expect(event.preventDefault).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalledWith('opp-key');
    expect(cancelSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  test('opsForecastInlineKeydown Escape cancels inline edit', () => {
    const saveSpy = jest.spyOn(global, 'opsForecastSaveInline').mockImplementation(() => Promise.resolve());
    const cancelSpy = jest.spyOn(global, 'opsForecastCancelInline').mockImplementation(() => {});

    const event = {
      key: 'Escape',
      preventDefault: jest.fn()
    };

    opsForecastInlineKeydown(event, 'opp-key');

    expect(event.preventDefault).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  test('overview metric cards use delegated data-action attributes', () => {
    currentSection = 'operations';
    operationsTab = 'overview';

    const html = renderOperationsDashboard();

    expect(html).toContain('data-action="metric-navigate"');
    expect(html).toContain('data-dest="capacity"');
    expect(html).toMatch(/<article class="ops-metric[^>]*data-action="metric-navigate"[^>]*>/);
    expect(html).not.toMatch(/<article class="ops-metric[^>]*onclick=/);
  });

});
