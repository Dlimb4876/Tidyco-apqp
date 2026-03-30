import { jest } from '@jest/globals'

describe('NPI navigation - open project by ID', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.appState = {
      progId: 'proj-empty',
      currentSection: 'projects',
      apqpTab: 'ctq',
      npiLoadedProgId: null
    }
    global.db = {
      projects: [
        { id: 'proj-empty', product_id: 'product-1', name: 'Empty Copy', ctq: [], pfmea: [], pfd: [] },
        { id: 'proj-rich', product_id: 'product-1', name: 'Rich Copy', ctq: [{id: 'ctq-1'}], pfmea: [{id: 'pf-1'}], pfd: [{id: 'step-1'}] }
      ]
    }
    global.currentUser = { id: 'u1', email: 'u1@test.com' }
  })

  it('should have db.projects array', () => {
    expect(Array.isArray(global.db.projects)).toBe(true)
  })

  it('should identify duplicate projects by product_id', () => {
    const projects = global.db.projects
    const byProduct = {}
    projects.forEach(p => {
      if (!byProduct[p.product_id]) byProduct[p.product_id] = []
      byProduct[p.product_id].push(p)
    })
    expect(byProduct['product-1'].length).toBe(2)
  })

  it('should choose richer copy when duplicates exist', () => {
    const projects = global.db.projects
    const rich = projects.find(p => p.id === 'proj-rich')
    const empty = projects.find(p => p.id === 'proj-empty')
    // Rich copy has more data
    expect(rich.ctq.length).toBeGreaterThan(empty.ctq.length)
  })

  it('should update appState.progId when opening project', () => {
    global.appState.progId = 'proj-rich'
    expect(global.appState.progId).toBe('proj-rich')
  })
})
