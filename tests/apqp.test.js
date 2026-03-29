import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set up DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
document.documentElement.innerHTML = html.toString()

// Minimal globals required by apqp.js
global.npi = { apqp: {}, pfmea: {}, nav: {} }
global.save = jest.fn()
global.render = jest.fn()
global.alert = jest.fn()
global.showToast = jest.fn()
global.apqpTab = 'ctq'
global.collapsedGroups = new Set()
global.insertOriginIdx = null
global.ctqPickTarget = null
global.ctqPickSelected = []
global.bomPickTarget = null
global.bomPickSelected = []
global.bomPickFilter = 'all'
global.BOM_TYPES = {
  parts: { label: 'Parts', icon: 'P', pc: 'tag-parts' },
  tools: { label: 'Tools', icon: 'T', pc: 'tag-tools' },
  equip: { label: 'Equip', icon: 'E', pc: 'tag-equip' },
  mat: { label: 'Mat', icon: 'M', pc: 'tag-mat' },
  cons: { label: 'Cons', icon: 'C', pc: 'tag-cons' }
}

global.esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

let activeProject
global.prog = () => activeProject

// Mock ESM dependencies before loading the module
global.appState = {}
global.npiData = {}
global.npiCtq = {}
global.npiPfd = {}
global.npiCp = {}
global.npiRelDeleteCP = jest.fn()
global.npiRelSaveCP = jest.fn()
global.APQP_TABS = ['ctq', 'pfd', 'pfmea', 'cp']
global.RPN_HIGH = 100

// Load the module via dynamic import
const scriptPath = path.resolve(__dirname, '../portals/product-development/npi/js/apqp.js')
await import('file://' + scriptPath)

describe('APQP sync behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    activeProject = {
      ctq: [{ id: 'ctq1', spec: '50+-0.05', oos_action: 'Review' }],
      pfd: [{ id: 's1', stepNum: 10, op: 'Press', ctqIds: ['ctq1'], bomRefs: [] }],
      pfmea: [
        {
          id: 'f1',
          pfdId: 's1',
          mode: 'Leak',
          effects: [
            {
              id: 'e1',
              effect: 'Pressure loss',
              causes: [
                { id: 'c1', cause: 'Seal wear', detect: 'Visual check', prevent: '' }
              ]
            }
          ]
        }
      ],
      cp: [],
      bom: { parts: [], tools: [], equip: [], mat: [], cons: [] }
    }
  })

  test('syncFromPFMEA adds missing cause rows into Control Plan', () => {
    npi.apqp.syncFromPFMEA()

    expect(activeProject.cp).toHaveLength(1)
    expect(activeProject.cp[0].pfmeaId).toBe('f1')
    expect(activeProject.cp[0].pfmeaEffectId).toBe('e1')
    expect(activeProject.cp[0].pfmeaCauseId).toBe('c1')
    expect(activeProject.cp[0].method).toBe('Visual check')
    expect(activeProject.cp[0].spec).toBe('50+-0.05')
    expect(activeProject.cp[0].reaction).toBe('Review')
    expect(activeProject.cp[0].ctqIds).toEqual(['ctq1'])
    expect(save).toHaveBeenCalled()
    expect(render).toHaveBeenCalled()
  })

  test('syncFromPFMEA does not duplicate existing cause links', () => {
    activeProject.cp.push({ id: 'cp1', pfmeaCauseId: 'c1' })

    npi.apqp.syncFromPFMEA()

    expect(showToast).toHaveBeenCalledWith('All PFMEA causes already in control plan.', 'info')
    expect(activeProject.cp).toHaveLength(1)
    expect(save).not.toHaveBeenCalled()
  })

  test('addCP creates a default manual row', () => {
    npi.apqp.addCP()

    expect(activeProject.cp).toHaveLength(1)
    expect(activeProject.cp[0].type).toBe('Process')
    expect(activeProject.cp[0].pfmeaId).toBe('')
    expect(save).toHaveBeenCalled()
    expect(render).toHaveBeenCalled()
  })
})
