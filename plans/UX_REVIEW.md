# Tidyco APQP — Full UX Review

**Date:** March 2026  
**Scope:** Site-wide user experience review from a first-time and regular user perspective  
**Covers:** Navigation structure, hub/tile design, portal flow, information density, mobile experience, consistency

---

## Executive Summary

The application is broadly well-structured for a collaborative operations portal. The light colour theme, IBM Plex typography, and card-based navigation are clean and professional. However, there are five concrete areas where the user experience currently creates friction:

1. **Hub tiles are too tall** — the 320 px minimum height is roughly twice what the content needs, leaving large empty white areas that feel unpolished on a desktop screen.
2. **Operations Dashboard placement is ambiguous** — it lives both as a featured banner *and* as a peer portal, which confuses the hierarchy.
3. **Navigation patterns are inconsistent** — each portal behaves slightly differently (tile hub → tabs vs. immediately showing tabs vs. going straight into content).
4. **"Coming soon" placeholder tiles** create visual noise and no value for the user.
5. **Back-navigation is done three different ways** across the app (topbar back button, inline "← Back to Portal" button, and sometimes none at all).

The sections below cover each area in detail, with before/after comparisons and specific code-level recommendations.

---

## 1. Hub Page — Tile Size & Information Density

### Current State

```
Hub tiles:  min-height: 320px | padding: 40px | icon: 64px | 3-column grid
Banner tile: min-height: 120px | full-width
```

Each tile contains three elements: a large emoji icon (64 px), a bold title in uppercase, and a one-line description. The 320 px height means roughly **240 px of that space is empty white background** on a typical 1080p display. This is what's happening:

```
┌─────────────────────────────────────────┐
│                                         │  ← ~100px white space above
│              📊  (64px)                 │
│                                         │
│           CAPACITY                      │
│    Load Capacity Planning               │
│                                         │  ← ~100px white space below
└─────────────────────────────────────────┘
```

### Verdict: Too much output (height) for too little information

The oversized tiles tell the user nothing useful. A tile that is 320 px tall but contains the same information as a 140 px tile trains users to ignore the empty space. Worse, on a 768 px viewport (a common laptop height minus browser chrome), a single row of three tiles almost fills the entire screen — the user has to scroll to see a back button or any surrounding context.

### Recommendation

Reduce hub card height to **160–180 px** on desktop, **120 px on mobile**. Optionally, surface one meaningful live stat per card (e.g., "3 active tasks" for Capacity, "2 open projects" for NPI) to make the tiles *informative* rather than just decorative.

**Specific CSS change in `portals/hub/css/hub.css`:**

```css
/* BEFORE */
.hub-card {
    min-height: 320px;
    padding: 40px !important;
}

/* AFTER — half the height, still comfortable */
.hub-card {
    min-height: 160px;
    padding: 28px 32px !important;
}
```

And icon size:

```css
/* BEFORE */
.hub-icon { font-size: 64px; margin-bottom: 16px; }

/* AFTER */
.hub-icon { font-size: 40px; margin-bottom: 10px; }
```

This gives a tighter, more purposeful layout. The same change should be applied to `portals/capacity/css/capacity.css` (`.capacity-card`) and the equivalent cards in the production portal.

---

## 2. Operations Dashboard — Hierarchy Confusion

### Current State

The hub page contains:
- An **Operations Dashboard banner** (`hub-card-banner`) at the top — visually highlighted, full-width, takes the user to `operations`
- Three **operational portal tiles** below it: Capacity, Product Development, Production

The banner's copy reads *"Director-level overview of all operations"*, implying it sits above the three tiles. But to the user's eye it looks like a fourth portal option with a different visual treatment, not a master dashboard that summarises the others.

### Problem

A new user will ask: "Is Operations Dashboard *the* top page? Or is the Hub top page? Why are there two ways to see 'everything'?"

The confusion is compounded by the Operations Dashboard itself having a tab called **"Overview"** that shows quick links back to *Capacity, Production, NPI, and Bug Reports* — the same four things already on the Hub. From the user's perspective this is circular: Hub → Operations → Overview → Hub.

