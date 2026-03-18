/**
 * families-data-core.test.js — Tests for portals/product-development/js/families-data.js
 *
 * Covers: familiesState initialisation, familiesDataAddFamily validation,
 *         familiesDataGetAll, familiesDataCleanup,
 *         familiesDataLoad (error handling), familiesDataInit (error path)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.currentUser = { id: 'user-1', email: 'test@test.com' };
global.createRealtimeSubscription = jest.fn(() => 'mock-sub');
global.removeRealtimeSubscription = jest.fn();
global.renderSettingsFamiliesTab = jest.fn();

let mockSelectResult = { data: [], error: null };
let mockInsertResult = { data: [{ id: 'new-fam' }], error: null };
let mockUpdateResult = { data: [{}], error: null };
let mockDeleteResult = { data: [], error: null };

global.supa = {
  from: jest.fn((table) => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue(mockSelectResult),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(mockInsertResult),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUpdateResult),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue(mockDeleteResult),
    })),
  })),
};

// Load module — replace `let` with `var` so familiesState becomes module-scoped
// and accessible/modifiable from the test body
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/product-development/js/families-data.js'),
  'utf8'
).replace(/\blet /g, 'var ');
eval(src); // eslint-disable-line no-eval

// Helper to set internal module state from test scope
function setInternal(name, value) {
  eval(`${name} = value`); // eslint-disable-line no-eval
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Reset module state via setInternal so the closures see the updated values
  setInternal('familiesState', { families: [], loading: false, error: null, subscription: null });

  mockSelectResult = { data: [], error: null };
  mockInsertResult = { data: [{ id: 'new-fam' }], error: null };
  global.supa.from = jest.fn((table) => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue(mockSelectResult),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(mockInsertResult),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUpdateResult),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue(mockDeleteResult),
    })),
  }));
});

describe('familiesState initial structure', () => {
  it('has empty families array', () => {
    expect(Array.isArray(familiesDataGetAll())).toBe(true); // eslint-disable-line no-undef
  });

  it('returns empty array initially', () => {
    expect(familiesDataGetAll()).toEqual([]); // eslint-disable-line no-undef
  });
});

describe('familiesDataLoad()', () => {
  it('populates familiesState.families on success', async () => {
    const data = [
      { id: 'f1', name: 'HVAC', label: 'HVAC Systems', icon: '❄️', description: '' },
    ];
    mockSelectResult = { data, error: null };

    await familiesDataLoad(); // eslint-disable-line no-undef
    expect(familiesDataGetAll()).toEqual(data); // eslint-disable-line no-undef
  });

  it('rejects and sets error on failure', async () => {
    mockSelectResult = { data: null, error: { message: 'DB failure' } };

    let rejected = false;
    try { await familiesDataLoad(); } catch (e) { rejected = true; } // eslint-disable-line no-undef
    expect(rejected).toBe(true);
  });

  it('handles null data as empty array', async () => {
    mockSelectResult = { data: null, error: null };
    await familiesDataLoad(); // eslint-disable-line no-undef
    expect(familiesDataGetAll()).toEqual([]); // eslint-disable-line no-undef
  });
});

describe('familiesDataAddFamily()', () => {
  it('returns null when name is missing', async () => {
    const result = await window.familiesDataAddFamily('', 'HVAC Systems', '❄️', '');
    expect(result).toBeNull();
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('returns null when label is missing', async () => {
    const result = await window.familiesDataAddFamily('HVAC', '', '❄️', '');
    expect(result).toBeNull();
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('calls supa.from("families").insert() when both name and label are provided', async () => {
    await window.familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', 'Heating and cooling');
    expect(global.supa.from).toHaveBeenCalledWith('families');
  });

  it('returns the inserted family record', async () => {
    const result = await window.familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', '');
    expect(result).toEqual({ id: 'new-fam' });
  });

  it('throws when insert returns an error', async () => {
    mockInsertResult = { data: null, error: { message: 'Insert failed' } };
    await expect(
      window.familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', '')
    ).rejects.toThrow();
  });
});

describe('familiesDataCleanup()', () => {
  it('calls removeRealtimeSubscription when subscription exists', () => {
    setInternal('familiesState', { families: [], loading: false, error: null, subscription: 'mock-sub' });
    familiesDataCleanup(); // eslint-disable-line no-undef
    expect(global.removeRealtimeSubscription).toHaveBeenCalledWith('mock-sub');
  });

  it('does nothing when no subscription exists', () => {
    setInternal('familiesState', { families: [], loading: false, error: null, subscription: null });
    familiesDataCleanup(); // eslint-disable-line no-undef
    expect(global.removeRealtimeSubscription).not.toHaveBeenCalled();
  });
});

describe('familiesDataInit()', () => {
  it('calls familiesDataLoad and sets up realtime subscription on success', async () => {
    mockSelectResult = { data: [], error: null };
    await familiesDataInit(); // eslint-disable-line no-undef
    expect(global.createRealtimeSubscription).toHaveBeenCalledWith(
      'families',
      'families_changed',
      expect.objectContaining({ onInsert: expect.any(Function), onUpdate: expect.any(Function), onDelete: expect.any(Function) })
    );
  });

  it('returns empty array and does not throw on failure', async () => {
    mockSelectResult = { data: null, error: { message: 'load failed' } };
    const result = await familiesDataInit(); // eslint-disable-line no-undef
    expect(result).toEqual([]);
  });
});
