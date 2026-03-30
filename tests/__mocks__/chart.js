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

// Export Chart.js controller and element classes used by main.js
export const BarController = jest.fn()
export const BarElement = jest.fn()
export const LineController = jest.fn()
export const LineElement = jest.fn()
export const PointElement = jest.fn()
export const LinearScale = jest.fn()
export const CategoryScale = jest.fn()
export const Tooltip = jest.fn()
export const Legend = jest.fn()

// Add register method to Chart
Chart.register = jest.fn()

export default Chart
