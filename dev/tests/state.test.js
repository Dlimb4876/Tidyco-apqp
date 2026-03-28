const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Tests for state.js — Global state initialisation
// ─────────────────────────────────────────────────────────────

describe('State Module (state.js)', () => {
  // We need to load state.js in a way that variables become global
  // Since state.js uses 'let', we need to use a different approach
  beforeAll(() => {
    // Read the file and check its structure
    const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
    
    // Verify the file contains expected variable declarations
    expect(stateContent).toContain('let db = { projects: [] }');
    expect(stateContent).toContain("let currentSection = 'hub'");
    expect(stateContent).toContain("let apqpTab = 'ctq'");
    expect(stateContent).toContain("let bomSubTab = 'tree'");
  });

  // ── File Structure Tests ───────────────────────────────────
  describe('File Structure', () => {
    test('should contain all major state variable declarations', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      // Core state
      expect(stateContent).toContain('let db =');
      expect(stateContent).toContain('let progId =');
      expect(stateContent).toContain('let currentSection =');
      expect(stateContent).toContain('let currentUserRole =');
      
      // Tab states
      expect(stateContent).toContain('let apqpTab =');
      expect(stateContent).toContain('let bomSubTab =');
      expect(stateContent).toContain('let capacityTab =');
      expect(stateContent).toContain('let productionTab =');
      
      // Filter states
      expect(stateContent).toContain('let pfmeaRpnFilter =');
      expect(stateContent).toContain('let ctqSourceFilter =');
      expect(stateContent).toContain('let ctqCoverageFilter =');
      
      // Modal picker state
      expect(stateContent).toContain('let ctqPickTarget =');
      expect(stateContent).toContain('let bomPickTarget =');
      expect(stateContent).toContain('let bomTreeExpanded =');
      
      // ABC Catalogue state
      expect(stateContent).toContain('let abcCatalogueData =');
      expect(stateContent).toContain('let abcPickTarget =');
      
      // Action Centre state
      expect(stateContent).toContain('let actionCentreData =');
      expect(stateContent).toContain('let actionCentreLoading =');
      expect(stateContent).toContain('let actionCentreTab =');
      
      // Settings state
      expect(stateContent).toContain('let settingsActiveTab =');
      expect(stateContent).toContain('let settingsTeamsData =');
      
      // MCS state
      expect(stateContent).toContain('let mcsApproverConfig =');
      expect(stateContent).toContain('let mcsList =');
      expect(stateContent).toContain('let mcsCurrentFilter =');
    });

    test('should contain helper functions', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('function prog()');
      expect(stateContent).toContain('function findProjectByProductId(');
      expect(stateContent).toContain('function getDefaultGateSelection(');
      expect(stateContent).toContain('function normalizeGateSelections(');
    });

    test('should contain GATE_DEFS reference', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      expect(stateContent).toContain('GATE_DEFS');
    });
  });

  // ── Default Value Tests ─────────────────────────────────────
  describe('Default Values', () => {
    test('should have correct default values for navigation state', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("let currentSection = 'hub'");
      expect(stateContent).toContain('let progId = null');
    });

    test('should have correct default values for APQP/BOM', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("let apqpTab = 'ctq'");
      expect(stateContent).toContain("let bomSubTab = 'tree'");
      expect(stateContent).toContain("let bomPartsRegisterView = 'total'");
      expect(stateContent).toContain("let bomAbcFilter = 'all'");
    });

    test('should have correct default values for capacity', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("let capacityTab = 'root'");
      expect(stateContent).toContain("let prodCapTab  = 'dashboard'");
      expect(stateContent).toContain("let pmCapTab = 'tasks'");
      expect(stateContent).toContain('let prodCapUtilizationFactor = 1.0');
    });

    test('should have correct default values for filters', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("let pfmeaRpnFilter = 'all'");
      expect(stateContent).toContain("let ctqSourceFilter = 'all'");
      expect(stateContent).toContain("let ctqCoverageFilter = 'all'");
      expect(stateContent).toContain("let trackerSubAsmFilter = 'all'");
    });

    test('should initialize picker state correctly', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('let ctqPickTarget = null');
      expect(stateContent).toContain('let ctqPickSelected = []');
      expect(stateContent).toContain('let bomPickTarget = null');
      expect(stateContent).toContain('let bomPickSelected = []');
      expect(stateContent).toContain("let bomPickFilter = 'all'");
    });

    test('should initialize collections as empty', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('let bomTreeExpanded = new Set()');
      expect(stateContent).toContain('let bomAawTreeExpanded = new Set()');
      expect(stateContent).toContain('let collapsedGroups = new Set()');
      expect(stateContent).toContain('let abcCatalogueData    = []');
      expect(stateContent).toContain('let abcPickResults = []');
      expect(stateContent).toContain('let abcPickSelected = []');
    });

    test('should have correct defaults for Action Centre', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('let actionCentreData = null');
      expect(stateContent).toContain('let actionCentreLoading = false');
      expect(stateContent).toContain("let actionCentreTab = 'all'");
      expect(stateContent).toContain("let actionCentreStatusFilter = 'open'");
    });

    test('should have correct defaults for Settings', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("let settingsActiveTab = 'families'");
      expect(stateContent).toContain('let settingsTeamsData = null');
      expect(stateContent).toContain('let settingsTeamsLoading = false');
    });

    test('should have correct defaults for MCS', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('let mcsApproverConfig = null');
      expect(stateContent).toContain('let mcsApproverConfigLoading = false');
      expect(stateContent).toContain('let mcsList = []');
      expect(stateContent).toContain("status: 'all'");
    });
  });

  // ── Comments and Documentation ──────────────────────────────
  describe('Documentation', () => {
    test('should have descriptive comments for complex state', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("'admin' | 'editor' | 'viewer'");
      expect(stateContent).toContain('ctq|pfd|pfmea|cp');
      expect(stateContent).toContain('all | A | B | C');
      expect(stateContent).toContain('RPN ranges');
    });
  });
});
