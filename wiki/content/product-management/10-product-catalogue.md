# Product Catalogue

## What this page is for
Product Catalogue is the master list of all products used throughout planning and APQP.
It acts as a controlled data set that drives downstream workflows, rather than just a display list.

## Before you start
- Ensure you have the correct naming conventions and reference numbers.
- Know which Product Family the new product belongs to.

## Key components
- **Product Name & Reference:** The standard identifiers used across the platform.
- **Family:** Groups the product for reporting and allows inheritance of PFMEA templates.
- **Status:** Lifecycle state (e.g., Tender, Active, Obsolete).
- **Overhaul Time:** The baseline hours required to overhaul or build one unit.

## The management process
1. **Create:** Add the product with its core metadata and assign it to a Family.
2. **Set Baseline:** Define the standard overhaul hours (this feeds capacity calculations).
3. **Manage Status:** Update the status as the product moves from Tender into Production.
4. **Maintain:** Ensure names stay consistent so scheduling and reporting remain accurate.

## Common mistakes to avoid
- **Orphaned products:** Leaving the Family blank, which prevents the product from inheriting standard PFMEA templates.
- **Stale statuses:** Leaving a product in "Tender" when it is actively being scheduled in Production.
- **Duplication:** Creating "Widget V2" instead of managing the lifecycle of the original "Widget".

## Quick example
| Product Name | Reference | Family | Status | Overhaul Time |
|---|---|---|---|---|
| HVAC Base Unit | HVAC-100 | Air Conditioning | Active | 45 hrs |
| Main Air Valve | MAV-01 | Pneumatics | Tender | 12 hrs |

## Related
- [Product Families](./30-product-families.md)
- [NPI Projects](../product-development/10-npi-projects.md)
