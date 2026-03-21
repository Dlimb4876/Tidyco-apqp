# Dark Mode Implementation Review & Fix Plan

**Date:** 2026-03-21  
**Scope:** Comprehensive review of the recent Dark Mode implementation to resolve contrast and legibility issues (specifically "light backgrounds with white text").

---

## 1. Executive Summary

The recent introduction of Dark Mode has exposed several UI components—particularly tables, data grids, and specialized cards—that are rendering with white text on light backgrounds. This creates a severe accessibility and usability issue.

This document outlines a phased approach to systematically audit, identify, and correct these contrast failures by standardizing our usage of CSS custom properties (variables) and eliminating hardcoded color values.

## 2. Root Cause Analysis

Based on initial findings, the "white text on light background" issue is typically caused by one of three antipatterns:

1. **Hardcoded CSS Backgrounds:** A component has `color: var(--text)` (which correctly turns white in dark mode), but the background is hardcoded to `#ffffff` or `#f9fafb` instead of using `var(--surface)` or `var(--bg)`.
2. **JavaScript Inline Styles:** JavaScript render functions injecting `style="background: white;"` or `style="background: #f9fafb;"` directly into table rows or cells.
3. **Missing Theme Overrides:** Custom components that define their own CSS variables but lack a `:root[data-theme="dark"]` block to override those specific variables when dark mode is active.

*(Note: As established in our OpenWolf Cerebrum learnings, we must never rely on hardcoded hex values for borders/backgrounds in shared components. All elements rendering against `--surface` or `--bg` must use CSS variables).*

## 3. Action Plan

### Phase 1: CSS Audit & Variable Standardization (Global)
**Goal:** Eliminate hardcoded light-theme hex colors in CSS files.
1. Run a global grep search for hardcoded colors in `core/css/` and `portals/**/css/`:
   - `grep -rn "background.*#fff" **/*.css`
   - `grep -rn "background.*#f9" **/*.css`
   - `grep -rn "background.*white" **/*.css`
2. Replace identified instances with appropriate theme variables:
   - Base app backgrounds: `var(--bg)`
   - Card/Table backgrounds: `var(--surface)`
   - Borders: `var(--line)` or `var(--border)`
   - Text: `var(--text-main)` or `var(--text-muted)`

### Phase 2: Table & Data Grid Specific Fixes
**Goal:** Fix the components most affected by the contrast bug.
1. **Table Headers (`<th>`):** Ensure backgrounds use `var(--surface-alt)` or equivalent, rather than a hardcoded grey.
2. **Zebra Striping:** Update `tr:nth-child(even)` styles to use a theme-aware variable or a translucent overlay (e.g., `rgba(128,128,128,0.05)`) rather than a hardcoded `#f9fafb`.
3. **Hover States:** Ensure `tr:hover` uses a theme-aware highlight color that works in both light and dark contexts.
4. **Empty States:** Check the "No data added" empty state rows to ensure their backgrounds match the table body.

### Phase 3: JavaScript Inline Styles Audit
**Goal:** Catch instances where JS render functions apply hardcoded styles.
1. Search through JS files for inline background colors:
   - `grep -rn "style=.*background.*#fff" portals/**/*.js`
   - `grep -rn "style=.*background.*white" portals/**/*.js`
   - `grep -rn "style=.*background.*#f9" portals/**/*.js`
2. **Fix:** Move these inline styles to CSS classes, or update them to use `style="background: var(--surface)"`.

### Phase 4: Shared Components (Tags, Flags, Alerts)
**Goal:** Ensure status indicators remain legible.
1. Review alert/tag backgrounds. As noted in the cerebrum, `--blue-dark (#3f8ded)` is not legible on dark blue backgrounds. Use `--blue (#5aa5ff)` instead for dark mode text.
2. Ensure any background colors applied to status tags use an opacity modifier (e.g., `color-mix(in srgb, var(--accent) 20%, transparent)`) rather than a hardcoded light pastel color.
3. Fix any density swatches or modal borders that remain static during theme shifts.

---

## 4. QA & Verification

After implementing the fixes, perform the following checks:

1. Enable Dark Mode via Settings -> Appearance.
2. **Portals to Check:**
   - **Production Schedule / Products:** Check all data tables and inline-edit cells.
   - **NPI / APQP:** Check PFMEA, CTQ, and BOM tables.
   - **ME Capacity:** Check team and task tables.
   - **Operations Dashboard:** Verify the forecast inline edits and metric cards.
3. **Contrast Checker:** Use an accessibility tool (or visual inspection) to ensure text against its background meets the WCAG AA standard (4.5:1 for normal text).

## 5. Automation & Prevention

Once fixed, consider setting up a linting rule (e.g., using Stylelint) to forbid hardcoded hex colors (`#ffffff`, `#000000`) for `background`, `background-color`, and `color` properties in CSS files, enforcing the use of CSS custom properties instead.