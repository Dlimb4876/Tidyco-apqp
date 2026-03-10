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

        <div class="proj-card hub-card" onclick="showProductDevMenu()">
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

function showProductDevMenu() {
  const modal = document.createElement('div');
  modal.id = 'prodDevMenu';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">Product Development</div>
        <button class="modal-close" onclick="document.getElementById('prodDevMenu').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="proddev-menu-item" onclick="navigate('projects'); document.getElementById('prodDevMenu').remove();">
          <div class="proddev-menu-icon">📋</div>
          <div class="proddev-menu-text">
            <div class="proddev-menu-name">New Product Introduction</div>
            <div class="proddev-menu-meta">APQP Gates, PFMEA & BoM</div>
          </div>
        </div>
        <div class="proddev-menu-item" onclick="navigate('productmgmt'); document.getElementById('prodDevMenu').remove();">
          <div class="proddev-menu-icon">📦</div>
          <div class="proddev-menu-text">
            <div class="proddev-menu-name">Product Management</div>
            <div class="proddev-menu-meta">Product Definitions & Attributes</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
