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
  // ... maxVal calculation

  let chartCols = data.map(w => {
    // ... percentage calculations
    const pCap = (w.cap / maxVal) * 100;

    return `
      <div class="me-chart-col">
        <div class="me-chart-bars">
          <div class="me-bar-cap-line" style="bottom: ${pCap}%" title="Capacity: ${w.cap.toFixed(1)}h"></div>
          
          <div class="me-bar-stack">
            <div class="me-seg prod" style="height: ${pProd}%"></div>
            <div class="me-seg other" style="height: ${pOther}%"></div>
            <div class="me-seg tend" style="height: ${pTend}%"></div>
            <div class="me-seg imp" style="height: ${pImp}%"></div>
            <div class="me-seg npi" style="height: ${pNpi}%"></div>
          </div>
        </div>
        <div class="me-chart-lbl">${w.label}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="me-card">
      <div class="me-chart-header">
        <h3>18-Month Load Capacity</h3>
        <div style="display:flex; gap:10px; align-items:center;">
          <label style="font-size:12px">Start Month Offset:</label>
          <input type="number" value="${meStartOffset}" onchange="meStartOffset=parseInt(this.value);render()" style="width:50px">
        </div>
        </div>
      <div class="me-chart-container" style="padding-left: 40px; padding-bottom: 40px;">
        <div class="me-chart-y-axis" style="position: absolute; left: 10px;">
          <span>${maxVal}h</span>
          <span>0h</span>
        </div>
        <div class="me-chart-grid" style="overflow-x: auto;">
          ${chartCols}
        </div>
      </div>
    </div>
  `;
}
