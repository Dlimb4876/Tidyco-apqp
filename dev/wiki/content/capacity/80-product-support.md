# Product Support

## High-level overview
Product Support defines the "Standard Effort" required from each department to support a single production batch of a specific product family. These values are the engine that converts a Production Schedule into a departmental workload forecast.

By maintaining accurate support rates, departments like ME, PM, and Logistics can automatically see their future demand shift as the build plan changes, without needing to manually update individual tasks.

## Who should use it
- **Department Leads:** To set the baseline support assumptions for their teams.
- **Manufacturing Engineers:** To update support hours after process improvements or cycle-time studies.
- **Logistics Leads:** To manage the three-component support model (Kitting, Booking, Movement).

## Normal workflow
1. **Identify the Product:** Select the correct product family (e.g., "Standard Hoses", "Kits", "Overhaul").
2. **Review Current Rate:** Check the existing support hours per batch.
3. **Apply New Rate with Effective Date:** If a process change occurs, enter the new hours and set the date it takes effect. **Do not overwrite history.**
4. **Provide Justification:** Enter a clear reason for the change (e.g., "Reduced kitting time due to new racking layout").
5. **Verify Forecast Impact:** Navigate to your department's Capacity Chart to see how the change impacts the "Support" demand category in future months.

## Prerequisites and permissions
- **Permissions:** Editing support rates usually requires "Lead" or "Manager" level permissions within the specific department (ME, PM, or Logistics).
- **Data Inputs:** Requires valid Product Database entries to link support rates to.

## Calculations and formulas

### Monthly Support Demand
The core calculation used across all capacity streams:
```text
Monthly Support Demand = Support Hours per Batch × Number of Batches Starting in Month
```

### Logistics Component Model
Logistics uses a more granular model where the total support hours are the sum of three distinct activities:
```text
Logistics Support per Batch = Kitting Hours + Booking In/Out Hours + Product Movement Hours
```

### Effective Dating Logic
The system uses the "Effective Date" to determine which rate to apply to a specific batch:
- If a batch starts on 2026-06-15, the system looks for the support rate with the most recent effective date *on or before* 2026-06-15.
- This allows for "Future Dating" where a known process change (e.g., new machinery) can be scheduled in advance, and the capacity chart will show the demand drop only from that date forward.

## Common process failures
- **Overwriting Instead of Effective Dating:** Changing the current rate to a new value without using a new effective date, which "corrupts" historical capacity reports.
- **Vague Justifications:** Entering "Updated" as a reason, making it impossible to audit why demand changed six months later.
- **Ignoring Schedule Alignment:** Failing to update support rates when the *nature* of a batch changes (e.g., a batch size doubles, but the "Hours per Batch" is left the same).

## Related
- [ME Capacity](./20-me-capacity.md)
- [PM Capacity](./30-pm-capacity.md)
- [Logistics Capacity](./40-logistics-capacity.md)
- [Production Schedule](../production/10-schedule.md)
- [Capacity Hub](./10-capacity-hub.md)
