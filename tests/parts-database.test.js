const fs = require('fs')
const path = require('path')

describe('Parts Database picker ownership', () => {
  beforeEach(() => {
    jest.resetModules()
    document.body.innerHTML = '<div id="host"></div>'

    global.window = global
    global.currentSection = 'product-development'
    global.productDevelopmentTab = 'parts-database'
    global.npiDashboardTab = 'projects'
    global.abcCatalogueData = []
    global.abcCatalogueLoading = false
    global.abcCatalogueLoaded = false
    global.abcCatalogueSearch = ''
    global.abcCatalogueClassFilter = 'all'
    global.abcEditTarget = null
    global.abcPickTarget = null
    global.abcPickResults = []
    global.abcPickLoading = false
    global.abcPickSearch = ''
    global.abcPickClassFilter = 'all'
    global.abcPickSelected = []

    global.esc = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;')

    global.showModal = jest.fn()
    global.closeModal = jest.fn()
    global.showToast = jest.fn()
    global.canEdit = jest.fn(() => true)
    global.createRealtimeSubscription = jest.fn()
    global.removeRealtimeSubscription = jest.fn()
    global.render = jest.fn()

    global.partsDatabase = {
      data: {
        fetchCatalogue: jest.fn().mockResolvedValue([
          { id: 'part-1', pn: 'PN-1', item_desc: 'Bolt', unit: 'ea', abc_class: 'A', in_sage: true, notes: 'critical' },
          { id: 'part-2', pn: 'PN-2', item_desc: 'Nut', unit: 'ea', abc_class: 'C', in_sage: false, notes: '' }
        ])
      }
    }

    const modalsScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/parts-database/js/parts-modals.js'),
      'utf8'
    )

    const subsystemScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/parts-database/js/parts-database.js'),
      'utf8'
    )

    eval(modalsScript)
    eval(subsystemScript)
  })

  test('standalone parts subsystem opens the picker and confirms selected rows', async () => {
    const onConfirm = jest.fn()

    await window.partsDatabase.openPick({
      getAlreadyAddedIds: () => new Set(['part-2']),
      onConfirm
    })

    expect(window.partsDatabase.data.fetchCatalogue).toHaveBeenCalled()
    expect(document.getElementById('abcPickList').textContent).toContain('Bolt')
    expect(document.getElementById('abcPickList').textContent).toContain('Already in BOM')

    window.partsDatabase.togglePick(0)

    await window.partsDatabase.confirmPick()

    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'part-1', item_desc: 'Bolt' })
    ])
    expect(global.closeModal).toHaveBeenCalledWith('modalABCPick')
  })
})