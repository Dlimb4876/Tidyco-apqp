# Testing Strategy — Tidyco APQP Quality Tool

## Overview

This document outlines the comprehensive testing strategy for the Tidyco APQP application. Our goal is to ensure code quality, prevent regressions, and maintain confidence during refactoring and feature additions.

**Testing Philosophy:**
- Test behavior, not implementation
- Mock external dependencies (Supabase, DOM, global state)
- Keep tests fast, isolated, and deterministic
- Prioritize critical paths and complex logic
- **ESM-First**: All new tests MUST use modern ESM imports and `jest.unstable_mockModule`

**Documentation Sync Rule:**
- If a change affects behavior, workflow, or test status, update both `README.md` and `TESTING_STRATEGY.md` in the same logical change.

### Quality Assurance Scripts

This project includes custom Node.js scripts in the `scripts/` directory to enforce code quality and architecture rules.

```bash
npm run check:syntax         # Validates JS syntax across the codebase
npm run check:imports        # Verifies ESM import/export wiring and discourages global leakage
npm run check:esm-coverage   # Tracks remaining non-ESM files
npm run check:subscriptions # Audits real-time subscription cleanup (integrated in check:imports)
npm run check:state         # Tracks state.js variables and undeclared globals (integrated in check:imports)
npm run check:rls           # Audits Supabase tables for RLS policy coverage
npm run check:mobile        # Verifies CSS breakpoints for responsive design
npm run check:modals        # Audits modal state handling
npm run check:coverage      # Generates Jest coverage summary with recommendations
```

---

## Test Framework

**Jest 30** with **jsdom** environment.

### ESM Configuration

The project uses native ES modules (`"type": "module"` in `package.json`).
- **Running Tests**: Must use `node --experimental-vm-modules` (mapped to `npm test`).
- **Mocking Modules**: Use `jest.unstable_mockModule` for modules that are imported by the code under test.
- **Importing Code**: Use dynamic `await import('../path/to/module.js')` after setting up mocks.

### Configuration

- **Config File**: `jest.config.js`
- **Setup File**: `jest.setup.js` (Loaded before every test)
- **Test Environment**: `jsdom`
- **Test Pattern**: `*.test.js` files in `tests/` directory

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/navigation.test.js
```

---

## Test Coverage Status (March 2026)

### 📊 Current Baseline
- **Total Test Suites**: 69
- **Total Tests**: 910
- **Status**: **Pass: 608 / Fail: 302** (Current focus: Fixing regressions from ESM migration)

### High-Confidence Areas
- Routing and hash-state behavior (`navigation.js` / `appState`)
- Authentication/session behavior (`auth.js`)
- Helpers/utilities (escaping, modal helpers)
- NPI Portal (Dashboard, Gates, PFD, BOM)
- Operations dashboard and forecast flows

### Current Priority Gaps
- **Fix Failing Tests**: Resolve 300+ failures caused by ESM refactoring (incorrect relative paths or broken global bindings).
- **Migration**: Convert legacy `eval()` or `data:` URI tests to modern `jest.unstable_mockModule` + `import` pattern.
- **Integration**: Keyboard shortcut parity and cross-module state transitions (e.g., NPI -> Capacity).

---

## Complete jest.setup.js (Current)

The `jest.setup.js` file establishes a baseline environment for all tests:

```javascript
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jest } from '@jest/globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.require = createRequire(import.meta.url)
globalThis.jest = globalThis.jest || jest

// Mock Supabase Baseline
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({ data: [], error: null })),
      eq: jest.fn(() => ({ single: jest.fn(() => ({ data: null, error: null })) }))
    })),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })),
    delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }))
  })),
  auth: {
    getSession: jest.fn(() => ({ data: { session: { user: { id: 'test-user' } } } })),
    onAuthStateChange: jest.fn()
  }
}

// Global State (appState)
global.appState = {
  currentSection: 'hub',
  progId: 'test-prog-1',
  // ... other variables from state.js
}

// DOM Setup
if (typeof document !== 'undefined') {
  const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
  document.documentElement.innerHTML = html.toString()
}
```

---

## Writing New Tests: Checklist

- [ ] Use `import { jest } from '@jest/globals'` at the top.
- [ ] Use `jest.unstable_mockModule('../path/to/dep.js', () => ({ ... }))` for internal dependencies.
- [ ] Set up DOM elements if needed (usually handled by `jest.setup.js` + `index.html` load).
- [ ] Import the module under test using `const { ... } = await import('../path/to/module.js')`.
- [ ] Group tests with `describe()`.
- [ ] Use `beforeEach(() => { jest.clearAllMocks(); })`.
- [ ] **Async/Await**: Always await async functions and Supabase operations.
- [ ] **Timers**: Use `jest.useFakeTimers()` for debounced save tests (800ms).

### ❌ Legacy Patterns (DO NOT USE)
- `const script = fs.readFileSync(...); eval(script);`
- `await import('data:text/javascript,...');`
- `global.require = ...` (unless absolutely necessary for legacy 3rd party libs)

---

## Example Test Template (ESM)

```javascript
import { jest } from '@jest/globals'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// 1. Mock internal dependencies BEFORE importing the module under test
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'test-user' }
}))

// 2. Import the module dynamically
const { myFunctionName } = await import('../utils/js/my-module.js')

describe('My Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.appState.currentSection = 'hub'
  })

  test('should perform specific behavior', async () => {
    // Arrange
    const input = { id: '123' }
    
    // Act
    const result = await myFunctionName(input)
    
    // Assert
    expect(result).toBe(true)
    expect(global.supa.from).toHaveBeenCalledWith('my_table')
  })
})
```

---

## Coverage Goals

| Module Type | Target Coverage | Rationale |
|-------------|----------------|-----------|
| Core (`state`, `db`, `auth`) | 90%+ | Foundation of entire app |
| Navigation | 85%+ | Switchboard for all features |
| Data Adapters | 80%+ | Data integrity is crucial |
| Feature UI | 60%+ | Focus on logic/state, not CSS |

---

## Resources

- [Jest ESM Documentation](https://jestjs.io/docs/ecmascript-modules)
- [Testing Async Code](https://jestjs.io/docs/asynchronous)
- [Fake Timers Guide](https://jestjs.io/docs/timer-mocks)
