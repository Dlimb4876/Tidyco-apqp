const fs = require('fs');
const path = require('path');

describe('Product Development family template modal flow', () => {
  let templateItems;

  function renderProductDevelopmentShell() {
    const mount = document.getElementById('mainContent');
    mount.innerHTML = `<div class="section-inner">${window.renderProductDevelopment()}</div>`;

    const pdContainer = mount.querySelector('#product-development-portal-container');
    if (!pdContainer) return;

    if (window.__getFamilyModalState().isOpen) {
      pdContainer.insertAdjacentHTML('beforeend', window.renderFamilyModal());
    }

    if (window.__getTemplateManagerState().isOpen) {
      pdContainer.insertAdjacentHTML('beforeend', window.renderTemplateManager());
    }

    if (window.__getTemplateViewerState().isOpen) {
      pdContainer.insertAdjacentHTML('beforeend', window.renderTemplateViewer());
    }

    window.setupProductDevelopmentPortalDelegation();
  }

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = '<div id="mainContent"></div>';

    templateItems = [
      {
        id: 'tpl-1',
        family_id: 'family-1',
        template_name: 'Standard Family PFMEA',
        failure_mode: 'Define key family failure mode',
        effect: 'Initial PFMEA template for HVAC Systems',
        severity: 3,
        cause: null,
        occurrence: 3,
        prevention_control: null,
        detection_control: null,
        detection: 3,
        notes: 'Auto-created when product family is added'
      }
    ];

    global.currentSection = 'product-development';
    global.productDevelopmentTab = 'product-family-db';
    global.familiesState = {
      loading: false,
      families: [
        {
          id: 'family-1',
          name: 'hvac',
          label: 'HVAC Systems',
          icon: 'H',
          description: 'Heating and cooling assemblies'
        }
      ]
    };

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.navigate = jest.fn();
    global.showGuide = jest.fn();
    global.showToast = jest.fn();
    global.confirm = jest.fn(() => true);
    global.canViewPortalTab = jest.fn(() => true);

    global.npi = {
      dashboard: {
        renderProjects: jest.fn(() => '<div>Projects</div>')
      }
    };

    global.familiesDataAddFamily = jest.fn();
    global.familiesDataUpdateFamily = jest.fn();
    global.familiesDataDeleteFamily = jest.fn();
    global.familyTemplatesDeleteFamily = jest.fn().mockResolvedValue(true);

    global.familyTemplatesGetByFamily = jest.fn((familyId) =>
      templateItems.filter(item => item.family_id === familyId)
    );
    global.familyTemplatesGetGroupedByFamily = jest.fn((familyId) => {
      return window.familyTemplatesGetByFamily(familyId).reduce((grouped, item) => {
        if (!grouped[item.template_name]) grouped[item.template_name] = [];
        grouped[item.template_name].push(item);
        return grouped;
      }, {});
    });
    global.familyTemplatesGetStats = jest.fn((familyId) => {
      const items = window.familyTemplatesGetByFamily(familyId);
      return {
        templateCount: new Set(items.map(item => item.template_name)).size,
        itemCount: items.length,
        averageRPN: 27,
        templateNames: Array.from(new Set(items.map(item => item.template_name)))
      };
    });

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/js/product-development.js'),
      'utf8'
    );

    eval(`${script}
window.renderProductDevelopment = renderProductDevelopment;
  window.setProductDevelopmentTab = setProductDevelopmentTab;
window.setupProductDevelopmentPortalDelegation = setupProductDevelopmentPortalDelegation;
window.renderFamilyModal = renderFamilyModal;
window.renderTemplateManager = renderTemplateManager;
window.renderTemplateViewer = renderTemplateViewer;
window.__getFamilyModalState = () => familyModalState;
window.__getTemplateManagerState = () => templateManagerState;
window.__getTemplateViewerState = () => templateViewerState;`);

    global.render = jest.fn(() => {
      renderProductDevelopmentShell();
    });

    renderProductDevelopmentShell();
  });

  test('opens template manager, opens viewer, and closes both modals', () => {
    const openManagerButton = document.querySelector('[data-action="pd-show-template-manager"]');
    expect(openManagerButton).toBeTruthy();

    openManagerButton.click();

    expect(document.body.textContent).toContain('PFMEA Templates for HVAC Systems');

    const viewButton = document.querySelector('[data-action="pd-show-template-viewer"]');
    expect(viewButton).toBeTruthy();

    viewButton.click();

    expect(document.body.textContent).toContain('Standard Family PFMEA');
    expect(document.body.textContent).toContain('Define key family failure mode');
    expect(document.body.textContent).toContain('Auto-created when product family is added');

    const viewerCloseButton = document.querySelector('[data-action="pd-close-template-viewer"]');
    expect(viewerCloseButton).toBeTruthy();

    viewerCloseButton.click();

    expect(document.body.textContent).not.toContain('Define key family failure mode');
    expect(document.body.textContent).toContain('PFMEA Templates for HVAC Systems');

    const managerCloseButton = document.querySelector('[data-action="pd-close-template-manager"]');
    expect(managerCloseButton).toBeTruthy();

    managerCloseButton.click();

    expect(document.body.textContent).not.toContain('PFMEA Templates for HVAC Systems');
    expect(document.body.textContent).toContain('Product Family Database');
  });

  test('hides product-development hub cards the user cannot view', () => {
    global.productDevelopmentTab = 'root';
    global.canViewPortalTab = jest.fn((section, tab) => !(section === 'product-development' && tab === 'product-management'));

    renderProductDevelopmentShell();

    expect(document.body.textContent).toContain('NPI Projects');
    expect(document.body.textContent).not.toContain('Product Management');
    expect(document.body.textContent).toContain('Parts Database');
  });

  test('does not switch to a hidden product-development tab', () => {
    global.productDevelopmentTab = 'root';
    global.canViewPortalTab = jest.fn((section, tab) => !(section === 'product-development' && tab === 'product-management'));

    window.setProductDevelopmentTab('product-management');

    expect(global.productDevelopmentTab).toBe('root');
  });
});