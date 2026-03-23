/**
 * db-gaps.test.js — Additional tests for core/js/db.js
 *
 * Covers functions not tested in db.test.js:
 *   saveRemote, buildProjectRow, isGateScopeColumnError,
 *   loadRemotePage, _getPresenceInitials, setSyncBadge
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

let mockFrom;

beforeEach(() => {
  // Reset mock chain for each test
  mockFrom = jest.fn();

  global.supa = {
    from: mockFrom,
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      send: jest.fn().mockResolvedValue(undefined),
    })),
    removeChannel: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
      })
    }
  };

  global.currentUser = { id: 'test-user', email: 'test@test.com' };
  global.db = { projects: [] };
  global.progId = null;
  global.currentSection = 'hub';
  global.presenceMap = {};
  global.navigate = jest.fn();
  global.render = jest.fn();
  global.showToast = jest.fn();
  global.createRealtimeSubscription = jest.fn();

  localStorage.clear();
});

// DOM setup
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

if (!document.getElementById('syncBadge')) {
  const el = document.createElement('div');
  el.id = 'syncBadge';
  document.body.appendChild(el);
}

// Load state.js
const stateScript = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8')
  .replace(/^const /gm, 'var ');
eval(stateScript); // eslint-disable-line no-eval
global.GATE_DEFS = GATE_DEFS; // eslint-disable-line no-undef
global.newProgTemplate = newProgTemplate; // eslint-disable-line no-undef
global.FAMILIES = FAMILIES; // eslint-disable-line no-undef
global.BOM_TYPES = BOM_TYPES; // eslint-disable-line no-undef

// Load db.js
const dbScript = fs.readFileSync(path.resolve(__dirname, '../core/js/db.js'), 'utf8');
eval(dbScript); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function makeMockQuery(returnData, returnError = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
  };
  // Allow awaiting the chain directly for select().order()
  chain.select.mockReturnValue({
    ...chain,
    order: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
    range: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
  });
  return chain;
}

function makeTestProg(overrides = {}) {
  return {
    id: 'prog-test-1',
    name: 'Test Project',
    customer: 'Acme',
    unit: 'Unit 1',
    family: 'Other',
    lead: 'Alice',
    pm: 'Bob',
    date: '2025-01-01',
    ganttStart: '2025-01-01',
    ganttCollapsed: [],
    subAssemblies: [],
    status: 'Active',
    qNumber: 'Q001',
    partNumber: 'PN001',
    product_id: null,
    gate_selections: null,
    gate_selection_locked: false,
    gate_selection_locked_at: null,
    gate_selection_locked_by: null,
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

describe('isGateScopeColumnError()', () => {
  it('returns true for gate_selections error message', () => {
    expect(isGateScopeColumnError({ message: 'column gate_selections does not exist' })).toBe(true);
  });

  it('returns true for gate_selection_locked error', () => {
    expect(isGateScopeColumnError({ message: 'unknown column gate_selection_locked' })).toBe(true);
  });

  it('returns false for unrelated error', () => {
    expect(isGateScopeColumnError({ message: 'network timeout' })).toBe(false);
  });

  it('returns false for null/undefined input', () => {
    expect(isGateScopeColumnError(null)).toBe(false);
    expect(isGateScopeColumnError(undefined)).toBe(false);
  });

  it('handles error objects without message property', () => {
    expect(isGateScopeColumnError({})).toBe(false);
  });
});

describe('buildProjectRow()', () => {
  it('builds a row with correct fields from a project', () => {
    const p = makeTestProg();
    const now = '2025-06-01T12:00:00Z';
    const row = buildProjectRow(p, now, 'alice@example.com');

    expect(row.prog_id).toBe('prog-test-1');
    expect(row.name).toBe('Test Project');
    expect(row.customer).toBe('Acme');
    expect(row.lead).toBe('Alice');
    expect(row.pm).toBe('Bob');
    expect(row.start_date).toBe('2025-01-01');
    expect(row.updated_at).toBe(now);
    expect(row.updated_by).toBe('alice@example.com');
  });

  it('uses empty strings for missing optional fields', () => {
    const p = makeTestProg({ customer: undefined, unit: undefined, family: undefined });
    const row = buildProjectRow(p, '2025-01-01T00:00:00Z', 'test@test.com');

    expect(row.customer).toBe('');
    expect(row.unit_name).toBe('');
    expect(row.family).toBe('');
  });

  it('sets prog_status to Active when status is missing', () => {
    const p = makeTestProg({ status: undefined });
    const row = buildProjectRow(p, '2025-01-01T00:00:00Z', 'test@test.com');
    expect(row.prog_status).toBe('Active');
  });

  it('maps ganttCollapsed and subAssemblies correctly', () => {
    const p = makeTestProg({ ganttCollapsed: [0, 2], subAssemblies: [{ id: 'sub1' }] });
    const row = buildProjectRow(p, '2025-01-01T00:00:00Z', 'test@test.com');
    expect(row.gantt_collapsed).toEqual([0, 2]);
    expect(row.sub_assembly_ids).toEqual([{ id: 'sub1' }]);
  });
});

describe('saveRemote()', () => {
  it('exits early when no currentUser', async () => {
    global.currentUser = null;
    await saveRemote();
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('calls supa.from("projects") for each dirty project', async () => {
    const p = makeTestProg();
    global.db.projects = [p];
    global.progId = p.id;

    // Mock successful update (returns empty array → triggers insert path)
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'db-id-1', prog_id: p.id }], error: null }),
    };
    global.supa.from = jest.fn(() => updateChain);

    // Trigger save (marks dirty) then manually call saveRemote
    save(); // marks the project dirty via the debounce mechanism
    await saveRemote();

    expect(global.supa.from).toHaveBeenCalledWith('projects');
  });

  it('handles no dirty projects gracefully (saves all)', async () => {
    const p = makeTestProg();
    global.db.projects = [p];

    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ id: 'db-id-1', prog_id: p.id }], error: null }),
    };
    global.supa.from = jest.fn(() => updateChain);

    // Call directly with no dirty state
    await saveRemote();
    // Should write all projects when dirty set is empty
    expect(global.supa.from).toHaveBeenCalled();
  });
});

describe('setSyncBadge()', () => {
  it('sets badge text and class', () => {
    setSyncBadge('saved', '● saved');
    const badge = document.getElementById('syncBadge');
    expect(badge.textContent).toBe('● saved');
    expect(badge.className).toContain('saved');
  });

  it('sets badge to syncing state', () => {
    setSyncBadge('syncing', '● saving…');
    const badge = document.getElementById('syncBadge');
    expect(badge.textContent).toBe('● saving…');
    expect(badge.className).toContain('syncing');
  });

  it('does nothing when syncBadge element is missing', () => {
    const badge = document.getElementById('syncBadge');
    badge.id = 'syncBadge-disabled';
    expect(() => setSyncBadge('error', '● error')).not.toThrow();
    badge.id = 'syncBadge'; // restore
  });
});

describe('_getPresenceInitials()', () => {
  it('returns initials from two-part email prefix', () => {
    expect(_getPresenceInitials('daniel.limb@tidyco.co.uk')).toBe('DL');
  });

  it('returns initials from underscore-separated email', () => {
    expect(_getPresenceInitials('john_doe@example.com')).toBe('JD');
  });

  it('returns first two chars for single-word email', () => {
    expect(_getPresenceInitials('alice@example.com')).toBe('AL');
  });

  it('returns "?" for empty or null email', () => {
    expect(_getPresenceInitials('')).toBe('?');
    expect(_getPresenceInitials(null)).toBe('?');
    expect(_getPresenceInitials(undefined)).toBe('?');
  });
});

describe('loadRemotePage()', () => {
  it('exits early when no currentUser', async () => {
    global.currentUser = null;
    await loadRemotePage(0);
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('replaces db.projects on page 0', async () => {
    const remoteRow = {
      id: 'db-uuid-1', prog_id: 'proj-1', name: 'Remote Proj', customer: 'Cust',
      unit_name: '', family: '', lead: '', pm: '', start_date: '2025-01-01',
      gantt_start: '', gantt_collapsed: [], sub_assembly_ids: [],
      prog_status: 'Active', q_number: '', part_number: '', product_id: null,
      gate_selections: null, gate_selection_locked: false,
      gate_selection_locked_at: null, gate_selection_locked_by: null,
      updated_at: new Date().toISOString(), updated_by: 'test@test.com'
    };

    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [remoteRow], error: null }),
    };
    global.supa.from = jest.fn(() => chain);

    await loadRemotePage(0);

    expect(global.db.projects).toHaveLength(1);
    expect(global.db.projects[0].name).toBe('Remote Proj');
  });

  it('appends projects on page > 0 without duplicates', async () => {
    // Pre-load page 0 result
    const existing = makeTestProg({ id: 'existing-1', name: 'Existing' });
    global.db.projects = [existing];

    const newRow = {
      id: 'db-uuid-2', prog_id: 'new-proj-2', name: 'New Proj', customer: '',
      unit_name: '', family: '', lead: '', pm: '', start_date: '2025-01-01',
      gantt_start: '', gantt_collapsed: [], sub_assembly_ids: [],
      prog_status: 'Active', q_number: '', part_number: '', product_id: null,
      gate_selections: null, gate_selection_locked: false,
      gate_selection_locked_at: null, gate_selection_locked_by: null,
      updated_at: new Date().toISOString(), updated_by: 'test@test.com'
    };

    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [newRow], error: null }),
    };
    global.supa.from = jest.fn(() => chain);

    await loadRemotePage(1);

    expect(global.db.projects).toHaveLength(2);
    expect(global.db.projects.find(p => p.id === 'new-proj-2')).toBeTruthy();
    expect(global.db.projects.find(p => p.id === 'existing-1')).toBeTruthy();
  });

  it('handles Supabase error gracefully', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    };
    global.supa.from = jest.fn(() => chain);

    await expect(loadRemotePage(0)).resolves.not.toThrow();
  });
});
