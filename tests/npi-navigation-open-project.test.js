const fs = require('fs')
const path = require('path')

describe('npi.nav.openProjectById duplicate resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    global.window = global
    global.db = {
      projects: [
        { id: 'proj-empty', product_id: 'product-1', name: 'Empty Copy' },
        { id: 'proj-rich', product_id: 'product-1', name: 'Rich Copy' }
      ]
    }
    global.progId = 'proj-empty'
    global.navigate = jest.fn()
    global.showToast = jest.fn()
    global.goHome = jest.fn()
    global.setApqpTab = jest.fn()
    global.setProductDevelopmentTab = jest.fn()
    global.prog = jest.fn(() => global.db.projects.find((project) => project.id === global.progId) || null)
    global.currentSection = 'projects'
    global.npiLoadedProgId = null
    global.injectNPIModals = jest.fn()
    global.createRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscriptionsMatching = jest.fn()

    const byTable = {
      npi_ctq: [{ project_id: 'proj-rich' }],
      npi_pfd_steps: [{ project_id: 'proj-rich' }],
      npi_bom_items: [{ project_id: 'proj-rich' }],
      npi_actions: [{ project_id: 'proj-rich' }],
      npi_risks: [{ project_id: 'proj-rich' }],
      npi_gates: [],
      npi_documents: []
    }

    global.supa = {
      from: jest.fn((table) => ({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({ data: byTable[table] || [], error: null })
        }))
      }))
    }

    const script = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi.js'),
      'utf8'
    )

    eval(script)
  })

  test('opens the duplicate project that has the most relational data', async () => {
    await npi.nav.openProjectById('proj-empty')

    expect(global.progId).toBe('proj-rich')
    expect(global.navigate).toHaveBeenCalledWith('project')
    expect(global.showToast).toHaveBeenCalledWith(
      'Opened the project copy that contains existing APQP/BoM data',
      'info',
      3500
    )
  })

  test('keeps requested project when no richer duplicate exists', async () => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }

    await npi.nav.openProjectById('proj-empty')

    expect(global.progId).toBe('proj-empty')
    expect(global.navigate).toHaveBeenCalledWith('project')
    expect(global.showToast).not.toHaveBeenCalled()
  })
})
