import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
global.canEdit = jest.fn(() => true)

// Import the module (ESM exports)
const { capToggleHoliday, capRenderHolidaysTab } = await import(
  resolve(__dirname, '../portals/capacity/shared/js/cap-holidays.js')
)

describe('capToggleHoliday()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.addHoliday = jest.fn()
    global.updateHoliday = jest.fn()
    global.deleteHoliday = jest.fn()
  })

  test('adds a full-day holiday when no holiday exists', () => {
    capToggleHoliday('pm-1', '2026-03-18', [], addHoliday, updateHoliday, deleteHoliday)

    expect(global.addHoliday).toHaveBeenCalledWith('pm-1', '2026-03-18', 'full')
    expect(global.updateHoliday).not.toHaveBeenCalled()
    expect(global.deleteHoliday).not.toHaveBeenCalled()
  })

  test('changes a full-day holiday to half-day on second toggle', () => {
    capToggleHoliday(
      'log-1',
      '2026-03-19',
      [{ personId: 'log-1', date: '2026-03-19', type: 'full' }],
      addHoliday,
      updateHoliday,
      deleteHoliday
    )

    expect(global.updateHoliday).toHaveBeenCalledWith('log-1', '2026-03-19', 'half')
  })

  test('removes a half-day holiday on third toggle', () => {
    capToggleHoliday(
      'u6-1',
      '2026-03-20',
      [{ personId: 'u6-1', date: '2026-03-20', type: 'half' }],
      addHoliday,
      updateHoliday,
      deleteHoliday
    )

    expect(global.deleteHoliday).toHaveBeenCalledWith('u6-1', '2026-03-20')
  })
})

describe('capRenderHolidaysTab()', () => {
  test('renders without crashing (checks for missing semicolon bug)', () => {
    const holidaysArray = []
    const teamArray = [{ id: '1', name: 'John Doe' }]
    const monthKey = '2026-03'
    const department = 'ME'
    const bankHolidays = []
    const canEditFlag = true

    // This should NOT throw "TypeError: "" is not a function"
    const html = capRenderHolidaysTab(
      holidaysArray,
      teamArray,
      monthKey,
      department,
      bankHolidays,
      canEditFlag
    )

    expect(typeof html).toBe('string')
    expect(html).toContain('HOLIDAY PLANNER')
    expect(html).toContain('John Doe')
  })
})
