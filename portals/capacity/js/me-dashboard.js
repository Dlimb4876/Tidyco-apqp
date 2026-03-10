/* ============================================================
   me-dashboard.js — ME Capacity Dashboard
   ============================================================ */

window.meRenderDashboardTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const monthData = meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const monthLabel = meGetMonthLabel(monthKey);

  // KPI calculations
  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  // Team health analysis
  const healthAnalysis = meAnalyzeTeamHealth(teamArray, tasksArray, holidaysArray, monthKey);

  // Task summary
  const tasksSorted = tasksArray
    .filter(t => t.startDate && t.endDate)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  const upcomingTasks = tasksSorted
    .filter(t => {
      const endDate = new Date(t.endDate);
      const now = new Date();
      return endDate > now;
    })
    .slice(0, 3);

  const utilisationColor = utilisation < 85 ? 'var(--green)' :
                           utilisation < 100 ? 'var(--amber)' : 'var(--red)';

  return `
    <div class="me-dashboard">
      <!-- Top KPI Row -->
      <div class="me-dashboard-kpis">
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-dashboard-kpi-value">${teamArray.length}</div>
          <div class="me-dashboard-kpi-label">Team Members</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-dashboard-kpi-value">${capacity}</div>
          <div class="me-dashboard-kpi-label">Capacity (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid #f59e0b;">
          <div class="me-dashboard-kpi-value">${demand}</div>
          <div class="me-dashboard-kpi-label">Demand (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-dashboard-kpi-value">${utilisation}%</div>
          <div class="me-dashboard-kpi-label">Utilisation</div>
          <div class="me-dashboard-kpi-sub">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-dashboard-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-dashboard-kpi-value">${headroom}</div>
          <div class="me-dashboard-kpi-label">Headroom (h)</div>
          <div class="me-dashboard-kpi-sub">${monthLabel.join(' ')}</div>
        </div>
      </div>

      <!-- Health & Tasks Row -->
      <div class="me-dashboard-grid">
        <!-- Team Health -->
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">Team Health</div>
          <div class="me-dashboard-health">
            <div class="me-health-item">
              <div class="me-health-dot" style="background: var(--green);"></div>
              <span>Healthy (<80%)</span>
              <span class="me-health-count">${healthAnalysis.healthy}</span>
            </div>
            <div class="me-health-item">
              <div class="me-health-dot" style="background: var(--amber);"></div>
              <span>Tight (80–100%)</span>
              <span class="me-health-count">${healthAnalysis.tight}</span>
            </div>
            <div class="me-health-item">
              <div class="me-health-dot" style="background: var(--red);"></div>
              <span>Overloaded (>100%)</span>
              <span class="me-health-count">${healthAnalysis.overloaded}</span>
            </div>
          </div>
        </div>

        <!-- Task Load by Category -->
        <div class="me-dashboard-card">
          <div class="me-dashboard-card-title">Demand by Category</div>
          <div class="me-dashboard-categories">
            ${monthData.npi > 0 ? `<div class="me-cat-item"><div class="me-cat-bar" style="background: #3b82f6; width: ${(monthData.npi / monthData.totalDemand * 100)}%"></div><span>NPI</span><span>${monthData.npi.toFixed(0)}h</span></div>` : ''}
            ${monthData.improvement > 0 ? `<div class="me-cat-item"><div class="me-cat-bar" style="background: #10b981; width: ${(monthData.improvement / monthData.totalDemand * 100)}%"></div><span>Improvement</span><span>${monthData.improvement.toFixed(0)}h</span></div>` : ''}
            ${monthData.tendering > 0 ? `<div class="me-cat-item"><div class="me-cat-bar" style="background: #f59e0b; width: ${(monthData.tendering / monthData.totalDemand * 100)}%"></div><span>Tendering</span><span>${monthData.tendering.toFixed(0)}h</span></div>` : ''}
            ${monthData.support > 0 ? `<div class="me-cat-item"><div class="me-cat-bar" style="background: #14b8a6; width: ${(monthData.support / monthData.totalDemand * 100)}%"></div><span>Support</span><span>${monthData.support.toFixed(0)}h</span></div>` : ''}
            ${monthData.other > 0 ? `<div class="me-cat-item"><div class="me-cat-bar" style="background: #8b5cf6; width: ${(monthData.other / monthData.totalDemand * 100)}%"></div><span>Other</span><span>${monthData.other.toFixed(0)}h</span></div>` : ''}
          </div>
        </div>
      </div>

      <!-- Upcoming Tasks -->
      <div class="me-dashboard-card">
        <div class="me-dashboard-card-title">Upcoming Deadlines</div>
        ${upcomingTasks.length > 0 ? `
          <div class="me-dashboard-tasks">
            ${upcomingTasks.map(task => {
              const endDate = new Date(task.endDate);
              const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
              const urgency = daysUntil <= 7 ? 'urgent' : daysUntil <= 14 ? 'warning' : 'normal';
              return `
                <div class="me-task-item ${urgency}">
                  <div class="me-task-details">
                    <div class="me-task-name">${esc(task.name)}</div>
                    <div class="me-task-meta">${daysUntil} days · ${task.totalHours}h · ${task.category || 'Other'}</div>
                  </div>
                  <div class="me-task-date">${task.endDate}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="me-dashboard-empty">No upcoming tasks</div>
        `}
      </div>

      <!-- Quick Navigation -->
      <div class="me-dashboard-nav">
        <button class="btn btn-secondary" onclick="meSetTab('chart')">📊 View Chart</button>
        <button class="btn btn-secondary" onclick="meSetTab('heatmap')">🔥 Team Heatmap</button>
        <button class="btn btn-secondary" onclick="meSetTab('team')">👷 Manage Team</button>
        <button class="btn btn-secondary" onclick="meSetTab('tasks')">📋 All Tasks</button>
      </div>
    </div>
  `;
};

/**
 * Analyze team health by calculating utilisation per person for a given month
 */
function meAnalyzeTeamHealth(teamArray, tasksArray, holidaysArray, monthKey) {
  let healthy = 0, tight = 0, overloaded = 0;

  teamArray.forEach(member => {
    if (!member.startDate) return;

    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Calculate individual capacity
    const hoursAdjusted = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    const startDate = new Date(member.startDate);
    let activeStart = monthStart;
    let activeEnd = monthEnd;

    if (startDate > monthStart) activeStart = startDate;
    if (member.endDate) {
      const endDate = new Date(member.endDate);
      if (endDate < monthEnd) activeEnd = endDate;
    }

    if (activeStart > activeEnd) return;

    const workDays = meCountWorkDaysBetween(activeStart, activeEnd);
    const capacity = hoursAdjusted * (workDays / 5);

    // Calculate holidays for this person
    let holidayDeduction = 0;
    const hoursPerDay = 7.5;
    holidaysArray.forEach(holiday => {
      const holidayMonth = holiday.date.substring(0, 7);
      if (holidayMonth === monthKey && holiday.personId === member.id) {
        if (holiday.type === 'full') {
          holidayDeduction += hoursPerDay;
        } else if (holiday.type === 'half') {
          holidayDeduction += hoursPerDay / 2;
        }
      }
    });

    const adjustedCapacity = Math.max(0, capacity - holidayDeduction);

    // Calculate demand for this person
    let personDemand = 0;
    tasksArray.forEach(task => {
      if (!task.startDate || !task.endDate) return;
      if (task.assigneeId !== member.id) return;

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

      if (overlapStart <= overlapEnd) {
        const totalDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
        const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
        const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);
        personDemand += hoursThisMonth;
      }
    });

    // Categorize health
    if (adjustedCapacity === 0) return;
    const personUtil = (personDemand / adjustedCapacity) * 100;

    if (personUtil < 80) healthy++;
    else if (personUtil < 100) tight++;
    else overloaded++;
  });

  return { healthy, tight, overloaded };
}
