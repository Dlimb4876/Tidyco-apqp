# Understanding APQP Gates

## What APQP gates are
APQP (Advanced Product Quality Planning) gates are formal review checkpoints that ensure a product is ready to move to the next phase of development.
Think of them as quality tollgates that prevent problems from progressing downstream.

Each gate represents a milestone where the cross-functional team confirms:
- All required activities from the previous phase are complete
- Risks are understood and controlled
- The project is ready for the next phase of investment or activity

## Why gates matter

### Risk reduction
Catching issues early prevents costly fixes later. A design problem found at Gate 1 costs pennies to fix; the same problem found in production costs thousands.

### Cross-functional alignment
Gates force different departments (Design, Manufacturing, Quality, Procurement) to agree on readiness before proceeding.

### Customer confidence
Demonstrating disciplined gate management shows customers you have controlled processes and reduces their audit burden.

### Resource protection
Gates prevent throwing good money after bad projects. If a project cannot pass Gate 3, it is better to cancel it than to invest in tooling that may never be used.

## The standard gate structure

### Gate 0: Planning and Concept
**Question:** Should we pursue this opportunity?

**Typical evidence:**
- Business case and market analysis
- Initial feasibility assessment
- Resource and timing estimates
- Customer requirements documented

**Approval means:** Authorised to proceed with detailed design and development.

### Gate 1: Design and Development
**Question:** Is the design feasible and have we planned properly?

**Typical evidence:**
- Detailed design specifications
- DFMEA (Design Failure Mode Effects Analysis)
- Prototype plans and timing
- Supplier selection complete
- CTQ (Critical to Quality) characteristics identified

**Approval means:** Authorised to build prototypes and validate the design.

### Gate 2: Validation
**Question:** Does the design meet requirements and are we ready for production?

**Typical evidence:**
- Prototype test results
- Design verification complete
- PFMEA (Process Failure Mode Effects Analysis)
- Process flow diagrams
- Preliminary control plan
- Tooling and equipment plans

**Approval means:** Authorised to procure tooling and prepare for production.

### Gate 3: Production Readiness
**Question:** Are we ready to start production?

**Typical evidence:**
- Production trial runs completed
- Process capability studies (PPK/CPK)
- Final control plan approved
- Work instructions published
- Measurement systems validated (MSA)
- Packaging and logistics confirmed

**Approval means:** Authorised to begin production shipments.

### Gate 4: Launch and Monitoring
**Question:** Is production stable and meeting customer expectations?

**Typical evidence:**
- Production performance data
- Customer feedback and quality metrics
- Lesson learned documented
- Continuous improvement plans

**Approval means:** Project moves to steady-state production and the NPI team hands over to operations.

## Gate evidence and sign-offs

Each gate requires:
1. **Evidence items:** Documents proving activities were completed
2. **Sign-offs:** Formal approvals from designated roles
3. **Exceptions:** Any required waivers with risk assessment and mitigation

### Who signs off?
The exact approvers depend on your organisation's structure, but typically include:
- Project Manager (overall accountability)
- Quality Manager (quality system compliance)
- Manufacturing Engineer (process readiness)
- Design Engineer (design maturity)
- Procurement (supplier readiness)

## Gate trajectories and health

### Green trajectory
- All evidence complete
- All sign-offs obtained
- Proceeding to next phase on schedule

### Yellow trajectory
- Minor evidence gaps with low risk
- Sign-offs pending but no major concerns
- May proceed with agreed conditions

### Red trajectory
- Critical evidence missing
- Significant risks not addressed
- Project blocked until issues resolved

## How gates link to other systems

### NPI Projects
- Gates are tracked in the project dashboard
- Evidence items are uploaded and linked to gate records
- Gate status affects overall project health KPIs

### PFMEA and Control Plans
- PFMEA is typically a Gate 2 deliverable
- Control Plans mature from preliminary (Gate 2) to final (Gate 3)
- Risk reduction actions must be complete before gate approval

### Actions and Risks
- Actions generated during gate reviews feed into the Action Centre
- Open high-severity risks block gate progression
- Risk mitigation evidence is required for gate sign-off

### Timing Plans
- Gate dates drive the master project timeline
- Slipping a gate date automatically adjusts downstream milestones
- Resource planning is based on gate forecast dates

## Common gate mistakes

### Evidence quality issues
- **Vague evidence:** Uploading a document that doesn't clearly prove the activity was done.
- **Wrong version:** Submitting an outdated PFMEA or drawing revision.
- **Missing traceability:** Evidence exists but isn't clearly linked to the gate record.

### Premature approvals
- **Political pressure:** Approving a gate because of schedule pressure rather than readiness.
- **Incomplete review:** Signing without actually reading the evidence.
- **Assumption-based:** "I am sure they did the PFMEA" without checking.

### Poor exception management
- **Hidden waivers:** Not documenting when standard criteria are not met.
- **Missing mitigation:** Identifying a gap but not explaining how the risk is controlled.
- **Expired exceptions:** Temporary waivers that never get closed out.

## Tips for successful gate management

1. **Start early:** Don't wait until the gate meeting to prepare evidence.
2. **Assign owners:** Every evidence item should have a named owner and due date.
3. **Review regularly:** Weekly check of gate health, not just before the meeting.
4. **Escalate early:** Raise concerns as soon as they appear, not at the gate review.
5. **Learn from exits:** Capture lessons learned at each gate for the next project.

## Related
- [APQP Gates](../product-development/110-gates.md)
- [Product Development Overview](../product-development/00-overview.md)
- [NPI Projects](../product-development/10-npi-projects.md)
- [PFMEA](../product-development/50-pfmea.md)
