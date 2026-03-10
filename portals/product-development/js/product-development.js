// Product Development Portal Hub
// Entry point for NPI and product development

function setProductDevelopmentTab(tab) {
  productDevelopmentTab = tab;
  const parts = ['s=product-development'];
  if (tab !== 'root') parts.push('pdt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function renderProductDevelopment() {
  if (productDevelopmentTab === 'npi') return renderProjects();
  if (productDevelopmentTab === 'product-management') return renderProductManagement();

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
      </div>
    </div>
  `;
}
