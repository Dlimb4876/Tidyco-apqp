# Tidyco APQP Development Skills Guide

This guide explains the 8 development skills available to prevent common bugs and maintain code quality. Each skill is a command-line utility that audits your code.

## Quick Start

```bash
# Run all checks at once
npm run check:all

# Or run individual checks
npm run check:load-order      # Verify script load order
npm run check:syntax          # Check for syntax errors
npm run check:subscriptions   # Find memory leaks in subscriptions
npm run check:mobile          # Verify responsive design breakpoints
npm run check:modals          # Audit modal state cleanup
npm run check:state           # Track global state variables
npm run check:rls             # Verify Supabase RLS policies (manual)
npm run check:coverage        # Run tests and coverage report
```

---

## 1. Load Order Checker

**Command:** `npm run check:load-order`

Verifies script load order in `index.html` matches dependencies.

### What It Catches
- ❌ Missing dependencies (script A needs script B, but B isn't loaded)
- ❌ Wrong positioning (script loads before its dependencies)
- ❌ Duplicate scripts (same file loaded twice)
- ❌ app.js doesn't load last (must be final script)

### Example Output
```
 1: state.js
 2: auth.js (needs: state.js)          ✅ Correct
 3: db.js (needs: state.js, auth.js)   ✅ Correct
 4: helpers.js
 5: navigation.js (needs: helpers.js)  ✅ Correct
```

### When To Use
- After adding a new feature file (`*.js`)
- Before committing code
- If you see "function not found" errors at runtime

---

## 2. Syntax Validator

**Command:** `npm run check:syntax`

Scans JS files for syntax errors that silently break entire files.

### What It Catches
- ❌ **Duplicate `const` in same scope** — kills entire file
  ```javascript
  const foo = 1;  // OK
  const foo = 2;  // ❌ SYNTAX ERROR — file won't load
  ```
- ❌ Unclosed brackets/parentheses
  ```javascript
  function test() {    // ❌ Missing closing }
  ```
- ❌ Missing commas in object literals
  ```javascript
  { foo: 1 bar: 2 }   // ❌ Missing comma
  ```

### Why This Matters
In vanilla JavaScript (no build step), syntax errors don't show in the browser console. **The file silently fails to parse**, causing all functions in that file to be `undefined`. This creates confusing "function is not a function" errors elsewhere.

### When To Use
- Before running tests
- After editing large JS files
- If you get "X is not a function" at runtime — check the file where X is defined first

---

## 3. RLS Policy Checker

**Command:** `npm run check:rls`

Verifies Supabase tables have RLS enabled and proper policies.

### What It Checks
- ✅ Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- ✅ Policies exist for SELECT, INSERT, UPDATE, DELETE
- ✅ Policies allow authenticated users
- ✅ INSERT policies check `user_id = auth.uid()`

### What Happens If Missing
- 🔴 RLS policy missing → queries return `[]` silently (no error!)
- 🔴 RLS disabled → all data readable by anyone (security hole)
- 🔴 Wrong policy → data queries fail without any console error

### Template
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read"
ON my_table FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_write"
ON my_table FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
```

### When To Use
- After creating a new Supabase table
- If queries are returning empty data unexpectedly
- Before deploying to production

---

## 4. Subscription Cleanup Auditor

**Command:** `npm run check:subscriptions`

Finds `createRealtimeSubscription()` calls and verifies cleanup.

### What It Catches
- ❌ Subscription created but never unsubscribed → memory leak
- ❌ Multiple subscriptions to same table without cleanup → duplicate handlers
- ❌ Navigation doesn't unsubscribe → stale data across app

### Example Pattern
```javascript
// 1. Create subscription
const bugSub = createRealtimeSubscription('bug_reports', 'bugs_channel', {
  onInsert: (data) => { /* handle */ }
});

// 2. Clean up when leaving portal
removeRealtimeSubscription(bugSub);

// OR use navigate() which auto-cleans for known features
navigate('capacity');  // automatically cleans capacity subscriptions
```

### Auto-Cleanup Features
These portals auto-cleanup subscriptions when navigating away:
- `capacity`
- `product-development`
- `bugreports` (feedback portal)
- `production`
- `operations`

### When To Use
- After adding a real-time feature
- If the app is running slowly (subscriptions leak memory)
- Before adding subscription to a new portal

---

## 5. Mobile Breakpoint Verifier

**Command:** `npm run check:mobile`

Scans CSS files for mobile-first responsive design.

### What It Checks
- ✅ Mobile layout defined first (no media query, assume 480px)
- ✅ `@media (max-width: 767px)` for tablet adjustments
- ✅ `@media (min-width: 768px)` for desktop layout
- ✅ No fixed widths (use flexbox/grid with percentages)

### Template
```css
/* Mobile first (480px and up) */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Tablet and up (768px and up) */
@media (min-width: 768px) {
  .card {
    flex-direction: row;
    gap: 16px;
  }
}
```

### Test Breakpoints
- 375px (mobile) — single column, tight spacing
- 768px (tablet) — two columns, medium spacing
- 1920px (desktop) — full width, generous spacing

### When To Use
- After creating a new CSS file
- When designing a new feature
- Before marking feature as "done"

---

## 6. Modal State Auditor

**Command:** `npm run check:modals`

Finds modal openings and verifies state is cleared on close.

### What It Catches
- ❌ `showModal()` called but `closeModal()` missing
- ❌ Modal data not cleared on close → pollutes next open
- ❌ Reopening modal uses stale data from previous session

### Example Problem
```javascript
// ❌ BAD — state persists
ctqPickTarget = row;
showModal('ctqPickModal');
// ... user closes modal
showModal('ctqPickModal');  // ← ctqPickTarget is STILL the old row!
```

### Correct Pattern
```javascript
// ✅ GOOD — clean state on close
ctqPickTarget = row;
showModal('ctqPickModal');

function closeCtqPickModal() {
  ctqPickTarget = null;  // ← Clear the state
  closeModal('ctqPickModal');
}

// Initialize in modal to prevent undefined
if (!ctqPickTarget) {
  closeModal('ctqPickModal');
  return;
}
```

### When To Use
- After adding a new modal
- If modal shows stale data on reopen
- Before committing modal code

---

## 7. State Variable Tracker

**Command:** `npm run check:state`

Verifies state variables are defined in `state.js` and used consistently.

### What It Does
- Lists all state variables defined in `state.js`
- Shows where each is used (files and line numbers)
- Flags potential undeclared globals

### Important State Variables (⭐)
- `db` — entire project data
- `progId` — active project UUID
- `currentSection` — active portal (hub, capacity, etc.)
- `apqpTab` — active APQP sub-tab
- `capacityTab` — active capacity sub-tab
- `productionTab` — active production sub-tab
- `productDevelopmentTab` — active development sub-tab
- `meStartOffset` — month offset for ME capacity chart
- `prodPlanMonthOffset` — month offset for production plan

### Adding New State
```javascript
// 1. Define in state.js with default value
let myNewVariable = null;

// 2. Document in CLAUDE.md if important
// 3. Use globally (no need for imports)
myNewVariable = someValue;
```

### When To Use
- Before creating a new global variable
- If you suspect duplicate state variables
- To understand app state structure

---

## 8. Test Coverage Reporter

**Command:** `npm run check:coverage`

Runs Jest tests and reports coverage + recommendations.

### What It Shows
- Total tests run and pass/fail count
- Coverage by file (statements, branches, functions, lines)
- Recommendations for untested scenarios

### Key Areas To Test
1. **Supabase Failures** — network timeouts, RLS blocks, constraint violations
2. **Concurrent Edits** — two users updating simultaneously
3. **Debounce Timing** — rapid edits with 800ms debounce
4. **Modal State** — data persists/clears correctly
5. **Real-Time Sync** — subscriptions fire and cleanup
6. **Navigation** — hash changes, back button, state preservation
7. **Authentication** — login/logout, session management

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode (re-run on file change)
npm test -- file.test.js    # Single test file
```

### When To Use
- Before committing code
- After refactoring logic
- To identify untested code paths
- See `TESTING_STRATEGY.md` for full guide

---

## Running All Checks

```bash
npm run check:all
```

This runs (in order):
1. Load Order Checker
2. Syntax Validator
3. Subscription Cleanup Auditor
4. Mobile Breakpoint Verifier
5. Modal State Auditor
6. State Variable Tracker
7. Test Coverage Reporter

**Use this before committing!**

---

## Common Bugs These Skills Prevent

| Bug | Skill | Prevention |
|-----|-------|-----------|
| "function is not a function" | Syntax, Load Order | Check file parses, deps load first |
| Silent empty queries | RLS Checker | Verify RLS enabled |
| App slows/crashes | Subscription Auditor | Find memory leaks |
| Layout breaks on mobile | Mobile Verifier | Verify breakpoints |
| Modal shows old data | Modal Auditor | Clear state on close |
| Duplicate state vars | State Tracker | Define in state.js |
| Untested code fails | Coverage Reporter | Run tests |

---

## Recommended Workflow

### Before Committing
```bash
npm run check:all
npm test
```

### After Syntax Errors
```bash
npm run check:syntax   # Find the problem
npm run check:load-order  # Verify dependencies
```

### After Adding Subscriptions
```bash
npm run check:subscriptions  # Find memory leaks
```

### After Creating Modals
```bash
npm run check:modals  # Verify cleanup
```

### After Adding CSS
```bash
npm run check:mobile  # Responsive design check
```

### After Adding State
```bash
npm run check:state  # Track usage
```

---

## Questions or Issues?

- Check the output messages — each skill provides specific guidance
- Read `CLAUDE.md` for architecture details
- Check `TESTING_STRATEGY.md` for testing patterns
- Open an issue on GitHub if a skill has false positives

**These skills are designed to prevent the most common bugs in this project. Use them liberally!**
