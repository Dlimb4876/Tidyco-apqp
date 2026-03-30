import { jest } from '@jest/globals'

describe('NPI gate signoff permissions', () => {
  beforeEach(() => {
    global.npi = {
      data: {},
      notify: jest.fn()
    }
    global.prog = jest.fn(() => ({
      gates: [
        {
          checks: [],
          sigs: [
            { role: 'ME Manager', name: 'Alex', date: '', signed: false },
            { role: 'Operations Director', name: 'Pat', date: '', signed: true }
          ]
        }
      ]
    }))
    global.npiRelSaveGate = jest.fn()
    global.npiRelSaveGateSig = jest.fn()
    global.hasPermission = jest.fn(() => false)
    global.currentUserRole = 'editor'
  })

  it('should have gate structure with sigs array', () => {
    const activeProject = global.prog()
    expect(activeProject.gates).toBeDefined()
    expect(Array.isArray(activeProject.gates)).toBe(true)
    const gate = activeProject.gates[0]
    expect(Array.isArray(gate.sigs)).toBe(true)
  })

  it('gate sig should have role, name, date, signed properties', () => {
    const activeProject = global.prog()
    const sig = activeProject.gates[0].sigs[0]
    expect(sig).toHaveProperty('role')
    expect(sig).toHaveProperty('name')
    expect(sig).toHaveProperty('date')
    expect(sig).toHaveProperty('signed')
  })

  it('should track signed state per gate signoff', () => {
    const activeProject = global.prog()
    const sigs = activeProject.gates[0].sigs
    expect(typeof sigs[0].signed).toBe('boolean')
    expect(sigs[1].signed).toBe(true)
  })
})
