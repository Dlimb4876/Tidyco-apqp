/* ============================================================
   me-calculations.js — Capacity Calculation Layer

   Centralized calculations for month/week capacity and demand.
   Extracts logic from me-chart.js and me-heatmap.js for
   single source of truth and easier testing.
   ============================================================ */

// ── Month Capacity & Demand Calculation ─────────────────────
window.meCalculateMonthData = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  // Calculate capacity
  let capacity = 0;
  let capacityMax = 0;  // 100% theoretical max
  teamArray.forEach(member => {
    // Skip team members without a start date
    if (!member.startDate) return;

    const hoursAdjusted = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    const hoursMax = (member.hoursPerWeek || 37.5);  // 100% without utilization

    // Check if member is active during this month
    let activeStart = monthStart;
    let activeEnd = monthEnd;

    const startDate = new Date(member.startDate);
    if (startDate > monthStart) {
      activeStart = startDate;
    }

    if (member.endDate) {
      const endDate = new Date(member.endDate);
      if (endDate < monthEnd) {
        activeEnd = endDate;
      }
    }

    // Only count capacity if member is active during the month
    if (activeStart <= activeEnd) {
      const workDays = countWorkDaysBetween(activeStart, activeEnd);
      const monthCapacity = hoursAdjusted * (workDays / 5);
      const monthCapacityMax = hoursMax * (workDays / 5);
      capacity += monthCapacity;
      capacityMax += monthCapacityMax;
    }
  });

  // Calculate and subtract holiday deductions
  let holidayDeduction = 0;
  const bankHols = getBankHolidaysForYear(year);
  const hoursPerDay = 7.5;  // Standard 37.5 hours / 5 days

  // Subtract user-marked holidays
  holidaysArray.forEach(holiday => {
    const holidayMonth = holiday.date.substring(0, 7);  // Extract 'YYYY-MM'
    if (holidayMonth === monthKey) {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  // Subtract bank holidays (Mon-Fri only, avoiding double-deduction)
  const markedHolidayDates = new Set(
    holidaysArray
      .filter(h => h.date.substring(0, 7) === monthKey)
      .map(h => h.date)
  );

  Object.entries(bankHols).forEach(([dateStr, name]) => {
    const bankMonth = dateStr.substring(0, 7);
    if (bankMonth === monthKey && !markedHolidayDates.has(dateStr)) {
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {  // Not weekend
        holidayDeduction += hoursPerDay;
      }
    }
  });

  const adjustedCapacity = Math.max(0, capacity - holidayDeduction);

  // Calculate demand from tasks
  let npi = 0, improvement = 0, tendering = 0, support = 0, other = 0;

  tasksArray.forEach(task => {
    // Skip tasks without dates
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

    if (overlapStart <= overlapEnd) {
      const totalDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const category = (task.category || 'other').toLowerCase();

      // Check if task has advanced estimation with activities
      if (task.advancedEstimation && task.advancedEstimation.activities && task.advancedEstimation.activities.length > 0) {
        // For tasks with activities: sum all activity hours (with or without assignedTo)
        task.advancedEstimation.activities.forEach(activity => {
          const activityHours = (parseFloat(activity.baseHours) || 0) * (overlapDays / totalDays);

          if (category === 'npi') npi += activityHours;
          else if (category === 'improvement') improvement += activityHours;
          else if (category === 'tendering') tendering += activityHours;
          else if (category === 'support') support += activityHours;
          else other += activityHours;
        });
      } else {
        // Simple task without activities: apply totalHours to team demand as before
        const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);

        if (category === 'npi') npi += hoursThisMonth;
        else if (category === 'improvement') improvement += hoursThisMonth;
        else if (category === 'tendering') tendering += hoursThisMonth;
        else if (category === 'support') support += hoursThisMonth;
        else other += hoursThisMonth;
      }
    }
  });

  // Calculate product support with proper date range overlap
  productsArray.forEach(product => {
    // Skip products without dates
    if (!product.supportFrom || !product.supportUntil) return;

    const prodStart = new Date(product.supportFrom);
    const prodEnd = new Date(product.supportUntil);

    // Check if product active in this month
    if (prodStart <= monthEnd && prodEnd >= monthStart) {
      // Find overlap between product date range and month
      const overlapStart = new Date(Math.max(prodStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(prodEnd.getTime(), monthEnd.getTime()));

      // Calculate working days in overlap period
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const workingDaysInOverlap = overlapDays * (5 / 7);  // Approximate working days
      const weeksInOverlap = workingDaysInOverlap / 5;

      support += (product.hoursPerWeek || 0) * weeksInOverlap;
    }
  });

  const totalDemand = npi + improvement + tendering + support + other;
  const adjustedCapacityMax = Math.max(0, capacityMax - holidayDeduction);
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

  // Calculate capacity (37.5h/week adjusted by utilisation %)
  const baseHours = (person.hoursPerWeek || 37.5);
  const adjustedHours = baseHours * ((person.utilisation || 80) / 100);

  // Count working days in this week
  const workDays = countWorkDaysBetween(weekStart_d, weekEnd_d);
  const capacityBefore = adjustedHours * (workDays / 5);

  // Subtract holidays for this person in this week
  let holidayDeduction = 0;
  const hoursPerDay = 7.5;  // 37.5 / 5

  holidaysArray.forEach(holiday => {
    if (holiday.personId !== personId) return;
    const hDate = new Date(holiday.date);
    if (hDate >= weekStart_d && hDate <= weekEnd_d) {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  const capacity = Math.max(0, capacityBefore - holidayDeduction);

  // Calculate demand from assigned tasks and activities
  let demand = 0;
  tasksArray.forEach(task => {
    if (!task.startDate || !task.endDate) return;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // Check overlap with week
    if (taskStart <= weekEnd_d && taskEnd >= weekStart_d) {
      const overlapStart = new Date(Math.max(taskStart.getTime(), weekStart_d.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), weekEnd_d.getTime()));

      const taskDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;

      // Check if task has advanced estimation with activities
      if (task.advancedEstimation && task.advancedEstimation.activities && task.advancedEstimation.activities.length > 0) {
        // For tasks with activities: sum hours for activities assigned to this person
        task.advancedEstimation.activities.forEach(activity => {
          if (activity.assignedTo === personId) {
            const activityHours = (parseFloat(activity.baseHours) || 0) * (overlapDays / taskDays);
            demand += activityHours;
          }
        });
      } else {
        // Simple task: check if assigned to this person
        if (task.assigneeId === personId) {
          const proratedHours = (task.totalHours || 0) * (overlapDays / taskDays);
          demand += proratedHours;
        }
      }
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

// ── Bank Holidays (UK) with Caching ─────────────────────────
window.getBankHolidaysForYear = function(year) {
  // Cache to avoid recalculating
  if (!window.meBankHolidaysCache) {
    window.meBankHolidaysCache = {};
  }

  if (window.meBankHolidaysCache[year]) {
    return window.meBankHolidaysCache[year];
  }

  const holidays = {};
  holidays[`${year}-01-01`] = 'New Year';
  holidays[`${year}-12-25`] = 'Christmas';
  holidays[`${year}-12-26`] = 'Boxing Day';

  // Simple Easter calculation (Meeus algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  holidays[formatDateForHolidays(goodFriday)] = 'Good Friday';
  holidays[formatDateForHolidays(easterMonday)] = 'Easter Monday';

  // UK bank holidays
  const mayFirst = new Date(year, 4, 1);
  const daysUntilMonday = (1 - mayFirst.getDay() + 7) % 7;
  const firstMondayMay = new Date(year, 4, 1 + daysUntilMonday);
  holidays[formatDateForHolidays(firstMondayMay)] = 'Early May Bank Holiday';

  window.meBankHolidaysCache[year] = holidays;
  return holidays;
};

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
