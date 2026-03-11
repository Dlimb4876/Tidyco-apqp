# ME Capacity Planning — Database Schema & Data Flow Analysis

**Date:** 2026-03-11 | **Status:** Relational DB Phase 2 Complete | **Testing:** In Progress

---

## Executive Summary

The ME Capacity system has dual-layer persistence:
- **Relational Tables** (6 tables in Supabase) — primary data store
- **JSON Blob** (`me_capacity` table) — backward compatibility backup

**Current State:** Data loads from relational first, falls back to JSON blob, and dual-writes to both during save.

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
| `created_at` | TIMESTAMP | Auto | When record created |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

**UI Data Collection** (from `me-team.js`):
```javascript
{
  id,                    // UUID (from UI or relational)
  name,                  // ✓ Text input
  hoursPerWeek,         // ✓ Number input (37.5–80)
  utilisation,          // ✓ Number input (0–100)
  jobTitle,             // ✓ Text input
  group,                // ✓ Dropdown: "—", "NPI", "Production", "NPI / Production"
  startDate,            // ✓ Date input (YYYY-MM-DD or empty string)
  endDate               // ✓ Date input (YYYY-MM-DD or empty string)
}
```

✅ **Data Alignment:** PERFECT. UI collects all fields; column names match snake_case convention.

---

### 2️⃣ **me_tasks** — Projects/Work Items

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | Foreign Key to auth.users (RLS) |
| `name` | TEXT | No | Task/project name |
| `category` | TEXT | No | "NPI" \| "Improvement" \| "Tendering" \| "Support" \| "Other" |
| `type` | TEXT | No | "root" (has PERT) \| "standard" (simple) |
| `assignee_id` | UUID | Yes | FK to me_teams.id |
| `product_id` | UUID | Yes | FK to products.id or me_products.id |
| `start_date` | DATE | No | Task start (YYYY-MM-DD, default: TODAY) |
| `end_date` | DATE | No | Task end (YYYY-MM-DD, default: TODAY) |
| `total_hours` | NUMERIC | No | For standard tasks; 0 for root (hours come from PERT) |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Data Collection** (from `me-tasks.js`):
```javascript
{
  id,                          // UUID
  name,                        // ✓ Text input
  category,                    // ✓ Dropdown (NPI, Improvement, Tendering, Support, Other)
  type,                        // ✓ Derived ("root" or "standard")
  assigneeId,                  // ✓ Dropdown (team member IDs)
  productId,                   // ✓ Dropdown (product IDs or empty)
  startDate,                   // ✓ Date input (YYYY-MM-DD, default: TODAY)
  endDate,                     // ✓ Date input (YYYY-MM-DD, default: TODAY)
  totalHours,                  // ⚠️ Number input (disabled for root tasks)
  advancedEstimation: {        // 🔶 PERT ESTIMATION OBJECT
    totalFinalHours,           // Calculated from subtasks
    confidenceLevel,           // Multiplier for std dev
    pertEstimates: [...]       // Array of PERT estimates
  },
  subtasks: [...]              // Array of subtask objects
}
```

