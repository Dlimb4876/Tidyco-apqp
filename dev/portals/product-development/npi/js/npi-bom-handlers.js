// npi-bom-handlers.js
// PURPOSE: Event handler functions for BOM mutations (add, edit, delete, move, link part).
// Split from bom.js (Phase 1 refactor — see plans/pd-portal-refactor.md).
// Handlers call npi-data-bom.js for persistence, then trigger a re-render.

// TODO (Phase 1): Move all add/edit/delete/move handler functions from bom.js into this file.
// Example shape:
//
// import { npiRelAddBOMNode, npiRelDeleteBOMNode, npiRelSaveBOMNode } from './npi-data-bom.js'
// import { showToast } from '../../../../utils/js/helpers.js'
//
// export async function bomHandleAddNode(pid, parentId) { ... }
// export async function bomHandleDeleteNode(nodeId) { ... }
// export async function bomHandleSaveField(nodeId, field, value) { ... }
// export async function bomHandleMoveTo(nodeId, newParentId) { ... }
// export async function bomHandleLinkPart(nodeId, partId) { ... }
