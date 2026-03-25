# Plan by Work Area

## What this page is for
Plan by Work Area groups the master schedule by physical location (e.g., Unit 2, Unit 3, Unit 6).
It helps production managers balance floor space, avoid local bottlenecks, and visualize facility load.

## Before you start
- Ensure all batches in the Schedule have a designated Work Area assigned.
- Know the physical constraints and headcount limits of each area.

## Key components
- **Area Grouping:** Batches organized by their assigned physical unit.
- **Density Tracking:** How many concurrent batches are in the same space.
- **Status Distribution:** The mix of Planned, In Progress, and Complete work per area.

## The analytical process
1. **Assess density:** Look for heavy due-date or start-date clustering in one specific area.
2. **Balance load:** If Unit 2 has 15 overlapping batches and Unit 3 has 2, consider shifting compatible work to Unit 3.
3. **Check flow:** Identify areas where status progression is slower than expected (e.g., many "In Progress" batches but few "Complete").
4. **Adjust:** Reassign work areas or stagger dates in the master schedule.

## Common mistakes to avoid
- **Floor space overload:** Scheduling more parallel batches in an area than there are physical assembly bays.
- **Ignoring cross-unit dependencies:** Moving a batch to a unit that doesn't have the necessary cranes or specialized equipment.

## Quick example
| Work Area | Batch | Product | Start Date | Due Date | Status |
|---|---|---|---|---|---|
| **Unit 2** | | | | | |
| | B-101 | HVAC Base | 01-Apr | 14-Apr | In Progress |
| | B-102 | Comp Valve | 05-Apr | 10-Apr | In Progress |
| **Unit 6** | | | | | |
| | B-103 | Main Air | 15-Apr | 30-Apr | Planned |

## How Plan by Work Area connects to other pages
- **Schedule:** Directly reads data from the master schedule table.
- **Operations People Tab:** High physical load in a Work Area usually correlates with high utilization in that area's Capacity stream.
- **Production Capacity:** Feeds the utilization and headroom calculations for Operations.

## Related
- [Schedule](./10-schedule.md)
- [Capacity Overview](../capacity/00-overview.md)
