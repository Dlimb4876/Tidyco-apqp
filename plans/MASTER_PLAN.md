# MASTER PLAN — Tidyco APQP Operations Portal

**Last updated:** 2026-03-14  
**Status tracking:** Use `- [x]` / `- [ ]` checkboxes throughout

---

## How to Use This Document

This is the single source of truth for all planned and in-progress work on the Tidyco APQP portal. All previous planning documents have been consolidated here.

**For agents implementing tasks:**
1. Read the checklist items top-to-bottom within a phase — items are sequenced to reduce risk
2. Each item lists the exact files to open, the steps to follow, and a "done when" test
3. Mark items `[x]` as you complete them and commit the change with `report_progress`
4. Run `npm test` after every change that touches JavaScript files
5. Never modify files outside the scope of the item you are working on

**Priority guide:**
- 🔴 **Critical** — security or breakage risk
- 🟠 **High** — immediate user impact
- 🟡 **Medium** — meaningful improvement
- 🟢 **Low** — nice to have

**Effort guide:**
- 🕐 **Small** — under 2 hours
- 🕐🕐 **Medium** — 2–8 hours
- 🕐🕐🕐 **Large** — 8+ hours

---

## ✅ Completed Work Archive

The following work is complete and has been merged into the codebase. Items are recorded here for historical traceability.

### Infrastructure & Architecture
- [x] NPI portal full refactor (Stages 1–3: namespacing, data layer, component library, event delegation, async/await) — all 56 checklist items complete
- [x] Operations Dashboard split from 1 file (1,238 lines) into 7 focused modules (`operations-dashboard-state.js`, `-metrics.js`, `-realtime.js`, `-render-core.js`, `-forecast-view.js`, `-forecast-actions.js`, `-main.js`)
- [x] ME Capacity CSS split from 1 file into 8 focused files (`me-capacity-shell.css` through `me-capacity-responsive.css`)
- [x] Dead code removal: deleted `portals/productmgmt/`, deprecated `apqp.css` stub, and dev artefacts (`temp.txt`, `sizes_output.txt`, `get_sizes.ps1`)
- [x] `productmgmt` removed from `BACK_BUTTON_LABELS` in `navigation.js` and from `CLAUDE.md` state table

### Security
- [x] **Security P0** — Critical XSS sink fixed: `opsMetricCard` in `operations-dashboard.js` no longer writes `onclick="${row.action}"` into HTML; now uses `data-action="metric-navigate"` delegation
- [x] **Security P1 (products.js)** — `portals/product-development/product-management/js/products.js` migrated from inline `onclick` to delegated `data-action` handling; regression tests added in `tests/product-management.test.js`

### UX
- [x] Hub tile height reduced from 320 px to 160 px (desktop), 120 px (mobile)
- [x] Hub icon reduced from 64 px to 40 px
- [x] "Coming soon" disabled tiles removed from Capacity portal and Product Development portal
- [x] Operations Dashboard moved from banner position to peer tile in hub grid (equal weight, no banner)
- [x] Production portal given a tile hub root (3 tiles: Schedule, Plan by Product, Plan by Work Area)

### Quality of Life
- [x] Toast notification system (`showToast()` in `utils/js/helpers.js`, `.toast-container` in `index.html`)
- [x] Sync badge (`#syncBadge` in topbar-actions, `setSyncBadge()` in `core/js/db.js`)
- [x] Keyboard shortcuts modal (`#shortcutsModal` in `index.html`) with `?` and `Ctrl+/` hotkeys
- [x] `isInputFocused()` helper in `utils/js/helpers.js` to guard keyboard shortcuts
- [x] Feedback & Bugs portal (real-time bug reports + user feedback expansion)

### NPI Tendering (Partially Done)
- [x] `npi-gates-editor.js` created and loaded — gate scope selection logic with `gate_selections`, `gate_selection_locked`, `gate_selection_locked_at`, `gate_selection_locked_by`
- [ ] Full tendering flow (Phases 0–7 per `NPI_TENDERING_FEATURE_PLAN.md`) — see Phase 3 below

---

## Phase 1: Security Hardening — Event Delegation Migration 🔴

**Goal:** Eliminate all remaining inline `onclick`/`onchange` HTML attribute handlers from portal JavaScript. These create XSS risk and testing difficulty. The Production portal is the gold standard — all portals should match it.

**Rule for every migrated module:** Rendered HTML must contain zero `onclick=` or `onchange=` strings. Add a Jest test that asserts this. Follow the `data-action` pattern used in `portals/production/`.

---

### 1.1 Migrate `portals/product-development/js/product-development.js`

**Priority:** 🔴 Critical | **Effort:** 🕐🕐 Medium | **Inline handlers:** ~24  
**Files:** `portals/product-development/js/product-development.js`, `tests/product-development.test.js`