### Recommendation — Two options

**Option A (Preferred): Make the hub the Operations Dashboard**  
Merge the hub page and the operations overview. The hub *is* the director-level view. Show the live metric cards (ME utilisation, active batches, overdue actions, open bugs) directly on the hub alongside the portal navigation tiles. Remove the standalone Operations dashboard banner. The detailed tabs (Flow, Risk, People, Actions, Forecast) remain accessible via a link, but they don't need a separate top-level entry.

**Option B (Simpler change): Rename and reorder**  
Move the Operations Dashboard out of the banner position and into the portal grid alongside Capacity, Product Development, and Production. Rename the hub title to something like *"Mission Control"* or *"Home"* to clearly distinguish it. The banner treatment (gradient background, large icon) should be reserved for the user's most recent or most critical action, not a fixed portal.

---

## 3. Navigation Structure — Inconsistency Across Portals

### Current State (three different patterns)

| Portal | Root view | What happens on entry |
|---|---|---|
| Hub | Tile grid | Shows tiles, click → navigate away |
| Capacity | Tile grid (hub clone) | Shows tiles, click → sub-portal with tabs/charts |
| Product Development | Tile grid | Shows tiles, click → sub-portal with more tiles or lists |
| Production | **No tile hub** | Goes straight to a tab bar (Schedule / Plan by Product / Plan by Work Area) |
| Operations Dashboard | Tab bar | Goes straight to tabbed dashboard (no tile landing) |
| Bug Reports | Form + list | Goes straight to content |

Production skips the hub pattern entirely, while Capacity and Product Development use it. This means a user who has learned to expect a "pick a sub-area" landing screen will be surprised when entering Production.

### Back navigation — three different approaches

1. **Topbar back button** (`← Back`) — present when a project is open, navigates to project list
2. **Inline "← Back to Portal" button** in the header area — used in Capacity, Product Development root pages
3. **No explicit back button** — Production portal uses `prodNavBar()` for tabs but has no "back to Hub" control visible when you're inside a sub-tab

A user coming from the Hub to the Production Schedule tab has no obvious route back to the Hub without using the browser back button or clicking the brand logo.

### Recommendation

Standardise navigation with two rules:

**Rule 1 — Every portal root shows a tile/card hub.**  
Apply the same tile pattern to Production. The current three tabs (Schedule, Plan by Product, Plan by Work Area) become three tiles. Users click a tile to enter the tabbed view, and the tab bar is then shown within that view. This keeps the drill-down pattern consistent.

**Rule 2 — Every sub-level shows a consistent breadcrumb.**  
Replace the mix of topbar back buttons and inline back buttons with a single breadcrumb bar below the topbar:  
`Home > Capacity > Manufacturing Engineering`  
Each segment is a clickable link. This is standard web UX and removes the inconsistency immediately. The topbar back button can remain for within-project navigation (NPI gate → project dashboard).

---

## 4. "Coming Soon" Placeholder Tiles

### Current State

Both the Capacity portal and the Product Development portal contain tiles that are visually greyed out and labelled "Coming soon":

- **Capacity**: Logistics Capacity (greyed, `cursor: not-allowed`)
- **Product Development**: Parts Database (greyed, `cursor: not-allowed`)

### Problem

For a user, a disabled tile in a navigable menu conveys:
- *"This exists somewhere but I can't access it"* — frustrating
- *"The product feels unfinished"* — reduces confidence
- *"Maybe I'm missing permissions?"* — causes confusion

There is no established deadline or feature commitment behind these tiles, so they persist indefinitely as noise.

### Recommendation

**Remove "Coming soon" tiles entirely from the production UI.** When a feature is ready, add the tile. The grid will reflow cleanly because it uses `grid-template-columns: repeat(3, 1fr)`. If there is a genuine roadmap communication need, this is better addressed in a changelog or admin panel, not in the navigation grid.

