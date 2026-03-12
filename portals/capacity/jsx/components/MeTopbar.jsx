/* ============================================================
   MeTopbar.jsx — React Topbar with Vanilla Toggle
   ============================================================ */

const MeTopbar = ({ onToggleVersion, onBack }) => {
  return (
    <div className="me-topbar">
      <div className="me-topbar-left">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div>
          <div className="me-topbar-title">ME Load Capacity</div>
          <div className="me-topbar-sub">Manufacturing Engineering · Man-hours planning (React Version)</div>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={onToggleVersion}
        title="Switch to vanilla JS version"
        style={{ marginLeft: '8px' }}
      >
        ⟲ Switch to Vanilla
      </button>
    </div>
  );
};
