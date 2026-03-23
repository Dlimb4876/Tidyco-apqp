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
    window.meTasksFilters = { search: '' }
    window.pmTasksFilters = { search: '' }
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
          <input type="text" data-cap-action="cap-task-search" value="${window.meTasksFilters.search}">
        </div>
      `
    })

    const input = document.querySelector('[data-cap-action="cap-task-search"]')
    input.value = 'abc'
    input.focus()
    input.setSelectionRange(2, 2)

    window.capacityEvents._onInput({ target: input })

    expect(window.meTasksFilters.search).toBe('abc')
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

    const input = document.querySelector('[data-cap-action="cap-task-search"]')
    input.value = 'gate'

    window.capacityEvents._onInput({ target: input })

    expect(window.pmTasksFilters.search).toBe('gate')
    expect(global.pmSetTab).toHaveBeenCalledWith('tasks')
    expect(global.meSetTab).not.toHaveBeenCalled()
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
