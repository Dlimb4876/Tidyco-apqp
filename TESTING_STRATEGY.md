# Testing Strategy — Tidyco APQP Quality Tool

## Overview

This document outlines the comprehensive testing strategy for the Tidyco APQP application. Our goal is to ensure code quality, prevent regressions, and maintain confidence during refactoring and feature additions.

**Testing Philosophy:**
- Test behavior, not implementation
- Mock external dependencies (Supabase, DOM)
- Keep tests fast, isolated, and deterministic
- Prioritize critical paths and complex logic

---

## Test Framework

**Jest** with **jsdom** environment for DOM testing.

### Configuration

- **Config File:** `jest.config.js`
- **Setup File:** `jest.setup.js`
- **Test Environment:** `jsdom` (simulates browser DOM)
- **Test Pattern:** `*.test.js` files in `tests/` directory

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run specific test file
npm test -- tests/navigation.test.js

# Run tests with coverage (future enhancement)
npm test -- --coverage
```

---

## Test Coverage Status (March 2026)

### ✅ Fully Tested (Production-Ready)
- **`navigation.test.js`** — 38 tests, 85% coverage
  - Hash parsing with various formats
  - Navigation to each section
  - Subscription cleanup on section changes
  - Tab reset behavior
  - Return button visibility
  - Back navigation logic
  - popstate event handling

- **`production.test.js`** — Tests for production portal CRUD and calculations

- **`bugs.test.js`** — Tests for bug reports real-time subscriptions and data layer

### 🚧 Partially Tested or TODO
- **`auth.test.js`** — 0 tests; login/logout flows need coverage
  - Login with valid/invalid credentials
  - Login with empty fields
  - Logout functionality
  - Session restoration

- **`db.test.js`** — 0 tests; save/load/migrate functions need coverage
  - Remote data loading
  - Local storage sync
  - Save debouncing
  - Data migration
  - Error recovery

- **`helpers.test.js`** — 0 tests; utilities need coverage
  - HTML escaping (esc function)
  - Modal management functions
  - UI utility functions

**When writing new tests, prioritize completing the TODO items above.**

---

## Test File Structure

```
/tests/
├── navigation.test.js      # Hash routing and render switchboard (38 tests)
├── production.test.js      # Production portal functionality
├── bugs.test.js           # Bug reports data module
├── auth.test.js           # Authentication (TODO)
├── db.test.js             # Data persistence (TODO)
├── helpers.test.js        # Utility functions (TODO)
└── ...
```

**Naming Convention:** `<module>.test.js` mirrors source file `<module>.js`

---

## Complete jest.setup.js Template

Use this as a base for test files. Modify mocks as needed for your specific feature:

```javascript
// jest.setup.js
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Supabase Client
// ─────────────────────────────────────────────────────────────

global.supa = {
  from: jest.fn((table) => ({
    select: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      eq: jest.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    }),
    insert: jest.fn().mockResolvedValue({
      data: [{ id: 'test-id' }],
      error: null,
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }),
  })),
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@test.com' },
        },
      },
    }),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  realtime: {
    on: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
};

// ─────────────────────────────────────────────────────────────
// Mock Real-Time Subscriptions
// ─────────────────────────────────────────────────────────────

global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();

// ─────────────────────────────────────────────────────────────
// Mock Global State
// ─────────────────────────────────────────────────────────────

global.currentUser = { id: 'user-123', email: 'test@test.com' };
global.db = { programmes: [], families: [], me_teams: [] };
global.progId = 'prog-123';
global.currentSection = 'hub';
global.apqpTab = 'ctq';
global.capacityTab = 'root';
global.productionTab = 'root';
global.productDevelopmentTab = 'root';
global.bomSubTab = 'parts';
global.meStartOffset = 0;
global.prodPlanMonthOffset = 0;

// ─────────────────────────────────────────────────────────────
// Load DOM
// ─────────────────────────────────────────────────────────────

const html = fs.readFileSync(
  path.resolve(__dirname, './index.html'),
  'utf8'
);
document.documentElement.innerHTML = html.toString();

// ─────────────────────────────────────────────────────────────
// Ensure Critical DOM Elements Exist
// ─────────────────────────────────────────────────────────────

const ensureElement = (id) => {
  if (!document.getElementById(id)) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
};

