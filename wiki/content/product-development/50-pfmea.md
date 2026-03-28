# Process Failure Mode and Effects Analysis (PFMEA)

## Overview
**Process Failure Mode and Effects Analysis (PFMEA)** is a systematic, proactive methodology used to identify potential failure modes within a manufacturing or assembly process. The primary objective is to evaluate the causes and effects of these failures, assess the adequacy of current controls, and prioritize corrective actions to mitigate operational, quality, and safety risks.

## Access
- **Portal:** Product Development
- **Tab/Sub-tab:** Project Dashboard > PFMEA
- **URL:** `index.html?portal=product-development&project=[id]&tab=pfmea`

## Key Fields and Controls
| Field/Control | Description | Functional Impact |
|:---|:---|:---|
| **Process Function** | The intended purpose of the process step. | Establishes the baseline for failure identification. |
| **Failure Mode** | The specific manner in which a process fails. | Defines the technical nature of the non-conformance. |
| **Effect** | The consequence of the failure on the customer/process. | Determines the **Severity (S)** score. |
| **Cause** | The root reason for the failure mode occurrence. | Determines the **Occurrence (O)** score. |
| **Current Controls** | Existing prevention or detection mechanisms. | Determines the **Detection (D)** score. |
| **RPN** | Risk Priority Number (S × O × D). | Quantifies the relative risk level (Max: 1000). |

## Risk Assessment Framework
### Scoring Criteria
The PFMEA utilizes a 1-10 scale for three critical dimensions:
1. **Severity (S):** Measures the impact of the failure effect. High scores (9-10) indicate potential safety or regulatory violations.
2. **Occurrence (O):** Estimates the likelihood of the failure cause appearing during the process lifecycle, based on historical data or technical analysis.
3. **Detection (D):** Evaluates the effectiveness of current controls in identifying the failure mode or cause before it reaches the customer.

### Prioritization Strategy
Operational priority is determined by two primary factors:
- **High Severity:** Any item with a Severity score of 9 or 10 requires immediate review, regardless of the aggregate RPN.
- **RPN Thresholds:** Higher RPN values indicate greater cumulative risk, necessitating documented mitigation actions.

## The PFMEA Lifecycle
### Analysis and Documentation
The multi-disciplinary team reviews each step defined in the **Process Flow Diagram (PFD)**. For every failure mode identified, the team documents the potential effects and root causes. Current manufacturing controls—such as physical interlocks (poka-yoke), automated inspections, or manual checks—are recorded and scored.

### Mitigation and Verification
1. **Action Assignment:** If the RPN or Severity exceeds acceptable thresholds, a mitigation action is generated and assigned to a responsible owner within the **Action Tracker**.
2. **Score Forecasting:** The team estimates revised 'Forecast' scores for Occurrence and Detection, assuming the successful implementation of the proposed action.
3. **Closure:** Upon completion of the action, the forecast scores are validated against actual process performance, and the PFMEA record is updated to reflect the new residual risk.

## Common Issues and Resolutions
| Issue | Potential Cause | Remediation |
|:---|:---|:---|
| **Inconsistent Scoring** | Lack of standardized scoring guidance. | Refer to the **PFMEA Scoring Rules** in the project settings. |
| **Vague Failure Modes** | Non-specific descriptions (e.g., "Quality issue"). | Redefine failure mode based on specific technical non-conformance. |
| **Static Documentation** | Failure to update PFMEA after a defect occurs. | Re-evaluate relevant rows during root cause analysis of quality escapes. |

## Related
- [PFMEA Tool Workflow and Interface](./51-pfmea-tool-workflow.md)
- [Process Flow Diagram (PFD) Integration](./40-pfd.md)
- [Control Plan Development](./60-control-plan.md)
- [Action Tracker Integration](./70-actions.md)
