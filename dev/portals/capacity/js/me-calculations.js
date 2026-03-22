/* ============================================================
   me-calculations.js — Capacity Calculation Layer

   Centralized calculations for month/week capacity and demand.
   Extracts logic from me-chart.js and me-heatmap.js for
   single source of truth and easier testing.
   ============================================================ */

// ── Helper: Get Effective Subtasks ──────────────────────────
// Returns the work item for a task (one implicit subtask per assignee).
window.getEffectiveSubtasks = function(task) {
  if (task.assigneeId) {
    return [{
      assigneeId: task.assigneeId,
      hours: task.totalHours || 0,
      name: task.name
    }];
  }
  return [];
};

window.meParseDateOnlyLocal = function(value) {
  if (!value) return null;
  const dateOnly = String(value).substring(0, 10);
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

window.meGetHolidayDaysInRange = function(memberId, rangeStart, rangeEnd, holidaysArray, bankHolSet) {
  if (!memberId || !rangeStart || !rangeEnd || !Array.isArray(holidaysArray)) return 0;

  const rangeStartDate = new Date(rangeStart);
  rangeStartDate.setHours(0, 0, 0, 0);
  const rangeEndDate = new Date(rangeEnd);
  rangeEndDate.setHours(0, 0, 0, 0);

  let holidayDays = 0;
  holidaysArray.forEach(holiday => {
    if (!holiday) return;
    const holidayPersonId = holiday.personId || holiday.person_id;
    if (holidayPersonId !== memberId) return;

    const holidayDate = meParseDateOnlyLocal(holiday.date);
    if (!holidayDate) return;
    holidayDate.setHours(0, 0, 0, 0);

    if (holidayDate < rangeStartDate || holidayDate > rangeEndDate) return;

    const dayOfWeek = holidayDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;

    const holidayDateStr = formatDateForHolidays(holidayDate);
    if (bankHolSet && bankHolSet.has(holidayDateStr)) return;

    const holidayType = String(holiday.type || 'full').toLowerCase();
    if (holidayType === 'half') holidayDays += 0.5;
    else holidayDays += 1;
  });

  return holidayDays;
};

window.meGetProductBatchCountInRange = function(product, rangeStart, rangeEnd) {
  if (!product || !rangeStart || !rangeEnd) return 0;
  const productDbId = product.productDatabaseId || product.product_database_id || null;
  if (!productDbId) return 0;

  const batches = (window.prodState && Array.isArray(window.prodState.batches))
    ? window.prodState.batches
    : [];

  let count = 0;
  batches.forEach(batch => {
    if (!batch || batch.product_id !== productDbId) return;
    if (!batch.start_date || !batch.due_date) return;

    const batchStart = new Date(batch.start_date);
    const batchEnd = new Date(batch.due_date);
    if (Number.isNaN(batchStart.getTime()) || Number.isNaN(batchEnd.getTime())) return;
    if (batchStart <= rangeEnd && batchEnd >= rangeStart) count += 1;
  });

  return count;
};

// ── Month Capacity & Demand Calculation ─────────────────────
window.meCalculateMonthData = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  // Build bank holiday Set for all years covered by this month and any tasks
  const relevantYears = new Set([year]);
  tasksArray.forEach(task => {
    if (task.startDate) relevantYears.add(new Date(task.startDate).getFullYear());
    if (task.endDate) relevantYears.add(new Date(task.endDate).getFullYear());
  });
  const bankHolSet = new Set();
  relevantYears.forEach(y => window.getBankHolidaysForYear(y).forEach(h => bankHolSet.add(h.date)));

  // Calculate capacity: gross hours minus personal holiday hours, then apply utilisation
  let capacity = 0;
  let capacityMax = 0;
  teamArray.forEach(member => {
    if (!member.startDate) return;

    const weeklyHours = meGetHoursPerWeek(member.hoursPerWeek);
    const utilisation = member.utilisation || 80;

    let activeStart = monthStart;
    let activeEnd = monthEnd;

    const startDate = new Date(member.startDate);
    if (startDate > monthStart) activeStart = startDate;

    if (member.endDate) {
      const endDate = new Date(member.endDate);
      if (endDate < monthEnd) activeEnd = endDate;
    }

    if (activeStart <= activeEnd) {
      const netDays = window.countNetworkDaysBetween(activeStart, activeEnd, bankHolSet);
      const grossHours = weeklyHours * (netDays / 5);
      const holidayDays = meGetHolidayDaysInRange(member.id, activeStart, activeEnd, holidaysArray, bankHolSet);
      const holidayHours = holidayDays * (weeklyHours / 5);
      const adjustedGross = Math.max(0, grossHours - holidayHours);
      capacity += adjustedGross * (utilisation / 100);
      capacityMax += adjustedGross; // capacityMax = adjusted gross at 100% utilisation
    }
  });

  // Calculate demand using network days proration (equivalent to NETWORKDAYS in Excel)
  let npi = 0, improvement = 0, tendering = 0, support = 0, other = 0;

  tasksArray.forEach(task => {
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

    if (overlapStart <= overlapEnd) {
      const taskNetDays = window.countNetworkDaysBetween(taskStart, taskEnd, bankHolSet);
      if (taskNetDays === 0) return;

      const overlapNetDays = window.countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet);
      const category = (task.category || 'other').toLowerCase();
      const effectiveSubtasks = getEffectiveSubtasks(task);
      if (effectiveSubtasks.length === 0) return;

      effectiveSubtasks.forEach(subtask => {
        const subtaskHours = (subtask.hours || 0) * (overlapNetDays / taskNetDays);
        if (category === 'npi') npi += subtaskHours;
        else if (category === 'improvement') improvement += subtaskHours;
        else if (category === 'tendering') tendering += subtaskHours;
        else if (category === 'support') support += subtaskHours;
        else other += subtaskHours;
      });
    }
  });

  // Product support from production schedule batches (support value is per batch)
  productsArray.forEach(product => {
    const supportPerBatch = Number(product.hoursPerWeek) || 0;
    const batchCount = window.meGetProductBatchCountInRange(product, monthStart, monthEnd);
    support += supportPerBatch * batchCount;
  });

  const totalDemand = npi + improvement + tendering + support + other;
  return {
    capacity,
    capacityMax,
    npi,
    improvement,
    tendering,
    support,
    other,
    totalDemand,
    utilisation: capacity > 0 ? Math.round((totalDemand / capacity) * 100) : 0
  };
};

