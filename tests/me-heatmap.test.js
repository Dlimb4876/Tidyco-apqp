import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Mocks needed before importing the module
global.canEdit = jest.fn(() => true)

// capRenderHeatmapTab uses getMonthLabel which is an ESM import — mock it at module level
// by providing a global shim that the module resolution will find in the jsdom env
// (cap-heatmap imports getMonthLabel from cap-utils.js which is a real function — no mock needed)

const {
  capRenderHeatmapTab,
  capDrawHeatmapNow,
  capOpenHeatmapDetail,
  capCloseHeatmapDetail
} = await import(
  resolve(__dirname, '../portals/capacity/shared/js/cap-heatmap.js')
)

const TEAM = [
  { id: 'p1', name: 'Alex Smith', startDate: '2026-01-01', hoursPerWeek: 37.5, utilisation: 80 }
]

describe('capRenderHeatmapTab()', () => {
  test('renders card shell with title', () => {
    const html = capRenderHeatmapTab('2026-03', [], [], [], [], 'ME')
    expect(typeof html).toBe('string')
    expect(html).toContain('TEAM UTILISATION HEAT MAP')
    expect(html).toContain('capHeatmapGrid')
  })

  test('renders a legend with all 5 bands plus No data', () => {
    const html = capRenderHeatmapTab('2026-03', [], [], [], [], 'ME')
    expect(html).toContain('Heatmap utilisation legend')
    expect(html).toContain('Clear')
    expect(html).toContain('Good')
    expect(html).toContain('Caution')
    expect(html).toContain('Near full')
    expect(html).toContain('Over')
    expect(html).toContain('No data')
  })

  test('includes click instruction in subtitle', () => {
    const html = capRenderHeatmapTab('2026-03', [], [], [], [], 'ME')
    expect(html).toContain('Click a cell to see task detail')
  })
})

describe('capDrawHeatmapNow()', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="capHeatmapGrid"></div>'
  })

  test('renders person row with cells', () => {
    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    const grid = document.getElementById('capHeatmapGrid')
    expect(grid.innerHTML).toContain('Alex Smith')
    const cells = grid.querySelectorAll('.me-heatmap-cell')
    expect(cells.length).toBe(26)
  })

  test('cells have click delegation attributes', () => {
    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    const cells = document.querySelectorAll('[data-cap-action="cap-me-heatmap-open"]')
    expect(cells.length).toBe(26)
    cells.forEach(cell => {
      expect(cell.getAttribute('data-member-id')).toBe('p1')
      expect(cell.getAttribute('data-start')).toBeTruthy()
      expect(cell.getAttribute('data-end')).toBeTruthy()
    })
  })

  test('highlights the current week column', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-10'))

    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    const todayHeaders = document.querySelectorAll('.me-heatmap-week-today')
    expect(todayHeaders.length).toBeGreaterThanOrEqual(1)
    const todayCells = document.querySelectorAll('.me-heatmap-cell-today')
    expect(todayCells.length).toBe(1)

    jest.useRealTimers()
  })

  test('skips members without a startDate', () => {
    capDrawHeatmapNow(
      [...TEAM, { id: 'p2', name: 'No Start' }],
      [], [], [], '2026-03'
    )
    expect(document.getElementById('capHeatmapGrid').innerHTML).not.toContain('No Start')
  })

  test('applies no-capacity class when capacity is zero', () => {
    const noWorkMember = [{ id: 'p1', name: 'Alex Smith', startDate: '2099-01-01', hoursPerWeek: 37.5, utilisation: 80 }]
    capDrawHeatmapNow(noWorkMember, [], [], [], '2026-03')
    const cells = document.querySelectorAll('.me-heatmap-no-capacity')
    expect(cells.length).toBe(26)
  })
})

describe('capOpenHeatmapDetail() and capCloseHeatmapDetail()', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="capHeatmapGrid"></div>'
  })

  test('open injects modal after draw context is set', () => {
    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    capOpenHeatmapDetail('p1', '2026-03-09', '2026-03-15')
    expect(document.getElementById('capHeatmapDetailModal')).not.toBeNull()
  })

  test('modal shows person name and week range', () => {
    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    capOpenHeatmapDetail('p1', '2026-03-09', '2026-03-15')
    const modal = document.getElementById('capHeatmapDetailModal')
    expect(modal.innerHTML).toContain('Alex Smith')
    expect(modal.innerHTML).toContain('utilised')
  })

  test('close removes the modal', () => {
    capDrawHeatmapNow(TEAM, [], [], [], '2026-03')
    capOpenHeatmapDetail('p1', '2026-03-09', '2026-03-15')
    expect(document.getElementById('capHeatmapDetailModal')).not.toBeNull()
    capCloseHeatmapDetail()
    expect(document.getElementById('capHeatmapDetailModal')).toBeNull()
  })

  test('open is safe when called without draw context (no crash)', () => {
    expect(() => capOpenHeatmapDetail('unknown', '2026-03-09', '2026-03-15')).not.toThrow()
  })
})
