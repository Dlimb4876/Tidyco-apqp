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
  populateFamilySelects();
  await loadRemote();
  if (db.programmes.length === 0) load();
  if (db.programmes.length === 0) {
    const p = newProgTemplate('New Project', '', '', 'Other', '', '', new Date().toISOString().slice(0, 10));
    db.programmes.push(p);
    save();
  }
  initProgSelect();

  // Load Families data from database (dynamic family definitions)
  await familiesDataInit();
  await familyTemplatesDataInit(); // Load family PFMEA templates
  populateFamilySelects(); // Refresh with dynamic families

  // Load ME Capacity data (separate Supabase table, silent if table absent)
  await meDataInit();

  // Load Production Planning data (separate Supabase tables, silent if tables absent)
  await prodDataInit();

  // Load Products Management data (separate Supabase tables, silent if tables absent)
  await productsDataInit();

  // Restore position from URL hash
  const h = parseHash();
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    progId = h.p;
    if (h.t) apqpTab = h.t;
    if (h.ct) capacityTab = h.ct;
    if (h.pt) productionTab = h.pt;
    if (h.pdt) productDevelopmentTab = h.pdt;
    navigate(h.s || 'project', { pushHash: false });
  } else {
    navigate('hub', { pushHash: false });
  }
}

// ── Kick off on page load if session exists ───────────────────
(async () => {
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    currentUser = session.user;
    launchApp();
  }
})();
