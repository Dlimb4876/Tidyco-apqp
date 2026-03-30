# Process Failure Mode and Effects Analysis (PFMEA)

## Overview
**Process Failure Mode and Effects Analysis (PFMEA)** is used to identify process risk before failures happen.

In practical terms, PFMEA helps teams:
- describe how a process could fail
- understand the impact if it fails
- rate how likely it is
- decide which actions are needed first

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

## High-level workflow
1. Select the process step (normally linked to the PFD).
2. Add failure mode, effect, and cause.
3. Score Severity, Occurrence, and Detection.
4. Review RPN and severity-critical items.
5. Create and assign actions where risk is too high.
6. Re-score after action implementation.

## Calculations (detailed)
### PFMEA scoring model
PFMEA uses a 1–10 score for:
1. **Severity (S):** impact if failure occurs
2. **Occurrence (O):** likelihood of cause happening
3. **Detection (D):** ability of controls to detect/prevent escape

### RPN formula
```text
RPN = Severity × Occurrence × Detection
```

Example:
```text
S = 8, O = 6, D = 5
RPN = 8 × 6 × 5 = 240
```

### Prioritization guidance
- **Severity 9 or 10:** treat as urgent, regardless of RPN
- **Higher RPN:** generally higher priority for mitigation
- **After action:** re-score to verify risk reduction

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
