# Change Checklist — Before Committing

Use this checklist based on what type of change you made.

---

## 🔧 Generic Changes (Any PR)

Always run before committing:

- [ ] `npm run check:all` — All skills pass
- [ ] `npm test` — All tests pass
- [ ] Code reviewed for obvious errors
- [ ] No console warnings in browser
- [ ] Tested on mobile (375px) and desktop (1920px)

---

## ➕ Added New JavaScript File

- [ ] `npm run check:load-order` — Load order correct
- [ ] `npm run check:syntax` — No syntax errors
- [ ] File location makes sense (portals/ or utils/)
- [ ] Name follows convention: `<feature>.js` or `<feature>-<module>.js`
- [ ] Dependencies are commented at top of file
- [ ] Exported via `window.<functionName>` if needed
- [ ] Script tag added to `index.html` in correct position

---

## 🎨 Added/Modified CSS

- [ ] `npm run check:mobile` — Breakpoints present
- [ ] Mobile layout (single column, 12px gaps)
- [ ] Tablet layout (two columns, 16px gaps)
- [ ] Desktop layout (full width, 20px gaps)
- [ ] No fixed widths (use flex/grid)
- [ ] Tested at 375px, 768px, 1920px
- [ ] Viewport gutter maintained (10px mobile, 14px tablet+)
- [ ] CSS classes follow convention: `.kebab-case`
- [ ] Colors from CSS variables (`--var`)

---

## 🎯 Added New Modal

- [ ] `npm run check:modals` — Cleanup patterns correct
- [ ] HTML template in `index.html`
- [ ] Data variables initialized (checked before use)
- [ ] Modal data cleared on close handler
- [ ] `closeModal()` called in all close paths
- [ ] `showModal()` properly passes data
- [ ] Modal is keyboard-accessible (Enter/Esc close)
- [ ] Mobile-responsive (max-width: 90vw, desktop: 400-600px)

---

## 🔌 Added Real-Time Subscription

- [ ] `npm run check:subscriptions` — Cleanup found
- [ ] Subscription stored in variable: `const subRef = createRealtimeSubscription(...)`
- [ ] Cleanup call: `removeRealtimeSubscription(subRef)` on navigate
- [ ] OR portal added to auto-cleanup list in `navigation.js`
- [ ] Tested concurrent edits (two users same record)
- [ ] Tested unsubscribe/resubscribe (navigate away, back)
- [ ] No memory leaks (check browser task manager over time)

---

## 📊 Added New Supabase Table

- [ ] `npm run check:rls` — RLS policy template provided
- [ ] Table has `user_id` column (UUID, not null)
- [ ] Table has `created_at`, `updated_at` timestamps
- [ ] RLS is ENABLED on table
- [ ] Policy allows authenticated SELECT
- [ ] Policy allows authenticated INSERT (with `user_id` check)
- [ ] Policy allows authenticated UPDATE
- [ ] Policy allows authenticated DELETE (if applicable)
- [ ] Data layer written (`<table>-data.js`)
- [ ] Tested permissions (query works for authenticated user)

---

## 🗂️ Added New Global State Variable

- [ ] `npm run check:state` — Variable tracked correctly
- [ ] Variable defined in `core/js/state.js` with default value
- [ ] Variable name is camelCase and descriptive
- [ ] Comment explaining what variable does
- [ ] Used consistently (same name everywhere)
- [ ] Not duplicated in other files
- [ ] If important: added to CLAUDE.md state table
- [ ] No local state duplication (centralized in state.js)

---

## ✍️ Modified Logic (Any Module)

- [ ] `npm run check:syntax` — No syntax errors
- [ ] `npm run check:load-order` — Load order unchanged
- [ ] `npm test` — Tests still pass
- [ ] Debounce timing respected (800ms or 900ms)
- [ ] No new global variables (use state.js)
- [ ] No hardcoded values (constants in state.js or npi-constants.js)
- [ ] Error handling for Supabase failures
- [ ] Optimistic UI if applicable (immediate update, then sync)

---

## 🎯 Fixed a Bug

- [ ] Root cause identified (not just symptom treated)
- [ ] Same bug pattern checked elsewhere in code
- [ ] Related tests updated or added
- [ ] No new syntax errors introduced
- [ ] No new memory leaks (subscriptions, event listeners)
- [ ] Tested on both mobile and desktop
- [ ] Browser console clear of warnings

---

## 🧪 Added Test

- [ ] Test file in `tests/` directory
- [ ] Following patterns from `TESTING_STRATEGY.md`
- [ ] Mocks: Supabase, DOM, globals, subscriptions
- [ ] Happy path tested (normal flow)
- [ ] Error cases tested (Supabase failure, etc.)
- [ ] All new code has test coverage
- [ ] `npm test` passes
- [ ] `npm run check:coverage` shows improvement

---

## 📚 Updated Documentation

- [ ] Changes recorded in commit message
- [ ] CLAUDE.md updated if architecture changed
- [ ] TESTING_STRATEGY.md updated if test patterns changed
- [ ] Script load order in CLAUDE.md matches index.html
- [ ] README.md updated if new portal/major feature
- [ ] SKILLS_GUIDE.md referenced if using new skill

---

## 📤 Before Pushing

Final checks:

```bash
# Run all automated checks
npm run check:all

# Run tests
npm test

# Visual check
# 1. Refresh browser
# 2. Test on mobile (DevTools: 375px)
# 3. Test on desktop (1920px)
# 4. Check browser console (no errors)
# 5. Test on real device if possible

# Git prep
git status                    # Review changes
git diff --cached             # Review staged changes
git log --oneline -5          # Check recent commits

# Commit
git add <files>
git commit -m "Clear commit message"
git push origin <branch>
```

---

## 🚨 Red Flags (Don't Commit)

- ❌ `npm run check:all` shows errors
- ❌ `npm test` fails
- ❌ Browser console has errors
- ❌ Mobile layout broken (375px test)
- ❌ Syntax errors (duplicate const, unclosed brackets)
- ❌ Script dependency errors (wrong load order)
- ❌ Memory leaks in subscriptions
- ❌ Modal state pollution (stale data)
- ❌ Test coverage decreased
- ❌ Uncommitted changes not tracked

---

## 💡 Pro Tips

1. **Use `npm run check:all` while developing** — Don't wait until the end
2. **Read error messages carefully** — They tell you exactly what's wrong
3. **Test on real mobile device** — Browser DevTools isn't always accurate
4. **Check git diff before commit** — Spot check that changes are intentional
5. **Use meaningful commit messages** — Future you will thank you

---

## 🔗 Related Documents

- **SKILLS_GUIDE.md** — Detailed explanation of each skill
- **SKILLS_QUICK_REFERENCE.txt** — Quick lookup card
- **CLAUDE.md** — Project conventions and architecture
- **TESTING_STRATEGY.md** — Jest testing patterns
- **README.md** — Project overview

---

**Remember:** A few minutes of checking now saves hours of debugging later! ✨
