import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Product Management Event Delegation', () => {
  beforeEach(async () => {
    jest.resetModules();
    document.body.innerHTML = '<div id="mount"></div>';

    global.db = { projects: [] };
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

    global.renderAllProductsTrends = jest.fn();

    global.setProductDevelopmentTab = jest.fn();
    global.render = jest.fn();
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
    global.showToast = jest.fn();

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/product-management/js/products.js'),
      'utf8'
    );
    const module = await import(`data:text/javascript,${encodeURIComponent(script + '\nwindow.renderProductsPortalHTML = renderProductsPortalHTML;\nwindow.renderProductsPortalSetup = renderProductsPortalSetup;\nwindow.renderProductsList = renderProductsList;\nwindow.setupProductsEventListeners = setupProductsEventListeners;')}`);
  });

  test('renderProductsPortalHTML has delegated actions and no inline onclick', () => {
    const html = window.renderProductsPortalHTML();

    expect(html).toContain('data-action="products-back-root"');
    expect(html).toContain('data-action="products-switch-tab"');
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
