const fs = require('fs');
const path = require('path');

describe('ME/PM Product table filtering and sorting', () => {
  let currentDepartment;
  let meProducts;
  let pmProducts;
  let allDbProducts;
  let tasks;

  function renderSupportTable() {
    return meRenderProductsTab(meProducts, meProducts, tasks);
  }

  function renderLoadTable() {
    return meRenderProductTaskLoadTab(tasks, meProducts);
  }

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="root"></div>';

    currentDepartment = 'ME';

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.getFamilies = jest.fn(() => [
      { id: 'fam-a', name: 'FamilyA', label: 'Family A' },
      { id: 'fam-b', name: 'FamilyB', label: 'Family B' }
    ]);

    global.findFamilyRecord = (familyRef) => {
      if (!familyRef) return null;
      const families = getFamilies();
      return families.find(f => f.id === familyRef) ||
        families.find(f => f.name === familyRef) ||
        families.find(f => f.label === familyRef) ||
        null;
    };

    global.meGetDepartmentFromContext = jest.fn(() => currentDepartment);
    global.meRefreshCurrentTab = jest.fn();
    global.render = jest.fn();
    global.meDataUpdateProduct = jest.fn();
    global.meDebouncedSave = jest.fn();
    global.meDataGetProductSupportHistory = jest.fn(() => [
      {
        id: 'hist-1',
        productId: 'me-1',
        department: 'ME',
        effectiveDate: '2026-01-01',
        endDate: '2026-01-31',
        hoursPerWeek: 2,
        changeReason: 'Initial planning'
      },
      {
        id: 'hist-2',
        productId: 'me-1',
        department: 'ME',
        effectiveDate: '2026-02-01',
        endDate: '',
        hoursPerWeek: 1,
        changeReason: 'Support improvement'
      }
    ]);

    allDbProducts = [
      { id: 'db-1', name: 'Alpha Pump', family: 'fam-a' },
      { id: 'db-2', name: 'Beta Fan', family: 'FamilyB' },
      { id: 'db-3', name: 'Gamma Valve', family: 'Family A' }
    ];

    global.productsDataGetAll = jest.fn(() => allDbProducts);

    meProducts = [
      {
        id: 'me-1',
        name: 'Alpha Pump',
        productDatabaseId: 'db-1',
        supportEffectiveDate: '2026-01-01',
        supportFrom: '2026-01-01',
        supportUntil: '2026-12-31',
        hoursPerWeek: 2,
        notes: 'Low effort'
      },
      {
        id: 'me-2',
        name: 'Beta Fan',
        productDatabaseId: 'db-2',
        supportEffectiveDate: '2026-01-01',
        supportFrom: '2026-01-01',
        supportUntil: '2026-12-31',
        hoursPerWeek: 9,
        notes: 'High effort'
      },
      {
        id: 'me-3',
        // legacy row without productDatabaseId, should resolve by name fallback
        name: 'Gamma Valve',
        productDatabaseId: '',
        supportEffectiveDate: '2026-02-01',
        supportFrom: '2026-02-01',
        supportUntil: '2026-12-31',
        hoursPerWeek: 4,
        notes: 'Legacy mapping'
      }
    ];

    pmProducts = [
      {
        id: 'pm-1',
        name: 'Alpha Pump',
        productDatabaseId: 'db-1',
        supportEffectiveDate: '2026-01-01',
        supportFrom: '2026-01-01',
        supportUntil: '2026-12-31',
        hoursPerWeek: 5,
        notes: 'PM stream'
      },
      {
        id: 'pm-2',
        name: 'Beta Fan',
        productDatabaseId: 'db-2',
        supportEffectiveDate: '2026-01-01',
        supportFrom: '2026-01-01',
        supportUntil: '2026-12-31',
        hoursPerWeek: 1,
        notes: 'PM stream'
      }
    ];

    tasks = [
      { id: 't1', productId: 'me-1', totalHours: 10 },
      { id: 't2', productId: 'me-1', totalHours: 5 },
      { id: 't3', productId: 'me-2', totalHours: 30 },
      { id: 't4', productId: 'me-3', totalHours: 12 }
    ];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toIso = (date) => date.toISOString().slice(0, 10);

    global.prodState = {
      batches: [
        { product_id: 'db-1', start_date: toIso(monthStart), due_date: toIso(monthEnd) },
        { product_id: 'db-2', start_date: toIso(monthStart), due_date: toIso(monthEnd) },
        { product_id: 'db-2', start_date: toIso(monthStart), due_date: toIso(monthEnd) }
      ]
    };

    global.meDataGetProducts = jest.fn(() => currentDepartment === 'PM' ? pmProducts : meProducts);

    const supportScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/js/me-products.js'),
      'utf8'
    );
    const loadScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/js/me-product-taskload.js'),
      'utf8'
    );

    eval(supportScript);
    eval(loadScript);
  });

  test('Product Support table filters by family and sorts by hours', () => {
    meProductsClearFilters('ME');

    meProductsSetFamilyFilter('Family A', 'ME');
    let html = renderSupportTable();
    expect(html).toContain('Alpha Pump');
    expect(html).toContain('Gamma Valve');
    expect(html).not.toContain('Beta Fan');

    meProductsSetFamilyFilter('all', 'ME');
    meProductsSetSort('hours', 'ME');
    meProductsToggleSortDir('ME');
    html = renderSupportTable();

    const idxBeta = html.indexOf('Beta Fan');
    const idxGamma = html.indexOf('Gamma Valve');
    const idxAlpha = html.indexOf('Alpha Pump');

    expect(idxBeta).toBeGreaterThan(-1);
    expect(idxGamma).toBeGreaterThan(-1);
    expect(idxAlpha).toBeGreaterThan(-1);
    expect(idxBeta).toBeLessThan(idxGamma);
    expect(idxGamma).toBeLessThan(idxAlpha);
  });

  test('Product Support keeps ME and PM filter states independent', () => {
    meProductsClearFilters('ME');
    meProductsClearFilters('PM');

    meProductsSetSearch('Alpha', 'PM');

    currentDepartment = 'ME';
    const meHtml = renderSupportTable();
    expect(meHtml).toContain('Alpha Pump');
    expect(meHtml).toContain('Beta Fan');

    currentDepartment = 'PM';
    const pmHtml = meRenderProductsTab(pmProducts, pmProducts, []);
    expect(pmHtml).toContain('Alpha Pump');
    expect(pmHtml).not.toContain('Beta Fan');
  });

  test('Product Load table filters by family and sorts by task demand', () => {
    meProductLoadClearFilters('ME');

    meProductLoadSetFamilyFilter('Family A', 'ME');
    let html = renderLoadTable();
    expect(html).toContain('Alpha Pump');
    expect(html).toContain('Gamma Valve');
    expect(html).not.toContain('Beta Fan');

    meProductLoadSetFamilyFilter('all', 'ME');
    meProductLoadSetSort('total', 'ME');
    html = renderLoadTable();

    const idxBeta = html.indexOf('Beta Fan');
    const idxAlpha = html.indexOf('Alpha Pump');
    expect(idxBeta).toBeGreaterThan(-1);
    expect(idxAlpha).toBeGreaterThan(-1);
    expect(idxBeta).toBeLessThan(idxAlpha);
  });

  test('Product Load keeps ME and PM filter states independent', () => {
    meProductLoadClearFilters('ME');
    meProductLoadClearFilters('PM');

    meProductLoadSetSearch('Alpha', 'PM');

    currentDepartment = 'ME';
    const meHtml = renderLoadTable();
    expect(meHtml).toContain('Alpha Pump');
    expect(meHtml).toContain('Beta Fan');

    currentDepartment = 'PM';
    const pmTasks = [
      { id: 'pt1', productId: 'pm-1', totalHours: 20 },
      { id: 'pt2', productId: 'pm-2', totalHours: 10 }
    ];
    const pmHtml = meRenderProductTaskLoadTab(pmTasks, pmProducts);
    expect(pmHtml).toContain('Alpha Pump');
    expect(pmHtml).not.toContain('Beta Fan');
  });

  test('Product Support and Product Load use schedule-driven monthly support', () => {
    meProductsClearFilters('ME');
    meProductLoadClearFilters('ME');

    const supportHtml = renderSupportTable();
    expect(supportHtml).toContain('20.0');
    expect(supportHtml).toContain('h/month (schedule)');
    expect(supportHtml).toContain('Hours/Batch');
    expect(supportHtml).toContain('Effective Date');
    expect(supportHtml).toContain('2026-01-01');
    expect(supportHtml).toContain('Apply Change');
    expect(supportHtml).toContain('View History');

    const loadHtml = renderLoadTable();
    expect(loadHtml).toContain('h/month');
    expect(loadHtml).toContain('Support/Month = support hours per batch');
  });

  test('Logistics Product Support splits Hours/Batch into kitting, booking in/out, and movement inputs', () => {
    currentDepartment = 'LOG';
    meProducts = [
      {
        id: 'log-1',
        name: 'Alpha Pump',
        productDatabaseId: 'db-1',
        supportEffectiveDate: '2026-01-01',
        hoursPerWeek: 2.25,
        kittingHours: 1.5,
        bookingInOutHours: 0.25,
        productMovementHours: 0.5,
        notes: 'Logistics split'
      }
    ];

    const html = renderSupportTable();
    expect(html).toContain('Kitting');
    expect(html).toContain('Booking In/Out');
    expect(html).toContain('Product Movement');
    expect(html).toContain('data-field="kittingHours"');
    expect(html).toContain('data-field="bookingInOutHours"');
    expect(html).toContain('data-field="productMovementHours"');
    expect(html).toContain('data-field="hoursPerWeek" readonly');
    expect(html).toContain('For Logistics, Hours/Batch is calculated from Kitting, Booking In/Out, and Product Movement.');
  });

  test('Logistics Product Support history shows kitting, booking in/out, and movement values', () => {
    currentDepartment = 'LOG';
    meProducts = [
      {
        id: 'log-1',
        name: 'Alpha Pump',
        productDatabaseId: 'db-1',
        supportEffectiveDate: '2026-01-01',
        hoursPerWeek: 2.25,
        kittingHours: 1.5,
        bookingInOutHours: 0.25,
        productMovementHours: 0.5,
        notes: 'Logistics split'
      }
    ];
    global.meDataGetProductSupportHistory = jest.fn(() => [
      {
        id: 'log-hist-1',
        productId: 'log-1',
        department: 'LOG',
        effectiveDate: '2026-01-01',
        endDate: '',
        hoursPerWeek: 2.25,
        kittingHours: 1.5,
        bookingInOutHours: 0.25,
        productMovementHours: 0.5,
        changeReason: 'Split logistics work'
      }
    ]);

    meProductsToggleHistory('log-1', 'LOG');
    const html = renderSupportTable();

    expect(html).toContain('Support History');
    expect(html).toContain('Kitting');
    expect(html).toContain('Booking In/Out');
    expect(html).toContain('Product Movement');
    expect(html).toContain('Split logistics work');
    expect(html).toContain('1.50');
    expect(html).toContain('0.25');
    expect(html).toContain('0.50');
    expect(html).toContain('2.25');
  });

  test('Product Support shows history rows after toggling a product history panel', () => {
    meProductsClearFilters('ME');

    let html = renderSupportTable();
    expect(html).not.toContain('Support History');

    meProductsToggleHistory('me-1', 'ME');
    html = renderSupportTable();
    expect(html).toContain('Support History');
    expect(html).toContain('Initial planning');
    expect(html).toContain('Support improvement');
    expect(html).toContain('Hide History');
  });
});
