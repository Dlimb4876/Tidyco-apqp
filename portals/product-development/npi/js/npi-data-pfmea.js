// npi-data-pfmea.js
// PURPOSE: Supabase CRUD for PFMEA modes, effects, and causes tables.
// Split from npi-data-relational.js (Phase 1 refactor — see plans/pd-portal-refactor.md).

// TODO (Phase 1): Move PFMEA/effect/cause functions from npi-data-relational.js into this file.
// Each function should be a named export. Example shape:
//
// import { supa } from '../../../../core/js/supa.js'
// import { prog } from '../../../../core/js/state.js'
//
// export async function npiRelLoadPFMEA(pid) { ... }
// export async function npiRelSavePFMEAMode(modeId, fields) { ... }
// export async function npiRelAddPFMEAMode(pid) { ... }
// export async function npiRelDeletePFMEAMode(modeId) { ... }
// export async function npiRelSavePFMEAEffect(effectId, fields) { ... }
// export async function npiRelAddPFMEAEffect(modeId) { ... }
// export async function npiRelDeletePFMEAEffect(effectId) { ... }
// export async function npiRelSavePFMEACause(causeId, fields) { ... }
// export async function npiRelAddPFMEACause(effectId) { ... }
// export async function npiRelDeletePFMEACause(causeId) { ... }
