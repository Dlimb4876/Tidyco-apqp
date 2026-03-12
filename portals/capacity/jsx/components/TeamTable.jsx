/* ============================================================
   TeamTable.jsx — Team Members Display Table
   ============================================================ */

const TeamTable = ({ team }) => {
  if (!team || team.length === 0) {
    return (
      <div className="me-card">
        <div className="me-card-title">Team</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No team members. Click the vanilla version to add.
        </div>
      </div>
    );
  }

  return (
    <div className="me-card">
      <div className="me-card-title">Team Members</div>
      <div className="me-tbl-wrap">
        <table className="me-tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Start Date</th>
              <th>Hours/Week</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((person, idx) => (
              <tr key={idx}>
                <td>{escapeHtml(person.name || '')}</td>
                <td>{escapeHtml(person.role || '')}</td>
                <td>{person.startDate || '—'}</td>
                <td>{person.hoursPerWeek || '—'}</td>
                <td>{person.endDate ? 'Inactive' : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        Total: {team.length} members
      </div>
    </div>
  );
};
