# Centralized Action Centre

## Overview
The **Action Centre** is the shared place where work items are tracked and completed.

It combines actions from multiple areas (NPI, PFMEA, MCS, and Operations) so users can:
- see what is due now
- prioritize important items
- record progress clearly
- close work with evidence

## Access
- **Portal:** Action Centre
- **Tab/Sub-tab:** Personal Queue / Departmental Overview
- **URL:** `index.html?portal=action-centre`

## Key Fields and Controls
| Field/Control | Description | Functional Impact |
|:---|:---|:---|
| **Source Module** | Origin of the action (e.g., PFMEA, MCS). | Provides technical context for the task. |
| **Priority Level** | Categorization of urgency (High, Medium, Low). | Governs the sorting order within the queue. |
| **Due Date** | The committed completion milestone. | Triggers 'Overdue' alerts and reporting escalations. |
| **Status** | Current lifecycle state (Open, In Progress, Resolved). | Updates the status in the source project or module. |

## High-level workflow
1. Open your queue and filter to your ownership.
2. Sort by overdue and high priority first.
3. Open each action and review the source context.
4. Add progress notes as work moves forward.
5. Set final status and closure evidence when complete.

## How to prioritize effectively
Use this order for daily triage:
1. **Overdue actions**
2. **High-priority actions**
3. **Actions linked to high-severity risk**
4. **Approvals blocking other work**

## Calculations and metrics (detailed)
These are common management calculations used with Action Centre data.

### Overdue rate
```text
Overdue Rate % = (Overdue Actions / Total Open Actions) × 100
```

### Closure rate
```text
Closure Rate % = (Actions Closed in Period / Actions Created in Period) × 100
```

Interpretation:
- **100%+**: team is reducing backlog
- **Below 100%**: backlog is likely growing

## Common Issues and Resolutions
| Issue | Potential Cause | Remediation |
|:---|:---|:---|
| **Missing Actions** | Incorrect user assignment in the source module. | Verify account assignment in the original project or MCS record. |
| **Stale Task Data** | Failure to update status after task completion. | Perform a weekly triage review to close completed actions. |
| **Ambiguous Context** | Insufficient detail in the 'Action Description'. | Utilize the 'Source Link' to review the full technical requirements. |

## Related
- [Operations Performance Dashboard](../operations/00-overview.md)
- [Manufacturing Change System (MCS)](../mcs/00-overview.md)
- [NPI Project Management](../product-development/10-npi-projects.md)
- [PFMEA Risk Management](../product-development/50-pfmea.md)
