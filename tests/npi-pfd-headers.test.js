const fs = require('fs')
const path = require('path')

describe('NPI PFD header behavior', () => {
  let activeProject
  let idCounter

  beforeEach(() => {
    idCounter = 1

    global.crypto = {
      randomUUID: () => `id-${idCounter++}`
    }

    activeProject = {
      pfd: [
        { id: 's10', stepNum: 10, type: 'step', op: 'Op 10', detail: '', ctqIds: [], bomRefs: [] },
        { id: 's20', stepNum: 20, type: 'step', op: 'Op 20', detail: '', ctqIds: [], bomRefs: [] }
      ],
      pfmea: [],
      ctq: [],
      cp: [],
      bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] },
      actions: [],
      risks: []
    }

    global.npi = {
      data: {},
      notify: jest.fn()
    }

    global.prog = () => activeProject
    global.npiRelSavePFDStep = jest.fn()
    global.npiRelSavePFMEAMode = jest.fn()
    global.npiRelDeletePFDStep = jest.fn()
    global.collapsedGroups = new Set()
    global.esc = value => String(value ?? '')
    global.emptyState = jest.fn(() => '<div>empty</div>')
    global.BOM_TYPES = {}
    global.insertOriginIdx = null
    global.showModal = jest.fn()
    global.closeModal = jest.fn()
    global.showToast = jest.fn()
    global.showGuide = jest.fn()

    const dataScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data.js'),
      'utf8'
    )

    const pfdScript = fs.readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-pfd.js'),
      'utf8'
    )

    eval(dataScript)
    eval(pfdScript)
  })

  test('addSectionHeaderAfter creates a non-executable header attached to an operation', async () => {
    const result = npi.data.pfd.addSectionHeaderAfter('s10')
    await Promise.resolve()

    expect(result.ok).toBe(true)
    expect(result.step.type).toBe('header')
    expect(result.step.stepNum).toBeNull()
    expect(result.step.afterStepId).toBe('s10')
    expect(npiRelSavePFDStep).toHaveBeenCalled()
  })

  test('sortedPfd keeps a section header directly after its anchor operation', () => {
    const header = npi.data.pfd.addSectionHeaderAfter('s10').step
    expect(header.type).toBe('header')

    const sorted = npi.data.sortedPfd(activeProject.pfd)
    expect(sorted.map(step => step.id)).toEqual(['s10', header.id, 's20'])
  })

  test('ensureLeadingHeader inserts a default header before the first executable step', async () => {
    const header = npi.data.pfd.ensureLeadingHeader()
    await Promise.resolve()

    expect(header.beforeStepId).toBe('s10')
    expect(header.isDefault).toBe(true)

    const sorted = npi.data.sortedPfd(activeProject.pfd)
    expect(sorted[0].id).toBe(header.id)
    expect(sorted[1].id).toBe('s10')
  })

  test('nextMainStepNum only considers executable steps', () => {
    npi.data.pfd.addSectionHeaderAfter('s10')

    const next = npi.data.nextMainStepNum(activeProject.pfd)
    expect(next).toBe(30)
  })

  test('render hides steps inside a collapsed section', async () => {
    const header = npi.data.pfd.ensureLeadingHeader()
    activeProject.pfd.push({ id: 's30', stepNum: 30, type: 'step', op: 'Op 30', detail: '', ctqIds: [], bomRefs: [] })
    collapsedGroups.add(header.id)
    await Promise.resolve()

    const html = npi.pfd.render()

    expect(html).toContain('Hidden: 3 steps')
    expect(html).not.toContain('id="pfd-row-s10"')
    expect(html).not.toContain('id="pfd-row-s20"')
    expect(html).not.toContain('id="pfd-row-s30"')
  })

  test('addMainStep creates the default leading section for a new PFD', async () => {
    activeProject.pfd = []

    const step = npi.data.pfd.addMainStep()
    await Promise.resolve()

    const sorted = npi.data.sortedPfd(activeProject.pfd)
    expect(step.stepNum).toBe(10)
    expect(sorted[0].type).toBe('header')
    expect(sorted[0].beforeStepId).toBe(step.id)
    expect(sorted[1].id).toBe(step.id)
  })
})
