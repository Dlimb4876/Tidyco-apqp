// ═══════════════════════════════════
// db.js — Supabase persistence and data migration
// Depends on: state.js, auth.js (supa, currentUser)
// ═══════════════════════════════════

let saveTimer = null;

// ── Auto-resize textareas ─────────────────────────────────────
function autoResizeAll() {
  document.querySelectorAll('textarea[data-autoresize]').forEach(el => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}
document.addEventListener('input', e => {
  if (e.target.tagName === 'TEXTAREA' && e.target.dataset.autoresize !== undefined) {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }
});

// ── Save ──────────────────────────────────────────────────────
function save() {
  try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveRemote, 800);
  setSyncBadge('syncing', '● saving…');
}

async function saveRemote() {
  if (!currentUser) return;
  const email = currentUser.email;
  const now   = new Date().toISOString();
  try {
    for (const p of db.programmes) {
      const { data: updated, error: updErr } = await supa
        .from('programmes')
        .update({ name: p.name, updated_at: now, updated_by: email, data: p })
        .eq('prog_id', p.id)
        .select();
      if (updErr) { console.error('Update err', updErr); setSyncBadge('error', '● save failed'); return; }
      if (!updated || updated.length === 0) {
        const { error: insErr } = await supa
          .from('programmes')
          .insert({ prog_id: p.id, name: p.name, updated_at: now, updated_by: email, data: p });
        if (insErr) { console.error('Insert err', insErr); setSyncBadge('error', '● save failed — check console'); return; }
      }
    }
    setSyncBadge('saved', '● saved  ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' · ' + email.split('@')[0]);
  } catch (e) { console.error('saveRemote exception', e); setSyncBadge('error', '● save failed'); }
}

async function loadRemote() {
  if (!currentUser) return;
  const { data, error } = await supa
    .from('programmes')
    .select('prog_id,name,updated_at,updated_by,data')
    .order('updated_at', { ascending: false });
  if (error) { console.error('Load error', error); return; }
  if (data && data.length > 0) {
    db.programmes = data.map(row => migrateprog(row.data));
    const last = data[0];
    if (last.updated_by) {
      const who  = last.updated_by.split('@')[0];
      const when = new Date(last.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setSyncBadge('saved', `● saved ${when} · ${who}`);
    }
  }
}

function setSyncBadge(state, text) {
  const b = document.getElementById('syncBadge');
  if (!b) return;
  b.className   = 'sync-badge ' + state;
  b.textContent = text;
}

// ── Migration ─────────────────────────────────────────────────
function migrateprog(p) {
  if (!p) return newProgTemplate('Untitled', '', '', 'Other', '', '', new Date().toISOString().slice(0, 10));
  if (!p.bom) p.bom = { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] };
  ['parts', 'tools', 'equip', 'mat', 'cons'].forEach(k => { if (!p.bom[k]) p.bom[k] = []; });
  if (!p.bom.kits)    p.bom.kits    = [];
  if (!p.actions)     p.actions     = [];
  if (!p.risks)       p.risks       = [];
  if (!p.timing)      p.timing      = [];
  if (!p.gantt)       p.gantt       = [];
  if (!p.ganttStart && p.date) p.ganttStart = p.date;
  if (!p.gates) {
    p.gates = GATE_DEFS.map(g => ({
      gateNum: g.num,
      checks: g.items.map(() => false),
      sigs: g.signatories.map(r => ({ role: r, name: '', date: '', signed: false }))
    }));
  }
  p.gates.forEach((gd, gi) => {
    if (gi >= GATE_DEFS.length) return;
    const gdef = GATE_DEFS[gi];
    while (gd.checks.length < gdef.items.length) gd.checks.push(false);
    if (!gd.sigs) {
      gd.sigs = gdef.signatories.map(role => ({ role, name: gd.signedBy || '', date: gd.signedDate || '', signed: gd.status === 'signed' }));
      delete gd.status; delete gd.signedBy; delete gd.signedDate;
    }
    gdef.signatories.forEach(role => { if (!gd.sigs.find(s => s.role === role)) gd.sigs.push({ role, name: '', date: '', signed: false }); });
  });
  p.pfd.forEach((s, i) => {
    if (s.stepNum === undefined) s.stepNum = (i + 1) * 10;
    if (!s.type) s.type = 'step';
    if (!s.bomRefs) s.bomRefs = [];
    if (s.resources) { delete s.resources; }
  });
  p.pfmea.forEach(r => { if (!r.id) r.id = 'f_' + Math.random().toString(36).slice(2); });
  p.risks.forEach(r =>   { if (!r.id) r.id = 'r_' + Math.random().toString(36).slice(2); });
  p.actions.forEach(a => { if (!a.id) a.id = 'a_' + Math.random().toString(36).slice(2); });
  return p;
}

// ── Legacy local load (fallback) ─────────────────────────────
function load() {
  ['tidyco_v7', 'tidyco_v6', 'tidyco_v5'].forEach(key => {
    if (db.programmes && db.programmes.length > 0) return;
    try {
      const s = localStorage.getItem(key);
      if (s) { const d = JSON.parse(s); if (d.programmes && d.programmes.length > 0) db = d; }
    } catch (e) {}
  });
  db.programmes = db.programmes.map(p => migrateprog(p));
}

// ── Import / Export ───────────────────────────────────────────
function exportJSON() {
  const b = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'tidyco_apqp_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
}

function importJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.programmes) {
        db = d;
        db.programmes = db.programmes.map(p => migrateprog(p));
        save(); initProgSelect(); navigate('home');
      } else { alert('Invalid file'); }
    } catch (x) { alert('Invalid JSON'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

// ── Programme selector ────────────────────────────────────────
function initProgSelect() {
  if (!progId && db.programmes.length) progId = db.programmes[0].id;
}
