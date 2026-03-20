# CLAUDE.md — Tidyco APQP Quality Tool

## User Context
**The user has zero coding experience.** Use plain language, no jargon. For any multi-step task always create a Todo list, mark each step in-progress then completed one at a time — never batch-complete.

## Acronyms
| Acronym | Meaning | Acronym | Meaning |
|---|---|---|---|
| ME | Manufacturing Engineering | PM | Project Management |
| APQP | Advanced Product Quality Planning | RLS | Row Level Security |
| CTQ | Critical to Quality | PFMEA | Process Failure Mode & Effects Analysis |
| BOM | Bill of Materials | SPA | Single Page Application |

---

## Project Snapshot
Vanilla JS SPA, **no build pipeline**. Static HTML/JS/CSS served directly to browser.
- **Backend:** Supabase v2 (PostgreSQL + Auth + RLS) — CDN loaded
- **Charts:** Chart.js v4.4.0 (CDN) · **Fonts:** IBM Plex Sans/Mono (Google Fonts)
- **Tests:** Jest 30 + jsdom · **Lint/Format:** ESLint 9 + Prettier (NPI files only)

---

## 10 Critical Rules

1. **Script load order = `index.html`** is the source of truth. Layer order: `state.js → auth.js → db.js → helpers.js → navigation.js → realtime.js → [portals] → app.js`. Add new `<script>` tags in the correct position — dependencies load before dependents.

2. **No duplicate `const` in same scope.** A SyntaxError silently kills the entire file — every function in it becomes `undefined` at runtime with no console warning.

3. **All global state lives in `core/js/state.js`** with a default value. Use `let` for mutable, `const` for fixed. Never create state variables in other files.

4. **Capacity parity.** ME Capacity changes (`portals/capacity/`) must be mirrored in PM Capacity unless explicitly excluded.

5. **RLS = authentication only.** All authenticated users see all data. Never filter Supabase queries by `user_id`. New tables need: `CREATE POLICY "auth" ON table FOR ALL USING (auth.role() = 'authenticated')`.

6. **Real-time subscriptions need cleanup.** Store the ref, call `removeRealtimeSubscription(ref)` before navigating — or use `navigate()` which handles cleanup automatically.

7. **`esc()` for all user data in HTML strings.** Always use `esc(value)` from `helpers.js` when interpolating user input into HTML. Prevents XSS.

8. **Saves debounce at 800–900 ms.** Data is not persisted to Supabase immediately after a UI edit.

9. **Plans and architecture docs go in `plans/` folder**, never at the repo root.

10. **Mobile-first CSS.** All new CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)` breakpoints. Design for 375px first, scale up.

---

## Repo Layout
```
index.html              # App entry point — ALL script/CSS load order defined here
core/js/state.js        # Global state vars + constants (GATE_DEFS, FAMILIES, BOM_TYPES)
core/js/auth.js         # Supabase client, login/logout
core/js/db.js           # Data persistence + Supabase sync
core/js/app.js          # App init — MUST load last
core/css/main.css       # CSS variables, typography, shell layout
core/css/components.css # Shared UI: modals, buttons, cards, tables
utils/js/helpers.js     # esc(), showModal(), closeModal(), emptyState()
utils/js/navigation.js  # Hash routing, render() switchboard, navigate()
utils/js/realtime.js    # createRealtimeSubscription(), removeRealtimeSubscription()
portals/                # hub/ · capacity/ · product-development/ · production/ · bugs/
tests/                  # Jest test files (*.test.js)
plans/                  # Architecture docs and feature plans (.md files)
```

---

## Key Patterns
```javascript
prog()                                          // Active project accessor
esc(value)                                      // XSS-safe HTML interpolation
showModal('modalId'); closeModal('modalId')     // Modal open/close
navigate('capacity', { ct: 'me' })             // Hash nav + subscription cleanup
const id = 'f_' + Math.random().toString(36).substr(2, 5)  // Prefixed short ID
// ID prefixes: f_=mode  e_=effect  c_=cause  r_=risk  a_=action
// RPN = SEV × OCC × DET  (high threshold ≥ 100; SEV/OCC/DET each 1–10)
// Hash format: #p=<uuid>&s=<section>&t=<tab>
```

---

## New Feature Checklist
- [ ] Add `<script>` / `<link>` to `index.html` in correct dependency order
- [ ] Add new state variables to `core/js/state.js` with defaults
- [ ] Add routing case to `render()` in `utils/js/navigation.js`
- [ ] Implement real-time subscription with cleanup
- [ ] Mobile-first CSS — both breakpoints required
- [ ] Write tests in `tests/` · Run `npm run check:all && npm test`

## Bug Squashing: "X is not a function"
1. Find the defining file: `grep -rn "function X\|const X" portals/ utils/ core/`
2. **Read that file** — look for duplicate `const`, unclosed brackets, missing commas (SyntaxError = whole file fails silently)
3. Check `index.html` — defining file must load before its caller
4. Fix the syntax error; the function will reappear once the file parses cleanly

## Commands
```bash
npm install          # First time only — installs jest + eslint devDeps
npm test             # Run all tests (611 tests, 43 suites, ~4 s)
npm run check:all    # All quality checks — run before every commit
```

---

## Changelog Rules

**At the start of every session or instruction:** Read `CHANGELOG.md` to understand what has recently changed and why. This gives you context before touching any code.

**After every change you implement:** Add a 2-line entry at the top of `CHANGELOG.md` (below the `---` line) using this exact format:

```
## YYYY-MM-DD | Short title of the change | Reason / what problem it solves

```

- Use today's date.
- The title should be short (under 80 characters).
- The reason should explain *why*, not just *what*.
- One entry per logical change — not one per file edited.
- Add the entry before committing so it is included in the same commit.