**Steps:**
1. Open `portals/product-development/js/product-development.js` and read the full file.
2. Identify all `onclick="..."` and `onchange="..."` attributes in HTML template strings.
3. Replace each with `data-action="<slug>"` plus any data attributes needed (e.g., `data-id`, `data-tab`, `data-family`). Use kebab-case slugs (e.g., `nav-npi`, `nav-families`, `open-family-modal`).
4. Add (or update) a single delegated listener at the bottom of the file, following this pattern:
   ```javascript
   function setupProductDevelopmentDelegation() {
     const container = document.getElementById('product-development-container');
     if (!container || container._pdDelegated) return;
     container._pdDelegated = true;
     container.addEventListener('click', (e) => {
       const el = e.target.closest('[data-action]');
       if (!el || !container.contains(el)) return;
       const { action, id, tab, family } = el.dataset;
       if (action === 'nav-npi') navigate('product-development', { pdt: 'npi' });
       else if (action === 'nav-families') navigate('product-development', { pdt: 'families' });
       // ... add cases for each action slug
     });
   }
   ```
5. Call `setupProductDevelopmentDelegation()` after every render in `renderProductDevelopment()`.
6. Open (or create) `tests/product-development.test.js`. Add a test:
   ```javascript
   test('rendered HTML has no inline onclick/onchange handlers', () => {
     const html = renderProductDevelopment(); // or the sub-render function
     expect(html).not.toMatch(/\bonclick=/);
     expect(html).not.toMatch(/\bonchange=/);
   });
   ```
7. Run `npm test` and confirm tests pass.

**Done when:**
- `grep -n "onclick=" portals/product-development/js/product-development.js` returns zero results
- All existing tests pass
- Navigation between sub-portals still works in the browser

---

### 1.2 Migrate `portals/product-development/npi/js/dashboard.js`

**Priority:** 🔴 Critical | **Effort:** 🕐🕐 Medium | **Inline handlers:** ~33  
**Files:** `portals/product-development/npi/js/dashboard.js`, `tests/npi-dashboard.test.js`

**Steps:**
1. Open `portals/product-development/npi/js/dashboard.js`.
2. Catalogue every `onclick` and `onchange` attribute — list the action, the function called, and the parameters passed.
3. For each unique action, define a `data-action` slug (e.g., `open-project`, `new-project`, `delete-project`, `edit-project`, `set-filter`).
4. Replace inline handlers with `data-action` + data attributes in all HTML template strings.
5. Add a delegated event listener in `setupNPIDashboardDelegation()` called after render.
6. For actions that pass dynamic parameters (e.g., project ID), pass them via `data-id`, `data-name`, `data-family` attributes on the element.
7. Write/update tests in `tests/npi-dashboard.test.js` asserting no inline handlers and that `data-action` buttons trigger correct functions.
8. Run `npm test`.

**Done when:**
- Zero `onclick=` in `dashboard.js`
- NPI project list renders, clicking a project opens the correct APQP view
- Tests pass

---

### 1.3 Migrate `portals/operations/js/operations-dashboard-render-core.js` (remaining handlers)

**Priority:** 🟠 High | **Effort:** 🕐 Small | **Inline handlers:** ~5 remaining  
**Files:** `portals/operations/js/operations-dashboard-render-core.js`, `portals/operations/js/operations-dashboard-main.js`

**Steps:**
1. Run `grep -n "onclick=" portals/operations/js/*.js` to get a current count.
2. For each remaining `onclick=` found, replace with `data-action` attribute.
3. Add handling in the existing delegated listener in `operations-dashboard-main.js`.
4. Run `npm test`.

**Done when:**
- `grep "onclick=" portals/operations/js/*.js` returns zero results
- Operations tabs (Overview, Flow, Risk, People, Actions, Forecast) all render correctly

---

### 1.4 Migrate NPI Core Files (Phase P2)

**Priority:** 🟠 High | **Effort:** 🕐🕐🕐 Large | **Files:** 5  
**Sequence:** `gates.js` → `timing.js` → `bom.js` → `npi-pfd.js` → `pfmea.js` (simplest first)

For each file, follow these steps:

#### 1.4a `portals/product-development/npi/js/gates.js`
1. Read the file. Identify all `onclick=` attributes (approximately 5).
2. Replace each with `data-action` + data attributes.
3. Add delegated listener `setupGatesDelegation()` called after render.
4. Run `npm test`.

#### 1.4b `portals/product-development/npi/js/timing.js`
1. Read the file. Identify all `onclick=` attributes (approximately 9).
2. Replace with `data-action` pattern. Key actions: `timing-add-row`, `timing-delete-row`, `timing-toggle-month`.
3. Add delegated listener called after render.
4. Run `npm test`.

#### 1.4c `portals/product-development/npi/js/bom.js`
1. Read the file. Identify all `onclick=` and `onchange=` attributes (approximately 13).
2. Replace with `data-action` pattern. Key actions: `bom-add`, `bom-update`, `bom-delete`, `bom-set-tab`.
3. Add delegated listener.
4. Run `npm test`.

#### 1.4d `portals/product-development/npi/js/npi-pfd.js`
1. Read the file. Identify all handlers (approximately 12).
2. Replace with `data-action` pattern.
3. Add delegated listener.
4. Run `npm test`.

#### 1.4e `portals/product-development/npi/js/pfmea.js`
1. Read the file. Identify all handlers (approximately 16).
2. Replace with `data-action` pattern. Key actions: `pfmea-add-mode`, `pfmea-add-cause`, `pfmea-update-rpn`, `pfmea-delete`.
3. Add delegated listener.
4. Run `npm test`.

