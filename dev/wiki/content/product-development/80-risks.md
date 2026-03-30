# Risk Register

## What this page is for
The Risk Register tracks project-level uncertainty and ensures mitigation efforts are visible and managed.
While PFMEA handles process-specific failures, the Risk Register handles broader project threats (e.g., supply chain delays, resourcing bottlenecks, technical feasibility).

## High-level workflow
1. Identify and describe risk clearly (cause and consequence).
2. Score impact and likelihood.
3. Define mitigation and owner.
4. Link mitigation to actions.
5. Reassess scores at regular review points.

## Before you start
- Gather input from cross-functional team members (supply chain, engineering, operations).
- Understand the project's critical path and key dependencies.

## Key components of a good risk entry
- **Risk Statement:** A clear "Cause and Effect" statement (e.g., "Because supplier X is retooling, the delivery of component Y may be delayed, impacting the prototype build").
- **Impact & Likelihood:** Objective scoring of how bad it would be and how likely it is to happen.
- **Mitigation Plan:** The strategy to either reduce the likelihood or minimize the impact.
- **Owner:** The person responsible for monitoring the risk and driving the mitigation.

## The analytical process
1. **Identify:** Brainstorm potential threats to project timing, cost, or quality.
2. **Articulate:** Write the risk clearly using the "Condition -> Consequence" format.
3. **Score:** Rate the inherent Impact and Likelihood before any mitigation.
4. **Mitigate:** Develop a plan to handle the risk and assign specific actions to execute that plan.
5. **Review:** Regularly reassess the risk scores as mitigations are completed or as the project progresses.

## Calculations (detailed)
### Basic risk score
```text
Risk Score = Impact × Likelihood
```

### Residual risk score
```text
Residual Risk Score = Residual Impact × Residual Likelihood
```

### Risk reduction
```text
Risk Reduction % =
((Initial Risk Score - Residual Risk Score) / Initial Risk Score) × 100
```

These calculations help teams show whether mitigations are working, not just whether they were started.

## Common mistakes to avoid
- **Vague risks:** Just writing "Supply Chain" instead of specifying which part and what the consequence is.
- **Confusing risks with issues:** A risk is something that *might* happen. An issue is something that *has already* happened.
- **No mitigation:** Logging a high-severity risk but leaving the mitigation plan blank.
- **Stale registers:** Identifying risks at the start of a project and never looking at the register again.

## Quick example
| Risk Statement | Score (IxL) | Mitigation Plan | Owner | Status |
|---|---|---|---|---|
| Because the testing rig requires a custom PCB, lead times may delay Gate 3 validation. | High (16) | Source secondary supplier for PCB; parallel track generic testing where possible. | Jane Doe | Open |
| Tooling budget is tight; modifications may require scope reduction. | Med (9) | Front-load design reviews to lock requirements before cutting steel. | John Smith | Open |

## Quality checks for a good Risk Register
- Risk statements clearly describe both the cause and the potential impact.
- High-scoring risks have clear, actionable mitigation plans.
- Mitigations are backed up by actual tasks in the Action Tracker.
- Risk statuses are updated as the project moves through its lifecycle.

## How Risk Register connects to other pages
- **Action Tracker:** Mitigation plans often generate specific tasks that are managed in the Action Tracker.
- **Operations Risk Tab:** High-severity project risks bubble up to the Operations dashboard for leadership visibility.
- **Timing Plan:** Risks often threaten specific milestones in the Timing Plan.

## Related
- [Action Tracker](./70-actions.md)
- [PFMEA](./50-pfmea.md)
- [Operations Risk Tab](../operations/30-risk-tab.md)
