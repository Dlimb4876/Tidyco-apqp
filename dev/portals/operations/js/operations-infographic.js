// ═══════════════════════════════════
// operations-infographic.js — capacity infographic generator
// ═══════════════════════════════════

// ── Kept for test compatibility ──────────────────────────────────────────────

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

// ── Visual helpers ────────────────────────────────────────────────────────────

// SVG ring gauge — communicates utilisation as fill angle, not just a number
function opsInfographicRing(pct, label, ready, tone) {
	const r = 46;
	const circ = 2 * Math.PI * r;
	const filled = ready ? (Math.min(100, Math.max(0, pct)) / 100) * circ : 0;
	const stroke = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#c47d00' : '#1a9e6e';
	const track = tone === 'critical' ? '#f5d0d0' : tone === 'watch' ? '#fde8b0' : '#c8f0de';
	const center = ready ? pct + '%' : '\u2014';
	const sub = ready ? 'utilisation' : 'no data';

	return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
		<svg width="116" height="116" viewBox="0 0 116 116">
			<circle cx="58" cy="58" r="${r}" fill="none" stroke="${track}" stroke-width="10"/>
			<circle cx="58" cy="58" r="${r}" fill="none" stroke="${stroke}" stroke-width="10"
				stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"
				transform="rotate(-90 58 58)"/>
			<text x="58" y="54" text-anchor="middle" dominant-baseline="middle"
				font-size="20" font-weight="700" fill="#1a2634"
				font-family="IBM Plex Sans,system-ui,sans-serif">${center}</text>
			<text x="58" y="73" text-anchor="middle"
				font-size="9.5" fill="#6b7b8d"
				font-family="IBM Plex Sans,system-ui,sans-serif">${sub}</text>
		</svg>
		<div style="font-size:13px;font-weight:600;color:#1a2634;">${label}</div>
	</div>`;
}

// Large hero ring for the health score
function opsInfographicHeroRing(score) {
	const r = 76;
	const circ = 2 * Math.PI * r;
	const fill = (Math.min(100, Math.max(0, score)) / 100) * circ;

	return `<svg width="190" height="190" viewBox="0 0 190 190" style="flex-shrink:0;">
		<circle cx="95" cy="95" r="${r}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="14"/>
		<circle cx="95" cy="95" r="${r}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="14"
			stroke-dasharray="${fill.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"
			transform="rotate(-90 95 95)"/>
		<text x="95" y="88" text-anchor="middle"
			font-size="38" font-weight="700" fill="#fff"
			font-family="IBM Plex Sans,system-ui,sans-serif">${score}%</text>
		<text x="95" y="112" text-anchor="middle"
			font-size="12" fill="rgba(255,255,255,.75)"
			font-family="IBM Plex Sans,system-ui,sans-serif">System Health</text>
	</svg>`;
}

// Pipeline stage card — big number + label communicates magnitude at a glance
function opsInfographicPipelineStage(bigNumber, label, sub, tone) {
	const bg = tone === 'critical' ? '#fef2f2' : tone === 'watch' ? '#fffbeb' : '#f0fdf9';
	const border = tone === 'critical' ? '#fca5a5' : tone === 'watch' ? '#fcd34d' : '#6ee7b7';
	const numColor = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#c47d00' : '#1a9e6e';

	return `<div style="background:${bg};border:1.5px solid ${border};border-radius:14px;padding:16px 12px;text-align:center;min-width:0;">
		<div style="font-size:36px;font-weight:700;color:${numColor};line-height:1;">${bigNumber}</div>
		<div style="font-size:12px;font-weight:600;color:#1a2634;margin-top:5px;">${label}</div>
		<div style="font-size:10px;color:#6b7b8d;margin-top:3px;">${sub}</div>
	</div>`;
}

// Severity bar — count as big number + proportional fill shows relative weight
function opsInfographicSeverityBar(label, count, maxCount, tone) {
	const pct = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0;
	const fill = tone === 'critical' ? '#b2352f' : tone === 'watch' ? '#c47d00' : '#1a9e6e';
	const countColor = fill;

	return `<div style="margin-bottom:14px;">
		<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
			<span style="font-size:12px;color:#3a4a5a;">${label}</span>
			<span style="font-size:20px;font-weight:700;color:${countColor};">${count}</span>
		</div>
		<div style="background:#e8ecf0;border-radius:999px;height:8px;overflow:hidden;">
			<div style="width:${pct}%;height:100%;background:${fill};border-radius:999px;"></div>
		</div>
	</div>`;
}

// Gate step tracker — shows which gates (0–5) are done vs in-progress vs pending
function opsInfographicGateSteps(percentage) {
	const stepsDone = Math.round((percentage / 100) * 6);
	const steps = [0, 1, 2, 3, 4, 5].map((i) => {
		const done = i < stepsDone;
		const active = i === stepsDone && percentage < 100;
		const bg = done ? '#1a9e6e' : active ? '#c47d00' : '#e8ecf0';
		const color = done || active ? '#fff' : '#adb8c3';
		const inner = done ? '\u2713' : 'G' + i;
		const connector = i < 5
			? `<div style="flex:1;height:2px;background:#dde3ea;margin-bottom:16px;"></div>`
			: '';
		return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
				<div style="width:36px;height:36px;border-radius:50%;background:${bg};
					display:flex;align-items:center;justify-content:center;
					font-size:11px;font-weight:700;color:${color};">${inner}</div>
			</div>${connector}`;
	});

	return `<div style="display:flex;flex-direction:row;align-items:center;gap:0;justify-content:space-between;">
		${steps.join('')}
	</div>`;
}

