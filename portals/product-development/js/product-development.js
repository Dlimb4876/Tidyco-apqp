import { productDevelopmentTab, setProductDevelopmentTab as setPDTab, getFamilies, esc } from '../../../core/js/state.js';
import { renderProjects } from './npi/js/dashboard.js';
import { renderProductManagement } from './product-management.js';
import { renderProductMgmt } from '../../productmgmt/js/productmgmt.js';
import { navigate, render } from '../../../utils/js/navigation.js';

// ── Product Development Portal Hub ──────────────────────────
export function setProductDevelopmentTab(tab) {
  productDevelopmentTab = tab;
  const parts = ['s=product-development'];
  if (tab !== 'root') parts.push('pdt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

export function renderProductDevelopment() {
  if (productDevelopmentTab === 'npi') return renderProjects();
  if (productDevelopmentTab === 'product-management') return renderProductManagement();
  if (productDevelopmentTab === 'product-family-db') return renderProductMgmt();

  // Root hub view
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Development</div>
          <div class="proj-home-sub">New Product Introduction & Project Management</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('npi')">
          <div class="hub-card-content">
            <div class="hub-icon">📋</div>
            <div class="proj-card-name">NPI Projects</div>
            <div class="proj-card-meta">APQP Gates, PFMEA & BoM</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('product-management')">
          <div class="hub-card-content">
            <div class="hub-icon">📦</div>
            <div class="proj-card-name">Product Management</div>
            <div class="proj-card-meta">Product Catalog & Lifecycle</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductDevelopmentTab('product-family-db')">
          <div class="hub-card-content">
            <div class="hub-icon">🏢</div>
            <div class="proj-card-name">Product Family Database</div>
            <div class="proj-card-meta">Family definitions & attributes</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Rename this internal one or export as needed
export function renderProductFamilyDatabase() {
  const families = getFamilies();

  if (!families || families.length === 0) {
    return `
      <div class="proj-home">
        <div class="proj-home-header">
          <div>
            <div class="proj-home-title">Product Family Database</div>
            <div class="proj-home-sub">Manage product families, attributes, and configurations</div>
          </div>
          <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
        </div>

        <div style="text-align:center;padding:80px 20px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">🏢</div>
          <div style="font-size:18px;font-weight:600;color:var(--mid);margin-bottom:8px">No Product Families</div>
          <div style="font-size:13px;">Configure product families in settings</div>
        </div>
      </div>
    `;
  }

  const familyCards = families.map(fam => {
    return `
      <div class="proj-card hub-card" onclick="alert('Family details for ${fam.label} coming soon')">
        <div class="hub-card-content">
          <div class="hub-icon">${fam.icon}</div>
          <div class="proj-card-name">${esc(fam.label)}</div>
          <div class="proj-card-meta">${fam.description ? esc(fam.description) : 'No description'}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Family Database</div>
          <div class="proj-home-sub">Manage product families, attributes, and configurations</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
      </div>

      <div class="proj-cards hub-grid">
        ${familyCards}
      </div>
    </div>
  `;
}
