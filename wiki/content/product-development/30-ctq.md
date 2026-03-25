# CTQ Matrix

## What this page is for
CTQ (Critical to Quality) defines the measurable requirements that must be met for the product to be considered acceptable.
It is the reference point for what "good" looks like and how it will be verified, translating customer expectations and engineering drawings into practical shop-floor targets.

## Before you start
- Ensure you have the latest customer specifications, technical drawings, and industry standards.
- Understand the core function of the product being overhauled or manufactured.

## Key components of a good CTQ
- **Requirement:** A clear, unambiguous statement of what is required (e.g., "Bolt torque").
- **Specification & Tolerance:** The exact numerical target and allowable variance (e.g., "50Nm ± 2Nm").
- **Verification Method:** Exactly how the requirement will be tested or inspected (e.g., "Calibrated digital torque wrench").
- **Source:** Where the requirement came from (e.g., "Customer Drawing Rev B").

## The analytical process
1. **Review source documents:** Comb through drawings, contracts, and standards to identify all critical requirements.
2. **Translate to CTQ:** Write each requirement as a discrete, measurable line item.
3. **Define the target:** Ensure every requirement has a specific target and tolerance. Avoid vague terms like "good condition" or "tight".
4. **Determine verification:** Decide how the shop floor or quality team will actually prove the requirement was met.

## Common mistakes to avoid
- **Vague specifications:** Writing "visually acceptable" instead of "no scratches visible from 1 meter under normal lighting".
- **Missing tolerances:** Providing a target like "100mm" without stating if 100.5mm is acceptable.
- **Unverifiable requirements:** Setting a requirement that the shop floor has no equipment to actually measure.

## Quick example
| Requirement | Specification | Tolerance | Verification Method | Source |
|---|---|---|---|---|
| Final Bolt Torque | 50 Nm | ± 2 Nm | Calibrated digital torque wrench | Drawing 12345 Rev B |
| Surface Finish | Ra 3.2 | Max | Profilometer check | ISO 1302 |

## Quality checks for a good CTQ Matrix
- Every line item is objectively measurable (pass/fail or numerical).
- There are no subjective terms left undefined.
- The verification method is practical and uses available equipment.

## How CTQ connects to other pages
- **PFMEA:** CTQs help define the "Function" and "Failure Mode" (e.g., failing to meet the CTQ).
- **Control Plan:** Every CTQ should have a corresponding control method defined in the Control Plan to ensure it is met.
- **PFD:** CTQs are often linked to specific process steps where they are created or verified.

## Related
- [Process Flow Diagram](./40-pfd.md)
- [Control Plan](./60-control-plan.md)