ensureElement('mainContent');
ensureElement('modalBg');
ensureElement('loginForm');
ensureElement('returnHubBtn');
```

---

## Testing Architecture

### Dependency Mocking

All tests must mock these global dependencies:

#### 1. Supabase Client
```javascript
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ order: jest.fn(() => ({ data: [], error: null })) })),
    insert: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })),
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
    })
  }
};
```

#### 2. Real-time Subscriptions
```javascript
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
```

#### 3. Current User
```javascript
global.currentUser = { id: 'test-user', email: 'test@test.com' };
```

#### 4. Global State (all variables)
```javascript
global.db = { programmes: [{ id: 'test-prog-1', name: 'Test Project' }] };
global.progId = 'test-prog-1';
global.currentSection = 'hub';
// ... other state variables from state.js
```

#### 5. DOM Setup
```javascript
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Add missing elements if needed
if (!document.getElementById('mainContent')) {
  const mc = document.createElement('div');
  mc.id = 'mainContent';
  document.body.appendChild(mc);
}
```

#### 6. Feature-Specific Mocks
```javascript
// Mock render functions
global.renderProductDevelopment = jest.fn().mockReturnValue('<div>Product Dev</div>');

// Mock npi module
global.npi = {
  dashboard: { renderProjects: jest.fn().mockReturnValue('<div>Projects</div>') },
  gate: { renderGatePage: jest.fn((num) => `<div>Gate ${num}</div>`) },
  apqp: { renderAPQP: jest.fn().mockReturnValue('<div>APQP</div>') },
};

