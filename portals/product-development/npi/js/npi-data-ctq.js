// npi-data-ctq.js
// PURPOSE: Supabase CRUD for the npi_ctq table.
// Split from npi-data-relational.js (Phase 1 refactor — see plans/pd-portal-refactor.md).
// All functions exported by name so npi-data-relational.js can re-export them unchanged.

// TODO (Phase 1): Move CTQ-related functions from npi-data-relational.js into this file.
// Each function should be a named export. Example shape:
//
// import { supa } from '../../../../core/js/supa.js'
// import { prog } from '../../../../core/js/state.js'
//
// export async function npiRelLoadCTQ(pid) { ... }
// export async function npiRelSaveCTQ(ctqId, fields) { ... }
// export async function npiRelAddCTQ(pid) { ... }
// export async function npiRelDeleteCTQ(ctqId) { ... }
