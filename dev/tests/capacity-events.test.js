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
