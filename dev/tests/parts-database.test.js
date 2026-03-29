import { jest } from '@jest/globals';

// Set up mocks using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  esc: (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;'),
  showModal: jest.fn(),
  closeModal: jest.fn(),
  showToast: jest.fn(),
  canEdit: jest.fn(() => true)
}));

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn(),
  removeRealtimeSubscription: jest.fn()
}));

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  render: jest.fn()
}));

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {
    currentSection: 'product-development',
    productDevelopmentTab: 'parts-database',
    npiDashboardTab: 'projects'
  }
}));

const mockFetchCatalogue = jest.fn().mockResolvedValue([
  { id: 'part-1', pn: 'PN-1', item_desc: 'Bolt', unit: 'ea', abc_class: 'A', in_sage: true, notes: 'critical' },
  { id: 'part-2', pn: 'PN-2', item_desc: 'Nut', unit: 'ea', abc_class: 'C', in_sage: false, notes: '' }
]);
const mockSaveCatalogueEntry = jest.fn();
const mockDeleteCatalogueEntry = jest.fn();
const mockFetchPartUsage = jest.fn().mockResolvedValue([]);

jest.unstable_mockModule('../portals/product-development/parts-database/js/parts-data.js', () => ({
  partsDataApi: {
    fetchCatalogue: mockFetchCatalogue,
    saveCatalogueEntry: mockSaveCatalogueEntry,
    deleteCatalogueEntry: mockDeleteCatalogueEntry,
    fetchPartUsage: mockFetchPartUsage
  }
}));

// Dynamically import modules after mocks are set up
const { showModal, closeModal } = await import('../utils/js/helpers.js');
const { getPartsDatabase } = await import('../portals/product-development/parts-database/js/parts-database.js');

describe('Parts Database picker ownership', () => {
  let partsDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="host"></div>';

    // Set up global state
    global.window = global;
    global.currentSection = 'product-development';
    global.productDevelopmentTab = 'parts-database';
    global.npiDashboardTab = 'projects';
    global.abcCatalogueData = [];
    global.abcCatalogueLoading = false;
    global.abcCatalogueLoaded = false;
    global.abcCatalogueSearch = '';
    global.abcCatalogueClassFilter = 'all';
    global.abcEditTarget = null;
    global.abcPickTarget = null;
    global.abcPickResults = [];
    global.abcPickLoading = false;
    global.abcPickSearch = '';
    global.abcPickClassFilter = 'all';
    global.abcPickSelected = [];

    // Create modal elements that parts-database.js expects
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
      <div id="modalABCPick" style="display:none">
        <input id="abcPickSearchInput" />
        <div id="abcPickList"></div>
        <button id="abcPickAddBtn" disabled>Add Parts</button>
      </div>
    `;
    document.body.appendChild(modalContainer);

    // Get fresh instance of partsDatabase
    partsDatabase = getPartsDatabase();
    
    // Bind methods to global.window for onclick handlers in HTML
    window.partsDatabase = partsDatabase;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('standalone parts subsystem opens the picker and confirms selected rows', async () => {
    const onConfirm = jest.fn();

    await partsDatabase.openPick({
      getAlreadyAddedIds: () => new Set(['part-2']),
      onConfirm
    });

    expect(mockFetchCatalogue).toHaveBeenCalled();
    expect(document.getElementById('abcPickList').textContent).toContain('Bolt');
    expect(document.getElementById('abcPickList').textContent).toContain('Already in BOM');

    partsDatabase.togglePick(0);

    await partsDatabase.confirmPick();

    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'part-1', item_desc: 'Bolt' })
    ]);
    expect(closeModal).toHaveBeenCalledWith('modalABCPick');
  });
});
