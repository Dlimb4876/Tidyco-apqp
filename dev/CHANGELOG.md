# Changelog

All notable changes to Tidyco APQP are recorded here. Most recent changes appear first.
Format: `YYYY-MM-DD | <what changed> | <why it was changed>`

---

## 2026-03-19 | Fix Action Centre table layout and mobile responsiveness | The Action Centre table had fixed column widths that didn't accommodate mixed data types from three sources (NPI actions, PFMEA, risks); changed to flexible column sizing with proper min/max widths, improved mobile breakpoints for smaller screens, and better handling of missing data (risks have no due dates).

## 2026-03-19 | Add Action Centre portal and owner dropdowns | People with actions assigned to them in multiple NPI projects had no single place to track what they needed to do; the new Action Centre aggregates all NPI actions, PFMEA actions, and risks assigned to the logged-in user across every project. Owner fields in the Action Tracker, Risk Register, and PFMEA are now dropdowns populated from user accounts instead of free-text, so names are consistent and the Action Centre can find them reliably.

## 2026-03-19 | Show sub-assembly count badge on NPI Kanban cards | Made it immediately clear on each Kanban card how many sub-assemblies a project has, so users can see at a glance without opening the project.

## 2026-03-19 | Fix settings button: remove duplicate let declarations in settings.js | settings.js re-declared 5 variables (settingsTeamsEditingId, settingsTeamsPermissionsEditingId, settingsTeamsData, settingsTeamsLoading, settingsTeamsError) that were already declared in state.js; the duplicate let caused a SyntaxError in the browser, making renderSettings undefined so the settings button did nothing.

## 2026-03-19 | Fix Settings Teams tab: create missing teams-data.js | The Teams management feature in settings.js called teamsDataLoadAll() and related functions that were never defined, causing a ReferenceError when the Teams tab was clicked; created teams-data.js with full Supabase data layer and added it to index.html.

## 2026-03-19 | Add Teams management to Settings page | Organizations need to group users by department (ME, PM, OPS, Admin, ReadOnly) and manage permissions at the group level instead of individually. New Teams tab allows creating teams, assigning users, and configuring 8 role-based permissions per team. Includes 40 tests covering CRUD operations and permissions editor UI.

## 2026-03-18 | Add Appearance and About tabs to Settings menu | Settings only had configuration tabs; added Appearance (localStorage-backed org name, app subtitle, table density, toast duration) and About (app description, keyboard shortcuts reference, support link) to improve usability and discoverability.

## 2026-03-18 | Fix admin role not recognised after page refresh | app.js session-restore path set currentUser but never fetched currentUserRole from profiles, so isAdmin() always returned false; admins saw "Your current role is editor" message.

## 2026-03-18 | Fix role dropdown closes immediately + move Role Definitions to its own tab | Clicking a native <select> fired a click event that the delegated handler could intercept; added a form-control guard so SELECT/INPUT/TEXTAREA clicks are never processed by the click handler. Role Definitions matrix moved from Permissions tab to its own dedicated Settings tab so each section is focused.

## 2026-03-18 | Fix role editor UI: selector no longer closes instantly + add Role Definitions matrix | Role dropdown fired change via click event so re-render destroyed it before the user could pick; also added a Role Definitions table so admins can see what each role (admin/editor/viewer) is allowed to do.

## 2026-03-18 | Add role-based permissions system (admin / editor / viewer) | Every logged-in user previously had full edit access; this change activates the existing profiles.role column so viewers see data read-only and only admins can manage user roles in Settings → Permissions.

## 2026-03-18 | Fix load-order-checker false-positive duplicate on products.js | Checker used basename only so two different products.js files (production vs product-management portals) were flagged as duplicates, causing check:all to fail.

## 2026-03-18 | Add 328 new tests across 14 modules, raising suite from 179 to 507 | Coverage was ~36%; key areas (realtime, settings, families, production data, db helpers, ME team/tasks/components) had no tests. All 39 test suites now pass.

## 2026-03-18 | Fix date swap bug in batch scheduling: stop raw DD/MM/YYYY reaching DB | Generic change listener was sending raw display dates (e.g. 08/11/2027) directly to Supabase; PostgreSQL parsed them as MM/DD/YYYY, swapping month and day (November 8 became August 11). Also fixed smartDateFormat to clear dates properly when field is emptied.

## 2026-03-18 | Permissions name from email prefix + fix settings nav highlight | Name column now shows "Daniel Limb" from daniel.limb@tidyco.co.uk when full_name is unset; active nav item was invisible (white text on transparent) because var(--brand) was never defined — replaced with var(--blue).

## 2026-03-18 | Fix settings page crash: remove undefined SETTINGS_CATEGORIES reference | renderSettings() threw ReferenceError on SETTINGS_CATEGORIES which was never defined; the dead sidebarItems code was removed since the template already hardcodes the sidebar buttons.

## 2026-03-18 | Redesign settings page: left sidebar + right content, add Permissions category | Old horizontal-tab layout was hard to scan; sidebar layout matches standard settings UI conventions and makes room for future categories. Permissions tab shows all user accounts ready for role-based access control.

## 2026-03-18 | Fix 3 production capacity bugs: filters, headcount save, Fill Forward/Clear All | Filters failed because window.prodCapDetailFilter is undefined (let ≠ window prop); headcount reverted on refresh because inserts didn't retrieve the DB id so subsequent updates silently failed; Clear All only deleted the current user's records leaving shared data intact.

## 2026-03-18 | Make Feedback & Bugs table title column 3x wider | Title was too narrow to read long bug/feedback titles without truncation.

## 2026-03-18 | Added CHANGELOG.md and AI helper changelog rules | Gives all AI assistants shared context across sessions and creates an audit trail of every change made to the project.

---

<!-- HOW TO ADD AN ENTRY:
1. Add it directly below the --- line above
2. Use this exact format (2 lines):
   ## YYYY-MM-DD | Short title of the change | Reason / what problem it solves
   (blank line)
3. Most recent entry always goes at the top, just below the dashes
-->