✅ **Data Alignment:** GOOD with caveats.
- ⚠️ **ISSUE:** `type` field is **derived** — UI doesn't explicitly set it; determined by presence of `advancedEstimation.pertData`.
- ⚠️ **ISSUE:** `total_hours` is **disabled for root tasks** in UI (can't edit directly). Hours come from `advancedEstimation.totalFinalHours`.
- ⚠️ **ISSUE:** UI uses `advancedEstimation` object which is **NOT stored in relational tables** directly — broken into `me_task_subtasks` and `me_task_pert_history`.

---

### 3️⃣ **me_task_subtasks** — PERT Subtasks (child records)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field (must include in insert) |
| `task_id` | UUID | No | FK to me_tasks.id (CASCADE delete) |
| `name` | TEXT | No | Subtask name |
| `assignee_id` | UUID | Yes | FK to me_teams.id |
| `hours` | NUMERIC | No | Estimated hours for this subtask |
| `start_date` | DATE | No | Subtask start (default: parent task start) |
| `end_date` | DATE | No | Subtask end (default: parent task end) |
| `source` | TEXT | No | "pert" \| other (for future use) |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Data Collection** (from advanced estimation modal):
```javascript
// Collected from UI but stored as advancedEstimation.pertEstimates:
{
  id,            // UUID
  name,          // ✓ Estimate name (e.g., "Design", "Development", "Testing")
  assigneeId,    // ✓ Team member ID
  hours,         // ✓ Total hours
  startDate,     // ✓ Inherits from parent task
  endDate,       // ✓ Inherits from parent task
  source: 'pert' // Hard-coded in code
}
```

✅ **Data Alignment:** GOOD
- Subtasks correctly linked to parent task via `task_id`.
- `user_id` **MUST** be included in inserts for RLS policy to work.
- Start/end dates inherit from parent (subtasks don't have independent dates in UI).

---

### 4️⃣ **me_task_pert_history** — PERT Estimates (3-point estimation)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field (must include in insert) |
| `task_id` | UUID | No | FK to me_tasks.id (CASCADE delete) |
| `estimate_id` | UUID | Yes | Back-reference to which estimate |
| `name` | TEXT | No | Estimate name |
| `optimistic` | NUMERIC | No | Optimistic hours (O) |
| `most_likely` | NUMERIC | No | Most likely hours (ML) |
| `pessimistic` | NUMERIC | No | Pessimistic hours (P) |
| `confidence_level` | NUMERIC | No | Z-score multiplier (1.0 = 50%, 2.0 = 95%) |
| `final_hours` | NUMERIC | No | Calculated: PERT + (StdDev × (confidence - 1)) |
| `assignee_id` | UUID | Yes | FK to me_teams.id |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Data Collection** (from advanced estimation modal):
```javascript
// In advancedEstimation.pertData.estimates:
{
  id,                 // UUID
  name,              // ✓ Estimate name
  optimistic,        // ✓ O (hours)
  mostLikely,        // ✓ ML (hours) — note camelCase in UI!
  pessimistic,       // ✓ P (hours)
  assignedTo,        // ⚠️ UI uses 'assignedTo', DB expects 'assignee_id'
  finalHours         // Calculated
}
```

⚠️ **DATA MISMATCH FOUND:**
- **UI field name:** `mostLikely`, **Database column:** `most_likely` ✓ (handled in relational layer)
- **UI field name:** `assignedTo`, **Database column:** `assignee_id` 🔴 **POTENTIAL BUG**
  - In `me-data-relational.js` line 406: `assignee_id: est.assignedTo || null`
  - Should be consistent; check if UI actually uses `assignedTo` or `assigneeId`

---

### 5️⃣ **me_products** — Product Support Records

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field |
| `product_database_id` | UUID | No | FK to products.id (product master table) |
| `support_from` | DATE | No | Support start date (YYYY-MM-DD) |
| `support_until` | DATE | No | Support end date (YYYY-MM-DD) |
| `hours_per_week` | NUMERIC | No | Ongoing support hours per week |
| `notes` | TEXT | Yes | Support notes |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Data Collection** (from `me-products.js`):
```javascript
{
  id,                      // UUID
  name,                    // ✓ From products table (JOIN)
  code,                    // ✓ From products table (JOIN)
  family,                  // ✓ From products table (JOIN)
  productId,              // Foreign key to products table
  supportFrom,            // ✓ Date input (YYYY-MM-DD)
  supportUntil,           // ✓ Date input (YYYY-MM-DD)
  hoursPerWeek,           // ✓ Number input (0+)
  notes                   // ✓ Text input (optional)
}
```

✅ **Data Alignment:** GOOD
- Products auto-synced from Product Management (status = "Production").
- Relational layer correctly extracts product details via JOIN.
- UI receives flattened product object; DB stores normalized reference.

---

### 6️⃣ **me_holidays** — Holiday Records

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary Key |
| `user_id` | UUID | No | RLS field |
| `person_id` | UUID | No | FK to me_teams.id |
| `date` | DATE | No | Holiday date (YYYY-MM-DD) |
| `type` | TEXT | No | "full" \| "half" |
| `created_at` | TIMESTAMP | Auto | When created |
| `updated_at` | TIMESTAMP | Auto | Last update |

**UI Data Collection** (from `me-holidays.js`):
```javascript
{
  id,         // UUID
  personId,   // ✓ Team member ID (used as key)
  date,       // ✓ YYYY-MM-DD
  type        // ✓ "full" | "half"
}
```

✅ **Data Alignment:** PERFECT
- Matrix UI: click cells to cycle through "—" → "F" (full) → "H" (half) → remove.
- Data matches exactly.
- Bank holidays are read-only (handled separately by helper function).

---

## JSON Blob Fallback: `me_capacity` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | RLS field (unique) |
| `data` | JSONB | Nested structure (see below) |
| `updated_at` | TIMESTAMP | Last update |

**JSON Structure:**
```json
{
  "user_id": "uuid",
  "data": {
    "team": [
      { "id", "name", "hoursPerWeek", "utilisation", "jobTitle", "group", "startDate", "endDate" }
    ],
    "tasks": [
      { "id", "name", "category", "type", "assigneeId", "productId", "startDate", "endDate", "totalHours", "advancedEstimation", "subtasks" }
    ],
    "products": [
      { "id", "name", "supportFrom", "supportUntil", "hoursPerWeek", "notes", "productDatabaseId" }
    ],
    "holidays": [
      { "id", "personId", "date", "type" }
    ]
  },
  "updated_at": "ISO timestamp"
}
```

---

## Data Flow Diagram

```
┌─────────────────┐
│   UI Input      │
├─────────────────┤
│ me-tasks.js     │
│ me-team.js      │
│ me-products.js  │
│ me-holidays.js  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Global Data State (meDataState)    │
│  {team, tasks, products, holidays}  │
└────────┬────────────────────────────┘
         │
    meDataSave()
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌────────────────────┐              ┌──────────────────────────┐
│ RELATIONAL TABLES  │              │  JSON BLOB FALLBACK      │
├────────────────────┤              │  (me_capacity table)     │
│ • me_teams         │              └──────────────────────────┘
│ • me_tasks         │
│ • me_task_subtasks │  (Dual-write)
│ • me_task_pert_history
│ • me_products      │
│ • me_holidays      │
└────────────────────┘

(On load: Try relational → fallback to JSON)
(On save: Write to both simultaneously)
```

---

## ⚠️ Identified Conflicts & Issues

### **CRITICAL ISSUES**

#### 1. **PERT Confidence Level Not Passed to DB** ❌
- **Location:** `me-data-relational.js` line 556
- **Issue:** When saving PERT history, `confidenceLevel` is passed from `advancedEstimation.pertData.confidenceLevel` but the data may not have this field if old format.
- **Impact:** Calculations use default or missing value.
- **Fix Needed:** Verify confidence level is always captured in UI.

---

#### 2. **Task Type Derivation Is Implicit** ⚠️
- **Location:** `me-data.js` line 465-466
- **Issue:** `type` is set to "root" only if `advancedEstimation && advancedEstimation.pertData` exists. Otherwise "standard".
- **Problem:** If a task starts as standard and user adds PERT later, type must be updated explicitly.
- **Impact:** Tasks may not sort/calculate correctly if type is wrong.
- **Recommendation:** Add explicit type field to UI or ensure type is always set correctly on PERT addition.

---

#### 3. **Root Task Hours Are Read-Only in UI** 🔶
- **Location:** `me-tasks.js` line 71
- **Issue:** Hours field is **disabled** for root tasks (`disabled title="Edit hours via PERT estimation"`).
- **Problem:** User can only edit hours via PERT modal, not directly. Good UX but may confuse users.
- **Database:** `total_hours` is stored but **ignored for root tasks**; used only for standard tasks.
- **Recommendation:** Clear documentation on UI that root task hours come from PERT estimation only.

---

#### 4. **Subtask Start/End Dates Are Fixed to Parent** 🔶
- **Location:** `me-data-relational.js` line 351-352
- **Issue:** Subtask dates are **always set to parent task's dates**:
  ```javascript
  start_date: st.startDate || todayStr,
  end_date: st.endDate || todayStr,
  ```
  But UI passes parent dates (line in me-tasks.js shows inheriting from parent).
- **Problem:** Subtasks cannot have independent date ranges; they're locked to parent.
- **Impact:** If parent task is Jan 1–31, all subtasks must fit in that window (correct behavior for PERT).
- **Recommendation:** This is likely intentional design; verify it's documented.

---

#### 5. **Product Auto-Sync Removes Manual Products** ⚠️
- **Location:** `me-data.js` line 291-298
- **Issue:** `meDataAutoSyncProductionProducts()` **DELETES** products that don't have `productDatabaseId`.
  ```javascript
  return meDataState.products.filter(meP => {
    if (!meP.productDatabaseId) {
      return false;  // ← Removes products without DB link
    }
    return pmMap[meP.productDatabaseId] !== undefined;
  });
  ```
- **Problem:** If user manually adds a product (no database ID), it **disappears** on sync!
- **Impact:** Data loss; user's custom products are silently deleted.
- **Fix:** Either (a) preserve manual products, or (b) prevent manual product entry and only allow DB sync.

---

#### 6. **Holiday Unique Constraint Not Enforced** ⚠️
- **Location:** `me-data.js` line 309-312
- **Issue:** When adding a holiday, code checks for existing `(personId, date)` pair:
  ```javascript
  const existing = meDataState.holidays.find(h => h.personId === personId && h.date === date);
  if (existing) {
    existing.type = type;  // Update instead of insert
    return true;
  }
  ```
- **Problem:** This is **client-side only**. Database has no unique constraint on `(user_id, person_id, date)`.
- **Impact:** Concurrent updates could create duplicate holiday records.
- **Fix Needed:** Add unique constraint to `me_holidays` table on `(user_id, person_id, date)`.

---

#### 7. **Assignee ID Field Name Mismatch** 🔴
- **Location:** `me-data-relational.js` line 406
- **Issue:** PERT estimate uses `est.assignedTo` but database column is `assignee_id`:
  ```javascript
  assignee_id: est.assignedTo || null
  ```
- **Problem:** If UI collects `assigneeId` (camelCase, as in other parts), this mapping breaks.
- **Need to Verify:** Check what the UI actually sends for PERT estimates.

---

### **DATA TYPE MISMATCHES**

| Field | UI Type | DB Type | Conflict? |
|-------|---------|---------|-----------|
| `hoursPerWeek` | Number | NUMERIC | ✓ OK (parsed) |
| `utilisation` | Number (0-100) | NUMERIC | ✓ OK (no %) symbol in DB) |
| `hours` (task) | Number | NUMERIC | ✓ OK |
| `date` (holiday) | YYYY-MM-DD string | DATE | ✓ OK |
| `startDate`, `endDate` | YYYY-MM-DD string | DATE | ✓ OK (default: TODAY) |
| `category` | Dropdown (5 options) | TEXT | ✓ OK (enum in UI only, not DB constraint) |
| `type` | Enum ("root"/"standard") | TEXT | ✓ OK |
| `personId` | UUID | UUID | ✓ OK |

---

### **MISSING DATABASE CONSTRAINTS**

| Constraint | Status | Impact |
|-----------|--------|--------|
| Unique `(user_id, person_id, date)` on `me_holidays` | ❌ Missing | Duplicate holidays possible |
| Unique `(user_id, product_database_id)` on `me_products` | ❌ Missing | Duplicate product support records |
| Check `hours_per_week > 0` on `me_teams` | ❌ Missing | Allows invalid data |
| Check `utilisation between 0 and 100` on `me_teams` | ❌ Missing | Allows invalid utilisation % |
| Check `start_date <= end_date` on `me_tasks` | ❌ Missing | Invalid date ranges possible |
| Foreign key `assignee_id` → `me_teams(id)` on `me_tasks` | ❌ Missing | Orphaned tasks if team member deleted |
| Foreign key `product_id` → products(id) on `me_tasks` | ❌ Missing | Orphaned task-product links |

---

## Relational Save Process (meDataSave)

1. **Dual-write Phase** (`me-data.js` line 507-596):
   - Iterate all team members → `meSaveTeamRelational()`
   - Iterate all tasks → `meSaveTaskRelational()`
     - For root tasks with subtasks: `meSaveTaskSubtasksRelational()`
     - For root tasks with PERT: `meSaveTaskPertHistoryRelational()`
   - Iterate all products → `meSaveProductRelational()`
   - Iterate all holidays → `meSaveHolidayRelational()`

2. **JSON Blob Backup** (`me-data.js` line 598-644):
   - Fetch existing record → determine insert vs update
   - Write full nested structure to `me_capacity.data` JSONB column

3. **Status Reporting**:
   - ✓ Both succeed → `'saved (relational + JSON)'`
   - ⚠️ Relational fails, JSON succeeds → `'saved (backup mode)'`
   - ❌ Both fail → Error badge

---

## Relational Load Process (meDataInit)

1. **Phase 1: Relational First** (`me-data.js` line 369-396):
   - Try `meLoadRelationalTeams()`, `meLoadRelationalTasks()`, etc.
   - If ANY data loaded, use relational data and skip JSON

2. **Phase 2: JSON Fallback** (`me-data.js` line 399-452):
   - If relational empty, query `me_capacity` JSON blob
   - Handle nested structure: `data.team`, `data.tasks`, etc.
   - Also handles flat structure for migration

3. **Phase 3: Auto-Migration** (`me-data.js` line 433-449):
   - If loaded from JSON, automatically migrate to relational
   - Call `meMigrateJsonToRelational()` in background

4. **Phase 4: Backward Compatibility** (`me-data.js` line 455-472):
   - Ensure all objects have required fields:
     - Team: `jobTitle`, `group`, `startDate`, `endDate`
     - Tasks: `advancedEstimation`, `type`, `subtasks`
     - Products: `productDatabaseId`
   - Convert old PERT structure to new subtasks format

---

## Testing Checklist

- [ ] Load team with all fields (name, hours, util, job title, group, dates)
- [ ] Load tasks with PERT estimation and verify subtasks load
- [ ] Load products and verify JOIN with products table works
- [ ] Load holidays and verify (personId, date) uniqueness
- [ ] Save changes and verify both relational + JSON blob updated
- [ ] Test fallback: disable relational, verify JSON loads
- [ ] Test migration: add JSON-only user, verify relational auto-migration
- [ ] Test PERT confidence level saves correctly
- [ ] Test duplicate holiday prevention (should update, not insert)
- [ ] Test product sync removes old manual products (document behavior)
- [ ] Verify RLS policies prevent cross-user data access

---

## Summary Table: UI ↔ Database Mapping

| Component | UI Field | DB Column | Status | Notes |
|-----------|----------|-----------|--------|-------|
| **TEAM** | | | | |
| | `name` | `name` | ✓ | Direct |
| | `hoursPerWeek` | `hours_per_week` | ✓ | Parsed |
| | `utilisation` | `utilisation` | ✓ | Direct (0-100) |
| | `jobTitle` | `job_title` | ✓ | Parsed |
| | `group` | `team_group` | ✓ | Parsed |
| | `startDate` | `start_date` | ✓ | DATE format |
| | `endDate` | `end_date` | ✓ | DATE format |
| **TASK** | | | | |
| | `name` | `name` | ✓ | Direct |
| | `category` | `category` | ✓ | Direct |
| | `type` | `type` | ⚠️ | Derived from advancedEstimation |
| | `assigneeId` | `assignee_id` | ✓ | UUID |
| | `productId` | `product_id` | ✓ | UUID |
| | `startDate` | `start_date` | ✓ | DATE (default TODAY) |
| | `endDate` | `end_date` | ✓ | DATE (default TODAY) |
| | `totalHours` | `total_hours` | ⚠️ | Ignored for root tasks |
| **SUBTASK** | | | | |
| | `name` | `name` | ✓ | Direct |
| | `assigneeId` | `assignee_id` | ✓ | UUID |
| | `hours` | `hours` | ✓ | NUMERIC |
| | (inherited) | `start_date` | ✓ | From parent |
| | (inherited) | `end_date` | ✓ | From parent |
| **PERT EST.** | | | | |
| | `name` | `name` | ✓ | Direct |
| | `optimistic` | `optimistic` | ✓ | NUMERIC |
| | `mostLikely` | `most_likely` | ✓ | Parsed |
| | `pessimistic` | `pessimistic` | ✓ | NUMERIC |
| | `assignedTo` | `assignee_id` | 🔴 | **Verify field name!** |
| | `finalHours` | `final_hours` | ✓ | Calculated |
| **PRODUCT** | | | | |
| | `name` | (products.name) | ✓ | From JOIN |
| | `supportFrom` | `support_from` | ✓ | DATE |
| | `supportUntil` | `support_until` | ✓ | DATE |
| | `hoursPerWeek` | `hours_per_week` | ✓ | NUMERIC |
| | `notes` | `notes` | ✓ | TEXT |
| **HOLIDAY** | | | | |
| | `personId` | `person_id` | ✓ | UUID |
| | `date` | `date` | ✓ | DATE |
| | `type` | `type` | ✓ | "full"\|"half" |

---

## Recommendations

### High Priority
1. **Add database constraints** for data integrity (unique, check, FK)
2. **Fix product sync logic** to preserve or reject manual products (not delete silently)
3. **Verify PERT assignee field name** (`assignedTo` vs `assigneeId`)
4. **Document task type derivation** and when it changes

### Medium Priority
5. **Implement unique constraint** on `me_holidays` (user_id, person_id, date)
6. **Add explicit task type field** to UI (don't rely on implicit derivation)
7. **Test relational save/load thoroughly** before Phase 4 cutover

### Low Priority
8. Document subtask date inheritance behavior
9. Add UI hint about root task hours coming from PERT
10. Consider preventing manual product entry (DB-only sync)
