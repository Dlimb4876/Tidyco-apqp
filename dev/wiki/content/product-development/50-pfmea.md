# PFMEA

## What PFMEA is used for
PFMEA (Process Failure Mode and Effects Analysis) helps teams identify where a process can fail, how serious that failure is, and what action is needed to reduce risk before it reaches production.

This page explains PFMEA as a risk method.
If you want the click-by-click workflow for the Tidyco site, use [PFMEA in Tidyco: Tool Workflow](./51-pfmea-tool-workflow.md).

PFMEA should help the team answer:
- Which failures would hurt the customer or operation most?
- Which causes are most likely to happen in our current process?
- Which risks are not being controlled well enough today?
- Which action gives the biggest risk reduction?

## Before you start
- Confirm the process step exists in PFD.
- Gather the current method details (how the step is done today).
- Use a consistent scoring approach across the team.
- Check whether similar failure modes already exist in this project to avoid duplicate rows.

## What good PFMEA entries look like
- **Function:** What the step is actually supposed to achieve (e.g., "Deliver 50Nm of torque").
- **Failure mode:** Specific way it fails to meet the function (e.g., "Torque below spec at final tighten" rather than "torque issue").
- **Effect:** Outcome-focused impact on the operator, customer, or downstream process.
- **Cause:** Root-cause oriented reason the failure mode happens, not what the failure looks like.
- **Controls:** Real controls in use *now*, not planned future controls.

## Scoring rules
- Severity (S): How serious the effect is if failure happens.
- Occurrence (O): How likely the cause is to happen.
- Detection (D): How likely the current controls are to detect the issue before escape.
- RPN formula: S x O x D.

Scoring should be team-consistent or priorities become unreliable.

### How to think about each score
- Severity: score the consequence, not the probability.
- Occurrence: score based on evidence where possible (history, defect trend, known process variation).
- Detection: score the control strength as it exists today, not after future improvements.

Priority rule of thumb:
- Always treat high Severity items as urgent, even if RPN is not the highest.
- Then prioritize by highest RPN.

## Common scoring mistakes to avoid
- Lowering Severity because a good control exists (controls affect Detection, not Severity).
- Using optimistic Detection scores for checks that are inconsistent or not mistake-proof.

## The analytical process
1. Define the intended function of the step.
2. Brainstorm all the ways that function could fail (Failure Modes).
3. Determine the worst-case consequence of that failure (Effect) and score Severity.
4. Identify the root reason why the failure occurs (Cause) and score Occurrence.
5. Identify what currently prevents or detects this cause (Controls) and score Detection.
6. Evaluate the RPN. If unacceptable, define a mitigation action.
7. Forecast the new Occurrence and Detection scores assuming the action succeeds.

When possible, write actions that change the process or control method directly (for example, poka-yoke, calibration discipline, automated interlock), rather than reminder-only actions.

## Quick example
- Step function: Tighten to 50Nm.
- Failure mode: Torque not achieved.
- Current scoring: S=9, O=4, D=7 -> RPN 252.
- After mitigation (interlock + pass/fail): O=3, D=4 -> forecast RPN 108.

## How to prioritize PFMEA workload
Use this order during reviews:
1. High Severity rows first.
2. Then highest RPN rows.
3. Then overdue actions linked to high-risk rows.

This keeps attention on risk exposure, not just row count.

## Quality checks for a good PFMEA
- Failure mode, effect, and cause are specific and not vague.
- Scoring is consistent with team standards.
- Owner and due date are present for open actions.
- Forecast values are realistic, not optimistic guesses.
- Links to process step and related controls are in place.

## How PFMEA connects to other pages
- PFD provides the process-step structure PFMEA rows should reference.
- Control Plan should reflect key PFMEA risks and controls.
- MCS workflow is used when risk reduction needs formal change control.
- Action tracking should reflect every open PFMEA action with clear ownership.
- Operations risk views may surface high-risk PFMEA items for wider visibility.

## Related
- [PFMEA in Tidyco: Tool Workflow](./51-pfmea-tool-workflow.md)
- [Process Flow Diagram](./40-pfd.md)
- [Control Plan](./60-control-plan.md)
- [MCS Approval Workflow](../mcs/30-approval-workflow.md)
