// Global state for ME Capacity Tab
let meActiveTab = 'dashboard';

// Entry point for the ME Capacity System
function renderMeCapacity() {
  // Ensure DB structure exists
  if (!db.me) {
    db.me = { team: [], tasks: [], products: [], holidays: [] };
    save();
  }

  return `
    <div class="me-system">
      <div class="me-header">
        <div class="me-title-area">
          <button class="btn btn-ghost" onclick="document.getElementById('mainContent').innerHTML = renderCapacity()">← Back</button>
          <h2>ME Load Capacity System</h2>
        </div>
        <div class="me-tabs">
          <button class="me-tab ${meActiveTab === 'dashboard' ? 'active' : ''}" onclick="setMeTab('dashboard')">Dashboard</button>
          <button class="me-tab ${meActiveTab === 'inputs' ? 'active' : ''}" onclick="setMeTab('inputs')">Inputs (Team/Tasks)</button>
          <button class="me-tab ${meActiveTab === 'holidays' ? 'active' : ''}" onclick="setMeTab('holidays')">Holidays</button>
          <button class="me-tab ${meActiveTab === 'sheet' ? 'active' : ''}" onclick="setMeTab('sheet')">Data Sheet</button>
        </div>
      </div>
      <div class="me-content">
        ${getMeTabContent()}
      </div>
    </div>
  `;
}

function setMeTab(tab) {
  meActiveTab = tab;
  document.getElementById('mainContent').innerHTML = renderMeCapacity();
}

function getMeTabContent() {
  if (meActiveTab === 'dashboard') return renderMeDashboardView();
  if (meActiveTab === 'inputs') return renderMeInputsView();
  if (meActiveTab === 'holidays') return renderMeHolidaysView();
  if (meActiveTab === 'sheet') return renderMeSheetView();
}

function renderMeDashboardView() {
  const data = getMeWeeklyData();
  if (data.length === 0) return `<div class="me-empty">No data to display. Add tasks or products in the Inputs tab.</div>`;

  // Calculate max Y axis value for the chart
  let maxVal = 0;
  data.forEach(w => {
    const totalLoad = w.npi + w.imp + w.tend + w.other + w.prod;
    if (totalLoad > maxVal) maxVal = totalLoad;
    if (w.cap > maxVal) maxVal = w.cap;
  });
  maxVal = Math.ceil((maxVal * 1.2) / 10) * 10; // Add 20% headroom and round

  let chartCols = data.map(w => {
    const totalLoad = w.npi + w.imp + w.tend + w.other + w.prod;
    const pNpi = (w.npi / maxVal) * 100;
    const pImp = (w.imp / maxVal) * 100;
    const pTend = (w.tend / maxVal) * 100;
    const pOther = (w.other / maxVal) * 100;
    const pProd = (w.prod / maxVal) * 100;
    const pCap = (w.cap / maxVal) * 100;

    return `
      <div class="me-chart-col">
        <div class="me-chart-bars">
          <div class="me-bar-cap" style="bottom: ${pCap}%" title="Capacity: ${w.cap.toFixed(1)}h"></div>
          <div class="me-bar-stack">
            <div class="me-seg prod" style="height: ${pProd}%" title="Products: ${w.prod.toFixed(1)}h"></div>
            <div class="me-seg other" style="height: ${pOther}%" title="Other: ${w.other.toFixed(1)}h"></div>
            <div class="me-seg tend" style="height: ${pTend}%" title="Tendering: ${w.tend.toFixed(1)}h"></div>
            <div class="me-seg imp" style="height: ${pImp}%" title="Improvement: ${w.imp.toFixed(1)}h"></div>
            <div class="me-seg npi" style="height: ${pNpi}%" title="NPI: ${w.npi.toFixed(1)}h"></div>
          </div>
        </div>
        <div class="me-chart-lbl">${w.label}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="me-card">
      <div class="me-chart-header">
        <h3>Load vs Capacity (Next 12 Weeks)</h3>
        <div class="me-legend">
          <span class="leg-item"><div class="leg-box npi"></div> NPI</span>
          <span class="leg-item"><div class="leg-box imp"></div> Improvement</span>
          <span class="leg-item"><div class="leg-box tend"></div> Tendering</span>
          <span class="leg-item"><div class="leg-box other"></div> Other</span>
          <span class="leg-item"><div class="leg-box prod"></div> Support</span>
          <span class="leg-item"><div class="leg-line cap"></div> Capacity Limit</span>
        </div>
      </div>
      <div class="me-chart-container">
        <div class="me-chart-y-axis">
          <span>${maxVal}h</span>
          <span>${maxVal/2}h</span>
          <span>0h</span>
        </div>
        <div class="me-chart-grid">
          ${chartCols}
        </div>
      </div>
    </div>
  `;
}