**Done when:**
- `grep "onclick=" portals/product-development/npi/js/*.js` returns zero results
- Full NPI workflow: create project → fill PFMEA → implement action → sign gate — all working
- Tests pass

---

### 1.5 Migrate Capacity Portal Files (Phase P3)

**Priority:** 🟡 Medium | **Effort:** 🕐🕐🕐 Large | **Files:** ~9 files  
**Rule:** Apply equivalent changes to both ME Capacity and PM Capacity (Capacity Parity Rule).

**Sequence (simplest first):**
1. `portals/capacity/js/capacity.js` (~4 handlers) — hub navigation tiles
2. `portals/capacity/js/me-chart.js` (~3 handlers)
3. `portals/capacity/js/me-holidays.js` (~3 handlers)
4. `portals/capacity/js/me-components.js` (~2 remaining dynamic sinks)
5. `portals/capacity/js/me-tasks.js` (~2 handlers)
6. `portals/capacity/js/prod-capacity-dashboard.js` (~3 handlers)
7. `portals/capacity/js/prod-capacity-settings.js` (~5 handlers)
8. `portals/capacity/js/prod-capacity-workarea.js` (~4 handlers)
9. `portals/capacity/js/me-capacity.js` (~8 handlers) + `portals/capacity/project-management/js/pm-capacity.js` (mirror)

For each file:
1. Read the file.
2. Replace `onclick=`/`onchange=` with `data-action` + data attributes.
3. Add or update delegated listener.
4. Mirror equivalent changes in the PM Capacity counterpart if applicable.
5. Run `npm test`.

**Done when:**
- `grep -r "onclick=" portals/capacity/` returns zero results
- ME and PM capacity tabs navigate and save correctly
- Tests pass

---

### 1.6 Add SRI Hashes to CDN Scripts (Phase P4)

**Priority:** 🟡 Medium | **Effort:** 🕐 Small  
**Files:** `index.html`

**Steps:**
1. Open `index.html` and find the `<script>` tags for Supabase and Chart.js CDN.
2. For each CDN URL, generate the SRI hash:
   ```bash
   # Example — run for each CDN file:
   curl -s https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js | openssl dgst -sha384 -binary | openssl base64 -A
   ```
3. Add `integrity="sha384-<hash>"` and `crossorigin="anonymous"` to each `<script>` tag.
4. Verify in browser that scripts still load without console errors.

**Done when:**
- Both CDN `<script>` tags have `integrity` and `crossorigin="anonymous"` attributes
- No console errors on page load

---

### 1.7 Apply Database Integrity Constraints (Phase P4)

**Priority:** 🟡 Medium | **Effort:** 🕐 Small (DB only — no code changes)  
**Where:** Supabase SQL Editor

**Steps:**
1. Open the Supabase project SQL Editor.
2. Run each constraint (test on a staging copy first if available):
   ```sql
   -- Prevent duplicate holiday entries per person per day
   ALTER TABLE me_holidays ADD CONSTRAINT me_holidays_person_date_unique
     UNIQUE (person_id, date);

   -- Prevent duplicate product assignments in capacity
   ALTER TABLE me_products ADD CONSTRAINT me_products_product_db_unique
     UNIQUE (product_database_id);

   -- Validate team member fields
   ALTER TABLE me_teams ADD CONSTRAINT me_teams_hours_range
     CHECK (hours_per_week > 0 AND hours_per_week <= 80);
   ALTER TABLE me_teams ADD CONSTRAINT me_teams_utilisation_range
     CHECK (utilisation >= 0 AND utilisation <= 100);

   -- Validate task date order
   ALTER TABLE me_tasks ADD CONSTRAINT me_tasks_date_order
     CHECK (end_date >= start_date);
   ```
3. Verify existing data passes the constraints before adding them (run a SELECT first to check for violations).
4. If violations exist, clean up data before adding the constraint.

**Done when:**
- All 5 constraints are applied in Supabase without errors
- Existing capacity data still loads correctly in the app

---

## Phase 2: UX & Navigation Improvements 🟠

**Goal:** Resolve the remaining navigation and UX friction points identified in the UX review.

---

### 2.1 Move Feedback Button to Right Side of Topbar

**Priority:** 🟠 High | **Effort:** 🕐 Small  
**Files:** `index.html`, `core/css/main.css`

**Current state:** The `💬 Feedback & Bugs` button is in `.topbar-center` which takes up prime visual real estate.  
**Target state:** Move it to `.topbar-actions` (right side, before the sync badge).

**Steps:**
1. Open `index.html`.
2. Find the `<div class="topbar-center">` block (around line 82–84). It contains:
   ```html
   <button class="bug-report-btn" onclick="navigate('feedback')">💬 Feedback & Bugs</button>
   ```
3. Cut this button and paste it at the start of `<div class="topbar-actions">`, just before the sync badge `<span>`.
4. Remove `<div class="topbar-center">` if it is now empty. If `.topbar-center` CSS is used for other layout purposes, verify removing it does not break the topbar layout.
5. Open `core/css/main.css` and find `.bug-report-btn` styles. Adjust the styling if needed so the button fits naturally in the right-side actions bar (match the `tbtn tbtn-ghost` style used for keyboard shortcut and logout buttons).
6. Visually test at 375 px (mobile) and 1920 px (desktop) — topbar should not wrap or overflow.

