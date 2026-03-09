function getMeWeeklyData() {
  if (!db.me || db.me.team.length === 0) return [];

  let weeks = [];
  let currentStart = new Date();
  
  // 1. Setup Dates
  currentStart.setMonth(currentStart.getMonth() + meStartOffset);
  currentStart.setDate(currentStart.getDate() - (currentStart.getDay() === 0 ? 6 : currentStart.getDay() - 1));
  currentStart.setHours(0,0,0,0);

  // 2. Calculate Capacity
  const grossCap = db.me.team.reduce((sum, t) => sum + (t.hours * (t.utilisation / 100)), 0);

  // 3. Loop through weeks (Changed to 12 or 78 as per your requirement)
  for (let i = 0; i < 12; i++) {
    let weekStart = new Date(currentStart);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); 

    let w = {
      label: `Wk ${getWeekNumber(weekStart)} (${weekStart.getDate()}/${weekStart.getMonth()+1})`,
      cap: grossCap,
      npi: 0, imp: 0, tend: 0, other: 0, prod: 0
    };

    // ... Deduct Holidays and Add Task Load logic here ...

    weeks.push(w);
  }
  
  return weeks; // This is now correctly inside the function
}
