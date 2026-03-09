/**
 * js/features/hub.js
 * High-level landing page for Tidyco Operations Portal
 */
function renderHub() {
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Operations Portal</div>
          <div class="proj-home-sub">Select a department to continue</div>
        </div>
      </div>
      <div class="proj-cards" style="grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div class="proj-card" onclick="alert('Capacity module coming soon')">
          <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
          <div class="proj-card-name">CAPACITY</div>
          <div class="proj-card-meta">Resource planning & load balancing</div>
        </div>
        
        <div class="proj-card" onclick="navigate('projects')">
          <div style="font-size: 32px; margin-bottom: 12px;">🚀</div>
          <div class="proj-card-name">NEW PRODUCT INTRODUCTION</div>
          <div class="proj-card-meta">APQP Gates, PFMEA & NPI Timing</div>
        </div>
        
        <div class="proj-card" onclick="alert('Production module coming soon')">
          <div style="font-size: 32px; margin-bottom: 12px;">🏭</div>
          <div class="proj-card-name">PRODUCTION</div>
          <div class="proj-card-meta">Live shop floor tracking & OEE</div>
        </div>
      </div>
    </div>`;
}
