/**
 * families-data-core.test.js — Tests for portals/product-development/js/families-data.js
 *
 * Covers: familiesState initialisation, familiesDataAddFamily validation,
 *         familiesDataGetAll, familiesDataCleanup,
 *         familiesDataLoad (error handling), familiesDataInit (error path)
 */

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

// Import module — it exports functions and state
const familiesDataModule = await import('../portals/product-development/js/families-data.js');
const { 
  familiesState, 
  familiesDataGetAll, 
  familiesDataLoad, 
  familiesDataAddFamily, 
  familiesDataCleanup, 
  familiesDataInit,
  familiesDataSubscribe
} = familiesDataModule;

// Helper to reset internal module state from test scope
function resetFamiliesState() {
  familiesState.families = [];
  familiesState.loading = false;
  familiesState.error = null;
  familiesState.subscription = null;
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Reset module state
  resetFamiliesState();

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
    expect(Array.isArray(familiesDataGetAll())).toBe(true);
  });

  it('returns empty array initially', () => {
    expect(familiesDataGetAll()).toEqual([]);
  });
});

describe('familiesDataLoad()', () => {
  it('populates familiesState.families on success', async () => {
    const data = [
      { id: 'f1', name: 'HVAC', label: 'HVAC Systems', icon: '❄️', description: '' },
    ];
    mockSelectResult = { data, error: null };

    await familiesDataLoad();
    expect(familiesDataGetAll()).toEqual(data);
  });

  it('rejects and sets error on failure', async () => {
    mockSelectResult = { data: null, error: { message: 'DB failure' } };

    let rejected = false;
    try { await familiesDataLoad(); } catch (e) { rejected = true; }
    expect(rejected).toBe(true);
  });

  it('handles null data as empty array', async () => {
    mockSelectResult = { data: null, error: null };
    await familiesDataLoad();
    expect(familiesDataGetAll()).toEqual([]);
  });
});

describe('familiesDataAddFamily()', () => {
  it('returns null when name is missing', async () => {
    const result = await familiesDataAddFamily('', 'HVAC Systems', '❄️', '');
    expect(result).toBeNull();
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('returns null when label is missing', async () => {
    const result = await familiesDataAddFamily('HVAC', '', '❄️', '');
    expect(result).toBeNull();
    expect(global.supa.from).not.toHaveBeenCalled();
  });

  it('calls supa.from("families").insert() when both name and label are provided', async () => {
    await familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', 'Heating and cooling');
    expect(global.supa.from).toHaveBeenCalledWith('families');
  });

  it('returns the inserted family record', async () => {
    const result = await familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', '');
    expect(result).toEqual({ id: 'new-fam' });
  });

  it('throws when insert returns an error', async () => {
    mockInsertResult = { data: null, error: { message: 'Insert failed' } };
    await expect(
      familiesDataAddFamily('HVAC', 'HVAC Systems', '❄️', '')
    ).rejects.toThrow();
  });
});

describe('familiesDataCleanup()', () => {
  it('calls removeRealtimeSubscription when subscription exists', () => {
    familiesState.subscription = 'mock-sub';
    familiesDataCleanup();
    expect(global.removeRealtimeSubscription).toHaveBeenCalledWith('mock-sub');
  });

  it('does nothing when no subscription exists', () => {
    familiesState.subscription = null;
    familiesDataCleanup();
    expect(global.removeRealtimeSubscription).not.toHaveBeenCalled();
  });
});

describe('familiesDataInit()', () => {
  it('calls familiesDataLoad and sets up realtime subscription on success', async () => {
    mockSelectResult = { data: [], error: null };
    await familiesDataInit();
    expect(global.createRealtimeSubscription).toHaveBeenCalledWith(
      'families',
      'families_changed',
      expect.objectContaining({ onInsert: expect.any(Function), onUpdate: expect.any(Function), onDelete: expect.any(Function) })
    );
  });

  it('returns empty array and does not throw on failure', async () => {
    mockSelectResult = { data: null, error: { message: 'load failed' } };
    const result = await familiesDataInit();
    expect(result).toEqual([]);
  });
});
