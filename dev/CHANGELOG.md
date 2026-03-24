# Changelog

All notable changes to Tidyco APQP are recorded here. Most recent changes appear first.
Format: `YYYY-MM-DD | <what changed> | <why it was changed>`

## 2026-03-24 | Keep wiki internal links in same tab and resolve relative .md paths | Internal markdown links were opening new tabs and 404ing; renderer now converts relative wiki links to hash routes in the current window

## 2026-03-24 | Fix wiki metadata loading for /wiki and /dev/wiki URLs | Made wiki bootstrap fetches use a stable pathname-derived base and added a /dev/wiki compatibility redirect so areas.json loads reliably on GitHub Pages

## 2026-03-24 | Remove secret wiki logo handler | The click interceptor used e.stopPropagation() which broke the logo's navigate('hub') behaviour; removed the whole block so clicking the logo returns to the portal as expected

## 2026-03-24 | Add .nojekyll to fix wiki bootstrap on GitHub Pages | Jekyll skips folders starting with _ so _meta/ was never deployed, causing fetch 404s on bootstrap

## 2026-03-24 | Restructure wiki into Function and Process learning lenses | Added separate wiki navigation and content paths for conceptual learning (Function: what/why) and execution learning (Process: how-to in site), with cross-links between both models and PFMEA split into method vs tool workflow

## 2026-03-23 | Split PFMEA wiki into method page and tool-workflow page | Clarified documentation intent by keeping PFMEA risk-method guidance in one page and adding a dedicated PFMEA site-usage workflow page for click-path and field-entry usage

## 2026-03-23 | Refine PFMEA wiki tone and expand practical guidance | Removed explicit training-objective framing and expanded PFMEA content with deeper scoring guidance, prioritization flow, common mistakes, and clearer action-quality expectations

## 2026-03-23 | Rewrite PFMEA wiki page into training-manual format | Converted PFMEA guide into a practical learning page with step-by-step instructions, worked example, scoring rules, and quality checks for user training

## 2026-03-23 | Rewrite standalone wiki pages for human-facing guidance | Reworked wiki content to explain purpose, day-to-day use, key calculation logic, and cross-system links in plain language instead of template-style technical phrasing

## 2026-03-23 | Fix wiki search results appearing in wrong location | Results panel was inside the sidebar so users couldn't see it when typing — moved to dropdown under the search input and auto-close on result click

## 2026-03-23 | Rename wiki header to Operations Portal Wiki and remove subtitle | Updated wiki branding text to the requested title and removed the subtext line for a cleaner topbar

## 2026-03-23 | Wiki hidden behind logo easter egg | Wiki not ready for launch — replaced visible button with 5-click secret on the Tidyco logo

## 2026-03-23 | Align standalone wiki styling with main portal and add top-left logo | Updated wiki topbar, controls, content surfaces, and typography to follow the main site visual language and added the Tidyco logo in the wiki header for consistent branding

## 2026-03-23 | Add hidden wiki button to portal topbar | Users can now access the standalone wiki documentation through a subtle, low-opacity button (📖) in the topbar that opens in a new tab; button becomes fully visible on hover

## 2026-03-23 | Harden live-search focus and caret continuity across capacity, NPI PFMEA, and feedback | Product Load, PFMEA text search, and feedback browse search now preserve focus/caret after re-renders via shared helper reuse, with targeted regression tests added to prevent typing interruptions

## 2026-03-23 | Add second-wave standalone wiki APQP topics | Added CTQ, Control Plan, Action Tracker, Risk Register, BOM, Timing Plan, and APQP Gates pages, updated Product Development topic navigation, rebuilt search index, and revalidated wiki checks

## 2026-03-23 | Add first 10 high-priority standalone wiki topics | Populated core guide pages for Capacity, Product Development, and MCS, expanded `areas.json` navigation, and regenerated search index to support practical review before portal integration

## 2026-03-23 | Scaffold standalone guide wiki preview (no portal link yet) | Created `wiki/index.html` with area-based starter content, local search, and wiki audit scripts so the guide can be reviewed directly by URL before any in-app navigation changes

## 2026-03-23 | Reframe guide plan to standalone wiki with area-based small files | Revised `plans/guide-system-implementation-plan.md` to move guidance outside SPA routing, define a dedicated `wiki/index.html` entry point, and enforce token/file-size guardrails for easier audits and updates

## 2026-03-23 | Guide modal content corrections | Audit found outdated and inaccurate content; added capacity-logistics and capacity-unit6 guide keys; fixed PFD section header and flowchart descriptions; corrected hub module count from four to five; added Manufacturing Change to hub guide

## 2026-03-23 | Keep Product Support search focused while typing | Product search input in Capacity Product Support was re-rendering and dropping focus after each character, so input handling now restores focus/caret and includes a regression test to prevent typing interruptions

## 2026-03-23 | Correct Logistics Product Support split to separate kitting and booking in/out columns | User clarification required separate `Kitting` and `Booking In/Out` inputs (not a combined field), so Product Support UI/history, save flow, relational mapping, and calculations now sum three components (`Kitting` + `Booking In/Out` + `Product Movement`) into Hours/Batch

## 2026-03-23 | Show Logistics split values in Product Support history | Logistics support history now exposes Kitting, Booking In/Out, and Product Movement values alongside the summed Hours/Batch total so past changes can be audited without reconstructing the split manually

## 2026-03-23 | Split Logistics Product Support hours into components | Logistics Product Support now captures Kitting, Booking In/Out, and Product Movement separately while keeping Hours/Batch as the summed value used by support history and monthly batch-based load calculations

## 2026-03-23 | Rename Logistics and Unit 6 capacity team labels | Shared capacity screens treated every non-PM stream as engineer-only; Logistics now shows Logistics Technician and Unit 6 shows Technician across team, chart, holiday, and add-member UI text

## 2026-03-23 | Remove shared capacity nav bar from Logistics and Unit 6 pages | Those pages already have their own local header/back controls, so the extra route-switcher bar was redundant and cluttered the top of the screen

## 2026-03-23 | Add capacity Supabase query tests | New test files for me-data-relational.js (save payloads, delete filters, load mapping), prod-capacity-data.js (query shapes for init and staff insert), and work-areas-data.js (CRUD column verification); catches wrong DB column names, camelCase leaking into payloads, and wrong filter columns

