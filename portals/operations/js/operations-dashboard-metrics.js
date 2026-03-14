// ═══════════════════════════════════
// operations-dashboard-metrics.js — calculations and scoring
// ═══════════════════════════════════

function opsParseDateSafe(raw) {
	if (!raw) return null;
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}

function opsTodayIso() {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function opsCurrentMonthKey() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function opsToNumber(value, fallback = 0) {
	const num = Number(value);
	return Number.isFinite(num) ? num : fallback;
}

function opsFormatHours(value) {
	return `${Math.round(opsToNumber(value)).toLocaleString('en-GB')}h`;
}

function opsStatusTone(value) {
	if (value >= 85) return 'good';
	if (value >= 65) return 'watch';
	return 'critical';
}

function opsCalcGateHealth(programmes) {
	let totalChecks = 0;
	let doneChecks = 0;

	programmes.forEach(programme => {
		const gates = Array.isArray(programme.gates) ? programme.gates : [];
		gates.forEach(gate => {
			const checks = Array.isArray(gate.checks) ? gate.checks : [];
			checks.forEach(check => {
				totalChecks += 1;
				if (check === true || (check && check.done === true)) doneChecks += 1;
			});
		});
	});

	const percentage = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;
	return { doneChecks, totalChecks, percentage };
}

function opsCalcActionHealth(programmes) {
	const today = opsTodayIso();
	let totalOpen = 0;
	let overdue = 0;

	programmes.forEach(programme => {
		const actions = Array.isArray(programme.actions) ? programme.actions : [];
		actions.forEach(action => {
			const status = (action.status || '').toString().toLowerCase();
			const closed = status === 'closed' || status === 'done' || status === 'complete';
			if (!closed) {
				totalOpen += 1;
				const due = action.due || action.dueDate || action.targetDate || '';
				if (due && due < today) overdue += 1;
			}
		});
	});

	return { totalOpen, overdue };
}

function opsCalcRiskHealth(programmes) {
	let highRisks = 0;
	let highRpn = 0;

	programmes.forEach(programme => {
		const risks = Array.isArray(programme.risks) ? programme.risks : [];
		risks.forEach(risk => {
			const score = opsToNumber(risk.score, opsToNumber(risk.likelihood) * opsToNumber(risk.impact));
			if (score >= 12) highRisks += 1;
		});

		const pfmeaModes = Array.isArray(programme.pfmea) ? programme.pfmea : [];
		pfmeaModes.forEach(mode => {
			const effects = Array.isArray(mode.effects) ? mode.effects : [];
			effects.forEach(effect => {
				const causes = Array.isArray(effect.causes) ? effect.causes : [];
				causes.forEach(cause => {
					const sev = opsToNumber(effect.sev, 1);
					const occ = opsToNumber(cause.occ, 1);
					const det = opsToNumber(cause.det, 1);
					const rpn = sev * occ * det;
					if (rpn >= 100) highRpn += 1;
				});
			});
		});
	});

	return { highRisks, highRpn };
}

function opsCalcBugHealth() {
	const reports = window.feedbackDataManager?.state?.feedback;
	const rows = Array.isArray(reports) ? reports : [];
	const closedStatuses = new Set(['completed', 'declined', 'squashed']);

	let open = 0;
	let closed7d = 0;
	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

	rows.forEach(report => {
		if ((report.feedback_type || '').toString().toLowerCase() !== 'bug') return;

		const status = (report.status || '').toString().toLowerCase();
		if (!closedStatuses.has(status)) open += 1;

		const respondedAt = opsParseDateSafe(report.responded_at);
		if (closedStatuses.has(status) && respondedAt && respondedAt >= sevenDaysAgo) {
			closed7d += 1;
		}
	});

	return { open, closed7d };
}

function opsCalcMeCapacity() {
	if (typeof window.meCalculateMonthData !== 'function' || !window.meDataState) {
		return { ready: false, utilisation: 0, headroom: 0, demand: 0, capacity: 0 };
	}

	const monthKey = opsCurrentMonthKey();
	const team = Array.isArray(window.meDataState.team) ? window.meDataState.team : [];
	const tasks = Array.isArray(window.meDataState.tasks) ? window.meDataState.tasks : [];
	const products = Array.isArray(window.meDataState.products) ? window.meDataState.products : [];
	const holidays = Array.isArray(window.meDataState.holidays) ? window.meDataState.holidays : [];

	const teamMe = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(team, 'ME', 'ME')
		: team;
	const tasksMe = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(tasks, 'ME', 'ME')
		: tasks;
	const productsMe = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(products, 'ME', 'ME')
		: products;
	const holidaysMe = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(holidays, 'ME', 'ME')
		: holidays;

	const monthData = window.meCalculateMonthData(monthKey, teamMe, tasksMe, productsMe, holidaysMe);
	const capacity = opsToNumber(monthData.capacity);
	const demand = opsToNumber(monthData.totalDemand);
	const utilisation = Math.max(0, Math.round(opsToNumber(monthData.utilisation)));
	const headroom = Math.round(capacity - demand);

	return {
		ready: true,
		utilisation,
		headroom,
		demand: Math.round(demand),
		capacity: Math.round(capacity)
	};
}

function opsCalcPmCapacity() {
	if (typeof window.meCalculateMonthData !== 'function' || !window.meDataState) {
		return { ready: false, utilisation: 0, headroom: 0, demand: 0, capacity: 0 };
	}

	const monthKey = opsCurrentMonthKey();
	const team = Array.isArray(window.meDataState.team) ? window.meDataState.team : [];
	const tasks = Array.isArray(window.meDataState.tasks) ? window.meDataState.tasks : [];
	const products = Array.isArray(window.meDataState.products) ? window.meDataState.products : [];
	const holidays = Array.isArray(window.meDataState.holidays) ? window.meDataState.holidays : [];

	const teamPm = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(team, 'PM', 'ME')
		: team;
	const tasksPm = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(tasks, 'PM', 'ME')
		: tasks;
	const productsPm = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(products, 'PM', 'ME')
		: products;
	const holidaysPm = typeof window.meFilterByDepartment === 'function'
		? window.meFilterByDepartment(holidays, 'PM', 'ME')
		: holidays;

	const monthData = window.meCalculateMonthData(monthKey, teamPm, tasksPm, productsPm, holidaysPm);
	const capacity = opsToNumber(monthData.capacity);
	const demand = opsToNumber(monthData.totalDemand);
	const utilisation = Math.max(0, Math.round(opsToNumber(monthData.utilisation)));
	const headroom = Math.round(capacity - demand);

	return {
		ready: true,
		utilisation,
		headroom,
		demand: Math.round(demand),
		capacity: Math.round(capacity)
	};
}

function opsCalcProductionFlow() {
	const batches = Array.isArray(window.prodState?.batches) ? window.prodState.batches : [];
	const total = batches.length;
	const active = batches.filter(batch => ['planned', 'in progress', 'active', 'queued'].includes((batch.status || '').toString().toLowerCase())).length;
	const completed = batches.filter(batch => ['done', 'complete', 'completed', 'closed'].includes((batch.status || '').toString().toLowerCase())).length;

	const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
	return { total, active, completed, completionRate };
}

function opsCalcForecastProduction() {
	if (
		typeof window.prodCapGet24MonthKeys !== 'function' ||
		typeof window.prodCapGetWorkAreas !== 'function' ||
		typeof window.prodCapCalcDemandMatrix !== 'function' ||
		typeof window.prodCapCalcSupplyMatrix !== 'function'
	) {
		return {
			ready: false,
			mode: 'local',
			error: '',
			activeOpportunities: 0,
			baseline24h: 0,
			forecast24h: 0,
			total24h: 0,
			supply24h: 0,
			headroom24h: 0,
			utilisation24: 0,
			monthSeries: []
		};
	}

	const monthKeys = window.prodCapGet24MonthKeys();
	const workAreas = window.prodCapGetWorkAreas();
	const baselineMatrix = window.prodCapCalcDemandMatrix(monthKeys);
	const supplyMatrix = window.prodCapCalcSupplyMatrix(monthKeys, workAreas);
	const rows = window.opsForecastManager && typeof window.opsForecastManager.getRows === 'function'
		? window.opsForecastManager.getRows()
		: [];

	const weightedMatrix = typeof window.opsForecastBuildWeightedMatrix === 'function'
		? window.opsForecastBuildWeightedMatrix(monthKeys, rows)
		: {};

	const monthSeries = monthKeys.map((key, idx) => {
		const baseline = opsToNumber(baselineMatrix[key]?._total, 0);
		const forecastAdd = opsToNumber(weightedMatrix[key]?._total, 0);
		const forecastLow = opsToNumber(weightedMatrix[key]?._bands?.low, 0);
		const forecastMedium = opsToNumber(weightedMatrix[key]?._bands?.medium, 0);
		const forecastHigh = opsToNumber(weightedMatrix[key]?._bands?.high, 0);
		const supply = opsToNumber(supplyMatrix[key]?._total, 0);
		const totalDemand = baseline + forecastAdd;
		const label = typeof window.prodCapMonthLabel === 'function'
			? window.prodCapMonthLabel(key)
			: `${idx + 1}`;

		return { key, label, baseline, forecastAdd, forecastLow, forecastMedium, forecastHigh, supply, totalDemand };
	});

	const baseline24h = monthSeries.reduce((sum, row) => sum + row.baseline, 0);
	const forecast24h = monthSeries.reduce((sum, row) => sum + row.forecastAdd, 0);
	const total24h = baseline24h + forecast24h;
	const supply24h = monthSeries.reduce((sum, row) => sum + row.supply, 0);
	const utilFn = typeof window.prodCapUtil === 'function'
		? window.prodCapUtil
		: (demand, supply) => (supply <= 0 ? (demand > 0 ? 999 : 0) : Math.round((demand / supply) * 100));
	const utilisation24 = utilFn(total24h, supply24h);
	const activeOpportunities = Array.isArray(rows) && typeof window.opsForecastIsActiveStatus === 'function'
		? rows.filter(row => window.opsForecastIsActiveStatus(row.status)).length
		: 0;
	const mode = window.opsForecastManager?.state?.mode || 'local';
	const error = window.opsForecastManager?.state?.lastError || '';

	return {
		ready: true,
		mode,
		error,
		activeOpportunities,
		baseline24h: Math.round(baseline24h),
		forecast24h: Math.round(forecast24h),
		total24h: Math.round(total24h),
		supply24h: Math.round(supply24h),
		headroom24h: Math.round(supply24h - total24h),
		utilisation24,
		monthSeries,
		rows: Array.isArray(rows) ? rows : []
	};
}

function opsCalcProgrammeFlow(programmes) {
	const total = programmes.length;
	const archived = programmes.filter(p => (p.status || '').toString().toLowerCase() === 'archive').length;
	const active = Math.max(0, total - archived);
	return { total, active, archived };
}

function opsBuildMetrics() {
	const programmes = Array.isArray(db?.programmes) ? db.programmes : [];
	const gate = opsCalcGateHealth(programmes);
	const actions = opsCalcActionHealth(programmes);
	const risk = opsCalcRiskHealth(programmes);
	const bugs = opsCalcBugHealth();
	const me = opsCalcMeCapacity();
	const pm = opsCalcPmCapacity();
	const production = opsCalcProductionFlow();
	const forecast = opsCalcForecastProduction();
	const programmesFlow = opsCalcProgrammeFlow(programmes);

	const healthInputs = [
		Math.max(0, 100 - (actions.overdue * 10)),
		Math.max(0, 100 - (risk.highRpn * 2)),
		gate.percentage,
		Math.max(0, 100 - (bugs.open * 4)),
		me.ready ? Math.max(0, 100 - Math.max(0, me.utilisation - 85) * 2) : 70,
		production.completionRate,
		forecast.ready ? Math.max(0, 100 - Math.max(0, forecast.utilisation24 - 85) * 2) : 70
	];

	const healthScore = Math.round(healthInputs.reduce((sum, n) => sum + n, 0) / healthInputs.length);

	return {
		gate,
		actions,
		risk,
		bugs,
		me,
		pm,
		production,
		forecast,
		programmesFlow,
		healthScore,
		generatedAt: new Date()
	};
}
