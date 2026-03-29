# Parts Database

This folder contains the standalone Parts Database subsystem for Product Development.

## Purpose

The Parts Database is the central catalogue for A, B, and C-class parts used across Product Development and NPI BoM flows.

Product Development owns this subsystem. NPI consumes it when a user needs to add catalogue parts into a project BOM, structure tree, or AAW/Repair assembly, but NPI should not own the catalogue implementation itself.

## Folder Structure

- `css/parts-database.css`
  ABC-specific styling for the catalogue page, picker, badges, class filter chips, and related modal content.

- `js/parts-data.js`
  Supabase access layer for catalogue CRUD and Where Used queries.

- `js/parts-modals.js`
  Injects Parts Database owned modals, including:
  - ABC class info
  - Add from Parts Database picker
  - Parts Database edit modal
  - Where Used modal

- `js/parts-database.js`
  Main UI/controller layer for:
  - catalogue rendering
  - picker rendering and selection
  - modal-based add/edit actions (no inline table editing)
  - modal open/save/delete actions
  - realtime catalogue refresh
  - Where Used display

## Ownership Rules

- Keep catalogue page logic in this folder.
- Keep picker modal/controller logic in this folder.
- Keep ABC-specific styling in this folder.
- NPI BoM files may call into `window.partsDatabase`, but they should stay thin callers only.
- Shared NPI files should not re-implement catalogue CRUD, picker rendering, or Parts Database modal markup.

## Integration Points

- Product Development route shell:
  `portals/product-development/js/product-development.js`

- NPI thin consumers:
  `portals/product-development/npi/js/bom.js`
  `portals/product-development/npi/js/bom-cclass.js`
  `portals/product-development/npi/js/npi-data-relational.js`

- Page load wiring:
  `index.html`

## Notes

- This subsystem currently uses shared global state from `core/js/state.js` for catalogue and picker state.
- If the subsystem grows further, the next cleanup would be to move its state into a dedicated Parts Database state layer instead of relying on shared globals.
