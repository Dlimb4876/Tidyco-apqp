// ═══════════════════════════════════
// db.js — Supabase persistence and data migration
// Depends on: state.js, auth.js (supabase, currentUser)
// ═══════════════════════════════════

import * as supa from './supa.js'
import {
  appState,
  db,
  GATE_DEFS,
  newProgTemplate,
  normalizeGateSelections,
  setDb
} from './state.js'
import { render, navigate } from '../../utils/js/navigation.js'
import { showToast } from '../../utils/js/helpers.js'
import { createRealtimeSubscription } from '../../utils/js/realtime.js'

let saveTimer = null;
let projectsGateScopeColumnsSupported = true;
// 3-D: Tracks in-flight Supabase write requests so the save badge can show
// "saving (N remaining)" when multiple projects are being written concurrently.
let pendingSaves = 0;
// Tracks which project IDs have local changes pending a Supabase write.
// Only those IDs are written on the next saveRemote() call, preventing
// one user's save from overwriting another user's concurrent edits.
let dirtyProjects = new Set();

// 3-A: Shared column-selection strings for project queries.
// Kept in one place so loadRemote() and loadRemotePage() always query
// exactly the same fields (DRY — change once, both functions benefit).
const PROG_BASE_SELECT = 'id,prog_id,name,customer,unit_name,family,lead,pm,start_date,gantt_start,gantt_collapsed,sub_assembly_ids,prog_status,q_number,part_number,product_id,updated_at,updated_by';
const PROG_GATE_SELECT = PROG_BASE_SELECT + ',gate_selections,gate_selection_locked,gate_selection_locked_at,gate_selection_locked_by';
const presenceMap = appState.presenceMap

export function isGateScopeColumnError(err) {
  const msg = String((err && err.message) || '').toLowerCase();
  return msg.includes('gate_selections') ||
    msg.includes('gate_selection_locked') ||
    msg.includes('gate_selection_locked_at') ||
    msg.includes('gate_selection_locked_by');
}

export function buildProjectRow(p, now, email) {
  const row = {
    prog_id:          p.id,
    name:             p.name,
    customer:         p.customer         || '',
    unit_name:        p.unit             || '',
    family:           p.family           || '',
    lead:             p.lead             || '',
    pm:               p.pm               || '',
    start_date:       p.date             || null,
    gantt_start:      p.ganttStart       || null,
    gantt_collapsed:  p.ganttCollapsed   || [],
    sub_assembly_ids: p.subAssemblies    || [],
    prog_status:      p.status           || 'Active',
    q_number:         p.qNumber          || null,
    part_number:      p.partNumber       || null,
    product_id:       p.product_id       || null,
    updated_at:       now,
    updated_by:       email
  };

  if (projectsGateScopeColumnsSupported) {
    row.gate_selections = p.gate_selections || null;
    row.gate_selection_locked = !!p.gate_selection_locked;
    row.gate_selection_locked_at = p.gate_selection_locked_at || null;
    row.gate_selection_locked_by = p.gate_selection_locked_by || null;
  }

  return row;
}

// ── Row → in-memory project ────────────────────────────────────
// Single source of truth for mapping a Supabase `projects` row to the
// shape used throughout the app.  Used by loadRemote(), loadRemotePage(),
// and the realtime onInsert handler so that adding a new column only
// requires a change in one place.
export function rowToProject(row) {
  return {
    dbId:                     row.id || null,
    id:                       row.prog_id,
    name:                     row.name,
    customer:                 row.customer                 || '',
    unit:                     row.unit_name                || '',
    family:                   row.family                   || '',
    lead:                     row.lead                     || '',
    pm:                       row.pm                       || '',
    date:                     row.start_date               || '',
    ganttStart:               row.gantt_start              || '',
    ganttCollapsed:           row.gantt_collapsed          || [],
    subAssemblies:            row.sub_assembly_ids         || [],
    status:                   row.prog_status              || 'Active',
    qNumber:                  row.q_number                 || '',
    partNumber:               row.part_number              || '',
    product_id:               row.product_id               || null,
    gate_selections:          row.gate_selections          || null,
    gate_selection_locked:    !!row.gate_selection_locked,
    gate_selection_locked_at: row.gate_selection_locked_at || null,
    gate_selection_locked_by: row.gate_selection_locked_by || null,
  };
}

