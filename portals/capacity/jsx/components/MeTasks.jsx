/* ============================================================
   MeTasks.jsx — Tasks Management Tab (Fully Functional)
   ============================================================ */

const MeTasks = ({ data, onSave, onRefresh }) => {
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
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Task Management</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Create, edit, and track engineering tasks
          </div>
        </div>
      </div>

      <TaskTable tasks={data} onRefresh={onRefresh} />
    </div>
  );
};
