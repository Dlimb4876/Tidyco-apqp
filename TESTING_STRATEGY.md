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

## Test File Structure

```
/tests/
├── navigation.test.js      # Hash routing and render switchboard
├── production.test.js      # Production portal functionality
├── bugs.test.js           # Bug reports data module
├── auth.test.js           # Authentication (TO DO)
├── db.test.js             # Data persistence (TO DO)
├── helpers.test.js        # Utility functions (TO DO)
└── ...
```

**Naming Convention:** `<module>.test.js` mirrors source file `<module>.js`

---

## Testing Architecture

### Dependency Mocking

All tests must mock these global dependencies:

#### 1. Supabase Client
```javascript
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({ data: [], error: null })),
    })),
  })),
  auth: {
    getSession: jest.fn(() => ({
      data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
    }))
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

#### 4. Global State
```javascript
global.db = { programmes: [{ id: 'test-prog-1', name: 'Test Project' }] };
global.progId = 'test-prog-1';
global.currentSection = 'hub';
// ... other state variables
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
  // ...
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
    // Reset state before each test
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

## What to Test

### High Priority (Test Everything)

✅ **Navigation & Routing**
- Hash parsing
- Section navigation
- Tab changes
- Subscription cleanup
- Back/forward navigation

✅ **Data Layer**
- Data initialization
- CRUD operations
- Supabase interactions
- Error handling

✅ **Authentication**
- Login flow
- Logout flow
- Session handling
- Error states

✅ **Complex Business Logic**
- RPN calculations
- Capacity calculations
- PERT estimation
- Data transformations

✅ **State Management**
- State initialization
- State transitions
- Cross-module state dependencies

### Medium Priority (Test Critical Paths)

✅ **Render Functions**
- Render without errors
- Correct HTML structure
- Empty state handling

✅ **User Interactions**
- Form submissions
- Button clicks
- Modal open/close
- Tab switching

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
1. Hash parsing with various formats
2. Navigation to each section
3. Subscription cleanup on section changes
4. Tab reset behavior
5. Return button visibility
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
5. Session restoration

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
3. Save debouncing
4. Data migration
5. Error recovery

### Testing Feature Modules (Capacity, Production, NPI)

**Dependencies to Mock:**
- Supabase queries
- Chart.js (if chart rendering)
- Render functions for sub-components
- Data store functions

**Key Test Scenarios:**
1. Data initialization
2. CRUD operations
3. Calculations and transformations
4. UI rendering
5. User interactions

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
```

### Problem: Missing DOM Elements
**Symptom:** Tests fail with "Cannot read property of null".

**Solution:** Ensure all required DOM elements exist:
```javascript
if (!document.getElementById('mainContent')) {
  const mc = document.createElement('div');
  mc.id = 'mainContent';
  document.body.appendChild(mc);
}
```

### Problem: Global State Leakage
**Symptom:** Tests affect each other through global variables.

**Solution:** Save and restore global state:
```javascript
let savedProgId;
beforeEach(() => { savedProgId = global.progId; });
afterEach(() => { global.progId = savedProgId; });
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
- [ ] Mock all external dependencies (Supabase, DOM, globals)
- [ ] Load the script using `fs.readFileSync` and `eval()`
- [ ] Set up `beforeEach()` to reset state
- [ ] Test happy path first
- [ ] Test error cases and edge cases
- [ ] Test state changes and side effects
- [ ] Verify mock function calls where appropriate
- [ ] Run tests locally before committing
- [ ] Ensure tests pass with `npm test`

---

## Example Test File Template

```javascript
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.supa = { /* ... */ };
global.createRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };
global.db = { programmes: [] };

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Load script(s) to test
const script = fs.readFileSync(path.resolve(__dirname, '../path/to/module.js'), 'utf8');
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset state
  });

  describe('Function Group', () => {
    test('should do something', () => {
      // Arrange
      // Act
      // Assert
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

---

## Questions?

For testing guidance or to discuss test strategy, refer to existing test files as examples or consult the project documentation.

**Remember:** Good tests are like documentation—they describe what the code should do and catch it when it doesn't.
