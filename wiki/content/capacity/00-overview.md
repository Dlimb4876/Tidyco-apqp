# Capacity Planning

## High-level overview
Capacity is the organisational engine for strategic resource planning. It ensures that the business has a realistic, data-driven view of whether planned work (projects and production support) fits within the available people hours.

The platform provides a unified planning model used across multiple departments, ensuring that everyone calculates availability and demand using the same fundamental logic.

## The Five Capacity Streams
The system currently supports five distinct capacity streams:
- **[ME Capacity](./20-me-capacity.md):** Manufacturing Engineering project and support load.
- **[PM Capacity](./30-pm-capacity.md):** Project Management and coordination load.
- **[Logistics Capacity](./40-logistics-capacity.md):** Technician kitting and movement load.
- **[Unit 6 Capacity](./50-unit6-capacity.md):** Specialised facility capacity planning.
- **Production Dashboard:** Real-time shop-floor capacity views.

## Who should use it
- **Department Managers:** To justify headcount and manage department health.
- **Team Leads:** To allocate tasks and manage day-to-day workload.
- **Planners:** To verify that the build plan is achievable before it is published.

## Normal workflow
1. **Define the Team:** Set up team members with their baseline weekly hours and target utilisation (typically 80%).
2. **Record Availability Exceptions:** Log holidays, training, and bank holidays as early as possible.
3. **Set Support Assumptions:** Use **[Product Support](./80-product-support.md)** to define the effort required per production batch.
4. **Allocate Tasks:** Enter specific project tasks and assign them to owners to build a demand forecast.
5. **Monitor & Rebalance:** Regularly review the Capacity Chart. Use the "Rebalance" tools to move tasks or adjust assumptions if a month is overloaded.

## Prerequisites and permissions
- **Permissions:** You must have the appropriate department-level permissions to edit data within a specific stream.
- **Data Dependencies:** Requires a valid **[Production Schedule](../production/10-schedule.md)** to calculate schedule-driven demand.

## Calculations and formulas

### The Core Model
All streams follow the same basic calculation:
```text
Available Capacity = (Gross Work Days × Daily Hours) - Holiday Hours
Allocated Demand = Task Hours + (Support Hours per Batch × Number of Batches)
Utilization % = (Allocated Demand / Available Capacity) × 100
```

### Headroom vs Utilization
- **Utilization:** Tells you how much of your "planned" time is taken.
- **Headroom:** Tells you the exact number of hours you have left for "surprise" work or additional projects.

## Common process failures
- **Siloed Planning:** Updating task demand in ME without checking if the corresponding Logistics support demand is also realistic.
- **Ignoring Effective Dating:** Overwriting support rates instead of adding a new effective-dated entry, which erases historical accuracy.
- **Ghost Tasks:** Leaving old tasks open past their end dates, which artificially inflates demand.

## Related
- [Capacity Hub](./10-capacity-hub.md)
- [Product Support](./80-product-support.md)
- [Production Overview](../production/00-overview.md)
- [Operations Overview](../operations/00-overview.md)
