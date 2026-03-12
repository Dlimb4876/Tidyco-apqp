/* ============================================================
   TaskTable.jsx — Tasks Display Table
   ============================================================ */

const TaskTable = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="me-card">
        <div className="me-card-title">Tasks</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No tasks. Click the vanilla version to add.
        </div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)
  );

  return (
    <div className="me-card">
      <div className="me-card-title">Tasks</div>
      <div className="me-tbl-wrap">
        <table className="me-tbl">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Category</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Hours</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task, idx) => (
              <tr key={idx}>
                <td>{escapeHtml(task.name || '')}</td>
                <td>{escapeHtml(task.category || 'Other')}</td>
                <td>{task.startDate || '—'}</td>
                <td>{task.endDate || '—'}</td>
                <td style={{ textAlign: 'right' }}>{task.totalHours || 0}</td>
                <td>{escapeHtml(task.assignedTo || '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        Total: {tasks.length} tasks
      </div>
    </div>
  );
};
