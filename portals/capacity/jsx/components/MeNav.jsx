/* ============================================================
   MeNav.jsx — Tab Navigation
   ============================================================ */

const MeNav = ({ activeTab, onTabChange, hideNavOnEstimation }) => {
  const tabs = [
    { id: 'dashboard', label: '📈 Dashboard' },
    { id: 'chart', label: '📊 Capacity Chart' },
    { id: 'heatmap', label: '🔥 Heat Map' },
    { id: 'team', label: '👷 Team' },
    { id: 'tasks', label: '📋 Tasks' },
    { id: 'products', label: '🚂 Product Support' },
    { id: 'product-taskload', label: '📦 Product Load' },
    { id: 'holidays', label: '🏖️ Holiday Planner' }
  ];

  return (
    <div className="me-nav" style={hideNavOnEstimation ? { display: 'none' } : {}}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`me-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