**Done when:**
- The button appears on the right side of the topbar, next to the sync badge
- The topbar does not wrap or overflow on mobile at 375 px
- Clicking the button still navigates to the feedback portal

---

### 2.2 Standardise Back Navigation Across Portals

**Priority:** 🟡 Medium | **Effort:** 🕐🕐 Medium  
**Files:** `index.html`, `utils/js/navigation.js`, `core/css/main.css`

**Current state:** Three different back-navigation patterns exist (topbar back button, inline "← Back to Portal" button in portal headers, no back button in some sub-tabs).

**Steps:**
1. Open `utils/js/navigation.js` and find the `render()` function.
2. After each `render()` dispatch, call a new function `updateBackButton()`:
   ```javascript
   function updateBackButton() {
     const btn = document.getElementById('returnHubBtn');
     if (!btn) return;
     // Show the back button in all non-hub sections
     if (!currentSection || currentSection === 'hub') {
       btn.style.display = 'none';
       return;
     }
     btn.style.display = 'inline-flex';
     const labels = {
       'capacity': 'Hub',
       'production': 'Hub',
       'product-development': 'Hub',
       'operations': 'Hub',
       'feedback': 'Hub',
       'bugreports': 'Hub'
     };
     btn.textContent = '← Back to ' + (labels[currentSection] || 'Hub');
   }
   ```
3. Call `updateBackButton()` at the end of `render()`.
4. Remove the inline "← Back to Portal" buttons from portal header templates (in `capacity.js`, `product-development.js`, `production.js`) since the topbar back button now handles this consistently.
5. Test navigating into and out of each portal — the back button should appear and work at each level.

**Done when:**
- The topbar "← Back" button is visible in all non-hub portals
- No duplicate back buttons appear inside portal content areas
- Button correctly returns to hub from all portals

---

### 2.3 Add `:focus-visible` States to Interactive Tiles

**Priority:** 🟢 Low | **Effort:** 🕐 Small  
**Files:** `portals/hub/css/hub.css`, `portals/capacity/css/capacity.css`, `core/css/components.css`

**Steps:**
1. Open each CSS file.
2. Find `.hub-card:hover` / `.capacity-card:hover` rules.
3. Add equivalent `:focus-visible` states alongside each `:hover` rule:
   ```css
   .hub-card:hover,
   .hub-card:focus-visible {
     transform: translateY(-4px);
     box-shadow: 0 8px 24px rgba(0,0,0,0.12);
     outline: 2px solid var(--blue);
     outline-offset: 2px;
   }
   ```
4. Verify by tabbing through the hub tiles in a browser — each tile should show a blue outline when focused.

**Done when:**
- Keyboard users can tab to and see focus outlines on all navigation tiles
- No visual regression for mouse users

---

### 2.4 Check `--muted` Colour Contrast Ratio

**Priority:** 🟢 Low | **Effort:** 🕐 Small  
**Files:** `core/css/main.css`

