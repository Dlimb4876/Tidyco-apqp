import { 
  progId, apqpTab, capacityTab, productionTab, productDevelopmentTab, 
  currentSection, npiTab, prog, db 
} from '../../core/js/state.js';
import { currentUser } from '../../core/js/auth.js';
import { autoResizeAll } from './helpers.js';
import { renderProjects, renderDashboard } from '../../portals/product-development/npi/js/dashboard.js';
import { renderHub } from '../../portals/product-development/npi/js/hub.js';
import { renderAPQP } from '../../portals/product-development/npi/js/apqp.js';
import { renderActions, renderRisks } from '../../portals/product-development/npi/js/trackers.js';
import { renderBOM } from '../../portals/product-development/npi/js/bom.js';
import { renderTimingPlan } from '../../portals/product-development/npi/js/timing.js';
import { renderGatePage } from '../../portals/product-development/npi/js/gates.js';
import { renderCapacity } from '../../portals/capacity/js/capacity.js';
import { renderMeCapacity } from '../../portals/capacity/js/me-capacity.js';
import { meDrawChartNow } from '../../portals/capacity/js/me-chart.js';
import { renderProduction } from '../../portals/production/js/production.js';
import { renderProductMgmt } from '../../portals/productmgmt/js/productmgmt.js';
import { renderProductsPortalHTML, renderProductsPortalSetup } from '../../portals/product-development/product-management/js/products.js';
import { renderProductDevelopment } from '../../portals/product-development/js/product-development.js';

// ── Navigation & Routing ───────────────────────────────────
const SECTION_LABELS = {
  apqp:    'APQP',
  actions: 'Action Tracker',
  risks:   'Risk Register',
  bom:     'Bill of Materials',
  timing:  'NPI Timing Plan',
  capacity: 'Capacity Management',
  production: 'Production Planning',
  products: 'Products',
  productmgmt: 'Product Management'
};

export function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  return Object.fromEntries(hash.split('&').map(p => {
    const [k, ...v] = p.split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

export function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';

  // Reset capacityTab to 'root' when navigating TO capacity from outside (e.g., from hub)
  if (sec === 'capacity' && currentSection !== 'capacity') {
    capacityTab = 'root';
  }

  // Reset productionTab to 'root' when navigating TO production from outside
  if (sec === 'production' && currentSection !== 'production') {
    productionTab = 'root';
  }

  // Reset productDevelopmentTab to 'root' when navigating TO product-development from outside
  if (sec === 'product-development' && currentSection !== 'product-development') {
    productDevelopmentTab = 'root';
  }

  currentSection = sec;

  if (pushHash) {
    const parts = [];
    if (progId)             parts.push('p=' + encodeURIComponent(progId));
    if (sec !== 'projects') parts.push('s=' + encodeURIComponent(sec));
    if (sec === 'projects' && npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab));
    if (sec === 'apqp' && apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(apqpTab));
    if (sec === 'capacity' && capacityTab !== 'root') parts.push('ct=' + encodeURIComponent(capacityTab));
    if (sec === 'production' && productionTab !== 'root') parts.push('pt=' + encodeURIComponent(productionTab));
    if (sec === 'product-development' && productDevelopmentTab !== 'root') parts.push('pdt=' + encodeURIComponent(productDevelopmentTab));
    const hash = parts.length ? '#' + parts.join('&') : '#';
    if (sec === currentSection || sec === 'apqp' || sec === 'capacity' || sec === 'production' || sec === 'product-development') {
      history.replaceState(null, '', hash);
    } else {
      history.pushState(null, '', hash);
    }
  }

  // Show Return to Portal button on all feature pages (not hub, projects, or project home)
  const returnBtn = document.getElementById('returnHubBtn');
  returnBtn.style.display = (sec === 'hub' || sec === 'projects' || sec === 'project') ? 'none' : 'flex';

  render();
}

export function goProjects() { navigate('projects'); }
export function goHome()     { navigate('project'); }

export function setApqpTab(t) {
  apqpTab = t;
  const parts = ['p=' + encodeURIComponent(progId), 's=apqp'];
  if (t !== 'ctq') parts.push('t=' + encodeURIComponent(t));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

export function render() {
  const mc = document.getElementById('mainContent');
  if (currentSection === 'projects') { mc.innerHTML = renderProjects(); return; }
  if (currentSection === 'product-development') {
    mc.innerHTML = `<div class="section-inner">${renderProductDevelopment()}</div>`;
    return;
  }
  if (currentSection === 'production') {
    mc.innerHTML = `<div class="section-inner">${renderProduction()}</div>`;
    return;
  }
  if (currentSection === 'products') {
    mc.innerHTML = renderProductsPortalHTML();
    renderProductsPortalSetup();
    return;
  }
  if (currentSection === 'productmgmt') {
    mc.innerHTML = `<div class="section-inner">${renderProductMgmt()}</div>`;
    return;
  }
  if (currentSection === 'capacity') {
    if (capacityTab === 'root') mc.innerHTML = renderCapacity();
    else if (capacityTab === 'me') mc.innerHTML = `<div class="section-inner">${renderMeCapacity()}</div>`;
    else if (capacityTab === 'overhaul') mc.innerHTML = `<div class="section-inner"><div style="padding: 20px; text-align: center; color: var(--muted);">Overhaul Capacity coming soon</div></div>`;
    else if (capacityTab === 'projects') mc.innerHTML = `<div class="section-inner"><div style="padding: 20px; text-align: center; color: var(--muted);">Projects Capacity coming soon</div></div>`;
    else mc.innerHTML = renderCapacity();
    // Draw chart after ME Capacity is rendered
    if (capacityTab === 'me') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (typeof meDrawChartNow === 'function') meDrawChartNow();
        });
      });
    }
    return;
  }
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

export function renderSection() {
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
  npiTab = h.nft || 'all';
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    progId = h.p;
    if (h.t)   apqpTab              = h.t;
    if (h.ct)  capacityTab          = h.ct;
    if (h.pt)  productionTab        = h.pt;
    if (h.pdt) productDevelopmentTab = h.pdt;
    navigate(h.s || 'project', { pushHash: false });
  } else {
    navigate('projects', { pushHash: false });
  }
});
