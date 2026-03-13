const fs = require('fs');
const path = require('path');

describe('Production Products Delegation (products.js)', () => {
  let originalConfirm;
  let originalAlert;

  beforeAll(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    document.documentElement.innerHTML = html.toString();

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.getFamilies = jest.fn(() => [
      { id: 'fam-a', label: 'Family A' },
      { id: 'fam-b', label: 'Family B' }
    ]);

    global.handleCellKey = jest.fn();
    global.setProductionTab = jest.fn();
    global.prodDataUpdateProduct = jest.fn(async () => {});
    global.prodDataDeleteProduct = jest.fn(async () => {});
    global.prodDataAddProduct = jest.fn(async () => {});

    originalConfirm = global.confirm;
    originalAlert = global.alert;
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();

    const script = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/products.js'), 'utf8');
    eval(`${script}\nif (typeof renderProductMaster === 'function') global.renderProductMaster = renderProductMaster;`);
  });

  afterAll(() => {
    global.confirm = originalConfirm;
    global.alert = originalAlert;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    global.prodState = {
      products: [
        {
          name: 'Rotor X',
          part_number: 'RX-21',
          family: 'fam-a',
          lead_time_days: 21,
          status: 'active',
          assigned_unit: 'Unit 2',
          notes: 'Existing notes'
        }
      ]
    };

    const html = global.renderProductMaster();
    document.body.innerHTML = html;
    jest.runOnlyPendingTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('rendered HTML has no inline onchange/onkeydown/onclick handlers', () => {
    const html = global.renderProductMaster();

    expect(html).not.toContain('onchange=');
    expect(html).not.toContain('onkeydown=');
    expect(html).not.toContain('onclick=');
    expect(html).toContain('data-action="update-product"');
    expect(html).toContain('data-action="new-row-keydown"');
  });

  test('delegated change updates an existing product field', async () => {
    const nameInput = document.querySelector('[data-action="update-product"][data-field="name"]');
    nameInput.value = 'Rotor X Updated';
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    await Promise.resolve();

    expect(prodDataUpdateProduct).toHaveBeenCalledWith(0, 'name', 'Rotor X Updated');
  });

  test('delegated click adds a new product from the quick-add row', async () => {
    document.getElementById('prod-new-name').value = 'New Product';
    document.getElementById('prod-new-code').value = 'NP-100';
    document.getElementById('prod-new-family').value = 'fam-b';
    document.getElementById('prod-new-lead').value = '14';
    document.getElementById('prod-new-status').value = 'inactive';
    document.getElementById('prod-new-unit').value = 'Unit 6';
    document.getElementById('prod-new-notes').value = 'From delegated click';

    const addBtn = document.querySelector('[data-action="add-product"]');
    addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(prodDataAddProduct).toHaveBeenCalledWith(
      'New Product',
      'NP-100',
      'fam-b',
      '14',
      'From delegated click',
      'inactive',
      'Unit 6'
    );
  });

  test('delegated click asks for confirmation before delete', async () => {
    const deleteBtn = document.querySelector('[data-action="delete-product"][data-idx="0"]');
    deleteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    expect(confirm).toHaveBeenCalledWith('Delete product?');
    expect(prodDataDeleteProduct).toHaveBeenCalledWith(0);
  });

  test('new-row keydown supports Ctrl+Enter save', async () => {
    document.getElementById('prod-new-name').value = 'Keyboard Product';

    const newName = document.getElementById('prod-new-name');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
    newName.dispatchEvent(enterEvent);
    await Promise.resolve();

    expect(prodDataAddProduct).toHaveBeenCalled();
  });

  test('edit-row keydown delegates to handleCellKey', () => {
    const editField = document.querySelector('[data-keydown="edit-row"]');
    const keyEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    editField.dispatchEvent(keyEvent);

    expect(handleCellKey).toHaveBeenCalled();
  });
});
