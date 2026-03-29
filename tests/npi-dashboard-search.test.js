import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('NPI dashboard search input behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    document.body.innerHTML = '<div id="mount"></div>'

    global.npi = { dashboard: {} }
    global.currentUser = null
    global.productsDataGetAll = jest.fn(() => [])
    global.getFamilies = jest.fn(() => [])
    global.db = { projects: [] }
    global.esc = (v) => String(v ?? '')

    // Mock NPI Projects Dashboard filter state (for URL persistence)
    global.npiTab = 'all'
    global.npiProjectsSearch = ''
    global.npiProjectsFamilyFilter = 'all'
    global.npiProjectsStatusFilter = 'all'
    global.npiProjectsViewMode = 'active'
    global.writeNavigationHistory = jest.fn()

    global.render = jest.fn(() => {
      const mount = document.getElementById('mount')
      if (!mount) return
      mount.innerHTML = '<input class="npi-search-input" name="npi_projects_search" type="search" value="alpha">'
    })

    const script = readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/dashboard.js'),
      'utf8'
    )

    eval(script)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('setProjectsSearchFromInput restores focus and caret after render', () => {
    render()
    render.mockClear()

    const input = document.querySelector('.npi-search-input')
    input.value = 'alpha'
    input.setSelectionRange(2, 2)

    npi.dashboard.setProjectsSearchFromInput(input)

    expect(render).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers()

    const nextInput = document.querySelector('.npi-search-input')
    expect(document.activeElement).toBe(nextInput)
    expect(nextInput.selectionStart).toBe(2)
    expect(nextInput.selectionEnd).toBe(2)
  })
})

describe('NPI dashboard ensureProductProjects hydration', () => {
  beforeEach(() => {
    global.npi = { dashboard: {} }
    global.db = { projects: [] }
    global.productsDataGetAll = jest.fn(() => [
      { id: 'prod-1', name: 'Product 1', family: 'FAM', customer: 'ACME', code: 'P1' },
      { id: 'prod-2', name: 'Product 2', family: 'FAM', customer: 'ACME', code: 'P2' }
    ])
    global.projectsAllLoaded = false
    global.render = jest.fn()
    global.save = jest.fn()
    global.findProjectByProductId = jest.fn((productId) => {
      return global.db.projects.find((project) => project.product_id === productId) || null
    })
    global.normalizeFamilyId = jest.fn((value) => value || 'Other')
    global.rowToProject = jest.fn((row) => ({
      id: row.prog_id,
      product_id: row.product_id,
      name: row.name
    }))
    global.migrateprog = jest.fn((project) => project)

    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({
            data: [
              { id: 'db-2', prog_id: 'p_db_2', product_id: 'prod-2', name: 'Hydrated Product 2' }
            ],
            error: null
          })
        }))
      }))
    }

    const script = readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/dashboard.js'),
      'utf8'
    )

    eval(script)
  })

  test('hydrates missing projects from Supabase when project paging is partial', async () => {
    global.db.projects = [{ id: 'p_existing', product_id: 'prod-1', name: 'Product 1' }]

    npi.dashboard.ensureProductProjects()

    await Promise.resolve()
    await Promise.resolve()

    expect(global.supa.from).toHaveBeenCalledWith('projects')
    expect(global.db.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'p_existing', product_id: 'prod-1' }),
        expect.objectContaining({ id: 'p_db_2', product_id: 'prod-2', name: 'Hydrated Product 2' })
      ])
    )
    expect(global.save).not.toHaveBeenCalled()
  })

  test('does not trigger duplicate hydration requests while one is in flight', () => {
    npi.dashboard._missingProjectHydrationInFlight = true

    npi.dashboard.ensureProductProjects()

    expect(global.supa.from).not.toHaveBeenCalled()
  })
})
