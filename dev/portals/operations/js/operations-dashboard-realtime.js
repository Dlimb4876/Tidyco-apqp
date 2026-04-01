// ═══════════════════════════════════
// operations-dashboard-realtime.js — realtime orchestration
// ═══════════════════════════════════

import { supabase as supa, currentUser } from '../../../core/js/supa.js'
import { appState } from '../../../core/js/state.js'
import { isEditingInlineCell } from '../../../utils/js/helpers.js'
import {
	createRealtimeSubscription,
	removeRealtimeSubscription
} from '../../../utils/js/realtime.js'
import { requestRender } from '../../../utils/js/render-scheduler.js'
import {
	operationsDashboardState,
	setOpsRefreshCurrentTab
} from './operations-dashboard-state.js'
import { opsBuildMetrics } from './operations-dashboard-metrics.js'
import {
	opsRenderOverview,
	opsRenderFlowView,
	opsRenderRiskView,
	opsRenderPeopleView,
	opsRenderActionsView
} from './operations-dashboard-render-core.js'
import {
	opsRenderForecastView,
	opsRenderForecastChart
} from './operations-dashboard-forecast-view.js'
import { opsForecastManager } from './operations-forecast-data.js'
import {
	meLoadRelationalTeams,
	meLoadRelationalTasks,
	meLoadRelationalProducts,
	meLoadRelationalHolidays
} from '../../capacity/me/js/me-data-relational.js'

function opsScheduleRefresh(key, refreshFn, delayMs = 120) {
	if (operationsDashboardState.opsRefreshTimers[key]) {
		clearTimeout(operationsDashboardState.opsRefreshTimers[key]);
	}

	operationsDashboardState.opsRefreshTimers[key] = setTimeout(async () => {
		try {
			await refreshFn();
		} catch (err) {
			console.warn('Operations refresh failed for', key, err && err.message ? err.message : err);
		} finally {
			if (appState.currentSection === 'operations') {
				requestRender('ops', {
					trigger: 'realtime',
					renderNow: function() {
						if (typeof operationsDashboardState.opsRefreshCurrentTab === 'function') {
							operationsDashboardState.opsRefreshCurrentTab();
						}
						else if (typeof globalThis.render === 'function') globalThis.render();
					},
					isEditing: isEditingInlineCell(),
					debounceMs: 0,
				});
			}
		}
	}, delayMs);
}

// ── Tab-level refresh (DOM body swap — avoids full render() feedback loop) ──
function opsRefreshCurrentTab() {
	const container = document.getElementById('ops-dashboard');
	if (!container) return;
	const tab = appState.operationsTab || 'overview';
	const metrics = typeof opsBuildMetrics === 'function' ? opsBuildMetrics() : {};
	let body = '';
	if (typeof opsRenderFlowView === 'function' && tab === 'flow') body = opsRenderFlowView(metrics);
	else if (typeof opsRenderRiskView === 'function' && tab === 'risk') body = opsRenderRiskView(metrics);
	else if (typeof opsRenderPeopleView === 'function' && tab === 'people') body = opsRenderPeopleView(metrics);
	else if (typeof opsRenderActionsView === 'function' && tab === 'actions') body = opsRenderActionsView(metrics);
	else if (typeof opsRenderForecastView === 'function' && tab === 'forecast') body = opsRenderForecastView(metrics);
	else if (typeof opsRenderOverview === 'function') body = opsRenderOverview(metrics);
	// Replace only the tab body content, not the whole container
	const tabBody = container.querySelector('.ops-tab-body');
	if (tabBody) {
		tabBody.innerHTML = body;

		if (tab === 'forecast' && typeof opsRenderForecastChart === 'function') {
			opsRenderForecastChart(metrics.forecast);
		}
	} else {
		// Fall back to full render if tab body wrapper not found
		if (typeof globalThis.render === 'function') globalThis.render();
	}
}
setOpsRefreshCurrentTab(opsRefreshCurrentTab)

async function opsRefreshProjects() {
	if (typeof loadRemote === 'function' && currentUser) {
		await loadRemote();
	}
}

async function opsRefreshProductionBatches() {
	if (!currentUser || !supa || !globalThis.prodState) return;

	const { data, error } = await supa
		.from('production_batches')
		.select('*')
		.order('created_at', { ascending: true });

	if (error) throw error;
	if (!Array.isArray(globalThis.prodState.batches)) globalThis.prodState.batches = [];
	globalThis.prodState.batches = data || [];
}

async function opsRefreshProductionProducts() {
	if (!currentUser || !supa || !globalThis.prodState) return
	const { data, error } = await supa
		.from('products')
		.select('*')
		.is('deleted_at', null)
		.order('name', { ascending: true })
	if (error) throw error
	globalThis.prodState.products = data || []
}

