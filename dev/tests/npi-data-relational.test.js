import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toEvalFriendlyModuleSource } from './helpers/esm-eval.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('NPI relational project UUID resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    global.db = {
      projects: [
        {
          id: 'p_local_1',
          dbId: '11111111-1111-4111-8111-111111111111',
          docs: []
        }
      ]
    }
    global.progId = 'p_local_1'
    global.currentUser = { id: '22222222-2222-4222-8222-222222222222', email: 'test@test.com' }
    global.prog = () => global.db.projects[0]

    const upsert = jest.fn().mockResolvedValue({ error: null })
    const select = jest.fn(() => ({ eq: jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ data: [], error: null }) })) }))

    global.supa = {
      from: jest.fn((table) => {
        if (table === 'projects') {
          return { select }
        }
        return { upsert }
      })
    }

    const script = readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data-relational.js'),
      'utf8'
    )
    eval(toEvalFriendlyModuleSource(script))
  })

  test('uses project prog_id (not dbId) for document saves', async () => {
    const item = { id: '33333333-3333-4333-8333-333333333333', docNumber: 'DWG-001' }

    await npiRelSaveDoc(item)

    const docCall = global.supa.from.mock.calls.find(([table]) => table === 'npi_documents')
    expect(docCall).toBeTruthy()
    const upsert = global.supa.from('npi_documents').upsert
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p_local_1'
      }),
      { onConflict: 'id' }
    )
  })

  test('resolves missing prog_id from projects table when not in cache', async () => {
    global.db.projects[0].id = null

    const upsert = jest.fn().mockResolvedValue({ error: null })
    const limit = jest.fn().mockResolvedValue({
      data: [{ id: '44444444-4444-4444-8444-444444444444', prog_id: 'p_resolved_prog_id' }],
      error: null
    })
    const eq = jest.fn(() => ({ limit }))
    const select = jest.fn(() => ({ eq }))

    global.supa = {
      from: jest.fn((table) => {
        if (table === 'projects') {
          return { select }
        }
        return { upsert }
      })
    }

    const script = readFileSync(
      path.resolve(__dirname, '../portals/product-development/npi/js/npi-data-relational.js'),
      'utf8'
    )
    eval(toEvalFriendlyModuleSource(script))

    await npiRelSaveDoc({ id: '33333333-3333-4333-8333-333333333333' })

    expect(global.supa.from('projects').select).toHaveBeenCalledWith('id, prog_id')
    const docCall = global.supa.from.mock.calls.find(([table]) => table === 'npi_documents')
    expect(docCall).toBeTruthy()
    const upsert2 = global.supa.from('npi_documents').upsert
    expect(upsert2).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p_resolved_prog_id'
      }),
      { onConflict: 'id' }
    )
  })

  test('persists a leading header with a non-null surrogate step number', async () => {
    const step = { id: 'step-1', stepNum: 10, type: 'step', op: 'First Op', detail: '', ctqIds: [], bomRefs: [], docRefs: [] }
    const header = { id: 'header-1', stepNum: null, beforeStepId: 'step-1', type: 'header', op: '', detail: '', ctqIds: [], bomRefs: [], docRefs: [] }
    global.db.projects[0].pfd = [step, header]

    await npiRelSavePFDStep(header)

    const upsert = global.supa.from('npi_pfd_steps').upsert
    expect(upsert).toHaveBeenCalledWith(
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
      op: 'Inspect',
      detail: '',
      ctqIds: [],
      bomRefs: [],
      docRefs: [],
      pfd_type: 'Decision',
      nextStepId: null,
      nextStepId_yes: 30,
      nextStepId_no: 10
    }
    global.db.projects[0].pfd = [step]

    await npiRelSavePFDStep(step)

    const upsert = global.supa.from('npi_pfd_steps').upsert
    expect(upsert).toHaveBeenCalledWith(
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
      { id: 'lead-header', step_num: 9, step_type: 'header', op: '', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'step-1', step_num: 10, step_type: 'step', op: 'Op 10', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'mid-header', step_num: 10, step_type: 'header', op: 'Section 2', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] },
      { id: 'step-2', step_num: 20, step_type: 'step', op: 'Op 20', detail: '', ctq_ids: [], bom_refs: [], doc_refs: [] }
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
        op: 'Inspect',
        detail: '',
        ctq_ids: [],
        bom_refs: [],
        doc_refs: [],
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

  // Helper: build a supa mock that captures project_id values per table.
  // Returns { supa, capturedIds }.
  // Each table mock handles both .eq().order() and plain .eq() chains.
  function makeCapturingSupa () {
    const capturedIds = {}
    const makeEqResult = (table) => {
      const result = Promise.resolve({ data: [], error: null })
      result.order = jest.fn().mockResolvedValue({ data: [], error: null })
      return result
    }
    const supa = {
      from: jest.fn((table) => ({
        select: jest.fn(() => ({
          eq: jest.fn((col, val) => {
            if (col === 'project_id') capturedIds[table] = val
            // Handle the projects table query in npiRelResolveProjectId
            if (table === 'projects' && col === 'prog_id') {
              const result = Promise.resolve({ data: [{ id: '11111111-1111-4111-8111-111111111111', prog_id: val }], error: null })
              result.limit = jest.fn().mockResolvedValue({ data: [{ id: '11111111-1111-4111-8111-111111111111', prog_id: val }], error: null })
              return result
            }
            return makeEqResult(table)
          }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
    return { supa, capturedIds }
  }

  test('npiRelLoad passes text prog_id (not a UUID) to npi_documents query', async () => {
    const { supa, capturedIds } = makeCapturingSupa()
    global.supa = supa

    await npiRelLoad('p_local_1')

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(capturedIds['npi_documents']).toBe('p_local_1')
    expect(uuidPattern.test(capturedIds['npi_documents'])).toBe(false)
  })

  test('npiRelLoad sends the same project_id to every npi table', async () => {
    const { supa, capturedIds } = makeCapturingSupa()
    global.supa = supa

    await npiRelLoad('p_local_1')

    const npiTables = [
      'npi_ctq', 'npi_pfd_steps', 'npi_pfmea_modes', 'npi_pfmea_effects',
      'npi_pfmea_causes', 'npi_pfmea_history', 'npi_control_plan',
      'npi_bom_items', 'npi_gates', 'npi_gate_sigs',
      'npi_actions', 'npi_risks', 'npi_gantt_rows', 'npi_documents',
      'npi_bom_tree', 'npi_bom_groups'
    ]
    npiTables.forEach(table => {
      expect(capturedIds[table]).toBe('p_local_1')
    })
  })
})

