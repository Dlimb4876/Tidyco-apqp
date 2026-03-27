const fs = require('fs')
const path = require('path')

describe('capacity events production work area', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.render = jest.fn()
    global.prodCapSetWorkArea = jest.fn()
  })

  test('cap-prod-set-workarea calls setter and renders', () => {
    const button = document.createElement('button')
    button.setAttribute('data-cap-action', 'cap-prod-set-workarea')
    button.setAttribute('data-workarea', 'Unit 3')
    document.body.appendChild(button)

    window.capacityEvents._onClick({ target: button })

    expect(global.prodCapSetWorkArea).toHaveBeenCalledWith('Unit 3')
    expect(global.render).toHaveBeenCalled()
  })
})

describe('capacity events task search', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    window.capTasksFilters = { ME: { search: '' }, PM: { search: '' }, LOG: { search: '' }, UNIT6: { search: '' } }
    global.meSetTab = jest.fn()
    global.pmSetTab = jest.fn()
  })

  test('cap-task-search keeps focus and caret after ME re-render', async () => {
    document.body.innerHTML = `
      <div data-cap-context="me">
        <input type="text" data-cap-action="cap-task-search" value="">
      </div>
    `

    global.meSetTab = jest.fn(() => {
      document.body.innerHTML = `
        <div data-cap-context="me">
          <input type="text" data-cap-action="cap-task-search" value="${window.capTasksFilters.ME.search}">
        </div>
      `
    })

    const input = document.querySelector('[data-cap-action="cap-task-search"]')
    input.value = 'abc'
    input.focus()
    input.setSelectionRange(2, 2)

    window.capacityEvents._onInput({ target: input })

    expect(window.capTasksFilters.ME.search).toBe('abc')
    expect(global.meSetTab).toHaveBeenCalledWith('tasks')

    await new Promise(resolve => setTimeout(resolve, 0))

    const replacement = document.querySelector('[data-cap-action="cap-task-search"]')
    expect(document.activeElement).toBe(replacement)
    expect(replacement.selectionStart).toBe(2)
    expect(replacement.selectionEnd).toBe(2)
  })

  test('cap-task-search updates PM filters and refreshes PM tasks tab', () => {
    document.body.innerHTML = `
      <div data-cap-context="pm">
        <input type="text" data-cap-action="cap-task-search" value="">
      </div>
    `

    global.pmSetTab = jest.fn(() => {
      document.body.innerHTML = `
        <div data-cap-context="pm">
          <input type="text" data-cap-action="cap-task-search" value="${window.capTasksFilters.PM.search}">
        </div>
      `
    })

    const input = document.querySelector('[data-cap-action="cap-task-search"]')
    input.value = 'gate'

    window.capacityEvents._onInput({ target: input })

    expect(window.capTasksFilters.PM.search).toBe('gate')
    expect(global.pmSetTab).toHaveBeenCalledWith('tasks')
    expect(global.meSetTab).not.toHaveBeenCalled()
  })
})

describe('capacity events task disable toggle', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.meDataUpdateTask = jest.fn()
    global.pmDataUpdateTask = jest.fn()
    global.logDataUpdateTask = jest.fn()
    global.meDebouncedSave = jest.fn()
    global.pmDebouncedSave = jest.fn()
    global.logDebouncedSave = jest.fn()
    global.meSetTab = jest.fn()
    global.pmSetTab = jest.fn()
    global.logSetTab = jest.fn()
  })

  test('cap-task-toggle-disabled updates task and refreshes ME tasks tab', () => {
    document.body.innerHTML = `
      <div data-cap-context="me">
        <div data-task-idx="1"><input type="checkbox" data-cap-action="cap-task-toggle-disabled"></div>
      </div>
    `

    const input = document.querySelector('[data-cap-action="cap-task-toggle-disabled"]')
    input.checked = true

    window.capacityEvents._onChange({ target: input })

    expect(global.meDataUpdateTask).toHaveBeenCalledWith(1, 'isDisabled', true)
    expect(global.meDebouncedSave).toHaveBeenCalled()
    expect(global.meSetTab).toHaveBeenCalledWith('tasks')
    expect(global.pmDebouncedSave).not.toHaveBeenCalled()
  })

  test('cap-task-toggle-disabled uses PM save flow in PM context', () => {
    document.body.innerHTML = `
      <div data-cap-context="pm">
        <div data-task-idx="2"><input type="checkbox" data-cap-action="cap-task-toggle-disabled"></div>
      </div>
    `

    const input = document.querySelector('[data-cap-action="cap-task-toggle-disabled"]')
    input.checked = false

    window.capacityEvents._onChange({ target: input })

    expect(global.pmDataUpdateTask).toHaveBeenCalledWith(2, 'isDisabled', false)
    expect(global.pmDebouncedSave).toHaveBeenCalled()
    expect(global.pmSetTab).toHaveBeenCalledWith('tasks')
    expect(global.meDataUpdateTask).not.toHaveBeenCalled()
  })

  test('cap-task-toggle-disabled uses Logistics save flow in LOG context', () => {
    document.body.innerHTML = `
      <div data-cap-context="log">
        <div data-task-idx="3"><input type="checkbox" data-cap-action="cap-task-toggle-disabled"></div>
      </div>
    `

    const input = document.querySelector('[data-cap-action="cap-task-toggle-disabled"]')
    input.checked = true

    window.capacityEvents._onChange({ target: input })

    expect(global.logDataUpdateTask).toHaveBeenCalledWith(3, 'isDisabled', true)
    expect(global.logDebouncedSave).toHaveBeenCalled()
    expect(global.logSetTab).toHaveBeenCalledWith('tasks')
    expect(global.meDataUpdateTask).not.toHaveBeenCalled()
  })
})