## 2026-03-23 | Add npiRelLoad query consistency tests | Detect future column type mismatches and per-table project_id inconsistencies; tests verify npi_documents receives text prog_id (not UUID) and that all 16 npi tables receive the same project_id value

## 2026-03-23 | Fix npi_documents 400 error — change project_id column from uuid to text | npi_documents.project_id was typed uuid while all other npi_* tables use text; the code passes prog_id (text) as the project identifier so queries failed with 400 Bad Request; dropped the incorrect FK constraint and retyped the column to text to match all other npi tables

## 2026-03-23 | Fix action centre project lookup query — use prog_id not database primary key | Action centre was querying projects by database primary key (id) but NPI tables store prog_id, causing 400 Bad Request errors when resolving project names; now queries on prog_id column to match foreign key references

## 2026-03-23 | Fix NPI action FK violation — return prog_id not database primary key | npi_actions.project_id and related NPI tables (npi_pfmea_causes, npi_risks) use foreign keys that reference projects(prog_id), not projects(id); npiRelResolveProjectId was returning the database primary key (projects.id) instead of prog_id, causing 409 FK constraint violations when saving actions; changed to return project.id (which holds prog_id in the cache) from the in-memory project and projects.prog_id from queries

## 2026-03-23 | Remove stale manual product duplicates during capacity auto-sync | Product Support tables showed duplicated product values because legacy manual rows (no product DB ID) were kept alongside synced DB-linked rows with the same name; auto-sync now drops stale manual duplicates and keeps only unique product records per department

## 2026-03-23 | Normalize overgrown RLS policies to one auth rule per table and add rollback migration | Live DB had overlapping permissive RLS policies (up to 8 per table) including broad `allow all`; standardized affected tables to the auth-only model in database.md and added `supabase/rollback_normalize_rls_to_single_auth_policy.sql` to restore prior policy layout if needed

## 2026-03-23 | Fix ME/PM product relational conflicts on save | me_products enforces unique product_database_id, but saves were upserting only by id and persisting unsupported department tags; save now resolves existing row id by product_database_id first and writes only ME/PM product departments to satisfy DB constraints

## 2026-03-23 | Fix Product Support tab duplicates (ME) and empty tabs (Logistics, Unit 6) | Wrong arg order in meDataAddProduct call caused ME products to have no DB ID, bypassing de-dup; Logistics and Unit 6 had no auto-sync call so their product lists were always empty

## 2026-03-23 | Decouple settings portal tests from let/var rewrites | settings.js is high-churn and broad lexical rewrites in tests were creating scope-collision risk and brittle coupling

## 2026-03-23 | Filter support history by valid product IDs before DB insert | FK constraint violation when history rows referenced deleted/orphaned products

## 2026-03-23 | Add focused LOG and Unit 6 capacity portal Jest coverage | Added dedicated behavior tests for logistics and unit6 orchestrators (rendering, department filtering, tab routing, and debounced save handling) to match existing capacity portal test depth and reduce regression risk

## 2026-03-23 | Fix me_holidays 409 PK conflict on page load | meLoadRelationalHolidays loaded all users' holidays but user_id was not stored in state; save then tried to INSERT other users' rows (which still existed) causing a duplicate key error; fix stores userId on each holiday state object and filters the insert to only the current user's holidays

## 2026-03-23 | Update capacity hub test for five stream cards | Capacity hub includes Logistics and Unit 6 cards; test expectation was still fixed at three cards and caused false CI failures

## 2026-03-23 | Split settings teams and MCS tabs into dedicated modules | settings.js had grown too large; moved teams/permissions logic to settings-teams.js and approvals logic to settings-mcs.js to improve maintainability without changing behavior

## 2026-03-23 | Split PFMEA worksheet/filter state into pfmea-state.js | pfmea.js had grown large; moving column-view and filter state helpers into a dedicated module reduces file size and keeps render/mutation logic focused

## 2026-03-23 | Split mcs-modal.js into four sub-renderers | File was 16k tokens making stage changes risky; split into mcs-modal-shared, mcs-modal-create, mcs-modal-view, mcs-modal-edit

## 2026-03-23 | Add Logistics and Unit 6 capacity plans to Capacity Hub | Two new ME-style load capacity plans (Logistics = LOG tag, Unit 6 = UNIT6 tag) added as fully independent streams; data stored in shared me_* tables filtered by department tag, no ME or PM data shown

## 2026-03-23 | Add 1-year headroom KPI and integer 2-year headroom in Production Capacity by Work Area | Unit 2/3/6 KPI cards now show both 1-year and 2-year headroom, and 2-year headroom is rounded to whole hours for cleaner at-a-glance reading

## 2026-03-23 | MCS staged headers use explicit number badges | Replaced pseudo-only stage numbers with real badge elements in stage toggle rendering so Stage 2 cannot disappear due to theme/cascade edge cases; also increased footer action contrast again

## 2026-03-23 | MCS modal follow-up contrast and Stage 2 badge fix | Ensured Stage 2 badge content is forced to show and brightened the modal footer/button styling so action controls stand out clearly

## 2026-03-23 | Keep NPI Kanban search focused while typing | NPI project search re-rendered the dashboard on each keystroke and dropped focus/caret, forcing users to re-click for every character

## 2026-03-23 | MCS modal stage bullets and visual polish | Added explicit numbered stage bullets (including Stage 2), a color-treated header bar, and clearer stage transition guide lines so the staged flow is easier to scan

## 2026-03-23 | Align ME/PM chart KPIs to selected month | Capacity chart KPI cards and breakdown were using the current calendar month, causing mismatch when viewing other months

## 2026-03-23 | Keep ME/PM task search focused while typing | Task list search re-rendered the tab on each keystroke and dropped input focus/caret, forcing users to re-click the field for every character

## 2026-03-23 | Gray heatmap tiles outside person start/end dates | Weeks outside a team member's active employment period now show as gray (no capacity), consistent with full-week holiday tiles

## 2026-03-23 | Month filter for ME & PM task lists | Filter tasks that overlap a selected month (starts in, ends in, or spans across)

## 2026-03-23 | Require explicit Apply for dated support-rate edits and add row history view | Prevent accidental backdated changes and make Product Support history visible where edits happen

