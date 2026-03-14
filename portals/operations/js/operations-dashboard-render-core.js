// ═══════════════════════════════════
// operations-dashboard-render-core.js — core dashboard rendering
// ═══════════════════════════════════

function opsMetricCard(label, value, detail, tone = 'good', dest = '') {
	const actionAttrs = dest
		? ` data-action="metric-navigate" data-dest="${esc(dest)}" role="button" tabindex="0"`
		: '';
	return `
		<article class="ops-metric ops-tone-${tone}"${actionAttrs}>
			<div class="ops-metric-label">${esc(label)}</div>
			<div class="ops-metric-value">${esc(value)}</div>
			<div class="ops-metric-detail">${esc(detail)}</div>
		</article>`;
}

function opsBuildPulseRows(metrics) {
	const rows = [];

	rows.push({
		title: 'ME Capacity Check',
		detail: metrics.me.ready
			? `Current utilisation is ${metrics.me.utilisation}% with ${metrics.me.headroom}h headroom this month.`
			: 'ME capacity data has not been initialized yet. Open Capacity once to hydrate data.',
		tone: metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch',
		dest: 'capacity'
	});

	rows.push({
		title: 'PM Capacity Check',
		detail: metrics.pm.ready
			? `Current utilisation is ${metrics.pm.utilisation}% with ${metrics.pm.headroom}h headroom this month.`
			: 'PM capacity data has not been initialized yet. Open Capacity once to hydrate data.',
		tone: metrics.pm.ready ? (metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good') : 'watch',
		dest: 'capacity'
	});

	rows.push({
		title: 'Delivery Confidence',
		detail: `${metrics.actions.overdue} overdue actions and ${metrics.risk.highRpn} high-RPN causes currently need attention.`,
		tone: metrics.actions.overdue > 0 || metrics.risk.highRpn > 0 ? 'critical' : 'good',
		dest: 'product-development'
	});

	rows.push({
		title: 'Production Flow',
		detail: `${metrics.production.active} active batches, ${metrics.production.completed} completed, ${metrics.production.total} total tracked.`,
		tone: metrics.production.active > metrics.production.completed ? 'watch' : 'good',
		dest: 'production'
	});

	return rows;
}

function opsRenderPulseFeed(metrics) {
	const rows = opsBuildPulseRows(metrics);
	return `
		<section class="ops-panel">
			<div class="ops-panel-head">
				<h3>Live Pulse Feed</h3>
				<span>Updated ${metrics.generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
			</div>
			<div class="ops-feed-list">
				${rows.map(row => `
					<button class="ops-feed-row ops-tone-${row.tone}" data-action="pulse-navigate" data-dest="${row.dest}">
						<div class="ops-feed-title">${esc(row.title)}</div>
						<div class="ops-feed-detail">${esc(row.detail)}</div>
					</button>
				`).join('')}
			</div>
		</section>`;
}

function opsRenderRiskRadar(metrics) {
	const rpnPct = Math.min(100, metrics.risk.highRpn * 4);
	const overduePct = Math.min(100, metrics.actions.overdue * 12);

	return `
		<section class="ops-panel">
			<div class="ops-panel-head">
				<h3>Risk Radar</h3>
				<span>Heat map of pressure points</span>
			</div>

			<div class="ops-radar-row">
				<div class="ops-radar-label">High RPN Pressure</div>
				<div class="ops-radar-bar"><span style="width:${rpnPct}%"></span></div>
				<div class="ops-radar-value">${metrics.risk.highRpn}</div>
			</div>

			<div class="ops-radar-row">
				<div class="ops-radar-label">Overdue Actions</div>
				<div class="ops-radar-bar"><span style="width:${overduePct}%"></span></div>
				<div class="ops-radar-value">${metrics.actions.overdue}</div>
			</div>
		</section>`;
}

function opsRenderQuickActions() {
	return `
		<section class="ops-panel">
			<div class="ops-panel-head">
				<h3>Rapid Actions</h3>
				<span>Jump directly to response screens</span>
			</div>
			<div class="ops-actions-grid">
				<button class="btn btn-ghost" onclick="navigate('capacity')">Open Capacity Board</button>
				<button class="btn btn-ghost" onclick="navigate('production')">Open Production Planner</button>
				<button class="btn btn-ghost" onclick="navigate('product-development')">Open NPI Workspace</button>
				<button class="btn btn-ghost" onclick="navigate('bugreports')">Open Bug Response</button>
			</div>
		</section>`;
}

function opsRenderOverview(metrics) {
	const scoreTone = opsStatusTone(metrics.healthScore);
	const meTone = metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch';
	const pmTone = metrics.pm.ready ? (metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good') : 'watch';
	const actionTone = metrics.actions.overdue > 0 ? 'critical' : 'good';

	return `
		<div class="ops-shell">
			<section class="ops-hero ops-tone-${scoreTone}">
				<div class="ops-hero-copy">
					<div class="ops-kicker">Operations Mission Control</div>
					<h2>System Health ${metrics.healthScore}%</h2>
					<p>One screen for delivery confidence, team pressure, production flow, and quality stability.</p>
				</div>
				<div class="ops-hero-actions">
					<button class="btn btn-primary" onclick="setOperationsTab('risk')">View Risk Focus</button>
					<button class="btn btn-primary" onclick="setOperationsTab('flow')">Open Flow Lens</button>
				</div>
			</section>

			<section class="ops-metrics-grid">
				${opsMetricCard('Active Programmes', String(metrics.programmesFlow.active), `${metrics.programmesFlow.archived} archived`, 'good', 'product-development')}
				${opsMetricCard('Gate Completion', `${metrics.gate.percentage}%`, `${metrics.gate.doneChecks}/${metrics.gate.totalChecks} checks done`, metrics.gate.percentage < 65 ? 'critical' : metrics.gate.percentage < 85 ? 'watch' : 'good', 'product-development')}
				${opsMetricCard('ME Utilisation', metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready', metrics.me.ready ? `${metrics.me.headroom}h headroom this month` : 'Open Capacity once to initialize', meTone, 'capacity')}
				${opsMetricCard('PM Utilisation', metrics.pm.ready ? `${metrics.pm.utilisation}%` : 'Not Ready', metrics.pm.ready ? `${metrics.pm.headroom}h headroom this month` : 'Open Capacity once to initialize', pmTone, 'capacity')}
				${opsMetricCard('Overdue Actions', String(metrics.actions.overdue), `${metrics.actions.totalOpen} actions open`, actionTone, 'product-development')}
				${opsMetricCard('High RPN Causes', String(metrics.risk.highRpn), `${metrics.risk.highRisks} high-risk tracker items`, metrics.risk.highRpn > 0 ? 'critical' : 'good', 'product-development')}
				${opsMetricCard('Production Completion', `${metrics.production.completionRate}%`, `${metrics.production.completed}/${metrics.production.total} batches complete`, metrics.production.completionRate < 40 ? 'critical' : metrics.production.completionRate < 70 ? 'watch' : 'good', 'production')}
				${opsMetricCard('Active Batches', String(metrics.production.active), 'Live production work packets', metrics.production.active > 0 ? 'watch' : 'good', 'production')}
			</section>

			<section class="ops-columns">
				${opsRenderPulseFeed(metrics)}
				${opsRenderRiskRadar(metrics)}
			</section>

			${opsRenderQuickActions()}
		</div>`;
}

function opsRenderFlowView(metrics) {
	return `
		<div class="ops-shell">
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>Flow Lens</h3>
					<span>From demand to dispatch</span>
				</div>
				<div class="ops-flow-grid">
					${opsMetricCard('Programmes In Flight', String(metrics.programmesFlow.active), 'Current change pipelines', 'good')}
					${opsMetricCard('Production Active', String(metrics.production.active), 'Batches currently moving', metrics.production.active > 0 ? 'watch' : 'good')}
					${opsMetricCard('Completion Rate', `${metrics.production.completionRate}%`, 'Overall production closure signal', metrics.production.completionRate >= 70 ? 'good' : 'watch')}
				</div>
			</section>
			${opsRenderQuickActions()}
		</div>`;
}

function opsRenderRiskView(metrics) {
	return `
		<div class="ops-shell">
			${opsRenderRiskRadar(metrics)}
			<section class="ops-metrics-grid">
				${opsMetricCard('Overdue Actions', String(metrics.actions.overdue), `${metrics.actions.totalOpen} open actions`, metrics.actions.overdue > 0 ? 'critical' : 'good')}
				${opsMetricCard('High RPN Causes', String(metrics.risk.highRpn), 'PFMEA risk pressure points', metrics.risk.highRpn > 0 ? 'critical' : 'good')}
			</section>
			${opsRenderPulseFeed(metrics)}
		</div>`;
}

function opsRenderPeopleView(metrics) {
	return `
		<div class="ops-shell">
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>ME Load</h3>
					<span>Manufacturing Engineering capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
					${opsMetricCard('ME Utilisation', metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready', metrics.me.ready ? `${metrics.me.capacity}h capacity / ${metrics.me.demand}h demand` : 'Open Capacity once to initialize', metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch')}
					${opsMetricCard('ME Headroom', metrics.me.ready ? `${metrics.me.headroom}h` : 'Not Ready', 'Current month available room', metrics.me.ready && metrics.me.headroom < 0 ? 'critical' : 'good')}
				</div>
			</section>
			
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>PM Load</h3>
					<span>Project Management capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
					${opsMetricCard('PM Utilisation', metrics.pm.ready ? `${metrics.pm.utilisation}%` : 'Not Ready', metrics.pm.ready ? `${metrics.pm.capacity}h capacity / ${metrics.pm.demand}h demand` : 'Open Capacity once to initialize', metrics.pm.ready ? (metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good') : 'watch')}
					${opsMetricCard('PM Headroom', metrics.pm.ready ? `${metrics.pm.headroom}h` : 'Not Ready', 'Current month available room', metrics.pm.ready && metrics.pm.headroom < 0 ? 'critical' : 'good')}
				</div>
			</section>
			
			${opsRenderQuickActions()}
		</div>`;
}

function opsRenderActionsView(metrics) {
	return `
		<div class="ops-shell">
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>Action Center</h3>
					<span>What needs intervention right now</span>
				</div>
				<div class="ops-actions-grid">
					<button class="btn btn-primary" onclick="navigate('product-development')">Resolve Overdue Actions (${metrics.actions.overdue})</button>
					<button class="btn btn-primary" onclick="navigate('product-development')">Review High RPN (${metrics.risk.highRpn})</button>
					<button class="btn btn-primary" onclick="navigate('capacity')">Balance Capacity (${metrics.me.ready ? metrics.me.utilisation + '%' : 'Pending'})</button>
				</div>
			</section>
			${opsRenderPulseFeed(metrics)}
		</div>`;
}
