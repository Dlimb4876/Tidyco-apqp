/* ============================================================
   me-data.js — ME Capacity Data Facade (Global Namespace)
   Bootstrap state, save flags, and compatibility helpers only.

   Ownership of extracted modules:
   - me-data-normalize.js      => normalization helpers
   - me-data-support-history.js => product support history logic
   - me-data-entities.js       => team/task/product/holiday CRUD
   - me-data-persistence.js    => init/save/reset/diagnostics
   - me-data-realtime.js       => realtime subscriptions and row mapping
   ============================================================ */

function meCreateDataState() {
  return {
    team: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: [],
    timeLogs: []
  };
}

function meCreatePendingDeletes() {
  return {
    tasks: [],
    teams: [],
    supportHistory: [],
    products: []
  };
}

window.meDataState = meCreateDataState();
window.meDataPendingDeletes = meCreatePendingDeletes();

window.meDataSaveInProgress = false;
window.meDataSaveQueued = false;
window.meDataInitialized = false;

function meUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
