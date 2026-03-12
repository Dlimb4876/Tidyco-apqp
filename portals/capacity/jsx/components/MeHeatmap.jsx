/* ============================================================
   MeHeatmap.jsx — Heat Map Tab (Functional)
   ============================================================ */

const MeHeatmap = ({ data }) => {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Generate weeks for current month
  const getWeeks = () => {
    const weeks = [];
    const [year, month] = currentMonthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    let currentDate = new Date(monthStart);
    while (currentDate <= monthEnd) {
      const weekStart = new Date(currentDate);
      // Set to Monday
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startIso = weekStart.toISOString().split('T')[0];
      const endIso = weekEnd.toISOString().split('T')[0];
      weeks.push({ start: startIso, end: endIso, startDate: weekStart });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks.slice(0, 5);
  };

  const weeks = getWeeks();

  const getUtilisationColor = (util) => {
    if (util < 80) return '#10b981'; // green
    if (util < 100) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '16px 0',
        borderBottom: '1px solid var(--line)'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Utilisation Heatmap</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Current month team utilisation by week
          </div>
        </div>
      </div>

      <div className="me-card">
        <div style={{ padding: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${weeks.length}, 90px)`, gap: '8px', minWidth: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', paddingTop: '8px' }}>Team Member</div>
            {weeks.map((week, idx) => {
              const [y, m, d] = week.start.split('-');
              return (
                <div
                  key={idx}
                  style={{
                    fontWeight: 600,
                    fontSize: '10px',
                    textAlign: 'center',
                    padding: '8px 4px'
                  }}
                >
                  W{idx + 1} ({m}/{d})
                </div>
              );
            })}

            {(data.team || []).map((person) => (
              <React.Fragment key={person.id}>
                <div style={{ fontSize: '12px', fontWeight: 500, paddingTop: '8px' }}>
                  {escapeHtml(person.name || 'Unnamed').substring(0, 12)}
                </div>
                {weeks.map((week) => {
                  const util = meCalcWeekUtilisationReact(
                    person.id,
                    week.start,
                    week.end,
                    data.tasks || [],
                    data.holidays || []
                  );

                  const bgColor = util.capacity === 0 ? '#e5e7eb' : getUtilisationColor(util.utilisation);
                  const displayUtil = util.capacity === 0 ? '—' : `${util.utilisation}%`;

                  return (
                    <div
                      key={`${person.id}-${week.start}`}
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: '4px',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: util.capacity === 0 ? '#666' : '#fff'
                      }}
                      title={`Capacity: ${util.capacity}h, Demand: ${util.demand}h`}
                    >
                      {displayUtil}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginTop: '16px', padding: '0 16px 16px' }}>
          <strong>Legend:</strong> <span style={{ color: '#10b981' }}>■</span> &lt;80% · <span style={{ color: '#f59e0b' }}>■</span> 80–100% · <span style={{ color: '#ef4444' }}>■</span> &gt;100%
        </div>
      </div>
    </div>
  );
};
