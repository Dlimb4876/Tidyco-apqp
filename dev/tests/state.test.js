import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Tests for state.js — Global state initialisation
// ─────────────────────────────────────────────────────────────

describe('State Module (state.js)', () => {
  // We need to load state.js in a way that variables become global
  // Since state.js uses 'let', we need to use a different approach
  beforeAll(() => {
    // Read the file and check its structure
    const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
    
    // Verify the file contains expected variable declarations (ESM export syntax)
    expect(stateContent).toContain('export let db = { projects: [] }');
    expect(stateContent).toContain("currentSection: 'hub'");
    expect(stateContent).toContain("apqpTab: 'ctq'");
    expect(stateContent).toContain("bomSubTab: 'tree'");
  });

  // ── File Structure Tests ───────────────────────────────────
  describe('File Structure', () => {
    test('should contain all major state variable declarations', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      // Core state (ESM export syntax)
      expect(stateContent).toContain('export let db =');
      expect(stateContent).toContain('progId:');
      expect(stateContent).toContain('currentSection:');
      expect(stateContent).toContain('export let currentUserRole =');
      
      // Tab states
      expect(stateContent).toContain('apqpTab:');
      expect(stateContent).toContain('bomSubTab:');
      expect(stateContent).toContain('capacityTab:');
      expect(stateContent).toContain('productionTab:');
      
      // Filter states
      expect(stateContent).toContain('pfmeaRpnFilter:');
      expect(stateContent).toContain('ctqSourceFilter:');
      expect(stateContent).toContain('ctqCoverageFilter:');
      
      // Modal picker state
      expect(stateContent).toContain('ctqPickTarget:');
      expect(stateContent).toContain('bomPickTarget:');
      expect(stateContent).toContain('bomTreeExpanded:');
      
      // ABC Catalogue state
      expect(stateContent).toMatch(/abcCatalogueData\s*:\s*\[/);
      expect(stateContent).toContain('abcPickTarget:');
      
      // Action Centre state
      expect(stateContent).toContain('actionCentreData:');
      expect(stateContent).toContain('actionCentreLoading:');
      expect(stateContent).toContain('actionCentreTab:');
      
      // Settings state
      expect(stateContent).toContain('settingsActiveTab:');
      expect(stateContent).toContain('settingsTeamsData:');
      
      // MCS state
      expect(stateContent).toContain('mcsApproverConfig:');
      expect(stateContent).toContain('mcsList:');
      expect(stateContent).toContain('mcsCurrentFilter:');
    });

    test('should contain helper functions', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('export function prog()');
      expect(stateContent).toContain('export function findProjectByProductId(');
      expect(stateContent).toContain('export function getDefaultGateSelection(');
      expect(stateContent).toContain('export function normalizeGateSelections(');
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
      
      expect(stateContent).toContain("currentSection: 'hub'");
      expect(stateContent).toContain('progId: null');
    });

    test('should have correct default values for APQP/BOM', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("apqpTab: 'ctq'");
      expect(stateContent).toContain("bomSubTab: 'tree'");
      expect(stateContent).toContain("bomPartsRegisterView: 'total'");
      expect(stateContent).toContain("bomAbcFilter: 'all'");
    });

    test('should have correct default values for capacity', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("capacityTab: 'root'");
      expect(stateContent).toContain("prodCapTab: 'dashboard'");
      expect(stateContent).toContain("pmCapTab: 'tasks'");
      expect(stateContent).toContain('prodCapUtilizationFactor: 1.0');
    });

    test('should have correct default values for filters', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("pfmeaRpnFilter: 'all'");
      expect(stateContent).toContain("ctqSourceFilter: 'all'");
      expect(stateContent).toContain("ctqCoverageFilter: 'all'");
      expect(stateContent).toContain("trackerSubAsmFilter: 'all'");
    });

    test('should initialize picker state correctly', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('ctqPickTarget: null');
      expect(stateContent).toMatch(/ctqPickSelected\s*:\s*\[\]/);
      expect(stateContent).toContain('bomPickTarget: null');
      expect(stateContent).toMatch(/bomPickSelected\s*:\s*\[\]/);
      expect(stateContent).toMatch(/bomPickFilter\s*:\s*'all'/);
    });

    test('should initialize collections as empty', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('bomTreeExpanded: new Set()');
      expect(stateContent).toContain('bomAawTreeExpanded: new Set()');
      expect(stateContent).toContain('collapsedGroups: new Set()');
      expect(stateContent).toMatch(/abcCatalogueData\s*:\s*\[\]/);
      expect(stateContent).toContain('abcPickResults: []');
      expect(stateContent).toContain('abcPickSelected: []');
    });

    test('should have correct defaults for Action Centre', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('actionCentreData: null');
      expect(stateContent).toContain('actionCentreLoading: false');
      expect(stateContent).toContain("actionCentreTab: 'all'");
      expect(stateContent).toContain("actionCentreStatusFilter: 'open'");
    });

    test('should have correct defaults for Settings', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("settingsActiveTab: 'families'");
      expect(stateContent).toContain('settingsTeamsData: null');
      expect(stateContent).toContain('settingsTeamsLoading: false');
    });

    test('should have correct defaults for MCS', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain('mcsApproverConfig: null');
      expect(stateContent).toContain('mcsApproverConfigLoading: false');
      expect(stateContent).toContain('mcsList: []');
      expect(stateContent).toContain("status: 'all'");
    });
  });

  // ── Comments and Documentation ──────────────────────────────
  describe('Documentation', () => {
    test('should have descriptive comments for complex state', () => {
      const stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8');
      
      expect(stateContent).toContain("'admin' | 'editor' | 'viewer'");
      expect(stateContent).toContain('ctq|pfd|pfmea|cp');
      expect(stateContent).toMatch(/'all'\s*\|\s*'A'\s*\|\s*'B'\s*\|\s*'C'/);
      expect(stateContent).toContain('all|high|r1_49|r50_99|r100_199|r200_plus');
    });
  });
});
