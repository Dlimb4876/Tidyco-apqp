# Process Flow Diagram

## What this page is for
The PFD (Process Flow Diagram) documents the step-by-step sequence of operations required to build or overhaul a product.
It is the structural backbone of APQP, mapping out the physical journey of the product including manufacturing steps, inspections, decision branches, and rework paths.

## Before you start
- Walk the actual shop floor (if the process exists) or review the planned layout.
- Gather input from operators, manufacturing engineers, and quality teams.
- Define the scope (where the process starts and ends).

## Key components of a good PFD
- **Step Number:** A unique, stable identifier for each operation (e.g., 10, 20, 30).
- **Step Name:** A clear, action-oriented description (e.g., "Apply thermal paste").
- **Step Type:** Categorization of the step (e.g., Operation, Inspection, Decision, Transport, Storage).
- **Flow Logic:** Explicit links to the next step, including "Yes/No" branches for decisions.

## The analytical process
1. **Outline the main path:** Document the "happy path" from start to finish without worrying about exceptions yet.
2. **Add inspections and decisions:** Insert quality checks and tests into the sequence.
3. **Map the rework loops:** For every decision or inspection, define what happens if the part fails (e.g., scrap, rework, return to previous step).
4. **Group into sections:** Break large flows into logical sub-assemblies or phases for readability.
5. **Walk the process:** Verify the documented flow against reality.

## Common mistakes to avoid
- **Ignoring rework:** Documenting only the perfect flow and failing to map where non-conforming parts go.
- **Combining steps:** Grouping too many actions into one step (e.g., "Assemble and Test" should be at least two steps).
- **Inconsistent numbering:** Renumbering steps frequently, which breaks links to the PFMEA and Control Plan. Leave gaps (10, 20, 30) to allow for future additions.

## Quick example
| Step | Type | Description | Next Step | Next (If No) |
|---|---|---|---|---|
| 10 | Operation | Torque main bearing | 20 | |
| 20 | Inspection | Visual check of alignment mark | 30 (Yes) | 25 (No) |
| 25 | Rework | Loosen and realign bearing | 10 | |
| 30 | Operation | Install cover plate | 40 | |

## Quality checks for a good PFD
- Every branch and decision has a clear destination.
- Rework loops are explicitly mapped and don't lead to dead ends.
- Step numbering is sequential and logical.
- The flow accurately reflects what happens (or will happen) on the floor.

## How PFD connects to other pages
- **PFMEA:** Every operation step in the PFD must be analyzed for potential failure modes in the PFMEA.
- **Control Plan:** Control methods are assigned to specific PFD steps.
- **BOM:** Parts and materials are often allocated to the specific PFD step where they are consumed.

## Related
- [PFMEA](./50-pfmea.md)
- [Control Plan](./60-control-plan.md)
