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
    expect(html).toContain('Blank process links')
    expect(html).toContain('class="mermaid pfd-flowchart-canvas"')
  })

  test('generates Inspection node as circle with Pass/Fail edges', () => {
    activeProject.pfd.push({
      id: 's60', stepNum: 60, type: 'step', op: 'CMM Check', detail: '',
      ctqIds: [], bomRefs: [], docRefs: [],
      pfd_type: 'Inspection', nextStepId: null, nextStepId_yes: 70, nextStepId_no: 40
    })
    activeProject.pfd.push({
      id: 's70', stepNum: 70, type: 'step', op: 'Ship', detail: '',
      ctqIds: [], bomRefs: [], docRefs: [],
      pfd_type: 'Process', nextStepId: null, nextStepId_yes: null, nextStepId_no: null
    })

    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toContain('S60(("60: CMM Check"))')
    expect(syntax).toContain('S60 -- Pass --> S70')
    expect(syntax).toContain('S60 -- Fail --> S40')
    expect(syntax).toContain('classDef inspectionNode')
  })

  test('generates Rework node as parallelogram with single next link', () => {
    activeProject.pfd.push({
      id: 's60', stepNum: 60, type: 'step', op: 'Grind Flash', detail: '',
      ctqIds: [], bomRefs: [], docRefs: [],
      pfd_type: 'Rework', nextStepId: 10, nextStepId_yes: null, nextStepId_no: null
    })

    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toContain('S60[/"60: Grind Flash"/]')
    expect(syntax).toContain('S60 --> S10')
    expect(syntax).toContain('classDef reworkNode')
  })

  test('generates Transport node as stadium shape with single next link', () => {
    activeProject.pfd.push({
      id: 's60', stepNum: 60, type: 'step', op: 'Move to Paint', detail: '',
      ctqIds: [], bomRefs: [], docRefs: [],
      pfd_type: 'Transport', nextStepId: 70, nextStepId_yes: null, nextStepId_no: null
    })
    activeProject.pfd.push({
      id: 's70', stepNum: 70, type: 'step', op: 'Paint', detail: '',
      ctqIds: [], bomRefs: [], docRefs: [],
      pfd_type: 'Process', nextStepId: null, nextStepId_yes: null, nextStepId_no: null
    })

    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toContain('S60(["60: Move to Paint"])')
    expect(syntax).toContain('S60 --> S70')
    expect(syntax).toContain('classDef transportNode')
  })

  test('switching to Inspection clears nextStepId and sets isTwoPath', () => {
    npi.pfd.upd('s10', 'pfd_type', 'Inspection')

    expect(activeProject.pfd[0].pfd_type).toBe('Inspection')
    expect(activeProject.pfd[0].nextStepId).toBeNull()
    expect(npi.notify).toHaveBeenCalledWith('render')
  })

  test('switching from Inspection to Process clears yes/no links', () => {
    activeProject.pfd[1].pfd_type = 'Inspection'
    activeProject.pfd[1].nextStepId_yes = 30
    activeProject.pfd[1].nextStepId_no = 40

    npi.pfd.upd('s20', 'pfd_type', 'Process')

    expect(activeProject.pfd[1].pfd_type).toBe('Process')
    expect(activeProject.pfd[1].nextStepId_yes).toBeNull()
    expect(activeProject.pfd[1].nextStepId_no).toBeNull()
  })

  test('adds risk indicator ⚑ to node label when PFMEA RPN is high', () => {
    global.RPN_HIGH = 100
    activeProject.pfmea = [{
      pfdId: 's10',
      effects: [{
        sev: 8,
        causes: [{ occ: 7, det: 3 }]
      }]
    }]
    global.npi.data.calcCauseRpn = (sev, occ, det) => sev * occ * det

    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toContain('⚑')
  })

  test('flowchart uses LR direction when flowDirection is LR', () => {
    npi.pfd.flowDirection = 'LR'

    const syntax = npi.pfd.generateMermaidSyntax()

    expect(syntax).toMatch(/^graph LR/)
  })

  test('render() includes layout toggle button in flowchart mode', () => {
    npi.pfd.viewMode = 'flowchart'

    const html = npi.pfd.render()

    expect(html).toContain('pfd-toggle-layout')
  })

  test('render() includes legend in flowchart mode', () => {
    npi.pfd.viewMode = 'flowchart'

    const html = npi.pfd.render()

    expect(html).toContain('pfd-flowchart-legend')
    expect(html).toContain('Inspection')
    expect(html).toContain('Rework')
    expect(html).toContain('Transport')
  })
})