describe('capacity events product search', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.meProductsSetSearch = jest.fn()
  })

  test('cap-products-search keeps focus and caret after Product Support re-render', async () => {
    document.body.innerHTML = `
      <div data-cap-context="me">
        <input type="text" data-cap-action="cap-products-search" data-dept="ME" value="">
      </div>
    `

    global.meProductsSetSearch = jest.fn((value) => {
      document.body.innerHTML = `
        <div data-cap-context="me">
          <input type="text" data-cap-action="cap-products-search" data-dept="ME" value="${value}">
        </div>
      `
    })

    const input = document.querySelector('[data-cap-action="cap-products-search"]')
    input.value = 'pump'
    input.focus()
    input.setSelectionRange(4, 4)

    window.capacityEvents._onInput({ target: input })

    expect(global.meProductsSetSearch).toHaveBeenCalledWith('pump', 'ME')

    await new Promise(resolve => setTimeout(resolve, 0))

    const replacement = document.querySelector('[data-cap-action="cap-products-search"]')
    expect(document.activeElement).toBe(replacement)
    expect(replacement.selectionStart).toBe(4)
    expect(replacement.selectionEnd).toBe(4)
  })

  test('cap-product-load-search keeps focus and caret after Product Load re-render', async () => {
    document.body.innerHTML = `
      <div data-cap-context="me">
        <input type="text" data-cap-action="cap-product-load-search" data-dept="ME" value="">
      </div>
    `

    global.meProductLoadSetSearch = jest.fn((value) => {
      document.body.innerHTML = `
        <div data-cap-context="me">
          <input type="text" data-cap-action="cap-product-load-search" data-dept="ME" value="${value}">
        </div>
      `
    })

    const input = document.querySelector('[data-cap-action="cap-product-load-search"]')
    input.value = 'pump'
    input.focus()
    input.setSelectionRange(3, 3)

    window.capacityEvents._onInput({ target: input })

    expect(global.meProductLoadSetSearch).toHaveBeenCalledWith('pump', 'ME')

    await new Promise(resolve => setTimeout(resolve, 0))

    const replacement = document.querySelector('[data-cap-action="cap-product-load-search"]')
    expect(document.activeElement).toBe(replacement)
    expect(replacement.selectionStart).toBe(3)
    expect(replacement.selectionEnd).toBe(3)
  })
})

