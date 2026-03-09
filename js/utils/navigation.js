// ═══════════════════════════════════
// navigation.js — Hash-based routing and breadcrumbs
// Depends on: state.js, helpers.js, all feature renderers
// ═══════════════════════════════════

const SECTION_LABELS = {
  apqp:    'APQP',
  actions: 'Action Tracker',
  risks:   'Risk Register',
  bom:     'Bill of Materials',
  timing:  'NPI Timing Plan'
  capacity: 'Capacity Management'
};

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  return Object.fromEntries(hash.split('&').map(p => {
    const [k, ...v] = p.split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';
  currentSection = sec;

  if (pushHash) {
    const parts = [];
    if (progId)             parts.push('p=' + encodeURIComponent(progId));
    if (sec !== 'projects') parts.push('s=' + encodeURIComponent(sec));
    if (sec === 'apqp' && apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(apqpTab));
    const hash = parts.length ? '#' + parts.join('&') : '#';
    if (sec === currentSection || sec === 'apqp') {
      history.replaceState(null, '', hash);
    } else {
      history.pushState(null, '', hash);
    }
  }

  const bb     = document.getElementById('backBtn');
  const bc     = document.getElementById('breadcrumb');
  const bcProj = document.getElementById('bc-project');
  const bcSep2 = document.getElementById('bc-sep2');
  const bcSec  = document.getElementById('bc-section');
  const p      = prog();

  // Always show the breadcrumb container now
  bc.style.display = 'flex';

  // 1. Hub Level (Root)
  // The "brand" logo in index.html already acts as a Hub link, 
  // but we ensure the back button is only for deep navigation.
  bb.style.display = (sec === 'projects' || sec === 'hub' || sec === 'project') ? 'none' : 'flex';

  if (sec === 'hub') {
    // On the Hub, we only show the "Hub" label or hide the crumb
    bc.style.display = 'none'; 
  } else if (sec === 'projects') {
    // Path: Hub > Projects
    bcProj.style.display = 'none'; // We use bcSec for the current level
    bcSep2.style.display = 'none';
    bcSec.style.display = 'block';
    bcSec.textContent = 'Projects';
  } else if (sec === 'project') {
    // Path: Hub > Projects > [Project Name]
    bcProj.style.display = 'block';
    bcProj.textContent = 'Projects';
    bcProj.onclick = () => navigate('projects');
    bcSep2.style.display = 'block';
    bcSec.style.display = 'block';
    bcSec.textContent = p ? p.name : 'Unknown Project';
  } else {
    // Path: Hub > Projects > [Project Name] > [Section Name]
    // Note: To show 4 levels, we'd need another crumb element. 
    // This setup shows the two most relevant parent levels: [Project Name] > [Section]
    bcProj.style.display = 'block';
    bcProj.textContent = p ? p.name : '';
    bcProj.onclick = () => navigate('project');
    bcSep2.style.display = 'block';
    
    const gm    = sec.match(/^gate_(\d)$/);
    const label = gm
      ? `Gate ${GATE_DEFS[+gm[1]].num}: ${GATE_DEFS[+gm[1]].name}`
      : (SECTION_LABELS[sec] || sec);
    bcSec.style.display = 'block';
    bcSec.textContent = label;
  }

  render();
}

function goProjects() { navigate('projects'); }
function goHome()     { navigate('project'); }

function setApqpTab(t) {
  apqpTab = t;
  const parts = ['p=' + encodeURIComponent(progId), 's=apqp'];
  if (t !== 'ctq') parts.push('t=' + encodeURIComponent(t));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function render() {
  const mc = document.getElementById('mainContent');
  if (currentSection === 'projects') { mc.innerHTML = renderProjects(); return; }
  if (currentSection === 'capacity') { mc.innerHTML = renderCapacity(); return; }
  if (!prog()) { mc.innerHTML = renderProjects(); return; }

  if (currentSection === 'hub') { mc.innerHTML = renderHub(); return; }
  
  if (currentSection === 'project') mc.innerHTML = renderDashboard();
  else if (currentSection.startsWith('gate_')) mc.innerHTML = renderGatePage(+currentSection.split('_')[1]);
  else { mc.innerHTML = `<div class="section-inner">${renderSection()}</div>`; }

  // Double rAF: first frame commits the new HTML to the DOM;
  // second frame ensures layout is fully calculated before
  // running any post-render hooks (e.g. textarea auto-resize).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      autoResizeAll();
    });
  });
}

function renderSection() {
  if (currentSection === 'apqp')    return renderAPQP();
  if (currentSection === 'actions') return renderActions();
  if (currentSection === 'risks')   return renderRisks();
  if (currentSection === 'bom')     return renderBOM();
  if (currentSection === 'timing')  return renderTimingPlan();
  return '';
}

// ── Browser back/forward support ─────────────────────────────
window.addEventListener('popstate', () => {
  if (!currentUser) return;
  const h = parseHash();
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    progId = h.p;
    if (h.t) apqpTab = h.t;
    navigate(h.s || 'project', { pushHash: false });
  } else {
    navigate('projects', { pushHash: false });
  }
});
