// ═══════════════════════════════════════════════════════════════
// prod-capacity.js — Production Load Capacity Portal
// Entry point: nav bar + tab dispatcher
// Tabs: dashboard | by-work-area | settings | detail
// ═══════════════════════════════════════════════════════════════

import { appState } from '../../../../core/js/state.js'
import { render, writeNavigationHistory } from '../../../../utils/js/navigation.js'
import { prodState } from '../../../production/js/data.js'
import { renderProdCapDashboard, prodCapDrawDashChart } from './prod-capacity-dashboard.js'
import { renderProdCapWorkArea, prodCapDrawWorkAreaChart } from './prod-capacity-workarea.js'
import { renderProdCapSettings } from './prod-capacity-settings.js'
import { renderProdCapDetail } from './prod-capacity-detail.js'
import { setProdCapRefreshCurrentTab } from './prod-capacity-data.js'

export function setProdCapTab(tab) {
  const prevPct = appState.prodCapTab
  appState.prodCapTab = tab
  const pctParts = ['s=capacity', 'ct=production']
  if (tab !== 'dashboard') pctParts.push('pct=' + encodeURIComponent(tab))
  writeNavigationHistory('#' + pctParts.join('&'), { push: prevPct !== tab })
  render()
}

export function renderProdCapacity() {
  // Body content
  let body = '';
  if      (appState.prodCapTab === 'dashboard')   body = renderProdCapDashboard();
  else if (appState.prodCapTab === 'by-work-area') body = renderProdCapWorkArea();
  else if (appState.prodCapTab === 'settings')    body = renderProdCapSettings();
  else if (appState.prodCapTab === 'detail')      body = renderProdCapDetail();
  else                                   body = renderProdCapDashboard();

  const tabs = [
    { id: 'dashboard',    icon: '📈', label: 'Dashboard' },
    { id: 'by-work-area', icon: '🏭', label: 'By Work Area' },
    { id: 'settings',     icon: '⚙️', label: 'Capacity Settings' },
    { id: 'detail',       icon: '📋', label: 'Batch Detail' },
  ];

  const navBtns = tabs.map(t => `
    <button class="pc-nav-btn ${appState.prodCapTab === t.id ? 'active' : ''}" data-cap-action="cap-prod-set-tab" data-tab="${t.id}">
      ${t.icon} ${t.label}
    </button>`).join('');

  const html = `
    <div class="pc-shell">
      <!-- Top bar -->
      <div class="pc-topbar">
        <div class="pc-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-prod-back">← Back</button>
          <div>
            <div class="pc-topbar-title">Production Load Capacity</div>
            <div class="pc-topbar-sub">Schedule-driven capacity plan · ${(prodState?.batches || []).length} batches · ${(prodState?.products || []).filter(p => p.status === 'active').length} active products</div>
          </div>
        </div>
        <div class="pc-topbar-actions">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="capacity-production" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-prod-open-schedule">↗ Open Schedule</button>
        </div>
      </div>

      <!-- Tab Nav -->
      <div class="pc-nav">${navBtns}</div>

      <!-- Body -->
      <div class="pc-body" id="pcBody">
        ${body}
      </div>
    </div>
  `;

  // Post-render chart drawing
  setTimeout(() => {
    if (appState.prodCapTab === 'dashboard')    prodCapDrawDashChart();
    if (appState.prodCapTab === 'by-work-area') prodCapDrawWorkAreaChart();
  }, 80);

  return html;
}

// ── Tab-level refresh (DOM body swap only — avoids full render() feedback loop) ──
export function prodCapRefreshCurrentTab() {
  const body = document.getElementById('pcBody');
  if (!body) return;
  let content = '';
  if      (appState.prodCapTab === 'dashboard')    content = renderProdCapDashboard();
  else if (appState.prodCapTab === 'by-work-area') content = renderProdCapWorkArea();
  else if (appState.prodCapTab === 'settings')     content = renderProdCapSettings();
  else if (appState.prodCapTab === 'detail')       content = renderProdCapDetail();
  else                                    content = renderProdCapDashboard();
  body.innerHTML = content;
  setTimeout(() => {
    if (appState.prodCapTab === 'dashboard')    prodCapDrawDashChart();
    if (appState.prodCapTab === 'by-work-area') prodCapDrawWorkAreaChart();
  }, 80);
}

setProdCapRefreshCurrentTab(prodCapRefreshCurrentTab)
