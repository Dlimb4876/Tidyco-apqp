/* ============================================================
   MeDashboard.jsx — Dashboard Tab
   ============================================================ */

const MeDashboard = ({ data }) => {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const monthData = meCalculateMonthDataReact(currentMonthKey, data.team, data.tasks, data.products, data.holidays);
  const monthLabel = meGetMonthLabelReact(currentMonthKey).join(' ');

  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  // Upcoming tasks
  const upcomingTasks = (data.tasks || [])
    .filter(t => t.startDate && t.endDate)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .filter(t => new Date(t.endDate) > now)
    .slice(0, 3);

  const now = new Date();

  return (
    <div className="me-dashboard">
      <KPIStrip
        capacity={capacity}
        demand={demand}
        utilisation={utilisation}
        headroom={headroom}
        monthLabel={monthLabel}
        teamCount={data.team ? data.team.length : 0}
      />

      <div className="me-dashboard-grid">
        <div className="me-dashboard-card">
          <div className="me-dashboard-card-title">6-Month Load Forecast</div>
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            📊 Chart rendering in React version (use vanilla version for full charts)
          </div>
        </div>

        <div className="me-dashboard-card">
          <div className="me-dashboard-card-title">Current Month Utilisation</div>
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            🔥 Heatmap available in Heatmap tab
          </div>
        </div>
      </div>

      <div className="me-dashboard-card">
        <div className="me-dashboard-card-title">Upcoming Deadlines</div>
        {upcomingTasks.length > 0 ? (
          <div className="me-dashboard-tasks">
            {upcomingTasks.map((task, idx) => {
              const endDate = new Date(task.endDate);
              const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
              const urgency = daysUntil <= 7 ? 'urgent' : daysUntil <= 14 ? 'warning' : 'normal';
              return (
                <div key={idx} className={`me-task-item ${urgency}`}>
                  <div className="me-task-details">
                    <div className="me-task-name">{escapeHtml(task.name)}</div>
                    <div className="me-task-meta">
                      {daysUntil} days · {task.totalHours}h · {task.category || 'Other'}
                    </div>
                  </div>
                  <div className="me-task-date">{task.endDate}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="me-dashboard-empty">No upcoming tasks</div>
        )}
      </div>
    </div>
  );
};
