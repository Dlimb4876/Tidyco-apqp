const fs = require('fs')
const path = require('path')

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

    global.render = jest.fn(() => {
      const mount = document.getElementById('mount')
      if (!mount) return
      mount.innerHTML = '<input class="npi-search-input" name="npi_projects_search" type="search" value="alpha">'
    })

    const script = fs.readFileSync(
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
