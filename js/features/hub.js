// js/features/hub.js
function renderHub() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Operations Portal</div>
          <div class="proj-home-sub">Select a department to continue</div>
        </div>
      </div>
      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="alert('Capacity module coming soon')">
          <div class="hub-card-content">
            <div class="hub-icon">📊</div>
            <div class="proj-card-name">CAPACITY</div>
            <div class="proj-card-meta">Load capacity planning</div>
          </div>
        </div>
        
        <div class="proj-card hub-card" onclick="navigate('projects')">
          <div class="hub-card-content">
            <div class="hub-icon">🚀</div>
            <div class="proj-card-name">NEW PRODUCT INTRODUCTION</div>
            <div class="proj-card-meta">APQP Gates, PFMEA & BoM</div>
          </div>
        </div>
        
        <div class="proj-card hub-card" onclick="alert('Production module coming soon')">
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">PRODUCTION</div>
            <div class="proj-card-meta">Production Scheduling</div>
          </div>
        </div>
      </div>
    </div>`;
}
