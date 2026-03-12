/* ============================================================
   MeChart.jsx — Capacity Chart Tab (Fixed)
   ============================================================ */

const MeChart = ({ data }) => {
  const containerRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const chartInstanceRef = React.useRef(null);
  const lastDataRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current || !window.Chart || !containerRef.current) return;

    // Skip redraw if data hasn't really changed (to prevent constant redraws from polling)
    const dataStr = JSON.stringify({
      team: (data.team || []).length,
      tasks: (data.tasks || []).length,
      products: (data.products || []).length,
      holidays: (data.holidays || []).length
    });

    if (lastDataRef.current === dataStr && chartInstanceRef.current) {
      return;
    }
    lastDataRef.current = dataStr;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const monthKeys = meGetMonthRangeReact(currentMonthKey, 6);
    const monthLabels = monthKeys.map(m => meGetMonthLabelReact(m).join(' '));

    const capacityData = [];
    const demandData = [];

    monthKeys.forEach(monthKey => {
      const monthData = meCalculateMonthDataReact(monthKey, data.team || [], data.tasks || [], data.products || [], data.holidays || []);
      capacityData.push(monthData.capacity);
      demandData.push(monthData.totalDemand);
    });

    // Destroy existing chart
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    }

    try {
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
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 12 }, padding: 12 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 11 } }
            },
            x: {
              ticks: { font: { size: 11 } }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }

    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying chart on cleanup:', e);
        }
      }
    };
  }, [data.team, data.tasks, data.products, data.holidays]);

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

      <div className="me-card" ref={containerRef} style={{ position: 'relative', height: '400px', width: '100%' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};
