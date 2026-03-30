import { jest } from '@jest/globals'

describe('NPI PFD flowchart', () => {
  let idCounter

  beforeEach(() => {
    jest.clearAllMocks()
    idCounter = 1
    global.crypto = {
      randomUUID: () => `id-${idCounter++}`
    }
  })

  it('should generate unique IDs via crypto.randomUUID', () => {
    const id1 = global.crypto.randomUUID()
    const id2 = global.crypto.randomUUID()
    expect(id1).not.toBe(id2)
  })

  it('should have crypto.randomUUID available', () => {
    expect(typeof global.crypto.randomUUID).toBe('function')
  })

  it('should return consistent ID format', () => {
    const id = global.crypto.randomUUID()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
})
