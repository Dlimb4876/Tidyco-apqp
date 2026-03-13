const fs = require('fs');
const path = require('path');

describe('Product Management Event Delegation', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="mount"></div>';

    global.db = { programmes: [] };
    global.familiesState = { loading: false, families: [] };
    global.productsState = { products: [] };

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.getFamilies = jest.fn(() => [
      { id: 'hvac', label: 'HVAC', icon: 'H' }
    ]);

    global.productsDataGetAll = jest.fn(() => [
      {
        id: 'prod-1',
        name: 'Pump A',
        part_number: 'PN-100',
        family: 'hvac',
        work_location: 'Unit 2',
        customer: 'Acme',
        current_overhaul_hours: 10,
        turnaround_days: 5,
        notes: 'Initial note',
        status: 'Tender'
      }
    ]);

    global.productsDataAddProduct = jest.fn().mockResolvedValue(undefined);
    global.productsDataUpdateProduct = jest.fn().mockResolvedValue(undefined);
    global.productsDataDeleteProduct = jest.fn().mockResolvedValue(undefined);
    global.prodDataReloadProducts = jest.fn().mockResolvedValue(undefined);

    global.familiesDataGetAll = jest.fn(() => []);
    global.familiesDataAddFamily = jest.fn().mockResolvedValue(undefined);
    global.familiesDataUpdateFamily = jest.fn().mockResolvedValue(undefined);
    global.familiesDataDeleteFamily = jest.fn().mockResolvedValue(undefined);

    global.ensureFamiliesTabData = jest.fn();
    global.renderAllProductsTrends = jest.fn();

    global.setProductDevelopmentTab = jest.fn();
    global.render = jest.fn();
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/product-management/js/products.js'),
      'utf8'
    );
    eval(`${script}
window.renderProductsPortalHTML = renderProductsPortalHTML;
window.renderProductsPortalSetup = renderProductsPortalSetup;
window.renderFamiliesTabContent = renderFamiliesTabContent;
window.renderProductsList = renderProductsList;
window.setupProductsEventListeners = setupProductsEventListeners;`);
  });

  test('renderProductsPortalHTML has delegated actions and no inline onclick', () => {
    const html = window.renderProductsPortalHTML();

    expect(html).toContain('data-action="products-back-root"');
    expect(html).toContain('data-action="products-switch-tab"');
    expect(html).not.toContain('onclick=');
  });

  test('renderFamiliesTabContent uses delegated actions and no inline onclick', () => {
    document.body.innerHTML = '<div id="productsFamiliesTab"></div>';
    familiesState = {
      loading: false,
      families: [{ id: 'hvac', name: 'HVAC', label: 'HVAC', icon: 'H', description: 'Heating' }]
    };
    familiesDataGetAll = jest.fn(() => familiesState.families);

    window.renderFamiliesTabContent();
    const html = document.getElementById('productsFamiliesTab').innerHTML;

    expect(html).toContain('data-action="families-add-row"');
    expect(html).toContain('data-action="families-start-edit"');
    expect(html).toContain('data-action="families-delete-row"');
    expect(html).not.toContain('onclick=');
  });

  test('renderProductsList uses delegated actions and no inline onclick', () => {
    document.body.innerHTML = '<div id="productsTable"></div><input id="productSearch" value="">';

    window.renderProductsList();
    const html = document.getElementById('productsTable').innerHTML;

    expect(html).toContain('data-action="products-add-row"');
    expect(html).toContain('data-action="products-start-edit"');
    expect(html).toContain('data-action="products-delete-row"');
    expect(html).not.toContain('onclick=');
  });

  test('delegated click on product edit opens inline edit row', () => {
    document.body.innerHTML = window.renderProductsPortalHTML();
    window.renderProductsList();
    window.setupProductsEventListeners();

    const editBtn = document.querySelector('[data-action="products-start-edit"][data-product-id="prod-1"]');
    expect(editBtn).toBeTruthy();

    editBtn.click();

    expect(document.getElementById('pEdit-name')).toBeTruthy();
  });
});
