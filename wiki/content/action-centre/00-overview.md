# Centralized Action Centre

## Overview
The **Action Centre** is a cross-functional task management hub that aggregates directives and commitments from multiple operational modules into a unified execution queue. By consolidating actions from **New Product Introduction (NPI)**, **PFMEA**, **Manufacturing Change System (MCS)**, and **Risk Management**, the system provides a comprehensive overview of organizational obligations, enabling efficient prioritization and resource allocation.

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

## Functional Architecture
### Task Aggregation
The Action Centre functions as a relational view of disparate data tables. Updates performed within the Action Centre are synchronized in real-time with the source record:
- **Project Actions:** General deliverables identified during NPI gate reviews or timing plan adjustments.
- **Risk Mitigations:** Specific countermeasures generated during PFMEA or high-level risk assessments.
- **Change Approvals:** Pending engineering change requests (ECRs) requiring technical review and signatory sign-off.

### Prioritization and Triage
The system employs a multi-criteria sorting logic to identify critical-path items:
1. **Overdue Status:** Any action exceeding its committed 'Due Date' is escalated to the top of the queue.
2. **Severity-Linked Tasks:** Actions derived from high-severity PFMEA failure modes (S=9/10) are prioritized to ensure rapid risk reduction.
3. **Approval Requests:** Time-sensitive MCS approvals are highlighted to prevent bottlenecks in the manufacturing change lifecycle.

## Operational Workflow
### Resolution and Documentation
1. **Assignment Review:** Personnel monitor their personal queue for newly assigned actions or approval requests.
2. **Contextual Analysis:** Using the 'Source Link' feature, the assignee reviews the original project or risk record to ensure technical alignment.
3. **Progress Logging:** Incremental updates and progress notes are documented within the action record to maintain an audit trail.
4. **Validation and Closure:** Upon completion of the physical task, the assignee records the resolution details and updates the status to 'Resolved'.

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