// Mock subscription cleanup
global.bugDataUnsubscribe = jest.fn();
global.meDataUnsubscribe = jest.fn();
```

---

## Test Organization

### Describe Blocks

Group related tests using `describe()`:

```javascript
describe('Navigation Module (navigation.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.currentSection = 'hub';
  });

  describe('parseHash', () => {
    test('should return empty object for empty hash', () => {
      // ...
    });
  });

  describe('navigate', () => {
    test('should navigate to projects section', () => {
      // ...
    });
  });

  describe('render', () => {
    test('should render projects dashboard', () => {
      // ...
    });
  });
});
```

### Test Categories

1. **Unit Tests** - Test individual functions in isolation
2. **Integration Tests** - Test interactions between modules
3. **Behavioral Tests** - Test user-facing behavior

---

## Testing Patterns

### Pattern 1: Function Existence
```javascript
test('bugDataInit should be defined', () => {
  expect(typeof bugDataInit).toBe('function');
});
```

### Pattern 2: Async Function Testing
```javascript
test('bugDataInit should run without errors', async () => {
  await expect(bugDataInit()).resolves.not.toThrow();
});
```

### Pattern 3: DOM Manipulation
```javascript
test('should show return button on feature pages', () => {
  navigate('apqp');
  const btn = document.getElementById('returnHubBtn');
  expect(btn.style.display).toBe('flex');
});
```

### Pattern 4: Mock Verification
```javascript
test('should initialize bug reports data when navigating to bugreports', () => {
  navigate('bugreports');
  expect(global.bugDataManager.init).toHaveBeenCalled();
});
```

### Pattern 5: State Changes
```javascript
test('should reset capacityTab when navigating to capacity', () => {
  global.capacityTab = 'me';
  navigate('capacity');
  expect(global.capacityTab).toBe('root');
});
```

### Pattern 6: Error Handling
```javascript
test('doLogin should show an error if email or password is blank', async () => {
  document.getElementById('loginEmail').value = '';
  await doLogin();

  const errDiv = document.getElementById('loginErr');
  expect(errDiv.style.display).toBe('block');
  expect(errDiv.textContent).toBe('Please enter your email and password.');
});
```

---

## Async Testing Patterns

Real-time subscriptions and debounced saves are common in this app. Here's how to test them:

### Pattern: Testing Debounced Saves (800ms)

```javascript
test('should debounce save to Supabase by 800ms', async () => {
  jest.useFakeTimers();
  
  // User makes an edit
  await myFeatureUpdate(id, { name: 'New Name' });
  
  // Supabase update should NOT be called yet
  expect(global.supa.from().update).not.toHaveBeenCalled();
  
  // Fast-forward 800ms
  jest.advanceTimersByTime(800);
  
  // NOW it should be called
  expect(global.supa.from().update).toHaveBeenCalled();
  
  jest.useRealTimers();
});
```

### Pattern: Testing Real-Time Subscriptions

```javascript
test('should update UI when real-time notification arrives', async () => {
  let onUpdateCallback;
  
  global.createRealtimeSubscription.mockImplementation((table, channel, handlers) => {
    onUpdateCallback = handlers.onUpdate;
    return 'sub-ref-123';
  });
  
  // Initialize feature (which sets up subscription)
  await bugDataInit();
  
  // Simulate real-time update from Supabase
  const newBug = { id: 'bug-1', title: 'New Bug', status: 'open' };
  onUpdateCallback(newBug);
  
  // Assert UI updated
  expect(document.querySelector('[data-bug-id="bug-1"]')).toBeTruthy();
});
```

### Pattern: Testing Subscription Cleanup

```javascript
test('should unsubscribe from real-time when navigating away', () => {
  const mockSubRef = { id: 'sub-123' };
  global.bugDataUnsubscribe = jest.fn();
  
  navigate('capacity');
  
  expect(global.bugDataUnsubscribe).toHaveBeenCalledWith(mockSubRef);
});
```

### Pattern: Testing Concurrent Edits

```javascript
test('should handle concurrent edits with last-write-wins', async () => {
  const oldValue = 'Original';
  const value1 = 'Edit 1';
  const value2 = 'Edit 2';
  
  // User 1 edits
  await featureUpdate(id, { field: value1 });
  jest.advanceTimersByTime(800);
  
  // User 2 edits while save is in flight
  await featureUpdate(id, { field: value2 });
  jest.advanceTimersByTime(800);
  
  // Final Supabase call should have value2 (last write)
  expect(global.supa.from().update).toHaveBeenLastCalledWith(
    expect.objectContaining({ field: value2 }),
    expect.anything()
  );
});
```

---

## What to Test

### High Priority (Test Everything)

✅ **Navigation & Routing**
- Hash parsing
- Section navigation (test all 5+ main sections)
- Tab changes (test all tabs in each section)
- Subscription cleanup on navigation
- Back/forward navigation
- Hash parameter conflicts

✅ **Data Layer (CRUD)**
- Data initialization and loading
- Create operations
- Read operations
- Update operations
- Delete operations
- Supabase error handling
- Empty state handling

✅ **Authentication**
- Login flow with valid credentials
- Login flow with invalid credentials
- Login with empty fields
- Logout flow
- Session handling
- Error states

✅ **Complex Business Logic**
- RPN calculations (edge cases: 0, 99, 1000)
- Capacity calculations
- PERT estimation
- Data transformations
- Sorting and filtering logic

✅ **State Management**
- State initialization
- State transitions
- Cross-module state dependencies
- Stale state cleanup

### Medium Priority (Test Critical Paths)

✅ **Render Functions**
- Render without errors
- Correct HTML structure
- Empty state handling
- Loading state handling
- Error state rendering

✅ **User Interactions**
- Form submissions
- Button clicks
- Modal open/close
- Tab switching
- Keyboard navigation

### Lower Priority (Test When Time Permits)

⚪ **Simple Getters/Setters**
⚪ **Pure UI Components** (visual appearance)
⚪ **Third-party Library Wrappers**

---

## Module-Specific Testing Guides

### Testing `navigation.js`

**Dependencies to Mock:**
- All render functions (`renderProductDevelopment`, `renderProduction`, etc.)
- `npi` module and sub-modules
- Subscription cleanup functions
- DOM elements (`mainContent`, `returnHubBtn`)
- Global state variables

**Key Test Scenarios:**
1. Hash parsing with various formats (empty, single param, multiple params)
2. Navigation to each section (hub, capacity, product-dev, production, bugreports, productmgmt)
3. Subscription cleanup on section changes
4. Tab reset behavior
5. Return button visibility on feature pages
6. Back navigation logic
7. popstate event handling

**Example:**
```javascript
describe('navigate', () => {
  test('should cleanup bug reports subscription when leaving bugreports', () => {
    global.currentSection = 'bugreports';
    navigate('hub');
    expect(global.bugDataUnsubscribe).toHaveBeenCalled();
  });
});
```

### Testing `auth.js`

**Dependencies to Mock:**
- `global.supa.auth.signInWithPassword`
- `global.launchApp`
- DOM elements (`loginEmail`, `loginPassword`, `loginBtn`, `loginErr`)

**Key Test Scenarios:**
1. Login with valid credentials
2. Login with invalid credentials
3. Login with empty fields
4. Logout functionality
5. Session restoration on app load

**Example:**
```javascript
test('doLogin should call launchApp on successful authentication', async () => {
  global.supa.auth.signInWithPassword.mockResolvedValue({
    data: { user: { id: '123', email: 'test@example.com' } },
    error: null
  });

  await doLogin();

  expect(global.launchApp).toHaveBeenCalledTimes(1);
});
```

### Testing `db.js`

**Dependencies to Mock:**
- `global.supa.from().select().order()`
- `localStorage`
- Global `db` object

**Key Test Scenarios:**
1. Remote data loading
2. Local storage sync
3. Save debouncing (800ms)
4. Data migration
5. Error recovery
6. Concurrent save handling

### Testing Feature Modules (Capacity, Production, NPI)

**Dependencies to Mock:**
- Supabase queries
- Chart.js (if chart rendering)
- Render functions for sub-components
- Data store functions
- Real-time subscriptions

**Key Test Scenarios:**
1. Data initialization and loading
2. CRUD operations (create, read, update, delete)
3. Calculations and transformations
4. UI rendering and updates
5. User interactions and events
6. Error handling and recovery
7. Real-time sync and concurrent edits

---

## Common Pitfalls & Solutions

### Problem: Test Pollution
**Symptom:** Tests pass individually but fail when run together.

**Solution:** Reset all mocks and state in `beforeEach()`:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
  global.currentSection = 'hub';
  global.progId = 'test-prog-1';
  window.location.hash = '';
});
```

