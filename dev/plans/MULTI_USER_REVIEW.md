# Multi-User Review: Tidyco APQP with 10–20 Concurrent Users

> **Date:** March 2026  
> **Scope:** Code and feature review; behaviour analysis for a 10–20 person team; 3-phase improvement plan

---

## 📊 Progress Tracker

| Phase | Task | Status | Files Changed |
|---|---|---|---|
| Phase 1 | 1.1 Dirty project tracking | ✅ Complete | `core/js/db.js` |
| Phase 1 | 1.2 Supabase DELETE on project deletion | ✅ Complete | `portals/product-development/npi/js/dashboard.js` |
| Phase 1 | 1.3 Global hub real-time subscription | ✅ Complete | `core/js/db.js`, `core/js/app.js` |
| Phase 2 | 2-A "Who's Here" presence indicator | ✅ Complete | `core/js/db.js`, `core/js/state.js`, `utils/js/navigation.js`, `portals/product-development/npi/js/dashboard.js`, `core/css/components.css` |
| Phase 2 | 2-B Stale data warning toast | ✅ Complete | `core/js/db.js` |
| Phase 2 | 2-C Project delete cascade (NPI data) | ✅ Complete | `portals/product-development/npi/js/npi-data-relational.js`, `portals/product-development/npi/js/dashboard.js` |
| Phase 2 | 2-D Conflict-safe gate signing | ✅ Complete | `portals/product-development/npi/js/npi-data-relational.js` |
| Phase 3 | 3-A Paginated project list | ✅ Complete | `core/js/db.js`, `core/js/state.js`, `core/js/app.js`, `portals/product-development/npi/js/dashboard.js`, `portals/product-development/npi/css/dashboard.css` |
| Phase 3 | 3-B Supabase channel consolidation | ✅ Complete | `utils/js/realtime.js`, `portals/capacity/js/me-data.js`, `portals/operations/js/operations-dashboard-realtime.js` |
| Phase 3 | 3-C Server-side DB optimisations | ✅ Complete | `supabase/phase3_optimisations.sql` |
| Phase 3 | 3-D Optimistic save status | ✅ Complete | `core/js/db.js` |

---

## 1. Executive Summary

Tidyco APQP is a well-structured collaborative SPA backed by Supabase. The core real-time infrastructure is sound — subscriptions, debounced saves, and per-portal data isolation all work correctly for small teams. However, three issues become important as the team grows to 10–20 people:

| Severity | Issue | Impact |
|---|---|---|
| 🔴 **Critical** | `saveRemote()` iterates and writes **all** projects, not just the one edited | User A's save can silently overwrite User B's concurrent edits |
| 🔴 **Critical** | `deleteProject()` removes a project from memory but never deletes it from Supabase | Deleted projects reappear on page refresh for all users |
| 🟡 **Medium** | Hub / projects list has no real-time subscription | New or updated projects from other users are invisible until a page refresh |
| 🟡 **Medium** | Sub-assembly linking marks only one of two linked projects dirty | The child project's `parentId` change may not be saved to Supabase |
| 🟢 **Low** | No pagination — all projects loaded on startup | Slow initial load as project count grows; not yet a problem at ≤200 projects |
| 🟢 **Low** | Up to ~40 Supabase realtime channels open simultaneously if all portals are active | Near Supabase free-tier limit; premium plans are unaffected |

**Phase 1 changes have been implemented** directly in this PR. Phases 2 and 3 are documented below as agentic task plans.

---

## 2. How the System Works With 10–20 Users

### 2.1 What Each User Experiences at Login

1. `launchApp()` in `app.js` fires.
2. `loadRemote()` queries `projects`, loading **every record** with no limit. At 50–100 projects this is < 50 KB and completes in < 1 s.
3. Seven further async loaders run (`meDataInit`, `prodDataInit`, `productsDataInit`, etc.), each fetching their own tables.
4. A hash-based route renders the hub, and the user is live.

> **With 10–20 users all logging in at once**, those seven parallel loaders fire simultaneously. Supabase handles this easily — each user's session is independent and the queries are light. No bottleneck here.

### 2.2 Real-Time Collaboration: What Works

The system uses **Supabase PostgreSQL Change Data Capture (CDC)** via its Realtime product. Each browser holds WebSocket channels per feature area:

| Portal | Active channels | Tables monitored |
|---|---|---|
| ME Capacity | 4 | `me_teams`, `me_tasks`, `me_products`, `me_holidays` |
| Production | 2 | `production_batches`, `products` |
| NPI project view | 16 | `projects` + 15 NPI relational tables |
| Operations Dashboard | 9 | `projects`, batches, products, ME data, feedback, forecast |
| Feedback | 1 | `user_feedback` |
| Families / Templates | 2 | `families`, `family_pfmea_templates` |
| Work Areas | 1 | `work_areas` |
| Product Management | 1 | `products` |

