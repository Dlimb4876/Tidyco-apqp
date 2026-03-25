# PFMEA in Tidyco: Tool Workflow

## What this page is for
This page explains how to use the PFMEA tools in the Tidyco site.
It focuses on where to click, what to enter, and how to keep records clean and usable.

## When to use this page
Use this page when you are actively updating PFMEA in the system.
For PFMEA method and scoring logic, use [PFMEA](./50-pfmea.md).

## Navigation path
1. Open Product Development.
2. Open NPI Projects and select the project.
3. Open APQP.
4. Open PFMEA.

## Typical PFMEA workflow in the site
1. Confirm the process step exists in PFD before creating PFMEA rows.
2. Add or open the PFMEA row for that step.
3. Enter the intended **Function**, then log the failure mode, effect, and cause details.
4. Tag any **Special Characteristics** (🦺 Safety, ❗ Critical, ⚠️ Major) using the dropdown next to the Severity score.
5. Enter S, O, and D values and confirm the displayed RPN.
6. Add action details (owner, due date, status) for unacceptable risk.
7. Update forecast values after action planning.
8. Save and review the row in context with related actions.

## UI Tools & Navigation
- **Collapsible Columns:** Use the View toggles (Compact / Standard / Full) in the toolbar to reduce horizontal scrolling and focus on the data you need.
- **Advanced Filters:** Use the filter bar to quickly find items by RPN range, Owner, Special Characteristic, text search, or to isolate overdue items. Filter state is saved in the URL.
- **Validation Warnings:** Look for the pulsing ⚠️ badge next to RPNs. Clicking it opens a modal explaining rule violations (e.g., "High severity without mitigation", "Critical RPN without action plan", or "Overdue action").

## Field-entry guidance
- Keep failure mode text short and specific.
- Write effects in operational/customer terms.
- Write causes as root causes, not symptoms.
- Use current controls in the current-state section.
- Use planned controls or action outputs in forecast/improvement context.

## Day-to-day working pattern
- During weekly reviews: sort/filter to highest-risk rows first.
- During project updates: close actions only when evidence exists.
- During handovers: keep notes clear enough for another engineer to continue without rework.

## Linking PFMEA to connected site tools
- PFD: PFMEA rows should map to valid process steps.
- Control Plan: sync or align controls so high-risk causes are covered.
- Actions: owners and due dates should match action tracking.
- MCS: use change workflow where mitigation requires controlled process change.

## Data quality checks before leaving the page
- No duplicate rows for the same step + failure mode.
- Open high-risk rows always have an owner and due date.
- Forecast values are updated when actions are defined.
- Any major process change has traceable linkage to MCS where required.

## Common user issues
| Issue | Likely reason | What to do |
|---|---|---|
| PFMEA row feels disconnected from process | Step not aligned with PFD | Update PFD step first, then relink/update PFMEA row |
| Risk does not reduce after action planning | Forecast values not updated | Revisit O and D forecast entries |
| Team cannot tell who owns mitigation | Owner field missing or unclear | Set named owner and due date immediately |
| Controls do not match real operation | Legacy row text copied forward | Rewrite controls to reflect actual current state |

## Related
- [PFMEA](./50-pfmea.md)
- [Process Flow Diagram](./40-pfd.md)
- [Control Plan](./60-control-plan.md)
- [Action Tracker](./70-actions.md)
- [MCS Approval Workflow](../mcs/30-approval-workflow.md)
