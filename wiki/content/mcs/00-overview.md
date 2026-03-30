# Manufacturing Change System (MCS)

## Overview
The **Manufacturing Change System (MCS)** controls how manufacturing changes are proposed, reviewed, approved, and closed.

Use MCS when a change affects:
- process steps
- product definition
- tooling or methods
- quality or compliance expectations

## Access
- **Portal:** MCS
- **Tab/Sub-tab:** Overview / Change Requests
- **URL:** `index.html?portal=mcs`

## Key Fields and Controls
| Field/Control | Description | Functional Impact |
|:---|:---|:---|
| **Change Type** | Categorization (Emergency, Major, Minor, Admin). | Determines the required approval workflow and priority. |
| **Impact Assessment** | Evaluation across Quality, Ops, and Supply Chain. | Identifies potential risks and resource requirements. |
| **Justification** | Technical or commercial rationale for the change. | Provides the basis for approval or rejection. |
| **Implementation Plan** | Step-by-step execution and verification strategy. | Governs the transition from current to future state. |

## Change categories (high-level)
- **Emergency:** urgent issue needing immediate control
- **Major:** high-impact change with broad implications
- **Minor:** limited-scope change with controlled impact
- **Administrative:** record/documentation update with no physical process change

## High-level workflow
1. Raise the change request with clear justification.
2. Complete impact assessment (quality, delivery, cost, safety).
3. Route for approval.
4. Implement the approved plan.
5. Verify outcome and close.

## Calculations and evaluation (detailed)
MCS decisions are not based on one fixed formula, but teams often use a structured impact estimate.

### Example impact effort estimate
```text
Estimated Total Effort (hours) =
Engineering Hours + Production Hours + Validation Hours + Documentation Hours
```

### Example schedule impact
```text
Estimated Delay (days) = Revised Completion Date - Baseline Completion Date
```

These calculations help teams compare options and justify the chosen implementation plan.

## Common Issues and Resolutions
| Issue | Potential Cause | Remediation |
|:---|:---|:---|
| **Review Bottlenecks** | Pending signatory approval. | Monitor pending tasks in the **Action Centre**. |
| **Incomplete Assessment** | Omission of secondary impact areas (e.g., Logistics). | Re-open the assessment phase for additional stakeholder input. |
| **Execution Variance** | Deviations from the approved implementation plan. | Log the variance and initiate a corrective action if quality is compromised. |

## Related
- [MCS Approval Workflow](./30-approval-workflow.md)
- [Action Centre Task Management](../action-centre/00-overview.md)
- [Process Quality and Control Plans](../product-development/60-control-plan.md)