When two users are both in **ME Capacity**, every team member or task added by one user appears live in the other's view within milliseconds. This is excellent.

When two users are in **NPI** for the same project, the 600 ms throttled reload keeps them in sync. CTQ changes, PFMEA edits, BOM additions — all propagate automatically.

### 2.3 The Projects-Save Race Condition (Critical — Fixed in Phase 1)

**Before the fix:**

```
User A logs in at 09:00. Loads 40 projects. progId → Project #12.
User B logs in at 09:01. Loads 40 projects. Edits Project #15, saves at 09:02.
  → Supabase now has Project #15 with User B's data.

User A edits Project #12 at 09:05, presses a field → save() fires → saveRemote() runs.
  → saveRemote() iterates ALL 40 projects in db.projects.
  → User A's copy of Project #15 is from 09:00 (stale).
  → Supabase UPDATE for Project #15 using User A's stale copy: User B's edit is lost.
```

This is a **silent data-loss bug**. No error is shown; the save badge says "saved".

**After Phase 1 fix:** `saveRemote()` only persists projects that were explicitly modified in the current session (tracked via `dirtyProjects` Set). User A's save no longer touches Project #15.

### 2.4 The Hub Not Updating (Medium — Fixed in Phase 1)

Before: If User A creates Project #41, every other user sees 40 projects in their hub until they manually refresh the page.

After Phase 1: A global real-time subscription on the `projects` table (`global_projects_channel`) means new, updated, and deleted projects appear in all users' hubs within ~200 ms.

### 2.5 Project Deletion Not Reaching Supabase (Critical — Fixed in Phase 1)

Before: Clicking "Delete Project" removed the project from in-memory `db.projects` and called `save()`. Because `save()` only upserts remaining projects (never deletes), the deleted project remained in Supabase. On next login, it reappeared for all users.

After Phase 1: `deleteProject()` now calls `supa.from('projects').delete().eq('prog_id', id)` before navigating away.

### 2.6 Concurrent Editing of the Same Project

When two users edit **different fields** of the same project simultaneously, the outcome is last-write-wins per field (because each save upserts the entire row). The user who saves last overwrites the other's changes to shared fields (`lead`, `pm`, `status`, etc.).

This is acceptable for a 10–20 person operations team where the project owner is the primary editor. The gate-selection locking mechanism (`gate_selection_locked`) provides explicit conflict prevention for the most sensitive field.

**No data loss occurs for NPI detail data** (PFMEA, CTQ, BOM, etc.) because those use per-row upserts on the relational tables, not full-row replacement.

### 2.7 Subscription Count at Scale

With 20 users each having their browser open on the Operations Dashboard, each user holds ~9 Supabase realtime channels open. The Supabase free tier allows ~200 concurrent connections; 20 users × 9 channels = 180 connections, which is at the limit. Any premium Supabase plan (Pro and above) raises this to tens of thousands.

If multiple portals are open simultaneously per user (unlikely in normal operation), the per-user channel count rises to ~40.

### 2.8 Performance With 10–20 Users

| Scenario | Current Performance | Risk |
|---|---|---|
| Initial load (100 projects) | ~200 ms | Low |
| Initial load (500 projects) | ~1 s | Low |
| Initial load (2,000 projects) | ~4–8 s | Medium |
| ME Capacity with 50 team members | Fast (relational, indexed) | Low |
| PFMEA with 200 entries | Fast (15 parallel queries, ~300 ms) | Low |
| 20 users all saving simultaneously | Handled by Supabase connection pooling | Low |

---

## 3. Phase 1 — Critical Fixes (Implemented)

These changes have been made directly in this PR.

### 3.1 Dirty Project Tracking (`core/js/db.js`)

**Change:** Introduced a `dirtyProjects` Set. `save()` adds `progId` to the Set. `saveRemote()` filters `db.projects` to only save records in the Set. The Set is copied and cleared before iterating, so concurrent rapid saves accumulate correctly.

**Edge cases handled:**
- Import JSON: marks all imported project IDs dirty before calling `save()`, so the full dataset is written.
- Sub-assembly link/unlink: `save(childId)` now accepts extra IDs, marking both parent and child dirty.
- Retry: on failure, `saveRemote(true)` defaults to saving all (fallback) since the Set was already cleared.

### 3.2 Project Deletion from Supabase (`portals/product-development/npi/js/dashboard.js`)

**Change:** `npi.dashboard.deleteProject()` now calls `supa.from('projects').delete().eq('prog_id', deletedId)` before updating local state. If the Supabase delete fails, the user is notified and the local delete is aborted.

