const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock BOM_TYPES constant
global.BOM_TYPES = {
  parts: { icon: '🔩', label: 'Parts' },
  tools: { icon: '🔧', label: 'Tools' },
  equip: { icon: '⚙️', label: 'Equipment' },
  cons: { icon: '📦', label: 'Consumables' },
  mat: { icon: '🧪', label: 'Materials' }
};

// Mock global functions
global.esc = jest.fn((str) => str?.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') || '');
global.emptyState = jest.fn((icon, title, subtitle) => `<div class="empty">${icon} ${title}: ${subtitle}</div>`);
global.canEdit = jest.fn(() => true);
global.render = jest.fn();
global.writeNavigationHistory = jest.fn();
global.npiRelFetchABCCatalogue = jest.fn(() => Promise.resolve([]));

// Mock state globals
global.bomSubTab = 'tree';
global.bomPartsRegisterView = 'total';
global.bomAbcFilter = 'all';
global.bomTreeExpanded = new Set();
global.abcCatalogueData = [];
global.progId = 'test-proj';

// Mock npi namespace
global.npi = {
  bom: {},
  data: {
    bom: {
      addRow: jest.fn(),
      updRow: jest.fn(),
      delRow: jest.fn()
    }
  },
  components: {
    tableHeader: jest.fn((cols) => `<thead>${cols.map(c => `<th>${c.label}</th>`).join('')}</thead>`)
  }
};

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Load bom script
const script = fs.readFileSync(path.resolve(__dirname, '../portals/product-development/npi/js/bom.js'), 'utf8');
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('BOM Module (bom.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.bomSubTab = 'tree';
    global.bomPartsRegisterView = 'total';
    global.bomAbcFilter = 'all';
    global.bomTreeExpanded = new Set();
    global.abcCatalogueData = [];
  });

  // ── _collectPartsFromTree() ─────────────────────────────────
  describe('_collectPartsFromTree()', () => {
    test('should collect parts from flat tree', () => {
      const nodes = [
        { nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' },
        { nodeType: 'part', pn: 'PN002', desc: 'Part 2', qty: 1, unit: 'kg' }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatchObject({ pn: 'PN001', qty: 2, unit: 'ea', source: 'structure' });
      expect(parts[1]).toMatchObject({ pn: 'PN002', qty: 1, unit: 'kg', source: 'structure' });
    });

    test('should multiply quantities by parent quantity', () => {
      const nodes = [
        { nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 3);
      
      expect(parts[0].qty).toBe(6); // 2 * 3
    });

    test('should recursively collect parts from subassemblies', () => {
      const nodes = [
        {
          nodeType: 'subassembly',
          qty: 2,
          children: [
            { nodeType: 'part', pn: 'CHILD001', desc: 'Child Part', qty: 3, unit: 'ea' }
          ]
        }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts).toHaveLength(1);
      expect(parts[0]).toMatchObject({ pn: 'CHILD001', qty: 6 }); // 3 * 2
    });

    test('should handle nested subassemblies', () => {
      const nodes = [
        {
          nodeType: 'subassembly',
          qty: 2,
          children: [
            {
              nodeType: 'subassembly',
              qty: 3,
              children: [
                { nodeType: 'part', pn: 'NESTED', desc: 'Nested Part', qty: 1, unit: 'ea' }
              ]
            }
          ]
        }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].qty).toBe(6); // 1 * 3 * 2
    });

    test('should handle empty nodes array', () => {
      const parts = npi.bom._collectPartsFromTree([], 1);
      expect(parts).toHaveLength(0);
    });

    test('should skip non-part, non-subassembly nodes', () => {
      const nodes = [
        { nodeType: 'unknown', pn: 'UNKNOWN', desc: 'Unknown' },
        { nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 1, unit: 'ea' }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].pn).toBe('PN001');
    });

    test('should include abcCatalogueId when present', () => {
      const nodes = [
        { nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 1, unit: 'ea', abcCatalogueId: 'abc123' }
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts[0].abcCatalogueId).toBe('abc123');
    });

    test('should handle missing qty defaulting to 1', () => {
      const nodes = [
        { nodeType: 'part', pn: 'PN001', desc: 'Part 1', unit: 'ea' } // qty is undefined
      ];
      
      const parts = npi.bom._collectPartsFromTree(nodes, 1);
      
      expect(parts[0].qty).toBe(1);
    });
  });

  // ── _collectPartsFromAawGroups() ────────────────────────────
  describe('_collectPartsFromAawGroups()', () => {
    test('should collect parts from AAW groups with aaw tag', () => {
      const groups = [
        {
          tag: 'aaw',
          nodes: [
            { nodeType: 'part', pn: 'AAW001', desc: 'AAW Part', qty: 2, unit: 'ea' }
          ]
        }
      ];
      
      const parts = npi.bom._collectPartsFromAawGroups(groups);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].source).toBe('aaw');
    });

    test('should collect parts from repair groups with repair tag', () => {
      const groups = [
        {
          tag: 'repair',
          nodes: [
            { nodeType: 'part', pn: 'REP001', desc: 'Repair Part', qty: 1, unit: 'ea' }
          ]
        }
      ];
      
      const parts = npi.bom._collectPartsFromAawGroups(groups);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].source).toBe('repair');
    });

    test('should handle groups without tag', () => {
      const groups = [
        {
          tag: null,
          nodes: [
            { nodeType: 'part', pn: 'OTHER001', desc: 'Other Part', qty: 1, unit: 'ea' }
          ]
        }
      ];
      
      const parts = npi.bom._collectPartsFromAawGroups(groups);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].source).toBe('aaw_repair');
    });

    test('should handle empty groups array', () => {
      const parts = npi.bom._collectPartsFromAawGroups([]);
      expect(parts).toHaveLength(0);
    });

    test('should handle groups with empty nodes', () => {
      const groups = [
        { tag: 'aaw', nodes: [] },
        { tag: 'repair', nodes: [{ nodeType: 'part', pn: 'REP001', desc: 'Repair Part', qty: 1, unit: 'ea' }] }
      ];
      
      const parts = npi.bom._collectPartsFromAawGroups(groups);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].source).toBe('repair');
    });
  });

  // ── _aggregatePartsRegister() ───────────────────────────────
  describe('_aggregatePartsRegister()', () => {
    test('should aggregate parts by part number', () => {
      const p = {
        bom: {
          tree: [
            { id: 't1', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' },
            { id: 't2', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 3, unit: 'ea' }
          ],
          aaw_repair: []
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(1);
      expect(parts[0]).toMatchObject({ pn: 'PN001', qty: 5, unit: 'ea' });
    });

    test('should combine parts from tree and AAW groups', () => {
      const p = {
        bom: {
          tree: [
            { id: 't1', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' }
          ],
          aaw_repair: [
            {
              tag: 'aaw',
              nodes: [
                { id: 'a1', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 3, unit: 'ea' },
                { id: 'a2', nodeType: 'part', pn: 'PN002', desc: 'Part 2', qty: 1, unit: 'ea' }
              ]
            }
          ]
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(2);
      const pn001 = parts.find(p => p.pn === 'PN001');
      expect(pn001.qty).toBe(5);
      expect(pn001.sources).toContain('structure');
      expect(pn001.sources).toContain('aaw');
    });

    test('should filter by structure view', () => {
      global.bomPartsRegisterView = 'structure';
      const p = {
        bom: {
          tree: [
            { id: 't1', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' }
          ],
          aaw_repair: [
            {
              tag: 'aaw',
              nodes: [
                { id: 'a1', nodeType: 'part', pn: 'PN002', desc: 'Part 2', qty: 1, unit: 'ea' }
              ]
            }
          ]
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].pn).toBe('PN001');
    });

    test('should filter by AAW view', () => {
      global.bomPartsRegisterView = 'aaw';
      const p = {
        bom: {
          tree: [
            { id: 't1', nodeType: 'part', pn: 'PN001', desc: 'Part 1', qty: 2, unit: 'ea' }
          ],
          aaw_repair: [
            {
              tag: 'aaw',
              nodes: [
                { id: 'a1', nodeType: 'part', pn: 'PN002', desc: 'Part 2', qty: 1, unit: 'ea' }
              ]
            }
          ]
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].pn).toBe('PN002');
    });

    test('should handle empty BOM', () => {
      const p = {
        bom: {
          tree: [],
          aaw_repair: []
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(0);
    });

    test('should use description as key when pn is empty', () => {
      const p = {
        bom: {
          tree: [
            { id: 't1', nodeType: 'part', pn: '', desc: 'Unnamed Part', qty: 2, unit: 'ea' }
          ],
          aaw_repair: []
        }
      };
      
      const parts = npi.bom._aggregatePartsRegister(p);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].pn).toBe('');
      expect(parts[0].desc).toBe('Unnamed Part');
    });
  });

  // ── _buildBomTree() ─────────────────────────────────────────
  describe('_buildBomTree()', () => {
    test('should build tree from flat nodes', () => {
      const nodes = [
        { id: '1', nodeType: 'subassembly', parentId: null, sortOrder: 1 },
        { id: '2', nodeType: 'part', parentId: '1', sortOrder: 1 },
        { id: '3', nodeType: 'part', parentId: '1', sortOrder: 2 }
      ];
      
      const roots = npi.bom._buildBomTree(nodes);
      
      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('1');
      expect(roots[0].children).toHaveLength(2);
      expect(roots[0].children[0].id).toBe('2');
      expect(roots[0].children[1].id).toBe('3');
    });

    test('should handle multiple root nodes', () => {
      const nodes = [
        { id: '1', nodeType: 'subassembly', parentId: null, sortOrder: 2 },
        { id: '2', nodeType: 'subassembly', parentId: null, sortOrder: 1 }
      ];
      
      const roots = npi.bom._buildBomTree(nodes);
      
      expect(roots).toHaveLength(2);
      expect(roots[0].id).toBe('2'); // Sorted by sortOrder
      expect(roots[1].id).toBe('1');
    });

    test('should handle orphaned nodes (missing parent)', () => {
      const nodes = [
        { id: '1', nodeType: 'part', parentId: 'nonexistent', sortOrder: 1 }
      ];
      
      const roots = npi.bom._buildBomTree(nodes);
      
      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('1');
    });

    test('should sort children recursively', () => {
      const nodes = [
        { id: '1', nodeType: 'subassembly', parentId: null, sortOrder: 1 },
        { id: '2', nodeType: 'part', parentId: '1', sortOrder: 2 },
        { id: '3', nodeType: 'part', parentId: '1', sortOrder: 1 },
        { id: '4', nodeType: 'subassembly', parentId: '1', sortOrder: 3 },
        { id: '5', nodeType: 'part', parentId: '4', sortOrder: 2 },
        { id: '6', nodeType: 'part', parentId: '4', sortOrder: 1 }
      ];
      
      const roots = npi.bom._buildBomTree(nodes);
      
      expect(roots[0].children[0].id).toBe('3'); // First level sorted
      expect(roots[0].children[1].id).toBe('2');
      expect(roots[0].children[2].id).toBe('4');
      expect(roots[0].children[2].children[0].id).toBe('6'); // Second level sorted
      expect(roots[0].children[2].children[1].id).toBe('5');
    });

    test('should handle empty nodes array', () => {
      const roots = npi.bom._buildBomTree([]);
      expect(roots).toHaveLength(0);
    });

    test('should preserve all node properties', () => {
      const nodes = [
        { id: '1', nodeType: 'part', pn: 'PN001', desc: 'Test Part', qty: 5, parentId: null, sortOrder: 1 }
      ];
      
      const roots = npi.bom._buildBomTree(nodes);
      
      expect(roots[0]).toMatchObject({
        id: '1',
        nodeType: 'part',
        pn: 'PN001',
        desc: 'Test Part',
        qty: 5
      });
    });
  });

  // ── setBomTab() ─────────────────────────────────────────────
  describe('setBomTab()', () => {
    beforeEach(() => {
      global.bomSubTab = 'tree';
      global.apqpTab = 'ctq';
    });

    test('should set bomSubTab to new value', () => {
      npi.bom.setBomTab('parts');
      expect(global.bomSubTab).toBe('parts');
    });

    test('should call render()', () => {
      npi.bom.setBomTab('parts');
      expect(render).toHaveBeenCalled();
    });

    test('should update URL with bt param when tab is not tree', () => {
      npi.bom.setBomTab('parts');
      expect(writeNavigationHistory).toHaveBeenCalled();
      const url = writeNavigationHistory.mock.calls[0][0];
      expect(url).toContain('bt=parts');
    });

    test('should not include bt param when tab is tree', () => {
      npi.bom.setBomTab('tree');
      const url = writeNavigationHistory.mock.calls[0][0];
      expect(url).not.toContain('bt=');
    });
  });

  // ── BOM Row Operations ──────────────────────────────────────
  describe('BOM Row Operations', () => {
    test('addBomRow should call npi.data.bom.addRow and render', () => {
      npi.bom.addBomRow('parts');
      expect(npi.data.bom.addRow).toHaveBeenCalledWith('parts');
      expect(render).toHaveBeenCalled();
    });

    test('updBom should call npi.data.bom.updRow', () => {
      npi.bom.updBom('parts', 0, 'qty', 5);
      expect(npi.data.bom.updRow).toHaveBeenCalledWith('parts', 0, 'qty', 5);
    });

    test('delBom should call npi.data.bom.delRow and render', () => {
      npi.bom.delBom('parts', 0);
      expect(npi.data.bom.delRow).toHaveBeenCalledWith('parts', 0);
      expect(render).toHaveBeenCalled();
    });
  });

  // ── setPartsRegisterView() ──────────────────────────────────
  describe('setPartsRegisterView()', () => {
    test('should set bomPartsRegisterView and render', () => {
      npi.bom.setPartsRegisterView('structure');
      expect(global.bomPartsRegisterView).toBe('structure');
      expect(render).toHaveBeenCalled();
    });
  });
});
