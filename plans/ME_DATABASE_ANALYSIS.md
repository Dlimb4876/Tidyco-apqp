# ME Capacity Planning — Database Schema & Data Flow Analysis

**Date:** 2026-03-13 | **Status:** Relational DB Active — PERT persistence fixed 2026-03-13 | **Testing:** Needed

---

## Executive Summary

The ME Capacity system uses **relational Supabase tables only**. The legacy JSON blob (`me_capacity` table) is no longer written to and no longer read from — the migration to relational is complete.

All six relational tables are active and connected. The PERT estimation UI (`me-estimation-page.js`) is currently **not loaded** in `index.html` — the feature is dormant but the file and DB tables are intentionally preserved for future reactivation. The save/load code for subtasks and PERT history is in place and will work as soon as the estimation page is re-added to the script load order.

---

## Database Tables & Expected Schema

### 1️⃣ **me_teams** — Team Members

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key (auto-generated) |
| `user_id` | UUID | No | Foreign Key to auth.users (RLS field) |
| `name` | TEXT | No | Team member full name |
| `hours_per_week` | NUMERIC | No | Default: 37.5 |
| `utilisation` | NUMERIC | No | 0-100%, Default: 80 |
| `job_title` | TEXT | Yes | Job title (e.g., "Engineer", "Manager") |
| `team_group` | TEXT | Yes | "NPI" \| "Production" \| "NPI / Production" \| NULL |
| `start_date` | DATE | Yes | When person started (YYYY-MM-DD) |
| `end_date` | DATE | Yes | When person left (YYYY-MM-DD) |
| `department` | TEXT | Yes | "ME" \| "PM" |
| `created_at` | TIMESTAMP | Auto | When record created |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

**UI Field Mapping** (from `me-team.js`):
```javascript
{
  id,            // UUID
  name,          // → name
  hoursPerWeek,  // → hours_per_week
  utilisation,   // → utilisation
  jobTitle,      // → job_title
  group,         // → team_group
  startDate,     // → start_date
  endDate,       // → end_date
  department     // → department
}
```

✅ **Status: WORKING — Full round-trip save and load confirmed.**

---

### 2️⃣ **me_tasks** — Projects/Work Items

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | FK to auth.users (RLS) |
| `name` | TEXT | No | Task/project name |
| `category` | TEXT | No | "NPI" \| "Improvement" \| "Tendering" \| "Support" \| "Other" |
| `type` | TEXT | No | "root" (has PERT) \| "standard" (simple) |
| `assignee_id` | UUID | Yes | FK to me_teams.id |
| `product_id` | UUID | Yes | FK to me_products.id |
| `start_date` | DATE | No | Task start (YYYY-MM-DD) |
| `end_date` | DATE | No | Task end (YYYY-MM-DD) |
| `total_hours` | NUMERIC | No | Hours (from PERT for root tasks, direct for standard) |
| `department` | TEXT | Yes | "ME" \| "PM" |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Field Mapping** (from `me-tasks.js`):
```javascript
{
  id,              // → id
  name,            // → name
  category,        // → category
  type,            // → type  ✅ (fixed 2026-03-13)
  assigneeId,      // → assignee_id
  productId,       // → product_id
  startDate,       // → start_date
  endDate,         // → end_date
  totalHours,      // → total_hours
  department       // → department
  // advancedEstimation → me_task_pert_history  ✅ (fixed 2026-03-13)
  // subtasks → me_task_subtasks               ✅ (fixed 2026-03-13)
}
```

✅ **Status: WORKING — Type field and PERT hours now correctly persisted. (Fixed 2026-03-13)**

---

### 3️⃣ **me_task_subtasks** — PERT Subtasks

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | RLS field |
| `task_id` | UUID | FK to me_tasks.id |
| `name` | TEXT | Subtask name |
| `assignee_id` | UUID | FK to me_teams.id |
| `hours` | NUMERIC | Estimated hours |
| `start_date` | DATE | Inherits from parent |
| `end_date` | DATE | Inherits from parent |
| `source` | TEXT | "pert" |

✅ **Status: ACTIVE — Written and read by `meSaveTaskSubtasksRelational` / `meLoadRelationalTasks`. (Fixed 2026-03-13)**

