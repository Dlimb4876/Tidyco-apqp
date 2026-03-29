/* ============================================================
   me-data.js — ME Capacity Data Facade (ESM state)
   ============================================================ */

import { capUUID } from '../../shared/js/cap-data-utils.js'

export function meCreateDataState() {
  return {
    team: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: [],
    timeLogs: []
  }
}

export function meCreatePendingDeletes() {
  return {
    tasks: [],
    teams: [],
    supportHistory: [],
    products: []
  }
}

export const meDataState = meCreateDataState()
export const meDataPendingDeletes = meCreatePendingDeletes()

export let meDataSaveInProgress = false
export let meDataSaveQueued = false
export let meDataInitialized = false

export function setMeDataSaveInProgress(value) {
  meDataSaveInProgress = Boolean(value)
}

export function setMeDataSaveQueued(value) {
  meDataSaveQueued = Boolean(value)
}

export function setMeDataInitialized(value) {
  meDataInitialized = Boolean(value)
}

export function meUUID() {
  return capUUID()
}
