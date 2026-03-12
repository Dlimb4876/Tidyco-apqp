/* ============================================================
   MeCapacityApp.jsx — Root React Component
   Orchestrates all tabs and routing for ME Capacity
   ============================================================ */

const MeCapacityApp = () => {
  const [meTab, setMeTab] = React.useState('dashboard');
  const { data, isLoading } = useMeData();

  const handleTabChange = (tab) => {
    setMeTab(tab);
  };

  const handleToggleVersion = () => {
    window.renderMeCapacityVanilla();
  };

  const handleBack = () => {
    window.setCapacityTab('root');
  };

  if (isLoading) {
    return (
      <div className="me-shell">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px',
          color: '#666'
        }}>
          ⏳ Loading capacity data...
        </div>
      </div>
    );
  }

  return (
    <div className="me-shell">
      <MeTopbar
        onToggleVersion={handleToggleVersion}
        onBack={handleBack}
      />

      <MeNav
        activeTab={meTab}
        onTabChange={handleTabChange}
      />

      <div className="me-body">
        {meTab === 'dashboard' && <MeDashboard data={data} />}
        {meTab === 'team' && <MeTeam data={data.team} onSave={() => window.meReactSave()} />}
        {meTab === 'tasks' && <MeTasks data={data.tasks} onSave={() => window.meReactSave()} />}
        {meTab === 'products' && <MeProducts data={data.products} onSave={() => window.meReactSave()} />}
        {meTab === 'product-taskload' && <MeProductTaskload data={data} />}
        {meTab === 'holidays' && <MeHolidays data={data.holidays} onSave={() => window.meReactSave()} />}
        {meTab === 'chart' && <MeChart data={data} />}
        {meTab === 'heatmap' && <MeHeatmap data={data} />}
      </div>
    </div>
  );
};