---

### 4️⃣ **me_task_pert_history** — PERT 3-Point Estimates

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | RLS field |
| `task_id` | UUID | FK to me_tasks.id |
| `estimate_id` | UUID | Back-reference to estimate |
| `name` | TEXT | Estimate name |
| `optimistic` | NUMERIC | O hours |
| `most_likely` | NUMERIC | ML hours |
| `pessimistic` | NUMERIC | P hours |
| `confidence_level` | NUMERIC | Z-score multiplier |
| `final_hours` | NUMERIC | Calculated result |
| `assignee_id` | UUID | FK to me_teams.id |

✅ **Status: ACTIVE — Written and read by `meSaveTaskSubtasksRelational` / `meLoadRelationalTasks`. (Fixed 2026-03-13)**

---

### 5️⃣ **me_products** — Product Support Records

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field |
| `product_database_id` | UUID | No | FK to products.id |
| `support_from` | DATE | No | Support start date |
| `support_until` | DATE | No | Support end date |
| `hours_per_week` | NUMERIC | No | Weekly support hours |
| `notes` | TEXT | Yes | Support notes |
| `department` | TEXT | Yes | "ME" \| "PM" |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Field Mapping** (from `me-products.js`):
```javascript
{
  id,                  // → id
  productDatabaseId,   // → product_database_id
  supportFrom,         // → support_from
  supportUntil,        // → support_until
  hoursPerWeek,        // → hours_per_week
  notes,               // → notes
  department           // → department
}
```

✅ **Status: WORKING — Full round-trip save and load confirmed.**

> ⚠️ See Issue #3 — auto-sync silently removes any product without a `productDatabaseId`.

---

### 6️⃣ **me_holidays** — Holiday Records

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field |
| `person_id` | UUID | No | FK to me_teams.id |
| `date` | DATE | No | Holiday date (YYYY-MM-DD) |
| `type` | TEXT | No | "full" \| "half" |
| `department` | TEXT | Yes | "ME" \| "PM" |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**Save strategy:** Delete all rows globally, then re-insert the full current state. This avoids duplicate key issues in the collaborative model.

✅ **Status: WORKING — Delete-all-then-reinsert strategy handles concurrency safely.**

---

## Data Flow (Current Reality)

```
┌─────────────────┐
│   UI Input      │
├─────────────────┤
│ me-tasks.js     │
│ me-team.js      │
│ me-products.js  │
│ me-holidays.js  │
│ me-estimation-  │
│   page.js       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Global Data State (meDataState)                    │
│  { team[], tasks[], products[], holidays[] }        │
│                                                     │
│  task.subtasks[]              ← in memory only      │
│  task.advancedEstimation.*    ← in memory only      │
└────────┬────────────────────────────────────────────┘
         │
    meDataSave()  (debounced 900ms)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  RELATIONAL TABLES (Supabase)                       │
├─────────────────────────────────────────────────────┤
│  ✅ me_teams              (full read/write)         │
│  ⚠️  me_tasks             (type field buggy)        │
│  ✅  me_task_subtasks     (delete+reinsert)          │
│  ✅  me_task_pert_history (delete+reinsert)          │
│  ✅ me_products           (full read/write)         │
│  ✅ me_holidays           (delete+reinsert)         │
└─────────────────────────────────────────────────────┘

  me_capacity (JSON blob) — NO LONGER USED
```

---

## Bugs & Issues

### ~~**BUG #1 — Task type always overwritten to "standard" on save and load**~~ ✅ FIXED 2026-03-13

- **Fix:** `meLoadRelationalTasks` now reads `t.type || 'standard'` from DB. `meSaveTaskRelational` update payload now uses `task.type || 'standard'`.

---

### ~~**BUG #2 — PERT/subtask data never saved to the database**~~ ✅ FIXED 2026-03-13

- **Fix:** New `meSaveTaskSubtasksRelational()` writes subtasks to `me_task_subtasks` and 3-point estimates to `me_task_pert_history` after every task save. `meLoadRelationalTasks` now fetches both tables in parallel and reconstructs `task.subtasks` and `task.advancedEstimation` on load. `total_hours` on root tasks now stores the PERT-calculated figure.

