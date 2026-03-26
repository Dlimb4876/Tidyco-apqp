# Action Tracker

## What this page is for
The Action Tracker is where project commitments are recorded, assigned, and followed through to completion.
It serves as the operational bridge between identifying an issue (like a risk or a PFMEA vulnerability) and proving it has been resolved.

## Before you start
- Ensure you have clear context on *why* the action is needed (e.g., a specific risk, a failed gate check).
- Confirm the person being assigned actually has the capacity and authority to complete the work.

## Key components of a good action
- **Description:** Exactly what needs to be done, starting with a verb (e.g., "Design a poka-yoke fixture for the bearing assembly").
- **Owner:** A single named individual responsible for completion, selected from the user account dropdown. "Engineering Team" is not an owner.
- **Due Date:** A realistic, agreed-upon deadline.
- **Status:** Current state (Open, In Progress, Blocked, Done).
- **Action Taken:** The actual evidence or result achieved once completed.

## The management process
1. **Capture:** Log the action as soon as the need is identified in a meeting, PFMEA review, or risk assessment.
2. **Assign:** Agree on a single owner and a realistic due date.
3. **Monitor:** Review open actions regularly, focusing on overdue or blocked items.
4. **Update:** Owners update the status and provide progress notes.
5. **Close:** When complete, document exactly what was done in the "Action Taken" field before marking it Done.

## Common mistakes to avoid
- **Vague descriptions:** Writing "Look into bearing issue" instead of "Identify root cause of bearing misalignment and propose a design fix".
- **Shared ownership:** Assigning two people to one action, which usually means neither takes responsibility.
- **Closing without evidence:** Marking an action "Done" without explaining what the resolution was in the notes.
- **Unrealistic dates:** Setting everything to be due on Friday, leading to a massive overdue backlog.

## Quick example
| Source | Description | Owner | Due Date | Status | Action Taken (When Done) |
|---|---|---|---|---|---|
| PFMEA | Install automated interlock on DC tool | Jane Doe | 2026-04-15 | In Progress | |
| Gate 2 | Update drawing rev to include new tolerance | John Smith | 2026-03-30 | Done | Drawing 123 Rev C published to PLM |

## Quality checks for a good Action Tracker
- Every action has exactly one named owner.
- Every action has a specific due date (no "TBD").
- Closed actions include a clear statement of the resolution.
- Actions are linked back to their source (Risk, PFMEA, Gate).

## How Actions connect to other pages
- **Action Centre:** All project actions aggregate into the user's personal Action Centre for cross-project visibility. Open and overdue actions also appear in the top widget on the main Hub.
- **PFMEA:** High RPNs generate mitigation actions that live here.
- **Risk Register:** Project risks generate mitigation actions that live here.
- **APQP Gates:** Incomplete gate criteria generate actions required to pass the gate.

## Related
- [Risk Register](./80-risks.md)
- [Action Centre Overview](../action-centre/00-overview.md)
