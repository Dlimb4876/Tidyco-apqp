# Plan by Product

## What this page is for
Plan by Product reorganizes the master schedule by grouping batches under each specific product.
It helps teams spot product-level loading pressure and delivery cadence over time.

## Before you start
- Ensure the master Schedule is up to date with accurate batch quantities and dates.
- Understand the required delivery intervals for your key products.

## Key components
- **Product Grouping:** All batches for a single product shown together.
- **Timeline View:** A chronological layout of when runs occur.
- **Overlap Indicators:** Highlighting where multiple batches of the same product run concurrently.

## The analytical process
1. **Review frequency:** Check if the intervals between batches match customer demand.
2. **Identify overlaps:** Spot instances where two batches of the same product run at the same time, which might strip shared tooling or parts.
3. **Check consistency:** Ensure batch quantities are relatively stable unless there is a known demand spike.
4. **Adjust:** Move start dates in the master schedule to smooth out product-specific spikes.

## Common mistakes to avoid
- **Ignoring tooling constraints:** Scheduling parallel batches of a product when you only have one set of test rigs.
- **Over-batching:** Clumping too many units into a single long run instead of smaller, manageable batches.

## Quick example
| Product | Batch | Start Date | Due Date | Status | Note |
|---|---|---|---|---|---|
| **HVAC Base Unit** | | | | | |
| | Batch 1 (Qty 5) | 01-Apr | 14-Apr | Complete | |
| | Batch 2 (Qty 5) | 15-Apr | 28-Apr | Planned | *Good spacing* |
| | Batch 3 (Qty 5) | 20-Apr | 05-May | Planned | *⚠️ Tooling conflict with Batch 2* |

## How Plan by Product connects to other pages
- **Schedule:** Directly reads data from the master schedule table.
- **Product Catalogue:** Uses product definitions and names.
- **Overhaul Trends:** Future scheduled batches eventually become historical overhaul data.

## Related
- [Schedule](./10-schedule.md)
- [Plan by Work Area](./30-plan-by-work-area.md)
