const fs = require('fs')
const path = require('path')

describe('shared capacity product tables', () => {
  beforeEach(() => {
    jest.resetModules()
    document.body.innerHTML = '<div id="root"></div>'

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    global.escapeHtml = global.esc

    global.findFamilyRecord = jest.fn((family) => ({ label: family }))
    global.getFamilies = jest.fn(() => [{ id: 'Family A', label: 'Family A' }])
    global.productsDataGetAll = jest.fn(() => [{ id: 'db-1', name: 'Valve', family: 'Family A' }])
    global.meRefreshCurrentTab = jest.fn()
    global.logRefreshCurrentTab = jest.fn()
    global.unit6RefreshCurrentTab = jest.fn()
    global.pmRefreshCurrentTab = jest.fn()
    global.meDebouncedSave = jest.fn()
    global.logDebouncedSave = jest.fn()
    global.pmDebouncedSave = jest.fn()
    global.unit6DebouncedSave = jest.fn()
    global.meDataGetProductSupportHistory = jest.fn(() => [])
    global.pmDataGetProductSupportHistory = jest.fn(() => [])
    global.logDataGetProductSupportHistory = jest.fn(() => [{
      id: 'hist-1',
      productId: 'p1',
      effectiveDate: '2026-02-01',
      hoursPerWeek: 2.5,
      kittingHours: 1.5,
      bookingInOutHours: 0.5,
      productMovementHours: 0.5,
      changeReason: 'Baseline'
    }])
    global.meDataGetProducts = jest.fn(() => [{ id: 'p1', name: 'Valve', productDatabaseId: 'db-1', hoursPerWeek: 2.5 }])
    global.logDataGetProducts = jest.fn(() => [{ id: 'p1', name: 'Valve', productDatabaseId: 'db-1', hoursPerWeek: 2.5, kittingHours: 1.5, bookingInOutHours: 0.5, productMovementHours: 0.5 }])
    global.logDataUpdateProduct = jest.fn()
    global.pmDataUpdateProduct = jest.fn()
    global.meDataUpdateProduct = jest.fn()
    global.unit6DataUpdateProduct = jest.fn()
    global.logDataUpdateProductSupportHistoryEntry = jest.fn()

    const supportScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/shared/js/cap-products.js'),
      'utf8'
    )
    const loadScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/capacity/shared/js/cap-product-taskload.js'),
      'utf8'
    )

    eval(supportScript) // eslint-disable-line no-eval
    eval(loadScript) // eslint-disable-line no-eval
  })

  test('renders shared product support rows instead of the legacy placeholder', () => {
    const html = window.capRenderProductsTab([
      { id: 'p1', name: 'Valve', productDatabaseId: 'db-1', hoursPerWeek: 2.5 }
    ], [], 'PM', window.capProductsTableState.PM)

    expect(html).toContain('PRODUCTS / ONGOING SUPPORT')
    expect(html).toContain('Valve')
    expect(html).toContain('Hours / Batch')
    expect(html).not.toContain('legacy capacity renderer')
  })

  test('stores drafts using product, db, and row keys and can reopen history rows', () => {
    window.capProductsSetDraftValue('LOG', 'p1', 0, { hoursPerWeek: '3.5' }, 'db-1')
    window.capProductsToggleHistory('p1', 'LOG')

    expect(window.capProductsGetDraftValue('LOG', 'p1', 0, 'db-1')).toEqual({ hoursPerWeek: '3.5' })
    expect(window.capProductsTableState.LOG.historyOpenProductIds).toContain('p1')
    expect(global.logRefreshCurrentTab).toHaveBeenCalled()
  })

  test('renders logistics split support inputs and history rows', () => {
    window.capProductsToggleHistory('p1', 'LOG')

    const html = window.capRenderProductsTab([
      { id: 'p1', name: 'Valve', productDatabaseId: 'db-1', hoursPerWeek: 2.5, kittingHours: 1.5, bookingInOutHours: 0.5, productMovementHours: 0.5 }
    ], [], 'LOG', window.capProductsTableState.LOG)

    expect(html).toContain('Kitting')
    expect(html).toContain('Booking In/Out')
    expect(html).toContain('Product Movement')
    expect(html).toContain('Hide History')
    expect(html).toContain('Baseline')
  })

  test('bulk save pushes draft updates into the active department API', () => {
    window.capProductsSetDraftValue('LOG', 'p1', 0, {
      hoursPerWeek: '4',
      kittingHours: '2',
      bookingInOutHours: '1',
      productMovementHours: '1',
      supportEffectiveDate: '2026-03-01',
      supportChangeReason: 'Rate update'
    }, 'db-1')

    window.capProductsBulkSaveChanges('LOG')

    expect(global.logDataUpdateProduct).toHaveBeenCalledWith(0, 'hoursPerWeek', '4', {
      effectiveDate: '2026-03-01',
      changeReason: 'Rate update',
      kittingHours: 2,
      bookingInOutHours: 1,
      productMovementHours: 1
    })
    expect(global.logDebouncedSave).toHaveBeenCalled()
  })

  test('renders shared product-load analysis instead of the legacy placeholder', () => {
    global.capGetProductBatchCountInRange = jest.fn(() => 2)

    const html = window.capRenderProductTaskLoadTab([
      { id: 't1', productId: 'p1', totalHours: 6 }
    ], [
      { id: 'p1', name: 'Valve', productDatabaseId: 'db-1', hoursPerWeek: 3 }
    ], 'UNIT6', window.capProductLoadTableState.UNIT6)

    expect(html).toContain('PRODUCT TASK LOAD ANALYSIS')
    expect(html).toContain('Valve')
    expect(html).toContain('Support / Month')
    expect(html).not.toContain('legacy capacity renderer')
  })
})
