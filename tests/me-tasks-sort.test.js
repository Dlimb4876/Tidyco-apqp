import { jest } from '@jest/globals'

const { capTasksSortBy, capGetSortIcon, capRenderTasksTab } = await import('../portals/capacity/shared/js/cap-tasks.js')

describe('Task sorting', () => {
  it('should export capTasksSortBy function', () => {
    expect(typeof capTasksSortBy).toBe('function')
  })

  it('should export capGetSortIcon function', () => {
    expect(typeof capGetSortIcon).toBe('function')
  })

  it('capTasksSortBy should toggle sort direction', () => {
    const initialIcon = capGetSortIcon('name', 'ME')
    capTasksSortBy('name', 'ME')
    const afterClick = capGetSortIcon('name', 'ME')
    expect(initialIcon).not.toBe(afterClick)
  })

  it('capGetSortIcon should return valid sort indicator', () => {
    const icon = capGetSortIcon('name', 'ME')
    expect(typeof icon).toBe('string')
    expect(['↕', '↑', '↓']).toContain(icon)
  })

  it('capGetSortIcon should return different icons for different columns', () => {
    capTasksSortBy('name', 'ME')
    const nameIcon = capGetSortIcon('name', 'ME')
    const hoursIcon = capGetSortIcon('hours', 'ME')
    expect(nameIcon).not.toBe(hoursIcon)
  })

  it('renders searchable product picker in tasks add row', () => {
    const html = capRenderTasksTab(
      [],
      [],
      [{ id: 'p1', name: 'Alpha Pump' }, { id: 'p2', name: 'Beta Valve' }],
      'ME',
      { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: false },
      { column: '', direction: 'asc' },
      true
    )
    expect(html).toContain('data-cap-action="cap-task-product-input"')
    expect(html).toContain('name="task_productId" data-task-field="productId"')
    expect(html).toContain('id="cap-task-products-ME"')
  })
})