// ── Auto-resize textareas ─────────────────────────────────────
export function autoResizeAll() {
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
// Accepts optional extra project IDs to mark dirty (e.g. when two
// linked projects are modified in the same operation).
export function save(...extraIds) {
  if (appState.progId) dirtyProjects.add(appState.progId);
  extraIds.forEach(id => { if (id) dirtyProjects.add(id); });
  try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {
    console.debug('localStorage save failed:', e)
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveRemote, 800);
  // 3-D: Show pending count while a save is already in flight
  if (pendingSaves > 0) {
    setSyncBadge('syncing', `● saving (${dirtyProjects.size} queued)…`);
  } else {
    setSyncBadge('syncing', '● saving…');
  }
}

export async function saveRemote(attempt) {
  if (!supa.currentUser) return;
  const email  = supa.currentUser.email;
  const now    = new Date().toISOString();
  const errors = [];

  // Snapshot and clear dirty set before async work so any edits made
  // during this save are queued for the next debounce cycle.
  const idsToSave = dirtyProjects.size > 0 ? new Set(dirtyProjects) : null;
  dirtyProjects.clear();

  // Only write projects that were modified locally.
  // Fall back to writing all on retry (idsToSave is null after clear) so
  // the retry logic below can pass null and save everything.
  const toSave = idsToSave
    ? db.projects.filter(p => idsToSave.has(p.id))
    : db.projects;

  // 3-D: Show "saving (N remaining)" for multi-project saves so users
  // know the operation is still in progress.
  pendingSaves += toSave.length;
  if (toSave.length > 1) {
    setSyncBadge('syncing', `● saving (${pendingSaves} remaining)…`);
  }

  try {
    for (const p of toSave) {
      let row = buildProjectRow(p, now, email);

      let { data: updated, error: updErr } = await supa.supabase
        .from('projects')
        .update(row)
        .eq('prog_id', p.id)
        .select('id, prog_id');

      if (updErr && projectsGateScopeColumnsSupported && isGateScopeColumnError(updErr)) {
        projectsGateScopeColumnsSupported = false;
        row = buildProjectRow(p, now, email);
        ({ data: updated, error: updErr } = await supa.supabase
          .from('projects')
          .update(row)
          .eq('prog_id', p.id)
          .select('id, prog_id'));
      }

      if (updErr) {
        console.error('Update err', p.name, updErr);
        errors.push(p.name + ' (' + (updErr.message || 'unknown error') + ')');
        // Math.max guards against going negative if a race condition causes
        // pendingSaves to be decremented more times than it was incremented.
        pendingSaves = Math.max(0, pendingSaves - 1);
        continue;
      }
      if (updated && updated[0] && updated[0].id) {
        p.dbId = updated[0].id;
      }
      if (!updated || updated.length === 0) {
        let { data: inserted, error: insErr } = await supa.supabase
          .from('projects')
          .insert(row)
          .select('id, prog_id');

        if (insErr && projectsGateScopeColumnsSupported && isGateScopeColumnError(insErr)) {
          projectsGateScopeColumnsSupported = false;
          row = buildProjectRow(p, now, email);
          ({ data: inserted, error: insErr } = await supa.supabase
            .from('projects')
            .insert(row)
            .select('id, prog_id'));
        }

        if (insErr) {
          console.error('Insert err', p.name, insErr);
          errors.push(p.name + ' (' + (insErr.message || 'unknown error') + ')');
        } else if (inserted && inserted[0] && inserted[0].id) {
          p.dbId = inserted[0].id;
        }
      }
      // 3-D: Decrement counter and update badge after each write completes.
      // Math.max prevents going negative in the unlikely event of a logic race.
      pendingSaves = Math.max(0, pendingSaves - 1);
      if (pendingSaves > 0) {
        setSyncBadge('syncing', `● saving (${pendingSaves} remaining)…`);
      }
    }
    if (errors.length === 0) {
      setSyncBadge('saved', '● saved  ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' · ' + email.split('@')[0]);
    } else if (!attempt) {
      setSyncBadge('syncing', '● retrying…');
      setTimeout(() => saveRemote(true), 1500);
    } else {
      // 3-D: Name each failed project so the user knows exactly what didn't save
      setSyncBadge('error', '● save failed: ' + errors.join(', '));
    }
  } catch (e) {
    pendingSaves = 0;
    console.error('saveRemote exception', e);
    if (!attempt) {
      setSyncBadge('syncing', '● retrying…');
      setTimeout(() => saveRemote(true), 1500);
    } else {
      setSyncBadge('error', '● save failed: ' + (e.message || 'unknown error'));
    }
  }
}

export async function loadRemote() {
  console.debug('loadRemote() currentUser:', supa.currentUser ? supa.currentUser.email : 'null');
  if (!supa.currentUser) return;

  let { data, error } = await supa.supabase
    .from('projects')
    .select(projectsGateScopeColumnsSupported ? PROG_GATE_SELECT : PROG_BASE_SELECT)
    .order('updated_at', { ascending: false });

  if (error && projectsGateScopeColumnsSupported && isGateScopeColumnError(error)) {
    projectsGateScopeColumnsSupported = false;
    ({ data, error } = await supa.supabase
      .from('projects')
      .select(PROG_BASE_SELECT)
      .order('updated_at', { ascending: false }));
  }

  if (error) { console.error('Load error', error); return; }
  if (data && data.length > 0) {
    db.projects = data.map(row => migrateprog(rowToProject(row)));
    const last = data[0];
    if (last.updated_by) {
      const who  = last.updated_by.split('@')[0];
      const when = new Date(last.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setSyncBadge('saved', `● saved ${when} · ${who}`);
    }
  }
}

// ── 3-A: Paginated project loader ──────────────────────────
// Loads a single page of projects (most-recently-updated first).
// On the first page (page=0) it replaces db.projects; subsequent
// pages append to it, avoiding duplicate IDs.
// Sets `projectsAllLoaded = true` when the returned page is smaller
// than pageSize, indicating there are no more rows to fetch.
export async function loadRemotePage(page, pageSize = 50) {
  if (!supa.currentUser) return;

  const from  = page * pageSize;
  const to    = from + pageSize - 1;

  let { data, error } = await supa.supabase
    .from('projects')
    .select(projectsGateScopeColumnsSupported ? PROG_GATE_SELECT : PROG_BASE_SELECT)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error && projectsGateScopeColumnsSupported && isGateScopeColumnError(error)) {
    projectsGateScopeColumnsSupported = false;
    ({ data, error } = await supa.supabase
      .from('projects')
      .select(PROG_BASE_SELECT)
      .order('updated_at', { ascending: false })
      .range(from, to));
  }

  if (error) { console.error('Load page error', error); return; }

  const rows = (data || []).map(row => migrateprog(rowToProject(row)));

  if (page === 0) {
    db.projects = rows;
  } else {
    // Append only rows not already in memory (guard against duplicates)
    const knownIds = new Set(db.projects.map(p => p.id));
    rows.forEach(p => { if (!knownIds.has(p.id)) db.projects.push(p); });
  }

  appState.projectsPage = page
  appState.projectsAllLoaded = rows.length < pageSize

  if (rows.length > 0) {
    const last = data[0];
    if (last.updated_by) {
      const who  = last.updated_by.split('@')[0];
      const when = new Date(last.updated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setSyncBadge('saved', `● saved ${when} · ${who}`);
    }
  }

  try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {
    console.debug('localStorage save failed:', e)
  }
}

// Load the next page of projects (called from "Load more" button in hub).
export async function loadMoreProjects() {
  if (appState.projectsAllLoaded) return;
  setSyncBadge('syncing', '● loading…');
  await loadRemotePage(appState.projectsPage + 1);
  initProgSelect();
  if (typeof render === 'function') render();
}

export function setSyncBadge(state, text) {
  const b = document.getElementById('syncBadge');
  if (b) {
    b.className   = 'sync-badge ' + state;
    b.textContent = text;
    b.title       = text; // Tooltip for long error messages
  }

  // Also update bottombar
  const bottombarSync = document.getElementById('bottombarSync');
  if (bottombarSync) {
    bottombarSync.className = 'bottombar-status ' + state;
    bottombarSync.textContent = text;
    bottombarSync.title = text;
  }
}

function setUnsavedIndicator(count) {
  const el = document.getElementById('bottombarUnsaved');
  if (!el) return;

  if (count > 0) {
    el.style.display = 'inline-flex';
    el.textContent = `✎ ${count} unsaved`;
    el.title = `${count} unsaved change(s) — press Ctrl+S to save`;
  } else {
    el.style.display = 'none';
  }
}

// ── Migration ─────────────────────────────────────────────────
export function migrateprog(p) {
  if (!p) return newProgTemplate('Untitled', '', '', 'Other', '', '', new Date().toISOString().slice(0, 10));
  if (!p.dbId) p.dbId = null;
  if (!p.product_id) p.product_id = null;
  if (p.gate_selections === undefined) p.gate_selections = null;
  if (typeof normalizeGateSelections === 'function') {
    p.gate_selections = normalizeGateSelections(p.gate_selections);
  } else if (!p.gate_selections || typeof p.gate_selections !== 'object') {
    p.gate_selections = null;
  }
  if (p.gate_selection_locked !== true) p.gate_selection_locked = false;
  if (!p.gate_selection_locked_at) p.gate_selection_locked_at = null;
  if (!p.gate_selection_locked_by) p.gate_selection_locked_by = null;
  if (!p.ctq)     p.ctq     = [];
  if (!p.pfd)     p.pfd     = [];
  if (!p.pfmea)   p.pfmea   = [];
  if (!p.cp)      p.cp      = [];
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

  // ── PFMEA structure migration (moved from renderPFMEA) ────────
  p.pfmea.forEach(r => {
    if (!r.id) r.id = 'f_' + Math.random().toString(36).slice(2);
    if (!r._type) {
      r._type = 'mode';
      r.effects = [{
        id: 'e_' + Math.random().toString(36).slice(2),
        effect: r.effect || '', sev: r.sev || 1,
        causes: [{
          id: 'c_' + Math.random().toString(36).slice(2),
          cause: r.cause || '', occ: r.occ || 1, det: r.det || 1,
          prevent: r.controls || '', detect: '',
          action: { desc: '', owner: '', due: '', newOcc: '', newDet: '' },
          history: []
        }]
      }];
      delete r.effect; delete r.cause; delete r.sev; delete r.occ; delete r.det; delete r.controls; delete r.action;
    }
    // Migrate causes missing new fields
    (r.effects || []).forEach(ef => {
      (ef.causes || []).forEach(ca => {
        if (!ca.prevent) ca.prevent = '';
        if (!ca.detect)  ca.detect  = '';
        if (!ca.action)  ca.action  = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' };
        if (!ca.history) ca.history = [];
      });
    });
  });

  p.risks.forEach(r =>   { if (!r.id) r.id = 'r_' + Math.random().toString(36).slice(2); });
  p.actions.forEach(a => { if (!a.id) a.id = 'a_' + Math.random().toString(36).slice(2); });
  return p;
}

// ── Legacy local load (fallback) ─────────────────────────────
export function load() {
  ['tidyco_v7', 'tidyco_v6', 'tidyco_v5'].forEach(key => {
    if (db.projects && db.projects.length > 0) return;
    try {
      const s = localStorage.getItem(key);
      if (s) { const d = JSON.parse(s); if (d.projects && d.projects.length > 0) setDb(d); }
    } catch (e) {
      console.debug('Failed to load from localStorage key', key, ':', e)
    }
  });
  db.projects = db.projects.map(p => migrateprog(p));
}

// ── Import / Export ───────────────────────────────────────────
export function exportJSON() {
  const b = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'tidyco_apqp_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
}

export function importJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.projects) {
        setDb(d);
        db.projects = db.projects.map(p => migrateprog(p));
        // Mark all imported projects dirty so saveRemote writes every one.
        db.projects.forEach(p => dirtyProjects.add(p.id));
        save(); initProgSelect(); navigate('home');
      } else { showToast('Invalid file', 'error'); }
    } catch (x) { showToast('Invalid JSON', 'error'); }
  };
  r.onerror = () => { showToast('Could not read file', 'error'); };
  r.readAsText(f);
  e.target.value = '';
}

