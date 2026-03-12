/* ============================================================
   MeHolidays.jsx — Holiday Planner Tab
   ============================================================ */

const MeHolidays = ({ data, onSave }) => {
  if (!data || data.length === 0) {
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
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Holiday Planner</div>
          </div>
        </div>

        <div className="me-card">
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏖️</div>
            No holidays scheduled. Click "Switch to Vanilla" to add holidays.
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Holiday Planner</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Team holidays and planned time off
          </div>
        </div>
      </div>

      <div className="me-card">
        <div className="me-card-title">Holidays</div>
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Person</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((holiday, idx) => (
                <tr key={idx}>
                  <td>{holiday.date || '—'}</td>
                  <td>{escapeHtml(holiday.person || '—')}</td>
                  <td>{escapeHtml(holiday.type || 'Holiday')}</td>
                  <td>{escapeHtml(holiday.notes || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
          Total: {data.length} holidays
        </div>
      </div>

      <div className="me-card" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Note:</strong> This is a read-only view in the React version. Click "Switch to Vanilla" to edit holidays.
        </div>
      </div>
    </div>
  );
};