// ── Week Utilisation Calculation (Per-Person) ────────────────
window.meCalcWeekUtilisation = function(personId, weekStart, weekEnd, tasksArray, holidaysArray) {
  const person = meDataGetTeam().find(p => p.id === personId);
  if (!person || !person.startDate) return { capacity: 0, demand: 0, utilisation: 0 };

  const weekStart_d = new Date(weekStart);
  const weekEnd_d = new Date(weekEnd);

  // Build bank holiday Set for all years covered by this week and tasks
  const relevantYears = new Set([weekStart_d.getFullYear(), weekEnd_d.getFullYear()]);
  tasksArray.forEach(task => {
    if (task.startDate) relevantYears.add(new Date(task.startDate).getFullYear());
    if (task.endDate) relevantYears.add(new Date(task.endDate).getFullYear());
  });
  const bankHolSet = new Set();
  relevantYears.forEach(y => window.getBankHolidaysForYear(y).forEach(h => bankHolSet.add(h.date)));

  const baseHours = meGetHoursPerWeek(person.hoursPerWeek);
  const utilisation = person.utilisation || 80;

  // Capacity: network days in week (Mon-Fri, excluding bank holidays)
  const netDays = window.countNetworkDaysBetween(weekStart_d, weekEnd_d, bankHolSet);
  const grossCapacity = baseHours * (netDays / 5);

  const holidayDays = meGetHolidayDaysInRange(personId, weekStart_d, weekEnd_d, holidaysArray, bankHolSet);
  const holidayHours = holidayDays * (baseHours / 5);
  const adjustedGross = Math.max(0, grossCapacity - holidayHours);
  const capacity = adjustedGross * (utilisation / 100);

  // Demand: network days proration (NETWORKDAYS equivalent)
  let demand = 0;
  tasksArray.forEach(task => {
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    if (taskStart <= weekEnd_d && taskEnd >= weekStart_d) {
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart_d.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd_d.getTime()));

      const taskNetDays = window.countNetworkDaysBetween(taskStart, taskEnd, bankHolSet);
      if (taskNetDays === 0) return;

      const overlapNetDays = window.countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet);
      const effectiveSubtasks = getEffectiveSubtasks(task);

      effectiveSubtasks.forEach(subtask => {
        if (subtask.assigneeId === personId) {
          demand += (subtask.hours || 0) * (overlapNetDays / taskNetDays);
        }
      });
    }
  });

  const utilisationPct = capacity > 0 ? Math.round((demand / capacity) * 100) : 0;
  return { capacity, demand, utilisation: utilisationPct };
};

// ── Work Days Calculation ───────────────────────────────────
function isWeekday(date) {
  const d = date.getDay();
  return d !== 0 && d !== 6;
}

window.countWorkDaysInMonth = function(year, month) {
  const date = new Date(year, month - 1, 1);
  let workDays = 0;
  while (date.getMonth() === month - 1) {
    if (isWeekday(date)) workDays++;
    date.setDate(date.getDate() + 1);
  }
  return workDays;
};

window.countWorkDaysBetween = function(startDate, endDate) {
  let workDays = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    if (isWeekday(current)) workDays++;
    current.setDate(current.getDate() + 1);
  }
  return workDays;
};

// Like Excel NETWORKDAYS: Mon-Fri only, excluding dates in bankHolSet
window.countNetworkDaysBetween = function(startDate, endDate, bankHolSet) {
  let workDays = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    if (isWeekday(current)) {
      const dateStr = formatDateForHolidays(current);
      if (!bankHolSet || !bankHolSet.has(dateStr)) workDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workDays;
};

// ── Bank Holidays (UK) with Caching ─────────────────────────
// ── Week Range Generation ───────────────────────────────────
window.meGetWeekRange = function(monthKey, weekCount) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);

  // Find first Monday of the month
  let current = new Date(monthStart);
  const dayOfWeek = current.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  if (daysUntilMonday > 0) {
    current.setDate(current.getDate() + daysUntilMonday);
  }

  const weeks = [];
  for (let i = 0; i < weekCount; i++) {
    const start = formatDateForHolidays(new Date(current));
    const end = formatDateForHolidays(new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000)); // Add 6 days
    weeks.push({ start, end });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

// ── Helper: Format Date for Internal Use ────────────────────
function formatDateForHolidays(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
