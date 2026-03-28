# Manufacturing Change System (MCS)

## Overview
The **Manufacturing Change System (MCS)** is a formal governance framework designed to manage modifications to established manufacturing processes, materials, tooling, and documentation. The system ensures that all changes undergo rigorous impact assessment, multi-disciplinary review, and documented approval before implementation to maintain product quality, operational safety, and regulatory compliance.

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

## Change Classification and Workflow
### Change Categories
Changes are classified based on their potential impact on product integrity and process stability:
- **Emergency:** Critical safety or production-stopping issues requiring immediate resolution (Target: 24-48 hours).
- **Major:** Significant modifications to process architecture, material specifications, or quality standards.
- **Minor:** Incremental improvements or scoped adjustments with localized impact.
- **Administrative:** Updates to documentation or system data without altering the physical manufacturing method.

### The Lifecycle of a Change Request
1. **Initiation:** The requester submits a detailed description of the proposed change, including technical justification and initial scope.
2. **Technical Assessment:** Subject matter experts evaluate the proposal across key domains, including **Quality Assurance**, **Supply Chain**, and **Production Capacity**.
3. **Approval Cycle:** The request is routed to designated signatories based on the **Change Type**. Electronic signatures are required to authorize progression.
4. **Execution:** Approved changes are implemented according to the defined plan, which may include trial runs, training, and equipment calibration.
5. **Verification and Closure:** Post-implementation reviews confirm that the change achieved the intended outcome without adverse effects. The record is then archived for audit purposes.

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
