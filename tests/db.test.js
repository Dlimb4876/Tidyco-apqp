const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock Supabase
global.supa = {
  from: jest.fn(),
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
    })
  }
};

global.currentUser = { id: 'test-user', email: 'test@test.com' };
global.db = { projects: [] };
global.progId = null;

// Stubs for functions db.js calls that live in other modules
global.navigate = jest.fn();
global.render = jest.fn();

// DOM setup — needed before state.js eval (uses crypto.randomUUID)
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

if (!document.getElementById('syncBadge')) {
  const el = document.createElement('div');
  el.id = 'syncBadge';
  document.body.appendChild(el);
}

// Load state.js — replace `const` with `var` so declarations leak into eval scope as globals
const stateScript = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8')
  .replace(/^const /gm, 'var ');
eval(stateScript);
// Now assign to globals so test body can reference them
global.GATE_DEFS = GATE_DEFS; // eslint-disable-line no-undef
global.newProgTemplate = newProgTemplate; // eslint-disable-line no-undef
global.FAMILIES = FAMILIES; // eslint-disable-line no-undef
global.getFamilies = getFamilies; // eslint-disable-line no-undef
global.BOM_TYPES = BOM_TYPES; // eslint-disable-line no-undef

// Load db script
const dbScript = fs.readFileSync(path.resolve(__dirname, '../core/js/db.js'), 'utf8');
eval(dbScript);