## 2026-03-23 | Add effective-dated ME/PM product support history | Preserve historical capacity accuracy when hours-per-batch changes over time by resolving support per batch using dated rates

## 2026-03-23 | Heatmap extended to full year (52 weeks) | User requested full-year view for ME & PM capacity heat map

## 2026-03-23 | Holiday Planner shows 2 months + Today button | Better visibility across month boundaries; Today button jumps back to current month and is disabled when already there

## 2026-03-23 | Guard holiday auto-sync save behind meDataInitialized flag | renderMeCapacity triggered meDataSave 1s after render; if meDataInit had not yet completed the save fired with empty holidays and deleted all DB rows — guard now blocks that save until init is confirmed complete

## 2026-03-23 | Persist ME/PM capacity task deletions | Deleting a task only removed it from in-memory state; save now also deletes queued task IDs from `me_tasks` so removed tasks do not reappear after refresh

## 2026-03-23 | Stop dead legacy holiday lookup and harden holiday saves | Removed the `me_capacity` fallback that caused 404 console errors in production and changed holiday replacement to delete only the current user's rows so one empty save cannot wipe shared holidays

## 2026-03-23 | Production schedule: performance, usability and bulk actions | Improve speed and usability of the scheduling page

## 2026-03-23 | Prune obsolete Supabase cleanup script | Audited supabase folder and removed only the legacy ME PERT/subtask drop script because current app setup still depends on the remaining SQL files

## 2026-03-23 | Operations dashboard capacity section grouped by area | Renamed "Operations Capacity by Unit" to "Operations Capacity by Area" and moved ME/PM utilisation KPIs into the same area-capacity block as Unit 2/3/6

## 2026-03-22 | Fix Production hub favourite buttons to delegated actions | Removed inline onclick handlers from Production hub cards and routed favourite toggles through container delegation so delegation tests and quality checks pass
## 2026-03-22 | Remove redundant Support From / Support Until date fields from ME/PM products | Product support date range was redundant — support load is now calculated entirely from production schedule batch dates, removing the manual override from data model, UI table, persistence, and calculations

## 2026-03-22 | Make ME/PM product support schedule-driven by batch count | Product support/load now uses production schedule batches for monthly demand instead of week multipliers, while preserving editable per-product support values

## 2026-03-22 | Fix Settings Product Families/Work Areas placeholder contrast in terminal theme | Inline add/edit row placeholders were too dim against dark table backgrounds, making field guidance hard to read

## 2026-03-22 | Boost Gate Trajectory contrast in terminal theme | Follow-up APQP Mission Control fix to make trajectory helper text, inactive gate circles, and connector lines clearly visible in terminal mode

## 2026-03-22 | Fix APQP Mission Control text readability in terminal theme | Mission Control dashboard used light-theme hardcoded text colors without terminal overrides, causing title and KPI numerals to render as unreadable dark blue

## 2026-03-22 | Remove Hub favourites scrollbar and tighten favourites cap | Limit hub favourites to four pages and four products so the favourites panel stays compact without an internal scrollbar

## 2026-03-22 | Improve terminal/dark dashboard text contrast | Secondary dashboard text used muted theme color that was too dim, making project dashboard labels hard to read in terminal (and low contrast in dark)

## 2026-03-22 | Hub Phase 1 compact landing layout | Reduce laptop scrolling by compressing hub desktop spacing, shortening cards, capping favourites panel height with internal scroll, and using a denser wide-screen grid

## 2026-03-22 | Fix PFMEA SC dropdown persistence and display | special_char column was missing from npi_pfmea_effects (data lost on refresh); SEV column widened from 44px to 60px so emoji fits in the select without clipping

## 2026-03-22 | Fix favourites shortcuts for sub-hub cards | Capacity ME / NPI favourites were setting sub-tabs without switching section first, so shortcuts appeared unresponsive from Hub

## 2026-03-22 | Fix PFMEA/PFD guide buttons and add emoji Special Characteristic reference | Guide buttons were broken (missing show-guide handler in npi-events); SC symbols changed from ∇△◇ to 🦺❗⚠️ with inline legend and guide section

## 2026-03-22 | Add favourite stars to Capacity/Product Development/Production hub cards | Ensure all hub-style cards can be starred, not just the main portal hub, and allow quick-open from favourites panel into specific sub-hub tabs

## 2026-03-22 | Add local favourites for portal pages and NPI products | Give users quick one-click access by starring key hub pages and NPI product cards, persisted per user in browser local storage without database changes

## 2026-03-22 | PFMEA improvements — AIAG-VDA compliance & UX | Add Function field (AIAG-VDA Step 3), special characteristics (∇△◇), real-time validation warnings, collapsible column views (Compact/Standard/Full), and advanced filtering (owner, overdue, special char, text search)

## 2026-03-22 | MCS card change-type label clarified | Main MCS cards now show `Change Type: <type>` instead of only the raw type value for clearer at-a-glance context

## 2026-03-22 | Add 1-5 key navigation for hub pages | Improve keyboard-first navigation across main hub, Capacity hub, Product Development hub, and Production hub with matching shortcut help text

## 2026-03-22 | Separate Stage 1 impact estimate for approvals | Added a dedicated Impact Assessment estimate field in Stage 1 that is independent from Stage 3 implementation time impact so approvers can evaluate early impact context

## 2026-03-22 | MCS status moved to modal top bar | Treat status as global change state by displaying it in the header and removing duplicate Stage 1 status content

## 2026-03-22 | MCS accordion stages, clearer heading colors, and Stage 1 impact merge | Make stage navigation clearer by enforcing one-open-at-a-time accordion behavior, improving stage heading visual distinction, and consolidating impact capture into Stage 1 with new freeform context fields

## 2026-03-22 | MCS modal width, collapsible stage cards, and fixed title banner | Improve staged-form readability by widening the modal, reducing stage vertical sprawl with collapsible bordered sections, and keeping the header visible while scrolling modal content

## 2026-03-22 | MCS product filter | Allow filtering the change register by product

## 2026-03-22 | Stage-based engineering change form with right-side workflow chart | Reworked MCS Create/Edit/View modals into visual stage blocks and aligned a vertical workflow rail to improve flow clarity and data capture context

## 2026-03-22 | Rename Manufacturing Change System to Manufacturing Change | Updated all references to the MCS portal across documentation, labels, and code comments for clearer naming

