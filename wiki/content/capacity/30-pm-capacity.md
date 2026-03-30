# PM Capacity

## High-level overview
PM Capacity provides Project Management teams with a strategic framework for resource planning. It allows PM leads to forecast coordinator and planning load against both fixed project tasks and variable production-driven support demand.

This tool ensures that the PM department can identify resource bottlenecks months in advance, allowing for effective recruitment or project re-prioritisation.

## Who should use it
- **PM Leads:** To manage overall department health and recruitment needs.
- **Project Coordinators:** To track their individual task load and identify upcoming pressure points.
- **Operations Managers:** To understand if PM resource is a constraint for upcoming production increases.

## Normal workflow
1. **Maintain Team Baseline:** Ensure all team members have correct start dates and weekly hours (typically 37.5).
2. **Update Holidays:** Record upcoming leave as early as possible, as this immediately reduces available capacity.
3. **Manage Tasks:** Enter project-specific tasks with start dates, end dates, and total hours. Assign these to specific team members to see individual utilization.
4. **Review Product Support:** Validate that the "Hours per Batch" for each product family is accurate for PM activity.
5. **Analyze the Chart:** Review the utilization trend. Any month over 100% (or the team's effective limit, usually 80%) requires a rebalancing action.

## Prerequisites and permissions
- **Permissions:** You must be in the "Project Management" or "Management" teams to edit PM Capacity data.
- **Data Inputs:** Requires an active Production Schedule to calculate schedule-driven demand.

## Calculations and formulas

### Capacity Calculation
The available capacity for the department is the sum of each team member's adjusted hours.

```text
Individual Capacity = (Weekly Hours × (Net Work Days in Month / 5) × (Target Utilisation / 100)) - Holiday Hours
```
*Note: Target Utilisation is typically set to 80% to allow for "untracked" time like meetings and admin.*

### Demand Calculation
Total demand is the sum of all allocated work.

```text
Total Demand = Sum(Active Task Hours) + Sum(Product Support Hours)
```

- **Task Hours:** Total task hours are spread linearly across the network days between the task's start and end dates.
- **Product Support Hours:** Calculated by multiplying the "Hours per Batch" by the number of production batches starting in that month.

### Utilization Percentage
```text
Utilization % = (Total Demand / Available Capacity) × 100
```
- **0-80%:** Healthy (Green)
- **80-100%:** Near capacity, requires monitoring (Yellow)
- **100%+:** Overloaded, requires mitigation (Red)

## Common process failures
- **Stale Task Dates:** Leaving tasks "open" with end dates in the past, which removes their demand from the forecast.
- **Ignoring Leave:** Failing to record holidays, leading to an overestimation of available capacity.
- **Undefined Owners:** Creating tasks without owners, which makes it difficult to rebalance the load.

## Related
- [ME Capacity](./20-me-capacity.md)
- [Logistics Capacity](./40-logistics-capacity.md)
- [Product Support](./80-product-support.md)
- [Capacity Hub](./10-capacity-hub.md)
