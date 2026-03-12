/* ============================================================
   MeProducts.jsx — Products Tab (Fully Functional)
   ============================================================ */

const MeProducts = ({ data, onSave, onRefresh }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '', supportFrom: '', supportUntil: '', hoursPerWeek: 0, notes: ''
  });

  const handleAdd = () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    meDataAddProduct(formData.name, formData.supportFrom, formData.supportUntil, formData.hoursPerWeek, formData.notes, '');
    meReactSave();
    setFormData({ name: '', supportFrom: '', supportUntil: '', hoursPerWeek: 0, notes: '' });
    setShowAddForm(false);
    setTimeout(onRefresh, 100);
  };

  const handleUpdate = (field, value) => {
    if (editIdx !== null) {
      meDataUpdateProduct(editIdx, field, value);
      meReactSave();
      setTimeout(onRefresh, 100);
    }
  };

  const handleDelete = (idx) => {
    if (confirm('Delete this product?')) {
      meDataDeleteProduct(idx);
      meReactSave();
      setEditIdx(null);
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
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Product Support</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            + Add Product
          </button>
        </div>

        {showAddForm && (
          <div className="me-card" style={{ backgroundColor: '#f9fafb', marginBottom: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
                Add Product
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAddForm(false)} style={{ width: '100%', marginTop: '8px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="me-card">
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No products. Click "Add Product" to create one.
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
            Manage products and their support requirements
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product name"
              style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
            />
            <input
              type="number"
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseFloat(e.target.value) || 0 })}
              placeholder="Hours/week"
              style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '13px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{ width: '100%' }}>
            Add Product
          </button>
        </div>
      )}

      <div className="me-card">
        <div className="me-card-title">Products</div>
        <div className="me-tbl-wrap">
          <table className="me-tbl">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Support From</th>
                <th>Support Until</th>
                <th>Hours/Week</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product, idx) => (
                <tr key={idx} style={{ backgroundColor: editIdx === idx ? '#f0f9ff' : 'transparent' }}>
                  <td>
                    {editIdx === idx ? (
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '2px', width: '100%' }}
                      />
                    ) : (
                      escapeHtml(product.name || '')
                    )}
                  </td>
                  <td>{product.supportFrom || '—'}</td>
                  <td>{product.supportUntil || '—'}</td>
                  <td>{product.hoursPerWeek || 0}</td>
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
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
          Total: {data.length} products
        </div>
      </div>
    </div>
  );
};