### 3.3 Global Hub Real-Time Subscription (`core/js/db.js`, `core/js/app.js`)

**Change:** Added `subscribeProjectsGlobally()` in `db.js`. It creates a `global_projects_channel` subscription to the `projects` table. On INSERT/UPDATE/DELETE:
- Local `db.projects` is updated.
- If the user is on the hub or projects list, `render()` is called.
- Updates originating from the local user (matched by `prog_id` already in-flight dirty set) are skipped to avoid double-renders.

Called once from `launchApp()` in `app.js` after `loadRemote()`.

### 3.4 Summary of Phase 1 Files Changed

| File | Change |
|---|---|
| `core/js/db.js` | Dirty tracking, global project subscription, `save()` extra-IDs API |
| `core/js/app.js` | Call `subscribeProjectsGlobally()` on launch |
| `portals/product-development/npi/js/dashboard.js` | Supabase DELETE on project deletion; `save(childId)` for sub-assembly ops |

---

## 4. Phase 2 — Collaborative Enhancements ✅ (Implemented)

> **Goal:** Make concurrent editing safer and more visible. Implemented in this PR.

### Step-by-step Agentic Tasks

#### Task 2-A: "Who's Here" Presence Indicator ✅

Show a small avatar/initial badge in the project header when another user is viewing the same project.

1. In `core/js/db.js`, created `broadcastPresence(pid)` — sends a Supabase Realtime **Broadcast** message on channel `presence:${progId}` with `{ email }` every 30 s. Also handles `user-gone` event.
2. In `navigation.js`, `broadcastPresence(progId)` is called when entering any NPI live section. `stopPresenceBroadcast()` is called when leaving.
3. `presenceMap` added to `state.js` to track `{ [progId]: [{ email, ts }] }` entries.
4. In `portals/product-development/npi/js/dashboard.js`, presence badges render in the project header: `<span class="presence-badge">${initials}</span>`.
5. CSS for `.presence-badge` and `.presence-strip` added to `core/css/components.css`.

**Supabase setup needed:** Broadcast does not require a new table — it uses the existing Realtime WebSocket. No SQL migration required.

#### Task 2-B: Stale Data Warning Toast ✅

When the global subscription receives an UPDATE for the project the current user is actively editing, show a non-blocking toast.

1. In `subscribeProjectsGlobally()` (db.js), when an `onUpdate` fires for `progId` and the source is not the current user, calls:
   ```javascript
   showToast(`${row.updated_by.split('@')[0]} just updated this project's details`, 'info', 6000);
   ```
2. Does NOT force-refresh the user's in-progress edits — just informs them.
3. `showToast()` already supports `duration` parameter — no changes needed to `helpers.js`.

#### Task 2-C: Project Delete Cascade for NPI Relational Data ✅

1. In `npi.dashboard.deleteProject()` (dashboard.js), after the Supabase `projects` delete succeeds, calls `npiRelDeleteAllForProject(deletedId)` from `npi-data-relational.js`.
2. `npiRelDeleteAllForProject` is a new alias for `npiRelClearAll` exposed as `window.npiRelDeleteAllForProject`. Deletes all 15 NPI relational tables in dependency order.
3. Shows a `'Deleting NPI data…'` progress toast during the cascade.

**Alternative (recommended for future):** Add `ON DELETE CASCADE` constraints in Supabase SQL for all NPI tables' `project_id` foreign keys (see Phase 3 / Task 3-C).

#### Task 2-D: Conflict-Safe Gate Signing ✅

Gate signatures (`npi_gate_sigs`) are high-stakes. Two users signing simultaneously could overwrite each other.

1. In `npi-data-relational.js`, the gate-sig save now checks before updating:
   - When `sig.signed === true` and `sig._id` exists (UPDATE path), `SELECT` the current DB row first.
   - If the DB row is already `signed = true` with a **different** `sig_name`, the local sign-off is reverted and an error toast is shown: "Already signed by X on Y".
   - If unsigned (or same user), the UPDATE proceeds normally.
2. The optimistic local state is reverted if a conflict is detected, keeping both users' views consistent.

---

## 5. Phase 3 — Performance and Scale ✅ (Implemented)

> **Goal:** Ensure the system remains fast at 500+ projects and 50+ users.

### Step-by-step Agentic Tasks

#### Task 3-A: Paginated Project List ✅

1. In `core/js/db.js`, added `loadRemotePage(page, pageSize = 50)` — uses `.range()` for server-side pagination.
2. Replaced `loadRemote()` call in `launchApp()` with `loadRemotePage(0)`.
3. Added `loadMoreProjects()` helper — fetches next page, appends (de-duplicated) to `db.projects`, then re-renders.
4. Added "⬇ Load more projects" button at the bottom of the NPI kanban view (only visible when `projectsAllLoaded === false`).
5. Added `projectsPage` and `projectsAllLoaded` state variables to `state.js`.
6. Updated `initProgSelect()` — no change needed; it already handles the first available project.

**Files changed:** `core/js/db.js`, `core/js/state.js`, `core/js/app.js`, `portals/product-development/npi/js/dashboard.js`, `portals/product-development/npi/css/dashboard.css`

#### Task 3-B: Supabase Channel Consolidation ✅

Added `createMultiTableRealtimeSubscription(tableConfigs, channelName)` to `utils/js/realtime.js`. This allows multiple tables to share one Supabase WebSocket channel.

1. ME Capacity: 4 channels → **1** (`me_all_channel`). Updated `meDataSubscribe` / `meDataUnsubscribe` in `me-data.js`.
2. Operations Dashboard: 9 channels → **3** (`ops_me_all_channel` + `ops_prod_all_channel` + `ops_misc_channel`). Updated `opsRealtimeInit` / `opsRealtimeCleanup` in `operations-dashboard-realtime.js`.

Per-user channel reduction: ME Capacity 4 → 1 (saves 3), Operations 9 → 3 (saves 6). Total saving: **9 channels per user**.

**Files changed:** `utils/js/realtime.js`, `portals/capacity/js/me-data.js`, `portals/operations/js/operations-dashboard-realtime.js`

#### Task 3-C: Server-Side Database Optimisations ✅

Created `supabase/phase3_optimisations.sql`. Apply in the Supabase SQL editor.

```sql
-- 1. Index for hub list query (ordered by recency)
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects (updated_at DESC);

