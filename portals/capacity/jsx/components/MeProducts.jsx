/* ============================================================
   MeProducts.jsx — Products Tab
   ============================================================ */

const MeProducts = ({ data, onSave }) => {
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
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Product Support</div>
          </div>
        </div>

        <div className="me-card">
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No products. Click "Switch to Vanilla" to add products.
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
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Product Support</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            View products and their support requirements
          </div>
        </div>
      </div>

      <div className="me-card">
        <div className="me-card-title">Products</div>
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product, idx) => (
                <tr key={idx}>
                  <td>{escapeHtml(product.name || '')}</td>
                  <td>{escapeHtml(product.type || '—')}</td>
                  <td>{escapeHtml(product.status || 'Active')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
          Total: {data.length} products
        </div>
      </div>

      <div className="me-card" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Note:</strong> This is a read-only view in the React version. Click "Switch to Vanilla" to edit products.
        </div>
      </div>
    </div>
  );
};
