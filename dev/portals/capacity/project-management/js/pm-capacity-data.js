/* ============================================================
   pm-capacity-data.js — PM capacity data helpers
   Shared me_* tables with department='PM' filter
   ============================================================ */

window.pmCapacityData = {
  getTasks() {
    return typeof pmDataGetTasks === 'function' ? pmDataGetTasks() : [];
  },

  getTeam() {
    return typeof pmDataGetTeam === 'function' ? pmDataGetTeam() : [];
  },

  getProducts() {
    return typeof pmDataGetProducts === 'function' ? pmDataGetProducts() : [];
  }
};