// ── Project selector ────────────────────────────────────────
// Only sets a default project if none is already selected (e.g., from URL hash)
export function initProgSelect() {
  if (!appState.progId && db.projects.length) appState.progId = db.projects[0].id;
}

// ── Global real-time subscription for projects ──────────────
// Keeps every user's hub / projects list live without a page refresh.
// Called once from launchApp() after the initial loadRemote().
export function subscribeProjectsGlobally() {
  createRealtimeSubscription('projects', 'global_projects_channel', {
    onInsert: (row) => {
      if (db.projects.find(p => p.id === row.prog_id)) return; // already known
      const newProg = migrateprog(rowToProject(row));
      db.projects.unshift(newProg);
      try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {
        console.debug('localStorage save failed:', e)
      }
      if (appState.currentSection === 'hub' || appState.currentSection === 'projects') {
        if (typeof render === 'function') render();
      }
    },
    onUpdate: (row) => {
      const idx = db.projects.findIndex(p => p.id === row.prog_id);
      if (idx < 0) return;
      // Skip echo of the local user's own save — the local state is already
      // up-to-date and applying the echo could discard in-progress edits.
      if (row.updated_by === supa.currentUser?.email) return;
      // Task 2-B: Warn the current user when someone else updates the project they're viewing.
      if (appState.progId && row.prog_id === appState.progId && row.updated_by && typeof showToast === 'function') {
        showToast(`${row.updated_by.split('@')[0]} just updated this project's details`, 'info', 6000);
      }
      const p = db.projects[idx];
      p.dbId       = row.id              || p.dbId || null;
      p.name       = row.name            || p.name;
      p.customer   = row.customer        || '';
      p.unit       = row.unit_name       || '';
      p.family     = row.family          || '';
      p.lead       = row.lead            || '';
      p.pm         = row.pm              || '';
      p.date       = row.start_date      || '';
      p.ganttStart = row.gantt_start     || '';
      p.ganttCollapsed  = row.gantt_collapsed  || [];
      p.subAssemblies   = row.sub_assembly_ids || [];
      p.status     = row.prog_status     || 'Active';
      p.qNumber    = row.q_number        || '';
      p.partNumber = row.part_number     || '';
      p.product_id = row.product_id      || null;
      if (row.gate_selections !== undefined)        p.gate_selections        = row.gate_selections;
      if (row.gate_selection_locked !== undefined)  p.gate_selection_locked  = !!row.gate_selection_locked;
      if (row.gate_selection_locked_at !== undefined) p.gate_selection_locked_at = row.gate_selection_locked_at;
      if (row.gate_selection_locked_by !== undefined) p.gate_selection_locked_by = row.gate_selection_locked_by;
      try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {
        console.debug('localStorage save failed:', e)
      }
      if (appState.currentSection === 'hub' || appState.currentSection === 'projects') {
        if (typeof render === 'function') render();
      }
    },
    onDelete: (row) => {
      const idx = db.projects.findIndex(p => p.id === row.prog_id);
      if (idx < 0) return;
      db.projects.splice(idx, 1);
      if (appState.progId === row.prog_id) {
        appState.progId = db.projects.length ? db.projects[0].id : null;
      }
      try { localStorage.setItem('tidyco_v7', JSON.stringify(db)); } catch (e) {
        console.debug('localStorage save failed:', e)
      }
      if (appState.currentSection === 'hub' || appState.currentSection === 'projects' ||
          appState.currentSection === 'project' || appState.currentSection === 'apqp') {
        if (typeof render === 'function') render();
      }
    }
  });
}

