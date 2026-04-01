// npi-data-bom.js
// PURPOSE: Supabase CRUD for BOM tree nodes, kits, and ABC catalogue lookups.
// Split from npi-data-relational.js (Phase 1 refactor — see plans/pd-portal-refactor.md).

// TODO (Phase 1): Move BOM-related functions from npi-data-relational.js into this file.
// Each function should be a named export. Example shape:
//
// import { supa } from '../../../../core/js/supa.js'
// import { prog } from '../../../../core/js/state.js'
//
// export async function npiRelLoadBOM(pid) { ... }
// export async function npiRelSaveBOMNode(nodeId, fields) { ... }
// export async function npiRelAddBOMNode(pid, parentId) { ... }
// export async function npiRelDeleteBOMNode(nodeId) { ... }
// export async function npiRelMoveBOMNode(nodeId, newParentId) { ... }
// export async function npiRelLoadABCCatalogue() { ... }