async function opsRefreshMeData() {
	if (!currentUser || !globalThis.meDataState) return;

	if (typeof meLoadRelationalTeams !== 'function') return;

	const [teams, tasks, products, holidays] = await Promise.all([
		meLoadRelationalTeams(currentUser.id),
		meLoadRelationalTasks(currentUser.id),
		meLoadRelationalProducts(currentUser.id),
		meLoadRelationalHolidays(currentUser.id)
	]);

	globalThis.meDataState.team = teams || [];
	globalThis.meDataState.tasks = tasks || [];
	globalThis.meDataState.products = products || [];
	globalThis.meDataState.holidays = Array.isArray(holidays) ? holidays : [];
}

async function opsRefreshBugs() {
	if (!currentUser || !globalThis.feedbackDataManager || !globalThis.feedbackDataManager.state) return;

	const { data, error } = await supa
		.from('user_feedback')
		.select('*')
		.eq('feedback_type', 'bug')
		.order('date_submitted', { ascending: false });

	if (error) throw error;
	globalThis.feedbackDataManager.state.feedback = data || [];
}

async function opsRefreshForecast() {
	if (opsForecastManager && typeof opsForecastManager.reload === 'function') {
		await opsForecastManager.reload();
	}
}

function opsRealtimeInit() {
	if (!currentUser || !supa || operationsDashboardState.opsRealtimeActive) return;

	createRealtimeSubscription('me_teams', 'ops_me_teams_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	})
	createRealtimeSubscription('me_tasks', 'ops_me_tasks_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	})
	createRealtimeSubscription('me_products', 'ops_me_products_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	})
	createRealtimeSubscription('me_holidays', 'ops_me_holidays_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	})
	createRealtimeSubscription('production_batches', 'ops_prod_batches_channel', {
		onInsert: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
		onUpdate: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
		onDelete: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches)
	})
	createRealtimeSubscription('products', 'ops_prod_products_channel', {
		onInsert: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
		onUpdate: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
		onDelete: () => opsScheduleRefresh('products', opsRefreshProductionProducts)
	})
	createRealtimeSubscription('projects', 'ops_projects_channel', {
		onInsert: () => opsScheduleRefresh('projects', opsRefreshProjects),
		onUpdate: () => opsScheduleRefresh('projects', opsRefreshProjects),
		onDelete: () => opsScheduleRefresh('projects', opsRefreshProjects)
	})
	createRealtimeSubscription('user_feedback', 'ops_bugs_channel', {
		onInsert: () => opsScheduleRefresh('bugs', opsRefreshBugs),
		onUpdate: () => opsScheduleRefresh('bugs', opsRefreshBugs),
		onDelete: () => opsScheduleRefresh('bugs', opsRefreshBugs)
	})
	createRealtimeSubscription('operations_forecast_opportunities', 'ops_forecast_channel', {
		onInsert: () => opsScheduleRefresh('forecast', opsRefreshForecast),
		onUpdate: () => opsScheduleRefresh('forecast', opsRefreshForecast),
		onDelete: () => opsScheduleRefresh('forecast', opsRefreshForecast)
	})

	opsScheduleRefresh('projects', opsRefreshProjects, 10);
	opsScheduleRefresh('production_batches', opsRefreshProductionBatches, 10);
	opsScheduleRefresh('products', opsRefreshProductionProducts, 10);
	opsScheduleRefresh('me_data', opsRefreshMeData, 10);
	opsScheduleRefresh('bugs', opsRefreshBugs, 10);
	opsScheduleRefresh('forecast', opsRefreshForecast, 10);

	operationsDashboardState.opsRealtimeActive = true;
}

function opsRealtimeCleanup() {
	Object.keys(operationsDashboardState.opsRefreshTimers).forEach(key => {
		clearTimeout(operationsDashboardState.opsRefreshTimers[key]);
	});
	operationsDashboardState.opsRefreshTimers = {};

	removeRealtimeSubscription('ops_me_teams_channel');
	removeRealtimeSubscription('ops_me_tasks_channel');
	removeRealtimeSubscription('ops_me_products_channel');
	removeRealtimeSubscription('ops_me_holidays_channel');
	removeRealtimeSubscription('ops_prod_batches_channel');
	removeRealtimeSubscription('ops_prod_products_channel');
	removeRealtimeSubscription('ops_projects_channel');
	removeRealtimeSubscription('ops_bugs_channel');
	removeRealtimeSubscription('ops_forecast_channel');

	if (operationsDashboardState.opsForecastChart) {
		try {
			operationsDashboardState.opsForecastChart.destroy();
		} catch (err) {
			console.warn('Could not destroy operations forecast chart:', err && err.message ? err.message : err);
		}
		operationsDashboardState.opsForecastChart = null;
	}

	operationsDashboardState.opsRealtimeActive = false;
}

export {
	opsRealtimeInit,
	opsRealtimeCleanup,
	opsRefreshCurrentTab
}
