# AGENTS.md — Coding Guidelines for Agentic Operations

## Quick Commands

### Testing
```bash
npm test                                    # Run all Jest tests
npm test -- path/to/test.test.js            # Run single test file
npm test -- --testNamePattern="pattern"     # Run tests matching a pattern
npm test -- --watch                         # Run in watch mode
npm test -- --detectOpenHandles             # Debug open handles
```

### Validation & Checks
```bash
npm run check:all              # Full validation suite (syntax, imports, ESM, subscriptions, state, RLS, mobile, modals, coverage)
npm run check:syntax           # Validate JavaScript syntax
npm run check:imports          # Verify ESM import/export wiring
npm run check:esm-coverage     # Track remaining non-ESM files
npm run check:rls              # Audit RLS policies
npm run check:subscriptions    # Check realtime cleanup
npm run check:state            # Track global state variables
npm run check:mobile           # Verify mobile breakpoints
npm run check:modals           # Audit modal state handling
npm run check:coverage         # Generate test coverage report
```

### Linting & Formatting (NPI portal only)
```bash
npm run lint:npi       # Run ESLint on NPI portal
npm run format:npi     # Run Prettier on NPI portal
```

### Wiki
```bash
npm run wiki:build-index    # Rebuild search index
npm run wiki:audit-tokens   # Audit token usage
npm run wiki:check-links    # Check internal links
npm run wiki:check          # Full wiki validation
```

### Validation Order (fresh clone or major changes)
```bash
npm install          # 1. Install dependencies
npm test             # 2. Run tests
npm run check:all    # 3. Full validation suite
```

## Architecture Snapshot

- **Framework**: Vanilla JavaScript SPA (no build pipeline)
- **Backend**: Supabase (Auth, Postgres, Realtime)
- **Package Manager**: npm
- **Testing**: Jest 30 with jsdom environment
- **Entry Point**: `core/js/main.js` loaded via `<script type="module">` in `index.html`
- **Styling**: CSS with mobile-first breakpoints; Chart.js v4.4.0 via CDN
- **Desktop**: Electron wrapper (optional)

## Hard Rules (Non-Negotiable)

1. **ESM Only**: Use named ESM imports/exports for cross-file dependencies. No `window.*` bridge assignments.
2. **No Duplicate `const`**: Never redeclare variables in the same scope.
3. **Global State**: Keep mutable state in `core/js/state.js` with defaults initialized.
4. **XSS Prevention**: Use `esc()` helper for any user data rendered into HTML strings.
5. **Navigation**: Use `navigate()` for route changes so realtime cleanup runs.
6. **RLS Model**: Do NOT filter client queries by `user_id`; rely on Supabase RLS policies.
7. **Documentation**: Keep new plans/docs in `plans/` unless it is a core root doc.
8. **Mobile-First CSS**: Use both breakpoints:
   - `@media (max-width: 767px)` (mobile)
   - `@media (min-width: 768px)` (desktop)
9. **Guide Updates**: When adding/changing features on content pages, update the matching entry in `GUIDE_CONTENT` in `utils/js/guide.js`.
10. **Comment Why**: Add a brief comment explaining *why* code was added or changed (bug fix, new feature, optimization, etc.).

## Code Style

### Formatting (`.prettierrc`)
- Single quotes for strings (`'string'`)
- No semicolons at end of statements
- Tab width: 2 spaces
- Line length: max 100 characters
- Trailing commas: none

### Naming
- Variables/functions: `camelCase` (`getCurrentUser()`, `progId`)
- Constants: `UPPER_CASE` (`GATE_DEFS`, `FAMILIES`)
- Descriptive names: `isLoading` not `loading_state`

### Imports
- Use named ESM imports for cross-file dependencies
- Global objects available: `supa` (Supabase client), `db`, `currentUser`, `GATE_DEFS`, `FAMILIES`, etc.

### Error Handling
- Always handle async errors with try-catch or `.catch()`
- Use early returns to reduce nesting
- Log errors clearly: `console.error('Operation failed:', error)`
- Return predictable types (null, empty array, or error object)

```javascript
async function fetchProgram(id) {
  try {
    const { data, error } = await supa.from('programs').select().eq('id', id)
    if (error) throw error
    return data[0] || null
  } catch (err) {
    console.error('Failed to fetch program:', err)
    return null
  }
}
```

### Conditions
- Use strict equality: `===` and `!==`
- Null checks: `value == null` allowed for null/undefined comparison
- Prefer explicit boolean: `if (isActive === true)`

### Comment Conventions
Add a brief comment explaining *why* code was added or changed. Do not comment self-evident code.

```javascript
// Bug fix: Filter out deleted items before rendering to prevent "key not found" errors
const activeItems = items.filter(i => !i.deleted)

// Optimization: Use Set lookup instead of array.includes() for O(1) instead of O(n)
const validIds = new Set(data.map(d => d.id))
```

## Testing Guidelines

- Test files: `tests/*.test.js` — mirror module name (e.g., `core/js/state.js` → `tests/state.test.js`)
- Follow Jest Arrange-Act-Assert structure
- Use jsdom-safe patterns (see `jest.setup.js`)
- Mock Supabase client calls rather than hitting live services
- Include at least one unhappy path test per new behavior
- Keep async tests using `async/await`
- Aim for >80% code coverage on critical paths

## ID Generation Pattern

```javascript
const id = 'f_' + Math.random().toString(36).substr(2, 5)
```

Prefixes: `f_`=mode, `e_`=effect, `c_`=cause, `r_`=risk, `a_`=action

## Save Debouncing

Data persists to Supabase with **800–900 ms debounce**. Plan UX accordingly.

## Changelog

After each logical change, add entry near top of `CHANGELOG.md`:
```
## YYYY-MM-DD | Short descriptive title | Brief reason
```

## Canonical Detail Rules

For detailed guidance, consult:
- **Test rules**: `.claude/rules/testing.md`
- **Code style & comments**: `.claude/rules/code-style.md`
- **Security**: `.claude/rules/security.md`
- **Database/RLS**: `.claude/rules/database.md`
- **Navigation**: `.claude/rules/navigation.md`
- **Realtime**: `.claude/rules/realtime.md`
- **Components**: `.claude/rules/components.md`

## MCP Tools

- **Serena** (`oraios/serena`): Serena ALM/Octane integration
- **GitHub** (`github/github-mcp-server`): GitHub API operations

## OpenWolf Protocol

Follow rules in `.claude/rules/openwolf.md`:
- Check `.wolf/anatomy.md` before reading project files
- Check `.wolf/cerebrum.md` Do-Not-Repeat list before generating code
- Update `.wolf/anatomy.md` and append to `.wolf/memory.md` after writing files
- Log bugs to `.wolf/buglog.json` after fixes
- Run `openwolf designqc` when asked to evaluate UI design

## User Context

The primary user is non-technical. Use plain language and avoid technical jargon. Keep error messages and inline comments clear and actionable.
