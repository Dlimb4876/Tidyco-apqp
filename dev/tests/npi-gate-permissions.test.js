import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toEvalFriendlyModuleSource } from './helpers/esm-eval.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('NPI gate signoff permissions', () => {
  let activeProject

  beforeEach(() => {
    activeProject = {
      gates: [
        {
          checks: [],
          sigs: [
            { role: 'ME Manager', name: 'Alex', date: '', signed: false },
            { role: 'Operations Director', name: 'Pat', date: '', signed: true }
          ]
        }
      ]
    }

    global.npi = {
      data: {},
      notify: jest.fn()
    }

    global.prog = () => activeProject
    global.npiRelSaveGate = jest.fn()
    global.npiRelSaveGateSig = jest.fn()
    global.npiRelSaveGanttRow = jest.fn()
    global.npiRelDeleteGanttRow = jest.fn()
    global.save = jest.fn()
    global.hasPermission = jest.fn(() => false)
    global.showToast = jest.fn()
    global.currentUserRole = 'editor'
    global.GANTT_WEEKS = 72
    global.crypto = {
      randomUUID: () => 'id-1'
    }

    const src = readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data.js'),
      'utf8'
    )

    eval(toEvalFriendlyModuleSource(src)) // eslint-disable-line no-eval
  })

  it('maps signoff roles to dedicated permission keys', () => {
    expect(npi.data.gate.rolePermissionKey('ME Manager')).toBe('feature_npi_signoff_me_manager')
    expect(npi.data.gate.rolePermissionKey('Operations Director')).toBe('feature_npi_signoff_operations_director')
    expect(npi.data.gate.rolePermissionKey('Sales Director')).toBe('feature_npi_signoff_sales_director')
  })

  it('blocks signoff when the user lacks role permission', () => {
    const ok = npi.data.gate.signOff(0, 0)

    expect(ok).toBe(false)
    expect(activeProject.gates[0].sigs[0].signed).toBe(false)
    expect(npiRelSaveGateSig).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('allows signoff when the user has role permission', async () => {
    hasPermission.mockImplementation((key) => key === 'feature_npi_signoff_me_manager')

    const ok = npi.data.gate.signOff(0, 0)
    await Promise.resolve()

    expect(ok).toBe(true)
    expect(activeProject.gates[0].sigs[0].signed).toBe(true)
    expect(activeProject.gates[0].sigs[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(npiRelSaveGateSig).toHaveBeenCalledWith(0, 0)
    expect(npi.notify).toHaveBeenCalledWith('render')
  })

  it('blocks signature edits when not authorised for the signoff role', () => {
    const ok = npi.data.gate.updSig(0, 0, 'name', 'Unauthorised User')

    expect(ok).toBe(false)
    expect(activeProject.gates[0].sigs[0].name).toBe('Alex')
    expect(npiRelSaveGateSig).not.toHaveBeenCalled()
  })

  it('allows undo sign-off only for authorised role holders', async () => {
    const blocked = npi.data.gate.unsign(0, 1)
    expect(blocked).toBe(false)
    expect(activeProject.gates[0].sigs[1].signed).toBe(true)

    hasPermission.mockImplementation((key) => key === 'feature_npi_signoff_operations_director')
    const allowed = npi.data.gate.unsign(0, 1)
    await Promise.resolve()

    expect(allowed).toBe(true)
    expect(activeProject.gates[0].sigs[1].signed).toBe(false)
    expect(npiRelSaveGateSig).toHaveBeenCalledWith(0, 1)
  })
})