## 2026-03-22 | Fix capacity hub cards not appearing clickable | Added cursor: pointer to .hub-card CSS and created comprehensive tests to prevent regression on interactive hub cards

## 2026-03-22 | Fix mobile topbar button order | Actions and Feedback buttons were appearing to the right of Logout; moved them before Settings so they sit on the left side as expected

## 2026-03-22 | Generic Approvals settings with individual gate sign-off assignment | "Mfg. Changes" tab renamed to "Approvals"; NPI gate sign-off roles (ME Manager, Operations Director, Sales Director) can now be assigned to named individuals rather than relying solely on team permissions

## 2026-03-22 | Fix mobile-only buttons showing on desktop | .tbtn display:flex was overriding .mobile-quick-btn display:none due to cascade order; raised specificity to .tbtn.mobile-quick-btn

## 2026-03-22 | Fix double scroll bar on desktop | Bottombar was outside .shell causing body + .main to both scroll; moved it inside .shell and removed redundant CSS overrides

## 2026-03-22 | Professional top bar button redesign | Top bar buttons looked cramped and unprofessional — increased button size (11→13px font, 5px 11px→8px 14px padding), improved spacing (5px→8px gap), added subtle hover shadows, updated logout emoji from ⏻ to 🚪, and ensured consistent 36px min height for better touch targets and visual balance

## 2026-03-22 | Fix heatmap mobile horizontal scroll | Heatmap spread across multiple lines on mobile; changed wrapper to overflow:auto scroll container, fixed column template from auto-fit (which compresses) to repeat(20, ...) so the table scrolls horizontally with a sticky person column

## 2026-03-22 | Fix bottom bar visibility in light theme | Bottombar gradient blended into pale page background; added explicit light-theme background using --line/--line2 vars and darkened default status indicator colors so they are readable on light backgrounds

## 2026-03-22 | Mobile UI accessibility and UX improvements | Increased touch targets to 44px (WCAG compliant), improved table scroll discoverability with gradient indicators, increased mobile gutter from 4px to 10px for better readability, fixed sticky header z-index, and improved modal/card styling on mobile devices

## 2026-03-22 | Mobile hub portal grid: 2-column layout with compact cards | Reduced mobile scrolling by switching from single-column to 2-column grid with smaller buttons, tighter spacing, and reduced padding

## 2026-03-22 | PFD top ribbon switched to section navigator | Large flows were harder to navigate step-by-step, so the top ribbon now jumps by section with step-count/range context

## 2026-03-22 | PFD new step types + flowchart improvements | Added Inspection (circle, Pass/Fail), Rework (parallelogram), Transport (stadium) step types; flowchart layout toggle (TD/LR), step type legend, high-RPN risk indicators (⚑), and per-type colour chips in table view

## 2026-03-22 | PFD flowchart professionalism improvements | Flowchart looked unprofessional and was not useful — added START/END terminators, section subgraphs, wider spacing, stronger decision node colour, centred SVG, column headers in table view, removed fragile arrowhead DOM hack

## 2026-03-22 | PFD flowchart: TD layout, tall canvas, click-to-expand, smaller arrowheads | User feedback — chart was small, horizontal, and showed no extra detail on nodes

## 2026-03-22 | PFD flowchart visual polish — thin borders, smaller text, rename Preview | Zoom scale (2.11→1.15), stroke-width (1.5/1.7→0.8px), font-size (11→13px) reduced; "Flowchart Preview" renamed to "Process Flowchart"

## 2026-03-22 | Polish NPI PFD flowchart visual design | Flowchart scale was acceptable but appeared visually rough; refined Mermaid theme, edge labels, and node styling for a cleaner professional finish

## 2026-03-22 | Harden production product sorting against null names | Prevent runtime add/update failures when backend product rows contain missing or malformed `name` values

## 2026-03-22 | Finalize NPI PFD flowchart readability defaults | Replaced adaptive zoom with fixed 211% zoom (220% bigger than prior 66%), kept LR layout permanent, and refreshed process vs decision colors for stronger visual separation

## 2026-03-21 | Finish NPI PFD flowchart foundations | The PFD flowchart work was only partially wired in; step type and destinations now save, reload, and drive a graphical preview from the existing table

## 2026-03-21 | Add OpenWolf instructions to Gemini guide | Gemini-facing repo guidance was missing the OpenWolf workflow, so the assistant config could drift from the enforced protocol

## 2026-03-21 | Fix operations dashboard rapid actions going to portal hub pages | Actions were navigating to portal root views instead of directly to the relevant sub-section

## 2026-03-21 | Redesign operations infographic with visual encoding | Previous version was just a printable table — same data, same format, no visual storytelling. Replaced with SVG ring gauges for utilisation, a pipeline flow layout for production, severity heat bars for risk, and a gate step tracker.

## 2026-03-21 | Operations People KPIs fixed to 2-column layout | Prevent oversized desktop KPI spread and improve readability in the People tab

## 2026-03-21 | Add company logo to capacity infographic export | All exportable items should carry the Tidyco brand mark

## 2026-03-21 | Fix production capacity formula help click action | "How capacity is calculated" was static text with no bound action; it now opens a clear in-app modal with the formula details

## 2026-03-21 | Operations Mission Control banner theme support | Banner had hardcoded dark colours that did not respond to light or terminal themes

## 2026-03-21 | Fix label accessibility across all forms | Associate all <label> elements with their fields via for/id to resolve 28 console warnings and meet WCAG 2.1 Level A

## 2026-03-21 | Replace simulated MCS tests with real module behavior checks | Strengthen regression safety by asserting actual mcs-main, mcs-actions, and mcs-approvers-data functions instead of hand-simulated logic

## 2026-03-21 | Expand robustness tests for ChartTheme, operations infographic, and MCS approval core | Close high-risk test gaps with real module behavior checks and align timing-core tests with current buildMonthGroups signature

## 2026-03-21 | Add company logo to top bar | Replace text-based brand mark with the Tidyco logo image

## 2026-03-21 | NPI Timing Plan — professional customer-facing export | Replace window.print() with an infographic-style standalone HTML document: Tidyco logo, project meta (customer, part no., family), summary stats, full Gantt table, milestone labels, and Print/Save PDF button; A3 landscape print optimised