describe('capacity events product support drafts', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.meProductsSetDraftValue = jest.fn()
    global.meProductsClearDraft = jest.fn()
    global.logDataGetProducts = jest.fn(() => [
      { id: 'log-1', supportEffectiveDate: '2026-01-01' }
    ])
    global.logDataUpdateProduct = jest.fn()
    global.logRefreshCurrentTab = jest.fn()
    global.logDebouncedSave = jest.fn()
    global.alert = jest.fn()
    global.confirm = jest.fn(() => true)
  })

  test('cap-products-draft stores Logistics split-field edits and recomputes Hours/Batch on input', () => {
    document.body.innerHTML = `
      <div data-cap-context="log">
        <table>
          <tbody>
            <tr data-product-idx="0" data-product-id="log-1">
              <td><input data-cap-action="cap-products-draft" data-field="kittingHours" value="1.5"></td>
              <td><input data-cap-action="cap-products-draft" data-field="bookingInOutHours" value="0.25"></td>
              <td><input data-cap-action="cap-products-draft" data-field="productMovementHours" value="0.5"></td>
              <td><input data-field="hoursPerWeek" value="0" readonly></td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    const input = document.querySelector('[data-field="bookingInOutHours"]')
    input.value = '0.75'

    window.capacityEvents._onInput({ target: input })

    expect(global.meProductsSetDraftValue).toHaveBeenCalledWith('LOG', 'log-1', 0, {
      kittingHours: '1.5',
      bookingInOutHours: '0.75',
      productMovementHours: '0.5',
      hoursPerWeek: '2.75'
    })
    expect(document.querySelector('[data-field="hoursPerWeek"]').value).toBe('2.75')
  })

  test('cap-products-apply-hours clears the matching draft after a successful apply', () => {
    document.body.innerHTML = `
      <div data-cap-context="log">
        <table>
          <tbody>
            <tr data-product-idx="0" data-product-id="log-1">
              <td><input data-field="kittingHours" value="1.5"></td>
              <td><input data-field="bookingInOutHours" value="0.25"></td>
              <td><input data-field="productMovementHours" value="0.5"></td>
              <td><input data-field="hoursPerWeek" value="2.25" readonly></td>
              <td><input data-field="supportEffectiveDate" value="2026-02-01"></td>
              <td><input data-field="supportChangeReason" value="Adjusted support"></td>
              <td><button data-cap-action="cap-products-apply-hours">Apply</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    const button = document.querySelector('[data-cap-action="cap-products-apply-hours"]')

    window.capacityEvents._onClick({ target: button })

    expect(global.logDataUpdateProduct).toHaveBeenCalledWith(0, 'hoursPerWeek', '2.25', {
      effectiveDate: '2026-02-01',
      changeReason: 'Adjusted support',
      kittingHours: 1.5,
      bookingInOutHours: 0.25,
      productMovementHours: 0.5
    })
    expect(global.meProductsClearDraft).toHaveBeenCalledWith('LOG', 'log-1', 0)
    expect(global.logRefreshCurrentTab).toHaveBeenCalled()
    expect(global.logDebouncedSave).toHaveBeenCalled()
  })
})

describe('capacity events product support sorting', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.meProductsSortByColumn = jest.fn()
  })

  test('cap-products-sort-column routes header sort clicks to shared sorter', () => {
    document.body.innerHTML = `
      <div data-cap-context="pm">
        <table>
          <thead>
            <tr>
              <th data-cap-action="cap-products-sort-column" data-sort-key="name" data-dept="PM">Product Name</th>
            </tr>
          </thead>
        </table>
      </div>
    `

    const th = document.querySelector('[data-cap-action="cap-products-sort-column"]')
    window.capacityEvents._onClick({ target: th })

    expect(global.meProductsSortByColumn).toHaveBeenCalledWith('name', 'PM')
  })
})