// Unit cards — ring gauge per unit, headroom stat below (required by tests)
function opsInfographicUnitCards(operationsUnits) {
	if (!Array.isArray(operationsUnits) || operationsUnits.length === 0) return '';

	return operationsUnits.map((unit) => {
		const tone = opsInfographicTone(unit.utilisation, unit.ready);
		const headroomTone = !unit.ready ? 'watch' : unit.headroom < 0 ? 'critical' : 'good';
		const headroomColor = headroomTone === 'critical' ? '#b2352f' : headroomTone === 'watch' ? '#c47d00' : '#1a9e6e';
		const headroomValue = unit.ready ? unit.headroom + 'h' : 'No data';

		return `<div style="background:#fff;border:1px solid #dde3ea;border-radius:14px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px;">
			${opsInfographicRing(unit.utilisation, unit.workArea, unit.ready, tone)}
			<div style="width:100%;border-top:1px solid #edf0f4;padding-top:10px;text-align:center;">
				<div style="font-size:22px;font-weight:700;color:${headroomColor};">${headroomValue}</div>
				<div style="font-size:10px;color:#6b7b8d;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;">Headroom</div>
			</div>
		</div>`;
	}).join('');
}

// ── Main generator ────────────────────────────────────────────────────────────

async function opsGenerateInfographic() {
	const metrics = opsBuildMetrics();
	const now = new Date();
	const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
	const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

	const scoreTone = metrics.healthScore >= 85 ? 'good' : metrics.healthScore >= 65 ? 'watch' : 'critical';
	const headerGrad = scoreTone === 'critical'
		? 'linear-gradient(135deg,#2d0b0b 0%,#7f1d1d 60%,#991b1b 100%)'
		: scoreTone === 'watch'
			? 'linear-gradient(135deg,#1c1406 0%,#7a4a00 60%,#9a6700 100%)'
			: 'linear-gradient(135deg,#10293e 0%,#14607d 50%,#1a8f7a 100%)';

	let logoSrc = '';
	try {
		const resp = await fetch('./Tidyco logo-blue.png');
		const blob = await resp.blob();
		logoSrc = await new Promise(res => {
			const r = new FileReader();
			r.onloadend = () => res(r.result);
			r.readAsDataURL(blob);
		});
	} catch (_) { /* proceed without logo */ }

	const logoTag = logoSrc
		? `<img src="${logoSrc}" alt="Tidyco" style="height:40px;width:auto;object-fit:contain;filter:brightness(0) invert(1);opacity:.75;">`
		: `<span style="font-size:17px;font-weight:700;color:rgba(246,251,255,.85);">Tidyco</span>`;

	// Pre-compute display values to keep the HTML template readable
	const meTone = opsInfographicTone(metrics.me.utilisation, metrics.me.ready);
	const pmTone = opsInfographicTone(metrics.pm.utilisation, metrics.pm.ready);
	const logTone = opsInfographicTone(metrics.log.utilisation, metrics.log.ready);
	const gateTone = metrics.gate.percentage >= 85 ? 'good' : metrics.gate.percentage >= 65 ? 'watch' : 'critical';
	const gateColor = gateTone === 'critical' ? '#b2352f' : gateTone === 'watch' ? '#c47d00' : '#1a9e6e';
	const prodRate = metrics.production.completionRate;
	const prodTone = prodRate >= 70 ? 'good' : prodRate >= 40 ? 'watch' : 'critical';
	const prodBarColor = prodTone === 'critical' ? '#b2352f' : prodTone === 'watch' ? '#c47d00' : '#1a9e6e';

	const meDetail = metrics.me.ready
		? metrics.me.demand + 'h demand \u00b7 ' + metrics.me.capacity + 'h capacity \u00b7 ' + metrics.me.headroom + 'h headroom'
		: 'Open Capacity once to initialise';
	const pmDetail = metrics.pm.ready
		? metrics.pm.demand + 'h demand \u00b7 ' + metrics.pm.capacity + 'h capacity \u00b7 ' + metrics.pm.headroom + 'h headroom'
		: 'Open Capacity once to initialise';
	const logDetail = metrics.log.ready
		? metrics.log.demand + 'h demand \u00b7 ' + metrics.log.capacity + 'h capacity \u00b7 ' + metrics.log.headroom + 'h headroom'
		: 'Open Capacity once to initialise';

	const overdueColor = metrics.actions.overdue > 0 ? '#ffb3b3' : '#fff';
	const riskMaxRpn = Math.max(metrics.risk.highRpn, 5);
	const riskMaxOverdue = Math.max(metrics.actions.overdue, 5);
	const riskMaxTrackers = Math.max(metrics.risk.highRisks, 5);
	const riskAlertBg = metrics.actions.overdue > 0 || metrics.risk.highRpn > 0 ? '#fef2f2' : '#f0fdf9';
	const riskAlertColor = metrics.actions.overdue > 0 || metrics.risk.highRpn > 0 ? '#b2352f' : '#1a9e6e';
	const riskAlertText = metrics.actions.overdue > 0 || metrics.risk.highRpn > 0
		? (metrics.actions.overdue + metrics.risk.highRpn) + ' items need attention'
		: 'No critical risk items';

	const unitRings = Array.isArray(metrics.operationsUnits)
		? metrics.operationsUnits.map(u =>
			opsInfographicRing(u.utilisation, u.workArea, u.ready, opsInfographicTone(u.utilisation, u.ready))
		).join('')
		: '';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Capacity Infographic \u2014 ${dateStr}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'IBM Plex Sans',system-ui,sans-serif; background:#f0f4f8; color:#1a2634; }
  .page { max-width:900px; margin:0 auto; padding:28px 20px 40px; }
  .print-btn { position:fixed; top:16px; right:16px; background:#0f2f4d; color:#fff; border:none;
    border-radius:8px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer;
    z-index:100; box-shadow:0 2px 8px rgba(0,0,0,.18); }
  .print-btn:hover { background:#1a4a6b; }
  @media print { .print-btn { display:none; } body { background:#fff; } .page { padding:12px; } }
  .card { background:#fff; border:1px solid #dde3ea; border-radius:16px; padding:20px; margin-bottom:16px; }
  .card-title { font-size:15px; font-weight:700; color:#1a2634; margin-bottom:4px; }
  .card-sub { font-size:12px; color:#6b7b8d; margin-bottom:16px; }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="page">

  <!-- HERO: health score as SVG ring + key headline stats -->
  <div style="background:${headerGrad};border-radius:18px;padding:28px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;">
    <div style="flex:1;min-width:0;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:rgba(246,251,255,.6);margin-bottom:8px;">Tidyco Operations \u00b7 Mission Control</div>
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">Capacity Infographic</div>
      <div style="font-size:12px;color:rgba(246,251,255,.65);margin-bottom:24px;">Generated ${dateStr} at ${timeStr}</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div>
          <div style="font-size:30px;font-weight:700;color:#fff;">${metrics.projectsFlow.active}</div>
          <div style="font-size:10px;color:rgba(246,251,255,.6);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;">Active Projects</div>
        </div>
        <div>
          <div style="font-size:30px;font-weight:700;color:${overdueColor};">${metrics.actions.overdue}</div>
          <div style="font-size:10px;color:rgba(246,251,255,.6);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;">Overdue Actions</div>
        </div>
        <div>
          <div style="font-size:30px;font-weight:700;color:#fff;">${metrics.gate.percentage}%</div>
          <div style="font-size:10px;color:rgba(246,251,255,.6);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;">Gate Completion</div>
        </div>
      </div>
      <div style="margin-top:22px;">${logoTag}</div>
    </div>
    ${opsInfographicHeroRing(metrics.healthScore)}
  </div>

  <!-- CAPACITY RINGS: ring gauges encode utilisation as fill angle -->
  <div class="card">
    <div class="card-title">Capacity Pressure</div>
    <div class="card-sub">Live utilisation across engineering and operations teams</div>
    <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:space-around;align-items:flex-start;">
      ${opsInfographicRing(metrics.me.utilisation, 'ME Engineering', metrics.me.ready, meTone)}
      ${opsInfographicRing(metrics.pm.utilisation, 'Project Mgmt', metrics.pm.ready, pmTone)}
      ${opsInfographicRing(metrics.log.utilisation, 'Logistics', metrics.log.ready, logTone)}
      ${unitRings}
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #edf0f4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
      <div style="font-size:11px;color:#6b7b8d;"><strong style="color:#1a2634;">ME:</strong> ${meDetail}</div>
      <div style="font-size:11px;color:#6b7b8d;"><strong style="color:#1a2634;">PM:</strong> ${pmDetail}</div>
      <div style="font-size:11px;color:#6b7b8d;"><strong style="color:#1a2634;">LOG:</strong> ${logDetail}</div>
    </div>
  </div>

  <!-- PRODUCTION PIPELINE: flow from open to complete with proportional completion bar -->
  <div class="card">
    <div class="card-title">Production Pipeline</div>
    <div class="card-sub">Work packet flow \u2014 open to complete</div>
    <div style="display:grid;grid-template-columns:1fr 20px 1fr 20px 1fr;align-items:center;gap:6px;">
      ${opsInfographicPipelineStage(metrics.production.total, 'Total Batches', 'all tracked', 'good')}
      <div style="text-align:center;color:#adb8c3;font-size:22px;">\u203a</div>
      ${opsInfographicPipelineStage(metrics.production.active, 'In Progress', 'active now', metrics.production.active > 0 ? 'watch' : 'good')}
      <div style="text-align:center;color:#adb8c3;font-size:22px;">\u203a</div>
      ${opsInfographicPipelineStage(metrics.production.completed, 'Completed', prodRate + '% closure rate', prodTone)}
    </div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #edf0f4;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7b8d;margin-bottom:5px;">
        <span>Completion Rate</span>
        <span style="font-weight:600;color:${prodBarColor};">${prodRate}%</span>
      </div>
      <div style="background:#e8ecf0;border-radius:999px;height:10px;overflow:hidden;">
        <div style="width:${prodRate}%;height:100%;background:${prodBarColor};border-radius:999px;"></div>
      </div>
    </div>
  </div>

  <!-- RISK + GATE: side by side — severity bars show relative weight; gate steps show progress visually -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

    <div class="card" style="margin-bottom:0;">
      <div class="card-title">Risk Pressure</div>
      <div class="card-sub">Quality and delivery threat levels</div>
      ${opsInfographicSeverityBar('High RPN Causes', metrics.risk.highRpn, riskMaxRpn, metrics.risk.highRpn > 0 ? 'critical' : 'good')}
      ${opsInfographicSeverityBar('Overdue Actions', metrics.actions.overdue, riskMaxOverdue, metrics.actions.overdue > 0 ? 'critical' : 'good')}
      ${opsInfographicSeverityBar('High-Risk Trackers', metrics.risk.highRisks, riskMaxTrackers, metrics.risk.highRisks > 0 ? 'watch' : 'good')}
      <div style="margin-top:8px;padding:10px;background:${riskAlertBg};border-radius:10px;text-align:center;">
        <div style="font-size:11px;font-weight:600;color:${riskAlertColor};">${riskAlertText}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:0;">
      <div class="card-title">Gate Progress</div>
      <div class="card-sub">${metrics.gate.doneChecks} of ${metrics.gate.totalChecks} checks complete across NPI gates</div>
      ${opsInfographicGateSteps(metrics.gate.percentage)}
      <div style="margin-top:16px;text-align:center;">
        <div style="font-size:38px;font-weight:700;color:${gateColor};">${metrics.gate.percentage}%</div>
        <div style="font-size:11px;color:#6b7b8d;text-transform:uppercase;letter-spacing:.08em;">Overall Gate Completion</div>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="text-align:center;font-size:11px;color:#9aabb8;margin-top:4px;">
    Tidyco APQP \u00b7 Operations Mission Control \u00b7 ${dateStr}
  </div>

</div>
</body>
</html>`;

	const win = window.open('', '_blank', 'width=960,height=800,scrollbars=yes');
	if (!win) {
		alert('Pop-up blocked. Please allow pop-ups for this page and try again.');
		return;
	}
	win.document.write(html);
	win.document.close();
}

window.opsGenerateInfographic = opsGenerateInfographic;