## 2026-03-21 | Add role-based permissions for NPI gate signoff | Gate signoff now enforces named-role permissions so only authorised users can sign, unsign, or edit each signatory role

---

## 2026-03-21 | NPI Timing Plan overhaul — section headers, section collapse, row reorder, milestones, configurable timeline, PDF export | Improve usability and add key planning features

---

## 2026-03-21 | Switch VS Code GitHub MCP server to remote HTTP | Workspace MCP config required Docker, causing startup failure on machines without `docker` on PATH

---

## 2026-03-21 | Fix NPI Timing Plan: adding to one section blocked all others | Early return skipped the Add button for empty sections once any row existed

---

## 2026-03-21 | Rename ME products table columns | "Family" → "Product Family", "Status" → "Product Status" for clarity

---

## 2026-03-21 | Mobile topbar: hide keyboard shortcuts button, add icon shortcuts for Actions and Feedback | Keyboard shortcuts are irrelevant on mobile; quick-access buttons for My Actions and Feedback & Bugs are now shown as icon-only (✅/💬) in the topbar action strip on mobile

## 2026-03-21 | Migrate Operations dashboard shell controls to delegated actions | Removed inline handlers from operations-dashboard-main.js header/tab controls, routed through data-action delegation, and added regression checks in operations-dashboard.test.js

## 2026-03-21 | Implement global Ctrl+S/Ctrl+F/Escape shortcuts and enforce docs-sync rule | Shortcuts modal now matches live behavior (save, focus search, close modal), helper tests were added, and explicit rule added to keep README.md and TESTING_STRATEGY.md updated when affected

## 2026-03-21 | Sync README and testing strategy with live baseline | Removed stale testing claims, added verified suite/test counts, and updated planning references to the new 3-file plans baseline

## 2026-03-21 | Rebuild plans baseline with live-state docs after full reset | Added a fresh 3-file planning set (`master-current-state.md`, `next-implementation-sprint.md`, `risk-and-regression-checklist.md`) grounded in current structure/features to replace deleted stale plans

## 2026-03-21 | Remove all files from plans folder for planning reset | Existing plans may be stale against recent code changes; cleared plan documents to allow rebuilding fresh, current implementation plans

## 2026-03-21 | Overhaul hours accumulation: baseline on product add, additive history, read-only edit, column rename _days→_hours | Overhaul time was not tracked as an accumulating chain; products had no baseline history entry; manual estimations overwrote instead of adding; time impact columns were named in days but stored hours; edit form allowed overwriting current_overhaul_hours directly

## 2026-03-21 | Make top bar theme-aware across Light, Dark, and Terminal | Top bar used hardcoded blue colors so it stayed visually constant across themes; moved top bar gradients/text/button states to theme CSS variables

## 2026-03-21 | Fix MCS Approval 2 overhaul history insert: user_id not-null violation | mcsCreateOverhaulHistoryEntry passed change.initiated_by_user_id (undefined → null) but overhaul_history.user_id is NOT NULL; replaced with currentUser.id

## 2026-03-21 | Start hybrid permissions implementation (role baseline + team grants) | Replaces disconnected permissions behavior with working effective access resolution: login now composes role baseline with additive team grants, navigation denies unauthorized sections, Settings Permissions now supports team assignment, team permission toggles can create missing rows, and seed SQL added for normalized role/permission tables

## 2026-03-21 | MCS layout improvement: KPI bar, accordion sidebar, card redesign, new filters | Plan MCS_LAYOUT_IMPROVEMENT_PLAN.md — Phases 1–6: added clickable KPI dashboard, collapsible accordion sidebar sections, priority badge replacing dot, icon-annotated card submeta, overdue date highlighting, My Changes/Overdue/High Priority quick filters, date range filter, clear all filters, compact approval chain, wider modal (900px), all hardcoded status/priority hex colors replaced with CSS variables

## 2026-03-21 | Fix compact row selection in Settings Appearance | Density cards had no interaction handler feedback, making compact appear unselectable; card click/change now updates checked state and selected styling immediately

## 2026-03-21 | Fix Settings row density not affecting most tables | Compact density only targeted .prod-tbl so standard .tbl rows were unchanged; compact mode now updates shared table spacing variables

## 2026-03-21 | Add reporting date changer to Operations Mission Control | Dashboard now makes the data snapshot date explicit and lets users shift the as-of date for clearer interpretation

## 2026-03-21 | Add System Health % explanation to Operations guide modal | User asked how the score is calculated — added a plain-language breakdown of all seven signals and colour thresholds

## 2026-03-21 | Add Unit 2/3/6 cards to Operations People tab | People view now mirrors ME/PM capacity pattern with utilisation and headroom cards for Operations Units 2, 3, and 6

## 2026-03-21 | Add capacity infographic generator to Operations dashboard | User requested a printable visual summary of all capacity data (ME, PM, production units, flow, risk) via a new 📊 Infographic button

## 2026-03-21 | Add Unit 2/3/6 capacity KPIs to operations overview | Operations dashboard overview now shows per-unit utilisation and headroom using production capacity demand/supply matrices

## 2026-03-21 | Deduplicate domain rule docs for lower token usage | Compressed agents/code-style/security/database rules by removing repeated core policy text and keeping canonical owner pointers

## 2026-03-21 | Compress core instruction files for lower token overhead | Reduced CLAUDE.md and copilot-instructions.md to router-style guardrails with pointers to scoped rule owners

## 2026-03-21 | Fix production capacity dashboard: capacity line now renders on top of bars | Bar datasets had no order property (defaulting to 0, same as the line), making draw order ambiguous; added order:1 to bars so line (order:0) always renders on top

## 2026-03-21 | Fix capacity chart bar colours to match legend | Bars used gradient fills that faded to near-transparent, making colours inconsistent with the solid legend dots; replaced with solid colours from the same CSS variables.

## 2026-03-21 | Boost terminal theme chart colours to full neon saturation | Pale/lt variants were too transparent on dark backgrounds; solid colours pushed to max saturation for phosphor effect

## 2026-03-21 | Fix me-chart.js crash: --chart-purple-lt CSS variable missing | addColorStop threw SyntaxError when the variable resolved to empty string in all three themes

## 2026-03-21 | Add Terminal colour theme (phosphor-green on black) | User requested a third theme alongside light and dark; adds full CSS variable set, chart colours, status colours, and theme card in Appearance settings

