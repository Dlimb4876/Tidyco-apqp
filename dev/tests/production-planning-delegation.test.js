const fs = require('fs');
const path = require('path');

describe('Production Hub and Planning Delegation', () => {
  beforeAll(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    document.documentElement.innerHTML = html.toString();

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.render = jest.fn();
    global.navigate = jest.fn();
    global.getFamilies = jest.fn(() => []);
    global.prodDataGetBatchesByProduct = jest.fn((id) =>
      (global.prodState.batches || []).filter(b => b.product_id === id)
    );
    global.prodDataGetBatchesByWorkLocation = jest.fn((unit) =>
      (global.prodState.batches || []).filter(b => b.work_location === unit)
    );
    global.prodDataGetProductById = jest.fn((id) =>
      (global.prodState.products || []).find(p => p.id === id) || null
    );
    global.formatDisplayDate = jest.fn((d) => d ? '01/03/2026' : '—');
    global.prodSetActiveProduct = jest.fn((id) => {
      global.prodState.activeProductId = id;
    });
    global.prodSetActiveUnit = jest.fn((unit) => {
      global.prodState.activeUnit = unit;
    });

    const planningScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/planning.js'), 'utf8');
    const productionScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/production.js'), 'utf8');

    eval(`${planningScript}\nif (typeof renderPlanByProduct === 'function') global.renderPlanByProduct = renderPlanByProduct;`);
    eval(`${productionScript}\nif (typeof renderProduction === 'function') global.renderProduction = renderProduction;`);
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    global.productionTab = 'root';
    global.prodPlanMonthOffset = 0;
    global.prodState = {
      products: [
        { id: 'p1', name: 'Rotor X', part_number: 'RX-21', status: 'active', work_location: 'Unit 2' },
        { id: 'p2', name: 'Stator Y', part_number: 'SY-11', status: 'active', work_location: 'Unit 3' }
      ],
      batches: [
        { id: 'b1', product_id: 'p1', work_location: 'Unit 2', quantity: 3, start_date: '2026-03-01', due_date: '2026-03-15', status: 'Planned' }
      ],
      activeUnit: 'Unit 2',
      activeProductId: 'p1'
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('production root hub card click updates production tab', () => {
    const html = global.renderProduction();
    document.body.innerHTML = html;
    jest.runOnlyPendingTimers();

    const hubCard = document.querySelector('[data-action="prod-hub-tab"][data-tab="by-product"]');
    hubCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(global.productionTab).toBe('by-product');
    expect(render).toHaveBeenCalled();
  });

  test('production back button delegates to navigate hub', () => {
    const html = global.renderProduction();
    document.body.innerHTML = html;
    jest.runOnlyPendingTimers();

    const backBtn = document.querySelector('[data-action="prod-nav-hub"]');
    backBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(navigate).toHaveBeenCalledWith('hub');
  });

  test('planning product picker change delegates to set active product', () => {
    const html = global.renderPlanByProduct();
    document.body.innerHTML = html;
    jest.runOnlyPendingTimers();

    const picker = document.getElementById('prodProductPicker');
    picker.value = 'p2';
    picker.dispatchEvent(new Event('change', { bubbles: true }));

    expect(prodSetActiveProduct).toHaveBeenCalledWith('p2');
    expect(render).toHaveBeenCalled();
  });

  test('planning month navigation click updates offset and re-renders', () => {
    const html = global.renderPlanByProduct();
    document.body.innerHTML = html;
    jest.runOnlyPendingTimers();

    const nextBtn = document.querySelector('[data-action="plan-month-offset"][data-offset="1"]');
    nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(global.prodPlanMonthOffset).toBe(1);
    expect(render).toHaveBeenCalled();
  });
});
