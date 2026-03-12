/* ============================================================
   MeTeam.jsx — Team Management Tab (Fully Functional)
   ============================================================ */

const MeTeam = ({ data, onSave, onRefresh }) => {
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
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Team Management</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Add, edit, and manage team members
          </div>
        </div>
      </div>

      <TeamTable team={data} onRefresh={onRefresh} />
    </div>
  );
};
