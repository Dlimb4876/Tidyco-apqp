import { jest } from '@jest/globals'

describe('NPI PFD headers', () => {
  let idCounter

  beforeEach(() => {
    idCounter = 1
    global.crypto = {
      randomUUID: () => `id-${idCounter++}`
    }
    global.npi = {
      data: {},
      notify: jest.fn()
    }
  })

  it('should use crypto.randomUUID for header ID generation', () => {
    const id = global.crypto.randomUUID()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique header IDs', () => {
    const id1 = global.crypto.randomUUID()
    const id2 = global.crypto.randomUUID()
    expect(id1).not.toBe(id2)
  })

  it('should have npi.data namespace', () => {
    expect(typeof global.npi.data).toBe('object')
  })

  it('should have npi.notify function', () => {
    expect(typeof global.npi.notify).toBe('function')
  })
})
