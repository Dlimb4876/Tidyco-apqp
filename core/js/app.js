// ═══════════════════════════════════
// app.js — Entry point: launchApp and session initialisation
// Depends on: all other modules
// ═══════════════════════════════════

// ── Populate family dropdowns ─────────────────────────────────
function populateFamilySelects() {
  // Use dynamic families from database if available, fallback to state.js constants
  const families = (familiesState?.families && familiesState.families.length > 0)
    ? familiesState.families
    : getFamilies();

  ['np_family', 'ep_family'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = families.map(f => `<option value="${esc(f.id)}">${esc(f.icon)} ${esc(f.label)}</option>`).join('');
    // Restore previous selection if still valid
    if (current && [...select.options].some(o => o.value === current)) select.value = current;
  });
}

async function launchApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display   = 'flex';
  setSyncBadge('syncing', '● loading…');

  // Apply saved appearance preferences immediately (before any renders)
  if (typeof settingsApplyAppearance === 'function') settingsApplyAppearance();

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
  if (typeof pmDataInit === 'function') await pmDataInit();
  if (typeof logDataInit === 'function') await logDataInit();
  if (typeof unit6DataInit === 'function') await unit6DataInit();

  // Load user profiles for owner dropdowns (non-blocking, used across portals)
  if (typeof settingsEnsurePermissionsData === 'function') {
    settingsEnsurePermissionsData().catch(err => {
      console.error('Failed to load permissions data:', err)
    });
  }

  // Load Production Planning data (separate Supabase tables, silent if tables absent)
  await prodDataInit();

  // Load Products Management data (separate Supabase tables, silent if tables absent)
  await productsDataInit();
  if (npi && npi.dashboard && typeof npi.dashboard.ensureProductProjects === 'function') {
    npi.dashboard.ensureProductProjects();
  }

  // Load Production Capacity settings (production_capacity table)
  await prodCapDataInit();

  // Load utilization factor (from user_settings or localStorage)
  await prodCapLoadUtilization();

  // Load Work Areas (work_areas table)
  await workAreasDataInit();

  // Restore previous page state from URL hash (e.g. after a page refresh)
  const h = parseHash();
  if (h.s) {
    npiTab = h.nft || 'all';
    // Restore project from URL hash - trust the hash even if project not yet loaded
    // (avoids falling back to random project when paginated data doesn't include it yet)
    if (h.p) {
      progId = h.p;
      // Fetch project if not in paginated data
      if (!prog()) loadProjectById(h.p).then(p => { if (p) render(); });
    }
    if (h.t)   apqpTab               = h.t;
    if (h.ct)  capacityTab           = h.ct;
    if (h.od)  operationsTab         = h.od;
    if (h.pt)  productionTab         = h.pt;
    if (h.pdt) productDevelopmentTab = h.pdt;
    if (h.met) meTab                 = h.met;
    if (h.pct) prodCapTab            = h.pct;
    if (h.pmt) pmTab                 = h.pmt;

    // Restore NPI Projects Dashboard filters
    if (h.ps)  npiProjectsSearch       = decodeURIComponent(h.ps);
    if (h.pf)  npiProjectsFamilyFilter = decodeURIComponent(h.pf);
    if (h.pst) npiProjectsStatusFilter = decodeURIComponent(h.pst);
    if (h.pvm) npiProjectsViewMode     = decodeURIComponent(h.pvm);

    // Restore BOM sub-tab
    if (h.bt)  bomSubTab               = decodeURIComponent(h.bt);

    // Restore PFMEA filters
    if (h.pfr) pfmeaRpnFilter          = decodeURIComponent(h.pfr);
    if (h.pfv) pfmeaView               = decodeURIComponent(h.pfv);

    // Restore CTQ filters
    if (h.csf) ctqSourceFilter         = decodeURIComponent(h.csf);
    if (h.cof) ctqOosFilter            = decodeURIComponent(h.cof);
    if (h.caf) ctqAgreedFilter         = decodeURIComponent(h.caf);

    // Restore tracker sub-assembly filter
    if (h.tsf) trackerSubAsmFilter     = decodeURIComponent(h.tsf);

    navigate(h.s, { pushHash: false });
  } else {
    navigate('hub', { pushHash: false });
  }

  // Set default project only if no project was specified in URL hash
  initProgSelect();

  // 1.11 Smart date inputs — init after page renders
  setTimeout(setupSmartDateInputs, 200);

  // Network detection (browser online/offline + Supabase health checks)
  if (typeof setupNetworkDetection === 'function') {
    setupNetworkDetection();
  }
}


// ── Kick off on page load if session exists ───────────────────
(async () => {
  if (typeof settingsApplyAppearance === 'function') settingsApplyAppearance();

  const { data: { session }, error } = await supa.auth.getSession();
  if (error) {
    // Stale/invalidated refresh token in localStorage — clear it and show login
    await supa.auth.signOut();
    return;
  }
  if (session) {
    currentUser = session.user;
    // Load role from profiles table so isAdmin() works correctly on session restore
    try {
      const { data: profile } = await supa
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      currentUserRole = profile?.role || 'editor';
    } catch (_) {
      currentUserRole = 'editor';
    }
    launchApp();
  }
})();
