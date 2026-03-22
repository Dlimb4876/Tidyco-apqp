const fs = require('fs')
const path = require('path')

describe('NPI PFD flowchart behavior', () => {
  let activeProject
  let idCounter

  beforeEach(() => {
    jest.clearAllMocks()
    idCounter = 1

    global.crypto = {
      randomUUID: () => `id-${idCounter++}`
    }

    activeProject = {
      pfd: [
        { id: 's10', stepNum: 10, type: 'step', op: 'Cut Material', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: 'Process', nextStepId: null, nextStepId_yes: null, nextStepId_no: null },
        { id: 's20', stepNum: 20, type: 'step', op: 'Inspect?', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: 'Decision', nextStepId: null, nextStepId_yes: 30, nextStepId_no: 40 },
        { id: 's30', stepNum: 30, type: 'step', op: 'Weld Part', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: 'Process', nextStepId: 50, nextStepId_yes: null, nextStepId_no: null },
        { id: 's40', stepNum: 40, type: 'step', op: 'Rework Material', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: 'Process', nextStepId: 10, nextStepId_yes: null, nextStepId_no: null },
        { id: 's50', stepNum: 50, type: 'step', op: 'Final Assembly', detail: '', ctqIds: [], bomRefs: [], docRefs: [], pfd_type: 'Process', nextStepId: null, nextStepId_yes: null, nextStepId_no: null }
      ],
      pfmea: [],
      ctq: [],
      docs: [],
      bom: { parts: [], tools: [], equip: [], mat: [], cons: [], kits: [] }
    }

    global.npi = {
      data: {},
      pfd: {},
      notify: jest.fn()
    }

    global.prog = () => activeProject
    global.npiRelSavePFDStep = jest.fn().mockResolvedValue({ error: null })
    global.npiRelDeletePFDStep = jest.fn()
    global.npiRelSavePFMEAMode = jest.fn()
    global.collapsedGroups = new Set()
    global.esc = value => String(value ?? '')
    global.emptyState = jest.fn(() => '<div>empty</div>')
    global.BOM_TYPES = {}
    global.insertOriginIdx = null
    global.showModal = jest.fn()
    global.closeModal = jest.fn()
    global.showToast = jest.fn()
    global.canEdit = jest.fn(() => true)
    global.mermaid = {
      initialize: jest.fn(),
      render: jest.fn().mockResolvedValue({ svg: '<svg>chart</svg>' })
    }

    document.body.innerHTML = '<div class="mermaid"></div>'

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

  test('generates flowchart syntax with sequential and decision links', () => {
    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toContain('S10["10: Cut Material"]')
    expect(syntax).toContain('S20{"20: Inspect?"}')
    expect(syntax).toContain('S10 --> S20')
    expect(syntax).toContain('S20 -- Yes --> S30')
    expect(syntax).toContain('S20 -- No --> S40')
    expect(syntax).toContain('S40 --> S10')
  })

  test('normalizes destination values and rerenders when type changes', async () => {
    activeProject.pfd[2].nextStepId = 50

    npi.pfd.upd('s30', 'pfd_type', 'Decision')
    npi.pfd.upd('s30', 'nextStepId_yes', '40')
    npi.pfd.upd('s30', 'nextStepId_no', '')
    await Promise.resolve()

    expect(activeProject.pfd[2].pfd_type).toBe('Decision')
    expect(activeProject.pfd[2].nextStepId).toBeNull()
    expect(activeProject.pfd[2].nextStepId_yes).toBe(40)
    expect(activeProject.pfd[2].nextStepId_no).toBeNull()
    expect(npi.notify).toHaveBeenCalledWith('render')
  })

  test('renders flowchart view with helper text', () => {
    npi.pfd.viewMode = 'flowchart'

    const html = npi.pfd.render()

    expect(html).toContain('Process Flowchart')
    expect(html).toContain('Blank process links automatically continue to the next numbered step')
    expect(html).toContain('class="mermaid pfd-flowchart-canvas"')
  })
})
