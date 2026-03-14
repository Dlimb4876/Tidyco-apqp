// js/features/hub.js
function renderHub() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Tidyco APQP Management System</div>
          <div class="proj-home-sub">Quality Planning, Production & Operations Control</div>
        </div>
      </div>

      <!-- Director-level overview banner -->
      <div class="hub-operations-banner">
        <div class="proj-card hub-card hub-card-banner" onclick="navigate('operations')">
          <div class="hub-card-content hub-card-content-banner">
            <div class="banner-text">
              <div class="proj-card-name">OPERATIONS DASHBOARD</div>
              <div class="proj-card-meta">Director-level overview of all operations, metrics, and risks</div>
            </div>
            <div class="hub-icon hub-icon-banner">🛰️</div>
          </div>
        </div>
      </div>

      <!-- Operational portals grid -->
      <div class="hub-operations-header">Operational Portals</div>
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
      </div>
    </div>`;
}
