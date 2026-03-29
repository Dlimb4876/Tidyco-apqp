import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Project family sync', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();

    global.currentUser = { id: 'user-1', email: 'planner@test.com' };
    global.db = { projects: [] };
    global.productsState = { products: [] };
    global.familiesState = {
      families: [
        { id: 'family-hvac', name: 'HVAC', label: 'HVAC', icon: 'H' },
        { id: 'family-other', name: 'Other', label: 'Other', icon: 'O' }
      ]
    };
    global.createRealtimeSubscription = jest.fn();
    global.render = jest.fn();
    global.save = jest.fn();
    global.findProjectByProductId = (productId) => global.db.projects.find(p => p.product_id === productId) || null;
    global.productsDataGetAll = jest.fn(() => []);
    global.migrateprog = (project) => project;
    global.RPN_HIGH = 100;
    global.npi = {
      dashboard: {},
      gate: { gateAllSigned: jest.fn(() => false) },
      pfmea: { calcRPN: jest.fn(() => 0) },
      components: { badge: jest.fn(() => '') },
      bom: { renderABCCatalogue: jest.fn(() => '') },
      nav: {
        navigate: jest.fn(),
        openProjectById: jest.fn(),
        render: jest.fn(),
        openPfmeaTab: jest.fn(),
        stopEvent: jest.fn()
      }
    };

    // Use eval with fs.readFile for non-ESM compatible loading
    const stateScript = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8')
      .replace(/^const /gm, 'var ');
    eval(stateScript);

    db = global.db;
    familiesState = global.familiesState;
    currentSection = 'hub';
    productDevelopmentTab = 'npi';
    save = global.save;

    global.GATE_DEFS = GATE_DEFS;
    global.FAMILIES = FAMILIES;
    global.getFamilies = getFamilies;
    global.findFamilyRecord = findFamilyRecord;
    global.getDefaultFamilyId = getDefaultFamilyId;
    global.normalizeFamilyId = normalizeFamilyId;
    global.syncProjectFamily = syncProjectFamily;

    const productsDataScript = fs.readFileSync(path.resolve(__dirname, '../portals/product-development/product-management/js/products-data.js'), 'utf8');
    eval(`${productsDataScript}
  global.productsDataSyncLinkedProjectFamily = productsDataSyncLinkedProjectFamily;`);

    productsState = global.productsState;
  });

  test('normalizes legacy family names to the DB family id', () => {
    expect(normalizeFamilyId('HVAC')).toBe('family-hvac');
    expect(normalizeFamilyId('family-hvac')).toBe('family-hvac');
  });

  test('syncProjectFamily updates a project from legacy family text to the DB family id', () => {
    const project = { id: 'prog-1', product_id: 'prod-1', family: 'HVAC' };

    const changed = syncProjectFamily(project, 'family-hvac', project.family);

    expect(changed).toBe(true);
    expect(project.family).toBe('family-hvac');
  });
});
