/* ============================================================
   MeChart.jsx — Capacity Chart Tab
   ============================================================ */

const MeChart = ({ data }) => {
  const canvasRef = React.useRef(null);
  const chartInstanceRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const monthKeys = meGetMonthRangeReact(currentMonthKey, 6);
    const monthLabels = monthKeys.map(m => meGetMonthLabelReact(m).join(' '));

    const capacityData = [];
    const demandData = [];

    monthKeys.forEach(monthKey => {
      const monthData = meCalculateMonthDataReact(monthKey, data.team, data.tasks, data.products, data.holidays);
      capacityData.push(monthData.capacity);
      demandData.push(monthData.totalDemand);
    });

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Demand',
            data: demandData,
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1,
            borderRadius: 3,
            barPercentage: 0.7,
            order: 2
          },
          {
            label: 'Capacity',
            data: capacityData,
            type: 'line',
            borderColor: '#1e40af',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#1e40af',
            fill: false,
            tension: 0.3,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11 }, padding: 8 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '16px 0',
        borderBottom: '1px solid var(--line)'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>6-Month Capacity Forecast</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Supply vs. Demand over the next 6 months
          </div>
        </div>
      </div>

      <div className="me-card" style={{ height: '400px' }}>
        <canvas ref={canvasRef} height="400"></canvas>
      </div>
    </div>
  );
};
