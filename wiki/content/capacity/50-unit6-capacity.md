# Unit 6 Capacity

## What this page is for
Unit 6 Capacity helps you plan technician workload in the Unit 6 stream.
It follows the same structure as ME, PM, and Logistics so planning is consistent.

## What to maintain
- Team setup (names and daily hours)
- Task demand for planned work
- Product-support rates where applicable
- Holiday reductions that affect real availability

## Monthly planning workflow
1. Confirm production batch outlook for the next 4-12 weeks.
2. Validate Unit 6 technician availability and planned leave.
3. Add or update known demand tasks with realistic hours.
4. Check utilisation and headroom by month.
5. Rebalance overload months before they become overdue actions.

## What to watch
- Monthly headroom trend
- Any month where allocated load is close to or above available hours
- Sudden load changes caused by batch schedule changes

## Key calculations (detailed)
### Available hours
```text
Available Hours = (Working Days × Daily Hours × Active Technicians) - Holiday Hours
```

### Allocated hours
```text
Allocated Hours = Sum of all Unit 6 task and support hours in the month
```

### Utilisation
```text
Utilisation % = (Allocated Hours / Available Hours) × 100
```

### Headroom
```text
Headroom Hours = Available Hours - Allocated Hours
```

Interpretation:
- Below 80% utilisation: generally comfortable
- 80-100%: close control needed
- Above 100%: overload requiring reschedule or reassignment

## Common pitfalls
- Loading demand before updating leave and availability
- Keeping old assumptions after production schedule changes
- Leaving work in "planned" without named ownership
- Ignoring repeated overload in the same month

## Practical escalation rules
- If forecast utilisation exceeds 100% for two consecutive months, raise capacity actions immediately.
- If critical tasks have no owner, assign before end of day.
- If headroom drops unexpectedly, check for new production batches first.

## Related
- [Capacity Hub](./10-capacity-hub.md)
- [Logistics Capacity](./40-logistics-capacity.md)
- [Production Schedule](../production/10-schedule.md)
