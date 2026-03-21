// ═══════════════════════════════════
// operations-infographic.js — capacity infographic generator
// ═══════════════════════════════════

function opsInfographicBar(pct, tone) {
	const capped = Math.min(100, Math.max(0, pct));
	const color = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#b67700' : '#1f8f65';
	return `<div style="background:#e8ecf0;border-radius:999px;height:10px;width:100%;overflow:hidden;">
		<div style="width:${capped}%;height:100%;background:${color};border-radius:999px;transition:width .3s;"></div>
	</div>`;
}

function opsInfographicTone(utilisation, ready) {
	if (!ready) return 'watch';
	if (utilisation > 90) return 'critical';
	if (utilisation > 80) return 'watch';
	return 'good';
}

function opsInfographicCapacityRow(label, data) {
	const tone = opsInfographicTone(data.utilisation, data.ready);
	const color = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#b67700' : '#1f8f65';
	const value = data.ready ? `${data.utilisation}%` : 'No data';
	const detail = data.ready
		? `${data.demand}h demand · ${data.capacity}h capacity · ${data.headroom}h headroom`
		: 'Open Capacity once to initialise';

	return `
		<div style="display:grid;grid-template-columns:130px 1fr 60px;align-items:center;gap:10px;margin-bottom:12px;">
			<div style="font-size:13px;font-weight:600;color:#1a2634;">${label}</div>
			<div>
				${opsInfographicBar(data.utilisation, tone)}
				<div style="font-size:11px;color:#6b7b8d;margin-top:3px;">${detail}</div>
			</div>
			<div style="font-size:18px;font-weight:700;color:${color};text-align:right;">${value}</div>
		</div>`;
}

function opsInfographicUnitCards(operationsUnits) {
  if (!Array.isArray(operationsUnits) || operationsUnits.length === 0) return '';

  return operationsUnits.map((unit) => {
    return `
      <div class="unit-card">
        <h3>${unit.workArea}</h3>
        ${opsInfographicCapacityRow('Utilisation', unit)}
        <div style="margin-top:8px;">
          ${opsInfographicStatBox('Headroom', unit.ready ? `${unit.headroom}h` : 'No data', !unit.ready ? 'watch' : unit.headroom < 0 ? 'critical' : 'good')}
        </div>
      </div>`;
  }).join('');
}

function opsInfographicStatBox(label, value, tone) {
	const bg = tone === 'critical' ? '#fef2f2' : tone === 'watch' ? '#fffbeb' : '#f0fdf4';
	const border = tone === 'critical' ? '#fca5a5' : tone === 'watch' ? '#fcd34d' : '#86efac';
	const valueColor = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#b67700' : '#1f8f65';
	return `
		<div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:12px 14px;text-align:center;">
			<div style="font-size:24px;font-weight:700;color:${valueColor};line-height:1.1;">${value}</div>
			<div style="font-size:11px;color:#6b7b8d;margin-top:4px;text-transform:uppercase;letter-spacing:.06em;">${label}</div>
		</div>`;
}

