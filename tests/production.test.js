const fs = require('fs');
const path = require('path');

// Mocking the global objects and functions that the production scripts depend on.
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
                user: {
                    id: 'test-user',
                    email: 'test@test.com'
                }
            }
        }
    }))
  }
};

global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };
global.db = { projects: [] };
global.getFamilies = () => [];
global.getWorkAreaOptions = () => '';
global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');
global.canViewPortalTab = jest.fn(() => true);
global.render = jest.fn();
global.prodState = {
    products: [],
    batches: [],
  activeUnit: 'Unit 2',
  activeProductId: null
};

// Mocking the DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Dynamically import the scripts to be tested
const dataScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/data.js'), 'utf8');
const schedulingScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/scheduling.js'), 'utf8');
const planningScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/planning.js'), 'utf8');
const productionScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/production.js'), 'utf8');
eval(dataScript);
eval(schedulingScript);
eval(planningScript);
eval(productionScript);

describe('Production Portal', () => {
  beforeEach(() => {
    prodPlanMonthOffset = 0;
    productionTab = 'root';
    global.canViewPortalTab = jest.fn(() => true);
    prodState.products = [];
    prodState.batches = [];
    prodState.activeUnit = 'Unit 2';
    prodState.activeProductId = null;
  });

    describe('Scheduling', () => {
        test('renderScheduling should run without errors', () => {
            expect(() => renderScheduling()).not.toThrow();
        });

      test('renderProduction uses delegated data-action controls', () => {
        productionTab = 'root';
        const rootHtml = renderProduction();
        expect(rootHtml).toContain('data-action="prod-hub-tab"');
        expect(rootHtml).toContain('data-action="prod-nav-hub"');
        expect(rootHtml).not.toContain('onclick=');

        productionTab = 'scheduling';
        const tabHtml = renderProduction();
        expect(tabHtml).toContain('data-action="prod-nav-tab"');
        expect(tabHtml).not.toContain('onclick=');
      });

      test('renderProduction hides production pages the user cannot view', () => {
        global.canViewPortalTab = jest.fn((section, tab) => !(section === 'production' && tab === 'by-unit'));

        const rootHtml = renderProduction();

        expect(rootHtml).toContain('Plan by Product');
        expect(rootHtml).not.toContain('Plan by Work Area');
      });

      test('setProductionTab ignores tabs the user cannot view', () => {
        global.canViewPortalTab = jest.fn((section, tab) => !(section === 'production' && tab === 'by-unit'));

        setProductionTab('by-unit');

        expect(productionTab).toBe('root');
        expect(global.render).not.toHaveBeenCalled();
      });
    });

    describe('Date helpers', () => {
      test('parseDisplayDate converts DD/MM/YYYY to YYYY-MM-DD correctly', () => {
        // This is the exact format users enter dates — must not swap day/month
        expect(parseDisplayDate('08/11/2027')).toBe('2027-11-08'); // 8 Nov, NOT 11 Aug
        expect(parseDisplayDate('11/08/2027')).toBe('2027-08-11'); // 11 Aug
        expect(parseDisplayDate('01/01/2026')).toBe('2026-01-01');
        expect(parseDisplayDate('31/12/2025')).toBe('2025-12-31');
      });

      test('parseDisplayDate passes through ISO format unchanged', () => {
        expect(parseDisplayDate('2027-11-08')).toBe('2027-11-08');
        expect(parseDisplayDate('2026-01-01')).toBe('2026-01-01');
      });

      test('parseDisplayDate returns null for unrecognised formats', () => {
        expect(parseDisplayDate('11-08-2027')).toBeNull();
        expect(parseDisplayDate('2027/11/08')).toBeNull();
      });

      test('parseDisplayDate returns empty string for empty input', () => {
        expect(parseDisplayDate('')).toBe('');
        expect(parseDisplayDate(null)).toBe('');
      });

      test('formatDisplayDate converts YYYY-MM-DD to DD/MM/YYYY correctly', () => {
        expect(formatDisplayDate('2027-11-08')).toBe('08/11/2027'); // 8 Nov
        expect(formatDisplayDate('2027-08-11')).toBe('11/08/2027'); // 11 Aug
        expect(formatDisplayDate('2026-01-01')).toBe('01/01/2026');
      });

      test('formatDisplayDate round-trips through parseDisplayDate without swapping', () => {
        // The critical regression: entering 08/11/2027 must not become 11/08/2027
        const userInput = '08/11/2027';
        const iso = parseDisplayDate(userInput);
        const displayed = formatDisplayDate(iso);
        expect(displayed).toBe(userInput);
      });
    });

  describe('Plan by Work Area', () => {
    test('renderPlanByUnit keeps Unit 2/3/6 tabs and shows only active unit rows', () => {
      prodState.products = [
        { id: 'p1', name: 'Pump A', part_number: 'PA-01', work_location: 'Unit 2' },
        { id: 'p2', name: 'Pump B', part_number: 'PB-01', work_location: 'Unit 3' }
      ];
      prodState.batches = [
        { id: 'b1', product_id: 'p1', work_location: 'Unit 2', quantity: 10, start_date: '2026-03-10', due_date: '2026-03-20', status: 'Planned' },
        { id: 'b2', product_id: 'p2', work_location: 'Unit 3', quantity: 8, start_date: '2026-03-12', due_date: '2026-03-24', status: 'Planned' }
      ];
      prodState.activeUnit = 'Unit 2';

      const html = renderPlanByUnit();

      expect(html).toContain('Unit 2');
      expect(html).toContain('Unit 3');
      expect(html).toContain('Unit 6');
      expect(html).toContain('Pump A');
      expect(html).not.toContain('Pump B');
    });

    test('buildGanttTimeline renders 2-month structure and IN/OUT details', () => {
      prodState.products = [
        { id: 'p1', name: 'Rotor X', part_number: 'RX-21', work_location: 'Unit 2' }
      ];

      const html = buildGanttTimeline([
        { id: 'b1', product_id: 'p1', work_location: 'Unit 2', quantity: 5, start_date: '2026-03-01', due_date: '2026-04-14', status: 'In Progress' }
      ], '2026-03-05');

      const monthBandCount = (html.match(/class="gantt-month-band"/g) || []).length;
      expect(monthBandCount).toBe(2);
      expect(html).toContain('IN: 01/03/2026');
      expect(html).toContain('OUT: 14/04/2026');
      expect(html).toContain('Window:');
    });

    test('month navigation remains rolling by 1 month', () => {
      prodPlanMonthOffset = 1;
      const html = buildGanttTimeline([], '2026-03-05');

      expect(html).toContain('data-action="plan-month-offset" data-offset="0"');
      expect(html).toContain('data-action="plan-month-offset" data-offset="2"');
    });
  });

  describe('Plan by Product', () => {
    test('renderPlanByProduct shows product dropdown and selected product gantt', () => {
      prodState.products = [
        { id: 'p1', name: 'Rotor X', part_number: 'RX-21', status: 'active', family: 'f1', lead_time_days: 30 },
        { id: 'p2', name: 'Stator Y', part_number: 'SY-11', status: 'active', family: 'f2' }
      ];
      prodState.batches = [
        { id: 'b1', product_id: 'p1', work_location: 'Unit 2', quantity: 5, start_date: '2026-03-01', due_date: '2026-04-14', status: 'In Progress' },
        { id: 'b2', product_id: 'p2', work_location: 'Unit 3', quantity: 4, start_date: '2026-03-08', due_date: '2026-03-28', status: 'Planned' }
      ];

      const html = renderPlanByProduct();

      expect(html).toContain('id="prodProductPicker"');
      expect(html).toContain('data-action="plan-set-active-product"');
      expect(html).toContain('Rotor X');
      expect(html).not.toContain('Batch 1 • Unit 3');
      expect(html).toContain('6-month schedule with weekly and monthly scale');
      expect(html).toContain('All current card information retained');
      expect(html).toContain('Today');
    });

    test('buildProductSixMonthGantt renders 6 month bands and week labels', () => {
      const product = { id: 'p1', name: 'Rotor X', part_number: 'RX-21' };
      const html = buildProductSixMonthGantt(product, [
        { id: 'b1', product_id: 'p1', work_location: 'Unit 2', quantity: 5, start_date: '2026-03-01', due_date: '2026-04-14', status: 'In Progress' }
      ], '2026-03-05');

      const monthBandCount = (html.match(/class="gantt-month-band"/g) || []).length;
      expect(monthBandCount).toBe(6);
      expect(html).toContain('gantt-week-marker-name');
      expect(html).toContain('Window:');
      expect(html).toContain('Today');
    });
  });
});
