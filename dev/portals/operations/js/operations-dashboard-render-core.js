// ═══════════════════════════════════
// operations-dashboard-render-core.js — core dashboard rendering
// ═══════════════════════════════════

import { esc } from '../../../utils/js/helpers.js'
import {
	opsStatusTone
} from './operations-dashboard-metrics.js'

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

function opsRenderUnitKpis(metrics) {
	const unitMetrics = Array.isArray(metrics && metrics.operationsUnits) ? metrics.operationsUnits : [];
	const hasDepartmentMetrics = !!(metrics && metrics.me && metrics.pm && metrics.log);
	if (!hasDepartmentMetrics && unitMetrics.length === 0) {
		return '';
	}

	const meTone = !metrics.me.ready ? 'watch' : metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good';
	const pmTone = !metrics.pm.ready ? 'watch' : metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good';
	const logTone = !metrics.log.ready ? 'watch' : metrics.log.utilisation > 90 ? 'critical' : metrics.log.utilisation > 80 ? 'watch' : 'good';
	const areaCards = [
		opsMetricCard(
			'ME Utilisation',
			metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready',
			metrics.me.ready
				? `${Math.round(metrics.me.capacity)}h capacity / ${Math.round(metrics.me.demand)}h demand (${Math.round(metrics.me.headroom)}h headroom)`
				: 'Open Capacity once to initialize',
			meTone,
			'capacity::me'
		),
		opsMetricCard(
			'PM Utilisation',
			metrics.pm.ready ? `${metrics.pm.utilisation}%` : 'Not Ready',
			metrics.pm.ready
				? `${Math.round(metrics.pm.capacity)}h capacity / ${Math.round(metrics.pm.demand)}h demand (${Math.round(metrics.pm.headroom)}h headroom)`
				: 'Open Capacity once to initialize',
			pmTone,
			'capacity::projects'
		),
		opsMetricCard(
			'LOG Utilisation',
			metrics.log.ready ? `${metrics.log.utilisation}%` : 'Not Ready',
			metrics.log.ready
				? `${Math.round(metrics.log.capacity)}h capacity / ${Math.round(metrics.log.demand)}h demand (${Math.round(metrics.log.headroom)}h headroom)`
				: 'Open Capacity once to initialize',
			logTone,
			'capacity::logistics'
		)
	];

	const unitCards = unitMetrics.map(unit => {
		const tone = !unit.ready ? 'watch' : unit.utilisation > 100 ? 'critical' : unit.utilisation > 85 ? 'watch' : 'good';
		const statusLabel = !unit.ready ? 'Not Ready' : `${unit.utilisation}%`;
		const detailText = !unit.ready
			? 'Open Capacity once to initialize'
			: `${Math.round(unit.capacity)}h capacity / ${Math.round(unit.demand)}h demand (${Math.round(unit.headroom)}h headroom)`;
		return opsMetricCard(`${unit.workArea} Utilisation`, statusLabel, detailText, tone, 'capacity::production');
	}).join('');

	return `
		<section class="ops-section">
			<div class="ops-section-head">
				<h3>Operations Capacity by Area</h3>
				<span>ME, PM, Logistics, Unit 2, Unit 3, and Unit 6 utilisation and headroom</span>
			</div>
			<div class="ops-metrics-grid">
				${areaCards.join('')}
				${unitCards}
			</div>
		</section>`;
}

function opsRenderPeopleUnitPanels(unitMetrics) {
	if (!Array.isArray(unitMetrics) || unitMetrics.length === 0) {
		return '';
	}

	const panels = unitMetrics.map(unit => {
		const utilTone = !unit.ready
			? 'watch'
			: unit.utilisation > 90
				? 'critical'
				: unit.utilisation > 80
					? 'watch'
					: 'good';
		const headroomTone = !unit.ready
			? 'watch'
			: unit.headroom < 0
				? 'critical'
				: 'good';

		return `
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>${esc(unit.workArea)} Load</h3>
					<span>Capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
				${opsMetricCard(
					`${unit.workArea} Utilisation`,
					unit.ready ? `${unit.utilisation}%` : 'Not Ready',
					unit.ready ? `${unit.capacity}h capacity / ${unit.demand}h demand` : 'Open Capacity once to initialize',
					utilTone,
					'capacity::production'
				)}
				${opsMetricCard(
					`${unit.workArea} Headroom`,
					unit.ready ? `${unit.headroom}h` : 'Not Ready',
					'Current month available room',
					headroomTone,
					'capacity::production'
				)}
				</div>
			</section>`;
	});

	return panels.join('');
}

