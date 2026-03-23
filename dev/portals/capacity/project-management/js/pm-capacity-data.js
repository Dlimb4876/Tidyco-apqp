/* ============================================================
   pm-capacity-data.js — PM capacity data helpers
   Shared me_* tables with department='PM' filter
   ============================================================ */

window.pmCapacityData = {
  getTasks() {
    if (typeof meDataGetTasks !== 'function') return [];
    if (typeof meFilterByDepartment !== 'function') return meDataGetTasks();
    return meFilterByDepartment(meDataGetTasks(), 'PM', 'ME');
  },

  getTeam() {
    if (typeof meDataGetTeam !== 'function') return [];
    if (typeof meFilterByDepartment !== 'function') return meDataGetTeam();
    const allTeam = meDataGetTeam();
    const pmTeam = meFilterByDepartment(allTeam, 'PM', 'ME');
    return pmTeam.length > 0 ? pmTeam : allTeam;
  },

  getProducts() {
    if (typeof meDataGetProducts !== 'function') return [];
    if (typeof meFilterByDepartment !== 'function') return meDataGetProducts();
    const allProducts = meDataGetProducts();
    const pmProducts = meFilterByDepartment(allProducts, 'PM', 'ME');
    return pmProducts.length > 0 ? pmProducts : allProducts;
  }
};
