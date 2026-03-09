// Calculation Engine: Generates data for the next 12 weeks based on today
function getMeWeeklyData() {
  if (!db.me || db.me.team.length === 0) return [];

  let weeks = [];
  let currentStart = new Date();
  // Adjust for start month offset
  currentStart.setMonth(currentStart.getMonth() + meStartOffset);
  // Adjust to nearest previous Monday
  currentStart.setDate(currentStart.getDate() - (currentStart.getDay() === 0 ? 6 : currentStart.getDay() - 1));
  currentStart.setHours(0,0,0,0);

  const grossCap = db.me.team.reduce((sum, t) => sum + (t.hours * (t.utilisation / 100)), 0);

  // Change loop to 78 weeks (approx 18 months)
  for (let i = 0; i < 78; i++) { 
    // ... rest of calculation logic remains same
  }
  return weeks;
}

  // Calculate Base Gross Capacity per week
  const grossCap = db.me.team.reduce((sum, t) => sum + (t.hours * (t.utilisation / 100)), 0);

  for (let i = 0; i < 12; i++) {
    let weekStart = new Date(currentStart);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday of that week

    let w = {
      label: `Wk ${getWeekNumber(weekStart)} (${weekStart.getDate()}/${weekStart.getMonth()+1})`,
      cap: grossCap,
      npi: 0, imp: 0, tend: 0, other: 0, prod: 0
    };

    // Deduct Holidays from capacity
    db.me.holidays.forEach(h => {
      const overlapDays = meCalcIntersectingDays(weekStart, weekEnd, new Date(h.start), new Date(h.end));
      if (overlapDays > 0) {
        const member = db.me.team.find(m => m.id === h.memberId);
        if (member) {
          const dailyEffectiveHours = (member.hours * (member.utilisation / 100)) / 5;
          w.cap -= (dailyEffectiveHours * overlapDays);
        }
      }
    });

    // Add Task Load
    db.me.tasks.forEach(t => {
      const taskStart = new Date(t.start);
      const taskEnd = new Date(t.end);
      const overlapDays = meCalcIntersectingDays(weekStart, weekEnd, taskStart, taskEnd);
      if (overlapDays > 0) {
        const totalTaskDays = meCalcWorkingDays(taskStart, taskEnd) || 1;
        const dailyLoad = t.totalHours / totalTaskDays;
        const loadForWeek = dailyLoad * overlapDays;
        
        if (t.category === 'NPI') w.npi += loadForWeek;
        else if (t.category === 'Improvement') w.imp += loadForWeek;
        else if (t.category === 'Tendering') w.tend += loadForWeek;
        else w.other += loadForWeek;
      }
    });

    // Add Product Support Load
    db.me.products.forEach(p => {
      const pStart = new Date(p.start);
      const pEnd = new Date(p.end);
      if (weekEnd >= pStart && weekStart <= pEnd) {
        w.prod += p.supportHours;
      }
    });

    weeks.push(w);
  }
  return weeks;
}

function renderMeSheetView() {
  const data = getMeWeeklyData();
  if(data.length === 0) return `<div class="me-empty">No data calculated. Add Team members first.</div>`;

  const headers = data.map(w => `<th>${w.label}</th>`).join('');
  const rows = data.map(w => {
    const totalLoad = w.npi + w.imp + w.tend + w.other + w.prod;
    const net = w.cap - totalLoad;
    const netClass = net < 0 ? 'me-err' : 'me-ok';
    return `
      <td>
        <div class="me-sh-cap">Cap: <strong>${w.cap.toFixed(1)}h</strong></div>
        <div class="me-sh-load">Load: ${totalLoad.toFixed(1)}h</div>
        <div class="me-sh-net ${netClass}">Net: ${net.toFixed(1)}h</div>
      </td>`;
  }).join('');

  return `
    <div class="me-card" style="overflow-x: auto;">
      <h3>12-Week Rolling Capacity Data</h3>
      <table class="me-table me-sheet-table">
        <tr>${headers}</tr>
        <tr>${rows}</tr>
      </table>
    </div>
  `;
}

// Helpers
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function meCalcIntersectingDays(start1, end1, start2, end2) {
  const s = new Date(Math.max(start1, start2));
  const e = new Date(Math.min(end1, end2));
  if (s > e) return 0;
  return meCalcWorkingDays(s, e);
}