### Problem: Async Timing Issues
**Symptom:** Tests fail intermittently due to async operations.

**Solution:** Use proper async/await and mock timers if needed:
```javascript
jest.useFakeTimers();
// ... run code
jest.runAllTimers();
jest.useRealTimers();
```

### Problem: Missing DOM Elements
**Symptom:** Tests fail with "Cannot read property of null".

**Solution:** Ensure all required DOM elements exist (see jest.setup.js template above):
```javascript
const ensureElement = (id) => {
  if (!document.getElementById(id)) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
};

ensureElement('mainContent');
ensureElement('modalBg');
```

### Problem: Global State Leakage
**Symptom:** Tests affect each other through global variables.

**Solution:** Save and restore global state:
```javascript
let savedProgId;
beforeEach(() => { savedProgId = global.progId; });
afterEach(() => { global.progId = savedProgId; });
```

### Problem: Flaky Async Tests
**Symptom:** Tests pass sometimes, fail other times, due to timing.

**Solution:** Use fake timers consistently:
```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('should debounce save', async () => {
  await myFeatureUpdate(id, { name: 'New' });
  expect(supa.from().update).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(800);
  expect(supa.from().update).toHaveBeenCalled();
});
```

---

## Coverage Goals

| Module Type | Target Coverage | Rationale |
|-------------|----------------|-----------|
| Core (state, db, auth) | 90%+ | Foundation of entire app |
| Navigation | 85%+ | Critical for user experience |
| Data Layers | 80%+ | Data integrity is crucial |
| Feature Modules | 70%+ | Balance effort vs. risk |
| Render Functions | 60%+ | Focus on structure, not pixels |
| Helpers/Utils | 90%+ | Reused throughout app |

**Note:** Coverage is a guideline, not a goal. Focus on testing critical paths thoroughly.

---

## Continuous Integration (Future)

When CI is implemented:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
```

---

## Writing New Tests: Checklist

When adding tests for a new module:

- [ ] Create `<module>.test.js` in `tests/` directory
- [ ] Copy jest.setup.js template or reference from existing test file
- [ ] Mock all external dependencies (Supabase, DOM, globals)
- [ ] Load the script using `fs.readFileSync` and `eval()` (or require if applicable)
- [ ] Set up `beforeEach()` to reset state
- [ ] Test happy path first
- [ ] Test error cases and edge cases
- [ ] Test state changes and side effects
- [ ] Test concurrent scenarios (real-time, debounce)
- [ ] Verify mock function calls where appropriate
- [ ] Run tests locally before committing: `npm test`
- [ ] Ensure tests pass with all other tests: `npm test`
- [ ] Update Test Coverage Status section above

---

## Example Test File Template

```javascript
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.supa = { /* ... see jest.setup.js template ... */ };
global.createRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };
global.db = { programmes: [] };

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Load script(s) to test
const script = fs.readFileSync(
  path.resolve(__dirname, '../path/to/module.js'),
  'utf8'
);
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Module Name (module.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset state to defaults
    global.currentSection = 'hub';
  });

  describe('Function Group 1', () => {
    test('should do something specific', () => {
      // Arrange: Set up test data
      const input = { id: '123', name: 'Test' };
      
      // Act: Execute the function
      const result = myFunction(input);
      
      // Assert: Verify the result
      expect(result).toEqual({ ...input, processed: true });
    });

    test('should handle errors gracefully', async () => {
      global.supa.from().select.mockRejectedValueOnce(
        new Error('Network error')
      );
      
      await expect(myAsyncFunction()).rejects.toThrow('Network error');
    });
  });

  describe('Function Group 2', () => {
    test('should interact with Supabase correctly', async () => {
      await myFeatureUpdate(id, updates);
      
      expect(global.supa.from).toHaveBeenCalledWith('my_table');
      expect(global.supa.from().update).toHaveBeenCalledWith(
        expect.objectContaining(updates),
        expect.anything()
      );
    });
  });
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [Testing Async Code](https://jestjs.io/docs/asynchronous)
- [Fake Timers Guide](https://jestjs.io/docs/timer-mocks)

---

## Questions?

For testing guidance or to discuss test strategy, refer to existing test files in the `tests/` directory as examples or consult this document.

**Remember:** Good tests are like documentation—they describe what the code should do and catch it when it doesn't.