## 2026-03-21 | Rewrite refactoring plan Phase 3 as safe optimization sequence | The previous optimization list was too generic; replaced it with scoped rules and behavior-preserving test gates to avoid accidental logic drift
## 2026-03-21 | Implement refactor Phase 1 safely with test gates | Removes duplicate capacity esc helpers, centralizes settings loading banners, and standardizes flat RPN formulas while preserving behavior through focused and full regression checks

## 2026-03-21 | Rewrite refactoring plan Phase 2 as safe structural sequence | The old Phase 2 list was too broad for high-risk files; replaced it with staged module passes and explicit test gates to reduce regression risk

## 2026-03-21 | Harden refactoring opportunities Phase 1 plan | The original quick-win checklist could be misread as safe search-and-replace work; updated it to call out current helper dependencies, stale items, and safer sequencing

## 2026-03-21 | Fix hardcoded colors in products.css | ~25 hex values (#2c3e50, #666, #ddd, etc.) made text and borders invisible in dark mode; replaced all with CSS variables

## 2026-03-21 | Fix remaining hardcoded inline colors across portals | products.js, me-heatmap.js, me-chart.js, action-centre.js, product-development.js still had rgba/hex values; replaced with CSS variables so all portals fully respect light/dark theme

## 2026-03-21 | Normalize docs filenames | Renames `docs/` files to lowercase kebab-case so links are predictable and the documentation tree stays consistent

## 2026-03-21 | Move live guides into docs folder | Separates durable reference/setup docs from true plans so `plans/` stays focused on pending work and `docs/` holds current guidance

## 2026-03-21 | Prune stale plan documents | Removes completed or outdated one-off plans from `plans/` so the folder only keeps active specs, guides, and unfinished work

## 2026-03-21 | Theme remediation: replace ~200 hardcoded colors with CSS variables | Enables proper light/dark mode support across all portals; adds --chart-*, --status-*, --gray-*, --code-bg, --row-highlight-* variables, ChartTheme utility, and fixes all CSS/JS files to use theme-aware colors

## 2026-03-21 | Fix dark mode: project dashboard text invisible on dark background | Hardcoded dark navy hex colours (#0f1f33, #112238, #25384f etc.) in mc-shell dashboard were invisible against dark backgrounds; added :root[data-theme="dark"] overrides so project name, KPI numbers, gate circles and focus text render in legible light colours

## 2026-03-21 | Fix mobile topbar overlap and restore settings access on mobile | Topbar min-width constraints (240px left, 200px centre) exceeded 375px screen width causing all buttons to collide; collapsed centre strip on mobile, removed min-widths, switched topbar to 2-col grid; also fixed settings layout defaulting to flex-row instead of flex-column on mobile

## 2026-03-21 | Finish dark mode: fix hardcoded colours in operations, capacity, PFMEA, PFD, action centre | Phase 2–4 of DARK_MODE_FIX_PLAN — eliminated all remaining hardcoded #fff/white/light-hex values in CSS and JS render functions so every portal renders correctly in dark theme

## 2026-03-21 | Dark mode accessibility fixes — contrast & hardcoded colour overrides | Audit found WCAG AA contrast failures (info-banner ~4.1:1, alert-blue ~3.2:1) and 8 hardcoded light-palette hex values (flag borders, tag borders, density swatches) that did not adapt in dark mode

## 2026-03-21 | Make dark mode activate immediately on selection | Users expected the dark theme card click to switch the UI instantly instead of waiting for the Save button

## 2026-03-21 | Visual density preview in Settings appearance tab | Users had no way to see the difference between Normal and Compact row density before saving

## 2026-03-21 | Add dark mode in Settings appearance | Lets users switch the portal to a darker colour scheme from the existing browser-saved appearance preferences

## 2026-03-21 | Fix tab URL memory in ME, Production Load, and PM Capacity | meSetTab/setProdCapTab/pmSetTab were swapping DOM content without updating the URL, so refresh always jumped back to the first tab

## 2026-03-21 | Remove stray up/down arrows from prod capacity tab bar | overflow-x: auto implicitly sets overflow-y: auto; adding overflow-y: hidden prevents the vertical scrollbar from appearing

## 2026-03-21 | Move date adjustment bar on capacity settings page | Improves user experience by placing the month navigation controls directly above the table they manipulate.

## 2026-03-21 | Fix Invalid Refresh Token auth error on startup | Stale refresh token in localStorage caused a console error every page load; getSession() now clears the bad token and an onAuthStateChange listener handles mid-session expiry

## 2026-03-20 | Gitignore OpenWolf runtime files | cron-state, token-ledger, buglog, suggestions auto-update each session and should not be committed

## 2026-03-20 | Initialize OpenWolf v1.0.4 | Adds AI workflow tooling with hooks, anatomy scan, and memory system to improve Claude Code sessions

## 2026-03-20 | Add guide buttons to Change Register and Action Centre | These two recently added pages were missing the ❓ Guide button that all other pages have; guide content added to guide.js and buttons added to each page header

## 2026-03-20 | Remove "Review Changes →" shortcut from hub widget | Button was redundant — pending MCS approvals are already visible in the Action Centre; removing it keeps the widget focused

## 2026-03-20 | Fix duplicate ECR ID on Raise a Change | ID was generated from mcsList.length+1 which collides when records have been deleted or the local list is out of sync; now queries the DB for the highest existing ECR-YYYY-NNNN number and increments from there

## 2026-03-20 | Add pending MCS approvals to hub "Logged in as" widget | Approvers had no at-a-glance view of changes awaiting their sign-off; the widget now shows an amber pending approval count and a "Review Changes →" button whenever mcsApprovals has items in actionCentreData

## 2026-03-20 | Auto-add time impact to Overhaul Trends when MCO passes final approval | Engineering changes had no way to flow through to Product Management — the product dropdown was saving the product name (not its UUID) so overhaul_history entries had no product link, and the entry was missing overhaul_hours so the trends chart showed nothing; now saves affected_product_id from the dropdown, calculates new overhaul hours as current + delta, inserts a properly linked history record, and updates the product's current hours so the Overhaul Trends chart and KPIs update immediately on Approval 2

