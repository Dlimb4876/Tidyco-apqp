/**
 * Bootstrap Load Order Test
 *
 * Validates that core/js/main.js loads without errors and exports all required
 * globals used by inline handlers in index.html. Catches dependency chain breaks,
 * missing modules, and load-order issues early.
 *
 * Issue: doLogin becomes undefined after ESM refactor when load order is incorrect
 * or dependencies fail to load silently. This test runs early to catch bootstrap
 * failures before they affect the app.
 *
 * Approach: Import main.js (and its full dependency chain) to simulate page load.
 * If any module in the chain fails to load or has a critical error, the import
 * will throw. If all modules load successfully, globalThis globals are assigned.
 */

describe('Bootstrap load order', () => {
  it('should load main.js without import errors', async () => {
    // Clear globals to detect if they're assigned during import
    delete globalThis.doLogin;
    delete globalThis.doLogout;

    let importError = null;
    try {
      // Import main.js and its entire dependency chain
      // Failures here indicate: missing modules, syntax errors, or load-order issues
      await import('../core/js/main.js');
    } catch (err) {
      importError = err;
    }

    // The import succeeded if we reach here and have no error
    expect(importError).toBeNull();
  });

  it('should assign doLogin and doLogout to globalThis', async () => {
    // After importing main.js, check that critical login globals are defined
    // If doLogin is undefined, it means main.js completed but didn't assign the global
    // (indicates a load-order issue or missing export)
    expect(globalThis.doLogin).toBeDefined();
    expect(typeof globalThis.doLogin).toBe('function');
    expect(globalThis.doLogout).toBeDefined();
    expect(typeof globalThis.doLogout).toBe('function');
  });

  it('should assign navigation globals to globalThis', async () => {
    // navigation functions used by portal routing
    expect(globalThis.navigate).toBeDefined();
    expect(typeof globalThis.navigate).toBe('function');
    expect(globalThis.navigateBack).toBeDefined();
    expect(typeof globalThis.navigateBack).toBe('function');
    expect(globalThis.render).toBeDefined();
    expect(typeof globalThis.render).toBe('function');
  });

  it('should assign modal helpers to globalThis', async () => {
    // Modal functions used throughout the app
    expect(globalThis.showModal).toBeDefined();
    expect(typeof globalThis.showModal).toBe('function');
    expect(globalThis.closeModal).toBeDefined();
    expect(typeof globalThis.closeModal).toBe('function');
  });

  it('should assign utility helpers to globalThis', async () => {
    // Shared helpers used across portals
    expect(globalThis.esc).toBeDefined();
    expect(typeof globalThis.esc).toBe('function');
    expect(globalThis.showGuide).toBeDefined();
    expect(typeof globalThis.showGuide).toBe('function');
    expect(globalThis.exportJSON).toBeDefined();
    expect(typeof globalThis.exportJSON).toBe('function');
    expect(globalThis.importJSON).toBeDefined();
    expect(typeof globalThis.importJSON).toBe('function');
    expect(globalThis.save).toBeDefined();
    expect(typeof globalThis.save).toBe('function');
  });

  it('should assign Chart to globalThis for charting', async () => {
    // Chart.js constructor used by capacity/NPI dashboards
    expect(globalThis.Chart).toBeDefined();
    expect(typeof globalThis.Chart).toBe('function');
  });
});
