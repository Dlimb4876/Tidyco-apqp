import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadNpiModule() {
  const script = readFileSync(
    path.resolve(__dirname, '../portals/product-development/npi/js/npi.js'),
    'utf8'
  )

  const strippedImports = script.replace(/^import\s+.*$/gm, '')
  const cjsReady = strippedImports
    .replace(/^export const npiDataInit =/m, 'const npiDataInit =')
    .replace(/^export \{ renderNpi, renderNpiSection \}/m, '')
    .replace(/export async function /g, 'async function ')
    .replace(/export function /g, 'function ')

  eval(`${cjsReady}
    ;globalThis.__npiModuleExports = {
      initNpi,
      cleanupNpi,
      npiDataSubscribe,
      npiDataUnsubscribe,
      npiDataInit,
      npiEnsureProductProjects
    }
  `)
  return globalThis.__npiModuleExports
}

describe('npi.nav.openProjectById duplicate resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    global.window = global
    global.appState = {
      progId: 'proj-empty',
      currentSection: 'projects',
      apqpTab: 'ctq',
      npiLoadedProgId: null
    }
    global.db = {
      projects: [
        { id: 'proj-empty', product_id: 'product-1', name: 'Empty Copy' },
        { id: 'proj-rich', product_id: 'product-1', name: 'Rich Copy' }
      ]
    }
    global.currentUser = { id: 'u1', email: 'u1@tidyco.co.uk' }
    global.navigate = jest.fn()
    global.showToast = jest.fn()
    global.goHome = jest.fn()
    global.render = jest.fn()
    global.setApqpTab = jest.fn()
    global.setProductDevelopmentTab = jest.fn()
    global.prog = jest.fn(() => global.db.projects.find((project) => project.id === global.appState.progId) || null)
    global.injectNPIModals = jest.fn()
    global.createRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscriptionsMatching = jest.fn()
    global.requestRender = jest.fn()
    global.npiRelLoad = jest.fn(() => Promise.resolve())
    global.migrateprog = jest.fn((project) => project)
    global.initNpiEvents = jest.fn()
    global.setupNpiEvents = jest.fn()
    global.teardownNpiEvents = jest.fn()
    global.initNpiOrchestrator = jest.fn()
    global.cleanupNpiOrchestrator = jest.fn()
    global.renderNpi = jest.fn(() => '')
    global.renderNpiSection = jest.fn(() => '')
    global.ensureProductProjects = jest.fn()

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
    global.npi = { nav: {}, dashboard: {}, events: {} }
    loadNpiModule()
  })

  test('opens the duplicate project that has the most relational data', async () => {
    await npi.nav.openProjectById('proj-empty')

    expect(global.appState.progId).toBe('proj-rich')
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

    expect(global.appState.progId).toBe('proj-empty')
    expect(global.navigate).toHaveBeenCalledWith('project')
    expect(global.showToast).not.toHaveBeenCalled()
  })
})
