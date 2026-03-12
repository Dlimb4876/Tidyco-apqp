/* ============================================================
   useMeData.js — Custom React Hook
   Bridges React state with vanilla meDataState
   ============================================================ */

const useMeData = () => {
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch data from vanilla meDataState (global functions)
    if (typeof meDataGetTeam === 'function') {
      setData({
        team: meDataGetTeam(),
        tasks: meDataGetTasks(),
        products: meDataGetProducts(),
        holidays: meDataGetHolidays()
      });
      setIsLoading(false);
    }
  }, []);

  // Poll vanilla meDataState every 1s for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (typeof meDataGetTeam === 'function') {
        setData({
          team: meDataGetTeam(),
          tasks: meDataGetTasks(),
          products: meDataGetProducts(),
          holidays: meDataGetHolidays()
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { data: data || { team: [], tasks: [], products: [], holidays: [] }, isLoading };
};
