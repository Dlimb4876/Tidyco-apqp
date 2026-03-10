// Product Management Page
function renderProductManagement() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Product Management</div>
          <div class="proj-home-sub">Coming Soon</div>
        </div>
        <button class="btn btn-ghost" onclick="setProductDevelopmentTab('root')">← Back</button>
      </div>
      <div class="coming-soon-container">
        <div class="coming-soon-content">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
          <h2>Coming Soon</h2>
          <p>Product Management features are under development.</p>
        </div>
      </div>
    </div>
  `;
}
