// npi-data-gates.js
// PURPOSE: Supabase CRUD for gate signoffs, gate selections, and gate status.
// Split from npi-data-relational.js (Phase 1 refactor — see plans/pd-portal-refactor.md).

// TODO (Phase 1): Move gate-related functions from npi-data-relational.js into this file.
// Each function should be a named export. Example shape:
//
// import { supa } from '../../../../core/js/supa.js'
// import { prog } from '../../../../core/js/state.js'
//
// export async function npiRelLoadGates(pid) { ... }
// export async function npiRelSaveGateSignoff(gateId, userId, fields) { ... }
// export async function npiRelSaveGateSelection(gateId, fields) { ... }
// export async function npiRelDeleteGateSignoff(signoffId) { ... }