## 2026-03-20 | Fix MCS DB migration: expand status constraint, relax UUID columns, add global_settings | The mcs_changes status CHECK only allowed old 4-step values so updating to 'implementing' failed silently in the DB; eng_review_by/qa_review_by were UUID FK columns but app stores email strings; migration now includes global_settings idempotent setup and a health-check SELECT

## 2026-03-20 | Fix MCS approval: remove duplicate permission check, fix race condition, fix phantom modal | mcsApproveStep re-checked mcsCanApproveStep after the button was already shown — if approver config loaded between modal-open and button-click the second check returned false for a user who was correctly authorised; mcsNavigateFromActionCentre used a 300 ms setTimeout that fired before renderMcs() finished loading config causing the same false-negative; mcsViewingId was never cleared on modal close so realtime updates auto-reopened a modal the user had dismissed; realtime UPDATE handler also replaced mcsList entries without preserving client-only impacts/timeline fields

## 2026-03-20 | Fix MCS approval: DB status constraint, email step lookup, nominated_approver display, stale action mapping | DB CHECK on mcs_changes.status only allowed the old 4-step values so any attempt to move to 'implementing', 'final_review', or 'closed' failed with a constraint error — new SQL migration adds the 2-step statuses; mcsGetMyApproverSteps only checked user_id (not email) so approvers matched by email never appeared in Action Centre pending items; raw 'nominated_approver:email' string was shown in the approval chain notes section; mcs-actions.js mcsExtractApproveTasks used the old 4-step role mapping instead of the 2-step mcsApproverConfig.

## 2026-03-20 | Fix register approval issues: email matching, localStorage caching bug, add approver selector | Approve button did not show for assigned approvers because comparison used only UUID (not email) — now checks both user_id and user_email so either match grants approval; mcsApproversLoad was overwriting localStorage with empty arrays when global_settings returned no rows for those keys, silently wiping saved approvers — now only overwrites localStorage when the DB actually returned data for that key; "Raise a Change" form now shows an "Approval 1 Reviewer" dropdown populated from configured approvers so submitters can nominate a specific reviewer, stored as nominated_approver in eng_review_notes and honoured by the approval permission check.

## 2026-03-20 | Fix MCS approver assignment: use global_settings instead of missing table | The mcs_approver_settings table did not exist so the Settings page showed a SQL setup wall and no one could assign approvers; switched storage to the existing global_settings key-value table (same pattern as Production Capacity utilization) with localStorage fallback — no SQL setup needed; Settings → Mfg Changes now shows the add/remove dropdowns immediately; removed misleading "no approvers = anyone can approve" message.

## 2026-03-20 | Fix change register toolbar overlap and approval button not showing | Toolbar used top:52px inside .main which already starts below the 52px topbar — corrected to top:0 so sticky doesn't push content down; approver config was cached and never refreshed on re-entry so new assignments were ignored — now reloads every visit; mcsCanApproveStep returned false when no approvers were assigned despite Settings saying "anyone can approve" — now falls back to canEdit() when the list is empty or the table isn't set up.

## 2026-03-20 | Add comments and progress updates to engineering change activity log | Users had no way to add notes or status updates to a change after it was raised; new comment form in the view modal lets anyone post a 💬 Comment or 📈 Progress Update directly to the activity log, saved to mcs_timeline and shown immediately.

## 2026-03-20 | Rework MCO approval chain to 2-step process with new statuses | Old 4-step chain (Engineering → QA → Manufacturing → Management) replaced with the correct process: open/impact-assessment → Approval 1 (reject = closed, approve = implementing) → Approval 2 (reject = back to implementing, approve = implemented + Overhaul Trends entry). New statuses: open, review, implementing, final_review, implemented, closed. Settings and Action Centre automatically show only 2 approver slots. All MCS tests updated.

## 2026-03-20 | Fix ECR approval chain visuals + functional bugs; add Active Approvals panel to Action Centre | Pending circles were nearly invisible (used --border2 on same-coloured background); connector lines used pseudo-elements causing misalignment — replaced with explicit connector sibling elements; circles enlarged to 48px with rich colour-coded status badges; mcsAdvanceStatus now resets all four step statuses to 'pending' when going to review (previously only engineering was set, allowing out-of-order approvals); sequential guard added to mcsApproveStep to block approving a step before its predecessor is done; Action Centre gains a dedicated Pending Approvals card (amber accent, shown only when user has steps to sign off) with per-ECR rows and a direct Review ECR button.

## 2026-03-20 | MCS approval permissions: role-based approval steps + Action Centre integration | Each MCS approval step (Engineering, QA, Manufacturing, Management) now requires an assigned approver; admins assign approvers per step in Settings → Mfg. Changes; only the assigned approver(s) for the active step see Approve/Reject buttons in the change modal; all assigned approvers see pending changes in their Action Centre under a new MCS Approvals tab.

## 2026-03-20 | Fix ECR impact/time display; smarten approval chain and impact tags | Impact count showed 0 (used non-existent impacts_count field instead of impacts.length); time impact and target date were never rendered in the view modal; approval chain used position-based logic instead of each step's actual approval status; impact tags and approval steps now show approver names, dates, notes, and proper color-coded statuses.


---

## 2026-03-21 | Add instruction token optimization package | Defines a minimal core instruction set, deduplicated rule ownership, and a staged migration plan to reduce prompt cost without losing safeguards

## 2026-03-20 | Fix MCS database issues: wrong client, wrong tables, wrong field names, missing required fields | MCS was using the CDN global `supabase` object instead of the `supa` client for all DB queries (causing failures); `impacts` arrays and `timeline` arrays were being inserted into `mcs_changes` which has no such columns — they belong in `mcs_impacts` and `mcs_timeline`; update path used `type` instead of `change_type` and spread the full change object (including non-schema fields) into updates; `mcsLoadChanges` now joins `mcs_impacts`, `mcsViewChange` now loads timeline on demand; approval/reject/advance functions only send changed fields; `mcsCreateOverhaulHistoryEntry` was missing the required NOT NULL `effective_date` field; invalid `event_type` values in timeline inserts fixed; `mcs-pfmea.js` and `mcs-actions.js` added to `index.html`.

## 2026-03-20 | Fix MCR submit button: add Supabase client and CSS color variable | MCS modal was calling undefined `supabase.from()` instead of `supa.from()`, causing "supabase.from is not a function" error on save; added missing `--accent` CSS variable so submit button displays with correct color.

