// ═══════════════════════════════════
// app.js — Entry point: launchApp and session initialisation
// Depends on: all other modules
// ═══════════════════════════════════

async function launchApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display   = 'flex';
  setSyncBadge('syncing', '● loading…');
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

  // Restore position from URL hash
  const h = parseHash();
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    progId = h.p;
    if (h.t) apqpTab = h.t;
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
