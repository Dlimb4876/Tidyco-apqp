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

  // Calculate capacity using network days (Mon-Fri, excluding bank holidays)
  let capacity = 0;
  let capacityMax = 0;
  teamArray.forEach(member => {
    if (!member.startDate) return;

    const hoursAdjusted = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    const hoursMax = (member.hoursPerWeek || 37.5);

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
      capacity += hoursAdjusted * (netDays / 5);
      capacityMax += hoursMax * (netDays / 5);
    }
  });

  // Subtract user-marked personal holidays (bank holidays already excluded via network days)
  let holidayDeduction = 0;
  const hoursPerDay = 7.5;

  holidaysArray.forEach(holiday => {
    const holidayMonth = holiday.date.substring(0, 7);
    if (holidayMonth === monthKey) {
      if (holiday.type === 'full') holidayDeduction += hoursPerDay;
      else if (holiday.type === 'half') holidayDeduction += hoursPerDay / 2;
    }
  });

  const adjustedCapacity = Math.max(0, capacity - holidayDeduction);
  const adjustedCapacityMax = Math.max(0, capacityMax - holidayDeduction);

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

  // Product support using network days
  productsArray.forEach(product => {
    if (!product.supportFrom || !product.supportUntil) return;

    const prodStart = new Date(product.supportFrom);
    const prodEnd = new Date(product.supportUntil);

    if (prodStart <= monthEnd && prodEnd >= monthStart) {
      const overlapStart = new Date(Math.max(prodStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(prodEnd.getTime(), monthEnd.getTime()));
      const netDays = window.countNetworkDaysBetween(overlapStart, overlapEnd, bankHolSet);
      support += (product.hoursPerWeek || 0) * (netDays / 5);
    }
  });

  const totalDemand = npi + improvement + tendering + support + other;
  return {
    capacity: adjustedCapacity,
    capacityMax: adjustedCapacityMax,
    npi,
    improvement,
    tendering,
    support,
    other,
    totalDemand,
    utilisation: adjustedCapacity > 0 ? Math.round((totalDemand / adjustedCapacity) * 100) : 0
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

  const baseHours = (person.hoursPerWeek || 37.5);
  const adjustedHours = baseHours * ((person.utilisation || 80) / 100);

  // Capacity: network days in week (Mon-Fri, excluding bank holidays)
  const netDays = window.countNetworkDaysBetween(weekStart_d, weekEnd_d, bankHolSet);
  const capacityBefore = adjustedHours * (netDays / 5);

  // Subtract user-marked personal holidays for this person (bank hols already excluded)
  let holidayDeduction = 0;
  const hoursPerDay = 7.5;

  holidaysArray.forEach(holiday => {
    if (holiday.personId !== personId) return;
    const hDate = new Date(holiday.date);
    if (hDate >= weekStart_d && hDate <= weekEnd_d) {
      if (holiday.type === 'full') holidayDeduction += hoursPerDay;
      else if (holiday.type === 'half') holidayDeduction += hoursPerDay / 2;
    }
  });

  const capacity = Math.max(0, capacityBefore - holidayDeduction);

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

  const utilisation = capacity > 0 ? Math.round((demand / capacity) * 100) : 0;
  return { capacity, demand, utilisation };
};

// ── Work Days Calculation ───────────────────────────────────
window.countWorkDaysInMonth = function(year, month) {
  const date = new Date(year, month - 1, 1);
  let workDays = 0;
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) workDays++;
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
    const day = current.getDay();
    if (day !== 0 && day !== 6) workDays++;
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
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
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