// Helper to build a minimal valid project for tests (without needing GATE_DEFS in test body)
function makeTestProg(overrides = {}) {
  return {
    id: 'prog-test-1',
    name: 'Test Project',
    ctq: [], pfd: [], pfmea: [], cp: [],
    bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
    actions: [], risks: [], timing: [], gantt: [],
    gates: global.GATE_DEFS.map(g => ({
      gateNum: g.num,
      checks: g.items.map(() => false),
      sigs: g.signatories.map(r => ({ role: r, name: '', date: '', signed: false }))
    })),
    ...overrides
  };
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('DB Module (db.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.db = { projects: [] };
    global.currentUser = { id: 'test-user', email: 'test@test.com' };
    global.progId = null;
    localStorage.clear();
  });

  // ── migrateprog ──────────────────────────────────────────────
  describe('migrateprog()', () => {
    test('should return a default project for null input', () => {
      const result = migrateprog(null);
      expect(result).toBeDefined();
      expect(result.ctq).toEqual([]);
      expect(result.pfd).toEqual([]);
      expect(result.pfmea).toEqual([]);
    });

    test('should add missing ctq/pfd/pfmea/cp arrays', () => {
      const result = migrateprog({ id: '1', name: 'Test' });
      expect(Array.isArray(result.ctq)).toBe(true);
      expect(Array.isArray(result.pfd)).toBe(true);
      expect(Array.isArray(result.pfmea)).toBe(true);
      expect(Array.isArray(result.cp)).toBe(true);
    });

    test('should add missing bom structure', () => {
      const result = migrateprog({ id: '1', name: 'Test' });
      expect(result.bom).toBeDefined();
      expect(Array.isArray(result.bom.parts)).toBe(true);
      expect(Array.isArray(result.bom.tools)).toBe(true);
      expect(Array.isArray(result.bom.equip)).toBe(true);
      expect(Array.isArray(result.bom.mat)).toBe(true);
      expect(Array.isArray(result.bom.cons)).toBe(true);
      expect(Array.isArray(result.bom.kits)).toBe(true);
    });

    test('should add missing actions/risks/timing/gantt arrays', () => {
      const result = migrateprog({ id: '1', name: 'Test' });
      expect(Array.isArray(result.actions)).toBe(true);
      expect(Array.isArray(result.risks)).toBe(true);
      expect(Array.isArray(result.timing)).toBe(true);
      expect(Array.isArray(result.gantt)).toBe(true);
    });

    test('should create gates from GATE_DEFS when missing', () => {
      const result = migrateprog({ id: '1', name: 'Test' });
      expect(Array.isArray(result.gates)).toBe(true);
      expect(result.gates.length).toBe(global.GATE_DEFS.length);
    });

    test('should not overwrite existing ctq data', () => {
      const prog = makeTestProg({ ctq: [{ id: 'ctq1', text: 'CTQ item' }] });
      const result = migrateprog(prog);
      expect(result.ctq[0].text).toBe('CTQ item');
    });

    test('should assign stepNum to PFD steps missing it', () => {
      const prog = makeTestProg({ pfd: [{ id: 'p1', name: 'Step A' }, { id: 'p2', name: 'Step B' }] });
      const result = migrateprog(prog);
      expect(result.pfd[0].stepNum).toBe(10);
      expect(result.pfd[1].stepNum).toBe(20);
    });

    test('should set default type on PFD steps missing it', () => {
      const prog = makeTestProg({ pfd: [{ id: 'p1', stepNum: 10 }] });
      const result = migrateprog(prog);
      expect(result.pfd[0].type).toBe('step');
    });

    test('should migrate old flat PFMEA entries to nested structure', () => {
      const prog = makeTestProg({
        pfmea: [{ id: 'f_abc', step: '1', mode: 'Fail', effect: 'Bad', sev: 7, cause: 'Worn', occ: 4, det: 3 }]
      });
      const result = migrateprog(prog);
      const entry = result.pfmea[0];
      expect(entry._type).toBe('mode');
      expect(Array.isArray(entry.effects)).toBe(true);
      expect(entry.effects[0].sev).toBe(7);
      expect(entry.effects[0].causes[0].occ).toBe(4);
    });

    test('should add IDs to risks and actions missing them', () => {
      const prog = makeTestProg({
        risks: [{ desc: 'Risk 1' }],
        actions: [{ desc: 'Action 1' }]
      });
      const result = migrateprog(prog);
      expect(result.risks[0].id).toBeTruthy();
      expect(result.risks[0].id).toMatch(/^r_/);
      expect(result.actions[0].id).toBeTruthy();
      expect(result.actions[0].id).toMatch(/^a_/);
    });

    test('should set ganttStart from date if missing', () => {
      const prog = makeTestProg({ date: '2025-01-01' });
      const result = migrateprog(prog);
      expect(result.ganttStart).toBe('2025-01-01');
    });

    test('should preserve database UUID when present', () => {
      const result = migrateprog({ id: '1', name: 'Test', dbId: '11111111-1111-4111-8111-111111111111' });
      expect(result.dbId).toBe('11111111-1111-4111-8111-111111111111');
    });
  });

  // ── load (localStorage) ──────────────────────────────────────
  describe('load()', () => {
    test('should load projects from localStorage key tidyco_v7', () => {
      const testData = { projects: [makeTestProg({ id: 'prog-123', name: 'Loaded Project' })] };
      localStorage.setItem('tidyco_v7', JSON.stringify(testData));

      global.db = { projects: [] };
      load();

      expect(global.db.projects.length).toBe(1);
      expect(global.db.projects[0].name).toBe('Loaded Project');
    });

    test('should not overwrite existing projects', () => {
      global.db = { projects: [{ id: 'existing', name: 'Existing' }] };
      localStorage.setItem('tidyco_v7', JSON.stringify({ projects: [makeTestProg({ id: 'new', name: 'New' })] }));

      load();

      expect(global.db.projects[0].name).toBe('Existing');
    });

    test('should handle invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('tidyco_v7', 'not-valid-json');
      expect(() => load()).not.toThrow();
    });
  });

  // ── save ─────────────────────────────────────────────────────
  describe('save()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test('should write db to localStorage', () => {
      global.db = { projects: [{ id: 'p1', name: 'Test Prog' }] };
      save();
      const stored = JSON.parse(localStorage.getItem('tidyco_v7'));
      expect(stored.projects[0].name).toBe('Test Prog');
    });

    test('should set syncBadge to saving state', () => {
      const badge = document.getElementById('syncBadge');
      save();
      expect(badge.textContent).toBe('● saving…');
      expect(badge.className).toContain('syncing');
    });

    test('should debounce saveRemote — not call Supabase immediately', () => {
      save();
      save();
      save();
      expect(global.supa.from).not.toHaveBeenCalled();
    });
  });

  // ── loadRemote ───────────────────────────────────────────────
  describe('loadRemote()', () => {
    test('should not run if currentUser is null', async () => {
      global.currentUser = null;
      await loadRemote();
      expect(global.supa.from).not.toHaveBeenCalled();
    });

    test('should load projects from Supabase and run migration', async () => {
      const remoteProg = makeTestProg({ id: 'remote-1', name: 'Remote Project' });

      global.supa.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [{
              id: '11111111-1111-4111-8111-111111111111',
              prog_id: 'remote-1',
              name: 'Remote Project',
              updated_at: '2025-01-01T00:00:00Z',
              updated_by: 'user@test.com',
              data: remoteProg
            }],
            error: null
          })
        }))
      }));

      await loadRemote();

      expect(global.db.projects.length).toBe(1);
      expect(global.db.projects[0].dbId).toBe('11111111-1111-4111-8111-111111111111');
      expect(global.db.projects[0].name).toBe('Remote Project');
    });

    test('should handle Supabase error gracefully', async () => {
      global.supa.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Connection error' } })
        }))
      }));

      await expect(loadRemote()).resolves.not.toThrow();
    });
  });

  // ── initProgSelect ───────────────────────────────────────────
  describe('initProgSelect()', () => {
    test('should set progId to first project if progId is null', () => {
      global.progId = null;
      global.db = { projects: [{ id: 'p-first' }, { id: 'p-second' }] };
      initProgSelect();
      expect(global.progId).toBe('p-first');
    });

    test('should not change progId if already set', () => {
      global.progId = 'existing-id';
      global.db = { projects: [{ id: 'p-first' }] };
      initProgSelect();
      expect(global.progId).toBe('existing-id');
    });

    test('should not change progId if no projects exist', () => {
      global.progId = null;
      global.db = { projects: [] };
      initProgSelect();
      expect(global.progId).toBeNull();
    });
  });
});
