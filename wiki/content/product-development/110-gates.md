# APQP Gate Management

## Overview
**Advanced Product Quality Planning (APQP) Gates** serve as the primary governance framework for project progression within the manufacturing engineering lifecycle. The system utilizes a formal phase-gate methodology, requiring documented evidence and multi-disciplinary sign-off to mitigate technical and operational risks before advancing between project stages.

## Access
- **Portal:** Product Development
- **Tab/Sub-tab:** Project Dashboard > Gates
- **URL:** `index.html?portal=product-development&project=[id]&tab=gates`

## Key Fields and Controls
| Field/Control | Description | Functional Impact |
|:---|:---|:---|
| **Checklist Item** | A specific technical or quality deliverable. | Defines the mandatory criteria for phase completion. |
| **Evidence Link** | Reference to supporting documentation. | Provides the audit trail for gate verification. |
| **Signatory Role** | A designated authority (e.g., ME, Ops). | Ensures cross-departmental accountability. |
| **Gate Status** | Categorical state (e.g., Pending, Signed). | Controls the availability of subsequent project phases. |

## The Gate Review Process
### Preparation and Documentation
The project lead and relevant subject matter experts compile evidence for each checklist item. Evidence must demonstrate not only the existence of a deliverable (e.g., a Process Flow Diagram) but also its adherence to quality standards and project requirements.

### Sign-off and Validation
1. **Verification:** Signatories review the associated evidence for each checklist item within their functional domain.
2. **Approval:** Authorized users apply a digital signature, which timestamps the approval and locks the associated record.
3. **Blocker Resolution:** Incomplete items or negative findings generate high-priority tasks in the **Action Tracker**. All blockers must be resolved before a gate can achieve 'Complete' status.
4. **Transition:** Upon final signature, the project transitions to the subsequent phase, enabling the next set of APQP activities.

## Standard Gate Definitions
| Phase | Title | Primary Objective |
|:---:|:---|:---|
| **0** | Concept & Planning | Validates project scope, resource requirements, and team alignment. |
| **1** | Product Design | Confirms technical specifications and design feasibility. |
| **2** | Process Design | Establishes manufacturing workflows, PFD, and PFMEA maturity. |
| **3** | Process Validation | Verifies capability through trial runs and measurement analysis. |
| **4** | Launch Readiness | Finalizes training, equipment readiness, and go/no-go decisions. |
| **5** | Production Follow-up | Assesses stabilization, issue resolution, and lessons learned. |

## Common Issues and Resolutions
| Issue | Potential Cause | Remediation |
|:---|:---|:---|
| **Gate remains 'Pending'** | Missing evidence or signatory absence. | Verify all checklist items are linked to valid data. |
| **Unauthorized Sign-off** | Incorrect user permissions. | Adjust role-based access in **Settings > Teams**. |
| **Stale Gate Dates** | Timing plan misalignment. | Synchronize gate milestones with the **Project Timing Plan**. |

## Related
- [NPI Project Management](./10-npi-projects.md)
- [Project Timing and Milestones](./100-timing.md)
- [Action Tracker Integration](./70-actions.md)
