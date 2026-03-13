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
			if (currentSection === 'operations') render();
		}
	}, delayMs);
}

async function opsRefreshProgrammes() {
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
	if (!currentUser || !window.bugDataManager || !window.bugDataManager.state) return;

	const { data, error } = await supa
		.from('bug_reports')
		.select('*')
		.order('date_raised', { ascending: false });

	if (error) throw error;
	window.bugDataManager.state.reports = data || [];
}

async function opsRefreshForecast() {
	if (window.opsForecastManager && typeof window.opsForecastManager.reload === 'function') {
		await window.opsForecastManager.reload();
	}
}

function opsRealtimeInit() {
	if (!currentUser || !supa || opsRealtimeActive) return;

	createRealtimeSubscription('programmes', 'ops_programmes_channel', {
		onInsert: () => opsScheduleRefresh('programmes', opsRefreshProgrammes),
		onUpdate: () => opsScheduleRefresh('programmes', opsRefreshProgrammes),
		onDelete: () => opsScheduleRefresh('programmes', opsRefreshProgrammes)
	});

	createRealtimeSubscription('production_batches', 'ops_production_batches_channel', {
		onInsert: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
		onUpdate: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
		onDelete: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches)
	});

	createRealtimeSubscription('products', 'ops_products_channel', {
		onInsert: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
		onUpdate: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
		onDelete: () => opsScheduleRefresh('products', opsRefreshProductionProducts)
	});

	createRealtimeSubscription('me_teams', 'ops_me_teams_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	});

	createRealtimeSubscription('me_tasks', 'ops_me_tasks_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	});

	createRealtimeSubscription('me_products', 'ops_me_products_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	});

	createRealtimeSubscription('me_holidays', 'ops_me_holidays_channel', {
		onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
		onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
	});

	createRealtimeSubscription('bug_reports', 'ops_bug_reports_channel', {
		onInsert: () => opsScheduleRefresh('bugs', opsRefreshBugs),
		onUpdate: () => opsScheduleRefresh('bugs', opsRefreshBugs),
		onDelete: () => opsScheduleRefresh('bugs', opsRefreshBugs)
	});

	createRealtimeSubscription('operations_forecast_opportunities', 'ops_forecast_channel', {
		onInsert: () => opsScheduleRefresh('forecast', opsRefreshForecast),
		onUpdate: () => opsScheduleRefresh('forecast', opsRefreshForecast),
		onDelete: () => opsScheduleRefresh('forecast', opsRefreshForecast)
	});

	opsScheduleRefresh('programmes', opsRefreshProgrammes, 10);
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

	removeRealtimeSubscription('ops_programmes_channel');
	removeRealtimeSubscription('ops_production_batches_channel');
	removeRealtimeSubscription('ops_products_channel');
	removeRealtimeSubscription('ops_me_teams_channel');
	removeRealtimeSubscription('ops_me_tasks_channel');
	removeRealtimeSubscription('ops_me_products_channel');
	removeRealtimeSubscription('ops_me_holidays_channel');
	removeRealtimeSubscription('ops_bug_reports_channel');
	removeRealtimeSubscription('ops_forecast_channel');

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
