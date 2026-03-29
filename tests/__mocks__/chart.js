// Mock for chart.js
export const Chart = jest.fn(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  data: { datasets: [] },
  options: { scales: { x: {}, y: {} }, plugins: { legend: {} } }
}))

Chart.defaults = {
  color: '#000',
  borderColor: '#ccc'
}

export default Chart