// ── Task 2-A: Presence Broadcast ──────────────────────────────
// Tracks who else is viewing the same project in real time.
// Uses Supabase Realtime Broadcast (no DB write needed).

let _presenceChannel = null;
let _presenceInterval = null;
const PRESENCE_TTL_MS = 90000; // Remove stale entries after 90 s

export function _getPresenceInitials(email) {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function broadcastPresence(pid) {
  if (!pid || !supa.currentUser) return;
  stopPresenceBroadcast();

  const channelName = 'presence:' + pid;
  const email = supa.currentUser.email;

  const ch = supa.supabase.channel(channelName);
  ch.on('broadcast', { event: 'user-here' }, ({ payload }) => {
    if (!payload || !payload.email) return;
    if (payload.email === email) return; // ignore own echo
    if (!presenceMap[pid]) presenceMap[pid] = [];
    const existing = presenceMap[pid].find(e => e.email === payload.email);
    if (existing) {
      existing.ts = Date.now();
    } else {
      presenceMap[pid].push({ email: payload.email, ts: Date.now() });
    }
    // Prune stale entries
    presenceMap[pid] = presenceMap[pid].filter(e => Date.now() - e.ts < PRESENCE_TTL_MS);
    // Re-render dashboard header if viewing this project
    if (appState.progId === pid && appState.currentSection === 'project' && typeof render === 'function') render();
  }).on('broadcast', { event: 'user-gone' }, ({ payload }) => {
    if (!payload || !payload.email || !presenceMap[pid]) return;
    presenceMap[pid] = presenceMap[pid].filter(e => e.email !== payload.email);
    if (appState.progId === pid && appState.currentSection === 'project' && typeof render === 'function') render();
  }).subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      ch.send({ type: 'broadcast', event: 'user-here', payload: { email } });
    }
  });

  _presenceChannel = ch;
  // Re-broadcast every 30 s to keep entries fresh for other users
  _presenceInterval = setInterval(() => {
    if (_presenceChannel) {
      _presenceChannel.send({ type: 'broadcast', event: 'user-here', payload: { email } });
    }
  }, 30000);
}

