# Daily Triage and Ownership

## What this page is for
This page gives a simple daily operating pattern for Action Centre so work does not stall between teams.

## Daily triage routine (15-20 minute pass)
1. Open your Action Centre queue.
2. Filter to **Open + In Progress**.
3. Sort by **Overdue**, then **High priority**.
4. Confirm each top item has:
   - one named owner
   - one clear next step
   - one realistic due date
5. Escalate blockers the same day.

## Ownership standards
- Every action must have one primary owner.
- Shared ownership is allowed only with a named lead owner.
- If owner is unavailable, reassign immediately rather than waiting.

## Good action hygiene
| Rule | Why it matters |
|---|---|
| Keep titles specific | Makes queue scanning fast |
| Update status on the day work changes | Prevents stale reporting |
| Add progress notes with dates | Gives audit trail and handover context |
| Close only with evidence | Prevents repeat actions for same issue |

## Blocker handling flow
1. Mark the action as blocked (or equivalent status).
2. Add a short note: what is blocked, by whom, and since when.
3. Link the dependent source item (risk, PFMEA row, MCS request, etc.).
4. Set a review checkpoint date.
5. Escalate if no movement by checkpoint.

## Queue health calculations
### Backlog age
```text
Backlog Age (days) = Today - Oldest Open Action Created Date
```

### Throughput
```text
Throughput = Actions Closed This Week
```

### Overdue share
```text
Overdue Share % = (Overdue Open Actions / Total Open Actions) × 100
```

Use these three together. A queue can look busy but still be healthy if throughput is high and backlog age is reducing.

## Weekly review (team lead)
- Review actions stuck for more than two weeks
- Check repeated blocker themes
- Remove duplicate actions
- Confirm closed actions include clear outcomes

## Related
- [Action Centre Overview](./00-overview.md)
- [Operations Actions Tab](../operations/50-actions-tab.md)
- [MCS Approval Workflow](../mcs/30-approval-workflow.md)
