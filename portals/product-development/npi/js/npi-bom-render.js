// npi-bom-render.js
// PURPOSE: All HTML-generating functions for the BOM view.
// Split from bom.js (Phase 1 refactor — see plans/pd-portal-refactor.md).
// Render functions are pure: they take data in, return HTML strings out.
// No Supabase calls, no event binding, no DOM mutation here.

// TODO (Phase 1): Move all HTML template / render functions from bom.js into this file.
// Example shape:
//
// import { esc } from '../../../../utils/js/helpers.js'
//
// export function renderBOMTabShell(project) { ... }
// export function renderBOMTreeRows(nodes, depth) { ... }
// export function renderBOMPartRow(part) { ... }
// export function renderBOMSummaryPills(project) { ... }
// export function renderBOMEmptyState() { ... }