## 2026-03-20 | Update change request form: remove affected area, product selector, auto-author, hours impact | Affected area removed as not needed; part/drawing no. is now a dropdown from the products database; initiated by auto-fills with the logged-in user so it can't be entered incorrectly; time impact is now in hours and labelled "Overhaul Time Impact"; drawing update, QC plan, and supplier approval removed from impact assessment as they are not applicable.

## 2026-03-20 | Review and update all .md files, agent files, and plans | Stale test counts, outdated portal lists, misplaced root docs, broken links, and missing status markers on completed plans all degraded the value of the documentation.
## 2026-03-20 | Fix MCS portal layout, sidebar CSS, and add Raise a Change button | The filter sidebar used class names (.sidebar, .sidebar-section, .sidebar-label, .search-wrap) that had no CSS definitions anywhere, so it appeared completely unstyled. The list and sidebar had no flex wrapper so they stacked vertically instead of side-by-side. The toolbar had no button to create new changes even though mcsOpenNewChange() existed — users had no way to raise a change. Empty state now guides users to use the Raise a Change button.

## 2026-03-20 | Fix MCS portal button doing nothing | renderMcs() used getElementById('app-content') which doesn't exist; the correct element is 'mainContent', so the function returned early and nothing rendered.

## 2026-03-20 | Add MCS card to hub and fix mcs-overhaul-integration test syntax error | MCS portal was inaccessible because the hub had no navigation card for it; test suite had a parse error (space in variable name) preventing mcs-overhaul-integration tests from running.

## 2026-03-20 | Implement Manufacturing Change System (MCS) portal with multi-source trigger support and schedule impact tracking | Introduced a new Manufacturing Change System portal for centralized ECR management with 4-step approval workflow (Engineering → QA → Manufacturing → Management). MCS supports multiple trigger sources (manual creation, PFMEA, risks, customer feedback, quality issues, supply chain), real-time subscriptions, mobile-responsive UI, and schedule impact assessment. Auto-creates overhaul_history entries on implementation to feed product timeline KPIs. Integrates with Action Centre (approval tasks) and PFMEA history (change audit trail). Includes 5 comprehensive test files (mcs-main, mcs-approval, mcs-overhaul-integration, mcs-actions) covering filtering, approval chains, timeline logging, portfolio KPI calculations, and cross-portal workflows.

## 2026-03-19 | Efficiency refactor: constants, dead vars, isWeekday helper, single-pass capacity, Map sort | Five targeted improvements: (1) pfmea.js PFMEA_RPN_FILTERS/PFMEA_VIEWS constants replace two duplicated option arrays so adding a new filter only needs one edit; (2) me-calculations.js removes dead adjustedCapacity/adjustedCapacityMax aliases that were just copying capacity/capacityMax for no reason; (3) me-calculations.js isWeekday() helper replaces three identical day !== 0 && day !== 6 checks; (4) me-team.js single-pass reduce replaces three separate reduce/filter/reduce passes over teamArray; (5) me-tasks.js pre-builds assigneeMap/productMap before sort so each comparison is O(1) instead of O(n), and statusOpts is built with a template-literal map instead of string concatenation.

## 2026-03-19 | Efficiency refactor: DRY helpers, null guard, O(n²) fix, parallel queries | Six targeted improvements found by code review: (1) db.js rowToProject() eliminates 3 identical 20-field row-mapping blocks so a new column only needs adding once; (2) state.js teamsState removed — declared but never read; (3) dashboard.js null guard added for prog() to prevent a crash when the selected project is deleted mid-session, plus apqpCompletionPct()/bomTotalItems() helpers replace 4 inline duplicates; (4) capacity-events.js capTaskFilters()/capTaskRefresh() helpers replace 12 repeated ME/PM dispatch blocks; (5) me-data.js O(n²) product sync loop replaced with a Map lookup and meNormalizeTaskRow() removes a duplicated 11-field object; (6) settings.js team user-count queries now run in parallel with Promise.all instead of sequentially.

## 2026-03-19 | Fix PFMEA actions wrongly marked as Done in Action Centre | Typing in the "Action Taken" field was setting status to Closed; Done should only occur when the action is formally implemented and logged to PFMEA history (at which point action_desc is cleared and the item no longer appears in the list). Status now shows "In Progress" when action_taken has content, and overdue detection no longer treats action_taken as a completion indicator.

## 2026-03-19 | Add product name display in topbar for project-specific pages | When navigating to project sections (APQP, capacity, production, etc.), the project name now appears in the topbar breadcrumb so users can immediately see which project they're working on, improving navigation clarity and reducing confusion.

## 2026-03-19 | Fix CTQ/PFD/PFMEA/CP table width and add CTQ filter | Tables and cards were 48px narrower than the project/tab bars because the tab-content wrapper had 24px horizontal padding; removed it so all content aligns. Also added Source, Out-of-Spec Action and Customer Accepted filter dropdowns to the CTQ matrix so users can narrow down a long list of requirements.

## 2026-03-19 | Replace hub Action Centre card with a top widget showing logged-in user and actions summary | A bare card gave no useful information at a glance; the new widget across the top of the hub shows who is logged in and live counts of open/overdue actions with a direct link, making the portal feel personal and immediately actionable.

## 2026-03-19 | Fix Action Centre "Open" → NPI Kanban misdirection | npi_actions.project_id stores the DB primary key UUID (dbId), not the app-level prog_id; actionCentreGoTo was setting progId to the DB PK so prog() could never find the project and fell back to the Kanban. Fixed by resolving DB PK → prog_id via db.projects before navigating. Also fixed scroll-to-item to retry after async NPI data loads.

## 2026-03-19 | Fix Action Centre "Open" button to navigate directly to the action | Clicking "Open" in the Action Centre was navigating to the entire Actions/PFMEA/Risks section without focusing on the specific action, forcing users to manually find it in the table. Now the button scrolls to and highlights the selected row with a pulse animation so it's immediately visible.

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

## 2026-03-21 | Fix misleading 0% coverage output in check:coverage | Coverage script now detects empty Jest coverage artifacts and reports coverage as unavailable instead of implying real 0% source coverage

## 2026-03-21 | Split Operations unit cards into separate boxes in People and Infographic views | Unit 2, Unit 3, and Unit 6 are now rendered as individual cards/panels for clearer side-by-side comparison
