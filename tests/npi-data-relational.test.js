/**
 * npi-data-relational.test.js — Tests for portals/product-development/npi/js/npi-data-relational.js
 */

import { jest } from '@jest/globals'

// Import shared state and setters
import { appState, db, prog } from '../core/js/state.js'
import { supabase as supa, setCurrentUser } from '../core/js/supa.js'

// Import the module under test
const { 
  npiRelSaveDoc, 
  npiRelSavePFDStep, 
  npiRelHydratePfdRows, 
  npiRelLoad,
  npiRelResolveProjectId 
} = await import('../portals/product-development/npi/js/npi-data-relational.js')

// Mock helpers
global.showToast = jest.fn()

describe('NPI relational project UUID resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default state
    appState.progId = 'p_local_1'
    db.projects = [
      {
        id: 'p_local_1',
        prog_id: 'p_local_1',
        dbId: '11111111-1111-4111-8111-111111111111',
        pfd: []
      }
    ]
    // Note: prog is a getter function in state.js usually, but here we can mock it 
    // if it was exported as a let or if we control the state it returns.
    // In our state.js, prog() returns db.projects.find(...)
    
    setCurrentUser({ id: 'user_123', email: 'test@example.com' })

    // Setup supa mocks - since supa is an object, we can mock its methods
    supa.from = jest.fn().mockReturnThis()
    supa.select = jest.fn().mockReturnThis()
    supa.upsert = jest.fn().mockResolvedValue({ error: null })
    supa.insert = jest.fn().mockReturnThis()
    supa.update = jest.fn().mockReturnThis()
    supa.delete = jest.fn().mockReturnThis()
    supa.eq = jest.fn().mockReturnThis()
    supa.neq = jest.fn().mockReturnThis()
    supa.in = jest.fn().mockReturnThis()
    supa.order = jest.fn().mockReturnThis()
    supa.limit = jest.fn().mockReturnThis()
    supa.single = jest.fn().mockReturnThis()
    
    // Default implementation for .then (to handle await supa...)
    supa.then = jest.fn((resolve) => resolve({ data: [], error: null }))
  })

  test('uses project prog_id (not dbId) for document saves', async () => {
    const item = { id: 'doc_1', docNumber: 'DWG-001' }

    await npiRelSaveDoc(item)

    expect(supa.from).toHaveBeenCalledWith('npi_documents')
    expect(supa.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p_local_1'
      }),
      { onConflict: 'id' }
    )
  })

  test('resolves missing prog_id from projects table when not in cache', async () => {
    // Remove from cache
    db.projects = []
    
    // Mock database response for project lookup
    supa.then.mockImplementationOnce((resolve) => 
      resolve({ data: [{ id: 'uuid_123', prog_id: 'p_resolved_prog_id' }], error: null })
    )

    await npiRelSaveDoc({ id: 'doc_1' })

    expect(supa.from).toHaveBeenCalledWith('projects')
    expect(supa.eq).toHaveBeenCalledWith('prog_id', 'p_local_1')
    
    expect(supa.from).toHaveBeenCalledWith('npi_documents')
    expect(supa.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p_resolved_prog_id'
      }),
      { onConflict: 'id' }
    )
  })

  test('persists a leading header with a non-null surrogate step number', async () => {
    const step = { id: 'step-1', stepNum: 10, type: 'step', op: 'First Op' }
    const header = { id: 'header-1', stepNum: null, beforeStepId: 'step-1', type: 'header' }
    
    // Setup db for prog() to find
    db.projects = [
      {
        id: 'p_local_1',
        prog_id: 'p_local_1',
        pfd: [step, header]
      }
    ]

    await npiRelSavePFDStep(header)

    expect(supa.from).toHaveBeenCalledWith('npi_pfd_steps')
    expect(supa.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'header-1',
        step_num: 9,
        step_type: 'header'
      }),
      { onConflict: 'id' }
    )
  })

  test('persists decision flow fields for executable PFD rows', async () => {
    const step = {
      id: 'step-2',
      stepNum: 20,
      type: 'step',
      pfd_type: 'Decision',
      nextStepId: null,
      nextStepId_yes: 30,
      nextStepId_no: 10
    }
    db.projects = [
      {
        id: 'p_local_1',
        prog_id: 'p_local_1',
        pfd: [step]
      }
    ]

    await npiRelSavePFDStep(step)

    expect(supa.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'step-2',
        pfd_type: 'Decision',
        next_step_num: null,
        next_step_num_yes: 30,
        next_step_num_no: 10
      }),
      { onConflict: 'id' }
    )
  })

  test('hydrates persisted leading and attached headers back into UI shape', () => {
    const rows = [
      { id: 'lead-header', step_num: 9, step_type: 'header' },
      { id: 'step-1', step_num: 10, step_type: 'step' },
      { id: 'mid-header', step_num: 10, step_type: 'header' },
      { id: 'step-2', step_num: 20, step_type: 'step' }
    ]

    const hydrated = npiRelHydratePfdRows(rows)
    const leadHeader = hydrated.find(row => row.id === 'lead-header')
    const midHeader = hydrated.find(row => row.id === 'mid-header')

    expect(leadHeader.stepNum).toBeNull()
    expect(leadHeader.beforeStepId).toBe('step-1')
    expect(midHeader.afterStepId).toBe('step-1')
  })

  test('hydrates flowchart fields back into UI shape', () => {
    const rows = [
      {
        id: 'step-20',
        step_num: 20,
        step_type: 'step',
        pfd_type: 'Decision',
        next_step_num: null,
        next_step_num_yes: 30,
        next_step_num_no: 10
      }
    ]

    const hydrated = npiRelHydratePfdRows(rows)

    expect(hydrated[0]).toEqual(expect.objectContaining({
      pfd_type: 'Decision',
      nextStepId: null,
      nextStepId_yes: 30,
      nextStepId_no: 10
    }))
  })

  test('npiRelLoad sends the same project_id to every npi table', async () => {
    db.projects = [
      {
        id: 'p_local_1',
        prog_id: 'p_local_1'
      }
    ]

    await npiRelLoad('p_local_1')
    
    // Verify it called ResolveProjectId
    expect(supa.from).toHaveBeenCalledWith('npi_ctq')
    expect(supa.from).toHaveBeenCalledWith('npi_pfd_steps')
    expect(supa.from).toHaveBeenCalledWith('npi_actions')
    
    // Verify the project_id parameter in the eq() calls
    const projectEqCalls = supa.eq.mock.calls.filter(args => args[0] === 'project_id')
    expect(projectEqCalls.length).toBeGreaterThan(10)
    projectEqCalls.forEach(args => {
      expect(args[1]).toBe('p_local_1')
    })
  })
})
