/* ============================================================
   MeHeatmap.jsx — Heat Map Tab
   ============================================================ */

const MeHeatmap = ({ data }) => {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Placeholder heatmap - simplified version
  const renderHeatmap = () => {
    const weeks = [];
    const [year, month] = currentMonthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    let currentDate = monthStart;
    while (currentDate <= monthEnd) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({ start: weekStart, end: weekEnd });
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks.slice(0, 5); // First 5 weeks
  };

  const weeks = renderHeatmap();

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
          <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${weeks.length}, 80px)`, gap: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '12px' }}>Team Member</div>
            {weeks.map((week, idx) => (
              <div
                key={idx}
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '4px'
                }}
              >
                W{idx + 1}
              </div>
            ))}

            {(data.team || []).map((person, pIdx) => (
              <React.Fragment key={pIdx}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>
                  {escapeHtml(person.name || 'Unnamed').substring(0, 12)}
                </div>
                {weeks.map((week, wIdx) => (
                  <div
                    key={`${pIdx}-${wIdx}`}
                    style={{
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    —
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginTop: '16px', padding: '0 16px 16px' }}>
          <strong>Legend:</strong> Green &lt;80% · Amber 80–100% · Red &gt;100%
        </div>
      </div>

      <div className="me-card" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Note:</strong> Full heatmap with utilisation calculations available in vanilla version.
        </div>
      </div>
    </div>
  );
};
