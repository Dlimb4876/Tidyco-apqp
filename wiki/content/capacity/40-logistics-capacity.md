# Logistics Capacity

## High-level overview
Logistics Capacity is a specialised resource planning tool for technicians and logistics personnel. Unlike engineering-focused streams, Logistics is heavily driven by physical product throughput (kitting, movements, and bookings).

This tool allows the Logistics Lead to see how changes in the Production Schedule will impact the physical workload of the kitting team and identifying potential bottlenecks in parts availability or kit readiness.

## Who should use it
- **Logistics Lead:** To plan shift patterns and technician allocations.
- **Production Planners:** To understand if the current build plan is logistically feasible.
- **Supply Chain Managers:** To coordinate intake and booking-in activity with available resource.

## Normal workflow
1. **Team Baseline:** Maintain technician headcount and individual working hours.
2. **Leave Planning:** Ensure all technician holidays and training days are logged.
3. **Task Management:** Enter logistics-specific tasks (e.g., stocktakes, reorganisation) that take up technician time outside of product support.
4. **Maintain Support Constants:** Update the three core time components (Kitting, Booking, Movement) for each product family as processes improve.
5. **Review Capacity Chart:** Monitor the chart for peaks and troughs, and use the "Rebalance" feature to move tasks or adjust shifts.

## Prerequisites and permissions
- **Permissions:** Restricted to the "Logistics" or "Operations" permission groups.
- **Data Inputs:** Relies on the **Production Schedule** for batch counts and timing.

## Calculations and formulas

### Capacity Calculation
Logistics follows the standard organisational capacity model:
```text
Capacity = (Weekly Hours × (Work Days / 5) × (Efficiency %)) - Holiday Hours
```
*Note: Efficiency defaults to 80% for technicians to account for general admin and shop-floor activity.*

### Product Support Demand
Logistics uses a multi-component model to calculate support load per product.
```text
Total Support Hours = (Kitting + Booking + Movement) × Number of Batches in Month
```

- **Kitting:** The time taken to pick, verify, and containerise a full batch kit.
- **Booking In/Out:** The time taken to process system entries for parts coming into or out of a batch.
- **Movement:** The time taken for physical forklift or trolley movements of the batch within the facility.

### Overall Demand
```text
Total Demand = Sum(Support Hours) + Sum(Assigned Task Hours)
```

## Common process failures
- **Ignoring Batch Complexity:** Treating all batches as identical, even when kitting requirements differ significantly (ensure "Hours per Batch" is updated for complex variations).
- **Outdated Components:** Failing to update the Kitting/Booking/Movement components when a new process (e.g., automated booking) is introduced.
- **Treating Technicians as 100% Available:** Logistics is a physical environment; ensure target efficiency is set realistically to allow for toolbox talks and equipment maintenance.

## Related
- [Product Support](./80-product-support.md)
- [Production Schedule](../production/10-schedule.md)
- [Unit 6 Capacity](./50-unit6-capacity.md)
- [Capacity Hub](./10-capacity-hub.md)
