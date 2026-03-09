function getMeWeeklyData() {
  if (!db.me || db.me.team.length === 0) return [];

  let weeks = [];
  let currentStart = new Date();
  
  // 1. Setup Dates
  currentStart.setMonth(currentStart.getMonth() + (typeof meStartOffset !== 'undefined' ? meStartOffset : 0));
  currentStart.setDate(currentStart.getDate() - (currentStart.getDay() === 0 ? 6 : currentStart.getDay() - 1));
  currentStart.setHours(0,0,0,0);

  // 2. Calculate Gross Capacity
  const grossCap = db.me.team.reduce((sum, t) => sum + (t.hours * (t.utilisation / 100)), 0);

  // 3. Loop through 12 weeks
  for (let i = 0; i < 12; i++) {
    let weekStart = new Date(currentStart);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Include full week for holiday check

    let w = {
      label: `Wk ${getWeekNumber(weekStart)} (${weekStart.getDate()}/${weekStart.getMonth()+1})`,
      cap: grossCap,
      npi: 0, imp: 0, tend: 0, other: 0, prod: 0
    };

    // A. Deduct Holidays from Capacity
    if (db.me.holidays) {
      db.me.holidays.forEach(h => {
        const hStart = new Date(h.start);
        const hEnd = new Date(h.end);
        // Check if holiday overlaps this specific week
        if (hStart <= weekEnd && hEnd >= weekStart) {
          // Standard deduction (e.g., 7.5 hours per holiday day) divided by team size for avg capacity
          const dailyHours = 7.5; 
          w.cap -= (h.days * dailyHours) / db.me.team.length;
        }
      });
    }

    // B. Add Task Loads to categories
    if (db.me.tasks) {
      db.me.tasks.forEach(t => {
        const tStart = new Date(t.start);
        const tEnd = new Date(t.end);
        // If task is active during this week
        if (tStart <= weekEnd && tEnd >= weekStart) {
          const cat = t.category ? t.category.toLowerCase() : 'other';
          // Distribute total hours across the task duration (simplified)
          const durationWeeks = Math.max(1, Math.ceil((tEnd - tStart) / (7 * 24 * 60 * 60 * 1000)));
          const weeklyLoad = t.totalHours / durationWeeks;
          
          if (w.hasOwnProperty(cat)) {
            w[cat] += weeklyLoad;
          } else {
            w.other += weeklyLoad;
          }
        }
      });
    }

    weeks.push(w);
  }
  
  return weeks;
}
