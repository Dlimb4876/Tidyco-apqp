# Action Centre

## What this area is for
The Action Centre is the shared execution queue across projects and modules.
It aggregates your specific commitments from NPI Projects, PFMEA, Risks, and MCS into a single view, helping you prioritize what needs action now without hunting through individual portals.

## Before you start
- Remember that the Action Centre is a *view* of data from other places. When you update an action here, it updates the source record.
- Ensure your team is actively assigning actions to your named user account, otherwise they won't appear here.

## Key components
- **Overdue Tasks:** Items past their committed date across all projects.
- **NPI Actions:** General project tasks created in the Action Tracker.
- **PFMEA Mitigations:** Risk reduction actions generated from process analysis.
- **MCS Approvals:** Pending engineering changes requiring your sign-off.
- **Source Links:** Direct shortcuts to jump back to the original project or risk record.

## The execution process
1. **Triage:** Start with the "Overdue" and "High Priority" filters.
2. **Review:** Check the context of the action using the source link if needed.
3. **Update:** Add progress notes and change the status to "In Progress".
4. **Resolve:** Document exactly what was done in the resolution notes before marking the action as "Done".

## Common mistakes to avoid
- **Vague updates:** Changing status to "In Progress" without adding a note explaining what is actually happening.
- **Ignoring source context:** Trying to complete a complex PFMEA mitigation without clicking the source link to read the actual failure mode.
- **False closures:** Marking an item "Done" before the physical work (e.g., tooling modification) is actually complete on the floor.

## Quick example
| Source Type | Action Description | Due Date | Status | Next Step |
|---|---|---|---|---|
| PFMEA (Project X) | Install automated tool interlock | 2026-04-15 | Open | Source vendor quote |
| Gate 2 (Project Y) | Update drawing tolerance | 2026-03-30 | Overdue | Follow up with Design |
| MCS Approval | ECR-2026-004: Alternative Seal | 2026-04-10 | Pending | Review impact assessment |

## Related
- [Operations Actions Tab](../operations/50-actions-tab.md)
- [MCS Overview](../mcs/00-overview.md)
- [Product Development Actions](../product-development/70-actions.md)