---

### **Issue #3 — Product auto-sync silently removes manually-added products** ⚠️

- **File:** `me-data.js` line ~313
- **Problem:** `meDataAutoSyncProductionProducts()` filters out any product where `productDatabaseId` is falsy. If a product record exists in memory without a DB link, it is silently deleted during sync.
- **Impact:** Any product added without going through the product master will disappear on next sync without warning.
- **Fix:** Either (a) preserve manual products and exclude them from sync filtering, or (b) make the UI prevent adding products without a DB link and document that only synced products are supported.

---

### ~~**Issue #4 — Task type derivation broken by Bug #1**~~ ✅ FIXED 2026-03-13

Resolved as a consequence of fixing Bug #1.

---

### ~~**Issue #5 — Root task hours stale after reload**~~ ✅ FIXED 2026-03-13

Resolved as a consequence of fixing Bug #2. `meSaveTaskRelational` now writes `advancedEstimation.totalFinalHours` to `total_hours` for root tasks.

---

### **Issue #6 — `assignedTo` vs `assigneeId` naming inconsistency** 🔶

- **Files:** `me-estimation-page.js` (uses `assignedTo`), `me-data.js` and `me-calculations.js` (use `assigneeId`)
- **Problem:** PERT estimate objects use `est.assignedTo` internally in the estimation page, then map to `assigneeId` at save time (line 473). This conversion works but is inconsistent and fragile.
- **Impact:** Low risk currently, but easy to break if the mapping step is missed in future changes.
- **Fix:** Standardise on `assigneeId` throughout or document the boundary explicitly.

---

### **Issue #7 — Missing database constraints** ⚠️

| Constraint | Status | Impact |
|-----------|--------|--------|
| Unique `(person_id, date)` on `me_holidays` | ❌ Missing | Delete-all-reinsert strategy works around this, but duplicates possible if code changes |
| Unique `(product_database_id)` on `me_products` | ❌ Missing | Duplicate support records possible on concurrent adds |
| Check `hours_per_week > 0` on `me_teams` | ❌ Missing | Invalid data allowed |
| Check `utilisation between 0 and 100` on `me_teams` | ❌ Missing | Invalid utilisation % allowed |
| Check `start_date <= end_date` on `me_tasks` | ❌ Missing | Invalid date ranges allowed |

---

## Summary: UI ↔ Database Mapping

| Component | UI Field | DB Column | Status |
|-----------|----------|-----------|--------|
| **TEAM** | `name` | `name` | ✅ |
| | `hoursPerWeek` | `hours_per_week` | ✅ |
| | `utilisation` | `utilisation` | ✅ |
| | `jobTitle` | `job_title` | ✅ |
| | `group` | `team_group` | ✅ |
| | `startDate` | `start_date` | ✅ |
| | `endDate` | `end_date` | ✅ |
| | `department` | `department` | ✅ |
| **TASK** | `name` | `name` | ✅ |
| | `category` | `category` | ✅ |
| | `type` | `type` | ✅ Fixed 2026-03-13 |
| | `assigneeId` | `assignee_id` | ✅ |
| | `productId` | `product_id` | ✅ |
| | `startDate` | `start_date` | ✅ |
| | `endDate` | `end_date` | ✅ |
| | `totalHours` | `total_hours` | ✅ PERT hours now persisted correctly |
| | `subtasks[]` | `me_task_subtasks` | ✅ Fixed 2026-03-13 |
| | `advancedEstimation` | `me_task_pert_history` | ✅ Fixed 2026-03-13 |
| **PRODUCT** | `productDatabaseId` | `product_database_id` | ✅ |
| | `supportFrom` | `support_from` | ✅ |
| | `supportUntil` | `support_until` | ✅ |
| | `hoursPerWeek` | `hours_per_week` | ✅ |
| | `notes` | `notes` | ✅ |
| **HOLIDAY** | `personId` | `person_id` | ✅ |
| | `date` | `date` | ✅ |
| | `type` | `type` | ✅ |

---

## Action Checklists

### ~~🔴~~ ✅ Priority 1 — Fix PERT Data Loss (Bugs #1 and #2) — COMPLETE 2026-03-13

