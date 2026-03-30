# ME Capacity

## High-level overview
ME Capacity is the primary resource planning tool for the Manufacturing Engineering department. It provides a data-driven view of engineering availability against a complex mix of fixed project tasks (NPI, Improvements) and variable production-support demand.

By balancing these two demand types, ME leads can ensure that engineers are not overloaded, project milestones remain achievable, and production support remains stable during peak overhaul periods.

## Who should use it
- **ME Manager:** To oversee total department capacity and justify resource requests or recruitment.
- **Manufacturing Engineers:** To track their assigned tasks and understand their personal utilization for upcoming months.
- **Project Managers:** To check if ME resource is available to support new NPI or improvement projects.

## Normal workflow
1. **Maintain Team Baseline:** Ensure every engineer has an accurate start date and weekly hours baseline.
2. **Manage Leave:** Log holidays and training days as soon as they are known to ensure capacity is not overestimated.
3. **Task Allocation:** Enter NPI and Improvement tasks with specific effort hours and date ranges. Assign these to engineers to see individual load.
4. **Audit Support Rates:** Regularly review the "Hours per Batch" for each product family to ensure they reflect current engineering effort.
5. **Analyze Trends:** Use the Capacity Chart to identify "Pressure Months" (utilization > 100%) and take rebalancing actions early.

## Prerequisites and permissions
- **Permissions:** Editing requires "ME" or "Management" permission levels.
- **Data Inputs:** Relies on the **Production Schedule** to calculate schedule-driven support demand.

## Calculations and formulas

### Capacity Calculation
The available engineering capacity is calculated per person and then aggregated.
```text
Engineer Capacity = (Weekly Hours × (Work Days / 5) × (Target Efficiency / 100)) - Holiday Hours
```
*Note: Target Efficiency for ME is typically 80% to account for shop-floor support, meetings, and unlogged admin.*

### Demand Categories
ME demand is split into several categories for clearer analysis:
- **NPI:** New Product Introduction project work.
- **Improvement:** Continuous improvement or facility projects.
- **Tendering:** Support for new business bids.
- **Support:** Production-driven load (Support Hours per Batch × Number of Batches).
- **Other:** General engineering activity.

### Utilization Percentage
```text
Utilization % = (Total Demand / Total Capacity) × 100
```

## Common process failures
- **Linear Smoothing Assumptions:** Assuming a 100-hour task is perfectly linear across 4 months when the bulk of the work is in month 1 (use multiple smaller tasks if front-loading is significant).
- **Stale "In Progress" Tasks:** Leaving tasks open after they are physically complete, which continues to consume "ghost" capacity in the forecast.
- **Missing Holiday Data:** Especially during summer or Christmas periods, failing to log leave can hide significant capacity risks.

## Related
- [Product Support](./80-product-support.md)
- [PM Capacity](./30-pm-capacity.md)
- [Logistics Capacity](./40-logistics-capacity.md)
- [Capacity Hub](./10-capacity-hub.md)
