# Bill of Materials (BOM)

## What this page is for
The BOM (Bill of Materials) is the comprehensive list of resources required to deliver the project and support production.
In APQP, this goes beyond just the product's components; it includes parts, tools, equipment, materials, consumables, and kits necessary to execute the manufacturing process.

## Before you start
- Ensure you have the latest engineering drawings and parts lists.
- Identify the tooling and equipment required for the manufacturing process.
- Review the PFD to understand where resources will be consumed or utilized.

## Key components of a good BOM
- **Item Number & Description:** Clear identification of the resource.
- **Category:** Classification (e.g., Part, Tool, Equipment, Material, Consumable).
- **Quantity:** How many are required per unit or per batch.
- **Process Link:** The specific PFD step where the item is used or installed.
- **Part Class Badges (A/B/C):** Visual indicators linked to the Parts Database that highlight high-value or critical parts.

## BOM Views
- **Structure (Core BoM):** The hierarchical product tree for the main assembly (up to 4 levels deep).
- **AAW & Repair:** Separate named BoMs for after-warranty and repair scopes.
- **Parts Register:** A rolled-up aggregation of all parts showing unique items and summed quantities across all views.

## The analytical process
1. **Import product parts:** Start with the core components required to build the product.
2. **Identify process enablers:** For each step in the PFD, determine what tools, fixtures, or equipment are needed.
3. **Add consumables:** List indirect materials (e.g., grease, loctite, wipes) required by the process.
4. **Create kits:** Group related parts and consumables into logistical kits for easier line-side delivery.
5. **Verify:** Walk the PFD and ensure every required physical item is represented in the BOM.

## Common mistakes to avoid
- **Missing process tools:** Focusing only on the product parts and forgetting to list the custom fixtures or calibrated tools needed to build it.
- **Inconsistent categorization:** Mixing up "Materials" (raw stock) with "Consumables" (shop supplies), making filtering and procurement difficult.
- **Ignoring quantities:** Listing an item without specifying how much is needed per build.

## Quick example
| Category | Item Number | Description | Qty | Used at PFD Step |
|---|---|---|---|---|
| Part | BRG-102 | Main Flange Bearing | 2 | Step 20 |
| Consumable | LOC-243 | Loctite Threadlocker Blue | 5ml | Step 30 |
| Tool | FIX-99 | Bearing Alignment Fixture | 1 | Step 20 |

## Quality checks for a good BOM
- All custom tools and fixtures identified in the Control Plan or PFMEA are listed here.
- Parts are accurately linked to the PFD step where they are consumed.
- Quantities and units of measure are explicitly stated.

## How BOM connects to other pages
- **PFD:** BOM items are linked to the specific process steps where they are needed.
- **Parts Database:** The project BOM pulls standard items from the central product management parts database.
- **PFMEA:** Missing or incorrect parts/tools identified here can be causes of failure modes.

## Related
- [Parts Database](../product-management/40-parts-database.md)
- [Process Flow Diagram](./40-pfd.md)