describe('capacity events product support history routing', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.confirm = jest.fn(() => true)
    global.pmDataDeleteProductSupportHistoryEntry = jest.fn()
    global.logDataDeleteProductSupportHistoryEntry = jest.fn()
    global.unit6DataDeleteProductSupportHistoryEntry = jest.fn()
    global.meDataDeleteProductSupportHistoryEntry = jest.fn()
    global.pmRefreshCurrentTab = jest.fn()
    global.logRefreshCurrentTab = jest.fn()
    global.unit6RefreshCurrentTab = jest.fn()
    global.meRefreshCurrentTab = jest.fn()
    global.pmDebouncedSave = jest.fn()
    global.logDebouncedSave = jest.fn()
    global.unit6DebouncedSave = jest.fn()
    global.meDebouncedSave = jest.fn()
    global.meProductsSaveHistoryEdit = jest.fn()
  })

  test('cap-products-save-history-edit passes PM department through to shared save handler', () => {
    document.body.innerHTML = `
      <div data-cap-context="pm">
        <table>
          <tbody>
            <tr data-history-edit-row="1">
              <td><button data-cap-action="cap-products-save-history-edit" data-history-id="pm-h-1" data-dept="PM">Save</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    const button = document.querySelector('[data-cap-action="cap-products-save-history-edit"]')
    const row = document.querySelector('tr[data-history-edit-row]')

    window.capacityEvents._onClick({ target: button })

    expect(global.meProductsSaveHistoryEdit).toHaveBeenCalledWith('pm-h-1', 'PM', row)
  })

  test('cap-products-delete-history routes PM deletes to PM data/save flows', () => {
    document.body.innerHTML = `
      <div data-cap-context="pm">
        <button data-cap-action="cap-products-delete-history" data-history-id="pm-h-2" data-dept="PM">Delete</button>
      </div>
    `

    const button = document.querySelector('[data-cap-action="cap-products-delete-history"]')
    window.capacityEvents._onClick({ target: button })

    expect(global.pmDataDeleteProductSupportHistoryEntry).toHaveBeenCalledWith('pm-h-2')
    expect(global.pmRefreshCurrentTab).toHaveBeenCalled()
    expect(global.pmDebouncedSave).toHaveBeenCalled()
    expect(global.meDataDeleteProductSupportHistoryEntry).not.toHaveBeenCalled()
  })

  test('cap-products-delete-history routes Logistics deletes to Logistics data/save flows', () => {
    document.body.innerHTML = `
      <div data-cap-context="log">
        <button data-cap-action="cap-products-delete-history" data-history-id="log-h-2" data-dept="LOG">Delete</button>
      </div>
    `

    const button = document.querySelector('[data-cap-action="cap-products-delete-history"]')
    window.capacityEvents._onClick({ target: button })

    expect(global.logDataDeleteProductSupportHistoryEntry).toHaveBeenCalledWith('log-h-2')
    expect(global.logRefreshCurrentTab).toHaveBeenCalled()
    expect(global.logDebouncedSave).toHaveBeenCalled()
    expect(global.meDataDeleteProductSupportHistoryEntry).not.toHaveBeenCalled()
  })

  test('cap-products-delete-history routes Unit 6 deletes to Unit 6 data/save flows', () => {
    document.body.innerHTML = `
      <div data-cap-context="unit6">
        <button data-cap-action="cap-products-delete-history" data-history-id="u6-h-2" data-dept="UNIT6">Delete</button>
      </div>
    `

    const button = document.querySelector('[data-cap-action="cap-products-delete-history"]')
    window.capacityEvents._onClick({ target: button })

    expect(global.unit6DataDeleteProductSupportHistoryEntry).toHaveBeenCalledWith('u6-h-2')
    expect(global.unit6RefreshCurrentTab).toHaveBeenCalled()
    expect(global.unit6DebouncedSave).toHaveBeenCalled()
    expect(global.meDataDeleteProductSupportHistoryEntry).not.toHaveBeenCalled()
  })
})

describe('capacity events month routing', () => {
  beforeAll(() => {
    const script = fs.readFileSync(path.resolve(__dirname, '../portals/capacity/js/capacity-events.js'), 'utf8')
    eval(script)
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    global.meOnPrevMonth = jest.fn()
    global.pmOnPrevMonth = jest.fn()
    global.logOnMonthChange = jest.fn()
    global.unit6OnNextMonth = jest.fn()
  })

  test('routes prev-month clicks to the active PM stream', () => {
    document.body.innerHTML = '<div data-cap-context="pm"><button data-cap-action="cap-me-prev-month">Prev</button></div>'
    const button = document.querySelector('[data-cap-action="cap-me-prev-month"]')

    window.capacityEvents._onClick({ target: button })

    expect(global.pmOnPrevMonth).toHaveBeenCalled()
    expect(global.meOnPrevMonth).not.toHaveBeenCalled()
  })

  test('routes month input changes to the active Logistics stream', () => {
    document.body.innerHTML = '<div data-cap-context="log"><input data-cap-action="cap-me-month-change" value="2026-04"></div>'
    const input = document.querySelector('[data-cap-action="cap-me-month-change"]')

    window.capacityEvents._onChange({ target: input })

    expect(global.logOnMonthChange).toHaveBeenCalledWith('2026-04')
  })

  test('routes next-month clicks to the active Unit 6 stream', () => {
    document.body.innerHTML = '<div data-cap-context="unit6"><button data-cap-action="cap-me-next-month">Next</button></div>'
    const button = document.querySelector('[data-cap-action="cap-me-next-month"]')

    window.capacityEvents._onClick({ target: button })

    expect(global.unit6OnNextMonth).toHaveBeenCalled()
  })
})