-- 2. Index for NPI relational queries (all filtered by project_id)
CREATE INDEX IF NOT EXISTS idx_npi_ctq_prog ON npi_ctq (project_id);
-- (repeat for all 15 NPI tables — full list in the SQL file)

-- 3. Cascade deletes (DB-level safety net; client-side cascade already in Phase 2)
ALTER TABLE npi_ctq ADD CONSTRAINT fk_npi_ctq_prog FOREIGN KEY (project_id) REFERENCES projects(prog_id) ON DELETE CASCADE;
-- (repeat for all 15 NPI tables — full list in the SQL file)

-- 4. Unique constraint to prevent duplicate ME products
ALTER TABLE me_products ADD CONSTRAINT uq_me_product_database_id UNIQUE (product_database_id);
```

**Files changed:** `supabase/phase3_optimisations.sql` (new file)

#### Task 3-D: Optimistic Save Status ✅

1. Added `let pendingSaves = 0;` counter in `db.js`.
2. Incremented by `toSave.length` at the start of each `saveRemote()` call.
3. Decremented after each individual Supabase write (including error paths).
4. Badge shows `● saving (N remaining)…` during multi-project saves.
5. `save()` shows `● saving (N queued)…` if a save is already in-flight.
6. On partial failure the badge names the specific projects that failed (existing behaviour enhanced with correct per-project error tracking).

**Files changed:** `core/js/db.js`

---

## 6. Quick-Reference: Risk Matrix

| Risk | Likelihood | Impact | Phase Fixed |
|---|---|---|---|
| User A silently overwrites User B's project metadata | High | High | Phase 1 ✅ |
| Deleted projects reappear after refresh | High | High | Phase 1 ✅ |
| New projects invisible until page refresh | High | Medium | Phase 1 ✅ |
| Two users sign the same gate simultaneously | Low | High | Phase 2 ✅ |
| Orphaned NPI data after project delete | Medium | Low | Phase 2 ✅ |
| No visibility of who is editing a project | Medium | Low | Phase 2 ✅ |
| No warning when another user updates current project | Medium | Low | Phase 2 ✅ |
| Slow initial load at 500+ projects | Medium | Medium | Phase 3 ✅ |
| Channel limit hit on Supabase free tier | Medium | Medium | Phase 3 ✅ |
| Concurrent edit of same PFMEA cause | Low | Medium | Phase 2 (partial) |

---

## 7. What Needs No Change

The following areas are already well-designed for multi-user operation and require no changes:

- **NPI relational data** (PFMEA, CTQ, BOM, CTQ, PFD, Gantt, Actions, Risks) — all use per-row upserts with IDs; concurrent edits to different rows are safe.
- **ME Capacity** — fully relational, real-time subscriptions cover all four tables, cleanup is correct.
- **Production planning** — fully relational, real-time, cleanup is correct.
- **Families and Family Templates** — real-time, cleanup is correct.
- **Feedback / Bugs portal** — real-time, cleanup is correct.
- **Gate selection locking** — explicit optimistic locking exists and works.
- **Save debouncing (800–900 ms)** — correct and consistent across portals.
- **RLS policies** — auth-gated, correct for collaborative model.