**Steps:**
1. Open `core/css/main.css` and find `--muted` colour value.
2. Use a contrast checker (e.g., https://webaim.org/resources/contrastchecker/) to test `--muted` on `--white` background.
3. If contrast ratio is below 4.5:1 (WCAG AA for normal text), darken the `--muted` value until it passes. A value around `#5a7080` typically passes on white.
4. Scan for any text using `--muted` that is below 18px and not bold — these require the 4.5:1 ratio.

**Done when:**
- `--muted` colour achieves ≥ 4.5:1 contrast ratio on `#ffffff` background
- No visual regression in portal descriptions and metadata text

---

## Phase 3: Feature Development 🟠

### 3.1 Account Creation & Password Reset

**Priority:** 🟠 High | **Effort:** 🕐🕐 Medium  
**Files:** `core/js/auth-signup.js` (new), `index.html`, `core/css/main.css`

**Prerequisite:** Supabase project must have email auth enabled (Authentication → Providers → Email). Verify `Site URL` and redirect URLs are configured.

**Steps:**

#### Step 1 — Create `core/js/auth-signup.js`
Create a new file at `core/js/auth-signup.js` with the following functions:
```javascript
// ═══════════════════════════════════
// auth-signup.js — Account creation & password reset
// Depends on: auth.js (supa, esc)
// ═══════════════════════════════════

const TIDYCO_DOMAIN = 'tidyco.co.uk';

function isValidTidycoEmail(email) {
  return email && email.trim().toLowerCase().endsWith('@' + TIDYCO_DOMAIN);
}

function isValidPassword(password) {
  return password && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

window.showSignUp = function() { /* render sign-up form inside .login-box */ };
window.doSignUp = async function() { /* validate + supa.auth.signUp() */ };
window.showForgotPassword = function() { /* render forgot-password form */ };
window.doResetPassword = async function() { /* validate + supa.auth.resetPasswordForEmail() */ };
window.doUpdatePassword = async function() { /* validate + supa.auth.updateUser() */ };
```

Full function bodies for `doSignUp`, `doResetPassword`, and `doUpdatePassword` are documented in `plans/ACCOUNT_CREATION_PASSWORD_RESET_PLAN.md`.

#### Step 2 — Add sign-up/forgot-password links to login screen in `index.html`
Locate the login form (search for `id="loginPassword"`) and add below the password input:
```html
<div class="login-links">
  <a href="#" onclick="showForgotPassword();return false;">Forgot password?</a>
  <a href="#" onclick="showSignUp();return false;">Create account</a>
</div>
```

#### Step 3 — Add CSS for `.login-links` in `core/css/main.css`
```css
.login-links {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 13px;
}
.login-links a { color: var(--blue); text-decoration: none; }
.login-links a:hover { text-decoration: underline; }
```

#### Step 4 — Load `auth-signup.js` in `index.html`
In `index.html`, add `<script src="core/js/auth-signup.js"></script>` immediately after `core/js/auth.js`.

#### Step 5 — Handle password recovery redirect
In `core/js/auth.js`, find the session check on page load. Add:
```javascript
if (window.location.hash === '#recover') {
  handlePasswordRecovery(); // defined in auth-signup.js
}
```

#### Step 6 — Supabase Dashboard Configuration
1. Go to Supabase → Authentication → Email Templates.
2. Set the "Confirm signup" template subject to: `Confirm your Tidyco account`
3. Set the "Reset password" template subject to: `Reset your Tidyco password`
4. Set Site URL and add the app URL to the allowed redirect URLs list.

**Done when:**
- "Forgot password?" link shows a reset form
- "Create account" link shows a sign-up form
- Non-`@tidyco.co.uk` emails are rejected with a clear error
- Weak passwords are rejected with a clear error
- On successful sign-up, user sees a confirmation message (not logged in automatically)
- On successful password reset request, user sees a confirmation message

---

### 3.2 NPI Tender Gate Scope Feature (Complete Remaining Phases)

**Priority:** 🟠 High | **Effort:** 🕐🕐🕐 Large  
**Spec:** Full detailed specification in `plans/NPI_TENDERING_FEATURE_PLAN.md`  
**What is done:** `npi-gates-editor.js` exists with `gate_selections`, locking and unlocking logic

**What remains (from the spec):**

#### Phase 0 — Product Tender Status Trigger
1. Open `portals/product-development/product-management/js/products-data.js`.
2. Find the product status update handler.
3. When a product's status changes to `'Tender'`, check if a linked NPI programme exists.
4. If no linked programme exists, show a modal offering to create one (use existing `modalNewProj`).
5. Store the link (`product_id` on the programme record).
6. Test: Change a product's status to Tender and verify the modal is triggered.

#### Phase 1 — Gate Scope Editor UI in NPI
1. Open `portals/product-development/npi/js/npi-gates-editor.js` — verify current state of the UI.
2. Ensure the gate scope editor is accessible from the Gates tab for a project in Tender status.
3. The editor should show all 6 gates with their checklist items as checkboxes.
4. Each item can be ticked/unticked. Ticked items are included in `gate_selections`.
5. "Lock Scope" button saves and locks the selection (`gate_selection_locked = true`).
6. Locked scope shows a read-only view with a visible lock indicator and the locker's name + timestamp.
7. Admin can unlock with a confirmation dialog.

#### Phase 2 — Gate Pages Render Filtered Questions
1. Open `portals/product-development/npi/js/gates.js`.
2. Find `renderGatePage()`. Currently it renders all items from `GATE_DEFS[gateNum].items`.
3. If `prog().gate_selections` is set, filter to only the selected indices:
   ```javascript
   const selections = prog().gate_selections;
   const items = selections && selections[gateNum]
     ? GATE_DEFS[gateNum].items.filter((_, idx) => selections[gateNum].includes(idx))
     : GATE_DEFS[gateNum].items;
   ```
4. Backward-compatible: projects without `gate_selections` still show all items.
5. Test with a project that has selections and one that does not.

#### Phase 3 — Gate Selection Data Persistence
1. Ensure `gate_selections` is saved with the programme data via `save()` in `core/js/db.js`.
2. Verify it round-trips: set selections → reload app → selections are preserved.
3. If using Supabase directly: confirm `programmes` table columns `gate_selections` (JSONB), `gate_selection_locked` (boolean), `gate_selection_locked_at` (timestamp), `gate_selection_locked_by` (text) exist. If not, run the SQL in `plans/NPI_TENDERING_FEATURE_PLAN.md` — "Database Changes" section.

**Done when:**
- Changing a product to Tender status triggers NPI project creation offer
- Gate scope editor shows all checklist items and lets user deselect
- Locking saves selection and prevents further editing
- Gate pages only show the selected checklist items
- Existing projects without selections show all items (backward compatible)
- All NPI tests pass

---

## Phase 4: Quality of Life Improvements 🟡

Ordered by user impact. Each item is self-contained.

---

### 4.1 Auto-Focus First Input in Modals

**Priority:** 🟡 Medium | **Effort:** 🕐 Small  
**Files:** `utils/js/helpers.js`

**Steps:**
1. Open `utils/js/helpers.js` and find the `showModal(id)` function.
2. After the line that makes the modal visible (`modal.style.display = 'block'` or similar), add:
   ```javascript
   const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
   if (firstInput) setTimeout(() => firstInput.focus(), 50);
   ```
3. Test: Open the "New Project" modal and verify the first input has focus immediately.

**Done when:**
- Opening any modal automatically focuses the first input field
- Tab order within modals is correct

---

### 4.2 Enhanced Empty States with Action Buttons

**Priority:** 🟡 Medium | **Effort:** 🕐 Small  
**Files:** 5 portal render files (see steps)

**Steps:**
1. Run `grep -rn "No .* added\|No .* found\|No .* yet\|no-data\|empty-state" portals/ --include="*.js"` to find all empty state strings.
2. For each empty state, replace plain text with an actionable version:
   ```javascript
   // Before:
   '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--muted)">No tasks added</td></tr>'
   
   // After:
   `<tr><td colspan="5" style="text-align:center;padding:40px">
     <div style="color:var(--muted);margin-bottom:12px">No tasks added yet</div>
     <button class="btn btn-primary" data-action="add-new-task">＋ Add First Task</button>
   </td></tr>`
   ```
3. Target files:
   - `portals/product-development/npi/js/dashboard.js` — Projects list empty state
   - `portals/capacity/js/me-tasks.js` — Tasks empty state
   - `portals/capacity/js/me-team.js` — Team members empty state
   - `portals/production/js/scheduling.js` — Batches empty state
   - `portals/product-development/product-management/js/products.js` — Products empty state
4. Ensure the `data-action` used in the button is handled by the portal's delegated listener.

**Done when:**
- Each empty list shows a "＋ Add First ..." button
- Clicking the button opens the correct add form or modal

---

### 4.3 Persist Search and Filter State

**Priority:** 🟡 Medium | **Effort:** 🕐 Small  
**Files:** `portals/product-development/product-management/js/products.js`, `portals/capacity/js/me-tasks.js`, `portals/product-development/npi/js/dashboard.js`

**Steps:**
1. For each file, add a filter state key constant at the top:
   ```javascript
   const PRODUCTS_FILTER_KEY = 'tidyco_products_filter';
   ```
2. Add load/save helpers:
   ```javascript
   function loadFilterState(key, defaults) {
     try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
     catch { return defaults; }
   }
   function saveFilterState(key, state) {
     try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
   }
   ```
3. Modify the render function to read the saved state before rendering filter controls.
4. Update filter `onchange` / `input` handlers to save state after each change.
5. Test: Apply a filter, navigate away, return — filter is restored.

**Done when:**
- Search terms and filter selections survive page navigation and browser refresh
- Clearing filters updates the saved state

---

### 4.4 Add Descriptive Tooltips to Icon-Only Buttons

**Priority:** 🟢 Low | **Effort:** 🕐 Small  
**Files:** All portal JS files with icon-only buttons

**Steps:**
1. Run `grep -rn '<button[^>]*>[✕✓🗑️✏️📊🔒🔓]' portals/ --include="*.js"` to find icon-only buttons.
2. For each button missing a `title` attribute, add one:
   - Delete (✕, 🗑️): `title="Delete"`
   - Edit (✏️): `title="Edit"`
   - Save (✓): `title="Save"`
   - Lock (🔒): `title="Lock"`
   - Unlock (🔓): `title="Unlock"`
   - Chart (📊): `title="View chart"`
3. Prioritise: `me-tasks.js`, `me-team.js`, `scheduling.js`, `dashboard.js`.

**Done when:**
- All icon-only buttons in the 4 priority files have descriptive `title` attributes
- Hovering over buttons shows tooltips in the browser

---

### 4.5 Global Keyboard Shortcuts — Context-Aware Actions

**Priority:** 🟡 Medium | **Effort:** 🕐🕐 Medium  
**Files:** `utils/js/helpers.js`, `utils/js/navigation.js`

**Current state:** `?` and `Ctrl+/` open the shortcuts modal. No other global shortcuts are active.

**Steps:**
1. Open `utils/js/helpers.js`. Add to the existing `keydown` listener (or alongside it):
   ```javascript
   document.addEventListener('keydown', function(e) {
     if (isInputFocused()) return;
     // Ctrl+F — focus search in current view
     if (e.ctrlKey && e.key === 'f') {
       e.preventDefault();
       const search = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
       if (search) search.focus();
     }
     // Escape — close open modal
     if (e.key === 'Escape') {
       const openModal = document.querySelector('.modal-bg[style*="display: block"], .modal-bg[style*="display:block"]');
       if (openModal) closeModal(openModal.id);
     }
   });
   ```
2. Update the `#shortcutsModal` in `index.html` to reflect any newly active shortcuts.
3. Test each shortcut in different portals.

**Done when:**
- `Ctrl+F` focuses the search field in portals that have one
- `Escape` closes open modals
- The shortcuts modal lists accurate, working shortcuts

---

### 4.6 Undo After Delete

**Priority:** 🟡 Medium | **Effort:** 🕐🕐 Medium  
**Files:** `utils/js/helpers.js`, key portal delete functions

**Steps:**
1. Open `utils/js/helpers.js`. Add an undo manager after the `showToast` function:
   ```javascript
   const UndoManager = {
     pending: {},
     add(id, item, restoreFn, deleteFn) {
       const t = setTimeout(() => { deleteFn(); delete this.pending[id]; }, 5000);
       this.pending[id] = { item, restoreFn, timerId: t };
       showToast(`Deleted. <button class="toast-undo" data-undo-id="${id}">Undo</button>`, 'info', 5500);
     },
     undo(id) {
       const p = this.pending[id];
       if (!p) return;
       clearTimeout(p.timerId);
       p.restoreFn();
       delete this.pending[id];
       showToast('Restored', 'success');
     }
   };
   document.addEventListener('click', e => {
     const btn = e.target.closest('.toast-undo');
     if (btn) UndoManager.undo(btn.dataset.undoId);
   });
   ```
2. Modify delete functions in the top 3 used portals to use `UndoManager.add()` instead of immediately deleting:
   - Products: wrap `productsDataDeleteProduct(id)` 
   - Tasks: wrap `meTasksDataDelete(id)`
   - Batches: wrap production batch delete
3. For each, do an optimistic UI update immediately (remove from local array and re-render), then queue the actual DB delete in `UndoManager.add`.
4. Test: Delete an item, click Undo, verify it is restored. Wait 5 seconds without undoing, verify it is permanently deleted.

**Done when:**
- Deleting shows a toast with "Undo" link
- Clicking Undo restores the item
- After 5 seconds, the delete is committed to the database

---

### 4.7 Advanced Filter Panel

**Priority:** 🟢 Low | **Effort:** 🕐🕐 Medium  
**Files:** `portals/product-development/npi/js/dashboard.js`, `portals/capacity/js/me-tasks.js`

**Steps:**
1. Add an "⚙️ Advanced Filters" toggle button to the filter bar in each portal.
2. Clicking it reveals a panel with multi-select dropdowns for Family, Status, and a date-range picker.
3. All advanced filters combine with AND logic.
4. A "Clear All" button resets all filters.
5. Persist the advanced filter state to `localStorage` using the same helper as item 4.3.

**CSS to add to `core/css/components.css`:**
```css
.advanced-filters { background: #f9fafb; border: 1px solid var(--line); border-radius: 4px; padding: 16px; margin: 8px 0; }
.filter-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.filter-row label { min-width: 90px; font-weight: 600; font-size: 13px; }
```

**Done when:**
- Advanced filter panel appears below the main filter bar
- Multiple simultaneous filters narrow results correctly
- Clearing resets all filters

---

### 4.8 Breadcrumb Navigation

**Priority:** 🟢 Low | **Effort:** 🕐 Small  
**Files:** `index.html`, `utils/js/navigation.js`, `core/css/main.css`

**Steps:**
1. Add a `<div class="breadcrumb" id="breadcrumb"></div>` to the topbar in `index.html` (inside `.topbar-left`, after the back button).
2. Add CSS:
   ```css
   .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-left: 12px; }
   .breadcrumb a { color: var(--blue); text-decoration: none; }
   .breadcrumb a:hover { text-decoration: underline; }
   .breadcrumb-sep { color: var(--line); }
   ```
3. In `utils/js/navigation.js`, add `updateBreadcrumb()` at the end of `render()`:
   ```javascript
   function updateBreadcrumb() {
     const el = document.getElementById('breadcrumb');
     if (!el) return;
     const sectionLabels = { 'hub': 'Hub', 'capacity': 'Capacity', 'production': 'Production', 'product-development': 'Product Development', 'operations': 'Operations', 'feedback': 'Feedback' };
     const crumbs = [{ label: 'Hub', hash: '#s=hub' }];
     if (currentSection && currentSection !== 'hub') crumbs.push({ label: sectionLabels[currentSection] || currentSection });
     el.innerHTML = crumbs.map((c, i) =>
       i < crumbs.length - 1 ? `<a href="${c.hash}">${c.label}</a><span class="breadcrumb-sep">›</span>` : `<span>${c.label}</span>`
     ).join('');
   }
   ```
4. Test: Navigate to Capacity → ME — breadcrumb shows `Hub › Capacity`.

**Done when:**
- Breadcrumb updates on every navigation
- Clicking a breadcrumb segment navigates correctly

---

## Phase 5: Accessibility & Polish 🟢

---

### 5.1 Replace `<div onclick>` Navigation Tiles with `<button>` Elements

**Priority:** 🟢 Low | **Effort:** 🕐🕐 Medium  
**Files:** `portals/hub/js/hub.js`, `portals/capacity/js/capacity.js`, `portals/product-development/js/product-development.js`

**Steps:**
1. In each file, find `<div class="proj-card hub-card" onclick="...">` patterns.
2. Replace `<div>` with `<button>` (or keep `<div>` but add `role="button" tabindex="0"`).
3. If using `<button>`, ensure CSS styles apply correctly (buttons have browser-default styles that need resetting).
4. Add `role="button"` and `tabindex="0"` for any remaining `<div>` click targets.
5. Add keydown handler so `Enter` and `Space` trigger the action (if using `<div>`).
6. Test keyboard navigation — tab to each tile, press Enter, verify it navigates.

**Done when:**
- All navigation tiles are reachable via keyboard Tab key
- Enter/Space activates tiles
- No visual regression

---

### 5.2 Context Menus (Right-Click on Table Rows)

**Priority:** 🟢 Low | **Effort:** 🕐🕐 Medium  
**Files:** `utils/js/helpers.js`, `core/css/components.css`

**Steps:**
1. Create a `ContextMenu` module in `utils/js/helpers.js` (see QoL_Plan.md § 2.3 for full code).
2. Add `contextmenu` event listener on `document` that shows the context menu when right-clicking a `<tr data-id="...">` row.
3. Build context-aware action lists based on `currentSection`.
4. Dismiss on any click outside.
5. Add CSS for `.context-menu` and `.context-menu-item`.
6. Test: Right-click on a product row, task row, batch row.

**Done when:**
- Right-clicking a table row shows a context menu with Edit and Delete options
- Menu dismisses on outside click or Escape
- Menu stays within viewport bounds

---

### 5.3 Density Toggle (Compact / Normal / Comfortable)

**Priority:** 🟢 Low | **Effort:** 🕐🕐 Medium  
**Files:** `core/css/main.css`, `index.html`

**Steps:**
1. Add CSS custom properties to `:root` for each density level (see QoL_Plan.md § 2.8).
2. Add a density `<select>` to `.topbar-actions` in `index.html`.
3. Add `setDensity(value)` and `loadDensity()` in `utils/js/helpers.js` or `core/js/app.js`.
4. Call `loadDensity()` on app init.
5. Update key table/card CSS to use density variables.

**Done when:**
- Three density modes change row height, font size, and spacing
- Preference persists after page refresh

---

### 5.4 Skeleton Loaders for Data-Heavy Views

**Priority:** 🟢 Low | **Effort:** 🕐 Small  
**Files:** All portal render functions that show "Loading..."

**Steps:**
1. Run `grep -rn "Loading\.\.\." portals/ --include="*.js"` to find all loading strings.
2. Replace each with:
   ```javascript
   `<div class="skeleton-loader">
     <div class="skeleton-line" style="width:80%"></div>
     <div class="skeleton-line" style="width:60%"></div>
     <div class="skeleton-line" style="width:90%"></div>
   </div>`
   ```
3. Add to `core/css/components.css`:
   ```css
   .skeleton-loader { padding: 20px; }
   .skeleton-line { height: 16px; background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin: 8px 0; }
   @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
   ```

**Done when:**
- Skeleton loaders appear in place of "Loading..." text
- Loaders are replaced by real content once data is ready

---

## Support Documentation Index

These documents are maintained as reference material. **Do not delete them.**

| Document | Purpose |
|---|---|
| `plans/NPI_TENDERING_FEATURE_PLAN.md` | Full 7-phase implementation spec for the NPI tender gate scope feature |
| `plans/GATE_DEFINITIONS_GUIDE.md` | Technical reference for GATE_DEFS structure, all 6 gates, checklist items, and gate selection indexing |
| `plans/NPI_PROJECT_FLOW_GUIDE.md` | NPI project lifecycle, gate workflow, and integration patterns for AI developers |
| `plans/PRODUCT_MANAGEMENT_GUIDE.md` | Product Management portal: data model, CRUD workflow, RLS, real-time sync |
| `plans/PRODUCT_FLOW_DIAGRAM.md` | Visual diagram of product lifecycle (before tendering feature) |
| `plans/ME_DATABASE_ANALYSIS.md` | ME Capacity relational DB schema, field mappings, PERT estimation, known issues |
| `plans/FAMILY_TEMPLATES_ARCHITECTURE.md` | Family PFMEA template system: DB schema, data flow, security |
| `plans/FAMILY_TEMPLATES_GUIDE.md` | User guide for creating and applying family PFMEA templates |
| `plans/FEEDBACK_SETUP.md` | Setup guide for the Feedback & Bugs portal (DB table creation, RLS policies) |
| `TESTING_STRATEGY.md` | Jest testing framework, patterns, and coverage goals |
| `CLAUDE.md` | Project conventions, architecture, script load order, state management |
| `README.md` | Project overview, portal structure, navigation API, responsive design |

---

## Implementation Notes for Agents

### Before starting any item
1. Run `npm test` to establish a clean baseline — note any pre-existing failures (do not fix unrelated failures).
2. Read the specific files named in the item before making any edits.
3. Check `index.html` script load order if adding a new JS file.

### After completing any item
1. Run `npm test` — all tests must pass (or match pre-existing failures only).
2. Manually verify the changed UI in a browser at 375 px (mobile) and 1920 px (desktop).
3. Mark the checklist item `[x]` in this document.
4. Commit using `report_progress`.

### Capacity Parity Rule
Any change to ME Capacity must be mirrored in PM Capacity unless explicitly noted otherwise. Both portals are paired features.

### RLS Rule
Do not filter Supabase queries by `user_id` in application code. RLS enforces authentication only — all authenticated users see all data by design.

### Security Rule
New interactive HTML elements must use `data-action` + delegated listeners. Inline `onclick=` handlers must not be introduced in new code.