export function stopPresenceBroadcast() {
  if (_presenceInterval) { clearInterval(_presenceInterval); _presenceInterval = null; }
  if (_presenceChannel) {
    try {
      const email = supa.currentUser?.email;
      if (email) {
        _presenceChannel.send({ type: 'broadcast', event: 'user-gone', payload: { email } }).catch(err => {
          console.debug('presence user-gone send failed (channel may already be closing):', err);
        });
      }
      supa.supabase.removeChannel(_presenceChannel);
    } catch (e) {
      console.debug('stopPresenceBroadcast cleanup error:', e);
    }
    _presenceChannel = null;
  }
}

export function getPresenceForProg(pid) {
  if (!pid || !presenceMap[pid]) return [];
  // Return only non-stale entries
  presenceMap[pid] = presenceMap[pid].filter(e => Date.now() - e.ts < PRESENCE_TTL_MS);
  return presenceMap[pid];
}

// ── Teams Data Functions ───────────────────────────────────────
// Team management: CRUD operations for teams and team permissions

export async function teamsDataLoadAll() {
  if (!supa.currentUser) return [];
  try {
    const { data, error } = await supa.supabase
      .from('teams')
      .select('id, name, team_type, description, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load teams:', err);
    if (typeof showToast === 'function') showToast('Could not load teams', 'error');
    return [];
  }
}