function opsGenerateInfographic() {
	const metrics = opsBuildMetrics();
	const now = new Date();
	const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
	const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

	const scoreTone = metrics.healthScore >= 85 ? 'good' : metrics.healthScore >= 65 ? 'watch' : 'critical';
	const scoreColor = scoreTone === 'critical' ? '#b2352f' : scoreTone === 'watch' ? '#b67700' : '#1f8f65';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Capacity Infographic — ${dateStr}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f4f7fb; color: #1a2634; }
  .page { max-width: 860px; margin: 0 auto; padding: 32px 24px; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #0f2f4d; color: #fff; border: none;
    border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
  .print-btn:hover { background: #1a4a6b; }
  @media print { .print-btn { display: none; } body { background: #fff; } .page { padding: 16px; } }
  h2 { font-size: 20px; font-weight: 700; color: #1a2634; margin-bottom: 4px; }
  h3 { font-size: 15px; font-weight: 700; color: #1a2634; margin-bottom: 12px; }
  .card { background: #fff; border: 1px solid #dde3ea; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .unit-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
  .unit-card { background: #fff; border: 1px solid #dde3ea; border-radius: 14px; padding: 18px; }
  @media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px) { .unit-grid { grid-template-columns:repeat(1,1fr); } }
  .divider { border: none; border-top: 1px solid #dde3ea; margin: 12px 0; }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="page">

  <!-- Header -->
  <div class="card" style="background:linear-gradient(135deg,#10293e 0%,#14607d 50%,#1a8f7a 100%);color:#f7fbff;border:none;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(246,251,255,.7);margin-bottom:6px;">Tidyco Operations</div>
    <h2 style="color:#f7fbff;font-size:22px;">Capacity Infographic</h2>
    <div style="font-size:13px;color:rgba(246,251,255,.8);margin-top:4px;">Generated ${dateStr} at ${timeStr}</div>
    <div style="margin-top:14px;font-size:32px;font-weight:700;color:${scoreColor};">
      ${metrics.healthScore}% <span style="font-size:16px;font-weight:400;color:rgba(246,251,255,.8);">System Health</span>
    </div>
  </div>

  <!-- Summary stats -->
  <div class="stats-grid">
    ${opsInfographicStatBox('Active Projects', metrics.projectsFlow.active, 'good')}
    ${opsInfographicStatBox('Overdue Actions', metrics.actions.overdue, metrics.actions.overdue > 0 ? 'critical' : 'good')}
    ${opsInfographicStatBox('High RPN Causes', metrics.risk.highRpn, metrics.risk.highRpn > 0 ? 'critical' : 'good')}
    ${opsInfographicStatBox('Gate Completion', `${metrics.gate.percentage}%`, metrics.gate.percentage < 65 ? 'critical' : metrics.gate.percentage < 85 ? 'watch' : 'good')}
  </div>

  <!-- ME & PM Capacity -->
  <div class="card">
    <h3>Engineering Capacity</h3>
    ${opsInfographicCapacityRow('ME (Mfg Eng)', metrics.me)}
    ${opsInfographicCapacityRow('PM (Project Mgmt)', metrics.pm)}
  </div>

  <!-- Operations Units -->
  <div class="card">
    <h3>Operations Units — Current Month</h3>
    <div class="unit-grid">
      ${opsInfographicUnitCards(metrics.operationsUnits)}
    </div>
  </div>

  <!-- Production Flow -->
  <div class="card">
    <h3>Production Flow</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
      <div>
        <div style="font-size:28px;font-weight:700;color:#1a2634;">${metrics.production.total}</div>
        <div style="font-size:11px;color:#6b7b8d;text-transform:uppercase;letter-spacing:.06em;">Total Batches</div>
      </div>
      <div>
        <div style="font-size:28px;font-weight:700;color:#b67700;">${metrics.production.active}</div>
        <div style="font-size:11px;color:#6b7b8d;text-transform:uppercase;letter-spacing:.06em;">Active</div>
      </div>
      <div>
        <div style="font-size:28px;font-weight:700;color:#1f8f65;">${metrics.production.completed}</div>
        <div style="font-size:11px;color:#6b7b8d;text-transform:uppercase;letter-spacing:.06em;">Completed</div>
      </div>
    </div>
    <hr class="divider">
    <div style="margin-top:4px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7b8d;margin-bottom:4px;">
        <span>Completion rate</span><span>${metrics.production.completionRate}%</span>
      </div>
      ${opsInfographicBar(metrics.production.completionRate, metrics.production.completionRate < 40 ? 'critical' : metrics.production.completionRate < 70 ? 'watch' : 'good')}
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:11px;color:#9aabb8;margin-top:8px;">
    Tidyco APQP · Operations Mission Control · ${dateStr}
  </div>

</div>
</body>
</html>`;

	const win = window.open('', '_blank', 'width=920,height=740,scrollbars=yes');
	if (!win) {
		alert('Pop-up blocked. Please allow pop-ups for this page and try again.');
		return;
	}
	win.document.write(html);
	win.document.close();
}

window.opsGenerateInfographic = opsGenerateInfographic;
