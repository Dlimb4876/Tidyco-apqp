// ═══════════════════════════════════
// app.js — Entry point: launchApp and session initialisation
// Depends on: all other modules
// ═══════════════════════════════════

// ── Phase 2: Density Toggle ───────────────────────────────────
function setDensity(value) {
  document.documentElement.setAttribute('data-density', value);
  localStorage.setItem('ui_density', value);
}

function loadDensity() {
  const saved = localStorage.getItem('ui_density') || 'normal';
  setDensity(saved);
  const toggle = document.getElementById('densityToggle');
  if (toggle) toggle.value = saved;
}

// ── Phase 2: Global Keyboard Shortcuts ───────────────────────
function _registerGlobalShortcuts() {
  // Ctrl+S — save current work
  KeyboardShortcuts.register('ctrl+s', () => {
    if (typeof save === 'function') save();
    if (typeof meDataSaveAll === 'function') meDataSaveAll();
    if (typeof showToast === 'function') showToast('Saved', 'success', 2000);
  }, 'Save current work');

  // Ctrl+N — context-aware new item
  KeyboardShortcuts.register('ctrl+n', () => {
    if (currentSection === 'product-development') {
      if (typeof showModal === 'function') showModal('modalNewProj');
    } else if (currentSection === 'capacity' && capacityTab === 'me') {
      if (typeof meAddDefaultTask === 'function') meAddDefaultTask();
    }
  }, 'New item');

  // Ctrl+F — focus search in current view
  KeyboardShortcuts.register('ctrl+f', () => {
    const search = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]');
    if (search) { search.focus(); search.select(); }
  }, 'Focus search');

  // Ctrl+P — print current view
  KeyboardShortcuts.register('ctrl+p', () => {
    window.print();
  }, 'Print current view');

  // Escape — close open modal
  KeyboardShortcuts.register('escape', () => {
    // Find any modal that is currently visible (display is set to 'flex' or 'block' inline)
    const modal = [...document.querySelectorAll('.modal')].find(m => {
      const d = m.style.display;
      return d && d !== 'none';
    });
    if (modal && modal.id) closeModal(modal.id);
  }, 'Close modal / Cancel');
}

// ── Phase 2: Column Resize Persistence ───────────────────────
let _resizingTh = null;
let _resizeStartX = 0;
let _resizeStartW = 0;

function startColResize(e, handle) {
  e.preventDefault();
  _resizingTh = handle.closest('th');
  _resizeStartX = e.pageX;
  _resizeStartW = _resizingTh.offsetWidth;
  document.addEventListener('mousemove', _doColResize);
  document.addEventListener('mouseup', _stopColResize, { once: true });
}

function _doColResize(e) {
  if (!_resizingTh) return;
  const newW = Math.max(40, _resizeStartW + (e.pageX - _resizeStartX));
  _resizingTh.style.width = newW + 'px';
  _resizingTh.style.minWidth = newW + 'px';
}

function _stopColResize() {
  document.removeEventListener('mousemove', _doColResize);
  _saveColWidths();
  _resizingTh = null;
}

function _saveColWidths() {
  const table = document.querySelector('table.resizable');
  if (!table) return;
  const key = 'col_widths_' + (currentSection || 'default') + '_' + (capacityTab || '');
  const widths = [...table.querySelectorAll('th')].map(th => th.style.width || '');
  localStorage.setItem(key, JSON.stringify(widths));
}

function loadColWidths() {
  const table = document.querySelector('table.resizable');
  if (!table) return;
  const key = 'col_widths_' + (currentSection || 'default') + '_' + (capacityTab || '');
  const saved = localStorage.getItem(key);
  if (!saved) return;
  try {
    const widths = JSON.parse(saved);
    const ths = table.querySelectorAll('th');
    ths.forEach((th, i) => {
      if (widths[i]) { th.style.width = widths[i]; th.style.minWidth = widths[i]; }
    });
  } catch (_) {}
}

// ── Phase 2: Preview Tooltip ──────────────────────────────────
let _previewTooltip = null;

function initPreviewTooltips(container) {
  if (!container) container = document;
  container.querySelectorAll('.truncated-cell').forEach(cell => {
    cell.addEventListener('mouseenter', _showPreviewTooltip);
    cell.addEventListener('mouseleave', _hidePreviewTooltip);
    cell.addEventListener('mousemove', _movePreviewTooltip);
  });
}

function _showPreviewTooltip(e) {
  const cell = e.currentTarget;
  const content = cell.dataset.fullContent || cell.title || cell.textContent;
  if (!content || cell.scrollWidth <= cell.offsetWidth) return; // not actually truncated

  _hidePreviewTooltip();
  _previewTooltip = document.createElement('div');
  _previewTooltip.className = 'preview-tooltip';
  _previewTooltip.textContent = content;
  document.body.appendChild(_previewTooltip);
  _positionTooltip(e);
}

function _movePreviewTooltip(e) {
  if (_previewTooltip) _positionTooltip(e);
}

function _hidePreviewTooltip() {
  if (_previewTooltip) { _previewTooltip.remove(); _previewTooltip = null; }
}

function _positionTooltip(e) {
  if (!_previewTooltip) return;
  const margin = 12;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  const rect = _previewTooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - margin)  x = e.clientX - rect.width - margin;
  if (y + rect.height > window.innerHeight - margin) y = e.clientY - rect.height - margin;
  _previewTooltip.style.left = x + 'px';
  _previewTooltip.style.top  = y + 'px';
}

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

  // ── Phase 2: init UX systems ──────────────────────────────
  if (typeof KeyboardShortcuts !== 'undefined') {
    KeyboardShortcuts.init();
    _registerGlobalShortcuts();
  }
  if (typeof ContextMenu !== 'undefined') ContextMenu.init();
  loadDensity();
  populateFamilySelects();
  await loadRemote();
  if (db.programmes.length === 0) load();
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
  if (npi && npi.dashboard && typeof npi.dashboard.ensureProductProgrammes === 'function') {
    npi.dashboard.ensureProductProgrammes();
  }

  // Load Production Capacity settings (production_capacity table)
  await prodCapDataInit();

  // Load utilization factor (from user_settings or localStorage)
  await prodCapLoadUtilization();

  // Load Work Areas (work_areas table)
  await workAreasDataInit();

  // Load Bug Reports (bug_reports table, shared across all users)
  await bugDataInit();

  // Restore previous page state from URL hash (e.g. after a page refresh)
  const h = parseHash();
  if (h.s) {
    npiTab = h.nft || 'all';
    if (h.p && db.programmes.find(p => p.id === h.p)) {
      progId = h.p;
    }
    if (h.t)   apqpTab               = h.t;
    if (h.ct)  capacityTab           = h.ct;
    if (h.od)  operationsTab         = h.od;
    if (h.pt)  productionTab         = h.pt;
    if (h.pdt) productDevelopmentTab = h.pdt;
    navigate(h.s, { pushHash: false });
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