**Specific change** — remove from `portals/capacity/js/capacity.js`:
```html
<!-- Remove this entire block -->
<div class="proj-card capacity-card" aria-disabled="true" title="Coming soon" ...>
  ...Logistics Capacity...
</div>
```

And from `portals/product-development/js/product-development.js`:
```html
<!-- Remove this entire block -->
<div class="proj-card hub-card" aria-disabled="true" title="Coming soon" ...>
  ...Parts Database...
</div>
```

---

## 5. Tile Style — Overall Assessment

### What is working well

- **Light surfaces + cool blue accent** — professional, not overwhelming. The colour system (`--blue`, `--teal`, `--ink`) is coherent.
- **Hover animation** (`translateY(-4px)` + shadow) — gives clear affordance that tiles are clickable. Well-executed.
- **The Operations banner gradient** — visually distinctive, communicates priority. The concept is good; only the position/hierarchy is wrong (see point 2 above).
- **Emoji icons** — quick to recognise at a glance, no icon font dependency needed. Appropriate for an internal tool.
- **Responsive grid** — the 3 → 2 → 1 column breakpoints at 1199 px and 767 px are correct and well-implemented.

### What could be improved

| Issue | Current | Suggested |
|---|---|---|
| Tile height | 320 px min-height | 160 px (desktop), 120 px (mobile) |
| Icon size | 64 px | 36–40 px |
| Padding | 40 px all sides | 20–24 px top/bottom, 28 px left/right |
| Font size on tile name | 18 px uppercase | 15–16 px, remove all-caps |
| Information value | Icon + name + 1 line | Icon + name + 1 line + optional live stat |

The all-caps (`letter-spacing: 1px; font-weight: 700`) treatment on tile names is fine for 3–4 tiles at the hub level, but when the same style is inherited by sub-portal tiles (Capacity, Product Development) it starts to look like every click is an important decision. Lowercase or title-case with less aggressive tracking would feel less heavy.

---

## 6. Bug Report Button — Placement

### Current State

The bug report button sits in `topbar-center`, centred in the topbar on every page. It reads `🐛 Report a Bug`.

### Problem

Centred topbar real estate is high-value (eye naturally tracks to centre). Using it for a support/feedback function means it competes visually with the most important navigation elements (back button, project selector). On mobile where the topbar is already crowded, this button can push the project selector off-screen or cause wrapping.

### Recommendation

Move the bug report button to `topbar-actions` (right side), where the logout button lives. This groups secondary/utility actions on the right, keeps primary navigation context (brand + back button + project selector) on the left/centre, and removes the visual competition.

---

## 7. Information Architecture — Overall Map

Below is the current site structure as a user experiences it, with friction points marked:

```
LOGIN
 └── HUB
      ├── [banner] OPERATIONS DASHBOARD ← ⚠️ ambiguous hierarchy
      │    ├── Overview (links back to portals below)
      │    ├── Flow
      │    ├── Risk
      │    ├── People
      │    ├── Actions
      │    └── Forecast
      │
      ├── CAPACITY ← tile hub
      │    ├── Production Capacity (tabbed)
      │    ├── Manufacturing Engineering (tabbed + charts)
      │    ├── Project Management (tabbed)
      │    └── [greyed] Logistics ← ⚠️ "coming soon" noise
      │
      ├── PRODUCT DEVELOPMENT ← tile hub
      │    ├── NPI Projects (list → APQP tabs per project)
      │    ├── Product Management (list with inline editing)
      │    ├── Product Family Database (table)
      │    └── [greyed] Parts Database ← ⚠️ "coming soon" noise
      │
      └── PRODUCTION ← ⚠️ no tile hub, jumps straight to tab bar
           ├── Schedule
           ├── Plan by Product
           └── Plan by Work Area

TOPBAR (persistent)
  ├── Brand / back button / breadcrumb
  ├── [centre] 🐛 Report a Bug ← ⚠️ unexpected placement
  └── [right] Logout
```

### Recommended structure (minimal changes)

