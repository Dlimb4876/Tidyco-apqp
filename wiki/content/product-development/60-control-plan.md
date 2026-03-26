# Control Plan

## What this page is for
Control Plan defines how each key process step will be controlled in day-to-day execution.
It translates risk analysis (PFMEA) and requirements (CTQ) into practical prevention and detection checks for the shop floor.

This page explains Control Plan as an APQP methodology.

## Before you start
- Ensure the PFD is accurate and reflects the actual shop floor sequence.
- Confirm the CTQ matrix has clear, measurable specifications.
- Ensure the PFMEA is mature enough to highlight high-risk items (high RPN or Severity).

## Key components of a good control
- **Characteristic:** What is being measured or controlled (linked to CTQ).
- **Method:** Exactly how it is checked (e.g., "Calibrated gauge", "Automated vision system", "Poka-yoke pin").
- **Sample Size & Frequency:** How much and how often (e.g., "100%", "First off", "1 piece per batch").
- **Reaction Plan:** Specific, actionable steps the operator must take if the control fails or goes out of spec (e.g., "Stop line, quarantine batch, notify Quality"). "Adjust" or "rework" is usually too vague.

## Prevention vs. Detection
A strong control plan utilizes both, but prioritizes prevention:
- **Prevention:** Stops the defect from being made (e.g., Poka-yoke, automated machine interlocks, parameter limits).
- **Detection:** Finds the defect after it is made but before it escapes (e.g., manual inspection, end-of-line test).

## The analytical process
1. **Identify targets:** Look at the PFMEA. Any row with a high RPN, high Severity, or a Special Characteristic (SC) needs a robust control plan entry.
2. **Define the standard:** Pull the exact specification and tolerance from the CTQ matrix. Ensure any Special Characteristics (🦺 Safety, ❗ Critical, ⚠️ Major) identified in the PFMEA carry over to the Control Plan.
3. **Assign the control:** Determine the best method, frequency, and owner to verify that standard.
4. **Write the reaction plan:** Define the exact escalation path if the control fails.

## Common mistakes to avoid
- **Vague Reaction Plans:** Writing "Rework" or "Inform Supervisor" without specifying what to do with the suspect parts.
- **Copy-Pasting from PFMEA:** The Control Plan needs shop-floor specifics. "Visual check" in PFMEA must become "Visual check against boundary sample #123" in the Control Plan.
- **Missing Special Characteristics:** Failing to carry over Safety (🦺) or Critical (❗) characteristics from the PFMEA.
- **Unrealistic Frequencies:** Specifying "100% inspection" for a manual process where cycle time makes it impossible.

## Quick example
| Process Step | Characteristic (CTQ) | Control Method | Sample / Frequency | Reaction Plan |
|---|---|---|---|---|
| Final tighten | Torque 50Nm ± 2Nm | DC Tool automated pass/fail (Prevention) | 100% | Tool locks. Operator cannot proceed. Supervisor overrides. |
| Final tighten | Torque 50Nm ± 2Nm | Manual click-wrench check (Detection) | 1 per shift | Segregate all parts since last good check. Notify ME. |

## Quality checks for a good Control Plan
- Every Special Characteristic identified in PFMEA has a corresponding Control Plan entry.
- Reaction plans are actionable and define the containment of suspect parts.
- Control methods reflect what is actually happening (or what will actually happen) on the shop floor, not just the ideal state.
- Gauges or test equipment mentioned match the actual tooling available.

## How Control Plan connects to other pages
- **PFMEA:** Highlights the risks and current controls that form the basis of the plan.
- **CTQ Matrix:** Provides the exact specifications and tolerances to be controlled.
- **PFD:** Provides the process steps where the controls are applied.

## Related
- [PFMEA](./50-pfmea.md)
- [CTQ Matrix](./30-ctq.md)
- [Process Flow Diagram](./40-pfd.md)
