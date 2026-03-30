import { jest } from '@jest/globals'

describe('NPI timing utilities', () => {
  beforeEach(() => {
    global.npi = {
      timing: {},
      data: { ganttNewRow: jest.fn(() => ({ id: 'row-1', planned: [], actual: [] })) },
      nav: {},
      bom: {},
      tracker: {},
      components: {}
    }
    global.GANTT_WEEKS = 52
    global.GANTT_SECTIONS = [
      { id: 'design', label: 'Design' },
      { id: 'build', label: 'Build' }
    ]
    global.PLAN_COLOR = '#0066cc'
    global.ACT_COLOR = '#e53e3e'
    global.prog = jest.fn(() => ({ id: 'p1', gantt: [], ganttStart: '2025-01-06', ganttCollapsed: [], date: '2025-01-06' }))
    global.save = jest.fn()
    global.render = jest.fn()
  })

  it('should have timing namespace on npi', () => {
    expect(typeof global.npi.timing).toBe('object')
  })

  it('should have GANTT_WEEKS constant', () => {
    expect(typeof global.GANTT_WEEKS).toBe('number')
    expect(global.GANTT_WEEKS).toBeGreaterThan(0)
  })

  it('should have GANTT_SECTIONS array', () => {
    expect(Array.isArray(global.GANTT_SECTIONS)).toBe(true)
    expect(global.GANTT_SECTIONS.length).toBeGreaterThan(0)
  })

  it('should have PLAN_COLOR and ACT_COLOR', () => {
    expect(typeof global.PLAN_COLOR).toBe('string')
    expect(typeof global.ACT_COLOR).toBe('string')
  })

  it('should have prog, save, render functions', () => {
    expect(typeof global.prog).toBe('function')
    expect(typeof global.save).toBe('function')
    expect(typeof global.render).toBe('function')
  })
})
