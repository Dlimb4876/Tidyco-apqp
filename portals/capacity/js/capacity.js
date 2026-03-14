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
        <div class="proj-card capacity-card" onclick="setCapacityTab('production')">
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">Production</div>
            <div class="proj-card-meta">Production load capacity plan</div>
          </div>
        </div>

        <div class="proj-card capacity-card" onclick="setCapacityTab('me')">
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">Manufacturing Engineering</div>
            <div class="proj-card-meta">Manufacturing Engineering load capacity plan</div>
          </div>
        </div>

        <div class="proj-card capacity-card" onclick="setCapacityTab('projects')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Project Management</div>
            <div class="proj-card-meta">Project Management load capacity plan</div>
          </div>
        </div>

        <div class="proj-card capacity-card" aria-disabled="true" title="Coming soon" style="opacity:0.65;cursor:not-allowed;filter:grayscale(0.2)">
          <div class="hub-card-content">
            <div class="hub-icon">🚚</div>
            <div class="proj-card-name">Logistics Capacity</div>
            <div class="proj-card-meta">Coming soon</div>
          </div>
        </div>
      </div>
    </div>`;
}
