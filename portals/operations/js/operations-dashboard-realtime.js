// ═══════════════════════════════════
// operations-dashboard-realtime.js — realtime orchestration
// ═══════════════════════════════════

function opsScheduleRefresh(key, refreshFn, delayMs = 120) {
	if (opsRefreshTimers[key]) {
		clearTimeout(opsRefreshTimers[key]);
	}

	opsRefreshTimers[key] = setTimeout(async () => {
		try {
			await refreshFn();
		} catch (err) {
			console.warn('Operations refresh failed for', key, err && err.message ? err.message : err);
		} finally {
			if (currentSection === 'operations') {
				if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) {
					window.opsPendingRealTimeUpdate = true;
				} else {
					render();
				}
			}
		}
	}, delayMs);
}

async function opsRefreshProjects() {
	if (typeof loadRemote === 'function' && currentUser) {
		await loadRemote();
	}
}

async function opsRefreshProductionBatches() {
	if (!currentUser || !supa || !window.prodState) return;

	const { data, error } = await supa
		.from('production_batches')
		.select('*')
		.order('created_at', { ascending: true });

	if (error) throw error;
	if (!Array.isArray(window.prodState.batches)) window.prodState.batches = [];
	window.prodState.batches = data || [];
}

async function opsRefreshProductionProducts() {
	if (typeof prodDataReloadProducts === 'function') {
		await prodDataReloadProducts();
	}
}

async function opsRefreshMeData() {
	if (!currentUser || !window.meDataState) return;

	if (typeof meLoadRelationalTeams !== 'function') return;

	const [teams, tasks, products, holidays] = await Promise.all([
		meLoadRelationalTeams(currentUser.id),
		meLoadRelationalTasks(currentUser.id),
		meLoadRelationalProducts(currentUser.id),
		meLoadRelationalHolidays(currentUser.id)
	]);

	window.meDataState.team = teams || [];
	window.meDataState.tasks = tasks || [];
	window.meDataState.products = products || [];
	window.meDataState.holidays = Array.isArray(holidays) ? holidays : [];
}

async function opsRefreshBugs() {
	if (!currentUser || !window.feedbackDataManager || !window.feedbackDataManager.state) return;

	const { data, error } = await supa
		.from('user_feedback')
		.select('*')
		.eq('feedback_type', 'bug')
		.order('date_submitted', { ascending: false });

	if (error) throw error;
	window.feedbackDataManager.state.feedback = data || [];
}

async function opsRefreshForecast() {
	if (window.opsForecastManager && typeof window.opsForecastManager.reload === 'function') {
		await window.opsForecastManager.reload();
	}
}

function opsRealtimeInit() {
	if (!currentUser || !supa || opsRealtimeActive) return;

	// 3-B: Consolidate channels to reduce per-user WebSocket connections.
	// Before: 9 individual channels.  After: 3 consolidated channels.
	//   ops_me_all_channel     — me_teams + me_tasks + me_products + me_holidays (4 → 1)
	//   ops_prod_all_channel   — production_batches + products (2 → 1)
	//   ops_misc_channel       — projects + user_feedback + forecast (3 → 1)

	createMultiTableRealtimeSubscription([
		{
			table: 'me_teams',
			onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
		},
		{
			table: 'me_tasks',
			onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
		},
		{
			table: 'me_products',
			onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
		},
		{
			table: 'me_holidays',
			onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
			onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
		}
	], 'ops_me_all_channel');

	createMultiTableRealtimeSubscription([
		{
			table: 'production_batches',
			onInsert: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
			onUpdate: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
			onDelete: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches)
		},
		{
			table: 'products',
			onInsert: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
			onUpdate: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
			onDelete: () => opsScheduleRefresh('products', opsRefreshProductionProducts)
		}
	], 'ops_prod_all_channel');

	createMultiTableRealtimeSubscription([
		{
			table: 'projects',
			onInsert: () => opsScheduleRefresh('projects', opsRefreshProjects),
			onUpdate: () => opsScheduleRefresh('projects', opsRefreshProjects),
			onDelete: () => opsScheduleRefresh('projects', opsRefreshProjects)
		},
		{
			table: 'user_feedback',
			onInsert: () => opsScheduleRefresh('bugs', opsRefreshBugs),
			onUpdate: () => opsScheduleRefresh('bugs', opsRefreshBugs),
			onDelete: () => opsScheduleRefresh('bugs', opsRefreshBugs)
		},
		{
			table: 'operations_forecast_opportunities',
			onInsert: () => opsScheduleRefresh('forecast', opsRefreshForecast),
			onUpdate: () => opsScheduleRefresh('forecast', opsRefreshForecast),
			onDelete: () => opsScheduleRefresh('forecast', opsRefreshForecast)
		}
	], 'ops_misc_channel');

	opsScheduleRefresh('projects', opsRefreshProjects, 10);
	opsScheduleRefresh('production_batches', opsRefreshProductionBatches, 10);
	opsScheduleRefresh('products', opsRefreshProductionProducts, 10);
	opsScheduleRefresh('me_data', opsRefreshMeData, 10);
	opsScheduleRefresh('bugs', opsRefreshBugs, 10);
	opsScheduleRefresh('forecast', opsRefreshForecast, 10);

	opsRealtimeActive = true;
}

function opsRealtimeCleanup() {
	Object.keys(opsRefreshTimers).forEach(key => {
		clearTimeout(opsRefreshTimers[key]);
	});
	opsRefreshTimers = {};

	// 3-B: Remove the 3 consolidated channels (was 9 individual channels)
	removeRealtimeSubscription('ops_me_all_channel');
	removeRealtimeSubscription('ops_prod_all_channel');
	removeRealtimeSubscription('ops_misc_channel');

	if (opsForecastChart) {
		try {
			opsForecastChart.destroy();
		} catch (err) {
			console.warn('Could not destroy operations forecast chart:', err && err.message ? err.message : err);
		}
		opsForecastChart = null;
	}

	opsRealtimeActive = false;
}
