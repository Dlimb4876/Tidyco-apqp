// js/features/capacity.js
function setCapacityTab(tab) {
  capacityTab = tab;
  const parts = ['s=capacity'];
  if (tab !== 'root') parts.push('ct=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

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
        <div class="proj-card capacity-card" onclick="setCapacityTab('overhaul')">
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">OVERHAUL CAPACITY</div>
            <div class="proj-card-meta">Workshop bay loading</div>
          </div>
        </div>

        <div class="proj-card capacity-card" onclick="setCapacityTab('me')">
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">ME CAPACITY</div>
            <div class="proj-card-meta">Engineering man-hours</div>
          </div>
        </div>

        <div class="proj-card capacity-card" onclick="setCapacityTab('projects')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">PROJECTS CAPACITY</div>
            <div class="proj-card-meta">NPI Pipeline loading</div>
          </div>
        </div>
      </div>
    </div>`;
}
