/* ============================================================
   me-chart.js — Chart Tab & Utilities
   ============================================================ */

window.meRenderChartTab = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const monthData = meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  const utilisationColor = utilisation < 85 ? 'var(--green)' :
                           utilisation < 100 ? 'var(--amber)' : 'var(--red)';

  const monthLabel = meGetMonthLabel(monthKey);

  return `
    <div class="me-chart-container">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${capacity}</div>
          <div class="me-kpi-label">Team Capacity (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${demand}</div>
          <div class="me-kpi-label">Total Demand (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-kpi-value">${utilisation}%</div>
          <div class="me-kpi-label">Utilisation</div>
          <div class="me-kpi-month">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${headroom}</div>
          <div class="me-kpi-label">Available Headroom (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-chart-controls">
        <button class="btn btn-secondary" onclick="meOnPrevMonth()">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${monthKey}" onchange="meOnMonthChange(this.value)" />
        <button class="btn btn-secondary" onclick="meOnNextMonth()">Next →</button>
      </div>

      <div class="me-chart-wrapper">
        <canvas id="meChart" height="300"></canvas>
      </div>

      <div class="me-chart-legend">
        <div class="legend-item"><div class="legend-color" style="background: #3b82f6;"></div><span>NPI</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div><span>Improvement</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #f59e0b;"></div><span>Tendering</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #14b8a6;"></div><span>Support</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #8b5cf6;"></div><span>Other</span></div>
        <div class="legend-item" style="margin-left: 30px;"><div class="legend-line" style="background: #ef4444;"></div><span>Team Capacity</span></div>
        <div class="legend-item"><div class="legend-line" style="background: #9ca3af; border-top: 2px dashed #9ca3af;"></div><span>100% Max Capacity</span></div>
      </div>
    </div>
  `;
};

window.meDrawChartNow = function() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  if (!window.Chart) {
    console.warn('Chart.js not loaded');
    return;
  }

  const canvas = document.getElementById('meChart');
  if (!canvas) return;

  if (meChartInst) meChartInst.destroy();

  const monthKeys = meGetMonthRange(meChartStart, 18);
  const monthLabels = monthKeys.map(m => meGetMonthLabel(m));

  const capacityData = [];
  const capacityMaxData = [];
  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];

  monthKeys.forEach(monthKey => {
    const data = meCalculateMonthData(monthKey, team, tasks, products, holidays);
    capacityData.push(data.capacity);
    capacityMaxData.push(data.capacityMax);
    npiData.push(data.npi);
    improvementData.push(data.improvement);
    tenderingData.push(data.tendering);
    supportData.push(data.support);
    otherData.push(data.other);
  });

  const ctx = canvas.getContext('2d');
  meChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'NPI', data: npiData, backgroundColor: '#3b82f6', stack: 'bars', order: 2 },
        { label: 'Improvement', data: improvementData, backgroundColor: '#10b981', stack: 'bars', order: 2 },
        { label: 'Tendering', data: tenderingData, backgroundColor: '#f59e0b', stack: 'bars', order: 2 },
        { label: 'Support', data: supportData, backgroundColor: '#14b8a6', stack: 'bars', order: 2 },
        { label: 'Other', data: otherData, backgroundColor: '#8b5cf6', stack: 'bars', order: 2 },
        { label: 'Team Capacity', data: capacityData, borderColor: '#ef4444', borderWidth: 2, type: 'line', fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', order: 1 },
        { label: '100% Max Capacity', data: capacityMaxData, borderColor: '#9ca3af', borderWidth: 2, borderDash: [4, 4], type: 'line', fill: false, pointRadius: 2, pointBackgroundColor: '#9ca3af', order: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 15
        }
      },
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, padding: 5, color: '#000000' } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#000000' } }
      },
      bar: { barPercentage: 0.75, categoryPercentage: 0.8 }
    }
  });
};

// ── Utility Functions ──────────────────────────────────────

function meFormatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function meGetMonthLabel(monthKey) {
  const date = new Date(monthKey + '-01');
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  return [month, year.toString()];
}

function meGetMonthRange(startMonth, count) {
  const months = [];
  let [year, month] = startMonth.split('-').map(Number);

  // Use the 15th of the month to avoid month-end/DST boundary issues
  let current = new Date(year, month - 1, 15);

  for (let i = 0; i < count; i++) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);

    // Increment by exactly one month
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function meGetBankHolidaysForYear(year) {
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

  holidays[meFormatDate(goodFriday)] = 'Good Friday';
  holidays[meFormatDate(easterMonday)] = 'Easter Monday';

  // UK bank holidays
  const mayFirst = new Date(year, 4, 1);
  const daysUntilMonday = (1 - mayFirst.getDay() + 7) % 7;
  const firstMondayMay = new Date(year, 4, 1 + daysUntilMonday);
  holidays[meFormatDate(firstMondayMay)] = 'Early May Bank Holiday';

  return holidays;
}

function meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
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
      const workDays = meCountWorkDaysBetween(activeStart, activeEnd);
      const monthCapacity = hoursAdjusted * (workDays / 5);
      const monthCapacityMax = hoursMax * (workDays / 5);
      capacity += monthCapacity;
      capacityMax += monthCapacityMax;
    }
  });

  // Calculate and subtract holiday deductions
  let holidayDeduction = 0;
  const bankHols = meGetBankHolidaysForYear(year);
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
      const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);

      const category = (task.category || 'other').toLowerCase();
      if (category === 'npi') npi += hoursThisMonth;
      else if (category === 'improvement') improvement += hoursThisMonth;
      else if (category === 'tendering') tendering += hoursThisMonth;
      else if (category === 'support') support += hoursThisMonth;
      else other += hoursThisMonth;
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
}

function meCountWorkDaysInMonth(year, month) {
  const date = new Date(year, month - 1, 1);
  let workDays = 0;
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) workDays++;
    date.setDate(date.getDate() + 1);
  }
  return workDays;
}

function meCountWorkDaysBetween(startDate, endDate) {
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
}
