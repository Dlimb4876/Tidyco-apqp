# Plan: ME Capacity - Bottom-Up Execution & EVM Integration

**Created:** 2026-03-24  
**Priority:** High (Next-Gen Resource Management)  
**Status:** Proposed  

## 1. Executive Summary
Currently, ME Capacity uses top-down "Budget Buckets" (e.g., 400 hours for a project). Planners lack visibility into actual burn rates and remaining effort. 

This plan introduces **Earned Value Management (EVM)** to the ME Capacity portal. By linking macro capacity tasks to micro engineering actions and introducing lightweight time-tracking, the capacity engine will automatically transition from a static budget tracker to a self-correcting forecasting engine.

## 2. Architecture & Data Flow

The system bridges the gap between the Planner's view (ME Capacity) and the Engineer's view (Action Centre).

```text
========================================================================
                         SYSTEM ARCHITECTURE
========================================================================

      [ PLANNER DOMAIN ]                   [ ENGINEER DOMAIN ]
      ME Capacity Portal                      Action Centre
   +----------------------+               +----------------------+
   | me_tasks             |               | npi_actions          |
   | (The Budget Bucket)  |<--- Links --- | (The Deliverables)   |
   |                      |               |                      |
   | - id                 |               | - id                 |
   | - totalHours (BAC)   |               | - me_task_id (FK)    |
   | - percent_complete   |               | - status             |
   +----------------------+               +----------------------+
             |                                       |
             | 1:N                                   | 1:N
             v                                       v
   +---------------------------------------------------------+
   | time_logs (The Actuals)                                 |
   | - id                                                    |
   | - user_id                                               |
   | - me_task_id (or npi_action_id)                         |
   | - hours_logged                                          |
   | - log_date                                              |
   +---------------------------------------------------------+
```

## 3. The Math (Simplified EVM)

Under the hood, the capacity calculations will use the following logic to self-correct the ME chart and heatmaps:

1. **BAC (Budget At Completion):** `me_tasks.totalHours`. The original time allocated.
2. **Actuals:** `SUM(time_logs.hours_logged)`. The time burned to date.
3. **% Complete:** `me_tasks.percent_complete`. Engineer's estimate of progress.
4. **EV (Earned Value):** `BAC * (% Complete / 100)`. The hours *earned* based on progress.
5. **ETC (Estimate To Complete):** `BAC - EV`. The *Remaining Demand* that impacts future capacity.
6. **EAC (Estimate At Completion):** `Actuals + ETC`. The new total forecasted time.

*Example:* A 100h task is 25% complete. EV = 25h. ETC = 75h. If the engineer has already logged 40h (Actuals), the EAC is 115h (a 15h overrun).

## 4. User Experience (UX) Integrations

### 4.1 The Engineer's View (Action Centre)
Engineers need zero friction. They shouldn't have to fill out complex timesheets. We append a small "Log Time" widget to their existing actions.

```text
========================================================================
                     ACTION CENTRE (Engineer View)
========================================================================

 [Task] Draft PFMEA for Sub-assembly A 
 [Link] 🔗 Capacity Bucket: NPI Project X (ME)

 +------------------------------------------------------------------+
 | Status: [ In Progress v ]             Assigned to: [ J. Smith ]  |
 |                                                                  |
 | Progress:  [████████░░░░░░░░░░░░] 40%                            |
 |                                                                  |
 | Log Time:  [ 4.0 ] hrs  on [ 2026-03-25 ]        [ ⏱️ Submit ]    |
 +------------------------------------------------------------------+
 | Recent Logs:                                                     |
 | - 2.5 hrs on Mar 24 (J. Smith)                                   |
 +------------------------------------------------------------------+
```

### 4.2 The Planner's View (ME Capacity Tasks)
The task table is upgraded from static data to an actionable diagnostic tool highlighting overruns.

```text
========================================================================
                      ME CAPACITY (Planner View)
========================================================================

 ME TASKS & DEMAND
 +----------------+------+---------+---------+-------+-----------------+
 | Task Name      | BAC  | Actuals | Progress| EAC   | Variance Status |
 +----------------+------+---------+---------+-------+-----------------+
 | NPI Project X  | 100h | 40h     | [██░░]  | 115h  | 🔴 +15h Overrun |
 | Process Impr.  | 50h  | 45h     | [████]  | 50h   | 🟢 On Track     |
 | Root Cause Y   | 40h  | 10h     | [█░░░]  | 40h   | 🟢 On Track     |
 +----------------+------+---------+---------+-------+-----------------+
```

### 4.3 The ME Capacity Chart
The charting engine (`me-chart.js` / `me-calculations.js`) fundamentally changes how it paints the graph:

*   **Past Months:** Renders strictly from `time_logs`. If May is in the past, it shows exactly what was burned in May.
*   **Current/Future Months:** Renders strictly from the calculated `ETC` (Estimate To Complete), spread evenly over the remaining duration of the task. 

## 5. Implementation Phases

### Phase 1: Foundation & Data Layer
*   **DB Migration:**
    *   Add `percent_complete` (INT, default 0) to `me_tasks` and `pm_tasks`.
    *   Create `time_logs` table `(id, user_id, task_id, hours_logged, log_date, created_at)`.
    *   Add `capacity_task_id` to `npi_actions` table.
*   **JS State:**
    *   Update `me-data-relational.js` to fetch `time_logs` on initialization.
    *   Update `meDataState` to store `timeLogs` array.

### Phase 2: Engineer Input (Action Centre)
*   Update `action-centre.js` and `action-centre.css`.
*   Add `% Complete` slider/input to Action cards.
*   Add the "Log Time" inline form.
*   Create `saveTimeLog()` Supabase handler.

### Phase 3: Planner Visibility (ME Capacity)
*   Update `me-tasks.js` table renderer to show BAC, Actuals, EAC, and Variance columns.
*   Add visual color-coding for tasks that are trending to overrun (EAC > BAC).
*   Add a "Drill Down" modal on ME Tasks that queries `time_logs` to show Planners *who* logged hours against that bucket and *when*.

### Phase 4: Dynamic Charting
*   Update `meCalculateMonthData()` in `me-calculations.js`.
*   Implement the EVM math logic (BAC, EV, ETC, EAC).
*   Change chart distribution logic: Past = Actuals from `timeLogs`, Future = ETC spread across remaining months.

## 6. Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Data Entry Friction** | Engineers won't log time if it takes >3 clicks. The UI in the Action Centre must be inline and instant, defaulting to "Today". |
| **Historical Chart Stutter** | Switching the chart to read from `time_logs` will make past months blank for old tasks. We will need a one-time script to auto-generate `time_logs` for completed past tasks based on their old BAC. |
| **Performance** | Fetching thousands of time logs could slow down ME Capacity load times. Add an index to `time_logs.task_id` and `time_logs.log_date`. |
