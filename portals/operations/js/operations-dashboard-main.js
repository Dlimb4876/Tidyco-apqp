// ═══════════════════════════════════
// operations-dashboard-main.js — entrypoint and exports
// ═══════════════════════════════════

function setOperationsTab(tab) {
	const prevTab = operationsTab;
	operationsTab = tab || 'overview';

	const parts = [];
	if (progId) parts.push('p=' + encodeURIComponent(progId));
	parts.push('s=operations');
	if (operationsTab !== 'overview') parts.push('od=' + encodeURIComponent(operationsTab));

	const hash = '#' + parts.join('&');
	if (typeof writeNavigationHistory === 'function') {
		writeNavigationHistory(hash, { push: prevTab !== operationsTab });
	} else {
		history.replaceState(null, '', hash);
	}
	render();
}

function setupOpsPulseFeed() {
	const container = document.getElementById('ops-dashboard');
	if (!container || opsPulseFeedContainer === container) return;
	opsPulseFeedContainer = container;

	container.addEventListener('click', (event) => {
		const el = event.target.closest('[data-action]');
		if (!el || !container.contains(el)) return;

		const action = el.dataset.action;
		if (action === 'ops-set-tab') {
			setOperationsTab(el.dataset.tab || 'overview');
			return;
		}
		if (action === 'ops-reset-reporting-date') {
			opsResetReportingDate();
			return;
		}
		if (action === 'ops-nav-hub') {
			navigate('hub');
			return;
		}
		if (action === 'ops-generate-infographic') {
			opsGenerateInfographic();
			return;
		}
		if (action === 'ops-show-guide') {
			showGuide('operations');
			return;
		}
		if (action === 'pulse-navigate' || action === 'metric-navigate') {
			const dest = el.dataset.dest;
			if (dest) navigate(dest);
		}
	});

	container.addEventListener('change', (event) => {
		const el = event.target.closest('[data-action]');
		if (!el || !container.contains(el)) return;

		if (el.dataset.action === 'ops-set-reporting-date') {
			opsSetReportingDateAndRefresh(el.value);
		}
	});

	// Flush any deferred re-renders when user leaves an inline table cell
	container.addEventListener('focusout', function(evt) {
		const nextFocus = evt.relatedTarget;
		if (nextFocus && nextFocus.closest('table')) return;
		if (!opsPendingRealTimeUpdate) return;
		setTimeout(function() {
			if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) return;
			if (opsPendingRealTimeUpdate) {
				opsPendingRealTimeUpdate = false;
				if (typeof opsRefreshCurrentTab === 'function') opsRefreshCurrentTab();
				else render();
			}
		}, 0);
	});
}

function renderOperationsDashboard() {
	opsRealtimeInit();

	const tab = operationsTab || 'overview';
	const metrics = opsBuildMetrics();

	let body = '';
	if (tab === 'flow') body = opsRenderFlowView(metrics);
	else if (tab === 'risk') body = opsRenderRiskView(metrics);
	else if (tab === 'people') body = opsRenderPeopleView(metrics);
	else if (tab === 'actions') body = opsRenderActionsView(metrics);
	else if (tab === 'forecast') body = opsRenderForecastView(metrics);
	else body = opsRenderOverview(metrics);

	setTimeout(() => {
		setupOpsPulseFeed();
		if (tab === 'forecast' && currentSection === 'operations' && (operationsTab || 'overview') === 'forecast') {
			opsRenderForecastChart(metrics.forecast);
		}
	}, 0);

	return `
		<div class="proj-home ops-home" id="ops-dashboard">
			<div class="proj-home-header ops-headline">
				<div>
					<div class="proj-home-title">Operations Mission Control</div>
					<div class="proj-home-sub">Command surface with live operational signals as of ${esc(metrics.reportingDateLabel)}</div>
				</div>
				<div class="ops-headline-actions">
					<div class="ops-reporting-date">
						<label for="opsReportingDate">Reporting Date</label>
						<div class="ops-reporting-date-controls">
							<input id="opsReportingDate" type="date" value="${esc(metrics.reportingDateIso)}" data-action="ops-set-reporting-date" />
							<button class="btn btn-ghost btn-sm" data-action="ops-reset-reporting-date">Today</button>
						</div>
					</div>
					<button class="btn btn-ghost btn-sm" data-action="ops-nav-hub">← Back to Portal</button>
					<button class="btn btn-ghost btn-sm" data-action="ops-generate-infographic" title="Generate capacity infographic">📊 Infographic</button>
					<button class="btn btn-ghost btn-sm" data-action="ops-show-guide" title="User Guide">❓ Guide</button>
				</div>
			</div>

			<nav class="ops-tabs" aria-label="Operations dashboard views">
				<button class="ops-tab ${tab === 'overview' ? 'active' : ''}" data-action="ops-set-tab" data-tab="overview">Overview</button>
				<button class="ops-tab ${tab === 'flow' ? 'active' : ''}" data-action="ops-set-tab" data-tab="flow">Flow</button>
				<button class="ops-tab ${tab === 'risk' ? 'active' : ''}" data-action="ops-set-tab" data-tab="risk">Risk</button>
				<button class="ops-tab ${tab === 'people' ? 'active' : ''}" data-action="ops-set-tab" data-tab="people">People</button>
				<button class="ops-tab ${tab === 'actions' ? 'active' : ''}" data-action="ops-set-tab" data-tab="actions">Actions</button>
				<button class="ops-tab ${tab === 'forecast' ? 'active' : ''}" data-action="ops-set-tab" data-tab="forecast">Forecast</button>
			</nav>

			${body}
		</div>`;
}

function opsSetReportingDateAndRefresh(rawIso) {
	if (typeof opsSetReportingDate === 'function') opsSetReportingDate(rawIso);
	render();
}

function opsResetReportingDate() {
	if (typeof opsSetReportingDate === 'function') opsSetReportingDate('');
	render();
}

window.renderOperationsDashboard = renderOperationsDashboard;
window.setOperationsTab = setOperationsTab;
window.opsBuildMetrics = opsBuildMetrics;
window.opsRealtimeInit = opsRealtimeInit;
window.opsRealtimeCleanup = opsRealtimeCleanup;
window.opsForecastSubmit = opsForecastSubmit;
window.opsForecastDelete = opsForecastDelete;
window.opsForecastSetStatus = opsForecastSetStatus;
window.opsForecastStartEdit = opsForecastStartEdit;
window.opsForecastCancelEdit = opsForecastCancelEdit;
window.opsForecastStartInlineEdit = opsForecastStartInlineEdit;
window.opsForecastCancelInline = opsForecastCancelInline;
window.opsForecastSaveInline = opsForecastSaveInline;
window.opsForecastInlineKeydown = opsForecastInlineKeydown;
window.opsSetReportingDateAndRefresh = opsSetReportingDateAndRefresh;
window.opsResetReportingDate = opsResetReportingDate;
