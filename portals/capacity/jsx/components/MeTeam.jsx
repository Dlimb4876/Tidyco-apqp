/* ============================================================
   MeTeam.jsx — Team Management Tab
   ============================================================ */

const MeTeam = ({ data, onSave }) => {
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
            View and manage team members (use vanilla version to add/edit)
          </div>
        </div>
      </div>

      <TeamTable team={data} />

      <div className="me-card" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Note:</strong> This is a read-only view in the React version. Click "Switch to Vanilla" to edit team members.
        </div>
      </div>
    </div>
  );
};