export async function teamsDataLoadPermissions(teamId) {
  if (!teamId || !supa.currentUser) return [];
  try {
    const { data, error } = await supa.supabase
      .from('team_permissions')
      .select('permission, allowed')
      .eq('team_id', teamId)
      .order('permission', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load team permissions:', err);
    return [];
  }
}

export async function teamsDataGetUserCount(teamId) {
  if (!teamId || !supa.currentUser) return 0;
  try {
    const { count, error } = await supa.supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('team_id', teamId);
    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Failed to count team users:', err);
    return 0;
  }
}

export async function teamsDataAdd(team) {
  if (!supa.currentUser || !team || !team.name || !team.team_type) {
    console.error('teamsDataAdd: invalid team data');
    return null;
  }
  try {
    const { data, error } = await supa.supabase
      .from('teams')
      .insert([{
        name: team.name,
        team_type: team.team_type,
        description: team.description || '',
        created_by: supa.currentUser.id
      }])
      .select('id, name, team_type, description, created_at');
    if (error) throw error;
    return data?.[0] || null;
  } catch (err) {
    console.error('Failed to create team:', err);
    if (typeof showToast === 'function') showToast('Could not create team', 'error');
    return null;
  }
}

export async function teamsDataUpdate(teamId, updates) {
  if (!supa.currentUser || !teamId || !updates) return false;
  try {
    const { error } = await supa.supabase
      .from('teams')
      .update({
        ...updates,
        updated_by: supa.currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to update team:', err);
    if (typeof showToast === 'function') showToast('Could not update team', 'error');
    return false;
  }
}

export async function teamsDataDelete(teamId) {
  if (!supa.currentUser || !teamId) return false;
  try {
    const { error } = await supa.supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete team:', err);
    if (typeof showToast === 'function') showToast('Could not delete team', 'error');
    return false;
  }
}

export async function teamPermissionsDataSave(teamId, permissions) {
  if (!supa.currentUser || !teamId || !Array.isArray(permissions)) return false;
  try {
    // Delete all existing permissions for this team
    const { error: deleteError } = await supa.supabase
      .from('team_permissions')
      .delete()
      .eq('team_id', teamId);
    if (deleteError) throw deleteError;

    // Insert new permissions
    if (permissions.length > 0) {
      const records = permissions.map(p => ({
        team_id: teamId,
        permission: p.permission,
        allowed: p.allowed,
        updated_by: supa.currentUser.id
      }));
      const { error: insertError } = await supa.supabase
        .from('team_permissions')
        .insert(records);
      if (insertError) throw insertError;
    }
    return true;
  } catch (err) {
    console.error('Failed to save team permissions:', err);
    if (typeof showToast === 'function') showToast('Could not save team permissions', 'error');
    return false;
  }
}

// ── Load specific project by ID ─────────────────────────────
// Fetches a single project from Supabase when not in paginated memory
export async function loadProjectById(projectId) {
  if (!projectId || !supa.currentUser) return null
  if (db.projects.find(p => p.id === projectId)) return db.projects.find(p => p.id === projectId)
  
  try {
    const { data, error } = await supa.supabase
      .from('projects')
      .select(projectsGateScopeColumnsSupported ? PROG_GATE_SELECT : PROG_BASE_SELECT)
      .eq('prog_id', projectId)
      .single()
    
    if (error) {
      console.error('Failed to load project by ID:', error)
      return null
    }
    
    if (data) {
      const project = migrateprog(rowToProject(data))
      db.projects.push(project)
      return project
    }
  } catch (err) {
    console.error('Error loading project:', err)
  }
  return null
}
