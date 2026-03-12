/* ============================================================
   TeamTable.jsx — Team Members Display Table with CRUD
   ============================================================ */

const TeamTable = ({ team, onRefresh }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '', hoursPerWeek: 37.5, utilisation: 80, startDate: '', endDate: ''
  });

  const handleAdd = () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    meDataAddTeam(formData.name, formData.hoursPerWeek, formData.utilisation, formData.startDate, formData.endDate);
    meReactSave();
    setFormData({ name: '', hoursPerWeek: 37.5, utilisation: 80, startDate: '', endDate: '' });
    setShowAddForm(false);
    setTimeout(onRefresh, 100);
  };

  const handleUpdate = (field, value) => {
    if (editIdx !== null) {
      meDataUpdateTeam(editIdx, field, value);
      meReactSave();
      setTimeout(onRefresh, 100);
    }
  };

  const handleDelete = (idx) => {
    if (confirm('Delete this team member?')) {
      meDataDeleteTeam(idx);
      meReactSave();
      setEditIdx(null);
      setTimeout(onRefresh, 100);
    }
  };

  return (
    <div className="me-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="me-card-title">Team Members</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team member name"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Hours/Week</label>
              <input
                type="number"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseFloat(e.target.value) || 37.5 })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
            Add Team Member
          </button>
        </div>
      )}

      {team && team.length > 0 ? (
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start Date</th>
                <th>Hours/Week</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((person, idx) => (
                <tr key={idx} style={{ backgroundColor: editIdx === idx ? '#f0f9ff' : 'transparent' }}>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      escapeHtml(person.name || '')
                    )}
                  </td>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="date"
                        value={person.startDate || ''}
                        onChange={(e) => handleUpdate('startDate', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      person.startDate || '—'
                    )}
                  </td>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="number"
                        value={person.hoursPerWeek}
                        onChange={(e) => handleUpdate('hoursPerWeek', parseFloat(e.target.value))}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      person.hoursPerWeek || '—'
                    )}
                  </td>
                  <td>{person.endDate ? '❌ Inactive' : '✓ Active'}</td>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {editIdx === idx ? (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setEditIdx(null)}
                        style={{ marginRight: '4px' }}
                      >
                        Done
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setEditIdx(idx)}
                          style={{ marginRight: '4px' }}
                        >
                          ✎
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleDelete(idx)}
                          style={{ color: 'var(--red)' }}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No team members yet. Click "Add Member" to create one.
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        Total: {team ? team.length : 0} members
      </div>
    </div>
  );
};
