// ═══════════════════════════════════
// app.js — Entry point: launchApp and session initialisation
// Depends on: all other modules
// ═══════════════════════════════════

import { appState, db, prog, getFamilies, setCurrentUserRole } from './state.js';
import { supabase, setCurrentUser } from './supa.js';
import { doLogin } from './auth.js';
import {
  loadRemotePage,
  load,
  loadProjectById,
  subscribeProjectsGlobally,
  setSyncBadge,
  initProgSelect
} from './db.js';
import { esc, setupSmartDateInputs } from '../../utils/js/helpers.js';
import { parseHash, navigate, render } from '../../utils/js/navigation.js';
import { setupNetworkDetection } from './network.js';
import { familiesDataInit } from '../../portals/product-development/js/families-data.js'
import { familyTemplatesDataInit } from '../../portals/product-development/js/family-templates-data.js'
import { productsDataInit } from '../../portals/product-development/product-management/js/products-data.js'
import { meDataInit } from '../../portals/capacity/me/js/me-data-persistence.js'
import { pmDataInit, setPmTabState } from '../../portals/capacity/project-management/js/pm-capacity.js'
import { logDataInit } from '../../portals/capacity/logistics/js/log-capacity.js'
import { unit6DataInit } from '../../portals/capacity/unit6/js/unit6-data.js'
import { prodCapDataInit, prodCapLoadUtilization } from '../../portals/capacity/production/js/prod-capacity-data.js'
import { workAreasDataInit } from '../../portals/capacity/production/js/work-areas-data.js'
import { setMeTab } from '../../portals/capacity/me/js/me-capacity.js'
import { prodDataInit } from '../../portals/production/js/data.js'
import { npiEnsureProductProjects } from '../../portals/product-development/npi/js/npi.js'
import { settingsApplyAppearance } from '../../portals/settings/js/settings.js'
import { settingsEnsurePermissionsData } from '../../portals/settings/js/settings-teams.js'

// ── Populate family dropdowns ─────────────────────────────────
function populateFamilySelects() {
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

// Wrapper for doLogin to pass launchApp
export const wrappedDoLogin = () => doLogin(launchApp);

export async function launchApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display   = 'flex';
  setSyncBadge('syncing', '● loading…');

  // Apply saved appearance preferences immediately (before any renders)
  settingsApplyAppearance()

  populateFamilySelects();
  await loadRemotePage(0);
  if (db.projects.length === 0) load();
  subscribeProjectsGlobally();

  // Load Families data from database (dynamic family definitions)
  await familiesDataInit();
  await familyTemplatesDataInit(); // Load family PFMEA templates
  populateFamilySelects(); // Refresh with dynamic families

  // Load ME Capacity data (separate Supabase table, silent if table absent)
  await meDataInit();
  await pmDataInit()
  await logDataInit()
  await unit6DataInit()

  // Load user profiles for owner dropdowns (non-blocking, used across portals)
  settingsEnsurePermissionsData().catch(err => {
    console.error('Failed to load permissions data:', err)
  })

  // Load Production Planning data (separate Supabase tables, silent if tables absent)
  await prodDataInit();

  // Load Products Management data (separate Supabase tables, silent if tables absent)
  await productsDataInit();
  npiEnsureProductProjects()

  // Load Production Capacity settings (production_capacity table)
  await prodCapDataInit();

  // Load utilization factor (from user_settings or localStorage)
  await prodCapLoadUtilization();

  // Load Work Areas (work_areas table)
  await workAreasDataInit();

  // Restore previous page state from URL hash (e.g. after a page refresh)
  const h = parseHash();
  if (h.s) {
    appState.npiTab = h.nft || 'all';
    // Restore project from URL hash - trust the hash even if project not yet loaded
    // (avoids falling back to random project when paginated data doesn't include it yet)
    if (h.p) {
      appState.progId = h.p;
      // Fetch project if not in paginated data
      if (!prog()) loadProjectById(h.p).then(p => { if (p) render(); });
    }
    if (h.t)   appState.apqpTab               = h.t;
    if (h.ct)  appState.capacityTab           = h.ct;
    if (h.od)  appState.operationsTab         = h.od;
    if (h.pt)  appState.productionTab         = h.pt;
    if (h.pdt) appState.productDevelopmentTab = h.pdt;
    if (h.met) setMeTab(h.met);
    if (h.pct) appState.prodCapTab            = h.pct;
    if (h.pmt) setPmTabState(h.pmt)

    // Restore NPI Projects Dashboard filters
    if (h.ps)  appState.npiProjectsSearch       = decodeURIComponent(h.ps);
    if (h.pf)  appState.npiProjectsFamilyFilter = decodeURIComponent(h.pf);
    if (h.pst) appState.npiProjectsStatusFilter = decodeURIComponent(h.pst);
    if (h.pvm) appState.npiProjectsViewMode     = decodeURIComponent(h.pvm);

    // Restore BOM sub-tab
    if (h.bt)  appState.bomSubTab               = decodeURIComponent(h.bt);

    // Restore PFMEA filters
    if (h.pfr) appState.pfmeaRpnFilter          = decodeURIComponent(h.pfr);
    if (h.pfv) appState.pfmeaView               = decodeURIComponent(h.pfv);

    // Restore CTQ filters
    if (h.csf) appState.ctqSourceFilter         = decodeURIComponent(h.csf);
    if (h.cof) appState.ctqOosFilter            = decodeURIComponent(h.cof);
    if (h.caf) appState.ctqAgreedFilter         = decodeURIComponent(h.caf);

    // Restore tracker sub-assembly filter
    if (h.tsf) appState.trackerSubAsmFilter     = decodeURIComponent(h.tsf);

    navigate(h.s, { pushHash: false });
  } else {
    navigate('hub', { pushHash: false });
  }

  // Set default project only if no project was specified in URL hash
  initProgSelect();

  // 1.11 Smart date inputs — init after page renders
  setTimeout(setupSmartDateInputs, 200);

  // Network detection (browser online/offline + Supabase health checks)
  setupNetworkDetection();
}


// ── Kick off on page load if session exists ───────────────────
(async () => {
  settingsApplyAppearance()

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    // Stale/invalidated refresh token in localStorage — clear it and show login
    await supabase.auth.signOut();
    return;
  }
  if (session) {
    setCurrentUser(session.user);
    // Load role from profiles table so isAdmin() works correctly on session restore
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setCurrentUserRole(profile?.role || 'editor');
    } catch (_) {
      setCurrentUserRole('editor');
    }
    await launchApp();
  }
})();
