// js/features/capacity.js
function renderCapacity() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Capacity Management</div>
          <div class="proj-home-sub">Select a capacity stream to view loading</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>
      <div class="proj-cards capacity-grid">
        <div class="proj-card capacity-card" onclick="alert('Overhaul Capacity coming soon')">
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">OVERHAUL CAPACITY</div>
            <div class="proj-card-meta">Workshop bay loading</div>
          </div>
        </div>
        
        <div class="proj-card capacity-card" onclick="document.getElementById('mainContent').innerHTML = renderMeCapacity()">
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">ME CAPACITY</div>
            <div class="proj-card-meta">Engineering man-hours</div>
          </div>
        </div>
        
        <div class="proj-card capacity-card" onclick="alert('Projects Capacity coming soon')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">PROJECTS CAPACITY</div>
            <div class="proj-card-meta">NPI Pipeline loading</div>
          </div>
        </div>
      </div>
    </div>`;
}
