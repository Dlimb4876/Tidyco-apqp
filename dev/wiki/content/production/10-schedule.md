# Schedule

## What this page is for
The Schedule is the master production planning page.

It is the source of truth for:
- What is being produced
- Where work will happen
- When each batch starts and is due
- How much volume is planned

## Before you start
- Ensure all required products exist in the Product Catalogue.
- Verify you have clear customer delivery dates to drive scheduling.

## Key components of a scheduled batch
- **Product:** The specific item being overhauled or manufactured.
- **Work Area:** Where the physical work will take place (e.g., Unit 2, Unit 6).
- **Quantity:** How many units are in the batch.
- **Dates:** Planned start and due dates.
- **Status:** Current state (e.g., Planned, In Progress, Complete).

## The scheduling process
1. **Create the batch:** Add a new row for the required product and quantity.
2. **Assign the area:** Select the target Work Area based on available physical space.
3. **Set the timeline:** Define realistic Start and Due dates.
4. **Track progress:** Update the Status as the batch moves through the shop floor.
5. **Close out:** Mark the batch as Complete once all units are delivered.

## High-level usage guidance
- Use this page first when planning future delivery.
- Keep statuses up to date to avoid misleading downstream dashboards.
- Treat date changes as cross-functional changes because they affect capacity demand.

## Common mistakes to avoid
- **Stale statuses:** Leaving completed work as "In Progress", which skews Flow metrics.
- **Missing work areas:** Creating batches without a designated area, making them invisible in area-based planning views.
- **Unrealistic dates:** Scheduling a batch to complete on a Sunday when the shop floor is closed.

## Quick example
| Product | Work Area | Qty | Start Date | Due Date | Status |
|---|---|---|---|---|---|
| HVAC Base Unit | Unit 2 | 5 | 2026-04-01 | 2026-04-14 | Planned |
| Main Air Valve | Unit 6 | 12 | 2026-03-15 | 2026-03-30 | In Progress |

## How Schedule connects to other pages
- **Capacity Product Support:** Monthly support demand is calculated directly from these scheduled batch counts.
- **Operations Flow:** Batch statuses drive the throughput and delivery health metrics.
- **Plan by Product / Work Area:** These views group and visualize the raw data from this schedule.

## Calculations (detailed)
The Schedule itself is data-entry driven, but downstream pages use its values for planning calculations.

### Capacity-linked product support demand
When product support is configured, planned schedule volume contributes to capacity demand:

```text
Support Demand Hours = Batch Quantity × Support Hours per Unit
```

If several batches exist in the same planning period, those support-demand hours are aggregated.

### Why this matters
- Increasing quantity increases support demand proportionally.
- Pulling a batch forward can increase near-term utilisation in capacity views.
- Marking batches complete improves flow and delivery reporting accuracy.

## Related
- [Plan by Product](./20-plan-by-product.md)
- [Plan by Work Area](./30-plan-by-work-area.md)
- [Product Support](../capacity/80-product-support.md)
