/* ============================================================
   TaskTable.jsx — Tasks Display Table with CRUD
   ============================================================ */

const TaskTable = ({ tasks, onRefresh }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '', category: 'Other', assigneeId: '', startDate: '', endDate: '', totalHours: 0
  });

  const handleAdd = () => {
    if (!formData.name.trim()) {
      alert('Task name is required');
      return;
    }
    meDataAddTask(formData.name, formData.category, formData.assigneeId, formData.startDate, formData.endDate, formData.totalHours, '');
    meReactSave();
    setFormData({ name: '', category: 'Other', assigneeId: '', startDate: '', endDate: '', totalHours: 0 });
    setShowAddForm(false);
    setTimeout(onRefresh, 100);
  };

  const handleUpdate = (field, value) => {
    if (editIdx !== null) {
      meDataUpdateTask(editIdx, field, value);
      meReactSave();
      setTimeout(onRefresh, 100);
    }
  };

  const handleDelete = (idx) => {
    if (confirm('Delete this task?')) {
      meDataDeleteTask(idx);
      meReactSave();
      setEditIdx(null);
      setTimeout(onRefresh, 100);
    }
  };

  const sortedTasks = tasks ? [...tasks].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)) : [];

  return (
    <div className="me-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="me-card-title">Tasks</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Task Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Task name"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="Other">Other</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Testing">Testing</option>
              </select>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Hours</label>
              <input
                type="number"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
            Add Task
          </button>
        </div>
      )}

      {sortedTasks.length > 0 ? (
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Category</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task, idx) => (
                <tr key={idx} style={{ backgroundColor: editIdx === idx ? '#f0f9ff' : 'transparent' }}>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      escapeHtml(task.name || '')
                    )}
                  </td>
                  <td>
                    {editIdx === idx ? (
                      <select
                        value={task.category || 'Other'}
                        onChange={(e) => handleUpdate('category', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      >
                        <option value="Other">Other</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Testing">Testing</option>
                      </select>
                    ) : (
                      escapeHtml(task.category || 'Other')
                    )}
                  </td>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="date"
                        value={task.startDate || ''}
                        onChange={(e) => handleUpdate('startDate', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      task.startDate || '—'
                    )}
                  </td>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="date"
                        value={task.endDate || ''}
                        onChange={(e) => handleUpdate('endDate', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      task.endDate || '—'
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editIdx === idx ? (
                      <input
                        type="number"
                        value={task.totalHours || 0}
                        onChange={(e) => handleUpdate('totalHours', parseFloat(e.target.value))}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '80px' }}
                      />
                    ) : (
                      task.totalHours || 0
                    )}
                  </td>
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
          No tasks yet. Click "Add Task" to create one.
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        Total: {sortedTasks.length} tasks
      </div>
    </div>
  );
};
