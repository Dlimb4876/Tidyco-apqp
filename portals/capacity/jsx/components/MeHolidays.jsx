/* ============================================================
   MeHolidays.jsx — Holiday Planner Tab (Fully Functional)
   ============================================================ */

const MeHolidays = ({ data, onSave, onRefresh }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    personId: '', date: '', type: 'full'
  });

  const teamList = typeof meDataGetTeam === 'function' ? meDataGetTeam() : [];

  const handleAdd = () => {
    if (!formData.personId || !formData.date) {
      alert('Person and date are required');
      return;
    }
    meDataAddHoliday(formData.personId, formData.date, formData.type);
    meReactSave();
    setFormData({ personId: '', date: '', type: 'full' });
    setShowAddForm(false);
    setTimeout(onRefresh, 100);
  };

  const handleDelete = (personId, date) => {
    if (confirm('Delete this holiday?')) {
      meDataDeleteHoliday(personId, date);
      meReactSave();
      setTimeout(onRefresh, 100);
    }
  };

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
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            + Add Holiday
          </button>
        </div>

        {showAddForm && (
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <select
                value={formData.personId}
                onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="">Select person</option>
                {teamList.map((person, idx) => (
                  <option key={idx} value={person.id}>{escapeHtml(person.name)}</option>
                ))}
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
              Add Holiday
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAddForm(false)} style={{ width: '100%', marginTop: '8px' }}>
              Cancel
            </button>
          </div>
        )}

        <div className="me-card">
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏖️</div>
            No holidays scheduled. Click "Add Holiday" to create one.
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
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Holiday'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <select
              value={formData.personId}
              onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
              style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
            >
              <option value="">Select person</option>
              {teamList.map((person, idx) => (
                <option key={idx} value={person.id}>{escapeHtml(person.name)}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
            Add Holiday
          </button>
        </div>
      )}

      <div className="me-card">
        <div className="me-card-title">Holidays</div>
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Person</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((holiday, idx) => {
                const person = teamList.find(t => t.id === holiday.personId);
                return (
                  <tr key={idx}>
                    <td>{holiday.date || '—'}</td>
                    <td>{escapeHtml(person?.name || '—')}</td>
                    <td>{escapeHtml(holiday.type || 'full')}</td>
                    <td style={{ fontSize: '12px' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleDelete(holiday.personId, holiday.date)}
                        style={{ color: 'var(--red)' }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
          Total: {data.length} holidays
        </div>
      </div>
    </div>
  );
};
