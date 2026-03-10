// js/features/hub.js
function renderHub() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Operations Portal</div>
          <div class="proj-home-sub">Select an area to continue</div>
        </div>
      </div>
      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="navigate('capacity')">
          <div class="hub-card-content">
            <div class="hub-icon">📊</div>
            <div class="proj-card-name">CAPACITY</div>
            <div class="proj-card-meta">Load Capacity Planning</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('product-development')">
          <div class="hub-card-content">
            <div class="hub-icon">🚀</div>
            <div class="proj-card-name">PRODUCT DEVELOPMENT</div>
            <div class="proj-card-meta">NPI & Product Management</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('production')">
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">PRODUCTION</div>
            <div class="proj-card-meta">Batch Scheduling & Planning</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('productmgmt')">
          <div class="hub-card-content">
            <div class="hub-icon">⚙️</div>
            <div class="proj-card-name">PRODUCT SETUP</div>
            <div class="proj-card-meta">Manage Product Families</div>
          </div>
        </div>
      </div>
    </div>`;
}
