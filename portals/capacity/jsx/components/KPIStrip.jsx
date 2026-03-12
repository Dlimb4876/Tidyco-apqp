/* ============================================================
   KPIStrip.jsx — KPI Cards Display
   ============================================================ */

const KPIStrip = ({ capacity, demand, utilisation, headroom, monthLabel, teamCount }) => {
  const utilisationColor = utilisation < 85
    ? 'var(--green)'
    : utilisation < 100
    ? 'var(--amber)'
    : 'var(--red)';

  const utilisationStatus = utilisation < 85
    ? '✓ Healthy'
    : utilisation < 100
    ? '⚠ Tight'
    : '✗ Over';

  return (
    <div className="me-dashboard-kpis">
      <div className="me-dashboard-kpi" style={{ borderLeft: '4px solid var(--green)' }}>
        <div className="me-dashboard-kpi-value">{teamCount}</div>
        <div className="me-dashboard-kpi-label">Team Members</div>
      </div>

      <div className="me-dashboard-kpi" style={{ borderLeft: '4px solid var(--blue)' }}>
        <div className="me-dashboard-kpi-value">{capacity}</div>
        <div className="me-dashboard-kpi-label">Capacity (h)</div>
        <div className="me-dashboard-kpi-sub">{monthLabel}</div>
      </div>

      <div className="me-dashboard-kpi" style={{ borderLeft: '4px solid #f59e0b' }}>
        <div className="me-dashboard-kpi-value">{demand}</div>
        <div className="me-dashboard-kpi-label">Demand (h)</div>
        <div className="me-dashboard-kpi-sub">{monthLabel}</div>
      </div>

      <div className="me-dashboard-kpi" style={{ borderLeft: `4px solid ${utilisationColor}` }}>
        <div className="me-dashboard-kpi-value">{utilisation}%</div>
        <div className="me-dashboard-kpi-label">Utilisation</div>
        <div className="me-dashboard-kpi-sub">{utilisationStatus}</div>
      </div>

      <div className="me-dashboard-kpi" style={{ borderLeft: '4px solid var(--navy)' }}>
        <div className="me-dashboard-kpi-value">{headroom}</div>
        <div className="me-dashboard-kpi-label">Headroom (h)</div>
        <div className="me-dashboard-kpi-sub">{monthLabel}</div>
      </div>
    </div>
  );
};
