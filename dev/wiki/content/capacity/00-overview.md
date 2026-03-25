# Capacity

## What this area is for
Capacity is where teams check whether planned work fits inside available people hours.
It gives you one planning model across ME, PM, Logistics, and Unit 6, so everyone is working from the same logic.

## What you can do here
- Compare monthly available hours vs planned demand
- Maintain team setup (who is available and for how many hours per day)
- Plan task demand and product-support demand
- Reduce availability for holidays and leave
- Spot overload early and rebalance before it affects delivery

## The key calculation logic
- Available hours are built from team setup and working-day assumptions, then reduced by holidays.
- Planned demand combines task demand and product-support demand.
- Product-support demand is driven by production batches, not a fixed weeks-per-month multiplier.
- Utilization is calculated as allocated hours divided by available hours.
- Headroom is calculated as available hours minus allocated hours.

## How this links to other systems
- Production schedule feeds monthly batch demand used in capacity calculations.
- Operations People tab uses these outputs for cross-stream monitoring.
- Product Management data (products/families) supports product-related capacity rows.

## Related
- [Capacity Hub](./10-capacity-hub.md)
- [Production Overview](../production/00-overview.md)
- [Operations Overview](../operations/00-overview.md)