- [x] **Fix load — restore task type from DB**
  - `me-data-relational.js`: `meLoadRelationalTasks` now reads `t.type || 'standard'`

- [x] **Fix save — use actual task type, not hardcoded**
  - `me-data-relational.js`: Update payload now uses `task.type || 'standard'`

- [x] **Add subtask save — write `task.subtasks` to `me_task_subtasks`**
  - `me-data-relational.js`: New `meSaveTaskSubtasksRelational()` deletes and re-inserts subtasks and PERT history. Called from `meSaveTaskRelational` after every successful task save.

- [x] **Add subtask load — read `me_task_subtasks` and attach to tasks**
  - `me-data-relational.js`: `meLoadRelationalTasks` now fetches tasks, subtasks, and PERT history in parallel. Groups by `task_id`, reconstructs `task.subtasks` and `task.advancedEstimation` on load. Sets `type: 'root'` when subtasks or PERT history exist.

- [ ] **Verify PERT hours survive a full save-refresh-load cycle** ← test when estimation UI is reactivated
  - Re-add `me-estimation-page.js` to `index.html` load order, create a PERT task, save, refresh, confirm hours and subtasks are intact

---

### ⚠️ Priority 2 — Fix Product Auto-Sync Behaviour (Issue #3)

- [ ] **Decide and document the product entry rule**
  - Option A: Only synced products are supported → Add a UI warning when trying to add without a DB link; update help text
  - Option B: Preserve manual products → Change the filter in `meDataAutoSyncProductionProducts` to keep products where `!productDatabaseId`

- [ ] **If choosing Option A:** Add a guard in `meDataAddProduct` to prevent adding without a `productDatabaseId`
- [ ] **If choosing Option B:** Update filter logic in `me-data.js` around line 313

---

### 🔶 Priority 3 — Clean Up Naming Inconsistency (Issue #6)

- [ ] **Standardise PERT estimate objects to use `assigneeId`** throughout
  - File: `me-estimation-page.js` — change `est.assignedTo` to `est.assigneeId` in all occurrences
  - Update the `assignedTo: ''` default in `addEstimate()` (line ~305) to `assigneeId: ''`
  - Update the select `onchange` handler (line ~243) to set `assigneeId` not `assignedTo`
  - Update the `find(e => e.assignedTo)` reference (line ~486) to `assigneeId`

---

### 🔶 Priority 4 — Add Database Constraints (Issue #7)

Run these as Supabase SQL migrations:

- [ ] **Add unique constraint on holidays**
  ```sql
  ALTER TABLE me_holidays
    ADD CONSTRAINT me_holidays_person_date_unique UNIQUE (person_id, date);
  ```

- [ ] **Add unique constraint on products**
  ```sql
  ALTER TABLE me_products
    ADD CONSTRAINT me_products_product_db_id_unique UNIQUE (product_database_id);
  ```

- [ ] **Add check constraints on me_teams**
  ```sql
  ALTER TABLE me_teams
    ADD CONSTRAINT me_teams_hours_positive CHECK (hours_per_week > 0),
    ADD CONSTRAINT me_teams_utilisation_range CHECK (utilisation >= 0 AND utilisation <= 100);
  ```

- [ ] **Add check constraint on me_tasks dates**
  ```sql
  ALTER TABLE me_tasks
    ADD CONSTRAINT me_tasks_date_order CHECK (start_date <= end_date);
  ```

---

### ✅ Verification Checklist (Run after fixes)

- [ ] Create a standard task, save, refresh — task appears with correct name/hours/assignee
- [ ] Create a root (PERT) task, add estimates, save, refresh — task shows as root with subtasks intact
- [ ] Edit a PERT task estimate, save, refresh — updated hours are reflected correctly
- [ ] Delete a PERT task — confirm it disappears from capacity chart
- [ ] Add a team member, save, refresh — member appears in lists
- [ ] Add a holiday (full and half day), save, refresh — holidays appear on calendar
- [ ] Add a product, save, refresh — product appears in product list
- [ ] Trigger product auto-sync — verify desired products are kept and unwanted ones removed
- [ ] Check capacity chart shows correct hours after PERT task refresh
