import { 
  getFamilies, esc, db, setSyncBadge, save, newProgTemplate, initProgSelect, 
  setProgId, setApqpTab, setCapacityTab, setProductionTab, setProductDevelopmentTab 
} from './state.js';
import { loadRemote, load } from './db.js';
import { supa, currentUser, setCurrentUser } from './auth.js';
import { meDataInit } from '../../portals/capacity/js/me-data.js';
import { prodDataInit } from '../../portals/production/js/data.js';
import { productsDataInit } from '../../portals/product-development/product-management/js/products-data.js';
import { parseHash, navigate, goHome, goProjects, setApqpTab as navSetApqpTab } from '../../utils/js/navigation.js';
import { doLogin, doLogout } from './auth.js';
import { exportJSON, importJSON } from './db.js';
import { closeModal, createProg, deleteProject, saveEditProject } from '../../portals/product-development/npi/js/dashboard.js';
import { confirmInsert, saveCtqPick, saveBomPick, saveKitPick } from '../../portals/product-development/npi/js/apqp.js';
import { 
  meSetTab, meOnMonthChange, meOnNextMonth, meOnPrevMonth, meOnSave 
} from '../../portals/capacity/js/me-capacity.js';
import { meUIAddTeam, meUIUpdateTeam, meUIDeleteTeam } from '../../portals/capacity/js/me-team.js';
import { meAddDefaultTask } from '../../portals/capacity/js/me-tasks.js';
import { meOpenAdvancedEstimationModal } from '../../portals/capacity/js/me-advanced-estimation.js';
import { meAddDefaultProduct } from '../../portals/capacity/js/me-products.js';
import { meToggleHoliday } from '../../portals/capacity/js/me-holidays.js';
import { prodSetActiveUnit } from '../../portals/production/js/production.js';
import { prodSetWeekOffset } from '../../portals/production/js/planning.js';
import { 
  addNewBatchRow, focusBatchNewRow, calcBatchDueDate, toggleHideCompleteBatches, 
  toggleBatchSelection, toggleAllBatchesSelection, promptShiftDates 
} from '../../portals/production/js/scheduling.js';
import { prodDataUpdateBatch, prodDataDeleteBatch } from '../../portals/production/js/data.js';
import { 
  pmEditFamily, pmDeleteFamily, pmShowAddForm, pmSaveNew, pmCloseEditModal, pmSaveEdit 
} from '../../portals/productmgmt/js/productmgmt.js';
import { updateGateCheck, promptSignGate } from '../../portals/product-development/npi/js/gates.js';
import { 
  updPFD, delPFD, addMainStep, openInsert, scrollToPfd, toggleGroup, delBomRef, 
  openCtqPick, openBomPick, updCP, delCP, addCP, syncFromPFMEA 
} from '../../portals/product-development/npi/js/apqp.js';
import { 
  updPFMEA, delPFMEA, addPFMEA, setPfmeaFilter, toggleHistory 
} from '../../portals/product-development/npi/js/pfmea.js';
import { 
  updAction, delAction, addAction, updRisk, delRisk, addRisk, refreshRS 
} from '../../portals/product-development/npi/js/trackers.js';
import { 
  updBOM, delBOM, addBOM, setBomFilter, setBomSubTab 
} from '../../portals/product-development/npi/js/bom.js';

// Expose globals for HTML event handlers and portal functionality
Object.assign(window, {
  // Navigation & Core
  doLogin, doLogout, navigate, goHome, goProjects, setApqpTab,
  exportJSON, importJSON, closeModal, createProg, deleteProject, saveEditProject,
  confirmInsert, saveCtqPick, saveBomPick, saveKitPick,
  
  // ME Capacity Portal
  meSetTab, meOnMonthChange, meOnNextMonth, meOnPrevMonth, meOnSave,
  meUIAddTeam, meUIUpdateTeam, meUIDeleteTeam, meAddDefaultTask, 
  meOpenAdvancedEstimationModal, meAddDefaultProduct, meToggleHoliday,
  
  // Production Planning Portal
  setProductionTab, prodSetActiveUnit, prodSetWeekOffset,
  addNewBatchRow, focusBatchNewRow, calcBatchDueDate, toggleHideCompleteBatches,
  toggleBatchSelection, toggleAllBatchesSelection, promptShiftDates,
  prodDataUpdateBatch, prodDataDeleteBatch,
  
  // Product Management Portal
  pmEditFamily, pmDeleteFamily, pmShowAddForm, pmSaveNew, pmCloseEditModal, pmSaveEdit,
  
  // NPI Portal (Gates, PFMEA, Action Tracker, Risks, BOM)
  updateGateCheck, promptSignGate, updPFD, delPFD, addMainStep, openInsert, 
  scrollToPfd, toggleGroup, delBomRef, openCtqPick, openBomPick, updCP, delCP, 
  addCP, syncFromPFMEA, updPFMEA, delPFMEA, addPFMEA, setPfmeaFilter, 
  toggleHistory, updAction, delAction, addAction, updRisk, delRisk, addRisk, 
  refreshRS, updBOM, delBOM, addBOM, setBomFilter, setBomSubTab
});

// ── Application Bootstrapping ───────────────────────────────
export function populateFamilySelects() {
  const families = getFamilies();
  ['np_family', 'ep_family'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = families.map(f => `<option value="${esc(f.id)}">${esc(f.icon)} ${esc(f.label)}</option>`).join('');
    // Restore previous selection if still valid
    if (current && [...select.options].some(o => o.value === current)) select.value = current;
  });
}

export async function launchApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display   = 'flex';
  setSyncBadge('syncing', '● loading…');
  populateFamilySelects();
  await loadRemote();
  if (db.programmes.length === 0) load();
  if (db.programmes.length === 0) {
    const p = newProgTemplate('New Project', '', '', 'Other', '', '', new Date().toISOString().slice(0, 10));
    db.programmes.push(p);
    save();
  }
  initProgSelect();

  // Load ME Capacity data (separate Supabase table, silent if table absent)
  await meDataInit();

  // Load Production Planning data (separate Supabase tables, silent if tables absent)
  await prodDataInit();

  // Load Products Management data (separate Supabase tables, silent if tables absent)
  await productsDataInit();

  // Restore position from URL hash
  const h = parseHash();
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    setProgId(h.p);
    if (h.t)   setApqpTab(h.t);
    if (h.ct)  setCapacityTab(h.ct);
    if (h.pt)  setProductionTab(h.pt);
    if (h.pdt) setProductDevelopmentTab(h.pdt);
    navigate(h.s || 'project', { pushHash: false });
  } else {
    navigate('hub', { pushHash: false });
  }
}

// ── Kick off on page load if session exists ───────────────────
(async () => {
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    setCurrentUser(session.user);
    launchApp();
  }
})();