```
LOGIN
 └── HUB  (shows 4 equal tiles + live summary stats at top)
      ├── CAPACITY
      ├── PRODUCT DEVELOPMENT
      ├── PRODUCTION ← add tile hub root
      └── OPERATIONS DASHBOARD (rename to "Analytics" or "Reports")
           └── (move out of banner; make a peer tile)

TOPBAR
  ├── Brand | back/breadcrumb | project selector
  └── [right] Bug Report | Logout
```

---

## 8. Mobile Experience

The responsive breakpoints (480 px, 768 px, 1199 px) are defined and applied correctly throughout. The critical issues on mobile are:

| Area | Issue | Impact |
|---|---|---|
| Hub tiles at 200 px | 3 tiles stacked = 600 px of scrolling just to see options | Medium |
| Operations banner at 110 px | Takes up most of small screen before portal tiles | Low |
| Topbar centre button | May wrap on narrow screens | Medium |
| Capacity/hub tile names in all-caps | Harder to read on small text sizes | Low |

**Priority fix**: Reduce tile height on mobile to 100 px minimum and use a compact horizontal layout (icon left, text right) for the tile content on mobile instead of the centred column layout. This matches common mobile app patterns (e.g., iOS Settings, Android app drawers).

---

## 9. Accessibility Notes

- **Focus states**: The `.hub-card:hover` style uses `transform` + `box-shadow` — there is no equivalent `:focus-visible` state. Keyboard users can tab to tiles but get no visual indicator.
- **Click handlers on `div` elements**: Hub tiles use `onclick="navigate(...)"` on `<div>` elements. These are not keyboard-reachable by default. Consider changing them to `<button>` or adding `role="button" tabindex="0"` with keydown handlers. (Production portal has already moved to `data-action` delegation which is a better pattern.)
- **Colour contrast**: The `--muted` colour used for tile descriptions (`#6f8397` on `#ffffff` background) gives a contrast ratio of approximately 3.8:1 — below the WCAG AA minimum of 4.5:1 for normal text.

---

## 10. Summary Scorecard

| Area | Rating | Key Finding |
|---|---|---|
| Colour theme | ✅ Good | Clean, professional, consistent |
| Typography | ✅ Good | IBM Plex Sans/Mono is readable and distinctive |
| Card/tile hover behaviour | ✅ Good | Clear affordance, smooth animation |
| Responsive layout | ✅ Good | Correct breakpoints, proper stacking |
| Tile height | ⚠️ Needs work | Too tall — 320 px for minimal content |
| Navigation consistency | ⚠️ Needs work | Three different patterns across portals |
| Operations Dashboard hierarchy | ⚠️ Needs work | Confusingly positioned as both overview and peer portal |
| Coming-soon tiles | ❌ Remove | Adds noise, reduces confidence |
| Bug report button placement | ⚠️ Needs work | Centre topbar is wrong location for utility action |
| Keyboard / accessibility | ⚠️ Needs work | Focus states and `div` click targets |

---

## Prioritised Action List

| Priority | Change | Effort | File(s) |
|---|---|---|---|
| 🔴 High | Reduce hub card height from 320 px → 160 px | Small | `hub.css`, `capacity.css` |
| 🔴 High | Remove "coming soon" tiles | Small | `capacity.js`, `product-development.js` |
| 🟡 Medium | Add tile hub root to Production portal | Medium | `production.js`, `production.css` |
| 🟡 Medium | Move Bug Report button to right side of topbar | Small | `index.html` / `main.css` |
| 🟡 Medium | Clarify Operations Dashboard hierarchy | Medium | `hub.js`, `operations-dashboard-main.js` |
| 🟢 Low | Add `:focus-visible` states to interactive tiles | Small | `hub.css`, `capacity.css` |
| 🟢 Low | Replace `<div onclick>` with `<button>` on nav tiles | Medium | `hub.js`, `capacity.js`, `product-development.js` |
| 🟢 Low | Check `--muted` colour contrast ratio | Small | `main.css` |

---

*This review was produced by automated inspection of source files and navigation logic. No browser session was available; screenshots are not included. Findings are based on CSS measurements, JS render functions, and established UX principles.*
