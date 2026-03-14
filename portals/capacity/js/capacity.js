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
        <button class="btn btn-ghost" data-cap-action="cap-nav-hub">← Back to Portal</button>
      </div>
      <div class="proj-cards capacity-grid">
        <div class="proj-card capacity-card" data-cap-action="cap-set-tab" data-tab="production">
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">Production</div>
            <div class="proj-card-meta">Production load capacity plan</div>
          </div>
        </div>

        <div class="proj-card capacity-card" data-cap-action="cap-set-tab" data-tab="me">
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">Manufacturing Engineering</div>
            <div class="proj-card-meta">Manufacturing Engineering load capacity plan</div>
          </div>
        </div>

        <div class="proj-card capacity-card" data-cap-action="cap-set-tab" data-tab="projects">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Project Management</div>
            <div class="proj-card-meta">Project Management load capacity plan</div>
          </div>
        </div>
      </div>
    </div>`;
}
