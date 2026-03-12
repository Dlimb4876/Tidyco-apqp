/* ============================================================
   MeProductTaskload.jsx — Product Taskload Tab
   ============================================================ */

const MeProductTaskload = ({ data }) => {
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
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Product Load Analysis</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            View product-level task distribution
          </div>
        </div>
      </div>

      <div className="me-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Product Taskload View</div>
        <div style={{ color: '#666', marginBottom: '24px' }}>
          This tab shows task distribution across products. Use vanilla version for full functionality.
        </div>

        {data.products && data.products.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'left', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 600, marginBottom: '12px' }}>Products: {data.products.length}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {data.products.slice(0, 3).map((p, idx) => (
                <div key={idx}>{escapeHtml(p.name || 'Unnamed')}</div>
              ))}
              {data.products.length > 3 && <div>... and {data.products.length - 3} more</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
