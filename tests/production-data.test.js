/**
 * production-data.test.js — Tests for portals/production/js/data.js
 *
 * Covers: formatDisplayDate, parseDisplayDate,
 *         prodState structure, prodDataReloadProducts (error handling)
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.currentUser = { id: 'user-1', email: 'test@test.com' };
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();

// We'll replace this before each test that needs it
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [{ id: 'new-batch' }], error: null }),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [{}], error: null }),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
};

// Stub prodDataSubscribe (defined after data.js in the real app)
global.prodDataSubscribe = jest.fn();
global.showToast = jest.fn();

// Load module
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/production/js/data.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('formatDisplayDate()', () => {
  it('converts ISO date to DD/MM/YYYY', () => {
    expect(formatDisplayDate('2025-06-15')).toBe('15/06/2025'); // eslint-disable-line no-undef
  });

  it('converts ISO date with leading zeros', () => {
    expect(formatDisplayDate('2025-01-05')).toBe('05/01/2025'); // eslint-disable-line no-undef
  });

  it('returns empty string for null input', () => {
    expect(formatDisplayDate(null)).toBe(''); // eslint-disable-line no-undef
  });

  it('returns empty string for undefined input', () => {
    expect(formatDisplayDate(undefined)).toBe(''); // eslint-disable-line no-undef
  });

  it('returns empty string for empty string input', () => {
    expect(formatDisplayDate('')).toBe(''); // eslint-disable-line no-undef
  });
});

describe('parseDisplayDate()', () => {
  it('converts DD/MM/YYYY to ISO YYYY-MM-DD', () => {
    expect(parseDisplayDate('15/06/2025')).toBe('2025-06-15'); // eslint-disable-line no-undef
  });

  it('passes through already-ISO format unchanged', () => {
    expect(parseDisplayDate('2025-06-15')).toBe('2025-06-15'); // eslint-disable-line no-undef
  });

  it('returns empty string for null input', () => {
    expect(parseDisplayDate(null)).toBe(''); // eslint-disable-line no-undef
  });

  it('returns null for unrecognised format', () => {
    expect(parseDisplayDate('06-15-2025')).toBeNull(); // eslint-disable-line no-undef
  });

  it('handles single-digit day and month with leading zeros', () => {
    expect(parseDisplayDate('05/01/2025')).toBe('2025-01-05'); // eslint-disable-line no-undef
  });
});

describe('prodState initial structure', () => {
  it('has products array', () => {
    expect(Array.isArray(window.prodState.products)).toBe(true);
  });

  it('has batches array', () => {
    expect(Array.isArray(window.prodState.batches)).toBe(true);
  });

  it('has a default activeUnit', () => {
    expect(window.prodState.activeUnit).toBeDefined();
  });
});

describe('prodDataReloadProducts()', () => {
  it('updates prodState.products on success', async () => {
    const products = [{ id: 'p1', name: 'Widget A' }];
    global.supa.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data: products, error: null }),
      })),
    }));

    await prodDataReloadProducts(); // eslint-disable-line no-undef
    expect(window.prodState.products).toEqual(products);
  });

  it('does not update prodState.products on error', async () => {
    window.prodState.products = [{ id: 'existing', name: 'Existing' }];
    global.supa.from = jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })),
    }));

    await prodDataReloadProducts(); // eslint-disable-line no-undef
    // Products should remain unchanged
    expect(window.prodState.products).toEqual([{ id: 'existing', name: 'Existing' }]);
  });
});

describe('prodDataAddProduct()', () => {
  it('returns false for empty product name', async () => {
    const result = await window.prodDataAddProduct('', null, null, null, null, null, null);
    expect(result).toBe(false);
  });

  it('returns false for whitespace-only product name', async () => {
    const result = await window.prodDataAddProduct('   ', null, null, null, null, null, null);
    expect(result).toBe(false);
  });

  it('calls supa.from("products").insert() for valid name', async () => {
    let insertCalled = false;
    global.supa.from = jest.fn(() => ({
      insert: jest.fn(() => {
        insertCalled = true;
        return { select: jest.fn().mockResolvedValue({ data: [{ id: 'new-p' }], error: null }) };
      }),
    }));

    await window.prodDataAddProduct('My Product', 'MP001', 'HVAC', 5, 'notes', 'Active', 'Unit 2');
    expect(insertCalled).toBe(true);
  });
});