function opsBuildPulseRows(metrics) {
	const rows = [];

	rows.push({
		title: 'ME Capacity Check',
		detail: metrics.me.ready
			? `Current utilisation is ${metrics.me.utilisation}% with ${metrics.me.headroom}h headroom this month.`
			: 'ME capacity data has not been initialized yet. Open Capacity once to hydrate data.',
		tone: metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch',
		dest: 'capacity::me'
	});

	rows.push({
		title: 'PM Capacity Check',
		detail: metrics.pm.ready
			? `Current utilisation is ${metrics.pm.utilisation}% with ${metrics.pm.headroom}h headroom this month.`
			: 'PM capacity data has not been initialized yet. Open Capacity once to hydrate data.',
		tone: metrics.pm.ready ? (metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good') : 'watch',
		dest: 'capacity::projects'
	});

	rows.push({
		title: 'LOG Capacity Check',
		detail: metrics.log.ready
			? `Current utilisation is ${metrics.log.utilisation}% with ${metrics.log.headroom}h headroom this month.`
			: 'Logistics capacity data has not been initialized yet. Open Capacity once to hydrate data.',
		tone: metrics.log.ready ? (metrics.log.utilisation > 90 ? 'critical' : metrics.log.utilisation > 80 ? 'watch' : 'good') : 'watch',
		dest: 'capacity::logistics'
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
				<span>As of ${esc(metrics.reportingDateLabel)} · Updated ${metrics.generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
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
				<button class="btn btn-ghost" data-action="ops-quick-nav" data-dest="capacity" data-tab-scope="capacity" data-tab-key="me">Open ME Capacity</button>
				<button class="btn btn-ghost" data-action="ops-quick-nav" data-dest="capacity" data-tab-scope="capacity" data-tab-key="projects">Open PM Capacity</button>
				<button class="btn btn-ghost" data-action="ops-quick-nav" data-dest="production" data-tab-scope="production" data-tab-key="scheduling">Open Production Planner</button>
				<button class="btn btn-ghost" data-action="ops-quick-nav" data-dest="product-development" data-tab-scope="product-development" data-tab-key="npi">Open NPI Workspace</button>
				<button class="btn btn-ghost" data-action="ops-quick-nav" data-dest="feedback">Open Feedback & Bugs</button>
			</div>
		</section>`;
}

function opsRenderOverview(metrics) {
	const scoreTone = opsStatusTone(metrics.healthScore);
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
					<button class="btn btn-primary" data-action="ops-set-tab" data-tab="risk">View Risk Focus</button>
					<button class="btn btn-primary" data-action="ops-set-tab" data-tab="flow">Open Flow Lens</button>
				</div>
			</section>

			<section class="ops-metrics-grid">
				${opsMetricCard('Active Projects', String(metrics.projectsFlow.active), `${metrics.projectsFlow.archived} archived`, 'good', 'product-development')}
				${opsMetricCard('Gate Completion', `${metrics.gate.percentage}%`, `${metrics.gate.doneChecks}/${metrics.gate.totalChecks} checks done`, metrics.gate.percentage < 65 ? 'critical' : metrics.gate.percentage < 85 ? 'watch' : 'good', 'product-development')}
				${opsMetricCard('Overdue Actions', String(metrics.actions.overdue), `${metrics.actions.totalOpen} actions open`, actionTone, 'product-development')}
				${opsMetricCard('High RPN Causes', String(metrics.risk.highRpn), `${metrics.risk.highRisks} high-risk tracker items`, metrics.risk.highRpn > 0 ? 'critical' : 'good', 'product-development')}
				${opsMetricCard('Production Completion', `${metrics.production.completionRate}%`, `${metrics.production.completed}/${metrics.production.total} batches complete`, metrics.production.completionRate < 40 ? 'critical' : metrics.production.completionRate < 70 ? 'watch' : 'good', 'production')}
				${opsMetricCard('Active Batches', String(metrics.production.active), 'Live production work packets', metrics.production.active > 0 ? 'watch' : 'good', 'production')}
			</section>

			${opsRenderUnitKpis(metrics)}

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
					${opsMetricCard('Projects In Flight', String(metrics.projectsFlow.active), 'Current change pipelines', 'good')}
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
		<div class="ops-shell ops-shell-people">
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>ME Load</h3>
					<span>Manufacturing Engineering capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
				${opsMetricCard('ME Utilisation', metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready', metrics.me.ready ? `${metrics.me.capacity}h capacity / ${metrics.me.demand}h demand` : 'Open Capacity once to initialize', metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch', 'capacity::me')}
				${opsMetricCard('ME Headroom', metrics.me.ready ? `${metrics.me.headroom}h` : 'Not Ready', 'Current month available room', metrics.me.ready && metrics.me.headroom < 0 ? 'critical' : 'good', 'capacity::me')}
				</div>
			</section>
			
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>PM Load</h3>
					<span>Project Management capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
				${opsMetricCard('PM Utilisation', metrics.pm.ready ? `${metrics.pm.utilisation}%` : 'Not Ready', metrics.pm.ready ? `${metrics.pm.capacity}h capacity / ${metrics.pm.demand}h demand` : 'Open Capacity once to initialize', metrics.pm.ready ? (metrics.pm.utilisation > 90 ? 'critical' : metrics.pm.utilisation > 80 ? 'watch' : 'good') : 'watch', 'capacity::projects')}
				${opsMetricCard('PM Headroom', metrics.pm.ready ? `${metrics.pm.headroom}h` : 'Not Ready', 'Current month available room', metrics.pm.ready && metrics.pm.headroom < 0 ? 'critical' : 'good', 'capacity::projects')}
				</div>
			</section>

			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>LOG Load</h3>
					<span>Logistics capacity pressure and breathing room</span>
				</div>
				<div class="ops-metrics-grid">
				${opsMetricCard('LOG Utilisation', metrics.log.ready ? `${metrics.log.utilisation}%` : 'Not Ready', metrics.log.ready ? `${metrics.log.capacity}h capacity / ${metrics.log.demand}h demand` : 'Open Capacity once to initialize', metrics.log.ready ? (metrics.log.utilisation > 90 ? 'critical' : metrics.log.utilisation > 80 ? 'watch' : 'good') : 'watch', 'capacity::logistics')}
				${opsMetricCard('LOG Headroom', metrics.log.ready ? `${metrics.log.headroom}h` : 'Not Ready', 'Current month available room', metrics.log.ready && metrics.log.headroom < 0 ? 'critical' : 'good', 'capacity::logistics')}
				</div>
			</section>

			${opsRenderPeopleUnitPanels(metrics.operationsUnits)}
			
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
				<button class="btn btn-primary" data-action="ops-quick-nav" data-dest="action-centre">Resolve Overdue Actions (${metrics.actions.overdue})</button>
				<button class="btn btn-primary" data-action="ops-quick-nav" data-dest="product-development" data-tab-scope="product-development" data-tab-key="npi">Review High RPN (${metrics.risk.highRpn})</button>
				<button class="btn btn-primary" data-action="ops-quick-nav" data-dest="capacity" data-tab-scope="capacity" data-tab-key="me">Balance Capacity (${metrics.me.ready ? metrics.me.utilisation + '%' : 'Pending'})</button>
				</div>
			</section>
			${opsRenderPulseFeed(metrics)}
		</div>`;
}

export {
	opsMetricCard,
	opsRenderUnitKpis,
	opsRenderPeopleUnitPanels,
	opsBuildPulseRows,
	opsRenderPulseFeed,
	opsRenderRiskRadar,
	opsRenderQuickActions,
	opsRenderOverview,
	opsRenderFlowView,
	opsRenderRiskView,
	opsRenderPeopleView,
	opsRenderActionsView
}
