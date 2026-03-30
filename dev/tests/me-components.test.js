import { jest } from '@jest/globals'

const {
  renderKPIStrip,
  renderMonthPicker,
  renderTableHeader,
  renderEditableCell,
  renderStatusBadge,
  renderEmptyState,
  renderCard,
  renderSkeleton
} = await import('../portals/capacity/shared/js/cap-components.js')

describe('Capacity component renderers', () => {
  it('should export renderKPIStrip function', () => {
    expect(typeof renderKPIStrip).toBe('function')
  })

  it('should export renderMonthPicker function', () => {
    expect(typeof renderMonthPicker).toBe('function')
  })

  it('should export renderTableHeader function', () => {
    expect(typeof renderTableHeader).toBe('function')
  })

  it('should export renderEditableCell function', () => {
    expect(typeof renderEditableCell).toBe('function')
  })

  it('should export renderStatusBadge function', () => {
    expect(typeof renderStatusBadge).toBe('function')
  })

  it('should export renderEmptyState function', () => {
    expect(typeof renderEmptyState).toBe('function')
  })

  it('should export renderCard function', () => {
    expect(typeof renderCard).toBe('function')
  })

  it('should export renderSkeleton function', () => {
    expect(typeof renderSkeleton).toBe('function')
  })

  it('renderKPIStrip should return HTML string', () => {
    const html = renderKPIStrip([])
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('renderStatusBadge should return HTML string', () => {
    const html = renderStatusBadge('active')
    expect(typeof html).toBe('string')
  })

  it('renderEmptyState should return HTML string', () => {
    const html = renderEmptyState('No items', 'Add one')
    expect(typeof html).toBe('string')
  })
})
